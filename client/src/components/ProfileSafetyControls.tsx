import { Ban, Flag, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export function ProfileSafetyControls({ accountId, username }: { accountId: string; username: string }) {
  const status = trpc.userSafety.status.useQuery({ targetAccountId: accountId });
  const toggle = trpc.userSafety.toggle.useMutation({ onSuccess: () => status.refetch(), onError: error => toast.error(error.message) });
  const report = trpc.safety.createReport.useMutation({ onSuccess: () => toast.success("Report submitted to the Velora safety team."), onError: error => toast.error(error.message) });
  const blocked = Boolean(status.data?.blocked); const muted = Boolean(status.data?.muted);
  return <section className="velora-surface mt-5 p-5"><p className="velora-label">Safety controls</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Manage how @{username} can interact with you. These controls are enforced on the server.</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant={blocked ? "default" : "outline"} className="rounded-lg" onClick={() => toggle.mutate({ targetAccountId: accountId, relation: "blocked" })} disabled={toggle.isPending}><Ban className="mr-2 h-4 w-4" />{blocked ? "Unblock" : "Block"}</Button><Button size="sm" variant={muted ? "default" : "outline"} className="rounded-lg" onClick={() => toggle.mutate({ targetAccountId: accountId, relation: "muted" })} disabled={toggle.isPending}><VolumeX className="mr-2 h-4 w-4" />{muted ? "Unmute" : "Mute"}</Button><Button size="sm" variant="outline" className="rounded-lg" onClick={() => report.mutate({ targetType: "user", targetId: accountId, reason: "other" })} disabled={report.isPending}><Flag className="mr-2 h-4 w-4" />Report</Button></div>{blocked ? <p className="mt-3 text-xs font-semibold text-destructive">New messages and notifications from this account are blocked.</p> : muted ? <p className="mt-3 text-xs font-semibold text-primary">Notifications from this account are muted.</p> : null}</section>;
}

export default ProfileSafetyControls;
