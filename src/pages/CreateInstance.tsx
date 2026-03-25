import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInstance, joinInstance } from "@/lib/instance-helpers";
import { useInstance } from "@/context/InstanceContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, Plus } from "lucide-react";

export default function CreateInstance() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const { setInstanceId } = useInstance();

  async function handleCreate() {
    try {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("Kein Benutzer angemeldet.");
        return;
      }

      const instance = await createInstance();

      await joinInstance(user.id, instance.id);

      setInstanceId(instance.id);

      navigate("/articles");
    } catch (err: any) {
      setErrorMsg(err.message || "Fehler beim Erstellen der Instanz.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md bg-card shadow-2xl rounded-3xl p-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10">
            <Package className="h-10 w-10 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Neue Instanz
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Es wird automatisch ein Code erstellt, den du teilen kannst
            </p>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            {errorMsg}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-blue-100 border border-blue-200 text-blue-600 font-semibold text-base shadow-sm hover:bg-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:bg-blue-100 flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          {loading ? "Erstelle Instanz..." : "Instanz erstellen"}
        </button>

        {/* Zurück */}
        <button
          onClick={() => navigate("/instance")}
          className="w-full text-sm text-muted-foreground hover:underline"
        >
          Zurück
        </button>

      </div>
    </div>
  );
}