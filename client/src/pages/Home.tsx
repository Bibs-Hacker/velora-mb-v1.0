import { PenLine, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { VeloraShell } from "@/components/VeloraShell";
import { ComposerDialog } from "@/components/ComposerDialog";
import { PostCard } from "@/components/PostCard";
import { StoryStrip } from "@/components/StoryStrip";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [location] = useLocation(); const [composerOpen, setComposerOpen] = useState(false); const saved = location === "/saved"; const feed = trpc.posts.feed.useQuery({ mode: saved ? "saved" : "home", limit: 30 });
  return <VeloraShell onCreate={() => setComposerOpen(true)}><div className="mx-auto max-w-[740px] px-4 pb-10 pt-7 sm:px-6"><div className="mb-7 flex items-end justify-between"><div><p className="velora-label">{saved ? "Your private collection" : "Your circle and beyond"}</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em] sm:text-5xl">{saved ? "Kept close." : "Good to see you."}</h1></div><Button className="hidden rounded-xl font-bold sm:inline-flex" onClick={() => setComposerOpen(true)}><PenLine className="mr-2 h-4 w-4" />Create</Button></div>{!saved ? <div className="mb-5"><StoryStrip /></div> : null}<section className="space-y-5">{feed.isLoading ? <><div className="velora-surface h-[440px] animate-pulse" /><div className="velora-surface h-[360px] animate-pulse" /></> : feed.data?.length ? feed.data.map(post => <PostCard key={post.id} post={post} onChanged={() => feed.refetch()} />) : <div className="velora-empty"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></span><h2 className="mt-5 font-display text-2xl font-semibold">{saved ? "Nothing saved yet." : "The conversation starts here."}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{saved ? "Save posts that you would like to revisit. They will remain private to your active Velora account." : "Follow people you care about or share your first considered moment with Velora."}</p>{!saved ? <Button className="mt-6 rounded-xl" onClick={() => setComposerOpen(true)}>Share a moment</Button> : null}</div>}</section></div><ComposerDialog open={composerOpen} onOpenChange={setComposerOpen} /></VeloraShell>;
}
