// import { ChartAreaInteractive } from "@/react-app/components/chart-area-interactive";
// import { DataTable } from "@/react-app/components/data-table";
// import { SectionCards } from "@/react-app/components/section-cards";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/dashboard")({
  component: Dashboard,
});

// import data from "./-test-data/data.json";
// import { useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { useState } from "react";

export function Dashboard() {
  const [deepLink, setDeeplink] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleGenerateDeeplink = async () => {
    // console.log({ tokenFrontEndDashboard: await getToken() });
    try {
      const response = await fetch("/api/user/generate-tlgram-deeplink", {
        // headers: {
        //   Authorization: "Bearer " + (await getToken()),
        // },
      });
      const data = await response.json();
      console.log({ DeeplinkFrontEnd: data });
      setDeeplink(data.url);
    } catch (error) {
      setError("Error generating deeplink");
      console.error("Error generating deeplink:", error);
    }
  };
  return (
    <div className="@container/main flex flex-1 flex-col gap-2 ">
      <div className="flex flex-col py-5 gap-3">
        <Button onClick={handleGenerateDeeplink}>Generate Deeplink</Button>
        <div className="text-xl text-gray-800">
          <p className="mb-2">Telegram Deeplink:</p>
          {error && <p className="text-red-500">{error}</p>}
          <a
            href={deepLink}
            className="text-blue-500 cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
          >
            {deepLink}
          </a>
        </div>
      </div>
      {/* <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div> */}
    </div>
  );
}
