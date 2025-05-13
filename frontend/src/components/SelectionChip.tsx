"use client";

import { FaEnvelope } from "react-icons/fa";

interface SelectionChipProps {
  count: number;
  onClick: () => void;
}

export default function SelectionChip({ count, onClick }: SelectionChipProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full shadow-lg flex items-center space-x-2 transition-all z-40"
      aria-label="Compose email"
      data-oid="1o2l:z6"
    >
      <FaEnvelope data-oid="llnl.gd" />
      <span className="font-medium" data-oid="fzy829x">
        {count} Selected
      </span>
    </button>
  );
}
