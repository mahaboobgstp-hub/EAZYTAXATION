import React, { useRef, useState } from "react";
import "../css/BulkTransactionImport.css";
import { useCompany } from "../context/CompanyContext";
import { supabase } from "../supabase/supabaseClient";\nimport { importSalesCsvRows, importPurchaseCsvRows, importExpenseCsvRows } from "../services/bulkInvoiceImportService";


const TEMPLATES = {
  sales: {
    title: "Sales",
    description: "Import records using the downloadable CSV template.",
    headers: ["Invoice Number","Invoice Date","Customer Name","Customer GSTIN","Place of Supply","Sale Type","Item Name","HSN/SAC","Quantity","Unit","Rate","Discount %","GST Rate %","Cess Rate %","Other Charges","Round Off","Narration"],
    sample: ["INV-2026-001","2026-11-01","ABC Traders","37ABCDE1234F1Z5","Andhra Pradesh","CREDIT","Office Chair","9401","2","Nos","4500","0","18","0","0","0","November office furniture sale"]
  },
  purchases: {
    title: "Purchases",
    description: "Import supplier invoices with one row for each purchased item.",
    headers: ["Supplier Invoice Number","Supplier Invoice Date","Vendor Name","Vendor GSTIN","Place of Supply","GST Treatment","Item Name","HSN/SAC","Quantity","Unit","Rate","Discount %","GST Rate %","Other Charges","Round Off","Narration"],
    sample: ["SUP-INV-104","2026-11-02","Sri Lakshmi Suppliers","37ABCDE1234F1Z5","Andhra Pradesh","Regular Supplier (Registered)","Raw Material","7204","100","Kg","52","0","18","0","0","November raw material purchase"]
  },
  expenses: {
    title: "Expenses",
    description: "Import expense vouchers with supplier, expense category and tax details.",
    headers: ["Expense Number","Expense Date","Expense Category","Payee / Supplier Name","Supplier GSTIN","Supplier Invoice Number","Supplier Invoice Date","GST Treatment","Description","HSN/SAC","Quantity","Unit","Rate","Discount %","GST Rate %","Other Charges","Payment Status","Payment Mode","Payment Account","Reference Number","Narration"],
    sample: ["","2026-11-03","Office Expenses","ABC Office Supplies","","BILL-088","2026-11-03","No GST","Stationery and office supplies","","1","Lot","2500","0","0","0","Unpaid","","","","Monthly office stationery"]
  },
  receipts: {
    title: "Receipts",
    description: "Import customer receipts, advances and invoice-linked collections.",
    headers: ["Receipt Number","Receipt Date","Received From","Customer GSTIN","Against Invoice Number","Receipt Mode","Deposit Account","Reference / UTR Number","Amount Received","Narration"],
    sample: ["","2026-11-04","ABC Traders","37ABCDE1234F1Z5","INV-2026-001","Bank Transfer","HDFC Current Account","UTR123456789","5000","Part payment against invoice"]
  },
  customers: {
    title: "Customers",
    description: "Import complete customer master details across all form sections.",
    headers: ["Customer Name","Legal / Trade Name","Customer Code","Customer Type","Customer Group","Constitution","Active","GST Registration Type","GSTIN","PAN","GST Registered","Place of Supply","Composition Scheme","SEZ Customer","Export Customer","Deemed Export","TDS Applicable","E-Invoice Applicable","Opening Balance","Balance Type","Credit Limit","Credit Period (Days)","Payment Terms","Default Sales Ledger","Billing Address Line 1","Billing Address Line 2","Billing City","Billing State","Billing PIN Code","Billing Country","Shipping Same as Billing","Shipping Address Line 1","Shipping Address Line 2","Shipping City","Shipping State","Shipping PIN Code","Shipping Country","Contact Person","Designation","Mobile","Alternate Mobile","Email","Website","MSME / Udyam Number","Industry / Business","Sales Person","Customer Tags","Remarks"],
    sample: ["ABC Traders","ABC Traders Pvt Ltd","CUST-001","Business (B2B)","Sundry Debtors","Private Limited","Yes","Registered","37ABCDE1234F1Z5","ABCDE1234F","Yes","Andhra Pradesh","No","No","No","No","No","Yes","0","Debit","100000","30","Net 30","Sales","12 Market Road","","Vijayawada","Andhra Pradesh","520001","India","Yes","","","","","","","Ravi Kumar","Accounts Manager","9876543210","9876543211","accounts@abctraders.in","https://abctraders.in","","Trading","Sales Team","Regular","Demo customer"]
  },
  vendors: {
    title: "Vendors",
    description: "Import complete vendor master details across all form sections.",
    headers: ["Vendor Name","Legal / Trade Name","Vendor Code","Vendor Type","Vendor Group","Constitution","Active","GST Registration Type","GSTIN","PAN","GST Registered","Place of Supply","Composition Scheme","Reverse Charge Applicable","TDS Applicable","TCS Applicable","E-Invoice Applicable","Opening Balance","Balance Type","Credit Limit","Credit Period (Days)","Payment Terms","Default Purchase Ledger","Default Payment Mode","Billing Address Line 1","Billing Address Line 2","Billing City","Billing State","Billing PIN Code","Billing Country","Shipping Same as Billing","Shipping Address Line 1","Shipping Address Line 2","Shipping City","Shipping State","Shipping PIN Code","Shipping Country","Contact Person","Designation","Mobile","Alternate Mobile","Email","Website","Bank Account Holder","Bank Name","Bank Account Number","IFSC Code","Branch","Bank Account Type","MSME / Udyam Number","Vendor Category","Remarks"],
    sample: ["Sri Lakshmi Suppliers","Sri Lakshmi Suppliers Pvt Ltd","VEND-001","Manufacturer","Sundry Creditors","Private Limited","Yes","Registered","37ABCDE1234F1Z5","ABCDE1234F","Yes","Andhra Pradesh","No","No","No","No","Yes","0","Credit","500000","45","Net 45","Purchases","Bank Transfer","45 Industrial Estate","","Guntur","Andhra Pradesh","522001","India","Yes","","","","","","","Lakshmi Devi","Sales Manager","9876543212","9876543213","billing@srilakshmi.in","https://srilakshmi.in","Sri Lakshmi Suppliers Pvt Ltd","HDFC Bank","50100123456789","HDFC0001234","Guntur Main","Current","","Raw Material Supplier","Demo supplier"]
  },
  items: {
    title: "Items",
    description: "Import goods and services with HSN/SAC, units and default tax rates.",
    headers: ["Item Code","Item Name","Item Type","HSN/SAC","Unit","GST Rate %","Sales Rate","Purchase Rate"],
    sample: ["ITM-001","Office Chair","Goods","9401","Nos","18","4500","3600"]
  },
  units: {
    title: "Units of Measurement",
    description: "Import standard units and their display symbols.",
    headers: ["Unit Code","Unit Name","Symbol","Decimal Places","Description","Active"],
    sample: ["NOS","Numbers","Nos","0","Countable individual items","Yes"]
  },
  "tax-rates": {
    title: "GST / Tax Rates",
    description: "Import HSN/SAC tax classifications and applicable GST rates.",
    headers: ["Code Type","HSN/SAC Code","Description","GST Rate %","CGST Rate %","SGST Rate %","IGST Rate %","Cess Rate %","Effective From","Effective To"],
    sample: ["HSN","9401","Seats and furniture","18","9","9","18","0","2026-04-01",""]
  },
  "expense-categories": {
    title: "Expense Categories",
    description: "Import expense category names used to classify business expenses.",
    headers: ["Category Name"],
    sample: ["Office Expenses"]
  },
  employees: {
    title: "Employees",
    description: "Import employee master records and basic employment information.",
    headers: ["Employee Code","Employee Name","Date of Joining","Mobile","Email","Department","Designation","Employment Type","PAN","UAN","ESI Number"],
    sample: ["EMP-001","Ravi Kumar","2026-04-01","9876543212","ravi@example.in","Accounts","Accountant","Permanent","ABCDE1234F","100123456789","1234567890"]
  },
  locations: {
    title: "Locations",
    description: "Import company locations, branches and warehouses.",
    headers: ["Location Code","Location Name","Address","City","State","PIN Code","Active"],
    sample: ["LOC-001","Main Branch","12 Market Road","Vijayawada","Andhra Pradesh","520001","Yes"]
  },
  accounts: {
    title: "Chart of Accounts",
    description: "Import account groups and ledger opening details. Review account mapping before migration.",
    headers: ["Account Group","Ledger Name","Ledger Code","Account Nature","Opening Balance","Opening Balance Type"],
    sample: ["Current Assets","HDFC Current Account","LED-001","Asset","25000","Debit"]
  },
  "bank-accounts": {
    title: "Bank Accounts",
    description: "Import bank account master details and opening balances.",
    headers: ["Account Name","Bank Name","Account Number","IFSC","Branch","Account Type","Opening Balance"],
    sample: ["HDFC Current Account","HDFC Bank","50100123456789","HDFC0001234","Vijayawada Main","Current","25000"]
  },
  payments: {
    title: "Payments",
    description: "Import supplier, expense and advance payments.",
    headers: ["Payment Number","Payment Date","Paid To","Against Document Type","Against Document Number","Payment Mode","Paid From Account","Reference / UTR Number","Amount Paid","Narration"],
    sample: ["","2026-11-05","Sri Lakshmi Suppliers","Purchase Invoice","SUP-INV-104","NEFT","HDFC Current Account","UTR987654321","25000","Part payment against supplier invoice"]
  }
};

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function parseCsvPreview(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export default function BulkTransactionImport({ kind, onImported }) {
  const { currentCompanyId } = useCompany();
  const config = TEMPLATES[kind];
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [notice, setNotice] = useState("");

  if (!config) return null;

  function downloadTemplate() {
    const content = [config.headers, config.sample].map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eazytaxation-${kind}-import-template.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setRows([]);
    setNotice("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setNotice("Please select a .csv file.");
      setFile(null);
      return;
    }
    const content = await selected.text();
    const parsed = parseCsvPreview(content);
    setRows(parsed);
    if (parsed.length < 2) setNotice("The file should contain a header row and at least one data row.");
    else if (kind !== "customers" && kind !== "vendors" && parsed[0].length !== config.headers.length) setNotice(`Template has ${config.headers.length} columns. Your file has ${parsed[0].length} columns. Please use the downloaded template.`);
  }

  function closeDialog() {
    setOpen(false);
    setFile(null);
    setRows([]);
    setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!file || rows.length < 2) {
      setNotice("Select a CSV file with a header and at least one data row.");
      return;
    }
    if (rows[0].length !== config.headers.length) {
      setNotice("Please use the downloaded template.");
      return;
    }
    if (kind === "items") {
      if (!currentCompanyId) { setNotice("Select a company before importing."); return; }
      const headers = rows[0].map(h => h.trim());
      const requiredHeaders = ["Item Code", "Item Name", "Item Type", "HSN/SAC", "Unit", "GST Rate %", "Sales Rate", "Purchase Rate"];
      if (!requiredHeaders.every(h => headers.includes(h))) {
        setNotice("The Items CSV headers do not match the required template. Please download the latest Items template.");
        return;
      }
      const itemRecords = [];
      const issues = [];
      const codesSeen = new Set();
      const namesSeen = new Set();
      rows.slice(1).forEach((row, idx) => {
        if (!row.some(v => String(v || "").trim())) return;
        const obj = {};
        headers.forEach((h, i) => { obj[h] = String(row[i] ?? "").trim(); });
        const itemName = obj["Item Name"];
        if (!itemName) { issues.push(`Row ${idx + 2}: Item Name is required.`); return; }
        const type = obj["Item Type"] || "Goods";
        if (!["Goods", "Service"].includes(type)) { issues.push(`Row ${idx + 2}: Item Type must be Goods or Service.`); return; }
        const numeric = {};
        for (const field of ["GST Rate %", "Sales Rate", "Purchase Rate"]) {
          const raw = obj[field];
          if (raw === "") { numeric[field] = null; continue; }
          const value = Number(raw);
          if (!Number.isFinite(value) || value < 0) { issues.push(`Row ${idx + 2}: ${field} must be a non-negative number.`); return; }
          numeric[field] = value;
        }
        const code = obj["Item Code"];
        if (code && codesSeen.has(code.toLowerCase())) { issues.push(`Row ${idx + 2}: Duplicate Item Code ${code} within CSV.`); return; }
        if (namesSeen.has(itemName.toLowerCase())) { issues.push(`Row ${idx + 2}: Duplicate Item Name ${itemName} within CSV.`); return; }
        if (code) codesSeen.add(code.toLowerCase());
        namesSeen.add(itemName.toLowerCase());
        itemRecords.push({
          item_code: code || null,
          item_name: itemName,
          item_type: type,
          hsn_sac: obj["HSN/SAC"] || null,
          unit: obj["Unit"] || null,
          gst_rate: numeric["GST Rate %"] ?? 0,
          sales_rate: numeric["Sales Rate"],
          purchase_rate: numeric["Purchase Rate"],
          company_id: currentCompanyId
        });
      });
      if (issues.length) { setNotice(issues.slice(0, 8).join(" | ") + (issues.length > 8 ? ` (and ${issues.length - 8} more)` : "")); return; }
      if (!itemRecords.length) { setNotice("No usable item rows found."); return; }
      try {
        const { data: existing, error: lookupError } = await supabase.from("items").select("item_code,item_name").eq("company_id", currentCompanyId);
        if (lookupError) throw lookupError;
        const existingCodes = new Set((existing || []).map(x => String(x.item_code || "").trim().toLowerCase()).filter(Boolean));
        const existingNames = new Set((existing || []).map(x => String(x.item_name || "").trim().toLowerCase()).filter(Boolean));
        const newRecords = itemRecords.filter(x => (!x.item_code || !existingCodes.has(x.item_code.toLowerCase())) && !existingNames.has(x.item_name.toLowerCase()));
        const skipped = itemRecords.length - newRecords.length;
        if (!newRecords.length) { setNotice(`All ${itemRecords.length} items already exist in this company; nothing imported.`); return; }
        const { error } = await supabase.from("items").insert(newRecords);
        if (error) throw error;
        setNotice(`Successfully imported ${newRecords.length} items${skipped ? `; skipped ${skipped} existing duplicate(s)` : ""} into the selected company.`);
        onImported?.();
        setRows([]);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
      } catch (error) { setNotice(`Import failed: ${error.message || "Unknown database error"}`); }
      return;
    }
    if (kind !== "customers" && kind !== "vendors") {
      setNotice("Screen preview only: database validation and record creation are not yet connected for this import.");
      return;
    }
    if (!currentCompanyId) { setNotice("Select a company before importing."); return; }
    const headers = rows[0].map(h => h.trim());
    const nameHeader = kind === "customers" ? "Customer Name" : "Vendor Name";
    if (!headers.includes(nameHeader) && !headers.includes("Name")) { setNotice(`Missing required column: ${nameHeader}`); return; }
    const boolFields = new Set(["Active","GST Registered","Composition Scheme","SEZ Customer","Export Customer","Deemed Export","TDS Applicable","TCS Applicable","Reverse Charge Applicable","E-Invoice Applicable","Shipping Same as Billing"]);
    const numericFields = new Set(["Opening Balance","Credit Limit","Credit Period (Days)"]);
    const colMap = {
      "Customer Name":"customer_name","Vendor Name":"vendor_name","Name":"customer_name",
      "Legal / Trade Name":"legal_name","Customer Code":"customer_code","Vendor Code":"vendor_code",
      "Customer Type":"customer_type","Vendor Type":"vendor_type","Customer Group":"customer_group","Vendor Group":"vendor_group","Constitution":"constitution",
      "Active":"is_active","GST Registration Type":"gst_registration_type","GSTIN":"gstin","PAN":"pan","GST Registered":"gst_registered","Place of Supply":"place_of_supply","Composition Scheme":"composition_scheme","SEZ Customer":"sez_customer","Export Customer":"export_customer","Deemed Export":"deemed_export","TDS Applicable":"tds_applicable","TCS Applicable":"tcs_applicable","Reverse Charge Applicable":"reverse_charge_applicable","E-Invoice Applicable":"e_invoice_applicable",
      "Opening Balance":"opening_balance","Balance Type":"opening_balance_type","Credit Limit":"credit_limit","Credit Period (Days)":"credit_period_days","Payment Terms":"payment_terms","Default Sales Ledger":"default_sales_ledger","Default Purchase Ledger":"default_purchase_ledger","Default Payment Mode":"default_payment_mode",
      "Billing Address Line 1":"billing_address_line1","Billing Address Line 2":"billing_address_line2","Billing City":"billing_city","Billing State":"billing_state","Billing PIN Code":"billing_pin","Billing Country":"billing_country","Shipping Same as Billing":"shipping_same_as_billing","Shipping Address Line 1":"shipping_address_line1","Shipping Address Line 2":"shipping_address_line2","Shipping City":"shipping_city","Shipping State":"shipping_state","Shipping PIN Code":"shipping_pin","Shipping Country":"shipping_country",
      "Contact Person":"contact_person","Designation":"designation","Mobile":"mobile","Mobile Number":"mobile","Alternate Mobile":"alternate_mobile","Email":"email","Website":"website","Bank Account Holder":"bank_account_holder","Bank Name":"bank_name","Bank Account Number":"bank_account_number","IFSC Code":"bank_ifsc","Branch":"bank_branch","Bank Account Type":"bank_account_type","MSME / Udyam Number":"msme_udyam_number","Industry / Business":"industry_business","Sales Person":"sales_person","Customer Tags":"customer_tags","Vendor Category":"vendor_category","Remarks":"remarks","Address":"address","State":"state"
    };
    const legacyAllowed = ["Name","GSTIN","PAN","Mobile","Email","Address","State"];
    if (headers.some(h => !colMap[h]) || (headers.length === 7 && legacyAllowed.every(h => headers.includes(h)))) {
      if (!(headers.length === 7 && legacyAllowed.every(h => headers.includes(h)))) { setNotice("Your CSV contains unsupported column names. Download the new full-field template."); return; }
    }
    const records = [];
    const problems = [];
    rows.slice(1).forEach((row, idx) => {
      if (!row.some(v => String(v||"").trim())) return;
      const obj = {};
      headers.forEach((header, i) => {
        const key = colMap[header];
        if (!key) return;
        let val = String(row[i] ?? "").trim();
        if (val === "") return;
        if (boolFields.has(header)) {
          if (/^(yes|true|1)$/i.test(val)) val = true;
          else if (/^(no|false|0)$/i.test(val)) val = false;
          else { problems.push(`Row ${idx+2}: ${header} must be Yes or No.`); return; }
        } else if (numericFields.has(header)) {
          const num = Number(val);
          if (!Number.isFinite(num) || num < 0) { problems.push(`Row ${idx+2}: ${header} must be a non-negative number.`); return; }
          val = num;
        }
        obj[key] = val;
      });
      const name = obj[kind==="customers"?"customer_name":"vendor_name"] || obj.customer_name || obj.vendor_name;
      if (!name) problems.push(`Row ${idx+2}: ${nameHeader} is required.`);
      if (obj.mobile && !/^\+?[0-9\s-]{7,15}$/.test(obj.mobile)) problems.push(`Row ${idx+2}: Mobile format looks invalid.`);
      if (obj.gstin && !/^[0-9A-Z]{15}$/i.test(obj.gstin)) problems.push(`Row ${idx+2}: GSTIN must be 15 characters.`);
      if (obj.pan && !/^[0-9A-Z]{10}$/i.test(obj.pan)) problems.push(`Row ${idx+2}: PAN must be 10 characters.`);
      obj.is_active = obj.is_active ?? true;
      obj.shipping_same_as_billing = obj.shipping_same_as_billing ?? true;
      obj.gst_registered = obj.gst_registered ?? Boolean(obj.gstin);
      obj.opening_balance = obj.opening_balance ?? 0;
      obj.credit_limit = obj.credit_limit ?? 0;
      obj.credit_period_days = obj.credit_period_days ?? 0;
      obj.opening_balance_type = obj.opening_balance_type || (kind==="customers"?"Debit":"Credit");
      if (kind==="customers") {
        obj.customer_name=name;
        if (!obj.customer_code) obj.customer_code=null;
        obj.address=[obj.billing_address_line1,obj.billing_address_line2,obj.billing_city,obj.billing_state,obj.billing_pin,obj.billing_country].filter(Boolean).join(", ") || obj.address || "";
        obj.state=obj.billing_state||obj.state||"";
      } else {
        obj.vendor_name=name;
        obj.address=[obj.billing_address_line1,obj.billing_address_line2,obj.billing_city,obj.billing_state,obj.billing_pin,obj.billing_country].filter(Boolean).join(", ") || obj.address || "";
        obj.state=obj.billing_state||obj.state||"";
      }
      obj.company_id=currentCompanyId;
      records.push(obj);
    });
    if (problems.length) { setNotice(problems.slice(0,8).join(" | ")+(problems.length>8?` (and ${problems.length-8} more)`:"")); return; }
    if (!records.length) { setNotice("No usable data rows found."); return; }
    const table=kind==="customers"?"customers":"vendors";
    try {
      const {error}=await supabase.from(table).insert(records);
      if(error) throw error;
      setNotice(`Successfully imported ${records.length} ${kind} into the selected company.`);
      onImported?.();
      setRows([]);
      setFile(null);
      if(inputRef.current) inputRef.current.value="";
    } catch(error) { setNotice(`Import failed: ${error.message||"Unknown database error"}`); }
  }

  return (
    <>
      <section className="bulk-import-card">
        <div className="bulk-import-copy">
          <span className="bulk-import-eyebrow">BULK DATA IMPORT</span>
          <h3>Import {config.title}</h3>
          <p>{config.description}</p>
        </div>
        <div className="bulk-import-actions">
          <button type="button" className="bulk-import-primary" onClick={() => { setOpen(true); setNotice(""); }}>
            <span aria-hidden="true">↑</span> Import {config.title}
          </button>
          <button type="button" className="bulk-import-secondary" onClick={downloadTemplate}>
            <span aria-hidden="true">↓</span> Download CSV Template
          </button>
        </div>
      </section>

      {open && (
        <div className="bulk-import-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="bulk-import-dialog" role="dialog" aria-modal="true" aria-labelledby={`bulk-import-title-${kind}`}>
            <header className="bulk-import-dialog-header">
              <div>
                <span className="bulk-import-eyebrow">CSV UPLOAD</span>
                <h2 id={`bulk-import-title-${kind}`}>Import {config.title}</h2>
                <p>Upload the completed {config.title.toLowerCase()} template to review the file.</p>
              </div>
              <button type="button" className="bulk-import-close" onClick={closeDialog} aria-label="Close">×</button>
            </header>

            <button type="button" className="bulk-import-dropzone" onClick={() => inputRef.current?.click()}>
              <span className="bulk-import-file-icon" aria-hidden="true">CSV</span>
              <strong>{file ? file.name : "Choose a CSV file to upload"}</strong>
              <span>{file ? `${(file.size / 1024).toFixed(1)} KB · ${Math.max(rows.length - 1, 0)} data rows detected` : "Browse your device · .csv files only"}</span>
              <span className="bulk-import-browse">Browse files</span>
            </button>
            <input ref={inputRef} className="bulk-import-hidden-input" type="file" accept=".csv,text/csv" onChange={handleFileChange} />

            <div className="bulk-import-template-note">
              <span>Don't have a template?</span>
              <button type="button" onClick={downloadTemplate}>Download {config.title} CSV template</button>
            </div>

            {notice && <div className="bulk-import-notice" role="status">{notice}</div>}

            {rows.length > 0 && (
              <div className="bulk-import-preview">
                <div className="bulk-import-preview-heading">
                  <strong>File preview</strong>
                  <span>{Math.max(rows.length - 1, 0)} data rows</span>
                </div>
                <div className="bulk-import-table-wrap">
                  <table>
                    <thead><tr>{rows[0].slice(0, 5).map((heading, index) => <th key={index}>{heading || `Column ${index + 1}`}</th>)}{rows[0].length > 5 && <th>…</th>}</tr></thead>
                    <tbody>{rows.slice(1, 4).map((row, rowIndex) => <tr key={rowIndex}>{row.slice(0, 5).map((value, index) => <td key={index}>{value || "—"}</td>)}{row.length > 5 && <td>…</td>}</tr>)}</tbody>
                  </table>
                </div>
                {rows.length > 4 && <span className="bulk-import-more">Showing first 3 data rows.</span>}
              </div>
            )}

            <footer className="bulk-import-dialog-footer">
              <button type="button" className="bulk-import-secondary" onClick={closeDialog}>Cancel</button>
              <button type="button" className="bulk-import-primary" onClick={handleSubmit} disabled={!file}>Submit Import</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
