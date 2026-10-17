import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import {
    getPayrollRuns,
    getPayrollRunEmployees
} from "../../services/hr/payslipService";

const money = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(value || 0));

const monthName = (month) =>
    new Date(2000, Number(month) - 1, 1).toLocaleString(
        "en-IN",
        { month: "long" }
    );

const isFinalized = (status) =>
    ["finalized", "locked"].includes(
        String(status || "").toLowerCase()
    );

export default function Payslips() {
    const { currentCompanyId, currentCompany } = useCompany();

    const [runs, setRuns] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedRunId, setSelectedRunId] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadRuns() {
            setRuns([]);
            setEmployees([]);
            setSelectedRunId("");
            setSelectedEmployeeId("");
            setErrorMessage("");

            if (!currentCompanyId) return;

            setLoading(true);

            try {
                const data = await getPayrollRuns(currentCompanyId);

                if (!cancelled) {
                    setRuns(data);
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(
                        error.message || "Unable to load payroll runs."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadRuns();

        return () => {
            cancelled = true;
        };
    }, [currentCompanyId]);

    const years = useMemo(
        () => [...new Set(runs.map((run) => run.payroll_year))]
            .sort((a, b) => b - a),
        [runs]
    );

    const filteredRuns = useMemo(
        () =>
            runs.filter((run) =>
                (!yearFilter ||
                    String(run.payroll_year) === String(yearFilter)) &&
                (!monthFilter ||
                    String(run.payroll_month) === String(monthFilter))
            ),
        [runs, yearFilter, monthFilter]
    );

    useEffect(() => {
        if (
            selectedRunId &&
            !filteredRuns.some((run) => run.id === selectedRunId)
        ) {
            setSelectedRunId("");
            setSelectedEmployeeId("");
            setEmployees([]);
        }
    }, [filteredRuns, selectedRunId]);

    async function handleRunChange(runId) {
        setSelectedRunId(runId);
        setSelectedEmployeeId("");
        setEmployees([]);
        setErrorMessage("");

        if (!runId || !currentCompanyId) return;

        setLoading(true);

        try {
            const data = await getPayrollRunEmployees(
                runId,
                currentCompanyId
            );
            setEmployees(data);
        } catch (error) {
            setErrorMessage(
                error.message || "Unable to load employee payroll records."
            );
        } finally {
            setLoading(false);
        }
    }

    const selectedRun = runs.find(
        (run) => run.id === selectedRunId
    );

    const selectedEmployee = employees.find(
        (employee) => employee.id === selectedEmployeeId
    );

    const companyName =
        currentCompany?.company_name ||
        currentCompany?.name ||
        "Company";

    const earnings = selectedEmployee
        ? [
            ["Basic Salary", selectedEmployee.earned_basic],
            ["House Rent Allowance", selectedEmployee.earned_hra],
            ["Dearness Allowance", selectedEmployee.earned_da],
            [
                "Special Allowance",
                selectedEmployee.earned_special_allowance
            ],
            ["Other Allowance", selectedEmployee.earned_other_allowance],
            ["Overtime", selectedEmployee.overtime_amount],
            ["Reimbursements", selectedEmployee.reimbursement_amount]
        ].filter((item) => Number(item[1] || 0) !== 0)
        : [];

    const deductions = selectedEmployee
        ? [
            ["Employee PF", selectedEmployee.pf_deduction],
            ["Employee ESI", selectedEmployee.esi_deduction],
            ["Professional Tax", selectedEmployee.professional_tax],
            ["TDS", selectedEmployee.tds_deduction],
            ["Other Deductions", selectedEmployee.other_deductions]
        ].filter((item) => Number(item[1] || 0) !== 0)
        : [];

    return (
        <div className="payslips-page">
            <style>{`
                .payslips-page {
                    padding: 24px;
                    color: #1f2937;
                }
                .payslips-page .panel {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .payslips-page .filters {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 16px;
                }
                .payslips-page label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 6px;
                }
                .payslips-page input,
                .payslips-page select {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    background: white;
                }
                .payslips-page button {
                    padding: 10px 16px;
                    border: 0;
                    border-radius: 6px;
                    cursor: pointer;
                    background: #1d4ed8;
                    color: white;
                    font-weight: 600;
                }
                .payslips-page button:disabled {
                    opacity: .45;
                    cursor: not-allowed;
                }
                .payslips-page table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .payslips-page th,
                .payslips-page td {
                    text-align: left;
                    padding: 10px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .payslips-page .amount {
                    text-align: right;
                }
                .payslips-page .payslip-header {
                    text-align: center;
                    border-bottom: 2px solid #111827;
                    padding-bottom: 16px;
                    margin-bottom: 18px;
                }
                .payslips-page .totals {
                    margin-left: auto;
                    width: min(100%, 360px);
                }
                .payslips-page .net {
                    font-size: 20px;
                    font-weight: 700;
                    border-top: 2px solid #111827;
                    padding-top: 12px;
                }
                .payslips-page .error {
                    color: #b91c1c;
                    margin-bottom: 16px;
                }
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .payslips-page .print-area,
                    .payslips-page .print-area * {
                        visibility: visible !important;
                    }
                    .payslips-page .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        border: none;
                        padding: 0;
                        margin: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="no-print">
                <h1 style={{ marginTop: 0 }}>Payslips</h1>
                <p style={{ color: "#6b7280" }}>
                    Preview and print payslips from saved payroll runs.
                </p>

                {!currentCompanyId && (
                    <div className="panel">
                        Please select a company first.
                    </div>
                )}

                {errorMessage && (
                    <div className="error">{errorMessage}</div>
                )}

                <div className="panel">
                    <div className="filters">
                        <div>
                            <label>Financial/Payroll Year</label>
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                            >
                                <option value="">All years</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Payroll Month</label>
                            <select
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                            >
                                <option value="">All months</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1)
                                    .map((month) => (
                                        <option key={month} value={month}>
                                            {monthName(month)}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label>Payroll Run</label>
                            <select
                                value={selectedRunId}
                                onChange={(e) =>
                                    handleRunChange(e.target.value)
                                }
                            >
                                <option value="">Select payroll run</option>
                                {filteredRuns.map((run) => (
                                    <option key={run.id} value={run.id}>
                                        {monthName(run.payroll_month)}{" "}
                                        {run.payroll_year} — {run.payroll_status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Employee</label>
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) =>
                                    setSelectedEmployeeId(e.target.value)
                                }
                                disabled={!employees.length}
                            >
                                <option value="">Select employee</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.employee_code
                                            ? `${employee.employee_code} — `
                                            : ""}
                                        {employee.employee_name || "Employee"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {selectedRun && (
                    <div className="panel">
                        <h3>Payroll Run Summary</h3>
                        <p>
                            Period: {monthName(selectedRun.payroll_month)}{" "}
                            {selectedRun.payroll_year}
                        </p>
                        <p>Status: <strong>{selectedRun.payroll_status}</strong></p>
                        <div className="filters">
                            <div>
                                <label>Employees</label>
                                {selectedRun.total_employees || 0}
                            </div>
                            <div>
                                <label>Gross Salary</label>
                                {money(selectedRun.total_gross_salary)}
                            </div>
                            <div>
                                <label>Total Deductions</label>
                                {money(selectedRun.total_deductions)}
                            </div>
                            <div>
                                <label>Net Salary</label>
                                {money(selectedRun.total_net_salary)}
                            </div>
                        </div>
                    </div>
                )}

                {loading && <p>Loading payroll records...</p>}

                {selectedRunId && !loading && (
                    <div className="panel">
                        <h3>Employees in this payroll run</h3>
                        {employees.length === 0 ? (
                            <p>No employee payroll records found.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Payable Days</th>
                                        <th className="amount">Gross</th>
                                        <th className="amount">Deductions</th>
                                        <th className="amount">Net Salary</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((employee) => (
                                        <tr key={employee.id}>
                                            <td>
                                                {employee.employee_name}
                                                <br />
                                                <small>{employee.employee_code}</small>
                                            </td>
                                            <td>{employee.payable_days}</td>
                                            <td className="amount">
                                                {money(employee.gross_earnings)}
                                            </td>
                                            <td className="amount">
                                                {money(employee.total_deductions)}
                                            </td>
                                            <td className="amount">
                                                {money(employee.net_salary)}
                                            </td>
                                            <td>{employee.payroll_status}</td>
                                            <td>
                                                <button
                                                    onClick={() =>
                                                        setSelectedEmployeeId(employee.id)
                                                    }
                                                >
                                                    Preview
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {selectedEmployee && selectedRun && (
                <div className="panel print-area">
                    <div className="payslip-header">
                        <h2 style={{ marginBottom: 6 }}>{companyName}</h2>
                        <h3 style={{ margin: 0 }}>SALARY SLIP</h3>
                        <p>
                            {monthName(selectedRun.payroll_month)}{" "}
                            {selectedRun.payroll_year}
                        </p>
                    </div>

                    <div className="filters">
                        <div>
                            <label>Employee Name</label>
                            {selectedEmployee.employee_name || "—"}
                        </div>
                        <div>
                            <label>Employee Code</label>
                            {selectedEmployee.employee_code || "—"}
                        </div>
                        <div>
                            <label>Monthly Salary</label>
                            {money(selectedEmployee.monthly_salary)}
                        </div>
                        <div>
                            <label>Payable Days</label>
                            {selectedEmployee.payable_days || 0}
                        </div>
                        <div>
                            <label>Working Days</label>
                            {selectedEmployee.working_days || 0}
                        </div>
                        <div>
                            <label>Overtime Days</label>
                            {selectedEmployee.overtime_days || 0}
                        </div>
                    </div>

                    <div className="filters" style={{ marginTop: 24 }}>
                        <div>
                            <h3>Earnings</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th className="amount">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {earnings.map(([label, amount]) => (
                                        <tr key={label}>
                                            <td>{label}</td>
                                            <td className="amount">
                                                {money(amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <th>Gross Earnings</th>
                                        <th className="amount">
                                            {money(selectedEmployee.gross_earnings)}
                                        </th>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <h3>Deductions</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th className="amount">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deductions.map(([label, amount]) => (
                                        <tr key={label}>
                                            <td>{label}</td>
                                            <td className="amount">
                                                {money(amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <th>Total Deductions</th>
                                        <th className="amount">
                                            {money(selectedEmployee.total_deductions)}
                                        </th>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="totals" style={{ marginTop: 24 }}>
                        <div>
                            Reimbursements:{" "}
                            {money(selectedEmployee.reimbursement_amount)}
                        </div>
                        <div className="net">
                            Net Salary: {money(selectedEmployee.net_salary)}
                        </div>
                    </div>

                    <p style={{ marginTop: 40, fontSize: 12 }}>
                        This is a computer-generated payslip.
                    </p>

                    <div className="no-print" style={{ display: "flex", gap: 12 }}>
                        <button
                            onClick={() => window.print()}
                            disabled={!isFinalized(selectedRun.payroll_status)}
                        >
                            Print Payslip
                        </button>
                        <button
                            onClick={() => setSelectedEmployeeId("")}
                            style={{ background: "#4b5563" }}
                        >
                            Close Preview
                        </button>
                    </div>

                    {!isFinalized(selectedRun.payroll_status) && (
                        <p className="no-print" style={{ color: "#b45309" }}>
                            This payroll run is not finalized. Printing an
                            official payslip is disabled until payroll is finalized
                            or locked.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
           }
