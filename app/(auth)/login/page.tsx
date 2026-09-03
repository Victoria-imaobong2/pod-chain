"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

type UserRoleOption = "SME" | "COURIER" | "RECEIVER";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRoleOption>("RECEIVER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pod_receiver_profile");
    localStorage.removeItem("pod_courier_profile");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
          selected_role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Login failed. Please check your credentials."
        );
      }

      if (!data?.access_token) {
        throw new Error(
          "Login succeeded but the backend did not return an access token."
        );
      }

      // 1. Save authentication token and user profile
      localStorage.setItem("token", data.access_token);

      if (data.user) {
        const updatedUser = { ...data.user, role: selectedRole };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      // 2. Set Cookie for Next.js SSR middleware
      document.cookie = `token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;

      // 3. Route explicitly according to chosen role
      const role = String(selectedRole).toUpperCase();

      if (role === "SME") {
        router.push("/dashboard");
      } else if (role === "RECEIVER") {
        router.push("/receiver");
      } else if (role === "COURIER") {
        router.push("/courier");
      } else {
        throw new Error(`Unknown user role returned: ${role}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Connection failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-teal-50 rounded-2xl text-teal-700 mb-3">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">
            Access your secure PodChain workspace
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl mb-6 flex text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedRole("SME")}
            className={`flex-1 py-2.5 rounded-lg transition-all text-center cursor-pointer ${
              selectedRole === "SME"
                ? "bg-white text-teal-700 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Sender
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("COURIER")}
            className={`flex-1 py-2.5 rounded-lg transition-all text-center cursor-pointer ${
              selectedRole === "COURIER"
                ? "bg-white text-teal-700 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Courier
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("RECEIVER")}
            className={`flex-1 py-2.5 rounded-lg transition-all text-center cursor-pointer ${
              selectedRole === "RECEIVER"
                ? "bg-white text-teal-700 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Receiver
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium flex items-center gap-2">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@youremail.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Put a secure password"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Authenticating..." : `Sign In as ${selectedRole === "SME" ? "Sender" : selectedRole === "COURIER" ? "Courier" : "Receiver"}`}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-teal-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}