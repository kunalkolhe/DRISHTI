"use client";

import { useState } from "react";
import { registerUser, loginUser } from "@/app/actions/auth";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        setSuccessMsg("Logged in. Redirecting…");
        setTimeout(() => {
          if (result.user?.role === "ADMIN") {
            window.location.href = "/admin";
          } else if (result.user?.role === "FIELD_WORKER") {
            window.location.href = "/worker";
          } else {
            window.location.href = "/";
          }
        }, 500);
      } else {
        setSuccessMsg("Account created. You can sign in now.");
        setIsLogin(true);
      }
    } else {
      setErrorMsg(result.error || "Authentication failed.");
    }

    setLoading(false);
  }

  const tab = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "16px 0",
    fontWeight: 600,
    fontSize: 14,
    background: active ? "#fefcf5" : "transparent",
    color: active ? "#0d5347" : "#8a8676",
    borderTopStyle: "none",
    borderLeftStyle: "none",
    borderRightStyle: "none",
    borderBottomWidth: "2px",
    borderBottomStyle: "solid",
    borderBottomColor: active ? "#0d5347" : "transparent",
    cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#eee8da", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="dc-eyebrow" style={{ marginBottom: 20 }}>
        {isLogin ? "Welcome back" : "Join DRISHTI"}
      </div>

      <div className="dc-surface" style={{ width: "100%", maxWidth: 440, overflow: "hidden", padding: 0 }}>
        <div style={{ display: "flex", borderBottomWidth: "1.5px", borderBottomStyle: "solid", borderBottomColor: "rgba(18,21,15,.22)" }}>
          <button type="button" onClick={() => { setIsLogin(false); setErrorMsg(""); setSuccessMsg(""); }} style={tab(!isLogin)}>
            Create account
          </button>
          <button type="button" onClick={() => { setIsLogin(true); setErrorMsg(""); setSuccessMsg(""); }} style={tab(isLogin)}>
            Sign in
          </button>
        </div>

        <div style={{ padding: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.04em", margin: 0 }}>
            {isLogin ? "Sign in to track your reports" : "Register to report civic issues"}
          </h1>
          <p style={{ color: "#6a6555", fontSize: 14.5, margin: "8px 0 0" }}>
            Only your mobile number and complaint history are stored.
          </p>

          {errorMsg && (
            <div style={{ marginTop: 22, padding: 14, borderRadius: 14, background: "rgba(178,60,46,.1)", border: "1.5px solid rgba(178,60,46,.3)", color: "#b23c2e", fontSize: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ marginTop: 22, padding: 14, borderRadius: 14, background: "rgba(13,83,71,.1)", border: "1.5px solid rgba(13,83,71,.3)", color: "#0d5347", fontSize: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <CheckCircle2 className="w-5 h-5 shrink-0" /> {successMsg}
            </div>
          )}

          <form action={handleSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            {!isLogin && (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="dc-mono">Full name</span>
                  <input type="text" name="name" required placeholder="Jane Doe" className="dc-field" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="dc-mono">Email address (optional)</span>
                  <input type="email" name="email" placeholder="jane@example.com" className="dc-field" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="dc-mono">Account type</span>
                  <select name="role" required className="dc-field">
                    <option value="CITIZEN">Citizen — report issues</option>
                    <option value="FIELD_WORKER">Field worker — resolve issues</option>
                    <option value="ADMIN">Administrator — manage system</option>
                  </select>
                </label>
              </>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="dc-mono">{isLogin ? "Mobile number or email" : "Mobile number"}</span>
              <input
                type={isLogin ? "text" : "tel"}
                name={isLogin ? "identifier" : "mobileNumber"}
                required
                placeholder={isLogin ? "Enter mobile or email" : "9999999999"}
                className="dc-field"
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="dc-mono">Password</span>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} name="password" required placeholder="••••••••" className="dc-field" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "#8a8676" }}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading} className="dc-pill" style={{ minHeight: 56, fontSize: 17, marginTop: 4 }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
