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
