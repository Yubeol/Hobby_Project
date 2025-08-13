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

function render(){
  const crews = loadCrews().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const favSet = getMyFavSet();

  if (!crews.length){
    emptyBox.classList.remove('hidden');
    grid.innerHTML = '';
    return;
  }
  emptyBox.classList.add('hidden');

  grid.innerHTML = crews.map(c=>{
    const isFav = favSet.has(c.id);
    return `
      <article class="crew-card">
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
}

render();
