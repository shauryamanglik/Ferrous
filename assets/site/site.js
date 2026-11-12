(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const small = () => innerWidth <= 820;
const M = { x: innerWidth / 2, y: innerHeight / 2, moved: 0 };
addEventListener('pointermove', e => { M.x = e.clientX; M.y = e.clientY; M.moved = performance.now(); }, { passive: true });

/* ---------- split headings (keeps .red-word / .steel spans whole) ---------- */
$$('[data-split]').forEach(el => {
  let i = 0;
  const wrap = node => { const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.style.setProperty('--i', i++); node.replaceWith(w); s.appendChild(node); w.appendChild(s); };
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) return f.appendChild(document.createTextNode(t));
        const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++); w.appendChild(s); f.appendChild(w); });
      n.replaceWith(f);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') { n.matches('.red-word,.steel') ? wrap(n) : walk(n); }
  });
  walk(el); el.classList.add('sp');
});

/* ---------- odometers: mechanical rolling digits ---------- */
function buildOdo(el) {
  const v = Number(el.dataset.odo), str = el.dataset.fmt === 'plain' ? String(v) : v.toLocaleString('en-IN');
  el.innerHTML = ''; let k = 0;
  [...str].forEach(ch => {
    if (/\d/.test(ch)) {
      const d = document.createElement('span'); d.className = 'd';
      const s = document.createElement('span'); s.className = 's'; s.style.setProperty('--k', k++);
      for (let r = 0; r < 20; r++) { const n = document.createElement('span'); n.textContent = r % 10; s.appendChild(n); }
      s.dataset.t = 10 + Number(ch); d.appendChild(s); el.appendChild(d);
    } else { const c = document.createElement('span'); c.className = 'cm'; c.textContent = ch; el.appendChild(c); }
  });
  if (el.dataset.suf) { const sp = document.createElement('sup'); sp.textContent = el.dataset.suf; el.appendChild(sp); }
  el.setAttribute('aria-label', str + (el.dataset.suf || ''));
}
const rollOdo = el => $$('.s', el).forEach(s => s.style.transform = `translateY(${-s.dataset.t}em)`);
$$('[data-odo]').forEach(buildOdo);

/* ---------- line-art: measure strokes so they draw themselves ---------- */
$$('.art').forEach(svg => $$('.d,.dw,.dr', svg).forEach(p => {
  if (p.classList.contains('dash') || p.hasAttribute('stroke-dasharray') || p.matches('.spin-dash,.belt-mv,.cut,.chip,.plate,.bv-v') || p.querySelector('animate,animateTransform,animateMotion')) return; let L = 0; try { L = p.getTotalLength(); } catch (e) {}
  if (L) { p.classList.add('draw'); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; }
}));

/* ---------- reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const t = e.target; t.classList.add('in'); io.unobserve(t);
  if (t.matches('.art')) $$('.draw', t).forEach((p, k) => { p.style.transitionDelay = Math.min(k * 14, 700) + 'ms'; p.style.strokeDashoffset = 0; });
  if (t.matches('[data-odo]')) rollOdo(t);
  $$('[data-odo]', t).forEach(rollOdo);
}), { threshold: .2, rootMargin: '0px 0px -6% 0px' });
const arm = root => $$('.rv,.sp,.card,.art,.ti,.units', root).forEach(el => io.observe(el));

/* ---------- dust: fine motes drifting up through the light, with depth ---------- */
function dust(cv) {
  if (calm) return;
  const c = cv.getContext('2d'); let W, H, P = [], vis = true, raf = 0, ox = 0, oy = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const mk = s => { const z = .25 + Math.random() * .75; return { x: Math.random() * W, y: s ? Math.random() * H : H + 8, z, vy: -(.05 + Math.random() * .16) * z,
    ph: Math.random() * 6.28, r: (.45 + Math.random() * .85) * z * 1.35, e: Math.random() < .13, px: 0, py: 0 }; };
  size(); P = Array.from({ length: small() ? 38 : 132 }, () => mk(1));
  addEventListener('resize', size);
  new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(loop); }).observe(cv);
  function loop() {
    raf = 0; if (!vis) return;
    const rc = cv.getBoundingClientRect(), mx = M.x - rc.left, my = M.y - rc.top;
    ox += ((M.x / innerWidth - .5) - ox) * .04; oy += ((M.y / innerHeight - .5) - oy) * .04;
    c.clearRect(0, 0, W, H);
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; p.ph += .008; p.y += p.vy; p.x += Math.sin(p.ph) * .1 * p.z;
      let x = p.x + ox * 46 * p.z, y = p.y + oy * 28 * p.z;
      if (fine) { const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy); if (d < 120 && d > .1) { const f = (1 - d / 120) * 14 * p.z; p.px += (dx / d * f - p.px) * .08; p.py += (dy / d * f - p.py) * .08; } }
      p.px *= .96; p.py *= .96; x += p.px; y += p.py;
      const edge = Math.min(1, y / (H * .25), (H - y) / (H * .12));
      const a = Math.max(0, (.16 + .5 * p.z) * edge);
      if (p.e) { const g = c.createRadialGradient(x, y, 0, x, y, p.r * 5); g.addColorStop(0, `rgba(255,160,100,${a * .5})`); g.addColorStop(1, 'rgba(198,10,10,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, p.r * 5, 0, 6.3); c.fill(); c.fillStyle = `rgba(255,190,140,${a})`; }
      else c.fillStyle = `rgba(232,232,232,${a * .75})`;
      c.beginPath(); c.arc(x, y, p.r, 0, 6.3); c.fill();
      if (p.y < -10) P[i] = mk(0);
    }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
}

/* ---------- chrome wordmark: reflections follow the cursor ---------- */
function chrome(cv, url, fb) {
  const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
  const fail = () => { cv.style.display = 'none'; fb.style.display = 'block'; };
  if (!gl) return fail();
  cv.addEventListener('webglcontextlost', e => e.preventDefault(), { once: true });
  cv.addEventListener('webglcontextrestored', () => chrome(cv, url, fb), { once: true });
  const VS = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;uniform sampler2D uM;uniform vec2 uX;uniform float uT;uniform float uA;uniform vec2 uP;uniform vec2 uL;uniform float uLs;uniform vec3 uLc;varying vec2 vUv;
float wob(float t,float a,float b,float c){return sin(t*a)*.62+sin(t*b+1.73)*.26+sin(t*c+4.11)*.12;}
vec3 room(vec3 d){float y=clamp(d.y,-1.,1.);float a=atan(d.x,d.z);vec3 c=vec3(.012);
c=mix(c,vec3(.085),smoothstep(-.95,-.52,y));c=mix(c,vec3(.34),smoothstep(-.52,-.12,y));c=mix(c,vec3(.045),smoothstep(-.12,-.026,y));
c=mix(c,vec3(1.02),smoothstep(-.018,.012,y));c=mix(c,vec3(.30),smoothstep(.055,.20,y));c=mix(c,vec3(.86),smoothstep(.34,.60,y));c=mix(c,vec3(.42),smoothstep(.70,.90,y));
for(int i=0;i<3;i++){float fi=float(i);float aa=a+uT*(.95+fi*.21)+wob(uT,.31+fi*.07,.17+fi*.05,.083+fi*.023)*(.85+fi*.22)+fi*2.3;
float band=pow(smoothstep(.55,0.,abs(sin(aa))),7.);float yb=smoothstep(.10,.42,y)*smoothstep(1.05,.55,y);c+=vec3(1.)*band*yb*(1.35-fi*.33);}
vec3 kd=normalize(vec3(wob(uT,.74,.39,.155)*.62,.70+wob(uT,.28,.61,.13)*.14,.62+wob(uT,.41,.19,.097)*.16));
c+=vec3(1.,.99,.97)*pow(max(dot(d,kd),0.),26.)*1.5;
float ar=a+uT*.40+wob(uT,.11,.059,.028)*.7+1.7;float rb=pow(smoothstep(.90,0.,abs(sin(ar*.5))),34.);
c+=vec3(1.,.075,.04)*rb*smoothstep(-.30,.34,y)*1.85;return c;}
void main(){vec2 uv=vec2(vUv.x,1.-vUv.y);vec4 m=texture2D(uM,uv);float c=m.a;vec2 px=1./uX;
float cU=texture2D(uM,uv-vec2(0.,3.6*px.y)).a;float side=clamp(cU-c,0.,1.);if(c<.003&&side<.003)discard;
vec3 N=normalize(m.rgb*2.-1.);N.y=-N.y;vec2 w=uv*vec2(uA,1.);
float n1=sin(w.x*5.5+uT*.031)*cos(w.y*7.-uT*.024);float n2=sin(w.x*2.3-uT*.018)*cos(w.y*3.1+uT*.013);
N=normalize(N+vec3(n1*.0075+n2*.0045,n2*.006+n1*.003,0.));
vec3 P=vec3((uv-.5)*vec2(uA,1.)*4.2,0.);vec3 V=normalize(vec3(0.,.35,2.05)-P);vec3 R=reflect(-V,N);
float pt=.30+wob(uT,.085,.043,.021)*.03+uP.y*.10;float yw=uP.x*.22;
mat3 tl=mat3(1.,0.,0.,0.,cos(pt),-sin(pt),0.,sin(pt),cos(pt));mat3 ym=mat3(cos(yw),0.,sin(yw),0.,1.,0.,-sin(yw),0.,cos(yw));
vec3 col=room(normalize(ym*tl*R));col+=pow(1.-clamp(dot(N,V),0.,1.),4.)*.22;col*=vec3(1.,.995,.985);
vec2 lp=(uv-uL)*vec2(uA,1.);float fl=exp(-dot(lp,lp)*5.);vec3 Ld=normalize(vec3(-lp*1.7,.85));
float sp=pow(max(dot(N,Ld),0.),24.);col+=uLc*(sp*1.25+fl*.28)*uLs*c;
vec3 wall=room(normalize(vec3(0.,-.75,.66)))*.55+vec3(.02);col=mix(wall,col,c);float al=max(c,side);gl_FragColor=vec4(col*al,al);}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return fail();
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const U = n => gl.getUniformLocation(pr, n);
  const img = new Image(); img.onerror = fail;
  img.onload = () => {
    const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    gl.uniform1i(U('uM'), 0); gl.uniform2f(U('uX'), img.width, img.height); gl.uniform1f(U('uA'), img.width / img.height);
    cv.style.aspectRatio = img.width + ' / ' + img.height;
    const size = () => { const d = Math.min(devicePixelRatio || 1, small() ? 1.6 : 2), w = cv.clientWidth; if (!w) return;
      cv.width = Math.round(w * d); cv.height = Math.round(w * img.height / img.width * d); gl.viewport(0, 0, cv.width, cv.height); };
    addEventListener('resize', size); try { new ResizeObserver(size).observe(cv); } catch (e) {} (function tr() { if (!cv.clientWidth) return requestAnimationFrame(tr); size(); })();
    let vis = true, raf = 0, px = 0, py = 0, lx = .5, ly = .5, ls = 0, touchT = 0; const t0 = performance.now();
    cv.addEventListener('pointerdown', () => touchT = performance.now());
    cv.addEventListener('pointermove', () => touchT = performance.now());
    const draw = t => { const tx2 = fine ? (M.x / innerWidth - .5) * 2 : Math.sin(t * .4) * .4, ty2 = fine ? (M.y / innerHeight - .5) * 2 : 0;
      px += (tx2 - px) * .06; py += (ty2 - py) * .06; gl.uniform2f(U('uP'), px, py);
      const rc = cv.getBoundingClientRect(); if (!rc.width || !rc.height) return;
      const ux = (M.x - rc.left) / rc.width, uy = (M.y - rc.top) / rc.height;
      const near = ux > -.08 && ux < 1.08 && uy > -.35 && uy < 1.35 && (fine || performance.now() - touchT < 1600);
      lx += (ux - lx) * .14; ly += (uy - ly) * .14; ls += ((near ? 1 : 0) - ls) * .06;
      if (!isFinite(lx) || !isFinite(ly) || !isFinite(ls)) { lx = .5; ly = .5; ls = 0; } if (!isFinite(px) || !isFinite(py)) { px = 0; py = 0; }
      gl.uniform2f(U('uL'), lx, ly); gl.uniform1f(U('uLs'), ls); gl.uniform3fv(U('uLc'), [1, .95, .88]);
      gl.uniform1f(U('uT'), t); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    const frame = () => { raf = 0; if (!vis) return; draw((performance.now() - t0) / 1000 * 1.3); cv.__last = performance.now(); raf = requestAnimationFrame(frame); };
    cv.__kick = () => { vis = true; if (!calm && !raf) raf = requestAnimationFrame(frame); if (calm) draw(6); };
    new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis && !calm && !raf) raf = requestAnimationFrame(frame); }).observe(cv);
    calm ? draw(6) : (raf = requestAnimationFrame(frame));
  };
  img.src = url;
}

/* ---------- cursor, magnetic buttons, tilt + spotlight cards ---------- */
if (fine && !calm) {
  const c = $('.cur'), r = $('.cur-r'); let rx = M.x, ry = M.y;
  (function f() { rx += (M.x - rx) * .17; ry += (M.y - ry) * .17; c.style.transform = `translate(${M.x}px,${M.y}px)`; r.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(f); })();
  document.addEventListener('pointerover', e => { const t = e.target.closest('[data-cur]'); r.classList.toggle('big', !!t); $('b', r).textContent = t ? t.dataset.cur : ''; });
  document.addEventListener('pointermove', e => {
    const cd = e.target.closest('.card,.nn'); if (cd) { const b = cd.getBoundingClientRect(); cd.style.setProperty('--x', e.clientX - b.left + 'px'); cd.style.setProperty('--y', e.clientY - b.top + 'px'); }
  });
} else $$('.cur,.cur-r').forEach(e => e.remove());

/* ---------- nav ---------- */
const burger = $('.burger');
burger.addEventListener('click', () => { const o = document.body.classList.toggle('mopen'); burger.setAttribute('aria-expanded', o); document.body.classList.toggle('lock', o); });
$$('.mnav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('mopen', 'lock'); burger.setAttribute('aria-expanded', false); }));
addEventListener('keydown', e => { if (e.key === 'Escape') { document.body.classList.remove('mopen', 'lock'); burger.setAttribute('aria-expanded', false); } });
const nav = $('.nav'), prog = $('.prog'), totop = $('.totop'); let lastY = 0;
totop.addEventListener('click', () => scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }));

/* ---------- journey ---------- */
function journey(v) {
  const jr = $('.jr', v); if (!jr) return;
  const items = $$('.ti', jr), big = $('.yr-big', jr), title = $('.yr-t', jr), rail = $$('.yr-rail button', jr);
  const setYear = y => { big.classList.toggle('now', !/^\d+$/.test(y)); if (!/^\d+$/.test(y)) return; const ds = String(y).padStart(4, '0').split(''); $$('.s', big).forEach((s, k) => { s.style.transform = `translateY(${-(10 + Number(ds[k]))}em)`; }); };
  rail.forEach((b, k) => b.addEventListener('click', () => items[k].scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' })));
  let cur = -1;
  jr._upd = () => {
    const line = $('.tl', jr), r = line.getBoundingClientRect();
    line.style.setProperty('--tl', Math.min(1, Math.max(0, (innerHeight * .55 - r.top) / r.height)).toFixed(4));
    let k = 0; items.forEach((t, i) => { const lit = t.getBoundingClientRect().top < innerHeight * .55; t.classList.toggle('lit', lit); if (lit) k = i; });
    if (k !== cur) { cur = k; const it = items[k]; setYear(it.dataset.y); title.textContent = $('h3', it).textContent; title.classList.toggle('m', it.classList.contains('m'));
      items.forEach((t, i) => t.classList.toggle('cur', i === k)); rail.forEach((b, i) => { b.classList.toggle('on', i === k); b.classList.toggle('done', i < k); }); }
  };
}

function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  nav.classList.toggle('solid', y > 30);
  if (!document.body.classList.contains('menu-open') && !document.body.classList.contains('lock')) { if (innerWidth > 820 && performance.now() > (window.__noTuckUntil || 0) && y > (window.__ly || 0) + 12 && y > 900) nav.classList.add('tuck'); else if (y < (window.__ly || 0) - 4 || y < 120) nav.classList.remove('tuck'); }
  window.__ly = y; if (window.__spy) window.__spy(); totop.classList.toggle('on', y > innerHeight * 1.4);
  lastY = y;
  const v = $('[data-view].show'); if (!v) return;
  const tl = $('.tl', v);
  if (tl) { const r = tl.getBoundingClientRect(); tl.style.setProperty('--tl', Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height)).toFixed(4));
    $$('.ti', tl).forEach(t => t.classList.toggle('lit', t.getBoundingClientRect().top < innerHeight * .6)); }
  $$('[data-par]', v).forEach(el => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    el.style.transform = `translate3d(0,${(r.top + r.height / 2 - innerHeight / 2) / innerHeight * el.dataset.par}px,0) scale(1.08)`; });
}
addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });

/* ---------- clients: sector tabs that rotate on their own ---------- */
function clients(v) {
  const box = $('.clients', v); if (!box) return;
  const tabs = $$('.tab', box), grids = $$('.cgrid', box), btn = $('.cl-foot button', box); let i = 0, held = false, hover = false, timer;
  const CYC = 6000; box.style.setProperty('--cyc', CYC + 'ms');
  const show = n => { i = n; tabs.forEach((t, k) => { t.classList.toggle('on', k === n); t.setAttribute('aria-selected', k === n); const ii = $('i', t); ii.style.animation = 'none'; ii.offsetHeight; ii.style.animation = ''; });
    grids.forEach((g, k) => { g.hidden = k !== n; g.classList.remove('show'); }); requestAnimationFrame(() => requestAnimationFrame(() => grids[n].classList.add('show'))); };
  const tick = () => { clearTimeout(timer); if (!held && !calm) timer = setTimeout(() => { if (!hover) show((i + 1) % tabs.length); tick(); }, CYC); };
  tabs.forEach((t, k) => t.addEventListener('click', () => { held = true; box.classList.add('hold'); btn.textContent = 'Resume rotation'; show(k); }));
  grids.forEach(g => { g.addEventListener('mouseenter', () => hover = true); g.addEventListener('mouseleave', () => hover = false); });
  btn.addEventListener('click', () => { held = !held; box.classList.toggle('hold', held); btn.textContent = held ? 'Resume rotation' : 'Pause rotation'; tick(); });
  new IntersectionObserver(e => { if (e[0].isIntersecting) { show(i); tick(); } else clearTimeout(timer); }, { threshold: .3 }).observe(box);
}

/* ---------- gallery ---------- */
$$('.gal-ctl button').forEach(b => b.addEventListener('click', () => { const s = b.closest('section'), p = s.classList.toggle('paused'); b.textContent = p ? 'Play gallery' : 'Pause gallery'; }));
(() => {
  const lb = $('div.lb'), im = $('img', lb), cap = $('.cap', lb); let L = [], i = 0, last;
  if (lb && lb.parentElement !== document.body) document.body.appendChild(lb);  // must live outside the page views, or it is hidden on company pages
  const show = () => { im.src = L[i].dataset.full; im.alt = L[i].dataset.cap; cap.textContent = L[i].dataset.cap + '  ·  ' + (i + 1) + ' / ' + L.length; };
  const open = g => { last = g; if (g.classList.contains('shot')) { $$('.shot', g.parentElement).forEach(s => { if (!s.dataset.full) { const im = $('img', s); s.dataset.full = im.src; s.dataset.cap = ($('.cap', s) || {}).textContent || im.alt; } }); L = $$('.shot', g.parentElement); } else L = $$('.gm .g').filter((x, k, a) => a.findIndex(y => y.dataset.full === x.dataset.full) === k); i = L.findIndex(x => x.dataset.full === g.dataset.full); show(); lb.classList.add('on'); document.body.classList.add('lock'); $('.x', lb).focus(); };
  const close = () => { lb.classList.remove('on'); document.body.classList.remove('lock'); last && last.focus(); };
  document.addEventListener('click', e => { const g = e.target.closest('.g,.shot'); if (g) { if (g.classList.contains('shot') && !g.dataset.full) { const im = $('img', g); g.dataset.full = im.src; g.dataset.cap = ($('.cap', g) || {}).textContent || im.alt; } open(g); } });
  document.addEventListener('keydown', e => { const g = e.target.closest && e.target.closest('.g'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(g); } });
  $('.x', lb).onclick = close; lb.addEventListener('click', e => { if (e.target === lb) close(); });
  $('.pv', lb).onclick = () => { i = (i - 1 + L.length) % L.length; show(); }; $('.nx', lb).onclick = () => { i = (i + 1) % L.length; show(); };
  addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') $('.nx', lb).click(); if (e.key === 'ArrowLeft') $('.pv', lb).click(); });
})();




/* whole cards are doors */
document.addEventListener('click', e => { const c = e.target.closest('[data-href]'); if (!c || e.target.closest('a,button')) return; const h = c.dataset.href; if (h.startsWith('#')) location.hash = h; else location.href = h; });
/* DE photo responds to the cursor */
document.addEventListener('pointermove', e => { $$('.vis .ph').forEach(ph => { const b = ph.getBoundingClientRect();
  const inside = e.clientX > b.left - 80 && e.clientX < b.right + 80 && e.clientY > b.top - 80 && e.clientY < b.bottom + 80;
  ph.style.transform = inside ? `perspective(900px) rotateX(${((e.clientY - b.top) / b.height - .5) * -6}deg) rotateY(${((e.clientX - b.left) / b.width - .5) * 8}deg)` : ''; }); }, { passive: true });

/* ---------- client demo A: sector belts, physics-driven ---------- */
function belts(v) {
  const B = $$('.belts .belt', v).map((b, k) => { const t = $('.bl-track', b), tr = $('.bl-t', b); return { b, t, tr, x: 0, sp: 26 + (k % 3) * 9 + k * 2, f: 1, ft: 1, fv: 0, drag: false }; });
  if (!B.length) return;
  B.forEach(o => { o.b.addEventListener('pointerenter', () => o.ft = .18); o.b.addEventListener('pointerleave', () => o.ft = 1);
    let lx = 0, lt = 0;
    o.tr.addEventListener('pointerdown', e => { o.drag = true; o.fv = 0; lx = e.clientX; lt = performance.now(); o.tr.setPointerCapture(e.pointerId); o.tr.classList.add('drag'); });
    o.tr.addEventListener('pointermove', e => { if (!o.drag) return; const now = performance.now(), dx = e.clientX - lx; o.x += dx; o.fv = o.fv * .5 + (dx / Math.max(1, now - lt) * 1000) * .5; lx = e.clientX; lt = now; });
    const up = () => { o.drag = false; o.tr.classList.remove('drag'); }; o.tr.addEventListener('pointerup', up); o.tr.addEventListener('pointercancel', up); });
  let last = performance.now(), vis = false;
  new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) { last = performance.now(); requestAnimationFrame(loop); } }).observe($('.belts', v));
  function loop(t) { if (!vis) return; const dt = Math.min(.05, (t - last) / 1000); last = t;
    B.forEach(o => { o.f += (o.ft - o.f) * .06; const half = o.t.scrollWidth / 2; if (!o.drag) { o.x += o.fv * dt; o.fv *= Math.pow(.05, dt); o.x += o.sp * o.f * dt * (calm ? 0 : 1); } o.x = ((o.x % half) + half) % half;
      o.t.style.transform = `translate3d(${o.x - half}px,0,0)`; o.tr.style.setProperty('--bo', (o.x % 24) + 'px'); });
    requestAnimationFrame(loop); }
}
/* ---------- client demo B: logo wall lit by sector ---------- */
function wall(v) {
  const w = $('.wall', v); if (!w) return; let lock = null;
  $$('.wall-f button', w).forEach(b => {
    b.addEventListener('pointerenter', () => { if (!lock) b.dataset.s ? w.dataset.on = b.dataset.s : delete w.dataset.on; });
    b.addEventListener('pointerleave', () => { if (!lock) delete w.dataset.on; });
    b.addEventListener('click', () => { lock = (lock === b.dataset.s || !b.dataset.s) ? null : b.dataset.s;
      $$('.wall-f button', w).forEach(x => x.classList.toggle('on', x.dataset.s === lock && !!lock)); lock ? w.dataset.on = lock : delete w.dataset.on; });
  });
  $$('.wall-g .c', w).forEach(c => { c.addEventListener('pointerenter', () => { if (!lock) w.dataset.on = c.dataset.s; }); c.addEventListener('pointerleave', () => { if (!lock) delete w.dataset.on; }); });
}
/* ---------- map: outline draws, states fade in, then you can send a line anywhere in India ---------- */
function mapx(v) {
  const m = $('.mapx', v); if (!m) return;
  const svg = $('svg', m), ol = $('.ol', svg), L = ol.getTotalLength(), P2 = new Path2D(ol.getAttribute('d'));
  const ctx = document.createElement('canvas').getContext('2d'); const PX = +m.dataset.px, PY = +m.dataset.py, NS = 'http://www.w3.org/2000/svg';
  ol.style.strokeDasharray = L; ol.style.strokeDashoffset = L;
  $$('.arc.auto', svg).forEach(p => p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
  new IntersectionObserver((e, o) => { if (!e[0].isIntersecting) return; o.disconnect(); m.classList.add('in'); setTimeout(() => { m.classList.add('live');  }, 500); }, { threshold: .25 }).observe(m);
  /* destinations wander: when a delivery light finishes, some routes move to a new point inside India */
  const runs = $$('.rt-run', svg), bases = $$('.rt-base', svg), ends = $$('.end', svg), rings = $$('.ring', svg), FIXED = new Set();
  /* regions of India in map coordinates; picks rotate through them so dots cover the whole country */
  const REG = [[180, 30, 400, 250], [40, 260, 300, 520], [260, 280, 520, 560], [480, 320, 690, 560], [690, 250, 890, 430], [110, 560, 340, 790], [330, 560, 520, 760], [220, 760, 440, 990]];
  let ri = Math.floor(Math.random() * REG.length);
  const safe = (x, y) => [[0, 0], [11, 0], [-11, 0], [0, 11], [0, -11], [8, 8], [-8, -8], [8, -8], [-8, 8]].every(([a, b]) => ctx.isPointInPath(P2, x + a, y + b));
  const pick = (ox, oy, reg) => { const R = REG[reg != null ? reg : (ri = (ri + 1 + Math.floor(Math.random() * 2)) % REG.length)]; let best = null, bd = -1;
    for (let k = 0; k < 90; k++) { const x = R[0] + Math.random() * (R[2] - R[0]), y = R[1] + Math.random() * (R[3] - R[1]);
      if (!safe(x, y) || Math.hypot(x - ox, y - oy) < 90) continue;
      const dmin = Math.min(...ends.map(c => Math.hypot(+c.getAttribute('cx') - x, +c.getAttribute('cy') - y)));
      if (dmin > bd) { bd = dmin; best = [x, y]; } }
    return bd > 36 ? best : null; };
  const moveTo = (i, reg) => { const r = runs[i]; const o = (r.getAttribute('d').match(/M([\d.]+),([\d.]+)/) || []).slice(1).map(Number); const p = pick(o[0], o[1], reg); if (!p) return;
    const [x, y] = p, mx = (o[0] + x) / 2, my = (o[1] + y) / 2, dx = x - o[0], dy = y - o[1], dd = Math.hypot(dx, dy); let nx = -dy / dd, ny = dx / dd; if (ny > 0) { nx = -nx; ny = -ny; }
    const d = `M${o[0]},${o[1]} Q${(mx + nx * dd * .24).toFixed(1)},${(my + ny * dd * .24).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    [bases[i], ends[i]].forEach(el => el.style.opacity = 0);
    setTimeout(() => { bases[i].setAttribute('d', d); r.setAttribute('d', d); ends[i].setAttribute('cx', x.toFixed(1)); ends[i].setAttribute('cy', y.toFixed(1));
      rings[i].setAttribute('cx', x.toFixed(1)); rings[i].setAttribute('cy', y.toFixed(1)); [bases[i], ends[i]].forEach(el => el.style.opacity = ''); }, 700); };
  runs.forEach((r, i) => { if (FIXED.has(i)) return; r.addEventListener('animationiteration', () => { if (Math.random() > .25 || !m.classList.contains('live')) return;
    moveTo(i, null);}); });
  const hint = $('.map-hint', m.parentElement), user = $('.user', svg), cx = $('.cur-x', svg); let dwell;
  const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const inside = p => ctx.isPointInPath(P2, p.x, p.y);
  const send = p => {
    if (!m.classList.contains('in')) return;
    const QX = +m.dataset.qx, QY = +m.dataset.qy, fromP = Math.hypot(p.x - QX, p.y - QY) < Math.hypot(p.x - PX, p.y - PY), OX = fromP ? QX : PX, OY = fromP ? QY : PY;
    const mx2 = (OX + p.x) / 2, my2 = (OY + p.y) / 2, dx2 = p.x - OX, dy2 = p.y - OY, dd = Math.hypot(dx2, dy2) || 1; let nx = -dy2 / dd, ny = dx2 / dd; if (ny > 0) { nx = -nx; ny = -ny; }
    const ccx = mx2 + nx * dd * .24, ccy = my2 + ny * dd * .24;
    const d = `M${OX},${OY} Q${ccx.toFixed(0)},${ccy.toFixed(0)} ${p.x.toFixed(0)},${p.y.toFixed(0)}`, g = document.createElementNS(NS, 'g');
    const mk = (t, at) => { const el = document.createElementNS(NS, t); for (const k in at) el.setAttribute(k, at[k]); g.appendChild(el); return el; };
    mk('path', { d, class: 'u-base' }); const run = mk('path', { d, class: 'u-run' }); user.appendChild(g);
    const L = Math.ceil(run.getTotalLength()); run.style.strokeDasharray = L; run.style.setProperty('--L', L);
    mk('circle', { cx: p.x, cy: p.y, r: 5, class: 'u-end' }); mk('circle', { cx: p.x, cy: p.y, r: 6, class: 'u-ring' });
    const kmT = Math.round(Math.hypot((p.x - OX) * 3.39, (p.y - OY) * 3.33) / 10) * 10;
    if (kmT >= 40) { const tx = mk('text', { x: p.x + (p.x > 700 ? -14 : 14), y: p.y - 12, class: 'u-lbl', 'text-anchor': p.x > 700 ? 'end' : 'start' }); tx.textContent = `≈ ${kmT.toLocaleString('en-IN')} KM`; }
    while (user.children.length > 3) user.firstChild.remove();
    [...user.children].forEach((x, i, arr) => x.style.opacity = i === arr.length - 1 ? 1 : .35);
    const km = Math.round(Math.hypot((p.x - OX) * 3.39, (p.y - OY) * 3.33) / 10) * 10, hubN = fromP ? 'Pune' : 'Chandrapur';
    if (hint) hint.innerHTML = km < 40 ? `You are pointing at <b>${hubN}</b>` : `Roughly <b>${km.toLocaleString('en-IN')} km</b> from ${hubN}, straight line`;
  };
  svg.addEventListener('pointermove', e => { const p = pt(e), ins = inside(p); m.classList.toggle('over', ins);
    if (ins) { cx.setAttribute('cx', p.x); cx.setAttribute('cy', p.y); clearTimeout(dwell); if (fine) dwell = setTimeout(() => send(p), 380); } });
  svg.addEventListener('pointerleave', () => { m.classList.remove('over'); clearTimeout(dwell); });
  svg.addEventListener('click', e => { const p = pt(e); if (inside(p)) { clearTimeout(dwell); send(p); } });
  /* live deliveries: each draws its arc from the nearest unit, lands with a pulse, holds, then fades */
  const POOL = JSON.parse(m.dataset.pool || '[]'), HX = +m.dataset.qx, HY = +m.dataset.qy, busy = new Set();
  const lane = document.createElementNS(NS, 'g'); lane.setAttribute('class', 'lane'); svg.insertBefore(lane, user);
  const arc = (ox, oy, x, y) => { const mx = (ox + x) / 2, my = (oy + y) / 2, dx = x - ox, dy = y - oy, dd = Math.hypot(dx, dy); let nx = -dy / dd, ny = dx / dd; if (ny > 0) { nx = -nx; ny = -ny; }
    return `M${ox},${oy} Q${(mx + nx * dd * .22).toFixed(1)},${(my + ny * dd * .22).toFixed(1)} ${x},${y}`; };
  const zone = ([x, y]) => Math.min(2, Math.floor(x / 290)) + 3 * Math.min(1, Math.floor(y / 470));
  const active = [0, 0, 0, 0, 0, 0]; let tick = 0;
  const deliver = () => { if (!m.classList.contains('live') || lane.childElementCount >= 10) return;
    const pune = [1, 3, 5, 7].includes(tick++ % 9), ox = pune ? HX : PX, oy = pune ? HY : PY;   // Pune gets 4 of every 9 (about 80% of Chandrapur)
    const free = POOL.map((p, i) => i).filter(i => !busy.has(i) && Math.hypot(POOL[i][0] - ox, POOL[i][1] - oy) > 120); if (!free.length) return;
    const lo = Math.min(...free.map(i => active[zone(POOL[i])])), pickFrom = free.filter(i => active[zone(POOL[i])] === lo);
    const i = pickFrom[Math.floor(Math.random() * pickFrom.length)], z = zone(POOL[i]); busy.add(i); active[z]++;
    const [x, y] = POOL[i];
    const g = document.createElementNS(NS, 'g'), mk = (t, at) => { const el = document.createElementNS(NS, t); for (const k in at) el.setAttribute(k, at[k]); g.appendChild(el); return el; };
    const l = mk('path', { d: arc(ox, oy, x, y), class: 'dl-l' + (pune ? ' p' : '') }), dot = mk('circle', { cx: x, cy: y, r: 3.6, class: 'dl-d' }), ring = mk('circle', { cx: x, cy: y, r: 5, class: 'dl-r' }); lane.appendChild(g);
    const L = l.getTotalLength(); l.style.strokeDasharray = L;
    l.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 850, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }).onfinish = () => {
      dot.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.5)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, fill: 'forwards' });
      ring.animate([{ transform: 'scale(.4)', opacity: .9 }, { transform: 'scale(3.6)', opacity: 0 }], { duration: 950, easing: 'ease-out', fill: 'forwards' });
      setTimeout(() => { g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700 + Math.random() * 500, fill: 'forwards' }).onfinish = () => { g.remove(); busy.delete(i); active[z]--; }; }, 900 + Math.random() * 2600); }; };
  let running = false, started = false;
  const loop = () => { if (!running) return; deliver(); setTimeout(loop, 220 + Math.random() * 420); };
  new IntersectionObserver(es => { const on = es[0].isIntersecting && !calm;
    if (on && !running) { running = true; const go = () => { if (!running) return; if (!m.classList.contains('live')) return setTimeout(go, 100);
        if (!started) { started = true; for (let k = 0; k < 5; k++) setTimeout(deliver, k * 140 + Math.random() * 90); } loop(); }; go(); }
    if (!on) running = false; }, { threshold: .1 }).observe(m);
}


/* ---------- count-up: blur while it spins, sharpen, flash when it locks ---------- */
function countUp(el, delay = 0) {
  const to = +el.dataset.to, node = el.firstChild, dur = 2600, fmt = v => Math.round(v).toLocaleString('en-IN');
  if (calm) { node.textContent = fmt(to); return; }
  setTimeout(() => { const t0 = performance.now(); let prev = 0;
    (function f(t) { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4), v = to * e;
      const sp = Math.abs(v - prev) / Math.max(1, to) * 60; prev = v;
      el.style.setProperty('--b', Math.min(2.4, sp * 6).toFixed(2) + 'px'); el.style.setProperty('--ty', (Math.min(1, sp * 4) * -2).toFixed(2) + 'px');
      node.textContent = fmt(k < 1 ? v : to);
      if (k < 1) requestAnimationFrame(f); else { el.style.setProperty('--b', '0px'); el.style.setProperty('--ty', '0px'); el.classList.add('lock'); } })(t0); }, delay);
}
const cuIO = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; cuIO.unobserve(e.target); countUp(e.target, +e.target.dataset.dl || 0); }), { threshold: .5 });

/* ---------- DE inspection loupe ---------- */
function scanner(v) {
  $$('.loupe', v).forEach(w => { const lens = $('.lens', w), bp = w.dataset.bp, Z = 1.9; let x = .5, y = .5, tx = .5, ty = .5, user = 0;
    lens.style.backgroundImage = `url(${bp})`;
    const set = e => { const r = w.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; user = performance.now(); };
    w.addEventListener('pointermove', set); w.addEventListener('pointerdown', set);
    let vis = false; new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) requestAnimationFrame(f); }).observe(w);
    function f(t) { if (!vis) return; if (performance.now() - user > 1600) { tx = .5 + .3 * Math.sin(t * .00031); ty = .5 + .22 * Math.sin(t * .00047 + 1.2); }
      x += (tx - x) * .09; y += (ty - y) * .09; const r = w.getBoundingClientRect(), Ls = r.width * (r.width < 500 ? .42 : .36);
      w.style.setProperty('--ls', Ls + 'px'); w.style.setProperty('--lx', x * r.width + 'px'); w.style.setProperty('--ly', y * r.height + 'px');
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`; lens.style.backgroundPosition = `${-(x * r.width * Z - Ls / 2)}px ${-(y * r.height * Z - Ls / 2)}px`;
      requestAnimationFrame(f); } });
}

/* ---------- FA: telescopic conveyor diagram ---------- */
function tbcDiagram(v) {
  const d = $('.tbcd', v); if (!d) return null; const S = 46, X0 = 40, Y = 104, BH = 54;
  const base = $('.base', d), secs = $$('.sec', d), mdl = $('.mdl', d), belt = $('.belt2', d);
  const dimE = $('.dimE', d), dimC = $('.dimC', d), tE = $('.tE', d), tC = $('.tC', d);
  let cur = { fx: 3, ex: [0, 0, 0] }, raf = 0;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const draw = (fx, exs) => { const bw = fx * S, endC = X0 + bw, exT = exs[2] * 3, endE = endC + exs.reduce((a, b) => a + b, 0) * S / 3 * 3 / 3;
    base.setAttribute('width', bw);
    let right = endC;
    secs.forEach((s, i) => { const seg = exs[i] * S, full = Math.max(exs[i], .001) * S, h = BH - 12 - i * 7;
      right = endC + exs.slice(0, i + 1).reduce((a, b) => a + b, 0) * S;
      const w = Math.max(0, (exs[i] > 0 ? exs[i] : 0) * S - 4);
      s.setAttribute('y', Y + (BH - h) / 2); s.setAttribute('height', h); s.setAttribute('rx', 3);
      s.setAttribute('width', Math.max(w, 0)); s.setAttribute('x', right - w); s.style.opacity = exs[i] > .05 ? 1 : 0; });
    const endAll = right; belt.setAttribute('x2', Math.max(endAll, endC) - 6);
    dimE.setAttribute('d', `M${X0},40 V52 M${X0},46 H${endAll} M${endAll},40 V52`); tE.setAttribute('x', (X0 + endAll) / 2);
    dimC.setAttribute('d', `M${X0},186 V198 M${X0},192 H${endC} M${endC},186 V198`); tC.setAttribute('x', (X0 + endC) / 2); mdl.setAttribute('x', X0 + 22); };
  draw(cur.fx, cur.ex);
  return (fx, ex, name, dur = 1300) => { cancelAnimationFrame(raf); const from = { fx: cur.fx, ex: cur.ex.slice() }, to = ex / 3, t0 = performance.now();
    mdl.textContent = name; tE.textContent = `EXTENDED ${fx + ex} M`; tC.textContent = `${fx} M`;
    $$('[data-s]', d).forEach(n => n.textContent = { fx: fx + ' m', ex: '+ ' + ex + ' m', tot: (fx + ex) + ' m', st: '3' }[n.dataset.s]);
    (function f(t) { const k = calm ? 1 : Math.min(1, (t - t0) / dur);
      const kb = ease(Math.min(1, k / .55)); cur.fx = from.fx + (fx - from.fx) * kb;
      cur.ex = [0, 1, 2].map(i => { const ki = ease(Math.min(1, Math.max(0, (k - .12 - i * .14) / .6))); return from.ex[i] + (to - from.ex[i]) * ki; });
      draw(cur.fx, cur.ex); if (k < 1) raf = requestAnimationFrame(f); })(t0); };
}

/* ---------- before / after ---------- */
function kba(v) { $$('.k-ba', v).forEach(ba => { let d = false, touched = false;
  const setF = f => { f = Math.min(.97, Math.max(.03, f)); ba.style.setProperty('--p', (f * 100).toFixed(2) + '%'); ba.setAttribute('aria-valuenow', Math.round(f * 100)); };
  const setX = x => { const r = ba.getBoundingClientRect(); setF((x - r.left) / r.width); };
  ba.addEventListener('pointerdown', e => { d = touched = true; ba.setPointerCapture(e.pointerId); setX(e.clientX); });
  ba.addEventListener('pointermove', e => { if (d) setX(e.clientX); }); ['pointerup', 'pointercancel'].forEach(t => ba.addEventListener(t, () => d = false));
  ba.addEventListener('keydown', e => { const c = parseFloat(ba.style.getPropertyValue('--p')) / 100 || .5; if (e.key === 'ArrowLeft') { setF(c - .05); e.preventDefault(); } if (e.key === 'ArrowRight') { setF(c + .05); e.preventDefault(); } touched = true; });
  new IntersectionObserver((es, o) => { if (!es[0].isIntersecting || calm) return; o.disconnect(); const t0 = performance.now();
    (function f(t) { if (touched) return; const k = Math.min(1, (t - t0) / 3000), e2 = k < 1 ? Math.sin(k * Math.PI * 2) * .3 * (1 - k) : 0; setF(.5 + e2); if (k < 1) requestAnimationFrame(f); })(t0); }, { threshold: .55 }).observe(ba); }); }

/* ---------- company page components ---------- */
function components(v) {
  $$('.ba', v).forEach(ba => { const after = $('.ba-after', ba), line = $('.ba-line', ba), knob = $('.ba-knob', ba); let d = false;
    const setP = x => { const r = ba.getBoundingClientRect(), p = Math.min(Math.max((x - r.left) / r.width, .04), .96) * 100; after.style.clipPath = `inset(0 0 0 ${p}%)`; line.style.left = p + '%'; knob.style.left = p + '%'; };
    ba.addEventListener('pointerdown', e => { d = true; ba.setPointerCapture(e.pointerId); setP(e.clientX); }); ba.addEventListener('pointermove', e => { if (d || fine) setP(e.clientX); });
    ba.addEventListener('pointerup', () => d = false); ba.addEventListener('pointercancel', () => d = false);
    new IntersectionObserver((es, o) => { if (!es[0].isIntersecting || calm) return; o.disconnect(); const r = ba.getBoundingClientRect(), t0 = performance.now();
      (function f(t) { const k = Math.min(1, (t - t0) / 2600); if (d) return; const p = .5 + Math.sin(k * Math.PI * 2) * .32 * (1 - k * .2) * (k < 1 ? 1 : 0);
        setP(r.left + ba.getBoundingClientRect().width * p + (ba.getBoundingClientRect().left - r.left)); if (k < 1) requestAnimationFrame(f); })(t0); }, { threshold: .6 }).observe(ba); });
  const eff = $('.eff', v); if (eff) new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; $$('.eff-fill', eff).forEach(f => f.style.width = f.dataset.w); o.disconnect(); }, { threshold: .4 }).observe(eff);
  const M2 = $$('.tbc-m', v); if (M2.length) { const fx = $('.tbc-fixed', v), ex = $('.tbc-ext', v), MAX = 18, TD = tbcDiagram(v);
    let auto = true, ai = 0, timer = 0; const stop = () => { auto = false; clearInterval(timer); $('.tbcd', v) && $('.tbcd', v).classList.add('manual'); };
    const set = (m, manual) => { if (manual) stop(); M2.forEach(x => x.classList.toggle('on', x === m)); const f = +m.dataset.fixed, e = +m.dataset.ext;
      if (fx) fx.style.width = (f / MAX * 100) + '%'; if (ex) ex.style.width = (e / MAX * 100) + '%'; if (TD) TD(f, e, m.dataset.name);
      const n = $('#tb-name', v), lf = $('#tb-fixed', v), le = $('#tb-ext', v), lt = $('#tb-total', v);
      if (n) n.textContent = 'TBC ' + m.dataset.name; if (lf) lf.textContent = f + ' m'; if (le) le.textContent = '+ ' + e + ' m'; if (lt) lt.textContent = (f + e) + ' m total reach'; };
    M2.forEach(m => { m.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') set(m, true); }); m.addEventListener('click', () => set(m, true));
      m.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(m, true); } }); });
    const dg = $('.tbcd', v);
    if (dg) { dg.addEventListener('pointerdown', stop);
      new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect(); if (!auto) return;
        set(M2[0]); ai = 0; if (calm) return; timer = setInterval(() => { if (!auto) return; ai = (ai + 1) % M2.length; set(M2[ai]); }, 3400); }, { threshold: .45 }).observe(dg); }
    else set($('.tbc-m.on', v) || M2[M2.length - 1]); }
}

window.__lamp = [1, .95, .88];
/* enquiry builder */
(() => {
  const eq = $('.eq'), box = $('.eq-box', eq); const MAIL = { fe: 'fe@ferrous.co.in', de: 'de@ferrous.co.in', fapl: 'fapl.sales@ferrous.co.in' };
  const NM = { fe: 'Ferrous Engineering', de: 'Deepak Engineering', fapl: 'Ferrous Automations' };
  const NEED = { fe: ['Rotary Air Lock (RAL)', 'Heavy fabrication', 'Precision machining', 'Reconditioning', 'Reclamation', 'Something else'],
    de: ['New critical spares', 'Reconditioning', 'Superconditioning', 'Coal mill components', 'Defence components', 'Something else'],
    fapl: ['Telescopic belt conveyor', 'Help choosing a model', 'Material handling system', 'Service & spares', 'Site visit or demo', 'Something else'] };
  const S = { step: 0, co: null, need: null, f: {} }; let last;
  const SEC = { fe: 'Cement & Steel', de: 'Power & Defence', fapl: 'Automation' }; const TTL = ['Choose a company', 'Your requirement', 'A few details', 'Review & send'];
  const field = (id, l, t = 'input', o = '', ph = '') => t === 'select' ? `<label>${l}<select data-k="${id}">${o}</select></label>` : t === 'ta' ? `<label>${l}<textarea data-k="${id}" placeholder="${ph}">${S.f[id] || ''}</textarea></label>` : `<label>${l}<input data-k="${id}" value="${S.f[id] || ''}" placeholder="${ph}"${id === 'phone' ? ' inputmode="tel"' : ''}></label>`;
  const body = () => `Company: ${NM[S.co]}\nRequirement: ${S.need}\n\nComponent / description:\n${S.f.desc || '-'}\n\nSize / quantity: ${S.f.size || '-'}\nUrgency: ${S.f.urg || 'Routine'}\nPlant & location: ${S.f.plant || '-'}\n\nName: ${S.f.name || '-'}\nPhone: ${S.f.phone || '-'}`;
  const render = () => { const n = S.step; let h = `<div class="hdq"><span>Step ${n + 1} of 4 &middot; ${TTL[n]}</span><button class="x" aria-label="Close">&times;</button></div><div class="stp">${[0, 1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div><div class="bd">`;
    if (n === 0) h += `<h3>Who can help?</h3><p class="s">Pick the company closest to your need.</p><div class="opts cos">${['fe', 'de', 'fapl'].map(k => `<button data-co="${k}"><img src="${window.__A[{ fe: 'lfe', de: 'lde', fapl: 'lfa' }[k]]}" alt="${NM[k]}"><small style="font-family:var(--data);letter-spacing:.16em;color:var(--t4)">${SEC[k]}</small></button>`).join('')}</div></div>`;
    if (n === 1) h += `<h3>What do you need?</h3><p class="s">${NM[S.co]}</p><div class="opts">${NEED[S.co].map(x => `<button data-need="${x}" class="${S.need === x ? 'on' : ''}">${x}</button>`).join('')}</div></div><div class="ft"><button class="btn btn-s" data-go="0">&larr; Back</button><span></span></div>`;
    if (n === 2) h += `<h3>A few details</h3><p class="s">${S.need} &middot; ${NM[S.co]}</p>${field('desc', 'Component or job', 'ta', '', 'What needs making, repairing or supplying?')}<div class="row2">${field('size', 'Size or quantity', 'input', '', 'e.g. 1800 mm, 2 nos')}${field('urg', 'Urgency', 'select', ['Routine', 'Within a month', 'Urgent breakdown'].map(x => `<option ${S.f.urg === x ? 'selected' : ''}>${x}</option>`).join(''))}</div>${field('plant', 'Plant & location', 'input', '', 'Plant name, city')}<div class="row2">${field('name', 'Your name')}${field('phone', 'Phone')}</div></div><div class="ft"><button class="btn btn-s" data-go="1">&larr; Back</button><button class="btn btn-p" data-go="3">Review <span class="ar">&rarr;</span></button></div>`;
    if (n === 3) h += `<h3>Ready to send</h3><p class="s">Opens your email app, addressed to <b style="color:#fff">${MAIL[S.co]}</b>. Attach drawings or photos before sending.</p><div class="sum">${body().replace(/</g, '&lt;')}</div></div><div class="ft"><button class="btn btn-s" data-go="2">&larr; Edit</button><a class="btn btn-p" href="mailto:${MAIL[S.co]}?subject=${encodeURIComponent('Enquiry: ' + S.need + (S.f.plant ? ' | ' + S.f.plant : ''))}&body=${encodeURIComponent(body())}">Open Email <span class="ar">&rarr;</span></a></div>`;
    box.innerHTML = h; const f = box.querySelector('.bd button,.bd input,.bd textarea') || box.querySelector('.x'); f && f.focus({ preventScroll: true }); };
  const open = () => { last = document.activeElement; S.step = S.co ? 1 : 0; render(); eq.classList.add('open'); document.body.classList.add('lock'); };
  const close = () => { eq.classList.remove('open'); document.body.classList.remove('lock'); last && last.focus && last.focus(); };
  box.addEventListener('input', e => { const k = e.target.dataset.k; if (k) S.f[k] = e.target.value; });
  box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('x')) return close(); if (b.dataset.co) { S.co = b.dataset.co; S.step = 1; render(); }
    else if (b.dataset.need) { S.need = b.dataset.need; S.step = 2; render(); } else if (b.dataset.go) { $$('[data-k]', box).forEach(i => S.f[i.dataset.k] = i.value); S.step = +b.dataset.go; render(); } });
  eq.addEventListener('click', e => { if (e.target === eq) close(); }); addEventListener('keydown', e => { if (e.key === 'Escape' && eq.classList.contains('open')) close(); });
  document.addEventListener('click', e => { const a = e.target.closest('a,button'); if (!a || a.closest('.eq')) return;
    if (a.hasAttribute('data-eq') || /quote/i.test(a.textContent) || (a.getAttribute('href') || '').includes('Quote%20Request')) { e.preventDefault(); e.stopImmediatePropagation();
      const v = $('[data-view].show').dataset.view; S.co = ['fe', 'de', 'fapl'].includes(v) ? v : null; open(); } }, true);
})();

/* ---------- menu: an indicator slides to the hovered link and rests on the section you are in ---------- */
(() => { const menu = $('.nav .menu'); if (!menu) return; const ind = document.createElement('i'); ind.className = 'menu-ind'; menu.appendChild(ind);
  const links = $$('a.ln', menu); let cur = null, tgt = null, until = 0, raf = 0;
  const place = () => { if (!tgt) { ind.style.opacity = 0; return; } const r = tgt.getBoundingClientRect(), mr = menu.getBoundingClientRect();
    ind.style.transform = `translate(${(r.left - mr.left).toFixed(1)}px,-50%)`; ind.style.width = r.width + 'px'; ind.style.opacity = 1; };
  const follow = () => { place(); if (performance.now() < until) raf = requestAnimationFrame(follow); else raf = 0; };
  const aim = (a, ms = 700) => { tgt = a; until = performance.now() + ms; if (!raf) raf = requestAnimationFrame(follow); };
  links.forEach(a => a.addEventListener('pointerenter', () => aim(a)));
  $$('.chip', menu).forEach(c => c.addEventListener('pointerenter', () => aim(null)));
  menu.addEventListener('pointerleave', () => aim(cur, 900));
  try { new ResizeObserver(() => aim(tgt, 120)).observe(menu); } catch (_) {}
  addEventListener('resize', () => aim(tgt, 120));
  const ids = ['group', 'clients', 'journey', 'infrastructure', 'photos', 'contact'];
  window.__spy = () => { const v = $('[data-view].show'); if (!v || v.dataset.view !== 'main') { if (cur) { cur.classList.remove('on'); cur = null; if (!menu.matches(':hover')) aim(null); } return; }
    let best = null; ids.forEach(id => { const s = $('#' + id, v); if (s && s.getBoundingClientRect().top < innerHeight * .4) best = id; });
    const a = best ? links.find(l => (l.getAttribute('href') || '').endsWith('#' + best)) : null;
    if (a !== cur) { cur && cur.classList.remove('on'); cur = a; cur && cur.classList.add('on'); if (!menu.matches(':hover')) aim(cur); } };
})();

/* ---------- section jumps: scroll there, then keep correcting until the page has settled (lazy images shift layout) ---------- */
function goTo(t, smooth) {
  window.__noTuckUntil = performance.now() + 2800; nav && nav.classList.remove('tuck');   // a jump you asked for keeps the bar visible
  const off = () => (parseFloat(getComputedStyle(t).scrollMarginTop) || 86);
  scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + scrollY - off()), behavior: smooth && !calm ? 'smooth' : 'auto' });
  const t0 = performance.now(); let lastMove = performance.now(), prev = scrollY;
  (function settle() { const now = performance.now(); if (scrollY !== prev) { prev = scrollY; lastMove = now; }
    if (now - lastMove > 140) { const d = t.getBoundingClientRect().top - off(); if (Math.abs(d) > 4) scrollTo({ top: scrollY + d, behavior: 'auto' }); }
    if (now - t0 < 2400) requestAnimationFrame(settle); })();
}
(() => { const h = location.hash; if (!h || !/^#[\w-]+$/.test(h)) return;   // arriving with a section in the URL: jump as soon as the page is laid out, re-settle after images load
  const go = () => { const t = document.getElementById(h.slice(1)); if (t && !t.matches('[data-view]')) goTo(t, false); };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(go)); else requestAnimationFrame(go);
  addEventListener('load', () => setTimeout(go, 30)); })();

/* ---------- job pages: sticky Apply bar on phones steps aside at the form ---------- */
function jobSticky(v) { const s = $('.j-sticky', v), ap = $('#apply', v), hero = $('.cr-hero .acts', v); if (!s || !ap || s.dataset.on) return; s.dataset.on = 1;
  let atForm = false, heroBtns = true; const upd = () => s.classList.toggle('away', atForm || heroBtns); s.classList.add('away');
  new IntersectionObserver(es => { atForm = es[0].isIntersecting; upd(); }, { rootMargin: '0px 0px -30% 0px' }).observe(ap);
  if (hero) new IntersectionObserver(es => { heroBtns = es[0].isIntersecting || es[0].boundingClientRect.top > 0; upd(); }).observe(hero); else { heroBtns = false; upd(); } }

/* ---------- router ---------- */
const booted = {};
/* Tally forms: load only the visible view's form, size it from Tally's own resize messages */
function tallyLoad(view) { $$('iframe[data-tally-src]', view).forEach(f => { if (!f.src || f.src === 'about:blank') { f.src = f.dataset.tallySrc; f.addEventListener('load', () => f.closest('.fshell').classList.add('ok'), { once: true }); } }); }
addEventListener('message', e => { if (!/tally\.so$/.test(new URL(e.origin).hostname)) return; let d = e.data; try { d = typeof d === 'string' ? JSON.parse(d) : d; } catch (_) { return; }
  if (d && d.event === 'Tally.FormResized' && d.payload && d.payload.height) $$('iframe[data-tally-src]').forEach(f => { if (f.contentWindow === e.source) { f.style.height = d.payload.height + 'px'; f.closest('.fshell').classList.add('ok'); } }); });
function route() {
  const key = (location.hash.match(/^#\/([\w/-]+)/) || [, 'main'])[1].replace(/\/$/, '');
  const all = $$('[data-view]');  // multi-page deploy: each page carries exactly one view
  const view = all.length === 1 ? all[0] : ($(`[data-view="${key}"]`) || $('[data-view="main"]')), changed = !view.classList.contains('show');
  $$('[data-view]').forEach(x => x.classList.toggle('show', x === view));
  $$('.chip').forEach(c => c.classList.toggle('here', c.dataset.co === view.dataset.view));
  if (!booted[view.dataset.view]) {
    booted[view.dataset.view] = 1; arm(view); belts(view); wall(view); mapx(view); scanner(view); components(view); kba(view); $$('.k-spec,.k-edge,.k-cmp', view).forEach(el => io.observe(el)); jobSticky(view); $$('.cu', view).forEach(el => cuIO.observe(el));
    const f = $('.dust', view); if (f) dust(f);
    const hc = $('.tag .hc', view); if (hc) setTimeout(() => countUp(hc), 900);
    const cr = $('#chrome', view); if (cr) chrome(cr, cr.dataset.map, $('.chrome-fb', view));
    view.dataset.chromeBooted = '1';
  }
  $$('.ia', view).forEach(e => { e.style.animation = 'none'; e.offsetHeight; e.style.animation = ''; });
  if (changed) { scrollTo({ top: 0, behavior: 'instant' }); document.title = view.dataset.title; }
  if (changed && view.dataset.chromeBooted && booted.__prev && booted.__prev !== view.dataset.view) {
    const cv0 = $('#chrome', view); if (cv0 && cv0.__kick) { cv0.__kick(); const since = performance.now();
      setTimeout(() => { const gl = cv0.getContext('webgl'); if ((gl && gl.isContextLost()) || !cv0.__last || cv0.__last < since) {
        const nc = cv0.cloneNode(false); nc.style.aspectRatio = cv0.style.aspectRatio; cv0.replaceWith(nc); chrome(nc, nc.dataset.map, $('.chrome-fb', view)); } }, 700); } }
  booted.__prev = view.dataset.view;
  onScroll(); tallyLoad(view); setTimeout(() => dispatchEvent(new Event('resize')), 60);
}
/* page transitions: a feathered ember cover sweeps in from the top-left, the next page reveals toward the bottom-right */
const PT = document.documentElement;
const ptReveal = () => { PT.classList.remove('pt-out'); void PT.offsetWidth; PT.classList.add('pt-in'); setTimeout(() => PT.classList.remove('pt-in'), 430); };
addEventListener('hashchange', () => { if (calm || !/^#\/|^#?$/.test(location.hash)) return route();
  PT.classList.remove('pt-in'); PT.classList.add('pt-out'); setTimeout(() => { route(); ptReveal(); }, 130); });
document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || calm) return;
  if (a.target && a.target !== '_self') return; const u = new URL(a.href, location.href);
  if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search) || /\.(pdf|vcf|zip|png|jpe?g|webp)$/i.test(u.pathname)) return;
  e.preventDefault(); try { sessionStorage.setItem('pt', '1'); } catch (_) {} PT.classList.add('pt-out'); setTimeout(() => { location.href = u.href; }, 70); });
addEventListener('pageshow', e => { if (e.persisted) PT.classList.remove('pt-out'); });
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return; const h = a.getAttribute('href'); if (h.startsWith('#/') || h === '#') return;
  const t = $(`[data-view].show ${h}`);
  e.preventDefault();
  if (!t) { location.hash = '#/'; setTimeout(() => { const t2 = $(`[data-view].show ${h}`); t2 && goTo(t2, false); }, 80); return; }
  goTo(t, true);
});
route();
})();
