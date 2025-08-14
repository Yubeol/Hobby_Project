// ===== 로그인 회원만 접근 =====
let currentUser = null;
try { currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch {}
if (!currentUser) {
  alert('로그인한 회원만 크루를 만들 수 있습니다.');
  // 필요하면 로그인 화면으로 바꾸세요. (예: ../main.html에서 "로그인" 클릭 후 작성)
  location.replace('../main.html');
}

// ===== 데이터 스토어 =====
const store = {
  key: 'crews',
  load() {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); }
    catch { return []; }
  },
  save(arr) {
    localStorage.setItem(this.key, JSON.stringify(arr));
  },
  nextId() { return 'crew_' + Date.now(); }
};

// ===== DOM =====
const pageTitle = document.getElementById('pageTitle');
const form = document.getElementById('crewForm');

const nameEl    = document.getElementById('name');
const hobbyEl   = document.getElementById('hobby');
const timeEl    = document.getElementById('time');
const locEl     = document.getElementById('loc');
const membersEl = document.getElementById('members');
const imgEl     = document.getElementById('img');
const descEl    = document.getElementById('desc');

const previewImg = document.getElementById('previewImg');
const cancelBtn  = document.getElementById('cancelBtn');

// 이미지 미리보기
imgEl?.addEventListener('input', () => {
  const url = imgEl.value.trim();
  if (url) {
    previewImg.src = url;
    previewImg.style.display = 'block';
  } else {
    previewImg.removeAttribute('src');
    previewImg.style.display = 'none';
  }
});

// ===== 수정 모드 지원: ?id=crew_xxx =====
const editId = new URL(location.href).searchParams.get('id');
if (editId) {
  pageTitle.textContent = '크루 수정';
  const crews = store.load();
  const data = crews.find(c => c.id === editId);
  if (data) {
    nameEl.value    = data.name    || '';
    hobbyEl.value   = data.hobby   || '';
    timeEl.value    = data.time    || '';
    locEl.value     = data.loc     || '';
    membersEl.value = data.members || '';
    imgEl.value     = data.img     || '';
    descEl.value    = data.desc    || '';
    if (data.img) {
      previewImg.src = data.img;
      previewImg.style.display = 'block';
    }
  }
}
const feeEl    = document.getElementById('fee');
const photosEl = document.getElementById('photos');

// 수정 모드 채우기
if (editId && data) {
  feeEl.value = data.fee || '';
  photosEl.value = Array.isArray(data.photos) ? data.photos.join(', ') : '';
}

// 저장 시
const fee    = feeEl.value.trim();
const photos = (photosEl.value||'').split(',').map(s=>s.trim()).filter(Boolean);

if (editId) {
  crews[i] = { ...crews[i], name, hobby, time, loc, members, img, desc, fee, photos,
    updatedAt: Date.now(), updatedBy: currentUser?.id || 'member' };
} else {
  const newCrew = { id: store.nextId(), name, hobby, time, loc, members, img, desc, fee, photos,
    createdAt: Date.now(), createdBy: currentUser?.id || 'member' };
  crews.push(newCrew);
}


// 취소: 뒤로 가기(없으면 목록으로)
cancelBtn?.addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.replace('../CrewList/crewList.html');
});

// 저장
form?.addEventListener('submit', (e) => {
  e.preventDefault();

  const name    = nameEl.value.trim();
  const hobby   = hobbyEl.value.trim();
  const time    = timeEl.value.trim();
  const loc     = locEl.value.trim();
  const members = Number(membersEl.value || 0);
  const img     = imgEl.value.trim();
  const desc    = descEl.value.trim();

  if (!name) { alert('크루명을 입력해주세요.'); return; }

  const crews = store.load();

  if (editId) {
    const i = crews.findIndex(c => c.id === editId);
    if (i !== -1) {
      crews[i] = {
        ...crews[i],
        name, hobby, time, loc, members, img, desc,
        updatedAt: Date.now(),
        updatedBy: currentUser?.id || 'member'
      };
    }
    store.save(crews);
    alert('크루가 수정되었습니다.');
  } else {
    const newCrew = {
      id: store.nextId(),
      name, hobby, time, loc, members, img, desc,
      createdAt: Date.now(),
      createdBy: currentUser?.id || 'member'
    };
    crews.push(newCrew);
    store.save(crews);
    alert('크루가 생성되었습니다.');
  }

  // 완료 후 목록으로 이동
  location.replace('../CrewList/crewList.html');
});

