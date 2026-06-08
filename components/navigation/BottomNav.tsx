import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {Home, ShieldCheck, History, QrCode, LayoutDashboard, PlusCircle} from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();
const navItems = [
    { id: "home", label: "Home", href: "/sender/dashboard", icon: LayoutDashboard},
    { id: "Create", label : "Create", href: "/sender/create-delivery", icon: PlusCircle},
    { id: "History", label : "History", href: "/sender/history", icon: History},
    { id : "Wallet", label : "Wallet", href: "/sender/wallet", icon: ShieldCheck},
];

return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background">
        <div className="flex justify-around p-2">
            {navItems.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                            pathname === item.href
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs mt-1">{item.label} 
                        </span>
                    </Link>
                );
            })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]  bg-transparent" />
    </nav>
);
}