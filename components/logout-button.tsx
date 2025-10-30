"use client"

import { logout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2">
      <LogOut className="h-4 w-4" />
      Cerrar Sesión
    </Button>
  )
}
