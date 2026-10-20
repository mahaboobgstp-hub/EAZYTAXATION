
import React, { createContext, useContext, useState } from "react";

const ModuleContext = createContext(null);

const VALID_MODULES = [
  "billing",
  "hr",
  "inventory",
  "supply-chain",
];

export function ModuleProvider({ children }) {
  const [activeModule, setActiveModuleState] = useState(() => {
    try {
      const savedModule = sessionStorage.getItem("eazytaxation-active-module");
      return VALID_MODULES.includes(savedModule) ? savedModule : "billing";
    } catch {
      return "billing";
    }
  });

  const setActiveModule = (moduleName) => {
    if (!VALID_MODULES.includes(moduleName)) return;

    setActiveModuleState(moduleName);

    try {
      sessionStorage.setItem("eazytaxation-active-module", moduleName);
    } catch {
      // The module selector still works if session storage is unavailable.
    }
  };

  return (
    <ModuleContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);

  if (!context) {
    throw new Error("useModule must be used inside ModuleProvider");
  }

  return context;
}
