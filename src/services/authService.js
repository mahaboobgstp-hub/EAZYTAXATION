
import { supabase } from "../supabase/supabaseClient";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/* ===========================================
   REGISTER USER
=========================================== */

export async function registerUser({
    full_name,
    business_name,
    email,
    password
}) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name,
                business_name
            }
        }
    });

    if (error) throw error;

    if (data.user) {
        const { error: profileError } =
            await supabase
                .from("profiles")
                .insert([{
                    id: data.user.id,
                    full_name,
                    business_name
                }]);

        if (profileError) {
            throw profileError;
        }
    }

    return data;
}

/* ===========================================
   LOGIN USER
=========================================== */

export async function loginUser(email, password) {
    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password
        });

    if (error) throw error;

    return data;
}

/* ===========================================
   LOGOUT
=========================================== */

export async function logoutUser() {
    const { error } =
        await supabase.auth.signOut();

    if (error) throw error;
}

/* ===========================================
   RESET PASSWORD
=========================================== */

export async function resetPassword(email) {
    const { data, error } =
        await supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    window.location.origin + "/login"
            }
        );

    if (error) throw error;

    return data;
}

/* ===========================================
   CURRENT USER
=========================================== */

export async function getCurrentUser() {
    const { data, error } =
        await supabase.auth.getUser();

    if (error) throw error;

    return data.user;
}

/* ===========================================
   CURRENT SESSION
=========================================== */

export async function getCurrentSession() {
    const { data, error } =
        await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
}

/* ===========================================
   UPDATE PASSWORD
=========================================== */

export async function updatePassword(password) {
    const { data, error } =
        await supabase.auth.updateUser({
            password
        });

    if (error) throw error;

    return data;
}

/* ===========================================
   UPDATE USER METADATA
=========================================== */

export async function updateUserProfile({
    full_name,
    business_name
}) {
    const { data, error } =
        await supabase.auth.updateUser({
            data: {
                full_name,
                business_name
            }
        });

    if (error) throw error;

    return data;
}

/* ===========================================
   GOOGLE LOGIN
   ANDROID + WEB
=========================================== */

export async function signInWithGoogle() {

    const isAndroid = Capacitor.isNativePlatform();

    const redirectUrl = isAndroid
        ? "com.eazytaxation.mobile://auth/callback"
        : window.location.origin + "/app/companies";

    const { data, error } =
        await supabase.auth.signInWithOAuth({

            provider: "google",

            options: {

                redirectTo: redirectUrl,

                skipBrowserRedirect: isAndroid

            }

        });

    if (error) {
        throw error;
    }

    // ANDROID: Open secure system browser
    if (isAndroid) {

        if (!data?.url) {
            throw new Error(
                "Google authentication URL was not generated."
            );
        }

        await Browser.open({
            url: data.url
        });

    }

    return data;
}
