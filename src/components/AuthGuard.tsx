"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthenticated(true);
      } else {
        router.push("/auth/login");
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
