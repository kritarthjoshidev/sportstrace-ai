import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace Settings"
        title="Configure alerts, legal automation, and team preferences."
        description="These settings panels are ready to bind to backend APIs for workspace-level preferences, notification rules, and outbound notice behavior."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard eyebrow="Notifications" title="Alert routing">
          <div className="grid gap-4">
            <label className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Legal escalation inbox</p>
              <input defaultValue="legal@sportstrace.ai" className="field mt-3" />
            </label>
            <label className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Ops notification channel</p>
              <input defaultValue="#rights-monitoring" className="field mt-3" />
            </label>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Trigger thresholds</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input defaultValue="80" className="field" />
                <input defaultValue="65" className="field" />
              </div>
              <p className="mt-2 text-xs text-muted">First value: piracy alert threshold. Second value: suspicious case threshold.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Automation" title="Outbound actions">
          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-slate-300 bg-transparent" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Auto-draft DMCA notices</p>
                <p className="mt-1 text-sm leading-6 text-muted">Generate draft notices when a case is classified as pirated.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-slate-300 bg-transparent" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Preserve evidence packages</p>
                <p className="mt-1 text-sm leading-6 text-muted">Store matched frame summaries and ownership proof for every escalated case.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 bg-transparent" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Auto-send notices on confirmed matches</p>
                <p className="mt-1 text-sm leading-6 text-muted">Keep off until SMTP credentials and approval flow are connected to the backend.</p>
              </div>
            </label>
          </div>
        </SectionCard>
      </div>

      <SectionCard eyebrow="Workspace Profile" title="Rights holder defaults">
        <div className="grid gap-4 md:grid-cols-2">
          <input defaultValue="SportsTrace AI" className="field" />
          <input defaultValue="sports@sportstrace.ai" className="field" />
          <input defaultValue="Default rights contact" className="field" />
          <input defaultValue="Broadcast rights operations" className="field" />
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" className="primary-button">
            Save preferences
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
