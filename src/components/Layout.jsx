import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

import { ModuleProvider } from "../context/ModuleContext";
import { isAndroidApp } from "../utils/platform";

import "../css/Layout.css";

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <ModuleProvider>
      <div className={`layout ${isAndroidApp ? "app-native" : ""}`}>
        <Sidebar
          isMobileOpen={isAndroidApp && isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        {isAndroidApp && isMobileMenuOpen && (
          <button
            type="button"
            className="sidebar-overlay"
            aria-label="Close navigation menu"
            onClick={closeMobileMenu}
          />
        )}

        <div className="main-container">
          <Header
            onMenuClick={openMobileMenu}
            mobileTitle="Billing & Accounting"
          />

          <div className="page-content">
            <Outlet />
          </div>
        </div>
      </div>
    </ModuleProvider>
  );
}

export default Layout;
