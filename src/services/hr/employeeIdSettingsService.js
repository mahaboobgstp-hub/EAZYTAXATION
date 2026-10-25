
import { supabase } from "../../supabase/supabaseClient";

function toUiSettings(row) {
  return {
    format: row.id_format || "{COMP}{SEQ}",
    companyCode: row.company_code || "",
    startingNumber: String(row.starting_number ?? 1),
    sequenceDigits: String(row.sequence_digits ?? 5),
    generationMode:
      row.generation_mode === "auto_edit"
        ? "auto-edit"
        : row.generation_mode || "auto",
    allowManualOverride: Boolean(row.allow_manual_override),
    checkDuplicate: row.check_duplicate ?? true,
    showPreview: row.show_preview ?? true,
  };
}

function toDatabaseSettings(companyId, settings) {
  const generationMode =
    settings.generationMode === "auto-edit"
      ? "auto_edit"
      : settings.generationMode;

  return {
    company_id: companyId,
    company_code: settings.companyCode.trim().toUpperCase(),
    id_format: settings.format.trim(),
    starting_number: Number(settings.startingNumber),
    sequence_digits: Number(settings.sequenceDigits),
    generation_mode: generationMode,
    allow_manual_override: settings.allowManualOverride,
    check_duplicate: settings.checkDuplicate,
    show_preview: settings.showPreview,
    updated_at: new Date().toISOString(),
  };
}

export async function getEmployeeIdSettings(companyId) {
  if (!companyId) {
    throw new Error("Select a company before loading Employee ID Settings.");
  }

  const { data, error } = await supabase
    .from("employee_id_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;

  return data ? toUiSettings(data) : null;
}

export async function saveEmployeeIdSettings(companyId, settings) {
  if (!companyId) {
    throw new Error("Select a company before saving Employee ID Settings.");
  }

  const payload = toDatabaseSettings(companyId, settings);

  const { data, error } = await supabase
    .from("employee_id_settings")
    .upsert(payload, { onConflict: "company_id" })
    .select("*")
    .single();

  if (error) throw error;

  return toUiSettings(data);
}
