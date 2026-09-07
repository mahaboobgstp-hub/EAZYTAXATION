import React, {
    useEffect,
    useMemo,
    useState
} from "react";
import jsPDF from "jspdf";
import {
    getInvoiceSettings
} from "../../services/invoiceSettingsService";
import { supabase }
from "../../supabase/supabaseClient";

import {
    getAttendanceRegister
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
    const [
    invoiceSettings,
    setInvoiceSettings
] = useState(null);
const [
    selectedEmployee,
    setSelectedEmployee
] = useState(null);


const [
    isEmployeePreviewOpen,
    setIsEmployeePreviewOpen
] = useState(false);

    const [employees, setEmployees] =
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
const loadInvoiceSettings =
    async () => {

        try {

            if (
                !currentCompany?.id
            ) {
                return;
            }


            const data =
                await getInvoiceSettings(
                    currentCompany.id
                );


            setInvoiceSettings(
                data || null
            );

        } catch (error) {

            console.error(
                "Error loading company logo:",
                error
            );

        }

    };
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

useEffect(() => {

    if (
        currentCompany?.id
    ) {

        loadInvoiceSettings();

    }

}, [
    currentCompany?.id
]);
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
    locationResult
] = await Promise.all([

    // Employees
    supabase
        .from("employees")
        .select(`
            id,
            company_id,
            employee_code,
            employee_name,
            department_id,
            designation_id,
            location_id,
            employee_status,
            is_active
        `)
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

    // Departments
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

    // Designations
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

    // Work Locations
    // Locations
supabase
    .from("locations")
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

    } catch (error) {

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

    /* ==========================================
    FILTER EMPLOYEES
========================================== */

const filteredEmployees =
    useMemo(() => {

        return employees.filter(
            employee => {

                /* =========================
                    LOCATION FILTER
                ========================= */

                if (
                    filters.location_id &&
                    employee.location_id !==
                        filters.location_id
                ) {
                    return false;
                }


                /* =========================
                    DEPARTMENT FILTER
                ========================= */

                if (
                    filters.department_id &&
                    employee.department_id !==
                        filters.department_id
                ) {
                    return false;
                }


                /* =========================
                    DESIGNATION FILTER
                ========================= */

                if (
                    filters.designation_id &&
                    employee.designation_id !==
                        filters.designation_id
                ) {
                    return false;
                }


                return true;

            }
        );

    }, [
        employees,
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
    PDF HELPERS
========================================== */

function formatPdfDate(
    date
) {

    if (!date) {
        return "";
    }

    return new Date(
        `${date}T00:00:00`
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function getStatusForPdf(
    employee,
    date
) {

    const record =
        attendanceMap[
            `${employee.id}_${date}`
        ];


    return getAttendanceCode(
        record
    ) || "-";

}

function getPdfStatusStyle(
    status
) {

    if (
        status === "P"
    ) {

        return {
            fill: [
                220,
                252,
                231
            ],

            text: [
                22,
                101,
                52
            ]
        };

    }


    if (
        status === "A"
    ) {

        return {
            fill: [
                254,
                226,
                226
            ],

            text: [
                185,
                28,
                28
            ]
        };

    }


    if (
        status === "H"
    ) {

        return {
            fill: [
                254,
                249,
                195
            ],

            text: [
                133,
                77,
                14
            ]
        };

    }


    if (
        status === "L"
    ) {

        return {
            fill: [
                237,
                233,
                254
            ],

            text: [
                109,
                40,
                217
            ]
        };

    }


    if (
        status === "HD"
    ) {

        return {
            fill: [
                255,
                237,
                213
            ],

            text: [
                194,
                65,
                12
            ]
        };

    }


    return {

        fill: [
            243,
            244,
            246
        ],

        text: [
            156,
            163,
            175
        ]

    };

}
/* ==========================================
    DOWNLOAD FULL REGISTER PDF
========================================== */

async function generateAttendanceRegisterPdf() {

    if (
        filteredEmployees.length === 0
    ) {

        alert(
            "No employees available for the selected filters."
        );

        return;

    }


    let logoData =
        null;


    if (
        invoiceSettings?.show_logo &&
        invoiceSettings?.logo_url
    ) {

        logoData =
            await getImageData(
                invoiceSettings.logo_url
            );

    }


    const pdf =
        new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });


    const pageWidth =
        pdf.internal.pageSize.getWidth();


    const pageHeight =
        pdf.internal.pageSize.getHeight();


    const margin =
        10;


    let y =
    12;


/* ===============================
    COMPANY LOGO
=============================== */

if (
    logoData
) {

    pdf.addImage(
        logoData.data,
        logoData.type,
        margin,
        5,
        18,
        18
    );

}


    /* ===============================
        HEADER
    =============================== */

    pdf.setFontSize(
        16
    );

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.text(
        "ATTENDANCE REGISTER",
        pageWidth / 2,
        y,
        {
            align: "center"
        }
    );


    y += 8;


    pdf.setFontSize(
        10
    );

    pdf.setFont(
        "helvetica",
        "normal"
    );


    pdf.text(
        `Company: ${currentCompany?.company_name || ""}`,
        margin,
        y
    );


    y += 5;


    pdf.text(
        `Period: ${formatPdfDate(filters.from_date)} to ${formatPdfDate(filters.to_date)}`,
        margin,
        y
    );


    y += 5;


    pdf.text(
        `Location: ${selectedLocation?.location_name || "All Locations"}`,
        margin,
        y
    );


    pdf.text(
        `Department: ${selectedDepartment?.department_name || "All Departments"}`,
        pageWidth / 2,
        y
    );


    y += 5;


    pdf.text(
        `Designation: ${selectedDesignation?.designation_name || "All Designations"}`,
        margin,
        y
    );


    y += 8;


    /* ===============================
        CALCULATE COLUMN WIDTH
    =============================== */

    const employeeWidth =
        42;


    const typeWidth =
        12;


    const totalWidth =
        16;


    const availableDateWidth =
        pageWidth -
        (
            margin * 2 +
            employeeWidth +
            typeWidth +
            totalWidth * 3
        );


    const dateWidth =
    availableDateWidth /
    Math.max(
        dates.length,
        1
    );


    const rowHeight =
        6;


    /* ===============================
        TABLE HEADER
    =============================== */

    function drawHeader() {

    let x =
        margin;


    const headerHeight =
        9;


    /* ===============================
        COMMON HEADER STYLE
    =============================== */

    pdf.setDrawColor(
        170,
        180,
        190
    );


    pdf.setTextColor(
        31,
        41,
        55
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );


    /* ===============================
        EMPLOYEE HEADER
    =============================== */

    pdf.setFillColor(
        226,
        232,
        240
    );


    pdf.rect(
        x,
        y,
        employeeWidth,
        headerHeight,
        "FD"
    );


    pdf.setFontSize(
        8
    );


    pdf.text(
        "Employee",
        x + employeeWidth / 2,
        y + 5.8,
        {
            align: "center"
        }
    );


    x +=
        employeeWidth;


    /* ===============================
        TYPE HEADER
    =============================== */

    pdf.setFillColor(
        226,
        232,
        240
    );


    pdf.rect(
        x,
        y,
        typeWidth,
        headerHeight,
        "FD"
    );


    pdf.setFontSize(
        7
    );


    pdf.text(
        "Type",
        x + typeWidth / 2,
        y + 5.8,
        {
            align: "center"
        }
    );


    x +=
        typeWidth;


    /* ===============================
        DATE HEADERS
    =============================== */

    dates.forEach(
        date => {

            pdf.setFillColor(
                241,
                245,
                249
            );


            pdf.setTextColor(
                31,
                41,
                55
            );


            pdf.setDrawColor(
                170,
                180,
                190
            );


            pdf.rect(
                x,
                y,
                dateWidth,
                headerHeight,
                "FD"
            );


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                5.5
            );


            pdf.text(
                formatVerticalDate(
                    date
                ),
                x + dateWidth / 2,
                y + 5.8,
                {
                    align: "center"
                }
            );


            x +=
                dateWidth;

        }
    );


    /* ===============================
        TOTAL HEADERS
    =============================== */

    [
        "WD",
        "OT",
        "Pay"
    ].forEach(
        title => {

            pdf.setFillColor(
                226,
                232,
                240
            );


            pdf.setTextColor(
                31,
                41,
                55
            );


            pdf.setDrawColor(
                170,
                180,
                190
            );


            pdf.rect(
                x,
                y,
                totalWidth,
                headerHeight,
                "FD"
            );


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                6.5
            );


            pdf.text(
                title,
                x + totalWidth / 2,
                y + 5.8,
                {
                    align: "center"
                }
            );


            x +=
                totalWidth;

        }
    );


    /*
        Reset colour for
        employee rows
    */

    pdf.setTextColor(
        31,
        41,
        55
    );


    y +=
        headerHeight;

}


    drawHeader();


    /* ===============================
        EMPLOYEE ROWS
    =============================== */

    filteredEmployees.forEach(
        employee => {

            if (
                y +
                rowHeight * 2 >
                pageHeight - 15
            ) {

                pdf.addPage();

                y =
                    12;


                drawHeader();

            }


            const totals =
                getEmployeeTotals(
                    employee
                );


            let x =
                margin;


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                6
            );


            pdf.rect(
                x,
                y,
                employeeWidth,
                rowHeight * 2
            );


            pdf.text(
                employee.employee_name ||
                "",
                x + 2,
                y + 6
            );


            x +=
                employeeWidth;


            /* ATT ROW */

            pdf.rect(
                x,
                y,
                typeWidth,
                rowHeight
            );


            pdf.text(
                "ATT",
                x + typeWidth / 2,
                y + 4,
                {
                    align: "center"
                }
            );


            x +=
                typeWidth;


           dates.forEach(
    date => {

        const record =
            attendanceMap[
                `${employee.id}_${date}`
            ];


        const status =
            getAttendanceCode(
                record
            );


        const statusStyle =
            getPdfStatusStyle(
                status
            );


        pdf.setFillColor(
            ...statusStyle.fill
        );


        pdf.setDrawColor(
            190,
            190,
            190
        );


        pdf.rect(
            x,
            y,
            dateWidth,
            rowHeight,
            "FD"
        );


        pdf.setTextColor(
            ...statusStyle.text
        );


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            6.5
        );


        pdf.text(
            status || "",
            x + dateWidth / 2,
            y + 4.2,
            {
                align: "center"
            }
        );


        x +=
            dateWidth;

    }
);

                    pdf.setFont(
                        "helvetica",
                        "bold"
                    );


                    pdf.setFontSize(
                        7.5
                    );


                    pdf.text(
                        status,
                        x + dateWidth / 2,
                        y + 4,
                        {
                            align: "center"
                        }
                    );


                    x +=
                        dateWidth;

                }
            );


            [
                totals.workingDays,
                totals.overtimeDays,
                totals.daysPayable
            ].forEach(
                value => {

                    pdf.rect(
                        x,
                        y,
                        totalWidth,
                        rowHeight * 2
                    );


                    pdf.text(
                        String(
                            value
                        ),
                        x + totalWidth / 2,
                        y + 7,
                        {
                            align: "center"
                        }
                    );


                    x +=
                        totalWidth;

                }
            );


            y +=
                rowHeight;


            x =
                margin +
                employeeWidth;


            /* OT ROW */

            pdf.rect(
                x,
                y,
                typeWidth,
                rowHeight
            );


            pdf.text(
                "OT",
                x + typeWidth / 2,
                y + 4,
                {
                    align: "center"
                }
            );


            x +=
                typeWidth;


            dates.forEach(
                date => {

                    const record =
                        attendanceMap[
                            `${employee.id}_${date}`
                        ];


                    const overtime =
    hasOvertime(
        record
    );


if (
    overtime
) {

    pdf.setFillColor(
        219,
        234,
        254
    );


    pdf.setTextColor(
        29,
        78,
        216
    );

}
else {

    pdf.setFillColor(
        243,
        244,
        246
    );


    pdf.setTextColor(
        156,
        163,
        175
    );

}


pdf.setDrawColor(
    190,
    190,
    190
);


pdf.rect(
    x,
    y,
    dateWidth,
    rowHeight,
    "FD"
);


pdf.setFont(
    "helvetica",
    "bold"
);


pdf.setFontSize(
    6.5
);


pdf.text(
    overtime
        ? "P"
        : "",
    x + dateWidth / 2,
    y + 4.2,
    {
        align: "center"
    }
);                       
                    x + dateWidth / 2,
                        y + 4,
                        {
                            align: "center"
                        }
                    


                    x +=
                        dateWidth;

                }
           


            y +=
                rowHeight;

        }
    );


    /* ===============================
        FOOTER
    =============================== */

    const pageCount =
        pdf.getNumberOfPages();


    for (
        let page = 1;
        page <= pageCount;
        page++
    ) {

        pdf.setPage(
            page
        );


        pdf.setFontSize(
            7
        );


        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.text(
            `Generated on ${new Date().toLocaleString("en-IN")}`,
            margin,
            pageHeight - 6
        );


        pdf.text(
            `Page ${page} of ${pageCount}`,
            pageWidth - margin,
            pageHeight - 6,
            {
                align: "right"
            }
        );

    }


    const fileName =
        `Attendance_Register_${filters.from_date}_to_${filters.to_date}.pdf`;


    pdf.save(
        fileName
    );

}


/* ==========================================
    DOWNLOAD SINGLE EMPLOYEE PDF
========================================== */

function generateEmployeeAttendancePdf(
    employee
) {

    if (
        !employee
    ) {
        return;
    }


    const pdf =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });


    const pageWidth =
        pdf.internal.pageSize.getWidth();


    const pageHeight =
        pdf.internal.pageSize.getHeight();


    const margin =
        15;


    let y =
        18;


    /* ===============================
        HEADER
    =============================== */

    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.setFontSize(
        18
    );


    pdf.text(
        "EMPLOYEE ATTENDANCE REPORT",
        pageWidth / 2,
        y,
        {
            align: "center"
        }
    );


    y +=
        12;


    pdf.setFontSize(
        11
    );


    pdf.text(
        `Company: ${currentCompany?.company_name || ""}`,
        margin,
        y
    );


    y +=
        7;


    pdf.text(
        `Employee: ${employee.employee_name || ""}`,
        margin,
        y
    );


    y +=
        7;


    pdf.text(
        `Employee Code: ${employee.employee_code || "-"}`,
        margin,
        y
    );


    y +=
        7;


    pdf.text(
        `Period: ${formatPdfDate(filters.from_date)} to ${formatPdfDate(filters.to_date)}`,
        margin,
        y
    );


    y +=
        10;


    /* ===============================
        TABLE HEADER
    =============================== */

    const dateColumn =
        45;


    const attendanceColumn =
        45;


    const overtimeColumn =
        45;


    const tableWidth =
        dateColumn +
        attendanceColumn +
        overtimeColumn;


    function drawEmployeeTableHeader() {

        pdf.setFillColor(
            230,
            230,
            230
        );


        pdf.rect(
            margin,
            y,
            tableWidth,
            8,
            "F"
        );


        pdf.rect(
            margin,
            y,
            dateColumn,
            8
        );


        pdf.rect(
            margin + dateColumn,
            y,
            attendanceColumn,
            8
        );


        pdf.rect(
            margin +
            dateColumn +
            attendanceColumn,
            y,
            overtimeColumn,
            8
        );


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            9
        );


        pdf.text(
            "Date",
            margin +
            dateColumn / 2,
            y + 5,
            {
                align: "center"
            }
        );


        pdf.text(
            "Attendance",
            margin +
            dateColumn +
            attendanceColumn / 2,
            y + 5,
            {
                align: "center"
            }
        );


        pdf.text(
            "Overtime",
            margin +
            dateColumn +
            attendanceColumn +
            overtimeColumn / 2,
            y + 5,
            {
                align: "center"
            }
        );


        y +=
            8;

    }


    drawEmployeeTableHeader();


    /* ===============================
        DAILY ROWS
    =============================== */

    dates.forEach(
        date => {

            if (
                y >
                pageHeight - 25
            ) {

                pdf.addPage();

                y =
                    18;


                drawEmployeeTableHeader();

            }


            const record =
                attendanceMap[
                    `${employee.id}_${date}`
                ];


            const attendanceCode =
                getAttendanceCode(
                    record
                ) || "-";


            const overtime =
                hasOvertime(
                    record
                )
                    ? "Present"
                    : "-";


            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.setFontSize(
                9
            );


            pdf.rect(
                margin,
                y,
                dateColumn,
                7
            );


            pdf.rect(
                margin + dateColumn,
                y,
                attendanceColumn,
                7
            );


            pdf.rect(
                margin +
                dateColumn +
                attendanceColumn,
                y,
                overtimeColumn,
                7
            );


            pdf.text(
                formatPdfDate(
                    date
                ),
                margin + 3,
                y + 4.5
            );


            pdf.text(
                attendanceCode,
                margin +
                dateColumn +
                attendanceColumn / 2,
                y + 4.5,
                {
                    align: "center"
                }
            );


            pdf.text(
                overtime,
                margin +
                dateColumn +
                attendanceColumn +
                overtimeColumn / 2,
                y + 4.5,
                {
                    align: "center"
                }
            );


            y +=
                7;

        }
    );


    y +=
        8;


    const totals =
        getEmployeeTotals(
            employee
        );


    /* ===============================
        SUMMARY
    =============================== */

    if (
        y >
        pageHeight - 45
    ) {

        pdf.addPage();

        y =
            20;

    }


    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.setFontSize(
        12
    );


    pdf.text(
        "Attendance Summary",
        margin,
        y
    );


    y +=
        8;


    pdf.setFontSize(
        10
    );


    pdf.text(
        `Working Days: ${totals.workingDays}`,
        margin,
        y
    );


    y +=
        6;


    pdf.text(
        `Overtime Days: ${totals.overtimeDays}`,
        margin,
        y
    );


    y +=
        6;


    pdf.text(
        `Days Payable: ${totals.daysPayable}`,
        margin,
        y
    );


    /* ===============================
        FOOTER
    =============================== */

    const pageCount =
        pdf.getNumberOfPages();


    for (
        let page = 1;
        page <= pageCount;
        page++
    ) {

        pdf.setPage(
            page
        );


        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            7
        );


        pdf.text(
            `Generated on ${new Date().toLocaleString("en-IN")}`,
            margin,
            pageHeight - 8
        );


        pdf.text(
            `Page ${page} of ${pageCount}`,
            pageWidth - margin,
            pageHeight - 8,
            {
                align: "right"
            }
        );

    }


    const safeEmployeeName =
        (
            employee.employee_name ||
            "Employee"
        )
            .replace(
                /[^a-z0-9]/gi,
                "_"
            );


    pdf.save(
        `Attendance_${safeEmployeeName}_${filters.from_date}_to_${filters.to_date}.pdf`
    );

}


/* ==========================================
    PDF BUTTON HANDLERS
========================================== */

const handleDownloadRegisterPdf = () => {

    generateAttendanceRegisterPdf();

};


const handleDownloadEmployeePdf = (
    employee
) => {

    generateEmployeeAttendancePdf(
        employee
    );

};
    const handleEmployeeClick = (
    employee
) => {

    setSelectedEmployee(
        employee
    );

    setIsEmployeePreviewOpen(
        true
    );

};
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
                    <button
    type="button"
    onClick={
        handleDownloadRegisterPdf
    }
    disabled={
        loading ||
        filteredEmployees.length === 0
    }
>
    Download Register PDF
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
    className="employee-name-cell"
>

    <button
        type="button"
        className="employee-name-button"
        onClick={() =>
            handleEmployeeClick(
                employee
            )
        }
    >
        {employee.employee_name}
    </button>

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
                        {/* ===============================
                EMPLOYEE ATTENDANCE PREVIEW
            =============================== */}

            {
                isEmployeePreviewOpen &&
                selectedEmployee && (

                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            background:
                                "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            zIndex: 9999
                        }}
                    >

                        <div
                            style={{
                                background:
                                    "#ffffff",
                                width:
                                    "600px",
                                maxWidth:
                                    "90vw",
                                maxHeight:
                                    "85vh",
                                overflowY:
                                    "auto",
                                padding:
                                    "25px",
                                borderRadius:
                                    "8px"
                            }}
                        >

                            <h2>
                                Employee Attendance Preview
                            </h2>


                            <p>

                                <strong>
                                    Employee:
                                </strong>

                                {" "}

                                {
                                    selectedEmployee
                                        .employee_name
                                }

                            </p>


                            <p>

                                <strong>
                                    Employee Code:
                                </strong>

                                {" "}

                                {
                                    selectedEmployee
                                        .employee_code ||
                                    "-"
                                }

                            </p>


                            <p>

                                <strong>
                                    Period:
                                </strong>

                                {" "}

                                {
                                    formatPdfDate(
                                        filters.from_date
                                    )
                                }

                                {" to "}

                                {
                                    formatPdfDate(
                                        filters.to_date
                                    )
                                }

                            </p>


                            <table
                                style={{
                                    width:
                                        "100%",

                                    borderCollapse:
                                        "collapse",

                                    marginTop:
                                        "20px"
                                }}
                            >

                                <thead>

                                    <tr>

                                        <th
                                            style={{
                                                border:
                                                    "1px solid #ccc",
                                                padding:
                                                    "8px"
                                            }}
                                        >
                                            Date
                                        </th>


                                        <th
                                            style={{
                                                border:
                                                    "1px solid #ccc",
                                                padding:
                                                    "8px"
                                            }}
                                        >
                                            Attendance
                                        </th>


                                        <th
                                            style={{
                                                border:
                                                    "1px solid #ccc",
                                                padding:
                                                    "8px"
                                            }}
                                        >
                                            Overtime
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        dates.map(
                                            date => {

                                                const record =
                                                    attendanceMap[
                                                        `${selectedEmployee.id}_${date}`
                                                    ];


                                                return (

                                                    <tr
                                                        key={
                                                            date
                                                        }
                                                    >

                                                        <td
                                                            style={{
                                                                border:
                                                                    "1px solid #ccc",
                                                                padding:
                                                                    "8px"
                                                            }}
                                                        >

                                                            {
                                                                formatPdfDate(
                                                                    date
                                                                )
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border:
                                                                    "1px solid #ccc",
                                                                padding:
                                                                    "8px",
                                                                textAlign:
                                                                    "center"
                                                            }}
                                                        >

                                                            {
                                                                getAttendanceCode(
                                                                    record
                                                                ) || "-"
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border:
                                                                    "1px solid #ccc",
                                                                padding:
                                                                    "8px",
                                                                textAlign:
                                                                    "center"
                                                            }}
                                                        >

                                                            {
                                                                hasOvertime(
                                                                    record
                                                                )
                                                                    ? "Present"
                                                                    : "-"
                                                            }

                                                        </td>

                                                    </tr>

                                                );

                                            }
                                        )
                                    }

                                </tbody>

                            </table>


                            <div
                                style={{
                                    marginTop:
                                        "20px",

                                    display:
                                        "flex",

                                    gap:
                                        "10px"
                                }}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownloadEmployeePdf(
                                            selectedEmployee
                                        )
                                    }
                                >

                                    Download PDF

                                </button>


                                <button
                                    type="button"
                                    onClick={() => {

                                        setIsEmployeePreviewOpen(
                                            false
                                        );

                                        setSelectedEmployee(
                                            null
                                        );

                                    }}
                                >

                                    Close

                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </div>

    );

}


export default AttendanceRegister;
