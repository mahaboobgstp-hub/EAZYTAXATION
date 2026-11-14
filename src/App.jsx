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
import MobileBillingGuard from "./components/MobileBillingGuard";
import AndroidAuthCallback from "./components/AndroidAuthCallback";
import { CompanyProvider } from "./context/CompanyContext";
import Companies from './pages/masters/Companies';
import Customers from './pages/masters/Customers';
import Vendors from './pages/masters/Vendors';
import EmployeeMaster from "./pages/hr/EmployeeMaster";
import EmployeeRegister from "./pages/hr/EmployeeRegister";
import EmployeeSettings from "./pages/hr/EmployeeSettings";
import AttendanceEntry from "./pages/hr/AttendanceEntry";
import AttendanceSettings from "./pages/hr/AttendanceSettings";
import Payslips from "./pages/hr/Payslips";
import EmployeeDocuments from "./pages/hr/EmployeeDocuments";
import DepartmentMaster from "./pages/hr/DepartmentMaster";
import DesignationMaster from "./pages/hr/DesignationMaster";
import ShiftMaster from "./pages/hr/ShiftMaster";
import LocationMaster from "./pages/hr/LocationMaster";
import AttendanceRegister
from "./pages/hr/AttendanceRegister";
import PayrollProcessing
from "./pages/hr/PayrollProcessing";
import PayrollPolicySettings from "./pages/hr/PayrollPolicySettings";
import PayrollPolicyMaster
    from "./pages/hr/PayrollPolicyMaster";
import LeaveManagement from "./pages/hr/LeaveManagement";
import FinalSettlement from "./pages/hr/FinalSettlement";
import LeaveApplication from "./pages/hr/LeaveApplication";
import LeaveApproval from "./pages/hr/LeaveApproval";
import SalaryArrears from "./pages/hr/SalaryArrears";

import ExpenseReimbursement from "./pages/hr/ExpenseReimbursement";
import EmployeeLoansAdvances from "./pages/hr/EmployeeLoansAdvances";
import HolidayCalendarLeaveLedger from "./pages/hr/HolidayCalendarLeaveLedger";
import EmployeeDocumentRepository from "./pages/hr/EmployeeDocumentRepository";
import PerformanceManagement from "./pages/hr/PerformanceManagement";
import HRDashboardReports from "./pages/hr/HRDashboardReports";
import AssetRegister from "./pages/hr/AssetRegister";
import EmployeeAssetAssignment from "./pages/hr/EmployeeAssetAssignment";
import VehicleManagement from "./pages/hr/VehicleManagement";
import AssetMaintenance from "./pages/hr/AssetMaintenance";
import AssetDashboardReports from "./pages/hr/AssetDashboardReports";
import EmployeeSelfService from "./pages/hr/EmployeeSelfService";
import StatutoryConfiguration from "./pages/hr/StatutoryConfiguration";
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
import GSTRates from "./pages/GSTRates";
import BusinessDashboard from "./pages/BusinessDashboard";
import BankingWorkspace from "./pages/banking/BankingWorkspace";
import AccountingWorkspace from "./pages/accounting/AccountingWorkspace";
import GSTR1 from "./pages/gst/GSTR1";
import GSTR2B from "./pages/gst/GSTR2B";
import GSTR3B from "./pages/gst/GSTR3B";
import EwayBills from "./pages/gst/EwayBills";
import GSTDashboard from "./pages/gst/GSTDashboard";
import EInvoiceWorkspace from "./pages/gst/EInvoiceWorkspace";
import ReportsWorkspace from "./pages/reports.jsx";
import SalesWorkspace from "./pages/sales/SalesWorkspace";
import PurchaseWorkspace from "./pages/purchases/PurchaseWorkspace";
import ExpenseRegister from "./pages/expenses/ExpenseRegister";
import AdminWorkspace from "./pages/settings/AdminWorkspace";
import OutstandingWorkspace from "./pages/reports/OutstandingWorkspace";


/* ===========================
   RECRUITMENT MANAGEMENT
=========================== */
import RecruitmentDashboardReports
  from "./pages/hr/RecruitmentDashboardReports";
import JobRequisitionManagement
  from "./pages/hr/JobRequisitionManagement";
import CandidateManagement
  from "./pages/hr/CandidateManagement";
import InterviewManagement
  from "./pages/hr/InterviewManagement";
import OfferManagement
  from "./pages/hr/OfferManagement";

/* ===========================
   TRAINING & DEVELOPMENT
=========================== */
import TrainingDashboardReports
  from "./pages/hr/TrainingDashboardReports";
import TrainingProgramMaster
  from "./pages/hr/TrainingProgramMaster";
import TrainingCalendar
  from "./pages/hr/TrainingCalendar";
import EmployeeTrainingAssignments
  from "./pages/hr/EmployeeTrainingAssignments";
import TrainingAssessmentFeedback
  from "./pages/hr/TrainingAssessmentFeedback";

/* ===========================
   HR BUDGET MANAGEMENT
=========================== */
import HRBudgetDashboardReports
  from "./pages/hr/HRBudgetDashboardReports";
import HRBudgetPlanning
  from "./pages/hr/HRBudgetPlanning";
import HRExpenseTracking
  from "./pages/hr/HRExpenseTracking";
import HRBudgetApprovals
  from "./pages/hr/HRBudgetApprovals";

function App() {

  return (

    <BrowserRouter>

      <CompanyProvider>

      <AndroidAuthCallback />

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
              element={
                <MobileBillingGuard>
                  <Layout />
                </MobileBillingGuard>
              }
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
    path="gst-rates"
    element={<GSTRates />}
/>
<Route path="delivery-challans" element={<SalesWorkspace kind="challans" />} />
<Route path="delivery-challans/new" element={<DeliveryChallan />} />
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
          <Route index element={<BusinessDashboard />} />
          <Route path="dashboard" element={<BusinessDashboard />} />
          <Route path="sales-orders" element={<SalesWorkspace kind="orders" />} />
          <Route path="credit-notes" element={<SalesWorkspace kind="credits" />} />
          <Route path="purchase-register" element={<PurchaseWorkspace kind="register" />} />
          <Route path="purchase-orders" element={<PurchaseWorkspace kind="orders" />} />
          <Route path="purchase-returns" element={<PurchaseWorkspace kind="returns" />} />
          <Route path="debit-notes" element={<PurchaseWorkspace kind="debits" />} />
          <Route path="expense-register" element={<ExpenseRegister />} />

          <Route path="banking/overview" element={<BankingWorkspace />} />
          <Route path="banking/accounts" element={<BankingWorkspace />} />
          <Route path="banking/transactions" element={<BankingWorkspace />} />
          <Route path="banking/cash-book" element={<BankingWorkspace />} />
          <Route path="receipts" element={<BankingWorkspace />} />
          <Route path="payments" element={<BankingWorkspace />} />
          <Route path="contra" element={<BankingWorkspace />} />
          <Route path="bank-reconciliation" element={<BankingWorkspace />} />

          <Route path="accounting" element={<AccountingWorkspace />} />
          <Route path="chart-of-accounts" element={<AccountingWorkspace />} />
          <Route path="journal-voucher" element={<AccountingWorkspace />} />
          <Route path="ledger" element={<AccountingWorkspace />} />
          <Route path="trial-balance" element={<AccountingWorkspace />} />
          <Route path="profit-loss" element={<AccountingWorkspace />} />
          <Route path="balance-sheet" element={<AccountingWorkspace />} />

          <Route path="gst-dashboard" element={<GSTDashboard />} />
          <Route path="gstr1" element={<GSTR1 />} />
          <Route path="gstr2b" element={<GSTR2B />} />
          <Route path="gstr3b" element={<GSTR3B />} />
          <Route path="eway-bills" element={<EwayBills />} />
          <Route path="einvoice" element={<EInvoiceWorkspace />} />

          <Route path="sales-reports" element={<ReportsWorkspace kind="sales" />} />
          <Route path="purchase-reports" element={<ReportsWorkspace kind="purchases" />} />
          <Route path="expense-reports" element={<ReportsWorkspace kind="expenses" />} />
          <Route path="customer-ledger" element={<ReportsWorkspace kind="customer" />} />
          <Route path="vendor-ledger" element={<ReportsWorkspace kind="vendor" />} />
          <Route path="item-ledger" element={<ReportsWorkspace kind="item" />} />
          <Route path="gst-reports" element={<ReportsWorkspace kind="gst" />} />
          <Route path="reports/receivables" element={<OutstandingWorkspace kind="customer" />} />
          <Route path="reports/payables" element={<OutstandingWorkspace kind="vendor" />} />

          <Route path="company-profile" element={<AdminWorkspace />} />
          <Route path="financial-year-tax" element={<AdminWorkspace />} />
          <Route path="user-profile" element={<AdminWorkspace />} />
          <Route path="users-access" element={<AdminWorkspace />} />
          <Route path="roles-permissions" element={<AdminWorkspace />} />
          <Route path="data-backup" element={<AdminWorkspace />} />
          <Route path="application-settings" element={<AdminWorkspace />} />
          <Route path="payment-terms" element={<AdminWorkspace />} />

<Route
    path="attendance-settings"
    element={<AttendanceSettings />}
/>
          <Route path="sales-register" element={<SalesWorkspace kind="register" />} />

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
          <Route
    path="employees"
    element={<EmployeeMaster />}
/>
<Route
    path="employee-register"
    element={<EmployeeRegister />}
/>
<Route
  path="employee-settings"
  element={<EmployeeSettings />}
/>
            
<Route
    path="attendance"
    element={<AttendanceEntry />}
/>
          <Route
    path="attendance-register"
    element={<AttendanceRegister />}
/>
<Route
    path="departments"
    element={<DepartmentMaster />}
/>
          <Route
    path="designations"
    element={<DesignationMaster />}
/>
<Route path="payslips" element={<Payslips />} />
<Route
    path="employee-documents"
    element={<EmployeeDocuments />}
/>
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="final-settlement" element={<FinalSettlement />} />
            <Route
  path="leave-application"
  element={<LeaveApplication />}
/>

<Route
  path="leave-approval"
  element={<LeaveApproval />}
/>
            
<Route
  path="employee-document-repository"
  element={<EmployeeDocumentRepository />}
    
/>
            <Route
  path="performance-management"
  element={<PerformanceManagement />}
/>
<Route
  path="expense-reimbursement"
  element={<ExpenseReimbursement />}
    />
      
  <Route
  path="employee-loans-advances"
  element={<EmployeeLoansAdvances />}
/>          
<Route
    path="shifts"
    element={<ShiftMaster />}
/>
          <Route
    path="locations"
    element={<LocationMaster />}
/>
          <Route
    path="payroll-processing"
    element={<PayrollProcessing />}
/>

            
<Route
  path="salary-arrears"
  element={<SalaryArrears />}
/>

          <Route
    path="payroll-policy-settings"
    element={<PayrollPolicySettings />}
/>

          <Route
    path="payroll-policy-master"
    element={
        <PayrollPolicyMaster />
    }
/>
            <Route
    path="statutory-configuration"
    element={<StatutoryConfiguration />}
/>
            <Route
  path="holiday-calendar-leave-ledger"
  element={<HolidayCalendarLeaveLedger />}
/>

            <Route
  path="hr-dashboard-reports"
  element={<HRDashboardReports />}
/>

            <Route
  path="employee-self-service"
  element={<EmployeeSelfService />}
/>
            {/* Employee Asset Management */}
<Route
  path="asset-register"
  element={<AssetRegister />}
/>

<Route
  path="employee-asset-assignment"
  element={<EmployeeAssetAssignment />}
/>

<Route
  path="vehicle-management"
  element={<VehicleManagement />}
/>

<Route
  path="asset-maintenance"
  element={<AssetMaintenance />}
/>

<Route
  path="asset-dashboard-reports"
  element={<AssetDashboardReports />}
/>
            
{/* ===========================
    RECRUITMENT MANAGEMENT
=========================== */}
<Route
  path="recruitment-dashboard-reports"
  element={<RecruitmentDashboardReports />}
/>

<Route
  path="job-requisition-management"
  element={<JobRequisitionManagement />}
/>

<Route
  path="candidate-management"
  element={<CandidateManagement />}
/>

<Route
  path="interview-management"
  element={<InterviewManagement />}
/>

<Route
  path="offer-management"
  element={<OfferManagement />}
/>

{/* ===========================
    TRAINING & DEVELOPMENT
=========================== */}
<Route
  path="training-dashboard-reports"
  element={<TrainingDashboardReports />}
/>

<Route
  path="training-program-master"
  element={<TrainingProgramMaster />}
/>

<Route
  path="training-calendar"
  element={<TrainingCalendar />}
/>

<Route
  path="employee-training-assignments"
  element={<EmployeeTrainingAssignments />}
/>

<Route
  path="training-assessment-feedback"
  element={<TrainingAssessmentFeedback />}
/>

{/* ===========================
    HR BUDGET MANAGEMENT
=========================== */}
<Route
  path="hr-budget-dashboard-reports"
  element={<HRBudgetDashboardReports />}
/>

<Route
  path="hr-budget-planning"
  element={<HRBudgetPlanning />}
/>

<Route
  path="hr-expense-tracking"
  element={<HRExpenseTracking />}
/>

<Route
  path="hr-budget-approvals"
  element={<HRBudgetApprovals />}
/>

        </Route>
        
      </Routes>

        </CompanyProvider>
    </BrowserRouter>

  );

}

export default App;
