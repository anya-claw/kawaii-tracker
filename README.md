# Kawaii Tracker API & CLI Contracts

This document strictly defines the contracts, models, and query parameters for `kawaii-tracker`. This is the single source of truth for both the current CLI implementation and the future REST API.

## 1. Core Principles

- **Strict Layering**: The CLI and API are merely delivery mechanisms (Controllers). They must parse their respective inputs (args/JSON or HTTP requests) into standardized Data Transfer Objects (DTOs) before passing them to the **Service Layer**.
- **Business Day vs. Calendar Day**: All queries and date calculations must respect the `REFRESH_TIME` offset (e.g., `04:00`). "Today" begins at `04:00 AM` local time, not midnight.
- **Soft Deletion**: Records are never `DELETE`d via SQL. They are marked with a `deleted_at` timestamp. Queries must always filter out `deleted_at IS NOT NULL` unless explicitly asked for trash.

---

## 2. Database Schema

### Table: `tags` (Habits/Categories)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `tag`: TEXT UNIQUE NOT NULL
- `description`: TEXT
- `is_daily`: INTEGER NOT NULL DEFAULT 0 (1 = true, 0 = false)
- `created_at`: TEXT NOT NULL (ISO 8601)
- `updated_at`: TEXT NOT NULL (ISO 8601)
- `deleted_at`: TEXT (ISO 8601, nullable)

### Table: `events` (Check-ins/Records)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `tag_id`: INTEGER NOT NULL (Foreign Key to tags.id)
- `details`: TEXT
- `mood`: TEXT
- `completed`: INTEGER NOT NULL DEFAULT 0 (1 = true, 0 = false)
- `daily_mark`: INTEGER NOT NULL DEFAULT 0 (1 = system placeholder, 0 = user check-in)
- `created_at`: TEXT NOT NULL (ISO 8601)
- `updated_at`: TEXT NOT NULL (ISO 8601)
- `deleted_at`: TEXT (ISO 8601, nullable)

---

## 3. Query Parameter Specifications

The `query` object is a standardized way to filter events and calculate statistics. It must support the following formats across CLI and API:

### Time Filters
- `range`: A shorthand for common periods.
  - `session` / `cycle` (Since current REFRESH_TIME, e.g., today's 04:05)
  - `today` (Same as session)
  - `yesterday`
  - `this_week`
  - `this_month`
  - `all` (Bypass time filters)
- `since`: A relative or absolute start time.
  - Relative: `3m` (3 minutes ago), `12h` (12 hours ago), `30d` (30 days ago), `3M` (3 months ago).
  - Absolute: `2026-04-01`
- `until`: Similar format to `since`, defining the end boundary.

### Value Filters
- `tag`: Filter by specific tag name (e.g., `study`).
- `completed`: Boolean filter (e.g., `true` for only completed events).
- `limit`: Integer limit for pagination.

---

## 4. API / CLI Contracts

### Module: Tags (Habit Management)

| Action | CLI Command | Future API Route | Payload (DTO) | Behavior / Returns |
| :--- | :--- | :--- | :--- | :--- |
| **Create** | `--addTag '{"tag":"study","description":"...","is_daily":true}'` | `POST /api/tags` | `{ tag: string, description?: string, is_daily: boolean }` | Creates a new tag. Throws if exists. |
| **List** | `--listTag` | `GET /api/tags` | `(None)` | Returns all active tags. |
| **Update** | `--updateTag '{"tag":"study","update":{"description":"..."}}'` | `PATCH /api/tags/:tag_name` | `{ update: { description?: string, is_daily?: boolean } }` | Updates tag properties. |
| **Delete** | `--delTag study` | `DELETE /api/tags/:tag_name` | `(None)` | Soft deletes the tag. Does not delete associated events. |

### Module: Events (Check-ins)

| Action | CLI Command | Future API Route | Payload (DTO) | Behavior / Returns |
| :--- | :--- | :--- | :--- | :--- |
| **Create/Complete** | `--addEvent '{"tag":"study","details":"...","mood":"🌟"}'` | `POST /api/events` | `{ tag: string, details?: string, mood?: string }` | Core logic: If `is_daily=1`, update today's placeholder (`daily_mark=1, completed=0`) to `completed=1` and set details/mood. If no placeholder exists or it's already completed, create a new record (`completed=1, daily_mark=0`). If `is_daily=0`, simply create a new record. |
| **List/Search** | `--listEvent '{"query":{"tag":"study","range":"today","limit":10}}'` | `GET /api/events?tag=study&range=today&limit=10` | `{ query: { tag?: string, range?: string, since?: string, until?: string, limit?: number } }` | Returns a list of events matching the query parameters. |
| **Update** | `--updateEvent '{"eventId":1,"update":{"mood":"☁️"}}'` | `PATCH /api/events/:id` | `{ eventId: number, update: { details?: string, mood?: string } }` | Updates specific event fields. |
| **Delete** | `--delEvent '{"eventId":1}'` OR `--delEvent '{"eventIds":[1,2]}'` | `DELETE /api/events` | `{ eventId?: number, eventIds?: number[] }` | Soft deletes one or multiple events. |

### Module: Statistics & System

| Action | CLI Command | Future API Route | Payload (DTO) | Behavior / Returns |
| :--- | :--- | :--- | :--- | :--- |
| **Statistics** | `--statistic` | `GET /api/statistics` | `(None)` | Returns aggregated stats for ALL tags. |
| **Filtered Stats** | `--statistic '{"query":{"tag":"study","since":"30d"}}'` | `GET /api/statistics?tag=study&since=30d` | `{ query: { tag?: string, since?: string, until?: string } }` | Returns filtered stats. Must calculate: `first_checkin_at`, `total_checkin_days`, `current_streak`, `longest_streak`. Streak logic must group multiple check-ins on the same "Business Day" as 1 day. |
| **Cron Job** | `--cron-job` | `POST /api/cron/daily` | `(None)` | System automated task (runs at REFRESH_TIME). Scans all `is_daily=1` tags. Generates a placeholder event (`completed=0`, `daily_mark=1`) for the new business day. |