
import React, { useCallback, useEffect, useState } from "react";
import { useCompany } from "../../../context/CompanyContext";
import {
    getLeavePolicies,
    createLeavePolicy,
    updateLeavePolicy,
    deactivateLeavePolicy,
    getLeavePolicyTypes,
    createLeavePolicyType,
    updateLeavePolicyType,
    deactivateLeavePolicyType,
} from "../../../services/hr/leavePolicyService";

const EMPTY_POLICY = {
    policy_name: "",
    remarks: "",
    is_active: true,
    leave_policy_enabled: true,
    leave_accrual_enabled: true,
    monthly_accrual_enabled: true,
    prorate_joining_month: true,
    prorate_leaving_month: true,
    carry_forward_enabled: false,
    maximum_carry_forward_days: 0,
    carry_forward_expiry_enabled: false,
    carry_forward_expiry_months: 12,
    leave_encashment_enabled: false,
    encashment_during_employment: false,
    encashment_during_final_settlement: true,
    encashment_basis: "BASIC",
    maximum_encashment_days: 0,
    negative_leave_balance_allowed: false,
    maximum_negative_balance: 0,
    half_day_leave_enabled: true,
    quarter_day_leave_enabled: false,
    sandwich_rule_enabled: false,
    prefix_rule_enabled: false,
    suffix_rule_enabled: false,
    holiday_between_leave_enabled: false,
    weekly_off_between_leave_enabled: false,
};

const EMPTY_TYPE = {
    leave_type_name: "",
    leave_type_code: "",
    is_active: true,
    entitlement_enabled: true,
    entitlement_type: "MONTHLY",
    entitlement_value: 1,
    maximum_annual_days: 12,
    carry_forward_allowed: false,
    maximum_carry_forward_days: 0,
    encashment_allowed: false,
    maximum_encashment_days: 0,
    loss_of_pay_when_exhausted: true,
    remarks: "",
};

const POLICY_SECTIONS = [
    {
        title: "1. Policy and accrual",
        fields: [
            ["leave_policy_enabled", "Enable leave policy"],
            ["leave_accrual_enabled", "Enable leave accrual"],
            ["monthly_accrual_enabled", "Accrue monthly"],
            ["prorate_joining_month", "Prorate joining month"],
            ["prorate_leaving_month", "Prorate leaving month"],
        ],
    },
    {
        title: "2. Carry forward",
        fields: [
            ["carry_forward_enabled", "Allow carry forward"],
            ["carry_forward_expiry_enabled", "Enable expiry"],
        ],
    },
    {
        title: "3. Encashment",
        fields: [
            ["leave_encashment_enabled", "Allow leave encashment"],
            ["encashment_during_employment", "During employment"],
            ["encashment_during_final_settlement", "During final settlement"],
        ],
    },
    {
        title: "4. Leave balance and duration",
        fields: [
            ["negative_leave_balance_allowed", "Allow negative balance"],
            ["half_day_leave_enabled", "Allow half-day leave"],
            ["quarter_day_leave_enabled", "Allow quarter-day leave"],
        ],
    },
    {
        title: "5. Date-counting rules",
        fields: [
            ["sandwich_rule_enabled", "Enable sandwich rule"],
            ["prefix_rule_enabled", "Count prefix days"],
            ["suffix_rule_enabled", "Count suffix days"],
            ["holiday_between_leave_enabled", "Count intervening holidays"],
            ["weekly_off_between_leave_enabled", "Count intervening weekly offs"],
        ],
    },
];

const POLICY_NUMBERS = [
    ["maximum_carry_forward_days", "Maximum carry-forward days"],
    ["carry_forward_expiry_months", "Expiry after (months)"],
    ["maximum_encashment_days", "Maximum encashment days"],
    ["maximum_negative_balance", "Maximum negative balance (days)"],
];

const TYPE_NUMBERS = [
    ["entitlement_value", "Entitlement value"],
    ["maximum_annual_days", "Maximum annual days"],
    ["maximum_carry_forward_days", "Maximum carry-forward days"],
    ["maximum_encashment_days", "Maximum encashment days"],
];

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px",
    border: "1px solid #ccc",
    borderRadius: "5px",
};

const panelStyle = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
};

function CheckField({ field, label, value, onChange }) {
    return (
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => onChange(field, event.target.checked)}
            />
            {label}
        </label>
    );
}

export default function LeavePolicies() {
    const { currentCompanyId } = useCompany();

    const [policies, setPolicies] = useState([]);
    const [policyForm, setPolicyForm] = useState(EMPTY_POLICY);
    const [editingPolicyId, setEditingPolicyId] = useState(null);
    const [showPolicyForm, setShowPolicyForm] = useState(false);

    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [typeForm, setTypeForm] = useState(EMPTY_TYPE);
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [showTypeForm, setShowTypeForm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadPolicies = useCallback(async () => {
        if (!currentCompanyId) {
            setPolicies([]);
            setSelectedPolicy(null);
            setLeaveTypes([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const rows = await getLeavePolicies(currentCompanyId);
            setPolicies(rows || []);

            if (selectedPolicy) {
                const updatedSelected = (rows || []).find(
                    (row) => row.id === selectedPolicy.id
                );
                setSelectedPolicy(updatedSelected || null);
            }
        } catch (err) {
            setError(err.message || "Unable to load leave policies.");
        } finally {
            setLoading(false);
        }
    }, [currentCompanyId, selectedPolicy?.id]);

    useEffect(() => {
        setPolicies([]);
        setSelectedPolicy(null);
        setLeaveTypes([]);
        setPolicyForm(EMPTY_POLICY);
        setTypeForm(EMPTY_TYPE);
        setEditingPolicyId(null);
        setEditingTypeId(null);
        setShowPolicyForm(false);
        setShowTypeForm(false);
        setMessage("");
        setError("");
        loadPolicies();
    }, [currentCompanyId]); // Reset when switching companies.

    async function refreshPolicies() {
        const rows = await getLeavePolicies(currentCompanyId);
        setPolicies(rows || []);
        return rows || [];
    }

    async function openLeaveTypes(policy) {
        setError("");
        setMessage("");
        setSelectedPolicy(policy);
        setShowTypeForm(false);
        setEditingTypeId(null);
        setTypeForm(EMPTY_TYPE);

        try {
            const rows = await getLeavePolicyTypes(
                policy.id,
                currentCompanyId
            );
            setLeaveTypes(rows || []);
        } catch (err) {
            setLeaveTypes([]);
            setError(err.message || "Unable to load leave types.");
        }
    }

    function editPolicy(policy) {
        setPolicyForm({ ...EMPTY_POLICY, ...policy });
        setEditingPolicyId(policy.id);
        setShowPolicyForm(true);
        setError("");
        setMessage("");
    }

    async function savePolicy(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!currentCompanyId) {
            setError("Please select a company.");
            return;
        }

        const name = policyForm.policy_name.trim();

        if (!name) {
            setError("Policy name is required.");
            return;
        }

        if (
            policyForm.carry_forward_expiry_enabled &&
            !policyForm.carry_forward_enabled
        ) {
            setError("Enable carry forward before enabling its expiry.");
            return;
        }

        if (
            policyForm.carry_forward_enabled &&
            Number(policyForm.maximum_carry_forward_days) <= 0
        ) {
            setError("Enter a positive maximum carry-forward limit.");
            return;
        }

        if (
            policyForm.carry_forward_expiry_enabled &&
            Number(policyForm.carry_forward_expiry_months) <= 0
        ) {
            setError("Carry-forward expiry must be greater than zero months.");
            return;
        }

        if (
            policyForm.encashment_during_employment &&
            !policyForm.leave_encashment_enabled
        ) {
            setError("Enable leave encashment before allowing it during employment.");
            return;
        }

        if (
            policyForm.encashment_during_final_settlement &&
            !policyForm.leave_encashment_enabled
        ) {
            setError("Enable leave encashment before allowing it at final settlement.");
            return;
        }

        if (
            policyForm.negative_leave_balance_allowed &&
            Number(policyForm.maximum_negative_balance) <= 0
        ) {
            setError("Enter a positive maximum negative balance.");
            return;
        }

        if (
            !policyForm.negative_leave_balance_allowed &&
            Number(policyForm.maximum_negative_balance) > 0
        ) {
            setError("Maximum negative balance must be zero when negative balance is disabled.");
            return;
        }

        if (
            !policyForm.leave_accrual_enabled &&
            policyForm.monthly_accrual_enabled
        ) {
            setError("Monthly accrual cannot be enabled when leave accrual is disabled.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...policyForm,
                policy_name: name,
                maximum_carry_forward_days: Number(
                    policyForm.maximum_carry_forward_days || 0
                ),
                carry_forward_expiry_months: Number(
                    policyForm.carry_forward_expiry_months || 0
                ),
                maximum_encashment_days: Number(
                    policyForm.maximum_encashment_days || 0
                ),
                maximum_negative_balance: Number(
                    policyForm.maximum_negative_balance || 0
                ),
            };

            if (editingPolicyId) {
                await updateLeavePolicy(
                    editingPolicyId,
                    payload,
                    currentCompanyId
                );
                setMessage("Leave policy updated successfully.");
            } else {
                await createLeavePolicy(payload, currentCompanyId);
                setMessage("Leave policy created successfully.");
            }

            setPolicyForm(EMPTY_POLICY);
            setEditingPolicyId(null);
            setShowPolicyForm(false);

            const rows = await refreshPolicies();

            if (selectedPolicy) {
                const refreshed = rows.find(
                    (row) => row.id === selectedPolicy.id
                );
                if (refreshed) setSelectedPolicy(refreshed);
            }
        } catch (err) {
            setError(err.message || "Unable to save leave policy.");
        } finally {
            setSaving(false);
        }
    }

    async function togglePolicyStatus(policy) {
        setError("");
        setMessage("");

        try {
            if (policy.is_active) {
                if (!window.confirm(`Deactivate "${policy.policy_name}"?`)) {
                    return;
                }
                await deactivateLeavePolicy(policy.id, currentCompanyId);
                setMessage("Policy deactivated. Historical records are retained.");
            } else {
                await updateLeavePolicy(
                    policy.id,
                    { ...policy, is_active: true },
                    currentCompanyId
                );
                setMessage("Policy activated.");
            }

            await refreshPolicies();
        } catch (err) {
            setError(err.message || "Unable to change policy status.");
        }
    }

    function editType(type) {
        setTypeForm({ ...EMPTY_TYPE, ...type });
        setEditingTypeId(type.id);
        setShowTypeForm(true);
        setError("");
        setMessage("");
    }

    async function saveType(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!selectedPolicy || !currentCompanyId) {
            setError("Select a policy first.");
            return;
        }

        if (!typeForm.leave_type_name.trim()) {
            setError("Leave type name is required.");
            return;
        }

        if (Number(typeForm.entitlement_value) < 0) {
            setError("Entitlement cannot be negative.");
            return;
        }

        if (Number(typeForm.maximum_annual_days) < 0) {
            setError("Maximum annual days cannot be negative.");
            return;
        }

        if (
            typeForm.carry_forward_allowed &&
            Number(typeForm.maximum_carry_forward_days) <= 0
        ) {
            setError("Enter a positive carry-forward limit for this leave type.");
            return;
        }

        if (
            typeForm.encashment_allowed &&
            Number(typeForm.maximum_encashment_days) <= 0
        ) {
            setError("Enter a positive encashment limit for this leave type.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...typeForm,
                leave_policy_id: selectedPolicy.id,
                leave_type_name: typeForm.leave_type_name.trim(),
                leave_type_code: typeForm.leave_type_code.trim() || null,
            };

            for (const [field] of TYPE_NUMBERS) {
                payload[field] = Number(payload[field] || 0);
            }

            if (editingTypeId) {
                await updateLeavePolicyType(
                    editingTypeId,
                    payload,
                    currentCompanyId
                );
                setMessage("Leave type updated.");
            } else {
                await createLeavePolicyType(payload, currentCompanyId);
                setMessage("Leave type created.");
            }

            setTypeForm(EMPTY_TYPE);
            setEditingTypeId(null);
            setShowTypeForm(false);

            const rows = await getLeavePolicyTypes(
                selectedPolicy.id,
                currentCompanyId
            );
            setLeaveTypes(rows || []);
        } catch (err) {
            setError(err.message || "Unable to save leave type.");
        } finally {
            setSaving(false);
        }
    }

    async function toggleTypeStatus(type) {
        setError("");
        setMessage("");

        try {
            if (type.is_active) {
                if (!window.confirm(`Deactivate leave type "${type.leave_type_name}"?`)) {
                    return;
                }
                await deactivateLeavePolicyType(type.id, currentCompanyId);
                setMessage("Leave type deactivated.");
            } else {
                await updateLeavePolicyType(
                    type.id,
                    { ...type, is_active: true },
                    currentCompanyId
                );
                setMessage("Leave type activated.");
            }

            const rows = await getLeavePolicyTypes(
                selectedPolicy.id,
                currentCompanyId
            );
            setLeaveTypes(rows || []);
        } catch (err) {
            setError(err.message || "Unable to change leave type status.");
        }
    }

    if (!currentCompanyId) {
        return <p>Please select a company before managing leave policies.</p>;
    }

    return (
        <div style={{ display: "grid", gap: 16 }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12
            }}>
                <div>
                    <h3>Leave Policy Master</h3>
                    <p>Configure company leave rules and individual leave types.</p>
                </div>
                <button type="button" onClick={() => {
                    setPolicyForm(EMPTY_POLICY);
                    setEditingPolicyId(null);
                    setShowPolicyForm(true);
                    setError("");
                    setMessage("");
                }}>
                    + New Policy
                </button>
            </div>

            {error && <div role="alert" style={{ color: "#a11" }}>{error}</div>}
            {message && <div role="status" style={{ color: "#176b35" }}>{message}</div>}

            {showPolicyForm && (
                <form onSubmit={savePolicy} style={panelStyle}>
                    <h3>{editingPolicyId ? "Edit Leave Policy" : "Create Leave Policy"}</h3>

                    <label>
                        Policy Name *
                        <input
                            style={inputStyle}
                            value={policyForm.policy_name}
                            maxLength={150}
                            required
                            onChange={(e) => setPolicyForm({
                                ...policyForm,
                                policy_name: e.target.value
                            })}
                        />
                    </label>

                    <div style={{ marginTop: 16 }}>
                        <CheckField
                            field="is_active"
                            label="Policy is active"
                            value={policyForm.is_active}
                            onChange={(field, value) => setPolicyForm({ ...policyForm, [field]: value })}
                        />
                    </div>

                    {POLICY_SECTIONS.map((section) => (
                        <section key={section.title} style={{ ...panelStyle, marginTop: 16 }}>
                            <h4>{section.title}</h4>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                                gap: 12
                            }}>
                                {section.fields.map(([field, label]) => (
                                    <CheckField
                                        key={field}
                                        field={field}
                                        label={label}
                                        value={policyForm[field]}
                                        onChange={(name, value) => setPolicyForm({
                                            ...policyForm,
                                            [name]: value
                                        })}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 12,
                        marginTop: 16
                    }}>
                        {POLICY_NUMBERS.map(([field, label]) => (
                            <label key={field}>
                                {label}
                                <input
                                    style={inputStyle}
                                    type="number"
                                    min="0"
                                    step="0.25"
                                    value={policyForm[field] ?? 0}
                                    onChange={(e) => setPolicyForm({
                                        ...policyForm,
                                        [field]: e.target.value
                                    })}
                                />
                            </label>
                        ))}

                        <label>
                            Encashment basis
                            <select
                                style={inputStyle}
                                value={policyForm.encashment_basis || "BASIC"}
                                onChange={(e) => setPolicyForm({
                                    ...policyForm,
                                    encashment_basis: e.target.value
                                })}
                            >
                                <option value="BASIC">Basic salary</option>
                                <option value="GROSS">Gross salary</option>
                            </select>
                        </label>
                    </div>

                    <label style={{ display: "block", marginTop: 16 }}>
                        Remarks
                        <textarea
                            rows={3}
                            style={inputStyle}
                            value={policyForm.remarks || ""}
                            onChange={(e) => setPolicyForm({
                                ...policyForm,
                                remarks: e.target.value
                            })}
                        />
                    </label>

                    <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Policy"}
                        </button>
                        <button type="button" disabled={saving} onClick={() => {
                            setShowPolicyForm(false);
                            setEditingPolicyId(null);
                            setPolicyForm(EMPTY_POLICY);
                        }}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <section style={panelStyle}>
                <h3>Existing Policies</h3>
                {loading ? <p>Loading policies...</p> : policies.length === 0 ? (
                    <p>No leave policies found for this company.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    {["Policy", "Status", "Accrual", "Carry forward", "Actions"].map((heading) => (
                                        <th key={heading} style={{ textAlign: "left", padding: 9, borderBottom: "1px solid #ddd" }}>
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {policies.map((policy) => (
                                    <tr key={policy.id}>
                                        <td style={{ padding: 9, borderBottom: "1px solid #eee" }}>
                                            <strong>{policy.policy_name}</strong>
                                            {policy.remarks && <div>{policy.remarks}</div>}
                                        </td>
                                        <td style={{ padding: 9 }}>{policy.is_active ? "Active" : "Inactive"}</td>
                                        <td style={{ padding: 9 }}>{policy.leave_accrual_enabled ? "Enabled" : "Disabled"}</td>
                                        <td style={{ padding: 9 }}>{policy.carry_forward_enabled ? "Enabled" : "Disabled"}</td>
                                        <td style={{ padding: 9 }}>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                <button type="button" onClick={() => editPolicy(policy)}>Edit</button>
                                                <button type="button" onClick={() => togglePolicyStatus(policy)}>
                                                    {policy.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                                <button type="button" onClick={() => openLeaveTypes(policy)}>
                                                    Leave Types
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

            {selectedPolicy && (
                <section style={panelStyle}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap"
                    }}>
                        <div>
                            <h3>Leave Types — {selectedPolicy.policy_name}</h3>
                            <p>Manage entitlement and limits for each leave type.</p>
                        </div>
                        <button type="button" onClick={() => {
                            setTypeForm(EMPTY_TYPE);
                            setEditingTypeId(null);
                            setShowTypeForm(true);
                            setError("");
                            setMessage("");
                        }}>
                            + Add Leave Type
                        </button>
                    </div>

                    {showTypeForm && (
                        <form onSubmit={saveType} style={{ ...panelStyle, marginTop: 16 }}>
                            <h4>{editingTypeId ? "Edit Leave Type" : "New Leave Type"}</h4>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 12
                            }}>
                                <label>
                                    Leave type name *
                                    <input
                                        style={inputStyle}
                                        required
                                        value={typeForm.leave_type_name}
                                        onChange={(e) => setTypeForm({
                                            ...typeForm,
                                            leave_type_name: e.target.value
                                        })}
                                    />
                                </label>
                                <label>
                                    Code
                                    <input
                                        style={inputStyle}
                                        value={typeForm.leave_type_code || ""}
                                        onChange={(e) => setTypeForm({
                                            ...typeForm,
                                            leave_type_code: e.target.value.toUpperCase()
                                        })}
                                    />
                                </label>
                                <label>
                                    Entitlement frequency
                                    <select
                                        style={inputStyle}
                                        value={typeForm.entitlement_type}
                                        onChange={(e) => setTypeForm({
                                            ...typeForm,
                                            entitlement_type: e.target.value
                                        })}
                                    >
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="ANNUAL">Annual</option>
                                        <option value="FIXED">Fixed entitlement</option>
                                    </select>
                                </label>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 12,
                                marginTop: 14
                            }}>
                                {TYPE_NUMBERS.map(([field, label]) => (
                                    <label key={field}>
                                        {label}
                                        <input
                                            style={inputStyle}
                                            type="number"
                                            min="0"
                                            step="0.25"
                                            value={typeForm[field] ?? 0}
                                            onChange={(e) => setTypeForm({
                                                ...typeForm,
                                                [field]: e.target.value
                                            })}
                                        />
                                    </label>
                                ))}
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: 12,
                                marginTop: 14
                            }}>
                                {[
                                    ["is_active", "Active"],
                                    ["entitlement_enabled", "Entitlement enabled"],
                                    ["carry_forward_allowed", "Carry forward allowed"],
                                    ["encashment_allowed", "Encashment allowed"],
                                    ["loss_of_pay_when_exhausted", "Loss of pay when exhausted"],
                                ].map(([field, label]) => (
                                    <CheckField
                                        key={field}
                                        field={field}
                                        label={label}
                                        value={typeForm[field]}
                                        onChange={(name, value) => setTypeForm({
                                            ...typeForm,
                                            [name]: value
                                        })}
                                    />
                                ))}
                            </div>

                            <label style={{ display: "block", marginTop: 14 }}>
                                Remarks
                                <textarea
                                    rows={2}
                                    style={inputStyle}
                                    value={typeForm.remarks || ""}
                                    onChange={(e) => setTypeForm({
                                        ...typeForm,
                                        remarks: e.target.value
                                    })}
                                />
                            </label>

                            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                                <button type="submit" disabled={saving}>
                                    {saving ? "Saving..." : "Save Leave Type"}
                                </button>
                                <button type="button" disabled={saving} onClick={() => {
                                    setShowTypeForm(false);
                                    setEditingTypeId(null);
                                    setTypeForm(EMPTY_TYPE);
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {leaveTypes.length === 0 ? (
                        <p>No leave types configured for this policy yet.</p>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr>
                                        {["Leave type", "Frequency", "Entitlement", "Annual limit", "Status", "Actions"].map((heading) => (
                                            <th key={heading} style={{ textAlign: "left", padding: 9, borderBottom: "1px solid #ddd" }}>
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveTypes.map((type) => (
                                        <tr key={type.id}>
                                            <td style={{ padding: 9, borderBottom: "1px solid #eee" }}>
                                                {type.leave_type_name}
                                                {type.leave_type_code ? ` (${type.leave_type_code})` : ""}
                                            </td>
                                            <td style={{ padding: 9 }}>{type.entitlement_type}</td>
                                            <td style={{ padding: 9 }}>{type.entitlement_enabled ? type.entitlement_value : "Disabled"}</td>
                                            <td style={{ padding: 9 }}>{type.maximum_annual_days}</td>
                                            <td style={{ padding: 9 }}>{type.is_active ? "Active" : "Inactive"}</td>
                                            <td style={{ padding: 9 }}>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                    <button type="button" onClick={() => editType(type)}>Edit</button>
                                                    <button type="button" onClick={() => toggleTypeStatus(type)}>
                                                        {type.is_active ? "Deactivate" : "Activate"}
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
            )}
        </div>
    );
}
