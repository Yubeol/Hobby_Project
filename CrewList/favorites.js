const grid = document.getElementById('favGrid');
const empty = document.getElementById('emptyFav');

function esc(s){ return (s??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

let currentUser = null;
try { currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch {}

// 비로그인 접근 차단
if (!currentUser) {
  alert('로그인 후 이용해 주세요.');
  location.replace('../main.html');
}

function loadCrews(){ try { return JSON.parse(localStorage.getItem('crews') || '[]'); } catch { return []; } }
function loadFavMap(){ try { return JSON.parse(localStorage.getItem('crewFavorites') || '{}'); } catch { return {}; } }
function saveFavMap(m){ localStorage.setItem('crewFavorites', JSON.stringify(m)); }

function render(){
  const all = loadCrews().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const favMap = loadFavMap();
  const mine = new Set(favMap[currentUser.id] || []);
  const list = all.filter(c => mine.has(c.id));

  if (!list.length){
    empty.classList.remove('hidden');
    grid.innerHTML = '';
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = list.map(c=>`
    <article class="crew-card">
      <button class="fav-btn active" data-id="${esc(c.id)}" aria-label="찜 해제">♥</button>
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
  `).join('');

  // 찜 해제
  grid.querySelectorAll('.fav-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const m = loadFavMap();
      const set = new Set(m[currentUser.id] || []);
      set.delete(id);
      m[currentUser.id] = [...set];
      saveFavMap(m);
      render();
    });
  });
}

render();
