import axios from "axios";
import { clearAuthTokens } from "./authStorage";

// Use env base URL when provided (e.g., http://localhost:8080 for dev).
// In production behind Nginx, leave unset so requests stay same-origin.
const base = import.meta?.env?.VITE_API_BASE_URL || "";

const client = axios.create({
  baseURL: base,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization header from localStorage accessToken when present
client.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return config;
});

// Clear tokens on 401 so stale/invalid tokens stop being sent
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearAuthTokens();
    }
    return Promise.reject(error);
  }
);

export default client;