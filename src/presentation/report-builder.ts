import { join } from 'path';
import { FileSystemUtils } from '../utils/file-system.js';

export async function buildExecutiveReport(brand: string, outputsDir?: string): Promise<string> {
  const dir = outputsDir || join('outputs', 'evolution', brand.toLowerCase().replace(/\s+/g, '-'));
  const sections: string[] = [];

  async function readJSONIfExists(file: string): Promise<any | null> {
    const full = join(dir, file);
    if (!(await FileSystemUtils.fileExists(full))) return null;
    return FileSystemUtils.readJSON(full);
  }

  const oracle = await readJSONIfExists('00-oracle-context.json');
  const research = await readJSONIfExists('01-research-blitz.json');
  const patterns = await readJSONIfExists('02-patterns.json');
  const direction = await readJSONIfExists('03-creative-direction.json');
  const validation = await readJSONIfExists('04-validation.json');
  const buildout = await readJSONIfExists('05-buildout.json');
  const teardown = await readJSONIfExists('06-teardown-swot.json');
  const narrative = await readJSONIfExists('07-narrative-package.json');
  const researchTopics = await readJSONIfExists('08-research-topics.json');
  const deliverables = await readJSONIfExists('09-deliverables-bundle.json');
  const guardian = await readJSONIfExists('10-guardian-gates.json');
  const productCatalog = await readJSONIfExists('11-product-catalog.json');
  const pricingGuide = await readJSONIfExists('12-pricing-guide.json');
  const corporateCatalog = await readJSONIfExists('13-corporate-catalog.json');
  const trainingGuide = await readJSONIfExists('14-training-guide.json');
  const assetMap = await readJSONIfExists('15-asset-map.json');

  sections.push(`<h1>Brand Evolution Report: ${escapeHtml(brand)}</h1>`);
  sections.push(`<p><em>Generated: ${escapeHtml(new Date().toLocaleString())}</em></p>`);
  sections.push(`<div class=\"box\"><strong>Navigation:</strong> <a href=\"#phase1\">Phase 1</a> • <a href=\"#phase2\">Phase 2</a> • <a href=\"#phase3\">Phase 3</a> • <a href=\"#phase4\">Phase 4</a> • <a href=\"#phase5\">Phase 5</a></div>`);

  if (oracle && (oracle.items||[]).length) { sections.push(`<h2>Oracle Context (Snippets)</h2>`, renderOracle(oracle)); }
  if (research) { sections.push(`<h2 id=\"phase1\">Phase 1: Research Blitz</h2>`, renderResearch(research)); }
  if (patterns) { sections.push(`<h2 id=\"phase2\">Phase 2: Patterns</h2>`, renderPatterns(patterns)); }
  if (direction) { sections.push(`<h2 id=\"phase3\">Phase 3: Creative Direction</h2>`, renderDirection(direction)); }
  if (validation) { sections.push(`<h2 id=\"phase4\">Phase 4: Validation</h2>`, renderValidation(validation)); }
  if (buildout) { sections.push(`<h2 id=\"phase5\">Phase 5: Build-Out</h2>`, renderBuildout(buildout)); }
  if (teardown) { sections.push(`<h2>Teardown & SWOT</h2>`, renderTeardown(teardown)); }
  if (narrative) { sections.push(`<h2>Narrative Package (ACT 1–6)</h2>`, renderNarrative(narrative)); }
  if (researchTopics) { sections.push(`<h2>Research Topics Framework</h2>`, renderResearchTopics(researchTopics)); }
  if (deliverables) { sections.push(`<h2>Deliverables Framework</h2>`, renderDeliverables(deliverables)); }
  if (guardian) { sections.push(`<h2>Quality Gates</h2>`, renderGuardian(guardian)); }
  if (productCatalog) { sections.push(`<h2>Product Catalog (Preview)</h2>`, renderProductCatalog(productCatalog)); }
  if (pricingGuide) { sections.push(`<h2>Pricing Guide (Preview)</h2>`, renderPricingGuide(pricingGuide)); }
  if (corporateCatalog) { sections.push(`<h2>Corporate Catalog (Preview)</h2>`, renderCorporateCatalog(corporateCatalog)); }
  if (trainingGuide) { sections.push(`<h2>Training Guide (Preview)</h2>`, renderTrainingGuide(trainingGuide)); }
  if (assetMap) { sections.push(`<h2>Asset Map (Preview)</h2>`, renderAssetMap(assetMap)); }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Brand Evolution Report – ${escapeHtml(brand)}</title>
    <style>
      :root{--ink:#0d47a1;--muted:#666;--bg:#fff;--box:#f7f9fc}
      body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 2rem; line-height: 1.6; color:#222; }
      h1, h2 { color: var(--ink); }
      .muted{ color: var(--muted); }
      .box{ background: var(--box); padding: 1rem; border-radius: 8px; }
      ul{ margin-top:.5rem }
      table{ border-collapse: collapse; width:100%; }
      th, td{ text-align:left; padding:.5rem; border-bottom:1px solid #eee }
      code, pre{ background:#f5f5f5; padding:.5rem .75rem; border-radius:6px; }
    </style>
  </head>
  <body>
    ${sections.join('\n')}
  </body>
</html>`;

  return html;
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderList(items: string[]): string {
  if (!items || items.length === 0) return `<p class="muted">None</p>`;
  return `<ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

function renderResearch(r: any): string {
  const head = renderList((r.headings || []).slice(0,6));
  return `
  <div class="box">
    <p><strong>Positioning</strong>: ${escapeHtml(r.brandAudit?.positioning || 'Unknown')}</p>
    <p><strong>Tagline</strong>: ${escapeHtml(r.brandAudit?.messaging?.tagline || 'Unknown')}</p>
    <p><strong>Headings</strong>:</p>
    ${head}
  </div>`;
}
function renderOracle(o:any): string {
  const list = (o.items||[]).slice(0,5).map((it:any)=>`<li><strong>${escapeHtml(it.query)}</strong>: ${escapeHtml((it.snippets||[]).join(' • '))}</li>`).join('');
  return `<div class=\"box\"><ul>${list}</ul></div>`;
}

function renderPatterns(p: any): string {
  const contradictions = (p.contradictions || []).slice(0,5).map((c:any)=>`<li><strong>${escapeHtml(c.id)}</strong> — ${escapeHtml(c.implication)}</li>`).join('');
  const white = (p.whiteSpace || []).slice(0,5).map((w:any)=>`<tr><td>${escapeHtml(w.description)}</td><td>${escapeHtml(w.untappedOpportunity||'')}</td></tr>`).join('');
  return `
  <div class="box">
    <h3>Contradictions</h3>
    <ul>${contradictions}</ul>
    <h3>White Space</h3>
    <table>
      <thead><tr><th>Description</th><th>Untapped Opportunity</th></tr></thead>
      <tbody>${white}</tbody>
    </table>
  </div>`;
}

function renderDirection(d: any): string {
  const themes = renderList(d.keyThemes || []);
  return `
  <div class="box">
    <p><strong>Primary Direction</strong>: ${escapeHtml(d.primaryDirection || '')}</p>
    <p><strong>Key Themes</strong>:</p>
    ${themes}
  </div>`;
}

function renderValidation(v: any): string {
  const confidence = typeof v.overallConfidence === 'number' ? (v.overallConfidence*10).toFixed(1) : '—';
  return `
  <div class="box">
    <p><strong>Recommendation</strong>: ${escapeHtml(String(v.recommendation || '').toUpperCase())}</p>
    <p><strong>Confidence</strong>: ${escapeHtml(confidence)}/10</p>
    <p class="muted">Differentiation: ${(v.differentiationScore*10||0).toFixed(1)}/10</p>
  </div>`;
}

function renderBuildout(b: any): string {
  return `
  <div class="box">
    <h3>Executive Summary</h3>
    <p>${escapeHtml(b.executiveSummary || '')}</p>
    <h3>Positioning</h3>
    <p>${escapeHtml(b.positioningFramework?.statement || '')}</p>
    <h3>Messaging</h3>
    <p>Tagline: ${escapeHtml(b.messagingArchitecture?.tagline || '')}</p>
  </div>`;
}
function renderTeardown(t: any): string {
  return `
  <div class="box">
    <p><strong>Score</strong>: ${(t.score||0).toFixed(1)}/10</p>
    <h3>Strengths</h3>${renderList(t.strengths||[])}
    <h3>Weaknesses</h3>${renderList(t.weaknesses||[])}
    <h3>Opportunities</h3>${renderList(t.opportunities||[])}
    <h3>Threats</h3>${renderList(t.threats||[])}
  </div>`;
}

function renderNarrative(n: any): string {
  const toc = (n.toc||[]).map((e:any)=>`<li><a href="#${e.id}">${escapeHtml(e.title)}</a></li>`).join('');
  const sections = (n.sections||[]).map((s:any)=>`<h3 id="${s.id}">${escapeHtml(s.title)}</h3><p>${escapeHtml(s.content)}</p>`).join('');
  return `
  <div class="box">
    <h3>Table of Contents</h3>
    <ul>${toc}</ul>
    ${sections}
  </div>`;
}

function renderResearchTopics(rt: any): string {
  function phase(p:any){
    const topics = (p.topics||[]).slice(0,5).map((t:any)=>`<li><strong>${escapeHtml(t.name)}</strong>: ${escapeHtml((t.subtopics||[]).slice(0,3).join('; '))}</li>`).join('');
    return `<ul>${topics}</ul>`;
  }
  return `
  <div class="box">
    <h3>${escapeHtml(rt.phase1?.name||'Phase 1')}</h3>${phase(rt.phase1||{})}
    <h3>${escapeHtml(rt.phase2?.name||'Phase 2')}</h3>${phase(rt.phase2||{})}
    <h3>${escapeHtml(rt.phase3?.name||'Phase 3')}</h3>${phase(rt.phase3||{})}
    <h3>${escapeHtml(rt.phase4?.name||'Phase 4')}</h3>${phase(rt.phase4||{})}
  </div>`;
}

function renderDeliverables(d:any): string {
  const total = d.total || 0;
  const keys = Object.keys(d.deliverables||{});
  const preview = keys.map(k=>`<li><strong>${escapeHtml(k)}</strong>: ${(d.deliverables[k]||[]).slice(0,3).map((x:string)=>escapeHtml(x)).join('; ')} ...</li>`).join('');
  return `
  <div class="box">
    <p><strong>Total Deliverables</strong>: ${escapeHtml(String(total))}</p>
    <ul>${preview}</ul>
  </div>`;
}
function renderGuardian(g:any): string {
  const items = (g.gates||[]).map((r:any)=>`<li><strong>${escapeHtml(r.name)}</strong>: ${escapeHtml(r.status.toUpperCase())} — ${escapeHtml(r.reason)}</li>`).join('');
  const recs = renderList(g.recommendations||[]);
  return `
  <div class="box">
    <p><strong>Overall</strong>: ${escapeHtml(String(g.overall).toUpperCase())}</p>
    <p><strong>Score</strong>: ${escapeHtml(String(g.score))}/100</p>
    <h3>Gates</h3>
    <ul>${items}</ul>
    <h3>Recommendations</h3>
    ${recs}
  </div>`;
}
function renderProductCatalog(pc:any): string {
  const rows = (pc.items||[]).slice(0,5).map((i:any)=>`<tr><td>${escapeHtml(i.sku)}</td><td>${escapeHtml(i.name)}</td><td>${escapeHtml(i.category)}</td><td>${escapeHtml(i.priceRange||'')}</td></tr>`).join('');
  return `<div class="box"><table><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Price Range</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderPricingGuide(pg:any): string {
  const rows = (pg.entries||[]).slice(0,5).map((e:any)=>`<tr><td>${escapeHtml(e.category)}</td><td>${escapeHtml(e.product)}</td><td>${escapeHtml((e.sizes||[]).map((s:any)=>s.size+': ₹'+s.mrp).join(', '))}</td></tr>`).join('');
  return `<div class="box"><table><thead><tr><th>Category</th><th>Product</th><th>Sizes</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderCorporateCatalog(cc:any): string {
  const rows = (cc.entries||[]).slice(0,5).map((e:any)=>`<tr><td>${escapeHtml(e.name)}</td><td>${escapeHtml(e.price)}</td><td>${escapeHtml(e.description)}</td></tr>`).join('');
  return `<div class="box"><table><thead><tr><th>Name</th><th>Price</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderTrainingGuide(tg:any): string {
  const list = (tg.topics||[]).slice(0,5).map((t:any)=>`<li><strong>${escapeHtml(t.topic)}</strong>: ${escapeHtml((t.points||[]).join('; '))}</li>`).join('');
  return `<div class="box"><ul>${list}</ul></div>`;
}
function renderAssetMap(am:any): string {
  const rows = (am.items||[]).slice(0,5).map((i:any)=>`<tr><td>${escapeHtml(i.type)}</td><td>${escapeHtml(i.name)}</td><td>${escapeHtml(i.status||'')}</td></tr>`).join('');
  return `<div class="box"><table><thead><tr><th>Type</th><th>Name</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
