import { useEffect, useState } from "react";
import { useQuestionContext } from "../context/question.context";
import { useUserContext } from "../context/user.context";
import { BACKEND_API } from "../constants";

import "../styles/_shared.scss";
import Question from "./questions.components";
import { useNavigate } from "react-router-dom";

type SessionProps = {
  count: number;
  expertise_lvl?: number;
  category?: string;
  headingDisplay?: string;
};

export default function SessionComponent({
  count,
  expertise_lvl,
  category,
  headingDisplay,
}: SessionProps) {
  const { user } = useUserContext();
  const { setQuestions, ResetQuestions } = useQuestionContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      ResetQuestions();
      setErrorMsg(null);
      setIsLoading(true);
      const loadStarted = Date.now();

      const ensureMinDelay = async (started: number) => {
        const elapsed = Date.now() - started;
        const remaining = 2000 - elapsed; // 2 seconds minimum
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
      };

      if (!user?.id) {
        await ensureMinDelay(loadStarted);
        navigate("/redirectPage", { state: { type: "auth" } });
        setIsLoading(false);
        return;
      }

      const query = new URLSearchParams();
      query.append("userId", user.id);
      if (category) query.append("category", category);
      if (expertise_lvl !== undefined)
        query.append("expertise_lvl", String(expertise_lvl));
      if (count) query.append("count", String(count));

      try {
        const res = await fetch(
          `${BACKEND_API}/session-questions?${query.toString()}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        // Handle auth redirect
        if (res.status === 401) {
          await ensureMinDelay(loadStarted);
          navigate("/redirectPage", { state: { type: "auth" } });
          setIsLoading(false);
          return;
        }

        // Handle learning-required redirect
        if (res.status === 409) {
          try {
            const body = await res.json();
            if (body?.message === "LEARNING_REQUIRED") {
              await ensureMinDelay(loadStarted);
              navigate("/redirectPage", { state: { type: "learning" } });
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // proceed to generic error below
          }
        }

        if (!res.ok) {
          throw new Error("Failed to fetch session questions");
        }

        const data = await res.json();
        setQuestions(data);
      } catch (e) {
        console.error(e);
        setErrorMsg("Unable to prepare your session. Please try again.");
      } finally {
        await ensureMinDelay(loadStarted);
        setIsLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, category, expertise_lvl, count]);

  if (isLoading) {
    return (
      <div className="loadingText">Preparing your session. Please Wait ...</div>
    );
  }

  if (errorMsg) {
    return <div className="loadingText">{errorMsg}</div>;
  }

  return <Question headingDisplay={headingDisplay ?? "Session"} />;
}
