// --- 상태 (localStorage) ---
let users = [];
let currentUser = null;

function loadState() {
  try { users = JSON.parse(localStorage.getItem('users') || '[]'); } catch { users = []; }
  try { currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { currentUser = null; }
}
function saveState() {
  try { localStorage.setItem('users', JSON.stringify(users)); } catch {}
  try { localStorage.setItem('currentUser', JSON.stringify(currentUser)); } catch {}
}
loadState();

// --- DOM ---
const mainPage = document.getElementById('mainPage');
const authPage = document.getElementById('authPage');
const signupForm = document.getElementById('signupForm');
const loginForm  = document.getElementById('loginForm');
const myPage     = document.getElementById('myPage');
const map        = document.getElementById('map');
const board      = document.getElementById('board');
const chartContainer = document.getElementById('chartContainer');
const hobFrame   = document.getElementById('hobFrame');

const toLoginBtn   = document.getElementById('toLoginBtn');
const toSignupBtn  = document.getElementById('toSignupBtn');
const backToMainBtn= document.getElementById('backToMainBtn');
const logoutBtn    = document.getElementById('logoutBtn');
const goSignup     = document.getElementById('goSignup');
const goLogin      = document.getElementById('goLogin');
const goMy         = document.getElementById('goMy');
const openFavBtn = document.getElementById('openFavBtn');

// 커뮤니티 인기글 카드
const hotCards = [
  document.getElementById('hotPost1'),
  document.getElementById('hotPost2'),
  document.getElementById('hotPost3')
];

// 추가 버튼
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const resetBtn         = document.getElementById('resetBtn');

const myInfo       = document.getElementById('myInfo');
const myHobbyBox   = document.getElementById('myHobbyBox');

// ✅ 추가: 크루 목록 버튼 참조
const openCrewListBtn = document.getElementById('openCrewListBtn');

/* ++ added: 새 상단바의 버튼(기존과 ID 충돌 방지용) */
const goMy2 = document.getElementById('goMy2');
const openFavBtn2 = document.getElementById('openFavBtn2');
const toFeedBtn = document.getElementById('toFeedBtn');
const toMsgBtn  = document.getElementById('toMsgBtn');
const openCategoryBtn = document.getElementById('openCategoryBtn');

// --- 유틸 / 네비 ---
function hideAll() {
  [mainPage, authPage, signupForm, loginForm, myPage, map, board, chartContainer].forEach(el => el?.classList.add('hidden'));
  hobFrame?.classList.add('hidden');
}
function show(page) {
  hideAll();
  page?.classList.remove('hidden');
  const isIn = !!currentUser;
  logoutBtn?.classList.toggle('hidden', !isIn);
  deleteAccountBtn?.classList.toggle('hidden', !isIn);

  // ✅ 메인 보여줄 때 인기글 + BEST 크루 렌더
  if (page === mainPage) {
    renderCommunityHot();
    renderBestCrews(); // ← 이 줄 추가
  }
}

function showAuth(which = 'login') {  
  hideAll();
  authPage?.classList.remove('hidden');
  signupForm?.classList.toggle('hidden', which !== 'signup');
  loginForm?.classList.toggle('hidden', which !== 'login');
  logoutBtn?.classList.add('hidden');
  deleteAccountBtn?.classList.add('hidden');
}
function showHobbyPage() {
  hideAll();
  try { hobFrame?.contentWindow?.postMessage({ type: 'RESET_HOBBY' }, '*'); } catch {}
  const base = hobFrame.getAttribute('data-base') || 'Hobby/hob.html';
  hobFrame.setAttribute('data-base', base);
  hobFrame.src = `${base}?t=${Date.now()}`;
  hobFrame.addEventListener('load', () => {
    try { hobFrame.contentWindow?.postMessage({ type: 'RESET_HOBBY' }, '*'); } catch {}
  }, { once: true });

  hobFrame.classList.remove('hidden');
  const isIn = !!currentUser;
  logoutBtn?.classList.toggle('hidden', !isIn);
  deleteAccountBtn?.classList.toggle('hidden', !isIn);
}
function showMyPage() {
  hideAll();
  myPage?.classList.remove('hidden');
  renderMyPage();
  const isIn = !!currentUser;
  logoutBtn?.classList.toggle('hidden', !isIn);
  deleteAccountBtn?.classList.toggle('hidden', !isIn);
}
function renderMyPage() {
  if (!currentUser) return;
  const { id, gender, birthdate, mbti, address } = currentUser;
  if (myInfo) {
    myInfo.textContent =
      `ID: ${id || '-'} / 성별: ${gender || '-'} / 생일: ${birthdate || '-'} / MBTI: ${mbti || '-'} / 주소: ${address || '-'}`;
  }
  if (myHobbyBox) {
    myHobbyBox.innerHTML = '';
    const pills = [
      ...(currentUser.hobbies || []),
      ...(currentUser.chosenHobby ? [currentUser.chosenHobby] : []),
    ];
    pills.forEach(p => {
      const s = document.createElement('span');
      s.className = 'pill';
      s.textContent = p;
      myHobbyBox.appendChild(s);
    });
    if (currentUser.crewChoice) {
      const c = currentUser.crewChoice;
      const s = document.createElement('span');
      s.className = 'pill';
      s.textContent = `크루: ${c.name} (${c.loc} · ${c.time})`;
      myHobbyBox.appendChild(s);
    }

    // ---- (추가) 내 신청 현황 표시 ----
    try {
      const apps = JSON.parse(localStorage.getItem('crewApplications') || '[]')
                    .filter(a => a.applicantId === currentUser.id)
                    .sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

      if (apps.length) {
        const boxTitle = document.createElement('div');
        boxTitle.style.marginTop = '12px';
        boxTitle.style.fontWeight = '600';
        boxTitle.textContent = '내 신청 현황';
        myHobbyBox.appendChild(boxTitle);

        apps.slice(0, 5).forEach(a => {
          const chip = document.createElement('span');
          chip.className = 'pill';
          const status = a.status==='pending' ? '대기중'
                       : a.status==='approved' ? '승인'
                       : '거절';
          chip.textContent = `${a.crewName} · ${status}`;
          chip.classList.add(a.status); // pending / approved / rejected
          myHobbyBox.appendChild(chip);
        });
      }
    } catch {}
  }
}

/* ===== 커뮤니티 인기글 (전역) ===== */
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }
function formatTime(ts){
  const d = new Date(Number(ts || Date.now()));
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'),
        da=String(d.getDate()).padStart(2,'0'), hh=String(d.getHours()).padStart(2,'0'),
        mm=String(d.getMinutes()).padStart(2,'0');
  return `${y}-${m}-${da} ${hh}:${mm}`;
}
function renderCommunityHot() {
  if (!hotCards?.length) return;

  // 1) 게시글 로드
  let posts = [];
  try { posts = JSON.parse(localStorage.getItem('posts') || '[]'); } catch {}

  // 2) 정렬: 추천(likes) → 조회수(views) → 최신(createdAt)
  posts.sort((a, b) => {
    const la = Number(a.likes || 0), lb = Number(b.likes || 0);
    if (lb !== la) return lb - la;
    const va = Number(a.views || 0), vb = Number(b.views || 0);
    if (vb !== va) return vb - va;
    return Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });

  const top3 = posts.slice(0, 3);

  // 3) 카드 채우기
  for (let i = 0; i < hotCards.length; i++) {
    const card = hotCards[i];
    const p = top3[i];
    if (!card) continue;

    if (!p) {
      card.innerHTML = `<div class="hot-empty">인기 게시글이 없습니다.</div>`;
      continue;
    }

    const title = escapeHtml(p.title || '(제목 없음)');
    const author = escapeHtml(p.authorId || '익명');
    const when = formatTime(p.createdAt);
    const views = Number(p.views || 0);
    const likes = Number(p.likes || 0);

    card.innerHTML = `
      <a href="Community/community.html" aria-label="${title}">
        <div class="hot-title">${title}</div>
        <div class="hot-meta">
          <span>${author}</span>
          <span>${when}</span>
          <span>👁 ${views}</span>
          <span>👍 ${likes}</span>
        </div>
      </a>
    `;
  }
}

// // --- 초기 화면 ---
// if (currentUser) {
//   currentUser.hobbyCompleted ? showMyPage() : showHobbyPage();
// } else {
//   show(mainPage);
//   logoutBtn?.classList.add('hidden');
//   deleteAccountBtn?.classList.add('hidden');
//   // ✅ 메인으로 시작하면 인기글 한번 채우기
//   renderCommunityHot();
// }

// --- 초기 화면 --- 
const url = new URL(window.location.href);
const forceHome = (url.hash === '#home') || (url.searchParams.get('home') === '1');

if (forceHome) {
  show(mainPage);                          // 메인 강제 표시
  logoutBtn?.classList.toggle('hidden', !currentUser);
  deleteAccountBtn?.classList.toggle('hidden', !currentUser);
  renderCommunityHot();
} else if (currentUser) {
  currentUser.hobbyCompleted ? showMyPage() : showHobbyPage();
} else {
  show(mainPage);
  logoutBtn?.classList.add('hidden');
  deleteAccountBtn?.classList.add('hidden');
  renderCommunityHot();
  renderBestCrews(); // ← 이 줄 추가
}

// --- 네비 ---
backToMainBtn?.addEventListener('click', () => show(mainPage));
toSignupBtn?.addEventListener('click', () => showAuth('signup'));
toLoginBtn?.addEventListener('click', () => showAuth('login'));
goSignup?.addEventListener('click', () => showAuth('signup'));
goLogin?.addEventListener('click', () => showAuth('login'));
goMy?.addEventListener('click', () => currentUser ? showMyPage() : showAuth('login'));

// // ✅ 추가: 첫 번째 크루 아이콘 클릭 → 목록 페이지로 이동
openCrewListBtn?.addEventListener('click', () => {
  window.location.href = 'CrewList/crewList.html';
});
// ---- (추가) 상단바 아이콘도 크루 목록으로 이동 ----
document.getElementById('openCrewListBtnTop')
  ?.addEventListener('click', () => { location.href = 'CrewList/crewList.html'; });
  // ---- (추가) data-go="crewlist" 속성으로도 잡아주기(아이디 없이도 동작)
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go="crewlist"]');
  if (el) location.href = 'CrewList/crewList.html';
});
// // 즐겨찾기(찜) 목록 페이지로 이동
// openFavBtn?.addEventListener('click', () => {
//   window.location.href = 'CrewList/favorites.html';
// });

/* ++ added: 새 상단바 버튼 이벤트 (기존 코드 영향 없음) */
goMy2?.addEventListener('click', () => currentUser ? showMyPage() : showAuth('login'));
openFavBtn2?.addEventListener('click', () => { window.location.href = 'CrewList/favorites.html'; });
openCrewListBtn?.addEventListener('click', () => { window.location.href = 'CrewList/crewList.html'; });
toMsgBtn?.addEventListener('click', () => alert('메시지 준비중입니다.'));
openCategoryBtn?.addEventListener('click', () => alert('카테고리 패널 준비중입니다.'));
['openCrewListBtn2', 'crewListBtn', 'crewBtnTop'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    window.location.href = 'CrewList/crewList.html';
  });
});
logoutBtn?.addEventListener('click', () => {
  currentUser = null;
  saveState();
  logoutBtn?.classList.add('hidden');
  deleteAccountBtn?.classList.add('hidden');
  show(mainPage);
});

// --- 회원가입용 날짜 셀렉트 ---
(function fillBirthSelects(){
  const y = document.getElementById('birthYear');
  const m = document.getElementById('birthMonth');
  const d = document.getElementById('birthDay');
  if (!y || !m || !d) return;
  const now = new Date().getFullYear();
  for (let i = now; i >= 1930; i--) {
    const o = document.createElement('option'); o.value = o.textContent = i; y.appendChild(o);
  }
  for (let i = 1; i <= 12; i++) {
    const o = document.createElement('option'); o.value = String(i).padStart(2,'0'); o.textContent = i; m.appendChild(o);
  }
  for (let i = 1; i <= 31; i++) {
    const o = document.createElement('option'); o.value = String(i).padStart(2,'0'); o.textContent = i; d.appendChild(o);
  }
})();

// --- 회원가입 ---
signupForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('signupId')?.value.trim();
  const pw = document.getElementById('signupPw')?.value.trim();
  const gender = [...document.querySelectorAll('input[name="gender"]')].find(x => x.checked)?.value || '';
  const y = document.getElementById('birthYear')?.value || '';
  const m = document.getElementById('birthMonth')?.value || '';
  const d = document.getElementById('birthDay')?.value || '';
  const birthdate = [y,m,d].filter(Boolean).join('-');
  const address = document.getElementById('address')?.value.trim() || '';
  const mbti = document.getElementById('mbtiSelect')?.value || '';

  if (!id || !pw) return alert('아이디/비밀번호를 입력하세요.');
  if (users.some(u => u.id === id)) return alert('이미 존재하는 아이디입니다.');

  const newUser = { id, pw, gender, birthdate, address, mbti, hobbies: [], hobbyCompleted: false, chosenHobby: '', crewChoice: null };
  users.push(newUser);
  currentUser = newUser;
  saveState();

  alert('회원가입 성공! 취미 설정으로 이동합니다.');
  showHobbyPage();
  signupForm.reset();
});

// --- 로그인 ---
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('loginId')?.value.trim();
  const pw = document.getElementById('loginPw')?.value.trim();
  const user = users.find(u => u.id === id && u.pw === pw);
  if (!user) return alert('아이디/비밀번호를 확인하세요.');

  currentUser = user;
  saveState();
  currentUser.hobbyCompleted ? showMyPage() : showHobbyPage();
  loginForm.reset();
});

// --- 메시지 수신 (핵심!) ---
window.addEventListener('message', (ev) => {
  const data = ev?.data;

  // 1) 크루 상세 페이지 열기
  if (data?.type === 'OPEN_CREW') {
    localStorage.setItem('pendingCrew', JSON.stringify({
      selectedHobbies: data.selectedHobbies || [],
      chosenHobby: data.chosenHobby || '',
      crewChoice: data.crewChoice || null
    }));
    window.location.href = 'Crew/crew.html';
    return;
  }

  // 2) 바로 완료(나중에 선택)
  if (data?.type === 'HOBBY_DONE') {
    const { selectedHobbies = [], chosenHobby = '', crewChoice = null } = data;
    if (!currentUser) return;

    currentUser.hobbyCompleted = true;
    currentUser.hobbies = selectedHobbies;
    currentUser.chosenHobby = chosenHobby;
    currentUser.crewChoice = crewChoice;

    const i = users.findIndex(u => u.id === currentUser.id);
    if (i !== -1) users[i] = currentUser;

    saveState();
    showMyPage();
  }
});

// --- 현재 로그인한 계정만 삭제 ---
deleteAccountBtn?.addEventListener('click', () => {
  if (!currentUser) return alert('로그인 상태가 아닙니다.');
  if (!confirm(`정말 '${currentUser.id}' 계정을 삭제할까요? 이 계정의 설문/크루 선택도 함께 삭제됩니다.`)) return;

  users = (users || []).filter(u => u.id !== currentUser.id);
  currentUser = null;
  saveState();

  try { hobFrame?.contentWindow?.postMessage({ type: 'RESET_HOBBY' }, '*'); } catch {}
  if (hobFrame) hobFrame.src = 'Hobby/hob.html?t=' + Date.now();

  show(mainPage);
  alert('계정이 삭제됐습니다.');
});

// --- 전체 데이터 초기화 ---
resetBtn?.addEventListener('click', () => {
  if (!confirm('모든 회원 데이터(users/currentUser)가 삭제됩니다. 진행할까요?')) return;

  users = [];
  currentUser = null;
  try { localStorage.removeItem('users'); } catch {}
  try { localStorage.removeItem('currentUser'); } catch {}

  try { hobFrame?.contentWindow?.postMessage({ type: 'RESET_HOBBY' }, '*'); } catch {}
  if (hobFrame) hobFrame.src = 'Hobby/hob.html?t=' + Date.now();

  show(mainPage);
  alert('초기화 완료!');
});

/* ===== BEST 크루: 별점 높은 순 상위 3 (카드 버전) ===== */
function loadCrews(){ try { return JSON.parse(localStorage.getItem('crews') || '[]'); } catch { return []; } }
function loadReviews(){ try { return JSON.parse(localStorage.getItem('crewReviews') || '{}'); } catch { return {}; } }
function loadFavMap(){ try { return JSON.parse(localStorage.getItem('crewFavorites') || '{}'); } catch { return {}; } }
function saveFavMap(m){ localStorage.setItem('crewFavorites', JSON.stringify(m)); }

function getAvgAndCnt(crewId){
  const map = loadReviews();
  const arr = map[crewId] || [];
  if (!arr.length) return { avg:0, cnt:0 };
  const sum = arr.reduce((s,r)=> s + Number(r.stars||0), 0);
  return { avg: +(sum/arr.length).toFixed(1), cnt: arr.length };
}
function starsHtml(avg){
  const full = Math.floor(avg);
  const half = avg - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '☆' : '') + '✩'.repeat(empty);
}

function renderBestCrews(){
  const box = document.getElementById('bestGrid');
  if (!box) return;

  const crews = loadCrews();
  const favMap = loadFavMap();
  const favSet = (currentUser?.id) ? new Set(favMap[currentUser.id] || []) : new Set();

  const ranked = crews.map(c=>{
    const {avg, cnt} = getAvgAndCnt(c.id);
    return {...c, _avg:avg, _cnt:cnt};
  }).sort((a,b)=>{
    if (b._avg !== a._avg) return b._avg - a._avg;   // 평균 별점 ↓
    if (b._cnt !== a._cnt) return b._cnt - a._cnt;   // 리뷰 수 ↓
    return (b.createdAt||0) - (a.createdAt||0);      // 최신 ↓
  }).slice(0, 3);

  if (!ranked.length){
    box.innerHTML = `<div class="crew-card"><div class="body">등록된 크루가 없습니다.</div></div>`;
    return;
  }

  box.innerHTML = ranked.map(c=>{
    const isFav = favSet.has(c.id);
    const fee = c.fee ? String(c.fee) : '';
    const {avg, cnt} = getAvgAndCnt(c.id);
    const img = c.img || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop';
    return `
      <article class="crew-card" data-id="${c.id}">
        <span class="badge">추천</span>
        <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${c.id}" aria-label="찜">${isFav ? '♥' : '♡'}</button>
        <img src="${img}" alt="${c.name || 'Crew'}">
        <div class="body">
          <h3>${c.name || '이름없음'}</h3>
          <div class="crew-meta">
            <span>${c.hobby || '-'}</span>
            <span>${c.loc || '-'}</span>
            <span>${c.time || '-'}</span>
            <span>${c.members ? String(c.members)+'명' : ''}</span>
          </div>
          ${c.desc ? `<div class="crew-desc">${c.desc}</div>` : ``}
          <div class="card-foot">
            <div class="stars" title="${avg}점">${starsHtml(avg)}<span class="count">(${cnt})</span></div>
            ${fee ? `<div class="price-pill">${fee}원</div>` : ``}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // 클릭 → 상세 페이지
  box.querySelectorAll('.crew-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const id = card.getAttribute('data-id');
      const c = crews.find(x=>x.id===id);
      if (!c) return;
      localStorage.setItem('pendingCrew', JSON.stringify({
        selectedHobbies: [],
        chosenHobby: c.hobby || '',
        crewChoice: c
      }));
      location.href = 'Crew/crew.html';
    });
  });

  // 찜 토글 (버튼만 클릭 전용)
  box.querySelectorAll('.fav-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if (!currentUser){ alert('로그인 후 이용해 주세요.'); return; }
      const id = btn.getAttribute('data-id');
      const map = loadFavMap();
      const set = new Set(map[currentUser.id] || []);
      if (set.has(id)) set.delete(id); else set.add(id);
      map[currentUser.id] = [...set];
      saveFavMap(map);
      renderBestCrews(); // 즉시 갱신
    });
  });
}