const grid = document.getElementById('crewGrid');
const emptyBox = document.getElementById('emptyBox');

function esc(s){ return (s??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

function render(){
  let crews = [];
  try { crews = JSON.parse(localStorage.getItem('crews') || '[]'); } catch {}
  if (!crews.length) {
    emptyBox.classList.remove('hidden');
    grid.innerHTML = '';
    return;
  }
  emptyBox.classList.add('hidden');

  // 최신 생성 순
  crews.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));

  grid.innerHTML = crews.map(c=>`
    <article class="crew-card">
      <img src="${esc(c.img || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop')}" alt="${esc(c.name||'Crew')}" />
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
}

render();
