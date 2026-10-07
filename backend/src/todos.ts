import { Hono } from 'hono'

export type Bindings = {
  DB: D1Database
  ADMIN_SECRET: string
}

export type Todo = {
  id: string
  text: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

const todosApp = new Hono<{ Bindings: Bindings }>()

// Get all todos
todosApp.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM todos ORDER BY created_at DESC').all()
  return c.json(results)
})

// Create a new todo
todosApp.post('/', async (c) => {
  const body = await c.req.parseBody()

  const secret = body['secret'] as string
  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const text = body['text'] as string
  if (!text) return c.json({ error: 'Text is required' }, 400)

  const id = crypto.randomUUID()
  const status = 'pending'

  await c.env.DB.prepare('INSERT INTO todos (id, text, status) VALUES (?, ?, ?)')
    .bind(id, text, status)
    .run()

  return c.json({ message: 'Todo created', id, text, status }, 201)
})

// Reset all todos (Must be defined before /:id)
todosApp.put('/reset/all', async (c) => {
  const body = await c.req.parseBody()
  const secret = body['secret'] as string

  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Update all items to "pending" status
  await c.env.DB.prepare("UPDATE todos SET status = 'pending'").run()

  return c.json({ message: 'Todos reset to pending' })
})

// Update a todo (text and/or status)
todosApp.put('/:id', async (c) => {
  const body = await c.req.parseBody()
  const secret = body['secret'] as string

  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const text = body['text'] as string
  const status = body['status'] as string

  await c.env.DB.prepare('UPDATE todos SET text = ?, status = ? WHERE id = ?')
    .bind(text, status, id)
    .run()

  return c.json({ message: 'Todo updated' })
})

// Delete a todo
todosApp.delete('/:id', async (c) => {
  const secret = c.req.header('Authorization')
  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run()

  return c.json({ message: 'Todo deleted' })
})

export default todosApp
