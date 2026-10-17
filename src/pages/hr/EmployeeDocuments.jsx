
import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import { getEmployees } from "../../services/hr/employeeService";

const DOCUMENT_TYPES = [
    { value: "JOINING", label: "Joining Letter" },
    { value: "APPOINTMENT", label: "Appointment Letter" },
    { value: "APPOINTMENT_ANNEXURE", label: "Appointment Letter with Salary Annexure" },
    { value: "EXPERIENCE", label: "Experience Letter" },
    { value: "RELIEVING", label: "Relieving Letter" }
];

const dateValue = (value) => {
    if (!value) return "";
    return String(value).slice(0, 10);
};

const displayDate = (value) => {
    if (!value) return "____________";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
};

export default function EmployeeDocuments() {
    const { currentCompanyId, currentCompany } = useCompany();

    const [employees, setEmployees] = useState([]);
    const [employeeId, setEmployeeId] = useState("");
    const [documentType, setDocumentType] = useState("JOINING");
    const [documentDate, setDocumentDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [joiningDate, setJoiningDate] = useState("");
    const [leavingDate, setLeavingDate] = useState("");
    const [designation, setDesignation] = useState("");
    const [monthlySalary, setMonthlySalary] = useState("");
    const [authorizedName, setAuthorizedName] = useState("");
    const [authorizedDesignation, setAuthorizedDesignation] = useState("");
    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadEmployees() {
            setEmployees([]);
            setEmployeeId("");
            setErrorMessage("");

            if (!currentCompanyId) return;

            setLoading(true);

            try {
                const data = await getEmployees(currentCompanyId);

                if (!cancelled) {
                    setEmployees(data || []);
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(
                        error.message || "Unable to load employees."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadEmployees();

        return () => {
            cancelled = true;
        };
    }, [currentCompanyId]);

    const selectedEmployee = useMemo(
        () => employees.find((employee) => employee.id === employeeId),
        [employees, employeeId]
    );

    useEffect(() => {
        if (!selectedEmployee) {
            setJoiningDate("");
            setLeavingDate("");
            setDesignation("");
            setMonthlySalary("");
            return;
        }

        setJoiningDate(
            dateValue(
                selectedEmployee.date_of_joining ||
                selectedEmployee.joining_date
            )
        );

        setLeavingDate(
            dateValue(
                selectedEmployee.date_of_leaving ||
                selectedEmployee.last_working_date
            )
        );

        setDesignation(
            selectedEmployee.designation_name ||
            selectedEmployee.designation ||
            ""
        );

        setMonthlySalary(
            selectedEmployee.monthly_salary ??
            selectedEmployee.basic_salary ??
            ""
        );
    }, [selectedEmployee]);

    const employeeName = selectedEmployee
        ? (
            selectedEmployee.employee_name ||
            selectedEmployee.full_name ||
            selectedEmployee.name ||
            ""
        )
        : "";

    const employeeCode = selectedEmployee
        ? (
            selectedEmployee.employee_code ||
            selectedEmployee.employee_id ||
            ""
        )
        : "";

    const companyName =
        currentCompany?.company_name ||
        currentCompany?.name ||
        "Company";

    const selectedDocument = DOCUMENT_TYPES.find(
        (item) => item.value === documentType
    );

    const requiresLeavingDate = [
        "EXPERIENCE",
        "RELIEVING"
    ].includes(documentType);

    const canGenerate =
        Boolean(selectedEmployee) &&
        Boolean(documentDate) &&
        (!requiresLeavingDate || Boolean(leavingDate));

    function getDocumentBody() {
        const joining = displayDate(joiningDate);
        const leaving = displayDate(leavingDate);
        const issueDate = displayDate(documentDate);
        const role = designation || "____________";

        switch (documentType) {
            case "JOINING":
                return `Dear ${employeeName},

We welcome you to ${companyName}.

Your joining date is ${joining}. You are requested to comply with the company's applicable policies, attendance requirements and workplace procedures.

Please contact the HR department for any assistance relating to your employment.

We wish you success in your role.

Regards,
${authorizedName || "Authorized Signatory"}
${authorizedDesignation || "HR / Authorized Signatory"}`;

            case "APPOINTMENT":
            case "APPOINTMENT_ANNEXURE":
                return `Dear ${employeeName},

We are pleased to offer you employment with ${companyName} for the position of ${role}, effective from ${joining}.

Your employment will be governed by the terms of your appointment, the company's applicable policies and the employment terms communicated to you.

Please confirm your acceptance of the appointment and complete the required joining formalities.

Regards,
${authorizedName || "Authorized Signatory"}
${authorizedDesignation || "HR / Authorized Signatory"}`;

            case "EXPERIENCE":
                return `TO WHOMSOEVER IT MAY CONCERN

This is to certify that ${employeeName}, Employee Code ${employeeCode || "____________"}, was employed with ${companyName} as ${role} from ${joining} to ${leaving}.

During the period of employment, the employee worked with the organization in the above-mentioned role.

We wish the employee success in future endeavours.

Issued on: ${issueDate}

Regards,
${authorizedName || "Authorized Signatory"}
${authorizedDesignation || "HR / Authorized Signatory"}`;

            case "RELIEVING":
                return `Dear ${employeeName},

This letter confirms that you have been relieved from your duties with ${companyName} effective from ${leaving}, subject to completion of the applicable exit formalities.

We thank you for your service and wish you success in your future endeavours.

Issued on: ${issueDate}

Regards,
${authorizedName || "Authorized Signatory"}
${authorizedDesignation || "HR / Authorized Signatory"}`;

            default:
                return "";
        }
    }

    return (
        <div className="employee-documents-page">
            <style>{`
                .employee-documents-page {
                    padding: 24px;
                    color: #1f2937;
                }
                .employee-documents-page .panel {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .employee-documents-page .form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
                    gap: 16px;
                }
                .employee-documents-page label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 6px;
                }
                .employee-documents-page input,
                .employee-documents-page select,
                .employee-documents-page textarea {
                    box-sizing: border-box;
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    background: white;
                }
                .employee-documents-page button {
                    padding: 10px 16px;
                    border: 0;
                    border-radius: 6px;
                    background: #1d4ed8;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                }
                .employee-documents-page button:disabled {
                    opacity: .45;
                    cursor: not-allowed;
                }
                .employee-documents-page .letter {
                    max-width: 850px;
                    margin: 0 auto;
                    padding: 40px;
                    background: white;
                    border: 1px solid #d1d5db;
                    min-height: 650px;
                    white-space: pre-wrap;
                    line-height: 1.8;
                }
                .employee-documents-page .error {
                    color: #b91c1c;
                }
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .employee-documents-page .print-area,
                    .employee-documents-page .print-area * {
                        visibility: visible !important;
                    }
                    .employee-documents-page .print-area {
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
                <h1 style={{ marginTop: 0 }}>Employee Documents</h1>
                <p style={{ color: "#6b7280" }}>
                    Prepare and print employee letters and employment documents.
                </p>

                {!currentCompanyId && (
                    <div className="panel">
                        Please select a company first.
                    </div>
                )}

                {errorMessage && (
                    <p className="error">{errorMessage}</p>
                )}

                <div className="panel">
                    <div className="form-grid">
                        <div>
                            <label>Employee</label>
                            <select
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                            >
                                <option value="">Select employee</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.employee_code
                                            ? `${employee.employee_code} — `
                                            : ""}
                                        {employee.employee_name ||
                                            employee.full_name ||
                                            employee.name ||
                                            "Employee"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Document Type</label>
                            <select
                                value={documentType}
                                onChange={(e) =>
                                    setDocumentType(e.target.value)
                                }
                            >
                                {DOCUMENT_TYPES.map((item) => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Document Date</label>
                            <input
                                type="date"
                                value={documentDate}
                                onChange={(e) =>
                                    setDocumentDate(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>Joining Date</label>
                            <input
                                type="date"
                                value={joiningDate}
                                onChange={(e) =>
                                    setJoiningDate(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>Last Working Date</label>
                            <input
                                type="date"
                                value={leavingDate}
                                onChange={(e) =>
                                    setLeavingDate(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>Designation</label>
                            <input
                                value={designation}
                                onChange={(e) =>
                                    setDesignation(e.target.value)
                                }
                                placeholder="Enter designation"
                            />
                        </div>

                        {documentType === "APPOINTMENT_ANNEXURE" && (
                            <div>
                                <label>Monthly Salary (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={monthlySalary}
                                    onChange={(e) =>
                                        setMonthlySalary(e.target.value)
                                    }
                                />
                            </div>
                        )}

                        <div>
                            <label>Authorized Signatory Name</label>
                            <input
                                value={authorizedName}
                                onChange={(e) =>
                                    setAuthorizedName(e.target.value)
                                }
                                placeholder="Enter signatory name"
                            />
                        </div>

                        <div>
                            <label>Signatory Designation</label>
                            <input
                                value={authorizedDesignation}
                                onChange={(e) =>
                                    setAuthorizedDesignation(e.target.value)
                                }
                                placeholder="Enter designation"
                            />
                        </div>
                    </div>

                    {documentType === "APPOINTMENT_ANNEXURE" && (
                        <div style={{ marginTop: 20 }}>
                            <h3>Salary Annexure</h3>
                            <p>
                                Monthly salary entered: ₹
                                {Number(monthlySalary || 0).toLocaleString("en-IN")}
                            </p>
                            <p style={{ color: "#92400e" }}>
                                This initial version shows a single monthly
                                salary figure. We will connect the detailed
                                salary structure and allowances in the next
                                integration step.
                            </p>
                        </div>
                    )}

                    {requiresLeavingDate && !leavingDate && (
                        <p style={{ color: "#b45309" }}>
                            Enter the employee's last working date before
                            generating this document.
                        </p>
                    )}

                    <div style={{ marginTop: 20 }}>
                        <button
                            disabled={!canGenerate || loading}
                            onClick={() => window.print()}
                        >
                            Generate / Print Document
                        </button>
                    </div>

                    {loading && <p>Loading employees...</p>}
                </div>
            </div>

            {selectedEmployee && (
                <div className="panel print-area">
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <h2>{companyName}</h2>
                        <h3>{selectedDocument?.label.toUpperCase()}</h3>
                        <p>Date: {displayDate(documentDate)}</p>
                    </div>

                    <div className="letter">
                        {getDocumentBody()}

                        {documentType === "APPOINTMENT_ANNEXURE" && (
                            <>
                                {"\n\nSALARY ANNEXURE\n"}
                                {"Monthly Salary: ₹"}
                                {Number(monthlySalary || 0).toLocaleString("en-IN")}
                                {"\n\n"}
                                {"This figure is entered for document preparation. "}
                                {"Please verify it against the approved salary structure."}
                            </>
                        )}

                        {remarks && `\n\nAdditional Remarks:\n${remarks}`}

                        {"\n\nEmployee Signature: ____________________"}
                        {"\nDate: ____________________"}
                    </div>
                </div>
            )}
        </div>
    );
              }
