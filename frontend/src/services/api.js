import axios from "axios";

/**
 * Centralized Axios API instance.
 * - In local development: defaults to '/api' (proxied by Vite to port 4000).
 * - In production deployment (Vercel): uses VITE_API_URL if defined (e.g. https://nexa-backend.onrender.com).
 * withCredentials: true ensures cookies/credentials are passed along for authentication.
 */
const rawBaseUrl = import.meta.env.VITE_API_URL;
const baseURL = rawBaseUrl
  ? `${rawBaseUrl.replace(/\/+$/, "")}/api`
  : "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
