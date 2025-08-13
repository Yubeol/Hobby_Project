/* ===== 공통 유틸 ===== */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function esc(s){ return (s??'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function fmt(ts){
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const da= String(d.getDate()).padStart(2,'0');
  const hh= String(d.getHours()).padStart(2,'0');
  const mm= String(d.getMinutes()).padStart(2,'0');
  return `${y}-${m}-${da} ${hh}:${mm}`;
}

/* ===== 로컬스토리지 스토어 ===== */
const store = {
  key: 'posts',
  load(){ try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; } },
  save(arr){ localStorage.setItem(this.key, JSON.stringify(arr)); },
  nextId(){ return 'p_' + Date.now(); }
};

/* ===== 상태 ===== */
let BOARD = 'free';
let PAGE = 1;
const PAGE_SIZE = 8;
let CURRENT_ID = null;        // 상세/수정/삭제 대상
let currentUser = null;
try { currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch {}

/* ===== DOM ===== */
const tabBtns = $$('.tab[data-board]');
const postRows = $('#postRows');
const pageInfo = $('#pageInfo');
const prevPage = $('#prevPage');
const nextPage = $('#nextPage');
const postWrite = $('#postWrite');

const postList   = $('#postList');
const postDetail = $('#postDetail');

const dTitle  = $('#dTitle');
const dAuthor = $('#dAuthor');
const dTime   = $('#dTime');
const dViews  = $('#dViews');
const dBody   = $('#dBody');
const postEdit   = $('#postEdit');
const postDelete = $('#postDelete');
const postClose  = $('#postClose');

const postModal  = $('#postModal');
const mTitle     = $('#mTitle');
const mInputTitle= $('#mInputTitle');
const mInputBody = $('#mInputBody');
const mCancel    = $('#mCancel');
const mSave      = $('#mSave');

const confirmDelete = $('#confirmDelete');
const delNo = $('#delNo');
const delYes= $('#delYes');

/* ===== 탭 전환 ===== */
tabBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    tabBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    BOARD = btn.dataset.board;
    PAGE = 1;
    renderList();
  });
});

/* ===== 목록 렌더 ===== */
function renderList(){
  postDetail.classList.add('hidden');
  postList.classList.remove('hidden');

  const all = store.load()
    .filter(p=>p.board===BOARD)
    .sort((a,b)=> b.createdAt - a.createdAt);

  const totalPage = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  PAGE = Math.min(PAGE, totalPage);
  pageInfo.textContent = `${PAGE} / ${totalPage}`;
  prevPage.disabled = PAGE<=1;
  nextPage.disabled = PAGE>=totalPage;

  const items = all.slice((PAGE-1)*PAGE_SIZE, PAGE*PAGE_SIZE);

  postRows.innerHTML = items.map((p,idx)=>`
    <div class="list-row" data-id="${p.id}">
      <span class="col-no">${(PAGE-1)*PAGE_SIZE + idx + 1}</span>
      <span class="col-title">${esc(p.title)}</span>
      <span class="col-author">${esc(p.authorId || '익명')}</span>
      <span class="col-time">${fmt(p.createdAt)}</span>
      <span class="col-views">${p.views ?? 0}</span>
    </div>
  `).join('') || `<div style="padding:18px;color:#888">게시글이 없습니다. 첫 글을 작성해보세요.</div>`;
}

prevPage?.addEventListener('click', ()=>{ if(PAGE>1){ PAGE--; renderList(); } });
nextPage?.addEventListener('click', ()=>{ PAGE++; renderList(); });

/* ===== 상세 보기 ===== */
postRows?.addEventListener('click', (e)=>{
  const row = e.target.closest('.list-row');
  if(!row) return;
  openDetail(row.dataset.id);
});

function openDetail(id){
  const all = store.load();
  const p = all.find(x=>x.id===id);
  if(!p) return;

  CURRENT_ID = id;

  // 조회수 +1
  p.views = (p.views||0) + 1;
  store.save(all);

  dTitle.textContent  = p.title || '-';
  dAuthor.textContent = p.authorId || '익명';
  dTime.textContent   = fmt(p.createdAt);
  dViews.textContent  = p.views || 0;
  dBody.textContent   = p.body || '';

  postList.classList.add('hidden');
  postDetail.classList.remove('hidden');
}

/* ===== 글쓰기/수정 모달 ===== */
postWrite?.addEventListener('click', ()=>{
  if(!currentUser){ alert('로그인이 필요합니다. (상단 메뉴에서 로그인)'); return; }
  CURRENT_ID = null;
  mTitle.textContent = '글 쓰기';
  mInputTitle.value = '';
  mInputBody.value = '';
  postModal.hidden = false;
});

postEdit?.addEventListener('click', ()=>{
  if(!CURRENT_ID) return;
  const all = store.load();
  const p = all.find(x=>x.id===CURRENT_ID);
  if(!p) return;

  // 작성자만 수정 가능(간단 체크)
  if(currentUser?.id && p.authorId && currentUser.id !== p.authorId){
    alert('작성자만 수정할 수 있습니다.');
    return;
  }

  mTitle.textContent = '글 수정';
  mInputTitle.value = p.title || '';
  mInputBody.value  = p.body || '';
  postModal.hidden = false;
});

mCancel?.addEventListener('click', ()=> postModal.hidden = true);

mSave?.addEventListener('click', ()=>{
  const title = mInputTitle.value.trim();
  const body  = mInputBody.value.trim();
  if(!title || !body){ alert('제목과 내용을 모두 입력해주세요.'); return; }

  const all = store.load();

  if(CURRENT_ID){ // 수정
    const p = all.find(x=>x.id===CURRENT_ID);
    if(!p) return;
    // 작성자만 수정 허용
    if(currentUser?.id && p.authorId && currentUser.id !== p.authorId){
      alert('작성자만 수정할 수 있습니다.');
      return;
    }
    p.title = title;
    p.body  = body;
  }else{          // 신규
    const newPost = {
      id: store.nextId(),
      board: BOARD,
      title, body,
      authorId: currentUser?.id || '익명',
      createdAt: Date.now(),
      views: 0
    };
    all.push(newPost);
  }

  store.save(all);
  postModal.hidden = true;
  postDetail.classList.add('hidden');
  postList.classList.remove('hidden');
  renderList();
});

/* ===== 삭제 ===== */
postDelete?.addEventListener('click', ()=>{
  if(!CURRENT_ID) return;
  const all = store.load();
  const p = all.find(x=>x.id===CURRENT_ID);
  if(!p) return;

  // 작성자만 삭제 가능
  if(currentUser?.id && p.authorId && currentUser.id !== p.authorId){
    alert('작성자만 삭제할 수 있습니다.');
    return;
  }
  confirmDelete.hidden = false;
});

delNo?.addEventListener('click', ()=> confirmDelete.hidden = true);
delYes?.addEventListener('click', ()=>{
  if(!CURRENT_ID) return;
  let all = store.load();
  all = all.filter(x=>x.id !== CURRENT_ID);
  store.save(all);
  confirmDelete.hidden = true;
  postDetail.classList.add('hidden');
  postList.classList.remove('hidden');
  renderList();
});

/* ===== 목록으로 ===== */
postClose?.addEventListener('click', ()=>{
  postDetail.classList.add('hidden');
  postList.classList.remove('hidden');
});

/* ===== 초기 렌더 ===== */
renderList();
