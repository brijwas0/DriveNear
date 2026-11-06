/* DriveNear — js/pages/safety.js */

/* =========================================================
   PAGE: SAFETY
   ========================================================= */
function pageSafety(){
  const items = [
    ['🛡️','Identity Verification','Every renter and owner verifies their identity before completing a trip.'],
    ['🚗','Vehicle Verification','Cars are checked for documents, insurance and condition before listing.'],
    ['⭐','User Reviews','Two-way reviews after every trip keep the community accountable.'],
    ['📸','Vehicle Inspection','Photo check-in and check-out helps avoid disputes over condition.'],
    ['💳','Secure Booking','Funds are held securely until the trip is confirmed as started.'],
    ['💬','In-App Communication','Message owners and renters directly without sharing personal numbers.'],
  ];
  return `
  <section class="bg-ink text-white py-20">
    <div class="max-w-4xl mx-auto px-5 text-center">
      <span class="text-4xl">${ICO.shield}</span>
      <h1 class="display text-4xl font-bold mt-5">Safety comes first.</h1>
      <p class="text-white/70 mt-4 max-w-lg mx-auto">From verified identities to secure payments, every layer of DriveNear is designed to protect renters and owners alike.</p>
    </div>
  </section>
  <section class="max-w-6xl mx-auto px-5 lg:px-8 py-16">
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${items.map(([i,t,d])=>`
        <div class="reveal bg-white rounded-2xl border border-line p-7 hover:shadow-card transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-2xl">${i}</div>
          <h3 class="font-semibold text-lg mt-4 display">${t}</h3>
          <p class="text-sm text-muted mt-2">${d}</p>
        </div>`).join('')}
    </div>
  </section>`;
}
