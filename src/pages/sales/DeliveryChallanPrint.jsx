import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../../css/sales/DeliveryChallanPrint.css";
import { numberToWords } from "../../utils/numberToWords";
import { formatAmount } from "../../utils/amountFormatter";

function DeliveryChallanPrint({
    challan,
    items,
    settings,
    company,
    customer,
    onClose
}) {

    if (!challan) return null;

    const amountInWords = numberToWords(
        Number(challan.total_amount || 0)
    );


    const documentTitle =
        settings?.delivery_document_title ||
        "DELIVERY CHALLAN";


    const handleDownloadPDF = async () => {

        const input =
            document.getElementById(
                "delivery-challan-content"
            );

        if (!input) {
            alert("Delivery Challan content not found.");
            return;
        }


        try {

            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                scrollY: 0,
                logging: false
            });


            const imgData =
                canvas.toDataURL("image/png");


            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });


            const pageWidth =
                pdf.internal.pageSize.getWidth();

            const pageHeight =
                pdf.internal.pageSize.getHeight();


            const pdfMargin = 2;


            pdf.addImage(
                imgData,
                "PNG",
                pdfMargin,
                pdfMargin,
                pageWidth - pdfMargin * 2,
                pageHeight - pdfMargin * 2
            );


            pdf.save(
                `${challan.challan_no}.pdf`
            );

        } catch (error) {

            console.error(
                "PDF download error:",
                error
            );

            alert(
                "Unable to generate PDF."
            );

        }

    };


    return (

        <div className="dc-print-overlay">

            <div className="dc-print-container">


                {/* =========================================
                    ACTIONS
                ========================================= */}

                <div className="dc-print-actions">

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        Close
                    </button>


                    <button
                        type="button"
                        onClick={() => window.print()}
                    >
                        Print Delivery Challan
                    </button>


                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                    >
                        Download PDF
                    </button>

                </div>


                {/* =========================================
                    PRINT CONTENT
                ========================================= */}

                <div id="delivery-challan-content">


                    {/* HEADER */}

                    <div className="dc-title-row">

                        <div className="dc-title-line"></div>

                        <h1>
                            {documentTitle}
                        </h1>

                        <div className="dc-title-line"></div>

                    </div>


                    <div className="dc-company-section">


                        {/* LOGO */}

                        <div className="dc-logo">

                            {settings?.show_logo &&
                                settings?.logo_url && (

                                    <img
                                        src={settings.logo_url}
                                        alt="Company Logo"
                                    />

                                )}

                        </div>


                        {/* COMPANY */}

                        <div className="dc-company-details">

                            <h2>
                                {company?.company_name}
                            </h2>

                            <p>
                                {company?.address}
                            </p>

                            <p>
                                Phone : {company?.mobile}
                                {" | "}
                                Email : {company?.email}
                            </p>

                            <h4>
                                GSTIN : {company?.gstin}
                            </h4>

                        </div>

                    </div>


                    <hr className="dc-divider" />


                    {/* BASIC INFORMATION */}

                    <div className="dc-info-wrapper">


                        <div className="dc-info-left">

                            <div className="dc-info-row">
                                <span>
                                    Challan No.
                                </span>

                                <span>:</span>

                                <strong>
                                    {challan.challan_no}
                                </strong>
                            </div>


                            <div className="dc-info-row">

                                <span>
                                    Challan Date
                                </span>

                                <span>:</span>

                                <strong>
                                    {challan.challan_date}
                                </strong>

                            </div>


                            {challan.vehicle_no && (

                                <div className="dc-info-row">

                                    <span>
                                        Vehicle No.
                                    </span>

                                    <span>:</span>

                                    <strong>
                                        {challan.vehicle_no}
                                    </strong>

                                </div>

                            )}


                            {challan.eway_bill_no && (

                                <div className="dc-info-row">

                                    <span>
                                        E-Way Bill No.
                                    </span>

                                    <span>:</span>

                                    <strong>
                                        {challan.eway_bill_no}
                                    </strong>

                                </div>

                            )}

                        </div>


                        {settings?.show_bank_details && (

                            <div className="dc-bank-card">

                                <div className="dc-bank-title">
                                    Bank Details
                                </div>

                                <div className="dc-bank-row">
                                    <span>Bank Name</span>
                                    <span>:</span>
                                    <span>
                                        {settings.bank_name}
                                    </span>
                                </div>

                                <div className="dc-bank-row">
                                    <span>A/C Number</span>
                                    <span>:</span>
                                    <span>
                                        {settings.account_number}
                                    </span>
                                </div>

                                <div className="dc-bank-row">
                                    <span>IFSC Code</span>
                                    <span>:</span>
                                    <span>
                                        {settings.ifsc_code}
                                    </span>
                                </div>

                                <div className="dc-bank-row">
                                    <span>UPI ID</span>
                                    <span>:</span>
                                    <span>
                                        {settings.upi_id}
                                    </span>
                                </div>

                            </div>

                        )}

                    </div>


                    {/* CUSTOMER */}

                    <div className="dc-party-box">


                        <div className="dc-party-left">

                            <h3>
                                Bill To
                            </h3>

                            <p>
                                <strong>
                                    {challan.customer_name}
                                </strong>
                            </p>

                            <p>
                                {challan.billing_address}
                            </p>

                            {customer?.gstin && (

                                <p>
                                    GSTIN : {customer.gstin}
                                </p>

                            )}

                            <p>
                                State :
                                {" "}
                                {customer?.state ||
                                    challan.place_of_supply}
                            </p>

                        </div>


                        <div className="dc-party-right">

                            <h3>
                                Ship To
                            </h3>

                            <p>
                                <strong>
                                    {challan.shipping_name ||
                                        challan.customer_name}
                                </strong>
                            </p>

                            <p>
                                {challan.shipping_address ||
                                    challan.billing_address}
                            </p>

                            {challan.shipping_gstin && (

                                <p>
                                    GSTIN :
                                    {" "}
                                    {challan.shipping_gstin}
                                </p>

                            )}

                            <p>
                                State :
                                {" "}
                                {challan.shipping_state ||
                                    challan.place_of_supply}
                            </p>

                        </div>

                    </div>


                    {/* ITEMS */}

                    <table className="dc-items-table">

                        <thead>

                            <tr>

                                <th>#</th>

                                <th>
                                    Item Description
                                </th>

                                <th>
                                    HSN/SAC
                                </th>

                                <th>
                                    Qty
                                </th>

                                <th>
                                    Unit
                                </th>

                                <th>
                                    Rate
                                </th>

                                <th>
                                    Amount
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {items.map(
                                (item, index) => (

                                    <tr
                                        key={
                                            item.id ||
                                            index
                                        }
                                    >

                                        <td>
                                            {index + 1}
                                        </td>

                                        <td>
                                            {item.item_name}
                                        </td>

                                        <td>
                                            {item.hsn_sac}
                                        </td>

                                        <td>
                                            {item.qty}
                                        </td>

                                        <td>
                                            {item.unit}
                                        </td>

                                        <td>
                                            ₹{" "}
                                            {formatAmount(
                                                item.rate
                                            )}
                                        </td>

                                        <td>
                                            ₹{" "}
                                            {formatAmount(
                                                item.amount
                                            )}
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>


                    {/* TOTALS */}

                    <div className="dc-summary">


                        <div className="dc-summary-row">

                            <span>
                                Taxable Value
                            </span>

                            <strong>
                                ₹{" "}
                                {formatAmount(
                                    challan.taxable_value
                                )}
                            </strong>

                        </div>


                        <div className="dc-summary-row">

                            <span>
                                CGST
                            </span>

                            <strong>
                                ₹{" "}
                                {formatAmount(
                                    challan.cgst
                                )}
                            </strong>

                        </div>


                        <div className="dc-summary-row">

                            <span>
                                SGST
                            </span>

                            <strong>
                                ₹{" "}
                                {formatAmount(
                                    challan.sgst
                                )}
                            </strong>

                        </div>


                        <div className="dc-summary-row">

                            <span>
                                IGST
                            </span>

                            <strong>
                                ₹{" "}
                                {formatAmount(
                                    challan.igst
                                )}
                            </strong>

                        </div>


                        <div className="dc-grand-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                ₹{" "}
                                {formatAmount(
                                    challan.total_amount
                                )}
                            </strong>

                        </div>

                    </div>


                    {/* AMOUNT IN WORDS */}

                    <div className="dc-amount-words">

                        <strong>
                            Amount in Words:
                        </strong>

                        <span>
                            {amountInWords}
                        </span>

                    </div>


                    {/* REMARKS / TERMS / SIGNATURE */}

                    <div className="dc-bottom">


                        <div className="dc-bottom-left">

                            {challan.remarks && (

                                <div className="dc-box">

                                    <div className="dc-box-title">
                                        Remarks
                                    </div>

                                    <div className="dc-box-body">
                                        {challan.remarks}
                                    </div>

                                </div>

                            )}


                            {settings?.show_terms_conditions &&
                                settings?.terms_conditions && (

                                    <div className="dc-box">

                                        <div className="dc-box-title">
                                            Terms & Conditions
                                        </div>

                                        <div className="dc-box-body">
                                            {settings.terms_conditions}
                                        </div>

                                    </div>

                                )}

                        </div>


                        <div className="dc-signature">

                            {settings?.show_signature &&
                                settings?.signature_url && (

                                    <>

                                        <img
                                            src={
                                                settings.signature_url
                                            }
                                            alt="Authorized Signature"
                                        />

                                        <div>
                                            Authorized Signatory
                                        </div>

                                    </>

                                )}

                        </div>

                    </div>


                    {/* FOOTER */}

                    {settings?.show_footer &&
                        settings?.invoice_footer && (

                            <div className="dc-footer">

                                {settings.invoice_footer}

                            </div>

                        )}

                </div>

            </div>

        </div>

    );
}

export default DeliveryChallanPrint;
