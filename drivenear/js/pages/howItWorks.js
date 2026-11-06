/* DriveNear — js/pages/howItWorks.js */

/* =========================================================
   PAGE: HOW IT WORKS
   ========================================================= */
function pageHowItWorks(){
  const renters = [['Find a car','Search cars near your location and compare prices.'],['Choose your dates','Pick your rental window down to the hour.'],['Book','Confirm your trip with a secure demo checkout.'],['Pick up','Meet the owner and inspect the car together.'],['Drive','Enjoy the trip — support is available 24/7.'],['Return','Drop the car back and leave a review.']];
  const owners = [['List your car','Add details, photos and set your price.'],['Set availability','Choose the dates your car can be rented.'],['Accept bookings','Review requests and confirm the ones you like.'],['Hand over the car','Meet the renter and complete a quick handover.'],['Earn money','Get paid after every completed trip.']];
  const timeline = (items)=>items.map(([t,d],i)=>`
    <div class="flex gap-5 reveal">
      <div class="flex flex-col items-center">
        <span class="num-badge w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm display">${String(i+1).padStart(2,'0')}</span>
        ${i<items.length-1?'<span class="w-px flex-1 bg-line my-2"></span>':''}
      </div>
      <div class="pb-10">
        <h4 class="font-semibold text-lg display">${t}</h4>
        <p class="text-muted text-sm mt-1 max-w-md">${d}</p>
      </div>
    </div>`).join('');
  return `
  <section class="max-w-4xl mx-auto px-5 lg:px-8 py-16">
    <h1 class="display text-4xl font-bold text-center">How DriveNear works</h1>
    <p class="text-muted text-center mt-3">Two simple journeys — whether you're renting or listing a car.</p>
    <div class="grid lg:grid-cols-2 gap-14 mt-16">
      <div><h2 class="display text-xl font-bold mb-8">For Renters</h2>${timeline(renters)}</div>
      <div><h2 class="display text-xl font-bold mb-8">For Owners</h2>${timeline(owners)}</div>
    </div>
    <div class="mt-8 flex justify-center gap-4">
      <a href="#/cars" class="btn btn-primary font-semibold px-6 py-3 rounded-full">Find a Car</a>
      <a href="#/list-your-car" class="btn font-semibold px-6 py-3 rounded-full border border-line bg-white">List Your Car</a>
    </div>
  </section>`;
}
