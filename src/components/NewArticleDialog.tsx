import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCategories, createArticle } from "@/lib/supabase-helpers";
import { toast } from "sonner";

interface NewArticleDialogProps {
  open: boolean;
  onClose: () => void;
  barcode: string;
  onCreated: () => void;
}

export function NewArticleDialog({ open, onClose, barcode, onCreated }: NewArticleDialogProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minimumStock, setMinimumStock] = useState("3");
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Bitte gib einen Namen ein");
      return;
    }
    if (!categoryId) {
      toast.error("Bitte wähle eine Kategorie");
      return;
    }

    setLoading(true);
    try {
      await createArticle({
        barcode,
        name: name.trim(),
        category_id: categoryId,
        minimum_stock: parseInt(minimumStock) || 1,
      });
      toast.success(`${name} wurde angelegt und eingebucht`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error("Fehler: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle>Neuer Artikel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-lg">
            Barcode: {barcode}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Artikelname</Label>
            <Input
              id="name"
              placeholder="z.B. Nudeln"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="min-stock">Mindestbestand</Label>
            <Input
              id="min-stock"
              type="number"
              min={1}
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Wird gespeichert..." : "Speichern & Einbuchen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
