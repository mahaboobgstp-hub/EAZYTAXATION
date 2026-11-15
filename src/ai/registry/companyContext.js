/**
 * SYD Intelligence — Company Context Contract.
 * Only non-sensitive allowlisted settings are sent to the model.
 * This context is informational and is NOT an authorization source.
 */
export function buildCompanyAIContext(company) {
  if (!company || typeof company !== "object") return null;
  const accountingEnabled = company.accounting_enabled === true;
  const startMonth = Number(company.financial_year_start_month || 4);
  return Object.freeze({
    companyName: String(company.company_name || "").slice(0, 160),
    operatingMode: accountingEnabled ? "billing_and_accounting" : "billing_only",
    accountingEnabled,
    gstRegistered: company.gst_registered === true,
    gstRegistrationType: ["Regular","Composition","Other"].includes(company.gst_registration_type) ? company.gst_registration_type : null,
    financialYearStartMonth: Number.isInteger(startMonth) && startMonth >= 1 && startMonth <= 12 ? startMonth : 4,
    booksBeginningDate: typeof company.books_beginning_date === "string" ? company.books_beginning_date.slice(0, 10) : null,
    currencyCode: /^[A-Z]{3}$/.test(String(company.currency_code || "INR")) ? String(company.currency_code || "INR") : "INR",
    industry: String(company.industry || "").slice(0, 100),
  });
}
