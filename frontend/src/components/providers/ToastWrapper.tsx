"use client";

import { ToastProvider } from "@/components/ui/toast";

export function ToastWrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider data-oid="eq3a3yn">{children}</ToastProvider>;
}
