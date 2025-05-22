import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface RouterAuthenticationContext {
  auth: {
    isSignedIn: boolean | undefined;
  };
}

export const Route = createRootRouteWithContext<RouterAuthenticationContext>()({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
