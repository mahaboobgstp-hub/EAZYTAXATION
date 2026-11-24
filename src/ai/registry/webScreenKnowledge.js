/**
 * SYD Intelligence — verified web screen knowledge registry.
 * Routes are taken from the current App.jsx route table. Field mappings are
 * intentionally withheld until the screen's actual form controls are audited.
 */
import { registerScreenDefinition, listScreenDefinitions } from "./screenRegistry";
import { registerSYDWebFieldKnowledge } from "./webFieldKnowledge";

const WEB_SCREENS = [
  { screenId:"dashboard", name:"Business Dashboard", module:"Dashboard", route:"/app/dashboard", description:"Business dashboard and company overview." },
  { screenId:"sales_invoice", name:"Sales Invoice", module:"Sales", route:"/app/sales", description:"Create and manage sales invoices." },
  { screenId:"sales_register", name:"Sales Register", module:"Sales", route:"/app/sales-register", description:"Review and manage sales transactions." },
  { screenId:"quotation", name:"Quotations", module:"Sales", route:"/app/quotation", description:"Prepare and manage customer quotations." },
  { screenId:"sales_orders", name:"Sales Orders", module:"Sales", route:"/app/sales-orders", description:"Prepare and manage sales orders." },
  { screenId:"delivery_challans", name:"Delivery Challans", module:"Sales", route:"/app/delivery-challans", description:"Manage delivery challans." },
  { screenId:"credit_notes", name:"Credit Notes", module:"Sales", route:"/app/credit-notes", description:"Create and review sales credit notes." },
  { screenId:"purchase_invoice", name:"Purchase Invoice", module:"Purchases", route:"/app/purchases", description:"Enter supplier purchase invoices." },
  { screenId:"purchase_register", name:"Purchase Register", module:"Purchases", route:"/app/purchase-register", description:"Review purchase transactions." },
  { screenId:"purchase_orders", name:"Purchase Orders", module:"Purchases", route:"/app/purchase-orders", description:"Prepare and manage purchase orders." },
  { screenId:"purchase_returns", name:"Purchase Returns", module:"Purchases", route:"/app/purchase-returns", description:"Manage purchase returns." },
  { screenId:"debit_notes", name:"Debit Notes", module:"Purchases", route:"/app/debit-notes", description:"Manage purchase debit notes." },
  { screenId:"expense_entry", name:"Expense Entry", module:"Expenses", route:"/app/expenses", description:"Enter business expenses." },
  { screenId:"expense_register", name:"Expense Register", module:"Expenses", route:"/app/expense-register", description:"Review recorded expenses." },
  { screenId:"expense_payments", name:"Expense Payments", module:"Expenses", route:"/app/payments", description:"Manage expense payments." },
  { screenId:"receipts", name:"Receipts", module:"Cash & Bank", route:"/app/receipts", description:"Record receipts from customers or other sources." },
  { screenId:"banking", name:"Banking Workspace", module:"Cash & Bank", route:"/app/banking", description:"Bank accounts, statement import, classification and reconciliation." },
  { screenId:"accounting", name:"Accounting Workspace", module:"Accounting", route:"/app/accounting", description:"Accounting workspace and reports." },
  { screenId:"accounting_mappings", name:"Accounting Mappings", module:"Accounting", route:"/app/accounting-mappings", description:"Configure accounting mappings." },
  { screenId:"cash_accounts", name:"Cash Accounts", module:"Accounting", route:"/app/cash-accounts", description:"Manage cash and bank accounting accounts." },
  { screenId:"customers", name:"Customer Master", module:"Masters", route:"/app/customers", description:"Create and manage customers." },
  { screenId:"vendors", name:"Supplier Master", module:"Masters", route:"/app/vendors", description:"Create and manage suppliers." },
  { screenId:"items", name:"Items Master", module:"Masters", route:"/app/items", description:"Create and manage products and services." },
  { screenId:"companies", name:"Company Master", module:"Masters", route:"/app/companies", description:"Configure companies and business settings." },
  { screenId:"gst_reports", name:"GST Reports", module:"GST & Tax", route:"/app/gst-reports", description:"GST reporting and reconciliation." },
  { screenId:"gstr1", name:"GSTR-1", module:"GST & Tax", route:"/app/gstr1", description:"GSTR-1 report and filing preparation." },
  { screenId:"gstr3b", name:"GSTR-3B", module:"GST & Tax", route:"/app/gstr3b", description:"GSTR-3B report and filing preparation." },
  { screenId:"gstr2b", name:"GSTR-2B", module:"GST & Tax", route:"/app/gstr2b", description:"GSTR-2B reconciliation." },
  { screenId:"eway_bills", name:"E-Way Bills", module:"GST & Tax", route:"/app/eway-bills", description:"E-way bill workflow." },
];

export function registerSYDWebScreens() {
  for (const screen of WEB_SCREENS) {
    registerScreenDefinition({ ...screen, platformSupport:["web"], status:"active" }, { replace:true });
  }
  registerSYDWebFieldKnowledge();
  return listScreenDefinitions().filter(screen => screen.platformSupport.includes("web"));
}
export function getSYDWebScreenByRoute(pathname) {
  return WEB_SCREENS.find(screen => screen.route === pathname) || null;
}
export function getSYDWebScreenKnowledge() {
  return WEB_SCREENS.map(screen => ({ ...screen }));
}
