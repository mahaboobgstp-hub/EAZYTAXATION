import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { NavLink, useLocation } from "react-router-dom";
import { FiHome, FiGrid, FiBarChart2, FiMoreHorizontal } from "react-icons/fi";
import { ModuleProvider } from "../context/ModuleContext";
import "../css/Layout.css";
import GlobalVoiceAssistant from "./GlobalVoiceAssistant";

function Layout() {
  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) setMobileSidebarOpen(open => !open);
    else setSidebarCollapsed(collapsed => !collapsed);
  };

  return (
    <ModuleProvider>
      <div className={`layout ${isNativeAndroid ? "android-native" : ""} ${sidebarCollapsed ? "sidebar-is-collapsed" : ""} ${mobileSidebarOpen ? "mobile-sidebar-is-open" : ""}`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onNavigate={() => setMobileSidebarOpen(false)}
          onClose={() => setMobileSidebarOpen(false)}
        />
        {mobileSidebarOpen && (
          <button type="button" className="sidebar-backdrop" aria-label="Close navigation menu" onClick={() => setMobileSidebarOpen(false)} />
        )}
        <div className="main-container" onClick={() => {
          if (window.innerWidth <= 768 && mobileSidebarOpen) setMobileSidebarOpen(false);
        }}>
          <Header onToggleSidebar={toggleSidebar} />
          <GlobalVoiceAssistant />
          <div className={`page-content ${isNativeAndroid ? "android-page-content" : ""}`}><Outlet /></div>
          {isNativeAndroid && (
            <nav className="android-bottom-nav" aria-label="Bottom navigation">
              <NavLink to="/app" end className={({ isActive }) => isActive ? "android-bottom-nav-item active" : "android-bottom-nav-item"}><FiHome /><span>Home</span></NavLink>
              <NavLink to="/app/sales" className={location.pathname.startsWith("/app/sales") || location.pathname.startsWith("/app/purchases") || location.pathname.startsWith("/app/expenses") ? "android-bottom-nav-item active" : "android-bottom-nav-item"}><FiGrid /><span>Transactions</span></NavLink>
              <NavLink to="/app/sales-reports" className={location.pathname.includes("reports") || location.pathname.includes("ledger") ? "android-bottom-nav-item active" : "android-bottom-nav-item"}><FiBarChart2 /><span>Reports</span></NavLink>
              <button type="button" className={mobileSidebarOpen ? "android-bottom-nav-item active" : "android-bottom-nav-item"} onClick={() => setMobileSidebarOpen(true)}><FiMoreHorizontal /><span>More</span></button>
            </nav>
          )}
        </div>
      </div>
    </ModuleProvider>
  );
}
export default Layout;
