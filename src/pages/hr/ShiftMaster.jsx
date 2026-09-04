import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";

import {
    getShifts,
    createShift,
    updateShift,
    deactivateShift
} from "../../services/hr/shiftService";

function ShiftMaster() {

    const { currentCompany } = useCompany();

    const [shifts, setShifts] = useState([]);

    const [formData, setFormData] = useState({
        shift_code: "",
        shift_name: "",
        shift_start: "",
        shift_end: "",
        break_minutes: 60,
       grace_in_minutes: 10,
grace_out_minutes: 10,
        minimum_working_hours: 8,
        half_day_hours: 4,
        overtime_after_hours: 8,
        is_night_shift: false,
        weekly_off_day: "",
        color_code: "",
        description: ""
    });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (currentCompany?.id) {
            loadShifts(currentCompany.id);
        } else {
            setShifts([]);
        }
    }, [currentCompany]);

    async function loadShifts(companyId) {
        try {
            const data = await getShifts(companyId);
            setShifts(data);
        } catch (error) {
            console.error(error);
            alert("Unable to load shifts.");
        }
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function resetForm() {
        setFormData({
            shift_code: "",
            shift_name: "",
            shift_start: "",
            shift_end: "",
            break_minutes: 60,
           grace_in_minutes: 10,
grace_out_minutes: 10,
            minimum_working_hours: 8,
            half_day_hours: 4,
            overtime_after_hours: 8,
            is_night_shift: false,
            weekly_off_day: "",
            color_code: "",
            description: ""
        });

        setEditingId(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!currentCompany?.id) {
            alert("Please select a company first.");
            return;
        }

        if (!formData.shift_code.trim()) {
            alert("Please enter Shift Code.");
            return;
        }

        if (!formData.shift_name.trim()) {
            alert("Please enter Shift Name.");
            return;
        }

        if (!formData.shift_start || !formData.shift_end) {
            alert("Please enter Shift Start and Shift End.");
            return;
        }

        try {

            if (editingId) {

                await updateShift(
                    editingId,
                    formData,
                    currentCompany.id
                );

                alert("Shift updated successfully.");

            } else {

                await createShift(
                    formData,
                    currentCompany.id
                );

                alert("Shift created successfully.");
            }

            resetForm();

            await loadShifts(currentCompany.id);

        } catch (error) {

            console.error(error);
            alert(error.message || "Unable to save shift.");
        }
    }

    function handleEdit(shift) {

        setEditingId(shift.id);

        setFormData({
            shift_code: shift.shift_code || "",
            shift_name: shift.shift_name || "",
            shift_start: shift.shift_start || "",
            shift_end: shift.shift_end || "",
            break_minutes: shift.break_minutes ?? 60,
            grace_in_minutes: shift.grace_in_minutes ?? 10,
grace_out_minutes: shift.grace_out_minutes ?? 10,
            minimum_working_hours:
                shift.minimum_working_hours ?? 8,
            half_day_hours:
                shift.half_day_hours ?? 4,
            overtime_after_hours:
                shift.overtime_after_hours ?? 8,
            is_night_shift: shift.is_night_shift || false,
            weekly_off_day:
    shift.weekly_off_day !== null &&
    shift.weekly_off_day !== undefined
        ? String(shift.weekly_off_day)
        : "",
            color_code: shift.color_code || "",
            description: shift.description || ""
        });
    }

    async function handleDeactivate(id) {

        if (!window.confirm("Deactivate this shift?")) {
            return;
        }

        try {

            await deactivateShift(
                id,
                currentCompany.id
            );

            await loadShifts(currentCompany.id);

        } catch (error) {

            console.error(error);
            alert(error.message || "Unable to deactivate shift.");
        }
    }

    return (
        <div style={{ padding: "25px" }}>

            <h2>Shift Master</h2>

            <p>
                Company:{" "}
                <strong>
                    {currentCompany?.company_name || "Select Company"}
                </strong>
            </p>

            {!currentCompany?.id ? (

                <div
                    style={{
                        padding: "15px",
                        background: "#fff3cd",
                        border: "1px solid #ffeeba",
                        borderRadius: "6px"
                    }}
                >
                    Please select a company from the Sidebar.
                </div>

            ) : (

                <>
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "15px",
                            marginTop: "20px",
                            marginBottom: "30px"
                        }}
                    >

                        <input
                            name="shift_code"
                            placeholder="Shift Code"
                            value={formData.shift_code}
                            onChange={handleChange}
                        />

                        <input
                            name="shift_name"
                            placeholder="Shift Name"
                            value={formData.shift_name}
                            onChange={handleChange}
                        />

                        <label>
                            Shift Start
                            <input
                                type="time"
                                name="shift_start"
                                value={formData.shift_start}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            Shift End
                            <input
                                type="time"
                                name="shift_end"
                                value={formData.shift_end}
                                onChange={handleChange}
                            />
                        </label>

                        <input
                            type="number"
                            name="break_minutes"
                            placeholder="Break Minutes"
                            value={formData.break_minutes}
                            onChange={handleChange}
                        />

                        <input
    type="number"
    name="grace_in_minutes"
    placeholder="Grace In (Minutes)"
    value={formData.grace_in_minutes}
    onChange={handleChange}
/>

                        <input
    type="number"
    name="grace_out_minutes"
    placeholder="Grace Out (Minutes)"
    value={formData.grace_out_minutes}
    onChange={handleChange}
/>

                        <input
                            type="number"
                            step="0.5"
                            name="minimum_working_hours"
                            placeholder="Minimum Working Hours"
                            value={formData.minimum_working_hours}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            step="0.5"
                            name="half_day_hours"
                            placeholder="Half Day Hours"
                            value={formData.half_day_hours}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            step="0.5"
                            name="overtime_after_hours"
                            placeholder="Overtime After Hours"
                            value={formData.overtime_after_hours}
                            onChange={handleChange}
                        />

                        <select
    name="weekly_off_day"
    value={formData.weekly_off_day}
    onChange={handleChange}
>
    <option value="">
        Weekly Off Day
    </option>

    <option value="0">Sunday</option>
    <option value="1">Monday</option>
    <option value="2">Tuesday</option>
    <option value="3">Wednesday</option>
    <option value="4">Thursday</option>
    <option value="5">Friday</option>
    <option value="6">Saturday</option>
</select>
                        <input
                            name="color_code"
                            placeholder="Color Code"
                            value={formData.color_code}
                            onChange={handleChange}
                        />

                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            <input
                                type="checkbox"
                                name="is_night_shift"
                                checked={formData.is_night_shift}
                                onChange={handleChange}
                            />
                            Night Shift
                        </label>

                        <input
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                        />

                        <div>

                            <button type="submit">
                                {editingId
                                    ? "Update Shift"
                                    : "Save Shift"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{ marginLeft: "10px" }}
                                >
                                    Cancel
                                </button>
                            )}

                        </div>

                    </form>

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >

                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Shift Name</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Break</th>
                                <th>Night</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {shifts.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="8"
                                        style={{
                                            textAlign: "center",
                                            padding: "20px"
                                        }}
                                    >
                                        No shifts found.
                                    </td>
                                </tr>

                            ) : (

                                shifts.map(shift => (

                                    <tr key={shift.id}>

                                        <td>
                                            {shift.shift_code}
                                        </td>

                                        <td>
                                            {shift.shift_name}
                                        </td>

                                        <td>
                                            {shift.shift_start}
                                        </td>

                                        <td>
                                            {shift.shift_end}
                                        </td>

                                        <td>
                                            {shift.break_minutes} min
                                        </td>

                                        <td>
                                            {shift.is_night_shift
                                                ? "Yes"
                                                : "No"}
                                        </td>

                                        <td>
                                            {shift.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </td>

                                        <td>

                                            <button
                                                onClick={() =>
                                                    handleEdit(shift)
                                                }
                                            >
                                                Edit
                                            </button>

                                            {shift.is_active && (
                                                <button
                                                    onClick={() =>
                                                        handleDeactivate(
                                                            shift.id
                                                        )
                                                    }
                                                    style={{
                                                        marginLeft: "8px"
                                                    }}
                                                >
                                                    Deactivate
                                                </button>
                                            )}

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>
                </>
            )}

        </div>
    );
}

export default ShiftMaster;
