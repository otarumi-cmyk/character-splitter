"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditorPage = pathname?.startsWith("/posts/new") || pathname?.match(/^\/posts\/\d+$/);

  if (isEditorPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 min-h-screen ml-[250px] p-8">{children}</main>
    </>
  );
}
