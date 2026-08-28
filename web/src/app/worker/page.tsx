import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, MapPin } from "lucide-react";
import Image from "next/image";

export default async function WorkerDashboard() {
  const session = await getSession();
  
  if (!session || session.role !== 'FIELD_WORKER') {
    redirect("/login");
  }

  // Fetch OPEN and ROUTED complaints
  const tasks = await prisma.complaint.findMany({
    where: {
      status: { in: ['OPEN', 'ROUTED'] }
    },
    orderBy: { createdAt: "desc" },
    include: { asset: true }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-slate-800">Worker Dashboard</h1>
            <p className="text-slate-500 mt-2">Welcome back, {session.name}. Here are your pending field tasks.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex gap-4">
            <div className="text-center">
              <span className="block text-2xl font-black text-primary">{tasks.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="font-bold text-xl text-slate-800">All caught up!</h3>
              <p className="text-slate-500">There are no pending complaints to resolve right now.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="h-48 bg-gray-100 relative w-full">
                  {task.originalPhotoUrl ? (
                    <Image 
                      src={task.originalPhotoUrl.startsWith('http') ? task.originalPhotoUrl : `/${task.originalPhotoUrl}`} 
                      alt="Issue" 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">No Photo</div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm backdrop-blur-md ${task.severity === 'HIGH' ? 'bg-alert text-white' : 'bg-accent text-white'}`}>
                      {task.severity} SEVERITY
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1">
                      {task.asset ? task.asset.category.replace('_', ' ') : "General Infrastructure"} Issue
                    </h3>
                    <div className="flex items-start gap-2 text-sm text-slate-600 mb-4">
                      <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                      <span>{task.address ? task.address : (task.asset ? `Asset: ${task.asset.qrCodeId}` : "Unknown Location")}</span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-gray-100">"{task.description}"</p>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                    <button className="bg-success text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-success/90 transition-colors shadow-lg shadow-success/20">
                      Resolve Issue
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
