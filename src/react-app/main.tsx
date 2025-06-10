import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useSession } from "./lib/auth-client";
import "./styles/globals.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { createRouter, RouterProvider } from "@tanstack/react-router";

// Create a new router instance
const router = createRouter({
  routeTree,
  scrollRestoration: true,
  context: {
    auth: undefined!,
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// inject and auth method to router
// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const { data: session } = useSession();
  return (
    <RouterProvider
      router={router}
      context={{ auth: { isSignedIn: !!session } }}
    />
  );
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <InnerApp />
    </StrictMode>
  );
}
