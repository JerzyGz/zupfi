import { createFileRoute, Link } from "@tanstack/react-router";
import zupfiLogo from "/logo.svg";
import { signOut, useSession } from "../lib/auth-client";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { data: session } = useSession();
  return (
    <div className="max-w-screen-xl mx-auto px-4">
      <header className="flex py-4 justify-between">
        <div>
          <img src={zupfiLogo} className="logo" alt="Zupfi logo" />
        </div>
        <div className="flex gap-4 items-center">
          {session ? (
            <>
              <Button variant="default" onClick={() => signOut()}>
                Cerrar sesión
              </Button>
              <Link to="/app/dashboard">Ir a Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/sign-in">Iniciar Sesión</Link>
              <Link to="/sign-up">Registrarse</Link>
            </>
          )}
        </div>
      </header>
      <main className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Our Platform</h1>
          <p className="text-xl text-gray-600 mb-8">
            We're working hard to bring you something amazing. Stay tuned for
            updates!
          </p>
          <div className="flex justify-center gap-4">
            {/* <Button variant="default" size="lg">
              Learn More
            </Button>
            <Button variant="outline" size="lg">
              Get Started
            </Button> */}
          </div>
        </div>
      </main>
    </div>
  );
}
