const grid = document.getElementById('crewGrid');
const emptyBox = document.getElementById('emptyBox');

function esc(s){ return (s??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

// 로그인 사용자(찜 저장에 필요)
let currentUser = null;
try { currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch {}

// crews
function loadCrews(){ try { return JSON.parse(localStorage.getItem('crews') || '[]'); } catch { return []; } }

// favorites: { [userId]: string[] }
function loadFavMap(){ try { return JSON.parse(localStorage.getItem('crewFavorites') || '{}'); } catch { return {}; } }
function saveFavMap(m){ localStorage.setItem('crewFavorites', JSON.stringify(m)); }
function getMyFavSet(){
  if (!currentUser?.id) return new Set();
  const m = loadFavMap();
  return new Set(m[currentUser.id] || []);
}
function toggleFav(crewId){
  if (!currentUser){ alert('로그인 후 이용해 주세요.'); return; }
  const m = loadFavMap();
  const arr = new Set(m[currentUser.id] || []);
  if (arr.has(crewId)) arr.delete(crewId); else arr.add(crewId);
  m[currentUser.id] = [...arr];
  saveFavMap(m);
  render(); // 즉시 갱신
}

// ===== 리뷰/평점 =====
function loadReviews(){ try { return JSON.parse(localStorage.getItem('crewReviews') || '{}'); } catch { return {}; } }
function getAvg(crewId){
  const map = loadReviews();
  const arr = map[crewId] || [];
  if (!arr.length) return { avg:0, cnt:0 };
  const sum = arr.reduce((s,r)=> s + Number(r.stars||0), 0);
  return { avg: +(sum/arr.length).toFixed(1), cnt: arr.length };
}
function starsHtml(avg){
  // 평균(0~5)을 ★★★★☆ 형식 + 숫자
  const full = Math.floor(avg);
  const half = avg - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half? '☆' : '') + '✩'.repeat(empty);
}

function render(){
  const crews = loadCrews();
  const favSet = getMyFavSet();

  // 정렬: 평균 평점 ↓ → 리뷰수 ↓ → 최신생성 ↓
  const withScore = crews.map(c=>{
    const {avg,cnt} = getAvg(c.id);
    return {...c, _avg:avg, _cnt:cnt};
  }).sort((a,b)=>{
    if (b._avg !== a._avg) return b._avg - a._avg;
    if (b._cnt !== a._cnt) return b._cnt - a._cnt;
    return (b.createdAt||0) - (a.createdAt||0);
  });

  if (!withScore.length){
    emptyBox.classList.remove('hidden');
    grid.innerHTML = '';
    return;
  }
  emptyBox.classList.add('hidden');

  grid.innerHTML = withScore.map(c=>{
    const isFav = favSet.has(c.id);
    const fee = c.fee ? String(c.fee) : '';
    const {avg,cnt} = getAvg(c.id);
    return `
      <article class="crew-card" data-id="${esc(c.id)}">
        <span class="badge">추천</span>
        <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${esc(c.id)}" aria-label="찜">${isFav ? '♥' : '♡'}</button>
        <img src="${esc(c.img || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop')}" alt="${esc(c.name||'Crew')}">
        <div class="body">
          <h3>${esc(c.name || '이름없음')}</h3>
          <div class="crew-meta">
            <span>${esc(c.hobby || '-')}</span>
            <span>${esc(c.loc || '-')}</span>
            <span>${esc(c.time || '-')}</span>
            <span>${c.members ? esc(String(c.members))+'명' : ''}</span>
          </div>
          <div class="crew-desc">${esc(c.desc || '')}</div>
          <div class="card-foot">
            <div class="stars" title="${avg}점">${starsHtml(avg)}<span class="count">(${cnt})</span></div>
            ${fee ? `<div class="price-pill">${esc(fee)}원</div>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // 하트 바인딩
  grid.querySelectorAll('.fav-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      toggleFav(id);
    });
  });

  // 카드 클릭 → 상세 페이지로 이동
  grid.querySelectorAll('.crew-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const id = card.getAttribute('data-id');
      // 상세는 기존 crew.html을 사용. 선택값을 pendingCrew에 심어서 넘김(현 구조 재사용):contentReference[oaicite:2]{index=2}
      const crews = loadCrews();
      const c = crews.find(x=>x.id===id);
      if (!c) return;

      localStorage.setItem('pendingCrew', JSON.stringify({
        selectedHobbies: [],
        chosenHobby: c.hobby || '',
        crewChoice: c
      }));
      location.href = '../Crew/crew.html';
    });
  });
}

render();
