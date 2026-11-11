import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ModuleProvider } from "../context/ModuleContext";
import "../css/Layout.css";

function Layout() {
  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) setMobileSidebarOpen(open => !open);
    else setSidebarCollapsed(collapsed => !collapsed);
  };

  return (
    <ModuleProvider>
      <div className={`layout ${isNativeAndroid ? "android-native" : ""} ${sidebarCollapsed ? "sidebar-is-collapsed" : ""} ${mobileSidebarOpen ? "mobile-sidebar-is-open" : ""}`}>
        <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileSidebarOpen} onNavigate={() => setMobileSidebarOpen(false)} />
        <div className="main-container">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="page-content"><Outlet /></div>
        </div>
      </div>
    </ModuleProvider>
  );
}
export default Layout;
