# Kawaii Tracker API & CLI Contracts

This document strictly defines the contracts, models, and query parameters for `kawaii-tracker`. This is the single source of truth for both the current CLI implementation and the future REST API.

## 1. Core Principles

- **Strict Layering**: The CLI and API are merely delivery mechanisms (Controllers). They must parse their respective inputs (args/JSON or HTTP requests) into standardized Data Transfer Objects (DTOs) before passing them to the **Service Layer**.
- **Business Day vs. Calendar Day**: All queries and date calculations must respect the `REFRESH_TIME` offset (e.g., `04:00`). "Today" begins at `04:00 AM` local time, not midnight.
- **Soft Deletion**: Records are never `DELETE`d via SQL. They are marked with a `deleted_at` timestamp. Queries must always filter out `deleted_at IS NOT NULL` unless explicitly asked for trash.

---

## 2. Database Schema

### Table: `tracker_tags` (Habits/Categories)

- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `tag`: TEXT UNIQUE NOT NULL
- `description`: TEXT
- `options`: TEXT NOT NULL DEFAULT '{"recurring":null,"repeat":{"target":1}}' -- JSON schema: {"recurring": { "type":"weekly"|"daily"|"monthly"|null}, "repeat": {"target": number}}
- `created_at`: TEXT NOT NULL (ISO 8601)
- `updated_at`: TEXT NOT NULL (ISO 8601)
- `deleted_at`: TEXT (ISO 8601, nullable)

### Table: `tracker_events` (Check-ins/Records)

- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `tag_id`: INTEGER NOT NULL (Foreign Key to `tracker_tags.id`)
- `parent_id`: INTEGER (Foreign Key to `tracker_events.id`, nullable)
- `details`: TEXT
- `mood`: TEXT
- `completed_at`: TEXT (ISO 8601, nullable)
- `recurring_mark`: INTEGER NOT NULL DEFAULT 0 (1 = true, 0 = false, identifies parent lifecycle events)
- `created_at`: TEXT NOT NULL (ISO 8601)
- `updated_at`: TEXT NOT NULL (ISO 8601)
- `deleted_at`: TEXT (ISO 8601, nullable)

### Table: `todo_groups` (Kanban Columns)

- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `name`: TEXT NOT NULL
- `order_index`: INTEGER NOT NULL DEFAULT 0
- `created_at`: TEXT NOT NULL (ISO 8601)
- `updated_at`: TEXT NOT NULL (ISO 8601)
- `deleted_at`: TEXT (ISO 8601, nullable)

### Table: `todo_items`

- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `todo_group_id`: INTEGER NOT NULL (Foreign Key to `todo_groups.id`)
- `parent_id`: INTEGER (Foreign Key to `todo_items.id`, nullable)
- `title`: TEXT NOT NULL
- `description`: TEXT
- `due_date`: TEXT (ISO 8601, nullable)
- `priority`: TEXT NOT NULL DEFAULT 'medium' (low, medium, high)
- `status`: TEXT NOT NULL DEFAULT 'pending' (pending, doing, done)
- `order_index`: INTEGER NOT NULL DEFAULT 0
- `created_at`: TEXT NOT NULL (ISO 8601)
- `updated_at`: TEXT NOT NULL (ISO 8601)
- `deleted_at`: TEXT (ISO 8601, nullable)

---

## 3. Query Parameter Specifications

### Time Filters

- `range`: A shorthand for common periods (`today`, `yesterday`, `this_week`, `this_month`, `all`)
- `since` / `until`: Relative (`3m`, `12h`, `30d`) or Absolute (`2026-04-01`)

### Value Filters

- `tag`: Filter by specific tag name.
- `completed`: Boolean filter.
- `limit`: Integer limit for pagination.

---

## 4. API / CLI Contracts

### Module: Tags (Habit Management)

| Action | CLI Command   | API Route                    | Payload (DTO)                                                                                                      | Behavior            |
| :----- | :------------ | :--------------------------- | :----------------------------------------------------------------------------------------------------------------- | :------------------ |
| Create | `--addTag`    | `POST /api/tags`             | `{ tag: string, description?: string, option?: { type: string/'daily'/'weekly'/'monthly'/null, target: number } }` | Creates tag         |
| List   | `--listTag`   | `GET /api/tags`              | `(None)`                                                                                                           | Returns active tags |
| Update | `--updateTag` | `PATCH /api/tags/:tag_name`  | `{ update: { description?: string, option?: any } }`                                                               | Soft updates        |
| Delete | `--delTag`    | `DELETE /api/tags/:tag_name` | `(None)`                                                                                                           | Soft deletes tag    |

### Module: Events (Check-ins)

| Action | CLI Command   | API Route            | Payload (DTO)                                                 | Behavior            |
| :----- | :------------ | :------------------- | :------------------------------------------------------------ | :------------------ |
| Add    | `--addEvent`  | `POST /api/events`   | `{ tag: string, details?: string, mood?: string }`            | Adds an event       |
| List   | `--listEvent` | `GET /api/events`    | `{ query: { tag?: string, range?: string, limit?: number } }` | Lists events        |
| Delete | `--delEvent`  | `DELETE /api/events` | `{ eventId?: number, eventIds?: number[] }`                   | Soft deletes events |

### Module: Todos

| Action       | CLI Command    | API Route               | Payload (DTO)                                                                     | Behavior                           |
| :----------- | :------------- | :---------------------- | :-------------------------------------------------------------------------------- | :--------------------------------- |
| Create Group | `--addGroup`   | `POST /api/groups`      | `{ name: string, order_index?: number }`                                          | Creates Kanban group               |
| Create Todo  | `--addTodo`    | `POST /api/todos`       | `{ todo_group_id: number, parent_id?: number, title: string, priority?: string }` | Creates Todo task                  |
| Update Todo  | `--updateTodo` | `PATCH /api/todos/:id`  | `{ status?: string, order_index?: number, todo_group_id?: number... }`            | Soft updates Todo                  |
| List Groups  | `--listGroups` | `GET /api/groups`       | `(None)`                                                                          | Returns all groups and their tasks |
| Delete Todo  | `--delTodo`    | `DELETE /api/todos/:id` | `(None)`                                                                          | Soft deletes Todo                  |

### Module: Statistics & System

| Action         | CLI Command                                             | API Route                                 | Payload (DTO)                                                 | Behavior                                                                                                                          |
| :------------- | :------------------------------------------------------ | :---------------------------------------- | :------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Statistics     | `--statistic`                                           | `GET /api/statistics`                     | `(None)`                                                      | Returns combined stats. Sub events (`parent_id IS NOT NULL`) are ALWAYS ignored. Cascading streaks based on tag `recurring.type`. |
| Filtered Stats | `--statistic '{"query":{"tag":"study","since":"30d"}}'` | `GET /api/statistics?tag=study&since=30d` | `{ query: { tag?: string, since?: string, until?: string } }` | Filtered cascading stats. If type=monthly, returns monthly+weekly+daily streak. If weekly, returns weekly+daily streak.           |
| Sys Cron       | `--cron-job`                                            | `POST /api/cron/daily`                    | `(None)`                                                      | Automated scans. Creates placeholder event (`recurring_mark=1`) for tags with `recurring` config.                                 |
