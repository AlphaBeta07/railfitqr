import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useStats } from "@/hooks/use-items";

const kpiConfig = [
  {
    title: "Total Items",
    key: "totalItems" as const,
    icon: "fas fa-cubes",
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
    valueColor: "text-foreground",
  },
  {
    title: "Warranty Expiring",
    key: "warrantyExpiring" as const,
    icon: "fas fa-exclamation-triangle",
    bgColor: "bg-warning/10",
    iconColor: "text-warning",
    valueColor: "text-warning",
  },
  {
    title: "Inspections Overdue",
    key: "inspectionsOverdue" as const,
    icon: "fas fa-clock",
    bgColor: "bg-destructive/10",
    iconColor: "text-destructive",
    valueColor: "text-destructive",
  },
  {
    title: "Active Vendors",
    key: "activeVendors" as const,
    icon: "fas fa-handshake",
    bgColor: "bg-accent/10",
    iconColor: "text-accent",
    valueColor: "text-accent",
  },
];

export default function KPICards() {
  const { data: stats, isLoading, error } = useStats();

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiConfig.map((config) => (
          <Card key={config.title} className="card-gradient shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{config.title}</p>
                  <p className="text-2xl font-bold text-destructive">Error</p>
                </div>
                <div className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                  <i className={`${config.icon} ${config.iconColor} text-xl`}></i>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiConfig.map((config) => (
        <Card 
          key={config.title} 
          className="card-gradient shadow-sm hover:shadow-md transition-shadow"
          data-testid={`kpi-card-${config.key}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{config.title}</p>
                {isLoading ? (
                  <div className="flex items-center gap-2 mt-1">
                    <LoadingSpinner size="sm" />
                    <div className="w-16 h-6 bg-muted rounded skeleton"></div>
                  </div>
                ) : (
                  <p className={`text-2xl font-bold ${config.valueColor}`} data-testid={`kpi-value-${config.key}`}>
                    {stats?.[config.key]?.toLocaleString() ?? 0}
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                <i className={`${config.icon} ${config.iconColor} text-xl`}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
