import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  console.log("Dashboard component");
  return (
    <>
      <div>Dashboard component</div>
      <h1> Esta página esta protegida (Autenticado)</h1>
    </>
  );
}
