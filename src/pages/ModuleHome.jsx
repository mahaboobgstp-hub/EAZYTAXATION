import {
  FiActivity,
  FiArchive,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiDollarSign,
  FiFileText,
  FiLayers,
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { MODULES, useModule } from "../context/ModuleContext";
import "../css/ModuleHome.css";

const HOME_CONTENT = {
  billing: {
    eyebrow: "FINANCE WORKSPACE",
    description: "Manage invoices, purchases and expenses with a clear view of your accounting work.",
    icon: FiFileText,
    cards: [
      { title: "Sales Invoice", description: "Create and manage customer invoices.", path: "/app/sales", icon: FiFileText },
      { title: "Purchases", description: "Record supplier bills and purchase transactions.", path: "/app/purchases", icon: FiShoppingCart },
      { title: "Expenses", description: "Capture and organize business expenses.", path: "/app/expenses", icon: FiDollarSign },
    ],
  },
  hr: {
    eyebrow: "PEOPLE WORKSPACE",
    description: "Manage your people, attendance and leave information in one place.",
    icon: FiUsers,
    cards: [
      { title: "Employees", description: "Manage employee details and records.", path: "/app/employees", icon: FiUsers },
      { title: "Attendance", description: "Track and review daily attendance.", path: "/app/attendance", icon: FiCalendar },
      { title: "Leave Management", description: "Review leave and employee balances.", path: "/app/leave-management", icon: FiBriefcase },
    ],
  },
  payroll: {
    eyebrow: "PAYROLL WORKSPACE",
    description: "Process payroll, prepare payslips and manage statutory settings.",
    icon: FiDollarSign,
    cards: [
      { title: "Payroll Run", description: "Process employee payroll.", path: "/app/payroll-processing", icon: FiActivity },
      { title: "Payslips", description: "Generate and review employee payslips.", path: "/app/payslips", icon: FiFileText },
      { title: "Statutory Settings", description: "Manage payroll compliance settings.", path: "/app/statutory-configuration", icon: FiCheckCircle },
    ],
  },
  inventory: {
    eyebrow: "INVENTORY WORKSPACE",
    description: "Keep track of your items, units and stock activity.",
    icon: FiPackage,
    cards: [
      { title: "Stock Overview", description: "Stock tracking pages are planned for a future release.", icon: FiLayers, comingSoon: true },
      { title: "Items", description: "Add, update and manage inventory items.", path: "/app/items", icon: FiPackage },
      { title: "Units of Measurement", description: "Manage the units used by your items.", path: "/app/uom", icon: FiClipboard },
    ],
  },
  "supply-chain": {
    eyebrow: "SUPPLY CHAIN WORKSPACE",
    description: "Coordinate suppliers, purchasing and stock movement across your business.",
    icon: FiTruck,
    cards: [
      { title: "Procurement", description: "Purchase order workflows are planned for a future release.", icon: FiShoppingCart, comingSoon: true },
      { title: "Suppliers", description: "View and manage supplier details.", path: "/app/vendors", icon: FiUsers },
      { title: "Transfers", description: "Stock transfers are planned for a future release.", icon: FiArrowRight, comingSoon: true },
    ],
  },
  "gst-tax": {
    eyebrow: "GST COMPLIANCE WORKSPACE",
    description: "Keep GST rates and filing workflows together, with upcoming return tools clearly marked.",
    icon: FiCheckCircle,
    cards: [
      { title: "GST Rates", description: "View and maintain GST rate records.", path: "/app/gst-rates", icon: FiFileText },
      { title: "Return Filing", description: "GST return preparation is planned for a future release.", icon: FiClipboard, comingSoon: true },
      { title: "ITC Reconciliation", description: "ITC reconciliation is planned for a future release.", icon: FiArchive, comingSoon: true },
    ],
  },
};

function ModuleHome() {
  const { activeModule } = useModule();
  const module = MODULES.find((item) => item.id === activeModule) || MODULES[0];
  const content = HOME_CONTENT[activeModule] || HOME_CONTENT.billing;
  const HeroIcon = content.icon;

  return (
    <main className="module-home">
      <section className="module-home-hero" aria-labelledby="module-home-title">
        <div className="module-home-copy">
          <span className="module-home-eyebrow">{content.eyebrow}</span>
          <h1 id="module-home-title">Welcome to<br />{module.label}</h1>
          <p>{content.description}</p>
        </div>
        <div className="module-home-art" aria-hidden="true">
          <span className="module-home-art-orbit module-home-art-orbit-one" />
          <span className="module-home-art-orbit module-home-art-orbit-two" />
          <div className="module-home-art-icon"><HeroIcon /></div>
          <span className="module-home-art-check"><FiCheckCircle /></span>
        </div>
      </section>

      <section className="module-home-section" aria-labelledby="module-home-actions">
        <div className="module-home-section-heading">
          <div>
            <h2 id="module-home-actions">Get started</h2>
            <p>Choose a task to continue in {module.label}.</p>
          </div>
        </div>

        <div className="module-home-cards">
          {content.cards.map((card) => {
            const CardIcon = card.icon;
            const cardBody = (
              <>
                <span className="module-home-card-icon"><CardIcon /></span>
                <span className="module-home-card-title">{card.title}</span>
                <span className="module-home-card-description">{card.description}</span>
                <span className={"module-home-card-action" + (card.comingSoon ? " coming-soon" : "")}>
                  {card.comingSoon ? "Coming soon" : "Open page"}
                  {!card.comingSoon && <FiArrowRight aria-hidden="true" />}
                </span>
              </>
            );

            return card.path ? (
              <Link className="module-home-card" to={card.path} key={card.title}>
                {cardBody}
              </Link>
            ) : (
              <div className="module-home-card module-home-card-disabled" key={card.title} aria-disabled="true">
                {cardBody}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default ModuleHome;
