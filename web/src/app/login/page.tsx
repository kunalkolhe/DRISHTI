"use client";

import { useState } from "react";
import { registerUser, loginUser } from "@/app/actions/auth";
import { Loader2, AlertCircle, CheckCircle2, User, Mail, Phone, Lock, BadgeCheck } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false); // Default to registration since user asked for full name/email
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    let result;
    if (isLogin) {
      result = await loginUser(formData);
    } else {
      result = await registerUser(formData);
    }

    if (result.success) {
      if (isLogin) {
        setSuccessMsg("Logged in successfully! Redirecting...");
        // In a real app, redirect to dashboard
        setTimeout(() => window.location.href = "/", 500);
      } else {
        setSuccessMsg("Account created successfully! You can now log in.");
        setIsLogin(true);
      }
    } else {
      setErrorMsg(result.error || "Authentication failed.");
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-accent/20">
      
      <div className="w-full max-w-md mt-12 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Toggle Header */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => { setIsLogin(false); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-4 font-bold text-sm transition-colors ${!isLogin ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Create Account
          </button>
          <button 
            onClick={() => { setIsLogin(true); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-4 font-bold text-sm transition-colors ${isLogin ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Sign In
          </button>
        </div>

        <div className="p-8">
          
          <div className="mb-8">
            <h2 className="text-2xl font-display font-extrabold text-slate-800">
              {isLogin ? "Welcome back" : "Join DRISHTI"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isLogin ? "Sign in to track your reports." : "Register to report and track civic issues."}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-alert/10 border border-alert/20 text-alert rounded-xl text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-medium flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {successMsg}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            
            {!isLogin && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      name="name" 
                      required={!isLogin} 
                      placeholder="Jane Doe" 
                      className="w-full bg-background border border-gray-200 text-slate-800 text-base rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="jane@example.com (Optional)" 
                      className="w-full bg-background border border-gray-200 text-slate-800 text-base rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Account Type</label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select 
                      name="role" 
                      required={!isLogin}
                      className="w-full bg-background border border-gray-200 text-slate-800 text-base rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                    >
                      <option value="CITIZEN">Citizen (Report Issues)</option>
                      <option value="FIELD_WORKER">Field Worker (Resolve Issues)</option>
                      <option value="ADMIN">Administrator (Manage System)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                {isLogin ? "Mobile Number or Email" : "Mobile Number"}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type={isLogin ? "text" : "tel"} 
                  name={isLogin ? "identifier" : "mobileNumber"} 
                  required 
                  placeholder={isLogin ? "Enter mobile or email" : "9999999999"} 
                  className="w-full bg-background border border-gray-200 text-slate-800 text-base rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                <span>Password</span>
                {isLogin && <a href="#" className="text-primary hover:underline lowercase normal-case">Forgot?</a>}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  name="password" 
                  required 
                  placeholder="••••••••" 
                  className="w-full bg-background border border-gray-200 text-slate-800 text-base rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
            </button>
            
          </form>

        </div>
      </div>
      
    </div>
  );
}
