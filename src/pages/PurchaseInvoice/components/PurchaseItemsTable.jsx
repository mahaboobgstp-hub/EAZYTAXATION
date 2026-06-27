// ======================================================
// React Imports
// ======================================================

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";

// ======================================================
// Styles
// ======================================================

import "./PurchaseItemsTable.css";

// ======================================================
// Icons
// ======================================================

import {
  FaPlus,
  FaTrash,
  FaCopy,
  FaSearch,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";

// ======================================================
// Purchase Invoice Services
// ======================================================

import {
  searchProducts,
  getProductById,
  calculatePurchaseRow,
  calculatePurchaseTotals,
  roundAmount,
} from "../../../services/purchaseInvoiceService";

// ======================================================
// Common Utilities
// ======================================================

import {
  formatCurrency,
  formatQuantity,
  formatPercentage,
} from "../../../utils/formatters";

import {
  isNumeric,
  isEmpty,
} from "../../../utils/helpers";

// ======================================================
// Common Components
// ======================================================

import Loader from "../../../components/common/Loader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

// ======================================================
// Product Components
// ======================================================

import ProductSearchModal from "../../Products/ProductSearchModal";

// ======================================================
// Keyboard Shortcuts
// ======================================================

import {
  KEY_ENTER,
  KEY_TAB,
  KEY_DELETE,
  KEY_INSERT,
  KEY_ESCAPE,
  KEY_ARROW_UP,
  KEY_ARROW_DOWN,
  KEY_ARROW_LEFT,
  KEY_ARROW_RIGHT,
} from "../../../constants/keyboard";

// ======================================================
// Constants
// ======================================================

import {
  GST_TYPE,
  DISCOUNT_TYPE,
} from "../../../constants/constants";
// ======================================================
// Purchase Items Table Constants
// ======================================================

export const DECIMAL_PLACES = 2;

export const MAX_ROWS = 1000;

export const MIN_ROWS = 1;

export const DEFAULT_DISCOUNT_TYPE = "PERCENT";

export const DEFAULT_GST_TYPE = "INTRA";

export const DEFAULT_QUANTITY = 1;

export const DEFAULT_FREE_QUANTITY = 0;

export const DEFAULT_RATE = 0;

export const DEFAULT_DISCOUNT_PERCENT = 0;

export const DEFAULT_DISCOUNT_AMOUNT = 0;

export const DEFAULT_GST_PERCENT = 0;

export const DEFAULT_CESS_PERCENT = 0;

export const DEFAULT_ROUND_OFF = true;

// ======================================================
// Table Column Widths
// ======================================================

export const COLUMN_WIDTH = {
  SERIAL: 60,
  PRODUCT: 320,
  HSN: 110,
  UNIT: 90,
  BATCH: 130,
  EXPIRY: 110,
  QTY: 90,
  FREE: 90,
  RATE: 110,
  DISC_PERCENT: 90,
  DISC_AMOUNT: 120,
  TAXABLE: 130,
  GST: 90,
  CGST: 110,
  SGST: 110,
  IGST: 110,
  CESS: 110,
  AMOUNT: 140,
  ACTION: 120,
};

// ======================================================
// Discount Types
// ======================================================

export const DISCOUNT_TYPES = [
  {
    label: "Percentage",
    value: "PERCENT",
  },
  {
    label: "Amount",
    value: "AMOUNT",
  },
];

// ======================================================
// GST Types
// ======================================================

export const GST_TYPES = {
  INTRA: "INTRA",
  INTER: "INTER",
};

// ======================================================
// Keyboard Keys
// ======================================================

export const KEYS = {
  ENTER: "Enter",
  TAB: "Tab",
  DELETE: "Delete",
  INSERT: "Insert",
  ESCAPE: "Escape",

  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",

  HOME: "Home",
  END: "End",

  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",

  F2: "F2",

  F4: "F4",

  F6: "F6",

  F8: "F8",

  F9: "F9",

  F10: "F10",

  CTRL_D: "KeyD",
  CTRL_N: "KeyN",
  CTRL_S: "KeyS",
};

// ======================================================
// Row Status
// ======================================================

export const ROW_STATUS = {
  NEW: "NEW",
  MODIFIED: "MODIFIED",
  SAVED: "SAVED",
  DELETED: "DELETED",
};

// ======================================================
// Numeric Fields
// ======================================================

export const NUMERIC_FIELDS = [
  "quantity",
  "freeQuantity",
  "purchaseRate",
  "discountPercent",
  "discountAmount",
  "gstRate",
  "cessRate",
];

// ======================================================
// Editable Fields
// ======================================================

export const EDITABLE_FIELDS = [
  "productName",
  "batchNo",
  "expiryDate",
  "quantity",
  "freeQuantity",
  "purchaseRate",
  "discountPercent",
  "discountAmount",
  "gstRate",
  "remarks",
];

// ======================================================
// Default Empty Table
// ======================================================

export const EMPTY_TABLE_MESSAGE =
  "No purchase items added.";

export const PRODUCT_SEARCH_PLACEHOLDER =
  "Search Product Name / Barcode / HSN";

export const MAX_SEARCH_RESULTS = 25;
// ======================================================
// Purchase Items Table Component
// ======================================================

const PurchaseItemsTable = ({
  items = [],
  setItems,

  vendor = null,
  invoiceHeader = {},

  gstType = "INTRA",

  readOnly = false,

  onItemsChange,
  onTotalsChange,

  errors = {},

  products = [],

  units = [],

  taxSettings = {},

  invoiceMode = "ADD",
}) => {

  // ======================================================
  // State
  // ======================================================

  const [rows, setRows] = useState(() => {
    if (items && items.length > 0) return items;
    return [createEmptyPurchaseRow()];
  });

  const [selectedRow, setSelectedRow] = useState(0);

  const [selectedColumn, setSelectedColumn] = useState(0);

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchRow, setSearchRow] = useState(null);

  const [searchText, setSearchText] = useState("");

  const [searchResults, setSearchResults] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(false);

  const [tableErrors, setTableErrors] = useState({});

  const [totals, setTotals] = useState({
    totalQty: 0,
    totalFreeQty: 0,
    taxableAmount: 0,
    discountAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    cessAmount: 0,
    grandTotal: 0,
  });

  // ======================================================
  // Refs
  // ======================================================

  const tableRef = useRef(null);

  const inputRefs = useRef({});

  const searchInputRef = useRef(null);

  const previousRowsRef = useRef(rows);

  // ======================================================
  // Memoized Values
  // ======================================================

  const totalRows = useMemo(() => rows.length, [rows]);

  const hasRows = useMemo(
    () => rows.length > 0,
    [rows]
  );

  const editable = useMemo(
    () => !readOnly,
    [readOnly]
  );

  const isIntraState = useMemo(
    () => gstType === "INTRA",
    [gstType]
  );

  const isInterState = useMemo(
    () => gstType === "INTER",
    [gstType]
  );

  // ======================================================
  // Sync External Items
  // ======================================================

  useEffect(() => {
    if (!items) return;

    if (items.length === 0) {
      setRows([createEmptyPurchaseRow()]);
      return;
    }

    setRows(items);
  }, [items]);

  // ======================================================
  // Notify Parent
  // ======================================================

  useEffect(() => {
    if (setItems) {
      setItems(rows);
    }

    if (onItemsChange) {
      onItemsChange(rows);
    }

    previousRowsRef.current = rows;

  }, [rows, setItems, onItemsChange]);

  // ======================================================
  // Component Logic Continues Below...
  // ======================================================
  // ======================================================
// State
// ======================================================

// Purchase Item Rows
const [rows, setRows] = useState(
  items?.length > 0
    ? items
    : [createEmptyPurchaseRow(1)]
);

// Selected Cell
const [selectedRowIndex, setSelectedRowIndex] = useState(0);
const [selectedColumn, setSelectedColumn] = useState("productName");

// Loading
const [loading, setLoading] = useState(false);

// Product Search
const [searchModalOpen, setSearchModalOpen] = useState(false);
const [searchKeyword, setSearchKeyword] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [searchLoading, setSearchLoading] = useState(false);
const [searchRowIndex, setSearchRowIndex] = useState(null);

// Product Dropdown
const [productDropdownOpen, setProductDropdownOpen] = useState(false);

// Batch Selection
const [batchModalOpen, setBatchModalOpen] = useState(false);
const [selectedBatch, setSelectedBatch] = useState(null);

// Serial Number Selection
const [selectedSerialNo, setSelectedSerialNo] = useState(null);

// Discount Popup
const [discountPopupOpen, setDiscountPopupOpen] = useState(false);

// Tax Popup
const [taxPopupOpen, setTaxPopupOpen] = useState(false);

// Row Validation
const [rowErrors, setRowErrors] = useState({});

// Dirty Rows
const [modifiedRows, setModifiedRows] = useState([]);

// Clipboard (Duplicate Row)
const [copiedRow, setCopiedRow] = useState(null);

// Keyboard Navigation
const [keyboardMode, setKeyboardMode] = useState(true);

// Row Totals
const [totals, setTotals] = useState({
  totalQty: 0,
  totalFreeQty: 0,

  taxableAmount: 0,

  discountAmount: 0,

  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,

  cessAmount: 0,

  taxAmount: 0,

  grossAmount: 0,

  roundOff: 0,

  grandTotal: 0,
});

// Footer Summary
const [summary, setSummary] = useState({
  itemCount: 0,
  totalQuantity: 0,
  totalAmount: 0,
});

// Save Status
const [saving, setSaving] = useState(false);

// Delete Confirmation
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
const [deleteRowIndex, setDeleteRowIndex] = useState(null);

// Focus Control
const [focusField, setFocusField] = useState(null);

// Refresh Flag
const [refreshTable, setRefreshTable] = useState(false);
  const tableRef = useRef(null);

const inputRefs = useRef({});

const searchInputRef = useRef(null);

const quantityInputRef = useRef(null);

const rateInputRef = useRef(null);

const previousRowsRef = useRef([]);

const debounceTimer = useRef(null);

const keyboardLock = useRef(false);

const nextFocusRef = useRef(null);
  // ======================================================
// Initialize Rows
// ======================================================

useEffect(() => {
  if (!items) return;

  if (items.length === 0) {
    setRows([createEmptyPurchaseRow(1)]);
    return;
  }

  setRows(items);
}, [items]);

// ======================================================
// Notify Parent Component
// ======================================================

useEffect(() => {
  if (setItems) {
    setItems(rows);
  }

  if (onItemsChange) {
    onItemsChange(rows);
  }
}, [rows, setItems, onItemsChange]);

// ======================================================
// Calculate Invoice Totals
// ======================================================

useEffect(() => {
  const invoiceTotals = calculatePurchaseTotals(rows);

  setTotals(invoiceTotals);

  if (onTotalsChange) {
    onTotalsChange(invoiceTotals);
  }
}, [rows, onTotalsChange]);

// ======================================================
// Update Summary
// ======================================================

useEffect(() => {
  const itemCount = rows.length;

  const totalQuantity = rows.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0
  );

  const totalAmount = rows.reduce(
    (sum, row) => sum + Number(row.totalAmount || 0),
    0
  );

  setSummary({
    itemCount,
    totalQuantity,
    totalAmount,
  });
}, [rows]);

// ======================================================
// Auto Focus Product Search
// ======================================================

useEffect(() => {
  if (!searchModalOpen) return;

  searchInputRef.current?.focus();
}, [searchModalOpen]);

// ======================================================
// Product Search
// ======================================================

useEffect(() => {
  if (!searchModalOpen) return;

  if (!searchKeyword.trim()) {
    setSearchResults([]);
    return;
  }

  const timer = setTimeout(async () => {
    try {
      setSearchLoading(true);

      const data = await searchProducts(searchKeyword);

      setSearchResults(data || []);
    } finally {
      setSearchLoading(false);
    }
  }, 300);

  return () => clearTimeout(timer);

}, [searchKeyword, searchModalOpen]);

// ======================================================
// Auto Add First Row
// ======================================================

useEffect(() => {
  if (rows.length > 0) return;

  setRows([createEmptyPurchaseRow(1)]);
}, [rows]);

// ======================================================
// Keep Selected Row Valid
// ======================================================

useEffect(() => {
  if (selectedRowIndex >= rows.length) {
    setSelectedRowIndex(
      Math.max(rows.length - 1, 0)
    );
  }
}, [rows, selectedRowIndex]);

// ======================================================
// Auto Clear Search
// ======================================================

useEffect(() => {
  if (!searchModalOpen) {
    setSearchKeyword("");
    setSearchResults([]);
  }
}, [searchModalOpen]);

// ======================================================
// Keyboard Shortcuts
// ======================================================

useEffect(() => {

  const handleKeyDown = (event) => {

    if (readOnly) return;

    // Keyboard shortcuts handled
    // in handleKeyboardNavigation()

    handleKeyboardNavigation(event);

  };

  window.addEventListener(
    "keydown",
    handleKeyDown
  );

  return () => {
    window.removeEventListener(
      "keydown",
      handleKeyDown
    );
  };

}, [rows, selectedRowIndex, readOnly]);

// ======================================================
// Refresh Table
// ======================================================

useEffect(() => {

  if (!refreshTable) return;

  setRefreshTable(false);

}, [refreshTable]);

// ======================================================
// GST Type Changed
// ======================================================

useEffect(() => {

  setRows((previousRows) =>
    previousRows.map((row) =>
      calculatePurchaseRow(row, gstType)
    )
  );

}, [gstType]);

// ======================================================
// Vendor Changed
// ======================================================

useEffect(() => {

  if (!vendor) return;

  // Future vendor-specific logic
  // such as default GST,
  // payment terms,
  // vendor pricing,
  // etc.

}, [vendor]);

// ======================================================
// Invoice Mode Changed
// ======================================================

useEffect(() => {

  if (invoiceMode === "ADD") return;

  // Future logic for
  // EDIT / VIEW / COPY

}, [invoiceMode]);

// ======================================================
// Cleanup
// ======================================================

useEffect(() => {

  return () => {

    setSearchResults([]);

    setSearchKeyword("");

  };

}, []);
  // ======================================================
// Add New Row
// ======================================================

const handleAddRow = useCallback(() => {

  setRows((previousRows) => {

    const newRow = createEmptyPurchaseRow(
      previousRows.length + 1
    );

    return [...previousRows, newRow];

  });

  setTimeout(() => {
    setSelectedRowIndex(rows.length);
    setSelectedColumn("productName");
  }, 0);

}, [rows.length]);

// ======================================================
// Insert Row
// ======================================================

const handleInsertRow = useCallback((index) => {

  setRows((previousRows) => {

    const newRows = [...previousRows];

    newRows.splice(
      index,
      0,
      createEmptyPurchaseRow(index + 1)
    );

    return newRows.map((row, i) => ({
      ...row,
      serialNo: i + 1,
    }));

  });

  setSelectedRowIndex(index);

}, []);

// ======================================================
// Delete Row
// ======================================================

const handleDeleteRow = useCallback((index) => {

  if (rows.length <= MIN_ROWS) {

    setRows([
      createEmptyPurchaseRow(1)
    ]);

    setSelectedRowIndex(0);

    return;

  }

  const updatedRows = rows
    .filter((_, i) => i !== index)
    .map((row, i) => ({
      ...row,
      serialNo: i + 1,
    }));

  setRows(updatedRows);

  setSelectedRowIndex(
    Math.max(index - 1, 0)
  );

}, [rows]);

// ======================================================
// Duplicate Row
// ======================================================

const handleDuplicateRow = useCallback((index) => {

  const sourceRow = rows[index];

  if (!sourceRow) return;

  const duplicatedRow = {
    ...sourceRow,
    id: crypto.randomUUID(),
  };

  const updatedRows = [...rows];

  updatedRows.splice(
    index + 1,
    0,
    duplicatedRow
  );

  updatedRows.forEach((row, i) => {
    row.serialNo = i + 1;
  });

  setRows(updatedRows);

  setSelectedRowIndex(index + 1);

}, [rows]);

// ======================================================
// Clear Row
// ======================================================

const handleClearRow = useCallback((index) => {

  const updatedRows = [...rows];

  updatedRows[index] = createEmptyPurchaseRow(
    index + 1
  );

  setRows(updatedRows);

}, [rows]);

// ======================================================
// Delete All Rows
// ======================================================

const handleDeleteAllRows = useCallback(() => {

  setRows([
    createEmptyPurchaseRow(1)
  ]);

  setSelectedRowIndex(0);

}, []);

// ======================================================
// Move Row Up
// ======================================================

const moveRowUp = useCallback((index) => {

  if (index === 0) return;

  const updatedRows = [...rows];

  [
    updatedRows[index - 1],
    updatedRows[index],
  ] = [
    updatedRows[index],
    updatedRows[index - 1],
  ];

  updatedRows.forEach((row, i) => {
    row.serialNo = i + 1;
  });

  setRows(updatedRows);

  setSelectedRowIndex(index - 1);

}, [rows]);

// ======================================================
// Move Row Down
// ======================================================

const moveRowDown = useCallback((index) => {

  if (index >= rows.length - 1) return;

  const updatedRows = [...rows];

  [
    updatedRows[index],
    updatedRows[index + 1],
  ] = [
    updatedRows[index + 1],
    updatedRows[index],
  ];

  updatedRows.forEach((row, i) => {
    row.serialNo = i + 1;
  });

  setRows(updatedRows);

  setSelectedRowIndex(index + 1);

}, [rows]);

// ======================================================
// Copy Row
// ======================================================

const handleCopyRow = useCallback((index) => {

  setCopiedRow({
    ...rows[index],
  });

}, [rows]);

// ======================================================
// Paste Row
// ======================================================

const handlePasteRow = useCallback((index) => {

  if (!copiedRow) return;

  const updatedRows = [...rows];

  updatedRows[index] = {
    ...copiedRow,
    id: crypto.randomUUID(),
    serialNo: index + 1,
  };

  setRows(updatedRows);

}, [rows, copiedRow]);

// ======================================================
// Append Empty Rows
// ======================================================

const appendEmptyRows = useCallback((count = 5) => {

  setRows((previousRows) => {

    const updatedRows = [...previousRows];

    for (let i = 0; i < count; i++) {

      updatedRows.push(
        createEmptyPurchaseRow(
          updatedRows.length + 1
        )
      );

    }

    return updatedRows;

  });

}, []);
  // ======================================================
// Open Product Search
// ======================================================

const openProductSearch = useCallback((rowIndex) => {

  setSearchRowIndex(rowIndex);

  setSearchKeyword("");

  setSearchResults([]);

  setSearchModalOpen(true);

}, []);

// ======================================================
// Close Product Search
// ======================================================

const closeProductSearch = useCallback(() => {

  setSearchModalOpen(false);

  setSearchKeyword("");

  setSearchResults([]);

  setSearchRowIndex(null);

}, []);

// ======================================================
// Search Products
// ======================================================

const handleProductSearch = useCallback(async (keyword) => {

  setSearchKeyword(keyword);

  if (!keyword.trim()) {

    setSearchResults([]);

    return;

  }

  try {

    setSearchLoading(true);

    const result = await searchProducts(keyword);

    setSearchResults(result || []);

  } catch (error) {

    console.error("Product Search Error :", error);

    setSearchResults([]);

  } finally {

    setSearchLoading(false);

  }

}, []);

// ======================================================
// Select Product
// ======================================================

const handleSelectProduct = useCallback(async (product) => {

  if (searchRowIndex === null) return;

  try {

    let selectedProduct = product;

    if (!selectedProduct.purchase_rate) {

      selectedProduct = await getProductById(product.id);

    }

    const updatedRows = [...rows];

    updatedRows[searchRowIndex] = {

      ...updatedRows[searchRowIndex],

      productId: selectedProduct.id,

      productCode: selectedProduct.product_code || "",

      productName: selectedProduct.product_name || "",

      hsnCode: selectedProduct.hsn_code || "",

      unitId: selectedProduct.unit_id || null,

      unitName: selectedProduct.unit_name || "",

      purchaseRate: Number(selectedProduct.purchase_rate || 0),

      gstRate: Number(selectedProduct.gst_rate || 0),

      cessRate: Number(selectedProduct.cess_rate || 0),

      quantity:
        updatedRows[searchRowIndex].quantity || 1,

    };

    setRows(updatedRows);

    closeProductSearch();

  } catch (error) {

    console.error(error);

  }

}, [
  rows,
  searchRowIndex,
  closeProductSearch,
]);

// ======================================================
// Clear Product
// ======================================================

const clearProduct = useCallback((rowIndex) => {

  const updatedRows = [...rows];

  updatedRows[rowIndex] = {

    ...createEmptyPurchaseRow(rowIndex + 1),

    serialNo: rowIndex + 1,

  };

  setRows(updatedRows);

}, [rows]);

// ======================================================
// Change Product Manually
// ======================================================

const handleProductNameChange = useCallback((rowIndex, value) => {

  const updatedRows = [...rows];

  updatedRows[rowIndex].productName = value;

  updatedRows[rowIndex].productId = null;

  setRows(updatedRows);

}, [rows]);

// ======================================================
// Get Product By Barcode
// ======================================================

const getProductByBarcode = useCallback(async (barcode, rowIndex) => {

  if (!barcode) return;

  try {

    const product = await searchProducts(barcode);

    if (
      product &&
      product.length > 0
    ) {

      await handleSelectProduct(product[0]);

    }

  } catch (error) {

    console.error(error);

  }

}, [handleSelectProduct]);

// ======================================================
// Validate Product
// ======================================================

const validateProduct = useCallback((row) => {

  if (!row.productId) {

    return false;

  }

  return true;

}, []);
  // ======================================================
// Calculate Single Row
// ======================================================

const calculateRow = useCallback(
  (row) => {

    const quantity = Number(row.quantity || 0);

    const freeQuantity = Number(row.freeQuantity || 0);

    const rate = Number(row.purchaseRate || 0);

    const discountPercent = Number(
      row.discountPercent || 0
    );

    let discountAmount = Number(
      row.discountAmount || 0
    );

    const gstRate = Number(row.gstRate || 0);

    const cessRate = Number(row.cessRate || 0);

    // --------------------------------------------
    // Gross Amount
    // --------------------------------------------

    const grossAmount = quantity * rate;

    // --------------------------------------------
    // Discount
    // --------------------------------------------

    if (discountPercent > 0) {

      discountAmount =
        (grossAmount * discountPercent) / 100;

    }

    // --------------------------------------------
    // Taxable Amount
    // --------------------------------------------

    const taxableAmount = Math.max(
      grossAmount - discountAmount,
      0
    );

    // --------------------------------------------
    // GST
    // --------------------------------------------

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (gstType === "INTRA") {

      cgstRate = gstRate / 2;
      sgstRate = gstRate / 2;

      cgstAmount =
        (taxableAmount * cgstRate) / 100;

      sgstAmount =
        (taxableAmount * sgstRate) / 100;

    } else {

      igstRate = gstRate;

      igstAmount =
        (taxableAmount * igstRate) / 100;

    }

    // --------------------------------------------
    // Cess
    // --------------------------------------------

    const cessAmount =
      (taxableAmount * cessRate) / 100;

    // --------------------------------------------
    // Total Tax
    // --------------------------------------------

    const totalTax =
      cgstAmount +
      sgstAmount +
      igstAmount +
      cessAmount;

    // --------------------------------------------
    // Net Amount
    // --------------------------------------------

    const totalAmount =
      taxableAmount + totalTax;

    return {

      ...row,

      freeQuantity,

      grossAmount: Number(
        grossAmount.toFixed(2)
      ),

      discountAmount: Number(
        discountAmount.toFixed(2)
      ),

      taxableAmount: Number(
        taxableAmount.toFixed(2)
      ),

      cgstRate,

      sgstRate,

      igstRate,

      cgstAmount: Number(
        cgstAmount.toFixed(2)
      ),

      sgstAmount: Number(
        sgstAmount.toFixed(2)
      ),

      igstAmount: Number(
        igstAmount.toFixed(2)
      ),

      cessAmount: Number(
        cessAmount.toFixed(2)
      ),

      totalTax: Number(
        totalTax.toFixed(2)
      ),

      totalAmount: Number(
        totalAmount.toFixed(2)
      ),

    };

  },
  [gstType]
);

// ======================================================
// Recalculate Row
// ======================================================

const recalculateRow = useCallback(

  (rowIndex) => {

    setRows((previousRows) => {

      const updatedRows = [...previousRows];

      updatedRows[rowIndex] =
        calculateRow(updatedRows[rowIndex]);

      return updatedRows;

    });

  },

  [calculateRow]

);

// ======================================================
// Recalculate All Rows
// ======================================================

const recalculateAllRows = useCallback(() => {

  setRows((previousRows) =>
    previousRows.map((row) =>
      calculateRow(row)
    )
  );

}, [calculateRow]);

// ======================================================
// Update Cell Value
// ======================================================

const updateRowField = useCallback(

  (rowIndex, field, value) => {

    setRows((previousRows) => {

      const updatedRows = [...previousRows];

      updatedRows[rowIndex] = {

        ...updatedRows[rowIndex],

        [field]: value,

      };

      updatedRows[rowIndex] =
        calculateRow(updatedRows[rowIndex]);

      return updatedRows;

    });

  },

  [calculateRow]

);
  // ======================================================
// Calculate Invoice Totals
// ======================================================

const calculateInvoiceTotals = useCallback(() => {

  const invoiceTotals = rows.reduce(

    (total, row) => {

      total.totalItems += 1;

      total.totalQuantity += Number(row.quantity || 0);

      total.totalFreeQuantity += Number(row.freeQuantity || 0);

      total.grossAmount += Number(row.grossAmount || 0);

      total.discountAmount += Number(row.discountAmount || 0);

      total.taxableAmount += Number(row.taxableAmount || 0);

      total.cgstAmount += Number(row.cgstAmount || 0);

      total.sgstAmount += Number(row.sgstAmount || 0);

      total.igstAmount += Number(row.igstAmount || 0);

      total.cessAmount += Number(row.cessAmount || 0);

      total.totalTax += Number(row.totalTax || 0);

      total.grandTotal += Number(row.totalAmount || 0);

      return total;

    },

    {

      totalItems: 0,

      totalQuantity: 0,

      totalFreeQuantity: 0,

      grossAmount: 0,

      discountAmount: 0,

      taxableAmount: 0,

      cgstAmount: 0,

      sgstAmount: 0,

      igstAmount: 0,

      cessAmount: 0,

      totalTax: 0,

      roundOff: 0,

      grandTotal: 0,

    }

  );

  // ----------------------------------------
  // Round Off
  // ----------------------------------------

  const roundedGrandTotal = Math.round(
    invoiceTotals.grandTotal
  );

  invoiceTotals.roundOff = Number(

    (
      roundedGrandTotal -
      invoiceTotals.grandTotal

    ).toFixed(2)

  );

  invoiceTotals.grandTotal = roundedGrandTotal;

  return invoiceTotals;

}, [rows]);

// ======================================================
// Update Invoice Totals
// ======================================================

const updateInvoiceTotals = useCallback(() => {

  const totals = calculateInvoiceTotals();

  setTotals(totals);

  if (onTotalsChange) {

    onTotalsChange(totals);

  }

}, [
  calculateInvoiceTotals,
  onTotalsChange,
]);

// ======================================================
// Recalculate Entire Invoice
// ======================================================

const recalculateInvoice = useCallback(() => {

  setRows((previousRows) =>

    previousRows.map((row) =>
      calculateRow(row)
    )

  );

}, [calculateRow]);

// ======================================================
// Auto Calculate Invoice
// ======================================================

useEffect(() => {

  updateInvoiceTotals();

}, [
  rows,
  updateInvoiceTotals,
]);

// ======================================================
// Footer Values
// ======================================================

const footerValues = useMemo(() => ({

  totalItems: totals.totalItems,

  totalQuantity: totals.totalQuantity,

  totalFreeQuantity: totals.totalFreeQuantity,

  grossAmount: totals.grossAmount,

  discountAmount: totals.discountAmount,

  taxableAmount: totals.taxableAmount,

  cgstAmount: totals.cgstAmount,

  sgstAmount: totals.sgstAmount,

  igstAmount: totals.igstAmount,

  cessAmount: totals.cessAmount,

  totalTax: totals.totalTax,

  roundOff: totals.roundOff,

  grandTotal: totals.grandTotal,

}), [totals]);
  // ======================================================
// Focus Cell
// ======================================================

const focusCell = useCallback((rowIndex, field) => {

  const key = `${rowIndex}-${field}`;

  if (inputRefs.current[key]) {

    inputRefs.current[key].focus();

    inputRefs.current[key].select?.();

  }

}, []);

// ======================================================
// Next Editable Column
// ======================================================

const editableColumns = [
  "productName",
  "batchNo",
  "expiryDate",
  "quantity",
  "freeQuantity",
  "purchaseRate",
  "discountPercent",
  "gstRate",
  "remarks",
];

// ======================================================
// Move Right
// ======================================================

const moveRight = useCallback((row, column) => {

  const index = editableColumns.indexOf(column);

  if (index === editableColumns.length - 1) {

    if (row === rows.length - 1) {

      handleAddRow();

      setTimeout(() => {
        focusCell(row + 1, editableColumns[0]);
      }, 50);

      return;

    }

    focusCell(
      row + 1,
      editableColumns[0]
    );

    return;

  }

  focusCell(
    row,
    editableColumns[index + 1]
  );

}, [rows, focusCell, handleAddRow]);

// ======================================================
// Move Left
// ======================================================

const moveLeft = useCallback((row, column) => {

  const index = editableColumns.indexOf(column);

  if (index === 0) {

    if (row === 0) return;

    focusCell(
      row - 1,
      editableColumns[
        editableColumns.length - 1
      ]
    );

    return;

  }

  focusCell(
    row,
    editableColumns[index - 1]
  );

}, [focusCell]);

// ======================================================
// Move Down
// ======================================================

const moveDown = useCallback((row, column) => {

  if (row >= rows.length - 1) {

    handleAddRow();

    setTimeout(() => {

      focusCell(
        row + 1,
        column
      );

    }, 50);

    return;

  }

  focusCell(
    row + 1,
    column
  );

}, [rows, handleAddRow, focusCell]);

// ======================================================
// Move Up
// ======================================================

const moveUp = useCallback((row, column) => {

  if (row === 0) return;

  focusCell(
    row - 1,
    column
  );

}, [focusCell]);

// ======================================================
// Keyboard Navigation
// ======================================================

const handleKeyboardNavigation = useCallback(

(event, rowIndex, column) => {

  switch (event.key) {

    case "Enter":

      event.preventDefault();

      moveRight(rowIndex, column);

      break;

    case "Tab":

      event.preventDefault();

      if (event.shiftKey) {

        moveLeft(rowIndex, column);

      } else {

        moveRight(rowIndex, column);

      }

      break;

    case "ArrowRight":

      event.preventDefault();

      moveRight(rowIndex, column);

      break;

    case "ArrowLeft":

      event.preventDefault();

      moveLeft(rowIndex, column);

      break;

    case "ArrowUp":

      event.preventDefault();

      moveUp(rowIndex, column);

      break;

    case "ArrowDown":

      event.preventDefault();

      moveDown(rowIndex, column);

      break;

    case "Insert":

      event.preventDefault();

      handleInsertRow(rowIndex);

      break;

    case "Delete":

      if (event.ctrlKey) {

        event.preventDefault();

        handleDeleteRow(rowIndex);

      }

      break;

    case "F2":

      event.preventDefault();

      openProductSearch(rowIndex);

      break;

    case "Escape":

      closeProductSearch();

      break;

    default:

      break;

  }

},
[
  moveRight,
  moveLeft,
  moveUp,
  moveDown,
  handleInsertRow,
  handleDeleteRow,
  openProductSearch,
  closeProductSearch,
]);

// ======================================================
// Attach Ref
// ======================================================

const registerInputRef = (
  rowIndex,
  field,
  element
) => {

  if (!element) return;

  inputRefs.current[
    `${rowIndex}-${field}`
  ] = element;

};
  // ======================================================
// Validate Numeric Value
// ======================================================

const isPositiveNumber = (value) => {

  return (
    value !== "" &&
    !isNaN(value) &&
    Number(value) >= 0
  );

};

// ======================================================
// Validate Product
// ======================================================

const validateProduct = useCallback((row) => {

  if (!row.productId) {

    return "Please select a product.";

  }

  return "";

}, []);

// ======================================================
// Validate Quantity
// ======================================================

const validateQuantity = useCallback((row) => {

  const quantity = Number(row.quantity || 0);

  if (quantity <= 0) {

    return "Quantity should be greater than zero.";

  }

  return "";

}, []);

// ======================================================
// Validate Purchase Rate
// ======================================================

const validateRate = useCallback((row) => {

  const rate = Number(row.purchaseRate || 0);

  if (rate < 0) {

    return "Purchase rate cannot be negative.";

  }

  return "";

}, []);

// ======================================================
// Validate Discount
// ======================================================

const validateDiscount = useCallback((row) => {

  const grossAmount =
    Number(row.quantity || 0) *
    Number(row.purchaseRate || 0);

  if (
    Number(row.discountAmount || 0) >
    grossAmount
  ) {

    return "Discount cannot exceed Gross Amount.";

  }

  if (
    Number(row.discountPercent || 0) > 100
  ) {

    return "Discount percentage cannot exceed 100%.";

  }

  return "";

}, []);

// ======================================================
// Validate GST
// ======================================================

const validateGST = useCallback((row) => {

  const gst = Number(row.gstRate || 0);

  if (gst < 0) {

    return "GST cannot be negative.";

  }

  if (gst > 100) {

    return "Invalid GST percentage.";

  }

  return "";

}, []);

// ======================================================
// Validate Batch
// ======================================================

const validateBatch = useCallback((row) => {

  if (
    row.batchRequired &&
    !row.batchNo
  ) {

    return "Batch Number is required.";

  }

  return "";

}, []);

// ======================================================
// Validate Expiry Date
// ======================================================

const validateExpiryDate = useCallback((row) => {

  if (!row.expiryDate) {

    return "";

  }

  const expiry = new Date(row.expiryDate);

  if (expiry < new Date()) {

    return "Expiry Date cannot be in the past.";

  }

  return "";

}, []);

// ======================================================
// Validate Single Row
// ======================================================

const validateRow = useCallback((row) => {

  const errors = {};

  const productError = validateProduct(row);
  if (productError) errors.product = productError;

  const quantityError = validateQuantity(row);
  if (quantityError) errors.quantity = quantityError;

  const rateError = validateRate(row);
  if (rateError) errors.purchaseRate = rateError;

  const discountError = validateDiscount(row);
  if (discountError) errors.discount = discountError;

  const gstError = validateGST(row);
  if (gstError) errors.gstRate = gstError;

  const batchError = validateBatch(row);
  if (batchError) errors.batchNo = batchError;

  const expiryError = validateExpiryDate(row);
  if (expiryError) errors.expiryDate = expiryError;

  return errors;

}, [
  validateProduct,
  validateQuantity,
  validateRate,
  validateDiscount,
  validateGST,
  validateBatch,
  validateExpiryDate,
]);

// ======================================================
// Validate Entire Invoice
// ======================================================

const validateInvoice = useCallback(() => {

  const validationErrors = {};

  let isValid = true;

  rows.forEach((row, index) => {

    const rowErrors = validateRow(row);

    if (
      Object.keys(rowErrors).length > 0
    ) {

      validationErrors[index] = rowErrors;

      isValid = false;

    }

  });

  setRowErrors(validationErrors);

  return isValid;

}, [rows, validateRow]);

// ======================================================
// Clear Validation Errors
// ======================================================

const clearRowErrors = useCallback((rowIndex) => {

  setRowErrors((previousErrors) => {

    const updatedErrors = {
      ...previousErrors,
    };

    delete updatedErrors[rowIndex];

    return updatedErrors;

  });

}, []);

// ======================================================
// Validate Before Save
// ======================================================

const validateBeforeSave = useCallback(() => {

  if (rows.length === 0) {

    alert("Please add at least one item.");

    return false;

  }

  return validateInvoice();

}, [
  rows,
  validateInvoice,
]);
  {/* ======================================================
    Footer Totals
====================================================== */}

<tfoot className="purchase-table-footer">

  <tr>

    <td colSpan={6} className="footer-label">
      <strong>Totals</strong>
    </td>

    <td className="text-end">
      <strong>
        {Number(totals.totalQuantity || 0).toFixed(2)}
      </strong>
    </td>

    <td className="text-end">
      <strong>
        {Number(totals.totalFreeQuantity || 0).toFixed(2)}
      </strong>
    </td>

    <td></td>

    <td></td>

    <td className="text-end">
      <strong>
        {Number(totals.discountAmount || 0).toFixed(2)}
      </strong>
    </td>

    <td className="text-end">
      <strong>
        {Number(totals.taxableAmount || 0).toFixed(2)}
      </strong>
    </td>

    <td></td>

    <td className="text-end">
      <strong>
        {Number(totals.cgstAmount || 0).toFixed(2)}
      </strong>
    </td>

    <td className="text-end">
      <strong>
        {Number(totals.sgstAmount || 0).toFixed(2)}
      </strong>
    </td>

    <td className="text-end">
      <strong>
        {Number(totals.igstAmount || 0).toFixed(2)}
      </strong>
    </td>

    <td className="text-end">
      <strong>
        {Number(totals.grandTotal || 0).toFixed(2)}
      </strong>
    </td>

    <td></td>

  </tr>

  <tr>

    <td
      colSpan={17}
      className="footer-summary"
    >

      <div className="purchase-footer-summary">

        <div>
          <strong>Total Items :</strong>{" "}
          {totals.totalItems}
        </div>

        <div>
          <strong>Gross :</strong>{" "}
          ₹ {Number(totals.grossAmount || 0).toFixed(2)}
        </div>

        <div>
          <strong>Discount :</strong>{" "}
          ₹ {Number(totals.discountAmount || 0).toFixed(2)}
        </div>

        <div>
          <strong>Taxable :</strong>{" "}
          ₹ {Number(totals.taxableAmount || 0).toFixed(2)}
        </div>

        <div>
          <strong>Total Tax :</strong>{" "}
          ₹ {Number(totals.totalTax || 0).toFixed(2)}
        </div>

        <div>
          <strong>Round Off :</strong>{" "}
          ₹ {Number(totals.roundOff || 0).toFixed(2)}
        </div>

        <div className="grand-total">

          <strong>
            Grand Total :
          </strong>

          ₹{" "}

          {Number(
            totals.grandTotal || 0
          ).toFixed(2)}

        </div>

      </div>

    </td>

  </tr>

</tfoot>
  // ======================================================
// Export
// ======================================================

export default PurchaseItemsTable;
