import React, {
    useEffect,
    useState
} from "react";

import { useCompany } from "../../context/CompanyContext";

import {
    getStatutorySettings,
    saveStatutorySettings,
    getPTRegistrations,
    createPTRegistration,
    updatePTRegistration,
    deactivatePTRegistration
} from "../../services/hr/statutorySettingsService";

import { supabase } from "../../supabase/supabaseClient";

function StatutoryConfiguration() {

    const {
        currentCompany,
        currentCompanyId
    } = useCompany();


    const [settings, setSettings] = useState({
        pf_applicable: false,
        pf_establishment_id: "",

        esi_applicable: false,
        esi_employer_code: "",

        tds_applicable: false,
        tan: "",

        financial_year_start_month: 4,

        authorized_signatory_name: "",
        authorized_signatory_designation: "",

        is_active: true,
        remarks: ""
    });


    const [settingsId, setSettingsId] =
        useState(null);


    const [states, setStates] =
        useState([]);


    const [ptRegistrations, setPTRegistrations] =
        useState([]);


    const [ptForm, setPTForm] = useState({
        state_id: "",
        registration_number: "",
        enrollment_number: "",
        registration_type: "EMPLOYER",
        effective_from: "",
        effective_to: "",
        remarks: ""
    });


    const [editingPTId, setEditingPTId] =
        useState(null);


    const [loading, setLoading] =
        useState(false);


    const [saving, setSaving] =
        useState(false);


    useEffect(() => {

        if (!currentCompanyId) {
            return;
        }

        loadConfiguration();

    }, [currentCompanyId]);


    async function loadConfiguration() {

        try {

            setLoading(true);


            const [
                statutoryData,
                ptData,
                stateResult
            ] = await Promise.all([

                getStatutorySettings(
                    currentCompanyId
                ),

                getPTRegistrations(
                    currentCompanyId
                ),

                supabase
                    .from("states")
                    .select(
                        "id, state_name, gst_code"
                    )
                    .order(
                        "state_name",
                        {
                            ascending: true
                        }
                    )

            ]);


            if (statutoryData) {

                setSettingsId(
                    statutoryData.id
                );

                setSettings({
                    pf_applicable:
                        statutoryData.pf_applicable ?? false,

                    pf_establishment_id:
                        statutoryData.pf_establishment_id || "",

                    esi_applicable:
                        statutoryData.esi_applicable ?? false,

                    esi_employer_code:
                        statutoryData.esi_employer_code || "",

                    tds_applicable:
                        statutoryData.tds_applicable ?? false,

                    tan:
                        statutoryData.tan || "",

                    financial_year_start_month:
                        statutoryData.financial_year_start_month || 4,

                    authorized_signatory_name:
                        statutoryData.authorized_signatory_name || "",

                    authorized_signatory_designation:
                        statutoryData.authorized_signatory_designation || "",

                    is_active:
                        statutoryData.is_active ?? true,

                    remarks:
                        statutoryData.remarks || ""
                });

            }


            setPTRegistrations(
                ptData || []
            );


            if (stateResult.error) {
                throw stateResult.error;
            }


            setStates(
                stateResult.data || []
            );

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to load statutory configuration."
            );

        }

        finally {

            setLoading(false);

        }

    }


    function handleSettingsChange(e) {

        const {
            name,
            value,
            type,
            checked
        } = e.target;


        setSettings(previous => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));

    }


    async function handleSaveSettings() {

        if (!currentCompanyId) {

            alert(
                "Please select a company first."
            );

            return;
        }


        try {

            setSaving(true);


            const saved =
                await saveStatutorySettings(
                    settings,
                    currentCompanyId
                );


            setSettingsId(
                saved.id
            );


            alert(
                "Statutory settings saved successfully."
            );

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to save statutory settings."
            );

        }

        finally {

            setSaving(false);

        }

    }


    function handlePTChange(e) {

        const {
            name,
            value
        } = e.target;


        setPTForm(previous => ({
            ...previous,
            [name]: value
        }));

    }


    async function handleSavePT() {

        if (!currentCompanyId) {

            alert(
                "Please select a company first."
            );

            return;
        }


        if (!ptForm.state_id) {

            alert(
                "Please select a state."
            );

            return;
        }


        try {

            setSaving(true);


            if (editingPTId) {

                await updatePTRegistration(
                    editingPTId,
                    ptForm,
                    currentCompanyId
                );

            } else {

                await createPTRegistration(
                    ptForm,
                    currentCompanyId
                );

            }


            setPTForm({
                state_id: "",
                registration_number: "",
                enrollment_number: "",
                registration_type: "EMPLOYER",
                effective_from: "",
                effective_to: "",
                remarks: ""
            });


            setEditingPTId(null);


            await loadConfiguration();


            alert(
                editingPTId
                    ? "PT registration updated."
                    : "PT registration added."
            );

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to save PT registration."
            );

        }

        finally {

            setSaving(false);

        }

    }


    function editPTRegistration(registration) {

        setEditingPTId(
            registration.id
        );


        setPTForm({

            state_id:
                registration.state_id || "",

            registration_number:
                registration.registration_number || "",

            enrollment_number:
                registration.enrollment_number || "",

            registration_type:
                registration.registration_type ||
                "EMPLOYER",

            effective_from:
                registration.effective_from || "",

            effective_to:
                registration.effective_to || "",

            remarks:
                registration.remarks || ""

        });

    }


    async function handleDeactivatePT(id) {

        if (
            !window.confirm(
                "Deactivate this PT registration?"
            )
        ) {
            return;
        }


        try {

            await deactivatePTRegistration(
                id,
                currentCompanyId
            );


            await loadConfiguration();

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to deactivate PT registration."
            );

        }

    }


    function cancelPTEdit() {

        setEditingPTId(null);

        setPTForm({
            state_id: "",
            registration_number: "",
            enrollment_number: "",
            registration_type: "EMPLOYER",
            effective_from: "",
            effective_to: "",
            remarks: ""
        });

    }


    if (!currentCompanyId) {

        return (
            <div style={{ padding: "24px" }}>

                <h2>
                    STATUTORY CONFIGURATION
                </h2>

                <p>
                    Please select a company first.
                </p>

            </div>
        );

    }


    return (

        <div style={{
            padding: "24px",
            maxWidth: "1200px",
            margin: "0 auto"
        }}>

            <h2>
                STATUTORY CONFIGURATION
            </h2>


            <p style={{
                marginBottom: "24px"
            }}>
                Company:{" "}
                <strong>
                    {currentCompany?.company_name?.trim()}
                </strong>
            </p>


            {loading ? (

                <p>
                    Loading statutory configuration...
                </p>

            ) : (

                <>

                    {/* =====================================
                        EPF
                    ===================================== */}

                    <section style={{
                        border: "1px solid #ddd",
                        padding: "20px",
                        marginBottom: "20px",
                        borderRadius: "8px"
                    }}>

                        <h3>
                            EPF / EPFO
                        </h3>


                        <label>
                            <input
                                type="checkbox"
                                name="pf_applicable"
                                checked={
                                    settings.pf_applicable
                                }
                                onChange={
                                    handleSettingsChange
                                }
                            />

                            {" "}
                            EPF Applicable
                        </label>


                        {settings.pf_applicable && (

                            <div style={{
                                marginTop: "15px"
                            }}>

                                <label>
                                    PF Establishment ID
                                </label>

                                <input
                                    type="text"
                                    name="pf_establishment_id"
                                    value={
                                        settings.pf_establishment_id
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>

                        )}

                    </section>


                    {/* =====================================
                        ESI
                    ===================================== */}

                    <section style={{
                        border: "1px solid #ddd",
                        padding: "20px",
                        marginBottom: "20px",
                        borderRadius: "8px"
                    }}>

                        <h3>
                            ESI / ESIC
                        </h3>


                        <label>
                            <input
                                type="checkbox"
                                name="esi_applicable"
                                checked={
                                    settings.esi_applicable
                                }
                                onChange={
                                    handleSettingsChange
                                }
                            />

                            {" "}
                            ESI Applicable
                        </label>


                        {settings.esi_applicable && (

                            <div style={{
                                marginTop: "15px"
                            }}>

                                <label>
                                    ESI Employer Code
                                </label>

                                <input
                                    type="text"
                                    name="esi_employer_code"
                                    value={
                                        settings.esi_employer_code
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>

                        )}

                    </section>


                    {/* =====================================
                        TDS
                    ===================================== */}

                    <section style={{
                        border: "1px solid #ddd",
                        padding: "20px",
                        marginBottom: "20px",
                        borderRadius: "8px"
                    }}>

                        <h3>
                            TDS
                        </h3>


                        <label>
                            <input
                                type="checkbox"
                                name="tds_applicable"
                                checked={
                                    settings.tds_applicable
                                }
                                onChange={
                                    handleSettingsChange
                                }
                            />

                            {" "}
                            Salary TDS Applicable
                        </label>


                        {settings.tds_applicable && (

                            <div style={{
                                marginTop: "15px"
                            }}>

                                <label>
                                    TAN
                                </label>

                                <input
                                    type="text"
                                    name="tan"
                                    value={
                                        settings.tan
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>

                        )}

                    </section>


                    {/* =====================================
                        GENERAL
                    ===================================== */}

                    <section style={{
                        border: "1px solid #ddd",
                        padding: "20px",
                        marginBottom: "20px",
                        borderRadius: "8px"
                    }}>

                        <h3>
                            General Filing Settings
                        </h3>


                        <div style={{
                            display: "grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap: "15px"
                        }}>

                            <div>

                                <label>
                                    Financial Year Start Month
                                </label>

                                <select
                                    name="financial_year_start_month"
                                    value={
                                        settings.financial_year_start_month
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                >

                                    <option value="1">
                                        January
                                    </option>

                                    <option value="4">
                                        April
                                    </option>

                                </select>

                            </div>


                            <div>

                                <label>
                                    Authorized Signatory Name
                                </label>

                                <input
                                    type="text"
                                    name="authorized_signatory_name"
                                    value={
                                        settings.authorized_signatory_name
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>


                            <div>

                                <label>
                                    Authorized Signatory Designation
                                </label>

                                <input
                                    type="text"
                                    name="authorized_signatory_designation"
                                    value={
                                        settings.authorized_signatory_designation
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>

                        </div>


                        <div style={{
                            marginTop: "15px"
                        }}>

                            <label>
                                Remarks
                            </label>

                            <textarea
                                name="remarks"
                                value={
                                    settings.remarks
                                }
                                onChange={
                                    handleSettingsChange
                                }
                                rows="3"
                                style={{
                                    width: "100%",
                                    padding: "8px"
                                }}
                            />

                        </div>


                        <button
                            onClick={
                                handleSaveSettings
                            }
                            disabled={saving}
                            style={{
                                marginTop: "15px",
                                padding: "10px 20px"
                            }}
                        >

                            {saving
                                ? "Saving..."
                                : "Save Statutory Settings"}

                        </button>

                    </section>


                    {/* =====================================
                        PT
                    ===================================== */}

                    <section style={{
                        border: "1px solid #ddd",
                        padding: "20px",
                        marginBottom: "20px",
                        borderRadius: "8px"
                    }}>

                        <h3>
                            Professional Tax Registrations
                        </h3>


                        <div style={{
                            display: "grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap: "15px"
                        }}>

                            <div>

                                <label>
                                    State
                                </label>

                                <select
                                    name="state_id"
                                    value={
                                        ptForm.state_id
                                    }
                                    onChange={
                                        handlePTChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                >

                                    <option value="">
                                        Select State
                                    </option>

                                    {states.map(
                                        state => (

                                            <option
                                                key={
                                                    state.id
                                                }
                                                value={
                                                    state.id
                                                }
                                            >
                                                {
                                                    state.state_name
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div>

                                <label>
                                    Registration Type
                                </label>

                                <select
                                    name="registration_type"
                                    value={
                                        ptForm.registration_type
                                    }
                                    onChange={
                                        handlePTChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                >

                                    <option value="EMPLOYER">
                                        Employer
                                    </option>

                                    <option value="ENROLMENT">
                                        Enrolment
                                    </option>

                                </select>

                            </div>


                            <div>

                                <label>
                                    Registration Number
                                </label>

                                <input
                                    type="text"
                                    name="registration_number"
                                    value={
                                        ptForm.registration_number
                                    }
                                    onChange={
                                        handlePTChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>


                            <div>

                                <label>
                                    Enrollment Number
                                </label>

                                <input
                                    type="text"
                                    name="enrollment_number"
                                    value={
                                        ptForm.enrollment_number
                                    }
                                    onChange={
                                        handlePTChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>


                            <div>

                                <label>
                                    Effective From
                                </label>

                                <input
                                    type="date"
                                    name="effective_from"
                                    value={
                                        ptForm.effective_from
                                    }
                                    onChange={
                                        handlePTChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>


                            <div>

                                <label>
                                    Effective To
                                </label>

                                <input
                                    type="date"
                                    name="effective_to"
                                    value={
                                        ptForm.effective_to
                                    }
                                    onChange={
                                        handlePTChange
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "8px"
                                    }}
                                />

                            </div>

                        </div>


                        <div style={{
                            marginTop: "15px"
                        }}>

                            <label>
                                Remarks
                            </label>

                            <textarea
                                name="remarks"
                                value={
                                    ptForm.remarks
                                }
                                onChange={
                                    handlePTChange
                                }
                                rows="2"
                                style={{
                                    width: "100%",
                                    padding: "8px"
                                }}
                            />

                        </div>


                        <div style={{
                            marginTop: "15px"
                        }}>

                            <button
                                onClick={
                                    handleSavePT
                                }
                                disabled={saving}
                                style={{
                                    padding: "10px 20px"
                                }}
                            >

                                {editingPTId
                                    ? "Update PT Registration"
                                    : "Add PT Registration"}

                            </button>


                            {editingPTId && (

                                <button
                                    onClick={
                                        cancelPTEdit
                                    }
                                    style={{
                                        marginLeft: "10px",
                                        padding: "10px 20px"
                                    }}
                                >
                                    Cancel
                                </button>

                            )}

                        </div>


                        {/* PT LIST */}

                        {ptRegistrations.length > 0 && (

                            <div style={{
                                marginTop: "25px",
                                overflowX: "auto"
                            }}>

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
                                                State
                                            </th>

                                            <th>
                                                Registration No.
                                            </th>

                                            <th>
                                                Enrollment No.
                                            </th>

                                            <th>
                                                Effective From
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {ptRegistrations.map(
                                            registration => (

                                                <tr
                                                    key={
                                                        registration.id
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            registration
                                                                .states
                                                                ?.state_name ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            registration
                                                                .registration_number ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            registration
                                                                .enrollment_number ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            registration
                                                                .effective_from ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            registration
                                                                .is_active
                                                                ? "Active"
                                                                : "Inactive"
                                                        }
                                                    </td>

                                                    <td>

                                                        {registration.is_active && (

                                                            <>

                                                                <button
                                                                    onClick={() =>
                                                                        editPTRegistration(
                                                                            registration
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>


                                                                <button
                                                                    onClick={() =>
                                                                        handleDeactivatePT(
                                                                            registration.id
                                                                        )
                                                                    }
                                                                    style={{
                                                                        marginLeft:
                                                                            "8px"
                                                                    }}
                                                                >
                                                                    Deactivate
                                                                </button>

                                                            </>

                                                        )}

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </section>

                </>

            )}

        </div>

    );

}


export default StatutoryConfiguration;
