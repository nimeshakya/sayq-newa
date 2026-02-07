import { useEffect, useRef, useState } from "react";
import "../styles/timer.style.scss";

type CircularTimerProps = {
  running?: boolean;
  reset?: boolean;
  trackedTime?: (time: number) => void;
  maxTime?: number; // Optional: max seconds for full circle
};

export default function CircularTimer({
  running = true,
  reset = false,
  trackedTime,
  maxTime = 60,
}: CircularTimerProps) {
  const [seconds, setSeconds] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  // Reset timer
  useEffect(() => {
    if (reset) setSeconds(0);
  }, [reset]);

  // Timer logic
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Send time to parent
  useEffect(() => {
    trackedTime?.(seconds);
  }, [seconds]);

  // Format time
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Circle calculations
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds % maxTime) / maxTime; // For circular progress
  const offset = circumference - progress * circumference;

  return (
    <div className="circular-timer">
      <svg width="100" height="100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#eee"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#8b0038"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text
          x="50%"
          y="90%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill="#333"
        >
          {formatTime(seconds)}
        </text>
      </svg>
    </div>
  );
}
