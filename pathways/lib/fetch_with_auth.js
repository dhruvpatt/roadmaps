import { getCookie, getCsrfToken } from "./csrf";
import backendUrl from "../backendUrl";

export default async function fetchWithAuth(endpoint, options = {}) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  const method = options.method?.toUpperCase() || "GET";

  if (!safeMethods.includes(method)) {
    await getCsrfToken(backendUrl);
  }

  const csrfToken = getCookie("csrftoken");

  const finalOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken && { "X-CSRFToken": csrfToken }),
      ...options.headers,
    },
    ...options,
  };

  try {
    if (endpoint.startsWith("/")) {
      endpoint = endpoint.slice(1); // Remove leading slash if present
    }
    const res = await fetch(`${backendUrl}/${endpoint}`, finalOptions);

    if (!res.ok) {
      let errorData = {};
      try {
        console.log(res)
        errorData = await res.json();
        console.log("Error data:", errorData);
        if (!errorData.code || !errorData.title || !errorData.message) {
          throw new Error("No error data returned");
        }
      } catch (_) {
        errorData = {
          code: res.status,
          title: `Request failed with status: ${res.status}`,
          message: res.statusText || "An error occurred while processing your request.",
          details: `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      // Redirect to error page
      const { code, title, message, details } = errorData;
      if (typeof window !== "undefined") {
        window.location.href = `/error?code=${code}&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}&details=${encodeURIComponent(details || "")}`;
      }

      throw new Error(message || "Request failed");
    }

    return res;
  } catch (err) {
    console.error("fetchWithAuth error:", err);
    throw err;
  }
}
