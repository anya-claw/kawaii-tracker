import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { tagService } from '../service/tag.service';
import { eventService } from '../service/event.service';
import { statisticService } from '../service/statistic.service';
import { tagRepo } from '../repo/tag.repo';

const app = Fastify({ logger: false });
const PORT = Number(process.env.WEB_PORT) || 18791;
const AUTH_USER = process.env.WEB_USER || 'KumaKorin';
const AUTH_PASS = process.env.WEB_PASS || 'Aaa123321.@';

async function main() {
  await app.register(cors);

  // Basic Auth — manual onRequest hook
  app.addHook('onRequest', async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      reply
        .code(401)
        .header('WWW-Authenticate', 'Basic realm="Kawaii Tracker"')
        .send({ ok: false, error: 'Unauthorized' });
      return;
    }

    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');

    if (user !== AUTH_USER || pass !== AUTH_PASS) {
      reply
        .code(401)
        .header('WWW-Authenticate', 'Basic realm="Kawaii Tracker"')
        .send({ ok: false, error: 'Invalid credentials' });
      return;
    }
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/',
  });

  // ==================== TAGS ====================

  app.get('/api/tags', async () => {
    try {
      const tags = tagService.listTags();
      return { ok: true, data: tags };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.post('/api/tags', async (req) => {
    try {
      const tag = tagService.createTag(req.body as any);
      return { ok: true, data: tag };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.put('/api/tags/:name', async (req) => {
    try {
      const { name } = req.params as { name: string };
      tagService.updateTag(name, req.body as any);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  app.delete('/api/tags/:name', async (req) => {
    try {
      const { name } = req.params as { name: string };
      tagService.deleteTag(name);
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
      if (q.tag) query.tag = q.tag;
      if (q.range) query.range = q.range;
      if (q.since) query.since = q.since;
      if (q.until) query.until = q.until;
      if (q.limit) query.limit = Number(q.limit);
      if (q.completed !== undefined) query.completed = q.completed === 'true';

      const events = eventService.listEvents(query);
      const enriched = events.map(e => {
        const tag = tagRepo.findById(e.tag_id);
        return { ...e, tag_name: tag?.tag || 'unknown' };
      });
      return { ok: true, data: enriched };
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
      if (q.tag) query.tag = q.tag;
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
      const tags = tagService.listTags();

      const dashboard = tags.map(tag => {
        const events = eventService.listEvents({ tag: tag.tag, range: 'today' });
        const completed = events.filter(e => e.completed === 1).length;
        const stats = statisticService.getStatistics({ tag: tag.tag });

        return {
          tag: tag.tag,
          description: tag.description,
          is_daily: tag.is_daily,
          today_completed: completed > 0,
          today_events: events.length,
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

  // ==================== START ====================

  app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    if (err) {
      console.error('❌ Failed to start:', err.message);
      process.exit(1);
    }
    console.log(`🐾 Kawaii Tracker Web Panel running at http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('❌ Startup failed:', err.message);
  process.exit(1);
});
