"use client";

import { useEffect, useState, useRef } from "react";
import type { AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    let disposed = false;

    try {
      supabaseRef.current = getSupabaseBrowserClient();
    } catch {
      setLoading(false);
      return;
    }

    const supabase = supabaseRef.current;
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getUser().then((result: { data: { user: User | null } }) => {
      if (disposed) return;
      setUser(result.data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (disposed) return;
      setUser(session?.user ?? null);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
