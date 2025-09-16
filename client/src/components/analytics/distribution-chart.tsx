import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useItems } from "@/hooks/use-items";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const itemTypeLabels = {
  "wooden-sleeper": "Wooden Sleeper",
  "concrete-sleeper": "Concrete Sleeper",
  "rail-liner": "Rail Liner",
  "rail-pad": "Rail Pad",
  "elastic-rail-clip": "Elastic Rail Clip",
};

const COLORS = [
  "hsl(var(--chart-1))", // Blue
  "hsl(var(--chart-2))", // Green
  "hsl(var(--chart-3))", // Yellow
  "hsl(var(--chart-4))", // Cyan
  "hsl(var(--chart-5))", // Purple
];

export default function DistributionChart() {
  const { data: items = [], isLoading, error } = useItems();

  // Process data for item type distribution
  const typeData = items.reduce((acc, item) => {
    const type = item.itemType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = items.length;
  const chartData = Object.entries(typeData).map(([type, count], index) => ({
    type: itemTypeLabels[type as keyof typeof itemTypeLabels] || type,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    color: COLORS[index % COLORS.length],
  }));

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Item Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-destructive">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl mb-2"></i>
              <p>Failed to load distribution data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Item Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <LoadingSpinner className="mb-4" />
                <p className="text-muted-foreground">Loading distribution data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <i className="fas fa-chart-pie text-4xl mb-2"></i>
                <p>No distribution data</p>
                <p className="text-sm">Create items to see distribution</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} items (${props.payload.percentage}%)`,
                    props.payload.type
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
