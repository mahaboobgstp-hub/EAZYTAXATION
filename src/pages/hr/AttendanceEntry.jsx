import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";

import {
    getActiveEmployees
} from "../../services/hr/employeeService";
import {
    getShiftById
} from "../../services/hr/shiftService";

import {
    getAttendance,
    saveAttendance,
    deleteAttendance
} from "../../services/hr/attendanceService";

function AttendanceEntry() {

    const { currentCompany } = useCompany();

    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);

    const [attendanceDate, setAttendanceDate] =
        useState(
            new Date().toISOString().split("T")[0]
        );

    const [formData, setFormData] = useState({
    employee_id: "",
    attendance_status: "Present",
    check_in_time: "",
    check_out_time: "",
    working_hours: "",
    overtime_hours: "",
    remarks: ""
});

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {

        if (currentCompany?.id) {

            loadEmployees(currentCompany.id);

            loadAttendance(
                currentCompany.id,
                attendanceDate
            );

        } else {

            setEmployees([]);
            setAttendance([]);
        }

    }, [currentCompany, attendanceDate]);

    async function loadEmployees(companyId) {

        try {

            const data =
                await getActiveEmployees(companyId);

            setEmployees(data);

        } catch (error) {

            console.error(error);

            alert(
                "Unable to load employees."
            );
        }
    }

    async function loadAttendance(
        companyId,
        date
    ) {

        try {

            const data =
                await getAttendance(
                    companyId,
                    date
                );

            setAttendance(data);

        } catch (error) {

            console.error(error);

            alert(
                "Unable to load attendance."
            );
        }
    }

    function handleChange(e) {

    const { name, value } = e.target;

    setFormData(prev => {

        const updated = {
            ...prev,
            [name]: value
        };

        if (
            name === "check_in_time" ||
            name === "check_out_time"
        ) {

            const workingHours =
                calculateWorkingHours(
                    name === "check_in_time"
                        ? value
                        : prev.check_in_time,

                    name === "check_out_time"
                        ? value
                        : prev.check_out_time
                );

            updated.working_hours =
                workingHours !== null
                    ? workingHours
                    : "";

        }

        return updated;
    });
}

    function resetForm() {

        setFormData({
    employee_id: "",
    attendance_status: "Present",
    check_in_time: "",
    check_out_time: "",
    working_hours: "",
    overtime_hours: "",
    remarks: ""
});

        setEditingId(null);
    }

    function calculateWorkingHours(
        checkIn,
        checkOut
    ) {

        if (!checkIn || !checkOut) {
            return null;
        }

        const start =
            new Date(
                `1970-01-01T${checkIn}`
            );

        const end =
            new Date(
                `1970-01-01T${checkOut}`
            );

        let difference =
            (end - start) / 3600000;

        if (difference < 0) {
            difference += 24;
        }

        return Number(
            difference.toFixed(2)
        );
    }
function calculateOvertimeHours(
    workingHours,
    overtimeAfterHours
) {
    if (
        workingHours === null ||
        workingHours === undefined ||
        !overtimeAfterHours
    ) {
        return 0;
    }

    if (workingHours <= overtimeAfterHours) {
        return 0;
    }

    return Number(
        (workingHours - overtimeAfterHours).toFixed(2)
    );
}
    async function handleSubmit(e) {

        e.preventDefault();

        if (!currentCompany?.id) {

            alert(
                "Please select a company first."
            );

            return;
        }

        if (!formData.employee_id) {

            alert(
                "Please select an employee."
            );

            return;
        }

        if (!formData.attendance_status) {

            alert(
                "Please select attendance status."
            );

            return;
        }

        try {

            const selectedEmployee =
                employees.find(
                    employee =>
                        employee.id ===
                        formData.employee_id
                );
            let selectedShift = null;

if (selectedEmployee?.default_shift_id) {
    selectedShift = await getShiftById(
        selectedEmployee.default_shift_id,
        currentCompany.id
    );
}

            const workingHours =
                calculateWorkingHours(
                    formData.check_in_time,
                    formData.check_out_time
                );
const overtimeHours =
    calculateOvertimeHours(
        workingHours,
        selectedShift?.overtime_after_hours
    );
            const attendanceData = {

                employee_id:
                    formData.employee_id,

                attendance_date:
                    attendanceDate,

                shift_id:
                    selectedEmployee?.default_shift_id ||
                    null,

                attendance_status:
                    formData.attendance_status,

                check_in_time:
                    formData.check_in_time
                        ? `${attendanceDate}T${formData.check_in_time}`
                        : null,

                check_out_time:
                    formData.check_out_time
                        ? `${attendanceDate}T${formData.check_out_time}`
                        : null,

                working_hours:
                    workingHours,

                overtime_hours:
    overtimeHours,

is_overtime:
    overtimeHours > 0,

                remarks:
                    formData.remarks
            };

            await saveAttendance(
                attendanceData,
                currentCompany.id
            );

            alert(
                editingId
                    ? "Attendance updated successfully."
                    : "Attendance saved successfully."
            );

            resetForm();

            await loadAttendance(
                currentCompany.id,
                attendanceDate
            );

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to save attendance."
            );
        }
    }

    function handleEdit(record) {

        setEditingId(record.id);

        setFormData({

            employee_id:
                record.employee_id || "",

            attendance_status:
                record.attendance_status ||
                "Present",

            check_in_time:
                record.check_in_time
                    ? record.check_in_time
                        .substring(11, 16)
                    : "",

            check_out_time:
                record.check_out_time
                    ? record.check_out_time
                        .substring(11, 16)
                    : "",

            remarks:
                record.remarks || ""
        });
    }

    async function handleDelete(id) {

        if (
            !window.confirm(
                "Delete this attendance entry?"
            )
        ) {
            return;
        }

        try {

            await deleteAttendance(
                id,
                currentCompany.id
            );

            await loadAttendance(
                currentCompany.id,
                attendanceDate
            );

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to delete attendance."
            );
        }
    }

    function getEmployeeName(employeeId) {

        const employee =
            employees.find(
                item =>
                    item.id === employeeId
            );

        if (!employee) {
            return employeeId;
        }

        return `${employee.employee_code} - ${employee.employee_name}`;
    }

    return (
        <div style={{ padding: "25px" }}>

            <h2>Attendance Entry</h2>

            <p>
                Company:{" "}
                <strong>
                    {currentCompany?.company_name ||
                        "Select Company"}
                </strong>
            </p>

            {!currentCompany?.id ? (

                <div
                    style={{
                        padding: "15px",
                        background: "#fff3cd",
                        border:
                            "1px solid #ffeeba",
                        borderRadius: "6px"
                    }}
                >
                    Please select a company from
                    the Sidebar.
                </div>

            ) : (

                <>

                    <div
                        style={{
                            marginTop: "20px",
                            marginBottom: "20px"
                        }}
                    >

                        <label>
                            Attendance Date
                        </label>

                        <br />

                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={e =>
                                setAttendanceDate(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap: "15px",
                            marginBottom: "30px"
                        }}
                    >

                        <select
                            name="employee_id"
                            value={
                                formData.employee_id
                            }
                            onChange={handleChange}
                        >

                            <option value="">
                                Select Employee
                            </option>

                            {employees.map(
                                employee => (

                                    <option
                                        key={
                                            employee.id
                                        }
                                        value={
                                            employee.id
                                        }
                                    >
                                        {
                                            employee.employee_code
                                        }
                                        {" - "}
                                        {
                                            employee.employee_name
                                        }
                                    </option>

                                )
                            )}

                        </select>


                        <select
                            name="attendance_status"
                            value={
                                formData.attendance_status
                            }
                            onChange={handleChange}
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

                            <option value="Leave">
                                Leave
                            </option>

                            <option value="Weekly Off">
                                Weekly Off
                            </option>

                            <option value="Holiday">
                                Holiday
                            </option>

                        </select>


                        <label>
                            Check In

                            <input
                                type="time"
                                name="check_in_time"
                                value={
                                    formData.check_in_time
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </label>


                        <label>
                            Check Out

                            <input
                                type="time"
                                name="check_out_time"
                                value={
                                    formData.check_out_time
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </label>
<input
    type="number"
    step="0.01"
    name="working_hours"
    placeholder="Working Hours"
    value={formData.working_hours}
    readOnly
/>
                        <input
    type="number"
    step="0.01"
    name="overtime_hours"
    placeholder="Overtime Hours"
    value={formData.overtime_hours}
    readOnly
/>

                        <input
                            name="remarks"
                            placeholder="Remarks"
                            value={
                                formData.remarks
                            }
                            onChange={
                                handleChange
                            }
                        />


                        <div>

                            <button type="submit">

                                {editingId
                                    ? "Update Attendance"
                                    : "Save Attendance"}

                            </button>

                            {editingId && (

                                <button
                                    type="button"
                                    onClick={
                                        resetForm
                                    }
                                    style={{
                                        marginLeft:
                                            "10px"
                                    }}
                                >
                                    Cancel
                                </button>

                            )}

                        </div>

                    </form>


                    <h3>
                        Attendance for{" "}
                        {attendanceDate}
                    </h3>


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
                                    Employee
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Check In
                                </th>

                                <th>
                                    Check Out
                                </th>

                                <th>
                                    Working Hours
                                </th>

                                <th>
                                    Overtime
                                </th>

                                <th>
                                    Remarks
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {attendance.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="8"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "20px"
                                        }}
                                    >
                                        No attendance
                                        entries for
                                        this date.
                                    </td>

                                </tr>

                            ) : (

                                attendance.map(
                                    record => (

                                        <tr
                                            key={
                                                record.id
                                            }
                                        >

                                            <td>
                                                {
                                                    getEmployeeName(
                                                        record.employee_id
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    record.attendance_status
                                                }
                                            </td>

                                            <td>
                                                {record.check_in_time
                                                    ? record.check_in_time.substring(
                                                        11,
                                                        16
                                                    )
                                                    : "-"}
                                            </td>

                                            <td>
                                                {record.check_out_time
                                                    ? record.check_out_time.substring(
                                                        11,
                                                        16
                                                    )
                                                    : "-"}
                                            </td>

                                            <td>
                                                {
                                                    record.working_hours ??
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    record.overtime_hours ??
                                                    0
                                                }
                                            </td>

                                            <td>
                                                {
                                                    record.remarks ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                <button
                                                    onClick={() =>
                                                        handleEdit(
                                                            record
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            record.id
                                                        )
                                                    }
                                                    style={{
                                                        marginLeft:
                                                            "8px"
                                                    }}
                                                >
                                                    Delete
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </>

            )}

        </div>
    );
}

export default AttendanceEntry;
