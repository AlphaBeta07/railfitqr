import VendorChart from "@/components/analytics/vendor-chart";
import DistributionChart from "@/components/analytics/distribution-chart";
import AnomalyFeed from "@/components/analytics/anomaly-feed";

export default function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Analytics Dashboard</h1>
        <p className="text-muted-foreground">Intelligent insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Vendor Performance Chart */}
        <div className="xl:col-span-2">
          <VendorChart />
        </div>

        {/* Item Type Distribution */}
        <div>
          <DistributionChart />
        </div>

        {/* Anomaly Feed */}
        <div className="xl:col-span-3">
          <AnomalyFeed />
        </div>
      </div>
    </div>
  );
}
