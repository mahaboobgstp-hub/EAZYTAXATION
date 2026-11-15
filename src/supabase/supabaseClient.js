import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Android WebView storage can be less reliable across process recreation on
// some devices. Store native Supabase sessions in Android SharedPreferences
// through Capacitor Preferences. Migrate the previous localStorage session
// once so existing signed-in users do not have to log in again after upgrade.
const nativeAuthStorage = {
  async getItem(key) {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null) return value;

      const legacyValue = window.localStorage.getItem(key);
      if (legacyValue !== null) {
        await Preferences.set({ key, value: legacyValue });
        window.localStorage.removeItem(key);
      }
      return legacyValue;
    } catch (error) {
      console.warn("Native auth storage read failed; using WebView storage fallback.", error);
      return window.localStorage.getItem(key);
    }
  },
  async setItem(key, value) {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.warn("Native auth storage write failed; using WebView storage fallback.", error);
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key) {
    try {
      await Preferences.remove({ key });
    } finally {
      window.localStorage.removeItem(key);
    }
  }
};

const authStorage = Capacitor.isNativePlatform()
  ? nativeAuthStorage
  : window.localStorage;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: authStorage,
      storageKey: "syd-billing-accounting-auth"
    }
  }
);
