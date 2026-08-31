import { Link, useLocation } from "wouter";
import { Archive, BarChart3, Bell, Compass, Heart, Home, Menu, MessageCircle, Plus, Search, Settings, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { VeloraMark } from "./VeloraMark";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home", icon: Home }, { href: "/explore", label: "Explore", icon: Compass },
  { href: "/messages", label: "Messages", icon: MessageCircle }, { href: "/notifications", label: "Activity", icon: Bell },
  { href: "/saved", label: "Saved", icon: Heart }, { href: "/archive", label: "Archive", icon: Archive }, { href: "/feedback", label: "Feedback", icon: MessageCircle }, { href: "/settings", label: "Settings", icon: Settings },
];

export function VeloraShell({ children, onCreate }: { children: React.ReactNode; onCreate?: () => void }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const overview = trpc.accounts.overview.useQuery(undefined, { enabled: isAuthenticated });
  const unread = trpc.notifications.unreadCount.useQuery(undefined, { enabled: Boolean(overview.data?.activeAccountId) });
  const conversations = trpc.messaging.list.useQuery(undefined, { enabled: Boolean(overview.data?.activeAccountId) });
  const unreadChats = conversations.data?.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0) || 0;
  const switchAccount = trpc.accounts.switchActive.useMutation({ onSuccess: () => overview.refetch() });
  const active = overview.data?.accounts.find(account => account.id === overview.data?.activeAccountId);

  const Nav = ({ mobile = false }: { mobile?: boolean }) => <nav className={cn("space-y-1", mobile && "space-y-2")}>{navigation.map(item => {
    const Icon = item.icon; const selected = item.href === "/" ? location === "/" : location.startsWith(item.href);
    return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn("velora-nav-link", selected && "active", mobile && "text-base")}>{<Icon className="h-[18px] w-[18px]" aria-hidden="true" />}<span>{item.label}</span>{item.href === "/notifications" && unread.data ? <span className="ml-auto rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px]">{unread.data}</span> : item.href === "/messages" && unreadChats ? <span className="ml-auto rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px]">{unreadChats}</span> : null}</Link>;
  })}</nav>;

  return <div className="velora-page">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-border/70 bg-card/65 p-5 backdrop-blur-xl lg:flex lg:flex-col">
      <VeloraMark className="mb-10 px-2" />
      <Nav />
      <div className="mt-auto space-y-3">
        {isAuthenticated && active ? <DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-2xl bg-secondary/70 p-2 text-left transition hover:bg-secondary focus-visible:outline-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-sm font-bold text-primary">{active.displayName.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{active.displayName}</span><span className="block truncate text-xs text-muted-foreground">@{active.username}</span></span><UserRound className="h-4 w-4 text-muted-foreground" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64"><DropdownMenuLabel>Switch Velora account</DropdownMenuLabel><DropdownMenuSeparator />{overview.data?.accounts.map(account => <DropdownMenuItem key={account.id} disabled={account.id === active.id || switchAccount.isPending} onClick={() => switchAccount.mutate({ accountId: account.id })}>{account.displayName}<span className="ml-auto text-xs text-muted-foreground">@{account.username}</span></DropdownMenuItem>)}<DropdownMenuSeparator /><DropdownMenuItem onClick={() => logout()}>Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu> : null}
        {isAuthenticated && user?.role === "admin" ? <><Link href="/admin" className="velora-nav-link"><ShieldCheck className="h-[18px] w-[18px]" />Moderation</Link><Link href="/analytics" className="velora-nav-link"><BarChart3 className="h-[18px] w-[18px]" />Analytics</Link></> : null}
      </div>
    </aside>
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/70 bg-card/80 px-4 backdrop-blur-xl lg:hidden"><VeloraMark /><button className="velora-icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button></header>
    {mobileOpen ? <div className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm lg:hidden"><div className="velora-surface h-full p-5"><div className="mb-10 flex items-center justify-between"><VeloraMark /><button className="velora-icon-button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div><Nav mobile /></div></div> : null}
    <main className="min-h-screen pb-24 lg:ml-[248px] lg:pb-10">{children}</main>
    {onCreate ? <button onClick={onCreate} aria-label="Create a post" className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-[1.15rem] bg-primary text-primary-foreground shadow-[0_15px_32px_rgba(66,68,183,.35)] transition hover:brightness-110 active:scale-95 lg:hidden"><Plus className="h-6 w-6" /></button> : null}
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-[66px] items-center justify-around border-t border-border/70 bg-card/90 px-1 backdrop-blur-xl lg:hidden">{navigation.slice(0, 4).map(item => { const Icon = item.icon; const selected = item.href === "/" ? location === "/" : location.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("grid h-11 w-12 place-items-center rounded-xl text-muted-foreground", selected && "bg-primary/10 text-primary")} aria-label={item.label}><Icon className="h-5 w-5" />{item.href === "/notifications" && unread.data ? <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{unread.data}</span> : item.href === "/messages" && unreadChats ? <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{unreadChats}</span> : null}</Link>; })}<button onClick={onCreate} className="grid h-11 w-12 place-items-center rounded-xl text-muted-foreground" aria-label="Create a post"><Plus className="h-5 w-5" /></button></nav>
  </div>;
}
