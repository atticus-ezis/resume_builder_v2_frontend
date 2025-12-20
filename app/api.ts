import axios from "axios";

const refresh_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/token/refresh/";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // try posting to refresh_endpoint
      try {
        await api.post(refresh_endpoint);
        return api.post(originalRequest);
      } catch (error) {
        console.error("Refresh token error:", error);
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
