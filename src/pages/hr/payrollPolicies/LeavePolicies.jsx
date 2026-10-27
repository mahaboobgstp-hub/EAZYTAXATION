
import React, { useCallback, useEffect, useState } from "react";
import { useCompany } from "../../../context/CompanyContext";
import {
    getLeavePolicies,
    createLeavePolicy,
    updateLeavePolicy,
    deactivateLeavePolicy,
} from "../../../services/hr/leavePolicyService";

const emptyForm = {
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

const checkboxFields = [
    ["is_active", "Active"],
    ["leave_policy_enabled", "Enable leave policy"],
    ["leave_accrual_enabled", "Enable leave accrual"],
    ["monthly_accrual_enabled", "Accrue leave monthly"],
    ["prorate_joining_month", "Prorate joining month"],
    ["prorate_leaving_month", "Prorate leaving month"],
    ["carry_forward_enabled", "Allow carry forward"],
    ["carry_forward_expiry_enabled", "Enable carry-forward expiry"],
    ["leave_encashment_enabled", "Allow leave encashment"],
    ["encashment_during_employment", "Allow encashment during employment"],
    ["encashment_during_final_settlement", "Allow encashment during final settlement"],
    ["negative_leave_balance_allowed", "Allow negative leave balance"],
    ["half_day_leave_enabled", "Allow half-day leave"],
    ["quarter_day_leave_enabled", "Allow quarter-day leave"],
    ["sandwich_rule_enabled", "Enable sandwich rule"],
    ["prefix_rule_enabled", "Enable prefix rule"],
    ["suffix_rule_enabled", "Enable suffix rule"],
    ["holiday_between_leave_enabled", "Count holidays between leave dates"],
    ["weekly_off_between_leave_enabled", "Count weekly offs between leave dates"],
];

const numberFields = [
    ["maximum_carry_forward_days", "Maximum carry-forward days"],
    ["carry_forward_expiry_months", "Carry-forward expiry (months)"],
    ["maximum_encashment_days", "Maximum encashment days"],
    ["maximum_negative_balance", "Maximum negative balance"],
];

export default function LeavePolicies() {
    const { currentCompanyId } = useCompany();

    const [policies, setPolicies] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadPolicies = useCallback(async () => {
        if (!currentCompanyId) {
            setPolicies([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const rows = await getLeavePolicies(currentCompanyId);
            setPolicies(rows);
        } catch (err) {
            setError(err.message || "Unable to load leave policies.");
        } finally {
            setLoading(false);
        }
    }, [currentCompanyId]);

    useEffect(() => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setMessage("");
        setError("");
        loadPolicies();
    }, [loadPolicies]);

    function updateField(name, value) {
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function startNewPolicy() {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setMessage("");
        setError("");
    }

    function startEdit(policy) {
        setForm({
            ...emptyForm,
            ...policy,
        });
        setEditingId(policy.id);
        setShowForm(true);
        setMessage("");
        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!currentCompanyId) {
            setError("Please select a company first.");
            return;
        }

        if (!form.policy_name.trim()) {
            setError("Enter a leave policy name.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...form,
                policy_name: form.policy_name.trim(),
                maximum_carry_forward_days:
                    Number(form.maximum_carry_forward_days || 0),
                carry_forward_expiry_months:
                    Number(form.carry_forward_expiry_months || 0),
                maximum_encashment_days:
                    Number(form.maximum_encashment_days || 0),
                maximum_negative_balance:
                    Number(form.maximum_negative_balance || 0),
            };

            if (editingId) {
                await updateLeavePolicy(
                    editingId,
                    payload,
                    currentCompanyId
                );
                setMessage("Leave policy updated.");
            } else {
                await createLeavePolicy(payload, currentCompanyId);
                setMessage("Leave policy created.");
            }

            setForm(emptyForm);
            setEditingId(null);
            setShowForm(false);
            await loadPolicies();
        } catch (err) {
            setError(err.message || "Unable to save leave policy.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeactivate(policy) {
        if (!currentCompanyId) return;

        if (
            !window.confirm(
                `Deactivate "${policy.policy_name}"? Existing historical records will be retained.`
            )
        ) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await deactivateLeavePolicy(policy.id, currentCompanyId);
            setMessage("Leave policy deactivated.");
            await loadPolicies();
        } catch (err) {
            setError(err.message || "Unable to deactivate leave policy.");
        }
    }

    if (!currentCompanyId) {
        return <p>Please select a company before managing leave policies.</p>;
    }

    const inputStyle = {
        width: "100%",
        boxSizing: "border-box",
        padding: "9px",
        border: "1px solid #ccc",
        borderRadius: "5px",
    };

    const sectionStyle = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
    };

    return (
        <div style={{ display: "grid", gap: "16px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <h3 style={{ marginBottom: "5px" }}>Leave Policies</h3>
                    <p style={{ marginTop: 0 }}>
                        Configure leave rules for the selected company.
                    </p>
                </div>

                <button type="button" onClick={startNewPolicy}>
                    + New Leave Policy
                </button>
            </div>

            {error && (
                <div role="alert" style={{ color: "#a11" }}>
                    {error}
                </div>
            )}

            {message && (
                <div role="status" style={{ color: "#176b35" }}>
                    {message}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} style={sectionStyle}>
                    <h3>{editingId ? "Edit Leave Policy" : "New Leave Policy"}</h3>

                    <div style={{ marginBottom: "16px" }}>
                        <label>
                            Policy Name *
                            <input
                                style={inputStyle}
                                value={form.policy_name}
                                onChange={(event) =>
                                    updateField("policy_name", event.target.value)
                                }
                                required
                                maxLength={150}
                            />
                        </label>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                            gap: "12px",
                        }}
                    >
                        {checkboxFields.map(([field, label]) => (
                            <label
                                key={field}
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={Boolean(form[field])}
                                    onChange={(event) =>
                                        updateField(field, event.target.checked)
                                    }
                                />
                                {label}
                            </label>
                        ))}
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "12px",
                            marginTop: "18px",
                        }}
                    >
                        {numberFields.map(([field, label]) => (
                            <label key={field}>
                                {label}
                                <input
                                    style={inputStyle}
                                    type="number"
                                    min="0"
                                    step="0.25"
                                    value={form[field] ?? 0}
                                    onChange={(event) =>
                                        updateField(field, event.target.value)
                                    }
                                />
                            </label>
                        ))}

                        <label>
                            Encashment Basis
                            <select
                                style={inputStyle}
                                value={form.encashment_basis || "BASIC"}
                                onChange={(event) =>
                                    updateField("encashment_basis", event.target.value)
                                }
                            >
                                <option value="BASIC">Basic</option>
                                <option value="GROSS">Gross</option>
                            </select>
                        </label>
                    </div>

                    <div style={{ marginTop: "16px" }}>
                        <label>
                            Remarks
                            <textarea
                                style={inputStyle}
                                rows={3}
                                value={form.remarks || ""}
                                onChange={(event) =>
                                    updateField("remarks", event.target.value)
                                }
                            />
                        </label>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "16px",
                        }}
                    >
                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Policy"}
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                                setShowForm(false);
                                setEditingId(null);
                                setForm(emptyForm);
                                setError("");
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div style={sectionStyle}>
                <h3>Existing Policies</h3>

                {loading ? (
                    <p>Loading leave policies...</p>
                ) : policies.length === 0 ? (
                    <p>No leave policies have been created for this company.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    {["Policy Name", "Status", "Accrual", "Carry Forward", "Actions"].map(
                                        (heading) => (
                                            <th
                                                key={heading}
                                                style={{
                                                    textAlign: "left",
                                                    padding: "10px",
                                                    borderBottom: "1px solid #ddd",
                                                }}
                                            >
                                                {heading}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {policies.map((policy) => (
                                    <tr key={policy.id}>
                                        <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                                            <strong>{policy.policy_name}</strong>
                                            {policy.remarks && (
                                                <div style={{ fontSize: "12px", color: "#666" }}>
                                                    {policy.remarks}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                                            {policy.is_active ? "Active" : "Inactive"}
                                        </td>
                                        <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                                            {policy.leave_accrual_enabled ? "Enabled" : "Disabled"}
                                        </td>
                                        <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                                            {policy.carry_forward_enabled ? "Enabled" : "Disabled"}
                                        </td>
                                        <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(policy)}
                                                >
                                                    Edit
                                                </button>
                                                {policy.is_active && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeactivate(policy)}
                                                    >
                                                        Deactivate
                                                    </button>
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
        </div>
    );
}
