import React from 'react';
import { Plus } from 'lucide-react'; // If you're using Lucide instead of an emoji!

export default function FloatingActionButton({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-20 right-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 transition-all z-40 focus:outline-none"
      aria-label="Create New Delivery"
    >
      <Plus size={24} />
    </button>
  );
}