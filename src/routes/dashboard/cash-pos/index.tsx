import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import {
    ShieldIcon,
    FileTextIcon,
    DollarSignIcon,
    TargetIcon,
    UsersIcon,
    AppleIcon
} from 'lucide-qwik';

export default component$(() => {
    // TODO: Implement role-based access control checking
    // For now, we'll show all links but they might be protected by middleware/layout

    const menuItems = [
        {
            href: "/dashboard/cash-pos/receptions",
            title: "Recepciones",
            description: "Crear y gestionar recepciones de fruta en efectivo con cálculos automáticos de descuentos",
            details: "Ver todas las recepciones, crear nuevas y editar registros existentes",
            icon: FileTextIcon,
            roles: ['operator', 'admin'],
        },
        {
            href: "/dashboard/cash-pos/pricing",
            title: "Precios Diarios",
            description: "Establecer precios diarios por tipo de fruta para cálculos de recepción",
            details: "Configurar precios que se utilizarán para todas las recepciones en esa fecha",
            icon: DollarSignIcon,
            roles: ['admin'],
        },
        {
            href: "/dashboard/cash-pos/quality",
            title: "Umbrales de Calidad",
            description: "Configurar estándares de calidad para el cálculo automático de descuentos",
            details: "Establecer umbrales para métricas de humedad, moho y violetas",
            icon: TargetIcon,
            roles: ['admin'],
        },
        {
            href: "/dashboard/cash-pos/customers",
            title: "Clientes",
            description: "Gestionar clientes de efectivo para asociación de recepción",
            details: "Registrar y gestionar clientes que venden fruta por efectivo",
            icon: UsersIcon,
            roles: ['operator', 'admin'],
        },
        {
            href: "/dashboard/cash-pos/fruit-types",
            title: "Tipos de Fruta",
            description: "Gestionar tipos de fruta disponibles para recepciones en efectivo",
            details: "Configurar tipos de fruta: Café, Cacao, Miel, Cocos",
            icon: AppleIcon,
            roles: ['admin'],
        },
    ];

    return (
        <div class="container mx-auto p-6">
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-2">
                    <ShieldIcon class="w-8 h-8 text-primary" />
                    <h1 class="text-3xl font-bold text-gray-900">Sistema POS (Caja Chica)</h1>
                </div>
                <p class="text-muted-foreground mt-2 text-gray-500">
                    Gestione recepciones de fruta en efectivo del mismo día con precios diarios y descuentos basados en calidad
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                    <Link key={item.href} href={item.href} class="block h-full">
                        <div class="bg-white rounded-lg border shadow-sm hover:shadow-lg transition-shadow cursor-pointer h-full p-6">
                            <div class="flex flex-col space-y-1.5 mb-4">
                                <div class="flex items-center gap-2">
                                    <item.icon class="w-5 h-5 text-primary" />
                                    <h3 class="font-semibold leading-none tracking-tight">{item.title}</h3>
                                </div>
                                <p class="text-sm text-muted-foreground text-gray-500">
                                    {item.description}
                                </p>
                            </div>
                            <div class="pt-0">
                                <p class="text-sm text-muted-foreground text-gray-600">
                                    {item.details}
                                </p>
                                <div class="mt-3">
                                    <span class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.roles.includes('admin') && !item.roles.includes('operator') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {item.roles.includes('admin') && !item.roles.includes('operator') ? 'Solo Admin' : 'Operador y Admin'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
});
