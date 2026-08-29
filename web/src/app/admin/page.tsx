import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Users, AlertCircle, Database, CheckCircle2 } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getSession();
  
  if (!session || session.role !== 'ADMIN') {
    redirect("/login");
  }

  // Fetch metrics
  const totalUsers = await prisma.user.count();
  const totalAssets = await prisma.asset.count();
  const totalComplaints = await prisma.complaint.count();
  const openComplaints = await prisma.complaint.count({ where: { status: 'OPEN' } });

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen" style={{ background: "#eee8da" }}>
      <div className="max-w-6xl mx-auto px-6 py-12">

        <div className="mb-10">
          <div className="dc-eyebrow mb-4">Admin command center</div>
          <h1 className="text-3xl font-display font-semibold text-slate-800" style={{ letterSpacing: "-0.04em" }}>System overview</h1>
          <p className="text-slate-500 mt-2">Users, assets and complaints across every department.</p>
        </div>

        {/* System KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Total users</span>
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><Users className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-semibold text-slate-800">{totalUsers}</h2>
          </div>
          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Total assets</span>
              <div className="p-2 bg-accent/10 text-accent rounded-xl"><Database className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-semibold text-slate-800">{totalAssets}</h2>
          </div>
          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Total reports</span>
              <div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-semibold text-slate-800">{totalComplaints}</h2>
          </div>
          <div className="p-6 flex flex-col justify-between h-40" style={{ background: "#b23c2e", borderRadius: 22, border: "1.5px solid rgba(18,21,15,.55)", boxShadow: "6px 8px 0 rgba(18,21,15,.85)" }}>
            <div className="flex justify-between items-start">
              <span className="dc-mono" style={{ color: "rgba(255,255,255,.8)" }}>Pending (open)</span>
              <div className="p-2 bg-white/20 text-white rounded-xl"><AlertCircle className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-semibold text-white">{openComplaints}</h2>
          </div>
        </div>

        {/* User Management */}
        <div className="dc-surface overflow-hidden" style={{ padding: 0 }}>
          <div className="p-6 flex justify-between items-center" style={{ borderBottom: "1.5px solid rgba(18,21,15,.14)" }}>
            <h3 className="font-semibold text-slate-800 text-lg">System users</h3>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(18,21,15,.1)" }}>
            {recentUsers.map(user => (
              <div key={user.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-lg">{user.name}</p>
                  <p className="text-sm text-slate-500 font-mono">{user.email || user.mobileNumber}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                    user.role === 'ADMIN' ? 'bg-slate-800 text-white' :
                    user.role === 'FIELD_WORKER' ? 'bg-accent/20 text-accent' :
                    'bg-gray-100 text-slate-500'
                  }`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
