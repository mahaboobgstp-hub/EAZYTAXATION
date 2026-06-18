import Sidebar from './Sidebar';
import Header from './Header';

import '../css/Layout.css';

function Layout({ children }) {
  return (
    <div className="layout">

      <Sidebar />

      <div className="main-container">
        <Header />
        <div className="page-content">
          {children}
        </div>
      </div>

    </div>
  );
}

export default Layout;
