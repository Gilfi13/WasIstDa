import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as LucideIconsRaw from "lucide-react/dist/esm/icons";
import { ScanLine } from "lucide-react";
import {
  fetchCategories,
  createArticle,
  fetchArticles,
} from "@/lib/supabase-helpers";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useInstance } from "@/context/InstanceContext";
import { BarcodeScanner } from "@/components/BarcodeScanner";

const LucideIcons = LucideIconsRaw as Record<string, React.FC<any>>;

type IconKey = string;

type Category = {
  id: string;
  name: string;
};

function ConfirmNoBarcodeModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Artikel ohne Barcode anlegen?
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Du kannst jederzeit über die Artikeleinstellungen einen Barcode
            hinterlegen.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-border bg-white text-gray-700 font-medium shadow-sm active:scale-[0.98]"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-12 rounded-2xl bg-blue-100 border border-blue-200 text-blue-600 font-semibold shadow-sm active:scale-[0.98]"
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>
  );
}

function IconPickerSheet({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (iconName: string) => void;
}) {
  const [search, setSearch] = useState("");

  const ICON_LIST: IconKey[] = Object.keys(LucideIcons) as IconKey[];

  const filteredIcons = useMemo(() => {
    const term = search.toLowerCase();
    return ICON_LIST.filter((i) => i.toLowerCase().includes(term));
  }, [search, ICON_LIST]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Icon auswählen</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground">
            Schließen
          </button>
        </div>

        <Input
          placeholder="Icon suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white shadow-sm mb-4"
        />

        <div className="grid grid-cols-5 gap-3 max-h-72 overflow-y-auto">
          {filteredIcons.map((iconName) => {
            const Icon = LucideIcons[iconName] as React.FC<any>;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onChange(iconName);
                  onClose();
                }}
                className="aspect-square rounded-xl bg-white border border-border flex flex-col items-center justify-center gap-1"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] leading-tight text-center break-words line-clamp-2">
                  {iconName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function NewArticle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { instanceId } = useInstance();

  const [article, setArticle] = useState<{
    name: string;
    category_id: string | null;
    minimum_stock: number;
    location: string;
    barcode: string;
    icon: IconKey | null;
  }>({
    name: "",
    category_id: null,
    minimum_stock: 1,
    location: "",
    barcode: "",
    icon: null,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNoBarcodeModalOpen, setIsNoBarcodeModalOpen] = useState(false);
  const barcodeFromQuery = searchParams.get("barcode") || "";

  useEffect(() => {
    if (!barcodeFromQuery) return;
    setArticle((prev) => ({ ...prev, barcode: barcodeFromQuery }));
  }, [barcodeFromQuery]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories", instanceId],
    queryFn: () => fetchCategories(instanceId!),
    enabled: !!instanceId,
  });

  const selectedCategory = categories.find(
    (c) => c.id === article.category_id
  );

  const IconComp = useMemo(() => {
    if (!article.icon) return null;
    const Icon = LucideIcons[article.icon] as React.FC<any> | undefined;
    return Icon ?? null;
  }, [article.icon]);

  const saveArticle = async () => {
    if (!instanceId) {
      toast.error("Keine Instanz ausgewählt.");
      return;
    }

    if (!article.name.trim()) {
      toast.error("Bitte gib einen Namen ein");
      return;
    }

    try {
      const existingArticles = await fetchArticles(instanceId);
      const nameExists = existingArticles.some(
        (item: any) =>
          item.name.trim().toLowerCase() === article.name.trim().toLowerCase()
      );

      if (nameExists) {
        toast.error("Ein Artikel mit diesem Namen existiert bereits.");
        return;
      }
    } catch {
      toast.error("Fehler beim Überprüfen des Artikelnamens.");
      return;
    }

    try {
      await createArticle({
        barcode: article.barcode.trim() ? article.barcode.trim() : null,
        name: article.name.trim(),
        category_id: article.category_id,
        current_stock: 0,
        minimum_stock: Number(article.minimum_stock),
        location: article.location.trim() ? article.location.trim() : null,
        icon: article.icon ?? null,
        instance_id: instanceId,
      });

      toast.success("Artikel wurde angelegt");
      navigate("/articles");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Anlegen");
    }
  };

  const handleSave = async () => {
    if (!article.name.trim()) {
      toast.error("Bitte gib einen Namen ein");
      return;
    }

    if (!article.barcode.trim()) {
      setIsNoBarcodeModalOpen(true);
      return;
    }

    await saveArticle();
  };

  return (
    <>
      <div className="min-h-screen p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Artikel anlegen</h1>

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-border bg-white shadow-sm"
          >
            ← Zurück
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setIsIconPickerOpen(true)}
            className="w-20 h-20 rounded-full bg-white shadow-md border border-border flex items-center justify-center"
          >
            {IconComp ? (
              <IconComp className="w-10 h-10 text-muted-foreground" />
            ) : (
              <span className="text-xs text-muted-foreground">Icon wählen</span>
            )}
          </button>
        </div>

        <IconPickerSheet
          open={isIconPickerOpen}
          onClose={() => setIsIconPickerOpen(false)}
          value={article.icon ?? ""}
          onChange={(iconName) =>
            setArticle({ ...article, icon: iconName as IconKey })
          }
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label>Name</label>
            <input
              className="w-full bg-white border border-border rounded-2xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Artikelname"
              value={article.name}
              onChange={(e) =>
                setArticle({ ...article, name: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label>Barcode</label>

            <div className="flex gap-3">
              <input
                className="w-full bg-white border border-border rounded-2xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Barcode eingeben oder scannen"
                value={article.barcode}
                onChange={(e) =>
                  setArticle({ ...article, barcode: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-4 rounded-2xl bg-blue-100 border border-blue-200 text-blue-600 font-semibold text-sm shadow-sm active:scale-[0.98] flex items-center gap-2"
              >
                <ScanLine className="w-4 h-4" />
                Scannen
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1 relative">
            <label>Kategorie</label>

            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-white border border-border rounded-2xl px-4 py-3 shadow-sm flex justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {selectedCategory ? selectedCategory.name : "– Keine –"}
              <span>▾</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-lg z-40 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-muted/20"
                  onClick={() => {
                    setArticle({ ...article, category_id: null });
                    setIsDropdownOpen(false);
                  }}
                >
                  – Keine –
                </button>

                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    className="w-full px-4 py-3 text-left hover:bg-muted/20"
                    onClick={() => {
                      setArticle({ ...article, category_id: cat.id });
                      setIsDropdownOpen(false);
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label>Mindestbestand</label>
            <input
              type="number"
              min={1}
              className="w-full bg-white border border-border rounded-2xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={article.minimum_stock}
              onChange={(e) =>
                setArticle({
                  ...article,
                  minimum_stock: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label>Lagerort</label>
            <input
              className="w-full bg-white border border-border rounded-2xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="z. B. Regal 1/4"
              value={article.location}
              onChange={(e) =>
                setArticle({ ...article, location: e.target.value })
              }
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full h-16 rounded-3xl bg-blue-100 border border-blue-200 text-blue-600 font-semibold text-base shadow-sm active:scale-[0.98]"
        >
          + Artikel anlegen
        </button>
      </div>

      {isScannerOpen && (
        <BarcodeScanner
          onScan={(code: string) => {
            setArticle((prev) => ({ ...prev, barcode: code }));
            setIsScannerOpen(false);
            toast.success("Barcode erfolgreich gescannt");
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      <ConfirmNoBarcodeModal
        open={isNoBarcodeModalOpen}
        onClose={() => setIsNoBarcodeModalOpen(false)}
        onConfirm={async () => {
          setIsNoBarcodeModalOpen(false);
          await saveArticle();
        }}
      />
    </>
  );
}