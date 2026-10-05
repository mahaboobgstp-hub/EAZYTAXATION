import React, {
    useState
} from "react";

import {
    useCompany
} from "../../context/CompanyContext";

import LeavePolicies
    from "./payrollPolicies/LeavePolicies";

import LateDeductionPolicies
    from "./payrollPolicies/LateDeductionPolicies";

import AbsenceDeductionPolicies
    from "./payrollPolicies/AbsenceDeductionPolicies";

import OtherPayrollRules
    from "./payrollPolicies/OtherPayrollRules";


function PayrollPolicyMaster() {

    const {
        currentCompany
    } = useCompany();


    const [
        activeTab,
        setActiveTab
    ] = useState(
        "leave"
    );


    return (

        <div
            style={{
                padding: "25px"
            }}
        >

            <h2>
                Payroll Policy Master
            </h2>


            <div
                style={{
                    marginBottom: "20px",
                    color: "#555"
                }}
            >
                Company:{" "}

                <strong>
                    {
                        currentCompany?.company_name ||
                        "Select Company"
                    }
                </strong>
            </div>


            {!currentCompany?.id && (

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
                    Please select a company
                    before managing payroll policies.
                </div>

            )}


            {/* =========================================
                TABS
            ========================================= */}

            <div
                style={{
                    display: "flex",
                    gap: "5px",
                    borderBottom:
                        "1px solid #ddd",
                    marginBottom: "20px",
                    flexWrap: "wrap"
                }}
            >

                <button
                    type="button"
                    onClick={() =>
                        setActiveTab(
                            "leave"
                        )
                    }
                    style={{
                        padding:
                            "10px 18px",
                        cursor: "pointer",
                        fontWeight:
                            activeTab === "leave"
                                ? "700"
                                : "400",
                        border:
                            "1px solid #ddd",
                        borderBottom:
                            activeTab === "leave"
                                ? "3px solid #333"
                                : "1px solid #ddd",
                        background:
                            activeTab === "leave"
                                ? "#f5f5f5"
                                : "#fff"
                    }}
                >
                    Leave Policies
                </button>


                <button
                    type="button"
                    onClick={() =>
                        setActiveTab(
                            "late"
                        )
                    }
                    style={{
                        padding:
                            "10px 18px",
                        cursor: "pointer",
                        fontWeight:
                            activeTab === "late"
                                ? "700"
                                : "400",
                        border:
                            "1px solid #ddd",
                        borderBottom:
                            activeTab === "late"
                                ? "3px solid #333"
                                : "1px solid #ddd",
                        background:
                            activeTab === "late"
                                ? "#f5f5f5"
                                : "#fff"
                    }}
                >
                    Late Deduction Policies
                </button>


                <button
                    type="button"
                    onClick={() =>
                        setActiveTab(
                            "absence"
                        )
                    }
                    style={{
                        padding:
                            "10px 18px",
                        cursor: "pointer",
                        fontWeight:
                            activeTab === "absence"
                                ? "700"
                                : "400",
                        border:
                            "1px solid #ddd",
                        borderBottom:
                            activeTab === "absence"
                                ? "3px solid #333"
                                : "1px solid #ddd",
                        background:
                            activeTab === "absence"
                                ? "#f5f5f5"
                                : "#fff"
                    }}
                >
                    Absence Deduction Policies
                </button>


                <button
                    type="button"
                    onClick={() =>
                        setActiveTab(
                            "other"
                        )
                    }
                    style={{
                        padding:
                            "10px 18px",
                        cursor: "pointer",
                        fontWeight:
                            activeTab === "other"
                                ? "700"
                                : "400",
                        border:
                            "1px solid #ddd",
                        borderBottom:
                            activeTab === "other"
                                ? "3px solid #333"
                                : "1px solid #ddd",
                        background:
                            activeTab === "other"
                                ? "#f5f5f5"
                                : "#fff"
                    }}
                >
                    Other Rules
                </button>

            </div>


            {/* =========================================
                TAB CONTENT
            ========================================= */}

            {activeTab === "leave" && (

                <LeavePolicies />

            )}


            {activeTab === "late" && (

                <LateDeductionPolicies />

            )}


            {activeTab === "absence" && (

                <AbsenceDeductionPolicies />

            )}


            {activeTab === "other" && (

                <OtherPayrollRules />

            )}

        </div>

    );

}


export default PayrollPolicyMaster;
