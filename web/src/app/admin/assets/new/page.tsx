import AssetForm from "@/components/AssetForm";

export default function NewAssetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            DRISHTI Admin Panel
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Initialize Digital Twins for physical assets in the city grid.
          </p>
        </div>

        <AssetForm />
        
      </div>
    </div>
  );
}
