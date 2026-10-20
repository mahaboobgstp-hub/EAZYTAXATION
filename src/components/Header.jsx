
import { useModule } from "../context/ModuleContext";
import "../css/Header.css";

const modules = [
  { id: "billing", label: "Billing & Accounting" },
  { id: "hr", label: "HR & Payroll" },
  { id: "inventory", label: "Inventory Management" },
  { id: "supply-chain", label: "Supply Chain" },
];

function Header() {
  const { activeModule, setActiveModule } = useModule();

  return (
    <header className="header">
      <div className="header-brand">
        <h3>EAZYTAXATION ERP</h3>
        <span>Enterprise Resource Planning</span>
      </div>

      <nav
        className="module-switcher"
        aria-label="ERP modules"
      >
        {modules.map((module) => (
          <button
            key={module.id}
            type="button"
            className={`module-button ${
              activeModule === module.id ? "active" : ""
            }`}
            aria-pressed={activeModule === module.id}
            onClick={() => setActiveModule(module.id)}
          >
            {module.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

export default Header;
