"use client";

import { useState, useEffect } from "react";
import { Users, Package, LayoutDashboard, FileText, Truck, UserCircle, Apple, Building2, DollarSign, FileSearch, Factory, Menu, X, CreditCard, Calculator } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

interface ResponsiveSidebarProps {
  session: {
    username: string;
    role: string;
  };
}

export function ResponsiveSidebar({ session }: ResponsiveSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile when route changes
      if (mobile) {
        setIsOpen(false);
      }
    };

    // Set initial state
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const sidebar = document.getElementById('responsive-sidebar');
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isOpen]);

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors",
        isActiveLink(href) && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => isMobile && setIsOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "fixed top-4 left-4 p-2 bg-card border border-border rounded-lg shadow-lg md:hidden",
            isOpen ? "z-[60]" : "z-50"
          )}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        id="responsive-sidebar"
        className={cn(
          "bg-card border-r border-border transition-all duration-300 ease-in-out",
          // Desktop: always visible, fixed width
          "md:flex md:flex-col md:w-64 md:relative md:h-full",
          // Mobile: overlay when open, hidden when closed
          isMobile ? (
            isOpen
              ? "fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
              : "hidden"
          ) : ""
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Sistema de Recepción</h1>
            <p className="text-sm text-muted-foreground mt-1">{session.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{session.role}</p>
          </div>

           {/* Navigation */}
           <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
             <NavLink href="/dashboard">
               <LayoutDashboard className="h-5 w-5" />
               <span>Inicio</span>
             </NavLink>

             <div className="pt-4 pb-2">
               <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                 Operaciones Principales
               </p>
             </div>
             <NavLink href="/dashboard/reception">
               <Package className="h-5 w-5" />
               <span>Recepción de Frutos</span>
             </NavLink>
             <NavLink href="/dashboard/batches">
               <Factory className="h-5 w-5" />
               <span>Procesamiento de Cacao</span>
             </NavLink>

             <div className="pt-4 pb-2">
               <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                 Sistema POS Efectivo
               </p>
             </div>
             <NavLink href="/dashboard/cash-pos">
               <CreditCard className="h-5 w-5" />
               <span>Panel Principal POS</span>
             </NavLink>
             <NavLink href="/dashboard/cash-pos/receptions">
               <Package className="h-5 w-5" />
               <span>Recepciones POS</span>
             </NavLink>
             <NavLink href="/dashboard/cash-pos/customers">
               <UserCircle className="h-5 w-5" />
               <span>Clientes POS</span>
             </NavLink>
             <NavLink href="/dashboard/cash-pos/pricing">
               <Calculator className="h-5 w-5" />
               <span>Precios Diarios POS</span>
             </NavLink>
             <NavLink href="/dashboard/cash-pos/quality">
               <FileSearch className="h-5 w-5" />
               <span>Calidad POS</span>
             </NavLink>
             <NavLink href="/dashboard/cash-pos/fruit-types">
               <Apple className="h-5 w-5" />
               <span>Frutas POS</span>
             </NavLink>

             <div className="pt-4 pb-2">
               <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                 Datos Maestros
               </p>
             </div>
             <NavLink href="/dashboard/proveedores">
               <Truck className="h-5 w-5" />
               <span>Proveedores</span>
             </NavLink>
             <NavLink href="/dashboard/choferes">
               <UserCircle className="h-5 w-5" />
               <span>Choferes</span>
             </NavLink>
             {session.role === "admin" && (
               <>
                 <NavLink href="/dashboard/asociaciones">
                   <Building2 className="h-5 w-5" />
                   <span>Asociaciones</span>
                 </NavLink>
                 <NavLink href="/dashboard/tipos-fruto">
                   <Apple className="h-5 w-5" />
                   <span>Tipos de Fruto</span>
                 </NavLink>
               </>
             )}

             {session.role === "admin" && (
               <>
                 <div className="pt-4 pb-2">
                   <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                     Configuración de Precios
                   </p>
                 </div>
                 <NavLink href="/dashboard/pricing">
                   <DollarSign className="h-5 w-5" />
                   <span>Reglas de Precios</span>
                 </NavLink>
                 <NavLink href="/dashboard/pricing/daily">
                   <Calculator className="h-5 w-5" />
                   <span>Precios Diarios</span>
                 </NavLink>
                 <NavLink href="/dashboard/pricing/history">
                   <FileSearch className="h-5 w-5" />
                   <span>Historial de Precios</span>
                 </NavLink>

                 <div className="pt-4 pb-2">
                   <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                     Administración
                   </p>
                 </div>
                 <NavLink href="/dashboard/users">
                   <Users className="h-5 w-5" />
                   <span>Gestión de Usuarios</span>
                 </NavLink>
                 <NavLink href="/dashboard/audit">
                   <FileText className="h-5 w-5" />
                   <span>Auditoría</span>
                 </NavLink>
               </>
             )}
           </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tema</span>
              <ThemeToggle />
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}