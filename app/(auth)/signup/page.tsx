"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) =>{
        e.preventDefault();
        setLoading(true);
        setError('');

        try{
            const response = await fetch('http://localhost:8000/docs/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'},
                    body: new URLSearchParams({
                        username: email,
                        password: password,
                    }),
            });

            if (!response.ok) {
               const errorData = await response.json(); 
                throw new Error(errorData.detail || 'Login failed');
        }
        const data = await response.json();

        localStorage.setItem("token", data.access_token);
        const role = data.user.role.toLowerCase();
        
        if (role === 'sender'){
            router.push('/dashboard');
        } else if (role === 'receiver')  {
            router.push('/receiver-dashboard');
        }else{
            router.push('/scan');
        }
       
    } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Connection failed. Please try again.';
            setError(message);
    } finally {
        setLoading(false);
    }
    }
    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md  bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-teal-50 rounded-2xl text-teal-700 mb-3">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-950">Create new account</h1>
                    <p className="text-sm text-slate-500 mt-1">Signup to use the secure Logistics proof of delivery app</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium">
                        <AlertTriangle />
                        {error}
                    </div>
                )}
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Email Address</label>
                    <div className="relative">
                        <Mail className='absolute left-3 top 3.5 text-slate-400' size={18}/>
                        <input 
                        type="email"
                        required value = {email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@youremail.com"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500
                        outline-none transition-all text-slate-900"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label  className="text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
                    <div className="relative">
                        <Lock className='absolute left-3 top-3.5 text-slate-400' size={18}/>
                        <input type="password"
                        required value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Put a secure password"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500
                        outline-none transition-all text-slate-900"
                        />
                    </div>
                </div>
                <button 
                type='submit'
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                   {loading ? 'Creating Account...' : 'Create Account'}
                   {!loading && <ArrowRight size={18} />}
                </button>
                </form> 
            </div>
        </main>
    )

}