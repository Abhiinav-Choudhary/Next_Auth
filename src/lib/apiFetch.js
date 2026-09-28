
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
  });

  if (response.status !== 401) {
    return response;
  }

  const authEndpoints = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/refresh",
  ];

  if (authEndpoints.includes(url)) {
    return response;
  }

  let refreshResponse;

  try {
    refreshResponse = await refreshAccessToken();
  } catch {
    return response;
  }

  if (!refreshResponse.ok) {
    return response;
  }

  // Retry the original request only once
  return fetch(url, {
    ...options,
    credentials: "same-origin",
  });
}