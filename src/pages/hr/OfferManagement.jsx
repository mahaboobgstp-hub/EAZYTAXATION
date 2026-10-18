
import { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiX,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiFileText,
  FiCalendar,
} from "react-icons/fi";
import "../../css/hr/OfferManagement.css";

const TODAY = new Date().toISOString().slice(0, 10);

const INITIAL_OFFERS = [
  {
    id: 1,
    offerCode: "OFR-2026-001",
    candidateName: "Rahul Verma",
    candidateCode: "CAN-2026-005",
    jobTitle: "Accounts Executive",
    requisitionCode: "REQ-2026-001",
    department: "Finance",
    employmentType: "Full Time",
    offeredSalary: 35000,
    salaryPeriod: "Monthly",
    offerDate: "2026-10-12",
    expiryDate: "2026-10-25",
    joiningDate: "2026-11-02",
    approvalStatus: "Approved",
    offerStatus: "Released",
    candidateResponse: "Pending",
    recruiter: "HR Team",
    notes: "Offer awaiting candidate response",
  },
  {
    id: 2,
    offerCode: "OFR-2026-002",
    candidateName: "Meera Nair",
    candidateCode: "CAN-2026-006",
    jobTitle: "HR Executive",
    requisitionCode: "REQ-2026-002",
    department: "Human Resources",
    employmentType: "Full Time",
    offeredSalary: 30000,
    salaryPeriod: "Monthly",
    offerDate: "2026-10-10",
    expiryDate: "2026-10-18",
    joiningDate: "2026-10-26",
    approvalStatus: "Pending Approval",
    offerStatus: "Draft",
    candidateResponse: "Pending",
    recruiter: "HR Team",
    notes: "",
  },
  {
    id: 3,
    offerCode: "OFR-2026-003",
    candidateName: "Vikram Reddy",
    candidateCode: "CAN-2026-007",
    jobTitle: "Sales Executive",
    requisitionCode: "REQ-2026-004",
    department: "Sales",
    employmentType: "Full Time",
    offeredSalary: 27000,
    salaryPeriod: "Monthly",
    offerDate: "2026-10-08",
    expiryDate: "2026-10-20",
    joiningDate: "2026-11-01",
    approvalStatus: "Approved",
    offerStatus: "Released",
    candidateResponse: "Accepted",
    recruiter: "HR Team",
    notes: "Joining confirmation to be completed",
  },
  {
    id: 4,
    offerCode: "OFR-2026-004",
    candidateName: "Kavya Rao",
    candidateCode: "CAN-2026-008",
    jobTitle: "Software Developer",
    requisitionCode: "REQ-2026-003",
    department: "IT",
    employmentType: "Full Time",
    offeredSalary: 60000,
    salaryPeriod: "Monthly",
    offerDate: "2026-10-05",
    expiryDate: "2026-10-15",
    joiningDate: "2026-10-22",
    approvalStatus: "Approved",
    offerStatus: "Released",
    candidateResponse: "Declined",
    recruiter: "HR Team",
    notes: "Candidate declined the offer",
  },
];

const EMPTY_FORM = {
  candidateName: "",
  candidateCode: "",
  jobTitle: "",
  requisitionCode: "",
  department: "",
  employmentType: "Full Time",
  offeredSalary: "",
  salaryPeriod: "Monthly",
  offerDate: TODAY,
  expiryDate: "",
  joiningDate: "",
  approvalStatus: "Draft",
  offerStatus: "Draft",
  candidateResponse: "Pending",
  recruiter: "",
  notes: "",
};

const APPROVAL_STATUSES = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
];

const OFFER_STATUSES = [
  "Draft",
  "Ready for Release",
  "Released",
  "Withdrawn",
  "Expired",
];

const RESPONSES = [
  "Pending",
  "Accepted",
  "Declined",
  "Negotiating",
];

const EMPLOYMENT_TYPES = [
  "Full Time",
  "Part Time",
  "Contract",
  "Internship",
];

const SALARY_PERIODS = ["Monthly", "Annual"];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const statusClass = (status) =>
  status.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function OfferManagement() {
  const [offers, setOffers] = useState(INITIAL_OFFERS);
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("All");
  const [offerFilter, setOfferFilter] = useState("All");
  const [responseFilter, setResponseFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const departments = useMemo(
    () => [...new Set(offers.map((offer) => offer.department).filter(Boolean))].sort(),
    [offers]
  );

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return offers.filter((offer) => {
      const searchable = [
        offer.offerCode,
        offer.candidateName,
        offer.candidateCode,
        offer.jobTitle,
        offer.requisitionCode,
        offer.department,
        offer.recruiter,
      ];

      return (
        (!term ||
          searchable.some((value) =>
            String(value || "").toLowerCase().includes(term)
          )) &&
        (approvalFilter === "All" ||
          offer.approvalStatus === approvalFilter) &&
        (offerFilter === "All" || offer.offerStatus === offerFilter) &&
        (responseFilter === "All" ||
          offer.candidateResponse === responseFilter) &&
        (departmentFilter === "All" ||
          offer.department === departmentFilter)
      );
    });
  }, [
    offers,
    search,
    approvalFilter,
    offerFilter,
    responseFilter,
    departmentFilter,
  ]);

  const pendingApproval = offers.filter(
    (offer) => offer.approvalStatus === "Pending Approval"
  ).length;

  const releasedOffers = offers.filter(
    (offer) => offer.offerStatus === "Released"
  ).length;

  const acceptedOffers = offers.filter(
    (offer) => offer.candidateResponse === "Accepted"
  ).length;

  const pendingResponses = offers.filter(
    (offer) =>
      offer.offerStatus === "Released" &&
      offer.candidateResponse === "Pending"
  ).length;

  const acceptedValue = offers
    .filter((offer) => offer.candidateResponse === "Accepted")
    .reduce((total, offer) => total + (Number(offer.offeredSalary) || 0), 0);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      offerDate: TODAY,
    });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (offer) => {
    setEditingId(offer.id);
    setForm({
      ...offer,
      offeredSalary: String(offer.offeredSalary ?? ""),
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.candidateName.trim() ||
      !form.jobTitle.trim() ||
      !form.department.trim() ||
      !form.offerDate
    ) {
      setError("Please complete the candidate, job, department and offer date fields.");
      return;
    }

    const salary = Number(form.offeredSalary);
    if (!Number.isFinite(salary) || salary <= 0) {
      setError("Enter a valid offered salary greater than zero.");
      return;
    }

    if (
      form.expiryDate &&
      form.expiryDate < form.offerDate
    ) {
      setError("The offer expiry date cannot be earlier than the offer date.");
      return;
    }

    if (
      form.joiningDate &&
      form.joiningDate < form.offerDate
    ) {
      setError("The joining date cannot be earlier than the offer date.");
      return;
    }

    if (
      form.offerStatus === "Released" &&
      form.approvalStatus !== "Approved"
    ) {
      setError("Only an approved offer can be marked as Released.");
      return;
    }

    if (
      form.offerStatus === "Released" &&
      form.approvalStatus === "Approved" &&
      form.candidateResponse === "Pending" &&
      form.expiryDate &&
      form.expiryDate < TODAY
    ) {
      setError("This offer's expiry date has passed. Update the offer status before proceeding.");
      return;
    }

    const record = {
      ...form,
      candidateName: form.candidateName.trim(),
      candidateCode: form.candidateCode.trim(),
      jobTitle: form.jobTitle.trim(),
      requisitionCode: form.requisitionCode.trim(),
      department: form.department.trim(),
      recruiter: form.recruiter.trim(),
      offeredSalary: salary,
      notes: form.notes.trim(),
    };

    if (editingId !== null) {
      setOffers((current) =>
        current.map((offer) =>
          offer.id === editingId ? { ...offer, ...record } : offer
        )
      );
    } else {
      const nextId =
        offers.reduce(
          (max, offer) => Math.max(max, Number(offer.id) || 0),
          0
        ) + 1;

      setOffers((current) => [
        {
          id: nextId,
          offerCode: `OFR-${new Date().getFullYear()}-${String(nextId).padStart(3, "0")}`,
          ...record,
        },
        ...current,
      ]);
    }

    setShowForm(false);
  };

  const deleteOffer = (offer) => {
    if (
      window.confirm(
        `Delete offer ${offer.offerCode} for ${offer.candidateName}?`
      )
    ) {
      setOffers((current) =>
        current.filter((item) => item.id !== offer.id)
      );
    }
  };

  const exportCsv = () => {
    const headers = [
      "Offer Code",
      "Candidate",
      "Candidate Code",
      "Job Title",
      "Requisition Code",
      "Department",
      "Employment Type",
      "Offered Salary",
      "Salary Period",
      "Offer Date",
      "Expiry Date",
      "Joining Date",
      "Approval Status",
      "Offer Status",
      "Candidate Response",
      "Recruiter",
      "Notes",
    ];

    const rows = filteredOffers.map((offer) => [
      offer.offerCode,
      offer.candidateName,
      offer.candidateCode,
      offer.jobTitle,
      offer.requisitionCode,
      offer.department,
      offer.employmentType,
      offer.offeredSalary,
      offer.salaryPeriod,
      offer.offerDate,
      offer.expiryDate,
      offer.joiningDate,
      offer.approvalStatus,
      offer.offerStatus,
      offer.candidateResponse,
      offer.recruiter,
      offer.notes,
    ]);

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "offer-management.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setApprovalFilter("All");
    setOfferFilter("All");
    setResponseFilter("All");
    setDepartmentFilter("All");
  };

  return (
    <div className="om-page">
      <div className="om-page-header">
        <div>
          <span className="om-eyebrow">RECRUITMENT</span>
          <h1>Offer Management &amp; Hiring Status</h1>
          <p>Prepare offers, track approvals, record candidate responses and monitor joining.</p>
        </div>
        <div className="om-header-actions">
          <button type="button" className="om-btn om-btn-secondary" onClick={exportCsv}>
            <FiDownload /> Export CSV
          </button>
          <button type="button" className="om-btn om-btn-primary" onClick={openNewForm}>
            <FiPlus /> Create Offer
          </button>
        </div>
      </div>

      <div className="om-stats-grid">
        <div className="om-stat-card">
          <div className="om-stat-icon om-purple"><FiClock /></div>
          <div>
            <span>Pending Approval</span>
            <strong>{pendingApproval}</strong>
            <small>Awaiting internal approval</small>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon om-blue"><FiFileText /></div>
          <div>
            <span>Offers Released</span>
            <strong>{releasedOffers}</strong>
            <small>Marked as released</small>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon om-green"><FiCheckCircle /></div>
          <div>
            <span>Accepted Offers</span>
            <strong>{acceptedOffers}</strong>
            <small>Candidate response recorded</small>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon om-orange"><FiUsers /></div>
          <div>
            <span>Awaiting Response</span>
            <strong>{pendingResponses}</strong>
            <small>Released, response pending</small>
          </div>
        </div>
      </div>

      <div className="om-summary-strip">
        <div className="om-summary-icon"><FiDollarSign /></div>
        <div>
          <span>Total offered salary for accepted candidates</span>
          <strong>{money(acceptedValue)}</strong>
          <small>
            Based on the salary amounts entered. Values are not annualized;
            monthly and annual offers may be mixed.
          </small>
        </div>
      </div>

      <div className="om-table-card">
        <div className="om-table-heading">
          <div>
            <h2>Offer Register</h2>
            <p>{filteredOffers.length} offer record(s) match your filters</p>
          </div>
        </div>

        <div className="om-filters">
          <div className="om-search">
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate, offer code, job or recruiter..."
              aria-label="Search offers"
            />
          </div>

          <div className="om-filter-control">
            <FiFilter />
            <select
              value={approvalFilter}
              onChange={(event) => setApprovalFilter(event.target.value)}
              aria-label="Filter by approval status"
            >
              <option value="All">All approvals</option>
              {APPROVAL_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <select
            className="om-select-filter"
            value={offerFilter}
            onChange={(event) => setOfferFilter(event.target.value)}
            aria-label="Filter by offer status"
          >
            <option value="All">All offer statuses</option>
            {OFFER_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            className="om-select-filter"
            value={responseFilter}
            onChange={(event) => setResponseFilter(event.target.value)}
            aria-label="Filter by candidate response"
          >
            <option value="All">All responses</option>
            {RESPONSES.map((response) => (
              <option key={response} value={response}>{response}</option>
            ))}
          </select>

          <select
            className="om-select-filter"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            aria-label="Filter by department"
          >
            <option value="All">All departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>

          <button type="button" className="om-btn om-btn-reset" onClick={resetFilters}>
            Reset
          </button>
        </div>

        <div className="om-table-wrapper">
          <table className="om-table">
            <thead>
              <tr>
                <th>Candidate / Offer</th>
                <th>Position</th>
                <th>Offered Salary</th>
                <th>Offer Dates</th>
                <th>Approval</th>
                <th>Offer Status</th>
                <th>Candidate Response</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map((offer) => (
                <tr key={offer.id}>
                  <td>
                    <div className="om-candidate-cell">
                      <div className="om-avatar">
                        {offer.candidateName.trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{offer.candidateName}</strong>
                        <small>{offer.offerCode}</small>
                        <small>{offer.candidateCode || "No candidate code"}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{offer.jobTitle}</strong>
                    <small className="om-muted">{offer.department}</small>
                    {offer.requisitionCode && (
                      <small className="om-muted">{offer.requisitionCode}</small>
                    )}
                  </td>
                  <td>
                    <strong>{money(offer.offeredSalary)}</strong>
                    <small className="om-muted">{offer.salaryPeriod}</small>
                  </td>
                  <td>
                    <div className="om-dates">
                      <span><FiCalendar /> Offer: {formatDate(offer.offerDate)}</span>
                      <span><FiClock /> Expires: {formatDate(offer.expiryDate)}</span>
                      <span><FiUsers /> Joining: {formatDate(offer.joiningDate)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`om-status om-status-${statusClass(offer.approvalStatus)}`}>
                      {offer.approvalStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`om-status om-status-${statusClass(offer.offerStatus)}`}>
                      {offer.offerStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`om-status om-status-${statusClass(offer.candidateResponse)}`}>
                      {offer.candidateResponse}
                    </span>
                  </td>
                  <td>
                    <div className="om-row-actions">
                      <button
                        type="button"
                        className="om-icon-btn om-edit-btn"
                        onClick={() => openEditForm(offer)}
                        title="Edit offer"
                        aria-label={`Edit offer for ${offer.candidateName}`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="om-icon-btn om-delete-btn"
                        onClick={() => deleteOffer(offer)}
                        title="Delete offer"
                        aria-label={`Delete offer ${offer.offerCode}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOffers.length === 0 && (
                <tr>
                  <td colSpan="8" className="om-empty-state">
                    <FiFileText />
                    <strong>No offers found</strong>
                    <span>Change your filters or create a new offer.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="om-note">
        <strong>Offer control:</strong> This prototype checks basic date and approval
        conditions. Production use requires a permission-controlled approval workflow,
        an immutable history of changes, and a generated offer letter before release.
        Marking a response as Accepted does not automatically create an employee record.
      </div>

      {showForm && (
        <div
          className="om-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <div className="om-modal" role="dialog" aria-modal="true" aria-labelledby="om-form-title">
            <div className="om-modal-header">
              <div>
                <h2 id="om-form-title">
                  {editingId !== null ? "Edit Offer" : "Create Offer"}
                </h2>
                <p>Enter the offer details and track its approval and response.</p>
              </div>
              <button
                type="button"
                className="om-icon-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="om-form-section">
                <h3>Candidate &amp; Position</h3>
                <div className="om-form-grid">
                  <label className="om-field">
                    Candidate Name *
                    <input
                      required
                      value={form.candidateName}
                      onChange={(e) => updateField("candidateName", e.target.value)}
                      placeholder="Candidate full name"
                    />
                  </label>

                  <label className="om-field">
                    Candidate Code
                    <input
                      value={form.candidateCode}
                      onChange={(e) => updateField("candidateCode", e.target.value)}
                      placeholder="e.g. CAN-2026-001"
                    />
                  </label>

                  <label className="om-field">
                    Job Title *
                    <input
                      required
                      value={form.jobTitle}
                      onChange={(e) => updateField("jobTitle", e.target.value)}
                      placeholder="Position offered"
                    />
                  </label>

                  <label className="om-field">
                    Requisition Code
                    <input
                      value={form.requisitionCode}
                      onChange={(e) => updateField("requisitionCode", e.target.value)}
                      placeholder="e.g. REQ-2026-001"
                    />
                  </label>

                  <label className="om-field">
                    Department *
                    <input
                      required
                      value={form.department}
                      onChange={(e) => updateField("department", e.target.value)}
                      placeholder="Department"
                    />
                  </label>

                  <label className="om-field">
                    Employment Type
                    <select
                      value={form.employmentType}
                      onChange={(e) => updateField("employmentType", e.target.value)}
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="om-form-section">
                <h3>Compensation &amp; Dates</h3>
                <div className="om-form-grid">
                  <label className="om-field">
                    Offered Salary *
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={form.offeredSalary}
                      onChange={(e) => updateField("offeredSalary", e.target.value)}
                      placeholder="Salary amount"
                    />
                  </label>

                  <label className="om-field">
                    Salary Period
                    <select
                      value={form.salaryPeriod}
                      onChange={(e) => updateField("salaryPeriod", e.target.value)}
                    >
                      {SALARY_PERIODS.map((period) => (
                        <option key={period} value={period}>{period}</option>
                      ))}
                    </select>
                  </label>

                  <label className="om-field">
                    Offer Date *
                    <input
                      type="date"
                      required
                      value={form.offerDate}
                      onChange={(e) => updateField("offerDate", e.target.value)}
                    />
                  </label>

                  <label className="om-field">
                    Offer Expiry Date
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => updateField("expiryDate", e.target.value)}
                    />
                  </label>

                  <label className="om-field">
                    Expected Joining Date
                    <input
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => updateField("joiningDate", e.target.value)}
                    />
                  </label>

                  <label className="om-field">
                    Recruiter / Owner
                    <input
                      value={form.recruiter}
                      onChange={(e) => updateField("recruiter", e.target.value)}
                      placeholder="Assigned recruiter"
                    />
                  </label>
                </div>
              </div>

              <div className="om-form-section">
                <h3>Approval &amp; Candidate Response</h3>
                <div className="om-form-grid">
                  <label className="om-field">
                    Approval Status
                    <select
                      value={form.approvalStatus}
                      onChange={(e) => {
                        const nextStatus = e.target.value;
                        setForm((current) => ({
                          ...current,
                          approvalStatus: nextStatus,
                          offerStatus:
                            nextStatus === "Rejected"
                              ? "Draft"
                              : current.offerStatus === "Released" &&
                                  nextStatus !== "Approved"
                                ? "Draft"
                                : current.offerStatus,
                        }));
                      }}
                    >
                      {APPROVAL_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>

                  <label className="om-field">
                    Offer Status
                    <select
                      value={form.offerStatus}
                      onChange={(e) => updateField("offerStatus", e.target.value)}
                    >
                      {OFFER_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>

                  <label className="om-field">
                    Candidate Response
                    <select
                      value={form.candidateResponse}
                      onChange={(e) => updateField("candidateResponse", e.target.value)}
                    >
                      {RESPONSES.map((response) => (
                        <option key={response} value={response}>{response}</option>
                      ))}
                    </select>
                  </label>

                  <label className="om-field om-field-full">
                    Notes
                    <textarea
                      rows="3"
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="Offer discussion, response or joining notes"
                    />
                  </label>
                </div>
              </div>

              {error && <div className="om-form-error">{error}</div>}

              <div className="om-modal-footer">
                <button
                  type="button"
                  className="om-btn om-btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="om-btn om-btn-primary">
                  {editingId !== null ? "Save Changes" : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
