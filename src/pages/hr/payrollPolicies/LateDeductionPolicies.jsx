import React, {
    useEffect,
    useState
} from "react";

import {
    useCompany
} from "../../../context/CompanyContext";

import {
    getLateDeductionPolicies,
    createLateDeductionPolicy,
    updateLateDeductionPolicy,
    deactivateLateDeductionPolicy
} from "../../../services/hr/lateDeductionPolicyService";


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


function LateDeductionPolicies() {

    const {
        currentCompany
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


    const companyId =
        currentCompany?.id;


    useEffect(() => {

        if (!companyId) {

            setPolicies([]);

            return;

        }

        loadPolicies();

    }, [
        companyId
    ]);


    async function loadPolicies() {

        try {

            setLoading(true);

            const data =
                await getLateDeductionPolicies(
                    companyId
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


    async function handleSubmit(e) {

        e.preventDefault();


        if (!companyId) {

            alert(
                "Please select a company."
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
                "Effective From is required."
            );

            return;

        }


        try {

            setSaving(true);


            if (editingId) {

                await updateLateDeductionPolicy(

                    editingId,

                    formData,

                    companyId

                );

                alert(
                    "Policy updated successfully."
                );

            }
            else {

                await createLateDeductionPolicy(

                    formData,

                    companyId

                );

                alert(
                    "Policy created successfully."
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

    }


    function handleCancel() {

        setEditingId(null);

        setFormData(
            defaultForm
        );

    }


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

                companyId

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

        <div>

            <h3>
                Late Deduction Policies
            </h3>


            {/* =====================================
                FORM
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
                    marginBottom: "25px"
                }}
            >

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
                            style={{
                                width: "100%",
                                padding: "8px"
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
                                formData.effective_from
                            }
                            onChange={
                                handleChange
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
                                formData.effective_to
                            }
                            onChange={
                                handleChange
                            }
                            style={{
                                width: "100%",
                                padding: "8px"
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
                                padding: "8px"
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
                                padding: "8px"
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
                                padding: "8px"
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
                                padding: "8px"
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
                                padding: "8px"
                            }}
                        />

                    </div>


                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
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
                            padding: "8px"
                        }}
                    />

                </div>


                <div
                    style={{
                        marginTop: "15px"
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
                            style={{
                                marginLeft: "10px"
                            }}
                        >
                            Cancel
                        </button>

                    )}

                </div>

            </form>


            {/* =====================================
                LIST
            ===================================== */}

            <h4>
                Saved Policies
            </h4>


            {loading ? (

                <p>
                    Loading...
                </p>

            ) : policies.length === 0 ? (

                <p>
                    No policies created yet.
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

                                <th>Policy Name</th>
                                <th>Effective From</th>
                                <th>Grace</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Actions</th>

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

                                            <td>
                                                {
                                                    policy.policy_name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    policy.effective_from
                                                }
                                            </td>

                                            <td>
                                                {
                                                    policy.grace_minutes
                                                }{" "}
                                                min
                                            </td>

                                            <td>
                                                {
                                                    policy.deduction_method
                                                }
                                            </td>

                                            <td>
                                                {
                                                    policy.is_active
                                                        ? "Active"
                                                        : "Inactive"
                                                }
                                            </td>

                                            <td>

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


export default LateDeductionPolicies;
