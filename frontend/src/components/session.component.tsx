import { useEffect, useState } from "react";
import { useQuestionContext } from "../context/question.context";
import { useUserContext } from "../context/user.context";
import { API_BASE_URL } from "../constants";

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

      if (!user?.id) {
        setErrorMsg(
          "You are not signed in. Please sign in to start a session."
        );
        navigate("/");
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
          `${API_BASE_URL}/session-questions?${query.toString()}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch session questions");
        }
        const data = await res.json();
        setQuestions(data);
      } catch (e) {
        console.error(e);
        setErrorMsg("Unable to prepare your session. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, category, expertise_lvl, count]);

  if (isLoading) {
    return <div className="questionContainer">Preparing your session...</div>;
  }

  if (errorMsg) {
    return <div className="questionContainer">{errorMsg}</div>;
  }

  return <Question headingDisplay={headingDisplay ?? "Session"} />;
}
