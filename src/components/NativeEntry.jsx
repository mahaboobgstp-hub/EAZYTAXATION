import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";

// A native WebView can be recreated when Android reclaims the app process.
// Restore the persisted Supabase session before choosing the first screen.
export default function NativeEntry() {
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" && session) setDestination("/app");
      if (event === "SIGNED_OUT") setDestination("/login");
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        setDestination(!error && data.session ? "/app" : "/login");
      })
      .catch(() => {
        if (active) setDestination("/login");
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!destination) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#101b35", color: "#fff", fontFamily: "Arial, sans-serif" }}>
        Restoring your session...
      </div>
    );
  }

  return <Navigate to={destination} replace />;
}
