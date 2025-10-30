# Reception Details Fix - Fruit Type Join Error

## Error
```
Runtime TypeError: Cannot read properties of undefined (reading 'type')
    at <anonymous> (app/dashboard/reception/[id]/page.tsx:177:40)
    at Array.map (<anonymous>:1:18)
    at ReceptionDetailPage (app/dashboard/reception/[id]/page.tsx:173:25)
```

## Root Cause
The `getReceptionDetails()` function in `lib/actions/reception.ts` was fetching reception details without joining the `fruit_types` table. This caused `detail.fruit_type` to be `undefined`, and accessing `.type` threw an error.

## Solution

### 1. Fixed Query in `lib/actions/reception.ts`

**Before:**
```typescript
const { data: details, error: detailsError } = await supabase
  .from("reception_details")
  .select("*")
  .eq("reception_id", receptionId)
  .order("line_number");
```

**After:**
```typescript
const { data: details, error: detailsError } = await supabase
  .from("reception_details")
  .select(
    `
    *,
    fruit_type:fruit_types(id, type, subtype)
  `,
  )
  .eq("reception_id", receptionId)
  .order("line_number");
```

### 2. Added Safety Checks in `app/dashboard/reception/[id]/page.tsx`

**Before:**
```typescript
<TableCell className="font-medium">
  {detail.fruit_type.type}
</TableCell>
<TableCell>{detail.fruit_type.subtype}</TableCell>
```

**After:**
```typescript
<TableCell className="font-medium">
  {detail.fruit_type?.type || "N/A"}
</TableCell>
<TableCell>{detail.fruit_type?.subtype || "N/A"}</TableCell>
```

## What Was Changed

1. **Query Enhancement**: Added foreign key join to `fruit_types` table in the `reception_details` query
2. **Optional Chaining**: Used `?.` operator for safe property access
3. **Fallback Values**: Added "N/A" fallback for missing data

## Why This Works

1. **Missing Join**: The original query didn't fetch related fruit type data
2. **Undefined Property**: Accessing `.type` on `undefined` caused the error
3. **Added Join**: Now Supabase fetches the related fruit type data using the foreign key relationship
4. **Safe Access**: Optional chaining (`?.`) prevents errors if data is missing

## Files Modified

1. **`lib/actions/reception.ts`** (lines 206-215)
   - Updated `getReceptionDetails()` query to include fruit_types join

2. **`app/dashboard/reception/[id]/page.tsx`** (lines 177-179)
   - Added optional chaining for safe access

## Testing

After the fix:
- ✅ Reception detail pages load without errors
- ✅ Fruit type and subtype display correctly
- ✅ "N/A" shown if fruit type data is missing (graceful degradation)
- ✅ Table renders properly with all reception details

---

*Fix applied and tested - error resolved!*
