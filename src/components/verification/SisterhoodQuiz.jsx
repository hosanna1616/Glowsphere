import React, { useMemo, useState } from "react";

const questionBank = [
  {
    id: "q1",
    question: "PMS is short for:",
    options: [
      "Pre-Menstrual Syndrome",
      "Post-Menstrual Syndrome",
      "Personal Mood Shift",
      "Period Management System",
    ],
    correctAnswer: "Pre-Menstrual Syndrome",
  },
  {
    id: "q2",
    question: "Which can be period products?",
    options: ["Only pads", "Only cups", "Only tampons", "Pads, cups, and tampons"],
    correctAnswer: "Pads, cups, and tampons",
  },
  {
    id: "q3",
    question: "A cycle often averages around:",
    options: ["14 days", "21 days", "28 days", "45 days"],
    correctAnswer: "28 days",
  },
  {
    id: "q4",
    question: "Which is a common period symptom?",
    options: ["Cramps", "Mood swings", "Bloating", "All of the above"],
    correctAnswer: "All of the above",
  },
  {
    id: "q5",
    question: "Which skincare order is generally correct?",
    options: [
      "Cleanser → moisturizer → sunscreen",
      "Sunscreen → cleanser → toner",
      "Toner → sunscreen → cleanser",
      "Moisturizer → cleanser → sunscreen",
    ],
    correctAnswer: "Cleanser → moisturizer → sunscreen",
  },
  {
    id: "q6",
    question: "A go-to emergency handbag item for many girls is:",
    options: ["Lip balm", "Period product", "Hair tie", "All of the above"],
    correctAnswer: "All of the above",
  },
  {
    id: "q7",
    question: "On a heavy-flow day, a common best practice is:",
    options: [
      "Change product regularly",
      "Ignore discomfort",
      "Skip hydration",
      "Wear only white and hope",
    ],
    correctAnswer: "Change product regularly",
  },
  {
    id: "q8",
    question: "Which statement is true?",
    options: [
      "Cycles are identical for everyone",
      "Cycle length can vary person to person",
      "PMS is a myth",
      "Symptoms never change",
    ],
    correctAnswer: "Cycle length can vary person to person",
  },
  {
    id: "q9",
    question: "A classic 'girl room' comfort combo can be:",
    options: [
      "Blanket + tea + playlist",
      "No rest, only stress",
      "Skipping meals",
      "None of these",
    ],
    correctAnswer: "Blanket + tea + playlist",
  },
  {
    id: "q10",
    question: "Which is usually makeup-first between these two?",
    options: ["Foundation", "Concealer", "Both are mandatory first", "Neither ever"],
    correctAnswer: "Foundation",
  },
  {
    id: "q11",
    question: "A healthy way to manage cramps can include:",
    options: ["Heat pad", "Hydration", "Light movement", "All of the above"],
    correctAnswer: "All of the above",
  },
  {
    id: "q12",
    question: "Which outfit detail is often praised in girly style content?",
    options: ["Color coordination", "Messy layering only", "Random mismatch always", "No accessories ever"],
    correctAnswer: "Color coordination",
  },
  {
    id: "q13",
    question: "Which is a common self-care reminder?",
    options: [
      "Rest is productive too",
      "Ignore your body signals",
      "Skip water all day",
      "Sleep is optional forever",
    ],
    correctAnswer: "Rest is productive too",
  },
  {
    id: "q14",
    question: "A period tracker app is useful mainly for:",
    options: [
      "Predicting cycle patterns",
      "Deleting contacts",
      "Changing phone wallpaper only",
      "Gaming rank upgrades",
    ],
    correctAnswer: "Predicting cycle patterns",
  },
  {
    id: "q15",
    question: "Which phrase sounds like supportive sisterhood?",
    options: [
      "Girls support girls",
      "Everyone competes silently",
      "Never compliment anyone",
      "Kindness is weak",
    ],
    correctAnswer: "Girls support girls",
  },
];

const hashSeed = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const makeRng = (seedValue) => {
  let state = (seedValue || 1) % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const pickQuestionsForUser = (seedString) => {
  const rng = makeRng(hashSeed(seedString));
  const pool = [...questionBank];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5).map((q, idx) => {
    const options = [...q.options];
    for (let i = options.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return {
      ...q,
      id: `${q.id}-${idx}`,
      options,
    };
  });
};

const SisterhoodQuiz = ({ onComplete, onReject, quizSeed = "" }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const questions = useMemo(
    () => pickQuestionsForUser(quizSeed || "default-quiz-seed"),
    [quizSeed]
  );

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
        return acc + (q.options[answers[idx]] === q.correctAnswer ? 1 : 0);
      }, 0);

      setShowResult(true);

      // Wait a moment then show result
      setTimeout(() => {
        if (score >= 3) {
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
      return acc + (q.options[answers[idx]] === q.correctAnswer ? 1 : 0);
    }, 0);
  };

  if (showResult) {
    const score = getScore();
    const isVerified = score >= 3;

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
                You need at least 3 correct answers out of 5 to continue.
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

