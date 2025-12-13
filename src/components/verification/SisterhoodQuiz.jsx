import React, { useState } from "react";

const SisterhoodQuiz = ({ onComplete, onReject }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  const questions = [
    {
      id: 1,
      question: "What does PMS stand for?",
      options: [
        "Pre-Menstrual Syndrome",
        "Post-Menstrual Syndrome",
        "Period Management System",
        "Personal Monthly Schedule",
      ],
      correct: 0,
    },
    {
      id: 2,
      question: "Which one is a period product: pad, tampon, or cup?",
      options: [
        "Only pad",
        "Only tampon",
        "Only cup",
        "All of the above",
      ],
      correct: 3,
    },
    {
      id: 3,
      question: "What's the average length of a menstrual cycle?",
      options: ["21 days", "28 days", "35 days", "42 days"],
      correct: 1,
    },
    {
      id: 4,
      question: "Name one common period symptom.",
      options: [
        "Headache",
        "Cramps",
        "Mood swings",
        "All of the above",
      ],
      correct: 3,
    },
    {
      id: 5,
      question: "Which makeup step usually comes first: foundation or concealer?",
      options: [
        "Foundation",
        "Concealer",
        "They're the same",
        "Depends on preference",
      ],
      correct: 0,
    },
  ];

  const handleAnswer = (optionIndex) => {
    setAnswers({
      ...answers,
      [currentQuestion]: optionIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      const score = questions.reduce((acc, q, idx) => {
        return acc + (answers[idx] === q.correct ? 1 : 0);
      }, 0);

      setShowResult(true);

      // Wait a moment then show result
      setTimeout(() => {
        if (score >= 4) {
          onComplete();
        } else {
          onReject();
        }
      }, 2000);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getScore = () => {
    return questions.reduce((acc, q, idx) => {
      return acc + (answers[idx] === q.correct ? 1 : 0);
    }, 0);
  };

  if (showResult) {
    const score = getScore();
    const isVerified = score >= 4;

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          {isVerified ? (
            <>
              <div className="text-6xl mb-4 animate-bounce">✨</div>
              <h2 className="text-3xl font-bold text-amber-300 mb-2">
                Welcome to the Sisterhood! ♡
              </h2>
              <p className="text-amber-200 text-lg">
                You got {score} out of {questions.length} correct!
              </p>
              <p className="text-amber-300 mt-4">
                You're all set! Let's get started...
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">💔</div>
              <h2 className="text-3xl font-bold text-red-400 mb-2">
                Oops, looks like you're not quite ready for our sisterhood yet ♡
              </h2>
              <p className="text-amber-200 text-lg mb-4">
                You got {score} out of {questions.length} correct.
              </p>
              <p className="text-amber-300">
                We're a safe space for women, and this quiz helps us maintain that.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isAnswered = answers[currentQuestion] !== undefined;

  return (
    <div className="min-h-[400px]">
      <div className="mb-6">
        <div className="flex justify-between text-amber-300 mb-2">
          <span className="text-sm">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-stone-800 rounded-full h-2">
          <div
            className="bg-gold-gradient h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-amber-300">
          {currentQ.question}
        </h2>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => {
            const isSelected = answers[currentQuestion] === index;
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  isSelected
                    ? "bg-amber-500/30 border-2 border-amber-500 text-amber-200"
                    : "bg-stone-800 border border-amber-500/30 text-amber-200 hover:bg-stone-700"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                      isSelected
                        ? "bg-amber-500 text-black"
                        : "border-2 border-amber-500/50"
                    }`}
                  >
                    {isSelected && "✓"}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentQuestion === 0}
          className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isAnswered}
          className="px-6 py-2 rounded-full bg-gold-gradient text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default SisterhoodQuiz;

