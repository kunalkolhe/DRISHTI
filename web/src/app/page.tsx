import Link from "next/link";
import { QrCode, Smartphone, Settings, BarChart3, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-accent/20">
      
      {/* Hero Section */}
      <main className="flex-grow">
        <section className="max-w-7xl mx-auto px-8 py-20 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-semibold text-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Live in Your City
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold text-primary leading-[1.1]">
              Report broken public facilities in seconds.
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
              DRISHTI gives a unique QR code to streetlights, handpumps, and more. Scan the code to report a problem instantly and track exactly when it gets fixed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/report" className="inline-flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                Report a Problem <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="#how-it-works" className="inline-flex justify-center items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-slate-800 font-semibold py-4 px-8 rounded-xl transition-all">
                See How It Works
              </Link>
            </div>
          </div>

          {/* QR Visual Anchor */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-[3rem] -rotate-6 scale-105" />
            <div className="relative bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col items-center">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                <QrCode className="w-48 h-48 text-primary" strokeWidth={1} />
              </div>
              <div className="w-full space-y-4">
                <div className="h-2 w-1/3 bg-gray-200 rounded-full" />
                <div className="h-2 w-3/4 bg-gray-100 rounded-full" />
                <div className="h-2 w-1/2 bg-gray-100 rounded-full" />
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset #</span>
                  <span className="text-sm font-bold text-primary font-mono">QR-A1B2C3D4</span>
                </div>
              </div>
              
              {/* Floating Status Badge */}
              <div className="absolute -right-6 -bottom-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3">
                <div className="w-3 h-3 bg-alert rounded-full animate-pulse" />
                <span className="font-bold text-sm text-slate-800">Issue Reported</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step Flow */}
        <section id="how-it-works" className="bg-white py-24 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-3xl font-display font-extrabold text-primary text-center mb-16">How DRISHTI Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: QrCode, title: "1. Find a QR Code", desc: "Look for the DRISHTI QR code on broken streetlights, pumps, or public toilets." },
                { icon: Smartphone, title: "2. Scan with Phone", desc: "Just scan the code with your phone camera. You don't need to download an app." },
                { icon: Settings, title: "3. Report the Issue", desc: "Click a photo or record a voice note to tell us what is broken." },
                { icon: BarChart3, title: "4. It Gets Fixed", desc: "The complaint goes directly to the right department, and you can track when it is repaired." },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center text-primary mb-2 shadow-sm border border-gray-50">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <div className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center font-display font-bold text-xs">D</div>
            <span className="font-display font-extrabold text-sm tracking-tight text-primary">DRISHTI</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">© {new Date().getFullYear()} DRISHTI. Built for a better city.</p>
        </div>
      </footer>

    </div>
  );
}
