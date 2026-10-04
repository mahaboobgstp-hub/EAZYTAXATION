import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import "../../css/hr/EmployeeMaster.css";

import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    getDepartments,
    getDesignations,
    getLocations,
    getShifts
} from "../../services/hr/employeeService";
import {
    getCompleteSalaryStructure,
    saveCompleteSalaryStructure
} from "../../services/hr/salaryStructureService";


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
    location_id: "",

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
const defaultSalaryStructure = {

    id: null,

    effective_from: "",

    effective_to: "",

    monthly_salary: "",

basic_amount: "",

hra_amount: "",

da_amount: "",

special_allowance: "",

other_allowance: "",

employee_pf_rate: 12,

employer_pf_rate: 12,

employee_esi_rate: 0.75,

employer_esi_rate: 3.25,


    
    is_pf_applicable: false,

    is_esi_applicable: false,

    professional_tax_state: "",

tds_regime: "NEW",

    // =============================================
    // OVERTIME CONFIGURATION
    // =============================================

    overtime_applicable: false,

    overtime_rate_type: "DAILY_RATE",

    overtime_rate: "",

    overtime_rate_multiplier: 1,

    overtime_fixed_rate: "",


    is_active: true,

    remarks: ""

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
    const [locations, setLocations] = useState([]);

    const [formData, setFormData] =
        useState(defaultFormData);
    

const [salaryStructure, setSalaryStructure] =
    useState(
        defaultSalaryStructure
    );


const [salaryComponents, setSalaryComponents] =
    useState([]);
    const [
    activeTab,
    setActiveTab
] =
    useState(
        "basic"
    );


    const [deductionSettings, setDeductionSettings] =
    useState({
        leave_policy_id: "",
        late_deduction_policy_id: "",
        absence_deduction_policy_id: "",
        salary_advance_enabled: true,
        loan_recovery_enabled: true,
        other_deductions_enabled: true,
        deduction_override_enabled: false,
        remarks: ""
    });
    const [editingId, setEditingId] =
        useState(null);

    const [loading, setLoading] =
        useState(false);


    useEffect(() => {

   if (!currentCompanyId) {

    setEmployees([]);
    setDepartments([]);
    setDesignations([]);
    setShifts([]);
    setLocations([]);

    setFormData(
        defaultFormData
    );

    setSalaryStructure(
        defaultSalaryStructure
    );

    setSalaryComponents([]);

    setEditingId(null);

    return;
}

    loadEmployees(currentCompanyId);
    loadDepartments(currentCompanyId);
    loadDesignations(currentCompanyId);
    loadShifts(currentCompanyId);
    loadLocations(currentCompanyId);

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
const loadLocations = async (companyId) => {

    try {

        const data =
            await getLocations(companyId);

        setLocations(data || []);

    } catch (error) {

        console.error(
            "Error loading locations:",
            error
        );

        alert(
            error.message ||
            "Unable to load locations."
        );

        setLocations([]);

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
const handleSalaryStructureChange =
    (e) => {

        const {
            name,
            value,
            type,
            checked
        } = e.target;

        setSalaryStructure(prev => {

            const updated = {
                ...prev,
                [name]:
                    type === "checkbox"
                        ? checked
                        : value
            };

            const grossSalary =
                Number(updated.basic_amount || 0) +
                Number(updated.hra_amount || 0) +
                Number(updated.da_amount || 0) +
                Number(updated.special_allowance || 0) +
                Number(updated.other_allowance || 0);

            updated.monthly_salary = grossSalary;

            return updated;

        });

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

 location_id: formData.location_id || null,                

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


            let savedEmployee;


if (editingId) {

    savedEmployee =
        await updateEmployee(

            editingId,

            employeeData,

            currentCompanyId

        );

}

else {

    savedEmployee =
        await createEmployee(

            employeeData,

            currentCompanyId

        );

}
if (
    Number(
        salaryStructure.monthly_salary
    ) > 0
) {

    await saveCompleteSalaryStructure(
    {

        ...salaryStructure,

        monthly_salary:
            grossSalary,

        company_id:
            currentCompanyId,

        employee_id:
            savedEmployee.id

    },

    salaryComponents
);
}
            setFormData(defaultFormData);

            
            setSalaryStructure(
    defaultSalaryStructure
);


setSalaryComponents([]);
            setEditingId(null);

            await loadEmployees(
                currentCompanyId
            );


        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };


    const handleEdit = async (
    employee
) => {

    try {

        setEditingId(
            employee.id
        );


        const editFormData = {
            ...defaultFormData
        };


        Object.keys(
            defaultFormData
        ).forEach(
            key => {

                if (

                    employee[key] !== null &&

                    employee[key] !== undefined

                ) {

                    editFormData[key] =
                        employee[key];

                }

            }
        );


        setFormData(
            editFormData
        );


        const salaryData =
            await getCompleteSalaryStructure(
                employee.id
            );


        if (
            salaryData.structure
        ) {

            setSalaryStructure({

                id:

                    salaryData.structure.id,

                effective_from:

                    salaryData.structure
                        .effective_from ||
                    "",

                effective_to:

                    salaryData.structure
                        .effective_to ||
                    "",

                monthly_salary:

                    salaryData.structure
                        .monthly_salary ??
                    "",

                basic_amount:

    salaryData.structure
        .basic_amount ??
    "",

hra_amount:

    salaryData.structure
        .hra_amount ??
    "",

da_amount:

    salaryData.structure
        .da_amount ??
    "",

special_allowance:

    salaryData.structure
        .special_allowance ??
    "",

other_allowance:

    salaryData.structure
        .other_allowance ??
    "",

employee_pf_rate:

    salaryData.structure
        .employee_pf_rate ??
    12,

employer_pf_rate:

    salaryData.structure
        .employer_pf_rate ??
    12,

employee_esi_rate:

    salaryData.structure
        .employee_esi_rate ??
    0.75,

employer_esi_rate:

    salaryData.structure
        .employer_esi_rate ??
    3.25,

      professional_tax_state:

    salaryData.structure
        .professional_tax_state ||
    "",

tds_regime:

    salaryData.structure
        .tds_regime ||
    "NEW",
                
                is_pf_applicable:

                    salaryData.structure
                        .is_pf_applicable ??
                    false,

                is_esi_applicable:

                    salaryData.structure
                        .is_esi_applicable ??
                    false,

                is_pt_applicable:

                    salaryData.structure
                        .is_pt_applicable ??
                    false,

                is_tds_applicable:

                    salaryData.structure
                        .is_tds_applicable ??
                    false,
                // =============================================
    // OVERTIME CONFIGURATION
    // =============================================

    overtime_applicable:

    salaryData.structure
        .overtime_applicable ??
    false,

overtime_rate_type:

    salaryData.structure
        .overtime_rate_type ||
    "DAILY_RATE",

overtime_rate:

    salaryData.structure
        .overtime_rate ?? 
    "",

overtime_rate_multiplier:

    salaryData.structure
        .overtime_rate_multiplier ??
    1,

overtime_fixed_rate:

    salaryData.structure
        .overtime_fixed_rate ??
    "",
                is_active:

                    salaryData.structure
                        .is_active ??
                    true,

                remarks:

                    salaryData.structure
                        .remarks ||
                    ""

            });

        }

        else {

            setSalaryStructure(
                defaultSalaryStructure
            );

        }


        setSalaryComponents(
            salaryData.components ||
            []
        );


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }

    catch (
        error
    ) {

        console.error(
            "Error loading employee salary structure:",
            error
        );


        alert(
            error.message ||
            "Unable to load salary structure."
        );

    }

};
    const handleCancelEdit = () => {

    setEditingId(
        null
    );


    setFormData(
        defaultFormData
    );


    setSalaryStructure(
        defaultSalaryStructure
    );


    setSalaryComponents([]);

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
    // =============================================
    // SALARY CONTRIBUTION & CTC CALCULATIONS
    // =============================================

    const basicAmount =
        Number(salaryStructure.basic_amount || 0);

    const grossSalary =
        Number(salaryStructure.basic_amount || 0) +
        Number(salaryStructure.hra_amount || 0) +
        Number(salaryStructure.da_amount || 0) +
        Number(salaryStructure.special_allowance || 0) +
        Number(salaryStructure.other_allowance || 0);

    const employeePfRate =
        Number(salaryStructure.employee_pf_rate || 0);

    const employerPfRate =
        Number(salaryStructure.employer_pf_rate || 0);

    const employeeEsiRate =
        Number(salaryStructure.employee_esi_rate || 0);

    const employerEsiRate =
        Number(salaryStructure.employer_esi_rate || 0);

    const employeePfAmount =
        salaryStructure.is_pf_applicable
            ? (basicAmount * employeePfRate) / 100
            : 0;

    const employerPfAmount =
        salaryStructure.is_pf_applicable
            ? (basicAmount * employerPfRate) / 100
            : 0;

    const employeeEsiAmount =
        salaryStructure.is_esi_applicable
            ? (grossSalary * employeeEsiRate) / 100
            : 0;

    const employerEsiAmount =
        salaryStructure.is_esi_applicable
            ? (grossSalary * employerEsiRate) / 100
            : 0;

    const totalEmployeeContribution =
        employeePfAmount +
        employeeEsiAmount;

    const totalEmployerContribution =
        employerPfAmount +
        employerEsiAmount;

    const monthlyCtc =
        grossSalary +
        totalEmployerContribution;

    const annualCtc =
        monthlyCtc * 12;

    return (

        <div className="employee-master-page">

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
    className="employee-master-form"
>
              
               <div className="employee-master-tabs">

    <button
    type="button"
    className={
        activeTab === "basic"
            ? "employee-master-tab active"
            : "employee-master-tab"
    }
    onClick={() =>
        setActiveTab("basic")
    }
>
    Basic Details
</button>
           

        <button
    type="button"
    className={
        activeTab === "salary"
            ? "employee-master-tab active"
            : "employee-master-tab"
    }
    onClick={() =>
        setActiveTab("salary")
    }
>
    Salary Structure
</button>

                   
                  <button
    type="button"
    className={
        activeTab === "taxes"
            ? "employee-master-tab active"
            : "employee-master-tab"
    }
    onClick={() =>
        setActiveTab("taxes")
    }
>
    Taxes
</button>
                   
                   <button
    type="button"
    className={
        activeTab === "deductions"
            ? "employee-master-tab active"
            : "employee-master-tab"
    }
    onClick={() =>
        setActiveTab("deductions")
    }
>
    Deductions
</button>
                   
   
              
<button
    type="button"
    className={
        activeTab === "documents"
            ? "employee-master-tab active"
            : "employee-master-tab"
    }
    onClick={() =>
        setActiveTab("documents")
    }
>
    Documents
</button>
                   
<button
    type="button"
    className={
        activeTab === "finalSettlement"
            ? "employee-master-tab active"
            : "employee-master-tab"
    }
    onClick={() =>
        setActiveTab("finalSettlement")
    }
>
    Final Settlement
</button>
</div>
              
    {activeTab === "basic" && (

    <div className="salary-structure-tab">               
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

<div>
    <label>Location</label>

    <select
        name="location_id"
        value={formData.location_id}
        onChange={handleChange}
    >
        <option value="">
            Select Location
        </option>

        {locations.map((location) => (
            <option
                key={location.id}
                value={location.id}
            >
                {location.location_code} - {location.location_name}
            </option>
        ))}
    </select>
</div>
        </div>
                )}

                {activeTab === "salary" && (

    <div
        style={{
            display:
                "grid",

            gridTemplateColumns:
                "repeat(2, minmax(250px, 1fr))",

            gap:
                "15px"
        }}
    >

        <h3
            style={{
                gridColumn:
                    "1 / -1"
            }}
        >

            Salary Structure

        </h3>


        <label>

            Effective From

            <input
                type="date"
                name="effective_from"
                value={
                    salaryStructure.effective_from
                }
                onChange={
                    handleSalaryStructureChange
                }
            />

        </label>


        <label>

            Effective To

            <input
                type="date"
                name="effective_to"
                value={
                    salaryStructure.effective_to
                }
                onChange={
                    handleSalaryStructureChange
                }
            />

        </label>


        <div>
    <label>Monthly Gross Salary</label>

    <input
        type="number"
        name="monthly_salary"
        value={salaryStructure.monthly_salary}
        readOnly
        style={{
            backgroundColor: "#f5f5f5",
            fontWeight: "600"
        }}
    />
</div>

<div className="salary-field">
    <label>Basic Salary</label>

    <input
        type="number"
        name="basic_amount"
        value={salaryStructure.basic_amount}
        onChange={handleSalaryStructureChange}
    />
</div>
        
<div className="salary-field">
    <label>HRA</label>
        <input
            type="number"
            name="hra_amount"
           
            value={
                salaryStructure.hra_amount
            }
            onChange={
                handleSalaryStructureChange
            }
        />
</div>


   
<div className="salary-field">
    <label>DA</label>
    <input
        type="number"
        name="da_amount"
       
        value={salaryStructure.da_amount}
        onChange={handleSalaryStructureChange}
        min="0"
        step="0.01"
    />
</div>

<div className="salary-field">
    <label>Special Allowance</label>
        <input
            type="number"
            name="special_allowance"
           
            value={
                salaryStructure.special_allowance
            }
            onChange={
                handleSalaryStructureChange
            }
        />

</div>
        <div className="salary-field">
    <label>Other Allowance</label>
        <input
            type="number"
            name="other_allowance"
            
            value={
                salaryStructure.other_allowance
            }
            onChange={
                handleSalaryStructureChange
            }
        />
        </div>

        <h3
            style={{
                gridColumn:
                    "1 / -1",

                marginTop:
                    "10px"
            }}
        >

            Statutory Applicability

        </h3>


        <label>

            <input
                type="checkbox"
                name="is_pf_applicable"
                checked={
                    salaryStructure.is_pf_applicable
                }
                onChange={
                    handleSalaryStructureChange
                }
            />

            {" "}
            PF Applicable

        </label>
        {salaryStructure.is_pf_applicable && (
    <>

        <div>

            <label>Employee PF %</label>

            <input
                type="number"
                name="employee_pf_rate"
                value={salaryStructure.employee_pf_rate}
                onChange={handleSalaryStructureChange}
                min="0"
                step="0.01"
            />

        </div>

        <div>

            <label>Employer PF %</label>

            <input
                type="number"
                name="employer_pf_rate"
                value={salaryStructure.employer_pf_rate}
                onChange={handleSalaryStructureChange}
                min="0"
                step="0.01"
            />

        </div>

    </>
)}


        <label>

            <input
                type="checkbox"
                name="is_esi_applicable"
                checked={
                    salaryStructure.is_esi_applicable
                }
                onChange={
                    handleSalaryStructureChange
                }
            />

            {" "}
            ESI Applicable

        </label>

{salaryStructure.is_esi_applicable && (
    <>

        <div>

            <label>Employee ESI %</label>

            <input
                type="number"
                name="employee_esi_rate"
                value={salaryStructure.employee_esi_rate}
                onChange={handleSalaryStructureChange}
                min="0"
                step="0.01"
            />

        </div>

        <div>

            <label>Employer ESI %</label>

            <input
                type="number"
                name="employer_esi_rate"
                value={salaryStructure.employer_esi_rate}
                onChange={handleSalaryStructureChange}
                min="0"
                step="0.01"
            />

        </div>

    </>
)}

            
        <div
    style={{
        gridColumn: "1 / -1",
        marginTop: "15px",
        padding: "18px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        background: "#f8f9fa"
    }}
>

    <h3 style={{ marginTop: 0 }}>
        Salary Summary
    </h3>

    {/* ================================
        SALARY BREAKUP
    ================================= */}

    <h4>
        Salary Breakup
    </h4>

    <div
        style={{
            display: "grid",
            gridTemplateColumns:
                "repeat(2, minmax(250px, 1fr))",
            gap: "10px",
            marginBottom: "15px"
        }}
    >

        <div>
            <strong>Basic:</strong>{" "}
            ₹{basicAmount.toFixed(2)}
        </div>

        <div>
            <strong>HRA:</strong>{" "}
            ₹{Number(
                salaryStructure.hra_amount || 0
            ).toFixed(2)}
        </div>

        <div>
            <strong>DA:</strong>{" "}
            ₹{Number(
                salaryStructure.da_amount || 0
            ).toFixed(2)}
        </div>

        <div>
            <strong>Special Allowance:</strong>{" "}
            ₹{Number(
                salaryStructure.special_allowance || 0
            ).toFixed(2)}
        </div>

        <div>
            <strong>Other Allowance:</strong>{" "}
            ₹{Number(
                salaryStructure.other_allowance || 0
            ).toFixed(2)}
        </div>

        <div>
            <strong>Gross Salary:</strong>{" "}
            ₹{grossSalary.toFixed(2)}
        </div>

    </div>


    {/* ================================
        EMPLOYEE CONTRIBUTIONS
    ================================= */}

    <h4>
        Employee Contributions / Deductions
    </h4>

    <div
        style={{
            display: "grid",
            gridTemplateColumns:
                "repeat(2, minmax(250px, 1fr))",
            gap: "10px",
            marginBottom: "15px"
        }}
    >

        <div>
            <strong>Employee PF:</strong>{" "}
            ₹{employeePfAmount.toFixed(2)}
        </div>

        <div>
            <strong>Employee ESI:</strong>{" "}
            ₹{employeeEsiAmount.toFixed(2)}
        </div>

        <div>
            <strong>Total Employee Contribution:</strong>{" "}
            ₹{totalEmployeeContribution.toFixed(2)}
        </div>

    </div>


    {/* ================================
        EMPLOYER CONTRIBUTIONS
    ================================= */}

    <h4>
        Employer Contributions
    </h4>

    <div
        style={{
            display: "grid",
            gridTemplateColumns:
                "repeat(2, minmax(250px, 1fr))",
            gap: "10px",
            marginBottom: "15px"
        }}
    >

        <div>
            <strong>Employer PF:</strong>{" "}
            ₹{employerPfAmount.toFixed(2)}
        </div>

        <div>
            <strong>Employer ESI:</strong>{" "}
            ₹{employerEsiAmount.toFixed(2)}
        </div>

        <div>
            <strong>Total Employer Contribution:</strong>{" "}
            ₹{totalEmployerContribution.toFixed(2)}
        </div>

    </div>


    {/* ================================
        CTC
    ================================= */}

    <div
        style={{
            marginTop: "10px",
            paddingTop: "15px",
            borderTop: "1px solid #ccc"
        }}
    >

        <div
            style={{
                fontSize: "18px",
                fontWeight: "700"
            }}
        >
            Monthly CTC: ₹{monthlyCtc.toFixed(2)}
        </div>

        <div
            style={{
                fontSize: "18px",
                fontWeight: "700",
                marginTop: "8px"
            }}
        >
            Annual CTC: ₹{annualCtc.toFixed(2)}
        </div>

    </div>

</div>
        

        <textarea
            name="remarks"
            placeholder="Salary Structure Remarks"
            value={
                salaryStructure.remarks
            }
            onChange={
                handleSalaryStructureChange
            }
            style={{
                gridColumn:
                    "1 / -1"
            }}
        />

    </div>

)}

              {activeTab === "taxes" && (

    <div
        style={{
            display: "grid",
            gridTemplateColumns:
                "repeat(2, minmax(250px, 1fr))",
            gap: "15px"
        }}
    >

        <h3
            style={{
                gridColumn: "1 / -1"
            }}
        >
            Tax Configuration
        </h3>


        {/* PROFESSIONAL TAX */}

        <h4
            style={{
                gridColumn: "1 / -1",
                marginBottom: "0"
            }}
        >
            Professional Tax
        </h4>


        <div>

            <label>
                Professional Tax State
            </label>

            <select
                name="professional_tax_state"
                value={
                    salaryStructure.professional_tax_state
                }
                onChange={
                    handleSalaryStructureChange
                }
            >

                <option value="">
                    Select State
                </option>

                <option value="Andhra Pradesh">
                    Andhra Pradesh
                </option>

                <option value="Arunachal Pradesh">
                    Arunachal Pradesh
                </option>

                <option value="Assam">
                    Assam
                </option>

                <option value="Bihar">
                    Bihar
                </option>

                <option value="Chhattisgarh">
                    Chhattisgarh
                </option>

                <option value="Goa">
                    Goa
                </option>

                <option value="Gujarat">
                    Gujarat
                </option>

                <option value="Haryana">
                    Haryana
                </option>

                <option value="Himachal Pradesh">
                    Himachal Pradesh
                </option>

                <option value="Jharkhand">
                    Jharkhand
                </option>

                <option value="Karnataka">
                    Karnataka
                </option>

                <option value="Kerala">
                    Kerala
                </option>

                <option value="Madhya Pradesh">
                    Madhya Pradesh
                </option>

                <option value="Maharashtra">
                    Maharashtra
                </option>

                <option value="Manipur">
                    Manipur
                </option>

                <option value="Meghalaya">
                    Meghalaya
                </option>

                <option value="Mizoram">
                    Mizoram
                </option>

                <option value="Nagaland">
                    Nagaland
                </option>

                <option value="Odisha">
                    Odisha
                </option>

                <option value="Punjab">
                    Punjab
                </option>

                <option value="Rajasthan">
                    Rajasthan
                </option>

                <option value="Sikkim">
                    Sikkim
                </option>

                <option value="Tamil Nadu">
                    Tamil Nadu
                </option>

                <option value="Telangana">
                    Telangana
                </option>

                <option value="Tripura">
                    Tripura
                </option>

                <option value="Uttar Pradesh">
                    Uttar Pradesh
                </option>

                <option value="Uttarakhand">
                    Uttarakhand
                </option>

                <option value="West Bengal">
                    West Bengal
                </option>

                <option value="Andaman and Nicobar Islands">
                    Andaman and Nicobar Islands
                </option>

                <option value="Chandigarh">
                    Chandigarh
                </option>

                <option value="Dadra and Nagar Haveli and Daman and Diu">
                    Dadra and Nagar Haveli and Daman and Diu
                </option>

                <option value="Delhi">
                    Delhi
                </option>

                <option value="Jammu and Kashmir">
                    Jammu and Kashmir
                </option>

                <option value="Ladakh">
                    Ladakh
                </option>

                <option value="Lakshadweep">
                    Lakshadweep
                </option>

                <option value="Puducherry">
                    Puducherry
                </option>

            </select>

        </div>


        <div
            style={{
                padding: "12px",
                background: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: "6px"
            }}
        >

            <strong>
                Professional Tax
            </strong>

            <div style={{ marginTop: "6px" }}>
                Automatically calculated according
                to the selected state and applicable
                Professional Tax rules.
            </div>

        </div>


        {/* TDS */}

        <h4
            style={{
                gridColumn: "1 / -1",
                marginTop: "20px",
                marginBottom: "0"
            }}
        >
            Income Tax / TDS
        </h4>


        <div>

            <label>
                Tax Regime
            </label>

            <select
                name="tds_regime"
                value={
                    salaryStructure.tds_regime
                }
                onChange={
                    handleSalaryStructureChange
                }
            >

                <option value="NEW">
                    New Tax Regime
                </option>

            </select>

        </div>


        <div
            style={{
                padding: "12px",
                background: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: "6px"
            }}
        >

            <strong>
                TDS Calculation
            </strong>

            <div style={{ marginTop: "6px" }}>
                TDS will be calculated automatically
                during payroll processing based on
                the applicable tax rules.
            </div>

        </div>


        <div
            style={{
                gridColumn: "1 / -1",
                marginTop: "10px",
                padding: "12px",
                background: "#fff3cd",
                border: "1px solid #ffeeba",
                borderRadius: "6px"
            }}
        >

            <strong>
                Tax Calculation Notice
            </strong>

            <div style={{ marginTop: "6px" }}>
                Professional Tax and TDS amounts
                should not be manually entered here.
                They will be determined automatically
                during payroll processing.
            </div>

        </div>

    </div>

)}

              {activeTab === "deductions" && (

    <div
        style={{
            display: "grid",
            gridTemplateColumns:
                "repeat(2, minmax(250px, 1fr))",
            gap: "15px"
        }}
    >

        <h3
            style={{
                gridColumn: "1 / -1"
            }}
        >
            Employee Deduction Settings
        </h3>


        <div
            style={{
                gridColumn: "1 / -1",
                padding: "12px",
                background: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: "6px"
            }}
        >

            <strong>
                Policy Based Deductions
            </strong>

            <div style={{ marginTop: "6px" }}>
                Leave, late and absence deductions
                will be calculated according to the
                policies assigned to this employee.
            </div>

        </div>


        <div>

            <label>
                Leave Policy
            </label>

            <select
                name="leave_policy_id"
                value={
                    deductionSettings.leave_policy_id
                }
                onChange={(e) =>
                    setDeductionSettings(prev => ({
                        ...prev,
                        leave_policy_id:
                            e.target.value
                    }))
                }
            >

                <option value="">
                    Select Leave Policy
                </option>

            </select>

        </div>


        <div>

            <label>
                Late Deduction Policy
            </label>

            <select
                name="late_deduction_policy_id"
                value={
                    deductionSettings
                        .late_deduction_policy_id
                }
                onChange={(e) =>
                    setDeductionSettings(prev => ({
                        ...prev,
                        late_deduction_policy_id:
                            e.target.value
                    }))
                }
            >

                <option value="">
                    Select Late Deduction Policy
                </option>

            </select>

        </div>


        <div>

            <label>
                Absence Deduction Policy
            </label>

            <select
                name="absence_deduction_policy_id"
                value={
                    deductionSettings
                        .absence_deduction_policy_id
                }
                onChange={(e) =>
                    setDeductionSettings(prev => ({
                        ...prev,
                        absence_deduction_policy_id:
                            e.target.value
                    }))
                }
            >

                <option value="">
                    Select Absence Policy
                </option>

            </select>

        </div>


        <h4
            style={{
                gridColumn: "1 / -1",
                marginBottom: "0"
            }}
        >
            Other Deduction Controls
        </h4>


        <label>

            <input
                type="checkbox"
                checked={
                    deductionSettings
                        .salary_advance_enabled
                }
                onChange={(e) =>
                    setDeductionSettings(prev => ({
                        ...prev,
                        salary_advance_enabled:
                            e.target.checked
                    }))
                }
            />

            {" "}
            Salary Advance Recovery

        </label>


        <label>

            <input
                type="checkbox"
                checked={
                    deductionSettings
                        .loan_recovery_enabled
                }
                onChange={(e) =>
                    setDeductionSettings(prev => ({
                        ...prev,
                        loan_recovery_enabled:
                            e.target.checked
                    }))
                }
            />

            {" "}
            Loan Recovery

        </label>


        <label>

            <input
                type="checkbox"
                checked={
                    deductionSettings
                        .other_deductions_enabled
                }
                onChange={(e) =>
                    setDeductionSettings(prev => ({
                        ...prev,
                        other_deductions_enabled:
                            e.target.checked
                    }))
                }
            />

            {" "}
            Other Deductions

        </label>


        <label>

            <input
                type="checkbox"
                checked={
                    deductionSettings
                        .deduction_override_enabled
                }
                onChange={(e) =>
                    setDeductionSettings(prev => ({
                        ...prev,
                        deduction_override_enabled:
                            e.target.checked
                    }))
                }
            />

            {" "}
            Allow Employee-Specific Overrides

        </label>


        <textarea
            placeholder="Deduction Remarks"
            value={
                deductionSettings.remarks
            }
            onChange={(e) =>
                setDeductionSettings(prev => ({
                    ...prev,
                    remarks: e.target.value
                }))
            }
            style={{
                gridColumn: "1 / -1"
            }}
        />

    </div>

)}
{activeTab === "finalSettlement" && (

    <div
        style={{
            padding: "20px"
        }}
    >

        {!formData.date_of_leaving ? (

            <div
                style={{
                    padding: "15px",
                    background: "#fff3cd",
                    border: "1px solid #ffeeba",
                    borderRadius: "6px"
                }}
            >

                <strong>
                    Final Settlement Not Available
                </strong>

                <p>
                    Please enter the employee's
                    Date of Leaving in Basic Details
                    before preparing the Full & Final
                    Settlement.
                </p>

            </div>

        ) : (

            <div>

                <h3>
                    Full & Final Settlement
                </h3>

                <p>
                    Last Working Date:{" "}
                    <strong>
                        {formData.date_of_leaving}
                    </strong>
                </p>

                <p>
                    Settlement calculation will be
                    available here.
                </p>

            </div>

        )}

    </div>

)}              
              
                <div
    style={{
        marginTop: "20px"
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
