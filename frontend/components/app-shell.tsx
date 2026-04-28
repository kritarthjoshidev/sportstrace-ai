"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AlertTriangle, BellRing, Fingerprint, LayoutDashboard, Search, ShieldCheck } from "lucide-react";

import { getBackendHealth } from "@/lib/api";
import { BackendHealth } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload-original", label: "Upload Original", icon: Fingerprint },
  { href: "/check-piracy", label: "Check Piracy", icon: Search },
  { href: "/alerts", label: "Alerts", icon: BellRing },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [health, setHealth] = useState<BackendHealth>({
    online: false,
    message: "Checking backend connection...",
  });

  useEffect(() => {
    let alive = true;

    async function loadHealth() {
      const nextHealth = await getBackendHealth();
      if (alive) {
        setHealth(nextHealth);
      }
    }

    void loadHealth();
    const interval = window.setInterval(() => {
      void loadHealth();
    }, 15000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-grid text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-5 md:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[28px] border border-white/8 bg-panel/80 p-6 shadow-glow backdrop-blur xl:block">
          <div className="mb-10">
            <div className="mb-2 inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/10 px-3 py-2 text-xs uppercase tracking-[0.28em] text-accent">
              <ShieldCheck className="h-4 w-4" />
              SportsTrace AI
            </div>
            <h1 className="font-[Bahnschrift,Segoe_UI_Variable,sans-serif] text-3xl font-semibold leading-tight text-white">
              Sports media piracy intelligence.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Perceptual hashing, similarity scoring, ownership proof, and takedown workflows designed for broadcast rights teams.
            </p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? "bg-accent text-slate-950 shadow-lg shadow-accent/20"
                      : "bg-white/[0.03] text-muted hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-3xl border border-white/8 bg-gradient-to-br from-accent/10 to-transparent p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Protection Engine</p>
            <div className="mt-4 flex items-center gap-3">
              <Activity className="h-10 w-10 rounded-2xl bg-accent/15 p-2 text-accent" />
              <div>
                <p className="text-sm font-semibold text-white">Live forensic profile</p>
                <p className="text-sm text-muted">Crop-resistant pHash, edge features, SSIM fallback</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          {!health.online ? (
            <div className="mb-4 rounded-[24px] border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold text-white">Backend offline</p>
                  <p className="mt-1 text-danger/90">
                    {health.message}
                  </p>
                  <p className="mt-2 font-mono text-xs text-danger/80">
                    .\.venv\Scripts\python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/8 bg-panel/70 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-7">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Rights Intelligence Workspace</p>
              <h2 className="font-[Bahnschrift,Segoe_UI_Variable,sans-serif] text-2xl font-semibold text-white">
                Build a defensible evidence trail before the content spreads.
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                  health.online
                    ? "border border-success/30 bg-success/10 text-success"
                    : "border border-danger/30 bg-danger/10 text-danger"
                }`}
              >
                {health.online ? "Detection engine online" : "Backend connection required"}
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
