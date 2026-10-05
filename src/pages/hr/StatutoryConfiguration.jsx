import React, {
    useEffect,
    useState
} from "react";

import {
    useCompany
} from "../../context/CompanyContext";

import {
    supabase
} from "../../supabase/supabaseClient";

import {
    getStatutorySettings,
    saveStatutorySettings,
    getPTRegistrations,
    createPTRegistration,
    updatePTRegistration,
    deactivatePTRegistration
} from "../../services/hr/statutorySettingsService";


const defaultSettings = {

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

};


const defaultPTRegistration = {

    state_id: "",

    registration_number: "",

    enrollment_number: "",

    registration_type: "EMPLOYER",

    effective_from: "",

    effective_to: "",

    remarks: ""

};


function StatutoryConfiguration() {


    const {
        currentCompany,
        currentCompanyId,
        loading: companyLoading
    } = useCompany();


    const [
        settings,
        setSettings
    ] = useState(
        defaultSettings
    );


    const [
        settingsId,
        setSettingsId
    ] = useState(null);


    const [
        ptRegistrations,
        setPTRegistrations
    ] = useState([]);


    const [
        states,
        setStates
    ] = useState([]);


    const [
        ptForm,
        setPTForm
    ] = useState(
        defaultPTRegistration
    );


    const [
        editingPTId,
        setEditingPTId
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        saving,
        setSaving
    ] = useState(false);


    // =====================================================
    // LOAD DATA WHEN COMPANY CHANGES
    // =====================================================

    useEffect(() => {

        if (!currentCompanyId) {

            setSettings(
                defaultSettings
            );

            setSettingsId(null);

            setPTRegistrations([]);

            setPTForm(
                defaultPTRegistration
            );

            setEditingPTId(null);

            return;

        }


        loadConfiguration(
            currentCompanyId
        );

        loadStates();

    }, [currentCompanyId]);


    // =====================================================
    // LOAD STATUTORY CONFIGURATION
    // =====================================================

    const loadConfiguration =
        async (companyId) => {

            try {

                setLoading(true);


                const [
                    settingsData,
                    ptData
                ] = await Promise.all([

                    getStatutorySettings(
                        companyId
                    ),

                    getPTRegistrations(
                        companyId
                    )

                ]);


                if (settingsData) {

                    setSettings({

                        ...defaultSettings,

                        ...settingsData

                    });

                    setSettingsId(
                        settingsData.id
                    );

                } else {

                    setSettings(
                        defaultSettings
                    );

                    setSettingsId(null);

                }


                setPTRegistrations(
                    ptData || []
                );


            } catch (error) {

                console.error(
                    "Error loading statutory configuration:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to load statutory configuration."
                );

            } finally {

                setLoading(false);

            }

        };


    // =====================================================
    // LOAD STATES
    // =====================================================

    const loadStates =
        async () => {

            try {

                const {
                    data,
                    error
                } = await supabase

                    .from("states")

                    .select(
                        "id, state_name"
                    )

                    .order(
                        "state_name",
                        {
                            ascending: true
                        }
                    );


                if (error) {

                    throw error;

                }


                setStates(
                    data || []
                );


            } catch (error) {

                console.error(
                    "Error loading states:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to load states."
                );

            }

        };


    // =====================================================
    // SETTINGS CHANGE
    // =====================================================

    const handleSettingsChange =
        (e) => {

            const {
                name,
                value,
                type,
                checked
            } = e.target;


            setSettings(
                prev => ({

                    ...prev,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value

                })
            );

        };


    // =====================================================
    // SAVE STATUTORY SETTINGS
    // =====================================================

    const handleSaveSettings =
        async () => {

            if (!currentCompanyId) {

                alert(
                    "Please select a Current Company from the Sidebar."
                );

                return;

            }


            try {

                setSaving(true);


                const saved =
                    await saveStatutorySettings(

                        {

                            ...settings,

                            financial_year_start_month:
                                Number(
                                    settings
                                        .financial_year_start_month
                                )

                        },

                        currentCompanyId

                    );


                setSettings(
                    prev => ({

                        ...prev,

                        ...saved

                    })
                );


                setSettingsId(
                    saved.id
                );


                alert(
                    "Statutory configuration saved successfully."
                );


            } catch (error) {

                console.error(
                    "Error saving statutory settings:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to save statutory configuration."
                );

            } finally {

                setSaving(false);

            }

        };


    // =====================================================
    // PT FORM CHANGE
    // =====================================================

    const handlePTChange =
        (e) => {

            const {
                name,
                value
            } = e.target;


            setPTForm(
                prev => ({

                    ...prev,

                    [name]: value

                })
            );

        };


    // =====================================================
    // RESET PT FORM
    // =====================================================

    const resetPTForm =
        () => {

            setPTForm(
                defaultPTRegistration
            );

            setEditingPTId(null);

        };


    // =====================================================
    // SAVE PT REGISTRATION
    // =====================================================

    const handleSavePT =
        async (e) => {

            e.preventDefault();


            if (!currentCompanyId) {

                alert(
                    "Please select a Current Company from the Sidebar."
                );

                return;

            }


            if (!ptForm.state_id) {

                alert(
                    "Please select a State."
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

                    alert(
                        "PT registration updated successfully."
                    );

                } else {

                    await createPTRegistration(

                        ptForm,

                        currentCompanyId

                    );

                    alert(
                        "PT registration added successfully."
                    );

                }


                const refreshed =
                    await getPTRegistrations(
                        currentCompanyId
                    );


                setPTRegistrations(
                    refreshed || []
                );


                resetPTForm();


            } catch (error) {

                console.error(
                    "Error saving PT registration:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to save PT registration."
                );

            } finally {

                setSaving(false);

            }

        };


    // =====================================================
    // EDIT PT REGISTRATION
    // =====================================================

    const handleEditPT =
        (registration) => {

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


            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        };


    // =====================================================
    // DEACTIVATE PT REGISTRATION
    // =====================================================

    const handleDeactivatePT =
        async (registrationId) => {

            if (
                !window.confirm(
                    "Are you sure you want to deactivate this PT registration?"
                )
            ) {

                return;

            }


            try {

                setSaving(true);


                await deactivatePTRegistration(

                    registrationId,

                    currentCompanyId

                );


                const refreshed =
                    await getPTRegistrations(
                        currentCompanyId
                    );


                setPTRegistrations(
                    refreshed || []
                );


                alert(
                    "PT registration deactivated successfully."
                );


            } catch (error) {

                console.error(
                    "Error deactivating PT registration:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to deactivate PT registration."
                );

            } finally {

                setSaving(false);

            }

        };


    // =====================================================
    // GET STATE NAME
    // =====================================================

    const getStateName =
        (registration) => {

            if (
                registration?.states?.state_name
            ) {

                return registration
                    .states
                    .state_name;

            }


            const state =
                states.find(
                    item =>
                        item.id ===
                        registration.state_id
                );


            return state?.state_name || "-";

        };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            style={{
                padding: "25px",
                maxWidth: "1200px",
                margin: "0 auto"
            }}
        >

            <h2
                style={{
                    marginBottom: "8px"
                }}
            >
                Statutory Configuration
            </h2>


            <div
                style={{
                    marginBottom: "25px",
                    fontWeight: "600"
                }}
            >

                Company:{" "}

                {
                    companyLoading

                        ? "Loading..."

                        : currentCompany?.company_name ||

                          "Select Company"

                }

            </div>


            {
                !companyLoading &&
                !currentCompanyId && (

                    <div
                        style={{
                            padding: "12px",
                            marginBottom: "20px",
                            background: "#fff3cd",
                            border: "1px solid #ffeeba",
                            borderRadius: "6px"
                        }}
                    >

                        Please select a Current Company
                        from the Sidebar.

                    </div>

                )
            }


            {
                currentCompanyId && (

                    <>

                        {/* =================================================
                            EPF
                        ================================================== */}

                        <div
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "20px",
                                marginBottom: "20px"
                            }}
                        >

                            <h3>
                                EPF / Provident Fund
                            </h3>


                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(250px, 1fr))",
                                    gap: "15px",
                                    marginTop: "15px"
                                }}
                            >

                                <label>

                                    <input
                                        type="checkbox"
                                        name="pf_applicable"
                                        checked={
                                            settings
                                                .pf_applicable
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                    />

                                    {" "}
                                    EPF Applicable

                                </label>


                                <div>

                                    <label>
                                        PF Establishment ID
                                    </label>

                                    <input
                                        type="text"
                                        name="pf_establishment_id"
                                        value={
                                            settings
                                                .pf_establishment_id
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        placeholder="Enter PF Establishment ID"
                                        style={{
                                            width: "100%",
                                            padding: "9px",
                                            marginTop: "5px"
                                        }}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            ESI
                        ================================================== */}

                        <div
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "20px",
                                marginBottom: "20px"
                            }}
                        >

                            <h3>
                                ESI
                            </h3>


                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(250px, 1fr))",
                                    gap: "15px",
                                    marginTop: "15px"
                                }}
                            >

                                <label>

                                    <input
                                        type="checkbox"
                                        name="esi_applicable"
                                        checked={
                                            settings
                                                .esi_applicable
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                    />

                                    {" "}
                                    ESI Applicable

                                </label>


                                <div>

                                    <label>
                                        ESI Employer Code
                                    </label>

                                    <input
                                        type="text"
                                        name="esi_employer_code"
                                        value={
                                            settings
                                                .esi_employer_code
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        placeholder="Enter ESI Employer Code"
                                        style={{
                                            width: "100%",
                                            padding: "9px",
                                            marginTop: "5px"
                                        }}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            TDS
                        ================================================== */}

                        <div
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "20px",
                                marginBottom: "20px"
                            }}
                        >

                            <h3>
                                TDS
                            </h3>


                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(250px, 1fr))",
                                    gap: "15px",
                                    marginTop: "15px"
                                }}
                            >

                                <label>

                                    <input
                                        type="checkbox"
                                        name="tds_applicable"
                                        checked={
                                            settings
                                                .tds_applicable
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                    />

                                    {" "}
                                    TDS Applicable

                                </label>


                                <div>

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
                                        placeholder="Enter TAN"
                                        style={{
                                            width: "100%",
                                            padding: "9px",
                                            marginTop: "5px"
                                        }}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            GENERAL SETTINGS
                        ================================================== */}

                        <div
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "20px",
                                marginBottom: "20px"
                            }}
                        >

                            <h3>
                                General Filing Settings
                            </h3>


                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(250px, 1fr))",
                                    gap: "15px",
                                    marginTop: "15px"
                                }}
                            >

                                <div>

                                    <label>
                                        Financial Year Start Month
                                    </label>

                                    <select
                                        name="financial_year_start_month"
                                        value={
                                            settings
                                                .financial_year_start_month
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "9px",
                                            marginTop: "5px"
                                        }}
                                    >

                                        <option value="1">
                                            January
                                        </option>

                                        <option value="2">
                                            February
                                        </option>

                                        <option value="3">
                                            March
                                        </option>

                                        <option value="4">
                                            April
                                        </option>

                                        <option value="5">
                                            May
                                        </option>

                                        <option value="6">
                                            June
                                        </option>

                                        <option value="7">
                                            July
                                        </option>

                                        <option value="8">
                                            August
                                        </option>

                                        <option value="9">
                                            September
                                        </option>

                                        <option value="10">
                                            October
                                        </option>

                                        <option value="11">
                                            November
                                        </option>

                                        <option value="12">
                                            December
                                        </option>

                                    </select>

                                </div>


                                <label>

                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={
                                            settings
                                                .is_active
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                    />

                                    {" "}
                                    Configuration Active

                                </label>


                                <div>

                                    <label>
                                        Authorized Signatory Name
                                    </label>

                                    <input
                                        type="text"
                                        name="authorized_signatory_name"
                                        value={
                                            settings
                                                .authorized_signatory_name
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        placeholder="Authorized Signatory Name"
                                        style={{
                                            width: "100%",
                                            padding: "9px",
                                            marginTop: "5px"
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
                                            settings
                                                .authorized_signatory_designation
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        placeholder="Designation"
                                        style={{
                                            width: "100%",
                                            padding: "9px",
                                            marginTop: "5px"
                                        }}
                                    />

                                </div>


                                <div
                                    style={{
                                        gridColumn: "1 / -1"
                                    }}
                                >

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
                                        placeholder="Remarks"
                                        style={{
                                            width: "100%",
                                            padding: "9px",
                                            marginTop: "5px"
                                        }}
                                    />

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    handleSaveSettings
                                }
                                disabled={
                                    saving ||
                                    loading
                                }
                                style={{
                                    marginTop: "20px",
                                    padding: "10px 20px",
                                    cursor: "pointer"
                                }}
                            >

                                {
                                    saving
                                        ? "Saving..."
                                        : "Save Statutory Configuration"
                                }

                            </button>

                        </div>


                        {/* =================================================
                            PROFESSIONAL TAX
                        ================================================== */}

                        <div
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "20px",
                                marginBottom: "20px"
                            }}
                        >

                            <h3>
                                Professional Tax Registrations
                            </h3>


                            <form
                                onSubmit={
                                    handleSavePT
                                }
                                style={{
                                    marginTop: "15px"
                                }}
                            >

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(2, minmax(250px, 1fr))",
                                        gap: "15px"
                                    }}
                                >

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
                                                padding: "9px",
                                                marginTop: "5px"
                                            }}
                                        >

                                            <option value="">
                                                Select State
                                            </option>

                                            {
                                                states.map(
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
                                                )
                                            }

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
                                                padding: "9px",
                                                marginTop: "5px"
                                            }}
                                        >

                                            <option value="EMPLOYER">
                                                Employer
                                            </option>

                                            <option value="ENROLLMENT">
                                                Enrollment
                                            </option>

                                            <option value="BOTH">
                                                Employer + Enrollment
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
                                            placeholder="Registration Number"
                                            style={{
                                                width: "100%",
                                                padding: "9px",
                                                marginTop: "5px"
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
                                            placeholder="Enrollment Number"
                                            style={{
                                                width: "100%",
                                                padding: "9px",
                                                marginTop: "5px"
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
                                                padding: "9px",
                                                marginTop: "5px"
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
                                                padding: "9px",
                                                marginTop: "5px"
                                            }}
                                        />

                                    </div>


                                    <div
                                        style={{
                                            gridColumn: "1 / -1"
                                        }}
                                    >

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
                                            placeholder="Remarks"
                                            style={{
                                                width: "100%",
                                                padding: "9px",
                                                marginTop: "5px"
                                            }}
                                        />

                                    </div>

                                </div>


                                <div
                                    style={{
                                        marginTop: "20px"
                                    }}
                                >

                                    <button
                                        type="submit"
                                        disabled={
                                            saving
                                        }
                                        style={{
                                            padding: "10px 20px",
                                            marginRight: "10px",
                                            cursor: "pointer"
                                        }}
                                    >

                                        {
                                            saving
                                                ? "Saving..."
                                                : editingPTId
                                                    ? "Update PT Registration"
                                                    : "Add PT Registration"
                                        }

                                    </button>


                                    {
                                        editingPTId && (

                                            <button
                                                type="button"
                                                onClick={
                                                    resetPTForm
                                                }
                                                style={{
                                                    padding: "10px 20px",
                                                    cursor: "pointer"
                                                }}
                                            >

                                                Cancel Edit

                                            </button>

                                        )
                                    }

                                </div>

                            </form>


                            {/* =================================================
                                PT REGISTRATION TABLE
                            ================================================== */}

                            <div
                                style={{
                                    marginTop: "30px",
                                    overflowX: "auto"
                                }}
                            >

                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse"
                                    }}
                                >

                                    <thead>

                                        <tr>

                                            <th
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "10px",
                                                    textAlign: "left"
                                                }}
                                            >
                                                State
                                            </th>

                                            <th
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "10px",
                                                    textAlign: "left"
                                                }}
                                            >
                                                Registration No.
                                            </th>

                                            <th
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "10px",
                                                    textAlign: "left"
                                                }}
                                            >
                                                Enrollment No.
                                            </th>

                                            <th
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "10px",
                                                    textAlign: "left"
                                                }}
                                            >
                                                Type
                                            </th>

                                            <th
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "10px",
                                                    textAlign: "left"
                                                }}
                                            >
                                                Effective From
                                            </th>

                                            <th
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "10px",
                                                    textAlign: "left"
                                                }}
                                            >
                                                Effective To
                                            </th>

                                            <th
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "10px",
                                                    textAlign: "left"
                                                }}
                                            >
                                                Status
                                            </th>

                                            <th
                                                style={{
                                                    border: "1px solid #ddd",
                                                    padding: "10px",
                                                    textAlign: "left"
                                                }}
                                            >
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {
                                            ptRegistrations.length === 0 && (

                                                <tr>

                                                    <td
                                                        colSpan="8"
                                                        style={{
                                                            border: "1px solid #ddd",
                                                            padding: "15px",
                                                            textAlign: "center"
                                                        }}
                                                    >

                                                        No Professional Tax
                                                        registrations configured.

                                                    </td>

                                                </tr>

                                            )
                                        }


                                        {
                                            ptRegistrations.map(
                                                registration => (

                                                    <tr
                                                        key={
                                                            registration.id
                                                        }
                                                    >

                                                        <td
                                                            style={{
                                                                border: "1px solid #ddd",
                                                                padding: "10px"
                                                            }}
                                                        >

                                                            {
                                                                getStateName(
                                                                    registration
                                                                )
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border: "1px solid #ddd",
                                                                padding: "10px"
                                                            }}
                                                        >

                                                            {
                                                                registration
                                                                    .registration_number ||
                                                                "-"
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border: "1px solid #ddd",
                                                                padding: "10px"
                                                            }}
                                                        >

                                                            {
                                                                registration
                                                                    .enrollment_number ||
                                                                "-"
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border: "1px solid #ddd",
                                                                padding: "10px"
                                                            }}
                                                        >

                                                            {
                                                                registration
                                                                    .registration_type ||
                                                                "-"
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border: "1px solid #ddd",
                                                                padding: "10px"
                                                            }}
                                                        >

                                                            {
                                                                registration
                                                                    .effective_from ||
                                                                "-"
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border: "1px solid #ddd",
                                                                padding: "10px"
                                                            }}
                                                        >

                                                            {
                                                                registration
                                                                    .effective_to ||
                                                                "-"
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border: "1px solid #ddd",
                                                                padding: "10px"
                                                            }}
                                                        >

                                                            {
                                                                registration
                                                                    .is_active
                                                                    ? "Active"
                                                                    : "Inactive"
                                                            }

                                                        </td>


                                                        <td
                                                            style={{
                                                                border: "1px solid #ddd",
                                                                padding: "10px"
                                                            }}
                                                        >

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEditPT(
                                                                        registration
                                                                    )
                                                                }
                                                                style={{
                                                                    marginRight: "8px",
                                                                    cursor: "pointer"
                                                                }}
                                                            >

                                                                Edit

                                                            </button>


                                                            {
                                                                registration.is_active && (

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDeactivatePT(
                                                                                registration.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                        style={{
                                                                            cursor: "pointer"
                                                                        }}
                                                                    >

                                                                        Deactivate

                                                                    </button>

                                                                )
                                                            }

                                                        </td>

                                                    </tr>

                                                )
                                            )
                                        }

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </>

                )
            }

        </div>

    );

}


export default StatutoryConfiguration;
