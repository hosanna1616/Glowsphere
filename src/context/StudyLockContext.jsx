import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "luminaStudyLock";
const StudyLockContext = createContext(null);

const readStoredLock = () => {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.error("Failed to read study lock state:", error);
    return null;
  }
};

export const StudyLockProvider = ({ children }) => {
  const [lockState, setLockState] = useState(() => readStoredLock());

  useEffect(() => {
    if (lockState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lockState));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [lockState]);

  const value = useMemo(
    () => ({
      lockState,
      isLocked: Boolean(lockState?.active),
      activateLock: (payload) =>
        setLockState({
          active: true,
          podId: payload?.podId || null,
          podName: payload?.podName || "",
          endsAt: payload?.endsAt || null,
        }),
      releaseLock: () => setLockState(null),
      syncLock: (payload) => setLockState(payload ? { active: true, ...payload } : null),
    }),
    [lockState]
  );

  return (
    <StudyLockContext.Provider value={value}>
      {children}
    </StudyLockContext.Provider>
  );
};

export const useStudyLock = () => {
  const context = useContext(StudyLockContext);
  if (!context) {
    throw new Error("useStudyLock must be used within a StudyLockProvider");
  }
  return context;
};
