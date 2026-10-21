
import { useMemo, useState } from "react";
import "../../css/hr/EmployeeSettings.css";

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

export default function EmployeeSettings() {
  const [activeTab, setActiveTab] = useState("id");
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");

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

  const handleSave = (event) => {
    event.preventDefault();

    if (!validateSettings()) return;

    setMessage(
      "Validation successful. Permanent saving will be enabled after database integration."
    );
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

      {activeTab === "id" ? (
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

          {message && (
            <div
              className={
                message.startsWith("Validation successful")
                  ? "es-message success"
                  : "es-message error"
              }
              role="status"
            >
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

            <button type="submit" className="es-button primary">
              Save Settings
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
