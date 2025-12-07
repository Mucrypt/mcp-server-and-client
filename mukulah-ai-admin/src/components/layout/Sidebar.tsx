"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { gsap } from "gsap";
import {
  LayoutDashboard,
  Bot,
  GitBranch,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Settings
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch },
  { href: "/trades", label: "Trades", icon: TrendingUp },
  { href: "/lab", label: "Lab", icon: Sparkles },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];export function Sidebar() {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sidebarRef.current || !navRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".sidebar-logo", {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.from(".nav-item", {
        opacity: 0,
        x: -20,
        stagger: 0.08,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.2,
      });

      gsap.from(".sidebar-footer", {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.6,
      });
    }, sidebarRef);

    return () => ctx.revert();
  }, []);

  return (
    <aside ref={sidebarRef} className="fixed left-0 top-0 z-40 h-screen w-64 border-r shadow-xl" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="sidebar-logo flex h-16 items-center border-b px-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-2xl font-bold text-transparent animate-gradient drop-shadow-sm">
          Mukulah AI
        </h1>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav ref={navRef} className="space-y-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "nav-item group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                  isActive ? "active bg-gradient-to-r from-primary/20 to-accent/20 shadow-lg shadow-primary/20 border border-primary/40" : "hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                )}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive 
                      ? "text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" 
                      : "group-hover:text-primary group-hover:scale-110"
                  )}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="sidebar-footer absolute bottom-0 left-0 right-0 border-t p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 p-4 backdrop-blur-sm shadow-inner">
          <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
            Private Trading Brain
          </p>
          <p className="mt-1 text-xs font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Version 1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}
