import { useEffect, useState } from "react";
import { useInstance } from "@/context/InstanceContext";
import { getUserInstances, leaveInstance } from "@/lib/instance-helpers";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Copy,
  CheckCircle2,
  LogOut,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { instanceId, setInstanceId } = useInstance();
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadInstances();
  }, []);

  async function loadInstances() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const data = await getUserInstances(user.id);
    setInstances(data || []);
    setLoading(false);
  }

  async function handleSwitch(id: string) {
    setInstanceId(id);
    toast.success("Instanz gewechselt");
    navigate("/articles");
  }

  async function handleLeave(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await leaveInstance(user.id, id);

    toast.success("Instanz verlassen");

    if (instanceId === id) {
      setInstanceId(null);
      navigate("/instance/join");
    } else {
      loadInstances();
    }
  }

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code kopiert");
    } catch {
      toast.error("Fehler beim Kopieren");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Lade Einstellungen...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-6 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Einstellungen
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* INSTANZEN */}
        <div className="rounded-3xl border border-border bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Deine Instanzen ({instances.length})
          </h2>

          {instances.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              Keine Instanzen gefunden
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((item) => {
                const isActive = item.instance_id === instanceId;

                return (
                  <div
                    key={item.instance_id}
                    className={`rounded-3xl border p-5 shadow-sm transition ${
                      isActive
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-border"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {item.instances.name}
                          </p>

                          {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Aktiv
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          Code: {item.instances.code}
                        </p>
                      </div>

                      {!isActive && (
                        <button
                          onClick={() =>
                            handleSwitch(item.instance_id)
                          }
                          className="h-11 px-4 rounded-2xl bg-blue-100 border border-blue-200 text-blue-600 font-semibold text-sm shadow-sm hover:bg-blue-200 active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Wechseln
                        </button>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-between mt-5 pt-4 border-t border-border/60">
                      <button
                        onClick={() =>
                          handleCopyCode(item.instances.code)
                        }
                        className="h-11 px-4 rounded-2xl bg-white border border-border text-sm shadow-sm hover:bg-muted/30 active:scale-[0.98] flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Code kopieren
                      </button>

                      <button
                        onClick={() =>
                          handleLeave(item.instance_id)
                        }
                        className="h-11 px-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-semibold text-sm shadow-sm hover:bg-red-100 active:scale-[0.98] flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Verlassen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}