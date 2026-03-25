import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { updateStock } from "@/lib/supabase-helpers";
import { toast } from "sonner";

interface StockChangeDialogProps {
  open: boolean;
  onClose: () => void;
  article?: any;
  mode: "add" | "remove";
  amount?: number;
  onDone: () => void;
}

export default function StockChangeDialog({
  open,
  onClose,
  article,
  mode,
  amount = 1,
  onDone,
}: StockChangeDialogProps) {
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedAmount(1);
      setIsDropdownOpen(false);
    }
  }, [open]);

  if (!article) return null;

  const maxRemove = article.current_stock;
  const change = mode === "add" ? selectedAmount : -selectedAmount;

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const newStock = await updateStock(article.id, change);
      const verb = mode === "add" ? "eingebucht" : "ausgebucht";

      toast.success(
        `${Math.abs(change)}x ${article.name} ${verb}. Bestand: ${newStock}`
      );

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
      <DialogContent className="mx-4 rounded-3xl bg-white shadow-xl overflow-visible">

        {/* Header */}
        <div className="flex items-center justify-center relative py-4 border-b border-gray-200">
          <div className="absolute left-4 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
            {mode === "add" ? (
              <Plus className="h-5 w-5 text-green-600" />
            ) : (
              <Minus className="h-5 w-5 text-red-600" />
            )}
          </div>

          <DialogTitle className="text-lg font-semibold text-center">
            {article.name}
          </DialogTitle>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">

          <p className="text-sm text-gray-500">
            Aktueller Bestand:{" "}
            <span className="font-semibold text-gray-900">
              {article.current_stock}
            </span>
          </p>

          {article.location && (
            <p className="text-sm text-gray-500">
              Lagerort:{" "}
              <span className="font-semibold text-gray-900">
                {article.location}
              </span>
            </p>
          )}

          {/* Dropdown */}
          <div className="relative w-full">

            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-4 py-3 text-lg font-semibold shadow-sm flex justify-between items-center"
            >
              {mode === "add" ? `+${selectedAmount}` : `-${selectedAmount}`}
              <span className="text-gray-400">▾</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50">

                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="w-full px-4 py-3 text-center hover:bg-gray-100 transition"
                    onClick={() => {
                      setSelectedAmount(n);
                      setIsDropdownOpen(false);
                    }}
                    disabled={mode === "remove" && n > maxRemove}
                  >
                    {mode === "add" ? `+${n}` : `-${n}`}
                  </button>
                ))}

              </div>
            )}

          </div>

          {/* Confirm Button */}
          <div className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-4 text-lg"
              variant={mode === "add" ? "default" : "destructive"}
            >
              {loading
                ? "Wird gebucht..."
                : mode === "add"
                ? "Einbuchen"
                : "Ausbuchen"}
            </Button>

          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}