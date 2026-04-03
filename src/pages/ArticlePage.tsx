import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import * as LucideIcons from "lucide-react";
import { Trash2 } from "lucide-react";

import { deleteArticle } from "@/lib/supabase-helpers";
import { toast } from "sonner";
import { useInstance } from "@/context/InstanceContext";


// --- Artikel-Typ ---
type Article = {
  id: string;
  barcode: string;
  name: string;
  category_id: string | null;
  current_stock: number;
  minimum_stock: number;
  location?: string | null;
  icon?: string | null;
};

// --- Icon Typ ---
type IconKey = keyof typeof LucideIcons;

// --- Gültige Icons ---
const ICON_LIST: IconKey[] = [
  "Apple", "Archive", "ArchiveRestore", "Armchair", "Axe", "Baby", "BadgeCheck",
 "Banana", "Battery", "BatteryCharging", "Beef", "Beer", "Bell", "Bike",
  "Book", "BookOpen", "Box", "Boxes", "Briefcase", "Brush", "Bug", "Cake",
  "Calculator", "Calendar", "Camera", "Car", "Carrot", "ChartBar", "ChartPie",
  "Check", "CheckCircle", "Clipboard", "ClipboardCheck", "ClipboardList",
  "Clock", "Cloud", "Coffee", "Cookie", "Copy", "Cpu", "CreditCard",
  "Croissant", "CupSoda", "Database", "Diamond", "Dna", "Dog", "DoorClosed",
  "Droplet", "Dumbbell", "Egg", "File", "FileText", "Filter", "Fish", "Flame",
  "Flower", "Folder", "Forklift", "Gamepad", "Gift", "GlassWater",
  "Globe", "Grape", "Hammer", "Hand", "HardDrive", "Headphones", "Heart",
  "Home", "IceCream", "Key", "Lamp", "Laptop", "Leaf", "Lightbulb", "List",
  "ListChecks", "ListTodo", "Lock", "Map", "MapPin",  "Milk", "Monitor",
  "Moon", "Mouse", "Nut", "Package", "Paintbrush", "Palette", "Paperclip",
  "Pen", "Pencil", "Phone", "Pizza", "Plug", "Printer", "QrCode", "Receipt",
  "Recycle", "Salad", "Scale", "Scissors", "Search", "Server", "Settings",
  "Shirt", "ShoppingCart", "Smartphone", "Snowflake", "Soup", "Sparkles",
  "Sprout", "Star", "Sun", "Tablet", "Tag", "Tags", "Thermometer", "Timer",
   "Trash2", "Truck", "Utensils", "Warehouse", "Wrench", "Wine"
];

// --- Auto-Icon ---
function getAutoIcon(name: string): IconKey | null {
  const n = name.toLowerCase();

  if (n.includes("wasser") || n.includes("water")) return "Droplet";
  if (n.includes("cola") || n.includes("soda")) return "CupSoda";
  if (n.includes("kaffee") || n.includes("coffee")) return "Coffee";
  if (n.includes("apfel") || n.includes("apple")) return "Apple";
  if (n.includes("papier") || n.includes("paper")) return "FileText";
  if (n.includes("schraube") || n.includes("screw")) return "Wrench";
  if (n.includes("box") || n.includes("karton")) return "Box";
  if (n.includes("milch") || n.includes("milk")) return "Milk";
  if (n.includes("chips") || n.includes("cookie")) return "Cookie";

  return null;
}

// --- Icon Picker Modal (zentriert) ---
function IconPickerSheet({
  open,
  onClose,
  value,
  onChange,
  articleName
}: {
  open: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (iconName: string) => void;
  articleName: string;
}) {
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return ICON_LIST;
    return ICON_LIST.filter((i) => i.toLowerCase().includes(term));
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-xl p-6 animate-in fade-in zoom-in">
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
                onClick={() => {
                  onChange(iconName);
                  onClose();
                }}
                className="aspect-square rounded-xl bg-white border border-border flex flex-col items-center justify-center gap-1"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] truncate">{iconName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const { instanceId } = useInstance();
  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

      if (!data) {
        setArticle(null);
        return;
      }

      const dbArticle = data as Article;

      setArticle({
        ...dbArticle,
        icon: dbArticle.icon ?? getAutoIcon(dbArticle.name) ?? null,
      });
    }

    load();
  }, [id]);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from("categories").select("*");
      setCategories(data || []);
    }
    loadCategories();
  }, []);

  // --- Icon Component ---
  const IconComp = useMemo(() => {
    if (!article?.icon) return null;

    const iconName = article.icon as IconKey;
    const Icon = LucideIcons[iconName];

    if (!Icon) return null;
    if (typeof Icon !== "function") return null;

    return Icon as React.FC<any>;
  }, [article?.icon]);

  const handleSave = async () => {
    if (!article) return;

    setSaving(true);
    await supabase
  .from("articles")
  .update({
    ...article,
    barcode: article.barcode || null,
  })
  .eq("id", article.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!article) return <div>Laden...</div>;

  const selectedCategory = categories.find((c) => c.id === article.category_id);

  return (
    <div className="min-h-screen p-4 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Artikel bearbeiten</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          ← Zurück
        </Button>
      </div>

      {/* Icon Kreis */}
<div className="flex justify-center">
  <button
    onClick={() => setIsIconPickerOpen(true)}
    className="w-20 h-20 rounded-full bg-white shadow-md border border-border flex items-center justify-center"
  >
    {article?.icon ? (
      (() => {
        const Icon =
          (LucideIcons as any)[article.icon as keyof typeof LucideIcons];

        if (!Icon) {
          console.warn("Icon nicht gefunden:", article.icon);
          return (
            <span className="text-xs text-muted-foreground">Icon wählen</span>
          );
        }

        return <Icon className="w-10 h-10" />;
      })()
    ) : (
      <span className="text-xs text-muted-foreground">Icon wählen</span>
    )}
  </button>
</div>


      {/* Name */}
      <div className="flex flex-col gap-1">
        <label>Name</label>
        <Input
          value={article.name}
          onChange={(e) => setArticle({ ...article, name: e.target.value })}
          className="bg-white shadow-sm"
        />
      </div>

      {/* Kategorie */}
      <div className="flex flex-col gap-1 relative">
        <label>Kategorie</label>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-white border border-border rounded-2xl px-4 py-3 shadow-sm flex justify-between"
        >
          {selectedCategory ? selectedCategory.name : "– Keine –"}
          <span>▾</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto">
            <button
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

      {/* Mindestbestand */}
      <div className="flex flex-col gap-1">
        <label>Mindestbestand</label>
        <Input
          type="number"
          value={article.minimum_stock}
          onChange={(e) =>
            setArticle({ ...article, minimum_stock: Number(e.target.value) })
          }
          className="bg-white shadow-sm"
        />
      </div>

      {/* Aktueller Bestand */}
      <div className="flex flex-col gap-1">
        <label>Bestand</label>
        <Input
          type="number"
          value={article.current_stock}
          onChange={(e) =>
            setArticle({ ...article, current_stock: Number(e.target.value) })
          }
          className="bg-white shadow-sm"
        />
      </div>

      {/* Lagerort */}
      <div className="flex flex-col gap-1">
        <label>Lagerort</label>
        <Input
          value={article.location || ""}
          onChange={(e) =>
            setArticle({ ...article, location: e.target.value })
          }
          className="bg-white shadow-sm"
        />
      </div>

      {/* Icon Picker */}
      <IconPickerSheet
        open={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        value={article.icon ?? null}
        onChange={(iconName) => setArticle({ ...article, icon: iconName })}
        articleName={article.name}
      />

      {/* Barcode */}
      <div className="flex flex-col gap-1">
        <label>Barcode</label>

        <div className="flex gap-2">
          <Input
            value={article.barcode || ""}
            onChange={(e) =>
              setArticle({ ...article, barcode: e.target.value })
            }
            placeholder="Optional"
            className="bg-white shadow-sm"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigate("/scan");
            }}
          >
            Scannen
          </Button>
        </div>
      </div>

      {/* Speichern */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className={`w-full h-14 rounded-2xl border font-semibold text-base shadow-sm transition-all active:scale-[0.98] ${
          saved
            ? "bg-blue-200 border-blue-300 text-blue-700"
            : "bg-blue-100 border-blue-200 text-blue-600 hover:bg-blue-200"
        } disabled:opacity-50 disabled:hover:bg-blue-100`}
      >
        {saved ? "Gespeichert!" : saving ? "Speichern..." : "Speichern"}
      </Button>
    </div>
  );
}
