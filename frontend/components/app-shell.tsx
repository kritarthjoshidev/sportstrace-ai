"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BellRing,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Radar,
  Search,
  Settings2,
  Shield,
  UploadCloud,
  X,
} from "lucide-react";

import { getBackendHealth } from "@/lib/api";
import { BackendHealth } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload-original", label: "Upload Original", icon: UploadCloud },
  { href: "/check-piracy", label: "Check Piracy", icon: Radar },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [health, setHealth] = useState<BackendHealth>({
    online: false,
    message: "Checking backend connection...",
  });

  const activeItem = useMemo(
    () =>
      navItems.find((item) => pathname.startsWith(item.href)) ??
      (pathname.startsWith("/comparison") ? { href: pathname, label: "Comparison", icon: Radar } : navItems[0]),
    [pathname]
  );

  useEffect(() => {
    let alive = true;

    async function refreshHealth() {
      const nextHealth = await getBackendHealth();
      if (alive) {
        setHealth(nextHealth);
      }
    }

    void refreshHealth();
    const interval = window.setInterval(() => {
      void refreshHealth();
    }, 15000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-app-grid text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-4 p-4 lg:gap-6 lg:p-6">
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="surface hidden w-[290px] shrink-0 overflow-hidden bg-white lg:flex lg:flex-col"
        >
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-brand2 to-cyan text-white shadow-md">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-brand/80">SportsTrace AI</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Rights command center</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">
              Track rebroadcast risk, protect premium feeds, and move fast from detection to enforcement.
            </p>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                    active
                      ? "border-brand/20 bg-brand/8 text-slate-950 shadow-sm"
                      : "border-transparent bg-white text-muted hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl transition",
                        active ? "bg-brand/10 text-brand" : "bg-slate-100 text-subdued group-hover:text-brand"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </span>
                  <ChevronRight className={cn("h-4 w-4 transition", active ? "text-brand" : "text-subdued/60")} />
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.3em] text-brand/80">Protection Engine</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.26em]",
                    health.online ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  )}
                >
                  {health.online ? "online" : "offline"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-muted">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <span>Detection SLA</span>
                  <span className="font-semibold text-slate-950">2m 18s</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <span>Auto notices</span>
                  <span className="font-semibold text-slate-950">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
          <header className="surface sticky top-4 z-30 bg-white/90 px-4 py-4 backdrop-blur-sm sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <p className="eyebrow">Live Workspace</p>
                  <div className="mt-1 flex items-center gap-3">
                    <h1 className="truncate text-xl font-semibold text-slate-950 sm:text-2xl">{activeItem.label}</h1>
                    <span
                      className={cn(
                        "hidden rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] sm:inline-flex",
                        health.online ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                      )}
                    >
                      {health.online ? "API connected" : "API required"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="field-shell flex h-12 min-w-0 items-center gap-3 px-4 sm:w-[360px]">
                  <Search className="h-4 w-4 text-subdued" />
                  <input
                    type="search"
                    placeholder="Search videos, alerts, cases"
                    className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-subdued"
                  />
                  <span className="hidden rounded-xl border border-slate-200 px-2 py-1 text-[11px] text-subdued sm:inline-flex">
                    /
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                    aria-label="Notifications"
                  >
                    <BellRing className="h-5 w-5" />
                  </button>
                  <Link href="/check-piracy" className="primary-button hidden sm:inline-flex">
                    New Scan
                  </Link>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-cyan text-sm font-semibold text-white">
                      ST
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-slate-950">Ops Lead</p>
                      <p className="text-xs text-muted">sports@sportstrace.ai</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!health.online ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-[24px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                {health.message}
              </motion.div>
            ) : null}
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <AnimatePresence>
        {mobileNavOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-white/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-[320px] flex-col border-r border-slate-200 bg-white/95 p-4 backdrop-blur-sm lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-brand2 to-cyan text-white">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">SportsTrace AI</p>
                    <p className="text-xs text-muted">Rights command center</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                        active
                          ? "bg-brand/8 text-slate-950"
                          : "bg-white text-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <Link href="/check-piracy" className="primary-button mt-auto">
                New Scan
              </Link>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
