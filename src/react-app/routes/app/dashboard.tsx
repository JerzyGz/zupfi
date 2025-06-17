import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

import { Button } from "@/react-app/components/ui/button";
import { useState } from "react";

export function Dashboard() {
  const [deepLink, setDeeplink] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleGenerateDeeplink = async () => {
    try {
      const response = await fetch("/api/user/generate-telegram-deeplink");

      const data = await response.json();
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
    </div>
  );
}
