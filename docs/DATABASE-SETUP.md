# Database Setup Guide

## The Problem

You're getting the error: **"Error al crear recepción: invalid input syntax for type uuid: """**

This happens because the database is missing required data (providers, drivers, fruit types).

---

## Quick Fix

The form now shows a clear message when data is missing. To fix:

### 1. Add Providers
Go to: **Dashboard → Proveedores → Nuevo**
- Add at least one provider
- Example: Code: "PROV001", Name: "Finca El Paraíso"

### 2. Add Drivers
Go to: **Dashboard → Choferes → Nuevo**
- Add at least one driver
- Example: Name: "Carlos Rodríguez"

### 3. Add Fruit Types
Go to: **Dashboard → Tipos de Fruto → Nuevo**
- Add at least one fruit type
- Example: Type: "CACAO", Subtype: "Convencional"

---

## Full Database Setup (If Tables Don't Exist)

If you get errors about missing tables, you need to create them:

### Option 1: Use Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to **SQL Editor**
4. Run the SQL files in this order:
   - `01-create-tables.sql`
   - `02-seed-data.sql`
   - `03-row-level-security.sql`

### Option 2: Use the Setup Script
Run the Node.js setup script:
```bash
npx tsx scripts/setup-asociaciones-certifications.ts
```

---

## What the Error Messages Mean

| Error | Meaning | Solution |
|-------|---------|----------|
| `invalid input syntax for type uuid: ""` | Empty UUID (no provider/driver/fruit type selected) | Add data and select from dropdown |
| `relation "providers" does not exist` | Tables don't exist | Run `01-create-tables.sql` |
| `permission denied` | RLS policies not set | Run `03-row-level-security.sql` |
| `No autorizado` | Not logged in | Login first |

---

## Seed Data

The `02-seed-data.sql` file contains:

### Fruit Types:
- CACAO: Convencional, Verde, Seco
- CAFÉ: Arábica, Robusta, Pergamino
- MIEL: Multifloral, Monofloral
- COCOS: Verde, Seco

### Sample Providers:
- PROV001 - Finca El Paraíso
- PROV002 - Cooperativa Los Cacaoteros
- PROV003 - Hacienda La Esperanza

### Sample Drivers:
- Carlos Rodríguez
- Luis Fernández
- Miguel Santos

### Admin User:
- Username: admin
- Password: admin123

---

## Testing

After adding the data:

1. Go to **Nueva Recepción**
2. You should see:
   - ✅ Proveedores cargados
   - ✅ Choferes cargados
   - ✅ Tipos de fruto cargados
3. Select each field from the dropdowns
4. Add at least one detail
5. Click "Guardar Recepción"
6. Should succeed! ✅

---

## If You Need to Reset

To reset the database:

```sql
-- DROP ALL TABLES (CAREFUL!)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reception_details CASCADE;
DROP TABLE IF EXISTS receptions CASCADE;
DROP TABLE IF EXISTS fruit_types CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then recreate tables and seed data
-- Run 01-create-tables.sql
-- Run 02-seed-data.sql
-- Run 03-row-level-security.sql
```

---

## Current Status

✅ Error logging improved - you'll see the exact error now
✅ Form validation added - shows what's missing
✅ User guidance added - links to add missing data

Just add the required data through the UI and you'll be able to create receptions!

---

*Need help? Check the console logs (F12) for detailed error messages.*
