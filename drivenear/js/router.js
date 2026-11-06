/* DriveNear — js/router.js */

/* ---------------- ROUTER ---------------- */
window.addEventListener('hashchange', ()=>{ state.route = location.hash || '#/'; renderApp(); window.scrollTo({top:0}); });
function nav(path){ location.hash = path; }
