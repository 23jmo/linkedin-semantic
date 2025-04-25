"use client";

import Image from "next/image";
import { useState } from "react";
import { FaGraduationCap } from "react-icons/fa";

interface SchoolLogoProps {
  logoUrl?: string;
  schoolName?: string;
}

export default function SchoolLogo({ logoUrl, schoolName }: SchoolLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!logoUrl || hasError) {
    return (
      <div
        className="w-10 h-10 rounded flex items-center justify-center bg-gray-100 text-gray-500"
        data-oid="6glh615"
      >
        <FaGraduationCap size={20} data-oid="bkftb95" />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded bg-white p-1 flex items-center justify-center"
      data-oid="6dwhcl2"
    >
      <Image
        width={40}
        height={40}
        src={logoUrl}
        alt={`${schoolName || "School"} logo`}
        className="max-w-full max-h-full object-contain"
        onError={() => setHasError(true)}
        data-oid="52kj69k"
      />
    </div>
  );
}
