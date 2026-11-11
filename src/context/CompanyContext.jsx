import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "TOKEN_REFRESHED"].includes(event)) return;
            // Defer the reload until the auth event callback has completed.
            setTimeout(() => loadCompanies(), 0);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                setCompanies([]);
                setCurrentCompany(null);
                localStorage.removeItem("currentCompanyId");
                return;
            }

            const [ownedResult, caResult, userResult] = await Promise.all([
                supabase.from("companies").select("*")
                    .eq("owner_user_id", user.id).order("company_name"),
                supabase.from("ca_company_assignments")
                    .select("company_id, access_level, company:companies(*)")
                    .eq("ca_user_id", user.id).eq("status", "Active"),
                supabase.from("company_user_access")
                    .select("company_id, permissions, company:companies(*)")
                    .eq("user_id", user.id).eq("status", "Active")
            ]);

            if (ownedResult.error) throw ownedResult.error;
            if (caResult.error && caResult.error.code !== "42P01") throw caResult.error;
            if (userResult.error && userResult.error.code !== "42P01") throw userResult.error;

            const combined = new Map();
            (ownedResult.data || []).forEach(company => combined.set(company.id, company));
            (caResult.data || []).forEach(row => {
                if (row.company) combined.set(row.company.id, row.company);
            });
            (userResult.data || []).forEach(row => {
                if (row.company) combined.set(row.company.id, row.company);
            });

            const availableCompanies = Array.from(combined.values())
                .sort((a, b) => (a.company_name || "").localeCompare(b.company_name || ""));
            setCompanies(availableCompanies);

            const savedCompanyId = localStorage.getItem("currentCompanyId");
            const savedCompany = availableCompanies.find(company => company.id === savedCompanyId);
            const nextCompany = savedCompany || availableCompanies[0] || null;
            setCurrentCompany(nextCompany);

            if (nextCompany) {
                localStorage.setItem("currentCompanyId", nextCompany.id);
            } else {
                localStorage.removeItem("currentCompanyId");
            }
        } catch (error) {
            console.error("Error loading accessible companies:", error);
            setCompanies([]);
            setCurrentCompany(null);
        } finally {
            setLoading(false);
        }
    };

    const changeCompany = (companyId) => {
        const selectedCompany = companies.find(company => company.id === companyId);
        if (!selectedCompany) return;
        setCurrentCompany(selectedCompany);
        localStorage.setItem("currentCompanyId", selectedCompany.id);
    };

    return (
        <CompanyContext.Provider value={{
            companies,
            currentCompany,
            currentCompanyId: currentCompany?.id || null,
            changeCompany,
            loading,
            reloadCompanies: loadCompanies
        }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error("useCompany must be used inside CompanyProvider");
    }
    return context;
}
