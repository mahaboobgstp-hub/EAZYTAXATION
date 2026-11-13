import { supabase } from "../supabase/supabaseClient";

const TABLE = "voice_transaction_sessions";

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user) throw new Error("Please sign in to use voice drafts.");
  return data.user;
}

function requireCompany(companyId) {
  if (!companyId) throw new Error("Please select a company before creating a voice draft.");
}

export async function createVoiceSession({
  companyId,
  transactionType = "general",
  title = null,
  draftData = {},
  conversationContext = {},
}) {
  requireCompany(companyId);
  const user = await requireUser();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      company_id: companyId,
      user_id: user.id,
      transaction_type: transactionType,
      title,
      draft_data: draftData,
      conversation_context: conversationContext,
      change_history: [],
      status: "in_progress",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateVoiceSession(sessionId, companyId, changes = {}) {
  requireCompany(companyId);
  const user = await requireUser();
  if (!sessionId) throw new Error("Voice draft session was not found.");

  const allowed = {};
  if (changes.title !== undefined) allowed.title = changes.title;
  if (changes.draftData !== undefined) allowed.draft_data = changes.draftData;
  if (changes.conversationContext !== undefined) allowed.conversation_context = changes.conversationContext;
  if (changes.changeHistory !== undefined) allowed.change_history = changes.changeHistory;
  if (changes.status !== undefined) allowed.status = changes.status;
  if (changes.expiresAt !== undefined) allowed.expires_at = changes.expiresAt;
  if (changes.status === "completed") allowed.completed_at = new Date().toISOString();

  allowed.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(allowed)
    .eq("id", sessionId)
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getVoiceSessions(companyId, statuses = ["in_progress", "paused", "ready_for_review"]) {
  requireCompany(companyId);
  const user = await requireUser();

  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (statuses?.length) query = query.in("status", statuses);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getVoiceSession(sessionId, companyId) {
  requireCompany(companyId);
  const user = await requireUser();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", sessionId)
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteVoiceSession(sessionId, companyId) {
  requireCompany(companyId);
  const user = await requireUser();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", sessionId)
    .eq("company_id", companyId)
    .eq("user_id", user.id);

  if (error) throw error;
}
