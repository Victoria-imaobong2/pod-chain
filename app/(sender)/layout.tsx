"use client";

import React from 'react';
import BottomNav from '@/components/navigation/BottomNav';

export default function SenderLayout({
    children,
}: {
    children: React.ReactNode;
}){
    return(
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
            {children}
            <BottomNav />
        </div>
    )
}