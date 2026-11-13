import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const nullableString = { type: ["string", "null"] };
const nullableNumber = { type: ["number", "null"] };

const itemSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "description","hsn_sac","quantity","unit","rate","gross_amount","discount_amount",
    "taxable_amount","gst_rate","cgst_rate","cgst_amount","sgst_rate","sgst_amount",
    "igst_rate","igst_amount","cess_amount","line_total","confidence"
  ],
  properties: {
    description: { type: "string" },
    hsn_sac: nullableString,
    quantity: nullableNumber,
    unit: nullableString,
    rate: nullableNumber,
    gross_amount: nullableNumber,
    discount_amount: nullableNumber,
    taxable_amount: nullableNumber,
    gst_rate: nullableNumber,
    cgst_rate: nullableNumber,
    cgst_amount: nullableNumber,
    sgst_rate: nullableNumber,
    sgst_amount: nullableNumber,
    igst_rate: nullableNumber,
    igst_amount: nullableNumber,
    cess_amount: nullableNumber,
    line_total: nullableNumber,
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
};

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "document_type","classification","supplier_name","supplier_gstin","supplier_pan",
    "supplier_address","supplier_state","supplier_state_code","supplier_email","supplier_phone",
    "invoice_number","invoice_date","due_date","place_of_supply","place_of_supply_state_code",
    "reverse_charge","eway_bill_number","vehicle_number","purchase_order_number",
    "buyer_name","buyer_gstin","buyer_address","items","taxable_value","cgst_total",
    "sgst_total","igst_total","cess_total","freight","other_charges","discount_total",
    "round_off","grand_total","amount_in_words","payment_terms","currency",
    "confidence","warnings"
  ],
  properties: {
    document_type: { type: "string", enum: ["purchase_invoice","expense_invoice","other","uncertain"] },
    classification: { type: "string", enum: ["purchase","expense","uncertain"] },
    supplier_name: nullableString,
    supplier_gstin: nullableString,
    supplier_pan: nullableString,
    supplier_address: nullableString,
    supplier_state: nullableString,
    supplier_state_code: nullableString,
    supplier_email: nullableString,
    supplier_phone: nullableString,
    invoice_number: nullableString,
    invoice_date: nullableString,
    due_date: nullableString,
    place_of_supply: nullableString,
    place_of_supply_state_code: nullableString,
    reverse_charge: { type: ["boolean","null"] },
    eway_bill_number: nullableString,
    vehicle_number: nullableString,
    purchase_order_number: nullableString,
    buyer_name: nullableString,
    buyer_gstin: nullableString,
    buyer_address: nullableString,
    items: { type: "array", items: itemSchema },
    taxable_value: nullableNumber,
    cgst_total: nullableNumber,
    sgst_total: nullableNumber,
    igst_total: nullableNumber,
    cess_total: nullableNumber,
    freight: nullableNumber,
    other_charges: nullableNumber,
    discount_total: nullableNumber,
    round_off: nullableNumber,
    grand_total: nullableNumber,
    amount_in_words: nullableString,
    payment_terms: nullableString,
    currency: { type: "string" },
    confidence: {
      type: "object",
      additionalProperties: false,
      required: [
        "supplier_name","supplier_gstin","supplier_address","invoice_number","invoice_date",
        "buyer_gstin","items","taxable_value","cgst_total","sgst_total","igst_total","grand_total"
      ],
      properties: {
        supplier_name: { type: "number", minimum: 0, maximum: 1 },
        supplier_gstin: { type: "number", minimum: 0, maximum: 1 },
        supplier_address: { type: "number", minimum: 0, maximum: 1 },
        invoice_number: { type: "number", minimum: 0, maximum: 1 },
        invoice_date: { type: "number", minimum: 0, maximum: 1 },
        buyer_gstin: { type: "number", minimum: 0, maximum: 1 },
        items: { type: "number", minimum: 0, maximum: 1 },
        taxable_value: { type: "number", minimum: 0, maximum: 1 },
        cgst_total: { type: "number", minimum: 0, maximum: 1 },
        sgst_total: { type: "number", minimum: 0, maximum: 1 },
        igst_total: { type: "number", minimum: 0, maximum: 1 },
        grand_total: { type: "number", minimum: 0, maximum: 1 },
      },
    },
    warnings: { type: "array", items: { type: "string" } },
  },
};

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function getOutputText(response: any) {
  const parts: string[] = [];
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n");
}

function validateExtraction(data: any, expectedType: string) {
  const warnings = Array.isArray(data.warnings) ? [...data.warnings] : [];
  if (data.document_type === "other" || data.document_type === "uncertain") {
    warnings.push("The uploaded document could not be confidently identified as an invoice.");
  }
  if (data.classification !== "uncertain" && data.classification !== expectedType) {
    warnings.push("The AI classification differs from the entry type selected by the user. Please verify before saving.");
  }
  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  if (data.supplier_gstin && !gstinPattern.test(String(data.supplier_gstin).toUpperCase())) {
    warnings.push("Supplier GSTIN format does not pass the basic format check.");
  }
  if (data.buyer_gstin && !gstinPattern.test(String(data.buyer_gstin).toUpperCase())) {
    warnings.push("Buyer GSTIN format does not pass the basic format check.");
  }
  const sum = (key: string) => (data.items || []).reduce((total: number, item: any) => total + (Number(item[key]) || 0), 0);
  const checks = {
    item_taxable_total: Number(data.taxable_value ?? 0) - sum("taxable_amount"),
    item_cgst_total: Number(data.cgst_total ?? 0) - sum("cgst_amount"),
    item_sgst_total: Number(data.sgst_total ?? 0) - sum("sgst_amount"),
    item_igst_total: Number(data.igst_total ?? 0) - sum("igst_amount"),
  };
  for (const [label, difference] of Object.entries(checks)) {
    if (Math.abs(difference) > 2) warnings.push(`Invoice summary does not match the sum of item rows for ${label.replaceAll("_"," ")} (difference ₹${difference.toFixed(2)}).`);
  }
  const calculatedTotal = Number(data.taxable_value || 0) + Number(data.cgst_total || 0)
    + Number(data.sgst_total || 0) + Number(data.igst_total || 0) + Number(data.cess_total || 0)
    + Number(data.freight || 0) + Number(data.other_charges || 0)
    - Number(data.discount_total || 0) + Number(data.round_off || 0);
  const totalDifference = data.grand_total == null ? null : Number(data.grand_total) - calculatedTotal;
  if (totalDifference !== null && Math.abs(totalDifference) > 2) {
    warnings.push(`Invoice grand total differs from the independently calculated total by ₹${totalDifference.toFixed(2)}.`);
  }
  const lowConfidence = Object.entries(data.confidence || {}).filter(([key, value]) =>
    typeof value === "number" && value < 0.75
  ).map(([key]) => key);
  if (lowConfidence.length) warnings.push(`Please verify low-confidence fields: ${lowConfidence.join(", ")}.`);
  return {
    warnings: [...new Set(warnings)],
    checks,
    calculated_total: Number(calculatedTotal.toFixed(2)),
    total_difference: totalDifference === null ? null : Number(totalDifference.toFixed(2)),
    requires_user_review: true,
    low_confidence_fields: lowConfidence,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  let jobId: string | null = null;
  let supabase: any = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication is required.");
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anonKey) throw new Error("Supabase function environment is incomplete.");

    supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) throw new Error("Your session is invalid. Please sign in again.");

    const body = await req.json();
    jobId = String(body?.job_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(jobId)) throw new Error("A valid processing job ID is required.");

    const { data: job, error: jobError } = await supabase.from("ai_invoice_processing_jobs")
      .select("*").eq("id", jobId).single();
    if (jobError || !job) throw new Error("The document processing job was not found or you do not have access.");
    if (job.created_by !== authData.user.id) throw new Error("Only the user who uploaded this document can process it.");
    if (!["queued","failed"].includes(job.status)) throw new Error("This document has already been processed or is currently processing.");

    const { error: startError } = await supabase.from("ai_invoice_processing_jobs")
      .update({ status: "processing", processing_attempts: Number(job.processing_attempts || 0) + 1,
        processing_started_at: new Date().toISOString(), error_message: null, updated_at: new Date().toISOString() })
      .eq("id", jobId).eq("company_id", job.company_id);
    if (startError) throw startError;

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      await supabase.from("ai_invoice_processing_jobs").update({
        status: "failed", error_message: "AI provider is not configured. Add OPENAI_API_KEY to Supabase Edge Function secrets.",
        updated_at: new Date().toISOString(),
      }).eq("id", jobId).eq("company_id", job.company_id);
      return new Response(JSON.stringify({ error: "AI provider is not configured yet.", code: "AI_PROVIDER_NOT_CONFIGURED" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: file, error: fileError } = await supabase.storage.from(job.source_bucket).download(job.source_path);
    if (fileError || !file) throw new Error("Unable to read the uploaded invoice document.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error("The document is empty or exceeds the 10 MB processing limit.");
    const base64 = toBase64(bytes);
    const dataUrl = `data:${job.source_mime_type};base64,${base64}`;
    const isPdf = job.source_mime_type === "application/pdf";
    const filePart = isPdf
      ? { type: "input_file", filename: job.source_file_name, file_data: dataUrl, detail: "high" }
      : { type: "input_image", image_url: dataUrl, detail: "high" };

    const instructions = `You are a document data extraction engine for Indian GST accounting software. Read the entire uploaded document, including all pages. Supplier invoice layouts are unknown and must not be matched against supplier-specific templates. Identify each field independently by meaning, labels, context and table structure. Understand synonyms such as Bill No, Invoice Ref, Tax Invoice No and Document Number. Distinguish supplier/seller from buyer/customer; do not confuse their GSTINs. Extract every visible line item, HSN/SAC, quantity, unit, rate, discounts, taxable value, GST rates and separate CGST/SGST/IGST amounts. Capture invoice-level totals and charges. Preserve the printed values; do not calculate missing values or invent details. If a value is absent or unreadable, return null and explain it in warnings. Return dates as YYYY-MM-DD only when unambiguous; otherwise null. Return numeric amounts as numbers without currency symbols. Classify a normal goods/services supplier tax invoice as purchase; a utility, rent, telecom or other operating bill as expense; classify ambiguous documents as uncertain. Never create accounting entries. This is extraction only. User-selected entry type is ${job.transaction_type}. Currency is INR unless clearly stated otherwise.`;

    const model = Deno.env.get("OPENAI_INVOICE_MODEL") || "gpt-4.1-mini";
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: [{ role: "user", content: [
          { type: "input_text", text: instructions },
          filePart,
        ] }],
        text: { format: { type: "json_schema", name: "indian_invoice_extraction", strict: true, schema: extractionSchema } },
        max_output_tokens: 12000,
      }),
    });
    const aiPayload = await aiResponse.json();
    if (!aiResponse.ok) {
      const message = aiPayload?.error?.message || "The AI provider could not process this document.";
      throw new Error(message);
    }
    const outputText = getOutputText(aiPayload);
    if (!outputText) throw new Error("The AI provider returned no structured extraction.");
    const extracted = JSON.parse(outputText);
    const validation = validateExtraction(extracted, job.transaction_type);
    const { error: saveError } = await supabase.from("ai_invoice_processing_jobs").update({
      status: "needs_review",
      extracted_data: extracted,
      validation_results: validation,
      model_name: model,
      processed_at: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId).eq("company_id", job.company_id);
    if (saveError) throw saveError;

    return new Response(JSON.stringify({
      job_id: jobId,
      status: "needs_review",
      extracted_data: extracted,
      validation_results: validation,
      transaction_type: job.transaction_type,
      saved_transaction: false,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document processing failed.";
    if (supabase && jobId) {
      await supabase.from("ai_invoice_processing_jobs").update({
        status: "failed", error_message: message.slice(0, 1000), updated_at: new Date().toISOString(),
      }).eq("id", jobId);
    }
    const status = /Authentication|session|access|not found/i.test(message) ? 403 : 400;
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
