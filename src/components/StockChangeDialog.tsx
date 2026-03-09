import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateStock } from "@/lib/supabase-helpers";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";

interface StockChangeDialogProps {
  open: boolean;
  onClose: () => void;
  article: { id: string; name: string; current_stock: number } | null;
  mode: "add" | "remove";
  onDone: () => void;
}

export function StockChangeDialog({ open, onClose, article, mode, onDone }: StockChangeDialogProps) {
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(false);

  if (!article) return null;

  const change = mode === "add" ? parseInt(amount) : -parseInt(amount);
  const maxRemove = article.current_stock;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const newStock = await updateStock(article.id, change);
      const verb = mode === "add" ? "eingebucht" : "ausgebucht";
      toast.success(`${Math.abs(change)}x ${article.name} ${verb}. Bestand: ${newStock}`);
      onDone();
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
          <DialogTitle className="flex items-center gap-2">
            {mode === "add" ? (
              <Plus className="h-5 w-5 text-success" />
            ) : (
              <Minus className="h-5 w-5 text-destructive" />
            )}
            {article.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Aktueller Bestand: <span className="font-semibold text-foreground">{article.current_stock}</span>
          </p>
          <div className="space-y-2">
            <Select value={amount} onValueChange={setAmount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem
                    key={n}
                    value={String(n)}
                    disabled={mode === "remove" && n > maxRemove}
                  >
                    {mode === "add" ? `+${n}` : `-${n}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full"
            variant={mode === "add" ? "default" : "destructive"}
          >
            {loading ? "Wird gebucht..." : mode === "add" ? "Einbuchen" : "Ausbuchen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
