// src/api/authApi.js
import client from "./client";

const AUTH_PREFIX = "/api/auth";

// ✅ Register (expects { name, email, password })
export const register = (data) =>
  client.post(`${AUTH_PREFIX}/register`, {
    name: data.name,
    email: data.email,
    password: data.password,
  });

// ✅ Login (expects { email, password })
export const login = (data) =>
  client.post(`${AUTH_PREFIX}/login`, {
    email: data.email,
    password: data.password,
  });


// ✅ Refresh Token
export const refresh = () => client.post(`${AUTH_PREFIX}/refresh`);

// ✅ Forgot Password (expects { email }) - FIXED: accepts object
export const forgotPassword = (data) =>
  client.post(`${AUTH_PREFIX}/forgot-password`, {
    email: data.email,
  });

// ✅ Reset Password (expects { token, newPassword, confirmPassword })
export const resetPassword = (data) =>
  client.post(`${AUTH_PREFIX}/reset-password`, {
    token: data.token,
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  });

// ✅ Get Profile
export const getProfile = () => client.get(`${AUTH_PREFIX}/me`);

// ✅ Update Profile
export const updateProfile = (data) => client.put(`${AUTH_PREFIX}/me`, data);

// ✅ Change Password
export const changePassword = (data) =>
  client.post(`${AUTH_PREFIX}/change-password`, {
    oldPassword: data.oldPassword,
    newPassword: data.newPassword,
  });

// add a light response interceptor for logging
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data);
    return Promise.reject(error);
  }
);

export default client;