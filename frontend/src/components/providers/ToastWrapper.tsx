"use client";

import { ToastProvider } from "@/components/ui/toast";

export function ToastWrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
