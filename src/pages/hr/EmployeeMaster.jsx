import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";

import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee
} from "../../services/hr/employeeService";


const defaultFormData = {
    employee_code: "",
    employee_name: "",
    gender: "",
    mobile: "",
    date_of_joining: "",
    employment_type: "Permanent",
    salary_type: "Monthly",
    basic_salary: "",
    employee_status: "Active",
    remarks: "",
    date_of_birth: "",
marital_status: "",
alternate_mobile: "",
email: "",

address_line1: "",
address_line2: "",
city: "",
district: "",
state: "",
country: "India",
pincode: "",

department_id: "",
designation_id: "",
reporting_manager_id: "",
default_shift_id: "",

date_of_leaving: "",

aadhaar_number: "",
pan_number: "",
passport_number: "",
driving_license_number: "",

uan_number: "",
pf_number: "",
esi_number: "",

bank_name: "",
bank_account_number: "",
ifsc_code: "",

emergency_contact_name: "",
emergency_contact_mobile: "",

blood_group: ""
};


function EmployeeMaster() {

    const {
        currentCompany,
        currentCompanyId,
        loading: companyLoading
    } = useCompany();


    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
const [designations, setDesignations] = useState([]);
const [shifts, setShifts] = useState([]);

    const [formData, setFormData] =
        useState(defaultFormData);

    const [editingId, setEditingId] =
        useState(null);

    const [loading, setLoading] =
        useState(false);


    useEffect(() => {

        if (!currentCompanyId) {
            setEmployees([]);
            setFormData(defaultFormData);
            setEditingId(null);
            return;
        }

        loadEmployees(currentCompanyId);

    }, [currentCompanyId]);


    const loadEmployees = async (companyId) => {

        try {

            setLoading(true);

            const data =
                await getEmployees(companyId);

            setEmployees(data || []);

        } catch (error) {

            console.error(error);

            alert(error.message);

        } finally {

            setLoading(false);

        }

    };


    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (!currentCompanyId) {

                alert(
                    "Please select a Current Company from the Sidebar."
                );

                return;

            }


            if (!formData.employee_code.trim()) {

                alert("Employee Code is required.");

                return;

            }


            if (!formData.employee_name.trim()) {

                alert("Employee Name is required.");

                return;

            }


            if (!formData.date_of_joining) {

                alert("Date of Joining is required.");

                return;

            }


            const employeeData = {

                employee_code:
                    formData.employee_code.trim(),

                employee_name:
                    formData.employee_name.trim(),

                gender:
                    formData.gender || null,

                mobile:
                    formData.mobile.trim() || null,

                date_of_joining:
                    formData.date_of_joining,

                employment_type:
                    formData.employment_type,

                salary_type:
                    formData.salary_type,

                basic_salary:
                    formData.basic_salary === ""
                        ? null
                        : Number(formData.basic_salary),

                employee_status:
                    formData.employee_status,

                remarks:
                    formData.remarks.trim() || null

            };


            if (editingId) {

                await updateEmployee(
                    editingId,
                    employeeData,
                    currentCompanyId
                );

                alert(
                    "Employee updated successfully."
                );

            } else {

                await createEmployee(
                    employeeData,
                    currentCompanyId
                );

                alert(
                    "Employee created successfully."
                );

            }


            setFormData(defaultFormData);

            setEditingId(null);

            await loadEmployees(
                currentCompanyId
            );


        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };


    const handleEdit = (employee) => {

        setEditingId(employee.id);

        setFormData({

            employee_code:
                employee.employee_code || "",

            employee_name:
                employee.employee_name || "",

            gender:
                employee.gender || "",

            mobile:
                employee.mobile || "",

            date_of_joining:
                employee.date_of_joining || "",

            employment_type:
                employee.employment_type ||
                "Permanent",

            salary_type:
                employee.salary_type ||
                "Monthly",

            basic_salary:
                employee.basic_salary ?? "",

            employee_status:
                employee.employee_status ||
                "Active",

            remarks:
                employee.remarks || ""

        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


    const handleCancelEdit = () => {

        setEditingId(null);

        setFormData(defaultFormData);

    };


    const handleDeactivate = async (employeeId) => {

        if (
            !window.confirm(
                "Are you sure you want to deactivate this employee?"
            )
        ) {

            return;

        }


        try {

            await deactivateEmployee(
                employeeId,
                currentCompanyId
            );

            alert(
                "Employee deactivated successfully."
            );

            await loadEmployees(
                currentCompanyId
            );

        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };


    return (

        <div
            style={{
                padding: "25px"
            }}
        >

            <h2>
                Employee Master
            </h2>


            {!companyLoading &&
                !currentCompanyId && (

                    <div
                        style={{
                            padding: "12px",
                            marginBottom: "20px",
                            background: "#fff3cd",
                            border: "1px solid #ffeeba",
                            borderRadius: "6px"
                        }}
                    >

                        Please select a Current Company
                        from the Sidebar.

                    </div>

                )}


            <div
                style={{
                    marginBottom: "20px",
                    fontWeight: "600"
                }}
            >

                Company:{" "}

                {companyLoading
                    ? "Loading..."
                    : currentCompany?.company_name ||
                      "Select Company"
                }

            </div>


            <form
                onSubmit={handleSubmit}
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(2, minmax(250px, 1fr))",
                    gap: "15px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    marginBottom: "30px"
                }}
            >

                <input
                    name="employee_code"
                    placeholder="Employee Code"
                    value={formData.employee_code}
                    onChange={handleChange}
                />


                <input
                    name="employee_name"
                    placeholder="Employee Name"
                    value={formData.employee_name}
                    onChange={handleChange}
                />


                <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                >

                    <option value="">
                        Select Gender
                    </option>

                    <option value="Male">
                        Male
                    </option>

                    <option value="Female">
                        Female
                    </option>

                    <option value="Other">
                        Other
                    </option>

                </select>


                <input
                    name="mobile"
                    placeholder="Mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                />


                <label>

                    Date of Joining

                    <input
                        type="date"
                        name="date_of_joining"
                        value={
                            formData.date_of_joining
                        }
                        onChange={handleChange}
                    />

                </label>


                <select
                    name="employment_type"
                    value={
                        formData.employment_type
                    }
                    onChange={handleChange}
                >

                    <option value="Permanent">
                        Permanent
                    </option>

                    <option value="Contract">
                        Contract
                    </option>

                    <option value="Temporary">
                        Temporary
                    </option>

                    <option value="Part Time">
                        Part Time
                    </option>

                </select>


                <select
                    name="salary_type"
                    value={formData.salary_type}
                    onChange={handleChange}
                >

                    <option value="Monthly">
                        Monthly
                    </option>

                    <option value="Daily">
                        Daily
                    </option>

                    <option value="Hourly">
                        Hourly
                    </option>

                </select>


                <input
                    type="number"
                    name="basic_salary"
                    placeholder="Basic Salary"
                    value={formData.basic_salary}
                    onChange={handleChange}
                />


                <select
                    name="employee_status"
                    value={
                        formData.employee_status
                    }
                    onChange={handleChange}
                >

                    <option value="Active">
                        Active
                    </option>

                    <option value="Inactive">
                        Inactive
                    </option>

                </select>


                <textarea
                    name="remarks"
                    placeholder="Remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    style={{
                        gridColumn: "1 / -1"
                    }}
                />


                <div
                    style={{
                        gridColumn: "1 / -1"
                    }}
                >

                    <button
                        type="submit"
                        disabled={!currentCompanyId}
                    >

                        {editingId
                            ? "Update Employee"
                            : "Save Employee"
                        }

                    </button>


                    {editingId && (

                        <button
                            type="button"
                            onClick={
                                handleCancelEdit
                            }
                            style={{
                                marginLeft: "10px"
                            }}
                        >

                            Cancel

                        </button>

                    )}

                </div>

            </form>


            <h3>
                Employees
            </h3>


            {loading ? (

                <p>
                    Loading employees...
                </p>

            ) : employees.length === 0 ? (

                <p>
                    No employees found for this company.
                </p>

            ) : (

                <div
                    style={{
                        overflowX: "auto"
                    }}
                >

                    <table
                        style={{
                            width: "100%",
                            borderCollapse:
                                "collapse"
                        }}
                    >

                        <thead>

                            <tr>

                                <th>
                                    Code
                                </th>

                                <th>
                                    Employee Name
                                </th>

                                <th>
                                    Mobile
                                </th>

                                <th>
                                    Joining Date
                                </th>

                                <th>
                                    Employment
                                </th>

                                <th>
                                    Salary
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {employees.map(
                                employee => (

                                    <tr
                                        key={
                                            employee.id
                                        }
                                    >

                                        <td>
                                            {
                                                employee.employee_code
                                            }
                                        </td>

                                        <td>
                                            {
                                                employee.employee_name
                                            }
                                        </td>

                                        <td>
                                            {
                                                employee.mobile ||
                                                "-"
                                            }
                                        </td>

                                        <td>
                                            {
                                                employee.date_of_joining
                                            }
                                        </td>

                                        <td>
                                            {
                                                employee.employment_type
                                            }
                                        </td>

                                        <td>
                                            {
                                                employee.basic_salary ??
                                                "-"
                                            }
                                        </td>

                                        <td>
                                            {
                                                employee.employee_status
                                            }
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(
                                                        employee
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>


                                            {employee.is_active && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeactivate(
                                                            employee.id
                                                        )
                                                    }
                                                    style={{
                                                        marginLeft:
                                                            "8px"
                                                    }}
                                                >
                                                    Deactivate
                                                </button>

                                            )}

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            )}

        </div>

    );

}

export default EmployeeMaster;
