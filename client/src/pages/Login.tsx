import React from "react";

const Login = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_REDIRECT_URI;
  const issuer = import.meta.env.VITE_OIDC_ISSUER;

  const handleLogin = () => {
    const url = new URL(`${issuer}`);

    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);

    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-yellow-400">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-6">Welcome</h1>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-3 rounded-lg transition"
        >
          <span>🚀</span>
          Login with Jhingalal
        </button>
      </div>
    </div>
  );
};

export default Login;
