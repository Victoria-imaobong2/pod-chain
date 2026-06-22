import Link from 'next/link';
export default function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">
        POD Chain
      </h1>
      <nav className="flex flex-col gap-2 selection">
        <Link href="/dashboard">Sender Dashboard</Link>
        <Link href="/receiver-dashboard">Receiver Dashboard</Link>
        <Link href="/scan">Scan QR Code</Link>
      </nav>
    </main>
  );
}