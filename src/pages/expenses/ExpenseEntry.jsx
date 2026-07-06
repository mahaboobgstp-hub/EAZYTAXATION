import React, { useEffect, useState } from "react";

import "../../css/expenses/ExpenseEntry.css";

import {
  getCompaniesForDropdown
} from "../../services/companyService";

import {
  getVendorsForDropdown
} from "../../services/vendorService";

import {
  getExpenseCategories
} from "../../services/expenseCategoryService";

import {

  generateExpenseNumber,

  saveExpense,

  getExpenses,

  updateExpense,

  deleteExpense

} from "../../services/expenseService";

function ExpenseEntry() {

  const [companies, setCompanies] = useState([]);

  const [vendors, setVendors] = useState([]);

  const [categories, setCategories] = useState([]);

  const [expenses, setExpenses] = useState([]);

  const [editingExpenseId, setEditingExpenseId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] =
    useState({

      expense_no: "",

      expense_date:
        new Date()
          .toISOString()
          .split("T")[0],

      company_id: "",

      category_id: "",

      vendor_id: "",

      supplier_invoice_no: "",

      supplier_invoice_date: "",

      payment_mode: "Cash",

      reference_no: "",

      taxable_amount: "",

      gst_percent: 18,

      cgst: 0,

      sgst: 0,

      igst: 0,

      total_amount: 0,

      remarks: "",

      attachment_url: "",

      is_gst_applicable: true,

      status: "Draft"

    });

  useEffect(() => {

    loadCompanies();

    loadVendors();

    loadCategories();

    loadExpenses();

    loadExpenseNumber();

  }, []);

  async function loadCompanies() {

    try {

      const data =
        await getCompaniesForDropdown();

      setCompanies(data || []);

    }

    catch (error) {

      console.error(error);

    }

  }

  async function loadVendors() {

    try {

      const data =
        await getVendorsForDropdown();

      setVendors(data || []);

    }

    catch (error) {

      console.error(error);

    }

  }

  async function loadCategories() {

    try {

      const data =
        await getExpenseCategories();

      setCategories(data || []);

    }

    catch (error) {

      console.error(error);

    }

  }

  async function loadExpenses() {

    try {

      const data =
        await getExpenses();

      setExpenses(data || []);

    }

    catch (error) {

      console.error(error);

    }

  }

  async function loadExpenseNumber() {

    if (editingExpenseId) return;

    try {

      const number =
        await generateExpenseNumber();

      setFormData(prev => ({

        ...prev,

        expense_no: number

      }));

    }

    catch (error) {

      console.error(error);

    }

  }
    function handleChange(e) {

    const { name, value, type, checked } = e.target;

    const fieldValue =
      type === "checkbox"
        ? checked
        : value;

    setFormData(prev => ({

      ...prev,

      [name]: fieldValue

    }));

  }

  useEffect(() => {

    calculateGST();

  }, [

    formData.taxable_amount,

    formData.gst_percent,

    formData.is_gst_applicable

  ]);

  function calculateGST() {

    const taxable =
      Number(formData.taxable_amount || 0);

    const gstRate =
      Number(formData.gst_percent || 0);

    if (!formData.is_gst_applicable) {

      setFormData(prev => ({

        ...prev,

        cgst: 0,

        sgst: 0,

        igst: 0,

        total_amount: taxable

      }));

      return;

    }

    const gstAmount =
      (taxable * gstRate) / 100;

    setFormData(prev => ({

      ...prev,

      cgst: gstAmount / 2,

      sgst: gstAmount / 2,

      igst: 0,

      total_amount:
        taxable + gstAmount

    }));

  }

  function resetForm() {

    setEditingExpenseId(null);

    setFormData({

      expense_no: "",

      expense_date:
        new Date()
          .toISOString()
          .split("T")[0],

      company_id: "",

      category_id: "",

      vendor_id: "",

      supplier_invoice_no: "",

      supplier_invoice_date: "",

      payment_mode: "Cash",

      reference_no: "",

      taxable_amount: "",

      gst_percent: 18,

      cgst: 0,

      sgst: 0,

      igst: 0,

      total_amount: 0,

      remarks: "",

      attachment_url: "",

      is_gst_applicable: true,

      status: "Draft"

    });

    loadExpenseNumber();

  }

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      setLoading(true);

      if (editingExpenseId) {

        await updateExpense(

          editingExpenseId,

          formData

        );

        alert(
          "Expense updated successfully."
        );

      }

      else {

        await saveExpense(
          formData
        );

        alert(
          "Expense saved successfully."
        );

      }

      resetForm();

      loadExpenses();

    }

    catch (error) {

      console.error(error);

      alert(error.message);

    }

    finally {

      setLoading(false);

    }

  }

  async function handleEdit(expense) {

    setEditingExpenseId(
      expense.id
    );

    setFormData({

      ...expense

    });

  }

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(
        "Delete this expense?"
      );

    if (!confirmDelete) {

      return;

    }

    try {

      await deleteExpense(id);

      alert(
        "Expense deleted successfully."
      );

      loadExpenses();

      resetForm();

    }

    catch (error) {

      console.error(error);

      alert(error.message);

    }

  }
    return (

    <div className="expense-page">

      <h2>

        Expense Voucher Entry

      </h2>

      <form
        className="expense-form"
        onSubmit={handleSubmit}
      >

        <div className="expense-grid">

          {/* Company */}

          <div className="form-group">

            <label>

              Company

            </label>

            <select
              name="company_id"
              value={formData.company_id}
              onChange={handleChange}
              required
            >

              <option value="">

                Select Company

              </option>

              {companies.map(company => (

                <option
                  key={company.id}
                  value={company.id}
                >

                  {company.company_name}

                </option>

              ))}

            </select>

          </div>

          {/* Voucher Number */}

          <div className="form-group">

            <label>

              Voucher No.

            </label>

            <input
              type="text"
              name="expense_no"
              value={formData.expense_no}
              onChange={handleChange}
              required
            />

          </div>

          {/* Expense Date */}

          <div className="form-group">

            <label>

              Expense Date

            </label>

            <input
              type="date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
              required
            />

          </div>

          {/* Expense Category */}

          <div className="form-group">

            <label>

              Expense Category

            </label>

            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >

              <option value="">

                Select Category

              </option>

              {categories.map(category => (

                <option
                  key={category.id}
                  value={category.id}
                >

                  {category.category_name}

                </option>

              ))}

            </select>

          </div>

          {/* Vendor */}

          <div className="form-group">

            <label>

              Vendor (Optional)

            </label>

            <select
              name="vendor_id"
              value={formData.vendor_id}
              onChange={handleChange}
            >

              <option value="">

                Select Vendor

              </option>

              {vendors.map(vendor => (

                <option
                  key={vendor.id}
                  value={vendor.id}
                >

                  {vendor.vendor_name}

                </option>

              ))}

            </select>

          </div>

          {/* Supplier Invoice No */}

          <div className="form-group">

            <label>

              Supplier Invoice No.

            </label>

            <input
              type="text"
              name="supplier_invoice_no"
              value={formData.supplier_invoice_no}
              onChange={handleChange}
            />

          </div>

          {/* Supplier Invoice Date */}

          <div className="form-group">

            <label>

              Supplier Invoice Date

            </label>

            <input
              type="date"
              name="supplier_invoice_date"
              value={formData.supplier_invoice_date}
              onChange={handleChange}
            />

          </div>

          {/* Payment Mode */}

          <div className="form-group">

            <label>

              Payment Mode

            </label>

            <select
              name="payment_mode"
              value={formData.payment_mode}
              onChange={handleChange}
            >

              <option>Cash</option>

              <option>Bank</option>

              <option>UPI</option>

              <option>Cheque</option>

              <option>Credit Card</option>

            </select>

          </div>

          {/* Reference Number */}

          <div className="form-group">

            <label>

              Reference No.

            </label>

            <input
              type="text"
              name="reference_no"
              value={formData.reference_no}
              onChange={handleChange}
            />

          </div>

        </div>

        <hr />

        <h3>

          Amount Details

        </h3>
                <div className="expense-grid">

          <div className="form-group">

            <label>

              Taxable Amount

            </label>

            <input
              type="number"
              name="taxable_amount"
              value={formData.taxable_amount}
              onChange={handleChange}
              step="0.01"
            />

          </div>

          <div className="form-group">

            <label>

              GST %

            </label>

            <input
              type="number"
              name="gst_percent"
              value={formData.gst_percent}
              onChange={handleChange}
            />

          </div>

          <div className="form-group checkbox-group">

            <label>

              GST Applicable

            </label>

            <input
              type="checkbox"
              name="is_gst_applicable"
              checked={formData.is_gst_applicable}
              onChange={handleChange}
            />

          </div>

          <div className="form-group">

            <label>

              CGST

            </label>

            <input
              type="number"
              value={formData.cgst}
              readOnly
            />

          </div>

          <div className="form-group">

            <label>

              SGST

            </label>

            <input
              type="number"
              value={formData.sgst}
              readOnly
            />

          </div>

          <div className="form-group">

            <label>

              IGST

            </label>

            <input
              type="number"
              value={formData.igst}
              readOnly
            />

          </div>

          <div className="form-group">

            <label>

              Total Amount

            </label>

            <input
              type="number"
              value={formData.total_amount}
              readOnly
            />

          </div>

          <div className="form-group full-width">

            <label>

              Remarks

            </label>

            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="4"
            />

          </div>

        </div>

        <div className="button-row">

          <button
            type="submit"
            className="save-btn"
            disabled={loading}
          >

            {

              editingExpenseId

                ? "Update Expense"

                : "Save Expense"

            }

          </button>

          <button
            type="button"
            className="clear-btn"
            onClick={resetForm}
          >

            Clear

          </button>

        </div>

        <hr />

        <h3>

          Expense Register

        </h3>

        <table className="expense-table">

          <thead>

            <tr>

              <th>Voucher No</th>

              <th>Date</th>

              <th>Category</th>

              <th>Vendor</th>

              <th>Total</th>

              <th>Status</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            {expenses.map(expense => (

              <tr key={expense.id}>

                <td>

                  {expense.expense_no}

                </td>

                <td>

                  {expense.expense_date}

                </td>

                <td>

                  {expense.category_name}

                </td>

                <td>

                  {expense.vendor_name}

                </td>

                <td>

                  ₹ {expense.total_amount}

                </td>

                <td>

                  {expense.status}

                </td>

                <td>

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(expense)
                    }
                  >

                    Edit

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(expense.id)
                    }
                  >

                    Delete

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </form>

    </div>
      

  );

}

export default ExpenseEntry;
