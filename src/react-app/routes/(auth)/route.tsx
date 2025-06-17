import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col bg-muted min-h-svh justify-center items-center">
      <div className="w-full max-w-sm md:max-w-3xl p-4">
        <Outlet />
      </div>
    </div>
  );
}
