import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import "../../css/hr/EmployeeMaster.css";
import { supabase } from "../../supabase/supabaseClient";

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

import {
    getSalaryTdsPolicies,
    assignSalaryTdsPolicy
} from "../../services/hr/salaryTdsPolicyService";

import {
    getSalaryComponents
} from "../../services/hr/salaryComponentService";

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

    blood_group: "",
    profile_photo_url: ""
};


async function uploadEmployeePhoto(file, companyId, employeeId) {
    if (!file) return null;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Please select a JPG, PNG, or WebP image.");
    }

    if (file.size > 2 * 1024 * 1024) {
        throw new Error("Employee photo must be smaller than 2 MB.");
    }

    const extension = file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
            ? "webp"
            : "jpg";

    const filePath =
        `${companyId}/${employeeId}/profile.${extension}`;

    const { error } = await supabase.storage
        .from("employee-photos")
        .upload(filePath, file, {
            upsert: true,
            contentType: file.type
        });

    if (error) {
        throw error;
    }

    return filePath;
}

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

    const [photoFile, setPhotoFile] = useState(null);
const [photoPreview, setPhotoPreview] = useState("");
    

const [salaryStructure, setSalaryStructure] =
    useState(
        defaultSalaryStructure
    );

const [availableTdsPolicies, setAvailableTdsPolicies] = useState([]);
const [tdsPolicyId, setTdsPolicyId] = useState("");
const [tdsPolicyLoading, setTdsPolicyLoading] = useState(false);


const [salaryComponents, setSalaryComponents] =
    useState([]);
    const [
    activeTab,
    setActiveTab
] =
    useState(
        "basic"
    );

const [
    availableSalaryComponents,
    setAvailableSalaryComponents
] = useState([]);

const [
    salaryComponentsLoading,
    setSalaryComponentsLoading
] = useState(false);
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
    const [documentType, setDocumentType] =
    useState("");

    const [loading, setLoading] =
        useState(false);


    useEffect(() => {

   if (!currentCompanyId) {

    setEmployees([]);
    setDepartments([]);
    setDesignations([]);
    setShifts([]);
    setLocations([]);
    setAvailableSalaryComponents([]);
       setAvailableTdsPolicies([]);
setTdsPolicyId("");
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
    loadAvailableSalaryComponents(currentCompanyId);    
        loadAvailableTdsPolicies(currentCompanyId);

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
const loadAvailableSalaryComponents = async (companyId) => {
    if (!companyId) {
        setAvailableSalaryComponents([]);
        return;
    }

    setSalaryComponentsLoading(true);

    try {
        const data = await getSalaryComponents(companyId, false);
        setAvailableSalaryComponents(data || []);
    } catch (error) {
        console.error(
            "Error loading company salary components:",
            error
        );

        setAvailableSalaryComponents([]);
        alert(
            error.message ||
            "Unable to load salary components."
        );
    } finally {
        setSalaryComponentsLoading(false);
    }
};

    
const loadAvailableTdsPolicies = async (companyId) => {
    if (!companyId) {
        setAvailableTdsPolicies([]);
        setTdsPolicyId("");
        return;
    }

    try {
        setTdsPolicyLoading(true);

        const policies = await getSalaryTdsPolicies(companyId);

        setAvailableTdsPolicies(
            (policies || []).filter(
                policy => policy.policy_status === "ACTIVE"
            )
        );
    } catch (error) {
        console.error("Unable to load TDS policies:", error);
        setAvailableTdsPolicies([]);
        alert(error.message || "Unable to load TDS policies.");
    } finally {
        setTdsPolicyLoading(false);
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
    const getComponentAmount = (component) => {
    const amount = Number(component.amount || 0);

    const calculationType = String(
        component.calculation_type || "FIXED"
    ).toUpperCase();

    if (calculationType !== "PERCENTAGE") {
        return amount;
    }

    const percentage = Number(component.percentage || 0);

    const baseType = String(
        component.percentage_base || ""
    ).toUpperCase();

    const basic = Number(
        salaryStructure.basic_amount || 0
    );

    const baseGross =
        Number(salaryStructure.basic_amount || 0) +
        Number(salaryStructure.hra_amount || 0) +
        Number(salaryStructure.da_amount || 0) +
        Number(salaryStructure.special_allowance || 0) +
        Number(salaryStructure.other_allowance || 0);

    const base =
        baseType === "BASIC"
            ? basic
            : baseType === "GROSS"
                ? baseGross
                : 0;

    return (base * percentage) / 100;
};

const getAssignedComponent = (masterComponent) =>
    salaryComponents.find(
        component =>
            component.master_component_id === masterComponent.id ||
            (
                component.component_code &&
                component.component_code ===
                    masterComponent.component_code
            )
    );


const getComponentsByCategory = (category) => {
    const excludedCodes = new Set([
        // Standard salary heads already shown separately
        "BASIC",
        "HRA",
        "DA",
        "SA",
        "OA",

        // Employee statutory contributions
        "PF-EMP",
        "ESI-EMP",
        "PT-EMP",
        "TDS-EMP",

        // Employer statutory contributions
        "PF-ER",
        "ESI-ER",
        "EPS-ER",
        "EDLI-ER",
        "PF-ADMIN",
        "EDLI-ADMIN",
        "GRATUITY-ER"
    ]);

    const excludedNames = new Set([
        "BASIC SALARY",
        "HOUSE RENT ALLOWANCE",
        "DEARNESS ALLOWANCE",
        "SPECIAL ALLOWANCE",
        "OTHER ALLOWANCE",

        "EMPLOYEE PF CONTRIBUTION",
        "EMPLOYEE ESI CONTRIBUTION",
        "EMPLOYEE PROFESSIONAL TAX",
        "EMPLOYEE TDS",
        "EMPLOYER PF CONTRIBUTION",
        "EMPLOYER ESI CONTRIBUTION",
        "EMPLOYER EPS CONTRIBUTION",
        "EMPLOYER EDLI CONTRIBUTION",
        "PF ADMINISTRATION CHARGES",
        "EDLI ADMINISTRATION CHARGES",
        "EMPLOYER GRATUITY CONTRIBUTION"
    ]);

    return availableSalaryComponents.filter((component) => {
        const code = String(
            component.component_code || ""
        ).trim().toUpperCase();

        const name = String(
            component.component_name || ""
        ).trim().toUpperCase();

        return (
            component.is_active === true &&
            component.component_category === category &&
            !excludedCodes.has(code) &&
            !excludedNames.has(name)
        );
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
    formData.employee_code.trim() || null,

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
    savedEmployee = await updateEmployee(
        editingId,
        employeeData,
        currentCompanyId
    );
} else {
    savedEmployee = await createEmployee(
        employeeData,
        currentCompanyId
    );
}

            
if (tdsPolicyId) {
    await saveEmployeeTdsAssignment({
        companyId: currentCompanyId,
        employeeId: savedEmployee.id,
        policyId: tdsPolicyId,
        effectiveFrom:
            salaryStructure.effective_from ||
            formData.date_of_joining
    });
}


if (photoFile) {
    const photoPath = await uploadEmployeePhoto(
        photoFile,
        currentCompanyId,
        savedEmployee.id
    );

    await updateEmployee(
        savedEmployee.id,
        {
            profile_photo_url: photoPath
        },
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
            setPhotoFile(null);
setPhotoPreview("");
            
setTdsPolicyId("");
            
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

        setPhotoFile(null);
setPhotoPreview("");


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

        if (employee.profile_photo_url) {
    const { data, error } = await supabase.storage
        .from("employee-photos")
        .createSignedUrl(
            employee.profile_photo_url,
            3600
        );

    if (error) {
        console.error("Unable to load employee photo:", error);
        setPhotoPreview("");
    } else {
        setPhotoPreview(data.signedUrl);
    }
} else {
    setPhotoPreview("");
        }

        const salaryData =
    await getCompleteSalaryStructure(
        employee.id,
        currentCompanyId
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
            
const { data: tdsAssignments, error: tdsAssignmentError } = await supabase
    .from("employee_tds_assignments")
    .select("id, policy_id, tax_regime, effective_from")
    .eq("company_id", currentCompanyId)
    .eq("employee_id", employee.id)
    .eq("is_active", true)
    .order("effective_from", { ascending: false })
    .limit(1);

if (tdsAssignmentError) throw tdsAssignmentError;

setTdsPolicyId(tdsAssignments?.[0]?.policy_id || "");


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

        setDocumentType("");
        setTdsPolicyId("");

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

const daAmount =
    Number(salaryStructure.da_amount || 0);

const grossSalary =
    basicAmount +
    Number(salaryStructure.hra_amount || 0) +
    daAmount +
    Number(salaryStructure.special_allowance || 0) +
    Number(salaryStructure.other_allowance || 0);

// Additional earnings are included in gross salary.
const additionalEarnings =
    getComponentsByCategory("EARNING").reduce(
        (total, component) => {
            const assigned = getAssignedComponent(component);
            return total + (
                assigned ? getComponentAmount(assigned) : 0
            );
        },
        0
    );

// Reimbursements are tracked separately from gross salary
// but included in CTC as requested.
const additionalReimbursements =
    getComponentsByCategory("REIMBURSEMENT").reduce(
        (total, component) => {
            const assigned = getAssignedComponent(component);
            return total + (
                assigned ? getComponentAmount(assigned) : 0
            );
        },
        0
    );

const totalGrossSalary =
    grossSalary + additionalEarnings;

const employeePfRate =
    Number(salaryStructure.employee_pf_rate || 0);

const employerPfRate =
    Number(salaryStructure.employer_pf_rate || 0);

const employeeEsiRate =
    Number(salaryStructure.employee_esi_rate || 0);

const employerEsiRate =
    Number(salaryStructure.employer_esi_rate || 0);

// Temporary calculation bases.
// These must ultimately come from the statutory rules engine.
const pfWageBase = basicAmount + daAmount;
const esiWageBase = totalGrossSalary;

const employeePfAmount =
    salaryStructure.is_pf_applicable
        ? (pfWageBase * employeePfRate) / 100
        : 0;

const employerPfAmount =
    salaryStructure.is_pf_applicable
        ? (pfWageBase * employerPfRate) / 100
        : 0;

const employeeEsiAmount =
    salaryStructure.is_esi_applicable
        ? (esiWageBase * employeeEsiRate) / 100
        : 0;

const employerEsiAmount =
    salaryStructure.is_esi_applicable
        ? (esiWageBase * employerEsiRate) / 100
        : 0;

const totalEmployeeContribution =
    employeePfAmount + employeeEsiAmount;

const totalEmployerContribution =
    employerPfAmount + employerEsiAmount;

// EPS, EDLI and administration charges will be supplied
// by the configurable statutory rules engine in a later step.
const employerEpsAmount = null;
const employerEdliAmount = null;
const employerAdminCharges = null;

const monthlyCtc =
    totalGrossSalary +
    totalEmployerContribution +
    additionalReimbursements;

const annualCtc = monthlyCtc * 12;




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
    <div className="employee-basic-layout">
        
<div className="employee-photo-section">
    <div className="employee-photo-preview">
        {photoPreview ? (
            <img
                src={photoPreview}
                alt="Employee preview"
            />
        ) : (
            <div className="employee-photo-placeholder">
                <span>👤</span>
                <small>No photo selected</small>
            </div>
        )}
    </div>

    <div className="employee-photo-controls">
        <h3>Employee Photo</h3>
        <p>Choose a clear employee photograph.</p>

        <label className="employee-photo-upload-button">
            Choose Photo
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (!file) return;

                    if (file.size > 2 * 1024 * 1024) {
                        alert("Please select an image smaller than 2 MB.");
                        event.target.value = "";
                        return;
                    }

                    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                        alert("Please select a JPG, PNG, or WebP image.");
                        event.target.value = "";
                        return;
                    }

                    setPhotoFile(file);

                    setPhotoPreview(
                        URL.createObjectURL(file)
                    );
                }}
            />
        </label>

        <small>JPG, PNG or WebP · Maximum 2 MB</small>
    </div>
</div>


        <div className="employee-basic-intro">
            <h3>Employee Information</h3>
            <p>Enter the employee's personal and employment details.</p>
        </div>

        <section className="employee-basic-section">
            <h3>Basic Information</h3>
            <div className="employee-basic-grid">

                

                
  <label className="employee-form-field">
    Employee Code

    <input
        name="employee_code"
        value={formData.employee_code}
        onChange={handleChange}
        placeholder="Leave blank for automatic ID"
    />

    <small>
        Leave blank to generate automatically.
        Manual codes are subject to company settings.
    </small>
</label>



                <label className="employee-form-field">
                    Employee Name *
                    <input
                        name="employee_name"
                        value={formData.employee_name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        required
                    />
                </label>

                <label className="employee-form-field">
                    Gender
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </label>

                <label className="employee-form-field">
                    Mobile Number
                    <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                    />
                </label>

            </div>
        </section>

        <section className="employee-basic-section">
            <h3>Personal Details</h3>
            <div className="employee-basic-grid">

                <label className="employee-form-field">
                    Date of Birth
                    <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                    />
                </label>

                <label className="employee-form-field">
                    Marital Status
                    <select name="marital_status" value={formData.marital_status} onChange={handleChange}>
                        <option value="">Select marital status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                    </select>
                </label>

                <label className="employee-form-field">
                    Alternate Mobile
                    <input
                        type="tel"
                        name="alternate_mobile"
                        value={formData.alternate_mobile}
                        onChange={handleChange}
                        placeholder="Enter alternate mobile"
                    />
                </label>

                <label className="employee-form-field">
                    Email Address
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                    />
                </label>

            </div>
        </section>

        <section className="employee-basic-section">
            <h3>Employment Details</h3>
            <div className="employee-basic-grid">

                <label className="employee-form-field">
                    Date of Joining *
                    <input
                        type="date"
                        name="date_of_joining"
                        value={formData.date_of_joining}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label className="employee-form-field">
                    Employment Type
                    <select name="employment_type" value={formData.employment_type} onChange={handleChange}>
                        <option value="Permanent">Permanent</option>
                        <option value="Temporary">Temporary</option>
                        <option value="Contract">Contract</option>
                        <option value="Part Time">Part Time</option>
                    </select>
                </label>

                <label className="employee-form-field">
                    Salary Type
                    <select name="salary_type" value={formData.salary_type} onChange={handleChange}>
                        <option value="Monthly">Monthly</option>
                        <option value="Daily">Daily</option>
                        <option value="Hourly">Hourly</option>
                    </select>
                </label>

                <label className="employee-form-field">
                    Department
                    <select name="department_id" value={formData.department_id} onChange={handleChange}>
                        <option value="">Select department</option>
                        {departments.map(department => (
                            <option key={department.id} value={department.id}>
                                {department.department_name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="employee-form-field">
                    Designation
                    <select name="designation_id" value={formData.designation_id} onChange={handleChange}>
                        <option value="">Select designation</option>
                        {designations.map(designation => (
                            <option key={designation.id} value={designation.id}>
                                {designation.designation_name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="employee-form-field">
                    Default Shift
                    <select name="default_shift_id" value={formData.default_shift_id} onChange={handleChange}>
                        <option value="">Select shift</option>
                        {shifts.map(shift => (
                            <option key={shift.id} value={shift.id}>
                                {shift.shift_name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="employee-form-field">
                    Location
                    <select name="location_id" value={formData.location_id} onChange={handleChange}>
                        <option value="">Select location</option>
                        {locations.map(location => (
                            <option key={location.id} value={location.id}>
                                {location.location_code} - {location.location_name}
                            </option>
                        ))}
                    </select>
                </label>

            </div>
        </section>

        <section className="employee-basic-section">
            <h3>Address Details</h3>
            <div className="employee-basic-grid">

                <label className="employee-form-field">
                    Address Line 1
                    <input name="address_line1" value={formData.address_line1} onChange={handleChange} placeholder="House number, street" />
                </label>

                <label className="employee-form-field">
                    Address Line 2
                    <input name="address_line2" value={formData.address_line2} onChange={handleChange} placeholder="Area, landmark" />
                </label>

                <label className="employee-form-field">
                    City
                    <input name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" />
                </label>

                <label className="employee-form-field">
                    District
                    <input name="district" value={formData.district} onChange={handleChange} placeholder="Enter district" />
                </label>

                <label className="employee-form-field">
                    State
                    <input name="state" value={formData.state} onChange={handleChange} placeholder="Enter state" />
                </label>

                <label className="employee-form-field">
                    PIN Code
                    <input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Enter PIN code" />
                </label>

            </div>
        </section>

        <section className="employee-basic-section">
            <h3>Emergency Contact</h3>
            <div className="employee-basic-grid">

                <label className="employee-form-field">
                    Contact Person Name
                    <input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} placeholder="Enter contact name" />
                </label>

                <label className="employee-form-field">
                    Contact Mobile
                    <input name="emergency_contact_mobile" value={formData.emergency_contact_mobile} onChange={handleChange} placeholder="Enter contact mobile" />
                </label>

                <label className="employee-form-field">
                    Blood Group
                    <select name="blood_group" value={formData.blood_group} onChange={handleChange}>
                        <option value="">Select blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                    </select>
                </label>

            </div>
        </section>

        <section className="employee-basic-section">
            <h3>Identity and Statutory Details</h3>
            <div className="employee-basic-grid">

                <label className="employee-form-field">
                    Aadhaar Number
                    <input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} placeholder="Enter Aadhaar number" />
                </label>

                <label className="employee-form-field">
                    PAN Number
                    <input name="pan_number" value={formData.pan_number} onChange={handleChange} placeholder="Enter PAN" />
                </label>

                <label className="employee-form-field">
                    Passport Number
                    <input name="passport_number" value={formData.passport_number} onChange={handleChange} placeholder="Enter passport number" />
                </label>

                <label className="employee-form-field">
                    Driving Licence Number
                    <input name="driving_license_number" value={formData.driving_license_number} onChange={handleChange} placeholder="Enter licence number" />
                </label>

                <label className="employee-form-field">
                    UAN Number
                    <input name="uan_number" value={formData.uan_number} onChange={handleChange} placeholder="Enter UAN" />
                </label>

                <label className="employee-form-field">
                    PF Number
                    <input name="pf_number" value={formData.pf_number} onChange={handleChange} placeholder="Enter PF number" />
                </label>

                <label className="employee-form-field">
                    ESI Number
                    <input name="esi_number" value={formData.esi_number} onChange={handleChange} placeholder="Enter ESI number" />
                </label>

            </div>
        </section>

        <section className="employee-basic-section">
            <h3>Bank Details</h3>
            <div className="employee-basic-grid">

                <label className="employee-form-field">
                    Bank Name
                    <input name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="Enter bank name" />
                </label>

                <label className="employee-form-field">
                    Bank Account Number
                    <input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} placeholder="Enter account number" />
                </label>

                <label className="employee-form-field">
                    IFSC Code
                    <input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} placeholder="Enter IFSC code" />
                </label>

            </div>
        </section>

        <section className="employee-basic-section">
            <h3>Additional Information</h3>
            <label className="employee-form-field">
                Remarks
                <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Enter additional notes"
                    rows={3}
                />
            </label>
        </section>

    </div>
)}


                {activeTab === "salary" && (

<div className="salary-structure-layout">

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

            
    
<div className="salary-summary-panel">
    <h3>Salary Summary</h3>

    <div className="salary-summary-grid">
        <div className="salary-summary-item">
            <span>Basic Salary</span>
            <strong>₹{basicAmount.toFixed(2)}</strong>
        </div>

        <div className="salary-summary-item">
            <span>HRA</span>
            <strong>
                ₹{Number(salaryStructure.hra_amount || 0).toFixed(2)}
            </strong>
        </div>

        <div className="salary-summary-item">
            <span>DA</span>
            <strong>
                ₹{Number(salaryStructure.da_amount || 0).toFixed(2)}
            </strong>
        </div>

        <div className="salary-summary-item">
            <span>Special Allowance</span>
            <strong>
                ₹{Number(salaryStructure.special_allowance || 0).toFixed(2)}
            </strong>
        </div>

        <div className="salary-summary-item">
            <span>Other Allowance</span>
            <strong>
                ₹{Number(salaryStructure.other_allowance || 0).toFixed(2)}
            </strong>
        </div>
    </div>

    <div className="salary-components-section">
        <h4>Other Salary Components</h4>
        <p className="salary-section-description">
            Configure company-specific salary heads here.
            Standard salary fields are managed above.
        </p>

        {salaryComponentsLoading ? (
            <p>Loading salary components...</p>
        ) : (
            ["EARNING", "EMPLOYEE_DEDUCTION",
             "EMPLOYER_CONTRIBUTION", "REIMBURSEMENT"].map((category) => {
                const categoryComponents =
                    getComponentsByCategory(category);

                if (categoryComponents.length === 0) {
                    return null;
                }

                const titles = {
                    EARNING: "Earnings",
                    EMPLOYEE_DEDUCTION: "Employee Deductions",
                    EMPLOYER_CONTRIBUTION: "Employer Contributions",
                    REIMBURSEMENT: "Reimbursements"
                };

                return (
                    <div
                        className="salary-component-group"
                        key={category}
                    >
                        <h5>{titles[category]}</h5>

                        <div className="salary-component-grid">
                            {categoryComponents.map((component) => {
                                const assigned =
                                    getAssignedComponent(component);

                                return (
                                    <label
                                        className="salary-component-field"
                                        key={component.id}
                                    >
                                        <span>
                                            {component.component_name}
                                            <small>
                                                {component.component_code}
                                            </small>
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={assigned?.amount ?? ""}
                                            placeholder={String(
                                                component.default_amount ?? 0
                                            )}
                                            onChange={(event) => {
                                                const amount =
                                                    event.target.value;

                                                setSalaryComponents((previous) => {
                                                    const existing =
                                                        previous.findIndex(
                                                            (item) =>
                                                                item.master_component_id ===
                                                                    component.id ||
                                                                item.component_code ===
                                                                    component.component_code
                                                        );

                                                    const nextItem = {
                                                        ...(existing >= 0
                                                            ? previous[existing]
                                                            : {}),
                                                        master_component_id:
                                                            component.id,
                                                        component_code:
                                                            component.component_code,
                                                        component_name:
                                                            component.component_name,
                                                        component_type: category,
                                                        calculation_type:
                                                            component.calculation_type,
                                                        percentage_base:
                                                            component.percentage_base,
                                                        percentage:
                                                            component.default_percentage,
                                                        amount,
                                                        is_active: true
                                                    };

                                                    if (existing >= 0) {
                                                        return previous.map(
                                                            (item, index) =>
                                                                index === existing
                                                                    ? nextItem
                                                                    : item
                                                        );
                                                    }

                                                    return [
                                                        ...previous,
                                                        nextItem
                                                    ];
                                                });
                                            }}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })
        )}
    </div>

    <div className="salary-contribution-section">
        <h4>Employee Contributions</h4>

        <div className="salary-summary-grid">
            <div className="salary-summary-item">
                <span>Employee PF</span>
                <strong>₹{employeePfAmount.toFixed(2)}</strong>
            </div>

            <div className="salary-summary-item">
                <span>Employee ESI</span>
                <strong>₹{employeeEsiAmount.toFixed(2)}</strong>
            </div>

            <div className="salary-summary-item">
                <span>Total Employee Contributions</span>
                <strong>
                    ₹{totalEmployeeContribution.toFixed(2)}
                </strong>
            </div>
        </div>

        <h4>Employer Contributions</h4>

        <div className="salary-summary-grid">
            <div className="salary-summary-item">
                <span>Employer PF</span>
                <strong>₹{employerPfAmount.toFixed(2)}</strong>
            </div>

            <div className="salary-summary-item">
                <span>Employer ESI</span>
                <strong>₹{employerEsiAmount.toFixed(2)}</strong>
            </div>
            
<div className="salary-summary-item">
    <span>Employer EPS</span>
    <strong>
        {employerEpsAmount === null
            ? "Policy setup required"
            : `₹${employerEpsAmount.toFixed(2)}`}
    </strong>
</div>

<div className="salary-summary-item">
    <span>Employer EDLI</span>
    <strong>
        {employerEdliAmount === null
            ? "Policy setup required"
            : `₹${employerEdliAmount.toFixed(2)}`}
    </strong>
</div>

<div className="salary-summary-item">
    <span>Employer Administration Charges</span>
    <strong>
        {employerAdminCharges === null
            ? "Policy setup required"
            : `₹${employerAdminCharges.toFixed(2)}`}
    </strong>
</div>


            <div className="salary-summary-item">
                <span>Total Employer Contributions</span>
                <strong>
                    ₹{totalEmployerContribution.toFixed(2)}
                </strong>
            </div>
        </div>
    </div>

    <div className="salary-ctc-panel">
        <div>
            <span>Monthly Gross Salary</span>
            <strong>₹{totalGrossSalary.toFixed(2)}</strong>
        </div>

        <div>
            <span>Monthly CTC</span>
            <strong>₹{(totalGrossSalary + totalEmployerContribution).toFixed(2)}</strong>
        </div>

        <div>
            <span>Annual CTC</span>
            <strong>
                ₹{(
                    (totalGrossSalary + totalEmployerContribution) * 12
                ).toFixed(2)}
            </strong>
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
    <label htmlFor="employee_tds_policy_id">
        Salary TDS Policy
    </label>

    <select
        id="employee_tds_policy_id"
        value={tdsPolicyId}
        onChange={(event) => {
            const policyId = event.target.value;
            setTdsPolicyId(policyId);

            const selectedPolicy = availableTdsPolicies.find(
                policy => policy.id === policyId
            );

            if (selectedPolicy) {
                setSalaryStructure(previous => ({
                    ...previous,
                    tds_regime: selectedPolicy.tax_regime
                }));
            }
        }}
        disabled={tdsPolicyLoading}
    >
        <option value="">
            {tdsPolicyLoading
                ? "Loading TDS policies..."
                : "Select salary TDS policy"}
        </option>

        {availableTdsPolicies.map(policy => (
            <option key={policy.id} value={policy.id}>
                {policy.policy_code} — {policy.policy_name}
                {" ("}{policy.tax_year}{")"}
            </option>
        ))}
    </select>

    <small>
        Only active company policies are available. Create and activate
        a policy in Statutory Configuration first.
    </small>
</div>

<div>
    <label>Assigned Tax Regime</label>

    <input
        value={
            salaryStructure.tds_regime === "OLD"
                ? "Old Tax Regime"
                : "New Tax Regime"
        }
        readOnly
    />
</div>

<div
    style={{
        gridColumn: "1 / -1",
        padding: "12px",
        background: "#f8f9fa",
        border: "1px solid #ddd",
        borderRadius: "6px"
    }}
>
    <strong>Salary TDS</strong>

    <p>
        The assigned policy will provide the tax slabs and policy settings
        used by payroll. The final TDS amount depends on estimated annual
        taxable income, declarations, tax already deducted and the
        remaining payroll periods.
    </p>
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

{activeTab === "documents" && (

    <div className="employee-documents-tab">

        <div className="documents-header">

            <div>
                <h3>
                    Employee Documents
                </h3>

                <p>
                    Generate and manage HR documents
                    for this employee.
                </p>
            </div>

        </div>


        {!editingId && (

            <div className="documents-warning">

                <strong>
                    Save the employee first
                </strong>

                <p>
                    Documents can be generated or
                    uploaded only after the employee
                    record has been saved.
                </p>

            </div>

        )}


        {editingId && (

            <>

                {/* =====================================
                    DOCUMENT GENERATION
                ====================================== */}

                <div className="documents-section">

                    <div className="documents-section-header">

                        <div>
                            <h4>
                                Generate HR Document
                            </h4>

                            <p>
                                Select a document type
                                to generate for this
                                employee.
                            </p>
                        </div>

                    </div>


                    <div className="documents-generation-grid">

                        <div className="documents-field">

                            <label>
                                Document Type
                            </label>

                            <select
                                name="document_type"
                                value={
                                    documentType ||
                                    ""
                                }
                                onChange={(e) =>
                                    setDocumentType(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Select Document
                                </option>

                                <option value="offer_letter">
                                    Offer Letter
                                </option>

                                <option value="joining_letter">
                                    Joining Letter
                                </option>

                                <option value="appointment_letter">
                                    Appointment Letter
                                </option>

                                <option value="appointment_letter_salary_annexure">
                                    Appointment Letter + Salary Annexure
                                </option>

                                <option value="experience_letter">
                                    Experience Letter
                                </option>

                                <option
                                    value="relieving_letter"
                                    disabled={
                                        !formData.date_of_leaving
                                    }
                                >
                                    Relieving Letter
                                </option>

                            </select>

                        </div>


                        <div className="documents-action-field">

                            <button
                                type="button"
                                className="employee-save-button"
                                disabled={
                                    !documentType
                                }
                                onClick={() => {

                                    alert(
                                        "Document generation will be connected next."
                                    );

                                }}
                            >
                                Generate Document
                            </button>

                        </div>

                    </div>


                    {!formData.date_of_leaving && (

                        <div className="documents-info">

                            <strong>
                                Relieving Letter:
                            </strong>

                            <span>
                                Enter Date of Leaving
                                in Basic Details to
                                enable the Relieving
                                Letter.
                            </span>

                        </div>

                    )}

                </div>


                {/* =====================================
                    UPLOAD DOCUMENT
                ====================================== */}

                <div className="documents-section">

                    <div className="documents-section-header">

                        <div>
                            <h4>
                                Upload Existing Document
                            </h4>

                            <p>
                                Upload employee documents
                                that were received or
                                generated outside the ERP.
                            </p>
                        </div>

                    </div>


                    <div className="documents-upload-grid">

                        <div className="documents-field">

                            <label>
                                Document Type
                            </label>

                            <select>

                                <option value="">
                                    Select Document
                                </option>

                                <option value="aadhaar">
                                    Aadhaar
                                </option>

                                <option value="pan">
                                    PAN
                                </option>

                                <option value="passport">
                                    Passport
                                </option>

                                <option value="driving_license">
                                    Driving Licence
                                </option>

                                <option value="offer_letter">
                                    Offer Letter
                                </option>

                                <option value="joining_letter">
                                    Joining Letter
                                </option>

                                <option value="appointment_letter">
                                    Appointment Letter
                                </option>

                                <option value="experience_letter">
                                    Experience Letter
                                </option>

                                <option value="relieving_letter">
                                    Relieving Letter
                                </option>

                                <option value="other">
                                    Other
                                </option>

                            </select>

                        </div>


                        <div className="documents-field">

                            <label>
                                Select File
                            </label>

                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                            />

                        </div>


                        <div className="documents-action-field">

                            <button
                                type="button"
                                className="employee-save-button"
                                onClick={() => {

                                    alert(
                                        "Document upload will be connected next."
                                    );

                                }}
                            >
                                Upload Document
                            </button>

                        </div>

                    </div>

                </div>


                {/* =====================================
                    EXISTING DOCUMENTS
                ====================================== */}

                <div className="documents-section">

                    <div className="documents-section-header">

                        <div>
                            <h4>
                                Employee Documents
                            </h4>

                            <p>
                                Documents already stored
                                for this employee.
                            </p>
                        </div>

                    </div>


                    <div className="documents-empty-state">

                        <strong>
                            No documents available
                        </strong>

                        <p>
                            Generated or uploaded
                            documents will appear here.
                        </p>

                    </div>

                </div>

            </>

        )}

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


       



        </div>

    );

}

export default EmployeeMaster;
