import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import { supabase }
from "../../supabase/supabaseClient";

import {
    getAttendanceRegister,
    getWorkLocations
} from "../../services/hr/attendanceService";

import {
    useCompany
} from "../../context/CompanyContext";
import "../../css/hr/AttendanceRegister.css";


function AttendanceRegister() {

    const {
        currentCompany
    } = useCompany();
    
    const companyId =
    currentCompany?.id;


    const [loading, setLoading] =
        useState(false);


    const [employees, setEmployees] =
        useState([]);
    const [deployments, setDeployments] =
    useState([]);


    const [attendance, setAttendance] =
        useState([]);


    const [locations, setLocations] =
        useState([]);


    const [departments, setDepartments] =
        useState([]);


    const [designations, setDesignations] =
        useState([]);


    const [filters, setFilters] =
        useState({

            from_date: "",
            to_date: "",

            location_id: "",

            department_id: "",

            designation_id: ""

        });

    /* ==========================================
        DEFAULT MONTH
    ========================================== */

    useEffect(() => {

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const firstDay =
            `${year}-${month}-01`;


        const lastDay =
            new Date(
                year,
                today.getMonth() + 1,
                0
            )
                .toISOString()
                .split("T")[0];


        setFilters(
            previous => ({

                ...previous,

                from_date:
                    previous.from_date ||
                    firstDay,

                to_date:
                    previous.to_date ||
                    lastDay

            })
        );

    }, []);


    /* ==========================================
        LOAD MASTER DATA
    ========================================== */

    useEffect(() => {

        if (
            !currentCompany?.id
        ) {
            return;
        }


        loadMasters();

    }, [
        currentCompany?.id
    ]);


    async function loadMasters() {

    try {

       const [
    employeeResult,
    departmentResult,
    designationResult,
    locationResult,
    deploymentResult
] =
            await Promise.all([

                supabase
                    .from("employees")
                    .select("*")
                    .eq(
                        "company_id",
                        currentCompany.id
                    )
                    .order(
                        "employee_name",
                        {
                            ascending: true
                        }
                    ),

                supabase
                    .from("departments")
                    .select("*")
                    .eq(
                        "company_id",
                        currentCompany.id
                    )
                    .order(
                        "department_name",
                        {
                            ascending: true
                        }
                    ),

                supabase
                    .from("designations")
                    .select("*")
                    .eq(
                        "company_id",
                        currentCompany.id
                    )
                    .order(
                        "designation_name",
                        {
                            ascending: true
                        }
                    ),

                supabase
                    .from("work_locations")
                    .select(`
                        id,
                        company_id,
                        location_code,
                        location_name,
                        is_active
                    `)
                    .eq(
                        "company_id",
                        currentCompany.id
                    )
                    .eq(
                        "is_active",
                        true
                    )
                    .order(
                        "location_name",
                        {
                            ascending: true
                        }
                    ),
                supabase
    .from("employee_deployments")
    .select(`
        id,
        employee_id,
        work_location_id,
        effective_from,
        effective_to,
        is_active
    `)
    .eq(
        "company_id",
        currentCompany.id
    )
    .eq(
        "is_active",
        true
    )

            ]);


        if (employeeResult.error) {
            throw employeeResult.error;
        }


        if (departmentResult.error) {
            throw departmentResult.error;
        }


        if (designationResult.error) {
            throw designationResult.error;
        }


        if (locationResult.error) {
            throw locationResult.error;
        }
if (deploymentResult.error) {
    throw deploymentResult.error;
}

        setEmployees(
            employeeResult.data || []
        );


        setDepartments(
            departmentResult.data || []
        );


        setDesignations(
            designationResult.data || []
        );


        setLocations(
            locationResult.data || []
        );

setDeployments(
    deploymentResult.data || []
);
    }
        
    catch (error) {

        console.error(
            "Error loading register masters:",
            error
        );

        alert(
            error.message ||
            "Unable to load register masters."
        );

    }

}

    /* ==========================================
        LOAD REGISTER
    ========================================== */

    async function loadRegister() {

        if (
            !currentCompany?.id
        ) {
            return;
        }


        if (
            !filters.from_date ||
            !filters.to_date
        ) {
            alert(
                "Please select From Date and To Date."
            );

            return;
        }


        try {

            setLoading(
                true
            );


            const data =
                await getAttendanceRegister(
                    currentCompany.id,
                    filters.from_date,
                    filters.to_date
                );


            setAttendance(
                data
            );

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to load attendance register."
            );

        }

        finally {

            setLoading(
                false
            );

        }

    }


    /* ==========================================
        AUTO LOAD WHEN DATE CHANGES
    ========================================== */

    useEffect(() => {

        if (
            currentCompany?.id &&
            filters.from_date &&
            filters.to_date
        ) {

            loadRegister();

        }

    }, [
        currentCompany?.id,
        filters.from_date,
        filters.to_date
    ]);


    /* ==========================================
        FILTER CHANGE
    ========================================== */

    function handleFilterChange(
        event
    ) {

        const {
            name,
            value
        } =
            event.target;


        setFilters(
            previous => ({

                ...previous,

                [name]:
                    value

            })
        );

    }


    /* ==========================================
        DATE RANGE
    ========================================== */

    const dates =
        useMemo(() => {

            if (
                !filters.from_date ||
                !filters.to_date
            ) {
                return [];
            }


            const result = [];


            const current =
                new Date(
                    `${filters.from_date}T00:00:00`
                );


            const end =
                new Date(
                    `${filters.to_date}T00:00:00`
                );


            while (
                current <= end
            ) {

                result.push(
                    current
                        .toISOString()
                        .split("T")[0]
                );


                current.setDate(
                    current.getDate() + 1
                );

            }


            return result;

        }, [
            filters.from_date,
            filters.to_date
        ]);


    /* ==========================================
        FILTER EMPLOYEES
    ========================================== */

    const filteredEmployees =
        useMemo(() => {

            return employees.filter(
                employee => {


                    if (
                        filters.department_id &&
                        employee.department_id !==
                        filters.department_id
                    ) {
                        return false;
                    }


                    if (
                        filters.designation_id &&
                        employee.designation_id !==
                        filters.designation_id
                    ) {
                        return false;
                    }


                    /*
                        Location filtering uses
                        attendance work_location_id.

                        This ensures register reflects
                        actual attendance location.
                    */

                   if (
    filters.location_id
) {

    const deployment =
        deployments.find(
            item =>
                item.employee_id ===
                    employee.id &&

                item.location_id ===
                    filters.location_id &&

                item.is_active === true
        );


    if (!deployment) {
        return false;
    }

}

                    return true;

                }
            );

        }, [
           employees,
    deployments,
    filters
        ]);


    /* ==========================================
        ATTENDANCE LOOKUP
    ========================================== */

    const attendanceMap =
        useMemo(() => {

            const map = {};


            attendance.forEach(
                record => {

                    const key =
                        `${record.employee_id}_${record.attendance_date}`;


                    map[key] =
                        record;

                }
            );


            return map;

        }, [
            attendance
        ]);


    /* ==========================================
        STATUS CODE
    ========================================== */

    function getAttendanceCode(
        record
    ) {

        if (
            !record
        ) {
            return "";
        }


        const status =
            (
                record.attendance_status ||
                ""
            )
                .toLowerCase();


        if (
            status === "present"
        ) {
            return "P";
        }


        if (
            status === "absent"
        ) {
            return "A";
        }


        if (
            status === "holiday"
        ) {
            return "H";
        }


        if (
            status === "leave"
        ) {
            return "L";
        }


        if (
            status === "half day"
        ) {
            return "HD";
        }


        return "";
    }


    /* ==========================================
        STATUS CLASS
    ========================================== */

    function getAttendanceClass(
        record
    ) {

        if (
            !record
        ) {
            return "attendance-empty";
        }


        const status =
            (
                record.attendance_status ||
                ""
            )
                .toLowerCase();


        if (
            status === "present"
        ) {
            return "attendance-present";
        }


        if (
            status === "absent"
        ) {
            return "attendance-absent";
        }


        if (
            status === "holiday"
        ) {
            return "attendance-holiday";
        }


        if (
            status === "leave"
        ) {
            return "attendance-leave";
        }


        if (
            status === "half day"
        ) {
            return "attendance-halfday";
        }


        return "attendance-empty";
    }


    /* ==========================================
        OVERTIME
    ========================================== */

    function hasOvertime(
        record
    ) {

        if (
            !record
        ) {
            return false;
        }


        return (

            record.is_overtime ===
            true

            ||

            Number(
                record.overtime_shift_count ||
                0
            ) > 0

            ||

            Number(
                record.overtime_hours ||
                0
            ) > 0

        );

    }


    /* ==========================================
        TOTALS
    ========================================== */

    function getEmployeeTotals(
        employee
    ) {

        let workingDays = 0;

        let overtimeDays = 0;


        dates.forEach(
            date => {

                const record =
                    attendanceMap[
                        `${employee.id}_${date}`
                    ];


                if (
                    !record
                ) {
                    return;
                }


                /*
                    Use the value actually stored
                    in attendance.

                    1   = full day
                    0.5 = half day
                    0   = non-payable day
                */

                workingDays +=
                    Number(
                        record.attendance_day_value ||
                        0
                    );


                if (
                    hasOvertime(
                        record
                    )
                ) {

                    overtimeDays +=
                        Number(
                            record.overtime_shift_count ||
                            1
                        );

                }

            }
        );


        return {

            workingDays,

            overtimeDays,

            daysPayable:
                workingDays +
                overtimeDays

        };

    }


    /* ==========================================
        DATE FORMAT
    ========================================== */

    function formatVerticalDate(
        date
    ) {

        const value =
            new Date(
                `${date}T00:00:00`
            );


        const day =
            String(
                value.getDate()
            ).padStart(
                2,
                "0"
            );


        const month =
            value
                .toLocaleString(
                    "en-IN",
                    {
                        month: "short"
                    }
                )
                .toUpperCase();


        const year =
            String(
                value.getFullYear()
            ).slice(-2);


        return `${day}${month}${year}`;

    }


    /* ==========================================
        FILTER LABELS
    ========================================== */

    const selectedLocation =
        locations.find(
            item =>
                item.id ===
                filters.location_id
        );


    const selectedDepartment =
        departments.find(
            item =>
                item.id ===
                filters.department_id
        );


    const selectedDesignation =
        designations.find(
            item =>
                item.id ===
                filters.designation_id
        );


    /* ==========================================
        RENDER
    ========================================== */

    return (

        <div
            style={{
                padding: "25px"
            }}
        >

            <h2>
                Attendance Register
            </h2>


            <p>

                Company:

                {" "}

                <strong>

                    {
                        currentCompany
                            ?.company_name
                    }

                </strong>

            </p>


            {/* ===============================
                FILTERS
            =============================== */}

            <div
                style={{
                    display: "flex",
                    gap: "15px",
                    flexWrap: "wrap",
                    marginBottom: "20px"
                }}
            >

                <div>

                    <label>
                        From Date
                    </label>

                    <br />

                    <input
                        type="date"
                        name="from_date"
                        value={
                            filters.from_date
                        }
                        onChange={
                            handleFilterChange
                        }
                    />

                </div>


                <div>

                    <label>
                        To Date
                    </label>

                    <br />

                    <input
                        type="date"
                        name="to_date"
                        value={
                            filters.to_date
                        }
                        onChange={
                            handleFilterChange
                        }
                    />

                </div>


                <div>

                    <label>
                        Location
                    </label>

                    <br />

                    <select
                        name="location_id"
                        value={
                            filters.location_id
                        }
                        onChange={
                            handleFilterChange
                        }
                    >

                        <option value="">
                            All Locations
                        </option>


                        {
                            locations.map(
                                location => (

                                    <option
                                        key={
                                            location.id
                                        }
                                        value={
                                            location.id
                                        }
                                    >

                                        {
                                            location.location_name
                                        }

                                    </option>

                                )
                            )
                        }

                    </select>

                </div>


                <div>

                    <label>
                        Department
                    </label>

                    <br />

                    <select
                        name="department_id"
                        value={
                            filters.department_id
                        }
                        onChange={
                            handleFilterChange
                        }
                    >

                        <option value="">
                            All Departments
                        </option>


                        {
                            departments.map(
                                department => (

                                    <option
                                        key={
                                            department.id
                                        }
                                        value={
                                            department.id
                                        }
                                    >

                                        {
                                            department.department_name
                                        }

                                    </option>

                                )
                            )
                        }

                    </select>

                </div>


                <div>

                    <label>
                        Designation
                    </label>

                    <br />

                    <select
                        name="designation_id"
                        value={
                            filters.designation_id
                        }
                        onChange={
                            handleFilterChange
                        }
                    >

                        <option value="">
                            All Designations
                        </option>


                        {
                            designations.map(
                                designation => (

                                    <option
                                        key={
                                            designation.id
                                        }
                                        value={
                                            designation.id
                                        }
                                    >

                                        {
                                            designation.designation_name
                                        }

                                    </option>

                                )
                            )
                        }

                    </select>

                </div>


                <div
                    style={{
                        display: "flex",
                        alignItems: "end"
                    }}
                >

                    <button
                        type="button"
                        onClick={
                            loadRegister
                        }
                        disabled={
                            loading
                        }
                    >

                        {
                            loading
                                ? "Loading..."
                                : "View Register"
                        }

                    </button>

                </div>

            </div>


            {/* ===============================
                FILTER SUMMARY
            =============================== */}

            <div
                style={{
                    marginBottom: "15px"
                }}
            >

                <strong>
                    Filters:
                </strong>

                {" "}

                Location:
                {" "}

                {
                    selectedLocation
                        ?.location_name ||
                    "All Locations"
                }

                {" | "}

                Department:
                {" "}

                {
                    selectedDepartment
                        ?.department_name ||
                    "All Departments"
                }

                {" | "}

                Designation:
                {" "}

                {
                    selectedDesignation
                        ?.designation_name ||
                    "All Designations"
                }

            </div>


            {/* ===============================
                REGISTER GRID
            =============================== */}

            <div
                style={{
                    overflowX: "auto",
                    border:
                        "1px solid #ccc"
                }}
            >

                <table
                    style={{
                        borderCollapse:
                            "collapse",

                        width:
                            "100%",

                        minWidth:
                            `${dates.length * 48 + 500}px`
                    }}
                >

                    <thead>

                        <tr>

                            <th
                                style={{
                                    border:
                                        "1px solid #ccc",
                                    padding:
                                        "8px",
                                    minWidth:
                                        "180px"
                                }}
                            >
                                Employee Name
                            </th>


                            <th
                                style={{
                                    border:
                                        "1px solid #ccc",
                                    padding:
                                        "8px",
                                    minWidth:
                                        "75px"
                                }}
                            >
                                Type
                            </th>


                            {
                                dates.map(
                                    date => (

                                        <th
                                            key={date}
                                            style={{
                                                border:
                                                    "1px solid #ccc",

                                                width:
                                                    "42px",

                                                minWidth:
                                                    "42px",

                                                height:
                                                    "100px",

                                                padding:
                                                    "0",

                                                verticalAlign:
                                                    "bottom"
                                            }}
                                        >

                                            <div
                                                style={{
                                                    writingMode:
                                                        "vertical-rl",

                                                    transform:
                                                        "rotate(180deg)",

                                                    margin:
                                                        "auto",

                                                    padding:
                                                        "8px 0"
                                                }}
                                            >

                                                {
                                                    formatVerticalDate(
                                                        date
                                                    )
                                                }

                                            </div>

                                        </th>

                                    )
                                )
                            }


                            <th
                                style={{
                                    border:
                                        "1px solid #ccc",
                                    padding:
                                        "8px"
                                }}
                            >
                                Working Days
                            </th>


                            <th
                                style={{
                                    border:
                                        "1px solid #ccc",
                                    padding:
                                        "8px"
                                }}
                            >
                                Total OT
                            </th>


                            <th
                                style={{
                                    border:
                                        "1px solid #ccc",
                                    padding:
                                        "8px"
                                }}
                            >
                                Days Payable
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {
                            filteredEmployees.map(
                                employee => {

                                    const totals =
                                        getEmployeeTotals(
                                            employee
                                        );


                                    return (

                                        <React.Fragment
                                            key={
                                                employee.id
                                            }
                                        >

                                            {/* ===================
                                                ATTENDANCE ROW
                                            =================== */}

                                            <tr>

                                                <td
                                                    rowSpan="2"
                                                    style={{
                                                        border:
                                                            "1px solid #ccc",

                                                        padding:
                                                            "8px",

                                                        fontWeight:
                                                            "600",

                                                        verticalAlign:
                                                            "middle"
                                                    }}
                                                >

                                                    {
                                                        employee.employee_name
                                                    }

                                                </td>


                                                <td
                                                    style={{
                                                        border:
                                                            "1px solid #ccc",

                                                        padding:
                                                            "6px",

                                                        fontWeight:
                                                            "600"
                                                    }}
                                                >
                                                    ATT
                                                </td>


                                                {
                                                    dates.map(
                                                        date => {

                                                            const record =
                                                                attendanceMap[
                                                                    `${employee.id}_${date}`
                                                                ];


                                                            return (

                                                                <td
                                                                    key={
                                                                        date
                                                                    }
                                                                    className={
                                                                        getAttendanceClass(
                                                                            record
                                                                        )
                                                                    }
                                                                    style={{
                                                                        border:
                                                                            "1px solid #ccc",

                                                                        textAlign:
                                                                            "center",

                                                                        fontWeight:
                                                                            "700"
                                                                    }}
                                                                >

                                                                    {
                                                                        getAttendanceCode(
                                                                            record
                                                                        )
                                                                    }

                                                                </td>

                                                            );

                                                        }
                                                    )
                                                }


                                                <td
                                                    rowSpan="2"
                                                    style={{
                                                        border:
                                                            "1px solid #ccc",

                                                        textAlign:
                                                            "center",

                                                        fontWeight:
                                                            "700",

                                                        verticalAlign:
                                                            "middle"
                                                    }}
                                                >

                                                    {
                                                        totals
                                                            .workingDays
                                                    }

                                                </td>


                                                <td
                                                    rowSpan="2"
                                                    style={{
                                                        border:
                                                            "1px solid #ccc",

                                                        textAlign:
                                                            "center",

                                                        fontWeight:
                                                            "700",

                                                        verticalAlign:
                                                            "middle"
                                                    }}
                                                >

                                                    {
                                                        totals
                                                            .overtimeDays
                                                    }

                                                </td>


                                                <td
                                                    rowSpan="2"
                                                    style={{
                                                        border:
                                                            "1px solid #ccc",

                                                        textAlign:
                                                            "center",

                                                        fontWeight:
                                                            "700",

                                                        verticalAlign:
                                                            "middle"
                                                    }}
                                                >

                                                    {
                                                        totals
                                                            .daysPayable
                                                    }

                                                </td>

                                            </tr>


                                            {/* ===================
                                                OT ROW
                                            =================== */}

                                            <tr>

                                                <td
                                                    style={{
                                                        border:
                                                            "1px solid #ccc",

                                                        padding:
                                                            "6px",

                                                        fontWeight:
                                                            "600"
                                                    }}
                                                >
                                                    OT
                                                </td>


                                                {
                                                    dates.map(
                                                        date => {

                                                            const record =
                                                                attendanceMap[
                                                                    `${employee.id}_${date}`
                                                                ];


                                                            const overtime =
                                                                hasOvertime(
                                                                    record
                                                                );


                                                            return (

                                                                <td
                                                                    key={
                                                                        date
                                                                    }
                                                                    style={{
                                                                        border:
                                                                            "1px solid #ccc",

                                                                        textAlign:
                                                                            "center",

                                                                        fontWeight:
                                                                            "700",

                                                                        background:
                                                                            overtime
                                                                                ? "#dbeafe"
                                                                                : "#f3f4f6",

                                                                        color:
                                                                            overtime
                                                                                ? "#1d4ed8"
                                                                                : "#b0b0b0"
                                                                    }}
                                                                >

                                                                    {
                                                                        overtime
                                                                            ? "P"
                                                                            : ""
                                                                    }

                                                                </td>

                                                            );

                                                        }
                                                    )
                                                }

                                            </tr>

                                        </React.Fragment>

                                    );

                                }
                            )
                        }

                    </tbody>

                </table>

            </div>


            {/* ===============================
                TEMPORARY LEGEND
            =============================== */}

            <div
                style={{
                    marginTop:
                        "20px"
                }}
            >

                <strong>
                    Legend:
                </strong>

                {" "}

                P = Present |

                {" "}

                A = Absent |

                {" "}

                H = Holiday |

                {" "}

                L = Leave |

                {" "}

                HD = Half Day |

                {" "}

                OT P = Overtime

            </div>

        </div>

    );

}


export default AttendanceRegister;
