
import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import {
    getEmployees,
    getDepartments,
    getDesignations,
    getLocations
} from "../../services/hr/employeeService";
import "../../css/hr/EmployeeRegister.css";

const emptyFilters = {
    search: "",
    department_id: "",
    designation_id: "",
    location_id: "",
    status: "Active"
};

function EmployeeRegister() {
    const { currentCompanyId, currentCompany, loading: companyLoading } = useCompany();

    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [filters, setFilters] = useState(emptyFilters);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [photoUrls, setPhotoUrls] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        let cancelled = false;

        async function loadRegister() {
            if (!currentCompanyId) {
                setEmployees([]);
                setDepartments([]);
                setDesignations([]);
                setLocations([]);
                setPhotoUrls({});
                setSelectedEmployee(null);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const [
                    employeeRows,
                    departmentRows,
                    designationRows,
                    locationRows
                ] = await Promise.all([
                    getEmployees(currentCompanyId),
                    getDepartments(currentCompanyId),
                    getDesignations(currentCompanyId),
                    getLocations(currentCompanyId)
                ]);

                if (cancelled) return;

                setEmployees(employeeRows || []);
                setDepartments(departmentRows || []);
                setDesignations(designationRows || []);
                setLocations(locationRows || []);
            } catch (err) {
                if (!cancelled) {
                    console.error("Employee Register load failed:", err);
                    setError(err.message || "Unable to load employees.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadRegister();

        return () => {
            cancelled = true;
        };
    }, [currentCompanyId]);

    useEffect(() => {
        let cancelled = false;

        async function loadPhotoUrls() {
            const photoEmployees = employees.filter(
                employee => employee.profile_photo_url
            );

            if (!photoEmployees.length) {
                setPhotoUrls({});
                return;
            }

            const results = await Promise.all(
                photoEmployees.map(async employee => {
                    const { data, error: photoError } =
                        await supabase.storage
                            .from("employee-photos")
                            .createSignedUrl(
                                employee.profile_photo_url,
                                3600
                            );

                    return {
                        id: employee.id,
                        url: photoError ? "" : data?.signedUrl || ""
                    };
                })
            );

            if (!cancelled) {
                const nextUrls = {};
                results.forEach(item => {
                    if (item.url) nextUrls[item.id] = item.url;
                });
                setPhotoUrls(nextUrls);
            }
        }

        loadPhotoUrls();

        return () => {
            cancelled = true;
        };
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        const query = filters.search.trim().toLowerCase();

        return employees.filter(employee => {
            const status = (
                employee.employee_status ||
                (employee.is_active ? "Active" : "Inactive")
            ).toLowerCase();

            const matchesStatus =
                filters.status === "All" ||
                (filters.status === "Active"
                    ? employee.is_active !== false &&
                      status !== "inactive" &&
                      status !== "separated"
                    : filters.status === "Inactive"
                        ? employee.is_active === false ||
                          status === "inactive"
                        : status === "separated");

            const matchesSearch =
                !query ||
                [
                    employee.employee_code,
                    employee.employee_name,
                    employee.mobile
                ].some(value =>
                    String(value || "").toLowerCase().includes(query)
                );

            return (
                matchesStatus &&
                matchesSearch &&
                (!filters.department_id ||
                    employee.department_id === filters.department_id) &&
                (!filters.designation_id ||
                    employee.designation_id === filters.designation_id) &&
                (!filters.location_id ||
                    employee.location_id === filters.location_id)
            );
        });
    }, [employees, filters]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredEmployees.length / pageSize)
    );

    const visibleEmployees = filteredEmployees.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    useEffect(() => {
        setPage(1);
    }, [
        filters.search,
        filters.department_id,
        filters.designation_id,
        filters.location_id,
        filters.status,
        pageSize
    ]);

    const departmentName = id =>
        departments.find(item => item.id === id)?.department_name || "—";

    const designationName = id =>
        designations.find(item => item.id === id)?.designation_name || "—";

    const locationName = id => {
        const location = locations.find(item => item.id === id);
        return location
            ? `${location.location_code || ""} ${location.location_name || ""}`.trim()
            : "—";
    };

    const resetFilters = () => setFilters(emptyFilters);

    const showProfile = employee => setSelectedEmployee(employee);

    if (companyLoading) {
        return <div className="employee-register-page">Loading company...</div>;
    }

    return (
        <div className="employee-register-page">
            <div className="employee-register-heading">
                <div>
                    <div className="employee-register-eyebrow">
                        HR MANAGEMENT
                    </div>
                    <h1>Employee Register</h1>
                    <p>
                        {currentCompany?.company_name ||
                            "Select a company to view employees"}
                    </p>
                </div>

                <div className="employee-register-count">
                    <strong>{filteredEmployees.length}</strong>
                    <span>Employees</span>
                </div>
            </div>

            {!currentCompanyId ? (
                <div className="employee-register-message">
                    Please select a Current Company from the Sidebar.
                </div>
            ) : (
                <>
                    <section className="employee-register-filters">
                        <div className="employee-register-search">
                            <label htmlFor="employee-search">
                                Search employees
                            </label>
                            <input
                                id="employee-search"
                                type="search"
                                placeholder="Employee ID, name or mobile..."
                                value={filters.search}
                                onChange={event =>
                                    setFilters({
                                        ...filters,
                                        search: event.target.value
                                    })
                                }
                            />
                        </div>

                        <div className="employee-register-filter">
                            <label>Department</label>
                            <select
                                value={filters.department_id}
                                onChange={event =>
                                    setFilters({
                                        ...filters,
                                        department_id: event.target.value
                                    })
                                }
                            >
                                <option value="">All departments</option>
                                {departments.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.department_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="employee-register-filter">
                            <label>Designation</label>
                            <select
                                value={filters.designation_id}
                                onChange={event =>
                                    setFilters({
                                        ...filters,
                                        designation_id: event.target.value
                                    })
                                }
                            >
                                <option value="">All designations</option>
                                {designations.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.designation_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="employee-register-filter">
                            <label>Location</label>
                            <select
                                value={filters.location_id}
                                onChange={event =>
                                    setFilters({
                                        ...filters,
                                        location_id: event.target.value
                                    })
                                }
                            >
                                <option value="">All locations</option>
                                {locations.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.location_code
                                            ? `${item.location_code} - `
                                            : ""}
                                        {item.location_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="employee-register-filter">
                            <label>Status</label>
                            <select
                                value={filters.status}
                                onChange={event =>
                                    setFilters({
                                        ...filters,
                                        status: event.target.value
                                    })
                                }
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Separated">Separated</option>
                                <option value="All">All statuses</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            className="employee-register-clear"
                            onClick={resetFilters}
                        >
                            Clear filters
                        </button>
                    </section>

                    {error && (
                        <div className="employee-register-error">
                            {error}
                        </div>
                    )}

                    <section className="employee-register-table-card">
                        {loading ? (
                            <div className="employee-register-message">
                                Loading employees...
                            </div>
                        ) : (
                            <>
                                <div className="employee-register-table-scroll">
                                    <table className="employee-register-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Designation</th>
                                                <th>Department</th>
                                                <th>Location</th>
                                                <th>Status</th>
                                                <th>Profile</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {visibleEmployees.map(employee => (
                                                <tr key={employee.id}>
                                                    <td>
                                                        <div className="employee-register-person">
                                                            {photoUrls[employee.id] ? (
                                                                <img
                                                                    className="employee-register-avatar"
                                                                    src={photoUrls[employee.id]}
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <div className="employee-register-avatar employee-register-avatar-placeholder">
                                                                    {(employee.employee_name || "?")
                                                                        .trim()
                                                                        .charAt(0)
                                                                        .toUpperCase()}
                                                                </div>
                                                            )}

                                                            <div className="employee-register-person-text">
                                                                <strong title={employee.employee_name}>
                                                                    {employee.employee_name || "Unnamed employee"}
                                                                </strong>
                                                                <span title={employee.employee_code}>
                                                                    {employee.employee_code || "No employee ID"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td title={designationName(employee.designation_id)}>
                                                        {designationName(employee.designation_id)}
                                                    </td>

                                                    <td title={departmentName(employee.department_id)}>
                                                        {departmentName(employee.department_id)}
                                                    </td>

                                                    <td title={locationName(employee.location_id)}>
                                                        {locationName(employee.location_id)}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                employee.is_active === false ||
                                                                (employee.employee_status || "").toLowerCase() === "inactive"
                                                                    ? "employee-register-status inactive"
                                                                    : "employee-register-status active"
                                                            }
                                                        >
                                                            {employee.employee_status ||
                                                                (employee.is_active === false
                                                                    ? "Inactive"
                                                                    : "Active")}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="employee-register-view-button"
                                                            onClick={() => showProfile(employee)}
                                                        >
                                                            View Profile
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredEmployees.length === 0 && (
                                    <div className="employee-register-message">
                                        No employees match your search and filters.
                                    </div>
                                )}

                                <div className="employee-register-pagination">
                                    <span>
                                        Showing{" "}
                                        {filteredEmployees.length === 0
                                            ? 0
                                            : (page - 1) * pageSize + 1}
                                        {" "}–{" "}
                                        {Math.min(
                                            page * pageSize,
                                            filteredEmployees.length
                                        )}{" "}
                                        of {filteredEmployees.length} employees
                                    </span>

                                    <div className="employee-register-pagination-controls">
                                        <select
                                            aria-label="Employees per page"
                                            value={pageSize}
                                            onChange={event =>
                                                setPageSize(Number(event.target.value))
                                            }
                                        >
                                            <option value={10}>10 per page</option>
                                            <option value={25}>25 per page</option>
                                            <option value={50}>50 per page</option>
                                        </select>

                                        <button
                                            type="button"
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Previous
                                        </button>

                                        <span>
                                            Page {page} of {totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </>
            )}

            {selectedEmployee && (
                <div
                    className="employee-profile-overlay"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) {
                            setSelectedEmployee(null);
                        }
                    }}
                >
                    <section
                        className="employee-profile-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="employee-profile-title"
                    >
                        <div className="employee-profile-modal-header">
                            <div>
                                <div className="employee-register-eyebrow">
                                    EMPLOYEE PROFILE
                                </div>
                                <h2 id="employee-profile-title">
                                    {selectedEmployee.employee_name}
                                </h2>
                                <p>{selectedEmployee.employee_code}</p>
                            </div>

                            <button
                                type="button"
                                className="employee-profile-close"
                                aria-label="Close profile"
                                onClick={() => setSelectedEmployee(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="employee-profile-modal-body">
                            <div className="employee-profile-summary">
                                {photoUrls[selectedEmployee.id] ? (
                                    <img
                                        src={photoUrls[selectedEmployee.id]}
                                        alt=""
                                    />
                                ) : (
                                    <div className="employee-profile-avatar-placeholder">
                                        {(selectedEmployee.employee_name || "?")
                                            .trim()
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}

                                <div>
                                    <h3>{selectedEmployee.employee_name}</h3>
                                    <p>
                                        {designationName(selectedEmployee.designation_id)}
                                    </p>
                                    <span>
                                        {selectedEmployee.employee_status ||
                                            (selectedEmployee.is_active === false
                                                ? "Inactive"
                                                : "Active")}
                                    </span>
                                </div>
                            </div>

                            <div className="employee-profile-section">
                                <h3>Employment Details</h3>
                                <div className="employee-profile-grid">
                                    <ProfileField label="Employee ID" value={selectedEmployee.employee_code} />
                                    <ProfileField label="Employee Name" value={selectedEmployee.employee_name} />
                                    <ProfileField label="Department" value={departmentName(selectedEmployee.department_id)} />
                                    <ProfileField label="Designation" value={designationName(selectedEmployee.designation_id)} />
                                    <ProfileField label="Location" value={locationName(selectedEmployee.location_id)} />
                                    <ProfileField label="Employment Type" value={selectedEmployee.employment_type} />
                                    <ProfileField label="Salary Type" value={selectedEmployee.salary_type} />
                                    <ProfileField label="Date of Joining" value={selectedEmployee.date_of_joining} />
                                    <ProfileField label="Date of Leaving" value={selectedEmployee.date_of_leaving} />
                                    <ProfileField label="Reporting Manager ID" value={selectedEmployee.reporting_manager_id} />
                                    <ProfileField label="Default Shift ID" value={selectedEmployee.default_shift_id} />
                                </div>
                            </div>

                            <div className="employee-profile-section">
                                <h3>Personal Details</h3>
                                <div className="employee-profile-grid">
                                    <ProfileField label="Date of Birth" value={selectedEmployee.date_of_birth} />
                                    <ProfileField label="Gender" value={selectedEmployee.gender} />
                                    <ProfileField label="Marital Status" value={selectedEmployee.marital_status} />
                                    <ProfileField label="Mobile" value={selectedEmployee.mobile} />
                                    <ProfileField label="Alternate Mobile" value={selectedEmployee.alternate_mobile} />
                                    <ProfileField label="Email" value={selectedEmployee.email} />
                                    <ProfileField
                                        label="Address"
                                        value={[
                                            selectedEmployee.address_line1,
                                            selectedEmployee.address_line2,
                                            selectedEmployee.city,
                                            selectedEmployee.district,
                                            selectedEmployee.state,
                                            selectedEmployee.pincode,
                                            selectedEmployee.country
                                        ].filter(Boolean).join(", ")}
                                    />
                                </div>
                            </div>

                            <div className="employee-profile-section">
                                <h3>Identity and Statutory Details</h3>
                                <div className="employee-profile-grid">
                                    <ProfileField label="Aadhaar Number" value={selectedEmployee.aadhaar_number} />
                                    <ProfileField label="PAN Number" value={selectedEmployee.pan_number} />
                                    <ProfileField label="Passport Number" value={selectedEmployee.passport_number} />
                                    <ProfileField label="Driving Licence" value={selectedEmployee.driving_license_number} />
                                    <ProfileField label="UAN" value={selectedEmployee.uan_number} />
                                    <ProfileField label="PF Number" value={selectedEmployee.pf_number} />
                                    <ProfileField label="ESI Number" value={selectedEmployee.esi_number} />
                                </div>
                            </div>

                            <div className="employee-profile-section">
                                <h3>Bank and Emergency Details</h3>
                                <div className="employee-profile-grid">
                                    <ProfileField label="Bank Name" value={selectedEmployee.bank_name} />
                                    <ProfileField label="Bank Account Number" value={selectedEmployee.bank_account_number} />
                                    <ProfileField label="IFSC Code" value={selectedEmployee.ifsc_code} />
                                    <ProfileField label="Emergency Contact" value={selectedEmployee.emergency_contact_name} />
                                    <ProfileField label="Emergency Mobile" value={selectedEmployee.emergency_contact_mobile} />
                                    <ProfileField label="Blood Group" value={selectedEmployee.blood_group} />
                                    <ProfileField label="Remarks" value={selectedEmployee.remarks} />
                                </div>
                            </div>
                        </div>

                        <div className="employee-profile-modal-footer">
                            <button
                                type="button"
                                className="employee-register-view-button"
                                onClick={() => setSelectedEmployee(null)}
                            >
                                Close Profile
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function ProfileField({ label, value }) {
    const displayValue =
        value === null || value === undefined || value === ""
            ? "—"
            : value;

    return (
        <div className="employee-profile-field">
            <span>{label}</span>
            <strong>{String(displayValue)}</strong>
        </div>
    );
}

export default EmployeeRegister;
