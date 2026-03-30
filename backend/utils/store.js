// Simple in-memory store mapping session IDs to state objects
const sessionStore = new Map();

export const getSession = (sessionId) => {
  return sessionStore.get(sessionId) || null;
};

export const setSession = (sessionId, state) => {
  sessionStore.set(sessionId, state);
};

export const deleteSession = (sessionId) => {
  sessionStore.delete(sessionId);
};
