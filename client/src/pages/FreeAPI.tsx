import { useEffect, useMemo, useState } from "react";

import YT_app from "./FreeAPISubPages/YT_app";
import Listing_app from "./FreeAPISubPages/Listing_app";
import Quotes_app from "./FreeAPISubPages/Quotes_app";
import Jokes_app from "./FreeAPISubPages/Jokes_app";
import RCat_app from "./FreeAPISubPages/RCat_app";
import Meals_app from "./FreeAPISubPages/Meals_app";
import RUsers_app from "./FreeAPISubPages/RUsers_app";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { oidc } from "@/BackendRoutes";

const FreeAPI = () => {
  const subApps = [
    {
      name: "FreeAPI: YouTube Videos Listing UI",
      description: "Browse video cards and details.",
      id: "YT_app",
      component: YT_app,
    },
    {
      name: "FreeAPI: Product Listing Interface",
      description: "Display product listings.",
      id: "Listing_app",
      component: Listing_app,
    },
    {
      name: "Quotes Listing Application",
      description: "Show quote cards.",
      id: "Quotes_app",
      component: Quotes_app,
    },
    {
      name: "FreeAPI: Jokes Viewer Application",
      description: "Show random jokes.",
      id: "Jokes_app",
      component: Jokes_app,
    },
    {
      name: "FreeAPI: Random Cat Viewer",
      description: "Display a random cat image.",
      id: "RCat_app",
      component: RCat_app,
    },
    {
      name: "FreeAPI: Meals Listing Interface",
      description: "List meals and details.",
      id: "Meals_app",
      component: Meals_app,
    },
    {
      name: "FreeAPI: Random Users UI",
      description: "Display random user cards.",
      id: "RUsers_app",
      component: RUsers_app,
    },
  ];

  const [activeAppId, setActiveAppId] = useState(subApps[0].id);

  const activeApp = useMemo(
    () => subApps.find((app) => app.id === activeAppId) ?? subApps[0],
    [activeAppId],
  );

  const ActiveComponent = activeApp.component;

  useEffect(() => {
    const ping = async () => {
      try {
        await oidc.healthRoute();
      } catch (e) {
        console.error("Health check failed:", e);
      }
    };

    ping(); // call immediately on mount

    const interval = setInterval(ping, 10 * 60 * 1000); // then every 10 mins

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-yellow-400">
      {/* HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-5">
            {subApps.map((app) => (
              <Button
                key={app.id}
                variant={app.id === activeAppId ? "default" : "ghost"}
                className={`rounded-full px-4 whitespace-nowrap transition-all border-white ${
                  app.id === activeAppId
                    ? "bg-white text-black shadow-md"
                    : "text-white hover:bg-white/20"
                }`}
                size="sm"
                onClick={() => setActiveAppId(app.id)}
              >
                {app.name}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto p-4 mt-6">
        <Card className="rounded-2xl shadow-2xl bg-white/90 backdrop-blur-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {activeApp.name}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {activeApp.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="rounded-xl p-4 bg-gray-50 border">
              <ActiveComponent />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FreeAPI;
