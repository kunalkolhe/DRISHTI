import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default async function MyReportsPage() {
  // Fetch complaints specifically for our hardcoded test citizen
  const userReports = await prisma.complaint.findMany({
    where: {
      citizen: { email: "john.doe@example.com" }
    },
    orderBy: { createdAt: "desc" },
    include: { asset: true }
  });

  return (
    <div className="min-h-screen bg-background selection:bg-accent/20">
      
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-display font-extrabold text-slate-800">Your Report History</h1>
          <p className="text-slate-500 mt-2">Track the status of infrastructure issues you have reported to the city.</p>
        </div>

        {userReports.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">No reports yet</h3>
            <p className="text-slate-500 mb-6">You haven't reported any issues in your city yet.</p>
            <Link href="/report" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {userReports.map((report) => (
              <div key={report.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                
                {/* Photo Section */}
                <div className="w-full md:w-48 h-48 bg-gray-100 relative shrink-0">
                  {report.originalPhotoUrl ? (
                    <Image 
                      src={report.originalPhotoUrl.startsWith('http') ? report.originalPhotoUrl : `/${report.originalPhotoUrl}`} 
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
