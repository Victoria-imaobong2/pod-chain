"use client";

import React, {useState} from 'react';
import { Plus, Wallet, Truck, ArrowUpRight, CheckCircle2, Clock, X} from 'lucide-react';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingActionButton from '@/components/sender/FloatingActionButton';
import StatusBadge from '@/components/shared/StatusBadge';
//Mock data to be used for recent deliveries


export default function SenderDashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [recentDeliveries, setRecentDeliveries] = useState([
{ id: "POD-001", receiver: "0x111C......YU", status: "Delivered", timestamp: "2024-06-01 14:30", item: "Groceries", address: "123 royce street, Cityville" },
{ id: "POD-002", receiver: "0x111C......YD", status: "Delivered", timestamp: "2024-06-01 14:30", item: "Groceries", address: "123 Item Street, Owerri" },
{ id: "POD-003", receiver: "0x222D......AB", status: "In Transit", timestamp: "2024-06-02 10:15", item: "Electronics", address: "789 Oak Ave, Villagetown" },
{ id: "POD-004", receiver: "0x333E......CD", status: "Pending", timestamp: "2024-06-03 09:00", item: "Gadgets", address: "456 Elm St, Townsville" },
]);

const [newItem, setNewItem] = useState('');
const [newAddress, setNewAddress] = useState('');
const [newReceiver, setNewReceiver] = useState('');

    const handleCreateDelivery = () => {
        setIsModalOpen(true);
        alert("Creating delivery and initializing smart contrac.t");
    };  

    const handleSubmitOrder = (e: React.FormEvent) => {
        e.preventDefault();

        const newOrder = {
            id: `POD-00${recentDeliveries.length + 1}`,
            item: newItem,
            address: newAddress,
            receiver: newReceiver.substring(0,10) + "......."
            + newReceiver.substring(newReceiver.length - 4),
            status: "Pending",
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            hash: "Deploying Escrow"
        };

        setRecentDeliveries([newOrder, ...recentDeliveries]);
        setIsModalOpen(false);
        setNewItem('');
        setNewAddress('');
        setNewReceiver('');
    };
    
    return(
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
            {/* Header Section */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-brand-primary tracking-tight">Sender Dashboard</h1>
                    <p className='text-muted-foreground text-sm mt-1'>Your Blockchain-enabled Proof of delivery system</p>
                </div>

                {/*Delivery Buttons*/}
                <FloatingActionButton onClick={handleCreateDelivery} />
                </header>

                {/* Overview Cards */}
                <section className="grid gap-6 md:grid-cols-3">
                    {/*Card 1: Wallet showing Balance*/}
                    <div className="border border-border p-6 rounded-2xl bg-card shadow-xs relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wallet Balance</p>
                                <p className="text-3xl font-bold text-brand-primary">2.30 ETH</p>
                            </div>
                            <div className="p-3 bg-brand-primary/5 rounded-xl text-brand-primary">
                                <Wallet className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="text-success font-medium flex items-center">+120.40 today</span>
                        </div>

                    </div>
                    {/*Card 2: Escrow Locked*/}
                    <div className="border border-border p-6 rounded-2xl bg-card shadow-xs">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funds in Escrow</p>
                                <p className="text-3xl font-bold text-brand-primary mt-2">0.85 ETH</p>
                            </div>
                            <div className="p-3 bg-brand-accent/5 rounded-xl text-brand-accent">
                            <ArrowUpRight className="w-6 h-6" />
                            </div>

                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Locked until active deliveries are completed.
                        </p>
                    </div>

                    {/*Card 3: Active Deliveries*/}
                    <div className="border border-border p-6 rounded-2xl bg-card shadow-xs">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Deliveries</p>
                                <p className="text-3xl font-bold text-brand-accent mt-2">04</p>
                            </div>
                            <div className="p-3 bg-success/5 rounded-xl text-success">
                                <Truck className="w-6 h-6" />
                            </div>

                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Deliveries currently in transit.
                        </p>
                    </div>


                </section>

                {/*RECENT DELIVERIES SECTION*/}
                <section className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-bold text-brand-primary">Recent Deliveries</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            A dated overview of your latest pod shipments
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                                <th className="p-4">POD ID</th>
                                 <th className="p-4">Contents</th>
                                 <th className="p-4">Receiver Address</th>
                                 <th className="p-4">Date</th>
                                 <th className="p-4">Status</th>
                                 <th className="p-4">Hash</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {recentDeliveries.map((delivery) => (
                                    <tr key={delivery.id} className="hover:bg-muted/20 transition colours">
                                        <td className="p-4 font-mono font-semibold text-brand-primary">{delivery.id}</td>
                                        <td className="p-4 text-foreground font-medium">{delivery.item}</td>
                                        <td className="p-4 text-muted-foreground">{delivery.address}</td>
                                        <td className="p-4">{delivery.timestamp}</td>

                                        {/* Status Badge Component */}
                                        <td className="p-4 text-right">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                delivery.status === "Delivered"
                                                ? "bg-success/10 text-success border-success/20"
                                                : delivery.status === "In Transit"
                                                ? "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
                                                : "bg-warning/10 text-warning border-warning/20"
                                            }`}>
                                                {delivery.status === "Delivered" && <CheckCircle2 className="w-3 h-3" />}
                                                {delivery.status ==="In Transit" && <Truck className="w-3 h-3" />}
                                                {delivery.status ===  "Pending" && <Clock className="w-3 h-3" />}
                                                {delivery.status}
                                            </span>
                                            </td>
                                        <td className="p-4">{delivery.receiver}</td>
                                    </tr>
                                ))

                                    }
                            </tbody>
                        </table>
                    </div>

                </section>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Initialize New Smart Contract Escrow</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Item Description</label>
                    <input type="text" required value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="e.g., Organic Cosmetics Kit" className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500 text-slate-900 bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Delivery Destination Address</label>
                <input type="text" required value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="e.g., 14 Douglas Road, Owerri" className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500 text-slate-900 bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Receiver Wallet Target (0x...)</label>
                <input type="text" required value={newReceiver} onChange={(e) => setNewReceiver(e.target.value)} placeholder="0x..." className="w-full p-2.5 border rounded-xl font-mono outline-none focus:border-teal-500 text-slate-900 bg-slate-50 focus:bg-white" />
                </div>
                <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all">Initialize Escrow</button>
            </form>
          </div>
        </div>
         }

         <BottomNav />
     </div>          
    );
}