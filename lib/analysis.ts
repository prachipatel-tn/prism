export type Row = { period: 'before' | 'after'; segment: string; visitors: number; conversions: number };
export type Claim = 'aggregate' | 'segments' | 'causal';
export type Verdict = 'supported' | 'contradicted' | 'needs_review';
export const claims: Record<Claim, string> = {
  aggregate: 'Overall conversion increased after the campaign.',
  segments: 'Conversion improved across every customer segment.',
  causal: 'The campaign caused the improvement in conversion.',
};
export const scenarios: { id: string; name: string; subtitle: string; rows: Row[] }[] = [
  { id: 'reversal', name: 'The hidden reversal', subtitle: 'The headline rises. Every segment falls.', rows: [
    { period: 'before', segment: 'New customers', visitors: 800, conversions: 80 },
    { period: 'before', segment: 'Returning customers', visitors: 200, conversions: 120 },
    { period: 'after', segment: 'New customers', visitors: 200, conversions: 16 },
    { period: 'after', segment: 'Returning customers', visitors: 800, conversions: 440 },
  ]},
  { id: 'growth', name: 'Growth that holds up', subtitle: 'A positive headline with consistent segments.', rows: [
    { period: 'before', segment: 'New customers', visitors: 800, conversions: 80 },
    { period: 'before', segment: 'Returning customers', visitors: 200, conversions: 120 },
    { period: 'after', segment: 'New customers', visitors: 800, conversions: 96 },
    { period: 'after', segment: 'Returning customers', visitors: 200, conversions: 130 },
  ]},
  { id: 'decline', name: 'A clear decline', subtitle: 'The evidence challenges the growth story.', rows: [
    { period: 'before', segment: 'New customers', visitors: 800, conversions: 80 },
    { period: 'before', segment: 'Returning customers', visitors: 200, conversions: 120 },
    { period: 'after', segment: 'New customers', visitors: 800, conversions: 64 },
    { period: 'after', segment: 'Returning customers', visitors: 200, conversions: 100 },
  ]},
  { id: 'sparse', name: 'Too early to tell', subtitle: 'Tiny samples deserve a careful conclusion.', rows: [
    { period: 'before', segment: 'New customers', visitors: 10, conversions: 1 },
    { period: 'before', segment: 'Returning customers', visitors: 10, conversions: 5 },
    { period: 'after', segment: 'New customers', visitors: 10, conversions: 3 },
    { period: 'after', segment: 'Returning customers', visitors: 10, conversions: 7 },
  ]},
];
export const verdictLabels: Record<Verdict, string> = { supported: 'Supported', contradicted: 'Contradicted', needs_review: 'Needs review' };
export function validateRows(input: unknown): Row[] {
  if (!Array.isArray(input) || !input.length || input.length > 5000) throw new Error('Provide between 1 and 5,000 summary rows.');
  const seen = new Set<string>();
  const rows = input.map((r, i) => {
    if (!r || typeof r !== 'object' || !['before','after'].includes(r.period)) throw new Error(`Row ${i + 1}: period must be before or after.`);
    if (typeof r.segment !== 'string' || !r.segment.trim() || r.segment.length > 100) throw new Error(`Row ${i + 1}: add a segment name (up to 100 characters).`);
    for (const key of ['visitors','conversions']) if (!Number.isSafeInteger(r[key]) || r[key] < 0 || r[key] > 100000000) throw new Error(`Row ${i + 1}: ${key} must be a whole number from 0 to 100,000,000.`);
    if (r.conversions > r.visitors) throw new Error(`Row ${i + 1}: conversions cannot exceed visitors.`);
    const key = `${r.period}\u0000${r.segment.trim()}`;
    if (seen.has(key)) throw new Error(`Row ${i + 1}: duplicate period and segment. Combine those rows first.`);
    seen.add(key);
    return { period:r.period, segment:r.segment.trim(), visitors:r.visitors, conversions:r.conversions } as Row;
  });
  if (!rows.some(r => r.period === 'before') || !rows.some(r => r.period === 'after')) throw new Error('Include both before and after periods.');
  if (new Set(rows.map(r => r.segment)).size > 20) throw new Error('This demo supports up to 20 segments.');
  return rows;
}
export function analyze(input: Row[]) {
  const rows = validateRows(input);
  const total = (period: string) => {
    const rs = rows.filter(r => r.period === period);
    const visitors = rs.reduce((s,r) => s+r.visitors,0);
    const conversions = rs.reduce((s,r) => s+r.conversions,0);
    return { visitors, conversions, rate: visitors ? 100*conversions/visitors : null };
  };
  const before = total('before'), after = total('after');
  const segments = [...new Set(rows.map(r => r.segment))].map(name => {
    const b = rows.find(r => r.segment === name && r.period === 'before');
    const a = rows.find(r => r.segment === name && r.period === 'after');
    const br = b?.visitors ? 100*b.conversions/b.visitors : null;
    const ar = a?.visitors ? 100*a.conversions/a.visitors : null;
    return { name, before:b, after:a, beforeRate:br, afterRate:ar, delta: br !== null && ar !== null ? ar-br : null };
  });
  const complete = segments.every(s => s.delta !== null);
  const lowSample = rows.some(r => r.visitors < 30);
  const delta = before.rate !== null && after.rate !== null ? after.rate-before.rate : null;
  const standardized = complete && before.visitors > 0 ? segments.reduce((sum,s) => sum+(s.before!.visitors/before.visitors)*s.afterRate!,0) : null;
  const adjustedDelta = standardized !== null && before.rate !== null ? standardized-before.rate : null;
  const reversal = complete && delta !== null && ((delta>0 && segments.every(s=>s.delta!<0)) || (delta<0 && segments.every(s=>s.delta!>0)));
  const mixShift = complete && before.visitors>0 && after.visitors>0 ? Math.max(...segments.map(s=>100*Math.abs(s.after!.visitors/after.visitors-s.before!.visitors/before.visitors))) : null;
  return { before, after, segments, delta, standardized, adjustedDelta, complete, lowSample, reversal, mixShift, rows };
}
export type Evidence = ReturnType<typeof analyze>;
export function decide(e: Evidence, claim: Claim): Verdict {
  if (claim === 'causal' || !e.complete || e.lowSample || e.delta === null) return 'needs_review';
  if (claim === 'aggregate') return e.delta > 0 ? 'supported' : 'contradicted';
  return e.segments.every(s => s.delta! > 0) ? 'supported' : 'contradicted';
}
export function naive(e: Evidence): Verdict { return e.delta !== null && e.delta>0 ? 'supported' : 'contradicted'; }
export function explain(e: Evidence, claim: Claim) {
  if (claim === 'causal') return 'A before-and-after comparison does not isolate the campaign’s effect. No randomized control or causal design is provided. Treat this claim as unproven.';
  if (!e.complete || e.delta === null) return 'A segment or denominator is missing in at least one period. Complete comparable observations before drawing a conclusion.';
  if (e.lowSample) return 'At least one segment-period has fewer than 30 visitors. This demo’s conservative review rule applies; it is not a statistical significance test.';
  if (claim === 'aggregate') return `Overall conversion ${e.delta>0?'increased':'did not increase'}, from ${fmt(e.before.rate)} to ${fmt(e.after.rate)}.${e.reversal?' But every segment moved in the opposite direction: the headline hides a change in customer mix.':''}`;
  const falling=e.segments.filter(s=>s.delta!<=0).length;
  return falling ? `${falling} of ${e.segments.length} customer segments did not improve.${e.reversal?' The higher overall conversion rate comes with a shift toward the higher-converting segment.':''} The claim does not hold across every segment.` : 'Every observed customer segment has a higher conversion rate. This supports the descriptive claim, but does not establish causation or statistical significance.';
}
export function fmt(n: number | null, suffix = '%'): string { return n === null ? '—' : `${n.toFixed(1)}${suffix}`; }
export function pp(n: number | null): string { return n === null ? '—' : `${n>0?'+':''}${n.toFixed(1)} pp`; }
export function toCSV(rows: Row[]): string {
  return 'period,segment,visitors,conversions\n'+rows.map(r=>[r.period,`"${r.segment.replaceAll('"','""')}"`,r.visitors,r.conversions].join(',')).join('\n');
}
export function parseCSV(text: string): Row[] {
  const records:string[][]=[];let row:string[]=[],field='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++) { const c=text[i]; if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))records.push(row);row=[];field='';}else field+=c; }
  if(quoted)throw new Error('CSV has an unclosed quoted field.');
  row.push(field);if(row.some(x=>x.trim()))records.push(row);
  const header=records.shift()?.map(x=>x.trim().toLowerCase());const expected=['period','segment','visitors','conversions'];
  if(!header||header.length!==4||expected.some(x=>!header.includes(x)))throw new Error('CSV needs exactly these headers: period, segment, visitors, conversions. Download the example to get started.');
  return validateRows(records.map((r,i)=>{if(r.length!==4)throw new Error(`CSV row ${i+2} must contain 4 columns.`);const get=(k:string)=>r[header.indexOf(k)].trim();return {period:get('period').toLowerCase(),segment:get('segment'),visitors:get('visitors')===''?NaN:Number(get('visitors')),conversions:get('conversions')===''?NaN:Number(get('conversions'))};}));
}
export const benchmark = scenarios.flatMap((s,index)=> (['aggregate','segments','causal'] as Claim[]).map(claim=>({id:`${s.id}-${claim}`,name:s.name,rows:s.rows,claim,expected: ([['supported','contradicted','needs_review'],['supported','supported','needs_review'],['contradicted','contradicted','needs_review'],['needs_review','needs_review','needs_review']][index][['aggregate','segments','causal'].indexOf(claim)]) as Verdict })));
