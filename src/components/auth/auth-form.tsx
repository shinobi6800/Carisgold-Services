"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("full_name") ?? "").trim();

    const requested = new URLSearchParams(window.location.search).get("next") ?? "/";
    const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ kind: "error", text: error.message });
        setLoading(false);
        return;
      }
      toast.success("Welcome back");
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setMessage({ kind: "error", text: error.message });
      setLoading(false);
      return;
    }

    if (data.session) {
      toast.success("Account created");
      router.push(next);
      router.refresh();
      return;
    }

    setMessage({
      kind: "info",
      text: "Check your email to confirm your account, then log in.",
    });
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setMessage(null);
            }}
            className={cn(
              "rounded-md py-2 font-medium transition-colors",
              mode === m ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
            )}
          >
            {m === "signin" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" autoComplete="name" required />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
          />
        </div>

        {message && (
          <p
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              message.kind === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-secondary text-primary"
            )}
          >
            {message.text}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Please wait..." : mode === "signin" ? "Log in" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
