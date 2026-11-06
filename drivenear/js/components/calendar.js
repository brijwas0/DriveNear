/* DriveNear — js/components/calendar.js */

/* ---------------- CALENDAR WIDGET ---------------- */
function calendarWidget(scope){
  const d = state.calMonth;
  const year = d.getFullYear(), month = d.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const monthLabel = d.toLocaleString('en-IN',{month:'long', year:'numeric'});
  let cells = '';
  for(let i=0;i<startDay;i++) cells += `<div></div>`;
  for(let day=1; day<=daysInMonth; day++){
    const key = `${year}-${month}-${day}`;
    const st = state.listCarData.availability[key] || (day%7===0?'booked':day%5===0?'unavailable':'available');
    const color = st==='booked'?'bg-danger-light text-danger':st==='unavailable'?'bg-line text-muted':'bg-brand-light text-brand-ink';
    cells += `<button onclick="toggleCalDay('${key}')" class="h-9 rounded-lg text-xs font-semibold ${color} hover:ring-2 ring-brand/30 transition-all">${day}</button>`;
  }
  return `
  <div class="border border-line rounded-2xl p-4">
    <div class="flex items-center justify-between mb-3">
      <button onclick="calMove(-1)" class="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center">‹</button>
      <span class="font-semibold text-sm display">${monthLabel}</span>
      <button onclick="calMove(1)" class="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center">›</button>
    </div>
    <div class="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted mb-1">${['S','M','T','W','T','F','S'].map(s=>`<span>${s}</span>`).join('')}</div>
    <div class="grid grid-cols-7 gap-1.5">${cells}</div>
    <div class="flex gap-4 mt-4 text-xs">
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-brand-light"></span>Available</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-danger-light"></span>Booked</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-line"></span>Unavailable</span>
    </div>
  </div>`;
}
function calMove(dir){ state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth()+dir, 1); renderApp(); }
function toggleCalDay(key){
  const cur = state.listCarData.availability[key] || 'available';
  const next = cur==='available'?'unavailable':cur==='unavailable'?'booked':'available';
  state.listCarData.availability[key] = next;
  renderApp();
}
