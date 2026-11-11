import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [loading, setLoading] = useState(true);

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

            const { data, error } = await supabase
                .from("companies")
                .select("*")
                .eq("owner_user_id", user.id)
                .order("company_name");

            if (error) throw error;

            const userCompanies = data || [];
            setCompanies(userCompanies);

            const savedCompanyId = localStorage.getItem("currentCompanyId");
            const savedCompany = userCompanies.find(
                company => company.id === savedCompanyId
            );

            setCurrentCompany(savedCompany || null);

            if (!savedCompany) {
                localStorage.removeItem("currentCompanyId");
            }
        } catch (error) {
            console.error("Error loading companies:", error);
            setCompanies([]);
            setCurrentCompany(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load once on startup and again whenever authentication changes.
        loadCompanies();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event) => {
            if (
                event === "SIGNED_IN" ||
                event === "SIGNED_OUT" ||
                event === "USER_UPDATED"
            ) {
                // Run the query after Supabase finishes its auth-state callback
                // and releases its internal auth lock.
                setTimeout(() => {
                    loadCompanies();
                }, 0);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const changeCompany = (companyId) => {
        const selectedCompany = companies.find(
            company => company.id === companyId
        );

        if (!selectedCompany) return;

        setCurrentCompany(selectedCompany);
        localStorage.setItem("currentCompanyId", selectedCompany.id);
    };

    return (
        <CompanyContext.Provider
            value={{
                companies,
                currentCompany,
                currentCompanyId: currentCompany?.id || null,
                changeCompany,
                loading,
                reloadCompanies: loadCompanies
            }}
        >
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);

    if (!context) {
        throw new Error(
            "useCompany must be used inside CompanyProvider"
        );
    }

    return context;
}
