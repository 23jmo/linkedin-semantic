"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider data-oid="teq849c">
      {children}
    </NextAuthSessionProvider>
  );
}
