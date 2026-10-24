
import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import {
    getStatutorySettings,
    saveStatutorySettings,
    getPTRegistrations,
    createPTRegistration,
    updatePTRegistration,
    deactivatePTRegistration
} from "../../services/hr/statutorySettingsService";
import { supabase } from "../../supabase/supabaseClient";
import "./StatutoryConfiguration.css";

const initialSettings = {
    pf_applicable: false,
    pf_establishment_id: "",
    esi_applicable: false,
    esi_employer_code: "",
    tds_applicable: false,
    tan: "",
    financial_year_start_month: 4,
    authorized_signatory_name: "",
    authorized_signatory_designation: "",
    is_active: true,
    remarks: ""
};

const initialPTForm = {
    state_id: "",
    registration_number: "",
    enrollment_number: "",
    registration_type: "EMPLOYER",
    effective_from: "",
    effective_to: "",
    remarks: ""
};

const initialComponents = {
    effective_from: "",
    effective_to: "",
    remarks: "",

    epf_employee_applicable: true,
    epf_employee_rate: "",
    epf_employee_wage_ceiling: "",
    epf_employee_wage_floor: "",
    epf_employee_calculation_base: "PF_WAGES",

    epf_employer_applicable: true,
    epf_employer_total_rate: "",
    epf_employer_wage_ceiling: "",
    epf_employer_calculation_base: "PF_WAGES",

    eps_applicable: true,
    eps_employer_rate: "",
    eps_wage_ceiling: "",
    eps_maximum_contribution: "",
    eps_eligibility_rules: "",

    edli_applicable: true,
    edli_employer_rate: "",
    edli_wage_ceiling: "",
    edli_maximum_contribution: "",

    epf_admin_applicable: true,
    epf_admin_rate: "",
    epf_admin_minimum_amount: "",

    esi_employee_applicable: true,
    esi_employee_rate: "",
    esi_employee_wage_ceiling: "",
    esi_employee_calculation_base: "ESI_WAGES",

    esi_employer_applicable: true,
    esi_employer_rate: "",
    esi_employer_wage_ceiling: "",
    esi_employer_calculation_base: "ESI_WAGES",

    gratuity_applicable: false,
    gratuity_calculation_base: "BASIC_DA",
    gratuity_days_per_year: "15",
    gratuity_days_divisor: "26",
    gratuity_service_year_rule: "COMPLETED_YEARS",
    gratuity_minimum_service_years: "5",
    gratuity_maximum_benefit: "",
    gratuity_monthly_accrual: false,
    gratuity_accrual_rate: "",
    gratuity_effective_from: "",

    bonus_applicable: false,
    bonus_minimum_rate: "",
    bonus_maximum_rate: "",
    bonus_eligibility_wage_ceiling: "",

    tds_component_applicable: false,
    pt_component_applicable: false
};

const tabs = [
    { id: "profile", label: "Company Profile" },
    { id: "components", label: "Statutory Components" },
    { id: "pt", label: "Professional Tax" },
    { id: "history", label: "Policy History" }
];

function Field({
    label,
    name,
    value,
    onChange,
    type = "text",
    placeholder = "",
    help = "",
    min,
    step,
    options,
    disabled = false
}) {
    return (
        <div className="sc-field">
            <label htmlFor={name}>{label}</label>

            {options ? (
                <select
                    id={name}
                    name={name}
                    value={value ?? ""}
                    onChange={onChange}
                    disabled={disabled}
                >
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : type === "textarea" ? (
                <textarea
                    id={name}
                    name={name}
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    rows={3}
                    disabled={disabled}
                />
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    step={step}
                    disabled={disabled}
                />
            )}

            {help && <small>{help}</small>}
        </div>
    );
}

function Toggle({ label, name, checked, onChange, help }) {
    return (
        <label className="sc-toggle">
            <input
                type="checkbox"
                name={name}
                checked={Boolean(checked)}
                onChange={onChange}
            />
            <span className="sc-toggle-text">
                <strong>{label}</strong>
                {help && <small>{help}</small>}
            </span>
        </label>
    );
}

function Section({ title, description, children }) {
    return (
        <section className="sc-section">
            <div className="sc-section-heading">
                <h3>{title}</h3>
                {description && <p>{description}</p>}
            </div>
            {children}
        </section>
    );
}

function RateField(props) {
    return (
        <Field
            {...props}
            type="number"
            min="0"
            step="0.0001"
            placeholder="Enter rate (%)"
            help={props.help || "Percentage; leave blank until verified."}
        />
    );
}

function AmountField(props) {
    return (
        <Field
            {...props}
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter amount (₹)"
        />
    );
}

function StatutoryConfiguration() {
    const { currentCompany, currentCompanyId } = useCompany();

    const [activeTab, setActiveTab] = useState("profile");
    const [settings, setSettings] = useState(initialSettings);
    const [settingsId, setSettingsId] = useState(null);
    const [states, setStates] = useState([]);
    const [ptRegistrations, setPTRegistrations] = useState([]);
    const [ptForm, setPTForm] = useState(initialPTForm);
    const [editingPTId, setEditingPTId] = useState(null);
    const [components, setComponents] = useState(initialComponents);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (currentCompanyId) {
            loadConfiguration();
        } else {
            setSettings(initialSettings);
            setSettingsId(null);
            setPTRegistrations([]);
            setStates([]);
        }
    }, [currentCompanyId]);

    async function loadConfiguration() {
        try {
            setLoading(true);
            setErrorMessage("");
            setMessage("");

            const [statutoryData, ptData, stateResult] = await Promise.all([
                getStatutorySettings(currentCompanyId),
                getPTRegistrations(currentCompanyId),
                supabase
                    .from("states")
                    .select("id, state_name, gst_code")
                    .order("state_name", { ascending: true })
            ]);

            if (stateResult.error) throw stateResult.error;

            setStates(stateResult.data || []);
            setPTRegistrations(ptData || []);

            if (statutoryData) {
                setSettingsId(statutoryData.id);
                setSettings({
                    ...initialSettings,
                    ...statutoryData,
                    financial_year_start_month:
                        statutoryData.financial_year_start_month ?? 4
                });
            } else {
                setSettingsId(null);
                setSettings(initialSettings);
            }
        } catch (error) {
            console.error(error);
            setErrorMessage(
                error.message || "Unable to load statutory configuration."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleSettingsChange(event) {
        const { name, value, type, checked } = event.target;
        setSettings(previous => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function handleComponentChange(event) {
        const { name, value, type, checked } = event.target;
        setComponents(previous => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function handlePTChange(event) {
        const { name, value } = event.target;
        setPTForm(previous => ({ ...previous, [name]: value }));
    }

    async function handleSaveSettings() {
        if (!currentCompanyId) {
            setErrorMessage("Please select a company first.");
            return;
        }

        try {
            setSaving(true);
            setErrorMessage("");
            setMessage("");

            const saved = await saveStatutorySettings(
                settings,
                currentCompanyId
            );

            setSettingsId(saved.id);
            setMessage("Company statutory profile saved successfully.");
        } catch (error) {
            console.error(error);
            setErrorMessage(
                error.message || "Unable to save statutory settings."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleSavePT() {
        if (!currentCompanyId) {
            setErrorMessage("Please select a company first.");
            return;
        }

        if (!ptForm.state_id) {
            setErrorMessage("Please select a state.");
            return;
        }

        if (
            ptForm.effective_from &&
            ptForm.effective_to &&
            ptForm.effective_to < ptForm.effective_from
        ) {
            setErrorMessage("PT effective-to date cannot precede effective-from date.");
            return;
        }

        try {
            setSaving(true);
            setErrorMessage("");
            setMessage("");

            const wasEditing = Boolean(editingPTId);

            if (editingPTId) {
                await updatePTRegistration(
                    editingPTId,
                    ptForm,
                    currentCompanyId
                );
            } else {
                await createPTRegistration(ptForm, currentCompanyId);
            }

            setPTForm(initialPTForm);
            setEditingPTId(null);
            await loadConfiguration();

            setMessage(
                wasEditing
                    ? "PT registration updated."
                    : "PT registration added."
            );
        } catch (error) {
            console.error(error);
            setErrorMessage(
                error.message || "Unable to save PT registration."
            );
        } finally {
            setSaving(false);
        }
    }

    function editPTRegistration(registration) {
        setEditingPTId(registration.id);
        setPTForm({
            ...initialPTForm,
            ...registration,
            effective_from: registration.effective_from || "",
            effective_to: registration.effective_to || ""
        });
        setActiveTab("pt");
        setMessage("");
        setErrorMessage("");
    }

    async function handleDeactivatePT(id) {
        if (!window.confirm("Deactivate this PT registration?")) return;

        try {
            setErrorMessage("");
            await deactivatePTRegistration(id, currentCompanyId);
            await loadConfiguration();
            setMessage("PT registration deactivated.");
        } catch (error) {
            console.error(error);
            setErrorMessage(
                error.message || "Unable to deactivate PT registration."
            );
        }
    }

    function cancelPTEdit() {
        setEditingPTId(null);
        setPTForm(initialPTForm);
        setMessage("");
        setErrorMessage("");
    }

    function handleSaveComponentDraft() {
        setMessage("");
        setErrorMessage("");

        if (!components.effective_from) {
            setErrorMessage(
                "Enter the policy effective-from date before saving this draft."
            );
            return;
        }

        if (
            components.effective_to &&
            components.effective_to < components.effective_from
        ) {
            setErrorMessage("Effective-to date cannot precede effective-from date.");
            return;
        }

        setMessage(
            "UI draft validated. Database saving will be enabled in the service-code phase."
        );
    }

    if (!currentCompanyId) {
        return (
            <div className="sc-page">
                <h1>Statutory Configuration</h1>
                <div className="sc-empty">
                    Select a company from the company selector to configure
                    statutory settings.
                </div>
            </div>
        );
    }

    return (
        <div className="sc-page">
            <header className="sc-header">
                <div>
                    <p className="sc-eyebrow">PAYROLL MANAGEMENT</p>
                    <h1>Statutory Configuration</h1>
                    <p className="sc-subtitle">
                        Company-level compliance settings, contributions and
                        statutory policy rules.
                    </p>
                </div>

                <div className="sc-company-badge">
                    <span>Selected company</span>
                    <strong>
                        {currentCompany?.company_name?.trim() || "Current company"}
                    </strong>
                </div>
            </header>

            <nav className="sc-tabs" aria-label="Statutory configuration tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`sc-tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setMessage("");
                            setErrorMessage("");
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {message && <div className="sc-message">{message}</div>}
            {errorMessage && (
                <div className="sc-error" role="alert">{errorMessage}</div>
            )}

            {loading ? (
                <div className="sc-empty">Loading statutory configuration...</div>
            ) : (
                <>
                    {activeTab === "profile" && (
                        <>
                            <Section
                                title="EPF / EPFO Registration"
                                description="Establishment-level registration details."
                            >
                                <Toggle
                                    label="EPF applicable"
                                    name="pf_applicable"
                                    checked={settings.pf_applicable}
                                    onChange={handleSettingsChange}
                                />
                                {settings.pf_applicable && (
                                    <div className="sc-grid">
                                        <Field
                                            label="PF Establishment ID"
                                            name="pf_establishment_id"
                                            value={settings.pf_establishment_id}
                                            onChange={handleSettingsChange}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="ESI / ESIC Registration"
                                description="Employer registration information."
                            >
                                <Toggle
                                    label="ESI applicable"
                                    name="esi_applicable"
                                    checked={settings.esi_applicable}
                                    onChange={handleSettingsChange}
                                />
                                {settings.esi_applicable && (
                                    <div className="sc-grid">
                                        <Field
                                            label="ESI Employer Code"
                                            name="esi_employer_code"
                                            value={settings.esi_employer_code}
                                            onChange={handleSettingsChange}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="Salary TDS"
                                description="Tax deduction registration details."
                            >
                                <Toggle
                                    label="Salary TDS applicable"
                                    name="tds_applicable"
                                    checked={settings.tds_applicable}
                                    onChange={handleSettingsChange}
                                />
                                {settings.tds_applicable && (
                                    <div className="sc-grid">
                                        <Field
                                            label="TAN"
                                            name="tan"
                                            value={settings.tan}
                                            onChange={handleSettingsChange}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section title="General Filing Settings">
                                <div className="sc-grid">
                                    <Field
                                        label="Financial year starts in"
                                        name="financial_year_start_month"
                                        value={String(settings.financial_year_start_month)}
                                        onChange={handleSettingsChange}
                                        options={[
                                            { value: "1", label: "January" },
                                            { value: "4", label: "April" }
                                        ]}
                                    />
                                    <Field
                                        label="Authorized signatory name"
                                        name="authorized_signatory_name"
                                        value={settings.authorized_signatory_name}
                                        onChange={handleSettingsChange}
                                    />
                                    <Field
                                        label="Authorized signatory designation"
                                        name="authorized_signatory_designation"
                                        value={settings.authorized_signatory_designation}
                                        onChange={handleSettingsChange}
                                    />
                                    <Field
                                        label="Remarks"
                                        name="remarks"
                                        value={settings.remarks}
                                        onChange={handleSettingsChange}
                                        type="textarea"
                                    />
                                </div>
                                <div className="sc-actions">
                                    <button
                                        className="sc-button primary"
                                        onClick={handleSaveSettings}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save Company Profile"}
                                    </button>
                                </div>
                            </Section>
                        </>
                    )}

                    {activeTab === "components" && (
                        <>
                            <div className="sc-notice">
                                <strong>Company-level policy editor</strong>
                                <p>
                                    These controls are currently UI-only. Values are
                                    not written to the database in this phase.
                                    Leave unverified rates and ceilings blank.
                                </p>
                            </div>

                            <Section
                                title="Policy Period"
                                description="Define when this version of the company's statutory rules applies."
                            >
                                <div className="sc-grid">
                                    <Field
                                        label="Effective from"
                                        name="effective_from"
                                        type="date"
                                        value={components.effective_from}
                                        onChange={handleComponentChange}
                                    />
                                    <Field
                                        label="Effective to (optional)"
                                        name="effective_to"
                                        type="date"
                                        value={components.effective_to}
                                        onChange={handleComponentChange}
                                    />
                                    <Field
                                        label="Policy remarks / source reference"
                                        name="remarks"
                                        type="textarea"
                                        value={components.remarks}
                                        onChange={handleComponentChange}
                                    />
                                </div>
                            </Section>

                            <Section
                                title="EPF — Employee Provident Fund"
                                description="Employee deduction configuration."
                            >
                                <Toggle
                                    label="Enable employee EPF"
                                    name="epf_employee_applicable"
                                    checked={components.epf_employee_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.epf_employee_applicable && (
                                    <div className="sc-grid">
                                        <RateField
                                            label="Employee contribution (%)"
                                            name="epf_employee_rate"
                                            value={components.epf_employee_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Wage ceiling (₹ / month)"
                                            name="epf_employee_wage_ceiling"
                                            value={components.epf_employee_wage_ceiling}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Wage floor (₹ / month)"
                                            name="epf_employee_wage_floor"
                                            value={components.epf_employee_wage_floor}
                                            onChange={handleComponentChange}
                                        />
                                        <Field
                                            label="Calculation base"
                                            name="epf_employee_calculation_base"
                                            value={components.epf_employee_calculation_base}
                                            onChange={handleComponentChange}
                                            options={[
                                                { value: "PF_WAGES", label: "PF wages" },
                                                { value: "BASIC_DA", label: "Basic + DA" },
                                                { value: "CONFIGURED_COMPONENTS", label: "Configured salary components" }
                                            ]}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="EPF — Employer Contribution"
                                description="Employer contribution before allocation between EPF and EPS."
                            >
                                <Toggle
                                    label="Enable employer EPF contribution"
                                    name="epf_employer_applicable"
                                    checked={components.epf_employer_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.epf_employer_applicable && (
                                    <div className="sc-grid">
                                        <RateField
                                            label="Total employer contribution (%)"
                                            name="epf_employer_total_rate"
                                            value={components.epf_employer_total_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Wage ceiling (₹ / month)"
                                            name="epf_employer_wage_ceiling"
                                            value={components.epf_employer_wage_ceiling}
                                            onChange={handleComponentChange}
                                        />
                                        <Field
                                            label="Calculation base"
                                            name="epf_employer_calculation_base"
                                            value={components.epf_employer_calculation_base}
                                            onChange={handleComponentChange}
                                            options={[
                                                { value: "PF_WAGES", label: "PF wages" },
                                                { value: "BASIC_DA", label: "Basic + DA" },
                                                { value: "CONFIGURED_COMPONENTS", label: "Configured salary components" }
                                            ]}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="EPS — Employee Pension Scheme"
                                description="Employer allocation to pension; do not add it again on top of total employer PF."
                            >
                                <Toggle
                                    label="Enable EPS allocation"
                                    name="eps_applicable"
                                    checked={components.eps_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.eps_applicable && (
                                    <div className="sc-grid">
                                        <RateField
                                            label="Employer EPS allocation (%)"
                                            name="eps_employer_rate"
                                            value={components.eps_employer_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Pension wage ceiling (₹ / month)"
                                            name="eps_wage_ceiling"
                                            value={components.eps_wage_ceiling}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Maximum EPS contribution (₹ / month)"
                                            name="eps_maximum_contribution"
                                            value={components.eps_maximum_contribution}
                                            onChange={handleComponentChange}
                                        />
                                        <Field
                                            label="Eligibility rules / notes"
                                            name="eps_eligibility_rules"
                                            value={components.eps_eligibility_rules}
                                            onChange={handleComponentChange}
                                            type="textarea"
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="EDLI — Deposit Linked Insurance"
                                description="Employer-side contribution settings."
                            >
                                <Toggle
                                    label="Enable EDLI contribution"
                                    name="edli_applicable"
                                    checked={components.edli_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.edli_applicable && (
                                    <div className="sc-grid">
                                        <RateField
                                            label="EDLI contribution (%)"
                                            name="edli_employer_rate"
                                            value={components.edli_employer_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Wage ceiling (₹ / month)"
                                            name="edli_wage_ceiling"
                                            value={components.edli_wage_ceiling}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Maximum contribution (₹ / month)"
                                            name="edli_maximum_contribution"
                                            value={components.edli_maximum_contribution}
                                            onChange={handleComponentChange}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="EPF Administration Charges"
                                description="Keep administration costs separate from employee deductions and the employer's PF allocation."
                            >
                                <Toggle
                                    label="Enable EPF administration charges"
                                    name="epf_admin_applicable"
                                    checked={components.epf_admin_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.epf_admin_applicable && (
                                    <div className="sc-grid">
                                        <RateField
                                            label="Administration charge (%)"
                                            name="epf_admin_rate"
                                            value={components.epf_admin_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Minimum charge, if applicable (₹)"
                                            name="epf_admin_minimum_amount"
                                            value={components.epf_admin_minimum_amount}
                                            onChange={handleComponentChange}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="ESI — Employee Contribution"
                                description="Employee contribution and coverage settings."
                            >
                                <Toggle
                                    label="Enable employee ESI"
                                    name="esi_employee_applicable"
                                    checked={components.esi_employee_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.esi_employee_applicable && (
                                    <div className="sc-grid">
                                        <RateField
                                            label="Employee contribution (%)"
                                            name="esi_employee_rate"
                                            value={components.esi_employee_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Wage ceiling (₹ / month)"
                                            name="esi_employee_wage_ceiling"
                                            value={components.esi_employee_wage_ceiling}
                                            onChange={handleComponentChange}
                                        />
                                        <Field
                                            label="Calculation base"
                                            name="esi_employee_calculation_base"
                                            value={components.esi_employee_calculation_base}
                                            onChange={handleComponentChange}
                                            options={[
                                                { value: "ESI_WAGES", label: "ESI wages" },
                                                { value: "GROSS_WAGES", label: "Gross wages" },
                                                { value: "CONFIGURED_COMPONENTS", label: "Configured salary components" }
                                            ]}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="ESI — Employer Contribution"
                                description="Employer contribution and wage ceiling settings."
                            >
                                <Toggle
                                    label="Enable employer ESI"
                                    name="esi_employer_applicable"
                                    checked={components.esi_employer_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.esi_employer_applicable && (
                                    <div className="sc-grid">
                                        <RateField
                                            label="Employer contribution (%)"
                                            name="esi_employer_rate"
                                            value={components.esi_employer_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Wage ceiling (₹ / month)"
                                            name="esi_employer_wage_ceiling"
                                            value={components.esi_employer_wage_ceiling}
                                            onChange={handleComponentChange}
                                        />
                                        <Field
                                            label="Calculation base"
                                            name="esi_employer_calculation_base"
                                            value={components.esi_employer_calculation_base}
                                            onChange={handleComponentChange}
                                            options={[
                                                { value: "ESI_WAGES", label: "ESI wages" },
                                                { value: "GROSS_WAGES", label: "Gross wages" },
                                                { value: "CONFIGURED_COMPONENTS", label: "Configured salary components" }
                                            ]}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="Gratuity Configuration"
                                description="Employer benefit calculation and costing. Gratuity is not an ordinary employee salary deduction."
                            >
                                <Toggle
                                    label="Enable gratuity calculation"
                                    name="gratuity_applicable"
                                    checked={components.gratuity_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.gratuity_applicable && (
                                    <>
                                        <div className="sc-grid">
                                            <Field
                                                label="Calculation wage base"
                                                name="gratuity_calculation_base"
                                                value={components.gratuity_calculation_base}
                                                onChange={handleComponentChange}
                                                options={[
                                                    { value: "BASIC_DA", label: "Basic + DA" },
                                                    { value: "CONFIGURED_COMPONENTS", label: "Configured eligible salary components" }
                                                ]}
                                            />
                                            <Field
                                                label="Wage days per eligible service year"
                                                name="gratuity_days_per_year"
                                                value={components.gratuity_days_per_year}
                                                onChange={handleComponentChange}
                                                type="number"
                                                min="0"
                                                step="0.5"
                                            />
                                            <Field
                                                label="Wage divisor"
                                                name="gratuity_days_divisor"
                                                value={components.gratuity_days_divisor}
                                                onChange={handleComponentChange}
                                                type="number"
                                                min="1"
                                            />
                                            <Field
                                                label="Service-year rounding rule"
                                                name="gratuity_service_year_rule"
                                                value={components.gratuity_service_year_rule}
                                                onChange={handleComponentChange}
                                                options={[
                                                    { value: "COMPLETED_YEARS", label: "Completed years" },
                                                    { value: "LEGAL_RULE", label: "Apply configured legal rule" }
                                                ]}
                                            />
                                            <Field
                                                label="Qualifying service (years)"
                                                name="gratuity_minimum_service_years"
                                                value={components.gratuity_minimum_service_years}
                                                onChange={handleComponentChange}
                                                type="number"
                                                min="0"
                                                step="0.5"
                                            />
                                            <AmountField
                                                label="Maximum gratuity benefit (₹)"
                                                name="gratuity_maximum_benefit"
                                                value={components.gratuity_maximum_benefit}
                                                onChange={handleComponentChange}
                                                help="Leave blank until the applicable legal limit is verified."
                                            />
                                            <Field
                                                label="Gratuity policy effective from"
                                                name="gratuity_effective_from"
                                                value={components.gratuity_effective_from}
                                                onChange={handleComponentChange}
                                                type="date"
                                            />
                                        </div>

                                        <div className="sc-divider" />

                                        <Toggle
                                            label="Calculate monthly employer gratuity accrual"
                                            name="gratuity_monthly_accrual"
                                            checked={components.gratuity_monthly_accrual}
                                            onChange={handleComponentChange}
                                            help="Employer costing only; not an employee deduction."
                                        />

                                        {components.gratuity_monthly_accrual && (
                                            <div className="sc-grid">
                                                <RateField
                                                    label="Monthly accrual rate (%)"
                                                    name="gratuity_accrual_rate"
                                                    value={components.gratuity_accrual_rate}
                                                    onChange={handleComponentChange}
                                                    help="Optional costing rate; must be validated before payroll integration."
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </Section>

                            <Section
                                title="Bonus Configuration"
                                description="Optional bonus settings; statutory eligibility and limits must be validated before calculation."
                            >
                                <Toggle
                                    label="Enable statutory bonus configuration"
                                    name="bonus_applicable"
                                    checked={components.bonus_applicable}
                                    onChange={handleComponentChange}
                                />
                                {components.bonus_applicable && (
                                    <div className="sc-grid">
                                        <RateField
                                            label="Minimum bonus rate (%)"
                                            name="bonus_minimum_rate"
                                            value={components.bonus_minimum_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <RateField
                                            label="Maximum bonus rate (%)"
                                            name="bonus_maximum_rate"
                                            value={components.bonus_maximum_rate}
                                            onChange={handleComponentChange}
                                        />
                                        <AmountField
                                            label="Eligibility wage ceiling (₹ / month)"
                                            name="bonus_eligibility_wage_ceiling"
                                            value={components.bonus_eligibility_wage_ceiling}
                                            onChange={handleComponentChange}
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section
                                title="Other Statutory Links"
                                description="These options indicate which configuration areas apply; detailed calculations will be implemented separately."
                            >
                                <div className="sc-grid">
                                    <Toggle
                                        label="Use TDS in payroll"
                                        name="tds_component_applicable"
                                        checked={components.tds_component_applicable}
                                        onChange={handleComponentChange}
                                        help="Income-tax computation requires its own tax rules."
                                    />
                                    <Toggle
                                        label="Use Professional Tax in payroll"
                                        name="pt_component_applicable"
                                        checked={components.pt_component_applicable}
                                        onChange={handleComponentChange}
                                        help="Uses state-specific PT slabs in the PT tab."
                                    />
                                </div>
                            </Section>

                            <div className="sc-sticky-actions">
                                <span>
                                    UI draft only — settings are not persisted yet.
                                </span>
                                <button
                                    className="sc-button primary"
                                    onClick={handleSaveComponentDraft}
                                >
                                    Validate Draft
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === "pt" && (
                        <>
                            <Section
                                title="Professional Tax Registrations"
                                description="Maintain the company's state-specific employer and enrolment registrations."
                            >
                                <div className="sc-grid">
                                    <Field
                                        label="State"
                                        name="state_id"
                                        value={ptForm.state_id}
                                        onChange={handlePTChange}
                                        options={[
                                            { value: "", label: "Select state" },
                                            ...states.map(state => ({
                                                value: state.id,
                                                label: state.state_name
                                            }))
                                        ]}
                                    />
                                    <Field
                                        label="Registration type"
                                        name="registration_type"
                                        value={ptForm.registration_type}
                                        onChange={handlePTChange}
                                        options={[
                                            { value: "EMPLOYER", label: "Employer" },
                                            { value: "ENROLMENT", label: "Enrolment" }
                                        ]}
                                    />
                                    <Field
                                        label="Registration number"
                                        name="registration_number"
                                        value={ptForm.registration_number}
                                        onChange={handlePTChange}
                                    />
                                    <Field
                                        label="Enrollment number"
                                        name="enrollment_number"
                                        value={ptForm.enrollment_number}
                                        onChange={handlePTChange}
                                    />
                                    <Field
                                        label="Effective from"
                                        name="effective_from"
                                        type="date"
                                        value={ptForm.effective_from}
                                        onChange={handlePTChange}
                                    />
                                    <Field
                                        label="Effective to"
                                        name="effective_to"
                                        type="date"
                                        value={ptForm.effective_to}
                                        onChange={handlePTChange}
                                    />
                                    <Field
                                        label="Remarks"
                                        name="remarks"
                                        type="textarea"
                                        value={ptForm.remarks}
                                        onChange={handlePTChange}
                                    />
                                </div>

                                <div className="sc-actions">
                                    <button
                                        className="sc-button primary"
                                        onClick={handleSavePT}
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : editingPTId
                                                ? "Update PT Registration"
                                                : "Add PT Registration"}
                                    </button>
                                    {editingPTId && (
                                        <button
                                            className="sc-button secondary"
                                            onClick={cancelPTEdit}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </Section>

                            <Section
                                title="Registered States"
                                description="Existing company PT registrations."
                            >
                                {ptRegistrations.length === 0 ? (
                                    <p className="sc-muted">
                                        No PT registrations found for this company.
                                    </p>
                                ) : (
                                    <div className="sc-table-wrap">
                                        <table className="sc-table">
                                            <thead>
                                                <tr>
                                                    <th>State</th>
                                                    <th>Type</th>
                                                    <th>Registration No.</th>
                                                    <th>Enrollment No.</th>
                                                    <th>Effective From</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ptRegistrations.map(registration => (
                                                    <tr key={registration.id}>
                                                        <td>
                                                            {registration.states?.state_name || "-"}
                                                        </td>
                                                        <td>{registration.registration_type || "-"}</td>
                                                        <td>{registration.registration_number || "-"}</td>
                                                        <td>{registration.enrollment_number || "-"}</td>
                                                        <td>{registration.effective_from || "-"}</td>
                                                        <td>
                                                            <span className={
                                                                registration.is_active
                                                                    ? "sc-status active"
                                                                    : "sc-status inactive"
                                                            }>
                                                                {registration.is_active ? "Active" : "Inactive"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {registration.is_active && (
                                                                <div className="sc-row-actions">
                                                                    <button
                                                                        className="sc-link-button"
                                                                        onClick={() => editPTRegistration(registration)}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        className="sc-link-button danger"
                                                                        onClick={() => handleDeactivatePT(registration.id)}
                                                                    >
                                                                        Deactivate
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Section>
                        </>
                    )}

                    {activeTab === "history" && (
                        <Section
                            title="Statutory Policy History"
                            description="Effective-dated policy history will appear here after the service layer is connected."
                        >
                            <div className="sc-notice">
                                <strong>Policy history UI placeholder</strong>
                                <p>
                                    This tab will show company policy versions, policy
                                    codes, effective dates, active status and source
                                    references from statutory_policy_versions.
                                </p>
                                <p>
                                    Previous policy versions should be retained for
                                    historical payroll calculations and payslip audits.
                                </p>
                            </div>
                        </Section>
                    )}
                </>
            )}
        </div>
    );
}

export default StatutoryConfiguration;
