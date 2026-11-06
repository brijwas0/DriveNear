/* DriveNear — js/pages/messages.js */

/* =========================================================
   MESSAGES
   ========================================================= */
let typingShown=false;
function pageMessages(){
  const conv = CONVERSATIONS.find(c=>c.id===state.chatOpenId) || CONVERSATIONS[0];
  if(!conv) return emptyState('💬','No messages yet','Conversations with hosts and renters will appear here once you book or list a car.','Browse cars','#/cars');
  return `
  <section class="max-w-6xl mx-auto px-0 lg:px-8 py-0 lg:py-8 pb-20 lg:pb-8">
    <div class="grid lg:grid-cols-[320px_1fr] border border-line lg:rounded-3xl overflow-hidden bg-white h-[calc(100vh-64px)] lg:h-[640px]">
      <div class="${state.chatOpenId?'hidden lg:block':''} border-r border-line overflow-y-auto">
        <div class="px-4 py-4 border-b border-line font-bold display">Messages</div>
        ${CONVERSATIONS.map(c=>`
          <button onclick="openChat('${c.id}')" class="w-full flex items-center gap-3 px-4 py-3 border-b border-line/60 hover:bg-sand text-left ${c.id===state.chatOpenId?'bg-sand':''}">
            <div class="relative"><img src="${c.avatar}" class="w-11 h-11 rounded-full object-cover">${c.online?`<span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-brand border-2 border-white"></span>`:''}</div>
            <div class="flex-1 min-w-0"><div class="flex justify-between"><p class="text-sm font-semibold truncate">${esc(c.name)}</p><span class="text-[10px] text-muted">${c.time}</span></div>
            <p class="text-xs text-muted truncate">${c.last}</p></div>
          </button>`).join('')}
      </div>
      <div class="flex flex-col">
        <div class="px-4 py-3 border-b border-line flex items-center gap-3">
          <button class="lg:hidden" onclick="closeChat()">←</button>
          <img src="${conv.avatar}" class="w-9 h-9 rounded-full object-cover">
          <div><p class="text-sm font-semibold">${conv.name}</p><p class="text-[11px] text-muted">${conv.online?'Online now':'Offline'} · ${conv.car}</p></div>
        </div>
        <div id="chat-scroll" class="flex-1 overflow-y-auto p-4 space-y-3 bg-sand/40">
          ${conv.messages.map(m=>`
            <div class="flex ${m.from==='me'?'justify-end':'justify-start'}">
              <div class="max-w-[75%] ${m.from==='me'?'bg-brand text-white rounded-2xl rounded-br-sm':'bg-white border border-line rounded-2xl rounded-bl-sm'} px-4 py-2.5">
                <p class="text-sm">${esc(m.text)}</p><p class="text-[10px] mt-1 ${m.from==='me'?'text-white/70':'text-muted'}">${m.time}</p>
              </div>
            </div>`).join('')}
          ${typingShown?`<div class="flex gap-1 bg-white border border-line rounded-2xl w-fit px-4 py-3"><span class="w-2 h-2 rounded-full bg-muted typing-dot"></span><span class="w-2 h-2 rounded-full bg-muted typing-dot"></span><span class="w-2 h-2 rounded-full bg-muted typing-dot"></span></div>`:''}
        </div>
        <div class="p-3 border-t border-line flex items-center gap-2">
          <input id="chat-input" placeholder="Type a message…" class="flex-1 border border-line rounded-full px-4 py-2.5 text-sm outline-none" onkeydown="if(event.key==='Enter') sendChat()">
          <button onclick="sendChat()" class="btn btn-primary w-10 h-10 rounded-full flex items-center justify-center">${ICO.arrowR}</button>
        </div>
      </div>
    </div>
  </section>`;
}
function openChat(id){ state.chatOpenId=id; renderApp(); }
function closeChat(){ state.chatOpenId=null; renderApp(); }
function sendChat(){
  const input = document.getElementById('chat-input');
  if(!input || !input.value.trim()) return;
  const conv = CONVERSATIONS.find(c=>c.id===state.chatOpenId);
  if(!conv) return;
  conv.messages.push({from:'me', text: input.value.trim(), time:'Now'});
  conv.last = input.value.trim();
  renderApp();
  typingShown = true; renderApp();
  setTimeout(()=>{
    typingShown = false;
    conv.messages.push({from:'them', text:'Got it, thanks for letting me know!', time:'Now'});
    conv.last = 'Got it, thanks for letting me know!';
    renderApp();
  }, 1600);
}
