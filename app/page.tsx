"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  QrCode,
  LogIn,
  Mail,
  Lock,
  X,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

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
  

  const handleRoleClick = (
    role: "sender" | "receiver" | "courier"
  ) => {
    setSelectedRole(role);
    setIsLoginOpen(true);
  };

  const handleSignupSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    console.log("Signup", {
      email,
      password,
      name,
      selectedRole,
    });

    setIsSignupOpen(false);
  };

  const handleLoginSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    console.log("Login", {
      email,
      password,
      selectedRole,
    });

    setIsLoginOpen(false);

    switch (selectedRole) {
      case "sender":
        router.push("/dashboard");
        break;

      case "receiver":
        router.push("/receiver");
        break;

      case "courier":
        router.push("/scan");
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
      name: "Sender Dashboard",
      role: "sender",
      description:
        "Access your sender dashboard to manage deliveries and escrow payments.",
      icon: <LayoutDashboard size={24} className="text-teal-600" />,
    },

    {
      name: "Receiver Dashboard",
      role: "receiver",
      description:
        "Track deliveries and securely confirm package receipt.",
      icon: <ShieldCheck size={24} className="text-teal-600" />,
    },

    {
      name: "Courier Dashboard",
      role: "courier",
      description:
        "Scan QR codes and complete deliveries.",
      icon: <QrCode size={24} className="text-teal-600" />,
    },
  ];

  return (
    <>
      <main className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">

        {/* Create Account Button */}
        <div className="absolute top-6 right-6 hidden sm:block z-20">
          <button
            type="button"
            onClick={() => setIsSignupOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow hover:bg-slate-100"
          >
            <LogIn size={18} />
            Create New Account
          </button>
        </div>

        {/* LEFT PANEL */}

        <section className="bg-slate-900 text-white w-full lg:w-5/12 xl:w-4/12 flex items-center p-10">

          <div>

            <h1 className="text-5xl font-bold">
              POD Chain
            </h1>

            <p className="mt-6 text-slate-400 leading-relaxed">
              A blockchain-enabled, tamper-evident
              Proof of Delivery framework designed
              specifically for SME logistics.
            </p>

            <div className="mt-8 sm:hidden">

              <button
                type="button"
                onClick={() => setIsSignupOpen(true)}
                className="bg-teal-600 text-white px-5 py-3 rounded-xl w-full hover:bg-teal-700"
              >
                Create New Account
              </button>

            </div>

          </div>

        </section>

        {/* RIGHT PANEL */}

        <section className="flex-1 flex items-center justify-center p-10">

          <div className="w-full max-w-3xl">

            <h2 className="text-2xl font-bold mb-8">
              Choose Your Role
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {navHome.map((item) => (

                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleRoleClick(item.role)}
                  className="text-left rounded-2xl border bg-white p-6 shadow-sm hover:border-teal-500 hover:shadow-lg transition cursor-pointer"
                >

                  <div className="flex gap-4">

                    <div className="rounded-xl bg-teal-50 p-3">
                      {item.icon}
                    </div>

                    <div className="flex-1">

                      <div className="flex justify-between items-center">

                        <h3 className="font-bold text-slate-900">
                          {item.name}
                        </h3>

                        <ArrowRight
                          size={18}
                          className="text-slate-400"
                        />

                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {item.description}
                      </p>

                    </div>

                  </div>

                </button>

              ))}

            </div>

          </div>

        </section>

      </main>
            {/* ================= SIGNUP MODAL ================= */}

      {isSignupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">

          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

            <button
              type="button"
              onClick={() => setIsSignupOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <div className="mb-8 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">

                <ShieldCheck
                  size={28}
                  className="text-teal-600"
                />

              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Create Account
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create your POD Chain account
              </p>

            </div>

            <form
              onSubmit={handleSignupSubmit}
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="signup-email"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700"
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
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-teal-500"
                  />

                </div>
                

              </div>

              
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-teal-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="Role"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700"
                  >
                    Role
                  </label>
                  <select
                    id="Role"
                    required
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'sender' | 'receiver' | 'courier')}
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-teal-500"
                  >
                    <option value="">Select a role</option>
                    <option value="user">SME/Sender</option>
                    <option value="admin">Receiver/Customer</option>
                    <option value="courier">Courier</option>
                  </select>
                </div>

                <div>

                <label
                  htmlFor="signup-password"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700"
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
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-teal-500"
                  />

                </div>

              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700"
              >
                Create Account
                <ArrowRight size={18} />
              </button>

            </form>

          </div>

        </div>
      )}
            {/* ================= LOGIN MODAL ================= */}

      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">

          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

            <button
              type="button"
              onClick={() => {
                setIsLoginOpen(false);
                setSelectedRole(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <div className="mb-8 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">

                <LogIn
                  size={28}
                  className="text-teal-600"
                />

              </div>

              <h2 className="text-2xl font-bold capitalize text-slate-900">
                Login as {selectedRole}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Enter your credentials to continue.
              </p>

            </div>

            <form
              onSubmit={handleLoginSubmit}
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="login-email"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700"
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
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-teal-500"
                  />

                </div>

              </div>

              <div>

                <label
                  htmlFor="login-password"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700"
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
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-teal-500"
                  />

                </div>

              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700"
              >
                Login
                <ArrowRight size={18} />
              </button>

            </form>

          </div>

        </div>
      )}

    </>
  );
}