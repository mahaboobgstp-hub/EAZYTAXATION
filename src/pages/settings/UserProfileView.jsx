import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiShield, FiBriefcase, FiEdit2, FiArrowLeft } from "react-icons/fi";
import { supabase } from "../../supabase/supabaseClient";
import { ACCESS_MODULES } from "../../services/userAccessService";
import "../../css/settings/UserProfileView.css";

const valueOrFallback = (value) => value || "Not provided";

export default function UserProfileView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [access, setAccess] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isCa, setIsCa] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const currentUser = authData.user;
        if (!currentUser) { navigate("/login", { replace: true }); return; }
        const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
        if (profileError) throw profileError;
        const { data: accessRows, error: accessError } = await supabase.from("company_user_access").select("*").eq("user_id", currentUser.id).eq("status", "Active").limit(1);
        if (accessError && accessError.code !== "42P01") throw accessError;
        const { data: caRows, error: caError } = await supabase.from("ca_company_assignments").select("*").eq("ca_user_id", currentUser.id).eq("status", "Active").limit(1);
        if (caError && caError.code !== "42P01") throw caError;
        const { data: ownedCompanies, error: ownerError } = await supabase.from("companies").select("id,company_name").eq("owner_user_id", currentUser.id).limit(1);
        if (ownerError) throw ownerError;
        if (!active) return;
        setUser(currentUser);
        setProfile(profileData || {});
        setAccess(accessRows?.[0] || caRows?.[0] || null);
        setIsOwner(Boolean(ownedCompanies?.length));
        setIsCa(Boolean(caRows?.length));
      } catch (loadError) { if (active) setError(loadError.message || "Unable to load your profile."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [navigate]);

  const metadata = user?.user_metadata || {};
  const displayName = profile.full_name || metadata.full_name || user?.email?.split("@")[0] || "User";
  const permissions = access?.permissions || {};
  const role = isOwner ? "Company Owner / Administrator" : isCa ? "Chartered Accountant" : access?.role || metadata.role || "Account User";
  const permissionRows = isOwner
    ? ACCESS_MODULES.map((module) => ({ ...module, read: true, write: true }))
    : isCa
      ? [{ key: "ca", label: "Assigned company access", read: true, write: access?.access_level === "read_write" }]
      : ACCESS_MODULES.filter((module) => permissions[module.key]?.read || permissions[module.key]?.write).map((module) => ({ ...module, read: Boolean(permissions[module.key]?.read), write: Boolean(permissions[module.key]?.write) }));

  if (loading) return <main className="profile-view-page"><div className="profile-view-loading">Loading your profile...</div></main>;
  return <main className="profile-view-page">
    <div className="profile-view-top"><button type="button" onClick={() => navigate(-1)}><FiArrowLeft /> Back</button><button type="button" className="profile-edit-action" onClick={() => navigate("/app/user-profile")}><FiEdit2 /> Edit Profile</button></div>
    <header className="profile-view-heading"><span className="profile-view-avatar">{displayName.split(" ").filter(Boolean).slice(0,2).map((part) => part[0]?.toUpperCase()).join("") || <FiUser />}</span><div><span className="profile-view-eyebrow">MY ACCOUNT</span><h1>{displayName}</h1><p>{user?.email || ""}</p></div></header>
    {error && <div className="profile-view-error">{error}</div>}
    <section className="profile-view-card"><h2><FiUser /> Personal Details</h2><div className="profile-view-grid">
      <div><small>Full Name</small><strong>{valueOrFallback(profile.full_name || metadata.full_name)}</strong></div>
      <div><small>Username</small><strong>{valueOrFallback(user?.email?.split("@")[0])}</strong></div>
      <div><small>Email Address</small><strong>{valueOrFallback(user?.email)}</strong></div>
      <div><small>Mobile Number</small><strong>{valueOrFallback(profile.mobile || metadata.mobile)}</strong></div>
      <div><small>Department</small><strong>{valueOrFallback(profile.department || metadata.department)}</strong></div>
      <div><small>Designation</small><strong>{valueOrFallback(profile.designation || metadata.designation)}</strong></div>
      <div><small>Business Name</small><strong>{valueOrFallback(profile.business_name || metadata.business_name)}</strong></div>
      <div><small>Account Created</small><strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Not available"}</strong></div>
    </div></section>
    <section className="profile-view-card"><h2><FiBriefcase /> Account & Role</h2><div className="profile-view-grid">
      <div><small>Account Type / Role</small><strong>{role}</strong></div>
      <div><small>Account Status</small><strong className="profile-status-active">Active session</strong></div>
      <div><small>Department</small><strong>{valueOrFallback(profile.department || metadata.department)}</strong></div>
      <div><small>Designation</small><strong>{valueOrFallback(profile.designation || metadata.designation)}</strong></div>
    </div></section>
    <section className="profile-view-card"><h2><FiShield /> Access Rights</h2><p className="profile-view-help">These are the module permissions currently recorded for your account.</p>
      {permissionRows.length ? <div className="profile-permissions"><div className="profile-permission-head"><span>Module</span><span>View</span><span>Create / Edit</span></div>{permissionRows.map((item) => <div className="profile-permission-row" key={item.key}><strong>{item.label}</strong><span>{item.read ? "Allowed" : "—"}</span><span>{item.write ? "Allowed" : "—"}</span></div>)}</div> : <p className="profile-view-empty">No module-specific permissions are recorded for this account.</p>}
    </section>
  </main>;
}