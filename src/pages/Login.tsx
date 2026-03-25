import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInstance } from "@/context/InstanceContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const navigate = useNavigate();
  const { setInstanceId } = useInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setInstanceId(null);
          toast.success("Account erstellt! 🎉");
          navigate("/instance");
        } else {
          toast.success(
            "Account erstellt! Prüfe bitte deine E-Mails zur Bestätigung."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setInstanceId(null);
        toast.success("Willkommen zurück 👋");
        navigate("/instance");
      }
    } catch (err: any) {
      toast.error(err.message || "Anmeldung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md bg-card shadow-2xl rounded-3xl p-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10">
            <Package className="h-10 w-10 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Was Ist Da?
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isSignUp
                ? "Erstelle deinen Account"
                : "Melde dich an, um eine Instanz auszuwählen"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="deinemail@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            {loading
              ? "Bitte warten..."
              : isSignUp
              ? "Account erstellen"
              : "Anmelden"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Bereits registriert?" : "Noch kein Account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-primary hover:opacity-80"
          >
            {isSignUp ? "Anmelden" : "Registrieren"}
          </button>
        </div>
      </div>
    </div>
  );
}