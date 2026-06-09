import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFFFF] selection:bg-[#0A0A0A] selection:text-white text-[#0A0A0A]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-[240px] relative pt-[56px] md:pt-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
