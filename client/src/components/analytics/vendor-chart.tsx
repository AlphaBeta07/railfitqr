import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useItems } from "@/hooks/use-items";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function VendorChart() {
  const { data: items, isLoading, error } = useItems();

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  // Process data for vendor performance
  const vendorData = safeItems.reduce((acc, item) => {
    const vendor = item.vendorName || "Unknown";
    acc[vendor] = (acc[vendor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(vendorData)
    .map(([vendor, count]) => ({
      vendor: vendor.length > 15 ? vendor.substring(0, 15) + "..." : vendor,
      fullVendor: vendor,
      itemCount: count,
    }))
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 10); // Top 10 vendors

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-destructive">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl mb-2"></i>
              <p>Failed to load vendor data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Vendor Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <LoadingSpinner className="mb-4" />
                <p className="text-muted-foreground">Loading vendor data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <i className="fas fa-chart-bar text-4xl mb-2"></i>
                <p>No vendor data available</p>
                <p className="text-sm">Create items to see vendor performance</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="vendor" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} items`,
                    props.payload?.fullVendor || "Vendor"
                  ]}
                  labelFormatter={() => ""}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar 
                  dataKey="itemCount" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
