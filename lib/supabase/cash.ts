import { createClient } from "./server";

// Cash domain Row Level Security (RLS) policies
// This file contains SQL for setting up RLS policies for all cash tables

export const CASH_RLS_POLICIES = `
-- Enable RLS on all cash tables
ALTER TABLE cash_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_fruit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_daily_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_quality_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_receptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CASH CUSTOMERS POLICIES
-- ============================================================================

-- All authenticated users can view customers
CREATE POLICY "cash_customers_select_authenticated" ON cash_customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin and Operator can create/modify customers
CREATE POLICY "cash_customers_modify_admin_operator" ON cash_customers
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'operator'));

-- ============================================================================
-- CASH FRUIT TYPES POLICIES
-- ============================================================================

-- All authenticated users can view fruit types
CREATE POLICY "cash_fruit_types_select_authenticated" ON cash_fruit_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only Admin can modify fruit types
CREATE POLICY "cash_fruit_types_modify_admin" ON cash_fruit_types
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- CASH DAILY PRICES POLICIES
-- ============================================================================

-- All authenticated users can view prices
CREATE POLICY "cash_daily_prices_select_authenticated" ON cash_daily_prices
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only Admin can create/modify prices
CREATE POLICY "cash_daily_prices_modify_admin" ON cash_daily_prices
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- CASH QUALITY THRESHOLDS POLICIES
-- ============================================================================

-- All authenticated users can view thresholds
CREATE POLICY "cash_quality_thresholds_select_authenticated" ON cash_quality_thresholds
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only Admin can create/modify thresholds
CREATE POLICY "cash_quality_thresholds_modify_admin" ON cash_quality_thresholds
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- CASH RECEPTIONS POLICIES
-- ============================================================================

-- All authenticated users can view receptions
CREATE POLICY "cash_receptions_select_authenticated" ON cash_receptions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin and Operator can create/modify receptions
CREATE POLICY "cash_receptions_modify_admin_operator" ON cash_receptions
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'operator'));
`;

// Helper function to get current user role
export async function getCurrentUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user role from JWT or user metadata
  // This assumes role is stored in user metadata or JWT
  return user.user_metadata?.role || user.app_metadata?.role || 'viewer';
}

// Helper function to check if user has required role
export async function hasRole(requiredRoles: string | string[]) {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(role);
}

// Role-based permission checks
export const CASH_PERMISSIONS = {
  // Admin only
  canManagePrices: async () => await hasRole('admin'),
  canManageThresholds: async () => await hasRole('admin'),
  canManageFruitTypes: async () => await hasRole('admin'),

  // Admin and Operator
  canManageReceptions: async () => await hasRole(['admin', 'operator']),
  canManageCustomers: async () => await hasRole(['admin', 'operator']),

  // All authenticated users
  canViewData: async () => {
    const role = await getCurrentUserRole();
    return role !== null;
  },
};