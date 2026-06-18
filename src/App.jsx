import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import Companies from './pages/masters/Companies';
import Customers from './pages/masters/Customers';
import Vendors from './pages/masters/Vendors';
import ExpenseCategories from './pages/masters/ExpenseCategories';
import AssetCategories from './pages/masters/AssetCategories';
import SalesInvoice from './pages/sales/SalesInvoice';
import Items from './pages/masters/Items';

function App() {
  return (
    <BrowserRouter>

      <Layout>

        <Routes>

          <Route
            path="/"
            element={<Companies />}
          />

        
        <Route path="/customers" element={<Customers />} />

<Route path="/vendors" element={<Vendors />} />

<Route
  path="/expense-categories"
  element={<ExpenseCategories />}
/>

<Route
  path="/asset-categories"
  element={<AssetCategories />}
/>
          <Route
  path="/sales"
  element={<SalesInvoice />}
/>
<Route
  path="/items"
  element={<Items />}
/>
          </Routes>
      </Layout>

    </BrowserRouter>
  );
}

export default App;
