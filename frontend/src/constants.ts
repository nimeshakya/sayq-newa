export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET!;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID!;
export const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL!}/api`;
export const RL_RECOMMEND_ENABLED =
  (import.meta.env.VITE_RL_ENABLED ?? "true") === "true";
