import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import readline from 'node:readline/promises'
import { spawn } from 'child_process'
import { pool } from '../lib/db'

type ExportSource = 'api' | 'db'

async function prompt(question: string, def?: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const q = def ? `${question} [${def}]: ` : `${question}: `
    const ans = (await rl.question(q)).trim()
    return ans || (def ?? '')
  } finally {
    rl.close()
  }
}

async function run(cmd: string, args: string[], cwd?: string) {
  return new Promise<void>((resolve, reject) => {
    const cp = spawn(cmd, args, { stdio: 'inherit', cwd })
    cp.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)))
  })
}

async function choosePython(): Promise<string> {
  const candidates = ['python3','python']
  for (const c of candidates){
    try { await run(c, ['--version']); return c } catch {}
  }
  throw new Error('Python 3 not found in PATH')
}

async function fetchExportViaAPI(url: string, adminKey: string, outPath: string) {
  const res = await fetch(url, { headers: { 'x-admin-key': adminKey } })
  if (!res.ok) throw new Error(`Admin export failed: ${res.status}`)
  const buf = await res.arrayBuffer()
  fs.writeFileSync(outPath, Buffer.from(buf))
}

async function exportViaDB(outPath: string) {
  const questions = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/questions.json'), 'utf8'))
  const items = (questions as any[]).sort((a,b) => (a.order ?? 0) - (b.order ?? 0))
  const qids = items.map(q => q.id)
  if (process.env.ENABLE_IMC === 'true') {
    const mid = Math.floor(qids.length / 2)
    qids.splice(mid, 0, 'IMC1')
  }
  const header = [
    'participantId','coupleCode','fullName','netId',
    ...qids.map(q => `SELF_${q}`),
    ...qids.map(q => `ACC_${q}`),
    ...qids.map(q => `IMP_${q}`),
    ...qids.map(q => `IMP_LABEL_${q}`)
  ]
  const part = await pool.query(
    `SELECT p.id, p.full_name, p.net_id, COALESCE(c.code,'') AS couple_code
       FROM participants p LEFT JOIN couples c ON c.id = p.couple_id
       WHERE p.completed_at IS NOT NULL
       ORDER BY p.started_at ASC`
  )
  const resp = await pool.query(
    'SELECT participant_id, question_id, self_answer, acceptable, importance FROM responses'
  )
  const respByPid = new Map<string, Map<string, {self:string, acc:string, imp:number}>>()
  for (const r of resp.rows as any[]) {
    const m = respByPid.get(r.participant_id) || new Map()
    m.set(r.question_id, { self: r.self_answer ?? '', acc: r.acceptable ?? '', imp: Number(r.importance ?? '') })
    respByPid.set(r.participant_id, m)
  }
  const labelFromImp: Record<number,string> = { 0:'Irrelevant', 1:'A little', 10:'Somewhat', 50:'Very', 250:'Mandatory' }
  const rows: string[] = []
  for (const p of part.rows as any[]) {
    const m = respByPid.get(p.id) || new Map()
    const row: string[] = [p.id, p.couple_code, p.full_name, p.net_id]
    for (const q of qids) row.push(m.get(q)?.self ?? '')
    for (const q of qids) row.push(m.get(q)?.acc ?? '')
    for (const q of qids) row.push(m.get(q) ? String(m.get(q)!.imp) : '')
    for (const q of qids) row.push(m.get(q) ? (labelFromImp[m.get(q)!.imp] ?? '') : '')
    rows.push(row.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(','))
  }
  const csv = [header.join(','), ...rows].join('\n')
  fs.writeFileSync(outPath, csv, 'utf8')
}

function parseCsvLine(line: string): string[]{
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i=0;i<line.length;i++){
    const c = line[i]
    if (q){
      if (c==='"' && line[i+1]==='"'){ cur+='"'; i++ }
      else if (c==='"'){ q=false }
      else cur += c
    }else{
      if (c===','){ out.push(cur); cur='' }
      else if (c==='"'){ q=true }
      else cur += c
    }
  }
  out.push(cur)
  return out
}
function unquote(s: string){ return s?.replace(/^"|"$/g,'') }

function readPerCouple(outDir: string){
  const p = path.join(outDir, 'per_couple_scores.csv')
  if (!fs.existsSync(p)) return [] as any[]
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean)
  if (lines.length<=1) return []
  const header = parseCsvLine(lines[0]).map(unquote)
  const recs: any[] = []
  for (let i=1;i<lines.length;i++){
    const cols = parseCsvLine(lines[i])
    const r: any = {}
    header.forEach((h,idx)=> r[h] = unquote(cols[idx] || ''))
    r.score = Number(r.score)
    recs.push(r)
  }
  return recs
}

async function doExport(source: ExportSource, exportPath: string){
  if (source === 'api'){
    const url = await prompt('Admin export URL', process.env.ADMIN_EXPORT_URL || 'https://<your-domain>/api/admin/export')
    const key = await prompt('ADMIN_KEY (leave blank to use env)', process.env.ADMIN_KEY || '')
    const adminKey = key || process.env.ADMIN_KEY || ''
    if (!adminKey || url.includes('<your-domain>')) throw new Error('Provide a valid export URL and ADMIN_KEY')
    console.log('Fetching export.csv via admin API…')
    await fetchExportViaAPI(url, adminKey, exportPath)
  } else {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) throw new Error('DATABASE_URL/POSTGRES_URL not set')
    console.log('Exporting via DB…')
    await exportViaDB(exportPath)
  }
}

async function buildCouplesFromExport(exportPath: string, couplesPath: string) {
  const text = fs.readFileSync(exportPath, 'utf8')
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length <= 1) throw new Error('export.csv has no data')
  const header = parseCsvLine(lines[0]).map(unquote)
  const pidIdx = header.indexOf('participantId')
  const codeIdx = header.indexOf('coupleCode')
  if (pidIdx === -1 || codeIdx === -1) throw new Error('export.csv missing participantId/coupleCode columns')
  const selfIdxs = header.map((h,i)=> h.startsWith('SELF_') ? i : -1).filter(i=> i>=0)
  const groups = new Map<string, string[]>()
  for (let i=1;i<lines.length;i++) {
    const cols = parseCsvLine(lines[i])
    const pid = unquote(cols[pidIdx] || '')
    const code = unquote(cols[codeIdx] || '')
    if (!pid || !code) continue
    const complete = selfIdxs.every(idx => (unquote(cols[idx]||'').trim() !== ''))
    if (!complete) continue
    const arr = groups.get(code) || []
    arr.push(pid)
    groups.set(code, arr)
  }
  const out: string[] = ['couple_id,partner_a_id,partner_b_id']
  for (const [code, arr] of groups) {
    if (arr.length >= 2) out.push(`${code},${arr[0]},${arr[1]}`)
  }
  fs.writeFileSync(couplesPath, out.join('\n'), 'utf8')
}

async function runEval(py: string, algDir: string, weightsJson?: string, nps: number = 0){
  const args = ['eval/evaluate_couples.py','--export_csv','../export.csv','--couples_csv','../couples.csv','--meta_json','meta.json','--questions_json','../data/questions.json','--outdir', weightsJson ? 'out_ml' : 'out','--nonpartner_samples', String(nps)]
  if (weightsJson) args.push('--weights_json', weightsJson)
  await run(py, args, algDir)
}

function printScores(outDir: string, variant='core_c100_n20_geo'){
  const recs = readPerCouple(outDir)
  if (recs.length===0){ console.log('(no scores found)'); return }
  const rows = recs.filter(r => r.variant===variant)
  if (rows.length===0){
    console.log(`No rows for variant=${variant}. Available variants:`)
    const vs = Array.from(new Set(recs.map(r=>r.variant)))
    vs.forEach(v=>console.log(' -', v))
    return
  }
  const maxId = Math.max(10, ...rows.map(r => String(r.couple_id).length))
  console.log('\nCouple scores ('+variant+')')
  console.log('-'.repeat(12+maxId))
  for (const r of rows){
    const id = String(r.couple_id).padEnd(maxId, ' ')
    console.log(`${id}  ${r.score.toFixed(4)}  (overlap=${r.overlap})`)
  }
  console.log('')
}

async function main(){
  console.log('TigerMatch TUI — export • evaluate • ML')
  const exportPath = path.join(process.cwd(), 'export.csv')
  const couplesPath = path.join(process.cwd(), 'couples.csv')
  const algDir = path.join(process.cwd(), 'tiger-alg')
  const metaPath = path.join(algDir, 'meta.json')
  const py = await choosePython()

  // Export step
  const source = ((await prompt('Export source (api/db)', process.env.ADMIN_EXPORT_URL ? 'api':'db')) as ExportSource)
  await doExport(source, exportPath)
  console.log(`Wrote ${exportPath}`)
  await buildCouplesFromExport(exportPath, couplesPath)
  console.log(`Wrote ${couplesPath}`)

  // Build meta
  console.log('Building meta.json…')
  await run(py, ['tools/build_meta_from_repo.py','--questions_json','../data/questions.json','--export_csv','../export.csv','--out','meta.json'], algDir)

  // Menu loop
  let variant = 'core_c100_n20_geo'
  let nps = Number(await prompt('nonpartner_samples (0 recommended for small data)', '0')) || 0
  for(;;){
    console.log('\nChoose an action:')
    console.log(' 1) Run baseline evaluation')
    console.log(' 2) Show baseline scores')
    console.log(' 3) Train ML domain weights')
    console.log(' 4) Run evaluation with ML weights')
    console.log(' 5) Show ML scores')
    console.log(' 6) Change variant (current: '+variant+')')
    console.log(' 7) Change nonpartner_samples (current: '+nps+')')
    console.log(' 0) Quit')
    const sel = await prompt('Select')
    if (sel==='0') break
    try{
      if (sel==='1'){
        await runEval(py, algDir, undefined, nps)
        console.log('Baseline evaluation complete → tiger-alg/out/')
      } else if (sel==='2'){
        printScores(path.join(algDir, 'out'), variant)
      } else if (sel==='3'){
        await run(py, ['ml/learn_domain_weights.py','--export_csv','../export.csv','--couples_csv','../couples.csv','--meta_json','meta.json','--out','out/ml_weights.json','--verbose'], algDir)
        console.log('ML weights written → tiger-alg/out/ml_weights.json')
      } else if (sel==='4'){
        const w = path.join(algDir, 'out', 'ml_weights.json')
        if (!fs.existsSync(w)) { console.log('No weights file at tiger-alg/out/ml_weights.json. Run option 3 first.'); continue }
        await runEval(py, algDir, 'out/ml_weights.json', nps)
        console.log('ML evaluation complete → tiger-alg/out_ml/')
      } else if (sel==='5'){
        printScores(path.join(algDir, 'out_ml'), variant)
      } else if (sel==='6'){
        const v = await prompt('Variant name', variant)
        if (v) variant = v
      } else if (sel==='7'){
        nps = Number(await prompt('nonpartner_samples', String(nps))) || nps
      } else {
        console.log('Unknown selection')
      }
    } catch (e:any){
      console.error('Error:', e?.message || e)
    }
  }
  console.log('Goodbye')
}

main().catch(e => { console.error(e); process.exit(1) })
