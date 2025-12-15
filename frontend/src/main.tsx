import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { UserProvider } from "./context/user.context";
import { QuestionProvider } from "./context/question.context";
import { WordProvider } from "./context/newariWord.context";

import "./index.scss";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <QuestionProvider>
          <WordProvider>
            <App />
          </WordProvider>
        </QuestionProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
