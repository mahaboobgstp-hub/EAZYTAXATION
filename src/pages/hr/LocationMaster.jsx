import { useEffect, useState } from "react";

import { useCompany } from "../../context/CompanyContext";

import {
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation
} from "../../services/hr/locationService";


const initialFormData = {
    location_code: "",
    location_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contact_person: "",
    mobile: "",
    is_active: true
};


export default function LocationMaster() {

    const companyContext = useCompany();

    const selectedCompany =
        companyContext?.selectedCompany ||
        companyContext?.currentCompany ||
        companyContext?.company ||
        null;


    const [locations, setLocations] = useState([]);

    const [formData, setFormData] =
        useState(initialFormData);

    const [editingId, setEditingId] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    /* =====================================================
       LOAD LOCATIONS
    ===================================================== */

    useEffect(() => {

        if (selectedCompany?.id) {

            loadLocations();

        } else {

            setLocations([]);

        }

    }, [selectedCompany?.id]);


    async function loadLocations() {

        if (!selectedCompany?.id) {
            return;
        }

        try {

            setLoading(true);

            setError("");

            const data =
                await getLocations(
                    selectedCompany.id
                );

            setLocations(data || []);

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Failed to load locations."
            );

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       HANDLE INPUT CHANGE
    ===================================================== */

    function handleChange(event) {

        const {
            name,
            value,
            type,
            checked
        } = event.target;


        setFormData((previous) => ({
            ...previous,

            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));

    }


    /* =====================================================
       SAVE LOCATION
    ===================================================== */

    async function handleSubmit(event) {

        event.preventDefault();


        if (!selectedCompany?.id) {

            alert(
                "Please select a company first."
            );

            return;

        }


        if (
            !formData.location_code.trim() ||
            !formData.location_name.trim()
        ) {

            alert(
                "Location Code and Location Name are required."
            );

            return;

        }


        try {

            setLoading(true);

            setError("");


            if (editingId) {

                await updateLocation(
                    editingId,
                    formData,
                    selectedCompany.id
                );

                alert(
                    "Location updated successfully."
                );

            } else {

                await createLocation(
                    formData,
                    selectedCompany.id
                );

                alert(
                    "Location created successfully."
                );

            }


            setFormData(
                initialFormData
            );

            setEditingId(null);

            await loadLocations();


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Failed to save location."
            );

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       EDIT LOCATION
    ===================================================== */

    function handleEdit(location) {

        setEditingId(
            location.id
        );


        setFormData({

            location_code:
                location.location_code || "",

            location_name:
                location.location_name || "",

            address:
                location.address || "",

            city:
                location.city || "",

            state:
                location.state || "",

            pincode:
                location.pincode || "",

            contact_person:
                location.contact_person || "",

            mobile:
                location.mobile || "",

            is_active:
                location.is_active ?? true

        });


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =====================================================
       CANCEL EDIT
    ===================================================== */

    function handleCancelEdit() {

        setEditingId(null);

        setFormData(
            initialFormData
        );

        setError("");

    }


    /* =====================================================
       DELETE LOCATION
    ===================================================== */

    async function handleDelete(location) {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${location.location_name}"?`
            );


        if (!confirmed) return;


        try {

            setLoading(true);

            await deleteLocation(
                location.id,
                selectedCompany.id
            );


            alert(
                "Location deleted successfully."
            );


            await loadLocations();


        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Failed to delete location."
            );

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       NO COMPANY SELECTED
    ===================================================== */

    if (!selectedCompany) {

        return (

            <div
                style={{
                    padding: "30px"
                }}
            >

                <h2>
                    Location Master
                </h2>

                <p>
                    Please select a company.
                </p>

            </div>

        );

    }


    /* =====================================================
       PAGE
    ===================================================== */

    return (

        <div
            style={{
                padding: "30px"
            }}
        >


            {/* PAGE HEADER */}

            <h1>
                Location Master
            </h1>


            <p>

                Company:

                {" "}

                <strong>
                    {selectedCompany.company_name}
                </strong>

            </p>


            {/* ERROR */}

            {error && (

                <div
                    style={{
                        color: "red",
                        marginBottom: "15px"
                    }}
                >

                    {error}

                </div>

            )}


            {/* LOCATION FORM */}

            <form
                onSubmit={handleSubmit}
            >


                {/* ROW 1 */}

                <div
                    style={{
                        display: "grid",

                        gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",

                        gap: "15px",

                        marginBottom: "15px"
                    }}
                >

                    <div>

                        <label>
                            Location Code *
                        </label>

                        <input
                            type="text"
                            name="location_code"
                            value={formData.location_code}
                            onChange={handleChange}
                            placeholder="Location Code"
                            required
                        />

                    </div>


                    <div>

                        <label>
                            Location Name *
                        </label>

                        <input
                            type="text"
                            name="location_name"
                            value={formData.location_name}
                            onChange={handleChange}
                            placeholder="Location Name"
                            required
                        />

                    </div>

                </div>


                {/* ADDRESS */}

                <div
                    style={{
                        marginBottom: "15px"
                    }}
                >

                    <label>
                        Address
                    </label>

                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Complete Address"
                        rows="3"
                    />

                </div>


                {/* CITY / STATE / PINCODE */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",
                        gap: "15px",
                        marginBottom: "15px"
                    }}
                >

                    <div>

                        <label>City</label>

                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                        />

                    </div>


                    <div>

                        <label>State</label>

                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                        />

                    </div>


                    <div>

                        <label>Pincode</label>

                        <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                        />

                    </div>

                </div>


                {/* CONTACT DETAILS */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                        gap: "15px",
                        marginBottom: "15px"
                    }}
                >

                    <div>

                        <label>
                            Contact Person
                        </label>

                        <input
                            type="text"
                            name="contact_person"
                            value={
                                formData.contact_person
                            }
                            onChange={handleChange}
                        />

                    </div>


                    <div>

                        <label>
                            Mobile
                        </label>

                        <input
                            type="text"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                        />

                    </div>

                </div>


                {/* ACTIVE */}

                <div
                    style={{
                        marginBottom: "20px"
                    }}
                >

                    <label>

                        <input
                            type="checkbox"
                            name="is_active"
                            checked={
                                formData.is_active
                            }
                            onChange={handleChange}
                        />

                        {" "}

                        Active Location

                    </label>

                </div>


                {/* BUTTONS */}

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "30px"
                    }}
                >

                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {editingId
                            ? "Update Location"
                            : "Save Location"}

                    </button>


                    {editingId && (

                        <button
                            type="button"
                            onClick={
                                handleCancelEdit
                            }
                        >

                            Cancel

                        </button>

                    )}

                </div>

            </form>


            {/* LOCATION LIST */}

            <h2>
                Locations
            </h2>


            {loading && locations.length === 0 ? (

                <p>
                    Loading locations...
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

                                <th>Code</th>

                                <th>
                                    Location Name
                                </th>

                                <th>City</th>

                                <th>State</th>

                                <th>
                                    Contact Person
                                </th>

                                <th>Mobile</th>

                                <th>Status</th>

                                <th>Action</th>

                            </tr>

                        </thead>


                        <tbody>

                            {locations.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="8"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "20px"
                                        }}
                                    >

                                        No locations found.

                                    </td>

                                </tr>

                            ) : (

                                locations.map(
                                    (location) => (

                                        <tr
                                            key={
                                                location.id
                                            }
                                        >

                                            <td>
                                                {
                                                    location.location_code
                                                }
                                            </td>

                                            <td>
                                                {
                                                    location.location_name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    location.city || "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    location.state || "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    location.contact_person || "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    location.mobile || "-"
                                                }
                                            </td>

                                            <td>

                                                {location.is_active
                                                    ? "Active"
                                                    : "Inactive"}

                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(location)
                                                    }
                                                >

                                                    Edit

                                                </button>

                                                {" "}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(location)
                                                    }
                                                >

                                                    Delete

                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            )}

        </div>

    );

}
