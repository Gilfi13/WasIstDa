import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, Plus, LogIn } from "lucide-react";

export default function InstanceSelect() {
  const navigate = useNavigate();

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
              Instanz wählen
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Erstelle eine neue Instanz oder tritt einer bestehenden bei
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          
          <Button
            onClick={() => navigate("/instance/create")}
            className="w-full h-14 rounded-2xl bg-blue-100 border border-blue-200 text-blue-600 font-semibold text-base shadow-sm hover:bg-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Neue Instanz erstellen
          </Button>

          <Button
            onClick={() => navigate("/instance/join")}
            className="w-full h-14 rounded-2xl bg-white border border-border text-foreground font-semibold text-base shadow-sm hover:bg-muted/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Einer Instanz beitreten
          </Button>

        </div>
      </div>
    </div>
  );
}