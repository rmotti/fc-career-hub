const SESSION_TOKEN_KEY = "session_token";
const SESSION_USER_KEY = "session_user";
const ACTIVE_SAVE_KEY_PREFIX = "active-save-id:";

export function getStoredToken() {
  return window.localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function getStoredUser<T>() {
  const rawUser = window.localStorage.getItem(SESSION_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as T;
  } catch {
    window.localStorage.removeItem(SESSION_USER_KEY);
    return null;
  }
}

export function setStoredUser(user: unknown) {
  window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  window.localStorage.removeItem(SESSION_USER_KEY);
}

function getActiveSaveStorageKey(userId: string) {
  return `${ACTIVE_SAVE_KEY_PREFIX}${userId}`;
}

export function getStoredActiveSaveId(userId: string) {
  return window.localStorage.getItem(getActiveSaveStorageKey(userId));
}

export function setStoredActiveSaveId(userId: string, saveId: string) {
  window.localStorage.setItem(getActiveSaveStorageKey(userId), saveId);
}

export function clearStoredActiveSaveId(userId: string) {
  window.localStorage.removeItem(getActiveSaveStorageKey(userId));
}
