import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchArticles, fetchCategories, deleteCategory } from "@/lib/supabase-helpers";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react/dist/esm/icons";
import { toast } from "sonner";
import { useState } from "react";
import { useInstance } from "@/context/InstanceContext";

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { instanceId } = useInstance();

  const [showConfirm, setShowConfirm] = useState(false);

  // --- Kategorien laden ---
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", instanceId],
    queryFn: ({ queryKey }) => {
      const [, instanceId] = queryKey;
      return fetchCategories(instanceId as string);
    },
    enabled: !!instanceId,
  });

  // --- Artikel laden ---
  const { data: articles = [] } = useQuery({
    queryKey: ["articles", instanceId],
    queryFn: ({ queryKey }) => {
      const [, instanceId] = queryKey;
      return fetchArticles(instanceId as string);
    },
    enabled: !!instanceId,
  });

  // Kategorie finden
  const category = categories.find((c: any) => c.id === id);

  // Artikel der Kategorie filtern
  const filteredArticles = articles.filter((a: any) => a.category_id === id);

  async function handleDelete() {
    try {
      await deleteCategory(id!, instanceId!);
      toast.success("Kategorie wurde gelöscht.");
      navigate("/categories");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen der Kategorie.");
    }
  }

  return (
    <div className="min-h-screen pb-28">

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">

          {/* Zurück + Titel */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6 text-muted-foreground" />
            </button>

            <h1 className="text-xl font-semibold tracking-tight ml-2">
              {category?.name}
            </h1>
          </div>

          {/* Löschen */}
          <button
            onClick={() => setShowConfirm(true)}
            className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
          >
            <Trash2 className="h-5 w-5" />
          </button>

        </div>
      </header>

      {/* Artikel der Kategorie */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        {filteredArticles.length === 0 ? (
          <p className="text-muted-foreground">
            Keine Artikel in dieser Kategorie.
          </p>
        ) : (
          filteredArticles.map((a: any) => {
            const Icon = a.icon ? (LucideIcons as any)[a.icon] : null;

            return (
              <div
                key={a.id}
                onClick={() => navigate(`/article/${a.id}`)}
                className="p-5 rounded-3xl bg-white border border-border shadow-sm cursor-pointer active:scale-[0.98] flex items-center gap-4"
              >
                {/* ICON */}
                <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center">
                  {Icon ? (
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <span className="text-xs text-muted-foreground">–</span>
                  )}
                </div>

                {/* TEXT */}
                <div className="flex flex-col">
                  <p className="font-semibold">{a.name}</p>

                  <p className="text-sm text-muted-foreground">
                    Bestand: {a.current_stock}
                  </p>

                  {a.location && (
                    <p className="text-sm text-muted-foreground">
                      Lagerort: {a.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      <BottomNav />

      {/* --- MODAL --- */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-border/60 w-[90%] max-w-sm space-y-4">

            <h2 className="text-lg font-semibold">Kategorie löschen?</h2>
            <p className="text-muted-foreground text-sm">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-12 rounded-2xl bg-muted text-foreground font-medium"
              >
                Abbrechen
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 h-12 rounded-2xl bg-red-600 text-white font-medium shadow active:scale-[0.98]"
              >
                Löschen
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
