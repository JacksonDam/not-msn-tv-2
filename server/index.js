import express from 'express'
import cors from 'cors'
import Parser from 'rss-parser'
import OpenAI from 'openai'

const app = express()
app.use(cors())

const parser = new Parser()
const client = new OpenAI()

let cachedHeadlines = ['Headline 1', 'Headline 2', 'Headline 3']
let lastUpdated = 0

async function updateNews() {
  const now = Date.now()
  if (now - lastUpdated < 10800000) return // 3 hours

  try {
    const feed = await parser.parseURL('http://feeds.nbcnews.com/feeds/worldnews')
    if (!feed.items?.length) return

    const headlines = []
    for (let i = 0; i < 3 && i < feed.items.length; i++) {
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You will be provided with a news headline. Shorten it to at most 36 characters. Do not add full stops. Strictly never provide any headline over 36 characters, ever.',
          },
          { role: 'user', content: feed.items[i].title },
        ],
        temperature: 0,
        max_tokens: 64,
        top_p: 1,
      })
      headlines.push(completion.choices[0].message.content)
    }

    cachedHeadlines = headlines
    lastUpdated = now
    console.log('Headlines updated:', cachedHeadlines)
  } catch (err) {
    console.error('Failed to update news:', err.message)
  }
}

app.get('/api/news', async (_req, res) => {
  await updateNews()
  res.json({ headlines: cachedHeadlines })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server on port ${PORT}`))
