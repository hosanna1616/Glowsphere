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
    question: "Which are all valid period products?",
    options: [
      "Only pads",
      "Only cups",
      "Only tampons",
      "Pads, tampons, and menstrual cups",
    ],
    correctAnswer: "Pads, tampons, and menstrual cups",
  },
  {
    id: "q3",
    question:
      "If Day 1 of your last period was June 1 and your cycle is 28 days, your next expected Day 1 is around:",
    options: ["June 14", "June 21", "June 29", "July 5"],
    correctAnswer: "June 29",
  },
  {
    id: "q4",
    question:
      "If your cycle is 30 days, ovulation often happens roughly:",
    options: [
      "Around Day 5",
      "Around Day 16",
      "On Day 30 exactly",
      "Only after the period ends",
    ],
    correctAnswer: "Around Day 16",
  },
  {
    id: "q5",
    question: "A common sign of ovulation is:",
    options: [
      "Clear, stretchy cervical mucus",
      "No change across the cycle",
      "Severe fever always",
      "Zero appetite for a month",
    ],
    correctAnswer: "Clear, stretchy cervical mucus",
  },
  {
    id: "q6",
    question:
      "Cycle Day 1 is usually counted as:",
    options: [
      "The day spotting ends",
      "The first day of full flow",
      "The day before bleeding starts",
      "Any random day in the month",
    ],
    correctAnswer: "The first day of full flow",
  },
  {
    id: "q7",
    question:
      "If your cycle length changed from 27 to 32 days for one month, the healthiest interpretation is usually:",
    options: [
      "You are broken",
      "Small variation can happen due to stress, sleep, travel, etc.",
      "It must always be exactly the same each month",
      "Ignore it forever even if pattern continues for months",
    ],
    correctAnswer:
      "Small variation can happen due to stress, sleep, travel, etc.",
  },
  {
    id: "q8",
    question: "Which symptom cluster is commonly linked to PMS?",
    options: [
      "Bloating, breast tenderness, mood shifts",
      "Only hair growth",
      "Only sore throat",
      "No possible symptoms",
    ],
    correctAnswer: "Bloating, breast tenderness, mood shifts",
  },
  {
    id: "q9",
    question:
      "A period that starts on April 3 with a 26-day cycle is expected next around:",
    options: ["April 18", "April 29", "May 9", "May 20"],
    correctAnswer: "April 29",
  },
  {
    id: "q10",
    question:
      "Which self-care set is most realistic for cramp support?",
    options: [
      "Heat + hydration + light movement if tolerated",
      "No food, no water, no rest",
      "Only social media scrolling",
      "Ignore all pain signals",
    ],
    correctAnswer: "Heat + hydration + light movement if tolerated",
  },
  {
    id: "q11",
    question:
      "If someone says their luteal phase is usually 12-14 days, this means ovulation is generally:",
    options: [
      "About 12-14 days before next period",
      "Always on Day 1",
      "Never related to the next period",
      "Exactly 3 days after period ends",
    ],
    correctAnswer: "About 12-14 days before next period",
  },
  {
    id: "q12",
    question:
      "Which statement about discharge across the cycle is most accurate?",
    options: [
      "It can change texture throughout the cycle",
      "It never changes in any person",
      "Any discharge means infection",
      "It disappears for everyone after puberty",
    ],
    correctAnswer: "It can change texture throughout the cycle",
  },
  {
    id: "q13",
    question:
      "If your period app predicts Day 1 tomorrow, the most useful prep is:",
    options: [
      "Carry products and plan a lighter schedule if needed",
      "Do nothing and panic later",
      "Delete the tracker",
      "Skip hydration all day",
    ],
    correctAnswer: "Carry products and plan a lighter schedule if needed",
  },
  {
    id: "q14",
    question:
      "For tracking cycle patterns, which is the most useful data pair?",
    options: [
      "Start date + flow pattern",
      "Only favorite color",
      "Only shoe size",
      "Only screen time",
    ],
    correctAnswer: "Start date + flow pattern",
  },
  {
    id: "q15",
    question:
      "If your last two cycle lengths are 27 and 29 days, your rough average is:",
    options: ["24 days", "26 days", "28 days", "31 days"],
    correctAnswer: "28 days",
  },
  {
    id: "q16",
    question:
      "Which reminder makes sense in a women-centered wellness app?",
    options: [
      "Hydrate, check symptoms, and rest when needed",
      "Never log your cycle",
      "Ignore severe pain always",
      "Skip all check-ins",
    ],
    correctAnswer: "Hydrate, check symptoms, and rest when needed",
  },
  {
    id: "q17",
    question:
      "If Day 1 was August 10 and cycle length is 31 days, next Day 1 is likely around:",
    options: ["August 28", "September 2", "September 10", "September 20"],
    correctAnswer: "September 10",
  },
  {
    id: "q18",
    question:
      "Which sign should be treated seriously and discussed with a professional?",
    options: [
      "Pain that disrupts normal daily life repeatedly",
      "Mild mood change once",
      "Wanting chocolate",
      "Feeling sleepy one evening",
    ],
    correctAnswer: "Pain that disrupts normal daily life repeatedly",
  },
  {
    id: "q19",
    question:
      "A supportive sisterhood response to period pain is:",
    options: [
      "Validate her and offer practical help",
      "Say she is exaggerating",
      "Make jokes about it",
      "Ignore her message",
    ],
    correctAnswer: "Validate her and offer practical help",
  },
  {
    id: "q20",
    question:
      "Which tracking habit improves prediction quality over time?",
    options: [
      "Consistent monthly logging of start dates",
      "Logging once per year",
      "Never updating after setup",
      "Guessing random dates",
    ],
    correctAnswer: "Consistent monthly logging of start dates",
  },
  {
    id: "q21",
    question:
      "A cycle can still be considered within a common adult range if it is:",
    options: ["12-18 days", "21-35 days", "40-55 days", "Always exactly 28"],
    correctAnswer: "21-35 days",
  },
  {
    id: "q22",
    question:
      "If a 28-day cycle starts on November 3, period tracking usually marks fertile window roughly around:",
    options: ["Days 2-4", "Days 8-15", "Days 20-26", "Only Day 28"],
    correctAnswer: "Days 8-15",
  },
  {
    id: "q23",
    question:
      "Which period-care statement is accurate?",
    options: [
      "Changing products regularly helps comfort and hygiene",
      "One product can be worn indefinitely",
      "Hydration has zero impact",
      "Cramps are always imaginary",
    ],
    correctAnswer: "Changing products regularly helps comfort and hygiene",
  },
  {
    id: "q24",
    question:
      "If your cycle average is 29 days and last period started on January 4, next start is expected around:",
    options: ["January 20", "February 2", "February 10", "February 18"],
    correctAnswer: "February 2",
  },
  {
    id: "q25",
    question:
      "A realistic period productivity strategy is:",
    options: [
      "Adjust intensity by energy levels across the cycle",
      "Work at max intensity every day regardless of symptoms",
      "Ignore sleep and hydration",
      "Never plan around your body",
    ],
    correctAnswer: "Adjust intensity by energy levels across the cycle",
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
  const dailyRotationKey = new Date().toISOString().slice(0, 10);
  const combinedSeed = `${seedString}|${dailyRotationKey}`;
  const rng = makeRng(hashSeed(combinedSeed));
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

