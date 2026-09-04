import { supabase } from "../../supabase/supabaseClient";

// GET EMPLOYEES FOR CURRENT COMPANY
export async function getEmployees(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .order("employee_name");

    if (error) throw error;

    return data || [];
}


// GET ACTIVE EMPLOYEES FOR CURRENT COMPANY
export async function getActiveEmployees(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("employee_name");

    if (error) throw error;

    return data || [];
}


// GET SINGLE EMPLOYEE
export async function getEmployeeById(employeeId, companyId) {
    if (!employeeId || !companyId) {
        throw new Error("Employee or Company is missing.");
    }

    const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .eq("company_id", companyId)
        .single();

    if (error) throw error;

    return data;
}


// CREATE EMPLOYEE
export async function createEmployee(data, companyId) {
    if (!companyId) {
        throw new Error("Please select a Current Company.");
    }

    const employeeData = {
        ...data,
        company_id: companyId
    };

    const { data: employee, error } = await supabase
        .from("employees")
        .insert([employeeData])
        .select()
        .single();

    if (error) throw error;

    return employee;
}


// UPDATE EMPLOYEE
export async function updateEmployee(employeeId, data, companyId) {
    if (!companyId) {
        throw new Error("Please select a Current Company.");
    }

    if (!employeeId) {
        throw new Error("Employee ID is missing.");
    }

    const employeeData = {
        ...data,
        company_id: companyId
    };

    const { data: employee, error } = await supabase
        .from("employees")
        .update(employeeData)
        .eq("id", employeeId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return employee;
}


// DEACTIVATE EMPLOYEE
export async function deactivateEmployee(employeeId, companyId) {
    if (!companyId) {
        throw new Error("Please select a Current Company.");
    }

    if (!employeeId) {
        throw new Error("Employee ID is missing.");
    }

    const { error } = await supabase
        .from("employees")
        .update({
            is_active: false,
            employee_status: "Inactive"
        })
        .eq("id", employeeId)
        .eq("company_id", companyId);

    if (error) throw error;

    return true;
}

// =====================================================
// EMPLOYEE QUALIFICATIONS
// =====================================================

export async function getEmployeeQualifications(
    employeeId,
    companyId
) {
    if (!employeeId || !companyId) return [];

    const { data, error } = await supabase
        .from("employee_qualifications")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", companyId)
        .order("passing_year", {
            ascending: false
        });

    if (error) throw error;

    return data || [];
}


export async function saveEmployeeQualifications(
    employeeId,
    qualifications,
    companyId
) {
    if (!employeeId || !companyId) {
        throw new Error(
            "Employee or Company is missing."
        );
    }

    if (!qualifications) return true;


    const rows = qualifications
        .filter(item =>
            item.qualification &&
            item.qualification.trim()
        )
        .map(item => ({
            id: item.id || undefined,
            company_id: companyId,
            employee_id: employeeId,
            qualification:
                item.qualification.trim(),
            institution:
                item.institution?.trim() || null,
            specialization:
                item.specialization?.trim() || null,
            passing_year:
                item.passing_year
                    ? Number(item.passing_year)
                    : null,
            remarks:
                item.remarks?.trim() || null
        }));


    const { data, error } = await supabase
        .from("employee_qualifications")
        .upsert(rows)
        .select();

    if (error) throw error;

    return data || [];
}


export async function deleteEmployeeQualification(
    qualificationId,
    employeeId,
    companyId
) {
    if (
        !qualificationId ||
        !employeeId ||
        !companyId
    ) {
        throw new Error(
            "Qualification or Company is missing."
        );
    }

    const { error } = await supabase
        .from("employee_qualifications")
        .delete()
        .eq("id", qualificationId)
        .eq("employee_id", employeeId)
        .eq("company_id", companyId);

    if (error) throw error;

    return true;
}


// =====================================================
// EMPLOYEE DOCUMENTS / CERTIFICATIONS
// =====================================================

export async function getEmployeeDocuments(
    employeeId,
    companyId
) {
    if (!employeeId || !companyId) return [];

    const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("document_name");

    if (error) throw error;

    return data || [];
}


// =====================================================
// EMPLOYEE CUSTOM FIELDS
// =====================================================

export async function getEmployeeCustomFields(
    employeeId,
    companyId
) {
    if (!employeeId || !companyId) return [];

    const { data, error } = await supabase
        .from("employee_custom_fields")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", companyId)
        .order("created_at");

    if (error) throw error;

    return data || [];
}


export async function saveEmployeeCustomFields(
    employeeId,
    fields,
    companyId
) {
    if (!employeeId || !companyId) {
        throw new Error(
            "Employee or Company is missing."
        );
    }

    if (!fields) return true;


    const rows = fields
        .filter(field =>
            field.field_name &&
            field.field_name.trim()
        )
        .map(field => ({
            id: field.id || undefined,
            company_id: companyId,
            employee_id: employeeId,
            field_name:
                field.field_name.trim(),
            field_value:
                field.field_value?.trim() || null
        }));


    const { data, error } = await supabase
        .from("employee_custom_fields")
        .upsert(rows)
        .select();

    if (error) throw error;

    return data || [];
}


export async function deleteEmployeeCustomField(
    fieldId,
    employeeId,
    companyId
) {
    if (
        !fieldId ||
        !employeeId ||
        !companyId
    ) {
        throw new Error(
            "Custom field or Company is missing."
        );
    }

    const { error } = await supabase
        .from("employee_custom_fields")
        .delete()
        .eq("id", fieldId)
        .eq("employee_id", employeeId)
        .eq("company_id", companyId);

    if (error) throw error;

    return true;
}
// =====================================================
// HR MASTER DROPDOWNS
// =====================================================

export async function getDepartments(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
        .from("departments")
        .select("id, department_code, department_name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("department_name");

    if (error) throw error;

    return data || [];
}


export async function getDesignations(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
        .from("designations")
        .select("id, designation_code, designation_name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("display_order")
        .order("designation_name");

    if (error) throw error;

    return data || [];
}


export async function getShifts(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
        .from("shift_master")
        .select("id, shift_code, shift_name, shift_start, shift_end")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("shift_name");

    if (error) throw error;

    return data || [];
}
