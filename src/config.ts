// src/config.ts

// Configure VITE_API_BASE_URL in .env.local for local development or deployment.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
