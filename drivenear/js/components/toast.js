/* DriveNear — js/components/toast.js */

/* ---------------- TOASTS ---------------- */
function pushToast(msg, kind='success'){
  const id = Date.now()+Math.random();
  state.toasts.push({id, msg, kind});
  renderToasts();
  setTimeout(()=>{ state.toasts = state.toasts.filter(t=>t.id!==id); renderToasts(); }, 3200);
}
function renderToasts(){
  const el = document.getElementById('toast-root');
  if(!el) return;
  el.innerHTML = state.toasts.map(t=>`
    <div class="toast-anim mb-3 flex items-center gap-3 rounded-2xl bg-ink text-white px-4 py-3 shadow-lift min-w-[240px]">
      <span class="text-lg">${t.kind==='success'?'✅':t.kind==='heart'?'❤️':'🔔'}</span>
      <span class="text-sm font-medium">${t.msg}</span>
    </div>`).join('');
}
