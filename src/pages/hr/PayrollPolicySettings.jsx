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

import "../../css/hr/PayrollPolicySettings.css";


const defaultLeavePolicy = {

    policy_name:
        "Standard Leave Policy",

    is_active:
        true,

    leave_policy_enabled:
        true,

    leave_accrual_enabled:
        true,

    monthly_accrual_enabled:
        true,

    prorate_joining_month:
        true,

    prorate_leaving_month:
        true,

    carry_forward_enabled:
        false,

    maximum_carry_forward_days:
        0,

    carry_forward_expiry_enabled:
        false,

    carry_forward_expiry_months:
        12,

    leave_encashment_enabled:
        false,

    encashment_during_employment:
        false,

    encashment_during_final_settlement:
        true,

    encashment_basis:
        "BASIC",

    maximum_encashment_days:
        0,

    negative_leave_balance_allowed:
        false,

    maximum_negative_balance:
        0,

    half_day_leave_enabled:
        true,

    quarter_day_leave_enabled:
        false,

    sandwich_rule_enabled:
        false,

    prefix_rule_enabled:
        false,

    suffix_rule_enabled:
        false,

    holiday_between_leave_enabled:
        false,

    weekly_off_between_leave_enabled:
        false,

    remarks:
        ""

};


const defaultLeaveType = {

    leave_type_name:
        "",

    leave_type_code:
        "",

    is_active:
        true,

    entitlement_enabled:
        true,

    entitlement_type:
        "MONTHLY",

    entitlement_value:
        "",

    maximum_annual_days:
        "",

    carry_forward_allowed:
        false,

    maximum_carry_forward_days:
        "",

    encashment_allowed:
        false,

    maximum_encashment_days:
        "",

    loss_of_pay_when_exhausted:
        true

};


function PayrollPolicySettings() {

    const {
        currentCompany,
        currentCompanyId,
        loading: companyLoading
    } = useCompany();


    const [
        activeTab,
        setActiveTab
    ] = useState(
        "leave"
    );


    const [
        leavePolicy,
        setLeavePolicy
    ] = useState(
        defaultLeavePolicy
    );


    const [
        leaveTypes,
        setLeaveTypes
    ] = useState([]);


    const [
        newLeaveType,
        setNewLeaveType
    ] = useState(
        defaultLeaveType
    );


    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        saving,
        setSaving
    ] = useState(false);


    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {

        if (!currentCompanyId) {

            setLeavePolicy(
                defaultLeavePolicy
            );

            setLeaveTypes([]);

            return;

        }

        loadLeavePolicy(
            currentCompanyId
        );

    }, [
        currentCompanyId
    ]);


    const loadLeavePolicy =
        async (companyId) => {

            try {

                setLoading(true);

                setError("");

                const {
                    data,
                    error
                } = await supabase

                    .from(
                        "leave_policies"
                    )

                    .select("*")

                    .eq(
                        "company_id",
                        companyId
                    )

                    .eq(
                        "is_active",
                        true
                    )

                    .order(
                        "created_at",
                        {
                            ascending: true
                        }
                    )

                    .limit(1);


                if (error) {

                    throw error;

                }


                if (
                    data &&
                    data.length > 0
                ) {

                    setLeavePolicy(
                        data[0]
                    );

                    await loadLeaveTypes(
                        data[0].id,
                        companyId
                    );

                } else {

                    setLeavePolicy(
                        defaultLeavePolicy
                    );

                    setLeaveTypes([]);

                }

            } catch (error) {

                console.error(
                    "Error loading leave policy:",
                    error
                );

                setError(
                    error.message ||
                    "Unable to load leave policy."
                );

            } finally {

                setLoading(false);

            }

        };


    const loadLeaveTypes =
        async (
            policyId,
            companyId
        ) => {

            const {
                data,
                error
            } = await supabase

                .from(
                    "leave_policy_types"
                )

                .select("*")

                .eq(
                    "company_id",
                    companyId
                )

                .eq(
                    "leave_policy_id",
                    policyId
                )

                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


            if (error) {

                throw error;

            }


            setLeaveTypes(
                data || []
            );

        };


    const handleLeavePolicyChange =
        (event) => {

            const {
                name,
                value,
                type,
                checked
            } = event.target;


            setLeavePolicy(
                previous => ({

                    ...previous,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value

                })
            );

        };


    const handleLeaveTypeChange =
        (event) => {

            const {
                name,
                value,
                type,
                checked
            } = event.target;


            setNewLeaveType(
                previous => ({

                    ...previous,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value

                })
            );

        };


    const saveLeavePolicy =
        async () => {

            if (!currentCompanyId) {

                alert(
                    "Please select a company first."
                );

                return;

            }


            if (
                !leavePolicy
                    .policy_name
                    .trim()
            ) {

                alert(
                    "Please enter a policy name."
                );

                return;

            }


            try {

                setSaving(true);

                setError("");


                const policyPayload = {

                    ...leavePolicy,

                    company_id:
                        currentCompanyId

                };


                delete policyPayload.id;
                delete policyPayload.created_at;
                delete policyPayload.updated_at;


                let savedPolicy;


                if (
                    leavePolicy.id
                ) {

                    const {
                        data,
                        error
                    } = await supabase

                        .from(
                            "leave_policies"
                        )

                        .update(
                            policyPayload
                        )

                        .eq(
                            "id",
                            leavePolicy.id
                        )

                        .eq(
                            "company_id",
                            currentCompanyId
                        )

                        .select()
                        .single();


                    if (error) {

                        throw error;

                    }


                    savedPolicy =
                        data;

                } else {

                    const {
                        data,
                        error
                    } = await supabase

                        .from(
                            "leave_policies"
                        )

                        .insert(
                            policyPayload
                        )

                        .select()
                        .single();


                    if (error) {

                        throw error;

                    }


                    savedPolicy =
                        data;

                }


                setLeavePolicy(
                    savedPolicy
                );


                alert(
                    "Leave Policy saved successfully."
                );

            } catch (error) {

                console.error(
                    "Error saving leave policy:",
                    error
                );

                setError(
                    error.message ||
                    "Unable to save leave policy."
                );

            } finally {

                setSaving(false);

            }

        };


    const addLeaveType =
        async () => {

            if (!currentCompanyId) {

                alert(
                    "Please select a company first."
                );

                return;

            }


            if (
                !leavePolicy.id
            ) {

                alert(
                    "Please save the Leave Policy first."
                );

                return;

            }


            if (
                !newLeaveType
                    .leave_type_name
                    .trim()
            ) {

                alert(
                    "Please enter the leave type name."
                );

                return;

            }


            try {

                setSaving(true);


                const payload = {

                    ...newLeaveType,

                    company_id:
                        currentCompanyId,

                    leave_policy_id:
                        leavePolicy.id,

                    entitlement_value:
                        Number(
                            newLeaveType
                                .entitlement_value ||
                            0
                        ),

                    maximum_annual_days:
                        Number(
                            newLeaveType
                                .maximum_annual_days ||
                            0
                        ),

                    maximum_carry_forward_days:
                        Number(
                            newLeaveType
                                .maximum_carry_forward_days ||
                            0
                        ),

                    maximum_encashment_days:
                        Number(
                            newLeaveType
                                .maximum_encashment_days ||
                            0
                        )

                };


                const {
                    data,
                    error
                } = await supabase

                    .from(
                        "leave_policy_types"
                    )

                    .insert(
                        payload
                    )

                    .select()
                    .single();


                if (error) {

                    throw error;

                }


                setLeaveTypes(
                    previous => [

                        ...previous,

                        data

                    ]
                );


                setNewLeaveType(
                    defaultLeaveType
                );


            } catch (error) {

                console.error(
                    "Error adding leave type:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to add leave type."
                );

            } finally {

                setSaving(false);

            }

        };


    const deleteLeaveType =
        async (id) => {

            if (
                !window.confirm(
                    "Remove this leave type?"
                )
            ) {

                return;

            }


            try {

                const {
                    error
                } = await supabase

                    .from(
                        "leave_policy_types"
                    )

                    .delete()

                    .eq(
                        "id",
                        id
                    )

                    .eq(
                        "company_id",
                        currentCompanyId
                    );


                if (error) {

                    throw error;

                }


                setLeaveTypes(
                    previous =>
                        previous.filter(
                            item =>
                                item.id !== id
                        )
                );

            } catch (error) {

                console.error(
                    error
                );

                alert(
                    error.message ||
                    "Unable to remove leave type."
                );

            }

        };


    if (companyLoading) {

        return (
            <div className="payroll-policy-page">

                <h2>
                    Payroll Policy Settings
                </h2>

                <p>
                    Loading company...
                </p>

            </div>
        );

    }


    return (

        <div className="payroll-policy-page">

            <div className="payroll-policy-header">

                <div>

                    <h2>
                        Payroll Policy Settings
                    </h2>

                    <p>

                        Configure payroll rules
                        for{" "}

                        <strong>
                            {
                                currentCompany
                                    ?.company_name ||
                                "Selected Company"
                            }
                        </strong>

                    </p>

                </div>

            </div>


            {!currentCompanyId && (

                <div className="policy-warning">

                    Please select a company before
                    configuring payroll policies.

                </div>

            )}


            {error && (

                <div className="policy-error">

                    {error}

                </div>

            )}


            <div className="payroll-policy-tabs">

                <button
                    type="button"
                    className={
                        activeTab === "leave"
                            ? "payroll-policy-tab active"
                            : "payroll-policy-tab"
                    }
                    onClick={() =>
                        setActiveTab("leave")
                    }
                >
                    Leave Policy
                </button>


                <button
                    type="button"
                    className={
                        activeTab === "late"
                            ? "payroll-policy-tab active"
                            : "payroll-policy-tab"
                    }
                    onClick={() =>
                        setActiveTab("late")
                    }
                >
                    Late Deduction
                </button>


                <button
                    type="button"
                    className={
                        activeTab === "absence"
                            ? "payroll-policy-tab active"
                            : "payroll-policy-tab"
                    }
                    onClick={() =>
                        setActiveTab("absence")
                    }
                >
                    Absence Deduction
                </button>

            </div>


            {activeTab === "leave" && (

                <div className="payroll-policy-content">

                    <div className="policy-section">

                        <div className="policy-section-header">

                            <div>

                                <h3>
                                    Leave Policy
                                </h3>

                                <p>
                                    Configure how leave
                                    is accrued, carried
                                    forward, encashed
                                    and treated during
                                    payroll.
                                </p>

                            </div>

                        </div>


                        <div className="policy-field-grid">

                            <div className="policy-field">

                                <label>
                                    Policy Name
                                </label>

                                <input
                                    type="text"
                                    name="policy_name"
                                    value={
                                        leavePolicy
                                            .policy_name
                                    }
                                    onChange={
                                        handleLeavePolicyChange
                                    }
                                />

                            </div>


                            <div className="policy-toggle-field">

                                <span>
                                    Policy Active
                                </span>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={
                                            leavePolicy
                                                .is_active
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>

                        </div>

                    </div>


                    <div className="policy-section">

                        <div className="policy-section-header">

                            <div>

                                <h3>
                                    Leave Accrual
                                </h3>

                                <p>
                                    Decide whether leave
                                    should be automatically
                                    accrued.
                                </p>

                            </div>

                        </div>


                        <div className="policy-settings-grid">

                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Leave Policy
                                    </strong>

                                    <small>
                                        Enable leave
                                        calculation for
                                        employees.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="leave_policy_enabled"
                                        checked={
                                            leavePolicy
                                                .leave_policy_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Leave Accrual
                                    </strong>

                                    <small>
                                        Automatically
                                        accrue leave.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="leave_accrual_enabled"
                                        checked={
                                            leavePolicy
                                                .leave_accrual_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Monthly Accrual
                                    </strong>

                                    <small>
                                        Accrue leave every
                                        month.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="monthly_accrual_enabled"
                                        checked={
                                            leavePolicy
                                                .monthly_accrual_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Prorate Joining Month
                                    </strong>

                                    <small>
                                        Calculate leave
                                        proportionately
                                        for new joiners.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="prorate_joining_month"
                                        checked={
                                            leavePolicy
                                                .prorate_joining_month
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Prorate Leaving Month
                                    </strong>

                                    <small>
                                        Calculate leave
                                        proportionately
                                        for employees
                                        leaving during
                                        the month.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="prorate_leaving_month"
                                        checked={
                                            leavePolicy
                                                .prorate_leaving_month
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>

                        </div>

                    </div>


                    <div className="policy-section">

                        <div className="policy-section-header">

                            <div>

                                <h3>
                                    Carry Forward
                                </h3>

                                <p>
                                    Configure unused
                                    leave handling.
                                </p>

                            </div>

                        </div>


                        <div className="policy-field-grid">

                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Carry Forward
                                    </strong>

                                    <small>
                                        Allow unused leave
                                        to move to the
                                        next period.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="carry_forward_enabled"
                                        checked={
                                            leavePolicy
                                                .carry_forward_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-field">

                                <label>
                                    Maximum Carry Forward Days
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    name="maximum_carry_forward_days"
                                    value={
                                        leavePolicy
                                            .maximum_carry_forward_days
                                    }
                                    disabled={
                                        !leavePolicy
                                            .carry_forward_enabled
                                    }
                                    onChange={
                                        handleLeavePolicyChange
                                    }
                                />

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Carry Forward Expiry
                                    </strong>

                                    <small>
                                        Expire carried
                                        forward leave
                                        after a period.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="carry_forward_expiry_enabled"
                                        checked={
                                            leavePolicy
                                                .carry_forward_expiry_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-field">

                                <label>
                                    Expiry After Months
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    name="carry_forward_expiry_months"
                                    value={
                                        leavePolicy
                                            .carry_forward_expiry_months
                                    }
                                    disabled={
                                        !leavePolicy
                                            .carry_forward_expiry_enabled
                                    }
                                    onChange={
                                        handleLeavePolicyChange
                                    }
                                />

                            </div>

                        </div>

                    </div>


                    <div className="policy-section">

                        <div className="policy-section-header">

                            <div>

                                <h3>
                                    Leave Encashment
                                </h3>

                                <p>
                                    Configure whether
                                    unused leave can
                                    be converted to money.
                                </p>

                            </div>

                        </div>


                        <div className="policy-settings-grid">

                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Leave Encashment
                                    </strong>

                                    <small>
                                        Enable leave
                                        encashment.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="leave_encashment_enabled"
                                        checked={
                                            leavePolicy
                                                .leave_encashment_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        During Employment
                                    </strong>

                                    <small>
                                        Allow encashment
                                        while employee
                                        is active.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="encashment_during_employment"
                                        checked={
                                            leavePolicy
                                                .encashment_during_employment
                                        }
                                        disabled={
                                            !leavePolicy
                                                .leave_encashment_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        During Final Settlement
                                    </strong>

                                    <small>
                                        Encash eligible
                                        leave when the
                                        employee leaves.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="encashment_during_final_settlement"
                                        checked={
                                            leavePolicy
                                                .encashment_during_final_settlement
                                        }
                                        disabled={
                                            !leavePolicy
                                                .leave_encashment_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-field">

                                <label>
                                    Encashment Basis
                                </label>

                                <select
                                    name="encashment_basis"
                                    value={
                                        leavePolicy
                                            .encashment_basis
                                    }
                                    disabled={
                                        !leavePolicy
                                            .leave_encashment_enabled
                                    }
                                    onChange={
                                        handleLeavePolicyChange
                                    }
                                >

                                    <option value="BASIC">
                                        Basic Salary
                                    </option>

                                    <option value="GROSS">
                                        Gross Salary
                                    </option>

                                </select>

                            </div>


                            <div className="policy-field">

                                <label>
                                    Maximum Encashment Days
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    name="maximum_encashment_days"
                                    value={
                                        leavePolicy
                                            .maximum_encashment_days
                                    }
                                    disabled={
                                        !leavePolicy
                                            .leave_encashment_enabled
                                    }
                                    onChange={
                                        handleLeavePolicyChange
                                    }
                                />

                            </div>

                        </div>

                    </div>


                    <div className="policy-section">

                        <div className="policy-section-header">

                            <div>

                                <h3>
                                    Leave Balance & Units
                                </h3>

                            </div>

                        </div>


                        <div className="policy-settings-grid">

                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Negative Leave Balance
                                    </strong>

                                    <small>
                                        Allow employees
                                        to take leave
                                        beyond available
                                        balance.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="negative_leave_balance_allowed"
                                        checked={
                                            leavePolicy
                                                .negative_leave_balance_allowed
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-field">

                                <label>
                                    Maximum Negative Balance
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    name="maximum_negative_balance"
                                    value={
                                        leavePolicy
                                            .maximum_negative_balance
                                    }
                                    disabled={
                                        !leavePolicy
                                            .negative_leave_balance_allowed
                                    }
                                    onChange={
                                        handleLeavePolicyChange
                                    }
                                />

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Half Day Leave
                                    </strong>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="half_day_leave_enabled"
                                        checked={
                                            leavePolicy
                                                .half_day_leave_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Quarter Day Leave
                                    </strong>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="quarter_day_leave_enabled"
                                        checked={
                                            leavePolicy
                                                .quarter_day_leave_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>

                        </div>

                    </div>


                    <div className="policy-section">

                        <div className="policy-section-header">

                            <div>

                                <h3>
                                    Sandwich / Prefix / Suffix Rules
                                </h3>

                                <p>
                                    Control how holidays
                                    and weekly offs around
                                    leave are treated.
                                </p>

                            </div>

                        </div>


                        <div className="policy-settings-grid">

                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Sandwich Rule
                                    </strong>

                                    <small>
                                        Apply leave treatment
                                        to intervening
                                        non-working days.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="sandwich_rule_enabled"
                                        checked={
                                            leavePolicy
                                                .sandwich_rule_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Prefix Rule
                                    </strong>

                                    <small>
                                        Apply special
                                        treatment to
                                        non-working days
                                        before leave.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="prefix_rule_enabled"
                                        checked={
                                            leavePolicy
                                                .prefix_rule_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Suffix Rule
                                    </strong>

                                    <small>
                                        Apply special
                                        treatment to
                                        non-working days
                                        after leave.
                                    </small>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="suffix_rule_enabled"
                                        checked={
                                            leavePolicy
                                                .suffix_rule_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Holiday Between Leave
                                    </strong>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="holiday_between_leave_enabled"
                                        checked={
                                            leavePolicy
                                                .holiday_between_leave_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row">

                                <div>

                                    <strong>
                                        Weekly Off Between Leave
                                    </strong>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="weekly_off_between_leave_enabled"
                                        checked={
                                            leavePolicy
                                                .weekly_off_between_leave_enabled
                                        }
                                        onChange={
                                            handleLeavePolicyChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>

                        </div>

                    </div>


                    <div className="policy-section">

                        <div className="policy-section-header">

                            <div>

                                <h3>
                                    Leave Types
                                </h3>

                                <p>
                                    Create the leave types
                                    used by this company.
                                </p>

                            </div>

                        </div>


                        {leaveTypes.length > 0 && (

                            <div className="leave-type-list">

                                {leaveTypes.map(
                                    leaveType => (

                                        <div
                                            className="leave-type-card"
                                            key={
                                                leaveType.id
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {
                                                        leaveType
                                                            .leave_type_name
                                                    }
                                                </strong>

                                                <span>

                                                    {
                                                        leaveType
                                                            .entitlement_value
                                                    }{" "}
                                                    days /{" "}
                                                    {
                                                        leaveType
                                                            .entitlement_type
                                                            .toLowerCase()
                                                    }

                                                </span>

                                            </div>


                                            <button
                                                type="button"
                                                className="policy-danger-button"
                                                onClick={() =>
                                                    deleteLeaveType(
                                                        leaveType.id
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}


                        <div className="leave-type-form">

                            <div className="policy-field">

                                <label>
                                    Leave Type Name
                                </label>

                                <input
                                    type="text"
                                    name="leave_type_name"
                                    placeholder="e.g. Casual Leave"
                                    value={
                                        newLeaveType
                                            .leave_type_name
                                    }
                                    onChange={
                                        handleLeaveTypeChange
                                    }
                                />

                            </div>


                            <div className="policy-field">

                                <label>
                                    Code
                                </label>

                                <input
                                    type="text"
                                    name="leave_type_code"
                                    placeholder="e.g. CL"
                                    value={
                                        newLeaveType
                                            .leave_type_code
                                    }
                                    onChange={
                                        handleLeaveTypeChange
                                    }
                                />

                            </div>


                            <div className="policy-field">

                                <label>
                                    Entitlement Type
                                </label>

                                <select
                                    name="entitlement_type"
                                    value={
                                        newLeaveType
                                            .entitlement_type
                                    }
                                    onChange={
                                        handleLeaveTypeChange
                                    }
                                >

                                    <option value="MONTHLY">
                                        Monthly
                                    </option>

                                    <option value="ANNUAL">
                                        Annual
                                    </option>

                                </select>

                            </div>


                            <div className="policy-field">

                                <label>
                                    Entitlement
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="entitlement_value"
                                    value={
                                        newLeaveType
                                            .entitlement_value
                                    }
                                    onChange={
                                        handleLeaveTypeChange
                                    }
                                />

                            </div>


                            <div className="policy-field">

                                <label>
                                    Maximum Annual Days
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="maximum_annual_days"
                                    value={
                                        newLeaveType
                                            .maximum_annual_days
                                    }
                                    onChange={
                                        handleLeaveTypeChange
                                    }
                                />

                            </div>


                            <div className="policy-setting-row compact">

                                <div>

                                    <strong>
                                        Carry Forward
                                    </strong>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="carry_forward_allowed"
                                        checked={
                                            newLeaveType
                                                .carry_forward_allowed
                                        }
                                        onChange={
                                            handleLeaveTypeChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row compact">

                                <div>

                                    <strong>
                                        Encashment
                                    </strong>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="encashment_allowed"
                                        checked={
                                            newLeaveType
                                                .encashment_allowed
                                        }
                                        onChange={
                                            handleLeaveTypeChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="policy-setting-row compact">

                                <div>

                                    <strong>
                                        LOP When Exhausted
                                    </strong>

                                </div>

                                <label className="policy-switch">

                                    <input
                                        type="checkbox"
                                        name="loss_of_pay_when_exhausted"
                                        checked={
                                            newLeaveType
                                                .loss_of_pay_when_exhausted
                                        }
                                        onChange={
                                            handleLeaveTypeChange
                                        }
                                    />

                                    <span className="policy-slider" />

                                </label>

                            </div>


                            <div className="leave-type-form-actions">

                                <button
                                    type="button"
                                    className="employee-save-button"
                                    disabled={
                                        saving ||
                                        !leavePolicy.id
                                    }
                                    onClick={
                                        addLeaveType
                                    }
                                >
                                    Add Leave Type
                                </button>

                            </div>

                        </div>

                    </div>


                    <div className="policy-section">

                        <div className="policy-field">

                            <label>
                                Remarks
                            </label>

                            <textarea
                                name="remarks"
                                rows="4"
                                value={
                                    leavePolicy
                                        .remarks || ""
                                }
                                onChange={
                                    handleLeavePolicyChange
                                }
                            />

                        </div>

                    </div>


                    <div className="policy-save-bar">

                        <button
                            type="button"
                            className="employee-save-button"
                            disabled={
                                saving ||
                                loading ||
                                !currentCompanyId
                            }
                            onClick={
                                saveLeavePolicy
                            }
                        >

                            {saving
                                ? "Saving..."
                                : "Save Leave Policy"
                            }

                        </button>

                    </div>

                </div>

            )}


            {activeTab === "late" && (

                <div className="policy-placeholder">

                    <h3>
                        Late Deduction Policy
                    </h3>

                    <p>
                        This tab will contain
                        configurable late attendance,
                        grace period, occurrence,
                        accumulated-minute and
                        rounding rules.
                    </p>

                </div>

            )}


            {activeTab === "absence" && (

                <div className="policy-placeholder">

                    <h3>
                        Absence Deduction Policy
                    </h3>

                    <p>
                        This tab will contain
                        configurable absence,
                        missing attendance,
                        leave balance and
                        consecutive absence rules.
                    </p>

                </div>

            )}

        </div>

    );

}


export default PayrollPolicySettings;
