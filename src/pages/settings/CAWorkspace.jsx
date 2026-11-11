import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiArrowRight, FiEye, FiEdit3 } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import "../../css/settings/CAWorkspace.css";

function CAWorkspace() {
  const navigate = useNavigate();
  const { changeCompany } = useCompany();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error("Please sign in to view assigned companies.");
        const { data, error: queryError } = await supabase
          .from("ca_company_assignments")
          .select("id, company_id, ca_name, ca_email, access_level, company:companies(*)")
          .eq("ca_user_id", authData.user.id)
          .eq("status", "Active")
          .order("created_at", { ascending: false });
        if (queryError) throw queryError;
        if (active) setRows((data || []).filter((row) => row.company));
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const openCompany = (companyId) => {
    changeCompany(companyId);
    navigate("/app");
  };

  return <div className="caw-page">
    <div className="caw-heading"><span className="caw-icon"><FiBriefcase /></span><div><h1>Client Assignments</h1><p>Review the companies that have assigned you as their Chartered Accountant.</p></div></div>
    {error && <div className="caw-error">{error}</div>}
    {loading ? <div className="caw-empty">Loading your assigned companies...</div> : rows.length === 0 ? <div className="caw-empty">No companies have assigned you as their Chartered Accountant yet.</div> : <div className="caw-grid">
      {rows.map((row) => <article className="caw-card" key={row.id}>
        <div className="caw-card-top"><span className="caw-company-icon"><FiBriefcase /></span><span className={`caw-access ${row.access_level === "read_write" ? "write" : "read"}`}>{row.access_level === "read_write" ? <><FiEdit3 /> Read & Write</> : <><FiEye /> Read Only</>}</span></div>
        <h2>{row.company.company_name || "Company"}</h2>
        <p>{row.company.gstin || row.company.gst_number || "Company accounting workspace"}</p>
        <button onClick={() => openCompany(row.company_id)}>Open Company <FiArrowRight /></button>
      </article>)}
    </div>}
  </div>;
}
export default CAWorkspace;
