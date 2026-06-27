import React, { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function PurchaseInvoicePrint({

    company,

    vendor,

    invoice,

    items,

    settings,

    onClose

}) {

    const printRef = useRef(null);

    useEffect(() => {

        if (settings?.auto_print) {

            setTimeout(() => {

                window.print();

            }, 500);

        }

    }, [settings]);

    const downloadPDF = async () => {

        const element = printRef.current;

        if (!element) return;

        const canvas = await html2canvas(

            element,

            {

                scale: 2,

                useCORS: true

            }

        );

        const image = canvas.toDataURL(

            "image/png"

        );

        const pdf = new jsPDF(

            "p",

            "mm",

            "a4"

        );

        const pageWidth =

            pdf.internal.pageSize.getWidth();

        const pageHeight =

            (canvas.height * pageWidth) /

            canvas.width;

        pdf.addImage(

            image,

            "PNG",

            0,

            0,

            pageWidth,

            pageHeight

        );

        pdf.save(

            `${invoice.invoice_no}.pdf`

        );

    };

    return (

        <div className="print-wrapper">

            <div
                className="invoice-print"
                ref={printRef}
            >

                <div className="print-header">

                    <div className="company-section">

                        {

                            settings?.company_logo && (

                                <img

                                    src={settings.company_logo}

                                    alt="Company Logo"

                                    className="company-logo"

                                />

                            )

                        }

                        <h2>

                            {company.company_name}

                        </h2>

                        <p>

                            {company.address}

                        </p>

                        <p>

                            GSTIN :

                            {company.gstin}

                        </p>

                        <p>

                            Phone :

                            {company.phone}

                        </p>

                        <p>

                            Email :

                            {company.email}

                        </p>

                    </div>

                    <div className="document-title">

                        <h1>

                            PURCHASE INVOICE

                        </h1>

                    </div>

                </div>

                <hr />

                <div className="party-details">

                    <div className="vendor-details">

                        <h3>

                            Supplier

                        </h3>

                        <p>

                            <strong>

                                {vendor.vendor_name}

                            </strong>

                        </p>

                        <p>

                            {vendor.address}

                        </p>

                        <p>

                            GSTIN :

                            {vendor.gstin}

                        </p>

                        <p>

                            State :

                            {vendor.state}

                        </p>

                    </div>

                    <div className="invoice-details">

                        <table>

                            <tbody>

                                <tr>

                                    <td>

                                        Purchase No

                                    </td>

                                    <td>

                                        {invoice.invoice_no}

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        Date

                                    </td>

                                    <td>

                                        {invoice.invoice_date}

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        Supplier Invoice

                                    </td>

                                    <td>

                                        {

                                            invoice.supplier_invoice_no

                                        }

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        Supplier Date

                                    </td>

                                    <td>

                                        {

                                            invoice.supplier_invoice_date

                                        }

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        Vehicle No

                                    </td>

                                    <td>

                                        {invoice.vehicle_no}

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        E-Way Bill

                                    </td>

                                    <td>

                                        {invoice.eway_bill_no}

                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                </div>

                <br />

                <table className="print-items-table">

                    <thead>

                        <tr>

                            <th>No</th>

                            <th>Item</th>

                            <th>HSN</th>

                            <th>Qty</th>

                            <th>Rate</th>

                            <th>Taxable</th>

                            <th>GST%</th>

                            <th>CGST</th>

                            <th>SGST</th>

                            <th>IGST</th>

                            <th>Total</th>

                        </tr>

                    </thead>

                    <tbody>
                                          {

                        items && items.length > 0 ? (

                            items.map((item, index) => (

                                <tr key={index}>

                                    <td>

                                        {index + 1}

                                    </td>

                                    <td>

                                        {item.item_name}

                                    </td>

                                    <td>

                                        {item.hsn_sac}

                                    </td>

                                    <td
                                        style={{
                                            textAlign: "right"
                                        }}
                                    >

                                        {Number(
                                            item.qty || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td
                                        style={{
                                            textAlign: "right"
                                        }}
                                    >

                                        {Number(
                                            item.rate || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td
                                        style={{
                                            textAlign: "right"
                                        }}
                                    >

                                        {Number(
                                            item.taxable_value || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td
                                        style={{
                                            textAlign: "center"
                                        }}
                                    >

                                        {Number(
                                            item.gst_rate || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td
                                        style={{
                                            textAlign: "right"
                                        }}
                                    >

                                        {Number(
                                            item.cgst_amount || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td
                                        style={{
                                            textAlign: "right"
                                        }}
                                    >

                                        {Number(
                                            item.sgst_amount || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td
                                        style={{
                                            textAlign: "right"
                                        }}
                                    >

                                        {Number(
                                            item.igst_amount || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td
                                        style={{
                                            textAlign: "right",
                                            fontWeight: "bold"
                                        }}
                                    >

                                        {Number(
                                            item.line_total || 0
                                        ).toFixed(2)}

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="11"
                                    style={{
                                        textAlign: "center",
                                        padding: "20px"
                                    }}
                                >

                                    No Items Found

                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

            <br />

            <div className="invoice-summary">

                <table className="summary-table">

                    <tbody>

                        <tr>

                            <td>

                                Taxable Value

                            </td>

                            <td>

                                ₹ {Number(
                                    invoice.taxable || 0
                                ).toFixed(2)}

                            </td>

                        </tr>

                        <tr>

                            <td>

                                CGST

                            </td>

                            <td>

                                ₹ {Number(
                                    invoice.cgst || 0
                                ).toFixed(2)}

                            </td>

                        </tr>

                        <tr>

                            <td>

                                SGST

                            </td>

                            <td>

                                ₹ {Number(
                                    invoice.sgst || 0
                                ).toFixed(2)}

                            </td>

                        </tr>

                        <tr>

                            <td>

                                IGST

                            </td>

                            <td>

                                ₹ {Number(
                                    invoice.igst || 0
                                ).toFixed(2)}

                            </td>

                        </tr>

                        <tr>

                            <td>

                                Round Off

                            </td>

                            <td>

                                ₹ {Number(
                                    invoice.roundOff || 0
                                ).toFixed(2)}

                            </td>

                        </tr>

                        <tr
                            className="grand-total-row"
                        >

                            <td>

                                Grand Total

                            </td>

                            <td>

                                ₹ {Number(
                                    invoice.grandTotal || 0
                                ).toFixed(2)}

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

            <br />
                          <div className="amount-in-words">

                <strong>

                    Amount in Words :

                </strong>

                <br />

                <span>

                    {invoice.amount_in_words || ""}

                </span>

            </div>

            <br />

            <div className="remarks-section">

                <strong>

                    Remarks

                </strong>

                <p>

                    {invoice.remarks || "-"}

                </p>

            </div>

            <br />

            {

                settings?.show_bank_details && (

                    <div className="bank-details">

                        <h3>

                            Bank Details

                        </h3>

                        <table className="bank-table">

                            <tbody>

                                <tr>

                                    <td>

                                        Bank Name

                                    </td>

                                    <td>

                                        {settings.bank_name}

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        Account Name

                                    </td>

                                    <td>

                                        {settings.account_name}

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        Account Number

                                    </td>

                                    <td>

                                        {settings.account_number}

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        IFSC Code

                                    </td>

                                    <td>

                                        {settings.ifsc_code}

                                    </td>

                                </tr>

                                <tr>

                                    <td>

                                        Branch

                                    </td>

                                    <td>

                                        {settings.branch_name}

                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                )

            }

            <br />

            {

                settings?.show_terms && (

                    <div className="terms-section">

                        <h3>

                            Terms & Conditions

                        </h3>

                        <div className="terms-box">

                            {

                                settings.terms_conditions

                            }

                        </div>

                    </div>

                )

            }

            <br />

            <div className="signature-section">

                <div>

                    <strong>

                        Receiver's Signature

                    </strong>

                </div>

                <div>

                    {

                        settings?.signature && (

                            <img

                                src={settings.signature}

                                alt="Signature"

                                className="signature-image"

                            />

                        )

                    }

                    <br />

                    <strong>

                        Authorized Signatory

                    </strong>

                </div>

            </div>

            <br />

            <div className="print-buttons">

                <button

                    type="button"

                    onClick={() => window.print()}

                >

                    Print

                </button>

                <button

                    type="button"

                    onClick={downloadPDF}

                >

                    Download PDF

                </button>

                <button

                    type="button"

                    onClick={onClose}

                >

                    Close

                </button>

            </div>
                      </div>

    );

}

export default PurchaseInvoicePrint;
