
import React, { createContext, useContext, useState } from "react";

const ModuleContext = createContext(null);

export const MODULES = [
  { id: "billing", label: "Billing & Accounting" },
  { id: "hr", label: "HR Management" },
  { id: "payroll", label: "Payroll Management" },
  { id: "inventory", label: "Inventory Management" },
  { id: "supply-chain", label: "Supply Chain" },
];

const VALID_MODULES = MODULES.map((module) => module.id);

export function ModuleProvider({ children }) {
  const [activeModule, setActiveModuleState] = useState(() => {
    try {
      const saved = sessionStorage.getItem("eazytaxation-active-module");
      return VALID_MODULES.includes(saved) ? saved : "billing";
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
      // The selector continues to work if browser storage is unavailable.
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
