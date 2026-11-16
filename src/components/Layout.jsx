import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiGrid, FiBarChart2, FiMoreHorizontal } from "react-icons/fi";
import { ModuleProvider } from "../context/ModuleContext";
import "../css/Layout.css";
import GlobalVoiceAssistant from "./GlobalVoiceAssistant";

function Layout() {
  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const desktopOnlyPath = /^\/app\/(employees|employee-|attendance|payroll|salary|final-settlement|leave-|holiday-|departments|designations|locations|shifts|recruitment-|job-|candidate-|interview-|offer-|training-|performance-|asset-|vehicle-|hr-|ca-workspace|stock-|physical-stock|stock-transfer|asset-categories)/i.test(location.pathname);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) setMobileSidebarOpen(open => !open);
    else setSidebarCollapsed(collapsed => !collapsed);
  };

  const openHomePanel = panel => navigate(panel ? `/app?panel=${panel}` : "/app");

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
          <Header onToggleSidebar={toggleSidebar} onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)} />
          {location.pathname !== "/app/ai-assistant/voice" && <GlobalVoiceAssistant open={voiceAssistantOpen} onClose={() => setVoiceAssistantOpen(false)} />}
          <div className={`page-content ${isNativeAndroid ? "android-page-content" : ""}`}>{isNativeAndroid && desktopOnlyPath ? <Navigate to="/app" replace /> : <Outlet />}</div>
          {isNativeAndroid && (
            <nav className="android-bottom-nav" aria-label="Bottom navigation">
              <button type="button" className={location.pathname === "/app" ? "android-bottom-nav-item active" : "android-bottom-nav-item"} onClick={() => openHomePanel("")}><FiHome /><span>Home</span></button>
              <button type="button" className={location.pathname === "/app" && location.search.includes("transactions") ? "android-bottom-nav-item active" : "android-bottom-nav-item"} onClick={() => openHomePanel("transactions")}><FiGrid /><span>Transactions</span></button>
              <button type="button" className={location.pathname === "/app" && location.search.includes("reports") ? "android-bottom-nav-item active" : "android-bottom-nav-item"} onClick={() => openHomePanel("reports")}><FiBarChart2 /><span>Reports</span></button>
              <button type="button" className={mobileSidebarOpen ? "android-bottom-nav-item active" : "android-bottom-nav-item"} onClick={() => setMobileSidebarOpen(true)}><FiMoreHorizontal /><span>More</span></button>
            </nav>
          )}
        </div>
      </div>
    </ModuleProvider>
  );
}
export default Layout;
