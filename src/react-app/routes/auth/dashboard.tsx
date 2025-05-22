import { ChartAreaInteractive } from "@/react-app/components/chart-area-interactive";
import { DataTable } from "@/react-app/components/data-table";
import { SectionCards } from "@/react-app/components/section-cards";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/dashboard")({
  component: Dashboard,
});

import data from "./-test-data/data.json";

export function Dashboard() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2 ">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </div>
  );
}
