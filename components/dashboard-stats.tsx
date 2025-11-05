"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Users, DollarSign, Calendar, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface DashboardMetrics {
  // Today's metrics
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

  // Weekly metrics (last 7 days)
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

  // Monthly metrics (last 30 days)
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

  // Top performers
  topFruitTypes: Array<{
    name: string;
    regularWeight: number;
    cashWeight: number;
    totalWeight: number;
  }>;

  // Recent activity
  recentActivity: Array<{
    id: number;
    type: 'regular' | 'cash';
    fruitType: string;
    customer: string;
    weight: number;
    revenue: number;
    createdAt: Date;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface DashboardStatsProps {
  initialMetrics?: DashboardMetrics | null;
}

export function DashboardStats({ initialMetrics }: DashboardStatsProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics || null);
  const [loading, setLoading] = useState(!initialMetrics);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMetrics) {
      setMetrics(initialMetrics);
      setLoading(false);
    } else {
      setError("No dashboard metrics available");
      setLoading(false);
    }
  }, [initialMetrics]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Error loading dashboard metrics: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const weeklyTrendData = [
    { name: 'Hoy', regular: metrics.today.regularReceptions, cash: metrics.today.cashReceptions },
    { name: 'Semana', regular: metrics.weekly.regularReceptions, cash: metrics.weekly.cashReceptions },
    { name: 'Mes', regular: metrics.monthly.regularReceptions, cash: metrics.monthly.cashReceptions },
  ];

  const weightTrendData = [
    { name: 'Hoy', regular: metrics.today.regularWeight, cash: metrics.today.cashWeight },
    { name: 'Semana', regular: metrics.weekly.regularWeight, cash: metrics.weekly.cashWeight },
    { name: 'Mes', regular: metrics.monthly.regularWeight, cash: metrics.monthly.cashWeight },
  ];

  const revenueTrendData = [
    { name: 'Hoy', regular: metrics.today.regularRevenue, cash: metrics.today.cashRevenue },
    { name: 'Semana', regular: metrics.weekly.regularRevenue, cash: metrics.weekly.cashRevenue },
    { name: 'Mes', regular: metrics.monthly.regularRevenue, cash: metrics.monthly.cashRevenue },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recepciones Hoy</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.today.totalReceptions}</div>
            <p className="text-xs text-muted-foreground">
              Regular: {metrics.today.regularReceptions} | Cash: {metrics.today.cashReceptions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Peso Total (kg)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.today.totalWeight.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Regular: {metrics.today.regularWeight.toFixed(2)} | Cash: {metrics.today.cashWeight.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.today.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Regular: ${metrics.today.regularRevenue.toFixed(2)} | Cash: ${metrics.today.cashRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">Transacciones recientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Receptions Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Recepciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="regular" stroke="#8884d8" name="Regular" />
                <Line type="monotone" dataKey="cash" stroke="#82ca9d" name="Cash POS" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weight Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Peso (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weightTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="regular" fill="#8884d8" name="Regular" />
                <Bar dataKey="cash" fill="#82ca9d" name="Cash POS" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart and Top Performers */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
                <Line type="monotone" dataKey="regular" stroke="#8884d8" name="Regular" />
                <Line type="monotone" dataKey="cash" stroke="#82ca9d" name="Cash POS" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Fruit Types */}
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
                    <div className="text-xs text-muted-foreground">
                      R: {fruit.regularWeight.toFixed(2)} | C: {fruit.cashWeight.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentActivity.slice(0, 5).map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant={activity.type === 'regular' ? 'default' : 'secondary'}>
                    {activity.type === 'regular' ? 'Regular' : 'Cash POS'}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{activity.fruitType}</p>
                    <p className="text-xs text-muted-foreground">{activity.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{activity.weight.toFixed(2)} kg</p>
                  <p className="text-xs text-muted-foreground">${activity.revenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
