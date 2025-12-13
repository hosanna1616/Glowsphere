import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/ui/Layout";
import UserApi from "../api/userApi";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, onboardingComplete } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call real API
      const response = await UserApi.login(formData.email, formData.password);
      
      // Token is automatically saved by UserApi.login
      // Now save user data to AuthContext
      login({
        _id: response.user?._id || response.user?.id,
        name: response.user?.name || response.user?.username || "User",
        email: response.user?.email || formData.email,
        username: response.user?.username || formData.email.split('@')[0],
      });

      // Redirect based on onboarding status
      if (onboardingComplete) {
        navigate("/feed");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.message || "Failed to login. Please check your credentials and try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto py-12">
        <div className="bg-card-bg rounded-2xl p-8 border border-amber-500/30">
          <h1 className="text-3xl font-bold text-center mb-2 text-amber-300">
            Welcome Back
          </h1>
          <p className="text-amber-200 text-center mb-8">
            Sign in to your account
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-6 text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-amber-200 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-amber-200 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-gradient px-4 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-amber-300">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
