import { useState, useCallback, useEffect, useRef } from "react";
import { GetVetProfile } from "../api/GetApi";
import { PutUpdateVetProfile } from "../api/PutApi";
import type { VetProfile, PayloadUpdateVetProfile } from "../types/type";

interface UseUserProfileReturn {
  profile: VetProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (payload: PayloadUpdateVetProfile) => Promise<boolean>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<VetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetVetProfile();
      if (typeof data === "string") {
        setError(data || "ดึงข้อมูลไม่สำเร็จ");
        setProfile(null);
      } else {
        setProfile(data as VetProfile);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      );
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (payload: PayloadUpdateVetProfile): Promise<boolean> => {
      try {
        setSaving(true);
        const result = await PutUpdateVetProfile(payload);
        if (typeof result === "string") {
          // Error string returned by the API layer
          throw new Error(result);
        }
        // Optimistically apply changes to profile state
        setProfile((prev) => (prev ? { ...prev, ...payload } : prev));
        return true;
      } catch (err) {
        throw err instanceof Error ? err : new Error("อัปเดตข้อมูลไม่สำเร็จ");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    saving,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
