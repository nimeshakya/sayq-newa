import { useRef, useState, useEffect } from "react";

export function StopWatch() {
  const [seconds, setSecond] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSecond((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setSecond(0);
  };

  const FormatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };
  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <h2>{FormatTime(seconds)}</h2>

        <button onClick={start}>Start</button>
        <button onClick={pause}>Stop</button>
        <button onClick={reset}>reset</button>
      </div>
    </div>
  );
}

type TimeTrackerProp = {
  running?: boolean;
  reset?: boolean;
  trackedTime?: (time: number) => void;
};

export default function TimeTracker({
  running = true,
  reset = false,
  trackedTime,
}: TimeTrackerProp) {
  const [seconds, setSeconds] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  // Reset timer
  useEffect(() => {
    if (reset) setSeconds(0);
  }, [reset]);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        trackedTime?.(next); // pass number
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, trackedTime]);

  const FormatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };
  return <div>{FormatTime(seconds)}</div>;
}
