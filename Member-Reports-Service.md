# Member Reports Service

## Overview

Create a comprehensive member reporting service that provides business insights through scorecards and detailed tables for laundry business analytics.

## Phase 1: Scorecard Metrics Implementation

**Date Range Defaults:** For all date-range endpoints, if `from` or `to` parameters are not provided, the system will automatically set:
- `from`: Start of current month (1st day at 00:00:00)
- `to`: End of current day (23:59:59)

### 1. Total Customers Scorecard

**Description:** Count of all unique members in the system

- **Data Source:** `members` table
- **Calculation:** Simple COUNT of member records
- **API Endpoint:** `GET /members/reports/total-customers`
- **Response Format:**

```json
{
  "status": "success",
  "message": "Total customers retrieved successfully",
  "data": {
    "totalCustomers": 1250
  }
}
```

### 2. Average Customer Order Scorecard

**Description:** Average amount spent per order across all customers

- **Data Sources:** `payments` table, join with `orders` and `members`
- **Calculation:** SUM(payments.total) / COUNT(DISTINCT orders.memberId)
- **API Endpoint:** `GET /members/reports/average-order-value`
- **Response Format:**

```json
{
  "status": "success",
  "message": "Average customer order retrieved successfully",
  "data": {
    "averageOrderValue": 75000
  }
}
```

### 3. Active Members Scorecard

**Description:** Count of members who have placed orders in the last 30 days

- **Data Sources:** `members` table, join with `orders`
- **Calculation:** COUNT(DISTINCT members.id) WHERE orders.createdAt >= NOW() - INTERVAL '30 days'
- **API Endpoint:** `GET /members/reports/active-members`
- **Response Format:**

```json
{
  "status": "success",
  "message": "Active members retrieved successfully",
  "data": {
    "activeMembers": 342
  }
}
```

### 4. Total Member Orders Scorecard

**Description:** Total number of member orders within date range

- **Data Sources:** `members` table, join with `orders`
- **Calculation:** COUNT(orders.id) WHERE orders.memberId IS NOT NULL
- **API Endpoint:** `GET /members/reports/total-member-orders`
- **Response Format:**

```json
{
  "status": "success",
  "message": "Total member orders retrieved successfully",
  "data": {
    "totalMemberOrders": 1250
  }
}
```
