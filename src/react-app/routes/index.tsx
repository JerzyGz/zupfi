import { createFileRoute, Link } from "@tanstack/react-router";
import viteLogo from "/vite.svg";
import {
  SignedOut,
  SignInButton,
  SignedIn,
  UserButton,
} from "@clerk/clerk-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4">
      <header className="flex py-4 justify-between">
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <div>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      <main className="">
        <div>Admin Panel</div>
        <Link to="/auth/dashboard" className="[&.active]:font-bold">
          Dashboard (ir a la página protegida)
        </Link>
      </main>
    </div>
  );
}
