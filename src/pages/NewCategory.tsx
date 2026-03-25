import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createCategory } from "@/lib/supabase-helpers";
import { toast } from "sonner";
import { useInstance } from "@/context/InstanceContext";

export default function NewCategory() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { instanceId } = useInstance();

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Bitte gib einen Kategorienamen ein.");
      return;
    }

    if (!instanceId) {
      toast.error("Keine Instanz gefunden.");
      return;
    }

    try {
      setLoading(true);

      await createCategory({
        name: name.trim(),
        instance_id: instanceId,
      });

      toast.success("Kategorie wurde erstellt.");
      navigate("/categories");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Speichern der Kategorie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-28">

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6 text-muted-foreground" />
          </button>

          <h1 className="text-xl font-semibold tracking-tight ml-2">
            Neue Kategorie
          </h1>
        </div>
      </header>

      {/* Inhalt */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        <div className="space-y-2">
          <label className="text-sm font-medium">Kategoriename</label>
          <input
            type="text"
            placeholder="z.B. Nudeln, Getränke, Gemüse..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 rounded-2xl bg-card/80 backdrop-blur border border-border/60 px-4 text-base shadow-sm outline-none"
          />
        </div>

        <button
  onClick={handleSave}
  disabled={loading}
  className="w-full h-14 rounded-2xl bg-blue-100 border border-blue-200 text-blue-600 font-semibold text-base shadow-sm hover:bg-blue-200 active:scale-[0.98] transition-all disabled:opacity-50"
>
  {loading ? "Speichere..." : "Kategorie speichern"}
</button>

      </main>
    </div>
  );
}
