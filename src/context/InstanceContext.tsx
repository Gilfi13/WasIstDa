import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type InstanceContextType = {
  instanceId: string | null;
  setInstanceId: (id: string | null) => void;
};

const InstanceContext = createContext<InstanceContextType>({
  instanceId: null,
  setInstanceId: () => {},
});

function readStoredInstanceId(): string | null {
  try {
    return localStorage.getItem("instanceId");
  } catch {
    return null;
  }
}

export function InstanceProvider({ children }: { children: React.ReactNode }) {
  const [instanceId, setInstanceIdState] = useState<string | null>(
    readStoredInstanceId
  );

  // Wrapper: speichert zusätzlich in localStorage
  function setInstanceId(id: string | null) {
    setInstanceIdState(id);

    if (id) {
      localStorage.setItem("instanceId", id);
    } else {
      localStorage.removeItem("instanceId");
    }
  }

  // Beim Start: Instanz aus localStorage ODER Supabase laden
  useEffect(() => {
    async function loadInstance() {
      // 1) Zuerst localStorage prüfen
      const stored = localStorage.getItem("instanceId");
      if (stored) {
        setInstanceIdState(stored);
        return;
      }

      // 2) Wenn nicht vorhanden → Supabase prüfen
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("user_instances")
        .select("instance_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.instance_id) {
        setInstanceId(data.instance_id);
      }
    }

    loadInstance();
  }, []);

  return (
    <InstanceContext.Provider value={{ instanceId, setInstanceId }}>
      {children}
    </InstanceContext.Provider>
  );
}

export function useInstance() {
  return useContext(InstanceContext);
}
