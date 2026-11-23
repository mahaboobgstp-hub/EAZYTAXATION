import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceKey || !anonKey) return json({ error: "Supabase function environment is not configured." }, 500);
    const authorization = req.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required." }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) return json({ error: "Invalid session." }, 401);
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const body = await req.json();
    const { companyId, email, fullName, role, kind, permissions, accessLevel, password } = body;
    if (!companyId || !email || !fullName || !["user", "ca"].includes(kind)) return json({ error: "Company, name, email and access type are required." }, 400);
    if (kind === "user" && (typeof password !== "string" || password.length < 8)) return json({ error: "Password is required and must be at least 8 characters." }, 400);
    const { data: company, error: companyError } = await admin.from("companies").select("id,owner_user_id,company_name").eq("id",companyId).eq("owner_user_id",callerData.user.id).maybeSingle();
    if (companyError || !company) return json({ error: "You do not own this company." }, 403);
    const normalizedEmail = String(email).trim().toLowerCase();
    let user = null;
    let createdNewUser = false;
    if (kind === "user") {
      const { data: foundUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return json({ error: listError.message }, 500);
      user = foundUsers.users.find(u => u.email?.toLowerCase() === normalizedEmail) || null;
      if (user) {
        const { data: accessExisting, error: accessLookupError } = await admin.from("company_user_access").select("id").eq("company_id",companyId).eq("user_id",user.id).maybeSingle();
        if (accessLookupError) return json({ error: accessLookupError.message }, 500);
        if (accessExisting) {
          const { error: accessUpdateError } = await admin.from("company_user_access").update({ full_name:fullName, role:role||"Accounts", status:"Active", permissions:permissions||{}, updated_at:new Date().toISOString() }).eq("id",accessExisting.id);
          if (accessUpdateError) return json({ error:accessUpdateError.message },500);
          return json({ success:true,userId:user.id,email:normalizedEmail,createdNewUser:false,message:"This user already has an account and company access. Access permissions were updated; existing password was not changed." });
        }
        return json({ error:"This email already has a SYD account. To protect their existing credentials, use the existing-account access linking flow instead; this creation flow will not change an existing account password." },409);
      }
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, invitation_source: "eazytaxation" }
      });
      if (createError) return json({ error:createError.message },400);
      user = createData.user;
      createdNewUser = true;
    } else {
      const { data: foundUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return json({ error:listError.message },500);
      user = foundUsers.users.find(u => u.email?.toLowerCase() === normalizedEmail) || null;
      if (!user) {
        const { data: createData, error: createError } = await admin.auth.admin.createUser({ email:normalizedEmail, email_confirm:true, user_metadata:{full_name:fullName, invitation_source:"eazytaxation"} });
        if (createError) return json({ error:createError.message },400);
        user = createData.user;
      }
    }
    const profile = { id:user.id, full_name:fullName, business_name:company.company_name || (kind === "ca" ? "Chartered Accountant" : "Company User") };
    const { error: profileError } = await admin.from("profiles").upsert(profile,{onConflict:"id"});
    if (profileError) return json({ error:profileError.message },500);
    if (kind === "ca") {
      const { error } = await admin.from("ca_company_assignments").upsert({ company_id:companyId, ca_user_id:user.id, ca_email:normalizedEmail, ca_name:fullName, access_level:accessLevel==="read_write"?"read_write":"read_only", status:"Active", assigned_by:callerData.user.id },{onConflict:"company_id,ca_user_id"});
      if (error) return json({ error:error.message },500);
    } else {
      const { error } = await admin.from("company_user_access").upsert({ company_id:companyId, user_id:user.id, email:normalizedEmail, full_name:fullName, role:role||"Accounts", status:"Active", permissions:permissions||{} },{onConflict:"company_id,user_id"});
      if (error) return json({ error:error.message },500);
    }
    return json({ success:true,userId:user.id,email:normalizedEmail,createdNewUser,message:createdNewUser?"User created with the provided password and company access assigned.":"Existing account linked to this company." });
  } catch (error) {
    return json({ error:error instanceof Error ? error.message : "Unexpected error." },500);
  }
});
