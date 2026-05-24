/* js/gantt-page.js */
markActive('gantt');
updateNavUser();

window.serverData = { phaseStatuses: {} };

const ORIGIN = new Date(2026,4,15);
const END = new Date(2026,7,20);
const SPAN = Math.round((END - ORIGIN) / 86400000);
const today = new Date();

function pct(d) { return (Math.round((d - ORIGIN)/86400000) / SPAN) * 100; }

const wrap = document.getElementById('gantt-wrap');

const months = [
  {label:'May', start:0, days:17},
  {label:'June', start:17, days:30},
  {label:'July', start:47, days:31},
  {label:'August', start:78, days:20},
];

const axisRow = document.createElement('div');
axisRow.style.cssText = 'display:flex;margin-left:200px;margin-bottom:6px;min-width:500px;';
months.forEach(m => {
  const el = document.createElement('div');
  el.className = 'month-lbl';
  el.style.cssText = `flex:${m.days};`;
  el.textContent = m.label;
  axisRow.appendChild(el);
});
wrap.appendChild(axisRow);

PHASES.forEach(p => {
  const row = document.createElement('div');
  row.className = 'phase-row';

  const lbl = document.createElement('div');
  lbl.className = 'phase-lbl';
  lbl.textContent = p.label;

  const track = document.createElement('div');
  track.className = 'track';

  months.forEach(m => {
    const gl = document.createElement('div');
    gl.className = 'grid-line';
    gl.style.left = pct(new Date(ORIGIN.getTime() + m.start*86400000)) + '%';
    track.appendChild(gl);
  });

  const left = pct(p.start);
  const width = pct(p.end) - left;

  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.style.cssText = `left:${left}%;width:${width}%;background:${p.bg};border:1px solid ${p.border};`;

  const ds = document.createElement('span');
  ds.className = 'bar-date';
  ds.style.color = p.text;
  ds.textContent = fmtShort(p.start);

  const de = document.createElement('span');
  de.className = 'bar-date';
  de.style.color = p.text;
  de.textContent = fmtShort(p.end);

  bar.appendChild(ds); bar.appendChild(de);

  if (today >= p.start && today < p.end) {
    const todayLine = document.createElement('div');
    const tpct = ((today - p.start)/(p.end - p.start))*100;
    todayLine.style.cssText = `position:absolute;top:0;bottom:0;left:${tpct}%;width:2px;background:${p.border};opacity:0.5;border-radius:1px;`;
    bar.appendChild(todayLine);
  }

  track.appendChild(bar);
  row.appendChild(lbl);
  row.appendChild(track);
  wrap.appendChild(row);
});

const mrow = document.createElement('div');
mrow.className = 'meeting-row';
const mlbl = document.createElement('div');
mlbl.className = 'phase-lbl';
mlbl.style.cssText = 'width:200px;min-width:200px;font-size:12px;color:var(--text-2);text-align:right;padding-right:16px;font-style:italic;';
mlbl.textContent = 'Advising sessions';
const mtrack = document.createElement('div');
mtrack.className = 'meeting-track';

const bl = document.createElement('div');
bl.className = 'baseline';
mtrack.appendChild(bl);

MEETINGS.forEach(mt => {
  const wrap2 = document.createElement('div');
  wrap2.className = 'meet-wrap';
  wrap2.style.left = pct(mt) + '%';
  const diamond = document.createElement('div');
  diamond.className = 'meet-diamond';
  const lbl2 = document.createElement('div');
  lbl2.className = 'meet-date-lbl';
  lbl2.textContent = fmtShort(mt);
  wrap2.appendChild(diamond);
  wrap2.appendChild(lbl2);
  mtrack.appendChild(wrap2);
});

mrow.appendChild(mlbl);
mrow.appendChild(mtrack);
wrap.appendChild(mrow);

const todayPct = Math.max(0, Math.min(100, pct(today)));
const tline = document.createElement('div');
tline.style.cssText = `position:absolute;top:0;bottom:0;left:calc(200px + ${todayPct}%);width:1.5px;background:#C8391A;opacity:0.4;pointer-events:none;`;
wrap.style.position = 'relative';
wrap.appendChild(tline);

const legendRow = document.createElement('div');
legendRow.className = 'legend-row';
legendRow.style.marginTop = '1.5rem';
PHASES.forEach(p => {
  const item = document.createElement('div');
  item.className = 'leg-item';
  const swatch = document.createElement('div');
  swatch.className = 'leg-swatch';
  swatch.style.background = p.border;
  item.appendChild(swatch);
  item.appendChild(document.createTextNode(p.label));
  legendRow.appendChild(item);
});
const mleg = document.createElement('div');
mleg.className = 'leg-item';
const mdiamond = document.createElement('div');
mdiamond.style.cssText = 'width:10px;height:10px;background:#C8391A;border-radius:2px;transform:rotate(45deg);flex-shrink:0';
mleg.appendChild(mdiamond);
mleg.appendChild(document.createTextNode('Advising session'));
legendRow.appendChild(mleg);
wrap.appendChild(legendRow);

const progressList = document.getElementById('progress-list');
function renderPhases() {
  let cpName = 'None';
  let completedCount = 0;
  progressList.replaceChildren();
  
  PHASES.forEach((p, i) => {
    const status = window.serverData.phaseStatuses[i];
    if (status === 'completed') completedCount++;
    if (status === 'pending' || status === 'requested' || !status) {
      if (cpName === 'None') cpName = p.label;
    }
    
    let pctVal = status === 'completed' ? 100 : (status === 'requested' ? 90 : 0);
    const row = document.createElement('div');
    row.className = 'progress-row';
    
    const label = document.createElement('div');
    label.className = 'progress-label';
    label.textContent = p.label;
    
    const bg = document.createElement('div');
    bg.className = 'progress-bar-bg';
    const fill = document.createElement('div');
    fill.className = 'progress-bar-fill';
    fill.style.width = pctVal + '%';
    fill.style.background = p.border;
    bg.appendChild(fill);
    
    const pctTxt = document.createElement('div');
    pctTxt.className = 'progress-pct';
    pctTxt.textContent = pctVal + '%';
    
    row.appendChild(label);
    row.appendChild(bg);
    row.appendChild(pctTxt);
    progressList.appendChild(row);
  });
  
  document.getElementById('cur-phase-name').textContent = completedCount === PHASES.length ? 'All Complete' : cpName;
  document.getElementById('pct-done').textContent = Math.round((completedCount / PHASES.length) * 100) + '%';
}

document.addEventListener('DOMContentLoaded', async () => {
  const statuses = await dbGetPhaseStatuses();
  window.serverData = { phaseStatuses: statuses };
  renderPhases();
  subscribeToPhaseStatuses(() => {
    dbGetPhaseStatuses().then((s) => {
      window.serverData = { phaseStatuses: s };
      renderPhases();
    });
  });
});