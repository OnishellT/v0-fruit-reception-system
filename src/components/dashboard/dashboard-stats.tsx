/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react';
import { useEffect, useState } from "react";
import { Package, TrendingUp, DollarSign, Activity } from "lucide-react";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Card components (simplified for React usage within Qwik)
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-lg border bg-white text-gray-950 shadow-sm ${className || ''}`}>{children}</div>
);
const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}>{children}</div>
);
const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`}>{children}</h3>
);
const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-6 pt-0 ${className || ''}`}>{children}</div>
);

interface DashboardMetrics {
    today: {
        regularReceptions: number;
        cashReceptions: number;
        totalReceptions: number;
        regularWeight: number;
        cashWeight: number;
        totalWeight: number;
        regularRevenue: number;
        cashRevenue: number;
        totalRevenue: number;
    };
    weekly: {
        regularReceptions: number;
        cashReceptions: number;
        totalReceptions: number;
        regularWeight: number;
        cashWeight: number;
        totalWeight: number;
        regularRevenue: number;
        cashRevenue: number;
        totalRevenue: number;
    };
    monthly: {
        regularReceptions: number;
        cashReceptions: number;
        totalReceptions: number;
        regularWeight: number;
        cashWeight: number;
        totalWeight: number;
        regularRevenue: number;
        cashRevenue: number;
        totalRevenue: number;
    };
    topFruitTypes: Array<{
        name: string;
        regularWeight: number;
        cashWeight: number;
        totalWeight: number;
    }>;
    recentActivity: Array<{
        id: number;
        type: 'regular' | 'cash';
        fruitType: string;
        customer: string;
        weight: number;
        revenue: number;
        createdAt: string; // Changed to string for serialization
    }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function DashboardStatsReact({ initialMetrics }: { initialMetrics?: DashboardMetrics | null }) {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics || null);
    const [loading, setLoading] = useState(!initialMetrics);

    useEffect(() => {
        if (initialMetrics) {
            setMetrics(initialMetrics);
            setLoading(false);
        }
    }, [initialMetrics]);

    if (loading) {
        return <div className="p-4">Cargando estadísticas...</div>;
    }

    if (!metrics) {
        return <div className="p-4 text-red-500">No hay datos disponibles</div>;
    }

    // Charts removed to fix build (recharts dependency issue)
    // const weeklyTrendData = [
    //     { name: 'Hoy', regular: metrics.today.regularReceptions, cash: metrics.today.cashReceptions },
    //     { name: 'Semana', regular: metrics.weekly.regularReceptions, cash: metrics.weekly.cashReceptions },
    //     { name: 'Mes', regular: metrics.monthly.regularReceptions, cash: metrics.monthly.cashReceptions },
    // ];

    // const weightTrendData = [
    //     { name: 'Hoy', regular: metrics.today.regularWeight, cash: metrics.today.cashWeight },
    //     { name: 'Semana', regular: metrics.weekly.regularWeight, cash: metrics.weekly.cashWeight },
    //     { name: 'Mes', regular: metrics.monthly.regularWeight, cash: metrics.monthly.cashWeight },
    // ];

    // const revenueTrendData = [
    //     { name: 'Hoy', regular: metrics.today.regularRevenue, cash: metrics.today.cashRevenue },
    //     { name: 'Semana', regular: metrics.weekly.regularRevenue, cash: metrics.weekly.cashRevenue },
    //     { name: 'Mes', regular: metrics.monthly.regularRevenue, cash: metrics.monthly.cashRevenue },
    // ];

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Recepciones Hoy</CardTitle>
                        <Package className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.today.totalReceptions}</div>
                        <p className="text-xs text-gray-500">
                            Regular: {metrics.today.regularReceptions} | Cash: {metrics.today.cashReceptions}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Peso Total (kg)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.today.totalWeight.toFixed(2)}</div>
                        <p className="text-xs text-gray-500">
                            Regular: {metrics.today.regularWeight.toFixed(2)} | Cash: {metrics.today.cashWeight.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.today.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-gray-500">
                            Regular: ${metrics.today.regularRevenue.toFixed(2)} | Cash: {metrics.today.cashRevenue.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
                        <Activity className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.recentActivity.length}</div>
                        <p className="text-xs text-gray-500">Transacciones recientes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts removed to fix build (recharts dependency issue) */}
            {/* 
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tendencia de Recepciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={weeklyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="regular" stroke="#8884d8" name="Regular" />
                                    <Line type="monotone" dataKey="cash" stroke="#82ca9d" name="Cash POS" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tendencia de Peso (kg)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={weightTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="regular" fill="#8884d8" name="Regular" />
                                    <Bar dataKey="cash" fill="#82ca9d" name="Cash POS" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tendencia de Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={revenueTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']} />
                                    <Line type="monotone" dataKey="regular" stroke="#8884d8" name="Regular" />
                                    <Line type="monotone" dataKey="cash" stroke="#82ca9d" name="Cash POS" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
            */}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tipos de Fruta Más Procesados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.topFruitTypes.slice(0, 5).map((fruit, index) => (
                                <div key={fruit.name} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-sm font-medium">{fruit.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{fruit.totalWeight.toFixed(2)} kg</div>
                                        <div className="text-xs text-gray-500">
                                            R: {fruit.regularWeight.toFixed(2)} | C: {fruit.cashWeight.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export const DashboardStats = qwikify$(DashboardStatsReact, { clientOnly: true });
