// =====================================================
// PAYROLL CALCULATION SERVICE
// =====================================================
//
// This file contains payroll calculation logic only.
//
// It does NOT:
// - Call Supabase
// - Save data
// - Update UI
//
// It receives:
// Employee
// Salary Structure
// Attendance Totals
// Payroll Period
//
// And returns a complete payroll calculation.
// =====================================================



// =====================================================
// NUMBER HELPER
// =====================================================

function toNumber(
    value
) {

    const number =
        Number(
            value || 0
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}



// =====================================================
// ROUND TO 2 DECIMALS
// =====================================================

function roundAmount(
    value
) {

    return Math.round(
        (
            toNumber(
                value
            ) +
            Number.EPSILON
        ) *
        100
    ) / 100;

}



// =====================================================
// GET DAYS IN PAYROLL MONTH
// =====================================================

export function getDaysInMonth(
    year,
    month
) {

    if (
        !year ||
        !month
    ) {

        return 0;

    }


    return new Date(

        Number(year),

        Number(month),

        0

    ).getDate();

}



// =====================================================
// GET PAYROLL PERIOD
// =====================================================

export function getPayrollPeriod(
    year,
    month
) {

    if (
        !year ||
        !month
    ) {

        return {

            period_from:
                null,

            period_to:
                null,

            calendar_days:
                0

        };

    }


    const monthNumber =
        String(
            month
        ).padStart(
            2,
            "0"
        );


    const calendarDays =
        getDaysInMonth(
            year,
            month
        );


    const lastDay =
        String(
            calendarDays
        ).padStart(
            2,
            "0"
        );


    return {

        period_from:
            `${year}-${monthNumber}-01`,

        period_to:
            `${year}-${monthNumber}-${lastDay}`,

        calendar_days:
            calendarDays

    };

}



// =====================================================
// GET PAYROLL DAY RATE
// =====================================================

export function calculateDailyRate(
    monthlySalary,
    calendarDays
) {

    const salary =
        toNumber(
            monthlySalary
        );


    const days =
        toNumber(
            calendarDays
        );


    if (
        days <= 0
    ) {

        return 0;

    }


    return roundAmount(
        salary /
        days
    );

}



// =====================================================
// CALCULATE EARNED SALARY COMPONENT
// =====================================================

export function calculateEarnedComponent(
    monthlyComponent,
    payableDays,
    calendarDays
) {

    const componentAmount =
        toNumber(
            monthlyComponent
        );


    const payable =
        toNumber(
            payableDays
        );


    const days =
        toNumber(
            calendarDays
        );


    if (
        days <= 0
    ) {

        return 0;

    }


    return roundAmount(

        (
            componentAmount /
            days
        ) *
        payable

    );

}



// =====================================================
// CALCULATE ATTENDANCE DEDUCTION
// =====================================================
//
// Monthly Salary
// - Earned Salary
// = Attendance Deduction
// =====================================================

export function calculateAttendanceDeduction(
    monthlySalary,
    earnedSalary
) {

    const salary =
        toNumber(
            monthlySalary
        );


    const earned =
        toNumber(
            earnedSalary
        );


    const deduction =
        salary -
        earned;


    return roundAmount(
        deduction > 0
            ? deduction
            : 0
    );

}



// =====================================================
// PF CALCULATION
// =====================================================
//
// IMPORTANT:
//
// Rates are configurable here.
//
// Current implementation uses the rate constants below.
// If company payroll policy requires a different basis,
// only this calculation section needs to be changed.
// =====================================================


     
function requirePolicyNumber(policyData, fieldName) {
    const value = policyData?.[fieldName];

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === "" ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
    ) {
        throw new Error(
            `Statutory policy setting "${fieldName}" is missing or invalid. ` +
            "Review the company's statutory policy package."
        );
    }

    return Number(value);
}

function requirePolicyBoolean(policyData, fieldName) {
    if (typeof policyData?.[fieldName] !== "boolean") {
        throw new Error(
            `Statutory policy setting "${fieldName}" must be configured.`
        );
    }

    return policyData[fieldName];
}

function applyWageCeiling(wages, ceiling) {
    const amount = toNumber(wages);

    // Null ceiling means no configured ceiling.
    if (ceiling === null) {
        return amount;
    }

    return Math.min(amount, ceiling);
}

// Package-aware PF calculation.
// EPS/EDLI and administrative charges are deliberately handled
// separately after their policy definitions are confirmed.
export function calculatePF(
    basicAmount,
    isApplicable,
    options = {}
) {
    const policy = options.statutory_policy_package;

    if (!policy || typeof policy !== "object") {
        throw new Error(
            "A statutory policy package is required for PF calculation."
        );
    }

    const policyData = policy.policy_data || policy;

    const employeeApplicable = requirePolicyBoolean(
        policyData,
        "epf_employee_applicable"
    );

    const employerApplicable = requirePolicyBoolean(
        policyData,
        "epf_employer_applicable"
    );

    const employeeRate = requirePolicyNumber(
        policyData,
        "epf_employee_rate"
    );

    const employerRate = requirePolicyNumber(
        policyData,
        "epf_employer_total_rate"
    );

    const employeeCeiling = requirePolicyNumber(
        policyData,
        "epf_employee_wage_ceiling"
    );

    const employerCeiling = requirePolicyNumber(
        policyData,
        "epf_employer_wage_ceiling"
    );

    const employeeBase = policyData.epf_employee_calculation_base;
    const employerBase = policyData.epf_employer_calculation_base;

    if (
        !["BASIC", "BASIC_DA"].includes(employeeBase) ||
        !["BASIC", "BASIC_DA"].includes(employerBase)
    ) {
        throw new Error(
            "PF calculation currently supports BASIC or BASIC_DA only. " +
            "Review the configured PF calculation bases."
        );
    }

    if (!isApplicable) {
        return {
            employee_pf: 0,
            employer_pf: 0,
            employee_pf_wage: 0,
            employer_pf_wage: 0
        };
    }

    const employeeWage = applyWageCeiling(
        basicAmount,
        employeeCeiling
    );

    const employerWage = applyWageCeiling(
        basicAmount,
        employerCeiling
    );

    return {
        employee_pf: employeeApplicable
            ? roundAmount(employeeWage * employeeRate / 100)
            : 0,

        employer_pf: employerApplicable
            ? roundAmount(employerWage * employerRate / 100)
            : 0,

        employee_pf_wage: employeeApplicable ? employeeWage : 0,
        employer_pf_wage: employerApplicable ? employerWage : 0
    };
}

// Package-aware ESI calculation.
// This checks the configured wage ceiling; the applicable wage
// definition and statutory eligibility must be validated separately.
export function calculateESI(
    grossAmount,
    isApplicable,
    options = {}
) {
    const policy = options.statutory_policy_package;

    if (!policy || typeof policy !== "object") {
        throw new Error(
            "A statutory policy package is required for ESI calculation."
        );
    }

    const policyData = policy.policy_data || policy;

    const employeeApplicable = requirePolicyBoolean(
        policyData,
        "esi_employee_applicable"
    );

    const employerApplicable = requirePolicyBoolean(
        policyData,
        "esi_employer_applicable"
    );

    const employeeRate = requirePolicyNumber(
        policyData,
        "esi_employee_rate"
    );

    const employerRate = requirePolicyNumber(
        policyData,
        "esi_employer_rate"
    );

    const employeeCeiling = requirePolicyNumber(
        policyData,
        "esi_employee_wage_ceiling"
    );

    const employerCeiling = requirePolicyNumber(
        policyData,
        "esi_employer_wage_ceiling"
    );

    if (!isApplicable) {
        return {
            employee_esi: 0,
            employer_esi: 0,
            employee_esi_wage: 0,
            employer_esi_wage: 0
        };
    }

    const employeeWage = applyWageCeiling(
        grossAmount,
        employeeCeiling
    );

    const employerWage = applyWageCeiling(
        grossAmount,
        employerCeiling
    );

    return {
        employee_esi: employeeApplicable
            ? roundAmount(employeeWage * employeeRate / 100)
            : 0,

        employer_esi: employerApplicable
            ? roundAmount(employerWage * employerRate / 100)
            : 0,

        employee_esi_wage: employeeApplicable ? employeeWage : 0,
        employer_esi_wage: employerApplicable ? employerWage : 0
    };
}



// =====================================================
// PROFESSIONAL TAX
// =====================================================
//
// Currently passed from the Payroll UI / configuration.
//
// We will later create State-wise PT configuration.
//
// For now:
//
// options.professional_tax
// =====================================================

export function calculateProfessionalTax(
    isApplicable,
    options = {}
) {

    if (
        !isApplicable
    ) {

        return 0;

    }


    return roundAmount(

        options.professional_tax ??
        0

    );

}



// =====================================================
// TDS
// =====================================================
//
// Currently passed from Payroll UI / configuration.
//
// Full annual Income Tax calculation will be developed
// separately.
// =====================================================

export function calculateTDS(
    isApplicable,
    options = {}
) {

    if (
        !isApplicable
    ) {

        return 0;

    }


    return roundAmount(

        options.tds_deduction ??
        0

    );

}



// =====================================================
// OVERTIME CALCULATION
// =====================================================
//
// Current implementation:
//
// OT amount is optional.
//
// The payroll module can later support:
//
// 1. Per Day
// 2. Per Hour
// 3. Fixed Rate
// 4. Double Rate
// 5. Company-specific OT Policy
// =====================================================

export function calculateOvertimeAmount(
    overtimeDays,
    options = {}
) {

    const overtime =
        toNumber(
            overtimeDays
        );


    if (
        overtime <= 0
    ) {

        return 0;

    }


    const overtimeRate =
        toNumber(

            options.overtime_rate ??
            0

        );


    return roundAmount(

        overtime *
        overtimeRate

    );

}



// =====================================================
// MAIN PAYROLL CALCULATION
// =====================================================

export function calculateEmployeePayroll(
    employee,
    salaryStructure,
    attendance,
    payrollYear,
    payrollMonth,
    options = {}
) {

    // =============================================
    // VALIDATION
    // =============================================

    if (
        !employee
    ) {

        throw new Error(
            "Employee data is missing."
        );

    }


    if (
        !salaryStructure
    ) {

        throw new Error(
            `Salary Structure is missing for ${

                employee.employee_name ||
                "Employee"

            }.`
        );

    }



    // =============================================
    // PAYROLL PERIOD
    // =============================================

    const period =
        getPayrollPeriod(
            payrollYear,
            payrollMonth
        );


    const calendarDays =
        toNumber(
            period.calendar_days
        );



    // =============================================
    // ATTENDANCE
    // =============================================

    const workingDays =
        toNumber(

            attendance?.working_days ??
            attendance?.workingDays ??
            0

        );


    const overtimeDays =
        toNumber(

            attendance?.overtime_days ??
            attendance?.overtimeDays ??
            0

        );


    const payableDays =
        toNumber(

            attendance?.payable_days ??
            attendance?.daysPayable ??
            attendance?.days_payable ??
            workingDays

        );



    // =============================================
    // SALARY STRUCTURE
    // =============================================

    const monthlySalary =
        toNumber(
            salaryStructure.monthly_salary
        );


    const basicAmount =
        toNumber(
            salaryStructure.basic_amount
        );


    const hraAmount =
        toNumber(
            salaryStructure.hra_amount
        );


    const specialAllowance =
        toNumber(
            salaryStructure.special_allowance
        );


    const otherAllowance =
        toNumber(
            salaryStructure.other_allowance
        );



    // =============================================
    // EARNED SALARY COMPONENTS
    // =============================================

    const earnedBasic =
        calculateEarnedComponent(

            basicAmount,

            payableDays,

            calendarDays

        );


    const earnedHRA =
        calculateEarnedComponent(

            hraAmount,

            payableDays,

            calendarDays

        );


    const earnedSpecialAllowance =
        calculateEarnedComponent(

            specialAllowance,

            payableDays,

            calendarDays

        );


    const earnedOtherAllowance =
        calculateEarnedComponent(

            otherAllowance,

            payableDays,

            calendarDays

        );



    // =============================================
    // EARNED GROSS SALARY
    // =============================================

    const earnedSalary =
        roundAmount(

            earnedBasic +

            earnedHRA +

            earnedSpecialAllowance +

            earnedOtherAllowance

        );



    // =============================================
    // ATTENDANCE DEDUCTION
    // =============================================

    const attendanceDeduction =
        calculateAttendanceDeduction(

            monthlySalary,

            earnedSalary

        );



    // =============================================
    // OVERTIME
    // =============================================

    const overtimeAmount =
        calculateOvertimeAmount(

            overtimeDays,

            options

        );



    // =============================================
    // GROSS EARNINGS
    // =============================================

    const grossEarnings =
        roundAmount(

            earnedSalary +

            overtimeAmount +

            toNumber(
                options.additional_earnings
            )

        );




    // =============================================
    // PF
    // =============================================

    const pfCalculation = calculatePF(
        earnedBasic,
        salaryStructure.is_pf_applicable,
        options
    );





    // =============================================
    // ESI
    // =============================================

    const esiCalculation = calculateESI(
        grossEarnings,
        salaryStructure.is_esi_applicable,
        options
    );




    // =============================================
    // PROFESSIONAL TAX
    // =============================================

    const professionalTax =
        calculateProfessionalTax(

            salaryStructure.is_pt_applicable,

            options

        );



    // =============================================
    // TDS
    // =============================================

    const tdsDeduction =
        calculateTDS(

            salaryStructure.is_tds_applicable,

            options

        );



    // =============================================
    // OTHER DEDUCTIONS
    // =============================================

    const otherDeductions =
        toNumber(

            options.other_deductions

        );



    // =============================================
    // TOTAL DEDUCTIONS
    // =============================================

    const totalDeductions =
        roundAmount(

            pfCalculation.employee_pf +

            esiCalculation.employee_esi +

            professionalTax +

            tdsDeduction +

            otherDeductions

        );



    // =============================================
    // EMPLOYER CONTRIBUTION
    // =============================================

    const totalEmployerContribution =
        roundAmount(

            pfCalculation.employer_pf +

            esiCalculation.employer_esi

        );



    // =============================================
    // REIMBURSEMENTS
    // =============================================

    const reimbursementAmount =
        toNumber(

            options.reimbursement_amount

        );



    // =============================================
    // NET SALARY
    // =============================================

    const netSalary =
        roundAmount(

            grossEarnings +

            reimbursementAmount -

            totalDeductions

        );



    // =============================================
    // RETURN COMPLETE PAYROLL RECORD
    // =============================================

    return {

        // -----------------------------------------
        // EMPLOYEE
        // -----------------------------------------

        employee_id:
            employee.id,

        salary_structure_id:
            salaryStructure.id ||

            null,

        employee_code:
            employee.employee_code ||

            null,

        employee_name:
            employee.employee_name ||

            null,


        // -----------------------------------------
        // PAYROLL PERIOD
        // -----------------------------------------

        payroll_year:
            Number(
                payrollYear
            ),

        payroll_month:
            Number(
                payrollMonth
            ),

        period_from:
            period.period_from,

        period_to:
            period.period_to,


        // -----------------------------------------
        // STATUTORY POLICY AUDIT REFERENCE
        // -----------------------------------------

        statutory_policy_package_id:
            options.statutory_policy_package?.id || null,

        statutory_policy_package_version:
            options.statutory_policy_package?.version_number ?? null,

        // -----------------------------------------
        // ORIGINAL SALARY
        // -----------------------------------------

        monthly_salary:
            monthlySalary,

        basic_amount:
            basicAmount,

        hra_amount:
            hraAmount,

        special_allowance:
            specialAllowance,

        other_allowance:
            otherAllowance,


        // -----------------------------------------
        // ATTENDANCE
        // -----------------------------------------

        calendar_days:
            calendarDays,

        working_days:
            workingDays,

        overtime_days:
            overtimeDays,

        payable_days:
            payableDays,


        // -----------------------------------------
        // ATTENDANCE / OT
        // -----------------------------------------

        attendance_deduction:
            attendanceDeduction,

        overtime_amount:
            overtimeAmount,


        // -----------------------------------------
        // EARNED COMPONENTS
        // -----------------------------------------

        earned_basic:
            earnedBasic,

        earned_hra:
            earnedHRA,

        earned_special_allowance:
            earnedSpecialAllowance,

        earned_other_allowance:
            earnedOtherAllowance,


        // -----------------------------------------
        // EARNINGS
        // -----------------------------------------

        gross_earnings:
            grossEarnings,


        // -----------------------------------------
        // DEDUCTIONS
        // -----------------------------------------

        pf_deduction:
            pfCalculation.employee_pf,

        esi_deduction:
            esiCalculation.employee_esi,

        professional_tax:
            professionalTax,

        tds_deduction:
            tdsDeduction,

        other_deductions:
            otherDeductions,

        total_deductions:
            totalDeductions,


        // -----------------------------------------
        // EMPLOYER CONTRIBUTION
        // -----------------------------------------

        employer_pf:
            pfCalculation.employer_pf,

        employer_esi:
            esiCalculation.employer_esi,
        
        pf_employee_wage:
            pfCalculation.employee_pf_wage,

        pf_employer_wage:
            pfCalculation.employer_pf_wage,

        esi_employee_wage:
            esiCalculation.employee_esi_wage,

        esi_employer_wage:
            esiCalculation.employer_esi_wage,


        total_employer_contribution:
            totalEmployerContribution,


        // -----------------------------------------
        // REIMBURSEMENT
        // -----------------------------------------

        reimbursement_amount:
            reimbursementAmount,


        // -----------------------------------------
        // FINAL PAY
        // -----------------------------------------

        net_salary:
            netSalary,


        // -----------------------------------------
        // STATUS
        // -----------------------------------------

        payroll_status:
            "Draft",

        remarks:
            options.remarks ||

            null

    };

}



// =====================================================
// CALCULATE MULTIPLE EMPLOYEES
// =====================================================

export function calculatePayrollForEmployees(
    employees,
    payrollYear,
    payrollMonth,
    options = {}
) {

    if (
        !Array.isArray(
            employees
        )
    ) {

        return [];

    }


    return employees.map(
        item => {

            return calculateEmployeePayroll(

                item.employee,

                item.salaryStructure,

                item.attendance,

                payrollYear,

                payrollMonth,

                item.options ||
                options

            );

        }
    );

}



// =====================================================
// CALCULATE PAYROLL TOTALS
// =====================================================

export function calculatePayrollTotals(
    payrollEmployees
) {

    const rows =
        Array.isArray(
            payrollEmployees
        )

            ? payrollEmployees

            : [];


    return rows.reduce(

        (
            totals,
            employee
        ) => {

            totals.total_employees +=
                1;


            totals.total_gross_salary +=
                toNumber(
                    employee.gross_earnings
                );


            totals.total_deductions +=
                toNumber(
                    employee.total_deductions
                );


            totals.total_net_salary +=
                toNumber(
                    employee.net_salary
                );


            totals.total_employer_contribution +=
                toNumber(
                    employee.total_employer_contribution
                );


            return totals;

        },

        {

            total_employees:
                0,

            total_gross_salary:
                0,

            total_deductions:
                0,

            total_net_salary:
                0,

            total_employer_contribution:
                0

        }

    );

}
