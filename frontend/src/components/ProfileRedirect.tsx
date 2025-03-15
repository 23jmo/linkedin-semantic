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

    if (shouldSkip) {
      return;
    }

    // If the user is authenticated but doesn't exist in the database, redirect to complete-profile
    if (status === "authenticated") {
      console.log("ProfileRedirect - Session:", session);

      // Check if user needs to complete their profile
      if (session?.needsProfile === true || session?.exists === false) {
        console.log(
          "ProfileRedirect - User needs to complete profile, redirecting to complete-profile"
        );
        router.replace("/complete-profile");
      } else if (pathname === "/complete-profile" && session?.exists === true) {
        // If user is on complete-profile page but already exists, redirect to main page
        console.log(
          "ProfileRedirect - User already exists, redirecting to main page"
        );
        router.replace("/");
      }
    }
  }, [session, status, router, pathname]);

  return <>{children}</>;
}
