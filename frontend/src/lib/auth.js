export const saveAuth = (data) => {
  if (typeof window === "undefined") return;

  localStorage.setItem("crm_token", data.token);
  localStorage.setItem("crm_user", JSON.stringify(data.user));
};

export const getToken = () => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("crm_token");
};

export const getUser = () => {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("crm_user");
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("crm_token");
  localStorage.removeItem("crm_user");
};

export const isLoggedIn = () => {
  return Boolean(getToken());
};
