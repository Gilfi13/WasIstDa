import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { findInstanceByCode } from "@/lib/instance-helpers";
import { useInstance } from "@/context/InstanceContext";
import { supabase } from "@/integrations/supabase/client";
import { consumePostInstanceRedirect } from "@/lib/post-instance-redirect";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { KeyRound } from "lucide-react";

const CODE_LENGTH = 6;

export default function JoinInstance() {
  const [codeArray, setCodeArray] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastTriedCode, setLastTriedCode] = useState("");

  const navigate = useNavigate();
  const { setInstanceId } = useInstance();

  const fullCode = codeArray.join("");

  function handleChange(value: string, index: number) {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return;

    const newCode = [...codeArray];
    newCode[index] = value.toUpperCase();
    setCodeArray(newCode);
    setErrorMsg("");

    if (value && index < CODE_LENGTH - 1) {
      const next = document.getElementById(`code-${index + 1}`);
      (next as HTMLInputElement | null)?.focus();
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (e.key === "Backspace" && !codeArray[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`);
      (prev as HTMLInputElement | null)?.focus();
    }
  }

  async function handleJoin(e?: React.FormEvent) {
    if (loading) return;

    e?.preventDefault();

    if (fullCode.length < CODE_LENGTH || codeArray.includes("")) {
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setLastTriedCode(fullCode);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("Kein Benutzer angemeldet.");
        return;
      }

      const instance = await findInstanceByCode(fullCode);

      if (!instance) {
        setErrorMsg("Keine Instanz mit diesem Code gefunden.");
        return;
      }

      const { error } = await supabase
        .from("user_instances")
        .upsert(
          { user_id: user.id, instance_id: instance.id },
          { onConflict: "user_id,instance_id" }
        );

      if (error) {
        setErrorMsg("Fehler beim Beitreten der Instanz.");
        return;
      }

      setInstanceId(instance.id);
      navigate(consumePostInstanceRedirect("/"));
    } catch (err: any) {
      setErrorMsg(err.message || "Fehler beim Beitreten.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      fullCode.length === CODE_LENGTH &&
      !codeArray.includes("") &&
      !loading &&
      fullCode !== lastTriedCode
    ) {
      const timeout = setTimeout(() => {
        handleJoin();
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [codeArray, fullCode, loading, lastTriedCode]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 bg-background">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-6 sm:p-8 space-y-8 border border-gray-100">
        
        <div className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Instanz beitreten
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Gib den 6-stelligen Code ein
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div className="space-y-3">
            <Label>Instanz-Code</Label>

            <div className="flex justify-between gap-2 sm:gap-3">
              {codeArray.map((char, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-blue-100 bg-blue-50 text-center text-lg font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-200"
                />
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="text-sm text-red-500 text-center">{errorMsg}</div>
          )}

          <Button
            type="submit"
            disabled={loading || fullCode.length < CODE_LENGTH}
            className="w-full h-14 rounded-2xl text-base font-semibold border-0 ring-0 shadow-sm hover:shadow-md focus-visible:ring-0 focus-visible:outline-none transition-all"
          >
            {loading ? "Bitte warten..." : "Beitreten"}
          </Button>
        </form>
      </div>
    </div>
  );
}