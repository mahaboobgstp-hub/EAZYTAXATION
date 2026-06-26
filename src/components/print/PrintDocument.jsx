import React from "react";
import "./Print.css";

function PrintDocument({
  toolbar,
  children,
  pageId = "print-document",
  paper = "a4",
}) {
  return (
    <div className="print-overlay">

      {toolbar && (
        <div className="print-toolbar-wrapper">
          {toolbar}
        </div>
      )}

      <div
        id={pageId}
        className={`print-document ${paper}`}
      >
        {children}
      </div>

    </div>
  );
}

export default PrintDocument;
