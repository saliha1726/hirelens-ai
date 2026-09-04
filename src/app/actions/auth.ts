"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Please+enter+your+email+and+password");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password) {
    redirect("/signup?error=Please+fill+in+all+fields");
  }

  if (password !== confirmPassword) {
    redirect("/signup?error=Passwords+do+not+match");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password+must+be+at+least+8+characters");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirelens-ai-black.vercel.app"}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?success=Check+your+email+to+confirm+your+account");
}

export async function googleSignInAction() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirelens-ai-black.vercel.app"}/auth/callback`,
    },
  });

  if (error || !data?.url) {
    redirect("/login?error=Could+not+sign+in+with+Google");
  }

  redirect(data.url);
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?error=Please+enter+your+email+address");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirelens-ai-black.vercel.app"}/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?success=If+an+account+exists+with+that+email,+you+will+receive+a+password+reset+link");
}

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    redirect("/reset-password?error=Please+fill+in+all+fields");
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?error=Passwords+do+not+match");
  }

  if (password.length < 8) {
    redirect("/reset-password?error=Password+must+be+at+least+8+characters");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?success=Password+updated+successfully");
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
