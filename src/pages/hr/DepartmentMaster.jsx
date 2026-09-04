import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";

import {
    getDepartments,
    createDepartment,
    updateDepartment,
    deactivateDepartment
} from "../../services/hr/departmentService";

function DepartmentMaster() {

    const { currentCompany } = useCompany();

    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState({
        department_code: "",
        department_name: "",
        description: ""
    });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (currentCompany?.id) {
            loadDepartments(currentCompany.id);
        } else {
            setDepartments([]);
        }
    }, [currentCompany]);

    async function loadDepartments(companyId) {
        try {
            const data = await getDepartments(companyId);
            setDepartments(data);
        } catch (error) {
            console.error(error);
            alert("Unable to load departments.");
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
            department_code: "",
            department_name: "",
            description: ""
        });

        setEditingId(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!currentCompany?.id) {
            alert("Please select a company first.");
            return;
        }

        if (!formData.department_code.trim()) {
            alert("Please enter Department Code.");
            return;
        }

        if (!formData.department_name.trim()) {
            alert("Please enter Department Name.");
            return;
        }

        try {

            if (editingId) {

                await updateDepartment(
                    editingId,
                    formData,
                    currentCompany.id
                );

                alert("Department updated successfully.");

            } else {

                await createDepartment(
                    formData,
                    currentCompany.id
                );

                alert("Department created successfully.");
            }

            resetForm();

            await loadDepartments(currentCompany.id);

        } catch (error) {

            console.error(error);
            alert(error.message || "Unable to save department.");
        }
    }

    function handleEdit(department) {

        setEditingId(department.id);

        setFormData({
            department_code: department.department_code || "",
            department_name: department.department_name || "",
            description: department.description || ""
        });
    }

    async function handleDeactivate(id) {

        if (!window.confirm("Deactivate this department?")) {
            return;
        }

        try {

            await deactivateDepartment(
                id,
                currentCompany.id
            );

            await loadDepartments(currentCompany.id);

        } catch (error) {

            console.error(error);
            alert(error.message || "Unable to deactivate department.");
        }
    }

    return (
        <div style={{ padding: "25px" }}>

            <h2>Department Master</h2>

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
                            name="department_code"
                            placeholder="Department Code"
                            value={formData.department_code}
                            onChange={handleChange}
                        />

                        <input
                            name="department_name"
                            placeholder="Department Name"
                            value={formData.department_name}
                            onChange={handleChange}
                        />

                        <input
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                        />

                        <div>

                            <button type="submit">
                                {editingId
                                    ? "Update Department"
                                    : "Save Department"}
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
                                <th>Department Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {departments.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="5"
                                        style={{
                                            textAlign: "center",
                                            padding: "20px"
                                        }}
                                    >
                                        No departments found.
                                    </td>
                                </tr>

                            ) : (

                                departments.map(department => (

                                    <tr key={department.id}>

                                        <td>
                                            {department.department_code}
                                        </td>

                                        <td>
                                            {department.department_name}
                                        </td>

                                        <td>
                                            {department.description || "-"}
                                        </td>

                                        <td>
                                            {department.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </td>

                                        <td>

                                            <button
                                                onClick={() =>
                                                    handleEdit(department)
                                                }
                                            >
                                                Edit
                                            </button>

                                            {department.is_active && (
                                                <button
                                                    onClick={() =>
                                                        handleDeactivate(
                                                            department.id
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

export default DepartmentMaster;
