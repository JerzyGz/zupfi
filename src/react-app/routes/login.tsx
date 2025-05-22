import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: About,
});

function About() {
  return (
    <div className="p-2">
      Hello from About!
      <div>Admin Panel</div>
      <Link to="/auth/dashboard" className="[&.active]:font-bold">
        Dashboard (ir a la página protegida)
      </Link>
    </div>
  );
}
