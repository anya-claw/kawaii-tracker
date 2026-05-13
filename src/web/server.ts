import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import fastifyCookie from '@fastify/cookie'
import crypto from 'crypto'
import path from 'path'
import { tagService } from '../service/tag.service'
import { eventService } from '../service/event.service'
import { statisticService } from '../service/statistic.service'
import { todoService } from '../service/todo.service'
import { tagRepo } from '../repo/tag.repo'

const app = Fastify({ logger: false })
const PORT = Number(process.env.WEB_PORT) || 18791
const AUTH_TOKEN = process.env.WEB_TOKEN || 'e6fe5bd0c1443495071684f73cafb8b05a8405aa9ac9def9ee60fff3852c62e7'
const COOKIE_NAME = 'kt_session'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

/** Timing-safe token comparison */
function verifyToken(input: string): boolean {
    const inputBuf = Buffer.from(input, 'utf-8')
    const expectedBuf = Buffer.from(AUTH_TOKEN, 'utf-8')
    if (inputBuf.length !== expectedBuf.length) return false
    return crypto.timingSafeEqual(inputBuf, expectedBuf)
}

async function main() {
    await app.register(cors)
    await app.register(fastifyCookie, {
        secret: AUTH_TOKEN.slice(0, 32) // for signed cookies if needed
    })

    // Auth middleware
    app.addHook('onRequest', async (req, reply) => {
        // Public routes: login page, login API
        const url = req.url
        if (url === '/login.html' || url === '/api/login' || url === '/api/logout') {
            return
        }

        const token = req.cookies?.[COOKIE_NAME]
        if (!token || !verifyToken(token)) {
            if (url.startsWith('/api/')) {
                reply.code(401).send({ ok: false, error: 'Unauthorized' })
            } else {
                reply.redirect('/login.html')
            }
            return
        }
    })

    await app.register(fastifyStatic, {
        root: path.join(__dirname, '../../view/dist'),
        prefix: '/'
    })

    // ==================== AUTH ====================

    app.post('/api/login', async (req, reply) => {
        const { token } = req.body as { token?: string }
        if (!token || !verifyToken(token)) {
            return reply.code(401).send({ ok: false, error: 'Invalid token' })
        }

        reply.setCookie(COOKIE_NAME, token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE
        })
        return { ok: true }
    })

    app.post('/api/logout', async (_req, reply) => {
        reply.clearCookie(COOKIE_NAME, { path: '/' })
        return { ok: true }
    })

    // ==================== TAGS ====================

    app.get('/api/tags', async () => {
        try {
            const tags = tagService.listTags()
            return { ok: true, data: tags }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.post('/api/tags', async req => {
        try {
            const tag = tagService.createTag(req.body as any)
            return { ok: true, data: tag }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.put('/api/tags/:name', async req => {
        try {
            const { name } = req.params as { name: string }
            tagService.updateTag(name, req.body as any)
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.delete('/api/tags/:name', async req => {
        try {
            const { name } = req.params as { name: string }
            tagService.deleteTag(name)
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    // ==================== EVENTS ====================

    app.get('/api/events', async req => {
        try {
            const q = req.query as any
            const query: any = {}
            if (q.tag) query.tag = q.tag
            if (q.range) query.range = q.range
            if (q.since) query.since = q.since
            if (q.until) query.until = q.until
            if (q.limit) query.limit = Number(q.limit)
            if (q.completed !== undefined) query.completed = q.completed === 'true'

            const events = eventService.listEvents(query)
            const enriched = events.map(e => {
                const tag = tagRepo.findById(e.tag_id)
                return { ...e, tag_name: tag?.tag || 'unknown' }
            })
            return { ok: true, data: enriched }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.post('/api/events', async req => {
        try {
            const event = eventService.addEvent(req.body as any)
            return { ok: true, data: event }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.put('/api/events/:id', async req => {
        try {
            const { id } = req.params as { id: string }
            eventService.updateEvent(Number(id), req.body as any)
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.delete('/api/events/:id', async req => {
        try {
            const { id } = req.params as { id: string }
            eventService.deleteEvents([Number(id)])
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    // ==================== STATISTICS ====================

    app.get('/api/statistics', async req => {
        try {
            const q = req.query as any
            const query: any = {}
            if (q.tag) query.tag = q.tag
            if (q.since) query.since = q.since
            if (q.until) query.until = q.until

            const stats = statisticService.getStatistics(Object.keys(query).length ? query : undefined)
            return { ok: true, data: stats }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    // ==================== TODOS ====================

    app.get('/api/groups', async () => {
        try {
            const groups = todoService.listGroups()
            return { ok: true, data: groups }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.post('/api/groups', async req => {
        try {
            const group = todoService.addGroup(req.body as any)
            return { ok: true, data: group }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.put('/api/groups/:id', async req => {
        try {
            const { id } = req.params as { id: string }
            const updated = todoService.updateGroup(Number(id), req.body as any)
            return { ok: true, data: updated }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.delete('/api/groups/:id', async req => {
        try {
            const { id } = req.params as { id: string }
            todoService.deleteGroup(Number(id))
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.post('/api/todos', async req => {
        try {
            const todo = todoService.addTodo(req.body as any)
            return { ok: true, data: todo }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.put('/api/todos/:id', async req => {
        try {
            const { id } = req.params as { id: string }
            const updated = todoService.updateTodo(Number(id), req.body as any)
            return { ok: true, data: updated }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.delete('/api/todos/:id', async req => {
        try {
            const { id } = req.params as { id: string }
            todoService.delTodo(Number(id))
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.post('/api/todos/:id/archive', async req => {
        try {
            const { id } = req.params as { id: string }
            todoService.archiveTodo(Number(id))
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.post('/api/todos/:id/unarchive', async req => {
        try {
            const { id } = req.params as { id: string }
            todoService.unarchiveTodo(Number(id))
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.post('/api/groups/:id/archive', async req => {
        try {
            const { id } = req.params as { id: string }
            todoService.archiveGroup(Number(id))
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.post('/api/groups/:id/unarchive', async req => {
        try {
            const { id } = req.params as { id: string }
            todoService.unarchiveGroup(Number(id))
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    app.get('/api/todos/history', async () => {
        try {
            const history = todoService.listHistory()
            return { ok: true, data: history }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    // ==================== DASHBOARD ====================

    app.get('/api/dashboard', async () => {
        try {
            const tags = tagService.listTags()

            const dashboard = tags.map(tag => {
                const stats = statisticService.getStatistics({ tag: tag.tag })
                const stat = stats[0]

                const tagOpts = JSON.parse(tag.options || '{}')
                const recurringType = tagOpts.recurring?.type || null
                const target = tagOpts.repeat?.target || 1

                let events = []
                if (recurringType === 'weekly') {
                    events = eventService.listEvents({ tag: tag.tag, range: 'this_week' })
                } else if (recurringType === 'monthly') {
                    events = eventService.listEvents({ tag: tag.tag, range: 'this_month' })
                } else {
                    events = eventService.listEvents({ tag: tag.tag, range: 'today' })
                }

                const completed = events.filter(e => e.completed_at !== null && e.parent_id !== null).length // Checkins are sub events!
                // Wait, if it's one-off, checkins are main events, so we count events where completed_at != null
                // To be safe, just count total checkins for this period based on main event completion or subevents.
                const actualCompleted = recurringType
                    ? events.filter(e => e.parent_id !== null && e.completed_at !== null).length
                    : events.filter(e => e.completed_at !== null).length

                return {
                    tag: tag.tag,
                    description: tag.description,
                    type: recurringType || 'one-off',
                    target: target,
                    period_completed: actualCompleted,
                    period_progress: `${actualCompleted}/${target}`,
                    period_done: stat && events.some(e => e.parent_id === null && e.completed_at !== null),
                    daily_streak: stat?.daily_streak || 0,
                    weekly_streak: stat?.weekly_streak || 0,
                    monthly_streak: stat?.monthly_streak || 0,
                    longest_daily_streak: stat?.longest_daily_streak || 0,
                    total_days: stat?.total_checkin_days || 0
                }
            })

            return { ok: true, data: dashboard }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    // ==================== SYS CRON ====================

    app.post('/api/cron/daily', async () => {
        try {
            eventService.cronDaily()
            return { ok: true }
        } catch (e: any) {
            return { ok: false, error: e.message }
        }
    })

    // ==================== START ====================

    app.listen({ port: PORT, host: '0.0.0.0' }, err => {
        if (err) {
            console.error('❌ Failed to start:', err.message)
            process.exit(1)
        }
        console.log(`🐾 Kawaii Tracker Web Panel running at http://localhost:${PORT}`)
    })
}

main().catch(err => {
    console.error('❌ Startup failed:', err.message)
    process.exit(1)
})
