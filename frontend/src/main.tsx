import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context/user.context';
import { QuestionProvider } from './context/question.context';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './constants';

import BackendAPIProvider from './context/BackendAPIContext';
import UserProvider from './context/UserContext';

import './index.scss';
import App from './App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <UserProvider>
                <QuestionProvider>
                    <App />
                </QuestionProvider>
            </UserProvider>
        </BrowserRouter>
    </StrictMode>
);
