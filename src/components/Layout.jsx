
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ModuleProvider } from "../context/ModuleContext";
import "../css/Layout.css";

function Layout() {
  return (
    <ModuleProvider>
      <div className="layout">
        <Sidebar />

        <div className="main-container">
          <Header />

          <div className="page-content">
            <Outlet />
          </div>
        </div>
      </div>
    </ModuleProvider>
  );
}

export default Layout;
