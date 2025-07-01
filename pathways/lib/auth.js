import { getCookie, getCsrfToken } from "./csrf";
import backendUrl from "../backendUrl";

export async function login({ username, password, organization_code }) {
  await getCsrfToken(backendUrl);

  const res = await fetch(`${backendUrl}/api/login/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({ username, password, organization_code }),
  });

  if (!res.ok) {
    console.log("Login failed", res.statusText)
    return res
  };
  return await fetchCurrentUser();
}

export async function signup(data) {
  await getCsrfToken(backendUrl);

  const res = await fetch(`${backendUrl}/api/signup/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) console.error("Login failed", res.statusText);
  console.log(data)
  await login({ username: data.username, password: data.password });
  return await fetchCurrentUser();
}

export async function logout() {
  await getCsrfToken(backendUrl);
  await fetch(`${backendUrl}/api/logout/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  });
}

export async function fetchCurrentUser() {
  await getCsrfToken(backendUrl); // Make sure token is set

  console.log(getCookie("csrftoken"), "CSRF Token");

  const res = await fetch(`${backendUrl}/api/user/`, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
      "Content-Type": "application/json"
    },
  });

  if (!res.ok) return null;
  return res.json();
}

export function getCurrentUser() {
  const { user } = useContext(AuthContext);
  return user;
}

