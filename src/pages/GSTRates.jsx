import React, { useEffect, useMemo, useState } from "react";
import {
    FiSearch,
    FiUpload,
    FiPlus,
    FiRefreshCw,
    FiCheckCircle,
    FiClock,
    FiXCircle
} from "react-icons/fi";

import { supabase } from "../supabase/supabaseClient";

import "../css/GSTRates.css";

function GSTRates() {

    const [records, setRecords] = useState([]);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ACTIVE");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddForm, setShowAddForm] = useState(false);

    const [form, setForm] = useState({
        code: "",
        code_type: "HSN",
        description: "",
        gst_rate: "",
        cgst_rate: "",
        sgst_rate: "",
        igst_rate: "",
        cess_rate: "",
        effective_from: "",
        effective_to: "",
        source_reference: "",
        notes: ""
    });

    const loadRecords = async () => {

        setLoading(true);
        setError("");

        let query = supabase
            .from("hsn_sac_gst_master")
            .select("*")
            .order("code", { ascending: true });

        if (statusFilter !== "ALL") {
            query = query.eq("status", statusFilter);
        }

        if (typeFilter !== "ALL") {
            query = query.eq("code_type", typeFilter);
        }

        const { data, error } = await query;

        if (error) {
            console.error(error);
            setError(error.message);
            setRecords([]);
        } else {
            setRecords(data || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadRecords();
    }, [statusFilter, typeFilter]);

    const filteredRecords = useMemo(() => {

        const term = search.trim().toLowerCase();

        if (!term) {
            return records;
        }

        return records.filter((row) => {

            return (
                String(row.code || "")
                    .toLowerCase()
                    .includes(term)
                ||
                String(row.description || "")
                    .toLowerCase()
                    .includes(term)
            );

        });

    }, [records, search]);

    const handleFormChange = (field, value) => {

        setForm((prev) => ({
            ...prev,
            [field]: value
        }));

    };

    const calculateGST = (field, value) => {

        const gst = Number(value);

        if (Number.isNaN(gst)) {
            return;
        }

        if (field === "gst_rate") {

            handleFormChange(
                "gst_rate",
                value
            );

            handleFormChange(
                "cgst_rate",
                (gst / 2).toFixed(2)
            );

            handleFormChange(
                "sgst_rate",
                (gst / 2).toFixed(2)
            );

            handleFormChange(
                "igst_rate",
                gst.toFixed(2)
            );

            return;
        }

        handleFormChange(field, value);
    };

    const handleAddRecord = async (e) => {

        e.preventDefault();

        setError("");

        if (!form.code.trim()) {
            setError("HSN/SAC code is required.");
            return;
        }

        if (!form.description.trim()) {
            setError("Description is required.");
            return;
        }

        if (!form.source_reference.trim()) {
            setError(
                "Official source / notification reference is required."
            );
            return;
        }

        const payload = {

            code: form.code.trim(),

            code_type: form.code_type,

            description: form.description.trim(),

            gst_rate: Number(form.gst_rate || 0),

            cgst_rate: Number(form.cgst_rate || 0),

            sgst_rate: Number(form.sgst_rate || 0),

            igst_rate: Number(form.igst_rate || 0),

            cess_rate: Number(form.cess_rate || 0),

            effective_from:
                form.effective_from || null,

            effective_to:
                form.effective_to || null,

            status: "PENDING_VERIFICATION",

            source_type: "USER_ADDED",

            source_reference:
                form.source_reference.trim(),

            notes:
                form.notes.trim() || null
        };

        const { error } = await supabase
            .from("hsn_sac_gst_master")
            .insert([payload]);

        if (error) {

            console.error(error);

            setError(error.message);

            return;
        }

        setForm({
            code: "",
            code_type: "HSN",
            description: "",
            gst_rate: "",
            cgst_rate: "",
            sgst_rate: "",
            igst_rate: "",
            cess_rate: "",
            effective_from: "",
            effective_to: "",
            source_reference: "",
            notes: ""
        });

        setShowAddForm(false);

        await loadRecords();
    };

    const getStatusIcon = (status) => {

        if (status === "ACTIVE") {
            return <FiCheckCircle />;
        }

        if (status === "PENDING_VERIFICATION") {
            return <FiClock />;
        }

        return <FiXCircle />;
    };

    const getStatusLabel = (status) => {

        if (status === "PENDING_VERIFICATION") {
            return "Pending Verification";
        }

        if (status === "INACTIVE") {
            return "Inactive";
        }

        return "Active";
    };

    return (

        <div className="gst-page">

            {/* HEADER */}

            <div className="gst-header">

                <div>

                    <h1>
                        GST Rates
                    </h1>

                    <p>
                        HSN & SAC master with GST rate information
                    </p>

                </div>

                <div className="gst-header-actions">

                    <button
                        className="gst-btn secondary"
                        onClick={loadRecords}
                    >
                        <FiRefreshCw />

                        Refresh
                    </button>

                    <button
                        className="gst-btn secondary"
                        type="button"
                    >
                        <FiUpload />

                        Import Official List
                    </button>

                    <button
                        className="gst-btn primary"
                        onClick={() =>
                            setShowAddForm(!showAddForm)
                        }
                    >
                        <FiPlus />

                        Add HSN/SAC
                    </button>

                </div>

            </div>

            {/* INFORMATION */}

            <div className="gst-info">

                <strong>
                    Official GST Master
                </strong>

                <span>
                    Search HSN/SAC codes and descriptions here.
                    User-added entries remain pending verification
                    until confirmed from an official GST source.
                </span>

            </div>

            {/* ADD FORM */}

            {showAddForm && (

                <form
                    className="gst-card gst-form"
                    onSubmit={handleAddRecord}
                >

                    <div className="gst-form-title">

                        <div>

                            <h2>
                                Add HSN / SAC
                            </h2>

                            <p>
                                New entries are created as
                                Pending Verification.
                            </p>

                        </div>

                    </div>

                    <div className="gst-form-grid">

                        <div className="gst-field">

                            <label>
                                Code Type
                            </label>

                            <select
                                value={form.code_type}
                                onChange={(e) =>
                                    handleFormChange(
                                        "code_type",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="HSN">
                                    HSN
                                </option>

                                <option value="SAC">
                                    SAC
                                </option>

                            </select>

                        </div>

                        <div className="gst-field">

                            <label>
                                HSN / SAC Code
                            </label>

                            <input
                                value={form.code}
                                onChange={(e) =>
                                    handleFormChange(
                                        "code",
                                        e.target.value
                                    )
                                }
                                placeholder="Enter code"
                            />

                        </div>

                        <div className="gst-field full">

                            <label>
                                Description
                            </label>

                            <input
                                value={form.description}
                                onChange={(e) =>
                                    handleFormChange(
                                        "description",
                                        e.target.value
                                    )
                                }
                                placeholder="Official description"
                            />

                        </div>

                        <div className="gst-field">

                            <label>
                                GST Rate %
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                value={form.gst_rate}
                                onChange={(e) =>
                                    calculateGST(
                                        "gst_rate",
                                        e.target.value
                                    )
                                }
                                placeholder="18"
                            />

                        </div>

                        <div className="gst-field">

                            <label>
                                CGST %
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                value={form.cgst_rate}
                                onChange={(e) =>
                                    handleFormChange(
                                        "cgst_rate",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="gst-field">

                            <label>
                                SGST %
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                value={form.sgst_rate}
                                onChange={(e) =>
                                    handleFormChange(
                                        "sgst_rate",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="gst-field">

                            <label>
                                IGST %
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                value={form.igst_rate}
                                onChange={(e) =>
                                    handleFormChange(
                                        "igst_rate",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="gst-field">

                            <label>
                                Cess %
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                value={form.cess_rate}
                                onChange={(e) =>
                                    handleFormChange(
                                        "cess_rate",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="gst-field">

                            <label>
                                Effective From
                            </label>

                            <input
                                type="date"
                                value={form.effective_from}
                                onChange={(e) =>
                                    handleFormChange(
                                        "effective_from",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="gst-field">

                            <label>
                                Effective To
                            </label>

                            <input
                                type="date"
                                value={form.effective_to}
                                onChange={(e) =>
                                    handleFormChange(
                                        "effective_to",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="gst-field full">

                            <label>
                                Official Source / Notification
                            </label>

                            <input
                                value={form.source_reference}
                                onChange={(e) =>
                                    handleFormChange(
                                        "source_reference",
                                        e.target.value
                                    )
                                }
                                placeholder="Notification / GST source reference"
                            />

                        </div>

                        <div className="gst-field full">

                            <label>
                                Notes
                            </label>

                            <textarea
                                value={form.notes}
                                onChange={(e) =>
                                    handleFormChange(
                                        "notes",
                                        e.target.value
                                    )
                                }
                                rows="3"
                            />

                        </div>

                    </div>

                    {error && (

                        <div className="gst-error">
                            {error}
                        </div>

                    )}

                    <div className="gst-form-actions">

                        <button
                            type="button"
                            className="gst-btn secondary"
                            onClick={() =>
                                setShowAddForm(false)
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="gst-btn primary"
                        >
                            Add for Verification
                        </button>

                    </div>

                </form>

            )}

            {/* SEARCH */}

            <div className="gst-card gst-toolbar">

                <div className="gst-search">

                    <FiSearch />

                    <input
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search HSN, SAC or description..."
                    />

                </div>

                <select
                    value={typeFilter}
                    onChange={(e) =>
                        setTypeFilter(e.target.value)
                    }
                >

                    <option value="ALL">
                        All Types
                    </option>

                    <option value="HSN">
                        HSN
                    </option>

                    <option value="SAC">
                        SAC
                    </option>

                </select>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                >

                    <option value="ACTIVE">
                        Active
                    </option>

                    <option value="PENDING_VERIFICATION">
                        Pending Verification
                    </option>

                    <option value="INACTIVE">
                        Inactive
                    </option>

                    <option value="ALL">
                        All Status
                    </option>

                </select>

            </div>

            {/* ERROR */}

            {error && !showAddForm && (

                <div className="gst-error">
                    {error}
                </div>

            )}

            {/* TABLE */}

            <div className="gst-card gst-table-card">

                <div className="gst-table-wrapper">

                    <table className="gst-table">

                        <thead>

                            <tr>

                                <th>
                                    Code
                                </th>

                                <th>
                                    Type
                                </th>

                                <th>
                                    Description
                                </th>

                                <th>
                                    GST
                                </th>

                                <th>
                                    CGST
                                </th>

                                <th>
                                    SGST
                                </th>

                                <th>
                                    IGST
                                </th>

                                <th>
                                    Effective From
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Source
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        className="gst-empty"
                                    >
                                        Loading GST master...
                                    </td>

                                </tr>

                            ) : filteredRecords.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        className="gst-empty"
                                    >

                                        No HSN/SAC records found.

                                    </td>

                                </tr>

                            ) : (

                                filteredRecords.map((row) => (

                                    <tr key={row.id}>

                                        <td className="gst-code">

                                            {row.code}

                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    row.code_type === "HSN"
                                                        ? "type-badge hsn"
                                                        : "type-badge sac"
                                                }
                                            >
                                                {row.code_type}
                                            </span>

                                        </td>

                                        <td className="gst-description">

                                            {row.description}

                                        </td>

                                        <td>
                                            {row.gst_rate}%
                                        </td>

                                        <td>
                                            {row.cgst_rate}%
                                        </td>

                                        <td>
                                            {row.sgst_rate}%
                                        </td>

                                        <td>
                                            {row.igst_rate}%
                                        </td>

                                        <td>
                                            {row.effective_from || "-"}
                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    `status-badge ${row.status.toLowerCase()}`
                                                }
                                            >

                                                {getStatusIcon(row.status)}

                                                {getStatusLabel(row.status)}

                                            </span>

                                        </td>

                                        <td>

                                            {row.source_type === "OFFICIAL"
                                                ? "Official"
                                                : "User Added"
                                            }

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                <div className="gst-table-footer">

                    Showing {filteredRecords.length} record(s)

                </div>

            </div>

        </div>
    );
}

export default GSTRates;
