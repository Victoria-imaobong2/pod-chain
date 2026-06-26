import Link from 'next/link';
import { LayoutDashboard, ShieldCheck, QrCode, LogIn } from 'lucide-react';
export default function HomePage() {
  
    const navHome = [
      { 
        name: 'Sender Dashboard', 
        href:'/dashboard',
        description: 'Access your sender dashboard to manage deliveries and track your funds in escrow.',
        icon: <LayoutDashboard className="w-6 h-6 text-teal-600" />
        },

      { 
        name: 'Receiver Dashboard', 
        href:'/receiver-dashboard', 
        description: 'Access your receiver dashboard to manage incoming deliveries.', 
        icon: <ShieldCheck className="w-6 h-6 text-teal-600 size={24}" /> },

      { 
        name: 'Courier Dashboard', 
        href:'/scan', 
        description: 'Access your courier dashboard to scan QR codes and manage deliveries.', 
        icon: <QrCode className="w-6 h-6 text-teal-600 size={24}" /> },
    ];

    return (
      <main className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        {/* Login access for big screen */}
        <div className="absolute top-6 right-6 z-10 hidden sm:block">
          <Link href="/login"
          className="inline-flex  items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-md font-semibold text-sm shadow-xs transition-all" >
            <LogIn className="w-4 h-4 text-teal-600" />
            Login to your account
            </Link>
        </div>

        {/* LEFT PANEL */}
        <div className='bg-slate-900 text-white p-8 lg:p-12 flex flex-col justify-center w-full lg:w-5/12 xl:w-4/12'> 
        <div className="max-w-md mx-auto lg:mx-0">
          <h1 className="text-6xl lg:text-5xl tracking-tight font-bold m-8 p-4 text-white size={24}">
            POD Chain
          </h1>
          <p className="mt-4 text-slate-400 text-base lg:text-lg leading-relaxed">
            A blockchain-enabled, tamper-evident Proof of Delivery framework designed specifically for SME local logistics.
          </p>

          <div className="mt-6 sm:hidden">
            <Link href="/login"
            className="inline-flex items-center gap-2 w-full justify-center px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
            >
              <LogIn size={16} />
              Sign In to Your Workspace
            </Link>
          </div>
        </div>
        </div>
        
        {/* RIGHT PANEL */}
        <div className='flex-1 p-6 md:p-12 lg:p-16 flex items-center justify-center'>
          <div className="w-full max-w-md md:max-w-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6 hidden md:block">
              Choose Your Role:
            </h2>

      <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3 gap-2 w-full">
        
        {navHome.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className="block w-full p-4 border border-gray-300 rounded-xl
           bg-white shadow-sm hover:border-teal-500 hover:shadow:md 
           transition-all duration-200 text-teal-600 font-bold text-lg "
        >
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-teal-100 transition-colors">
            {item.icon}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-900 font-bold text-lg group-hover:text-teal-600 transition-colors">
                {item.name}
              </span>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform font-normal">
              →
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1 leading-normal">
              {item.description}
            </p>
          </div>
          </div>  
        </Link>
        ))}
        
      </nav>
      </div>
      </div>
    </main>
  );
}
   
 