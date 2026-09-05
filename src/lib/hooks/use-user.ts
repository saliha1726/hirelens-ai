"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (disposed) return;
        setUser(firebaseUser);
        setLoading(false);
      });
      return () => {
        disposed = true;
        unsubscribe();
      };
    } catch {
      setLoading(false);
      return;
    }
  }, []);

  return { user, loading };
}
