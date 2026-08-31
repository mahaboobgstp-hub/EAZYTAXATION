import React, { useEffect, useState } from "react";

import {
    getAllUnits,
    createUnit,
    updateUnit,
    deactivateUnit,
    activateUnit
} from "../../services/uomService";

import "../../css/masters/Uom.css";


function Uom() {

    const [units, setUnits] = useState([]);

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        unit_code: "",
        unit_name: "",
        symbol: "",
        decimal_places: 2,
        description: "",
        is_active: true
    });


    // =====================================================
    // LOAD UNITS
    // =====================================================

    useEffect(() => {

        loadUnits();

    }, []);


    const loadUnits = async () => {

        try {

            setLoading(true);

            const data = await getAllUnits();

            setUnits(data || []);

        } catch (error) {

            console.error(error);

            alert(error.message);

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // HANDLE INPUT
    // =====================================================

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData({

            ...formData,

            [name]: type === "checkbox"
                ? checked
                : value

        });

    };


    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {

        setEditingId(null);

        setFormData({

            unit_code: "",
            unit_name: "",
            symbol: "",
            decimal_places: 2,
            description: "",
            is_active: true

        });

    };


    // =====================================================
    // EDIT
    // =====================================================

    const handleEdit = (unit) => {

        setEditingId(unit.id);

        setFormData({

            unit_code: unit.unit_code || "",
            unit_name: unit.unit_name || "",
            symbol: unit.symbol || "",
            decimal_places: unit.decimal_places ?? 2,
            description: unit.description || "",
            is_active: unit.is_active

        });

    };


    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.unit_code.trim()) {

            alert("Please enter Unit Code.");

            return;

        }

        if (!formData.unit_name.trim()) {

            alert("Please enter Unit Name.");

            return;

        }


        try {

            setLoading(true);


            const data = {

                unit_code: formData.unit_code.trim().toUpperCase(),

                unit_name: formData.unit_name.trim(),

                symbol: formData.symbol.trim(),

                decimal_places: Number(formData.decimal_places),

                description: formData.description.trim(),

                is_active: formData.is_active

            };


            if (editingId) {

                await updateUnit(
                    editingId,
                    data
                );

                alert("Unit updated successfully.");

            } else {

                await createUnit(data);

                alert("Unit created successfully.");

            }


            resetForm();

            await loadUnits();


        } catch (error) {

            console.error(error);

            alert(error.message);


        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // ACTIVATE / DEACTIVATE
    // =====================================================

    const handleStatusChange = async (unit) => {

        const action = unit.is_active
            ? "deactivate"
            : "activate";


        const confirmed = window.confirm(

            `Are you sure you want to ${action} ${unit.unit_name}?`

        );


        if (!confirmed) return;


        try {

            setLoading(true);


            if (unit.is_active) {

                await deactivateUnit(unit.id);

            } else {

                await activateUnit(unit.id);

            }


            await loadUnits();


        } catch (error) {

            console.error(error);

            alert(error.message);


        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="uom-page">

            <div className="uom-header">

                <h2>Units (UOM) Master</h2>

                <p>
                    Create and manage Units of Measurement.
                </p>

            </div>


            {/* =====================================================
                FORM
            ===================================================== */}

            <form
                className="uom-form"
                onSubmit={handleSubmit}
            >

                <div className="uom-form-row">

                    <input
                        type="text"
                        name="unit_code"
                        placeholder="Unit Code"
                        value={formData.unit_code}
                        onChange={handleChange}
                        maxLength={20}
                        required
                    />


                    <input
                        type="text"
                        name="unit_name"
                        placeholder="Unit Name"
                        value={formData.unit_name}
                        onChange={handleChange}
                        maxLength={100}
                        required
                    />


                    <input
                        type="text"
                        name="symbol"
                        placeholder="Symbol"
                        value={formData.symbol}
                        onChange={handleChange}
                        maxLength={20}
                    />


                    <input
                        type="number"
                        name="decimal_places"
                        placeholder="Decimal Places"
                        value={formData.decimal_places}
                        onChange={handleChange}
                        min="0"
                        max="6"
                    />

                </div>


                <div className="uom-form-row">

                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={formData.description}
                        onChange={handleChange}
                    />


                    <label className="uom-active-checkbox">

                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                        />

                        Active

                    </label>

                </div>


                <div className="uom-form-actions">

                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {editingId
                            ? "Update Unit"
                            : "Save Unit"
                        }

                    </button>


                    {editingId && (

                        <button
                            type="button"
                            onClick={resetForm}
                            className="uom-cancel-button"
                        >

                            Cancel

                        </button>

                    )}

                </div>

            </form>


            {/* =====================================================
                TABLE
            ===================================================== */}

            <div className="uom-table-container">

                <table className="uom-table">

                    <thead>

                        <tr>

                            <th>Code</th>

                            <th>Unit Name</th>

                            <th>Symbol</th>

                            <th>Decimals</th>

                            <th>Status</th>

                            <th>Action</th>

                        </tr>

                    </thead>


                    <tbody>

                        {units.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="uom-empty"
                                >

                                    No units found.

                                </td>

                            </tr>

                        ) : (

                            units.map(unit => (

                                <tr key={unit.id}>

                                    <td>
                                        {unit.unit_code}
                                    </td>

                                    <td>
                                        {unit.unit_name}
                                    </td>

                                    <td>
                                        {unit.symbol}
                                    </td>

                                    <td>
                                        {unit.decimal_places}
                                    </td>

                                    <td>

                                        {unit.is_active
                                            ? "Active"
                                            : "Inactive"
                                        }

                                    </td>

                                    <td>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(unit)
                                            }
                                        >

                                            Edit

                                        </button>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleStatusChange(unit)
                                            }
                                        >

                                            {unit.is_active
                                                ? "Deactivate"
                                                : "Activate"
                                            }

                                        </button>

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default Uom;
