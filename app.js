// --- 상태 (localStorage) ---
let users = [];
let currentUser = null;

function loadState() {
  try {
    users = JSON.parse(localStorage.getItem('users') || '[]');
  } catch { users = []; }
  try {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch { currentUser = null; }
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
const goMy         = document.getElementById('goMy'); // 추가 ✅

const myInfo       = document.getElementById('myInfo');
const myHobbyBox   = document.getElementById('myHobbyBox');

// --- 유틸 ---
function hideAll() {
  [mainPage, authPage, signupForm, loginForm, myPage, map, board, chartContainer].forEach(el => el.classList.add('hidden'));
  hobFrame.classList.add('hidden');
}
function show(page) {
  hideAll();
  page.classList.remove('hidden');
}
function showAuth(which = 'login') {
  hideAll();
  authPage.classList.remove('hidden');
  signupForm.classList.toggle('hidden', which !== 'signup');
  loginForm.classList.toggle('hidden', which !== 'login');
}
function showHobbyPage() {
  hideAll();
  hobFrame.classList.remove('hidden');
  logoutBtn.classList.toggle('hidden', !currentUser);
}
function showMyPage() {
  hideAll();
  myPage.classList.remove('hidden');
  renderMyPage();
  logoutBtn.classList.toggle('hidden', !currentUser);
}
function renderMyPage() {
  if (!currentUser) return;
  const { id, gender, birthdate, mbti, address } = currentUser;
  myInfo.textContent = `ID: ${id || '-'} / 성별: ${gender || '-'} / 생일: ${birthdate || '-'} / MBTI: ${mbti || '-'} / 주소: ${address || '-'}`;
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
}

// --- 초기 화면 ---
if (currentUser) {
  // 이미 로그인 되어있다면 취미 완료 여부에 따라 분기
  if (currentUser.hobbyCompleted) showMyPage();
  else showHobbyPage();
} else {
  show(mainPage);
  logoutBtn.classList.add('hidden');
}

// --- 버튼 네비게이션 ---
backToMainBtn.addEventListener('click', () => show(mainPage));
toSignupBtn.addEventListener('click', () => showAuth('signup'));
toLoginBtn.addEventListener('click', () => showAuth('login'));
goSignup?.addEventListener('click', () => showAuth('signup'));
goLogin?.addEventListener('click', () => showAuth('login'));
goMy?.addEventListener('click', () => currentUser ? showMyPage() : showAuth('login')); // 추가 ✅

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  saveState();
  logoutBtn.classList.add('hidden');
  show(mainPage);
});

// --- 날짜 셀렉트 채우기 (회원가입용) ---
(function fillBirthSelects(){
  const y = document.getElementById('birthYear');
  const m = document.getElementById('birthMonth');
  const d = document.getElementById('birthDay');
  if (!y || !m || !d) return;
  const now = new Date().getFullYear();
  for (let i = now; i >= 1930; i--) {
    const opt = document.createElement('option'); opt.value = opt.textContent = i; y.appendChild(opt);
  }
  for (let i = 1; i <= 12; i++) {
    const opt = document.createElement('option'); opt.value = String(i).padStart(2,'0'); opt.textContent = i; m.appendChild(opt);
  }
  for (let i = 1; i <= 31; i++) {
    const opt = document.createElement('option'); opt.value = String(i).padStart(2,'0'); opt.textContent = i; d.appendChild(opt);
  }
})();

// --- 회원가입 ---
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('signupId').value.trim();
  const pw = document.getElementById('signupPw').value.trim();
  const gender = [...document.querySelectorAll('input[name="gender"]')].find(x => x.checked)?.value || '';
  const birthdate = `${document.getElementById('birthYear').value}-${document.getElementById('birthMonth').value}-${document.getElementById('birthDay').value}`;
  const address = document.getElementById('address').value.trim();
  const mbti = document.getElementById('mbtiSelect').value;

  if (!id || !pw) return alert('아이디/비밀번호를 입력하세요.');
  if (users.some(u => u.id === id)) return alert('이미 존재하는 아이디입니다.');

  const newUser = { id, pw, gender, birthdate, address, mbti, hobbies: [], hobbyCompleted: false };
  users.push(newUser);
  currentUser = newUser;
  saveState();

  alert('회원가입 성공! 취미 설정으로 이동합니다.');
  showHobbyPage();

  // 입력 초기화
  signupForm.reset();
});

// --- 로그인 ---
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value.trim();
  const user = users.find(u => u.id === id && u.pw === pw);
  if (!user) return alert('아이디/비밀번호를 확인하세요.');

  currentUser = user;
  saveState();

  // 취미 미완료 시 취미 페이지부터
  if (!currentUser.hobbyCompleted) showHobbyPage();
  else showMyPage();

  loginForm.reset();
});

// --- hob.html(iframe)에서 취미 완료 신호 받기 ---
window.addEventListener('message', (ev) => {
  if (ev?.data?.type !== 'HOBBY_DONE') return;

  const { selectedHobbies = [], chosenHobby = '' } = ev.data;
  if (!currentUser) return;

  currentUser.hobbyCompleted = true;
  currentUser.hobbies = selectedHobbies;
  currentUser.chosenHobby = chosenHobby;

  // users 배열 반영
  const i = users.findIndex(u => u.id === currentUser.id);
  if (i !== -1) users[i] = currentUser;

  saveState();

  // 취미 끝 → 마이페이지로 이동
  showMyPage();
});
