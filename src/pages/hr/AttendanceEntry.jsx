import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import { useCompany } from "../../context/CompanyContext";

import {
    getActiveEmployees,
    getDepartments,
    getDesignations
} from "../../services/hr/employeeService";

import {
    getAttendance,
    getEmployeeDeployments,
    bulkSaveAttendance
} from "../../services/hr/attendanceService";

import {
    getAttendanceSettings
} from "../../services/hr/attendanceSettingsService";
import {
    getLocations
} from "../../services/hr/locationService";

function AttendanceEntry() {

    const { currentCompany } = useCompany();

    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [deployments, setDeployments] = useState([]);
    const [existingAttendance, setExistingAttendance] =
        useState([]);

    const [attendanceSettings, setAttendanceSettings] =
        useState(null);
    

    const [attendanceDate, setAttendanceDate] =
        useState(
            new Date().toISOString().split("T")[0]
        );

    const [filters, setFilters] = useState({
        location_id: "",
        department_id: "",
        designation_id: ""
    });

    const [rows, setRows] = useState({});

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isAttendanceLocked, setIsAttendanceLocked] =
    useState(false);
const [editingEmployeeId, setEditingEmployeeId] =
    useState(null);
    const [isEditMode, setIsEditMode] =
    useState(false);


    useEffect(() => {

        if (!currentCompany?.id) {

            setEmployees([]);
            setDepartments([]);
            setDesignations([]);
            setLocations([]);
            setDeployments([]);
            setExistingAttendance([]);
            setRows({});
            setAttendanceSettings(null);

            return;
        }

        loadCompanyData();

    }, [currentCompany]);


    useEffect(() => {

        if (!currentCompany?.id) {
            return;
        }

        loadAttendanceForDate();

    }, [
        currentCompany,
        attendanceDate
    ]);
async function handleUpdateEmployee(employee) {

    if (!currentCompany?.id) {
        return;
    }

    try {

        setSaving(true);

        const row =
            rows[employee.id] || {};

        const mode =
            attendanceSettings
                ?.attendance_mode ||
            "DAY";

        const deployment =
            getActiveDeployment(
                employee.id
            );

        let record;


        if (mode === "DAY") {

            const overtimeYes =
                attendanceSettings
                    ?.overtime_enabled &&
                row.overtime === "Yes";

            record = {

                employee_id:
                    employee.id,

                attendance_date:
                    attendanceDate,

                attendance_mode:
                    "DAY",

                attendance_status:
                    row.attendance_status ||
                    "Present",

                attendance_day_value:
                    getAttendanceDayValue(
                        row.attendance_status
                    ),

                overtime_shift_count:
                    overtimeYes
                        ? 1
                        : 0,

                is_overtime:
                    overtimeYes,

                deployment_id:
                    deployment?.id ||
                    null,

                client_id:
                    deployment?.client_id ||
                    null,

                work_location_id:
                    employee.location_id ||
                    null,

                shift_id:
                    employee.default_shift_id ||
                    null,

                check_in_time:
                    null,

                check_out_time:
                    null,

                working_hours:
                    null,

                overtime_hours:
                    0,

                overtime_start_time:
                    null,

                overtime_end_time:
                    null,

                remarks:
                    null
            };

        } else {

            const workingHours =
                calculateDuration(
                    row.check_in_time,
                    row.check_out_time
                );

            const overtimeHours =
                calculateDuration(
                    row.overtime_start_time,
                    row.overtime_end_time
                ) || 0;


            record = {

                employee_id:
                    employee.id,

                attendance_date:
                    attendanceDate,

                attendance_mode:
                    "TIMING",

                attendance_status:
                    row.attendance_status ||
                    "Present",

                attendance_day_value:
                    getAttendanceDayValue(
                        row.attendance_status
                    ),

                overtime_shift_count:
                    0,

                deployment_id:
                    deployment?.id ||
                    null,

                client_id:
                    deployment?.client_id ||
                    null,

                work_location_id:
                    employee.location_id ||
                    null,

                shift_id:
                    employee.default_shift_id ||
                    null,

                check_in_time:
                    row.check_in_time
                        ? `${attendanceDate}T${row.check_in_time}`
                        : null,

                check_out_time:
                    row.check_out_time
                        ? `${attendanceDate}T${row.check_out_time}`
                        : null,

                working_hours:
                    workingHours,

                overtime_start_time:
                    attendanceSettings
                        ?.overtime_enabled &&
                    row.overtime_start_time
                        ? `${attendanceDate}T${row.overtime_start_time}`
                        : null,

                overtime_end_time:
                    attendanceSettings
                        ?.overtime_enabled &&
                    row.overtime_end_time
                        ? `${attendanceDate}T${row.overtime_end_time}`
                        : null,

                overtime_hours:
                    attendanceSettings
                        ?.overtime_enabled
                        ? overtimeHours
                        : 0,

                is_overtime:
                    attendanceSettings
                        ?.overtime_enabled &&
                    overtimeHours > 0,

                remarks:
                    null
            };
        }


        await bulkSaveAttendance(
            [record],
            currentCompany.id
        );


        alert(
            "Attendance updated successfully."
        );


        setEditingEmployeeId(
            null
        );

        await loadAttendanceForDate();

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to update attendance."
        );

    } finally {

        setSaving(false);
    }
}

    async function loadCompanyData() {

        try {

            setLoading(true);

            const companyId =
                currentCompany.id;

            const [
                employeeData,
                departmentData,
                designationData,
                locationData,
                deploymentData,
                settingsData
            ] = await Promise.all([

                getActiveEmployees(companyId),

                getDepartments(companyId),

                getDesignations(companyId),

                getLocations(companyId),

                getEmployeeDeployments(companyId),

                getAttendanceSettings(companyId)

            ]);

            setEmployees(employeeData || []);
            setDepartments(departmentData || []);
            setDesignations(designationData || []);
            setLocations(locationData || []);
            setDeployments(deploymentData || []);

            setAttendanceSettings(
                settingsData || {
                    attendance_mode: "DAY",
                    overtime_enabled: true,
                    default_attendance_status: "Present"
                }
            );

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to load attendance data."
            );

        } finally {

            setLoading(false);
        }
    }


    async function loadAttendanceForDate() {

    try {

        const data =
            await getAttendance(
                currentCompany.id,
                attendanceDate
            );

        const attendanceData =
            data || [];

        setExistingAttendance(
            attendanceData
        );

        setIsAttendanceLocked(
            attendanceData.length > 0
        );

        setEditingEmployeeId(null);

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to load attendance."
        );
    }
}
async function loadLocations(companyId) {

    try {

        const data =
            await getLocations(companyId);

        setLocations(data || []);

    } catch (error) {

        console.error(
            "Unable to load locations:",
            error
        );

        alert(
            error.message ||
            "Unable to load locations."
        );

        setLocations([]);

    }

}

    function getActiveDeployment(employeeId) {

        return deployments.find(
            deployment => {

                if (
                    deployment.employee_id !==
                    employeeId
                ) {
                    return false;
                }

                if (
                    deployment.deployment_status &&
                    deployment.deployment_status !==
                    "Active"
                ) {
                    return false;
                }

                if (
                    deployment.effective_from &&
                    deployment.effective_from >
                    attendanceDate
                ) {
                    return false;
                }

                if (
                    deployment.effective_to &&
                    deployment.effective_to <
                    attendanceDate
                ) {
                    return false;
                }

                return true;
            }
        ) || null;
    }


    const filteredEmployees = useMemo(() => {

    return employees.filter(employee => {

        // LOCATION FILTER
        if (
            filters.location_id &&
            employee.location_id !==
                filters.location_id
        ) {
            return false;
        }


        // DEPARTMENT FILTER
        if (
            filters.department_id &&
            employee.department_id !==
                filters.department_id
        ) {
            return false;
        }


        // DESIGNATION FILTER
        if (
            filters.designation_id &&
            employee.designation_id !==
                filters.designation_id
        ) {
            return false;
        }


        return true;

    });

}, [
    employees,
    filters
]);

    useEffect(() => {

        if (!attendanceSettings) {
            return;
        }

        const defaultStatus =
            attendanceSettings
                .default_attendance_status ||
            "Present";

        const newRows = {};

        employees.forEach(employee => {

            const existing =
                existingAttendance.find(
                    record =>
                        record.employee_id ===
                        employee.id
                );

            if (existing) {

                newRows[employee.id] = {

                    attendance_status:
                        existing.attendance_status ||
                        defaultStatus,

                    overtime:
                        existing.is_overtime ||
                        Number(
                            existing.overtime_shift_count
                        ) > 0
                            ? "Yes"
                            : "No",

                    check_in_time:
                        existing.check_in_time
                            ? existing.check_in_time.substring(
                                11,
                                16
                            )
                            : "",

                    check_out_time:
                        existing.check_out_time
                            ? existing.check_out_time.substring(
                                11,
                                16
                            )
                            : "",

                    overtime_start_time:
                        existing.overtime_start_time
                            ? existing.overtime_start_time.substring(
                                11,
                                16
                            )
                            : "",

                    overtime_end_time:
                        existing.overtime_end_time
                            ? existing.overtime_end_time.substring(
                                11,
                                16
                            )
                            : "",

                    remarks:
                        existing.remarks || ""
                };

            } else {

                newRows[employee.id] = {

                    attendance_status:
                        defaultStatus,

                    overtime: "No",

                    check_in_time: "",
                    check_out_time: "",

                    overtime_start_time: "",
                    overtime_end_time: "",

                    remarks: ""
                };
            }
        });

        setRows(newRows);

    }, [
        employees,
        existingAttendance,
        attendanceSettings
    ]);


    function handleFilterChange(e) {

        const {
            name,
            value
        } = e.target;

        setFilters(previous => ({
            ...previous,
            [name]: value
        }));
    }


    function updateRow(
        employeeId,
        field,
        value
    ) {

        setRows(previous => ({

            ...previous,

            [employeeId]: {

                ...previous[employeeId],

                [field]: value
            }

        }));
    }
function handleEditRow(employeeId) {

    setEditingEmployeeId(
        employeeId
    );
}


function handleCancelRowEdit() {

    setEditingEmployeeId(
        null
    );

    // Reload original saved data
    loadAttendanceForDate();
}

    function getDepartmentName(id) {

        const department =
            departments.find(
                item => item.id === id
            );

        return department
            ? department.department_name
            : "-";
    }


    function getDesignationName(id) {

        const designation =
            designations.find(
                item => item.id === id
            );

        return designation
            ? designation.designation_name
            : "-";
    }


    function getLocationName(locationId) {

    if (!locationId) {
        return "-";
    }

    const location =
        locations.find(
            item =>
                item.id === locationId
        );

    return location
        ? location.location_name
        : "-";
}

    function getAttendanceDayValue(status) {

        switch (status) {

            case "Present":
                return 1;

            case "Half Day":
                return 0.5;

            case "Absent":
            case "Weekly Off":
            case "Holiday":
                return 0;

            default:
                return 0;
        }
    }


    function calculateDuration(
        startTime,
        endTime
    ) {

        if (
            !startTime ||
            !endTime
        ) {
            return null;
        }

        const start =
            new Date(
                `1970-01-01T${startTime}`
            );

        const end =
            new Date(
                `1970-01-01T${endTime}`
            );

        let hours =
            (end - start) /
            3600000;

        if (hours < 0) {
            hours += 24;
        }

        return Number(
            hours.toFixed(2)
        );
    }


    async function handleSaveAll() {

        if (!currentCompany?.id) {

            alert(
                "Please select a company."
            );

            return;
        }

        if (
            filteredEmployees.length === 0
        ) {

            alert(
                "No employees available to save."
            );

            return;
        }

        if (
            attendanceSettings
                ?.allow_manual_attendance ===
            false
        ) {

            alert(
                "Manual attendance entry is disabled in Attendance Settings."
            );

            return;
        }


        try {

            setSaving(true);

            const mode =
                attendanceSettings
                    ?.attendance_mode ||
                "DAY";
            const canEditAttendance =
    !isAttendanceLocked ||
    isEditMode;


            const records =
                filteredEmployees.map(
                    employee => {

                        const row =
                            rows[employee.id];

                        const deployment =
                            getActiveDeployment(
                                employee.id
                            );


                        if (mode === "DAY") {

                            const overtimeYes =
                                attendanceSettings
                                    ?.overtime_enabled &&
                                row?.overtime ===
                                    "Yes";

                            return {

                                employee_id:
                                    employee.id,

                                attendance_date:
                                    attendanceDate,

                                attendance_mode:
                                    "DAY",

                                attendance_status:
                                    row?.attendance_status ||
                                    "Present",

                                attendance_day_value:
                                    getAttendanceDayValue(
                                        row?.attendance_status
                                    ),

                                overtime_shift_count:
                                    overtimeYes
                                        ? 1
                                        : 0,

                                is_overtime:
                                    overtimeYes,

                                deployment_id:
                                    deployment?.id ||
                                    null,

                                client_id:
                                    deployment?.client_id ||
                                    null,

                                work_location_id:
                                    deployment?.work_location_id ||
                                    null,

                                shift_id:
                                    deployment?.shift_id ||
                                    employee.default_shift_id ||
                                    null,

                                check_in_time:
                                    null,

                                check_out_time:
                                    null,

                                working_hours:
                                    null,

                                overtime_hours:
                                    0,

                                overtime_start_time:
                                    null,

                                overtime_end_time:
                                    null,

                                remarks:
                                    row?.remarks ||
                                    null
                            };
                        }


                        const workingHours =
                            calculateDuration(
                                row?.check_in_time,
                                row?.check_out_time
                            );

                        const overtimeHours =
                            calculateDuration(
                                row?.overtime_start_time,
                                row?.overtime_end_time
                            ) || 0;


                        return {

                            employee_id:
                                employee.id,

                            attendance_date:
                                attendanceDate,

                            attendance_mode:
                                "TIMING",

                            attendance_status:
                                row?.attendance_status ||
                                "Present",

                            attendance_day_value:
                                getAttendanceDayValue(
                                    row?.attendance_status
                                ),

                            overtime_shift_count:
                                0,

                            deployment_id:
                                deployment?.id ||
                                null,

                            client_id:
                                deployment?.client_id ||
                                null,

                            work_location_id:
                                deployment?.work_location_id ||
                                null,

                            shift_id:
                                deployment?.shift_id ||
                                employee.default_shift_id ||
                                null,

                            check_in_time:
                                row?.check_in_time
                                    ? `${attendanceDate}T${row.check_in_time}`
                                    : null,

                            check_out_time:
                                row?.check_out_time
                                    ? `${attendanceDate}T${row.check_out_time}`
                                    : null,

                            working_hours:
                                workingHours,

                            overtime_start_time:
                                attendanceSettings
                                    ?.overtime_enabled &&
                                row?.overtime_start_time
                                    ? `${attendanceDate}T${row.overtime_start_time}`
                                    : null,

                            overtime_end_time:
                                attendanceSettings
                                    ?.overtime_enabled &&
                                row?.overtime_end_time
                                    ? `${attendanceDate}T${row.overtime_end_time}`
                                    : null,

                            overtime_hours:
                                attendanceSettings
                                    ?.overtime_enabled
                                    ? overtimeHours
                                    : 0,

                            is_overtime:
                                attendanceSettings
                                    ?.overtime_enabled &&
                                overtimeHours > 0,

                            remarks:
                                row?.remarks ||
                                null
                        };
                    }
                );


            await bulkSaveAttendance(
                records,
                currentCompany.id
            );
setIsAttendanceLocked(true);
setIsEditMode(false);

            alert(
                `${records.length} attendance records saved successfully.`
            );


            await loadAttendanceForDate();


        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to save attendance."
            );

        } finally {

            setSaving(false);
        }
    }


    if (!currentCompany?.id) {

        return (
            <div style={{ padding: "25px" }}>
                Please select a company.
            </div>
        );
    }


    if (loading) {

        return (
            <div style={{ padding: "25px" }}>
                Loading attendance...
            </div>
        );
    }


    const mode =
        attendanceSettings
            ?.attendance_mode ||
        "DAY";
async function handleUpdateEmployeeAttendance(
    employee
) {

    try {

        setSaving(true);

        const employeeRow =
            rows[employee.id];

        if (!employeeRow) {

            throw new Error(
                "Attendance data not found for this employee."
            );

        }

        const attendanceData = [
            {
                employee_id: employee.id,

                attendance_date:
                    attendanceDate,

                attendance_status:
                    employeeRow.attendance_status,

                overtime:
                    employeeRow.overtime,

                company_id:
                    currentCompany.id
            }
        ];

        await bulkSaveAttendance(
            attendanceData
        );

        setEditingEmployeeId(null);

        await loadAttendanceForDate();

        alert(
            "Employee attendance updated successfully."
        );

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to update employee attendance."
        );

    } finally {

        setSaving(false);

    }
}
function isRowEditable(employeeId) {

    // Before first submission,
    // all employees can be edited.
    if (!isAttendanceLocked) {
        return true;
    }

    // After submission,
    // only selected employee can be edited.
    return (
        editingEmployeeId ===
        employeeId
    );
}
    return (

        <div
            style={{
                padding: "25px"
            }}
        >

            <h2>
                Attendance Entry
            </h2>

            <p>
                Company:{" "}
                <strong>
                    {
                        currentCompany
                            .company_name
                    }
                </strong>
            </p>


            <p>
                Attendance Mode:{" "}
                <strong>
                    {
                        mode === "DAY"
                            ? "Day Based"
                            : "Timing Based"
                    }
                </strong>
            </p>


            {/* FILTERS */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(4, 1fr)",
                    gap: "12px",
                    marginTop: "20px",
                    marginBottom: "25px"
                }}
            >

                <div>

                    <label>
                        Attendance Date
                    </label>

                    <input
                        type="date"
                        value={
                            attendanceDate
                        }
                        onChange={e =>
                            setAttendanceDate(
                                e.target.value
                            )
                        }
                        style={{
                            width: "100%"
                        }}
                    />

                </div>


                <div>

                    <label>
                        Location
                    </label>

                    <select
                        name="location_id"
                        value={
                            filters.location_id
                        }
                        onChange={
                            handleFilterChange
                        }
                        style={{
                            width: "100%"
                        }}
                    >

                        <option value="">
                            All Locations
                        </option>

                        {locations.map(
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
                        )}

                    </select>

                </div>


                <div>

                    <label>
                        Department
                    </label>

                    <select
                        name="department_id"
                        value={
                            filters.department_id
                        }
                        onChange={
                            handleFilterChange
                        }
                        style={{
                            width: "100%"
                        }}
                    >

                        <option value="">
                            All Departments
                        </option>

                        {departments.map(
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
                        )}

                    </select>

                </div>


                <div>

                    <label>
                        Designation
                    </label>

                    <select
                        name="designation_id"
                        value={
                            filters.designation_id
                        }
                        onChange={
                            handleFilterChange
                        }
                        style={{
                            width: "100%"
                        }}
                    >

                        <option value="">
                            All Designations
                        </option>

                        {designations.map(
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
                        )}

                    </select>

                </div>

            </div>


            <div
                style={{
                    marginBottom: "12px"
                }}
            >

                Employees shown:{" "}

                <strong>
                    {
                        filteredEmployees.length
                    }
                </strong>

            </div>


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
                                Emp ID
                            </th>

                            <th>
                                Employee Name
                            </th>

                            <th>
                                Location
                            </th>

                            <th>
                                Department
                            </th>

                            <th>
                                Designation
                            </th>

                            <th>
                                Attendance
                            </th>


                            {mode === "DAY" &&
                                attendanceSettings
                                    ?.overtime_enabled && (

                                <th>
                                    Overtime
                                </th>

                            )}


                            {mode === "TIMING" && (
                                <>
                                    <th>
                                        Check In
                                    </th>

                                    <th>
                                        Check Out
                                    </th>

                                    <th>
                                        Working Hours
                                    </th>

                                    {attendanceSettings
                                        ?.overtime_enabled && (
                                        <>
                                            <th>
                                                OT From
                                            </th>

                                            <th>
                                                OT To
                                            </th>

                                            <th>
                                                OT Hours
                                            </th>
                                        </>
                                    )}
                                </>                               
                            )}
<th>
    Actions
</th>

                           

                        </tr>

                    </thead>


                    <tbody>

                        {
                            filteredEmployees.length ===
                            0
                                ? (

                                <tr>

                                    <td
                                        colSpan="12"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "25px"
                                        }}
                                    >
                                        No employees found.
                                    </td>

                                </tr>

                            ) : (

                                filteredEmployees.map(
                                    employee => {
                                        const isRowEditing =
    editingEmployeeId === employee.id;

                                        const row =
                                            rows[
                                                employee.id
                                            ] || {};

                                        const workingHours =
                                            calculateDuration(
                                                row.check_in_time,
                                                row.check_out_time
                                            );

                                        const overtimeHours =
                                            calculateDuration(
                                                row.overtime_start_time,
                                                row.overtime_end_time
                                            );


                                        return (

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
        getLocationName(
            employee.location_id
        )
    }
</td>


                                                <td>
                                                    {
                                                        getDepartmentName(
                                                            employee.department_id
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        getDesignationName(
                                                            employee.designation_id
                                                        )
                                                    }
                                                </td>


                                                <td>

                                                   <select
    value={
        row.attendance_status ||
        "Present"
    }
    disabled={
    !isRowEditable(
        employee.id
    )
}
    onChange={
        e =>
            updateRow(
                employee.id,
                "attendance_status",
                e.target.value
            )
    }
>
                                                        <option value="Present">
                                                            Present
                                                        </option>

                                                        <option value="Absent">
                                                            Absent
                                                        </option>

                                                        <option value="Half Day">
                                                            Half Day
                                                        </option>

                                                        <option value="Weekly Off">
                                                            Weekly Off
                                                        </option>

                                                        <option value="Holiday">
                                                            Holiday
                                                        </option>

                                                    </select>

                                                </td>


                                                {mode === "DAY" &&
                                                    attendanceSettings
                                                        ?.overtime_enabled && (

                                                    <td>

                                                        <select
    value={
        row.overtime ||
        "No"
    }
    disabled={
    !isRowEditable(
        employee.id
    )
}                                                          onChange={
                                                                e =>
                                                                    updateRow(
                                                                        employee.id,
                                                                        "overtime",
                                                                        e.target.value
                                                                    )
                                                            }
                                                        >

                                                            <option value="No">
                                                                No
                                                            </option>

                                                            <option value="Yes">
                                                                Yes
                                                            </option>

                                                        </select>

                                                    </td>

                                                )}


                                                {mode === "TIMING" && (
                                                    <>

                                                        <td>

                                                            <input
    type="time"
    disabled={
        !isRowEditable(
            employee.id
        )
    }
    value={
        row.check_in_time ||
        ""
    }
    onChange={
        e =>
            updateRow(
                employee.id,
                "check_in_time",
                e.target.value
            )
    }
/>
                                                        </td>


                                                        <td>

                                                            <input
    type="time"
    disabled={
        !isRowEditable(
            employee.id
        )
    }
    value={
        row.check_out_time ||
        ""
    }
    onChange={
        e =>
            updateRow(
                employee.id,
                "check_out_time",
                e.target.value
            )
    }
/>
                                                        </td>


                                                        <td>

                                                            {
                                                                workingHours ??
                                                                "-"
                                                            }

                                                        </td>


                                                        {attendanceSettings
                                                            ?.overtime_enabled && (
                                                            <>

                                                                <td>

                                                                    <input
    type="time"
    disabled={
        !isRowEditable(
            employee.id
        )
    }
    value={
        row.overtime_start_time ||
        ""
    }
    onChange={
        e =>
            updateRow(
                employee.id,
                "overtime_start_time",
                e.target.value
            )
    }
/>
                                                                </td>


                                                                <td>

                                                                    <input
    type="time"
    disabled={
        !isRowEditable(
            employee.id
        )
    }
    value={
        row.overtime_end_time ||
        ""
    }
    onChange={
        e =>
            updateRow(
                employee.id,
                "overtime_end_time",
                e.target.value
            )
    }
/>
                                                                </td>


                                                                <td>

                                                                    {
                                                                        overtimeHours ??
                                                                        "-"
                                                                    }

                                                                </td>
                                                                <td>

    {!isRowEditing ? (

        <button
            type="button"
            onClick={() =>
                setEditingEmployeeId(
                    employee.id
                )
            }
        >
            Edit
        </button>

    ) : (

        <>
            <button
                type="button"
                onClick={() =>
                    handleUpdateEmployeeAttendance(
                        employee
                    )
                }
                disabled={saving}
            >
                {saving
                    ? "Updating..."
                    : "Update"
                }
            </button>

            <button
                type="button"
                onClick={() =>
                    setEditingEmployeeId(null)
                }
                disabled={saving}
            >
                Cancel
            </button>
        </>

    )}

</td>

                                                            </>
                                                        )}

                                                    </>
                                                )}
                                                <td>

    {!isAttendanceLocked && (

        <span>
            New
        </span>

    )}


    {isAttendanceLocked &&
        editingEmployeeId !== employee.id && (

        <button
            type="button"
            onClick={() =>
                handleEditRow(
                    employee.id
                )
            }
        >
            Edit
        </button>

    )}


    {isAttendanceLocked &&
        editingEmployeeId === employee.id && (

        <>
            <button
                type="button"
                onClick={() =>
                    handleUpdateEmployee(
                        employee
                    )
                }
                disabled={saving}
            >
                {saving
                    ? "Updating..."
                    : "Update"
                }
            </button>


            <button
                type="button"
                onClick={async () => {

                    setEditingEmployeeId(
                        null
                    );

                    await loadAttendanceForDate();

                }}
                disabled={saving}
            >
                Cancel
            </button>
        </>

    )}

</td>


                                                                                            </tr>

                                        );
                                    }
                                )

                            )
                        }

                    </tbody>

                </table>

            </div>


          <div
    style={{
        marginTop: "25px",
        display: "flex",
        gap: "12px",
        alignItems: "center"
    }}
>

    {!isAttendanceLocked && (

        <button
            type="button"
            onClick={
                handleSaveAll
            }
            disabled={
                saving ||
                filteredEmployees.length === 0
            }
        >
            {
                saving
                    ? "Saving..."
                    : `Save Attendance (${filteredEmployees.length})`
            }
        </button>

    )}


    {isAttendanceLocked && (

        <span>
            🔒 Attendance already submitted for this date.
            Use the Edit button for an individual employee to make corrections.
        </span>

    )}

</div>

        </div>
    );
}


export default AttendanceEntry;
