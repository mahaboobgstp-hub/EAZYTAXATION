import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();
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
                return;
            }

            const { data, error } = await supabase
                .from("companies")
                .select("*")
                .eq("owner_user_id", user.id)
                .order("company_name");

            if (error) throw error;

            setCompanies(data || []);

            const savedCompanyId = localStorage.getItem("currentCompanyId");

            const savedCompany = (data || []).find(
                company => company.id === savedCompanyId
            );

            if (savedCompany) {
                setCurrentCompany(savedCompany);
            } if (savedCompany) {
    setCurrentCompany(savedCompany);
} else {
    setCurrentCompany(null);
    localStorage.removeItem("currentCompanyId");
} else {
                setCurrentCompany(null);
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
