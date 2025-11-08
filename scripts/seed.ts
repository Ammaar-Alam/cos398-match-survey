
import { prisma } from '../lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  const dataPath = path.join(process.cwd(), 'data', 'questions.json')
  const raw = fs.readFileSync(dataPath, 'utf8')
  const items = JSON.parse(raw)

  for (const q of items) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        section: q.section,
        domain: q.domain,
        construct: q.construct,
        text: q.text,
        responseType: q.responseType,
        order: q.order,
        options: {
          create: (q.options || []).map((label: string, idx: number) => ({
            label,
            value: String(idx + 1),
            ord: idx + 1
          }))
        }
      }
    })
  }
  console.log(`Seeded ${items.length} questions.`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
