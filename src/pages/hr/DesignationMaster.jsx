import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";

import {
    getDesignations,
    createDesignation,
    updateDesignation,
    deactivateDesignation
} from "../../services/hr/designationService";

function DesignationMaster() {

    const { currentCompany } = useCompany();

    const [designations, setDesignations] = useState([]);

    const [formData, setFormData] = useState({
        designation_code: "",
        designation_name: "",
        description: "",
        display_order: 0
    });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (currentCompany?.id) {
            loadDesignations(currentCompany.id);
        } else {
            setDesignations([]);
        }
    }, [currentCompany]);

    async function loadDesignations(companyId) {
        try {
            const data = await getDesignations(companyId);
            setDesignations(data);
        } catch (error) {
            console.error(error);
            alert("Unable to load designations.");
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }

    function resetForm() {
        setFormData({
            designation_code: "",
            designation_name: "",
            description: "",
            display_order: 0
        });

        setEditingId(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!currentCompany?.id) {
            alert("Please select a company first.");
            return;
        }

        if (!formData.designation_code.trim()) {
            alert("Please enter Designation Code.");
            return;
        }

        if (!formData.designation_name.trim()) {
            alert("Please enter Designation Name.");
            return;
        }

        try {

            if (editingId) {

                await updateDesignation(
                    editingId,
                    formData,
                    currentCompany.id
                );

                alert("Designation updated successfully.");

            } else {

                await createDesignation(
                    formData,
                    currentCompany.id
                );

                alert("Designation created successfully.");
            }

            resetForm();

            await loadDesignations(currentCompany.id);

        } catch (error) {

            console.error(error);
            alert(error.message || "Unable to save designation.");
        }
    }

    function handleEdit(designation) {

        setEditingId(designation.id);

        setFormData({
            designation_code: designation.designation_code || "",
            designation_name: designation.designation_name || "",
            description: designation.description || "",
            display_order: designation.display_order || 0
        });
    }

    async function handleDeactivate(id) {

        if (!window.confirm("Deactivate this designation?")) {
            return;
        }

        try {

            await deactivateDesignation(
                id,
                currentCompany.id
            );

            await loadDesignations(currentCompany.id);

        } catch (error) {

            console.error(error);
            alert(error.message || "Unable to deactivate designation.");
        }
    }

    return (
        <div style={{ padding: "25px" }}>

            <h2>Designation Master</h2>

            <p>
                Company:{" "}
                <strong>
                    {currentCompany?.company_name || "Select Company"}
                </strong>
            </p>

            {!currentCompany?.id ? (

                <div
                    style={{
                        padding: "15px",
                        background: "#fff3cd",
                        border: "1px solid #ffeeba",
                        borderRadius: "6px"
                    }}
                >
                    Please select a company from the Sidebar.
                </div>

            ) : (

                <>
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "15px",
                            marginTop: "20px",
                            marginBottom: "30px"
                        }}
                    >

                        <input
                            name="designation_code"
                            placeholder="Designation Code"
                            value={formData.designation_code}
                            onChange={handleChange}
                        />

                        <input
                            name="designation_name"
                            placeholder="Designation Name"
                            value={formData.designation_name}
                            onChange={handleChange}
                        />

                        <input
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            name="display_order"
                            placeholder="Display Order"
                            value={formData.display_order}
                            onChange={handleChange}
                        />

                        <div>

                            <button type="submit">
                                {editingId
                                    ? "Update Designation"
                                    : "Save Designation"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{ marginLeft: "10px" }}
                                >
                                    Cancel
                                </button>
                            )}

                        </div>

                    </form>

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >

                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Designation Name</th>
                                <th>Description</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {designations.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        style={{
                                            textAlign: "center",
                                            padding: "20px"
                                        }}
                                    >
                                        No designations found.
                                    </td>
                                </tr>

                            ) : (

                                designations.map(designation => (

                                    <tr key={designation.id}>

                                        <td>
                                            {designation.designation_code}
                                        </td>

                                        <td>
                                            {designation.designation_name}
                                        </td>

                                        <td>
                                            {designation.description || "-"}
                                        </td>

                                        <td>
                                            {designation.display_order}
                                        </td>

                                        <td>
                                            {designation.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </td>

                                        <td>

                                            <button
                                                onClick={() =>
                                                    handleEdit(designation)
                                                }
                                            >
                                                Edit
                                            </button>

                                            {designation.is_active && (
                                                <button
                                                    onClick={() =>
                                                        handleDeactivate(
                                                            designation.id
                                                        )
                                                    }
                                                    style={{
                                                        marginLeft: "8px"
                                                    }}
                                                >
                                                    Deactivate
                                                </button>
                                            )}

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>
                </>
            )}

        </div>
    );
}

export default DesignationMaster;
