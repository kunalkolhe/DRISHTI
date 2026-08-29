import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import ResolveClient from "./ResolveClient";

export default async function ResolveIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();

  if (!session || session.role !== "FIELD_WORKER") {
    redirect("/login");
  }

  const { id } = await params;
  const complaintId = parseInt(id);

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { asset: true }
  });

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#eee8da" }}>
        <div className="dc-surface p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-800">Complaint not found</h1>
          <p className="text-slate-500 mt-2">The issue you are trying to resolve does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <ResolveClient 
      complaintId={complaint.id} 
      assetQrCodeId={complaint.asset?.qrCodeId || null} 
    />
  );
}
