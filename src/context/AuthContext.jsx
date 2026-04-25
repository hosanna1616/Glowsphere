import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const persistUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);

  // Check if user data exists in localStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedUser = localStorage.getItem("user");
    const storedOnboarding = localStorage.getItem("onboardingComplete");
    const storedOnboardingData = localStorage.getItem("onboardingData");

    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedOnboarding === "true") {
      setOnboardingComplete(true);
    }

    if (storedOnboardingData) {
      setOnboardingData(JSON.parse(storedOnboardingData));
    }
  }, []);

  const login = (userData) => {
    setIsAuthenticated(true);
    persistUser(userData);
    const isOnboardingDone = userData?.onboardingComplete !== false;
    setOnboardingComplete(isOnboardingDone);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("onboardingComplete", isOnboardingDone ? "true" : "false");
    // Token is already saved by UserApi.login, but we ensure it's there
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("Token not found in localStorage after login");
    }
  };

  const completeOnboarding = (onboardingAnswers) => {
    // Evaluate onboarding answers
    const isValid = evaluateOnboardingAnswers(onboardingAnswers);

    if (isValid) {
      setOnboardingComplete(true);
      setOnboardingData(onboardingAnswers);
      localStorage.setItem("onboardingComplete", "true");
      localStorage.setItem("onboardingData", JSON.stringify(onboardingAnswers));
      return true;
    }

    return false;
  };

  const evaluateOnboardingAnswers = (answers) => {
    // Check if all required questions have been answered
    if (!answers.lastPeriod || !answers.cycleLength) {
      return false;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(answers.lastPeriod)) {
      return false;
    }

    // Validate cycle length is a number
    if (isNaN(answers.cycleLength) || answers.cycleLength < 1) {
      return false;
    }

    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    persistUser(null);
    setOnboardingComplete(false);
    setOnboardingData(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("onboardingComplete");
    localStorage.removeItem("onboardingData");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        onboardingComplete,
        onboardingData,
        login,
        logout,
        completeOnboarding,
        setUser: persistUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
