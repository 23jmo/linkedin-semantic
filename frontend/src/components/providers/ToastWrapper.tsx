"use client";

import { ToastProvider } from "@/components/ui/toast";

export function ToastWrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider data-oid="x.x35qa">{children}</ToastProvider>;
}
