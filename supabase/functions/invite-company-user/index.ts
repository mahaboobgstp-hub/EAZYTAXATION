import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: "Supabase function environment is not configured." }, 500);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required." }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) return json({ error: "Invalid session." }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const { companyId, email, fullName, role, kind, permissions, accessLevel } = body;
    if (!companyId || !email || !fullName || !["user", "ca"].includes(kind)) {
      return json({ error: "Company, name, email and invitation type are required." }, 400);
    }

    const { data: company, error: companyError } = await admin
      .from("companies")
      .select("id, owner_user_id")
      .eq("id", companyId)
      .eq("owner_user_id", callerData.user.id)
      .maybeSingle();
    if (companyError || !company) return json({ error: "You do not own this company." }, 403);

    const normalizedEmail = String(email).trim().toLowerCase();
    let invitedUser = null;
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      { data: { full_name: fullName, invitation_source: "eazytaxation" } }
    );

    if (!inviteError) {
      invitedUser = inviteData.user;
    } else {
      const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (usersError) return json({ error: usersError.message }, 500);
      invitedUser = usersData.users.find(
        (candidate) => candidate.email?.toLowerCase() === normalizedEmail
      );
      if (!invitedUser) return json({ error: inviteError.message }, 400);
    }

    const profile = {
      id: invitedUser.id,
      full_name: fullName,
      business_name: company.company_name || (kind === "ca" ? "Chartered Accountant" : "Company User"),
    };
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(profile, { onConflict: "id" });
    if (profileError) return json({ error: profileError.message }, 500);

    if (kind === "ca") {
      const { error } = await admin.from("ca_company_assignments").upsert({
        company_id: companyId,
        ca_user_id: invitedUser.id,
        ca_email: normalizedEmail,
        ca_name: fullName,
        access_level: accessLevel === "read_write" ? "read_write" : "read_only",
        status: "Active",
        assigned_by: callerData.user.id,
      }, { onConflict: "company_id,ca_user_id" });
      if (error) return json({ error: error.message }, 500);
    } else {
      const { error } = await admin.from("company_user_access").upsert({
        company_id: companyId,
        user_id: invitedUser.id,
        email: normalizedEmail,
        full_name: fullName,
        role: role || "Accounts",
        status: "Active",
        permissions: permissions || {},
      }, { onConflict: "company_id,user_id" });
      if (error) return json({ error: error.message }, 500);
    }

    return json({
      success: true,
      userId: invitedUser.id,
      email: normalizedEmail,
      invitationSent: Boolean(!inviteError),
      message: inviteError
        ? "Existing account linked to this company."
        : "Invitation sent and company access assigned.",
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
