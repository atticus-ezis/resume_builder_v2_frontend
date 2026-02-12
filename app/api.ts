import axios from "axios";
import toast from "react-hot-toast";
import React from "react";

const refresh_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/token/refresh/";

function extractDetailFromResponse(data: unknown): string | undefined {
  if (data == null) return undefined;
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (trimmed.length > 200) return trimmed.slice(0, 200) + "…";
    return trimmed || undefined;
  }
  if (typeof data === "object" && "detail" in data) {
    const d = (data as { detail: unknown }).detail;
    return typeof d === "string" ? d : Array.isArray(d) ? d.join(" ") : undefined;
  }
  return undefined;
}

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
  async function onRejected(error: unknown) {
    const axiosError = error as {
      config?: { url?: string; method?: string };
      response?: { status: number; data: unknown };
      message?: string;
    };
    const originalRequest = axiosError.config;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    // Log only server responses (skip 401/403 and network errors)
    if (status && status !== 401 && status !== 403 && process.env.NODE_ENV === "development") {
      console.error("[API Error]", {
        method: originalRequest?.method,
        url: originalRequest?.url,
        status,
        data: typeof data === "string" ? data.slice(0, 500) : data,
      });
    }

    const isRefreshEndpoint = originalRequest?.url?.includes("/token/refresh/");
    const isValidateUserEndpoint = originalRequest?.url?.includes("/validate-user/");

    // Handle 401 with token refresh (skip only the refresh endpoint itself)
    if (status === 401 && !(originalRequest as { _retry?: boolean })._retry && !isRefreshEndpoint) {
      (originalRequest as { _retry?: boolean })._retry = true;
      try {
        const refreshResponse = await fetch(refresh_endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          credentials: "include",
        });
        
        // Check if refresh was successful
        if (!refreshResponse.ok) {
          throw new Error(`Refresh failed with status ${refreshResponse.status}`);
        }
        
        // Token refresh succeeded - retry the original request
        return api(originalRequest!);
      } catch {
        // Token refresh failed - show toast with login/register links (skip for auth check endpoints)
        if (typeof window !== "undefined" && !isValidateUserEndpoint) {
          toast.error(
            (t) =>
              React.createElement(
                "div",
                { className: "flex flex-col gap-2" },
                React.createElement("p", { className: "font-medium" }, "You must be logged in to continue"),
                React.createElement(
                  "div",
                  { className: "flex gap-2" },
                  React.createElement(
                    "a",
                    {
                      href: "/account/login",
                      className:
                        "text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline",
                      onClick: () => toast.dismiss(t.id),
                    },
                    "Login",
                  ),
                  React.createElement("span", { className: "text-sm text-gray-500" }, "or"),
                  React.createElement(
                    "a",
                    {
                      href: "/account/register",
                      className:
                        "text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline",
                      onClick: () => toast.dismiss(t.id),
                    },
                    "Register",
                  ),
                ),
              ),
            { duration: 6000 },
          );
        }
        return Promise.reject(error);
      }
    }

    // Handle 401/403 after retry - permissions issue (skip for auth check endpoints)
    if ((status === 401 || status === 403) && (originalRequest as { _retry?: boolean })._retry) {
      if (typeof window !== "undefined" && !isValidateUserEndpoint) {
        toast.error("You don't have permission to access this resource");
      }
      return Promise.reject(error);
    }

    // Show toast for all errors except 401/403
    if (typeof window !== "undefined" && status !== 401 && status !== 403) {
      if (status === 500) {
        const detail = extractDetailFromResponse(data);
        toast.error(detail || "Server error");
      } else if (status) {
        // Other HTTP errors (400, 404, etc.)
        const detail = extractDetailFromResponse(data);
        toast.error(detail || `Error: ${status}`);
      } else {
        // Network errors (no status)
        toast.error("Network error - please check your connection");
      }
    }

    return Promise.reject(error);
  },
);
