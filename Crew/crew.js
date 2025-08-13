// ===================== 기존 로직 (그대로 유지) =====================
// pendingCrew 에 저장된 데이터로 페이지 채우기
const pending = JSON.parse(localStorage.getItem('pendingCrew') || 'null');

const $ = (id) => document.getElementById(id);
const img = $('crewImg'), nm = $('crewName'), hb = $('crewHobby'),
      tm = $('crewTime'), lc = $('crewLoc'), mb = $('crewMembers'),
      desc = $('crewDesc');

if (!pending || !pending.crewChoice) {
  // 직접 접근 시 메인으로
  location.replace('../main.html');
} else {
  const c = pending.crewChoice;
  img.src = c.img || '';
  nm.textContent = c.name || '-';
  hb.textContent = pending.chosenHobby || '-';
  tm.textContent = c.time || '-';
  lc.textContent = c.loc || '-';
  mb.textContent = (c.members ? `${c.members}명` : '-') ;
  desc.textContent = c.desc || '즐겁게 함께하는 소모임입니다.';
}

// 요소
const confirmModal = $('confirmModal');
const doneModal    = $('doneModal');
const applyBtn     = $('applyBtn');
const confirmOk    = $('confirmOk');
const confirmCancel= $('confirmCancel');
const doneOk       = $('doneOk');
const joinSubmit   = $('joinSubmit');
const leaveBtn     = $('leaveBtn');

// 도우미
const open  = (m)=>{ m.hidden = false; };
const close = (m)=>{ m.hidden = true;  };

// 1) 참가 신청 버튼 → 확인 모달
applyBtn?.addEventListener('click', ()=> open(confirmModal));
// (가입 정보 카드) 가입 신청 버튼도 동일 동작
joinSubmit?.addEventListener('click', ()=> open(confirmModal));

// 2) 확인 모달에서 확인 → 완료 모달
confirmOk?.addEventListener('click', ()=>{
  close(confirmModal);
  open(doneModal);
});
// 2-1) 확인 모달에서 취소 → 닫기
confirmCancel?.addEventListener('click', ()=> close(confirmModal));

// 3) 완료 모달의 확인 → 데이터 저장 & 메인으로
function completeJoin() {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  if (currentUser) {
    currentUser.hobbyCompleted = true;
    if (Array.isArray(pending.selectedHobbies)) currentUser.hobbies = pending.selectedHobbies;
    if (pending.chosenHobby) currentUser.chosenHobby = pending.chosenHobby;
    currentUser.crewChoice = pending.crewChoice;

    const i = users.findIndex(u => u.id === currentUser.id);
    if (i !== -1) users[i] = currentUser;

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }
  localStorage.removeItem('pendingCrew'); // 사용 끝
  location.replace('../main.html');
}
doneOk?.addEventListener('click', completeJoin);

// 4) 나가기 → 신청하지 않고 메인으로 복귀
leaveBtn?.addEventListener('click', () => {
  localStorage.removeItem('pendingCrew');
  location.replace('../main.html');
});

// ===================== 여기까지가 기존 코드 =====================


// ===================== 추가: 승인요청형 신청 흐름 =====================

// 추가 모달/요소
const applicationModal = document.getElementById('applicationModal');
const doneReceiveModal = document.getElementById('doneReceiveModal');
const applyTitle  = document.getElementById('applyTitle');
const applyBank   = document.getElementById('applyBank');
const applyReason = document.getElementById('applyReason');
const applicationSubmit = document.getElementById('applicationSubmit');
const applicationCancel = document.getElementById('applicationCancel');
const doneReceiveOk = document.getElementById('doneReceiveOk');

const manageSection = document.getElementById('manageSection');
const manageTableBody = document.querySelector('#manageTable tbody');

// 동일 크루 식별키
const crew = pending?.crewChoice || null;
const crewKey = crew ? [crew.name, crew.loc, crew.time].join('|') : '';

// localStorage 유틸
const LS = {
  getUsers(){ try { return JSON.parse(localStorage.getItem('users')||'[]'); } catch { return []; } },
  setUsers(v){ localStorage.setItem('users', JSON.stringify(v)); },
  getMe(){ try { return JSON.parse(localStorage.getItem('currentUser')||'null'); } catch { return null; } },
  setMe(v){ localStorage.setItem('currentUser', JSON.stringify(v)); },
  getApps(){ try { return JSON.parse(localStorage.getItem('crewApplications')||'[]'); } catch { return []; } },
  setApps(v){ localStorage.setItem('crewApplications', JSON.stringify(v)); },
};

// (중요) 기존 클릭을 '캡처 단계'에서 가로채서 신청서 모달을 먼저 띄움
function interceptAndOpenForm(e){
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();
  // 혹시 기존 confirm 모달이 열렸다면 닫기
  try { const c = document.getElementById('confirmModal'); if (c) c.hidden = true; } catch {}
  if (applicationModal) applicationModal.hidden = false;
}
applyBtn?.addEventListener('click', interceptAndOpenForm, true);   // capture=true
joinSubmit?.addEventListener('click', interceptAndOpenForm, true); // capture=true

// 신청 저장(대기 상태)
applicationSubmit?.addEventListener('click', ()=>{
  const me = LS.getMe();
  if (!me) { alert('로그인이 필요합니다.'); return; }

  const title  = (applyTitle?.value||'').trim();
  const bank   = (applyBank?.value||'').trim();
  const reason = (applyReason?.value||'').trim();

  if (!title || !reason) { alert('제목과 가입 사유/자기소개를 입력해주세요.'); return; }

  // 중복 대기 신청 방지
  const apps = LS.getApps();
  const dup = apps.some(a => a.crewKey===crewKey && a.applicantId===me.id && a.status==='pending');
  if (dup) { alert('이미 대기 중인 신청이 있습니다.'); return; }

  apps.push({
    id: 'app_' + Date.now(),
    crewKey,
    crewName: crew?.name || '',
    applicantId: me.id,
    title, bank, reason,
    createdAt: new Date().toISOString(),
    status: 'pending'
  });
  LS.setApps(apps);

  // 입력값 리셋 및 안내
  if (applyTitle) applyTitle.value='';
  if (applyBank) applyBank.value='';
  if (applyReason) applyReason.value='';
  if (applicationModal) applicationModal.hidden = true;
  if (doneReceiveModal) doneReceiveModal.hidden = false;
});

// 접수 안내 확인 → 메인으로(확정 저장 없음)
doneReceiveOk?.addEventListener('click', ()=>{
  localStorage.removeItem('pendingCrew');
  location.replace('../main.html');
});
applicationCancel?.addEventListener('click', ()=> applicationModal && (applicationModal.hidden = true));

// ====== (크루장 전용) 신청 관리 ======
// 규칙: 아이디가 'leader'면 크루장
const me = LS.getMe();
const isLeader = !!me && me.id === 'leader';

function esc(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function badge(status){ return ({pending:'대기중', approved:'승인', rejected:'거절'})[status] || status; }

function renderManage(){
  if (!isLeader || !manageSection) return;
  manageSection.hidden = false;
  const rows = LS.getApps()
    .filter(a => a.crewKey === crewKey)
    .sort((a,b)=> a.status.localeCompare(b.status));

  manageTableBody.innerHTML = rows.map(a=>`
    <tr data-id="${a.id}">
      <td>${a.applicantId}</td>
      <td>${esc(a.title)}</td>
      <td style="white-space:pre-wrap">${esc(a.reason)}</td>
      <td>${badge(a.status)}</td>
      <td class="actions">
        <button class="primary" data-act="approve">승인</button>
        <button class="ghost"   data-act="reject">거절</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="5">신청이 없습니다.</td></tr>`;
}

manageTableBody?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const tr = btn.closest('tr');
  const id = tr?.dataset.id;
  const act = btn.dataset.act;

  const apps = LS.getApps();
  const app = apps.find(a => a.id === id);
  if (!app) return;

  if (act === 'approve') {
    app.status = 'approved';
    // 승인되면 해당 유저 프로필에 crewChoice 반영 (기존 구조 준수)
    const users = LS.getUsers();
    const i = users.findIndex(u => u.id === app.applicantId);
    if (i !== -1) {
      users[i].crewChoice = crew;
      users[i].hobbyCompleted = true;
      LS.setUsers(users);
      if (LS.getMe()?.id === app.applicantId) {
        const cur = LS.getMe(); cur.crewChoice = crew; cur.hobbyCompleted = true; LS.setMe(cur);
      }
    }
  } else if (act === 'reject') {
    app.status = 'rejected';
  }
  LS.setApps(apps);
  renderManage();
});

if (isLeader) renderManage();
