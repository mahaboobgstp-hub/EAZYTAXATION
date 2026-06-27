import React from "react";

function PurchaseActions({

    editingInvoiceId,

    onSave,

    onUpdate,

    onDelete,

    onPrint,

    onDownloadPdf,

    onReset

}) {

    return (

        <div className="purchase-card">

            <h3 className="section-title">

                Actions

            </h3>

            <div className="purchase-actions">

                {
                    editingInvoiceId ? (

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onUpdate}
                        >
                            Update Invoice
                        </button>

                    ) : (

                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={onSave}
                        >
                            Save Invoice
                        </button>

                    )
                }

                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={onDelete}
                    disabled={!editingInvoiceId}
                >
                    Delete
                </button>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onPrint}
                >
                    Print
                </button>

                <button
                    type="button"
                    className="btn btn-info"
                    onClick={onDownloadPdf}
                >
                    Download PDF
                </button>

                <button
                    type="button"
                    className="btn btn-warning"
                    onClick={onReset}
                >
                    New Invoice
                </button>

            </div>

        </div>

    );

}

export default PurchaseActions;
