import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, createArticle } from "@/lib/supabase-helpers";
import { useInstance } from "@/context/InstanceContext";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react/dist/esm/icons";

export default function NewArticleDialog({ onClose }: { onClose: () => void }) {
  const { instanceId } = useInstance();

  const [name, setName] = useState("");
  const [stock, setStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(0);
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [icon, setIcon] = useState("");
  const [barcode, setBarcode] = useState("");

  // Kategorien laden
  const { data: categories } = useQuery({
    queryKey: ["categories", instanceId],
    queryFn: () => fetchCategories(instanceId!),
    enabled: !!instanceId,
  });

  // Icon-Liste generieren
  const iconNames = Object.keys(LucideIcons).filter((key) =>
    key.endsWith("Icon")
  );

  async function handleCreate() {
    if (!instanceId) {
      toast.error("Keine Instanz gefunden.");
      return;
    }

    try {
      const newArticle = {
        name,
        current_stock: stock,
        minimum_stock: minimumStock,
        location,
        category_id: categoryId || null,
        icon: icon || null,
        barcode: barcode || null,
      };

      await createArticle(newArticle, instanceId);
      toast.success("Artikel erstellt!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Erstellen des Artikels");
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Neuen Artikel erstellen</h2>

      {/* Name */}
      <input
        className="w-full border p-2 rounded mb-3"
        placeholder="Artikelname"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Barcode */}
      <input
        className="w-full border p-2 rounded mb-3"
        placeholder="Barcode (optional)"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
      />

      {/* Bestand */}
      <input
        type="number"
        className="w-full border p-2 rounded mb-3"
        placeholder="Aktueller Bestand"
        value={stock}
        onChange={(e) => setStock(Number(e.target.value))}
      />

      {/* Mindestbestand */}
      <input
        type="number"
        className="w-full border p-2 rounded mb-3"
        placeholder="Mindestbestand"
        value={minimumStock}
        onChange={(e) => setMinimumStock(Number(e.target.value))}
      />

      {/* Ort */}
      <input
        className="w-full border p-2 rounded mb-3"
        placeholder="Ort (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      {/* Kategorie */}
      <select
        className="w-full border p-2 rounded mb-3"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">Keine Kategorie</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Icon */}
      <select
        className="w-full border p-2 rounded mb-3"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
      >
        <option value="">Kein Icon</option>
        {iconNames.map((iconName) => (
          <option key={iconName} value={iconName}>
            {iconName.replace("Icon", "")}
          </option>
        ))}
      </select>

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCreate}
          className="flex-1 bg-blue-600 text-white py-2 rounded"
        >
          Erstellen
        </button>

        <button
          onClick={onClose}
          className="flex-1 bg-gray-300 text-black py-2 rounded"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
