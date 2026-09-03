"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  LayoutDashboard,
  ShieldCheck,
  QrCode,
  LogIn,
  Mail,
  Lock,
  X,
  ArrowRight,
  User,
} from "lucide-react";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();
  const { connected, publicKey, disconnect } = useWallet();
  const address = publicKey ? publicKey.toBase58() : null;

  // Modal State
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Selected role
  const [selectedRole, setSelectedRole] = useState<
    "sender" | "receiver" | "courier" | null
  >(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleRoleClick = (role: "sender" | "receiver" | "courier") => {
    setSelectedRole(role);
    setIsLoginOpen(true);
  };

  const handleSignupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSignupOpen(false);

    switch (selectedRole) {
      case "sender":
        router.push("/dashboard");
        break;
      case "receiver":
        router.push("/receiver");
        break;
      case "courier":
        router.push("/courier");
        break;
    }
  };

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoginOpen(false);

    switch (selectedRole) {
      case "sender":
        router.push("/dashboard");
        break;
      case "receiver":
        router.push("/receiver");
        break;
      case "courier":
        router.push("/courier");
        break;
    }
  };

  const navHome: {
    name: string;
    role: "sender" | "receiver" | "courier";
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      name: "Sender / SME",
      role: "sender",
      description:
        "Manage parcel deliveries, lock funds in Solana smart escrow, and track orders.",
      icon: <LayoutDashboard size={24} className="text-teal-600" />,
    },
    {
      name: "Receiver",
      role: "receiver",
      description:
        "Track incoming parcels and provide verification codes upon delivery.",
      icon: <ShieldCheck size={24} className="text-teal-600" />,
    },
    {
      name: "Courier",
      role: "courier",
      description:
        "Scan delivery QR codes, confirm handoffs, and claim Solana payouts.",
      icon: <QrCode size={24} className="text-teal-600" />,
    },
  ];

  return (
    <>
      {/* TOP NAVIGATION BAR */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShieldCheck className="text-teal-400" size={22} />
          <span>POD Chain</span>
        </div>
        <div>
          <WalletMultiButton className="!bg-teal-600 hover:!bg-teal-700 !h-9 !px-3 !rounded-xl !text-xs !font-bold" />
        </div>
      </header>

      <main className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        {/* LEFT PANEL */}
        <section className="bg-slate-900 text-white w-full lg:w-5/12 xl:w-4/12 flex items-center p-10">
          <div>
            <h1 className="text-5xl font-bold">POD Chain</h1>
            <p className="mt-6 text-slate-400 leading-relaxed">
              A blockchain-enabled, tamper-evident Proof of Delivery framework
              built on Solana for SME logistics.
            </p>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="flex-1 flex items-center justify-center p-10">
          <div className="w-full max-w-3xl">
            <h2 className="text-2xl font-bold mb-8 text-slate-900">
              Choose Your Role
            </h2>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {navHome.map((item) => (
                <div
                  key={item.role}
                  onClick={() => handleRoleClick(item.role)}
                  className="flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm hover:border-teal-500 hover:shadow-md transition cursor-pointer text-left w-full"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-xl bg-teal-50 p-3">
                        {item.icon}
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {item.name}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-500 mb-6">
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleClick(item.role);
                    }}
                    className="w-full rounded-xl bg-teal-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-teal-700 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn size={18} />
                    Log In as {item.name.split(" ")[0]}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* LOGIN MODAL */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setIsLoginOpen(false);
                setSelectedRole(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
                <LogIn size={24} className="text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold capitalize text-slate-900">
                Login as {selectedRole}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700 cursor-pointer"
              >
                Login
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLoginOpen(false);
                  setIsSignupOpen(true);
                }}
                className="font-semibold text-teal-600 hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNUP MODAL */}
      {isSignupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <button
              type="button"
              onClick={() => setIsSignupOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
                <ShieldCheck size={24} className="text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 capitalize">
                Sign Up as {selectedRole}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Create your account to get started.
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="signup-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Solana Wallet Option */}
              {selectedRole !== "receiver" && (
                <div className="pt-2">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700">
                    Connect Solana Wallet (Optional)
                  </span>

                  {connected && address ? (
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-slate-800 text-teal-400 px-3 py-1.5 rounded-lg border border-slate-700">
                        {address.slice(0, 4)}...{address.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => disconnect()}
                        className="text-xs text-red-500 hover:text-red-400 font-semibold px-2.5 py-1.5 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <WalletMultiButton className="!bg-teal-600 hover:!bg-teal-700 !h-9 !px-3 !rounded-xl !text-xs !font-bold" />
                  )}
                </div>
              )}

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700 cursor-pointer"
              >
                Create Account
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignupOpen(false);
                  setIsLoginOpen(true);
                }}
                className="font-semibold text-teal-600 hover:underline cursor-pointer"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}