import KPICards from "@/components/dashboard/kpi-cards";
import ItemsTable from "@/components/dashboard/items-table";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Track fitting inventory and maintenance overview</p>
      </div>

      <KPICards />
      <ItemsTable />
    </div>
  );
}
