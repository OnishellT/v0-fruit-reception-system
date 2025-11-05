import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/users";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateUserDialog } from "@/components/create-user-dialog";
import UserManagementTableClient from "./user-management-table-client";

export default async function UsersPage() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const result = await getUsers();

  if (result.error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Gestión de Usuarios
        </h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{result.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-2">
            Administre los usuarios del sistema
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Lista de todos los usuarios registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementTableClient users={result.users || []} />
        </CardContent>
      </Card>
    </div>
  );
}
