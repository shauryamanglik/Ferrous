#!/usr/bin/env node
/* ============================================================
   FERROUS SITE BUILD  v3 (new design)
   Source of truth: data/jobs.json
   Generates: /careers, /careers/<slug>, sitemap.xml (new design)
   Injects:   live role count + role names into the careers band of the 4 main pages
   Never touches: anything outside its markers, /dm, or other files.
   Run: node build.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/jobs.json'), 'utf8'));
const { config, companies } = DATA;
const JOBS = DATA.jobs.filter(j => j.live !== false);
const SITE = config.siteUrl.replace(/\/$/, '');
const NAV_LINK = config.navLink === true;   // off by default: the nav bar is already full

const HOST_PAGES = [
  { file: 'index.html',      company: null },
  { file: 'fe/index.html',   company: 'FE' },
  { file: 'de/index.html',   company: 'DE' },
  { file: 'fapl/index.html', company: 'FA' }
];

/* ---------- helpers ---------- */
const read  = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, c) => {
  const p = path.join(ROOT, f);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c);
  console.log('  wrote ' + f);
};
const exists = f => fs.existsSync(path.join(ROOT, f));
const esc = s => String(s)
  .replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = s => String(s).replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&reg;/g, '\u00AE')
  .replace(/&middot;/g, '\u00B7').replace(/&rsquo;/g, '\u2019')
  .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const inr = n => '\u20B9' + Number(n).toLocaleString('en-IN');
const salaryText = j => {
  if (!j.salary || j.salary.min == null) return null;
  const per = (j.salary.unit || 'MONTH').toLowerCase() === 'year' ? '/ year' : '/ month';
  return j.salary.max && j.salary.max !== j.salary.min
    ? `${inr(j.salary.min)} \u2013 ${inr(j.salary.max)} ${per}`
    : `${inr(j.salary.min)} ${per}`;
};
const co = j => companies[j.company];
const jobUrl = j => `/careers/${j.slug}`;          /* cleanUrls:true, trailingSlash:false */
const typeLabel = t => String(t || 'FULL_TIME').replace(/_/g, ' ').toLowerCase()
  .replace(/\b\w/g, m => m.toUpperCase());

const EMB = Object.assign(
  { hideTitle: true, transparentBackground: false, alignLeft: false, dynamicHeight: true },
  config.tallyEmbed || {});
const tally = (id, p) => {
  const q = new URLSearchParams(p);
  if (EMB.hideTitle)             q.set('hideTitle', '1');
  if (EMB.transparentBackground) q.set('transparentBackground', '1');
  if (EMB.alignLeft)             q.set('alignLeft', '1');
  if (EMB.dynamicHeight)         q.set('dynamicHeight', '1');
  return `https://tally.so/embed/${id}?${q}`;
};
const TALLY_JS = '<script async src="https://tally.so/widgets/embed.js"></script>';
const hasForm = id => id && !/REPLACE/i.test(id);

/* ============================================================
   NEW DESIGN: page shell + fixed copy are produced from the design build
   (assets/site/careers-shell.html, assets/site/careers-copy.json).
   Everything role-specific comes from data/jobs.json, exactly as before.
   ============================================================ */
const SHELL = read('assets/site/careers-shell.html');
const COPY  = JSON.parse(read('assets/site/careers-copy.json'));
const KEY   = { FE: 'lfe', DE: 'lde', FA: 'lfa' };
const sal   = j => salaryText(j) || 'Competitive';
const logo  = j => `<img data-a="${KEY[j.company]}" alt="${esc(co(j).name)}">`;
const addr  = c => `${c.streetAddress}, ${c.locality}, ${c.region} ${c.postalCode}`;

const card = (j, i = 0, short = false) => {
  const c = co(j);
  const rows = [['Location', esc(c.shortLocation)]]
    .concat(short ? [] : [['Workplace', `${esc(j.workplace)} &middot; ${typeLabel(j.employmentType)}`]])
    .concat([['Salary', sal(j)]]);
  return `<a class="jcard rv" style="--d:${i * 90}ms" href="${jobUrl(j)}"><div class="jc-top"><span class="jc-co">${logo(j)}</span><span class="jc-exp">${esc(j.experience)}</span></div>`
    + `<h3>${esc(j.title)}</h3><p>${esc(j.summary)}</p><div class="jc-rows">${rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>`
    + `<span class="jc-go">View Role &amp; Apply <i>&rarr;</i></span></a>`;
};
const fshell = (src, note, ttl) => `<div class="fshell rv"><div class="fs-load"><span class="spin"></span>Loading form</div><iframe data-tally-src="${src}" loading="lazy" title="${ttl}"></iframe></div><p class="fnote">${note}</p>`;
const tile = (k, v, acc) => `<div class="kt${acc ? ' acc' : ''}"><small>${k}</small><b>${v}</b></div>`;

function page(o) {
  return SHELL.replace(/\{\{TITLE\}\}/g, o.title).replace(/\{\{OGTITLE\}\}/g, o.ogTitle).replace(/\{\{DESC\}\}/g, o.desc)
    .replace(/\{\{URL\}\}/g, o.url).replace('{{LD}}', o.ld || '').replace('<!--MAIN-->', o.main);
}

/* ---------------- careers hub ---------------- */
console.log('Building careers...');
const N = JOBS.length;
const hub = COPY.hub.replace('<main data-view', '<main class="show" data-view')
  .replace('{{JOBS}}', '<div class="jgrid">' + JOBS.map((j, i) => card(j, i)).join(''))
  .replace('{{N}}', `${N} position${N === 1 ? '' : 's'}`);
write('careers/index.html', page({
  title: `Careers | Ferrous Group | Heavy Engineering Jobs in Chandrapur &amp; Pune`,
  ogTitle: 'Careers | Ferrous Group',
  desc: `${N} open ${N === 1 ? 'role' : 'roles'} at Ferrous Group. Heavy engineering, fabrication, commercial and automation jobs at Tadali MIDC Chandrapur and MIDC Chakan Pune. Apply online or walk in.`,
  url: SITE + '/careers', main: hub
}));

/* ---------------- job pages ---------------- */
function jobPage(j) {
  const c = co(j), pay = salaryText(j);
  const ld = {
    '@context': 'https://schema.org', '@type': 'JobPosting',
    title: plain(j.title),
    description: '<p>' + plain(j.about) + '</p>'
      + '<h3>Key Responsibilities</h3><ul>' + j.responsibilities.map(r => `<li><strong>${plain(r.t)}:</strong> ${plain(r.d)}</li>`).join('') + '</ul>'
      + '<h3>What We Are Looking For</h3><ul>' + j.mustHave.map(r => `<li>${plain(r)}</li>`).join('') + '</ul>'
      + (j.niceToHave?.length ? '<h3>Nice To Have</h3><ul>' + j.niceToHave.map(r => `<li>${plain(r)}</li>`).join('') + '</ul>' : '')
      + (j.benefits?.length ? '<h3>Benefits</h3><ul>' + j.benefits.map(b => `<li><strong>${plain(b.t)}:</strong> ${plain(b.d)}</li>`).join('') + '</ul>' : ''),
    identifier: { '@type': 'PropertyValue', name: 'Ferrous Group', value: j.slug },
    datePosted: j.posted,
    employmentType: j.employmentType || 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: c.name, sameAs: SITE + c.path,
      logo: 'https://raw.githubusercontent.com/shauryamanglik/Ferrous/main/Ferrous%20Logos/Ferrous%20Circle.png' },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress',
      streetAddress: c.streetAddress, addressLocality: c.locality, addressRegion: c.region,
      postalCode: c.postalCode, addressCountry: 'IN' } },
    directApply: true
  };
  if (String(j.workplace).toLowerCase() === 'remote') {
    ld.jobLocationType = 'TELECOMMUTE';
    ld.applicantLocationRequirements = { '@type': 'Country', name: 'India' };
  }
  if (j.salary?.min != null) ld.baseSalary = { '@type': 'MonetaryAmount', currency: 'INR',
    value: { '@type': 'QuantitativeValue', minValue: j.salary.min,
             maxValue: j.salary.max ?? j.salary.min, unitText: j.salary.unit || 'MONTH' } };
  if (j.validThrough) ld.validThrough = j.validThrough;

  const hero = `<section class="cr-hero job"><div class="heat"></div><div class="grid-bg"></div><div class="wrap"><a class="back ia" href="/careers">&larr; All Openings</a>`
    + `<div class="jh-co ia" style="animation-delay:.1s">${logo(j)}</div><h1 class="ia" style="animation-delay:.18s">${esc(j.title)}</h1>`
    + `<p class="lede ia" style="animation-delay:.28s">${esc(j.summary)}</p><div class="k-tiles ia" style="animation-delay:.38s">`
    + tile('Location', esc(c.shortLocation)) + tile('Workplace', esc(j.workplace)) + tile('Experience', esc(j.experience)) + tile('Salary', sal(j), true)
    + `</div><div class="acts ia" style="animation-delay:.48s"><a class="btn btn-p" href="#apply">Apply For This Role <span class="ar">&rarr;</span></a>`
    + (j.walkIn ? '<a class="btn btn-s" href="#walk-in">Walk-In Details</a>' : '') + '</div></div></section>';

  const resp = '<div class="jr-grid">' + (j.responsibilities || []).map((r, i) => `<div class="jr rv" style="--d:${(i % 2) * 90}ms"><span>${String(i + 1).padStart(2, '0')}</span><div><h4>${esc(r.t)}</h4><p>${esc(r.d)}</p></div></div>`).join('') + '</div>';
  const reqs = `<div class="jq-grid"><div class="jq rv"><h4>Must Have <i>${(j.mustHave || []).length}</i></h4><ul>` + (j.mustHave || []).map(x => `<li>${esc(x)}</li>`).join('') + '</ul></div>'
    + (j.niceToHave?.length ? `<div class="jq nice rv" style="--d:90ms"><h4>Nice To Have <i>${j.niceToHave.length}</i></h4><ul>` + j.niceToHave.map(x => `<li>${esc(x)}</li>`).join('') + '</ul></div>' : '') + '</div>';
  const ben = '<div class="jb-grid">' + (j.benefits || []).map((b, i) => `<div class="jbn rv" style="--d:${(i % 2) * 90}ms"><h4>${esc(b.t)}</h4><p>${esc(b.d)}</p></div>`).join('') + '</div>';
  const snap = [['Company', esc(c.name)], ['Sector', esc(c.sector)], ['Location', esc(c.shortLocation)], ['Workplace', esc(j.workplace)], ['Type', typeLabel(j.employmentType)], ['Experience', esc(j.experience)], ['Salary', sal(j)]];
  const walkCard = j.walkIn ? `<div class="rail-c rv" style="--d:100ms"><h4>Prefer To Walk In?</h4><p><b>${esc(c.name)}</b><br>${esc(addr(c))}</p>`
    + `<p>${esc(config.walkIn.days)}<br><b>${esc(config.walkIn.time)}</b></p><a class="ln" href="tel:${c.phone}">${COPY.ph}${esc(c.phoneDisplay)}</a><p class="fine">Bring a printed CV and any certificates.</p></div>` : '';
  const body = `<section class="k-sec" id="role" data-sheet="About The Role"><div class="wrap"><div class="jbody"><div class="jmain">`
    + `<div class="jblock rv"><div class="jh"><i>01</i>About The Role</div><p class="k-p">${esc(j.about)}</p></div>`
    + `<div class="jblock"><div class="jh rv"><i>02</i>What You&rsquo;ll Do</div>${resp}</div>`
    + `<div class="jblock"><div class="jh rv"><i>03</i>What We&rsquo;re Looking For</div>${reqs}</div>`
    + (j.benefits?.length ? `<div class="jblock"><div class="jh rv"><i>04</i>Perks &amp; Benefits</div>${ben}</div>` : '') + '</div>'
    + `<aside class="jrail"><div class="rail-c rv"><h4>Role Snapshot</h4>` + snap.map(([a, b]) => `<div class="rr"><span>${a}</span><b>${b}</b></div>`).join('')
    + `<a class="btn btn-p" href="#apply">Apply Now <span class="ar">&rarr;</span></a></div>${walkCard}</aside></div></div></section>`;

  const t = esc(j.title), tUrl = encodeURIComponent(plain(j.title));
  const form = hasForm(config.tallyFormId)
    ? fshell(tally(config.tallyFormId, { role: plain(j.title), role_slug: j.slug, company: c.name }), COPY.apply_note.replace(/\{\{TITLE_URL\}\}/g, tUrl).replace(/\{\{TITLE\}\}/g, t), 'Application form for ' + t)
    : `<div class="fshell rv"><div class="fs-load" style="position:static;padding:40px;text-align:center">Our online form is being set up. Email your CV to <a href="mailto:${config.careersEmail}?subject=Application%3A%20${tUrl}">${config.careersEmail}</a> with the role name in the subject.</div></div>`;
  const apply = `<section class="k-sec" id="apply" data-sheet="Apply"><div class="wrap">${COPY.apply_head.replace(/\{\{TITLE\}\}/g, t)}${form}</div></section>`;
  const walk = j.walkIn ? `<section class="k-sec" id="walk-in" data-sheet="Walk In"><div class="wrap">${COPY.walk_head}<div class="k-tiles">`
    + tile('Days', esc(config.walkIn.days)) + tile('Time', esc(config.walkIn.time), true)
    + tile('Call Ahead', `<a href="tel:${c.phone}" style="color:inherit">${esc(c.phoneDisplay)}</a>`) + tile('Venue', esc(c.locality))
    + `</div><div class="k-spec rv" style="margin-top:12px"><div class="k-row"><span class="k">Address</span><span class="v">${esc(addr(c))}</span></div></div></div></section>` : '';
  const others = JOBS.filter(x => x.slug !== j.slug);
  const more = others.length ? `<section class="k-sec" id="other-roles" data-sheet="More Roles"><div class="wrap">${COPY.other_head}<div class="jgrid">${others.map((o, i) => card(o, i, true)).join('')}</div></div></section>` : '';

  return page({
    title: `${t} | ${esc(c.name)} | Ferrous Group Careers`,
    ogTitle: `${t} | ${esc(c.name)}`,
    desc: `${esc(plain(j.summary))} ${esc(c.shortLocation)}.${pay ? ' ' + esc(pay) + '.' : ''} Apply online or walk in.`,
    url: SITE + jobUrl(j),
    ld: `<script type="application/ld+json">\n${JSON.stringify(ld)}\n</script>\n`,
    main: `<main class="show" data-view="careers/${j.slug}" data-title="${t} | Careers | Ferrous Group">${hero}${body}${apply}${walk}${more}${COPY.next}</main>`
  });
}
JOBS.forEach(j => write(`careers/${j.slug}/index.html`, jobPage(j)));

/* prune pages whose role is no longer live */
const cdir = path.join(ROOT, 'careers');
if (fs.existsSync(cdir)) {
  const keep = new Set(JOBS.map(j => j.slug));
  fs.readdirSync(cdir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !keep.has(e.name))
    .forEach(e => { fs.rmSync(path.join(cdir, e.name), { recursive: true, force: true });
                    console.log('  removed careers/' + e.name + ' (no longer live)'); });
}

/* ---------------- careers band on the 4 main pages: live count + role names ---------------- */
const names = JOBS.map(j => `<span>${esc(j.title)}</span>`).join('');
HOST_PAGES.forEach(p => {
  if (!exists(p.file)) return;
  let h = read(p.file);
  h = h.replace(/<!--CB:N-->[\s\S]*?<!--\/CB:N-->/g, `<!--CB:N-->${N}<!--/CB:N-->`)
       .replace(/<!--CB:R-->[\s\S]*?<!--\/CB:R-->/g, `<!--CB:R-->${N ? names.repeat(4) : ''}<!--/CB:R-->`);
  write(p.file, h);
});
/* ---------------- sitemap ---------------- */
console.log('\nGenerating sitemap...');
const today = new Date().toISOString().slice(0, 10);
const urls = [
  { u: SITE + '/',        p: '1.0', f: 'monthly' },
  { u: SITE + '/fe',      p: '0.9', f: 'monthly' },
  { u: SITE + '/de',      p: '0.9', f: 'monthly' },
  { u: SITE + '/fapl',    p: '0.9', f: 'monthly' },
  { u: SITE + '/careers', p: '0.8', f: 'weekly'  },
  ...JOBS.map(j => ({ u: SITE + jobUrl(j), p: '0.7', f: 'weekly' }))
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(x => `  <url><loc>${x.u}</loc><lastmod>${today}</lastmod><changefreq>${x.f}</changefreq><priority>${x.p}</priority></url>`).join('\n')}
</urlset>
`);

console.log(`\n  Done. ${JOBS.length} live role${JOBS.length === 1 ? '' : 's'}.`);
JOBS.forEach(j => console.log(`    ${j.title}  ->  ${jobUrl(j)}`));
const off = DATA.jobs.length - JOBS.length;
if (off) console.log(`  ${off} not live, excluded everywhere.`);
console.log('');
