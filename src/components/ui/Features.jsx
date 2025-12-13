import React from "react";

const Features = () => {
  const features = [
    {
      emoji: "✨",
      title: "GlowLogs",
      description:
        "Document your learning journey and achievements with interactive logs.",
    },
    {
      emoji: "🎯",
      title: "GlowQuest",
      description:
        "Embark on challenges and quests to level up your skills and knowledge.",
    },
    {
      emoji: "📚",
      title: "StudySuite",
      description:
        "Access curated learning materials and resources for your growth.",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-card-bg p-6 rounded-xl border border-amber-500/30 hover:border-amber-400 transition-colors"
        >
          <div className="text-4xl mb-4">{feature.emoji}</div>
          <h3 className="text-2xl font-bold mb-2 text-amber-300">
            {feature.title}
          </h3>
          <p className="text-amber-200">{feature.description}</p>
        </div>
      ))}
    </section>
  );
};

export default Features;
