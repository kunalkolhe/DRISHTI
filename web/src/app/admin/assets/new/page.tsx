import AssetForm from "@/components/AssetForm";

export default function NewAssetPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: "#eee8da" }}>
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-12 flex flex-col items-center">
          <div className="dc-eyebrow mb-4">Admin · asset registry</div>
          <h1 className="text-4xl font-semibold text-slate-800 sm:text-5xl" style={{ letterSpacing: "-0.045em" }}>
            Register a public asset
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500">
            Initialize a digital twin for a physical asset in the city grid.
          </p>
        </div>

        <AssetForm />
        
      </div>
    </div>
  );
}
