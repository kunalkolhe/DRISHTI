import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default async function MyReportsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch complaints for the currently logged in citizen
  const userReports = await prisma.complaint.findMany({
    where: {
      citizenId: session.id
    },
    orderBy: { createdAt: "desc" },
    include: { asset: true }
  });

  return (
    <div className="min-h-screen" style={{ background: "#eee8da" }}>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="dc-eyebrow mb-4">Your reports</div>
          <h1 className="text-3xl font-display font-semibold text-slate-800" style={{ letterSpacing: "-0.04em" }}>Report history</h1>
          <p className="text-slate-500 mt-2">Track every issue you have reported — and cast the final vote when it&apos;s fixed.</p>
        </div>

        {userReports.length === 0 ? (
          <div className="dc-surface p-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dee8c4", border: "1.5px solid rgba(13,83,71,.35)" }}>
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-slate-800 mb-2">No reports yet</h3>
            <p className="text-slate-500 mb-6">You haven&apos;t reported any issues in your city yet.</p>
            <Link href="/report" className="dc-pill" style={{ padding: "0 24px", minHeight: 50 }}>
              Report an issue
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {userReports.map((report) => (
              <div key={report.id} className="dc-surface overflow-hidden flex flex-col md:flex-row" style={{ padding: 0 }}>
                
                {/* Photo Section */}
                <div className="w-full md:w-48 h-48 bg-gray-100 relative shrink-0">
                  {report.originalPhotoUrl ? (
                    <Image 
                      src={report.originalPhotoUrl.startsWith('http') ? report.originalPhotoUrl : (report.originalPhotoUrl.startsWith('/') ? report.originalPhotoUrl : `/${report.originalPhotoUrl}`)} 
                      alt="Report evidence" 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      No Photo
                    </div>
                  )}
                  
                  {/* Status Badge Overlaid on Image */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-sm backdrop-blur-md ${
                      report.status === 'OPEN' ? 'bg-alert text-white' :
                      report.status === 'ROUTED' ? 'bg-accent text-white' :
                      'bg-success text-white'
                    }`}>
                      {report.status === 'OPEN' && <AlertCircle className="w-3 h-3" />}
                      {report.status === 'ROUTED' && <Clock className="w-3 h-3" />}
                      {report.status === 'CLOSED' && <CheckCircle2 className="w-3 h-3" />}
                      {report.status}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 flex-grow flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-slate-800">
                      {report.asset ? report.asset.category.replace('_', ' ') : "Unregistered Asset"} Issue
                    </h3>
                    <span className="text-sm font-semibold text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                      <span>
                        {report.address ? report.address : (report.asset ? `Asset ID: ${report.asset.qrCodeId}` : "Location not provided")}
                      </span>
                    </div>
                    
                    {report.description && (
                      <div className="text-sm text-slate-500 italic mt-2 bg-slate-50 p-3 rounded-lg border border-gray-100">
                        "{report.description}"
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
