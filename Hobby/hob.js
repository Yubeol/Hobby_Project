const firstPage = document.getElementById('firstPage');
const recommendHobbyPage = document.getElementById('recommendHobbyPage');
const toRecommendHobbyBtn = document.getElementById('toRecommendHobbyBtn');

toRecommendHobbyBtn.addEventListener('click', () => {
  // 체크박스 값 읽고 필요한 작업 가능 (선택한 취미 체크 등)
  const selectedHobbies = [...document.querySelectorAll('input[name="hobby"]:checked')].map(el => el.value);
  if(selectedHobbies.length === 0) {
    alert('최소 하나 이상의 취미를 선택해주세요.');
    return;
  }

  // 화면 전환
  firstPage.classList.add('hidden');
  recommendHobbyPage.classList.remove('hidden');
});