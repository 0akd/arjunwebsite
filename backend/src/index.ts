import { Hono } from 'hono'
import { cors } from 'hono/cors'
import journalsApp, { type Bindings as JournalBindings } from './journals'
import todosApp, { type Bindings as TodoBindings } from './todos'
import blogsApp from './blogs'

// Merge bindings
type Bindings = JournalBindings & TodoBindings

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

app.route('/api/journals', journalsApp)
app.route('/api/todos', todosApp)
app.route('/api/blogs', blogsApp)

app.get('/file/:key{.*}', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.JOURNALS_BUCKET.get(key)

  if (object === null) return c.text('Not found', 404)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, { headers })
})

export default app
