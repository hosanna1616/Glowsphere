import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Layout from "../components/ui/Layout";
import SisterhoodQuiz from "../components/verification/SisterhoodQuiz";
import UserApi from "../api/userApi";

const Signup = () => {
  const [step, setStep] = useState(1); // 1: Basic info, 2: Self-declaration, 3: Quiz
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [selfDeclaration, setSelfDeclaration] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizVerified, setQuizVerified] = useState(false);
  const [quizRejected, setQuizRejected] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      // Validate basic info
      if (!formData.name || !formData.email || !formData.phone) {
        setError("Please fill in all fields");
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate self-declaration
      if (!selfDeclaration) {
        setError("Please confirm your self-declaration");
        return;
      }
      setStep(3);
    }
  };

  const handleQuizComplete = async () => {
    setQuizVerified(true);
    setLoading(true);
    setError("");

    try {
      // Generate username from email or name
      const username = formData.email.split("@")[0] || formData.name.toLowerCase().replace(/\s+/g, "");
      
      // Register user with backend
      const response = await UserApi.register({
        name: formData.name,
        username: username,
        email: formData.email,
        password: formData.password,
        lastPeriod: new Date().toISOString().split("T")[0], // Default to today
        cycleLength: 28, // Default cycle length
      });

      if (response && response.token) {
        // Login user with token
        login({
          _id: response._id,
          id: response._id,
          name: response.name,
          username: response.username,
          email: response.email,
        });
        
        showToast("Account created successfully! Welcome to GlowSphere! ✨", "success");
        // Navigate directly to feed (verified users skip onboarding)
        navigate("/feed");
      } else {
        throw new Error("Registration failed - no token received");
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to create account. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
      setQuizVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizReject = () => {
    setQuizRejected(true);
  };

  const handleBack = () => {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (quizRejected) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-12">
          <div className="bg-card-bg rounded-2xl p-8 border border-amber-500/30 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h1 className="text-3xl font-bold mb-4 text-red-400">
              Access Denied
            </h1>
            <p className="text-amber-200 mb-6">
              We're a safe space for women, and this quiz helps us maintain that.
            </p>
            <Link
              to="/login"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto py-12">
        <div className="bg-card-bg rounded-2xl p-8 border border-amber-500/30">
          {step === 1 && (
            <>
              <h1 className="text-3xl font-bold text-center mb-2 text-amber-300">
                Create Account
              </h1>
              <p className="text-amber-200 text-center mb-8">
                Join our community today
              </p>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-6 text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-amber-200 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Alex Johnson"
                required
              />
            </div>

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
                  <label htmlFor="phone" className="block text-amber-200 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="+1 (555) 123-4567"
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

            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-amber-200 mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
                required
              />
            </div>

                <button
                  type="submit"
                  className="w-full bg-gold-gradient px-4 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
                >
                  Next
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-bold text-center mb-2 text-amber-300">
                Self-Declaration
              </h1>
              <p className="text-amber-200 text-center mb-8">
                Please confirm your identity
              </p>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-6 text-red-200">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selfDeclaration}
                    onChange={(e) => setSelfDeclaration(e.target.checked)}
                    className="mt-1 mr-3 w-5 h-5 rounded border-amber-500/30 bg-secondary-bg text-amber-500 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-amber-200">
                    I self-declare that I identify as a woman and am joining
                    this community in good faith as a member of the sisterhood.
                  </span>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selfDeclaration}
                  className="px-6 py-2 rounded-full bg-gold-gradient text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-3xl font-bold text-center mb-2 text-amber-300">
                Sisterhood Quiz ♡
              </h1>
              <p className="text-amber-200 text-center mb-8">
                Let's make sure you're ready to join our community!
              </p>

              <SisterhoodQuiz
                onComplete={handleQuizComplete}
                onReject={handleQuizReject}
              />

              {loading && (
                <div className="mt-4 text-center text-amber-300">
                  Creating your account...
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <div className="mt-6 text-center">
              <p className="text-amber-300">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
