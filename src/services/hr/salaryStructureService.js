import { supabase } from "../../supabase/supabaseClient";


/* =========================================
   GET ACTIVE EMPLOYEE SALARY STRUCTURE
========================================= */

export async function getEmployeeSalaryStructure(
    employeeId,
    companyId,
    periodFrom,
    periodTo
) {

    if (
        !employeeId ||
        !companyId ||
        !periodFrom ||
        !periodTo
    ) {

        return null;

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "employee_salary_structures"
            )
            .select(
                "*"
            )
            .eq(
                "employee_id",
                employeeId
            )
            .eq(
                "company_id",
                companyId
            )
            .eq(
                "is_active",
                true
            )
            .lte(
                "effective_from",
                periodTo
            )
            .or(
                `effective_to.is.null,effective_to.gte.${periodFrom}`
            )
            .order(
                "effective_from",
                {
                    ascending:
                        false
                }
            )
            .limit(
                1
            )
            .maybeSingle();


    if (
        error
    ) {

        throw error;

    }


    return data;

}
/* =========================================
   GET EMPLOYEE SALARY COMPONENTS
========================================= */

export async function getEmployeeSalaryComponents(
    salaryStructureId
) {

    if (
        !salaryStructureId
    ) {

        return [];

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "employee_salary_components"
            )
            .select(
                "*"
            )
            .eq(
                "salary_structure_id",
                salaryStructureId
            )
            .eq(
                "is_active",
                true
            )
            .order(
                "created_at",
                {
                    ascending:
                        true
                }
            );


    if (
        error
    ) {

        throw error;

    }


    return data || [];

}


/* =========================================
   GET COMPLETE SALARY STRUCTURE
========================================= */

export async function getCompleteSalaryStructure(
    employeeId,
    companyId
) {

    const structure =
        await getEmployeeSalaryStructure(
            employeeId,
            companyId
        );


    if (
        !structure
    ) {

        return {

            structure:
                null,

            components:
                []

        };

    }


    const components =
        await getEmployeeSalaryComponents(
            structure.id
        );


    return {

        structure,
        components

    };

}

/* =========================================
   SAVE EMPLOYEE SALARY STRUCTURE
========================================= */

export async function saveEmployeeSalaryStructure(
    structureData
) {

    const {

    id,

    company_id,

    employee_id,

    effective_from,

    effective_to,

    monthly_salary,

    basic_amount,

    hra_amount,

    special_allowance,

    other_allowance,

    is_pf_applicable,

    is_esi_applicable,

    is_pt_applicable,

    is_tds_applicable,


    // =============================================
    // OVERTIME
    // =============================================

    overtime_applicable,

    overtime_rate_type,

    overtime_rate,

    overtime_rate_multiplier,

    overtime_fixed_rate,


    is_active,

    remarks

} =
    structureData;

    const payload = {

        company_id,

        employee_id,

        effective_from,

        effective_to:

            effective_to ||
            null,

        monthly_salary:

            Number(
                monthly_salary
            ) || 0,

        basic_amount:

            Number(
                basic_amount
            ) || 0,

        hra_amount:

            Number(
                hra_amount
            ) || 0,

        special_allowance:

            Number(
                special_allowance
            ) || 0,

        other_allowance:

            Number(
                other_allowance
            ) || 0,

        is_pf_applicable:

            Boolean(
                is_pf_applicable
            ),

        is_esi_applicable:

            Boolean(
                is_esi_applicable
            ),

        is_pt_applicable:

            Boolean(
                is_pt_applicable
            ),

        is_tds_applicable:

            Boolean(
                is_tds_applicable
            ),
           // =============================================
    // OVERTIME CONFIGURATION
    // =============================================

    overtime_applicable:

        Boolean(
            overtime_applicable
        ),

    overtime_rate_type:

        overtime_rate_type ||
        "DAILY_RATE",

    overtime_rate:

        overtime_rate === "" ||
        overtime_rate === null ||
        overtime_rate === undefined

            ? null

            : Number(
                overtime_rate
            ),

    overtime_rate_multiplier:

        overtime_rate_multiplier === "" ||
        overtime_rate_multiplier === null ||
        overtime_rate_multiplier === undefined

            ? 1

            : Number(
                overtime_rate_multiplier
            ),

    overtime_fixed_rate:

        overtime_fixed_rate === "" ||
        overtime_fixed_rate === null ||
        overtime_fixed_rate === undefined

            ? null

            : Number(
                overtime_fixed_rate
            ),

        is_active:

            is_active !== false,

        remarks:

            remarks ||
            null,

        updated_at:

            new Date()
                .toISOString()

    };


    let result;


    if (
        id
    ) {

        result =
            await supabase
                .from(
                    "employee_salary_structures"
                )
                .update(
                    payload
                )
                .eq(
                    "id",
                    id
                )
                .select()
                .single();

    }

    else {

        result =
            await supabase
                .from(
                    "employee_salary_structures"
                )
                .insert(
                    [
                        {
                            ...payload,

                            created_at:

                                new Date()
                                    .toISOString()

                        }
                    ]
                )
                .select()
                .single();

    }


    if (
        result.error
    ) {

        throw result.error;

    }


    return result.data;

}


/* =========================================
   SAVE EMPLOYEE SALARY COMPONENTS
========================================= */

export async function saveEmployeeSalaryComponents(
    companyId,
    employeeId,
    salaryStructureId,
    components
) {

    if (
        !salaryStructureId
    ) {

        throw new Error(
            "Salary structure must be saved before saving components."
        );

    }


    /*
       Soft deactivate existing components.

       This avoids duplicate active
       component records.
    */

    const {
        error:
            deactivateError
    } =
        await supabase
            .from(
                "employee_salary_components"
            )
            .update(
                {

                    is_active:
                        false,

                    updated_at:

                        new Date()
                            .toISOString()

                }
            )
            .eq(
                "salary_structure_id",
                salaryStructureId
            );


    if (
        deactivateError
    ) {

        throw deactivateError;

    }


    /*
       Remove empty component rows
       before inserting.
    */

    const validComponents =
        (
            components ||
            []
        )
            .filter(
                component =>
                    component.component_name &&
                    component.component_name
                        .trim() !== ""
            )
            .map(
                component => ({

                    company_id:

                        companyId,

                    employee_id:

                        employeeId,

                    salary_structure_id:

                        salaryStructureId,

                    component_name:

                        component.component_name
                            .trim(),

                    component_type:

                        component.component_type ||
                        "Earning",

                    calculation_type:

                        component.calculation_type ||
                        "Fixed",

                    amount:

                        Number(
                            component.amount
                        ) || 0,

                    percentage:

                        component.percentage
                            ? Number(
                                component.percentage
                            )
                            : null,

                    is_active:

                        true,

                    remarks:

                        component.remarks ||
                        null,

                    created_at:

                        new Date()
                            .toISOString(),

                    updated_at:

                        new Date()
                            .toISOString()

                })
            );


    if (
        validComponents.length ===
        0
    ) {

        return [];

    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "employee_salary_components"
            )
            .insert(
                validComponents
            )
            .select();


    if (
        error
    ) {

        throw error;

    }


    return data || [];

}


/* =========================================
   SAVE COMPLETE SALARY STRUCTURE
========================================= */

export async function saveCompleteSalaryStructure(
    structureData,
    components
) {

    /*
       Step 1:
       Save structure header
    */

    const savedStructure =
        await saveEmployeeSalaryStructure(
            structureData
        );


    /*
       Step 2:
       Save employee-specific
       additional components
    */

    const savedComponents =
        await saveEmployeeSalaryComponents(

            savedStructure.company_id,

            savedStructure.employee_id,

            savedStructure.id,

            components

        );


    return {

        structure:

            savedStructure,

        components:

            savedComponents

    };

}


/* =========================================
   DEACTIVATE SALARY STRUCTURE
   FOR FUTURE REVISION SUPPORT
========================================= */

export async function deactivateEmployeeSalaryStructure(
    structureId
) {

    const {
        data,
        error
    } =
        await supabase
            .from(
                "employee_salary_structures"
            )
            .update(
                {

                    is_active:
                        false,

                    updated_at:

                        new Date()
                            .toISOString()

                }
            )
            .eq(
                "id",
                structureId
            )
            .select()
            .single();


    if (
        error
    ) {

        throw error;

    }


    return data;

}
