type ScoreCircleProps = {
  score: number;
};

const ScoreCircle = ({ score }: ScoreCircleProps) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const strokeColor =
    normalizedScore >= 75
      ? "#16a34a"
      : normalizedScore >= 50
        ? "#f59e0b"
        : "#dc2626";

  return (
    <div className="relative size-20 shrink-0 sm:size-24" aria-label={`Score ${normalizedScore} out of 100`}>
      <svg className="size-full -rotate-90" viewBox="0 0 100 100" role="img">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-900 sm:text-2xl">{normalizedScore}</span>
      </div>
    </div>
  );
};

export default ScoreCircle;
