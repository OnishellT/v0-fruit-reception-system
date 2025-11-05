"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsAdmin, useIsOperatorOrAdmin } from "@/hooks/use-user-session";
import Link from "next/link";
import { Shield, Users, Receipt, DollarSign, Target, Apple } from "lucide-react";

export default function CashPOSPage() {
  const isAdmin = useIsAdmin();
  const isOperatorOrAdmin = useIsOperatorOrAdmin();

  const menuItems = [
    {
      href: "/dashboard/cash-pos/receptions",
      title: "Receptions",
      description: "Create and manage cash fruit receptions with automatic discount calculations",
      details: "View all receptions, create new ones, and edit existing records",
      icon: Receipt,
      roles: ['operator', 'admin'], // Available to operators and admins
      show: isOperatorOrAdmin,
    },
    {
      href: "/dashboard/cash-pos/pricing",
      title: "Daily Pricing",
      description: "Set daily prices per fruit type for reception calculations",
      details: "Configure prices that will be used for all receptions on that date",
      icon: DollarSign,
      roles: ['admin'], // Admin only
      show: isAdmin,
    },
    {
      href: "/dashboard/cash-pos/quality",
      title: "Quality Thresholds",
      description: "Configure quality standards for automatic discount calculation",
      details: "Set thresholds for humidity, moho, and violetas metrics",
      icon: Target,
      roles: ['admin'], // Admin only
      show: isAdmin,
    },
    {
      href: "/dashboard/cash-pos/customers",
      title: "Customers",
      description: "Manage cash customers for reception association",
      details: "Register and manage customers who sell fruit for cash",
      icon: Users,
      roles: ['operator', 'admin'], // Available to operators and admins
      show: isOperatorOrAdmin,
    },
    {
      href: "/dashboard/cash-pos/fruit-types",
      title: "Fruit Types",
      description: "Manage available fruit types for cash receptions",
      details: "Configure fruit types: Café, Cacao, Miel, Cocos",
      icon: Apple,
      roles: ['admin'], // Admin only
      show: isAdmin,
    },
  ];

  const visibleItems = menuItems.filter(item => item.show);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Cash Point-of-Sale System</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage same-day cash fruit receptions with daily pricing and quality-based discounts
        </p>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Access Level:</strong> {isAdmin ? 'Administrator' : isOperatorOrAdmin ? 'Operator' : 'Viewer'}
            {isAdmin && ' - Full system access including pricing and configuration'}
            {isOperatorOrAdmin && !isAdmin && ' - Can create and manage receptions and customers'}
            {!isOperatorOrAdmin && ' - View-only access to system data'}
          </p>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            You don't have permission to access any Cash POS features. Please contact an administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {item.details}
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {item.roles.includes('admin') ? 'Admin' : 'Operator+'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}