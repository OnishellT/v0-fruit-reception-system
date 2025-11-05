"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Plus, TrendingUp } from "lucide-react";
import { PriceForm } from "@/components/cash-pos/price-form";
import { PriceList } from "@/components/cash-pos/price-list";
import { getDailyPrices } from "@/lib/actions/cash/prices";
import { toast } from "sonner";

interface TodayPrice {
  id: number;
  fruitType: string;
  price: number;
  date: string;
  active: boolean;
}

export default function PricingPage() {
  const [todayPrices, setTodayPrices] = useState<TodayPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayPrices();
  }, []);

  const loadTodayPrices = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      const result = await getDailyPrices({
        start_date: today,
        end_date: today,
        active_only: true,
      });

      if (result.success && result.data) {
        // Transform the data to match the expected format
        const transformedPrices = result.data.map((price: any) => ({
          id: price.id,
          fruitType: price.fruitType?.name || `Tipo ${price.fruitTypeId}`,
          price: parseFloat(price.pricePerKg),
          date: price.priceDate,
          active: price.active,
        }));
        setTodayPrices(transformedPrices);
      } else {
        toast.error(result.error || "Failed to load today's prices");
        setTodayPrices([]);
      }
    } catch (error) {
      console.error("Error loading today's prices:", error);
      toast.error("Failed to load today's prices");
      setTodayPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const totalActivePrices = todayPrices.filter(p => p.active).length;
  const totalValue = todayPrices.reduce((sum, p) => sum + (p.active ? p.price : 0), 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cash POS Pricing</h1>
            <p className="text-muted-foreground">
              Manage daily prices for fruit types in the cash point of sale system
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Set New Price
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prices Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivePrices}</div>
            <p className="text-xs text-muted-foreground">
              Fruit types with prices set
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$ {totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Combined pricing for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalActivePrices > 0 ? "Active" : "No Prices Set"}
            </div>
            <p className="text-xs text-muted-foreground">
              Current pricing status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Prices Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Today's Prices</CardTitle>
          <CardDescription>
            Current active prices for {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading prices...</p>
            </div>
          ) : todayPrices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No prices set for today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {todayPrices.map((price, index) => (
                <div
                  key={`price-${price.id}-${index}`}
                  className="p-4 border rounded-lg bg-muted/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{price.fruitType}</h3>
                    <Badge variant={price.active ? "default" : "secondary"}>
                      {price.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    RD$ {price.price.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    per kg
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Set New Price */}
        <Card>
          <CardHeader>
            <CardTitle>Set New Price</CardTitle>
            <CardDescription>
              Configure pricing for fruit types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PriceForm />
          </CardContent>
        </Card>

        {/* Price History */}
        <Card>
          <CardHeader>
            <CardTitle>Price History</CardTitle>
            <CardDescription>
              View and manage historical pricing data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PriceList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}