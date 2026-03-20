"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
};

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      if (authLoading) return;

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, bio, role, avatar_url, created_at")
        .eq("id", user.id)
        .single();

      if (error) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(data as Profile);
      setLoading(false);
    };

    getProfile();
  }, [user, authLoading]);

  return { profile, loading, user };
}