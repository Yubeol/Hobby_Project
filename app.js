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

// 추가 버튼
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const resetBtn         = document.getElementById('resetBtn');

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
  const isIn = !!currentUser;
  logoutBtn?.classList.toggle('hidden', !isIn);
  deleteAccountBtn?.classList.toggle('hidden', !isIn);
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
  }
}

// --- 초기 화면 ---
if (currentUser) {
  currentUser.hobbyCompleted ? showMyPage() : showHobbyPage();
} else {
  show(mainPage);
  logoutBtn?.classList.add('hidden');
  deleteAccountBtn?.classList.add('hidden');
}

// --- 네비 ---
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
