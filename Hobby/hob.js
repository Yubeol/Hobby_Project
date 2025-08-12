// STEP 전환
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const nextBtn = document.getElementById('nextBtn');

nextBtn.addEventListener('click', () => {
  const selected = [...document.querySelectorAll('input[name="hobby"]:checked')];
  if (selected.length === 0) {
    alert('한 가지 이상 선택해주세요!');
    return;
  }
  step1.classList.add('hidden');
  step2.classList.remove('hidden');
});

// 추천 카드 클릭 → 부모에게 완료 신호
const recommendList = document.querySelector('.recommend-list');
recommendList.addEventListener('click', (e) => {
  const card = e.target.closest('.recommend-item');
  if (!card) return;

  const chosen = card.dataset.hobby;
  const selected = [...document.querySelectorAll('input[name="hobby"]:checked')].map(el => el.value);

  window.parent.postMessage({
    type: 'HOBBY_DONE',
    selectedHobbies: selected,
    chosenHobby: chosen
  }, '*');
});
