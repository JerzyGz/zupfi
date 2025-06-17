import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/react-app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/react-app/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/react-app/components/ui/form";
import { Input } from "@/react-app/components/ui/input";
import { signUp } from "@/react-app/lib/auth-client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircleIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/react-app/components/ui/alert";

export const Route = createFileRoute("/(auth)/sign-up")({
  component: SignUpComponent,
});

const formSchema = z
  .object({
    name: z
      .string()
      .min(2, {
        message: "El nombre debe tener al menos 2 caracteres",
      })
      .max(50, {
        message: "El nombre no puede exceder los 50 caracteres",
      }),
    email: z
      .string()
      .min(5, {
        message: "El email debe tener al menos 5 caracteres",
      })
      .max(100)
      .email(),
    password: z
      .string()
      .min(6, {
        message: "La contraseña debe tener al menos 6 caracteres",
      })
      .max(30),
    confirmPassword: z.string().min(8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

function SignUpComponent() {
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSignUp = (values: z.infer<typeof formSchema>) => {
    setError("");
    setPending(true);
    const { email, password, name } = values;

    signUp.email(
      {
        name,
        email,
        password,
      },
      {
        onSuccess() {
          navigate({
            to: "/app/dashboard",
          });
          setPending(false);
        },
        onError() {
          setPending(false);
        },
      }
    );
  };
  return (
    <Card className="p-0 grid md:grid-cols-2 gap-4">
      <div>
        <CardHeader className="pt-4">
          <CardTitle>Registrarse</CardTitle>
          <CardDescription>
            Ingresa tus datos para crear una cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <Form {...form}>
            <form
              className="flex flex-col gap-4 p-4"
              onSubmit={form.handleSubmit(onSignUp)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa tu email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ingresa tu constraseña"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ingresa nuevamente tu contraseña"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>No se pudo iniciar sesión.</AlertTitle>
                  <AlertDescription>
                    <p>
                      Por favor verifica tus credenciales e intenta nuevamente.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={pending}>
                Registrar
              </Button>

              <div className="relative text-center text-sm after:border-border after:absolute after:inset-0 after:border-t after:top-1/2 after:z-0 ">
                <span className="relative bg-card z-10 px-4">
                  Ó continuar con
                </span>
              </div>
              <div className=" grid md:grid-cols-2 gap-4">
                <Button variant="outline" type="button">
                  Google
                </Button>
                <Button variant="outline" type="button">
                  GitHub
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </div>
      <div className="bg-radial from-orange-500 via-orange-600 to-red-800 hidden md:flex md:flex-col gap-y-4 justify-center items-center">
        <h1 className="text-3xl text-white font-bold">Zupfi</h1>
      </div>
    </Card>
  );
}
