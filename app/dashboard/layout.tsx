import type React from "react"
import { getSession } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { DashboardProviderWrapper } from "@/components/dashboard-provider-wrapper"
import { ResponsiveSidebar } from "@/components/responsive-sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

   return (
     <DashboardProviderWrapper>
       <div className="flex min-h-screen bg-background">
         <ResponsiveSidebar session={session} />

         {/* Main content */}
         <main className="flex-1 overflow-auto md:ml-0">
           <div className="p-4 md:p-8">{children}</div>
         </main>
       </div>
     </DashboardProviderWrapper>
   )
}
