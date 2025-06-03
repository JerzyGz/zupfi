import { createFileRoute, Link } from "@tanstack/react-router";
import viteLogo from "/vite.svg";
import { signIn, signOut, signUp, useSession } from "../lib/auth-client";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle user creation logic here
    signUp.email(
      {
        name,
        email,
        password,
      },
      {
        onRequest(context) {
          console.log("Sign up request initiated", context);
        },
        onSuccess(context) {
          console.log("Sign up successful", context);
        },
        onError(context) {
          console.error("Sign up failed", context);
        },
      }
    );
  };
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle user creation logic here
    signIn.email(
      {
        email,
        password,
      },
      {
        onRequest(context) {
          console.log("Sign in request initiated", context);
        },
        onSuccess(context) {
          console.log("Sign in successful", context);
        },
        onError(context) {
          console.error("Sign in failed", context);
        },
      }
    );
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4">
      <header className="flex py-4 justify-between">
        <img src={viteLogo} className="logo" alt="Vite logo" />
      </header>

      <main>
        <section className="flex flex-col gap-4">
          <h2> Create user</h2>
          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <label>
              Name:
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 rounded"
              />
            </label>
            <label>
              Email:
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 rounded"
              />
            </label>
            <label>
              Password:
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded"
              />
            </label>
            <Button type="submit">Create User</Button>
          </form>
        </section>
        <section className="flex flex-col gap-4">
          <h2> Log in</h2>
          <form className="flex flex-col gap-2" onSubmit={handleLogin}>
            <label>
              Email:
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 rounded"
              />
            </label>
            <label>
              Password:
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded"
              />
            </label>
            <Button type="submit">Login</Button>
          </form>
        </section>
        <div className="flex flex-col gap-2 mt-4">
          {session ? (
            <>
              <Button onClick={() => signOut()}>LogOut</Button>
              <Link to="/auth/dashboard" className="[&.active]:font-bold">
                Ir Dashboard
              </Link>
            </>
          ) : (
            <Button>Login</Button>
          )}
        </div>
      </main>
    </div>
  );
}
