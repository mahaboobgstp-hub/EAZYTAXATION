import { supabase } from "../supabase/supabaseClient";

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

  if (error) {

    throw error;

  }

  return data;

}
