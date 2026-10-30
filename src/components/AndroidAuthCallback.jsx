
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../supabase/supabaseClient";

function AndroidAuthCallback() {
    const navigate = useNavigate();
    const processedUrl = useRef(null);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        let mounted = true;
        let listenerHandle;

        async function handleAuthCallback(url) {
            if (!mounted || !url) return;

            if (!url.startsWith(
                "com.eazytaxation.mobile://auth/callback"
            )) {
                return;
            }

            if (processedUrl.current === url) return;

            processedUrl.current = url;

            try {
                const callbackUrl = new URL(url);

                const authCode =
                    callbackUrl.searchParams.get("code");

                const authError =
                    callbackUrl.searchParams.get("error_description") ||
                    callbackUrl.searchParams.get("error");

                if (authError) {
                    throw new Error(authError);
                }

                if (!authCode) {
                    throw new Error(
                        "Authentication code was not received."
                    );
                }

                const { data, error } =
                    await supabase.auth.exchangeCodeForSession(
                        authCode
                    );

                if (error) throw error;

                if (!data.session) {
                    throw new Error(
                        "Unable to establish your login session."
                    );
                }

                await Browser.close().catch(() => {});

                if (mounted) {
                    navigate("/app/companies", {
                        replace: true
                    });
                }

            } catch (error) {
                await Browser.close().catch(() => {});

                if (mounted) {
                    alert(
                        "Google login failed: " + error.message
                    );

                    navigate("/login", {
                        replace: true
                    });
                }
            }
        }

        async function setupListener() {
            listenerHandle =
                await CapacitorApp.addListener(
                    "appUrlOpen",
                    (event) => {
                        handleAuthCallback(event.url);
                    }
                );

            const launchUrl =
                await CapacitorApp.getLaunchUrl();

            if (launchUrl?.url) {
                await handleAuthCallback(launchUrl.url);
            }
        }

        setupListener().catch((error) => {
            if (mounted) {
                console.error(
                    "Android authentication listener error:",
                    error
                );
            }
        });

        return () => {
            mounted = false;

            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, [navigate]);

    return null;
}

export default AndroidAuthCallback;
