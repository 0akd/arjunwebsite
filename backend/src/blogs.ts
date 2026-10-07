import { Hono } from 'hono'

export type Bindings = {
  JOURNALS_BUCKET: R2Bucket // Reusing your existing R2 bucket
  ADMIN_SECRET: string
}

export type Blog = {
  id: string
  slug: string
  title: string
  body: string
  created_at: string
}

const blogsApp = new Hono<{ Bindings: Bindings }>()

// Helper to create URL-friendly slugs
function slugify(text: string) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
}

// Get all blogs (optimized using R2 customMetadata)
blogsApp.get('/', async (c) => {
  const listed = await c.env.JOURNALS_BUCKET.list({
    prefix: 'blogs/',
    include: ['customMetadata']
  })

  const blogs = listed.objects.map(obj => ({
    slug: obj.key.replace('blogs/', '').replace('.json', ''),
    title: obj.customMetadata?.title || 'Untitled',
    created_at: obj.customMetadata?.created_at || obj.uploaded.toISOString(),
  }))

  // Sort newest first
  blogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return c.json(blogs)
})

// Get a single blog by slug
blogsApp.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const file = await c.env.JOURNALS_BUCKET.get(`blogs/${slug}.json`)

  if (!file) return c.json({ error: 'Blog not found' }, 404)

  const blog = await file.json<Blog>()
  return c.json(blog)
})

// Create a new blog
blogsApp.post('/', async (c) => {
  const body = await c.req.parseBody()
  const secret = body['secret'] as string
  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) return c.json({ error: 'Unauthorized' }, 401)

  const title = body['title'] as string
  const textBody = body['body'] as string
  if (!title || !textBody) return c.json({ error: 'Title and body are required' }, 400)

  const id = crypto.randomUUID()
  let slug = slugify(title)
  if (!slug) slug = id

  // Collision prevention
  const existing = await c.env.JOURNALS_BUCKET.head(`blogs/${slug}.json`)
  if (existing) slug = `${slug}-${id.split('-')[0]}`

  const created_at = new Date().toISOString()
  const blog: Blog = { id, slug, title, body: textBody, created_at }

  await c.env.JOURNALS_BUCKET.put(`blogs/${slug}.json`, JSON.stringify(blog), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { title, created_at } // Allows fast listing without fetching bodies
  })

  return c.json({ message: 'Blog published!', id, slug }, 201)
})

// Update an existing blog
blogsApp.put('/:slug', async (c) => {
  const body = await c.req.parseBody()
  const secret = body['secret'] as string
  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) return c.json({ error: 'Unauthorized' }, 401)

  const slug = c.req.param('slug')
  const file = await c.env.JOURNALS_BUCKET.get(`blogs/${slug}.json`)
  if (!file) return c.json({ error: 'Blog not found' }, 404)

  const blog = await file.json<Blog>()

  blog.title = (body['title'] as string) || blog.title
  blog.body = (body['body'] as string) || blog.body
  // Note: We intentionally don't change the slug to prevent breaking existing URLs

  await c.env.JOURNALS_BUCKET.put(`blogs/${slug}.json`, JSON.stringify(blog), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { title: blog.title, created_at: blog.created_at }
  })

  return c.json({ message: 'Blog updated successfully!' })
})

// Delete a blog
blogsApp.delete('/:slug', async (c) => {
  const secret = c.req.header('Authorization')
  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) return c.json({ error: 'Unauthorized' }, 401)

  const slug = c.req.param('slug')
  await c.env.JOURNALS_BUCKET.delete(`blogs/${slug}.json`)

  return c.json({ message: 'Blog deleted' })
})

export default blogsApp
