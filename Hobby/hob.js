// ====== STEP 참조 ======
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const nextBtn = document.getElementById('nextBtn');

const recommendList = document.querySelector('.recommend-list');
const crewList = document.getElementById('crewList');
const skipCrew = document.getElementById('skipCrew');

// ====== STEP1 → STEP2 (★ 누락되어 있던 부분 추가) ======
nextBtn?.addEventListener('click', () => {
  const selected = document.querySelectorAll('input[name="hobby"]:checked');
  if (selected.length === 0) {
    alert('한 가지 이상 선택해주세요!');
    return;
  }
  step1.classList.add('hidden');
  step2.classList.remove('hidden');
});

// 부모(main)에서 "RESET_HOBBY" 메시지를 받으면 Step1로 초기화
window.addEventListener('message', (e) => {
  if (e?.data?.type !== 'RESET_HOBBY') return;

  // 선택 초기화
  document.querySelectorAll('input[name="hobby"]').forEach(el => el.checked = false);

  // 화면 상태 초기화
  step1.classList.remove('hidden');
  step2.classList.add('hidden');
  step3.classList.add('hidden');

  // 크루 목록/선택 초기화
  if (crewList) {
    crewList.innerHTML = '';
    delete crewList.dataset.hobby;
  }
});

// ====== 취미별 더미 크루 데이터 ======
const crewData = {
  '드로잉/페인팅': [
    { name:'주말 드로잉 모임', loc:'홍대', time:'토 14:00', members:27,
      img:'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop' },
    { name:'퇴근 후 수채화', loc:'강남', time:'수 19:30', members:18,
      img:'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=600&auto=format&fit=crop' }
  ],
  '검도': [
    { name:'초보 검도 크루', loc:'신촌', time:'화·목 20:00', members:16,
      img:'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=600&auto=format&fit=crop' }
  ],
  '기타 연주': [
    { name:'버스킹 준비반', loc:'건대', time:'토 15:00', members:23,
      img:'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop' }
  ],
  '등산': [
    { name:'새벽 북한산 번개', loc:'북한산', time:'일 06:00', members:41,
      img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop' }
  ],
  '보드게임': [
    { name:'토요 보드게임', loc:'합정', time:'토 18:00', members:32,
      img:'https://images.unsplash.com/photo-1523875194681-bedd468c58bf?q=80&w=600&auto=format&fit=crop' }
  ]
};

// ====== 크루 리스트 렌더 ======
function renderCrewList(hobby){
  const list = crewData[hobby] || [];
  crewList.dataset.hobby = hobby;
  crewList.innerHTML = list.length ? list.map((c, i) => `
    <li class="crew-card">
      <img src="${c.img}" alt="">
      <div class="crew-info">
        <h3>${c.name}</h3>
        <div class="crew-meta">${c.loc} · ${c.time} · ${c.members}명</div>
        <button class="crew-join" data-idx="${i}">참여하기</button>
      </div>
    </li>
  `).join('') : `
    <li class="crew-card"><div class="crew-info">
      <h3>아직 등록된 크루가 없어요</h3>
      <div class="crew-meta">곧 준비할게요!</div>
    </div></li>`;
}

// ====== STEP2: 추천 취미 클릭 → STEP3 ======
recommendList?.addEventListener('click', (e) => {
  const card = e.target.closest('.recommend-item');
  if (!card) return;
  const chosen = card.dataset.hobby;

  renderCrewList(chosen);
  step2.classList.add('hidden');
  step3.classList.remove('hidden');
});

// ====== STEP3: 참여하기 → 부모에 완료 신호 ======
crewList?.addEventListener('click', (e) => {
  const btn = e.target.closest('.crew-join');
  if (!btn) return;

  const hobby = crewList.dataset.hobby || '';
  const idx = Number(btn.dataset.idx);
  const choice = (crewData[hobby] || [])[idx] || null;

  const selected = [...document.querySelectorAll('input[name="hobby"]:checked')]
                    .map(el => el.value);

  window.parent.postMessage({
    type: 'HOBBY_DONE',
    selectedHobbies: selected,
    chosenHobby: hobby,
    crewChoice: choice
  }, '*');
});

// ====== STEP3: 나중에 하기 ======
skipCrew?.addEventListener('click', () => {
  const hobby = crewList.dataset.hobby || '';
  const selected = [...document.querySelectorAll('input[name="hobby"]:checked')]
                    .map(el => el.value);

  window.parent.postMessage({
    type: 'HOBBY_DONE',
    selectedHobbies: selected,
    chosenHobby: hobby,
    crewChoice: null
  }, '*');
});
