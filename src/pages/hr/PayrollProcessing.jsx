import React, {
    useEffect,
    useState
} from "react";

import {
    useCompany
} from "../../context/CompanyContext";

import {
    getActiveEmployees
} from "../../services/hr/employeeService";

import {
    getEmployeeSalaryStructure
} from "../../services/hr/salaryStructureService";

import {
    getAttendanceRegister
} from "../../services/hr/attendanceService";

import {
    getPayrollPeriod,
    calculateEmployeePayroll,
    calculatePayrollTotals
} from "../../services/hr/payrollCalculationService";



function PayrollProcessing() {


    // =============================================
    // COMPANY
    // =============================================

    const {

        currentCompany,
        currentCompanyId,
        loading: companyLoading

    } = useCompany();



    // =============================================
    // CURRENT DATE DEFAULTS
    // =============================================

    const today =
        new Date();


    const [payrollYear, setPayrollYear] =
        useState(
            today.getFullYear()
        );


    const [payrollMonth, setPayrollMonth] =
        useState(
            today.getMonth() + 1
        );



    // =============================================
    // DATA
    // =============================================

    const [payrollEmployees, setPayrollEmployees] =
        useState([]);


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [selectedEmployee, setSelectedEmployee] =
        useState(null);



    // =============================================
    // RESET WHEN COMPANY CHANGES
    // =============================================

    useEffect(() => {

        setPayrollEmployees([]);

        setSelectedEmployee(null);

        setError("");

    }, [
        currentCompanyId
    ]);



    // =============================================
    // PAYROLL PERIOD
    // =============================================

    const payrollPeriod =
        getPayrollPeriod(

            payrollYear,

            payrollMonth

        );



    // =============================================
    // MONTH NAMES
    // =============================================

    const months = [

        {
            value: 1,
            label: "January"
        },

        {
            value: 2,
            label: "February"
        },

        {
            value: 3,
            label: "March"
        },

        {
            value: 4,
            label: "April"
        },

        {
            value: 5,
            label: "May"
        },

        {
            value: 6,
            label: "June"
        },

        {
            value: 7,
            label: "July"
        },

        {
            value: 8,
            label: "August"
        },

        {
            value: 9,
            label: "September"
        },

        {
            value: 10,
            label: "October"
        },

        {
            value: 11,
            label: "November"
        },

        {
            value: 12,
            label: "December"
        }

    ];



    // =============================================
    // FORMAT DATE
    // =============================================

    const formatDate = (
        date
    ) => {

        if (
            !date
        ) {

            return "";

        }


        const parts =
            date.split(
                "-"
            );


        if (
            parts.length !== 3
        ) {

            return date;

        }


        return `${

            parts[2]

        }-${

            parts[1]

        }-${

            parts[0]

        }`;

    };



    // =============================================
    // FORMAT CURRENCY
    // =============================================

    const formatCurrency = (
        value
    ) => {

        const amount =
            Number(
                value || 0
            );


        return amount.toLocaleString(
            "en-IN",
            {

                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2

            }
        );

    };



    // =============================================
    // GET ATTENDANCE TOTALS
    // =============================================
    //
    // Uses the actual fields from your attendance table:
    //
    // attendance_day_value
    // overtime_shift_count
    //
    // For now:
    //
    // Working Days =
    // SUM(attendance_day_value)
    //
    // Overtime Days =
    // SUM(overtime_shift_count)
    //
    // Payable Days =
    // Working Days
    //
    // OT remains separately calculated.
    // =============================================

    const getAttendanceTotals = (
        employeeId,
        attendanceRecords
    ) => {

        const employeeAttendance =
            attendanceRecords.filter(

                record =>
                    record.employee_id ===
                    employeeId

            );


        let workingDays =
            0;


        let overtimeDays =
            0;


        employeeAttendance.forEach(

            record => {

                workingDays +=
                    Number(

                        record.attendance_day_value ??
                        0

                    );


                overtimeDays +=
                    Number(

                        record.overtime_shift_count ??
                        0

                    );

            }

        );


        return {

            working_days:
                workingDays,

            overtime_days:
                overtimeDays,

            payable_days:
                workingDays

        };

    };



    // =============================================
    // CALCULATE PAYROLL
    // =============================================

    const handleCalculatePayroll =
        async () => {

            try {

                setLoading(
                    true
                );


                setError(
                    ""
                );


                setPayrollEmployees(
                    []
                );


                setSelectedEmployee(
                    null
                );


                // ---------------------------------
                // VALIDATE COMPANY
                // ---------------------------------

                if (
                    !currentCompanyId
                ) {

                    throw new Error(

                        "Please select a Current Company."

                    );

                }



                // ---------------------------------
                // GET ACTIVE EMPLOYEES
                // ---------------------------------

                const employees =
                    await getActiveEmployees(

                        currentCompanyId

                    );



                if (
                    !employees ||
                    employees.length === 0
                ) {

                    setPayrollEmployees(
                        []
                    );


                    return;

                }



                // ---------------------------------
                // GET ATTENDANCE FOR MONTH
                // ---------------------------------

                const attendanceRecords =
                    await getAttendanceRegister(

                        currentCompanyId,

                        payrollPeriod.period_from,

                        payrollPeriod.period_to

                    );



                // ---------------------------------
                // PROCESS EMPLOYEES
                // ---------------------------------

                const calculatedEmployees =
                    [];


                for (

                    const employee
                    of employees

                ) {

                    // -----------------------------
                    // GET ACTIVE SALARY STRUCTURE
                    // -----------------------------

                    const salaryStructure =
                        await getEmployeeSalaryStructure(

                            employee.id

                        );


                    // -----------------------------
                    // SKIP EMPLOYEE IF SALARY
                    // STRUCTURE DOES NOT EXIST
                    // -----------------------------

                    if (
                        !salaryStructure
                    ) {

                        calculatedEmployees.push(

                            {

                                employee,

                                salaryStructure:
                                    null,

                                attendance:
                                    getAttendanceTotals(

                                        employee.id,

                                        attendanceRecords

                                    ),

                                payroll:
                                    null,

                                error:

                                    "Salary Structure is not available."

                            }

                        );


                        continue;

                    }



                    // -----------------------------
                    // ATTENDANCE TOTALS
                    // -----------------------------

                    const attendance =
                        getAttendanceTotals(

                            employee.id,

                            attendanceRecords

                        );



                    // -----------------------------
                    // CALCULATE PAYROLL
                    // -----------------------------

                    const payroll =
                        calculateEmployeePayroll(

                            employee,

                            salaryStructure,

                            attendance,

                            payrollYear,

                            payrollMonth,

                            {

                                overtime_rate:
                                    0,

                                professional_tax:
                                    0,

                                tds_deduction:
                                    0,

                                other_deductions:
                                    0,

                                reimbursement_amount:
                                    0,

                                additional_earnings:
                                    0

                            }

                        );



                    // -----------------------------
                    // ADD TO RESULT
                    // -----------------------------

                    calculatedEmployees.push(

                        {

                            employee,

                            salaryStructure,

                            attendance,

                            payroll,

                            error:
                                null

                        }

                    );

                }



                // ---------------------------------
                // UPDATE UI
                // ---------------------------------

                setPayrollEmployees(

                    calculatedEmployees

                );


            }

            catch (
                error
            ) {

                console.error(
                    "Payroll calculation error:",
                    error
                );


                setError(

                    error.message ||

                    "Unable to calculate payroll."

                );


            }

            finally {

                setLoading(
                    false
                );

            }

        };



    // =============================================
    // VALID PAYROLL ROWS
    // =============================================

    const validPayrollRows =
        payrollEmployees

            .filter(

                item =>
                    item.payroll

            )

            .map(

                item =>
                    item.payroll

            );



    // =============================================
    // PAYROLL TOTALS
    // =============================================

    const payrollTotals =
        calculatePayrollTotals(

            validPayrollRows

        );



    // =============================================
    // PAGE
    // =============================================

    return (

        <div
            style={{

                padding:
                    "24px"

            }}
        >


            {/* =====================================
                PAGE TITLE
            ===================================== */}

            <div
                style={{

                    marginBottom:
                        "24px"

                }}
            >

                <h2>

                    Payroll Processing

                </h2>


                <div
                    style={{

                        color:
                            "#666",

                        marginTop:
                            "6px"

                    }}
                >

                    {

                        currentCompany
                            ? currentCompany.company_name
                            : ""

                    }

                </div>

            </div>



            {/* =====================================
                PAYROLL FILTER
            ===================================== */}

            <div
                style={{

                    border:
                        "1px solid #ddd",

                    padding:
                        "20px",

                    marginBottom:
                        "24px",

                    borderRadius:
                        "8px"

                }}
            >

                <div
                    style={{

                        display:
                            "flex",

                        gap:
                            "16px",

                        alignItems:
                            "flex-end",

                        flexWrap:
                            "wrap"

                    }}
                >


                    {/* MONTH */}

                    <div>

                        <label>

                            Payroll Month

                        </label>


                        <br />


                        <select

                            value={
                                payrollMonth
                            }

                            onChange={
                                event =>
                                    setPayrollMonth(

                                        Number(
                                            event.target.value
                                        )

                                    )
                            }

                            style={{

                                marginTop:
                                    "6px",

                                padding:
                                    "8px",

                                minWidth:
                                    "150px"

                            }}

                        >

                            {

                                months.map(

                                    month => (

                                        <option

                                            key={
                                                month.value
                                            }

                                            value={
                                                month.value
                                            }

                                        >

                                            {
                                                month.label
                                            }

                                        </option>

                                    )

                                )

                            }

                        </select>

                    </div>



                    {/* YEAR */}

                    <div>

                        <label>

                            Year

                        </label>


                        <br />


                        <input

                            type="number"

                            value={
                                payrollYear
                            }

                            onChange={
                                event =>
                                    setPayrollYear(

                                        Number(
                                            event.target.value
                                        )

                                    )
                            }

                            style={{

                                marginTop:
                                    "6px",

                                padding:
                                    "8px",

                                width:
                                    "100px"

                            }}

                        />

                    </div>



                    {/* PERIOD FROM */}

                    <div>

                        <label>

                            Period From

                        </label>


                        <br />


                        <input

                            type="text"

                            readOnly

                            value={
                                formatDate(

                                    payrollPeriod.period_from

                                )
                            }

                            style={{

                                marginTop:
                                    "6px",

                                padding:
                                    "8px",

                                width:
                                    "120px",

                                background:
                                    "#f5f5f5"

                            }}

                        />

                    </div>



                    {/* PERIOD TO */}

                    <div>

                        <label>

                            Period To

                        </label>


                        <br />


                        <input

                            type="text"

                            readOnly

                            value={
                                formatDate(

                                    payrollPeriod.period_to

                                )
                            }

                            style={{

                                marginTop:
                                    "6px",

                                padding:
                                    "8px",

                                width:
                                    "120px",

                                background:
                                    "#f5f5f5"

                            }}

                        />

                    </div>



                    {/* CALCULATE */}

                    <div>

                        <button

                            type="button"

                            onClick={
                                handleCalculatePayroll
                            }

                            disabled={

                                loading ||

                                companyLoading ||

                                !currentCompanyId

                            }

                            style={{

                                padding:
                                    "10px 20px",

                                cursor:
                                    "pointer"

                            }}

                        >

                            {

                                loading
                                    ? "Calculating..."
                                    : "Calculate Payroll"

                            }

                        </button>

                    </div>


                </div>

            </div>



            {/* =====================================
                ERROR
            ===================================== */}

            {

                error &&

                (

                    <div
                        style={{

                            color:
                                "red",

                            marginBottom:
                                "20px"

                        }}
                    >

                        {
                            error
                        }

                    </div>

                )

            }



            {/* =====================================
                SUMMARY
            ===================================== */}

            {

                payrollEmployees.length > 0 &&

                (

                    <div
                        style={{

                            display:
                                "grid",

                            gridTemplateColumns:

                                "repeat(auto-fit, minmax(180px, 1fr))",

                            gap:
                                "16px",

                            marginBottom:
                                "24px"

                        }}
                    >


                        {/* EMPLOYEES */}

                        <div
                            style={{

                                border:
                                    "1px solid #ddd",

                                padding:
                                    "16px",

                                borderRadius:
                                    "8px"

                            }}
                        >

                            <div>

                                Total Employees

                            </div>


                            <h3>

                                {
                                    payrollTotals.total_employees
                                }

                            </h3>

                        </div>



                        {/* GROSS */}

                        <div
                            style={{

                                border:
                                    "1px solid #ddd",

                                padding:
                                    "16px",

                                borderRadius:
                                    "8px"

                            }}
                        >

                            <div>

                                Gross Earnings

                            </div>


                            <h3>

                                ₹ {

                                    formatCurrency(

                                        payrollTotals.total_gross_salary

                                    )

                                }

                            </h3>

                        </div>



                        {/* DEDUCTIONS */}

                        <div
                            style={{

                                border:
                                    "1px solid #ddd",

                                padding:
                                    "16px",

                                borderRadius:
                                    "8px"

                            }}
                        >

                            <div>

                                Total Deductions

                            </div>


                            <h3>

                                ₹ {

                                    formatCurrency(

                                        payrollTotals.total_deductions

                                    )

                                }

                            </h3>

                        </div>



                        {/* NET */}

                        <div
                            style={{

                                border:
                                    "1px solid #ddd",

                                padding:
                                    "16px",

                                borderRadius:
                                    "8px"

                            }}
                        >

                            <div>

                                Net Payable

                            </div>


                            <h3>

                                ₹ {

                                    formatCurrency(

                                        payrollTotals.total_net_salary

                                    )

                                }

                            </h3>

                        </div>


                    </div>

                )

            }



            {/* =====================================
                PAYROLL TABLE
            ===================================== */}

            {

                payrollEmployees.length > 0 &&

                (

                    <div
                        style={{

                            overflowX:
                                "auto"

                        }}
                    >

                        <table
                            style={{

                                width:
                                    "100%",

                                borderCollapse:
                                    "collapse",

                                minWidth:
                                    "1250px"

                            }}
                        >

                            <thead>

                                <tr>

                                    <th>
                                        Code
                                    </th>

                                    <th>
                                        Employee
                                    </th>

                                    <th>
                                        Monthly Salary
                                    </th>

                                    <th>
                                        Working Days
                                    </th>

                                    <th>
                                        OT Days
                                    </th>

                                    <th>
                                        Payable Days
                                    </th>

                                    <th>
                                        Gross
                                    </th>

                                    <th>
                                        PF
                                    </th>

                                    <th>
                                        ESI
                                    </th>

                                    <th>
                                        PT
                                    </th>

                                    <th>
                                        TDS
                                    </th>

                                    <th>
                                        Other Deduction
                                    </th>

                                    <th>
                                        Net Salary
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {

                                    payrollEmployees.map(

                                        (
                                            item,
                                            index
                                        ) => (

                                            <tr

                                                key={

                                                    item.employee.id

                                                }

                                                onClick={

                                                    () =>

                                                        setSelectedEmployee(

                                                            item

                                                        )

                                                }

                                                style={{

                                                    cursor:
                                                        "pointer"

                                                }}

                                            >


                                                <td>

                                                    {

                                                        item.employee
                                                            .employee_code

                                                    }

                                                </td>


                                                <td>

                                                    {

                                                        item.employee
                                                            .employee_name

                                                    }

                                                </td>



                                                {

                                                    item.payroll

                                                        ? (

                                                            <>

                                                                <td>

                                                                    ₹ {

                                                                        formatCurrency(

                                                                            item.payroll
                                                                                .monthly_salary

                                                                        )

                                                                    }

                                                                </td>


                                                                <td>

                                                                    {

                                                                        item.payroll
                                                                            .working_days

                                                                    }

                                                                </td>


                                                                <td>

                                                                    {

                                                                        item.payroll
                                                                            .overtime_days

                                                                    }

                                                                </td>


                                                                <td>

                                                                    {

                                                                        item.payroll
                                                                            .payable_days

                                                                    }

                                                                </td>


                                                                <td>

                                                                    ₹ {

                                                                        formatCurrency(

                                                                            item.payroll
                                                                                .gross_earnings

                                                                        )

                                                                    }

                                                                </td>


                                                                <td>

                                                                    ₹ {

                                                                        formatCurrency(

                                                                            item.payroll
                                                                                .pf_deduction

                                                                        )

                                                                    }

                                                                </td>


                                                                <td>

                                                                    ₹ {

                                                                        formatCurrency(

                                                                            item.payroll
                                                                                .esi_deduction

                                                                        )

                                                                    }

                                                                </td>


                                                                <td>

                                                                    ₹ {

                                                                        formatCurrency(

                                                                            item.payroll
                                                                                .professional_tax

                                                                        )

                                                                    }

                                                                </td>


                                                                <td>

                                                                    ₹ {

                                                                        formatCurrency(

                                                                            item.payroll
                                                                                .tds_deduction

                                                                        )

                                                                    }

                                                                </td>


                                                                <td>

                                                                    ₹ {

                                                                        formatCurrency(

                                                                            item.payroll
                                                                                .other_deductions

                                                                        )

                                                                    }

                                                                </td>


                                                                <td>

                                                                    <strong>

                                                                        ₹ {

                                                                            formatCurrency(

                                                                                item.payroll
                                                                                    .net_salary

                                                                            )

                                                                        }

                                                                    </strong>

                                                                </td>

                                                            </>

                                                        )

                                                        : (

                                                            <td

                                                                colSpan="11"

                                                                style={{

                                                                    color:
                                                                        "red"

                                                                }}

                                                            >

                                                                {

                                                                    item.error

                                                                }

                                                            </td>

                                                        )

                                                }


                                            </tr>

                                        )

                                    )

                                
                                }
                                

                            </tbody>



                            {/* =================================
                                TOTAL ROW
                            ================================= */}

                            <tfoot>

                                <tr>

                                    <th
                                        colSpan="6"
                                    >

                                        TOTAL

                                    </th>


                                    <th>

                                        ₹ {

                                            formatCurrency(

                                                payrollTotals
                                                    .total_gross_salary

                                            )

                                        }

                                    </th>


                                    <th
                                        colSpan="5"
                                    >

                                        Total Deductions:

                                        {" "}

                                        ₹ {

                                            formatCurrency(

                                                payrollTotals
                                                    .total_deductions

                                            )

                                        }

                                    </th>


                                    <th>

                                        ₹ {

                                            formatCurrency(

                                                payrollTotals
                                                    .total_net_salary

                                            )

                                        }

                                    </th>

                                </tr>

                            </tfoot>


                        </table>

                    </div>

                )

            }



            {/* =====================================
                EMPLOYEE PAYROLL DETAILS
            ===================================== */}

            {

                selectedEmployee &&

                selectedEmployee.payroll &&

                (

                    <div
                        style={{

                            position:
                                "fixed",

                            top:
                                0,

                            left:
                                0,

                            right:
                                0,

                            bottom:
                                0,

                            background:
                                "rgba(0,0,0,0.4)",

                            display:
                                "flex",

                            justifyContent:
                                "center",

                            alignItems:
                                "center",

                            zIndex:
                                999

                        }}
                    >

                        <div
                            style={{

                                background:
                                    "#fff",

                                padding:
                                    "24px",

                                width:
                                    "700px",

                                maxWidth:
                                    "95%",

                                maxHeight:
                                    "90vh",

                                overflowY:
                                    "auto",

                                borderRadius:
                                    "8px"

                            }}
                        >


                            <div
                                style={{

                                    display:
                                        "flex",

                                    justifyContent:
                                        "space-between",

                                    marginBottom:
                                        "20px"

                                }}
                            >

                                <h3>

                                    {

                                        selectedEmployee
                                            .employee
                                            .employee_name

                                    }

                                    {" "}

                                    - Payroll Details

                                </h3>


                                <button

                                    type="button"

                                    onClick={

                                        () =>

                                            setSelectedEmployee(

                                                null

                                            )

                                    }

                                >

                                    Close

                                </button>

                            </div>



                            {/* ATTENDANCE */}

                            <h4>

                                Attendance

                            </h4>


                            <table
                                style={{

                                    width:
                                        "100%"

                                }}
                            >

                                <tbody>

                                    <tr>

                                        <td>
                                            Calendar Days
                                        </td>

                                        <td>

                                            {

                                                selectedEmployee
                                                    .payroll
                                                    .calendar_days

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            Working Days
                                        </td>

                                        <td>

                                            {

                                                selectedEmployee
                                                    .payroll
                                                    .working_days

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            OT Days
                                        </td>

                                        <td>

                                            {

                                                selectedEmployee
                                                    .payroll
                                                    .overtime_days

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            Payable Days
                                        </td>

                                        <td>

                                            {

                                                selectedEmployee
                                                    .payroll
                                                    .payable_days

                                            }

                                        </td>

                                    </tr>

                                </tbody>

                            </table>



                            {/* EARNINGS */}

                            <h4>

                                Earnings

                            </h4>


                            <table
                                style={{

                                    width:
                                        "100%"

                                }}
                            >

                                <tbody>

                                    <tr>

                                        <td>
                                            Earned Basic
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .earned_basic

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            Earned HRA
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .earned_hra

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            Special Allowance
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .earned_special_allowance

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            Other Allowance
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .earned_other_allowance

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            Overtime Amount
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .overtime_amount

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <th>
                                            Gross Earnings
                                        </th>

                                        <th>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .gross_earnings

                                                )

                                            }

                                        </th>

                                    </tr>

                                </tbody>

                            </table>



                            {/* DEDUCTIONS */}

                            <h4>

                                Deductions

                            </h4>


                            <table
                                style={{

                                    width:
                                        "100%"

                                }}
                            >

                                <tbody>

                                    <tr>

                                        <td>
                                            PF
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .pf_deduction

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            ESI
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .esi_deduction

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            Professional Tax
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .professional_tax

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            TDS
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .tds_deduction

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td>
                                            Other Deductions
                                        </td>

                                        <td>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .other_deductions

                                                )

                                            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <th>
                                            Total Deductions
                                        </th>

                                        <th>

                                            ₹ {

                                                formatCurrency(

                                                    selectedEmployee
                                                        .payroll
                                                        .total_deductions

                                                )

                                            }

                                        </th>

                                    </tr>

                                </tbody>

                            </table>



                            {/* FINAL */}

                            <div
                                style={{

                                    marginTop:
                                        "24px",

                                    padding:
                                        "16px",

                                    border:
                                        "1px solid #ddd"

                                }}
                            >

                                <strong>

                                    NET SALARY

                                </strong>


                                <h2>

                                    ₹ {

                                        formatCurrency(

                                            selectedEmployee
                                                .payroll
                                                .net_salary

                                        )

                                    }

                                </h2>

                            </div>


                        </div>

                    </div>

                )

            }


        </div>

    );

}


export default PayrollProcessing;
