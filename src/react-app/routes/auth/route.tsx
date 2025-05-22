import { AppSidebar } from "@/react-app/components/app-sidebar";
import { SiteHeader } from "@/react-app/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/react-app/components/ui/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  beforeLoad({ context, location }) {
    console.log("****** context", context);
    if (!context.auth.isSignedIn) {
      console.log(
        "****** No está autenticado, redirigiendo a la página de inicio"
      );
      throw redirect({
        to: "/",
        search: {
          redirectedFrom: location.href,
        },
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
