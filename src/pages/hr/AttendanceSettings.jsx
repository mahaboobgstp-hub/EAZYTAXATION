import { useEffect, useState } from "react";

import { useCompany } from "../../context/CompanyContext";

import {
    getAttendanceSettings,
    saveAttendanceSettings
} from "../../services/hr/attendanceSettingsService";


function AttendanceSettings() {

    const { currentCompany } = useCompany();


    const companyId = currentCompany?.id;


    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);


    const [formData, setFormData] = useState({
        attendance_mode: "DAY",
        overtime_enabled: true,
        allow_manual_attendance: true,
        default_attendance_status: "Present"
    });


    useEffect(() => {

        if (!companyId) {

            setLoading(false);

            return;
        }


        loadSettings();

    }, [companyId]);


    async function loadSettings() {

        try {

            setLoading(true);


            const data =
                await getAttendanceSettings(
                    companyId
                );


            if (data) {

                setFormData({

                    attendance_mode:
                        data.attendance_mode ||
                        "DAY",

                    overtime_enabled:
                        data.overtime_enabled ??
                        true,

                    allow_manual_attendance:
                        data.allow_manual_attendance ??
                        true,

                    default_attendance_status:
                        data.default_attendance_status ||
                        "Present"

                });

            }

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Failed to load attendance settings"
            );

        } finally {

            setLoading(false);

        }

    }


    function handleChange(event) {

        const {
            name,
            value,
            type,
            checked
        } = event.target;


        setFormData((previous) => ({

            ...previous,

            [name]:

                type === "checkbox"

                    ? checked

                    : value

        }));

    }


    async function handleSave(event) {

        event.preventDefault();


        if (!companyId) {

            alert(
                "Please select a company first"
            );

            return;

        }


        try {

            setSaving(true);


            await saveAttendanceSettings(

                companyId,

                formData

            );


            alert(
                "Attendance settings saved successfully"
            );

        } catch (error) {

            console.error(error);


            alert(

                error.message ||

                "Failed to save attendance settings"

            );

        } finally {

            setSaving(false);

        }

    }


    if (!companyId) {

        return (

            <div
                style={{
                    padding: "30px"
                }}
            >

                Please select a company.

            </div>

        );

    }


    if (loading) {

        return (

            <div
                style={{
                    padding: "30px"
                }}
            >

                Loading attendance settings...

            </div>

        );

    }


    return (

        <div
            style={{
                padding: "30px",
                maxWidth: "900px"
            }}
        >

            <h1>
                Attendance Settings
            </h1>


            <p>

                Configure attendance rules for:

                {" "}

                <strong>

                    {currentCompany?.company_name}

                </strong>

            </p>


            <form

                onSubmit={handleSave}

                style={{

                    marginTop: "25px",

                    padding: "25px",

                    border:
                        "1px solid #ddd",

                    borderRadius:
                        "8px"

                }}

            >


                {/* ATTENDANCE MODE */}

                <div
                    style={{
                        marginBottom: "20px"
                    }}
                >

                    <label>

                        Attendance Entry Mode

                    </label>


                    <br />


                    <select

                        name="attendance_mode"

                        value={
                            formData.attendance_mode
                        }

                        onChange={handleChange}

                        style={{

                            width:
                                "100%",

                            padding:
                                "10px",

                            marginTop:
                                "8px"

                        }}

                    >

                        <option value="DAY">

                            Day Based Attendance

                        </option>


                        <option value="TIMING">

                            Timing Based Attendance

                        </option>

                    </select>

                </div>


                {/* DEFAULT STATUS */}

                <div
                    style={{
                        marginBottom: "20px"
                    }}
                >

                    <label>

                        Default Attendance Status

                    </label>


                    <br />


                    <select

                        name="default_attendance_status"

                        value={
                            formData.default_attendance_status
                        }

                        onChange={handleChange}

                        style={{

                            width:
                                "100%",

                            padding:
                                "10px",

                            marginTop:
                                "8px"

                        }}

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

                </div>


                {/* OVERTIME */}

                <div
                    style={{
                        marginBottom: "20px"
                    }}
                >

                    <label>

                        <input

                            type="checkbox"

                            name="overtime_enabled"

                            checked={
                                formData.overtime_enabled
                            }

                            onChange={
                                handleChange
                            }

                        />

                        {" "}

                        Enable Overtime

                    </label>

                </div>


                {/* MANUAL ENTRY */}

                <div
                    style={{
                        marginBottom: "25px"
                    }}
                >

                    <label>

                        <input

                            type="checkbox"

                            name="allow_manual_attendance"

                            checked={
                                formData.allow_manual_attendance
                            }

                            onChange={
                                handleChange
                            }

                        />

                        {" "}

                        Allow Manual Attendance Entry

                    </label>

                </div>


                <button

                    type="submit"

                    disabled={saving}

                >

                    {

                        saving

                            ? "Saving..."

                            : "Save Settings"

                    }

                </button>

            </form>

        </div>

    );

}


export default AttendanceSettings;
