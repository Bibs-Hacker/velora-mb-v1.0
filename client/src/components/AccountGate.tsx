import { useState } from "react";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { VeloraMark } from "./VeloraMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const overview = trpc.accounts.overview.useQuery(undefined, { enabled: isAuthenticated });
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const create = trpc.accounts.create.useMutation({ onSuccess: () => overview.refetch() });

  if (loading || (isAuthenticated && overview.isLoading)) return <div className="velora-page grid min-h-screen place-items-center"><div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="h-3 w-3 animate-pulse rounded-full bg-primary" />Preparing your space</div></div>;
  if (!isAuthenticated) return <div className="velora-page grid min-h-screen place-items-center p-5"><section className="velora-surface w-full max-w-xl overflow-hidden p-7 sm:p-10"><VeloraMark className="mb-12" /><p className="velora-label">A quieter kind of social</p><h1 className="mt-3 font-display text-4xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-5xl">Make room for what matters.</h1><p className="mt-5 max-w-md leading-7 text-muted-foreground">Velora is a thoughtful space to share, connect, and return to the moments you mean to keep.</p><Button className="mt-9 h-12 rounded-xl px-5 font-bold" onClick={() => startLogin()}>Continue securely <ArrowRight className="ml-2 h-4 w-4" /></Button><p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Sign-in is secured through your identity provider.</p></section></div>;
  if (!overview.data?.accounts.length) return <div className="velora-page grid min-h-screen place-items-center p-5"><section className="velora-surface w-full max-w-xl p-7 sm:p-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span><p className="velora-label mt-7">Your Velora identity</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.045em]">Create your first profile.</h1><p className="mt-3 max-w-md leading-7 text-muted-foreground">This is the name and handle people will use to find you. You can manage additional linked identities later.</p><form className="mt-8 space-y-5" onSubmit={event => { event.preventDefault(); create.mutate({ username, displayName }); }}><div className="space-y-2"><Label htmlFor="displayName">Display name</Label><Input id="displayName" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Your name" className="h-12 rounded-xl" required /></div><div className="space-y-2"><Label htmlFor="username">Velora handle</Label><div className="relative"><span className="absolute left-3 top-3 text-muted-foreground">@</span><Input id="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="your.handle" className="h-12 rounded-xl pl-7" required /></div></div>{create.error ? <p className="text-sm text-destructive">{create.error.message}</p> : null}<Button type="submit" className="h-12 w-full rounded-xl font-bold" disabled={create.isPending}>{create.isPending ? "Creating your profile…" : "Enter Velora"}</Button></form></section></div>;
  return <>{children}</>;
}
