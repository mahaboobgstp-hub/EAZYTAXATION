import { supabase } from "../../supabase/supabaseClient";


// =====================================================
// GET PAYROLL RUNS
// =====================================================

export async function getPayrollRuns(
    companyId
) {

    if (!companyId) {

        return [];

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_runs"
            )
            .select(
                "*"
            )
            .eq(
                "company_id",
                companyId
            )
            .order(
                "payroll_year",
                {
                    ascending: false
                }
            )
            .order(
                "payroll_month",
                {
                    ascending: false
                }
            );


    if (error) {

        throw error;

    }


    return data || [];

}


// =====================================================
// GET SINGLE PAYROLL RUN
// =====================================================

export async function getPayrollRunById(
    payrollRunId,
    companyId
) {

    if (
        !payrollRunId ||
        !companyId
    ) {

        throw new Error(
            "Payroll Run or Company is missing."
        );

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_runs"
            )
            .select(
                "*"
            )
            .eq(
                "id",
                payrollRunId
            )
            .eq(
                "company_id",
                companyId
            )
            .single();


    if (error) {

        throw error;

    }


    return data;

}


// =====================================================
// GET PAYROLL RUN BY MONTH
// =====================================================

export async function getPayrollRunByPeriod(
    companyId,
    payrollYear,
    payrollMonth
) {

    if (
        !companyId ||
        !payrollYear ||
        !payrollMonth
    ) {

        return null;

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_runs"
            )
            .select(
                "*"
            )
            .eq(
                "company_id",
                companyId
            )
            .eq(
                "payroll_year",
                payrollYear
            )
            .eq(
                "payroll_month",
                payrollMonth
            )
            .maybeSingle();


    if (error) {

        throw error;

    }


    return data;

}


// =====================================================
// CREATE PAYROLL RUN
// =====================================================

export async function createPayrollRun(
    payrollData,
    companyId
) {

    if (!companyId) {

        throw new Error(
            "Please select a Current Company."
        );

    }


    const runData = {

        ...payrollData,

        company_id:
            companyId

    };


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_runs"
            )
            .insert(
                [runData]
            )
            .select()
            .single();


    if (error) {

        throw error;

    }


    return data;

}


// =====================================================
// UPDATE PAYROLL RUN
// =====================================================

export async function updatePayrollRun(
    payrollRunId,
    payrollData,
    companyId
) {

    if (
        !payrollRunId ||
        !companyId
    ) {

        throw new Error(
            "Payroll Run or Company is missing."
        );

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_runs"
            )
            .update({

                ...payrollData,

                updated_at:
                    new Date()
                        .toISOString()

            })
            .eq(
                "id",
                payrollRunId
            )
            .eq(
                "company_id",
                companyId
            )
            .select()
            .single();


    if (error) {

        throw error;

    }


    return data;

}


// =====================================================
// DELETE PAYROLL RUN
// DRAFT ONLY
// =====================================================

export async function deletePayrollRun(
    payrollRunId,
    companyId
) {

    if (
        !payrollRunId ||
        !companyId
    ) {

        throw new Error(
            "Payroll Run or Company is missing."
        );

    }


    const payrollRun =
        await getPayrollRunById(
            payrollRunId,
            companyId
        );


    if (
        payrollRun.payroll_status !==
        "Draft"
    ) {

        throw new Error(
            "Only Draft Payroll Runs can be deleted."
        );

    }


    const {
        error
    } =
        await supabase
            .from(
                "payroll_runs"
            )
            .delete()
            .eq(
                "id",
                payrollRunId
            )
            .eq(
                "company_id",
                companyId
            );


    if (error) {

        throw error;

    }


    return true;

}


// =====================================================
// GET PAYROLL EMPLOYEE DETAILS
// =====================================================

export async function getPayrollEmployeeDetails(
    payrollRunId,
    companyId
) {

    if (
        !payrollRunId ||
        !companyId
    ) {

        return [];

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_employee_details"
            )
            .select(
                "*"
            )
            .eq(
                "payroll_run_id",
                payrollRunId
            )
            .eq(
                "company_id",
                companyId
            )
            .order(
                "employee_name"
            );


    if (error) {

        throw error;

    }


    return data || [];

}


// =====================================================
// GET SINGLE PAYROLL EMPLOYEE
// =====================================================

export async function getPayrollEmployeeDetail(
    payrollRunId,
    employeeId,
    companyId
) {

    if (
        !payrollRunId ||
        !employeeId ||
        !companyId
    ) {

        return null;

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_employee_details"
            )
            .select(
                "*"
            )
            .eq(
                "payroll_run_id",
                payrollRunId
            )
            .eq(
                "employee_id",
                employeeId
            )
            .eq(
                "company_id",
                companyId
            )
            .maybeSingle();


    if (error) {

        throw error;

    }


    return data;

}


// =====================================================
// SAVE PAYROLL EMPLOYEE DETAILS
// UPSERT BY PAYROLL RUN + EMPLOYEE
// =====================================================

export async function savePayrollEmployeeDetails(
    payrollRunId,
    employeeDetails,
    companyId
) {

    if (
        !payrollRunId ||
        !companyId
    ) {

        throw new Error(
            "Payroll Run or Company is missing."
        );

    }


    if (
        !employeeDetails ||
        employeeDetails.length === 0
    ) {

        return [];

    }


    const rows =
        employeeDetails.map(
            item => ({

                ...item,

                payroll_run_id:
                    payrollRunId,

                company_id:
                    companyId,

                updated_at:
                    new Date()
                        .toISOString()

            })
        );


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_employee_details"
            )
            .upsert(
                rows,
                {
                    onConflict:
                        "payroll_run_id,employee_id"
                }
            )
            .select();


    if (error) {

        throw error;

    }


    return data || [];

}


// =====================================================
// UPDATE SINGLE PAYROLL EMPLOYEE
// =====================================================

export async function updatePayrollEmployeeDetail(
    payrollEmployeeId,
    payrollData,
    companyId
) {

    if (
        !payrollEmployeeId ||
        !companyId
    ) {

        throw new Error(
            "Payroll Employee or Company is missing."
        );

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "payroll_employee_details"
            )
            .update({

                ...payrollData,

                updated_at:
                    new Date()
                        .toISOString()

            })
            .eq(
                "id",
                payrollEmployeeId
            )
            .eq(
                "company_id",
                companyId
            )
            .select()
            .single();


    if (error) {

        throw error;

    }


    return data;

}


// =====================================================
// DELETE PAYROLL EMPLOYEE DETAIL
// =====================================================

export async function deletePayrollEmployeeDetail(
    payrollEmployeeId,
    companyId
) {

    if (
        !payrollEmployeeId ||
        !companyId
    ) {

        throw new Error(
            "Payroll Employee or Company is missing."
        );

    }


    const {
        error
    } =
        await supabase
            .from(
                "payroll_employee_details"
            )
            .delete()
            .eq(
                "id",
                payrollEmployeeId
            )
            .eq(
                "company_id",
                companyId
            );


    if (error) {

        throw error;

    }


    return true;

}


// =====================================================
// UPDATE PAYROLL RUN TOTALS
// =====================================================

export async function updatePayrollRunTotals(
    payrollRunId,
    companyId
) {

    const employees =
        await getPayrollEmployeeDetails(
            payrollRunId,
            companyId
        );


    const totals =
        employees.reduce(
            (
                result,
                employee
            ) => {

                result.totalEmployees += 1;

                result.totalGrossSalary +=
                    Number(
                        employee.gross_earnings || 0
                    );

                result.totalDeductions +=
                    Number(
                        employee.total_deductions || 0
                    );

                result.totalNetSalary +=
                    Number(
                        employee.net_salary || 0
                    );

                result.totalEmployerContribution +=
                    Number(
                        employee.total_employer_contribution || 0
                    );


                return result;

            },
            {

                totalEmployees:
                    0,

                totalGrossSalary:
                    0,

                totalDeductions:
                    0,

                totalNetSalary:
                    0,

                totalEmployerContribution:
                    0

            }
        );


    return await updatePayrollRun(

        payrollRunId,

        {

            total_employees:
                totals.totalEmployees,

            total_gross_salary:
                totals.totalGrossSalary,

            total_deductions:
                totals.totalDeductions,

            total_net_salary:
                totals.totalNetSalary,

            total_employer_contribution:
                totals.totalEmployerContribution

        },

        companyId

    );

}


// =====================================================
// PROCESS PAYROLL
// =====================================================

export async function markPayrollProcessed(
    payrollRunId,
    companyId
) {

    return await updatePayrollRun(

        payrollRunId,

        {

            payroll_status:
                "Processed",

            processed_at:
                new Date()
                    .toISOString()

        },

        companyId

    );

}


// =====================================================
// FINALIZE PAYROLL
// =====================================================

export async function finalizePayroll(
    payrollRunId,
    companyId
) {

    return await updatePayrollRun(

        payrollRunId,

        {

            payroll_status:
                "Finalized",

            finalized_at:
                new Date()
                    .toISOString()

        },

        companyId

    );

}
