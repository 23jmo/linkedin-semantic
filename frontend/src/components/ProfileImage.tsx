"use client";

import Image from "next/image";
import { useState } from "react";

interface ProfileImageProps {
  imageUrl?: string;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
}

export default function ProfileImage({
  imageUrl,
  firstName,
  lastName,
  size = "md",
}: ProfileImageProps) {
  const [hasError, setHasError] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: "w-10 h-10 text-lg",
    md: "w-16 h-16 text-xl",
    lg: "w-20 h-20 text-2xl",
  };

  // If no image or error loading image, show initials
  if (!imageUrl || hasError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 font-bold`}
      >
        {firstName.charAt(0)}
        {lastName.charAt(0)}
      </div>
    );
  }

  // Show image with fallback
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden`}>
      <Image
        src={imageUrl}
        alt={`${firstName} ${lastName}`}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
        width={40}
        height={40}
      />
    </div>
  );
}
