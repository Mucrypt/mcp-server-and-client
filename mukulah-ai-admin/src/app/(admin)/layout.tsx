import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-background">
      <Sidebar />
      <Topbar />
      <main className="ml-64 mt-16 overflow-y-auto bg-gradient-to-br from-background via-muted/20 to-background px-6 py-6" style={{ height: "calc(100vh - 4rem)" }}>
        {children}
      </main>
    </div>
  );
}
