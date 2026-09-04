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
