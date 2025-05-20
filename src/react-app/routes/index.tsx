import { createFileRoute, Link } from "@tanstack/react-router";
import viteLogo from "/vite.svg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="max-w-screen-xl mx-auto px-4">
      <header className="flex py-4 justify-between">
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <button
          type="button"
          className="bg-lime-500 text-gray-50 px-3 border rounded"
        >
          sign in with clerk
        </button>
      </header>
      <main className="">
        <div>Admin Panel</div>
        <Link to="/dashboard" className="[&.active]:font-bold">
          Dashboard
        </Link>
      </main>
    </div>
  );
}
