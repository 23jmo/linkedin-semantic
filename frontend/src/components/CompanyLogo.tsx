"use client";

import Image from "next/image";
import { useState } from "react";
import { FaBuilding } from "react-icons/fa";

interface CompanyLogoProps {
  logoUrl?: string;
  companyName?: string;
}

export default function CompanyLogo({
  logoUrl,
  companyName,
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!logoUrl || hasError) {
    return (
      <div
        className="w-10 h-10 rounded flex items-center justify-center bg-gray-100 text-gray-500"
        data-oid="jj2ivwr"
      >
        <FaBuilding size={20} data-oid="obi1d_m" />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded bg-white p-1 flex items-center justify-center"
      data-oid="g3mct1:"
    >
      <Image
        width={40}
        height={40}
        src={logoUrl}
        alt={`${companyName || "Company"} logo`}
        className="max-w-full max-h-full object-contain"
        onError={() => setHasError(true)}
        data-oid="gd_m8v8"
      />
    </div>
  );
}
