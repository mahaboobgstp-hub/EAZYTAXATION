import React, { useState } from "react";
import {
    FiMail,
    FiPhone,
    FiMapPin,
    FiMessageCircle
} from "react-icons/fi";

import "../../css/contact/Contact.css";

function Contact() {

    const [formData, setFormData] = useState({

        name: "",

        email: "",

        phone: "",

        company: "",

        message: ""

    });

    function handleChange(e) {

        const { name, value } = e.target;

        setFormData(prev => ({

            ...prev,

            [name]: value

        }));

    }

    function handleSubmit(e) {

        e.preventDefault();

        alert("Thank you! Our team will contact you shortly.");

        setFormData({

            name: "",

            email: "",

            phone: "",

            company: "",

            message: ""

        });

    }

    return (

        <div className="contact-page">

            {/* ===========================
                HERO
            =========================== */}

            <section className="contact-hero">

                <span className="contact-badge">

                    CONTACT US

                </span>

                <h1>

                    We'd Love To Hear From You

                </h1>

                <p>

                    Have questions about EAZYTAXATION ERP?
                    Our team is here to help.

                </p>

            </section>

            {/* ===========================
                CONTACT CONTENT
            =========================== */}

            <section className="contact-container">

                {/* LEFT */}

                <div className="contact-info">

                    <h2>

                        Get In Touch

                    </h2>

                    <p>

                        Reach us through any of the
                        following channels.

                    </p>

                    <div className="info-box">

                        <FiMail />

                        <div>

                            <strong>Email</strong>

                            <p>

                                support@eazytaxation.com

                            </p>

                        </div>

                    </div>

                    <div className="info-box">

                        <FiPhone />

                        <div>

                            <strong>Phone</strong>

                            <p>

                                +91 98765 43210

                            </p>

                        </div>

                    </div>

                    <div className="info-box">

                        <FiMessageCircle />

                        <div>

                            <strong>WhatsApp</strong>

                            <p>

                                +91 98765 43210

                            </p>

                        </div>

                    </div>

                    <div className="info-box">

                        <FiMapPin />

                        <div>

                            <strong>Office</strong>

                            <p>

                                Andhra Pradesh, India

                            </p>

                        </div>

                    </div>

                </div>

                {/* RIGHT */}

                <div className="contact-form">

                    <h2>

                        Send Us A Message

                    </h2>

                    <form onSubmit={handleSubmit}>

                        <input

                            type="text"

                            name="name"

                            placeholder="Full Name"

                            value={formData.name}

                            onChange={handleChange}

                            required

                        />

                        <input

                            type="email"

                            name="email"

                            placeholder="Email"

                            value={formData.email}

                            onChange={handleChange}

                            required

                        />

                        <input

                            type="text"

                            name="phone"

                            placeholder="Mobile Number"

                            value={formData.phone}

                            onChange={handleChange}

                        />

                        <input

                            type="text"

                            name="company"

                            placeholder="Company Name"

                            value={formData.company}

                            onChange={handleChange}

                        />

                        <textarea

                            rows="6"

                            name="message"

                            placeholder="Your Message"

                            value={formData.message}

                            onChange={handleChange}

                            required

                        />

                        <button type="submit">

                            Send Message

                        </button>

                    </form>

                </div>

            </section>

            {/* ===========================
                CTA
            =========================== */}

            <section className="contact-cta">

                <h2>

                    Ready To Transform Your Business?

                </h2>

                <p>

                    Start your free trial today and
                    experience the power of
                    EAZYTAXATION ERP.

                </p>

                <a

                    href="/register"

                    className="contact-button"

                >

                    Start Free Trial

                </a>

            </section>

        </div>

    );

}

export default Contact;
