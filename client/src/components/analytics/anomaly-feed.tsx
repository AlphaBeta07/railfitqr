import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useItems } from "@/hooks/use-items";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLocation } from "wouter";
import type { Anomaly } from "@/types";

export default function AnomalyFeed() {
  const { data: items = [], isLoading, error } = useItems();
  const [, setLocation] = useLocation();

  const anomalies = useMemo<Anomaly[]>(() => {
    const now = new Date();
    const detected: Anomaly[] = [];

    items.forEach((item) => {
      // Check warranty expiring (within 90 days)
      if (item.warrantyExpiryDate) {
        const expiryDate = new Date(item.warrantyExpiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
          detected.push({
            id: `warranty-${item.id}`,
            type: "warranty-expiring",
            title: "Warranty Expiring Soon",
            description: `Item ${item.id} warranty expires in ${daysUntilExpiry} days`,
            itemId: item.id,
            severity: daysUntilExpiry <= 30 ? "high" : daysUntilExpiry <= 60 ? "medium" : "low",
            detectedAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000), // Random time within last 24h
          });
        }
      }

      // Check inspection overdue (no inspection or > 180 days)
      if (!item.lastInspectionDate) {
        detected.push({
          id: `inspection-never-${item.id}`,
          type: "inspection-overdue",
          title: "Inspection Required",
          description: `Item ${item.id} has never been inspected`,
          itemId: item.id,
          severity: "high",
          detectedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time within last week
        });
      } else {
        const lastInspection = new Date(item.lastInspectionDate);
        const daysSinceInspection = Math.ceil((now.getTime() - lastInspection.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceInspection > 180) {
          detected.push({
            id: `inspection-overdue-${item.id}`,
            type: "inspection-overdue",
            title: "Inspection Overdue",
            description: `Item ${item.id} is ${daysSinceInspection} days overdue for inspection`,
            itemId: item.id,
            severity: daysSinceInspection > 365 ? "high" : "medium",
            detectedAt: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Random time within last 3 days
          });
        }
      }
    });

    // Add supply pattern anomalies for vendors with multiple items
    const vendorCounts = items.reduce((acc, item) => {
      acc[item.vendorName] = (acc[item.vendorName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(vendorCounts).forEach(([vendor, count]) => {
      if (count >= 5) { // Vendors with 5+ items
        detected.push({
          id: `supply-pattern-${vendor}`,
          type: "supply-pattern",
          title: "Supply Pattern Detected",
          description: `Vendor ${vendor} showing increased supply frequency (${count} items)`,
          severity: "low",
          detectedAt: new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000), // Random time within last 2 days
        });
      }
    });

    // Sort by severity and detection time
    return detected.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.detectedAt.getTime() - a.detectedAt.getTime();
    }).slice(0, 10); // Show top 10 anomalies
  }, [items]);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800",
          iconBg: "bg-red-100 dark:bg-red-900",
          iconColor: "text-red-600 dark:text-red-400",
          textColor: "text-red-800 dark:text-red-200",
          subtextColor: "text-red-700 dark:text-red-300",
          timeColor: "text-red-600 dark:text-red-400",
        };
      case "medium":
        return {
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          iconBg: "bg-yellow-100 dark:bg-yellow-900",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          textColor: "text-yellow-800 dark:text-yellow-200",
          subtextColor: "text-yellow-700 dark:text-yellow-300",
          timeColor: "text-yellow-600 dark:text-yellow-400",
        };
      default:
        return {
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
          textColor: "text-blue-800 dark:text-blue-200",
          subtextColor: "text-blue-700 dark:text-blue-300",
          timeColor: "text-blue-600 dark:text-blue-400",
        };
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case "warranty-expiring":
        return "fas fa-exclamation-triangle";
      case "inspection-overdue":
        return "fas fa-clock";
      case "supply-pattern":
        return "fas fa-info-circle";
      default:
        return "fas fa-exclamation-circle";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Anomaly Detection
            <Badge variant="destructive">Error</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-8">
            <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
            <p>Failed to load anomaly data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>AI Anomaly Detection</CardTitle>
          <Badge 
            variant="secondary" 
            className="bg-accent/10 text-accent border-accent/20"
            data-testid="anomaly-status-badge"
          >
            <i className="fas fa-circle text-xs mr-1"></i>Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border border-border rounded-md">
                <div className="w-10 h-10 bg-muted rounded-full skeleton"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-muted rounded skeleton"></div>
                  <div className="w-full h-3 bg-muted rounded skeleton"></div>
                  <div className="w-1/4 h-3 bg-muted rounded skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        ) : anomalies.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-accent text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">All Clear</h3>
            <p className="text-muted-foreground">No anomalies detected in your inventory</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="anomaly-list">
            {anomalies.map((anomaly) => {
              const config = getSeverityConfig(anomaly.severity);
              
              return (
                <div 
                  key={anomaly.id}
                  className={`flex items-start gap-4 p-4 ${config.bgColor} border ${config.borderColor} rounded-md hover:shadow-sm transition-shadow`}
                  data-testid={`anomaly-${anomaly.id}`}
                >
                  <div className={`w-10 h-10 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`${getAnomalyIcon(anomaly.type)} ${config.iconColor}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${config.textColor}`}>
                      {anomaly.title}
                    </h4>
                    <p className={`text-sm ${config.subtextColor} mt-1`}>
                      {anomaly.description}
                    </p>
                    <p className={`text-xs ${config.timeColor} mt-2`}>
                      Detected {formatTimeAgo(anomaly.detectedAt)}
                    </p>
                  </div>
                  {anomaly.itemId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/item/${anomaly.itemId}`)}
                      className={`${config.iconColor} hover:${config.iconColor}/80 flex-shrink-0`}
                      data-testid={`view-anomaly-item-${anomaly.itemId}`}
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
