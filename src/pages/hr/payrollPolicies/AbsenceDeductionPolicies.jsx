import React, {
    useEffect,
    useState
} from "react";

import {
    useCompany
} from "../../../context/CompanyContext";


const defaultForm = {

    id: null,

    policy_name: "",

    description: "",

    effective_from: "",

    effective_to: "",

    deduction_method:
        "DAILY_RATE",

    deduction_value: 1,

    half_day_deduction: 0.5,

    full_day_deduction: 1,

    is_active: true,

    remarks: ""

};


function AbsenceDeductionPolicies() {

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


    async function loadPolicies() {

        if (!companyId) {

            setPolicies([]);

            return;

        }


        try {

            setLoading(true);


            const {
                supabase
            } = await import(
                "../../../supabase/supabaseClient"
            );


            const {
                data,
                error
            } = await supabase

                .from(
                    "absence_deduction_policies"
                )

                .select("*")

                .eq(
                    "company_id",
                    companyId
                )

                .order(
                    "effective_from",
                    {
                        ascending: false
                    }
                );


            if (error) {
                throw error;
            }


            setPolicies(
                data || []
            );

        }
        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to load absence policies."
            );

        }
        finally {

            setLoading(false);

        }

    }


    useEffect(() => {

        loadPolicies();

    }, [
        companyId
    ]);


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


            const {
                supabase
            } = await import(
                "../../../supabase/supabaseClient"
            );


            const payload = {

                company_id:
                    companyId,

                policy_name:
                    formData.policy_name,

                description:
                    formData.description ||
                    null,

                effective_from:
                    formData.effective_from,

                effective_to:
                    formData.effective_to ||
                    null,

                deduction_method:
                    formData.deduction_method,

                deduction_value:
                    Number(
                        formData.deduction_value
                    ) || 0,

                half_day_deduction:
                    Number(
                        formData.half_day_deduction
                    ) || 0,

                full_day_deduction:
                    Number(
                        formData.full_day_deduction
                    ) || 0,

                is_active:
                    formData.is_active,

                remarks:
                    formData.remarks ||
                    null,

                updated_at:
                    new Date().toISOString()

            };


            if (editingId) {

                const {
                    error
                } = await supabase

                    .from(
                        "absence_deduction_policies"
                    )

                    .update(
                        payload
                    )

                    .eq(
                        "id",
                        editingId
                    )

                    .eq(
                        "company_id",
                        companyId
                    );


                if (error) {
                    throw error;
                }


                alert(
                    "Absence policy updated successfully."
                );

            }
            else {

                const {
                    error
                } = await supabase

                    .from(
                        "absence_deduction_policies"
                    )

                    .insert(
                        payload
                    );


                if (error) {
                    throw error;
                }


                alert(
                    "Absence policy created successfully."
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
                "Unable to save absence policy."
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

            deduction_method:
                policy.deduction_method ||
                "DAILY_RATE",

            deduction_value:
                policy.deduction_value ?? 1,

            half_day_deduction:
                policy.half_day_deduction ?? 0.5,

            full_day_deduction:
                policy.full_day_deduction ?? 1,

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

            const {
                supabase
            } = await import(
                "../../../supabase/supabaseClient"
            );


            const {
                error
            } = await supabase

                .from(
                    "absence_deduction_policies"
                )

                .update({

                    is_active: false,

                    updated_at:
                        new Date().toISOString()

                })

                .eq(
                    "id",
                    policy.id
                )

                .eq(
                    "company_id",
                    companyId
                );


            if (error) {
                throw error;
            }


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
                Absence Deduction Policies
            </h3>


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
                            Half-Day Deduction
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            name="half_day_deduction"
                            value={
                                formData.half_day_deduction
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
                            Full-Day Deduction
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            name="full_day_deduction"
                            value={
                                formData.full_day_deduction
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
                            Status
                        </label>

                        <div>

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

                            {" "}
                            Active

                        </div>

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

            )}

        </div>

    );

}


export default AbsenceDeductionPolicies;
