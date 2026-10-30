import { Navigate, useLocation } from "react-router-dom";
import { isAndroidApp } from "../utils/platform";

// Only implemented Billing & Accounting routes are permitted
// in the Android application.
const MOBILE_BILLING_ROUTES = new Set([
  "/app/companies",
  "/app/customers",
  "/app/vendors",
  "/app/expense-categories",
  "/app/sales",
  "/app/gst-rates",
  "/app/delivery-challans",
  "/app/quotation",
  "/app/purchases",
  "/app/expenses",
  "/app/sales-register",
  "/app/invoice-settings",
  "/app/items",
  "/app/uom",
]);

function MobileBillingGuard({ children }) {
  const location = useLocation();

  // Never restrict the normal web application.
  if (!isAndroidApp) {
    return children;
  }

  // Keep Android users inside the approved Billing module.
  if (!MOBILE_BILLING_ROUTES.has(location.pathname)) {
    return <Navigate to="/app/companies" replace />;
  }

  return children;
}

export default MobileBillingGuard;
