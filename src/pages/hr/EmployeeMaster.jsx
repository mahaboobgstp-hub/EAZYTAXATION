import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";

import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    getDepartments,
getDesignations,
getShifts
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
        loadDepartments(currentCompanyId);
loadDesignations(currentCompanyId);
loadShifts(currentCompanyId);

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
const loadDepartments = async (companyId) => {
    try {
        const data = await getDepartments(companyId);
        setDepartments(data || []);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};


const loadDesignations = async (companyId) => {
    try {
        const data = await getDesignations(companyId);
        setDesignations(data || []);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};


const loadShifts = async (companyId) => {
    try {
        const data = await getShifts(companyId);
        setShifts(data || []);
    } catch (error) {
        console.error(error);
        alert(error.message);
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
                date_of_birth:
    formData.date_of_birth || null,

marital_status:
    formData.marital_status || null,

alternate_mobile:
    formData.alternate_mobile.trim() || null,

email:
    formData.email.trim() || null,

address_line1:
    formData.address_line1.trim() || null,

address_line2:
    formData.address_line2.trim() || null,

city:
    formData.city.trim() || null,

district:
    formData.district.trim() || null,

state:
    formData.state.trim() || null,

country:
    formData.country.trim() || "India",

pincode:
    formData.pincode.trim() || null,

department_id:
    formData.department_id || null,

designation_id:
    formData.designation_id || null,

reporting_manager_id:
    formData.reporting_manager_id || null,

default_shift_id:
    formData.default_shift_id || null,

date_of_leaving:
    formData.date_of_leaving || null,

aadhaar_number:
    formData.aadhaar_number.trim() || null,

pan_number:
    formData.pan_number.trim() || null,

passport_number:
    formData.passport_number.trim() || null,

driving_license_number:
    formData.driving_license_number.trim() || null,

uan_number:
    formData.uan_number.trim() || null,

pf_number:
    formData.pf_number.trim() || null,

esi_number:
    formData.esi_number.trim() || null,

bank_name:
    formData.bank_name.trim() || null,

bank_account_number:
    formData.bank_account_number.trim() || null,

ifsc_code:
    formData.ifsc_code.trim() || null,

emergency_contact_name:
    formData.emergency_contact_name.trim() || null,

emergency_contact_mobile:
    formData.emergency_contact_mobile.trim() || null,

blood_group:
    formData.blood_group || null,

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
<h3 style={{ gridColumn: "1 / -1" }}>
    Personal Details
</h3>

<input
    type="date"
    name="date_of_birth"
    value={formData.date_of_birth}
    onChange={handleChange}
    placeholder="Date of Birth"
/>

<select
    name="marital_status"
    value={formData.marital_status}
    onChange={handleChange}
>
    <option value="">Select Marital Status</option>
    <option value="Single">Single</option>
    <option value="Married">Married</option>
    <option value="Divorced">Divorced</option>
    <option value="Widowed">Widowed</option>
</select>

<input
    name="alternate_mobile"
    placeholder="Alternate Mobile"
    value={formData.alternate_mobile}
    onChange={handleChange}
/>

<input
    type="email"
    name="email"
    placeholder="Email"
    value={formData.email}
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
<h3 style={{ gridColumn: "1 / -1" }}>
    Employment Details
</h3>

<select
    name="department_id"
    value={formData.department_id}
    onChange={handleChange}
>
    <option value="">
        Select Department
    </option>

    {departments.map(department => (
        <option
            key={department.id}
            value={department.id}
        >
            {department.department_name}
        </option>
    ))}
</select>

<select
    name="designation_id"
    value={formData.designation_id}
    onChange={handleChange}
>
    <option value="">
        Select Designation
    </option>

    {designations.map(designation => (
        <option
            key={designation.id}
            value={designation.id}
        >
            {designation.designation_name}
        </option>
    ))}
</select>

<select
    name="default_shift_id"
    value={formData.default_shift_id}
    onChange={handleChange}
>
    <option value="">
        Select Default Shift
    </option>

    {shifts.map(shift => (
        <option
            key={shift.id}
            value={shift.id}
        >
            {shift.shift_name}
        </option>
    ))}
</select>

<input
    type="date"
    name="date_of_leaving"
    value={formData.date_of_leaving}
    onChange={handleChange}
/>
                <h3 style={{ gridColumn: "1 / -1" }}>
    Address
</h3>

<input
    name="address_line1"
    placeholder="Address Line 1"
    value={formData.address_line1}
    onChange={handleChange}
/>

<input
    name="address_line2"
    placeholder="Address Line 2"
    value={formData.address_line2}
    onChange={handleChange}
/>

<input
    name="city"
    placeholder="City"
    value={formData.city}
    onChange={handleChange}
/>

<input
    name="district"
    placeholder="District"
    value={formData.district}
    onChange={handleChange}
/>

<input
    name="state"
    placeholder="State"
    value={formData.state}
    onChange={handleChange}
/>

<input
    name="pincode"
    placeholder="Pincode"
    value={formData.pincode}
    onChange={handleChange}
/>

                <h3 style={{ gridColumn: "1 / -1" }}>
    Emergency Contact
</h3>

<input
    name="emergency_contact_name"
    placeholder="Emergency Contact Name"
    value={formData.emergency_contact_name}
    onChange={handleChange}
/>

<input
    name="emergency_contact_mobile"
    placeholder="Emergency Contact Mobile"
    value={formData.emergency_contact_mobile}
    onChange={handleChange}
/>

<select
    name="blood_group"
    value={formData.blood_group}
    onChange={handleChange}
>
    <option value="">
        Select Blood Group
    </option>

    <option value="A+">A+</option>
    <option value="A-">A-</option>
    <option value="B+">B+</option>
    <option value="B-">B-</option>
    <option value="O+">O+</option>
    <option value="O-">O-</option>
    <option value="AB+">AB+</option>
    <option value="AB-">AB-</option>
</select>
                <h3 style={{ gridColumn: "1 / -1" }}>
    Identity & Statutory Details
</h3>

<input
    name="aadhaar_number"
    placeholder="Aadhaar Number"
    value={formData.aadhaar_number}
    onChange={handleChange}
/>

<input
    name="pan_number"
    placeholder="PAN Number"
    value={formData.pan_number}
    onChange={handleChange}
/>

<input
    name="passport_number"
    placeholder="Passport Number"
    value={formData.passport_number}
    onChange={handleChange}
/>

<input
    name="driving_license_number"
    placeholder="Driving Licence Number"
    value={formData.driving_license_number}
    onChange={handleChange}
/>

<input
    name="uan_number"
    placeholder="UAN Number"
    value={formData.uan_number}
    onChange={handleChange}
/>

<input
    name="pf_number"
    placeholder="PF Number"
    value={formData.pf_number}
    onChange={handleChange}
/>

<input
    name="esi_number"
    placeholder="ESI Number"
    value={formData.esi_number}
    onChange={handleChange}
/>
                <h3 style={{ gridColumn: "1 / -1" }}>
    Bank Details
</h3>

<input
    name="bank_name"
    placeholder="Bank Name"
    value={formData.bank_name}
    onChange={handleChange}
/>

<input
    name="bank_account_number"
    placeholder="Bank Account Number"
    value={formData.bank_account_number}
    onChange={handleChange}
/>

<input
    name="ifsc_code"
    placeholder="IFSC Code"
    value={formData.ifsc_code}
    onChange={handleChange}
/>

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
