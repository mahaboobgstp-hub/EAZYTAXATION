
import React, { useMemo, useState } from "react";
import "../../css/hr/EmployeeDocumentRepository.css";

const documentTypes = [
  "Aadhaar / Identity Proof",
  "PAN Card",
  "Address Proof",
  "Photograph",
  "Resume / CV",
  "Educational Certificate",
  "Experience Certificate",
  "Appointment Letter",
  "Joining Letter",
  "Salary Annexure",
  "Payslip",
  "Bank Proof",
  "PF / UAN Document",
  "ESI Document",
  "Warning Letter",
  "Experience Letter",
  "Relieving Letter",
  "Other",
];

const initialDocuments = [
  {
    id: 1,
    employeeCode: "EMP001",
    employeeName: "Vamsi Cherukuri",
    documentType: "Appointment Letter",
    documentName: "Appointment_Letter_EMP001.pdf",
    issueDate: "2026-04-01",
    expiryDate: "",
    status: "Available",
    remarks: "Signed appointment letter",
  },
  {
    id: 2,
    employeeCode: "EMP001",
    employeeName: "Vamsi Cherukuri",
    documentType: "PAN Card",
    documentName: "PAN_EMP001.pdf",
    issueDate: "",
    expiryDate: "",
    status: "Available",
    remarks: "Identity verification",
  },
  {
    id: 3,
    employeeCode: "EMP002",
    employeeName: "Mahaboob Basha",
    documentType: "Educational Certificate",
    documentName: "",
    issueDate: "",
    expiryDate: "",
    status: "Missing",
    remarks: "Awaiting employee submission",
  },
  {
    id: 4,
    employeeCode: "EMP003",
    employeeName: "Test Employee",
    documentType: "Experience Certificate",
    documentName: "Experience_EMP003.pdf",
    issueDate: "2026-09-30",
    expiryDate: "",
    status: "Available",
    remarks: "Issued on employee exit",
  },
  {
    id: 5,
    employeeCode: "EMP002",
    employeeName: "Mahaboob Basha",
    documentType: "Address Proof",
    documentName: "Address_Proof_EMP002.pdf",
    issueDate: "",
    expiryDate: "",
    status: "Pending Verification",
    remarks: "Review document details",
  },
];

const emptyForm = {
  employeeCode: "",
  employeeName: "",
  documentType: "Aadhaar / Identity Proof",
  documentName: "",
  issueDate: "",
  expiryDate: "",
  status: "Available",
  remarks: "",
};

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

export default function EmployeeDocumentRepository() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const employeeOptions = useMemo(() => {
    const employees = documents.map((doc) => ({
      code: doc.employeeCode,
      name: doc.employeeName,
    }));

    return employees.filter(
      (employee, index, list) =>
        list.findIndex((item) => item.code === employee.code) === index
    );
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const query = search.toLowerCase();

      const matchesSearch =
        doc.employeeName.toLowerCase().includes(query) ||
        doc.employeeCode.toLowerCase().includes(query) ||
        doc.documentType.toLowerCase().includes(query) ||
        doc.documentName.toLowerCase().includes(query);

      const matchesEmployee =
        employeeFilter === "All" || doc.employeeCode === employeeFilter;

      const matchesType =
        typeFilter === "All" || doc.documentType === typeFilter;

      const matchesStatus =
        statusFilter === "All" || doc.status === statusFilter;

      return (
        matchesSearch &&
        matchesEmployee &&
        matchesType &&
        matchesStatus
      );
    });
  }, [documents, search, employeeFilter, typeFilter, statusFilter]);

  const availableCount = documents.filter(
    (doc) => doc.status === "Available"
  ).length;

  const missingCount = documents.filter(
    (doc) => doc.status === "Missing"
  ).length;

  const pendingCount = documents.filter(
    (doc) => doc.status === "Pending Verification"
  ).length;

  const expiringCount = documents.filter((doc) => {
    if (!doc.expiryDate || doc.status !== "Available") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${doc.expiryDate}T00:00:00`);
    const daysRemaining = Math.ceil(
      (expiry.getTime() - today.getTime()) / 86400000
    );

    return daysRemaining >= 0 && daysRemaining <= 60;
  }).length;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openNewForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(doc) {
    setForm({
      employeeCode: doc.employeeCode,
      employeeName: doc.employeeName,
      documentType: doc.documentType,
      documentName: doc.documentName,
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      status: doc.status,
      remarks: doc.remarks,
    });

    setEditingId(doc.id);
    setMessage("");
    setShowForm(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!form.employeeCode.trim() || !form.employeeName.trim()) {
      setMessage("Enter the employee code and name.");
      return;
    }

    if (
      form.issueDate &&
      form.expiryDate &&
      form.expiryDate < form.issueDate
    ) {
      setMessage("Expiry date cannot be earlier than issue date.");
      return;
    }

    const record = {
      ...form,
      id: editingId || Date.now(),
      employeeCode: form.employeeCode.trim(),
      employeeName: form.employeeName.trim(),
      documentName: form.documentName.trim(),
    };

    if (editingId) {
      setDocuments((current) =>
        current.map((doc) => (doc.id === editingId ? record : doc))
      );
      setMessage("Document record updated in this screen.");
    } else {
      setDocuments((current) => [record, ...current]);
      setMessage("Document record added in this screen.");
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateDocumentStatus(id, status) {
    setDocuments((current) =>
      current.map((doc) => (doc.id === id ? { ...doc, status } : doc))
    );

    setMessage(`Document status changed to ${status}.`);
  }

  function handlePrintRegister() {
    window.print();
  }

  return (
    <div className="edr-page">
      <div className="edr-header">
        <div>
          <h1>Employee Document Repository</h1>
          <p>
            Maintain employee document records, verification status and
            expiry information.
          </p>
        </div>

        <div className="edr-header-actions">
          <button
            type="button"
            className="edr-secondary-button"
            onClick={handlePrintRegister}
          >
            Print Register
          </button>
          <button
            type="button"
            className="edr-primary-button"
            onClick={openNewForm}
          >
            + Add Document Record
          </button>
        </div>
      </div>

      <div className="edr-demo-notice">
        UI preview only: these are sample records. Changes are temporary and
        will not upload files or save data to Supabase.
      </div>

      {message && (
        <div className="edr-message" role="status">
          {message}
        </div>
      )}

      <div className="edr-summary-grid">
        <div className="edr-summary-card">
          <span>Total Records</span>
          <strong>{documents.length}</strong>
          <small>All employee document entries</small>
        </div>

        <div className="edr-summary-card edr-available-card">
          <span>Available</span>
          <strong>{availableCount}</strong>
          <small>Marked as available</small>
        </div>

        <div className="edr-summary-card edr-missing-card">
          <span>Missing</span>
          <strong>{missingCount}</strong>
          <small>Awaiting submission</small>
        </div>

        <div className="edr-summary-card edr-pending-card">
          <span>Pending Verification</span>
          <strong>{pendingCount}</strong>
          <small>Needs review</small>
        </div>

        <div className="edr-summary-card edr-expiry-card">
          <span>Expiring Within 60 Days</span>
          <strong>{expiringCount}</strong>
          <small>Based on entered expiry dates</small>
        </div>
      </div>

      {showForm && (
        <section className="edr-panel">
          <div className="edr-panel-heading">
            <div>
              <h2>{editingId ? "Edit Document Record" : "Add Document Record"}</h2>
              <p>
                Register document details. Actual file storage will be connected
                separately.
              </p>
            </div>

            <button
              type="button"
              className="edr-secondary-button"
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="edr-form-grid">
              <label className="edr-field">
                Employee Code *
                <input
                  value={form.employeeCode}
                  onChange={(event) =>
                    updateField("employeeCode", event.target.value)
                  }
                  placeholder="e.g. EMP004"
                  required
                />
              </label>

              <label className="edr-field">
                Employee Name *
                <input
                  value={form.employeeName}
                  onChange={(event) =>
                    updateField("employeeName", event.target.value)
                  }
                  placeholder="Enter employee name"
                  required
                />
              </label>

              <label className="edr-field">
                Document Type *
                <select
                  value={form.documentType}
                  onChange={(event) =>
                    updateField("documentType", event.target.value)
                  }
                  required
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="edr-field">
                Document Status *
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Missing">Missing</option>
                  <option value="Pending Verification">
                    Pending Verification
                  </option>
                  <option value="Rejected">Rejected</option>
                  <option value="Expired">Expired</option>
                </select>
              </label>

              <label className="edr-field edr-full-width">
                File Name / Reference
                <input
                  value={form.documentName}
                  onChange={(event) =>
                    updateField("documentName", event.target.value)
                  }
                  placeholder="e.g. Appointment_Letter_EMP004.pdf"
                />
              </label>

              <label className="edr-field">
                Issue Date
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(event) =>
                    updateField("issueDate", event.target.value)
                  }
                />
              </label>

              <label className="edr-field">
                Expiry Date
                <input
                  type="date"
                  min={form.issueDate || undefined}
                  value={form.expiryDate}
                  onChange={(event) =>
                    updateField("expiryDate", event.target.value)
                  }
                />
              </label>

              <label className="edr-field edr-full-width">
                Remarks
                <textarea
                  rows="3"
                  value={form.remarks}
                  onChange={(event) =>
                    updateField("remarks", event.target.value)
                  }
                  placeholder="Verification notes or missing-document details"
                />
              </label>
            </div>

            <div className="edr-form-footer">
              <button
                type="button"
                className="edr-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="edr-primary-button">
                Save Record
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="edr-panel">
        <div className="edr-panel-heading">
          <div>
            <h2>Document Register</h2>
            <p>Search records and update document verification status.</p>
          </div>

          <span className="edr-record-count">
            {filteredDocuments.length} record(s)
          </span>
        </div>

        <div className="edr-filters">
          <input
            className="edr-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee, document or file name..."
            aria-label="Search document records"
          />

          <select
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
            aria-label="Filter by employee"
          >
            <option value="All">All Employees</option>
            {employeeOptions.map((employee) => (
              <option key={employee.code} value={employee.code}>
                {employee.code} — {employee.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by document type"
          >
            <option value="All">All Document Types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by document status"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Missing">Missing</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div className="edr-table-wrapper">
          <table className="edr-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Document Type</th>
                <th>File / Reference</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.employeeName}</strong>
                    <small>{doc.employeeCode}</small>
                  </td>

                  <td>{doc.documentType}</td>

                  <td className="edr-file-cell">
                    {doc.documentName || "No file recorded"}
                  </td>

                  <td>{formatDate(doc.issueDate)}</td>
                  <td>{formatDate(doc.expiryDate)}</td>

                  <td>
                    <span
                      className={`edr-status edr-status-${statusClass(
                        doc.status
                      )}`}
                    >
                      {doc.status}
                    </span>
                  </td>

                  <td className="edr-remarks-cell">
                    {doc.remarks || "—"}
                  </td>

                  <td>
                    <div className="edr-row-actions">
                      <button
                        type="button"
                        className="edr-secondary-button"
                        onClick={() => openEditForm(doc)}
                      >
                        Edit
                      </button>

                      {doc.status === "Pending Verification" && (
                        <button
                          type="button"
                          className="edr-action-button"
                          onClick={() =>
                            updateDocumentStatus(doc.id, "Available")
                          }
                        >
                          Verify
                        </button>
                      )}

                      {doc.status === "Available" && (
                        <button
                          type="button"
                          className="edr-secondary-button"
                          onClick={() =>
                            updateDocumentStatus(doc.id, "Missing")
                          }
                        >
                          Mark Missing
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan="8" className="edr-empty-state">
                    No documents match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="edr-panel edr-note-panel">
        <h2>Repository Notes</h2>
        <ul>
          <li>
            Generated letters should eventually link to the actual stored
            document, not just a file name.
          </li>
          <li>
            Sensitive employee documents should be accessible only to
            authorized users.
          </li>
          <li>
            Expiry alerts require valid expiry dates and a future reminder
            workflow.
          </li>
        </ul>
      </section>
    </div>
  );
}
