import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from "./pages/landing/Landing";
import Features from "./pages/features/Features";
import Pricing from "./pages/pricing/Pricing";
import About from "./pages/about/About";
import Contact from "./pages/contact/Contact";
import PrivacyPolicy from "./pages/privacy/PrivacyPolicy";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Layout from './components/Layout';
import { CompanyProvider } from "./context/CompanyContext";
import Companies from './pages/masters/Companies';
import Customers from './pages/masters/Customers';
import Vendors from './pages/masters/Vendors';
import EmployeeMaster from "./pages/hr/EmployeeMaster";
import AttendanceEntry from "./pages/hr/AttendanceEntry";
import ExpenseCategories from './pages/masters/ExpenseCategories';
import AssetCategories from './pages/masters/AssetCategories';
import SalesInvoice from './pages/sales/SalesInvoice';
import DeliveryChallan from "./pages/sales/DeliveryChallan";
import ExpenseEntry from "./pages/expenses/ExpenseEntry";
import Quotation from "./pages/quotations/Quotation";
import Items from './pages/masters/Items';
import Uom from './pages/masters/Uom';
import InvoiceSettings
from './pages/settings/InvoiceSettings';
import PurchaseInvoice from "./pages/PurchaseInvoice/PurchaseInvoice";
import SalesRegister from "./pages/sales/SalesRegister";

function App() {

  return (

    <BrowserRouter>

      <CompanyProvider>
      <Routes>

        {/* ===========================
            PUBLIC ROUTES
        =========================== */}

        <Route
          path="/"
          element={<Landing />}
        />
        <Route
    path="/features"
    element={<Features />}
/>

<Route
    path="/pricing"
    element={<Pricing />}
/>

<Route
    path="/about"
    element={<About />}
/>

<Route
    path="/contact"
    element={<Contact />}
/>
        <Route
    path="/privacy-policy"
    element={<PrivacyPolicy />}
/>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* ===========================
            ERP ROUTES
        =========================== */}

        <Route
          path="/app"
          element={<Layout />}
        >

          <Route
            path="/app/companies"
            element={<Companies />}
          />

          

          <Route
            path="customers"
            element={<Customers />}
          />

          <Route
            path="vendors"
            element={<Vendors />}
          />

          <Route
            path="expense-categories"
            element={<ExpenseCategories />}
          />

          <Route
            path="asset-categories"
            element={<AssetCategories />}
          />

          <Route
            path="sales"
            element={<SalesInvoice />}
          />
<Route
  path="delivery-challans"
  element={<DeliveryChallan />}
/>
          <Route
            path="quotation"
            element={<Quotation />}
          />

          <Route
            path="purchases"
            element={<PurchaseInvoice />}
          />

          <Route
            path="expenses"
            element={<ExpenseEntry />}
          />

          <Route
            path="sales-register"
            element={<SalesRegister />}
          />

          <Route
            path="invoice-settings"
            element={<InvoiceSettings />}
          />

          <Route
            path="items"
            element={<Items />}
          />
          <Route
    path="uom"
    element={<Uom />}
/>

        </Route>
        <Route
    path="employees"
    element={<EmployeeMaster />}
/>

<Route
    path="attendance"
    element={<AttendanceEntry />}
/>

      </Routes>

        </CompanyProvider>
    </BrowserRouter>

  );

}

export default App;
