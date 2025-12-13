import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/ui/Layout";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    lastPeriod: "",
    cycleLength: "",
    interests: [],
    goals: [],
    challenges: [],
  });
  const [customInterest, setCustomInterest] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [customChallenge, setCustomChallenge] = useState("");
  const [error, setError] = useState("");

  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const interestsOptions = [
    "Tech & Coding",
    "Art & Design",
    "Writing & Journalism",
    "Science & Research",
    "Entrepreneurship",
    "Health & Wellness",
    "Education & Teaching",
    "Music & Performance",
  ];

  const goalsOptions = [
    "Career advancement",
    "Learn new skills",
    "Build confidence",
    "Make new friends",
    "Start a business",
    "Improve health",
    "Find mentorship",
    "Creative projects",
  ];

  const challengesOptions = [
    "Imposter syndrome",
    "Work-life balance",
    "Finding time to learn",
    "Lack of support",
    "Financial constraints",
    "Breaking into tech",
    "Balancing responsibilities",
    "Self-doubt",
  ];

  const handleNext = () => {
    // Validate current step before proceeding
    if (!isStepValid()) {
      setError(getStepErrorMessage());
      return;
    }

    setError("");

    if (step < 5) {
      setStep(step + 1);
    } else {
      // Complete onboarding with validation
      const success = completeOnboarding(answers);
      if (success) {
        navigate("/feed");
      } else {
        setError("Please complete all required fields correctly.");
      }
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/login");
    }
  };

  const handleAnswerChange = (field, value) => {
    setAnswers({
      ...answers,
      [field]: value,
    });
  };

  const toggleInterest = (interest) => {
    if (answers.interests.includes(interest)) {
      handleAnswerChange(
        "interests",
        answers.interests.filter((i) => i !== interest)
      );
    } else {
      handleAnswerChange("interests", [...answers.interests, interest]);
    }
  };

  const toggleGoal = (goal) => {
    if (answers.goals.includes(goal)) {
      handleAnswerChange(
        "goals",
        answers.goals.filter((g) => g !== goal)
      );
    } else {
      handleAnswerChange("goals", [...answers.goals, goal]);
    }
  };

  const toggleChallenge = (challenge) => {
    if (answers.challenges.includes(challenge)) {
      handleAnswerChange(
        "challenges",
        answers.challenges.filter((c) => c !== challenge)
      );
    } else {
      handleAnswerChange("challenges", [...answers.challenges, challenge]);
    }
  };

  const addCustomInterest = () => {
    if (
      customInterest.trim() &&
      !answers.interests.includes(customInterest.trim())
    ) {
      handleAnswerChange("interests", [
        ...answers.interests,
        customInterest.trim(),
      ]);
      setCustomInterest("");
    }
  };

  const addCustomGoal = () => {
    if (customGoal.trim() && !answers.goals.includes(customGoal.trim())) {
      handleAnswerChange("goals", [...answers.goals, customGoal.trim()]);
      setCustomGoal("");
    }
  };

  const addCustomChallenge = () => {
    if (
      customChallenge.trim() &&
      !answers.challenges.includes(customChallenge.trim())
    ) {
      handleAnswerChange("challenges", [
        ...answers.challenges,
        customChallenge.trim(),
      ]);
      setCustomChallenge("");
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return answers.lastPeriod && new Date(answers.lastPeriod) <= new Date();
      case 2:
        const cycleLength = parseInt(answers.cycleLength);
        return (
          answers.cycleLength &&
          !isNaN(cycleLength) &&
          cycleLength >= 20 &&
          cycleLength <= 45
        );
      case 3:
        return answers.interests.length > 0;
      case 4:
        return answers.goals.length > 0;
      case 5:
        return answers.challenges.length > 0;
      default:
        return true;
    }
  };

  const getStepErrorMessage = () => {
    switch (step) {
      case 1:
        if (!answers.lastPeriod)
          return "Please select the first day of your last period.";
        if (new Date(answers.lastPeriod) > new Date())
          return "The date cannot be in the future.";
        return "";
      case 2:
        if (!answers.cycleLength)
          return "Please enter your average cycle length.";
        const cycleLength = parseInt(answers.cycleLength);
        if (isNaN(cycleLength)) return "Please enter a valid number.";
        if (cycleLength < 20) return "Cycle length must be at least 20 days.";
        if (cycleLength > 45)
          return "Cycle length must be no more than 45 days.";
        return "";
      case 3:
        return answers.interests.length === 0
          ? "Please select at least one interest."
          : "";
      case 4:
        return answers.goals.length === 0
          ? "Please select at least one goal."
          : "";
      case 5:
        return answers.challenges.length === 0
          ? "Please select at least one challenge."
          : "";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-card-bg rounded-2xl p-8 border border-amber-500/30">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-amber-300 mb-2">
              <span>Step {step} of 5</span>
              <span>{Math.round((step / 5) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-2">
              <div
                className="bg-gold-gradient h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[300px]">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-2 text-amber-300">
                  Welcome, {user?.name || "there"}!
                </h2>
                <p className="text-amber-200 text-center mb-8">
                  Let's personalize your GlowSphere experience
                </p>

                <div className="mb-6">
                  <label className="block text-amber-200 mb-4 text-center">
                    When was the first day of your last period?
                  </label>
                  <input
                    type="date"
                    value={answers.lastPeriod}
                    onChange={(e) =>
                      handleAnswerChange("lastPeriod", e.target.value)
                    }
                    className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-md mx-auto block"
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                  <p className="text-amber-300 text-sm text-center">
                    💡 This helps us provide personalized wellness insights and
                    reminders
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-2 text-amber-300">
                  Cycle Information
                </h2>
                <p className="text-amber-200 text-center mb-8">
                  Understanding your cycle helps us support your journey
                </p>

                <div className="mb-6">
                  <label className="block text-amber-200 mb-4 text-center">
                    How many days is your average cycle?
                  </label>
                  <div className="flex justify-center space-x-4">
                    {[21, 24, 28, 30, 35].map((days) => (
                      <button
                        key={days}
                        onClick={() =>
                          handleAnswerChange("cycleLength", days.toString())
                        }
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          answers.cycleLength === days.toString()
                            ? "bg-gold-gradient text-black font-bold"
                            : "bg-stone-800 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {days}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <input
                      type="number"
                      min="20"
                      max="45"
                      placeholder="Other"
                      value={
                        answers.cycleLength &&
                        ![21, 24, 28, 30, 35].includes(
                          parseInt(answers.cycleLength)
                        )
                          ? answers.cycleLength
                          : ""
                      }
                      onChange={(e) =>
                        handleAnswerChange("cycleLength", e.target.value)
                      }
                      className="w-24 bg-secondary-bg border border-amber-500/30 rounded-lg p-2 text-amber-200 text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-2 text-amber-300">
                  Your Interests
                </h2>
                <p className="text-amber-200 text-center mb-8">
                  What areas are you passionate about?
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {interestsOptions.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`p-3 rounded-lg text-sm text-left transition-all ${
                        answers.interests.includes(interest)
                          ? "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                          : "bg-stone-800 border border-amber-500/30 text-amber-200 hover:bg-stone-700"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>

                <div className="flex mb-6">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add your own interest"
                    className="flex-1 bg-secondary-bg border border-amber-500/30 rounded-l-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none"
                    onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                  />
                  <button
                    onClick={addCustomInterest}
                    className="bg-amber-500 text-black px-4 rounded-r-lg font-medium"
                  >
                    Add
                  </button>
                </div>

                {answers.interests.length > 0 && (
                  <div className="mb-6">
                    <p className="text-amber-300 mb-2">Selected interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {answers.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm flex items-center"
                        >
                          {interest}
                          <button
                            onClick={() => toggleInterest(interest)}
                            className="ml-2 text-amber-400 hover:text-amber-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-2 text-amber-300">
                  Your Goals
                </h2>
                <p className="text-amber-200 text-center mb-8">
                  What do you hope to achieve with GlowSphere?
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {goalsOptions.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-3 rounded-lg text-sm text-left transition-all ${
                        answers.goals.includes(goal)
                          ? "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                          : "bg-stone-800 border border-amber-500/30 text-amber-200 hover:bg-stone-700"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>

                <div className="flex mb-6">
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="Add your own goal"
                    className="flex-1 bg-secondary-bg border border-amber-500/30 rounded-l-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none"
                    onKeyPress={(e) => e.key === "Enter" && addCustomGoal()}
                  />
                  <button
                    onClick={addCustomGoal}
                    className="bg-amber-500 text-black px-4 rounded-r-lg font-medium"
                  >
                    Add
                  </button>
                </div>

                {answers.goals.length > 0 && (
                  <div className="mb-6">
                    <p className="text-amber-300 mb-2">Selected goals:</p>
                    <div className="flex flex-wrap gap-2">
                      {answers.goals.map((goal, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm flex items-center"
                        >
                          {goal}
                          <button
                            onClick={() => toggleGoal(goal)}
                            className="ml-2 text-amber-400 hover:text-amber-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-2 text-amber-300">
                  Your Challenges
                </h2>
                <p className="text-amber-200 text-center mb-8">
                  What obstacles do you face in your journey?
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {challengesOptions.map((challenge) => (
                    <button
                      key={challenge}
                      onClick={() => toggleChallenge(challenge)}
                      className={`p-3 rounded-lg text-sm text-left transition-all ${
                        answers.challenges.includes(challenge)
                          ? "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                          : "bg-stone-800 border border-amber-500/30 text-amber-200 hover:bg-stone-700"
                      }`}
                    >
                      {challenge}
                    </button>
                  ))}
                </div>

                <div className="flex mb-6">
                  <input
                    type="text"
                    value={customChallenge}
                    onChange={(e) => setCustomChallenge(e.target.value)}
                    placeholder="Add your own challenge"
                    className="flex-1 bg-secondary-bg border border-amber-500/30 rounded-l-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none"
                    onKeyPress={(e) =>
                      e.key === "Enter" && addCustomChallenge()
                    }
                  />
                  <button
                    onClick={addCustomChallenge}
                    className="bg-amber-500 text-black px-4 rounded-r-lg font-medium"
                  >
                    Add
                  </button>
                </div>

                {answers.challenges.length > 0 && (
                  <div className="mb-6">
                    <p className="text-amber-300 mb-2">Selected challenges:</p>
                    <div className="flex flex-wrap gap-2">
                      {answers.challenges.map((challenge, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm flex items-center"
                        >
                          {challenge}
                          <button
                            onClick={() => toggleChallenge(challenge)}
                            className="ml-2 text-amber-400 hover:text-amber-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-full bg-gold-gradient text-black font-semibold hover:opacity-90 transition-opacity"
            >
              {step === 5 ? "Complete Setup" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Onboarding;
