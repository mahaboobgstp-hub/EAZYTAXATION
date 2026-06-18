import { Link } from 'react-router-dom';
import '../css/Sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">

      <h2 className="logo">
        EAZYTAXATION
      </h2>

      <ul>

        <li>
          <Link to="/">Companies</Link>
        </li>

        <li>
          <Link to="/customers">Customers</Link>
        </li>

        <li>
          <Link to="/vendors">Vendors</Link>
        </li>

        <li>
          <Link to="/sales">Sales</Link>
        </li>

        <li>
          <Link to="/purchases">Purchases</Link>
        </li>

        <li>
          <Link to="/expenses">Expenses</Link>
        </li>

        <li>
          <Link to="/reports">Reports</Link>
        </li>
        
         <li>
        <Link to="/asset-categories">Asset Categories</Link>
         </li>
      </ul>

    </div>
  );
}

export default Sidebar;
