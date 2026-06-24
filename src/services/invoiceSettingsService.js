import { supabase }
from "../supabase/supabaseClient";

export async function getInvoiceSettings(
  companyId
) {

  const { data, error } =
    await supabase
      .from("invoice_settings")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

  if (error) throw error;

  return data;
}
export async function
getInvoiceSettingsByCompany(
  companyId
) {

  const {
    data,
    error
  } = await supabase
    .from("invoice_settings")
    .select("*")
    .eq(
      "company_id",
      companyId
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}
export async function saveInvoiceSettings(
  settings
) {

  const { data: existing } =
    await supabase
      .from("invoice_settings")
      .select("id")
      .eq(
        "company_id",
        settings.company_id
      )
      .maybeSingle();

  if (existing) {

    const { error } =
      await supabase
        .from("invoice_settings")
        .update(settings)
        .eq(
          "company_id",
          settings.company_id
        );

    if (error) throw error;

  } else {

    const { error } =
      await supabase
        .from("invoice_settings")
        .insert([settings]);

    if (error) throw error;

  }

  return true;
}
