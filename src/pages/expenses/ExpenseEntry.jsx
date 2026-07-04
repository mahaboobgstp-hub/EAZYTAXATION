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
  saveExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  generateExpenseNumber
} from "../../services/expenseService";

function ExpenseEntry() {

  const [companies, setCompanies] = useState([]);

  const [vendors, setVendors] = useState([]);

  const [categories, setCategories] = useState([]);

  const [expenses, setExpenses] = useState([]);

  const [editingExpenseId, setEditingExpenseId] =
    useState(null);

  const [formData, setFormData] = useState({

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

    taxable_amount: 0,

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

    loadExpenseCategories();

    loadExpenses();

    loadExpenseNumber();

  }, []);

  async function loadCompanies() {

    const data =
      await getCompaniesForDropdown();

    setCompanies(data);

  }

  async function loadVendors() {

    const data =
      await getVendorsForDropdown();

    setVendors(data);

  }

  async function loadExpenseCategories() {

    const data =
      await getExpenseCategories();

    setCategories(data);

  }

  async function loadExpenses() {

    const data =
      await getExpenses();

    setExpenses(data);

  }

  async function loadExpenseNumber() {

    if (editingExpenseId) return;

    const expenseNo =
      await generateExpenseNumber();

    setFormData(prev => ({

      ...prev,

      expense_no: expenseNo

    }));

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

    const cgst =
      gstAmount / 2;

    const sgst =
      gstAmount / 2;

    setFormData(prev => ({

      ...prev,

      cgst,

      sgst,

      igst: 0,

      total_amount:
        taxable + gstAmount

    }));

  }

  function resetForm() {

    setEditingExpenseId(null);

    loadExpenseNumber();

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

      taxable_amount: 0,

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

  }
  
