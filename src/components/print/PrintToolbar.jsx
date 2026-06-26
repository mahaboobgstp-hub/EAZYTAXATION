import React from "react";

function PrintToolbar({
  onClose,
  onPrint,
  onDownload,
  showClose = true,
  showPrint = true,
  showDownload = true,
}) {
  return (
    <div className="print-toolbar">

      <div className="print-toolbar-left">

        {showClose && (
          <button
            type="button"
            className="print-btn close-btn"
            onClick={onClose}
          >
            Close
          </button>
        )}

      </div>

      <div className="print-toolbar-right">

        {showPrint && (
          <button
            type="button"
            className="print-btn print-btn-primary"
            onClick={onPrint}
          >
            Print
          </button>
        )}

        {showDownload && (
          <button
            type="button"
            className="print-btn download-btn"
            onClick={onDownload}
          >
            Download PDF
          </button>
        )}

      </div>

    </div>
  );
}

export default PrintToolbar;
