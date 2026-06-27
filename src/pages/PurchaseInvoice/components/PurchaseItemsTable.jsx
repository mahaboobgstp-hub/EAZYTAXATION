import React from "react";

function PurchaseItemsTable({

    items,
    setItems,
    itemsMaster,
    companyState,
    placeOfSupply,
    summary,
    setSummary

}) {

    const emptyRow = {

        item_id: "",

        item_name: "",

        hsn_sac: "",

        uom: "",

        qty: 1,

        rate: 0,

        gross_amount: 0,

        discount_percent: 0,

        discount_amount: 0,

        taxable_value: 0,

        gst_rate: 18,

        cgst_amount: 0,

        sgst_amount: 0,

        igst_amount: 0,

        line_total: 0

    };

    const addRow = () => {

        setItems([

            ...items,

            {

                ...emptyRow

            }

        ]);

    };

    const removeRow = (index) => {

        if (items.length === 1) {

            alert(

                "At least one item is required."

            );

            return;

        }

        const updatedItems = [

            ...items

        ];

        updatedItems.splice(

            index,

            1

        );

        setItems(updatedItems);

    };

    const handleItemSelect = (

        index,

        itemId

    ) => {

        const selectedItem =

            itemsMaster.find(

                item =>

                    item.id === itemId

            );

        if (!selectedItem) return;

        const updatedItems = [

            ...items

        ];

        updatedItems[index] = {

            ...updatedItems[index],

            item_id:

                selectedItem.id,

            item_name:

                selectedItem.item_name,

            hsn_sac:

                selectedItem.hsn_sac,

            uom:

                selectedItem.uom,

            qty: 1,

            rate:

                Number(

                    selectedItem.purchase_rate || 0

                ),

            gross_amount:

                Number(

                    selectedItem.purchase_rate || 0

                ),

            discount_percent: 0,

            discount_amount: 0,

            taxable_value:

                Number(

                    selectedItem.purchase_rate || 0

                ),

            gst_rate:

                Number(

                    selectedItem.gst_rate || 0

                ),

            cgst_amount: 0,

            sgst_amount: 0,

            igst_amount: 0,

            line_total:

                Number(

                    selectedItem.purchase_rate || 0

                )

        };

        setItems(updatedItems);

    };
      const handleInputChange = (

        index,

        field,

        value

    ) => {

        const updatedItems = [

            ...items

        ];

        updatedItems[index][field] =

            Number(value);

        calculateRow(

            updatedItems,

            index

        );

    };

    const calculateRow = (

        updatedItems,

        index

    ) => {

        const row =

            updatedItems[index];

        const qty =

            Number(row.qty) || 0;

        const rate =

            Number(row.rate) || 0;

        const discountPercent =

            Number(row.discount_percent) || 0;

        const gstRate =

            Number(row.gst_rate) || 0;

        row.gross_amount =

            qty * rate;

        row.discount_amount =

            (

                row.gross_amount *

                discountPercent

            ) / 100;

        row.taxable_value =

            row.gross_amount -

            row.discount_amount;

        const gstAmount =

            (

                row.taxable_value *

                gstRate

            ) / 100;

        if (

            companyState &&

            placeOfSupply &&

            companyState ===

            placeOfSupply

        ) {

            row.cgst_amount =

                gstAmount / 2;

            row.sgst_amount =

                gstAmount / 2;

            row.igst_amount = 0;

        }

        else {

            row.cgst_amount = 0;

            row.sgst_amount = 0;

            row.igst_amount =

                gstAmount;

        }

        row.line_total =

            row.taxable_value +

            row.cgst_amount +

            row.sgst_amount +

            row.igst_amount;

        updatedItems[index] = row;

        setItems(updatedItems);

        calculateInvoiceSummary(

            updatedItems

        );

    };

    const calculateInvoiceSummary = (

        updatedItems

    ) => {

        let taxable = 0;

        let cgst = 0;

        let sgst = 0;

        let igst = 0;

        let grandTotal = 0;

        updatedItems.forEach(

            row => {

                taxable +=

                    Number(

                        row.taxable_value

                    ) || 0;

                cgst +=

                    Number(

                        row.cgst_amount

                    ) || 0;

                sgst +=

                    Number(

                        row.sgst_amount

                    ) || 0;

                igst +=

                    Number(

                        row.igst_amount

                    ) || 0;

                grandTotal +=

                    Number(

                        row.line_total

                    ) || 0;

            }

        );

        const roundedGrandTotal =

            Math.round(

                grandTotal

            );

        const roundOff =

            roundedGrandTotal -

            grandTotal;

        setSummary({

            taxable,

            cgst,

            sgst,

            igst,

            roundOff,

            grandTotal:

                roundedGrandTotal

        });

    };

    return (

        <div className="purchase-card">

            <h3 className="section-title">

                Purchase Items

            </h3>

            <table className="purchase-items-table">

                <thead>

                    <tr>

                        <th>No</th>

                        <th>Item</th>

                        <th>HSN</th>

                        <th>UOM</th>

                        <th>Qty</th>

                        <th>Rate</th>

                        <th>Disc %</th>

                        <th>Disc Amt</th>

                        <th>Taxable</th>

                        <th>GST %</th>

                        <th>CGST</th>

                        <th>SGST</th>

                        <th>IGST</th>

                        <th>Total</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>
                                      {

                        items.map((item, index) => (

                            <tr key={index}>

                                <td>

                                    {index + 1}

                                </td>

                                <td>

                                    <select

                                        value={item.item_id}

                                        onChange={(e) =>

                                            handleItemSelect(

                                                index,

                                                e.target.value

                                            )

                                        }

                                    >

                                        <option value="">

                                            Select Item

                                        </option>

                                        {

                                            itemsMaster.map(masterItem => (

                                                <option

                                                    key={masterItem.id}

                                                    value={masterItem.id}

                                                >

                                                    {masterItem.item_name}

                                                </option>

                                            ))

                                        }

                                    </select>

                                </td>

                                <td>

                                    {item.hsn_sac}

                                </td>

                                <td>

                                    {item.uom}

                                </td>

                                <td>

                                    <input

                                        type="number"

                                        min="1"

                                        value={item.qty}

                                        onChange={(e) =>

                                            handleInputChange(

                                                index,

                                                "qty",

                                                e.target.value

                                            )

                                        }

                                    />

                                </td>

                                <td>

                                    <input

                                        type="number"

                                        min="0"

                                        step="0.01"

                                        value={item.rate}

                                        onChange={(e) =>

                                            handleInputChange(

                                                index,

                                                "rate",

                                                e.target.value

                                            )

                                        }

                                    />

                                </td>

                                <td>

                                    <input

                                        type="number"

                                        min="0"

                                        max="100"

                                        value={item.discount_percent}

                                        onChange={(e) =>

                                            handleInputChange(

                                                index,

                                                "discount_percent",

                                                e.target.value

                                            )

                                        }

                                    />

                                </td>

                                <td>

                                    {Number(

                                        item.discount_amount || 0

                                    ).toFixed(2)}

                                </td>

                                <td>

                                    {Number(

                                        item.taxable_value || 0

                                    ).toFixed(2)}

                                </td>

                                <td>

                                    <input

                                        type="number"

                                        value={item.gst_rate}

                                        onChange={(e) =>

                                            handleInputChange(

                                                index,

                                                "gst_rate",

                                                e.target.value

                                            )

                                        }

                                    />

                                </td>

                                <td>

                                    {Number(

                                        item.cgst_amount || 0

                                    ).toFixed(2)}

                                </td>

                                <td>

                                    {Number(

                                        item.sgst_amount || 0

                                    ).toFixed(2)}

                                </td>

                                <td>

                                    {Number(

                                        item.igst_amount || 0

                                    ).toFixed(2)}

                                </td>

                                <td>

                                    <strong>

                                        {Number(

                                            item.line_total || 0

                                        ).toFixed(2)}

                                    </strong>

                                </td>

                                <td>

                                    <button

                                        type="button"

                                        onClick={() =>

                                            removeRow(index)

                                        }

                                    >

                                        Delete

                                    </button>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

            <br />

            <button

                type="button"

                onClick={addRow}

            >

                + Add Item

            </button>
                  </div>

    );

}

export default PurchaseItemsTable;
