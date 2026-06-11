# Driver Dashboard — Frontend Implementation Prompt

## Overview

Build a driver dashboard at `/dashboard` using **shadcn components** and **TanStack React Query** for data fetching. The driver is a delivery person assigned routes with pickup/delivery stops.

All endpoints are under prefix `/driver-dashboard` and require `role === "driver"`.

Base URL: `<BACKEND_URL>/driver-dashboard`

The project uses **next-intl** for i18n. All user-facing text must use translation keys — do not hardcode any strings.

---

## Data Fetching (TanStack React Query)

Create custom hooks using TanStack React Query. Use separate hooks per endpoint so each section can load independently.

```tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/modules/driver-dashboard";

export const driverDashboardKeys = {
  all: ["driver-dashboard"] as const,
  metrics: () => [...driverDashboardKeys.all, "metrics"] as const,
  activeRoute: () => [...driverDashboardKeys.all, "active-route"] as const,
  recentDeliveries: () => [...driverDashboardKeys.all, "recent-deliveries"] as const,
  deliveryStatus: () => [...driverDashboardKeys.all, "delivery-status"] as const,
};

// The api.get below is just example, follow this project current way of data fetching for the actual data fetching (using elysia eden)

export function useDriverMetrics() {
  return useQuery({
    queryKey: driverDashboardKeys.metrics(),
    queryFn: () => api.get("/driver-dashboard/metrics").then(r => r.data.data),
  });
}

export function useActiveRoute() {
  return useQuery({
    queryKey: driverDashboardKeys.activeRoute(),
    queryFn: () => api.get("/driver-dashboard/active-route").then(r => r.data.data),
  });
}

export function useRecentDeliveries() {
  return useQuery({
    queryKey: driverDashboardKeys.recentDeliveries(),
    queryFn: () => api.get("/driver-dashboard/recent-deliveries").then(r => r.data.data),
  });
}

export function useDeliveryStatus() {
  return useQuery({
    queryKey: driverDashboardKeys.deliveryStatus(),
    queryFn: () => api.get("/driver-dashboard/delivery-status").then(r => r.data.data),
  });
}
```

---

## 1. Metrics Cards

**`GET /driver-dashboard/metrics`**

```json
{
  "status": "success",
  "data": {
    "totalRoutes": 5,
    "totalPickups": 12,
    "totalDeliveries": 8,
    "inProgress": 3
  }
}
```

| Field | Component | Translation key example |
|---|---|---|
| `totalRoutes` | `Card` — total routes ever assigned | `driverDashboard.metrics.totalRoutes` |
| `totalPickups` | `Card` | `driverDashboard.metrics.totalPickups` |
| `totalDeliveries` | `Card` | `driverDashboard.metrics.totalDeliveries` |
| `inProgress` | `Card` with warning/amber accent | `driverDashboard.metrics.inProgress` |

**Loading:** 4 x `<Skeleton className="h-24 w-full" />` in a grid.

**Error:** Show `<ErrorSection>` with `t("driverDashboard.error.metrics")` and a retry button.

---

## 2. Active Route

**`GET /driver-dashboard/active-route`**

Returns `null` when the driver has no active route.

```json
{
  "status": "success",
  "data": {
    "id": "rt-abc123",
    "assetId": "uuid",
    "assetName": "Honda Beat",
    "assetLicensePlate": "B 1234 ABC",
    "totalDeliveries": 5,
    "completedDeliveries": 2,
    "progress": 40,
    "statusBreakdown": [
      { "name": "in_progress", "value": 3 },
      { "name": "completed", "value": 2 }
    ]
  }
}
```

| Element | Component | Translation key |
|---|---|---|
| Section title | `CardTitle` | `driverDashboard.activeRoute.title` |
| Progress bar | `<Progress value={progress} />` | — |
| Vehicle plate | `<Badge>` — shows `assetLicensePlate` | — |
| Status breakdown | `PieChart` (recharts) or legend | — |
| CTA | `<Button>` linking to `/routes/:id` | `driverDashboard.activeRoute.viewDetails` |

**Loading:** `<Skeleton className="h-32 w-full" />`

**Error:** `<ErrorSection>` with retry.

**Empty (null route):**
- Title: `driverDashboard.activeRoute.title`
- Body: `driverDashboard.activeRoute.empty`

---

## 3. Recent Deliveries Table

**`GET /driver-dashboard/recent-deliveries`**

```json
{
  "status": "success",
  "data": [
    {
      "id": "dlv-...",
      "orderId": "o-xxxxxxx",
      "type": "pickup",
      "status": "in_progress",
      "customerName": "Budi",
      "address": "Jl. Merdeka No. 1",
      "requestedAt": "2025-06-10T08:00:00.000Z"
    }
  ]
}
```

| Column | Component | Translation key |
|---|---|---|
| Section title | `CardTitle` | `driverDashboard.recentDeliveries.title` |
| Customer | `TableCell` — `customerName` | `driverDashboard.recentDeliveries.customer` (header) |
| Address | `TableCell` — `address` (truncate if long) | `driverDashboard.recentDeliveries.address` (header) |
| Type | `<Badge>` — map `type` to `driverDashboard.deliveryType.pickup` / `.delivery` | — |
| Status | `<Badge variant={...}>` — see status config below | `driverDashboard.status.{key}` |
| Time | `TableCell` — relative format | — |

### Badge Variants by Status

| Status | Variant | Translation key |
|---|---|---|
| `requested` | `secondary` | `driverDashboard.status.requested` |
| `in_progress` | `default` / `warning` | `driverDashboard.status.inProgress` |
| `picked_up` | `info` / blue | `driverDashboard.status.pickedUp` |
| `completed` | `success` / green | `driverDashboard.status.completed` |
| `cancelled` | `destructive` / red | `driverDashboard.status.cancelled` |

### Type badge mapping

| Type | Translation key |
|---|---|
| `pickup` | `driverDashboard.deliveryType.pickup` |
| `delivery` | `driverDashboard.deliveryType.delivery` |

**Loading:** 5 rows of `<Skeleton className="h-10 w-full" />`

**Error:** `<ErrorSection>` with retry.

**Empty:** Show `t("driverDashboard.recentDeliveries.empty")` in the empty table row.

---

## 4. Delivery Status Distribution (Chart)

**`GET /driver-dashboard/delivery-status`**

```json
{
  "status": "success",
  "data": [
    { "name": "requested", "value": 1 },
    { "name": "in_progress", "value": 3 },
    { "name": "picked_up", "value": 2 },
    { "name": "completed", "value": 10 },
    { "name": "cancelled", "value": 1 }
  ]
}
```

| Element | Component | Translation key |
|---|---|---|
| Section title | `CardTitle` | `driverDashboard.statusChart.title` |
| Chart | `<PieChart>` or `<BarChart>` (recharts) | — |
| Slice labels | Use translation keys from status config above | — |

**Loading:** `<Skeleton className="h-48 w-full" />`

**Error:** `<ErrorSection>` with retry.

**Empty:** `t("driverDashboard.statusChart.empty")` in chart area.

---

## Reusable Components

### ErrorSection

```tsx
// components/error-section.tsx
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorSectionProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorSection({ message, onRetry }: ErrorSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
```

### StatusBadge

```tsx
// components/status-badge.tsx
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

type DeliveryStatus = "requested" | "in_progress" | "picked_up" | "completed" | "cancelled";

const statusVariant: Record<DeliveryStatus, "secondary" | "default" | "info" | "success" | "destructive"> = {
  requested: "secondary",
  in_progress: "default",
  picked_up: "info",
  completed: "success",
  cancelled: "destructive",
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const t = useTranslations("driverDashboard.status");
  return <Badge variant={statusVariant[status]}>{t(status)}</Badge>;
}
```

> Note: `"info"` variant may need to be added to your shadcn `Badge` component if it doesn't exist.

---

## Layout

```
+-------------------------------------------------------+
|  [Total Routes]  [Total Pickups]  [Total Deliv.]  [In Progress]
+-------------------------------------------------------+
|  Active Route (Progress + Vehicle)    |  Status Chart  |
+-------------------------------------------------------+
|  Recent Deliveries (Table)                             |
+-------------------------------------------------------+
```

- Top row: 4 `Card`s in responsive grid (`grid-cols-2 md:grid-cols-4`)
- Middle row: 2-column grid — left active route card with `Progress`, right chart
- Bottom: Full-width table

---

## State Matrix

| State | Behavior |
|---|---|
| **Loading** | Per-section `<Skeleton>` placeholders |
| **Error** | Per-section `<ErrorSection>` with retry button calling `refetch()` |
| **Empty** (driver has no data at all) | Metrics show 0s; active route shows `empty` key; table shows `empty` key; chart shows `empty` key |
| **No active route** | Active route section shows `empty` key; all other sections render normally |

---

## next-intl Translation Keys Structure

```json
{
  "driverDashboard": {
    "metrics": {
      "totalRoutes": "Total Routes",
      "totalPickups": "Total Pickups",
      "totalDeliveries": "Total Deliveries",
      "inProgress": "In Progress"
    },
    "activeRoute": {
      "title": "Active Route",
      "viewDetails": "View Route Details",
      "empty": "No active route. Wait for admin to assign one."
    },
    "recentDeliveries": {
      "title": "Recent Deliveries",
      "customer": "Customer",
      "address": "Address",
      "type": "Type",
      "status": "Status",
      "time": "Time",
      "empty": "No deliveries yet"
    },
    "deliveryType": {
      "pickup": "Pickup",
      "delivery": "Delivery"
    },
    "status": {
      "requested": "Requested",
      "inProgress": "In Progress",
      "pickedUp": "Picked Up",
      "completed": "Completed",
      "cancelled": "Cancelled"
    },
    "statusChart": {
      "title": "Delivery Status",
      "empty": "No delivery data yet"
    },
    "error": {
      "metrics": "Failed to load metrics",
      "activeRoute": "Failed to load active route",
      "recentDeliveries": "Failed to load recent deliveries",
      "statusChart": "Failed to load delivery status"
    }
  }
}
```

## Dependencies

- `@tanstack/react-query` — data fetching & caching
- `recharts` — `PieChart` / `BarChart`
- shadcn components: `Card`, `Progress`, `Badge`, `Table`, `Button`, `Skeleton` (already in project)
- `next-intl` — `useTranslations()` hook (already in project)
