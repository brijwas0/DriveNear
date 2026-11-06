/* DriveNear — js/components/footer.js */

/* ---------------- FOOTER ---------------- */
function footer(){
  return `
  <footer class="bg-ink text-white mt-24">
    <div class="max-w-7xl mx-auto px-5 lg:px-8 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
      <div class="col-span-2">
        <div class="flex items-center gap-2 mb-4">
          <span class="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center display font-bold">D</span>
          <span class="display text-lg font-bold">DriveNear</span>
        </div>
        <p class="text-sm text-white/60 max-w-xs">India's peer-to-peer car rental marketplace. Rent from people nearby, or earn from your own car.</p>
        <div class="flex gap-3 mt-5">
          ${['𝕏','in','ⓕ','◎'].map(s=>`<span class="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-sm hover:bg-white/10 cursor-pointer transition-colors">${s}</span>`).join('')}
        </div>
      </div>
      ${[
        ['Company',[{t:'About',h:'#'},{t:'Careers',h:'#'},{t:'Contact',h:'#'},{t:'Admin Portal',h:'#/admin'}]],
        ['Discover',[{t:'Find Cars',h:'#/cars'},{t:'List Your Car',h:'#/list-your-car'},{t:'Safety',h:'#/safety'}]],
        ['Support',[{t:'Help Center',h:'#/safety'},{t:'Safety Standards',h:'#/safety'},{t:'Cancellation',h:'#'}]],
        ['Legal',[{t:'Terms of Service',h:'#'},{t:'Privacy Policy',h:'#'},{t:'Insurance Policies',h:'#'}]],
      ].map(([h,items])=>`
        <div>
          <h4 class="text-sm font-semibold mb-4 text-white/90">${h}</h4>
          <ul class="space-y-2.5">${items.map(i=>`<li><a href="${i.h}" class="text-sm text-white/60 hover:text-white transition-colors">${i.t}</a></li>`).join('')}</ul>
        </div>`).join('')}
    </div>
    <div class="border-t border-white/10 py-6 text-center text-xs text-white/40">© 2026 DriveNear. All rights reserved. Prices shown in INR (₹).</div>
  </footer>`;
}
