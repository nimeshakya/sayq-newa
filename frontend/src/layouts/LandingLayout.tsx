import Navigation from "../components/navigation/navigationPanel";
import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { UserProvider } from "../context/user.context";
import { QuestionProvider } from "../context/question.context";
import { WordProvider } from "../context/newariWord.context";

const LandingLayout = () => {
  return (
    <UserProvider>
      <QuestionProvider>
        <WordProvider>
          <Navigation />
          <main className="mt-18">
            <Suspense fallback={<div>Loading Page...</div>}>
              <Outlet />
            </Suspense>
          </main>
        </WordProvider>
      </QuestionProvider>
    </UserProvider>
  );
};

export default LandingLayout;
