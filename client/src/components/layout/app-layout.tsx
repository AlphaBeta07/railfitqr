import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "./sidebar";
import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        {isMobile && (
          <header className="bg-card border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-train text-primary-foreground"></i>
              </div>
              <h1 className="text-lg font-semibold">RailVision</h1>
            </div>
            <button className="p-2 hover:bg-muted rounded-md" data-testid="mobile-menu-button">
              <i className="fas fa-bars"></i>
            </button>
          </header>
        )}

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto page-transition">
          {children}
        </div>
      </main>
    </div>
  );
}
