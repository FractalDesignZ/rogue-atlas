import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Analyst",
          callbackURL: "/studio",
        });
        if (res.error) throw new Error(res.error.message);
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/studio",
        });
        if (res.error) throw new Error(res.error.message);
      }
      window.location.href = "/studio";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-bg text-fg lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="/atelier.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/20" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/" className="text-fg">
            <BrandMark />
          </Link>
          <div className="max-w-sm">
            <p className="font-display text-3xl leading-tight">
              Keep identities, hold out the rest.
            </p>
            <p className="mt-3 text-sm text-muted">
              Certificates stay on your account. The analysis engine never pretends a construction
              is a discovery.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex text-fg lg:hidden">
            <BrandMark />
          </Link>
          <h1 className="font-display text-3xl">Enter the studio</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to freeze certificates. You can still run the public instruments unsigned.
          </p>

          {authEnabled ? (
            <div className="mt-8 space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => void signIn(p.providerId, { callbackURL: "/studio" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
          )}

          <div className="my-6 flex items-center gap-3 text-[11px] tracking-wide text-subtle uppercase">
            <span className="h-px flex-1 bg-line" />
            or email
            <span className="h-px flex-1 bg-line" />
          </div>

          <form className="space-y-3" onSubmit={(e) => void onEmail(e)}>
            {mode === "up" ? (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error ? <p className="text-sm text-fail">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 text-sm text-muted hover:text-fg"
            onClick={() => setMode(mode === "up" ? "in" : "up")}
          >
            {mode === "up" ? "Already have an account?" : "Need an account?"}
          </button>
        </div>
      </section>
    </main>
  );
}
