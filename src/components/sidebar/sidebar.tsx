import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import {
    UsersIcon, PackageIcon, LayoutDashboardIcon, FileTextIcon, TruckIcon, AppleIcon,
    Building2Icon, DollarSignIcon, FileSearchIcon, FactoryIcon, MenuIcon, XIcon,
    CreditCardIcon, CalculatorIcon, UserIcon
} from 'lucide-qwik';

interface SidebarProps {
    session: {
        username: string;
        role: string;
    };
}

export const Sidebar = component$(({ session }: SidebarProps) => {
    const isOpen = useSignal(false);
    const isMobile = useSignal(false);
    const loc = useLocation();

    // Check if we're on mobile
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
        const checkMobile = () => {
            isMobile.value = window.innerWidth < 768;
            if (isMobile.value) {
                isOpen.value = false;
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    });

    const closeSidebar = $(() => {
        if (isMobile.value) isOpen.value = false;
    });

    const isActiveLink = (href: string) => {
        if (href === '/dashboard') {
            return loc.url.pathname === '/dashboard';
        }
        return loc.url.pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick$={() => isOpen.value = !isOpen.value}
                class={`fixed top-4 left-4 p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow md:hidden ${isOpen.value ? 'z-[60]' : 'z-50'} ${!isMobile.value ? 'hidden' : ''}`}
                aria-label="Toggle menu"
            >
                {isOpen.value ? <XIcon class="h-5 w-5 text-gray-700" /> : <MenuIcon class="h-5 w-5 text-gray-700" />}
            </button>

            {/* Overlay for mobile */}
            {isMobile.value && isOpen.value && (
                <div class="fixed inset-0 bg-black/50 z-40 md:hidden" onClick$={() => isOpen.value = false} />
            )}

            {/* Sidebar */}
            <aside
                id="responsive-sidebar"
                class={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out
          md:flex md:flex-col md:w-64 md:relative md:h-full
          ${isMobile.value ? (isOpen.value ? "fixed left-0 top-0 h-full w-64 z-50 flex flex-col" : "hidden") : ""}
        `}
            >
                <div class="flex flex-col h-full">
                    {/* Header */}
                    <div class="p-6 border-b border-gray-200 bg-gradient-to-br from-primary/5 to-transparent">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="p-2 bg-primary/10 rounded-lg">
                                <PackageIcon class="h-6 w-6 text-primary" />
                            </div>
                            <h1 class="text-lg font-bold text-gray-900">Sistema de Recepción</h1>
                        </div>
                        <div class="ml-14">
                            <p class="text-sm font-medium text-gray-700">{session.username}</p>
                            <p class="text-xs text-gray-500 capitalize inline-flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {session.role}
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
                        <Link
                            href="/dashboard"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <LayoutDashboardIcon class="h-4 w-4" />
                            <span>Inicio</span>
                        </Link>

                        <div class="pt-6 pb-2">
                            <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Operaciones
                            </p>
                        </div>
                        <Link
                            href="/dashboard/reception"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/reception') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <PackageIcon class="h-4 w-4" />
                            <span>Recepción de Frutos</span>
                        </Link>
                        <Link
                            href="/dashboard/batches"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/batches') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <FactoryIcon class="h-4 w-4" />
                            <span>Procesamiento Cacao</span>
                        </Link>

                        <div class="pt-6 pb-2">
                            <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Sistema POS
                            </p>
                        </div>
                        <Link
                            href="/dashboard/cash-pos"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/cash-pos') && loc.url.pathname === '/dashboard/cash-pos' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <CreditCardIcon class="h-4 w-4" />
                            <span>Panel Principal</span>
                        </Link>

                        <Link
                            href="/dashboard/cash-pos/receptions"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/cash-pos/receptions') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <PackageIcon class="h-4 w-4" />
                            <span>Recepciones</span>
                        </Link>
                        <Link
                            href="/dashboard/cash-pos/customers"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/cash-pos/customers') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <UserIcon class="h-4 w-4" />
                            <span>Clientes</span>
                        </Link>
                        <Link
                            href="/dashboard/cash-pos/pricing"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/cash-pos/pricing') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <CalculatorIcon class="h-4 w-4" />
                            <span>Precios Diarios</span>
                        </Link>
                        <Link
                            href="/dashboard/cash-pos/quality"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/cash-pos/quality') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <FileSearchIcon class="h-4 w-4" />
                            <span>Calidad</span>
                        </Link>
                        <Link
                            href="/dashboard/cash-pos/fruit-types"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/cash-pos/fruit-types') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <AppleIcon class="h-4 w-4" />
                            <span>Tipos de Fruta</span>
                        </Link>

                        <div class="pt-6 pb-2">
                            <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Datos Maestros
                            </p>
                        </div>
                        <Link
                            href="/dashboard/proveedores"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/proveedores') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <TruckIcon class="h-4 w-4" />
                            <span>Proveedores</span>
                        </Link>
                        <Link
                            href="/dashboard/choferes"
                            class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/choferes') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick$={closeSidebar}
                        >
                            <UserIcon class="h-4 w-4" />
                            <span>Choferes</span>
                        </Link>

                        {session.role === "admin" && (
                            <>
                                <Link
                                    href="/dashboard/asociaciones"
                                    class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/asociaciones') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick$={closeSidebar}
                                >
                                    <Building2Icon class="h-4 w-4" />
                                    <span>Asociaciones</span>
                                </Link>
                                <Link
                                    href="/dashboard/tipos-fruto"
                                    class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/tipos-fruto') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick$={closeSidebar}
                                >
                                    <AppleIcon class="h-4 w-4" />
                                    <span>Tipos de Fruto</span>
                                </Link>
                            </>
                        )}

                        {session.role === "admin" && (
                            <>
                                <div class="pt-6 pb-2">
                                    <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Configuración
                                    </p>
                                </div>
                                <Link
                                    href="/dashboard/pricing"
                                    class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/pricing') && loc.url.pathname === '/dashboard/pricing' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick$={closeSidebar}
                                >
                                    <DollarSignIcon class="h-4 w-4" />
                                    <span>Reglas de Precios</span>
                                </Link>
                                <Link
                                    href="/dashboard/pricing/daily"
                                    class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/pricing/daily') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick$={closeSidebar}
                                >
                                    <CalculatorIcon class="h-4 w-4" />
                                    <span>Precios Diarios</span>
                                </Link>

                                <div class="pt-6 pb-2">
                                    <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Administración
                                    </p>
                                </div>
                                <Link
                                    href="/dashboard/users"
                                    class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/users') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick$={closeSidebar}
                                >
                                    <UsersIcon class="h-4 w-4" />
                                    <span>Gestión de Usuarios</span>
                                </Link>
                                <Link
                                    href="/dashboard/audit"
                                    class={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActiveLink('/dashboard/audit') ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick$={closeSidebar}
                                >
                                    <FileTextIcon class="h-4 w-4" />
                                    <span>Auditoría</span>
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Footer */}
                    <div class="p-4 border-t border-gray-200 bg-gray-50">
                        <Link
                            href="/logout"
                            class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Cerrar Sesión
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
});
