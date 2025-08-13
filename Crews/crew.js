// ===== 유틸 =====
const $ = (sel, root=document) => root.querySelector(sel);
function getQuery(key){ return new URL(location.href).searchParams.get(key); }
function toast(msg){ alert(msg); } // 필요하면 토스트로 교체

// ===== 권한 체크: id === 'leader' 만 접근 가능(원하면 조건 바꾸세요) =====
let currentUser = null;
try { currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch {}
const isLeader = !!currentUser && currentUser.id === 'leader';
if (!isLeader) {
  alert('크루 만들기는 관리자(leader)만 가능합니다.');
  location.replace('../main.html');
}

// ===== 스토어 =====
const store = {
  key: 'crews',
  load(){ try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; } },
  save(v){ localStorage.setItem(this.key, JSON.stringify(v)); },
  nextId(){ return 'crew_' + Date.now(); }
};

// ===== DOM =====
const pageTitle = $('#pageTitle');
const form = $('#crewForm');
const nameEl = $('#name');
const hobbyEl = $('#hobby');
const timeEl = $('#time');
const locEl = $('#loc');
const membersEl = $('#members');
const imgEl = $('#img');
const descEl = $('#desc');
const previewImg = $('#previewImg');
const cancelBtn = $('#cancelBtn');

// 이미지 미리보기
imgEl.addEventListener('input', ()=>{
  const url = imgEl.value.trim();
  if (url) { previewImg.src = url; previewImg.style.display = 'block'; }
  else { previewImg.removeAttribute('src'); previewImg.style.display = 'none'; }
});

// 수정 모드: ?id=crew_xxx
const editId = getQuery('id');
if (editId) {
  pageTitle.textContent = '크루 수정';
  const list = store.load();
  const c = list.find(x => x.id === editId);
  if (c) {
    nameEl.value = c.name || '';
    hobbyEl.value = c.hobby || '';
    timeEl.value = c.time || '';
    locEl.value = c.loc || '';
    membersEl.value = c.members || '';
    imgEl.value = c.img || '';
    descEl.value = c.desc || '';
    if (c.img) { previewImg.src = c.img; previewImg.style.display='block'; }
  }
}

cancelBtn.addEventListener('click', ()=> history.length > 1 ? history.back() : location.replace('../main.html'));

// 저장
form.addEventListener('submit', (e)=>{
  e.preventDefault();

  const name = nameEl.value.trim();
  const hobby = hobbyEl.value.trim();
  const time = timeEl.value.trim();
  const loc = locEl.value.trim();
  const members = Number(membersEl.value || 0);
  const img = imgEl.value.trim();
  const desc = descEl.value.trim();

  if (!name) return toast('크루명을 입력해주세요.');

  const crews = store.load();

  if (editId) {
    const i = crews.findIndex(x => x.id === editId);
    if (i !== -1) {
      crews[i] = {
        ...crews[i],
        name, hobby, time, loc, members, img, desc,
        updatedAt: Date.now()
      };
    }
    store.save(crews);
    toast('크루가 수정되었습니다.');
  } else {
    const newCrew = {
      id: store.nextId(),
      name, hobby, time, loc, members, img, desc,
      createdAt: Date.now(),
      createdBy: currentUser?.id || 'leader'
    };
    crews.push(newCrew);
    store.save(crews);
    toast('크루가 생성되었습니다.');
  }

  // 완료 후 메인으로
  location.replace('../main.html');
});
