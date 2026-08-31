import { ArrowLeft } from "lucide-react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { VeloraShell } from "@/components/VeloraShell";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";

export default function PostDetail() { const [, params] = useRoute("/post/:postId"); const postId = params?.postId || ""; const post = trpc.posts.byId.useQuery({ postId }, { enabled: Boolean(postId) }); return <VeloraShell><div className="mx-auto max-w-[740px] px-4 pb-10 pt-7 sm:px-6"><Button variant="ghost" className="mb-5 rounded-xl" onClick={() => history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>{post.isLoading ? <div className="velora-surface h-[460px] animate-pulse" /> : post.data ? <PostCard post={post.data} onChanged={() => post.refetch()} /> : <div className="velora-empty"><h1 className="font-display text-3xl font-semibold">This post is unavailable.</h1><p className="mt-2 text-sm text-muted-foreground">It may have been removed or shared privately.</p></div>}</div></VeloraShell>; }
