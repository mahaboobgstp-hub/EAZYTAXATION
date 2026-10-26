
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

import {
    getSalaryTdsPolicies,
    getSalaryTdsPolicy,
    createSalaryTdsPolicy,
    updateSalaryTdsPolicy,
    saveSalaryTdsSlabs,
    activateSalaryTdsPolicy
} from "../../services/hr/salaryTdsPolicyService";

import { supabase } from "../../supabase/supabaseClient";
import "../../css/hr/StatutoryConfiguration.css";
import {
    getStatutoryPolicies,
    createStatutoryPolicyVersion,
    activateStatutoryPolicyVersion
} from "../../services/hr/statutoryPolicyService";
import {
    getStatutoryPolicyPackages,
    getActiveStatutoryPolicyPackage,
    createStatutoryPolicyPackageDraft,
    activateStatutoryPolicyPackage
} from "../../services/hr/statutoryPolicyService";


import {
    getProfessionalTaxPolicies,
    getProfessionalTaxPolicyById,
    getProfessionalTaxPolicyVersionById,
    getProfessionalTaxPolicyVersions,
    getProfessionalTaxPolicySlabs,
    getProfessionalTaxPolicyHistory,
    createProfessionalTaxPolicy,
    updateProfessionalTaxPolicy,
    createProfessionalTaxPolicyVersion,
    updateProfessionalTaxPolicyVersion,
    saveProfessionalTaxPolicySlabs,
    activateProfessionalTaxPolicyVersion,
    deactivateProfessionalTaxPolicyVersion
} from "../../services/hr/professionalTaxPolicyService";


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


const initialPTPolicyForm = {
    policy_name: "",
    state_id: "",
    effective_from: "",
    effective_to: "",
    salary_basis: "GROSS_MONTHLY",
    collection_frequency: "MONTHLY",
    special_collection_month: "",
    exemption_rules: "",
    source_reference: "",
    remarks: "",
    is_enabled: true
};

const initialPTSlab = {
    salary_from: "0",
    salary_to: "",
    pt_amount: "0",
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

const statutoryPolicyTypes = [
    { value: "EPF_EMPLOYEE", label: "EPF — Employee Contribution" },
    { value: "EPF_EMPLOYER_TOTAL", label: "EPF — Total Employer Contribution" },
    { value: "EPS_EMPLOYER", label: "EPS — Employer Pension Allocation" },
    { value: "EDLI_EMPLOYER", label: "EDLI — Employer Insurance Contribution" },
    { value: "EPF_ADMIN_CHARGE", label: "EPF — Administration Charges" },
    { value: "EDLI_ADMIN_CHARGE", label: "EDLI — Administration Charges" },
    { value: "ESI_EMPLOYEE", label: "ESI — Employee Contribution" },
    { value: "ESI_EMPLOYER", label: "ESI — Employer Contribution" },
    { value: "GRATUITY_EMPLOYER", label: "Gratuity — Employer Benefit" }
];

const initialStatutoryPolicyForm = {
    policy_code: "EPF_EMPLOYEE",
    policy_name: "EPF Employee Contribution",
    effective_from: "",
    effective_to: "",
    rate_percent: "",
    fixed_amount: "",
    wage_floor: "",
    wage_ceiling: "",
    calculation_base: "BASIC_DA",
    source_reference: "",
    remarks: ""
};

const statutoryCalculationBases = [
    { value: "BASIC", label: "Basic salary" },
    { value: "BASIC_DA", label: "Basic + DA" },
    { value: "ELIGIBLE_GROSS", label: "Eligible gross wages" },
    { value: "GROSS", label: "Gross wages" },
    { value: "CEILING_CAPPED_WAGES", label: "Wages subject to ceiling" },
    { value: "FIXED_AMOUNT", label: "Fixed amount" },
    { value: "SLAB", label: "Slab-based calculation" },
    { value: "OTHER", label: "Other / configured rules" }
];

function getStatutoryPolicyName(code) {
    return statutoryPolicyTypes.find(item => item.value === code)?.label || code;
}
const tabs = [
    { id: "profile", label: "Company Profile" },
    { id: "components", label: "Statutory Components" },
    { id: "tds", label: "Income Tax / TDS" },
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

const initialTdsPolicy = {
    id: null,
    policy_code: "",
    policy_name: "",
    tax_year: "2026-27",
    applicable_act: "INCOME_TAX_ACT_2025",
    tax_regime: "NEW",
    effective_from: "2026-04-01",
    effective_to: "",
    standard_deduction: "75000",
    rebate_income_limit: "",
    maximum_rebate: "",
    cess_percent: "4",
    remarks: ""
};

const initialTdsSlabs = [
    {
        income_from: "0",
        income_to: "400000",
        tax_rate_percent: "0"
    },
    {
        income_from: "400000",
        income_to: "800000",
        tax_rate_percent: "5"
    },
    {
        income_from: "800000",
        income_to: "1200000",
        tax_rate_percent: "10"
    },
    {
        income_from: "1200000",
        income_to: "1600000",
        tax_rate_percent: "15"
    },
    {
        income_from: "1600000",
        income_to: "2000000",
        tax_rate_percent: "20"
    },
    {
        income_from: "2000000",
        income_to: "2400000",
        tax_rate_percent: "25"
    },
    {
        income_from: "2400000",
        income_to: "",
        tax_rate_percent: "30"
    }
];

function StatutoryConfiguration() {
    const { currentCompany, currentCompanyId } = useCompany();

    const [activeTab, setActiveTab] = useState("profile");
    const [settings, setSettings] = useState(initialSettings);
    const [settingsId, setSettingsId] = useState(null);
    const [states, setStates] = useState([]);
    const [ptRegistrations, setPTRegistrations] = useState([]);
    const [ptForm, setPTForm] = useState(initialPTForm);
    const [editingPTId, setEditingPTId] = useState(null);
    


const [ptPolicyForm, setPTPolicyForm] = useState(initialPTPolicyForm);
const [ptSlabs, setPTSlabs] = useState([
    { ...initialPTSlab }
]);
const [ptPolicyEditing, setPTPolicyEditing] = useState(false);

const [ptPolicyRecords, setPTPolicyRecords] = useState([]);
const [ptPolicyHistory, setPTPolicyHistory] = useState([]);
const [ptEditingPolicyId, setPTEditingPolicyId] = useState(null);
const [ptEditingVersionId, setPTEditingVersionId] = useState(null);
const [ptPolicySaving, setPTPolicySaving] = useState(false);
const [ptPolicyLoading, setPTPolicyLoading] = useState(false);



    const [components, setComponents] = useState(initialComponents);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    
const [tdsPolicies, setTdsPolicies] = useState([]);
const [tdsPolicyForm, setTdsPolicyForm] = useState(initialTdsPolicy);
const [tdsSlabs, setTdsSlabs] = useState(initialTdsSlabs);
const [selectedTdsPolicyId, setSelectedTdsPolicyId] = useState("");
const [tdsLoading, setTdsLoading] = useState(false);
const [tdsSaving, setTdsSaving] = useState(false);

    const [statutoryPolicies, setStatutoryPolicies] = useState([]);
    const [statutoryPolicyPackages, setStatutoryPolicyPackages] = useState([]);
const [statutoryPolicyForm, setStatutoryPolicyForm] = useState(
    initialStatutoryPolicyForm
);
const [statutoryPolicySaving, setStatutoryPolicySaving] = useState(false);
const [statutoryPolicyLoading, setStatutoryPolicyLoading] = useState(false);
    const [historySearch, setHistorySearch] = useState("");
const [historyStatus, setHistoryStatus] = useState("ALL");
const [historyFromDate, setHistoryFromDate] = useState("");
const [historyToDate, setHistoryToDate] = useState("");
const [historyCategory, setHistoryCategory] = useState("STATUTORY");
const [historyDetailsPolicy, setHistoryDetailsPolicy] = useState(null);
    

    useEffect(() => {
    if (currentCompanyId) {
        loadConfiguration();
        loadStatutoryPolicies();
    } else {
        setSettings(initialSettings);
        setSettingsId(null);
        setPTRegistrations([]);
        setStates([]);

        setTdsPolicies([]);
        setSelectedTdsPolicyId("");
        setTdsPolicyForm(initialTdsPolicy);
        setTdsSlabs(initialTdsSlabs);

        setStatutoryPolicies([]);
        setStatutoryPolicyForm(initialStatutoryPolicyForm);
    }
}, [currentCompanyId]);


    
async function loadPTPolicyData(companyId = currentCompanyId) {
    if (!companyId) {
        setPTPolicyRecords([]);
        setPTPolicyHistory([]);
        return;
    }

    try {
        setPTPolicyLoading(true);

        const [policies, history] = await Promise.all([
            getProfessionalTaxPolicies(companyId),
            getProfessionalTaxPolicyHistory(companyId)
        ]);

        setPTPolicyRecords(policies || []);
        setPTPolicyHistory(history || []);
    } catch (error) {
        console.error("Unable to load PT policies:", error);
        throw error;
    } finally {
        setPTPolicyLoading(false);
    }
}


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

await loadPTPolicyData(currentCompanyId);


            

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


async function getProfessionalTaxPolicyByIdForPT(policyId, companyId) {
    const policies = await getProfessionalTaxPolicies(companyId);
    return policies.find(policy => policy.id === policyId) || null;
}

async function getProfessionalTaxPolicyVersionForPT(versionId, companyId) {
    const versions = await getProfessionalTaxPolicyHistory(companyId);
    return versions.find(version => version.id === versionId) || null;
}

    
    function handlePTChange(event) {
        const { name, value } = event.target;
        setPTForm(previous => ({ ...previous, [name]: value }));
    }

    
function handlePTPolicyChange(event) {
    const { name, value, type, checked } = event.target;

    setPTPolicyForm(previous => ({
        ...previous,
        [name]: type === "checkbox" ? checked : value
    }));
}

function handlePTSlabChange(index, field, value) {
    setPTSlabs(previous =>
        previous.map((slab, i) =>
            i === index
                ? { ...slab, [field]: value }
                : slab
        )
    );
}

function addPTSlab() {
    setPTSlabs(previous => {
        const last = previous[previous.length - 1];

        return [
            ...previous.map((slab, index) =>
                index === previous.length - 1 && !slab.salary_to
                    ? { ...slab, salary_to: "" }
                    : slab
            ),
            {
                ...initialPTSlab,
                salary_from: last?.salary_to || ""
            }
        ];
    });
}

function removePTSlab(index) {
    setPTSlabs(previous =>
        previous.filter((_, i) => i !== index)
    );
}


function resetPTPolicyForm() {
    setPTPolicyForm(initialPTPolicyForm);
    setPTSlabs([{ ...initialPTSlab }]);
    setPTPolicyEditing(false);
    setPTEditingPolicyId(null);
    setPTEditingVersionId(null);
    setMessage("");
    setErrorMessage("");
}

async function handleEditPTPolicyVersion(version) {
    if (!version?.id || !currentCompanyId) return;

    try {
        setPtPolicyLoading(true);
        setErrorMessage("");
        setMessage("");

        if (version.status !== "DRAFT") {
            throw new Error(
                "Only draft PT policy versions can be edited. Create a new version for changes to an active policy."
            );
        }

        const policyId = version.policy_id;

        const [policy, savedVersion, savedSlabs] = await Promise.all([
            getProfessionalTaxPolicyByIdForPT(policyId, currentCompanyId),
            getProfessionalTaxPolicyVersionForPT(version.id, currentCompanyId),
            getProfessionalTaxPolicySlabs(version.id, currentCompanyId)
        ]);

        if (!policy || !savedVersion) {
            throw new Error("The selected PT policy or version was not found.");
        }

        const exemptionRules = savedVersion.exemption_rules;
        const exemptionText =
            typeof exemptionRules === "string"
                ? exemptionRules
                : exemptionRules?.notes || "";

        setPTEditingPolicyId(policy.id);
        setPTEditingVersionId(savedVersion.id);

        setPTPolicyForm({
            ...initialPTPolicyForm,
            policy_name: policy.policy_name || savedVersion.policy_name || "",
            state_id: policy.state_id || "",
            effective_from: savedVersion.effective_from || "",
            effective_to: savedVersion.effective_to || "",
            salary_basis: savedVersion.salary_basis || "GROSS_MONTHLY",
            collection_frequency:
                savedVersion.collection_frequency || "MONTHLY",
            special_collection_month:
                savedVersion.special_collection_month == null
                    ? ""
                    : String(savedVersion.special_collection_month),
            exemption_rules: exemptionText,
            source_reference: savedVersion.source_reference || "",
            remarks: savedVersion.remarks || "",
            is_enabled: savedVersion.is_enabled ?? true
        });

        setPTSlabs(
            savedSlabs.length
                ? savedSlabs.map(slab => ({
                    salary_from: String(slab.salary_from),
                    salary_to:
                        slab.salary_to == null ? "" : String(slab.salary_to),
                    pt_amount: String(slab.pt_amount),
                    remarks: slab.remarks || ""
                }))
                : [{ ...initialPTSlab }]
        );

        setPTPolicyEditing(true);
        setActiveTab("pt");
    } catch (error) {
        console.error("Unable to open PT draft:", error);
        setErrorMessage(error.message || "Unable to load the PT draft.");
    } finally {
        setPtPolicyLoading(false);
    }
}



async function handleSavePTPolicyDraft() {
    if (!currentCompanyId) {
        setErrorMessage("Please select a company first.");
        return;
    }

    if (!ptPolicyForm.state_id) {
        setErrorMessage("Select a State/UT for the PT policy.");
        return;
    }

    if (!ptPolicyForm.policy_name.trim()) {
        setErrorMessage("Enter a PT policy name.");
        return;
    }

    if (!ptPolicyForm.effective_from) {
        setErrorMessage("Enter the policy effective-from date.");
        return;
    }

    if (
        ptPolicyForm.effective_to &&
        ptPolicyForm.effective_to < ptPolicyForm.effective_from
    ) {
        setErrorMessage(
            "Effective-to date cannot precede effective-from date."
        );
        return;
    }

    if (!ptSlabs.length) {
        setErrorMessage("Add at least one salary slab.");
        return;
    }

    try {
        setPTPolicySaving(true);
        setErrorMessage("");
        setMessage("");

        const policyPayload = {
            state_id: ptPolicyForm.state_id,
            policy_name: ptPolicyForm.policy_name.trim()
        };

        let policyId = ptEditingPolicyId;
        let versionId = ptEditingVersionId;

        // Step A: Create the policy master if this is a new policy.
        if (!policyId) {
            const policy = await createProfessionalTaxPolicy(
                policyPayload,
                currentCompanyId
            );

            policyId = policy.id;
            setPTEditingPolicyId(policyId);
        } else if (!versionId) {
            // A previous attempt may have created the master but failed
            // before creating the version. Reuse the existing master.
            await updateProfessionalTaxPolicy(
                policyId,
                policyPayload,
                currentCompanyId
            );
        }

        // Step B: Create a draft version, or update the existing draft.
        const versionPayload = {
            ...ptPolicyForm,
            effective_to: ptPolicyForm.effective_to || null,
            special_collection_month:
                ptPolicyForm.special_collection_month === ""
                    ? null
                    : Number(ptPolicyForm.special_collection_month),
            exemption_rules: ptPolicyForm.exemption_rules.trim()
                ? { notes: ptPolicyForm.exemption_rules.trim() }
                : {},
            source_reference: ptPolicyForm.source_reference.trim() || null,
            remarks: ptPolicyForm.remarks.trim() || null
        };

        if (!versionId) {
            const version = await createProfessionalTaxPolicyVersion(
                policyId,
                versionPayload,
                currentCompanyId
            );

            versionId = version.id;
            setPTEditingVersionId(versionId);
        } else {
            await updateProfessionalTaxPolicyVersion(
                versionId,
                versionPayload,
                currentCompanyId
            );
        }

        // Step C: Save the salary slabs for this draft version.
        await saveProfessionalTaxPolicySlabs(
            versionId,
            ptSlabs,
            currentCompanyId
        );

        // Step D: Reload from Supabase to confirm persisted data.
        await loadPTPolicyData(currentCompanyId);

resetPTPolicyForm();

setMessage(
    "PT policy draft and salary slabs saved successfully. The policy has not been activated."
);
    } catch (error) {
        console.error("Unable to save PT policy:", error);

        setErrorMessage(
            error.message ||
            "Unable to save PT policy. Check the database response and try again."
        );

        // Retain the policy/version IDs so a retry does not automatically
        // create a second master or version if an earlier step succeeded.
    } finally {
        setPTPolicySaving(false);
    }
}



async function handleActivatePTPolicyVersion(policy) {
    if (!currentCompanyId || !policy?.id) {
        setErrorMessage("Company or PT policy version is missing.");
        return;
    }

    if (policy.status !== "DRAFT") {
        setErrorMessage("Only draft PT policy versions can be activated.");
        return;
    }

    const confirmed = window.confirm(
        `Activate "${policy.policy_name}" version ${policy.version_number}, effective ${policy.effective_from}? Verify the state rules and salary slabs first.`
    );

    if (!confirmed) return;

    try {
        setPTPolicySaving(true);
        setErrorMessage("");
        setMessage("");

        await activateProfessionalTaxPolicyVersion(
            policy.id,
            currentCompanyId
        );

        await loadPTPolicyData(currentCompanyId);

        setMessage(
            `PT policy version ${policy.version_number} activated successfully.`
        );
    } catch (error) {
        console.error("PT activation failed:", error);
        setErrorMessage(
            error.message || "Unable to activate the PT policy."
        );
    } finally {
        setPTPolicySaving(false);
    }
}

async function handleDeactivatePTPolicyVersion(policy) {
    if (!currentCompanyId || !policy?.id) {
        setErrorMessage("Company or PT policy version is missing.");
        return;
    }

    if (policy.status !== "ACTIVE") {
        setErrorMessage("Only active PT policy versions can be deactivated.");
        return;
    }

    const confirmed = window.confirm(
        `Deactivate "${policy.policy_name}" version ${policy.version_number}? Check whether employees currently rely on this policy before continuing.`
    );

    if (!confirmed) return;

    try {
        setPTPolicySaving(true);
        setErrorMessage("");
        setMessage("");

        await deactivateProfessionalTaxPolicyVersion(
            policy.id,
            currentCompanyId
        );

        await loadPTPolicyData(currentCompanyId);

        setMessage(
            `PT policy version ${policy.version_number} deactivated successfully.`
        );
    } catch (error) {
        console.error("PT deactivation failed:", error);
        setErrorMessage(
            error.message || "Unable to deactivate the PT policy."
        );
    } finally {
        setPTPolicySaving(false);
    }
}

    

function handleTdsPolicyChange(event) {
    const { name, value } = event.target;

    setTdsPolicyForm(previous => ({
        ...previous,
        [name]: value
    }));
}

function handleTdsSlabChange(index, field, value) {
    setTdsSlabs(previous =>
        previous.map((slab, i) =>
            i === index
                ? { ...slab, [field]: value }
                : slab
        )
    );
}

function addTdsSlab() {
    const last = tdsSlabs[tdsSlabs.length - 1];

    setTdsSlabs(previous => [
        ...previous.map((slab, i) =>
            i === previous.length - 1 && !slab.income_to
                ? { ...slab, income_to: "" }
                : slab
        ),
        {
            income_from: last?.income_to || "",
            income_to: "",
            tax_rate_percent: ""
        }
    ]);
}

function removeTdsSlab(index) {
    setTdsSlabs(previous =>
        previous.filter((_, i) => i !== index)
    );
}

async function handleNewTdsPolicy() {
    setTdsPolicyForm(initialTdsPolicy);
    setTdsSlabs(initialTdsSlabs);
    setSelectedTdsPolicyId("");
    setMessage("");
    setErrorMessage("");
}

async function handleSelectTdsPolicy(policyId) {
    if (!policyId) {
        handleNewTdsPolicy();
        return;
    }

    try {
        setTdsLoading(true);
        setErrorMessage("");
        setMessage("");

        const policy = await getSalaryTdsPolicy(
            policyId,
            currentCompanyId
        );

        setSelectedTdsPolicyId(policy.id);
        setTdsPolicyForm({
            ...initialTdsPolicy,
            ...policy,
            effective_to: policy.effective_to || "",
            standard_deduction: String(policy.standard_deduction ?? 0),
            rebate_income_limit: String(policy.rebate_income_limit ?? 0),
            maximum_rebate: String(policy.maximum_rebate ?? 0),
            cess_percent: String(policy.cess_percent ?? 4),
            remarks: policy.calculation_settings?.remarks || ""
        });

        setTdsSlabs(
            (policy.slabs || []).map(slab => ({
                income_from: String(slab.income_from),
                income_to: slab.income_to == null ? "" : String(slab.income_to),
                tax_rate_percent: String(slab.tax_rate_percent)
            }))
        );
    } catch (error) {
        setErrorMessage(error.message || "Unable to load TDS policy.");
    } finally {
        setTdsLoading(false);
    }
}

async function handleSaveTdsPolicy() {
    if (!currentCompanyId) {
        setErrorMessage("Please select a company first.");
        return;
    }

    if (
        !tdsPolicyForm.policy_code.trim() ||
        !tdsPolicyForm.policy_name.trim() ||
        !tdsPolicyForm.tax_year ||
        !tdsPolicyForm.tax_regime ||
        !tdsPolicyForm.effective_from
    ) {
        setErrorMessage(
            "Enter policy code, name, tax year, regime and effective-from date."
        );
        return;
    }

    if (
        tdsPolicyForm.effective_to &&
        tdsPolicyForm.effective_to < tdsPolicyForm.effective_from
    ) {
        setErrorMessage("Effective-to date cannot precede effective-from date.");
        return;
    }

    try {
        setTdsSaving(true);
        setErrorMessage("");
        setMessage("");

        const payload = {
            policy_code: tdsPolicyForm.policy_code.trim(),
            policy_name: tdsPolicyForm.policy_name.trim(),
            tax_year: tdsPolicyForm.tax_year,
            applicable_act: tdsPolicyForm.applicable_act,
            tax_regime: tdsPolicyForm.tax_regime,
            effective_from: tdsPolicyForm.effective_from,
            effective_to: tdsPolicyForm.effective_to || null,
            standard_deduction: Number(tdsPolicyForm.standard_deduction || 0),
            rebate_income_limit: Number(tdsPolicyForm.rebate_income_limit || 0),
            maximum_rebate: Number(tdsPolicyForm.maximum_rebate || 0),
            cess_percent: Number(tdsPolicyForm.cess_percent || 0),
            calculation_settings: {
                remarks: tdsPolicyForm.remarks || ""
            }
        };

        let saved;

        if (selectedTdsPolicyId) {
            saved = await updateSalaryTdsPolicy(
                selectedTdsPolicyId,
                payload,
                currentCompanyId
            );
        } else {
            saved = await createSalaryTdsPolicy(
                payload,
                currentCompanyId
            );
            setSelectedTdsPolicyId(saved.id);
        }

        await saveSalaryTdsSlabs(
            saved.id,
            tdsSlabs,
            currentCompanyId
        );

        const refreshed = await getSalaryTdsPolicies(currentCompanyId);
        setTdsPolicies(refreshed || []);
        setTdsPolicyForm(previous => ({ ...previous, id: saved.id }));

        setMessage(
            "TDS policy and slabs saved as Draft. Verify the official tax rules before activation."
        );
    } catch (error) {
        setErrorMessage(error.message || "Unable to save TDS policy.");
    } finally {
        setTdsSaving(false);
    }
}

async function handleActivateTdsPolicy() {
    if (!selectedTdsPolicyId) {
        setErrorMessage("Save the policy as a Draft before activating it.");
        return;
    }

    if (!window.confirm(
        "Activate this policy? Confirm that its tax slabs, rebate, deductions and other rules have been verified for the selected tax year."
    )) return;

    try {
        setTdsSaving(true);
        setErrorMessage("");
        setMessage("");

        await activateSalaryTdsPolicy(
            selectedTdsPolicyId,
            currentCompanyId
        );

        const refreshed = await getSalaryTdsPolicies(currentCompanyId);
        setTdsPolicies(refreshed || []);

        setTdsPolicyForm(previous => ({
            ...previous,
            policy_status: "ACTIVE"
        }));

        setMessage("Policy activated. Confirm its legal calculations before using it for payroll.");
    } catch (error) {
        setErrorMessage(error.message || "Unable to activate TDS policy.");
    } finally {
        setTdsSaving(false);
    }
}

async function loadStatutoryPolicies() {
    if (!currentCompanyId) {
        setStatutoryPolicies([]);
        return;
    }

    try {
        setStatutoryPolicyLoading(true);

        const policies = await getStatutoryPolicies(currentCompanyId);

        setStatutoryPolicies(policies || []);
    } catch (error) {
        console.error("Unable to load statutory policies:", error);
        setErrorMessage(
            error.message || "Unable to load statutory policy history."
        );
    } finally {
        setStatutoryPolicyLoading(false);
    }
}

function handleStatutoryPolicyChange(event) {
    const { name, value } = event.target;

    setStatutoryPolicyForm(previous => ({
        ...previous,
        [name]: value,
        ...(name === "policy_code"
            ? { policy_name: getStatutoryPolicyName(value) }
            : {})
    }));
}

function resetStatutoryPolicyForm() {
    setStatutoryPolicyForm(initialStatutoryPolicyForm);
    setMessage("");
    setErrorMessage("");
}

async function handleSaveStatutoryPolicy() {
    if (!currentCompanyId) {
        setErrorMessage("Please select a company first.");
        return;
    }

    const form = statutoryPolicyForm;

    if (!form.policy_code || !form.policy_name.trim()) {
        setErrorMessage("Select a policy type and enter its name.");
        return;
    }

    if (!form.effective_from) {
        setErrorMessage("Enter the policy effective-from date.");
        return;
    }

    if (
        form.effective_to &&
        form.effective_to < form.effective_from
    ) {
        setErrorMessage(
            "Effective-to date cannot precede effective-from date."
        );
        return;
    }

    const numericFields = [
        ["Rate", form.rate_percent],
        ["Fixed amount", form.fixed_amount],
        ["Wage floor", form.wage_floor],
        ["Wage ceiling", form.wage_ceiling]
    ];

    for (const [label, value] of numericFields) {
        if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
            setErrorMessage(`${label} must be a valid non-negative number.`);
            return;
        }
    }

    if (
        form.wage_floor !== "" &&
        form.wage_ceiling !== "" &&
        Number(form.wage_ceiling) < Number(form.wage_floor)
    ) {
        setErrorMessage("Wage ceiling cannot be lower than wage floor.");
        return;
    }

    if (
        form.rate_percent === "" &&
        form.fixed_amount === "" &&
        !["SLAB", "OTHER"].includes(form.calculation_base)
    ) {
        setErrorMessage(
            "Enter a rate or fixed amount, or select a slab/other calculation."
        );
        return;
    }

    try {
        setStatutoryPolicySaving(true);
        setErrorMessage("");
        setMessage("");

        await createStatutoryPolicyVersion({
            companyId: currentCompanyId,
            policyCode: form.policy_code,
            policyName: form.policy_name.trim(),
            effectiveFrom: form.effective_from,
            effectiveTo: form.effective_to || null,
            ratePercent:
                form.rate_percent === "" ? null : Number(form.rate_percent),
            fixedAmount:
                form.fixed_amount === "" ? null : Number(form.fixed_amount),
            wageFloor:
                form.wage_floor === "" ? null : Number(form.wage_floor),
            wageCeiling:
                form.wage_ceiling === "" ? null : Number(form.wage_ceiling),
            calculationBase: form.calculation_base,
            eligibilityRules: {},
            calculationRules: {},
            sourceReference: form.source_reference.trim() || null,
            remarks: form.remarks.trim() || null
        });

        await loadStatutoryPolicies();
        resetStatutoryPolicyForm();

        setMessage(
            "Statutory policy saved as a Draft. It has not been activated or connected to payroll calculations."
        );
    } catch (error) {
        console.error("Unable to save statutory policy:", error);
        setErrorMessage(error.message || "Unable to save statutory policy.");
    } finally {
        setStatutoryPolicySaving(false);
    }
}

async function handleActivateStatutoryPolicy(policy) {
    if (!currentCompanyId || !policy?.id) {
        setErrorMessage("The selected company or policy is missing.");
        return;
    }

    if (policy.is_active) {
        setMessage("This policy is already active.");
        return;
    }

    const confirmed = window.confirm(
        `Activate "${policy.policy_name}" from ${policy.effective_from}? Verify the official statutory rate, wage ceiling, eligibility rules and calculation basis first.`
    );

    if (!confirmed) return;

    try {
        setStatutoryPolicySaving(true);
        setErrorMessage("");
        setMessage("");

        
await activateStatutoryPolicyPackage(
    currentCompanyId,
    policy.id
);

await loadStatutoryPolicyPackages(currentCompanyId);


        setMessage(
            "Policy activated successfully. Payroll integration and legal validation remain separate steps."
        );
    } catch (error) {
        console.error("Unable to activate statutory policy:", error);
        setErrorMessage(error.message || "Unable to activate statutory policy.");
    } finally {
        setStatutoryPolicySaving(false);
    }
}
   
async function handleActivateStatutoryPolicyPackage(policy) {
    if (!currentCompanyId || !policy?.id) {
        setErrorMessage("The selected company or package is missing.");
        return;
    }

    if (policy.status === "ACTIVE") {
        setMessage("This package is already active.");
        return;
    }

    const confirmed = window.confirm(
        `Activate statutory package Version ${policy.version_number}, effective ${policy.effective_from}?`
    );

    if (!confirmed) return;

    try {
        setStatutoryPolicySaving(true);
        setErrorMessage("");
        setMessage("");

        await activateStatutoryPolicyPackage(
            currentCompanyId,
            policy.id
        );

        await loadStatutoryPolicyPackages(currentCompanyId);

        setMessage(
            `Statutory package Version ${policy.version_number} activated successfully.`
        );
    } catch (error) {
        console.error("Unable to activate statutory package:", error);
        setErrorMessage(
            error.message || "Unable to activate statutory package."
        );
    } finally {
        setStatutoryPolicySaving(false);
    }
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


const loadStatutoryPolicyPackages = async (companyId) => {
    if (!companyId) {
        setStatutoryPolicyPackages([]);
        return;
    }

    try {
        setStatutoryPolicyLoading(true);

        const packages = await getStatutoryPolicyPackages(companyId);

        setStatutoryPolicyPackages(packages || []);
    } catch (error) {
        console.error(
            "Unable to load statutory package history:",
            error
        );
        setErrorMessage(
            error.message || "Unable to load statutory package history."
        );
    } finally {
        setStatutoryPolicyLoading(false);
    }
};

    
    const handleSaveComponentDraft = async () => {
    if (!currentCompanyId) {
        alert("Please select a company first.");
        return;
    }

    if (!components.effective_from) {
        alert("Please select the package effective date.");
        return;
    }

    if (
        components.effective_to &&
        components.effective_to < components.effective_from
    ) {
        alert(
            "Effective To cannot be earlier than Effective From."
        );
        return;
    }

    const policyName =
        String(components.policy_name || "").trim() ||
        `Statutory Package - ${components.effective_from}`;

    try {
        setLoading(true);

        const savedPackage =
            await createStatutoryPolicyPackageDraft({
                companyId: currentCompanyId,
                policyName,
                effectiveFrom: components.effective_from,
                policyData: components,
                remarks: components.remarks || null
            });

        
await loadStatutoryPolicyPackages(currentCompanyId);

// Reset the package form only after the draft is saved.
setComponents(initialComponents);

alert(
    `Draft package Version ${savedPackage.version_number} saved successfully.`
);

    } catch (error) {
        console.error(
            "Unable to save statutory policy package:",
            error
        );

        alert(
            error.message ||
            "Unable to save the statutory policy package."
        );
    } finally {
        setLoading(false);
    }
};

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


    const filteredStatutoryHistory = statutoryPolicyPackages.filter(
    (policy) => {
        const search = historySearch.trim().toLowerCase();

        const matchesSearch =
            !search ||
            String(policy.policy_name || "").toLowerCase().includes(search) ||
            String(policy.version_number || "").toLowerCase().includes(search) ||
            String(policy.remarks || "").toLowerCase().includes(search) ||
            String(policy.effective_from || "").includes(search) ||
            String(policy.effective_to || "").includes(search);

        const matchesStatus =
            historyStatus === "ALL" ||
            String(policy.status || "").toUpperCase() === historyStatus;

        const matchesFromDate =
            !historyFromDate ||
            (
                policy.effective_from &&
                policy.effective_from >= historyFromDate
            );

        const matchesToDate =
            !historyToDate ||
            (
                policy.effective_from &&
                policy.effective_from <= historyToDate
            );

        return (
            matchesSearch &&
            matchesStatus &&
            matchesFromDate &&
            matchesToDate
        );
    }
);

    

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
                            <Section
    title="Statutory Policy Version Manager"
    description="Create company-specific, effective-dated statutory policy versions. Each saved policy starts as a draft."
>
    <div className="sc-grid">
        <Field
            label="Policy type"
            name="policy_code"
            value={statutoryPolicyForm.policy_code}
            onChange={handleStatutoryPolicyChange}
            options={statutoryPolicyTypes}
        />

        <Field
            label="Policy name"
            name="policy_name"
            value={statutoryPolicyForm.policy_name}
            onChange={handleStatutoryPolicyChange}
        />

        <Field
            label="Effective from"
            name="effective_from"
            type="date"
            value={statutoryPolicyForm.effective_from}
            onChange={handleStatutoryPolicyChange}
        />

        <Field
            label="Effective to (optional)"
            name="effective_to"
            type="date"
            value={statutoryPolicyForm.effective_to}
            onChange={handleStatutoryPolicyChange}
        />

        <RateField
            label="Contribution / calculation rate (%)"
            name="rate_percent"
            value={statutoryPolicyForm.rate_percent}
            onChange={handleStatutoryPolicyChange}
        />

        <AmountField
            label="Fixed amount (₹)"
            name="fixed_amount"
            value={statutoryPolicyForm.fixed_amount}
            onChange={handleStatutoryPolicyChange}
        />

        <AmountField
            label="Wage floor (₹ / month)"
            name="wage_floor"
            value={statutoryPolicyForm.wage_floor}
            onChange={handleStatutoryPolicyChange}
        />

        <AmountField
            label="Wage ceiling (₹ / month)"
            name="wage_ceiling"
            value={statutoryPolicyForm.wage_ceiling}
            onChange={handleStatutoryPolicyChange}
        />

        <Field
            label="Calculation base"
            name="calculation_base"
            value={statutoryPolicyForm.calculation_base}
            onChange={handleStatutoryPolicyChange}
            options={statutoryCalculationBases}
        />

        <Field
            label="Official source reference"
            name="source_reference"
            value={statutoryPolicyForm.source_reference}
            onChange={handleStatutoryPolicyChange}
            placeholder="Official notification / circular reference"
        />

        <Field
            label="Remarks"
            name="remarks"
            value={statutoryPolicyForm.remarks}
            onChange={handleStatutoryPolicyChange}
            type="textarea"
        />
    </div>

    <div className="sc-notice">
        <strong>Draft and activation controls</strong>
        <p>
            Use verified statutory values only. Saving creates a draft;
            activating a policy does not by itself enable or alter payroll calculations.
        </p>
    </div>

    


</Section>
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

                    
{activeTab === "tds" && (
    <>
        <Section
            title="Salary Income Tax / TDS Policies"
            description="Create multiple company-scoped salary tax policies. Each policy has its own tax year, regime, effective dates and tax slabs."
        >
            <div className="sc-grid">
                <Field
                    label="Select existing policy"
                    name="selected_tds_policy"
                    value={selectedTdsPolicyId}
                    onChange={event => handleSelectTdsPolicy(event.target.value)}
                    options={[
                        { value: "", label: "Create a new policy" },
                        ...tdsPolicies.map(policy => ({
                            value: policy.id,
                            label: `${policy.policy_code} — ${policy.policy_name} (${policy.policy_status})`
                        }))
                    ]}
                />

                <div className="sc-field">
                    <label>Policy status</label>
                    <input
                        value={tdsPolicyForm.policy_status || "DRAFT"}
                        readOnly
                    />
                </div>
            </div>

            <div className="sc-actions">
                <button
                    type="button"
                    className="sc-button secondary"
                    onClick={handleNewTdsPolicy}
                >
                    + New Policy
                </button>
            </div>
        </Section>

        <Section
            title="Policy Details"
            description="Only Draft policies can be edited in this initial version."
        >
            <div className="sc-grid">
                <Field
                    label="Policy Code"
                    name="policy_code"
                    value={tdsPolicyForm.policy_code}
                    onChange={handleTdsPolicyChange}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                    placeholder="SALARY-TDS-NEW-2026-27"
                />

                <Field
                    label="Policy Name"
                    name="policy_name"
                    value={tdsPolicyForm.policy_name}
                    onChange={handleTdsPolicyChange}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                    placeholder="Salary TDS — New Regime"
                />

                <Field
                    label="Tax Year"
                    name="tax_year"
                    value={tdsPolicyForm.tax_year}
                    onChange={handleTdsPolicyChange}
                    options={[
                        { value: "2026-27", label: "2026–27" },
                        { value: "2027-28", label: "2027–28" }
                    ]}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <Field
                    label="Applicable law"
                    name="applicable_act"
                    value={tdsPolicyForm.applicable_act}
                    onChange={handleTdsPolicyChange}
                    options={[
                        {
                            value: "INCOME_TAX_ACT_2025",
                            label: "Income-tax Act, 2025"
                        },
                        {
                            value: "INCOME_TAX_ACT_1961",
                            label: "Income-tax Act, 1961 — historical"
                        }
                    ]}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <Field
                    label="Tax Regime"
                    name="tax_regime"
                    value={tdsPolicyForm.tax_regime}
                    onChange={handleTdsPolicyChange}
                    options={[
                        { value: "NEW", label: "New Tax Regime" },
                        { value: "OLD", label: "Old Tax Regime" }
                    ]}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <Field
                    label="Effective From"
                    name="effective_from"
                    type="date"
                    value={tdsPolicyForm.effective_from}
                    onChange={handleTdsPolicyChange}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <Field
                    label="Effective To (optional)"
                    name="effective_to"
                    type="date"
                    value={tdsPolicyForm.effective_to}
                    onChange={handleTdsPolicyChange}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <AmountField
                    label="Standard Deduction (₹ / year)"
                    name="standard_deduction"
                    value={tdsPolicyForm.standard_deduction}
                    onChange={handleTdsPolicyChange}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <AmountField
                    label="Rebate Income Limit (₹)"
                    name="rebate_income_limit"
                    value={tdsPolicyForm.rebate_income_limit}
                    onChange={handleTdsPolicyChange}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <AmountField
                    label="Maximum Rebate (₹)"
                    name="maximum_rebate"
                    value={tdsPolicyForm.maximum_rebate}
                    onChange={handleTdsPolicyChange}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <RateField
                    label="Health & Education Cess (%)"
                    name="cess_percent"
                    value={tdsPolicyForm.cess_percent}
                    onChange={handleTdsPolicyChange}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />

                <Field
                    label="Policy Notes / Source Reference"
                    name="remarks"
                    value={tdsPolicyForm.remarks}
                    onChange={handleTdsPolicyChange}
                    type="textarea"
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                />
            </div>
        </Section>

        <Section
            title="Income Tax Slabs"
            description="Enter continuous income ranges and their tax rates. The final slab must have no upper limit."
        >
            <div className="sc-table-wrap">
                <table className="sc-table">
                    <thead>
                        <tr>
                            <th>Income From (₹)</th>
                            <th>Income To (₹)</th>
                            <th>Rate (%)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tdsSlabs.map((slab, index) => (
                            <tr key={index}>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={slab.income_from}
                                        disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                                        onChange={event =>
                                            handleTdsSlabChange(
                                                index,
                                                "income_from",
                                                event.target.value
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={slab.income_to}
                                        placeholder="No upper limit"
                                        disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                                        onChange={event =>
                                            handleTdsSlabChange(
                                                index,
                                                "income_to",
                                                event.target.value
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.001"
                                        value={slab.tax_rate_percent}
                                        disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                                        onChange={event =>
                                            handleTdsSlabChange(
                                                index,
                                                "tax_rate_percent",
                                                event.target.value
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="sc-link-button danger"
                                        disabled={
                                            tdsPolicyForm.policy_status === "ACTIVE" ||
                                            tdsSlabs.length <= 1
                                        }
                                        onClick={() => removeTdsSlab(index)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="sc-actions">
                <button
                    type="button"
                    className="sc-button secondary"
                    onClick={addTdsSlab}
                    disabled={tdsPolicyForm.policy_status === "ACTIVE"}
                >
                    + Add Slab
                </button>
            </div>
        </Section>

        <div className="sc-notice">
            <strong>Before activation</strong>
            <p>
                Check the applicable tax year, regime, slab boundaries,
                rebate eligibility, marginal relief, surcharge, cess,
                exemptions and deduction rules against the official rules.
                This form does not yet configure every tax-law condition.
            </p>
        </div>

        <div className="sc-sticky-actions">
            <span>
                {tdsLoading ? "Loading policy..." : "Company-scoped TDS policy"}
            </span>

            <button
                type="button"
                className="sc-button primary"
                onClick={handleSaveTdsPolicy}
                disabled={
                    tdsSaving ||
                    tdsLoading ||
                    tdsPolicyForm.policy_status === "ACTIVE"
                }
            >
                {tdsSaving ? "Saving..." : "Save Draft"}
            </button>

            <button
                type="button"
                className="sc-button secondary"
                onClick={handleActivateTdsPolicy}
                disabled={
                    tdsSaving ||
                    tdsLoading ||
                    tdsPolicyForm.policy_status === "ACTIVE"
                }
            >
                Activate Policy
            </button>
        </div>
    </>
)}


                    {activeTab === "pt" && (
                        <>
                            
<Section
    title="Professional Tax Policy Master"
    description="Configure state-specific professional tax rules independently from employer registration details."
>
    <div className="sc-notice">
        <strong>Policy configuration</strong>
        <p>
            Configure the applicable State/UT rules and salary slabs.
            Leave legal values unverified until checked against the
            relevant official state notification.
        </p>
    </div>

    <div className="sc-grid">
        <Field
            label="State / UT"
            name="state_id"
            value={ptPolicyForm.state_id}
            onChange={handlePTPolicyChange}
            options={[
                { value: "", label: "Select State / UT" },
                ...states.map(state => ({
                    value: state.id,
                    label: state.state_name
                }))
            ]}
        />

        <Field
            label="Policy Name"
            name="policy_name"
            value={ptPolicyForm.policy_name}
            onChange={handlePTPolicyChange}
            placeholder="e.g. Andhra Pradesh PT Policy"
        />

        <Field
            label="Effective From"
            name="effective_from"
            type="date"
            value={ptPolicyForm.effective_from}
            onChange={handlePTPolicyChange}
        />

        <Field
            label="Effective To (optional)"
            name="effective_to"
            type="date"
            value={ptPolicyForm.effective_to}
            onChange={handlePTPolicyChange}
        />

        <Field
            label="Salary Basis"
            name="salary_basis"
            value={ptPolicyForm.salary_basis}
            onChange={handlePTPolicyChange}
            options={[
                { value: "GROSS_MONTHLY", label: "Monthly gross salary" },
                { value: "BASIC_DA", label: "Basic + DA" },
                { value: "CONFIGURED_COMPONENTS", label: "Configured eligible components" },
                { value: "OTHER", label: "Other / configured basis" }
            ]}
        />

        <Field
            label="Collection Frequency"
            name="collection_frequency"
            value={ptPolicyForm.collection_frequency}
            onChange={handlePTPolicyChange}
            options={[
                { value: "MONTHLY", label: "Monthly" },
                { value: "QUARTERLY", label: "Quarterly" },
                { value: "HALF_YEARLY", label: "Half-yearly" },
                { value: "ANNUALLY", label: "Annually" },
                { value: "CONFIGURED", label: "Other / configured" }
            ]}
        />

        <Field
            label="Special Collection Month (optional)"
            name="special_collection_month"
            value={ptPolicyForm.special_collection_month}
            onChange={handlePTPolicyChange}
            options={[
                { value: "", label: "No special month configured" },
                { value: "1", label: "January" },
                { value: "2", label: "February" },
                { value: "3", label: "March" },
                { value: "4", label: "April" },
                { value: "5", label: "May" },
                { value: "6", label: "June" },
                { value: "7", label: "July" },
                { value: "8", label: "August" },
                { value: "9", label: "September" },
                { value: "10", label: "October" },
                { value: "11", label: "November" },
                { value: "12", label: "December" }
            ]}
        />

        <Field
            label="Official Source Reference"
            name="source_reference"
            value={ptPolicyForm.source_reference}
            onChange={handlePTPolicyChange}
            placeholder="Notification / Act / official URL"
        />

        <Field
            label="Exemption Rules / Notes"
            name="exemption_rules"
            value={ptPolicyForm.exemption_rules}
            onChange={handlePTPolicyChange}
            type="textarea"
            placeholder="Describe verified exemptions or special conditions"
        />

        <Field
            label="Policy Remarks"
            name="remarks"
            value={ptPolicyForm.remarks}
            onChange={handlePTPolicyChange}
            type="textarea"
        />
    </div>

    <div className="sc-divider" />

    <Section
        title="Professional Tax Salary Slabs"
        description="Each slab specifies the eligible salary range and the tax amount. Values are configurable, not hard-coded by state."
    >
        <div className="sc-table-wrap">
            <table className="sc-table">
                <thead>
                    <tr>
                        <th>Salary From (₹)</th>
                        <th>Salary To (₹)</th>
                        <th>PT Amount (₹)</th>
                        <th>Slab Remarks</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {ptSlabs.map((slab, index) => (
                        <tr key={index}>
                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={slab.salary_from}
                                    onChange={event =>
                                        handlePTSlabChange(
                                            index,
                                            "salary_from",
                                            event.target.value
                                        )
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={slab.salary_to}
                                    placeholder={
                                        index === ptSlabs.length - 1
                                            ? "No upper limit"
                                            : "Enter maximum"
                                    }
                                    onChange={event =>
                                        handlePTSlabChange(
                                            index,
                                            "salary_to",
                                            event.target.value
                                        )
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={slab.pt_amount}
                                    onChange={event =>
                                        handlePTSlabChange(
                                            index,
                                            "pt_amount",
                                            event.target.value
                                        )
                                    }
                                />
                            </td>

                            <td>
                                <input
                                    type="text"
                                    value={slab.remarks}
                                    placeholder="Optional"
                                    onChange={event =>
                                        handlePTSlabChange(
                                            index,
                                            "remarks",
                                            event.target.value
                                        )
                                    }
                                />
                            </td>

                            <td>
                                <button
                                    type="button"
                                    className="sc-link-button danger"
                                    disabled={ptSlabs.length <= 1}
                                    onClick={() => removePTSlab(index)}
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="sc-actions">
            <button
                type="button"
                className="sc-button secondary"
                onClick={addPTSlab}
            >
                + Add Salary Slab
            </button>
        </div>
    </Section>

    <Section
        title="Policy Status"
        description="Status is a UI placeholder until policy persistence is implemented."
    >
        <Toggle
            label="Enable this policy"
            name="is_enabled"
            checked={ptPolicyForm.is_enabled}
            onChange={handlePTPolicyChange}
            help="Does not activate or apply the policy to payroll in this UI-only phase."
        />
    </Section>

    
    <div className="sc-actions">
        <button
            type="button"
            className="sc-button secondary"
            onClick={resetPTPolicyForm}
            disabled={ptPolicySaving}
        >
            New / Clear Form
        </button>

        <button
            type="button"
            className="sc-button primary"
            onClick={handleSavePTPolicyDraft}
            disabled={ptPolicySaving || ptPolicyLoading}
        >
            {ptPolicySaving
                ? "Saving..."
                : ptEditingVersionId
                    ? "Update PT Draft"
                    : "Save PT Policy Draft"}
        </button>
    </div>

</Section>

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
    <>
        <Section
            title="Statutory Policy History"
            description="Search, review and manage company-specific statutory policy versions and effective periods."
        >
            <div className="sc-history-toolbar">
                <div className="sc-history-search">
                    <label htmlFor="historySearch">
                        Search policy history
                    </label>
                    <input
                        id="historySearch"
                        type="search"
                        value={historySearch}
                        onChange={(event) =>
                            setHistorySearch(event.target.value)
                        }
                        placeholder="Search policy name, version, date or remarks..."
                    />
                </div>

                <div className="sc-history-filter">
                    <label htmlFor="historyStatus">
                        Policy Status
                    </label>
                    <select
                        id="historyStatus"
                        value={historyStatus}
                        onChange={(event) =>
                            setHistoryStatus(event.target.value)
                        }
                    >
                        <option value="ALL">All statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUPERSEDED">Superseded</option>
                    </select>
                </div>

                <div className="sc-history-filter">
                    <label htmlFor="historyFromDate">
                        Effective From
                    </label>
                    <input
                        id="historyFromDate"
                        type="date"
                        value={historyFromDate}
                        onChange={(event) =>
                            setHistoryFromDate(event.target.value)
                        }
                    />
                </div>

                <div className="sc-history-filter">
                    <label htmlFor="historyToDate">
                        Effective From Until
                    </label>
                    <input
                        id="historyToDate"
                        type="date"
                        value={historyToDate}
                        onChange={(event) =>
                            setHistoryToDate(event.target.value)
                        }
                    />
                </div>

                <button
                    type="button"
                    className="sc-button secondary"
                    onClick={() => {
                        setHistorySearch("");
                        setHistoryStatus("ALL");
                        setHistoryFromDate("");
                        setHistoryToDate("");
                    }}
                >
                    Clear Filters
                </button>
            </div>

            <div className="sc-history-category">
                <button
                    type="button"
                    className={
                        historyCategory === "STATUTORY"
                            ? "sc-button primary"
                            : "sc-button secondary"
                    }
                    onClick={() => {
                        setHistoryCategory("STATUTORY");
                        setHistoryDetailsPolicy(null);
                    }}
                >
                    Statutory Contributions
                </button>

                <button
                    type="button"
                    className={
                        historyCategory === "PT"
                            ? "sc-button primary"
                            : "sc-button secondary"
                    }
                    onClick={() => {
                        setHistoryCategory("PT");
                        setHistoryDetailsPolicy(null);
                    }}
                >
                    Professional Tax
                </button>

                <button
                    type="button"
                    className={
                        historyCategory === "TDS"
                            ? "sc-button primary"
                            : "sc-button secondary"
                    }
                    onClick={() => {
                        setHistoryCategory("TDS");
                        setHistoryDetailsPolicy(null);
                    }}
                >
                    Income Tax / TDS
                </button>
            </div>

            {historyCategory === "STATUTORY" ? (
                <>
                    <div className="sc-history-results-heading">
                        <div>
                            <h4>Statutory Contribution Versions</h4>
                            <p className="sc-muted">
                                Company-level statutory policy packages.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="sc-button secondary"
                            onClick={() =>
                                loadStatutoryPolicyPackages(
                                    currentCompanyId
                                )
                            }
                            disabled={
                                statutoryPolicyLoading ||
                                !currentCompanyId
                            }
                        >
                            {statutoryPolicyLoading
                                ? "Refreshing..."
                                : "Refresh History"}
                        </button>
                    </div>

                    {statutoryPolicyLoading ? (
                        <p className="sc-muted">
                            Loading statutory package history...
                        </p>
                    ) : filteredStatutoryHistory.length === 0 ? (
                        <p className="sc-muted">
                            No statutory policy versions match your filters.
                        </p>
                    ) : (
                        <div className="sc-table-wrap">
                            <table className="sc-table">
                                <thead>
                                    <tr>
                                        <th>Version</th>
                                        <th>Policy Name</th>
                                        <th>Effective From</th>
                                        <th>Effective To</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStatutoryHistory.map(
                                        (policy) => (
                                            <tr key={policy.id}>
                                                <td>
                                                    {policy.version_number ?? "-"}
                                                </td>
                                                <td>
                                                    {policy.policy_name || "-"}
                                                </td>
                                                <td>
                                                    {policy.effective_from || "-"}
                                                </td>
                                                <td>
                                                    {policy.effective_to ||
                                                        "No end date"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={
                                                            String(
                                                                policy.status
                                                            ).toUpperCase() ===
                                                            "ACTIVE"
                                                                ? "sc-status active"
                                                                : "sc-status inactive"
                                                        }
                                                    >
                                                        {policy.status || "UNKNOWN"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {policy.remarks || "-"}
                                                </td>
                                                <td>
                                                    <div className="sc-history-row-actions">
                                                        <button
                                                            type="button"
                                                            className="sc-link-button"
                                                            onClick={() =>
                                                                setHistoryDetailsPolicy(
                                                                    policy
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                        {policy.status ===
                                                            "DRAFT" && (
                                                            <button
                                                                type="button"
                                                                className="sc-link-button"
                                                                disabled={
                                                                    statutoryPolicySaving
                                                                }
                                                                onClick={() =>
                                                                    handleActivateStatutoryPolicyPackage(
                                                                        policy
                                                                    )
                                                                }
                                                            >
                                                                Activate
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {historyDetailsPolicy && (
                        <div className="sc-history-detail">
                            <div className="sc-history-results-heading">
                                <h4>Policy Version Details</h4>
                                <button
                                    type="button"
                                    className="sc-button secondary"
                                    onClick={() =>
                                        setHistoryDetailsPolicy(null)
                                    }
                                >
                                    Close Details
                                </button>
                            </div>

                            <div className="sc-history-detail-grid">
                                <div>
                                    <span>Policy Name</span>
                                    <strong>
                                        {historyDetailsPolicy.policy_name || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Version</span>
                                    <strong>
                                        {historyDetailsPolicy.version_number ?? "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Effective From</span>
                                    <strong>
                                        {historyDetailsPolicy.effective_from || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Effective To</span>
                                    <strong>
                                        {historyDetailsPolicy.effective_to ||
                                            "No end date"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Status</span>
                                    <strong>
                                        {historyDetailsPolicy.status || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Remarks</span>
                                    <strong>
                                        {historyDetailsPolicy.remarks || "-"}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}
                </>
                        ) : historyCategory === "PT" ? (
    <div>
        <div className="sc-history-results-heading">
            <div>
                <h4>Professional Tax Policy Versions</h4>
                <p className="sc-muted">
                    Drafts and saved versions for the selected company.
                </p>
            </div>

            <button
                type="button"
                className="sc-button secondary"
                onClick={() => loadPTPolicyData(currentCompanyId)}
                disabled={ptPolicyLoading}
            >
                {ptPolicyLoading ? "Refreshing..." : "Refresh PT History"}
            </button>
        </div>

        {ptPolicyLoading ? (
            <p className="sc-muted">Loading PT policy history...</p>
        ) : ptPolicyHistory.length === 0 ? (
            <p className="sc-muted">
                No PT policy versions found for this company.
            </p>
        ) : (
            <div className="sc-table-wrap">
                <table className="sc-table">
                    <thead>
                        <tr>
                            <th>Policy</th>
                            <th>Version</th>
                            <th>Effective From</th>
                            <th>Effective To</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {ptPolicyHistory
                            .filter(policy => {
                                const search = historySearch.trim().toLowerCase();

                                const matchesSearch =
                                    !search ||
                                    String(policy.policy_name || "")
                                        .toLowerCase().includes(search) ||
                                    String(policy.version_number || "")
                                        .toLowerCase().includes(search) ||
                                    String(policy.source_reference || "")
                                        .toLowerCase().includes(search);

                                const matchesStatus =
                                    historyStatus === "ALL" ||
                                    String(policy.status || "").toUpperCase() ===
                                        historyStatus;

                                const matchesFrom =
                                    !historyFromDate ||
                                    policy.effective_from >= historyFromDate;

                                const matchesTo =
                                    !historyToDate ||
                                    policy.effective_from <= historyToDate;

                                return (
                                    matchesSearch &&
                                    matchesStatus &&
                                    matchesFrom &&
                                    matchesTo
                                );
                            })
                            .map(policy => (
                                <tr key={policy.id}>
                                    <td>{policy.policy_name || "-"}</td>
                                    <td>{policy.version_number ?? "-"}</td>
                                    <td>{policy.effective_from || "-"}</td>
                                    <td>{policy.effective_to || "No end date"}</td>
                                    <td>
                                        <span
                                            className={
                                                policy.status === "ACTIVE"
                                                    ? "sc-status active"
                                                    : "sc-status inactive"
                                            }
                                        >
                                            {policy.status || "UNKNOWN"}
                                        </span>
                                    </td>
                                    
<td>
    <div className="sc-history-row-actions">
        {policy.status === "DRAFT" && (
            <button
                type="button"
                className="sc-link-button"
                disabled={ptPolicySaving || ptPolicyLoading}
                onClick={() =>
                    handleActivatePTPolicyVersion(policy)
                }
            >
                {ptPolicySaving ? "Processing..." : "Activate"}
            </button>
        )}

        {policy.status === "ACTIVE" && (
            <button
                type="button"
                className="sc-link-button danger"
                disabled={ptPolicySaving || ptPolicyLoading}
                onClick={() =>
                    handleDeactivatePTPolicyVersion(policy)
                }
            >
                {ptPolicySaving ? "Processing..." : "Deactivate"}
            </button>
        )}

        {policy.status === "SUPERSEDED" && (
            <span className="sc-muted">Replaced</span>
        )}

        {policy.status === "INACTIVE" && (
            <span className="sc-muted">Inactive</span>
        )}
    </div>
</td>

                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
) : (
    <div className="sc-history-placeholder">
        <h4>Income Tax / TDS Policy History</h4>
        <p>
            TDS policy history remains connected to its separate
            service and will be handled in the TDS phase.
        </p>
    </div>


            )}
        </Section>
    </>
)}

                </>
            )}
        </div>
    );
}

export default StatutoryConfiguration;
