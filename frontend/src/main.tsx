import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { UserProvider } from './context/user.context';
import { QuestionProvider } from './context/question.context';
import { WordProvider } from './context/newariWord.context';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './constants';

import BackendAPIProvider from './context/backendAPI.context';

import './index.scss';
import './index.css';
import App from './App';

console.log(GOOGLE_CLIENT_ID);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <BackendAPIProvider>
                    <UserProvider>
                        <QuestionProvider>
                            <WordProvider>
                                <App />
                            </WordProvider>
                        </QuestionProvider>
                    </UserProvider>
                </BackendAPIProvider>
            </GoogleOAuthProvider>
        </BrowserRouter>
    </StrictMode>,
);
