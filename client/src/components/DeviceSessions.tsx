import { Laptop, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getVeloraDeviceSessionId, resetVeloraDeviceSession } from "@/lib/device-session";
import { Button } from "@/components/ui/button";

function labelForCurrentDevice() {
  const agent = navigator.userAgent;
  if (/iPhone|iPad/i.test(agent)) return "Apple mobile device";
  if (/Android/i.test(agent)) return "Android device";
  if (/Macintosh/i.test(agent)) return "Mac desktop";
  if (/Windows/i.test(agent)) return "Windows desktop";
  return "Web browser";
}

export function DeviceSessions() {
  const deviceId = getVeloraDeviceSessionId(); const sessions = trpc.sessions.list.useQuery(); const register = trpc.sessions.register.useMutation({ onSuccess: () => sessions.refetch() }); const revoke = trpc.sessions.revoke.useMutation({ onSuccess: (_, values) => { if (values.sessionId === deviceId) resetVeloraDeviceSession(); sessions.refetch(); toast.success("Device session removed."); } });
  useEffect(() => { register.mutate({ deviceId, deviceLabel: labelForCurrentDevice() }); }, []);
  return <section className="velora-surface mt-5 p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-display text-2xl font-semibold">Active Velora devices</h2><p className="text-sm text-muted-foreground">Review and remove application-device sessions. Primary identity sessions remain protected by your sign-in provider.</p></div></div><div className="mt-5 space-y-2">{sessions.isLoading ? <p className="text-sm text-muted-foreground">Loading active devices…</p> : sessions.data?.length ? sessions.data.map(session => <div key={session.id} className="flex items-center gap-3 rounded-xl bg-muted/55 p-3"><Laptop className="h-5 w-5 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{session.deviceLabel}{session.id === deviceId ? " · This device" : ""}</p><p className="text-xs text-muted-foreground">Last active {new Date(session.lastActiveAt).toLocaleString()}</p></div><Button size="sm" variant="outline" className="rounded-lg" onClick={() => revoke.mutate({ sessionId: session.id })} disabled={revoke.isPending}><LogOut className="mr-1 h-3.5 w-3.5" />Remove</Button></div>) : <p className="rounded-xl bg-muted/55 p-4 text-sm text-muted-foreground">No device sessions are recorded yet.</p>}</div><Button size="sm" variant="ghost" className="mt-3 rounded-lg" onClick={() => { register.mutate({ deviceId, deviceLabel: labelForCurrentDevice() }); }}><RefreshCw className="mr-2 h-3.5 w-3.5" />Refresh this device</Button></section>;
}
