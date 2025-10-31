"use client";

import { DataTable, Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";

// ========================================
// 1. DEFINE YOUR DATA INTERFACE
// ========================================
interface YourDataType {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending";
  created_at: string;
  user?: {
    name: string;
    role: string;
  } | null;
}

// ========================================
// 2. PREPARE YOUR DATA
// ========================================
const data: YourDataType[] = [
  // Your data here...
];

// ========================================
// 3. DEFINE COLUMNS
// ========================================
const columns: Column<YourDataType>[] = [
  // Simple text column
  {
    key: "name",
    label: "Name",
    sortable: true,
    searchable: true,
  },

  // Email column
  {
    key: "email",
    label: "Email",
    sortable: true,
    searchable: true,
  },

  // Status with custom rendering (Badge)
  {
    key: "status",
    label: "Status",
    sortable: true,
    searchable: true,
    render: (value) => {
      const variants = {
        active: "default" as const,
        inactive: "secondary" as const,
        pending: "outline" as const,
      };
      return (
        <Badge variant={variants[value]}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      );
    },
  },

  // Date column with formatting
  {
    key: "created_at",
    label: "Created",
    sortable: true,
    searchable: false,
    render: (value) => new Date(value).toLocaleDateString("en-US"),
  },

  // Nested property (user.name)
  {
    key: "user.name",
    label: "User",
    sortable: true,
    searchable: true,
    render: (_, row) => row.user?.name || "N/A",
  },

  // Right-aligned numeric data
  {
    key: "score",
    label: "Score",
    sortable: true,
    searchable: false,
    align: "right",
    render: (value) => value?.toFixed(2) || "0.00",
  },

  // Actions column with buttons
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    searchable: false,
    align: "right",
    render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Link href={`/dashboard/items/${row.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/dashboard/items/${row.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

// ========================================
// 4. USE THE DATATABLE COMPONENT
// ========================================
export function YourTableComponent() {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search by name, email, or user..."
      pageSize={20}
      title="Your Data Title"
      emptyMessage="No items found. Create your first item to get started."
    />
  );
}

// ========================================
// OPTIONAL: Controlled Search Example
// ========================================
export function YourTableWithControlledSearch() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DataTable
      data={data}
      columns={columns}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      pageSize={20}
    />
  );
}

// ========================================
// OPTIONAL: Custom Search Fields Example
// ========================================
export function YourTableWithCustomSearch() {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search by name or email only..."
      searchableFields={["name", "email"]}
      pageSize={20}
    />
  );
}

// ========================================
// OPTIONAL: Conditional Columns Example
// ========================================
export function YourTableWithConditionalColumns({
  showStatus,
  showUser,
}: {
  showStatus?: boolean;
  showUser?: boolean;
}) {
  const columns: Column<YourDataType>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    ...(showStatus
      ? [
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (value) => <Badge>{value}</Badge>,
          },
        ]
      : []),
    ...(showUser
      ? [
          {
            key: "user.name",
            label: "User",
            sortable: true,
            render: (_, row) => row.user?.name || "N/A",
          },
        ]
      : []),
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <Button size="sm">View {row.name}</Button>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      pageSize={20}
    />
  );
}

/*
========================================
COLUMN CONFIGURATION OPTIONS
========================================

interface Column<T> {
  key: keyof T | string;              // Field name (supports "user.name")
  label: string;                      // Column header text
  sortable?: boolean;                 // Enable sorting (default: true)
  searchable?: boolean;               // Include in search (default: true)
  render?: (value: any, row: T) => React.ReactNode;  // Custom cell render
  align?: "left" | "right" | "center"; // Text alignment
  className?: string;                  // Additional CSS classes
}

========================================
COMMON PATTERNS
========================================

// 1. Badge Status
{
  key: "status",
  label: "Status",
  render: (value) => (
    <Badge variant={value === "active" ? "default" : "secondary"}>
      {value}
    </Badge>
  ),
}

// 2. Date Formatting
{
  key: "created_at",
  label: "Created",
  render: (value) => new Date(value).toLocaleDateString("en-US"),
}

// 3. Nested Object
{
  key: "user.profile.name",
  label: "Full Name",
  render: (_, row) => row.user?.profile?.name || "N/A",
}

// 4. Custom Actions
{
  key: "actions",
  label: "Actions",
  align: "right",
  render: (_, row) => (
    <div className="flex justify-end gap-2">
      <Button size="sm">Edit</Button>
      <Button size="sm" variant="destructive">Delete</Button>
    </div>
  ),
}

// 5. Conditional Content
{
  key: "value",
  label: "Value",
  render: (value, row) => {
    if (row.status === "inactive") {
      return <span className="text-gray-400">N/A</span>;
    }
    return value;
  },
}

// 6. Right-aligned Numbers
{
  key: "amount",
  label: "Amount",
  align: "right",
  render: (value) => `$${value.toFixed(2)}`,
}

========================================
TROUBLESHOOTING
========================================

Q: Search not working for nested properties?
A: Use searchableFields prop to specify exact fields:
   searchableFields={["name", "user.name", "email"]}

Q: Sort not working?
A: Set sortable: true for the column

Q: Custom render not showing data?
A: Use the 'row' parameter to access full row data:
   render: (_, row) => row.user?.name

Q: Want to limit search to specific fields?
A: Use searchableFields prop:
   <DataTable searchableFields={["name", "email"]} ... />

========================================
*/
