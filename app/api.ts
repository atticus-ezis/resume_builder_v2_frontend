import axios from "axios";

const refresh_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/token/refresh/";

// Helper function to get cookie value by name
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null; // SSR safety

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

export const api = axios.create({
  // debugger
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  function (config) {
    const csrftoken = getCookie("csrftoken");
    if (csrftoken) {
      config.headers["X-CSRFToken"] = csrftoken;
    }
    // Let the browser set Content-Type (with boundary) for FormData
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  function onFullfilled(response) {
    return response;
  },
  async function onRejected(error) {
    const originalRequest = error.config;
    console.log("AXIOS RESPONSE ERROR:", originalRequest);
    const isRefreshEndpoint = originalRequest.url?.includes("/token/refresh/");

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;
      console.log("Authorization Error: AXIOS ATTEMPTING REFRESH");
      try {
        await fetch(refresh_endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          credentials: "include",
        });
        console.log("AXIOS REFRESH HIT");
        return api(originalRequest); // ._retry is now true
      } catch (err) {
        console.error("AXIOS REFRESH ERROR:", err);
        document.location.href = "/account/login";
        return Promise.reject(error);
      }
    }

    console.log("Ending refresh check, returning original error");
    return Promise.reject(error);
  },
);
