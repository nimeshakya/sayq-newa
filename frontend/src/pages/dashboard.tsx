import { useEffect, useState } from "react";
import TimeTracker, { StopWatch } from "../components/timer.component";
export default function Dashboard() {
  const [time, setTime] = useState<number>(0);
  const [reset, setReset] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(true);
  const logTime = () => {
    console.log(`current Time: ${time}`);
  };
  const resetTime = () => {
    setReset(true);
    console.log(`reset at  Time: ${time}`);

    // turn reset off immediately
    setTimeout(() => setReset(false), 0);
  };
  useEffect(() => {
    setRunning(true);
  }, [reset]);
  return (
    <div>
      <h1>This is dashboard</h1>
      <StopWatch />
      <TimeTracker trackedTime={setTime} reset={reset} running={running} />
      <button onClick={logTime}>Log Time</button>
      <button onClick={resetTime}>Reset Log Time</button>
    </div>
  );
}
