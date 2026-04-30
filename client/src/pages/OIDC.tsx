import { oidc } from "@/BackendRoutes";
import { setAccessTokenCookie } from "@/state/cookie";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OIDC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      navigate("/login");
      return;
    }

    const handleOIDC = async () => {
      try {
        // call backend
        const res = await oidc.getToken(code);

        const accessToken = res?.data?.accessToken;

        if (!accessToken) {
          throw new Error("No access token returned");
        }

        // save token
        setAccessTokenCookie(accessToken);

        // redirect to home (or dashboard)
        navigate("/", { replace: true });
      } catch (err) {
        console.error("OIDC login failed:", err);
        navigate("/login", { replace: true });
      }
    };

    handleOIDC();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <p className="text-red-500">Signing you in...</p>
    </div>
  );
};

export default OIDC;
