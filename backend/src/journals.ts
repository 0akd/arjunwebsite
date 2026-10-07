import { Hono } from 'hono'

export type Bindings = {
  JOURNALS_BUCKET: R2Bucket
  ADMIN_SECRET: string
}

export type JournalEntry = {
  id: string
  title: string
  date: string
  text: string
  photoKey: string
}

const journalsApp = new Hono<{ Bindings: Bindings }>()

journalsApp.post('/', async (c) => {
  const body = await c.req.parseBody()

  // Security Check
  const secret = body['secret'] as string
  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const title = body['title'] as string
  const date = body['date'] as string
  const text = body['text'] as string
  const photo = body['photo'] as File

  if (!title || !date || !text || !photo) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const id = crypto.randomUUID()
  const photoKey = `photos/${id}-${photo.name}`

  await c.env.JOURNALS_BUCKET.put(photoKey, await photo.arrayBuffer(), {
    httpMetadata: { contentType: photo.type },
  })

  const journalEntry: JournalEntry = { id, title, date, text, photoKey }
  await c.env.JOURNALS_BUCKET.put(`entries/${id}.json`, JSON.stringify(journalEntry), {
    httpMetadata: { contentType: 'application/json' },
  })

  // Enforce 100 entries limit: delete oldest if exceeded
  const listed = await c.env.JOURNALS_BUCKET.list({ prefix: 'entries/' })
  if (listed.objects.length > 100) {
    // Sort oldest first based on upload date
    const sorted = listed.objects.sort((a, b) => a.uploaded.getTime() - b.uploaded.getTime())
    const toDelete = sorted.slice(0, sorted.length - 100)

    for (const obj of toDelete) {
      const file = await c.env.JOURNALS_BUCKET.get(obj.key)
      if (file) {
        const entry = await file.json<JournalEntry>()
        await c.env.JOURNALS_BUCKET.delete(entry.photoKey) // Delete associated photo
      }
      await c.env.JOURNALS_BUCKET.delete(obj.key) // Delete entry JSON
    }
  }

  return c.json({ message: 'Journal created successfully!', journal: journalEntry }, 201)
})

journalsApp.get('/', async (c) => {
  const listed = await c.env.JOURNALS_BUCKET.list({ prefix: 'entries/' })
  const journals = await Promise.all(
    listed.objects.map(async (obj) => {
      const file = await c.env.JOURNALS_BUCKET.get(obj.key)
      if (!file) return null
      return await file.json<JournalEntry>()
    })
  )

  const validJournals = journals.filter((entry): entry is JournalEntry => entry !== null)
  validJournals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return c.json(validJournals)
})

journalsApp.put('/:id', async (c) => {
  const body = await c.req.parseBody()
  const secret = body['secret'] as string
  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const existingFile = await c.env.JOURNALS_BUCKET.get(`entries/${id}.json`)
  if (!existingFile) return c.json({ error: 'Journal not found' }, 404)

  const entry = await existingFile.json<JournalEntry>()

  entry.title = (body['title'] as string) || entry.title
  entry.date = (body['date'] as string) || entry.date
  entry.text = (body['text'] as string) || entry.text

  const photo = body['photo']
  // If a new valid file is attached, update the photo
  if (photo instanceof File && photo.size > 0) {
    await c.env.JOURNALS_BUCKET.delete(entry.photoKey) // Clean up old photo
    entry.photoKey = `photos/${id}-${photo.name}`
    await c.env.JOURNALS_BUCKET.put(entry.photoKey, await photo.arrayBuffer(), {
      httpMetadata: { contentType: photo.type },
    })
  }

  await c.env.JOURNALS_BUCKET.put(`entries/${id}.json`, JSON.stringify(entry), {
    httpMetadata: { contentType: 'application/json' },
  })

  return c.json({ message: 'Journal updated successfully!', journal: entry })
})

journalsApp.delete('/:id', async (c) => {
  const secret = c.req.header('Authorization')
  if (!c.env.ADMIN_SECRET || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const file = await c.env.JOURNALS_BUCKET.get(`entries/${id}.json`)
  if (file) {
    const entry = await file.json<JournalEntry>()
    await c.env.JOURNALS_BUCKET.delete(entry.photoKey)
    await c.env.JOURNALS_BUCKET.delete(`entries/${id}.json`)
  }

  return c.json({ message: 'Deleted successfully' })
})

export default journalsApp
