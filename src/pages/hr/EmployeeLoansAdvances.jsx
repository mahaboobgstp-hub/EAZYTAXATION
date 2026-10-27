import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import {
  getEmployeeLoans,
  createEmployeeLoan,
  updateEmployeeLoan,
  updateEmployeeLoanStatus,
  deactivateEmployeeLoan,
} from "../../services/hr/employeeLoansService";
import "../../css/hr/EmployeeLoansAdvances.css";

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  employee_id: "",
  loan_type: "Salary Advance",
  loan_date: today,
  sanctioned_amount: "",
  interest_rate: "0",
  repayment_months: "3",
  recovery_start_month: String(new Date().getMonth() + 1),
  recovery_start_year: String(new Date().getFullYear()),
  remarks: "",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  border: "1px solid #d1d5db",
  borderRadius: 6,
};

const buttonStyle = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function calculateEmi(principal, annualRate, months) {
  const amount = Number(principal);
  const rate = Number(annualRate) / 1200;
  const count = Number(months);

  if (!amount || !count || amount <= 0 || count <= 0) return 0;
  if (!rate) return Math.round((amount / count) * 100) / 100;

  const factor = Math.pow(1 + rate, count);
  return Math.round(((amount * rate * factor) / (factor - 1)) * 100) / 100;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN");
}

export default function EmployeeLoansAdvances() {
  const { currentCompanyId } = useCompany();

  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!currentCompanyId) {
      setLoans([]);
      setEmployees([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [loanRows, employeeResult] = await Promise.all([
        getEmployeeLoans(currentCompanyId),
        supabase
          .from("employees")
          .select("id, employee_code, employee_name, department_id")
          .eq("company_id", currentCompanyId)
          .eq("is_active", true)
          .order("employee_name"),
      ]);

      if (employeeResult.error) throw employeeResult.error;

      setLoans(loanRows || []);
      setEmployees(employeeResult.data || []);
    } catch (err) {
      setError(err.message || "Unable to load loans and advances.");
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    setLoans([]);
    setEmployees([]);
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setMessage("");
    loadData();
  }, [loadData]);

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return loans.filter((loan) => {
      const employee = employeeMap.get(loan.employee_id);
      const employeeName = employee?.employee_name || "";
      const employeeCode = employee?.employee_code || "";

      return (
        (!query ||
          String(loan.loan_code || "").toLowerCase().includes(query) ||
          employeeName.toLowerCase().includes(query) ||
          employeeCode.toLowerCase().includes(query) ||
          String(loan.loan_type || "").toLowerCase().includes(query)) &&
        (statusFilter === "All" || loan.loan_status === statusFilter) &&
        (typeFilter === "All" || loan.loan_type === typeFilter)
      );
    });
  }, [loans, employeeMap, search, statusFilter, typeFilter]);

  const totalOutstanding = loans.reduce(
    (sum, loan) =>
      sum + Math.max(0, Number(loan.outstanding_amount) || 0),
    0
  );

  const activeCount = loans.filter(
  (loan) => loan.loan_status === "Active"
).length;

  const totalRecovered = loans.reduce(
    (sum, loan) => sum + (Number(loan.recovered_amount) || 0),
    0
  );

  const previewEmi = calculateEmi(
    form.sanctioned_amount,
    form.interest_rate,
    form.repayment_months
  );

  function startNew() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function startEdit(loan) {
    if (loan.loan_status !== "Active") {
  setError("Only active loan records can be edited.");
  return;
}

    setEditingId(loan.id);
    setForm({
      employee_id: loan.employee_id || "",
      loan_type: loan.loan_type || "Salary Advance",
      loan_date: loan.loan_date || today,
      sanctioned_amount: String(loan.sanctioned_amount ?? ""),
      interest_rate: String(loan.interest_rate ?? 0),
      repayment_months: String(loan.repayment_months ?? 3),
      recovery_start_month: String(
        loan.recovery_start_month || new Date().getMonth() + 1
      ),
      recovery_start_year: String(
        loan.recovery_start_year || new Date().getFullYear()
      ),
      remarks: loan.remarks || "",
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!currentCompanyId) {
      setError("Please select a company.");
      return;
    }

    const amount = Number(form.sanctioned_amount);
    const interest = Number(form.interest_rate);
    const months = Number(form.repayment_months);
    const startMonth = Number(form.recovery_start_month);
    const startYear = Number(form.recovery_start_year);

    if (!form.employee_id || !employeeMap.has(form.employee_id)) {
      setError("Select a valid employee from this company.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a sanctioned amount greater than zero.");
      return;
    }

    if (!Number.isFinite(interest) || interest < 0) {
      setError("Interest rate cannot be negative.");
      return;
    }

    if (!Number.isInteger(months) || months < 1 || months > 600) {
      setError("Repayment months must be between 1 and 600.");
      return;
    }

    if (
      !Number.isInteger(startMonth) ||
      startMonth < 1 ||
      startMonth > 12 ||
      !Number.isInteger(startYear) ||
      startYear < 2000 ||
      startYear > 2200
    ) {
      setError("Enter a valid recovery start month and year.");
      return;
    }

    const startIndex = startYear * 12 + startMonth - 1;
    const endIndex = startIndex + months - 1;
    const recoveryEndYear = Math.floor(endIndex / 12);
    const recoveryEndMonth = (endIndex % 12) + 1;

    const payload = {
      employee_id: form.employee_id,
      loan_type: form.loan_type,
      loan_date: form.loan_date,
      sanctioned_amount: amount,
      interest_rate: interest,
      repayment_months: months,
      emi_amount: previewEmi,
      recovery_start_month: startMonth,
      recovery_start_year: startYear,
      recovery_end_month: recoveryEndMonth,
      recovery_end_year: recoveryEndYear,
      remarks: form.remarks.trim() || null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateEmployeeLoan(editingId, payload, currentCompanyId);
        setMessage("Loan application updated.");
      } else {
        await createEmployeeLoan(
          {
            ...payload,
            loan_code: `LOAN-${Date.now()}`,
            recovered_amount: 0,
            outstanding_amount: amount,
            loan_status: "Active",
            approved_by: null,
            approved_date: null,
          },
          currentCompanyId
        );
        setMessage("Loan application saved.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save loan application.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(loan, status) {
    const messages = {
      Approved: "Approve this loan application?",
      Disbursed: "Mark this loan as disbursed?",
      Rejected: "Reject this loan application?",
      Closed: "Mark this loan as closed?",
      Pending: "Return this loan to pending status?",
    };

    if (!window.confirm(messages[status] || `Change status to ${status}?`)) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateEmployeeLoanStatus(loan.id, status, currentCompanyId);
      setMessage(`Loan status updated to ${status}.`);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to update loan status.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(loan) {
    if (!window.confirm(`Deactivate loan ${loan.loan_code}?`)) return;

    setSaving(true);
    setError("");

    try {
      await deactivateEmployeeLoan(loan.id, currentCompanyId);
      setMessage("Loan record deactivated.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to deactivate loan.");
    } finally {
      setSaving(false);
    }
  }

  if (!currentCompanyId) {
    return <div className="ela-page">Please select a company first.</div>;
  }

  return (
    <div className="ela-page">
      <div className="ela-header">
        <div>
          <div className="ela-eyebrow">HUMAN RESOURCES</div>
          <h1>Employee Loans & Advances</h1>
          <p>Company employee loan applications and recovery schedules.</p>
        </div>
        <button className="ela-btn ela-btn-primary" onClick={startNew}>
          + New Loan / Advance
        </button>
      </div>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading && <p>Loading loans...</p>}

      <div className="ela-summary-grid">
        <div className="ela-summary-card">
          <div className="ela-summary-label">Active Loan Records</div>
          <div className="ela-summary-value">{loans.length}</div>
        </div>
        <div className="ela-summary-card">
          <div className="ela-summary-label">Pending Applications</div>
          <div className="ela-summary-value">{pendingCount}</div>
        </div>
        <div className="ela-summary-card">
          <div className="ela-summary-label">Outstanding Amount</div>
          <div className="ela-summary-value">{money(totalOutstanding)}</div>
        </div>
        <div className="ela-summary-card">
          <div className="ela-summary-label">Recorded Recoveries</div>
          <div className="ela-summary-value">{money(totalRecovered)}</div>
        </div>
      </div>

      {showForm && (
        <section className="ela-panel" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 20 }}>
          <h2>{editingId ? "Edit Loan Application" : "New Loan / Advance"}</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              <label>
                Employee *
                <select
                  style={inputStyle}
                  required
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employee_code} — {employee.employee_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Loan Type *
                <select
                  style={inputStyle}
                  value={form.loan_type}
                  onChange={(e) => setForm({ ...form, loan_type: e.target.value })}
                >
                  <option>Salary Advance</option>
<option>Personal Loan</option>
<option>Festival Advance</option>
<option>Vehicle Loan</option>
<option>Medical Loan</option>
<option>Education Loan</option>
<option>Emergency Loan</option>
<option>Other</option>
                </select>
              </label>

              <label>
                Loan Date *
                <input
                  style={inputStyle}
                  type="date"
                  required
                  value={form.loan_date}
                  onChange={(e) => setForm({ ...form, loan_date: e.target.value })}
                />
              </label>

              <label>
                Sanctioned Amount (₹) *
                <input
                  style={inputStyle}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.sanctioned_amount}
                  onChange={(e) => setForm({ ...form, sanctioned_amount: e.target.value })}
                />
              </label>

              <label>
                Annual Interest Rate (%) *
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.interest_rate}
                  onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                />
              </label>

              <label>
                Repayment Months *
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  max="600"
                  step="1"
                  required
                  value={form.repayment_months}
                  onChange={(e) => setForm({ ...form, repayment_months: e.target.value })}
                />
              </label>

              <label>
                Recovery Start Month *
                <select
                  style={inputStyle}
                  value={form.recovery_start_month}
                  onChange={(e) => setForm({ ...form, recovery_start_month: e.target.value })}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleDateString("en-IN", { month: "long" })}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Recovery Start Year *
                <input
                  style={inputStyle}
                  type="number"
                  min="2000"
                  max="2200"
                  required
                  value={form.recovery_start_year}
                  onChange={(e) => setForm({ ...form, recovery_start_year: e.target.value })}
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                Remarks
                <textarea
                  style={inputStyle}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </label>
            </div>

            <p>
              Estimated monthly EMI: <strong>{money(previewEmi)}</strong>
            </p>

            <p style={{ color: "#6b7280", fontSize: 13 }}>
              EMI is estimated using a standard reducing-balance formula. Confirm the organisation's lending rules before relying on it for payroll recovery.
            </p>

            <button className="ela-btn ela-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Loan"}
            </button>
            <button
              type="button"
              className="ela-btn ela-btn-secondary"
              style={{ marginLeft: 8 }}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
        <h2>Loan Register</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 16 }}>
          <input
            style={inputStyle}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search loan or employee"
          />

          <select style={inputStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            {["Active", "Completed", "Closed", "Cancelled"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          <select style={inputStyle} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">All Loan Types</option>
            {[
  "Salary Advance",
  "Personal Loan",
  "Festival Advance",
  "Vehicle Loan",
  "Medical Loan",
  "Education Loan",
  "Emergency Loan",
  "Other",
].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <button style={buttonStyle} disabled={loading} onClick={loadData}>
            Refresh
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Loan Code", "Employee", "Type", "Loan Date", "Amount", "EMI", "Outstanding", "Status", "Actions"].map((heading) => (
                  <th key={heading} style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const employee = employeeMap.get(loan.employee_id);

                return (
                  <tr key={loan.id}>
                    <td style={{ padding: 10 }}>{loan.loan_code}</td>
                    <td style={{ padding: 10 }}>
                      {employee?.employee_name || "Employee unavailable"}
                      <small style={{ display: "block" }}>
                        {employee?.employee_code || ""}
                      </small>
                    </td>
                    <td style={{ padding: 10 }}>{loan.loan_type}</td>
                    <td style={{ padding: 10 }}>{formatDate(loan.loan_date)}</td>
                    <td style={{ padding: 10 }}>{money(loan.sanctioned_amount)}</td>
                    <td style={{ padding: 10 }}>{money(loan.emi_amount)}</td>
                    <td style={{ padding: 10 }}>{money(loan.outstanding_amount)}</td>
                    <td style={{ padding: 10 }}>{loan.loan_status}</td>
                    <td style={{ padding: 10, minWidth: 220 }}>
                      {["Pending", "Rejected"].includes(loan.loan_status) && (
                        <>
                          <button style={buttonStyle} disabled={saving} onClick={() => startEdit(loan)}>Edit</button>{" "}
                          <button style={buttonStyle} disabled={saving} onClick={() => changeStatus(loan, "Approved")}>Approve</button>{" "}
                          <button style={buttonStyle} disabled={saving} onClick={() => changeStatus(loan, "Rejected")}>Reject</button>
                        </>
                      )}

                      {loan.loan_status === "Approved" && (
                        <button style={buttonStyle} disabled={saving} onClick={() => changeStatus(loan, "Disbursed")}>
                          Mark Disbursed
                        </button>
                      )}

                      {loan.loan_status === "Disbursed" && (
                        <button style={buttonStyle} disabled={saving} onClick={() => changeStatus(loan, "Closed")}>
                          Close
                        </button>
                      )}

                      <button style={buttonStyle} disabled={saving} onClick={() => handleDeactivate(loan)}>
                        Deactivate
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredLoans.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ padding: 20, textAlign: "center" }}>
                    No loan records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
      }
