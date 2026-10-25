
import { useEffect, useMemo, useState } from "react";
import "../../css/hr/EmployeeSettings.css";
import { useCompany } from "../../context/CompanyContext";
import {
  getSalaryComponents,
  createSalaryComponent,
  updateSalaryComponent,
  activateSalaryComponent,
  deactivateSalaryComponent,
} from "../../services/hr/salaryComponentService";
import {
  getEmployeeIdSettings,
  saveEmployeeIdSettings,
} from "../../services/hr/employeeIdSettingsService";


const initialSettings = {
  format: "{COMP}{SEQ}",
  companyCode: "VAR",
  startingNumber: "1",
  sequenceDigits: "5",
  generationMode: "auto-edit",
  allowManualOverride: true,
  checkDuplicate: true,
  showPreview: true,
};

const tabs = [
  { id: "id", label: "Employee ID Settings", icon: "▤" },
  { id: "salary-components", label: "Salary Components", icon: "₹" },
  { id: "general", label: "General Settings", icon: "⚙" },
  { id: "documents", label: "Documents Settings", icon: "▧" },
  { id: "statutory", label: "Statutory Settings", icon: "◇" },
  { id: "leave", label: "Leave Settings", icon: "▦" },
  { id: "other", label: "Other Settings", icon: "•••" },
];

function makeEmployeeId(settings, sequence) {
  const digits = Math.max(
    1,
    Math.min(12, Number(settings.sequenceDigits) || 5)
  );

  const paddedSequence = String(sequence).padStart(digits, "0");

  return settings.format
    .replaceAll("{COMP}", settings.companyCode.trim().toUpperCase())
    .replaceAll("{SEQ}", paddedSequence);
}

function Field({ label, help, children, required = false }) {
  return (
    <div className="employee-settings-field">
      <label>
        {label}
        {required && <span className="es-required"> *</span>}
      </label>
      {children}
      {help && <small>{help}</small>}
    </div>
  );
}

function SettingSwitch({ title, description, checked, onChange }) {
  return (
    <div className="es-switch-row">
      <div className="es-switch-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`es-switch ${checked ? "is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}


function SalaryComponentsPanel() {
  const { currentCompanyId, loading: companyLoading } = useCompany();

  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const emptyForm = {
    component_code: "",
    component_name: "",
    component_category: "EARNING",
    calculation_type: "FIXED",
    percentage_base: "",
    default_amount: "0",
    default_percentage: "",
    affects_pf: false,
    affects_esi: false,
    affects_pt: false,
    affects_tds: false,
    display_order: "0",
    description: "",
    is_active: true,
  };

  const [form, setForm] = useState(emptyForm);

  async function loadComponents() {
    if (!currentCompanyId) {
      setComponents([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getSalaryComponents(currentCompanyId, true);
      setComponents(data);
    } catch (err) {
      setError(err.message || "Unable to load salary components.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComponents();
  }, [currentCompanyId]);

  function changeField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
    setError("");
  }

  function startEdit(component) {
    setEditingId(component.id);

    setForm({
      component_code: component.component_code || "",
      component_name: component.component_name || "",
      component_category: component.component_category,
      calculation_type: component.calculation_type,
      percentage_base: component.percentage_base || "",
      default_amount: String(component.default_amount ?? 0),
      default_percentage:
        component.default_percentage == null
          ? ""
          : String(component.default_percentage),
      affects_pf: component.affects_pf,
      affects_esi: component.affects_esi,
      affects_pt: component.affects_pt,
      affects_tds: component.affects_tds,
      display_order: String(component.display_order ?? 0),
      description: component.description || "",
      is_active: component.is_active,
    });

    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!currentCompanyId) {
      setError("Please select a company first.");
      return;
    }

    if (!form.component_code.trim() || !form.component_name.trim()) {
      setError("Component code and component name are required.");
      return;
    }

    const amount = Number(form.default_amount);
    const percentage =
      form.default_percentage === ""
        ? null
        : Number(form.default_percentage);

    if (!Number.isFinite(amount) || amount < 0) {
      setError("Default amount must be zero or greater.");
      return;
    }

    if (
      percentage !== null &&
      (!Number.isFinite(percentage) || percentage < 0)
    ) {
      setError("Default percentage must be zero or greater.");
      return;
    }

    if (form.calculation_type === "PERCENTAGE" && percentage === null) {
      setError("Enter a default percentage for percentage-based components.");
      return;
    }

    if (
      form.calculation_type === "PERCENTAGE" &&
      !form.percentage_base
    ) {
      setError("Choose the base used to calculate the percentage.");
      return;
    }

    const payload = {
      ...form,
      default_amount: amount,
      default_percentage: percentage,
      display_order: Number(form.display_order) || 0,
      percentage_base:
        form.calculation_type === "PERCENTAGE"
          ? form.percentage_base
          : null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateSalaryComponent(
          editingId,
          currentCompanyId,
          payload
        );
        setMessage("Salary component updated successfully.");
      } else {
        await createSalaryComponent(currentCompanyId, payload);
        setMessage("Salary component created successfully.");
      }

      const wasEditing = Boolean(editingId);
resetForm();
await loadComponents();
setMessage(
  wasEditing
    ? "Salary component updated successfully."
    : "Salary component created successfully."
);
    } catch (err) {
      setError(
        err.code === "23505"
          ? "This component code or name already exists for this company."
          : err.message || "Unable to save salary component."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(component) {
    setMessage("");
    setError("");

    try {
      if (component.is_active) {
        await deactivateSalaryComponent(component.id, currentCompanyId);
      } else {
        await activateSalaryComponent(component.id, currentCompanyId);
      }

      await loadComponents();
      setMessage(
        component.is_active
          ? "Component deactivated. Existing records have not been deleted."
          : "Component activated successfully."
      );
    } catch (err) {
      setError(err.message || "Unable to change component status.");
    }
  }

  const visibleComponents = components.filter(
    (component) => showInactive || component.is_active
  );

  if (companyLoading) {
    return <section className="es-card">Loading company information...</section>;
  }

  if (!currentCompanyId) {
    return (
      <section className="es-card">
        <h2>Select a company</h2>
        <p>Select a company from the application company selector to manage its salary components.</p>
      </section>
    );
  }

  return (
    <div className="es-salary-components">
      <section className="es-card">
        <div className="es-card-heading">
          <h2>{editingId ? "Edit Salary Component" : "Add Salary Component"}</h2>
          <p>
            Configure salary heads for the selected company. Deactivating a
            component does not delete existing salary records.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="es-component-form-grid">
            <Field label="Component Code" required>
              <input
                name="component_code"
                value={form.component_code}
                onChange={changeField}
                placeholder="BASIC"
                maxLength={40}
                required
              />
            </Field>

            <Field label="Component Name" required>
              <input
                name="component_name"
                value={form.component_name}
                onChange={changeField}
                placeholder="Basic Salary"
                maxLength={100}
                required
              />
            </Field>

            <Field label="Category" required>
              <select
                name="component_category"
                value={form.component_category}
                onChange={changeField}
              >
                <option value="EARNING">Earnings</option>
                <option value="EMPLOYEE_DEDUCTION">Employee Deduction</option>
                <option value="EMPLOYER_CONTRIBUTION">Employer Contribution</option>
                <option value="REIMBURSEMENT">Reimbursement</option>
              </select>
            </Field>

            <Field label="Calculation Method" required>
              <select
                name="calculation_type"
                value={form.calculation_type}
                onChange={changeField}
              >
                <option value="FIXED">Fixed Amount</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </Field>

            {form.calculation_type === "PERCENTAGE" && (
              <Field label="Percentage Base" required>
                <select
                  name="percentage_base"
                  value={form.percentage_base}
                  onChange={changeField}
                  required
                >
                  <option value="">Select base</option>
                  <option value="BASIC">Basic Salary</option>
                  <option value="GROSS">Gross Earnings</option>
                  <option value="CTC">CTC</option>
                </select>
              </Field>
            )}

            <Field label="Default Monthly Amount (₹)">
              <input
                name="default_amount"
                type="number"
                min="0"
                step="0.01"
                value={form.default_amount}
                onChange={changeField}
              />
            </Field>

            {form.calculation_type === "PERCENTAGE" && (
              <Field label="Default Percentage (%)" required>
                <input
                  name="default_percentage"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.default_percentage}
                  onChange={changeField}
                  required
                />
              </Field>
            )}

            <Field label="Display Order">
              <input
                name="display_order"
                type="number"
                step="1"
                value={form.display_order}
                onChange={changeField}
              />
            </Field>

            <Field label="Description">
              <input
                name="description"
                value={form.description}
                onChange={changeField}
                placeholder="Optional notes"
                maxLength={500}
              />
            </Field>
          </div>

          <div className="es-component-flags">
            <label>
              <input
                type="checkbox"
                name="affects_pf"
                checked={form.affects_pf}
                onChange={changeField}
              />
              Include in PF calculation base
            </label>

            <label>
              <input
                type="checkbox"
                name="affects_esi"
                checked={form.affects_esi}
                onChange={changeField}
              />
              Include in ESI calculation base
            </label>

            <label>
              <input
                type="checkbox"
                name="affects_pt"
                checked={form.affects_pt}
                onChange={changeField}
              />
              Include in professional-tax base
            </label>

            <label>
              <input
                type="checkbox"
                name="affects_tds"
                checked={form.affects_tds}
                onChange={changeField}
              />
              Include in TDS calculation base
            </label>

            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={changeField}
              />
              Active component
            </label>
          </div>

          {error && <div className="es-message error" role="alert">{error}</div>}
          {message && <div className="es-message success" role="status">{message}</div>}

          <div className="es-actions">
            {editingId && (
              <button
                type="button"
                className="es-button secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              className="es-button primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Component"
                  : "Add Component"}
            </button>
          </div>
        </form>
      </section>

      <section className="es-card">
        <div className="es-card-heading es-components-list-heading">
          <div>
            <h2>Configured Salary Components</h2>
            <p>{visibleComponents.length} component(s) shown</p>
          </div>

          <label className="es-inactive-filter">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            Show inactive
          </label>
        </div>

        {loading ? (
          <p>Loading salary components...</p>
        ) : visibleComponents.length === 0 ? (
          <p>No components found. Add your first salary component above.</p>
        ) : (
          <div className="es-components-table-wrap">
            <table className="es-components-table">
              <thead>
                <tr>
                  <th>Code / Name</th>
                  <th>Category</th>
                  <th>Method</th>
                  <th>Default</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleComponents.map((component) => (
                  <tr key={component.id}>
                    <td>
                      <strong>{component.component_code}</strong>
                      <small>{component.component_name}</small>
                    </td>
                    <td>{component.component_category.replaceAll("_", " ")}</td>
                    <td>
                      {component.calculation_type === "PERCENTAGE"
                        ? `Percentage${component.percentage_base ? ` of ${component.percentage_base}` : ""}`
                        : "Fixed"}
                    </td>
                    <td>
                      ₹{Number(component.default_amount || 0).toLocaleString("en-IN")}
                      {component.calculation_type === "PERCENTAGE" &&
                        ` / ${component.default_percentage ?? 0}%`}
                    </td>
                    <td>
                      <span className={component.is_active ? "es-component-active" : "es-component-inactive"}>
                        {component.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="es-component-actions">
                        <button
                          type="button"
                          className="es-button secondary"
                          onClick={() => startEdit(component)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="es-button secondary"
                          onClick={() => toggleActive(component)}
                        >
                          {component.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}



  export default function EmployeeSettings() {
  const { currentCompanyId, loading: companyLoading } = useCompany();

  const [activeTab, setActiveTab] = useState("id");
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

      useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (companyLoading) return;

      if (!currentCompanyId) {
        setSettings({ ...initialSettings });
        setError("Please select a company.");
        return;
      }

      setLoadingSettings(true);
      setError("");
      setMessage("");

      try {
        const savedSettings =
          await getEmployeeIdSettings(currentCompanyId);

        if (cancelled) return;

        setSettings(
          savedSettings || { ...initialSettings }
        );

        if (!savedSettings) {
          setMessage(
            "No Employee ID Settings exist for this company yet. Configure and save them."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load Employee ID Settings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSettings(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [currentCompanyId, companyLoading]);
  const updateSetting = (name, value) => {
    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));
    setMessage("");
  };

  const preview = useMemo(() => {
    return makeEmployeeId(
      settings,
      Math.max(1, Number(settings.startingNumber) || 1)
    );
  }, [settings]);

  const validateSettings = () => {
    if (!settings.companyCode.trim()) {
      setMessage("Please enter a company code.");
      return false;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(settings.companyCode.trim())) {
      setMessage(
        "Company code can contain only letters, numbers, hyphens and underscores."
      );
      return false;
    }

    if (!settings.format.includes("{COMP}") ||
        !settings.format.includes("{SEQ}")) {
      setMessage(
        "The format must include both {COMP} and {SEQ}."
      );
      return false;
    }

    if (!/^\d+$/.test(settings.startingNumber) ||
        Number(settings.startingNumber) < 1) {
      setMessage("Starting number must be a positive whole number.");
      return false;
    }

    if (!/^[1-9]\d*$/.test(settings.sequenceDigits) ||
        Number(settings.sequenceDigits) > 12) {
      setMessage("Sequence digits must be between 1 and 12.");
      return false;
    }

    if (preview.length > 50) {
      setMessage("The preview ID exceeds the 50-character limit.");
      return false;
    }

    return true;
  };

    const handleSave = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (companyLoading || !currentCompanyId) {
      setError("Please select a company before saving.");
      return;
    }

    if (!validateSettings()) {
      setError(message);
      setMessage("");
      return;
    }

    setSavingSettings(true);

    try {
      const saved = await saveEmployeeIdSettings(
        currentCompanyId,
        settings
      );

      setSettings(saved);
      setMessage("Employee ID Settings saved successfully.");
      setError("");
    } catch (err) {
      setError(
        err.message || "Unable to save Employee ID Settings."
      );
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="employee-settings-page">
      <div className="es-page-heading">
        <div>
          <div className="es-eyebrow">HR MANAGEMENT</div>
          <h1>Employee Settings</h1>
          <p>Configure employee-related rules for your organization.</p>
        </div>

        <div className="es-breadcrumb">
          Home <span>›</span> HR Management <span>›</span> Employee Settings
        </div>
      </div>

      <div className="es-tabs" role="tablist" aria-label="Employee settings">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => {
              setActiveTab(tab.id);
              setMessage("");
            }}
          >
            <span className="es-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "salary-components" ? (
  <SalaryComponentsPanel />
) : activeTab === "id" ? (
        <form className="es-workspace" onSubmit={handleSave}>
          <div className="es-information-banner">
            <div className="es-info-icon">i</div>
            <div>
              <strong>Employee ID Settings</strong>
              <p>
                Configure the employee ID format and generation rules.
                Existing employee IDs will not be changed by future settings.
              </p>
            </div>
          </div>

          <div className="es-main-grid">
            <div className="es-left-column">
              <section className="es-card">
                <div className="es-card-heading">
                  <h2>ID Format Configuration</h2>
                  <p>
                    Define the format used for new employee IDs.
                  </p>
                </div>

                <div className="es-format-row">
                  <Field
                    label="Employee ID Format"
                    required
                    help="Use {COMP} for company code and {SEQ} for sequence."
                  >
                    <input
                      value={settings.format}
                      onChange={(event) =>
                        updateSetting("format", event.target.value)
                      }
                      placeholder="{COMP}{SEQ}"
                      maxLength={50}
                    />
                  </Field>

                  <div className="es-preview-card">
                    <span>Live Example</span>
                    <strong>{preview || "—"}</strong>
                    <small>Preview only; no number is reserved.</small>
                  </div>
                </div>

                <div className="es-placeholder-section">
                  <label>Available Placeholders</label>
                  <div className="es-placeholder-list">
                    <button
                      type="button"
                      onClick={() =>
                        updateSetting(
                          "format",
                          settings.format + "{COMP}"
                        )
                      }
                    >
                      <b>{"{COMP}"}</b> Company Code
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateSetting(
                          "format",
                          settings.format + "{SEQ}"
                        )
                      }
                    >
                      <b>{"{SEQ}"}</b> Sequential Number
                    </button>
                  </div>
                  <small>
                    Your selected format requires both placeholders.
                    Other placeholders can be considered in a future version.
                  </small>
                </div>
              </section>

              <section className="es-card">
                <div className="es-card-heading">
                  <h2>Sequence Settings</h2>
                  <p>
                    Configure the sequence used for automatic ID generation.
                  </p>
                </div>

                <div className="es-form-grid">
                  <Field
                    label="Company Code"
                    required
                    help="Example: VAR, AF or PGP."
                  >
                    <input
                      value={settings.companyCode}
                      onChange={(event) =>
                        updateSetting("companyCode", event.target.value)
                      }
                      maxLength={15}
                      placeholder="VAR"
                    />
                  </Field>

                  <Field
                    label="Starting Number"
                    required
                    help="Initial sequence value; not the live next ID."
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={settings.startingNumber}
                      onChange={(event) =>
                        updateSetting("startingNumber", event.target.value)
                      }
                    />
                  </Field>

                  <Field
                    label="Sequence Digits"
                    required
                    help="Example: 5 gives 00001."
                  >
                    <select
                      value={settings.sequenceDigits}
                      onChange={(event) =>
                        updateSetting("sequenceDigits", event.target.value)
                      }
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((number) => (
                        <option key={number} value={number}>
                          {number} digits
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Reset Sequence"
                    help="Your chosen rule is continuous numbering."
                  >
                    <input value="Never (Continuous)" readOnly />
                  </Field>
                </div>

                <div className="es-note">
                  <strong>Continuous sequence</strong>
                  <p>
                    The sequence will not reset each year. A future database
                    allocator will determine the actual next available ID.
                  </p>
                </div>
              </section>
            </div>

            <div className="es-right-column">
              <section className="es-card">
                <div className="es-card-heading">
                  <h2>ID Generation Rules</h2>
                  <p>Control how employee IDs are assigned.</p>
                </div>

                <div className="es-mode-options">
                  <label className="es-mode-option">
                    <input
                      type="radio"
                      name="generationMode"
                      checked={settings.generationMode === "auto"}
                      onChange={() =>
                        updateSetting("generationMode", "auto")
                      }
                    />
                    <span>
                      <strong>Auto-generate</strong>
                      <small>
                        Generate employee IDs automatically.
                      </small>
                    </span>
                  </label>

                  <label className="es-mode-option">
                    <input
                      type="radio"
                      name="generationMode"
                      checked={settings.generationMode === "manual"}
                      onChange={() =>
                        updateSetting("generationMode", "manual")
                      }
                    />
                    <span>
                      <strong>Manual Entry</strong>
                      <small>
                        Allow users to enter employee IDs manually.
                      </small>
                    </span>
                  </label>

                  <label className="es-mode-option">
                    <input
                      type="radio"
                      name="generationMode"
                      checked={settings.generationMode === "auto-edit"}
                      onChange={() =>
                        updateSetting("generationMode", "auto-edit")
                      }
                    />
                    <span>
                      <strong>Auto-generate with Manual Override</strong>
                      <small>
                        Generate an ID automatically and allow authorized
                        users to override it.
                      </small>
                    </span>
                  </label>
                </div>

                <div className="es-switch-list">
                  <SettingSwitch
                    title="Allow Editing of Generated ID"
                    description="Actual editing permission must be enforced by the application."
                    checked={settings.allowManualOverride}
                    onChange={(value) =>
                      updateSetting("allowManualOverride", value)
                    }
                  />

                  <SettingSwitch
                    title="Check for Duplicate ID"
                    description="Required validation when saving an employee."
                    checked={settings.checkDuplicate}
                    onChange={(value) =>
                      updateSetting("checkDuplicate", value)
                    }
                  />

                  <SettingSwitch
                    title="Show ID Preview in Employee Master"
                    description="Display a preview while creating an employee."
                    checked={settings.showPreview}
                    onChange={(value) =>
                      updateSetting("showPreview", value)
                    }
                  />
                </div>
              </section>

              <section className="es-warning-card">
                <div className="es-warning-icon">!</div>
                <div>
                  <strong>Important Notes</strong>
                  <ul>
                    <li>Existing employee IDs will not be rewritten.</li>
                    <li>Settings must be saved per company.</li>
                    <li>Manual overrides require authorization.</li>
                    <li>Duplicate checking must also run in the database.</li>
                    <li>Preview values do not reserve a sequence number.</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>

          
          {loadingSettings && (
            <div className="es-message" role="status">
              Loading Employee ID Settings...
            </div>
          )}

          {error && (
            <div className="es-message error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="es-message success" role="status">
              {message}
            </div>
          )}


          <div className="es-actions">
            <button
              type="button"
              className="es-button secondary"
              onClick={() => {
                setSettings(initialSettings);
                setMessage("");
              }}
            >
              Reset Form
            </button>

                        <button
              type="submit"
              className="es-button primary"
              disabled={
                savingSettings ||
                loadingSettings ||
                companyLoading ||
                !currentCompanyId
              }
            >
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      ) : (
        <section className="es-card es-future-tab">
          <div className="es-future-icon">⚙</div>
          <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
          <p>
            This tab is reserved for future requirements. We can add its
            configuration fields when we define the relevant business rules.
          </p>
          <span className="es-coming-soon">Not implemented yet</span>
        </section>
      )}
    </div>
  );
}
