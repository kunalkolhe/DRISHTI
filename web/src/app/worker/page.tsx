import { prisma } from "@/lib/prisma";
import { getSession, logoutUser } from "@/app/actions/auth";
import { setWorkerArea } from "@/app/actions/workerArea";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, Navigation, FileCheck, LogOut, Home, CheckSquare, AlertTriangle, PlusCircle, Wrench, CreditCard, MapPinned } from "lucide-react";
import Image from "next/image";
import NearbyAssets from "./NearbyAssets";
import AddAsset from "./AddAsset";
import MaintenanceDue from "./MaintenanceDue";
import WorkerIdCard from "@/components/WorkerIdCard";
import { prettyCategory } from "@/lib/assetTypes";

const AREA_STOPWORDS = new Set([
  "near", "opposite", "opp", "main", "gate", "road", "street", "cross", "behind",
  "next", "the", "and", "bus", "stand", "station", "chowk", "circle", "junction",
  "gps", "location", "attached", "front", "side", "corner", "lane", "colony",
]);

/** Pull area-like keywords out of the free-text complaint addresses. */
function deriveAreas(addresses: (string | null)[]): string[] {
  const set = new Set<string>();
  for (const raw of addresses) {
    if (!raw) continue;
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) set.add(parts[parts.length - 1]);
    for (const w of raw.split(/[\s,()]+/)) {
      const t = w.replace(/[^A-Za-z]/g, "");
      if (t.length > 3 && !AREA_STOPWORDS.has(t.toLowerCase())) set.add(t);
    }
  }
  return [...set]
    .filter((s) => s && !/^\d/.test(s))
    .map((s) => s.replace(/\s+/g, " ").trim())
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 40);
}

const MS_DAY = 86400000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMaintenanceList(allAssets: any[], workerArea: string | null, filter: string) {
  const now = Date.now();
  let scheduled = allAssets
    .filter((a) => a.lastMaintenanceDate && a.maintenanceIntervalDays)
    .map((a) => {
      const nextDue = new Date(a.lastMaintenanceDate.getTime() + a.maintenanceIntervalDays * MS_DAY);
      return { ...a, _nextDue: nextDue.toISOString(), _dueInDays: Math.round((nextDue.getTime() - now) / MS_DAY) };
    });

  if (workerArea) {
    const wa = workerArea.toLowerCase();
    scheduled = scheduled.filter((a) => !a.area || a.area.toLowerCase().includes(wa));
  }

  const counts = {
    overdue: scheduled.filter((a) => a._dueInDays < 0).length,
    soon: scheduled.filter((a) => a._dueInDays >= 0 && a._dueInDays <= 7).length,
    all: scheduled.length,
  };

  const list = scheduled
    .filter((a) => (filter === "all" ? true : filter === "overdue" ? a._dueInDays < 0 : a._dueInDays <= 7))
    .sort((a, b) => a._dueInDays - b._dueInDays);

  return { list, counts };
}

function getSLA(createdAt: Date, severity: string | null) {
  const hours = severity === 'HIGH' ? 24 : severity === 'MEDIUM' ? 72 : 168; 
  const deadline = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
  const now = new Date();
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 0) return { text: `${Math.abs(Math.round(diffHours))}h OVERDUE`, urgent: true };
  return { text: `${Math.round(diffHours)}h remaining`, urgent: diffHours < 12 };
}

export default async function WorkerDashboard({ searchParams }: { searchParams: Promise<{ tab?: string; filter?: string }> }) {
  const session = await getSession();
  
  if (!session || session.role !== 'FIELD_WORKER') {
    redirect("/login");
  }

  const params = await searchParams;
  const activeTab = params.tab || 'assigned';

  const hdrs = await headers();
  const host = hdrs.get("host");
  const origin = host ? `${hdrs.get("x-forwarded-proto") || "http"}://${host}` : "";

  // Worker's allocated area (self-selected, remembered in a cookie)
  const workerArea = (await cookies()).get("worker_area")?.value?.trim() || null;
  const complaintTab = ['assigned', 'reopened', 'pending', 'completed'].includes(activeTab);
  const needsArea = complaintTab && !workerArea;

  // Options to help the worker pick their area
  const areaSuggestions =
    complaintTab
      ? deriveAreas(
          (
            await prisma.complaint.findMany({
              where: { address: { not: null } },
              select: { address: true },
              distinct: ["address"],
              take: 300,
            })
          ).map((r) => r.address),
        )
      : [];

  // Full worker record for the ID card
  const workerCard =
    activeTab === 'id-card'
      ? await prisma.user.findUnique({
          where: { id: session.id },
          select: { id: true, name: true, email: true, mobileNumber: true, role: true, department: true, photoUrl: true, trustScore: true, createdAt: true },
        })
      : null;

  // 1. Fetch Assets for 'nearby' tab
  let assets: any[] = [];
  if (activeTab === 'nearby') {
    assets = await prisma.asset.findMany();
  }

  let maintenanceAssets: any[] = [];
  let maintenanceCounts = { overdue: 0, soon: 0, all: 0 };
  const maintFilter = params.filter === 'overdue' || params.filter === 'all' ? params.filter : 'due';
  if (activeTab === 'maintenance') {
    const built = buildMaintenanceList(await prisma.asset.findMany(), workerArea, maintFilter);
    maintenanceAssets = built.list;
    maintenanceCounts = built.counts;
  }

  // 2. Fetch Tasks for complaint tabs — scoped to the worker's allocated area
  let tasks: any[] = [];
  if (complaintTab && workerArea) {
    // "My Tasks" = new + routed complaints in the area the worker can pick up
    let statusFilter: any = { in: ['OPEN', 'ROUTED'] };

    if (activeTab === 'reopened') statusFilter = 'REOPENED';
    if (activeTab === 'pending') statusFilter = 'FIXED_PENDING_CONFIRMATION';
    if (activeTab === 'completed') statusFilter = 'CLOSED';

    tasks = await prisma.complaint.findMany({
      where: {
        status: statusFilter,
        address: { contains: workerArea, mode: "insensitive" },
      },
      include: { asset: true }
    });

    if (activeTab === 'assigned' || activeTab === 'reopened') {
      tasks.sort((a, b) => {
        const order = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        const aScore = order[a.severity as keyof typeof order] || 4;
        const bScore = order[b.severity as keyof typeof order] || 4;
        if (aScore !== bScore) return aScore - bScore;
        return a.createdAt.getTime() - b.createdAt.getTime(); 
      });
    } else {
      tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  // Define Navigation Items
  const navItems = [
    { id: 'assigned', label: 'My Tasks', icon: Home },
    { id: 'nearby', label: 'Nearby Assets', icon: MapPin },
    { id: 'maintenance', label: 'Maintenance Due', icon: Wrench },
    { id: 'add-asset', label: 'Add Asset', icon: PlusCircle },
    { id: 'reopened', label: 'Reopened', icon: AlertTriangle },
    { id: 'pending', label: 'Awaiting', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckSquare },
    { id: 'id-card', label: 'My ID Card', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#eee8da" }}>

      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72" style={{ background: "#0d5347", color: "#f8fbf0", borderRight: "1.5px solid rgba(18,21,15,.5)" }}>
        <div className="p-8">
          <h1 className="text-2xl font-display font-semibold text-white" style={{ letterSpacing: "-0.04em" }}>DRISHTI <span style={{ color: "#dee8c4", fontWeight: 400 }}>Worker</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <Link 
              key={item.id} 
              href={`?tab=${item.id}`} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === item.id ? 'bg-white/20 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </Link>
          ))}
        </nav>

        {/* Profile Card */}
        <div className="p-4 m-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-lg">
              {session.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{session.name}</p>
              <p className="text-xs text-slate-400">Field Worker</p>
            </div>
          </div>
          <form action={logoutUser}>
            <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
          
          <header className="mb-8">
            <div className="dc-eyebrow mb-3">Field worker</div>
            <h2 className="text-3xl font-display font-semibold text-slate-800" style={{ letterSpacing: "-0.04em" }}>
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 mt-2">
              {activeTab === 'nearby' ? "Infrastructure near your current location." :
               activeTab === 'add-asset' ? "Register a new asset and generate its digital twin." :
               activeTab === 'maintenance' ? "Proactive servicing schedule for assets." :
               activeTab === 'id-card' ? "Your DRISHTI worker credential — carry it on site." :
               !workerArea ? "Select your allocated area to see complaints." :
               `${tasks.length} ${tasks.length === 1 ? 'complaint' : 'complaints'} in ${workerArea}.`}
            </p>
          </header>

          {/* Allocated-area control (complaint tabs only) */}
          {complaintTab && workerArea && (
            <form action={setWorkerArea} className="dc-surface-soft p-4 mb-6 flex flex-wrap items-center gap-3">
              <span className="dc-mono flex items-center gap-1.5">
                <MapPinned className="w-3.5 h-3.5" /> Allocated area
              </span>
              <span className="dc-badge">{workerArea}</span>
              <input
                list="worker-area-options"
                name="area"
                defaultValue={workerArea}
                placeholder="Change area…"
                className="dc-field"
                style={{ maxWidth: 220, padding: "8px 12px" }}
              />
              <button type="submit" className="dc-pill-ghost text-sm" style={{ minHeight: 38, padding: "0 16px" }}>
                Update
              </button>
            </form>
          )}
          <datalist id="worker-area-options">
            {areaSuggestions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>

          {/* Conditional Rendering based on Tab */}
          {activeTab === 'nearby' ? (
            <NearbyAssets assets={assets} />
          ) : activeTab === 'add-asset' ? (
            <AddAsset origin={origin} />
          ) : activeTab === 'maintenance' ? (
            <MaintenanceDue assets={maintenanceAssets} counts={maintenanceCounts} filter={maintFilter} workerArea={workerArea} />
          ) : activeTab === 'id-card' ? (
            workerCard ? <WorkerIdCard worker={workerCard} origin={origin} /> : <p className="text-slate-500">Could not load your credential.</p>
          ) : needsArea ? (
            <div className="dc-surface p-8 max-w-lg">
              <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4" style={{ background: "#dee8c4", border: "1.5px solid #0d5347" }}>
                <MapPinned className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-slate-800">Set your allocated area</h3>
              <p className="text-slate-500 mt-1 text-sm">
                You will only see complaints filed at that location. You can change it any time.
              </p>
              <form action={setWorkerArea} className="mt-5 flex flex-col sm:flex-row gap-3">
                <input
                  list="worker-area-options"
                  name="area"
                  required
                  placeholder="e.g. Nashik, Kothrud, Ward 18…"
                  className="dc-field"
                />
                <button type="submit" className="dc-pill" style={{ minHeight: 48, padding: "0 24px" }}>
                  Save area
                </button>
              </form>
              {areaSuggestions.length > 0 && (
                <p className="dc-mono mt-4" style={{ textTransform: "none", letterSpacing: 0 }}>
                  Seen in complaints: {areaSuggestions.slice(0, 10).join(" · ")}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tasks.length === 0 ? (
                <div className="col-span-full p-12 text-center dc-surface flex flex-col items-center">
                  <CheckCircle2 className="w-16 h-16 text-success/50 mb-4" />
                  <h3 className="font-semibold text-xl text-slate-800">Nothing in {workerArea}</h3>
                  <p className="text-slate-500 mt-1">No complaints in this category for your area right now.</p>
                </div>
              ) : (
                tasks.map(task => {
                  const sla = getSLA(task.createdAt, task.severity);
                  const mapLink = `https://www.google.com/maps/dir/?api=1&destination=${task.gpsLat || task.asset?.gpsLat || 0},${task.gpsLon || task.asset?.gpsLon || 0}`;
                  
                  return (
                    <div key={task.id} className="dc-surface overflow-hidden flex flex-col" style={{ padding: 0 }}>
                      {/* Image Header */}
                      <Link href={`/worker/resolve/${task.id}`} className="h-48 bg-gray-100 relative w-full block cursor-pointer hover:opacity-95 transition-opacity">
                        {task.originalPhotoUrl ? (
                          <Image 
                            src={task.originalPhotoUrl.startsWith('http') ? task.originalPhotoUrl : (task.originalPhotoUrl.startsWith('/') ? task.originalPhotoUrl : `/${task.originalPhotoUrl}`)} 
                            alt="Issue" 
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300">No Photo</div>
                        )}
                        
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm backdrop-blur-md ${task.severity === 'HIGH' ? 'bg-alert text-white' : task.severity === 'MEDIUM' ? 'bg-accent text-white' : 'bg-success text-white'}`}>
                            {task.severity}
                          </span>
                        </div>
                      </Link>
                      
                      <div className="p-6 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-slate-800">
                              {task.asset ? prettyCategory(task.asset.category) : "General issue"}
                            </h3>
                            {(activeTab === 'assigned' || activeTab === 'reopened') && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-md ${sla.urgent ? 'bg-alert/10 text-alert animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                                {sla.text}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-2 text-sm text-slate-600 mb-4">
                            <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                            <span>{task.address ? task.address : (task.asset ? `Asset Tag: ${task.asset.qrCodeId}` : "Unknown Location")}</span>
                          </div>

                          {task.description && (
                            <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-gray-100 mb-4">&ldquo;{task.description}&rdquo;</p>
                          )}

                          {activeTab === 'reopened' && (
                            <p className="text-sm p-3 rounded-lg mb-4" style={{ background: "rgba(178,60,46,.08)", border: "1.5px solid rgba(178,60,46,.25)", color: "#8c2c22" }}>
                              <span className="dc-mono" style={{ color: "#8c2c22" }}>Citizen sent it back</span>
                              {task.reopenReason ? ` — "${task.reopenReason}"` : " — reason not given."}
                              {task.reopenCount > 1 ? ` (×${task.reopenCount})` : ""}
                            </p>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-4 flex justify-between items-center gap-3" style={{ borderTop: "1.5px solid rgba(18,21,15,.12)" }}>
                          <a href={mapLink} target="_blank" rel="noopener noreferrer" className="dc-pill-ghost flex-1 text-sm" style={{ minHeight: 44 }}>
                            <Navigation className="w-4 h-4" /> Route
                          </a>

                          {(activeTab === 'assigned' || activeTab === 'reopened') && (
                            <Link href={`/worker/resolve/${task.id}`} className="dc-pill flex-1 text-sm" style={{ minHeight: 44 }}>
                              <CheckCircle2 className="w-4 h-4" /> Resolve
                            </Link>
                          )}

                          {activeTab === 'pending' && (
                            <div className="flex-1 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-semibold cursor-default" style={{ background: "rgba(13,83,71,.1)", color: "#0d5347" }}>
                              <Clock className="w-4 h-4" /> Waiting
                            </div>
                          )}

                          {activeTab === 'completed' && (
                            <div className="flex-1 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-semibold cursor-default" style={{ background: "rgba(13,83,71,.1)", color: "#0d5347" }}>
                              <FileCheck className="w-4 h-4" /> Closed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-50 flex items-center justify-around px-2 py-3 pb-safe">
        {navItems.map(item => (
          <Link 
            key={item.id} 
            href={`?tab=${item.id}`} 
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === item.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <item.icon className={`w-6 h-6 mb-1 ${activeTab === item.id ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        ))}
        {/* Mobile Logout */}
        <form action={logoutUser} className="flex flex-col items-center">
          <button type="submit" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-alert transition-colors">
            <LogOut className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Exit</span>
          </button>
        </form>
      </nav>

    </div>
  );
}
