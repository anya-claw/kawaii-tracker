import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import crypto from 'crypto';
import path from 'path';
import { taskService } from '../service/task.service';
import { eventService } from '../service/event.service';
import { statisticService } from '../service/statistic.service';
import { todoService } from '../service/todo.service';
import { taskRepo, TaskRepo } from '../repo/task.repo';

const app = Fastify({ logger: false });
const PORT = Number(process.env.WEB_PORT) || 18792;
const AUTH_TOKEN = process.env.WEB_TOKEN || 'e6fe5bd0c1443495071684f73cafb8b05a8405aa9ac9def9ee60fff3852c62e7';
const COOKIE_NAME = 'kt_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function verifyToken(input: string): boolean {
  const inputBuf = Buffer.from(input, 'utf-8');
  const expectedBuf = Buffer.from(AUTH_TOKEN, 'utf-8');
  if (inputBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(inputBuf, expectedBuf);
}

async function main() {
  await app.register(cors);
  await app.register(fastifyCookie, {
    secret: AUTH_TOKEN.slice(0, 32),
  });

  // Auth middleware
  app.addHook('onRequest', async (req, reply) => {
    const url = req.url;
    if (url === '/login.html' || url === '/api/login' || url === '/api/logout') return;

    const token = req.cookies?.[COOKIE_NAME];
    if (!token || !verifyToken(token)) {
      if (url.startsWith('/api/')) {
        reply.code(401).send({ ok: false, error: 'Unauthorized' });
      } else {
        reply.redirect('/login.html');
      }
      return;
    }
  });

  const staticRoot = path.join(__dirname, '..', '..', 'dist', 'web', 'public');
  console.log(`📂 Serving static from: ${staticRoot}`);
  await app.register(fastifyStatic, {
    root: staticRoot,
    prefix: '/',
  });

  // ==================== AUTH ====================

  app.post('/api/login', async (req, reply) => {
    const { token } = req.body as { token?: string };
    if (!token || !verifyToken(token)) {
      return reply.code(401).send({ ok: false, error: 'Invalid token' });
    }
    reply.setCookie(COOKIE_NAME, token, {
      path: '/', httpOnly: true, sameSite: 'lax', maxAge: COOKIE_MAX_AGE,
    });
    return { ok: true };
  });

  app.post('/api/logout', async (_req, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    return { ok: true };
  });

  // ==================== TASKS ====================

  app.get('/api/tasks', async () => {
    try {
      const tasks = taskService.listTasks();
      return { ok: true, data: tasks };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.post('/api/tasks', async (req) => {
    try {
      const task = taskService.createTask(req.body as any);
      return { ok: true, data: task };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.put('/api/tasks/:name', async (req) => {
    try {
      const { name } = req.params as { name: string };
      taskService.updateTask(name, req.body as any);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.delete('/api/tasks/:name', async (req) => {
    try {
      const { name } = req.params as { name: string };
      taskService.deleteTask(name);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  // ==================== EVENTS ====================

  app.get('/api/events', async (req) => {
    try {
      const q = req.query as any;
      const query: any = {};
      if (q.task) query.task = q.task;
      if (q.range) query.range = q.range;
      if (q.since) query.since = q.since;
      if (q.until) query.until = q.until;
      if (q.limit) query.limit = Number(q.limit);
      if (q.offset) query.offset = Number(q.offset);
      if (q.completed !== undefined) query.completed = q.completed === 'true';
      if (q.parent_id !== undefined) query.parent_id = q.parent_id === 'null' ? 'null' : Number(q.parent_id);

      const events = eventService.listEvents(query);
      const hasMerge = !query.task && query.range && query.range !== 'all';
      const total = hasMerge ? events.length : eventService.countEvents(query);
      const enriched = events.map(e => {
        const task = taskRepo.findById(e.task_id);
        return { ...e, task_name: task?.task || 'unknown' };
      });
      return { ok: true, data: enriched, total, page: Math.floor((query.offset || 0) / (query.limit || 100)) + 1, pageSize: query.limit || 100 };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.post('/api/events', async (req) => {
    try {
      const event = eventService.addEvent(req.body as any);
      return { ok: true, data: event };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.put('/api/events/:id', async (req) => {
    try {
      const { id } = req.params as { id: string };
      eventService.updateEvent(Number(id), req.body as any);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.delete('/api/events/:id', async (req) => {
    try {
      const { id } = req.params as { id: string };
      eventService.deleteEvents([Number(id)]);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  // ==================== STATISTICS ====================

  app.get('/api/statistics', async (req) => {
    try {
      const q = req.query as any;
      const query: any = {};
      if (q.task) query.task = q.task;
      if (q.since) query.since = q.since;
      if (q.until) query.until = q.until;

      const stats = statisticService.getStatistics(Object.keys(query).length ? query : undefined);
      return { ok: true, data: stats };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  // ==================== DASHBOARD ====================

  app.get('/api/dashboard', async () => {
    try {
      const tasks = taskService.listTasks();

      const dashboard = tasks.map(task => {
        const stats = statisticService.getStatistics({ task: task.task });
        const recurring = TaskRepo.parseRecurring(task);

        if (!recurring) {
          // One-off task
          return {
            task: task.task,
            description: task.description,
            type: 'one-off' as const,
            current_streak: stats[0]?.current_streak || 0,
            longest_streak: stats[0]?.longest_streak || 0,
            total_days: stats[0]?.total_checkin_days || 0,
          };
        }

        if (recurring.type === 'weekly') {
          const target = recurring.target ?? 1;
          const dailyTarget = Math.ceil(target / 7);
          const mainEvents = eventService.listEvents({ task: task.task, range: 'this_week', parent_id: 'null' });
          const mainEvent = mainEvents.find((e: any) => e.daily_mark === 1);
          const weekProgress = mainEvent?.progress || 0;
          const allTodayEvents = eventService.listEvents({ task: task.task, range: 'today' });
          const todaySubCount = allTodayEvents.filter((e: any) => e.parent_id != null).length;
          return {
            task: task.task,
            description: task.description,
            type: 'weekly' as const,
            weekly_target: target,
            daily_target: dailyTarget,
            week_completed: weekProgress,
            week_progress: `${weekProgress}/${target}`,
            today_completed: todaySubCount,
            today_quota: dailyTarget,
            today_done: todaySubCount >= dailyTarget,
            current_streak: stats[0]?.current_streak || 0,
            longest_streak: stats[0]?.longest_streak || 0,
            total_weeks: stats[0]?.total_checkin_days || 0,
          };
        }

        // Daily
        const target = recurring.target ?? 1;
        if (target > 1) {
          const mainEvents = eventService.listEvents({ task: task.task, range: 'today', parent_id: 'null' });
          const mainEvent = mainEvents.find((e: any) => e.daily_mark === 1);
          const dayProgress = mainEvent?.progress || 0;
          const allTodayEvents = eventService.listEvents({ task: task.task, range: 'today' });
          const todaySubCount = allTodayEvents.filter((e: any) => e.parent_id != null).length;
          return {
            task: task.task,
            description: task.description,
            type: 'daily' as const,
            daily_target: target,
            today_completed: todaySubCount,
            today_progress: `${todaySubCount}/${target}`,
            today_done: todaySubCount >= target,
            current_streak: stats[0]?.current_streak || 0,
            longest_streak: stats[0]?.longest_streak || 0,
            total_days: stats[0]?.total_checkin_days || 0,
          };
        }

        // Daily single-check
        const events = eventService.listEvents({ task: task.task, range: 'today' });
        const completed = events.filter(e => e.completed === 1).length;
        return {
          task: task.task,
          description: task.description,
          type: 'daily' as const,
          daily_target: target,
          today_completed: completed,
          today_progress: `${completed}/${target}`,
          today_done: completed >= target,
          current_streak: stats[0]?.current_streak || 0,
          longest_streak: stats[0]?.longest_streak || 0,
          total_days: stats[0]?.total_checkin_days || 0,
        };
      });

      return { ok: true, data: dashboard };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  // ==================== TODO GROUPS ====================

  app.get('/api/todo/groups', async () => {
    try {
      const groups = todoService.listGroups();
      return { ok: true, data: groups };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.post('/api/todo/groups', async (req) => {
    try {
      const group = todoService.createGroup(req.body as any);
      return { ok: true, data: group };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.put('/api/todo/groups/:id', async (req) => {
    try {
      const { id } = req.params as { id: string };
      todoService.updateGroup(Number(id), req.body as any);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.delete('/api/todo/groups/:id', async (req) => {
    try {
      const { id } = req.params as { id: string };
      todoService.deleteGroup(Number(id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.put('/api/todo/groups/reorder', async (req) => {
    try {
      const { positions } = req.body as { positions: { id: number; position: number }[] };
      todoService.reorderGroups(positions);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  // ==================== TODO ITEMS ====================

  app.get('/api/todo/items', async (req) => {
    try {
      const q = req.query as any;
      const query: any = {};
      if (q.group_id) query.group_id = Number(q.group_id);
      if (q.completed !== undefined) query.completed = q.completed === 'true';
      if (q.parent_id !== undefined) query.parent_id = q.parent_id === 'null' ? 'null' : Number(q.parent_id);
      if (q.show_hidden !== undefined) query.show_hidden = q.show_hidden === 'true';
      if (q.limit) query.limit = Number(q.limit);
      if (q.offset) query.offset = Number(q.offset);

      const items = todoService.listItems(query);
      return { ok: true, data: items };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.get('/api/todo/board', async (req) => {
    try {
      const q = req.query as any;
      const showHidden = q.show_hidden === 'true';
      const board = todoService.getBoard(showHidden);
      return { ok: true, data: board };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.post('/api/todo/items', async (req) => {
    try {
      const item = todoService.createItem(req.body as any);
      return { ok: true, data: item };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.put('/api/todo/items/:id', async (req) => {
    try {
      const { id } = req.params as { id: string };
      todoService.updateItem(Number(id), req.body as any);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.post('/api/todo/items/:id/complete', async (req) => {
    try {
      const { id } = req.params as { id: string };
      const result = todoService.completeItem(Number(id));
      return { ok: true, data: result };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.post('/api/todo/items/:id/uncomplete', async (req) => {
    try {
      const { id } = req.params as { id: string };
      todoService.uncompleteItem(Number(id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.delete('/api/todo/items/:id', async (req) => {
    try {
      const { id } = req.params as { id: string };
      todoService.deleteItem(Number(id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.put('/api/todo/items/reorder', async (req) => {
    try {
      const { positions } = req.body as { positions: { id: number; position: number }[] };
      todoService.reorderItems(positions);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  // ==================== START ====================

  app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    if (err) {
      console.error('❌ Failed to start:', err.message);
      process.exit(1);
    }
    console.log(`🐾 Kawaii Tracker v2 running at http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('❌ Startup failed:', err.message);
  process.exit(1);
});
