# Kawaii Tracker Refactoring & TODO Module Plan

**Current Task: Phase 4.3** - History 与 Statistic 视图

## 核心重构理念

1. **统一数据规范**：所有接口及命令行行为必须严格依赖 `CONTRACTS.md` 中的定义。
2. **完全软删除机制**：包括但不限于 `tracker_tags`, `tracker_events`, `todo_groups`, `todo_items` 表，所有删除动作必须将时间戳写入 `deleted_at` 字段。查询时如无特殊需求一律过滤掉 `deleted_at IS NOT NULL` 的记录。
3. **复合循环与子事件体系**：重构 Tag 循环逻辑，将 `recurring_option` 改为统一的 `options` JSON。利用 `parent_id` 主副事件映射完成多重打卡需求，子事件不参与真正的连续打卡（Streak）统计。
4. **级联连续打卡统计算法**：统计服务直接基于 `parent_id IS NULL` 取主事件，且基于 `tag` 的 `recurring.type` 层层递进展示（例如 monthly = 月度 + 周度 + 日连续打卡展示）。
5. **原子化 React SPA 前端工程**：废弃目前的单页 `index.html` 范式，改为基于 Vite 构建的严格目录组织的 React 工程，样式强一致性要求使用 React Emotion（styled-components）实现，废弃 Tailwind。

---

## 实施步骤细分计划

### Phase 1: Database & Contracts Redesign (Schema update)

1.1 文档与基建层升级

- ~~1.1.1 更新 `CONTRACTS.md`，定义新表名 `tracker_tags`, `tracker_events`, `todo_groups`, `todo_items` 及对应数据结构与接口契约。~~
- ~~1.1.2 更新 `src/util/db.ts` 中的数据库建表语句结构，包括 `options`, `parent_id`, `completed_at`, `recurring_mark` 字段的初始化建设。~~

### Phase 2: Backend Core (Repos & Processors)

2.1 依赖层与 Tag/Event 重构

- ~~2.1.1 重构 `src/types/index.ts`，定义新的数据实体类型（Entity & DTO）匹配新的契约结构。~~
- ~~2.1.2 修改 `src/repo/tag.repo.ts` 操作表名 `tracker_tags`，序列化/反序列化 JSON 的 `options` 字段，实现软删除。~~
- ~~2.1.3 修改 `src/repo/event.repo.ts` 操作表名 `tracker_events`，加入 `parent_id`, `recurring_mark`, `completed_at` 的过滤检索，实现软删除查询。~~

    2.2 核心业务流水线（Processor）重构

- ~~2.2.1 改写 `src/processor/event.processor.ts` 内的 `addEvent` 打卡逻辑：对 `recurring_mark` 的主事件挂载 `parent_id` 计数并在等于 `target` 时触发 `completed_at` 完成标记。~~
- ~~2.2.2 更新 `src/processor/event.processor.ts` 的 `--cron-job` 日常任务逻辑：按天读取 `options.recurring` 生效的 Tag 并生成对应的初始 `tracker_events`，标记为 `recurring_mark = 1`。~~

    2.3 TODO 模块后端建立

- ~~2.3.1 新建 `src/repo/todo_group.repo.ts` 和 `src/repo/todo.repo.ts` 及其基础 CRUD 与软删除。~~
- ~~2.3.2 新建 `src/processor/todo.processor.ts`，组装 TODO 的业务逻辑与状态转移校验。~~

    2.4 Api 与 CLI 组件衔接

- ~~2.4.1 更新 `src/cli.ts` 里的对应入参以及验证逻辑，增设 TODO 及 Group 的子命令。~~
- ~~2.4.2 完善 `src/web/server.ts` 对前端提供的 Fastify 路由服务，对齐 `CONTRACTS.md` 接口结构。~~

    2.5 统计模块更新

- ~~2.5.1 改写 `src/processor/statistic.processor.ts` 聚合逻辑：强制忽略 `parent_id IS NOT NULL` 的记录。~~
- ~~2.5.2 实现 Cascading Streak （级联连续打卡算法）：基于 `monthly`, `weekly`, `daily` 推导附加周期的显示数据并格式化输出。~~

### Phase 3: Frontend Infrastructure Build (React Single Page App)

3.1 前端环境革新

- ~~3.1.1 移除 / 删除 `src/web/public/index.html` 以及有关的传统 CSS 和配置。~~
- ~~3.1.2 在 `/view` 目录下使用 Vite 初始化全新的 React TS 环境应用。~~

    3.2 原子化架构搭建

- ~~3.2.1 引入配置 React Emotion（`@emotion/react`, `@emotion/styled`），梳理基础的主题颜色体系（Theme Provider）。~~
- ~~3.2.2 建立核心架构：创建 `/components`、`/pages`、`/shared/api/schema`、`/shared/utils` 及其索引文档（index.ts）占位。~~
  `

### Phase 4: Frontend View Implementation

4.1 Kanban View (To-do) 视图

- ~~4.1.1 开发 Group 的 Column 容器渲染及横向可拖动组件。~~
- ~~4.1.2 开发 Todo Card 原子化组件，实现由于拖拽导致 `order_index` 与 `todo_group_id` 变更后发起的自动后端同步 API 交互请求。~~

    4.2 HabitTracker 视图

- ~~4.2.1 开发 Tag 日常列表及新增模态框。~~
- ~~4.2.2 开发 Check in 列表展现组件（通过 Event 获取已存在的，以及打卡的钩子实现）。~~

    4.3 History 与 Statistic 视图

- 4.3.1 To-Do 与 Tracker 整合式的 History 日志列表，根据时间 `range` 设置多重过滤标签（支持今天、昨天、本周、本月、全部）。
- 4.3.2 增加 Tags 的独立管理列表页（对应 Tracker 侧边栏的 Tags）。
- 4.3.3 增加已完成 Todo 的 History 卡片展示逻辑。
- 4.3.4 开发级联打卡条和完成率的 UI 块状组件映射统计的数据结构。
