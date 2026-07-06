import { Outlet } from "react-router-dom";
import Sidebar from './Sidebar';
import Header from './Header';

import '../css/Layout.css';

function Layout() {
  return (
    <div className="layout">

      <Sidebar />

      <div className="main-container">
        <Header />
        <div className="page-content">
          <Outlet />
        </div>
      </div>

    </div>
  );
}

export default Layout;
