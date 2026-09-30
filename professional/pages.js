// Demo authentication guard. Login is intentionally simple for the hackathon demo.
(function(){
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const publicPages=['index.html','login.html',''];
  if(!publicPages.includes(page)){
    let u=null; try{u=JSON.parse(localStorage.getItem('credskillUser')||'null')}catch(e){}
    if(!u||!u.loggedIn){ location.href='login.html'; return; }
    if('professional'==='student' && u.role!=='learner'){ location.href='login.html'; return; }
    if('professional'==='professional' && u.role!=='teacher'){ location.href='login.html'; return; }
    window.CREDSKILL_USER=u;
  }
})();

// ─────────────────────────────────────────────────────────
// Shared page behavior: skill choice grid (teacher.html),
// and pulling the live session rating into dashboard/profile
// so it isn't hardcoded anymore.
// ─────────────────────────────────────────────────────────

// Teacher mode: choose skill, remember it for the assessment page.
const choiceButtons = document.querySelectorAll('.choice');
if (choiceButtons.length) {
  choiceButtons.forEach(b => b.onclick = () => {
    choiceButtons.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });

  const toAssessment = document.querySelector('#toAssessment');
  if (toAssessment) {
    toAssessment.addEventListener('click', () => {
      const active = document.querySelector('.choice.active');
      const skill = active ? active.textContent : 'Python';
      try { localStorage.setItem('credskill_teacher_skill', skill); } catch (e) {}
      // href="assessment.html" still navigates normally after this runs
    });
  }
}

// ── Live rating helpers (shared by dashboard.html + profile.html) ──
function getStoredRatings() {
  try {
    return JSON.parse(localStorage.getItem('credskill_ratings') || '[]');
  } catch (e) { return []; }
}

function computeAverageRating() {
  const ratings = getStoredRatings();
  if (!ratings.length) return null; // no feedback yet
  const sum = ratings.reduce((a, r) => a + r.stars, 0);
  return { avg: (sum / ratings.length).toFixed(1), count: ratings.length };
}

function applyLiveRatingToDOM() {
  const result = computeAverageRating();
  document.querySelectorAll('[data-live-rating]').forEach(el => {
    el.textContent = result ? `${result.avg} ★` : 'Unrated';
  });
  document.querySelectorAll('[data-live-rating-count]').forEach(el => {
    el.textContent = result ? `Based on ${result.count} session${result.count === 1 ? '' : 's'}` : 'No session feedback yet';
  });
  document.querySelectorAll('[data-live-rating-big]').forEach(el => {
    el.innerHTML = result ? `${result.avg} <small>★</small>` : `— <small>unrated</small>`;
  });
}

applyLiveRatingToDOM();

// ── Live credits balance (shared by sidebar on every page + dashboard stat + wallet.html) ──
// 2 credits = ₹1. Stored in localStorage so top-ups/withdrawals persist across pages.
const CREDIT_RATE = 2; // credits per rupee
const DEFAULT_BALANCE = 0;

function getCreditsBalance() {
  const raw = localStorage.getItem('credskill_credits');
  if (raw === null) {
    try { localStorage.setItem('credskill_credits', String(DEFAULT_BALANCE)); } catch (e) {}
    return DEFAULT_BALANCE;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_BALANCE;
}

function setCreditsBalance(n) {
  try { localStorage.setItem('credskill_credits', String(Math.max(0, Math.round(n)))); } catch (e) {}
}

function formatCredits(n) {
  return n.toLocaleString('en-IN');
}

function applyCreditsToDOM() {
  const bal = getCreditsBalance();
  document.querySelectorAll('[data-live-credits]').forEach(el => { el.textContent = formatCredits(bal); });
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = (window.CREDSKILL_USER && window.CREDSKILL_USER.name) || 'Learner');
}

applyCreditsToDOM();
