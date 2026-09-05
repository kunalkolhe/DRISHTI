import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Activity, CheckCircle2, TrendingUp, Users, ArrowLeft } from "lucide-react";

// This is a Server Component, meaning this code runs on the backend
// and fetches fresh data every time the page loads!
export default async function ScorecardPage() {
  
  // 1. Fetch all aggregate metrics from PostgreSQL using Prisma
  const totalAssets = await prisma.asset.count();
  const totalComplaints = await prisma.complaint.count();
  const resolvedComplaints = await prisma.complaint.count({
    where: { status: "CLOSED" }
  });
  
  // Calculate Resolution Rate
  const resolutionRate = totalComplaints > 0 
    ? Math.round((resolvedComplaints / totalComplaints) * 100) 
    : 100;

  // 2. Fetch the 5 most recent active complaints
  const recentComplaints = await prisma.complaint.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { asset: true }
  });

  return (
    <div className="min-h-screen bg-background selection:bg-accent/20">
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Title Section */}
        <div className="mb-12">
          <div className="dc-eyebrow mb-4">Live city metrics</div>
          <h1 className="text-4xl md:text-5xl font-display font-semibold text-slate-800" style={{ letterSpacing: "-0.045em" }}>
            Public scorecard
          </h1>
          <p className="text-lg text-slate-500 mt-4 max-w-2xl leading-relaxed">
            Total transparency into how the city&apos;s infrastructure is performing and how quickly issues are being resolved.
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Total assets tracked</span>
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><Activity className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-black text-slate-800">{totalAssets}</h2>
          </div>

          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Total issues reported</span>
              <div className="p-2 bg-alert/10 text-alert rounded-xl"><Users className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-black text-slate-800">{totalComplaints}</h2>
          </div>

          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Issues fixed</span>
              <div className="p-2 bg-success/10 text-success rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-black text-slate-800">{resolvedComplaints}</h2>
          </div>

          <div className="p-6 flex flex-col justify-between h-40" style={{ background: "#0d5347", borderRadius: 22, border: "1.5px solid rgba(18,21,15,.55)", boxShadow: "6px 8px 0 rgba(18,21,15,.85)" }}>
            <div className="flex justify-between items-start">
              <span className="dc-mono" style={{ color: "rgba(248,251,240,.75)" }}>Resolution rate</span>
              <div className="p-2 bg-white/20 text-white rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-display font-black text-white">{resolutionRate}</h2>
              <span className="text-2xl font-bold text-white/80">%</span>
            </div>
          </div>

        </div>

        {/* Live Feed */}
        <div className="dc-surface overflow-hidden" style={{ padding: 0 }}>
          <div className="p-6" style={{ borderBottom: "1.5px solid rgba(18,21,15,.14)" }}>
            <h3 className="font-semibold text-slate-800 text-lg">Recent reports activity</h3>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(18,21,15,.1)" }}>
            {recentComplaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">No complaints logged yet.</div>
            ) : (
              recentComplaints.map((complaint) => (
                <div key={complaint.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                        complaint.status === 'OPEN' ? 'bg-alert/10 text-alert' :
                        complaint.status === 'ROUTED' ? 'bg-accent/10 text-accent' :
                        'bg-success/10 text-success'
                      }`}>
                        {complaint.status}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-lg">
                      {complaint.asset ? complaint.asset.category.replace('_', ' ') : "General Infrastructure"} Issue
                    </p>
                    <p className="text-sm text-slate-500 mt-1 font-mono">{complaint.asset ? complaint.asset.qrCodeId : (complaint.address ? "Custom Location" : "Unregistered Asset")}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Severity</span>
                    <span className={`font-bold ${
                      complaint.severity === 'HIGH' ? 'text-alert' :
                      complaint.severity === 'MEDIUM' ? 'text-accent' : 'text-success'
                    }`}>{complaint.severity || 'UNKNOWN'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
