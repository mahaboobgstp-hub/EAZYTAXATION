import { supabase } from "../supabase/supabaseClient";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export async function uploadAndProcessAiInvoice(file, companyId, transactionType) {
  if (!file) throw new Error("Choose an invoice document first.");
  if (!companyId) throw new Error("Select a company before uploading an invoice.");
  if (!["purchase", "expense"].includes(transactionType)) throw new Error("Unsupported invoice type.");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Upload a PDF, JPG or PNG document.");
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new Error("The document must be between 1 byte and 10 MB.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Please sign in again before processing the document.");

  const jobId = crypto.randomUUID();
  const safeName = String(file.name || "invoice-document")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-120) || "invoice-document";
  const bucket = "ai-invoice-documents";
  const path = `${companyId}/${transactionType}/${jobId}/${safeName}`;

  const { error: jobError } = await supabase.from("ai_invoice_processing_jobs").insert([{
    id: jobId,
    company_id: companyId,
    created_by: authData.user.id,
    transaction_type: transactionType,
    source_bucket: bucket,
    source_path: path,
    source_file_name: safeName,
    source_mime_type: file.type,
    source_file_size: file.size,
    status: "queued",
  }]);
  if (jobError) throw jobError;

  try {
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data, error: processError } = await supabase.functions.invoke("process-ai-invoice", {
      body: { job_id: jobId },
    });
    if (processError) {
      const details = data?.error || processError.message || "AI invoice processing failed.";
      throw new Error(details);
    }
    if (!data?.extracted_data) throw new Error(data?.error || "The AI service returned no invoice details.");
    return {
      jobId,
      fileName: safeName,
      storagePath: path,
      extractedData: data.extracted_data,
      validationResults: data.validation_results || {},
      status: data.status || "needs_review",
    };
  } catch (error) {
    await supabase.from("ai_invoice_processing_jobs").update({
      status: "failed",
      error_message: String(error?.message || "Invoice processing failed.").slice(0, 1000),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId).eq("company_id", companyId);
    throw error;
  }
}

export async function getAiInvoiceProcessingJob(jobId, companyId) {
  const { data, error } = await supabase.from("ai_invoice_processing_jobs")
    .select("*").eq("id", jobId).eq("company_id", companyId).single();
  if (error) throw error;
  return data;
}
