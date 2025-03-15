"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProfileRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip redirect for these paths
    const excludedPaths = ["/complete-profile", "/api", "/_next"];
    const shouldSkip = excludedPaths.some((path) => pathname.startsWith(path));
    if (shouldSkip) return;

    // Simple redirect logic based only on session.exists
    if (status === "authenticated") {
      if (session?.exists === false) {
        // User doesn't exist in database, redirect to complete profile
        router.replace("/complete-profile");
      } else if (pathname === "/complete-profile" && session?.exists === true) {
        // User exists but is on complete-profile page, redirect to main page
        router.replace("/");
      }
    }
  }, [session, status, router, pathname]);

  return <>{children}</>;
}
