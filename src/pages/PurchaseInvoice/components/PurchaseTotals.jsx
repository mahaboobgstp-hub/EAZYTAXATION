import React from "react";

function PurchaseTotals({ summary }) {

    return (

        <div className="purchase-card">

            <h3 className="section-title">
                Invoice Totals
            </h3>

            <div className="purchase-totals">

                <table className="totals-table">

                    <tbody>

                        <tr>
                            <td>Taxable Value</td>
                            <td>
                                ₹ {Number(summary.taxable || 0).toFixed(2)}
                            </td>
                        </tr>

                        <tr>
                            <td>CGST</td>
                            <td>
                                ₹ {Number(summary.cgst || 0).toFixed(2)}
                            </td>
                        </tr>

                        <tr>
                            <td>SGST</td>
                            <td>
                                ₹ {Number(summary.sgst || 0).toFixed(2)}
                            </td>
                        </tr>

                        <tr>
                            <td>IGST</td>
                            <td>
                                ₹ {Number(summary.igst || 0).toFixed(2)}
                            </td>
                        </tr>

                        <tr>
                            <td>Round Off</td>
                            <td>
                                ₹ {Number(summary.roundOff || 0).toFixed(2)}
                            </td>
                        </tr>

                        <tr className="grand-total-row">

                            <td>
                                <strong>Grand Total</strong>
                            </td>

                            <td>
                                <strong>
                                    ₹ {Number(summary.grandTotal || 0).toFixed(2)}
                                </strong>
                            </td>

                        </tr>

                        <tr>

                            <td colSpan="2">

                                <strong>
                                    Amount in Words
                                </strong>

                                <br />

                                <div className="amount-in-words">

                                    {summary.amountInWords || ""}

                                </div>

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default PurchaseTotals;
