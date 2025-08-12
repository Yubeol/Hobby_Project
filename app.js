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

const toLoginBtn   = document.getElementById('toLoginBtn');     // 없으면 무시됨(?. 사용)
const toSignupBtn  = document.getElementById('toSignupBtn');
const backToMainBtn= document.getElementById('backToMainBtn');
const logoutBtn    = document.getElementById('logoutBtn');
const goSignup     = document.getElementById('goSignup');
const goLogin      = document.getElementById('goLogin');
const goMy         = document.getElementById('goMy');

const myInfo       = document.getElementById('myInfo');
const myHobbyBox   = document.getElementById('myHobbyBox');

// --- 유틸 / 네비 ---
function hideAll() {
  [mainPage, authPage, signupForm, loginForm, myPage, map, board, chartContainer].forEach(el => el?.classList.add('hidden'));
  hobFrame?.classList.add('hidden');
}
function show(page) {
  hideAll();
  page?.classList.remove('hidden');
  logoutBtn?.classList.toggle('hidden', !currentUser);
}
function showAuth(which = 'login') {
  hideAll();
  authPage?.classList.remove('hidden');
  signupForm?.classList.toggle('hidden', which !== 'signup');
  loginForm?.classList.toggle('hidden', which !== 'login');
  logoutBtn?.classList.add('hidden');
}
function showHobbyPage() {
  hideAll();

  // 1) 이미 로드된 iframe이면 Step1로 리셋 메시지 전송
  try {
    hobFrame.contentWindow?.postMessage({ type: 'RESET_HOBBY' }, '*');
  } catch {}

  // 2) 아직 로드 전이거나 이전 상태가 남아있을 수 있으니 강제 리로드 + 로드 후 재리셋
  const base = hobFrame.getAttribute('data-base') || 'Hobby/hob.html';
  hobFrame.setAttribute('data-base', base);
  hobFrame.src = `${base}?t=${Date.now()}`; // 캐시 방지용 파라미터

  hobFrame.addEventListener('load', () => {
    try {
      hobFrame.contentWindow?.postMessage({ type: 'RESET_HOBBY' }, '*');
    } catch {}
  }, { once: true });

  hobFrame.classList.remove('hidden');
  logoutBtn?.classList.toggle('hidden', !currentUser);
}
function showMyPage() {
  hideAll();
  myPage?.classList.remove('hidden');
  renderMyPage();
  logoutBtn?.classList.toggle('hidden', !currentUser);
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
    // 선택한 크루 표시(있으면)
    if (currentUser.crewChoice) {
      const c = currentUser.crewChoice;
      const s = document.createElement('span');
      s.className = 'pill';
      s.textContent = `크루: ${c.name} (${c.loc} · ${c.time})`;
      myHobbyBox.appendChild(s);
    }
  }
}

// --- 초기 화면 ---
if (currentUser) {
  currentUser.hobbyCompleted ? showMyPage() : showHobbyPage();
} else {
  show(mainPage);
  logoutBtn?.classList.add('hidden');
}

// --- 상단/히어로 버튼 ---
backToMainBtn?.addEventListener('click', () => show(mainPage));
toSignupBtn?.addEventListener('click', () => showAuth('signup'));
toLoginBtn?.addEventListener('click', () => showAuth('login'));
goSignup?.addEventListener('click', () => showAuth('signup'));
goLogin?.addEventListener('click', () => showAuth('login'));
goMy?.addEventListener('click', () => currentUser ? showMyPage() : showAuth('login'));

logoutBtn?.addEventListener('click', () => {
  currentUser = null;
  saveState();
  logoutBtn?.classList.add('hidden');
  show(mainPage);
});

// --- 회원가입용 날짜 셀렉트 채우기 ---
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

// --- hob.html(iframe)에서 완료 신호 받기 ---
window.addEventListener('message', (ev) => {
  if (ev?.data?.type !== 'HOBBY_DONE') return;

  const { selectedHobbies = [], chosenHobby = '', crewChoice = null } = ev.data;
  if (!currentUser) return;

  currentUser.hobbyCompleted = true;
  currentUser.hobbies = selectedHobbies;
  currentUser.chosenHobby = chosenHobby;
  currentUser.crewChoice = crewChoice;

  const i = users.findIndex(u => u.id === currentUser.id);
  if (i !== -1) users[i] = currentUser;

  saveState();
  showMyPage();
});
