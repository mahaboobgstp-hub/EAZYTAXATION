import React from "react";

function PrintItemsTable({
  columns = [],
  rows = [],
  emptyRows = 8,
}) {

  const blankRows =
    Math.max(0, emptyRows - rows.length);

  return (

    <table className="print-items-table">

      <thead>

        <tr>

          {columns.map((column) => (

            <th
              key={column.key}
              style={{
                width: column.width || "auto",
                textAlign: column.align || "center",
              }}
            >
              {column.label}
            </th>

          ))}

        </tr>

      </thead>

      <tbody>

        {rows.map((row, index) => (

          <tr key={index}>

            {columns.map((column) => {

              let value = "";

              if (column.key === "__sr__") {

                value = index + 1;

              } else {

                value = row[column.key];

              }

              return (

                <td
                  key={column.key}
                  style={{
                    textAlign:
                      column.align || "center",
                  }}
                >

                  {value ?? ""}

                </td>

              );

            })}

          </tr>

        ))}

        {/* Empty rows */}

        {Array.from({
          length: blankRows,
        }).map((_, index) => (

          <tr
            key={`blank-${index}`}
            className="blank-row"
          >

            {columns.map((column) => (

              <td key={column.key}>
                &nbsp;
              </td>

            ))}

          </tr>

        ))}

      </tbody>

    </table>

  );

}

export default PrintItemsTable;
