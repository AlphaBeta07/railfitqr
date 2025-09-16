import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "fas fa-tachometer-alt" },
  { name: "Add Items", href: "/add-items", icon: "fas fa-plus" },
  { name: "QR Scanner", href: "/scanner", icon: "fas fa-qrcode" },
  { name: "AI Analytics", href: "/analytics", icon: "fas fa-chart-bar" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
        <div className="flex justify-around">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
                data-testid={`mobile-nav-${item.name.toLowerCase().replace(" ", "-")}`}
              >
                <i className={item.icon}></i>
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
          <i className="fas fa-train text-sidebar-primary-foreground text-lg"></i>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">RailVision</h1>
          <p className="text-xs text-muted-foreground">Indian Railways</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
            >
              <i className={`${item.icon} w-5`}></i>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <i className="fas fa-user text-sidebar-primary-foreground text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Railway Inspector</p>
            <p className="text-xs text-muted-foreground truncate">Central Railway</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
