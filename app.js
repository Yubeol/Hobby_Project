let users = [];
let currentUser = null;
let posts = [];

// DOM 요소 가져오기
const mainPage = document.getElementById('mainPage');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const myPage = document.getElementById('myPage');
const map = document.getElementById('map');
const board = document.getElementById('board');
const chartContainer = document.getElementById('chartContainer');

const toLoginBtn = document.getElementById('toLoginBtn');
const toSignupBtn = document.getElementById('toSignupBtn');
const backToMainFromSignupBtn = document.getElementById('backToMainFromSignupBtn');
const backToMainFromLoginBtn = document.getElementById('backToMainFromLoginBtn');

// 로그인 폼 보여주기
toLoginBtn.addEventListener('click', () => {
  mainPage.classList.add('hidden');
  signupForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

// 회원가입 폼 보여주기
toSignupBtn.addEventListener('click', () => {
  mainPage.classList.add('hidden');
  loginForm.classList.add('hidden');
  signupForm.classList.remove('hidden');
});

// 회원가입 폼 뒤로가기
backToMainFromSignupBtn.addEventListener('click', () => {
  signupForm.classList.add('hidden');
  mainPage.classList.remove('hidden');
});

// 로그인 폼 뒤로가기
backToMainFromLoginBtn.addEventListener('click', () => {
  loginForm.classList.add('hidden');
  mainPage.classList.remove('hidden');
});

// 회원가입 함수
function signup() {
  const id = document.getElementById('signupId').value.trim();
  const pw = document.getElementById('signupPw').value.trim();
  const gender = document.querySelector('input[name="gender"]:checked')?.value;
  const birthYear = document.getElementById('birthYear').value;
  const birthMonth = document.getElementById('birthMonth').value;
  const birthDay = document.getElementById('birthDay').value;
  const address = document.getElementById('address').value.trim();
  const mbti = document.getElementById('mbtiSelect').value;

  if (!id || !pw || !gender || !birthYear || !birthMonth || !birthDay || !address || !mbti) {
    alert('모든 정보를 입력해주세요.');
    return;
  }

  if (users.find(user => user.id === id)) {
    alert('이미 존재하는 아이디입니다.');
    return;
  }

  const birthdate = `${birthYear}-${birthMonth}-${birthDay}`;
  users.push({ id, pw, gender, birthdate, address, mbti });
  alert('회원가입 성공!');
  signupForm.classList.add('hidden');
  loginForm.classList.remove('hidden');

  // 입력 초기화
  ['signupId','signupPw','address'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('input[name="gender"]').forEach(el => el.checked = false);
  document.getElementById('mbtiSelect').selectedIndex = 0;
}

// 로그인 처리
function login() {
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value.trim();
  const user = users.find(u => u.id === id && u.pw === pw);

  if (!user) {
    alert('로그인 실패. 아이디/비밀번호 확인');
    return;
  }

  currentUser = user;
  loginForm.classList.add('hidden');
  myPage.classList.remove('hidden');
  document.getElementById('userIdDisplay').textContent = user.id;
  board.classList.remove('hidden');
  map.classList.remove('hidden');
  chartContainer.classList.remove('hidden');

  // loadMap(); // 티맵 API로 변경 필요
  updateChart();

  document.getElementById('loginId').value = '';
  document.getElementById('loginPw').value = '';
}

// 로그아웃 처리
function logout() {
  currentUser = null;
  myPage.classList.add('hidden');
  board.classList.add('hidden');
  map.classList.add('hidden');
  chartContainer.classList.add('hidden');
  mainPage.classList.remove('hidden');
}

// 게시글 추가
function addPost() {
  const input = document.getElementById('postInput');
  if (!input.value.trim()) return;
  posts.push({ author: currentUser.id, content: input.value });
  renderPosts();
  updateChart();
  input.value = '';
}

// 게시글 렌더링
function renderPosts() {
  const list = document.getElementById('postList');
  list.innerHTML = '';
  posts.forEach(post => {
    const li = document.createElement('li');
    li.textContent = `[${post.author}] ${post.content}`;
    list.appendChild(li);
  });
}

// 그래프 업데이트
function updateChart() {
  const counts = {};
  posts.forEach(post => {
    counts[post.author] = (counts[post.author] || 0) + 1;
  });

  const ctx = document.getElementById('postChart').getContext('2d');
  if (window.postChart) window.postChart.destroy();
  window.postChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: Object.keys(counts), datasets: [{ label: '게시글 수', data: Object.values(counts), backgroundColor: '#4a90e2' }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// 생년월일 및 MBTI 옵션 초기화
document.addEventListener('DOMContentLoaded', () => {
  const yearSel = document.getElementById('birthYear');
  const monthSel = document.getElementById('birthMonth');
  const daySel = document.getElementById('birthDay');
  const mbtiSel = document.getElementById('mbtiSelect');

  const year = new Date().getFullYear();
  for (let y = year; y >= 1900; y--) yearSel.add(new Option(y, y));
  for (let m = 1; m <= 12; m++) monthSel.add(new Option(m, m));
  for (let d = 1; d <= 31; d++) daySel.add(new Option(d, d));

  monthSel.addEventListener('change', () => {
    const days = new Date(yearSel.value, monthSel.value, 0).getDate();
    daySel.innerHTML = '';
    for (let d = 1; d <= days; d++) daySel.add(new Option(d, d));
  });

  ['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP','ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ']
    .forEach(type => mbtiSel.add(new Option(type, type)));
});