import axios from "axios";

const refresh_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/token/refresh/";

export const api = axios.create({
  // debugger
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log("originalRequest:", originalRequest);
    const isRefreshEndpoint = originalRequest.url?.includes("/token/refresh/");
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;
      console.log("Error found with Axios... Attempting refresh");
      console.log("originalRequest._retry set to true");
      console.log("New originalRequest._retry:", originalRequest._retry);
      try {
        await api.post(refresh_endpoint); // creates new originalRequest, ._retry is now false
        console.log("Refresh Hit");
        return api.post(originalRequest); // original originalRequest, ._retry is now true
      } catch (error) {
        console.error("Refresh token error:", error);
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    console.log("Ending refresh check, returning original error");
    return Promise.reject(error);
  }
);
