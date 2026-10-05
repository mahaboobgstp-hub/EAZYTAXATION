import React, {
    useEffect,
    useState
} from "react";

import {
    useCompany
} from "../../context/CompanyContext";

import {
    getLateDeductionPolicies,
    createLateDeductionPolicy,
    updateLateDeductionPolicy,
    deactivateLateDeductionPolicy
} from "../../services/hr/lateDeductionPolicyService";


const defaultForm = {

    id: null,

    policy_name: "",

    description: "",

    effective_from: "",

    effective_to: "",

    grace_minutes: 0,

    allowed_late_occurrences: 0,

    deduction_method:
        "DAILY_RATE",

    deduction_value: 0,

    max_deduction_days: 0,

    is_active: true,

    remarks: ""

};


function LateDeductionPolicy() {

    const {
        currentCompany,
        currentCompanyId
    } = useCompany();


    const [
        policies,
        setPolicies
    ] = useState([]);


    const [
        formData,
        setFormData
    ] = useState(
        defaultForm
    );


    const [
        editingId,
        setEditingId
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        saving,
        setSaving
    ] = useState(false);


    /* =========================================
       LOAD POLICIES
    ========================================= */

    useEffect(() => {

        if (!currentCompanyId) {

            setPolicies([]);

            return;

        }

        loadPolicies();

    }, [
        currentCompanyId
    ]);


    async function loadPolicies() {

        try {

            setLoading(true);

            const data =
                await getLateDeductionPolicies(
                    currentCompanyId
                );

            setPolicies(
                data || []
            );

        }
        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to load late deduction policies."
            );

        }
        finally {

            setLoading(false);

        }

    }


    /* =========================================
       INPUT CHANGE
    ========================================= */

    function handleChange(e) {

        const {
            name,
            value,
            type,
            checked
        } = e.target;


        setFormData(
            previous => ({

                ...previous,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value

            })
        );

    }


    /* =========================================
       SAVE
    ========================================= */

    async function handleSubmit(e) {

        e.preventDefault();


        if (!currentCompanyId) {

            alert(
                "Please select a company first."
            );

            return;

        }


        if (
            !formData.policy_name.trim()
        ) {

            alert(
                "Policy Name is required."
            );

            return;

        }


        if (
            !formData.effective_from
        ) {

            alert(
                "Effective From date is required."
            );

            return;

        }


        try {

            setSaving(true);


            if (editingId) {

                await updateLateDeductionPolicy(

                    editingId,

                    formData,

                    currentCompanyId

                );

                alert(
                    "Late deduction policy updated successfully."
                );

            }
            else {

                await createLateDeductionPolicy(

                    formData,

                    currentCompanyId

                );

                alert(
                    "Late deduction policy created successfully."
                );

            }


            setFormData(
                defaultForm
            );

            setEditingId(
                null
            );


            await loadPolicies();

        }
        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to save policy."
            );

        }
        finally {

            setSaving(false);

        }

    }


    /* =========================================
       EDIT
    ========================================= */

    function handleEdit(policy) {

        setEditingId(
            policy.id
        );


        setFormData({

            id:
                policy.id,

            policy_name:
                policy.policy_name || "",

            description:
                policy.description || "",

            effective_from:
                policy.effective_from || "",

            effective_to:
                policy.effective_to || "",

            grace_minutes:
                policy.grace_minutes ?? 0,

            allowed_late_occurrences:
                policy.allowed_late_occurrences ?? 0,

            deduction_method:
                policy.deduction_method ||
                "DAILY_RATE",

            deduction_value:
                policy.deduction_value ?? 0,

            max_deduction_days:
                policy.max_deduction_days ?? 0,

            is_active:
                policy.is_active !== false,

            remarks:
                policy.remarks || ""

        });


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =========================================
       CANCEL EDIT
    ========================================= */

    function handleCancel() {

        setEditingId(
            null
        );

        setFormData(
            defaultForm
        );

    }


    /* =========================================
       DEACTIVATE
    ========================================= */

    async function handleDeactivate(
        policy
    ) {

        if (
            !window.confirm(
                `Deactivate "${policy.policy_name}"?`
            )
        ) {

            return;

        }


        try {

            await deactivateLateDeductionPolicy(

                policy.id,

                currentCompanyId

            );

            alert(
                "Policy deactivated successfully."
            );

            await loadPolicies();

        }
        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to deactivate policy."
            );

        }

    }


    return (

        <div
            style={{
                padding: "25px"
            }}
        >

            <h2>
                Late Deduction Policies
            </h2>


            <div
                style={{
                    marginBottom: "20px",
                    fontWeight: "600"
                }}
            >

                Company:{" "}

                {
                    currentCompany?.company_name ||
                    "Select Company"
                }

            </div>


            {!currentCompanyId && (

                <div
                    style={{
                        padding: "12px",
                        marginBottom: "20px",
                        background: "#fff3cd",
                        border:
                            "1px solid #ffeeba",
                        borderRadius: "6px"
                    }}
                >
                    Please select a Current Company
                    from the Sidebar.
                </div>

            )}


            {/* =====================================
                POLICY FORM
            ===================================== */}

            <form
                onSubmit={
                    handleSubmit
                }
                style={{
                    padding: "20px",
                    border:
                        "1px solid #ddd",
                    borderRadius: "8px",
                    marginBottom: "30px"
                }}
            >

                <h3>
                    {
                        editingId
                            ? "Edit Late Deduction Policy"
                            : "Create Late Deduction Policy"
                    }
                </h3>


                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                        gap: "15px"
                    }}
                >

                    <div>

                        <label>
                            Policy Name
                        </label>

                        <input
                            type="text"
                            name="policy_name"
                            value={
                                formData.policy_name
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Example: Security Staff Late Policy"
                            style={{
                                width: "100%",
                                padding: "8px",
                                marginTop: "5px"
                            }}
                        />

                    </div>


                    <div>

                        <label>
                            Description
                        </label>

                        <input
                            type="text"
                            name="description"
                            value={
                                formData.description
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
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
                                formData.effective_from
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
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
                                formData.effective_to
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                marginTop: "5px"
                            }}
                        />

                    </div>


                    <div>

                        <label>
                            Grace Period (Minutes)
                        </label>

                        <input
                            type="number"
                            min="0"
                            name="grace_minutes"
                            value={
                                formData.grace_minutes
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                marginTop: "5px"
                            }}
                        />

                    </div>


                    <div>

                        <label>
                            Allowed Late Occurrences
                        </label>

                        <input
                            type="number"
                            min="0"
                            name="allowed_late_occurrences"
                            value={
                                formData.allowed_late_occurrences
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                marginTop: "5px"
                            }}
                        />

                    </div>


                    <div>

                        <label>
                            Deduction Method
                        </label>

                        <select
                            name="deduction_method"
                            value={
                                formData.deduction_method
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                marginTop: "5px"
                            }}
                        >

                            <option value="NONE">
                                None
                            </option>

                            <option value="FIXED_AMOUNT">
                                Fixed Amount
                            </option>

                            <option value="DAILY_RATE">
                                Daily Rate
                            </option>

                            <option value="PERCENTAGE">
                                Percentage
                            </option>

                        </select>

                    </div>


                    <div>

                        <label>
                            Deduction Value
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            name="deduction_value"
                            value={
                                formData.deduction_value
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                marginTop: "5px"
                            }}
                        />

                    </div>


                    <div>

                        <label>
                            Maximum Deduction Days
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            name="max_deduction_days"
                            value={
                                formData.max_deduction_days
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px",
                                marginTop: "5px"
                            }}
                        />

                    </div>


                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            paddingTop: "25px"
                        }}
                    >

                        <input
                            type="checkbox"
                            name="is_active"
                            checked={
                                formData.is_active
                            }
                            onChange={
                                handleChange
                            }
                        />

                        <label>
                            Active
                        </label>

                    </div>

                </div>


                <div
                    style={{
                        marginTop: "15px"
                    }}
                >

                    <label>
                        Remarks
                    </label>

                    <textarea
                        name="remarks"
                        value={
                            formData.remarks
                        }
                        onChange={
                            handleChange
                        }
                        rows="3"
                        style={{
                            width: "100%",
                            padding: "8px",
                            marginTop: "5px"
                        }}
                    />

                </div>


                <div
                    style={{
                        marginTop: "20px",
                        display: "flex",
                        gap: "10px"
                    }}
                >

                    <button
                        type="submit"
                        disabled={saving}
                    >
                        {
                            saving
                                ? "Saving..."
                                : editingId
                                    ? "Update Policy"
                                    : "Save Policy"
                        }
                    </button>


                    {editingId && (

                        <button
                            type="button"
                            onClick={
                                handleCancel
                            }
                        >
                            Cancel
                        </button>

                    )}

                </div>

            </form>


            {/* =====================================
                POLICY LIST
            ===================================== */}

            <h3>
                Saved Policies
            </h3>


            {loading ? (

                <p>
                    Loading policies...
                </p>

            ) : policies.length === 0 ? (

                <p>
                    No late deduction policies
                    created yet.
                </p>

            ) : (

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

                                <th
                                    style={{
                                        border:
                                            "1px solid #ccc",
                                        padding: "8px"
                                    }}
                                >
                                    Policy Name
                                </th>

                                <th
                                    style={{
                                        border:
                                            "1px solid #ccc",
                                        padding: "8px"
                                    }}
                                >
                                    Effective From
                                </th>

                                <th
                                    style={{
                                        border:
                                            "1px solid #ccc",
                                        padding: "8px"
                                    }}
                                >
                                    Grace
                                </th>

                                <th
                                    style={{
                                        border:
                                            "1px solid #ccc",
                                        padding: "8px"
                                    }}
                                >
                                    Method
                                </th>

                                <th
                                    style={{
                                        border:
                                            "1px solid #ccc",
                                        padding: "8px"
                                    }}
                                >
                                    Status
                                </th>

                                <th
                                    style={{
                                        border:
                                            "1px solid #ccc",
                                        padding: "8px"
                                    }}
                                >
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                policies.map(
                                    policy => (

                                        <tr
                                            key={
                                                policy.id
                                            }
                                        >

                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #ccc",
                                                    padding: "8px"
                                                }}
                                            >
                                                {
                                                    policy.policy_name
                                                }
                                            </td>

                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #ccc",
                                                    padding: "8px"
                                                }}
                                            >
                                                {
                                                    policy.effective_from
                                                }
                                            </td>

                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #ccc",
                                                    padding: "8px"
                                                }}
                                            >
                                                {
                                                    policy.grace_minutes
                                                }{" "}
                                                min
                                            </td>

                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #ccc",
                                                    padding: "8px"
                                                }}
                                            >
                                                {
                                                    policy.deduction_method
                                                }
                                            </td>

                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #ccc",
                                                    padding: "8px"
                                                }}
                                            >
                                                {
                                                    policy.is_active
                                                        ? "Active"
                                                        : "Inactive"
                                                }
                                            </td>

                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #ccc",
                                                    padding: "8px"
                                                }}
                                            >

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(
                                                            policy
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>


                                                {policy.is_active && (

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeactivate(
                                                                policy
                                                            )
                                                        }
                                                        style={{
                                                            marginLeft:
                                                                "8px"
                                                        }}
                                                    >
                                                        Deactivate
                                                    </button>

                                                )}

                                            </td>

                                        </tr>

                                    )
                                )
                            }

                        </tbody>

                    </table>

                </div>

            )}

        </div>

    );

}


export default LateDeductionPolicy;
