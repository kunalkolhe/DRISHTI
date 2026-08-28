import Link from "next/link";
import { getSession, logoutUser } from "@/app/actions/auth";
import { UserCircle, LogOut } from "lucide-react";

export default async function Navbar() {
  const session = await getSession();

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-display font-bold text-xl">D</div>
          <span className="font-display font-extrabold text-xl tracking-tight text-primary hidden sm:inline-block">DRISHTI</span>
        </Link>
        
        <nav className="flex gap-4 text-sm font-semibold text-slate-600 items-center">
          <Link href="/scorecard" className="px-4 py-2 rounded-full border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all hidden md:inline-block">Scorecard</Link>
          
          {!session ? (
            <>
              <Link href="/login" className="px-4 py-2 rounded-full border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all">Login</Link>
              <Link href="/login" className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-all">Register</Link>
            </>
          ) : (
            <>
              {session.role === 'CITIZEN' && (
                <Link href="/my-reports" className="px-4 py-2 rounded-full border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all">My Reports</Link>
              )}
              {session.role === 'FIELD_WORKER' && (
                <Link href="/worker" className="px-4 py-2 rounded-full bg-accent text-white hover:bg-accent/90 transition-all">Worker Dashboard</Link>
              )}
              {session.role === 'ADMIN' && (
                <Link href="/admin" className="px-4 py-2 rounded-full bg-slate-800 text-white hover:bg-slate-900 transition-all">Admin Panel</Link>
              )}
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200 ml-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <UserCircle className="w-5 h-5 text-primary" />
                  <span className="font-bold hidden sm:inline-block">{session.name}</span>
                </div>
                <form action={logoutUser}>
                  <button type="submit" className="text-slate-400 hover:text-alert transition-colors p-1" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
