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
  console.log("AuthLayout component");
  return (
    <div>
      <h1>(AuthLayout)Esta página es para autenticados</h1>
      <Outlet />
    </div>
  );
}
