import { useEffect, useState } from "react";
import TimeTracker, { StopWatch } from "../components/timer.component";
import { useUserContext } from "../context/user.context";
import UserStat from "../components/demo/userStat";
export default function Dashboard() {
  const { user, isLoggedin } = useUserContext();
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
      <h2>Welcome, {user?.name}!</h2>
      <h1>This is your dashboard</h1>
      <StopWatch />
      <TimeTracker trackedTime={setTime} reset={reset} running={running} />
      <button onClick={logTime}>Log Time</button>
      <button onClick={resetTime}>Reset Log Time</button>

      <UserStat />
    </div>
  );
}
