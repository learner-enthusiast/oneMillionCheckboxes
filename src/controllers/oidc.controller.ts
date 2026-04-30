import "dotenv/config";
import jwt, { type JwtHeader, type JwtPayload } from "jsonwebtoken";
import { createPublicKey } from "node:crypto";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { signAccessToken } from "../utils/jwt.ts";

type OpenIdConfiguration = {
  issuer: string;
  token_endpoint: string;
  jwks_uri?: string;
};

type TokenResponse = {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError(500, `Missing required env var: ${name}`);
  }
  return value;
}

async function getOpenIdConfig(issuer: string): Promise<OpenIdConfiguration> {
  const trimmed = issuer.replace(/\/$/, "");
  const response = await fetch(`${trimmed}/.well-known/openid-configuration`);

  if (!response.ok) {
    throw new ApiError(502, "Failed to fetch OpenID configuration");
  }

  return (await response.json()) as OpenIdConfiguration;
}

async function exchangeCodeForToken(
  code: string,
  tokenEndpoint: string,
  issuer: string,
) {
  const clientId = requireEnv("CLIENT_ID");
  const clientSecret = requireEnv("CLIENT_SECRET");
  const redirectUri = requireEnv("REDIRECT_URI");

  const tokenResponse = await fetch(`http://localhost:3000/oidc/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResponse.ok) {
    throw new ApiError(401, "Code exchange failed at token endpoint");
  }

  return (await tokenResponse.json()) as TokenResponse;
}

async function verifyWithIssuerJwks(params: {
  token: string;
  issuer: string;
  audience: string;
  jwksUri?: string;
}) {
  const decoded = jwt.decode(params.token, {
    complete: true,
  }) as { header: JwtHeader; payload: JwtPayload } | null;

  if (!decoded?.header?.kid) {
    throw new ApiError(400, "Token missing kid in header");
  }
  const base = params.issuer.replace(/\/$/, "");
  const jwksUrl =
    params.jwksUri && params.jwksUri.startsWith("http")
      ? params.jwksUri
      : `${base}${params.jwksUri ?? "/.well-known/jwks.json"}`;
  const jwksResponse = await fetch(jwksUrl);

  if (!jwksResponse.ok) {
    throw new ApiError(502, "Failed to fetch issuer JWKS");
  }

  const jwks = (await jwksResponse.json()) as {
    keys: Array<Record<string, unknown>>;
  };

  const matchedJwk = jwks.keys.find((key) => key.kid === decoded.header.kid);
  if (!matchedJwk) {
    throw new ApiError(401, "No matching JWKS key for token kid");
  }

  const keyObject = createPublicKey({
    key: matchedJwk,
    format: "jwk",
  });

  const verified = jwt.verify(params.token, keyObject, {
    algorithms: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
    issuer: params.issuer,
    audience: params.audience,
  }) as JwtPayload;

  return verified;
}

// Accepts auth code from route param: /auth/oidc/:code
export const exchangeCodeAndVerify = asyncHandler(async (req, res) => {
  const code = String(req.params.code ?? "").trim();
  if (!code) {
    throw new ApiError(400, "Missing code in route params");
  }

  const issuer = requireEnv("OIDC_ISSUER");
  const clientId = requireEnv("CLIENT_ID");

  const openIdConfig = await getOpenIdConfig(issuer);

  const tokenData = await exchangeCodeForToken(
    code,
    openIdConfig.token_endpoint,
    issuer,
  );

  const tokenToVerify = tokenData?.data?.access_token ?? tokenData.access_token;

  if (!tokenToVerify) {
    throw new ApiError(
      401,
      "Issuer response does not contain verifiable token",
    );
  }

  const verifiedPayload = await verifyWithIssuerJwks({
    token: tokenToVerify,
    issuer: issuer,
    audience: clientId,
    jwksUri: openIdConfig.jwks_uri,
  });

  //  Extract user info from verified token
  const user = {
    userId: Number(verifiedPayload.sub),
    email: String(verifiedPayload.email ?? ""),
    username: String(
      verifiedPayload.username ??
        verifiedPayload.name ??
        verifiedPayload.email ??
        "user",
    ),
  };

  // Create YOUR access token
  const accessToken = signAccessToken(user);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        accessToken,
      },
      "Login successful",
    ),
  );
});
