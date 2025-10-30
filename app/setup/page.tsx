import { checkIfSetupNeeded, createInitialAdmin } from "@/lib/actions/setup";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { revalidatePath } from "next/cache";

export default async function SetupPage() {
  const { needed, error: checkError } = await checkIfSetupNeeded();

  if (!needed && !checkError) {
    redirect("/login");
  }

  async function handleCreateAdmin(formData: FormData) {
    "use server";
    try {
      await createInitialAdmin(formData);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error desconocido",
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Configuración Inicial
          </CardTitle>
          <CardDescription className="text-center">
            Crea el usuario administrador para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{checkError}</AlertDescription>
            </Alert>
          )}

          <form action={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="admin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>

            <Button type="submit" className="w-full">
              Crear Administrador
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
