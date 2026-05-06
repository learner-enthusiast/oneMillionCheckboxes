import { ENV } from "@/lib/utils";
import { freeAPI } from "@/BackendRoutes/FreeAPI";
import React, { useState } from "react";
import { oidc } from "@/BackendRoutes";
import { useNavigate } from "react-router-dom";
import { setAccessTokenCookie } from "@/state/cookie";
import { setToLocalStorage } from "../utiltyFunctions/localStorage";
const Login = () => {
  const clientId = ENV.CLIENT_ID;
  const redirectUri = ENV.REDIRECT_URI;
  const issuer = ENV.OIDC_ISSUER;

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER",
  });

  const navigate = useNavigate();
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFreeAPILogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await freeAPI.loginUser({
        username: formData.username,
        password: formData.password,
      });

      const response2 = await oidc.getToken(response.accessToken, true);

      setToLocalStorage("User", response2?.data?.user);
      // save token
      setAccessTokenCookie(response2.data.accessToken);

      // redirect to home (or dashboard)
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeAPISignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await freeAPI.registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: "USER",
      });
      console.log("Signup successful:", response);
      // Handle successful signup (auto-login or redirect to login)
      setIsSignup(false);
    } catch (error) {
      console.error("Signup failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthMantraLogin = () => {
    const url = new URL(`${issuer}`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-yellow-400">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-6">
          {isSignup ? "Signup with FreeAPI" : "Login with FreeAPI"}
        </h1>

        {!isSignup ? (
          // Login Form
          <form onSubmit={handleFreeAPILogin} className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          // Signup Form
          <form onSubmit={handleFreeAPISignup} className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Signup"}
            </button>
          </form>
        )}

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleAuthMantraLogin}
          className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-3 rounded-lg transition mb-4"
        >
          <span></span>
          Login with Auth Mantra
        </button>

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2 text-sm"
        >
          {isSignup
            ? "Already have an account? Login"
            : "Don't have an account? Signup"}
        </button>
      </div>
    </div>
  );
};

export default Login;
