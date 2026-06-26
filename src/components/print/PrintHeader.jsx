import React from "react";

function PrintHeader({
  title,
  subtitle = "",
  leftContent = null,
  rightContent = null,
}) {
  return (
    <div className="print-header">

      <div className="print-header-side">
        {leftContent}
      </div>

      <div className="print-header-center">

        <h1 className="print-document-title">
          {title}
        </h1>

        {subtitle && (
          <p className="print-document-subtitle">
            {subtitle}
          </p>
        )}

      </div>

      <div className="print-header-side print-header-right">
        {rightContent}
      </div>

    </div>
  );
}

export default PrintHeader;
