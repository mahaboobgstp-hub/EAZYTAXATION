import React from "react";

function PrintTerms({
  sections = [],
}) {

  const visibleSections = sections.filter(
    (section) =>
      section?.content &&
      section.content.toString().trim() !== ""
  );

  if (visibleSections.length === 0) {
    return null;
  }

  return (

    <div className="print-terms">

      {visibleSections.map((section, index) => (

        <div
          className="print-terms-card"
          key={index}
        >

          <div className="print-terms-title">

            {section.title}

          </div>

          <div className="print-terms-content">

            {section.content}

          </div>

        </div>

      ))}

    </div>

  );

}

export default PrintTerms;
