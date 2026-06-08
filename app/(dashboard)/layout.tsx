import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-container-lowest selection:bg-primary selection:text-on-primary text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64 relative pt-16 md:pt-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
