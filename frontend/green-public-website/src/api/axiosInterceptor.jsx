// src/api/axiosInterceptor.ts
import axios from "axios";
import { refresh } from "./authApi";

const base = import.meta?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";

const api = axios.create({
  baseURL: `${base}/api/auth`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await refresh();
        const newToken = data.accessToken;
        error.config.headers["Authorization"] = `Bearer ${newToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        console.error("Refresh failed", refreshError);
        // redirect to login
      }
    }
    return Promise.reject(error);
  }
);

export default api;
