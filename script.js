// Router SPA
function navigateTo(page, params = {}) {
  window.location.hash = page;
  renderPage(page, params);
}

window.onhashchange = () => {
  const route = window.location.hash.slice(1) || 'home';
  renderPage(route);
};

// Fungsi render halaman
async function renderPage(route, params = {}) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));

  switch (route) {
    case 'home':
      document.getElementById('home-page').classList.add('active');
      await loadHomePage();
      break;
    case 'ongoing':
      document.getElementById('ongoing-page').classList.add('active');
      await loadOngoingPage();
      break;
    case 'completed':
      document.getElementById('completed-page').classList.add('active');
      await loadCompletedPage();
      break;
    case 'schedule':
      document.getElementById('schedule-page').classList.add('active');
      await loadSchedulePage();
      break;
    case 'detail':
      document.getElementById('detail-page').classList.add('active');
      await loadDetailPage(params.slug);
      break;
    case 'watch':
      document.getElementById('watch-page').classList.add('active');
      await loadWatchPage(params.slug);
      break;
    default:
      document.getElementById('home-page').classList.add('active');
      await loadHomePage();
  }
}

// Fungsi untuk masing-masing halaman
async function loadHomePage() {
  try {
    const res = await fetch('https://www.sankavollerei.com/anime/oploverz/home?page=1');
    const data = await res.json();
    const container = document.querySelector('#home-page');
    const animeList = data.anime_list || [];
    const banner = animeList[0];

    container.innerHTML = `
      <section class="hero">
        <img src="${banner?.poster || 'https://via.placeholder.com/1200x400'}" alt="${banner?.title || 'Banner'}" />
        <div class="hero-overlay">
          <h1>${banner?.title || 'Anime Terpopuler'}</h1>
          <button class="btn-watch" onclick="navigateTo('detail', { slug: '${banner?.slug}' })">Tonton Sekarang</button>
        </div>
      </section>
      <section class="content-section">
        <h2>Terbaru</h2>
        <div class="anime-grid">${generateAnimeCards(animeList)}</div>
      </section>
    `;
  } catch (e) { console.error("Error loading home: ", e); }
}

async function loadOngoingPage() {
  try {
    const res = await fetch('https://www.sankavollerei.com/anime/oploverz/ongoing?page=1');
    const data = await res.json();
    const container = document.querySelector('#ongoing-page');
    const animeList = data.anime_list || [];

    container.innerHTML = `
      <h2>Anime Sedang Tayang</h2>
      <div class="anime-grid">${generateAnimeCards(animeList)}</div>
    `;
  } catch (e) { console.error("Error loading ongoing: ", e); }
}

async function loadCompletedPage() {
  try {
    const res = await fetch('https://www.sankavollerei.com/anime/oploverz/completed?page=1');
    const data = await res.json();
    const container = document.querySelector('#completed-page');
    const animeList = data.anime_list || [];

    container.innerHTML = `
      <h2>Anime Sudah Tamat</h2>
      <div class="anime-grid">${generateAnimeCards(animeList)}</div>
    `;
  } catch (e) { console.error("Error loading completed: ", e); }
}

async function loadSchedulePage() {
  try {
    const res = await fetch('https://www.sankavollerei.com/anime/oploverz/schedule');
    const data = await res.json();
    const container = document.querySelector('#schedule-page');

    let html = '<h2>Jadwal Rilis Anime</h2>';

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    days.forEach((day, i) => {
      if (data.schedule[day]?.length) {
        html += `<h3>${dayNames[i]}</h3><ul>`;
        data.schedule[day].forEach(a => {
          html += `<li onclick="navigateTo('detail', { slug: '${a.slug}' })" style="cursor:pointer; padding: 0.5rem 0;">${a.title} (${a.episode_info})</li>`;
        });
        html += '</ul>';
      }
    });

    container.innerHTML = html;
  } catch (e) { console.error("Error loading schedule: ", e); }
}

async function loadDetailPage(slug) {
  try {
    const res = await fetch(`https://www.sankavollerei.com/anime/oploverz/anime/${slug}`);
    const data = await res.json();

    if (data.status !== "success") {
      document.getElementById('detail-page').innerHTML = "<h2>Anime tidak ditemukan.</h2>";
      return;
    }

    const anime = data.detail;
    const genres = anime.genres.map(g => g.name).join(", ");
    const episodes = anime.episode_list.map(ep => {
      return `<li onclick="navigateTo('watch', { slug: '${ep.slug}' })">${ep.title}</li>`;
    }).join("");

    document.getElementById('detail-page').innerHTML = `
      <div style="display:flex; gap: 1rem; margin-bottom: 2rem;">
        <img src="${anime.poster}" alt="${anime.title}" style="width:200px; max-height: 300px;" />
        <div>
          <h1>${anime.title}</h1>
          <p><strong>Status:</strong> ${anime.info.status}</p>
          <p><strong>Studio:</strong> ${anime.info.studio || '-'}</p>
          <p><strong>Durasi:</strong> ${anime.info.duration}</p>
          <p><strong>Tipe:</strong> ${anime.info.type}</p>
          <p><strong>Genre:</strong> ${genres}</p>
          <p><strong>Sinopsis:</strong> ${anime.synopsis}</p>
        </div>
      </div>
      <h3>Daftar Episode</h3>
      <ul>
        ${episodes}
      </ul>
    `;
  } catch (e) {
    console.error("Error loading detail: ", e);
    document.getElementById('detail-page').innerHTML = "<h2>Error memuat detail anime.</h2>";
  }
}

async function loadWatchPage(slug) {
  try {
    // Ambil detail episode untuk stream
    const resEpisode = await fetch(`https://www.sankavollerei.com/anime/oploverz/episode/${slug}`);
    const dataEpisode = await resEpisode.json();

    if (dataEpisode.status !== "success") {
      document.getElementById('watch-page').innerHTML = `<h2>Episode tidak ditemukan.</h2>`;
      return;
    }

    // Tebak slug anime dari slug episode
    const animeSlug = slug.split('-episode-')[0];
    // Ambil detail anime untuk daftar episode dan poster
    const resAnime = await fetch(`https://www.sankavollerei.com/anime/oploverz/anime/${animeSlug}`);
    const dataAnime = await resAnime.json();

    if (dataAnime.status !== "success") {
      document.getElementById('watch-page').innerHTML = `<h2>Anime tidak ditemukan.</h2>`;
      return;
    }

    const streamUrl = dataEpisode.streams[0]?.url || '#';
    const title = dataEpisode.episode_title;
    const poster = dataAnime.detail?.poster;

    // Generate daftar episode
    const episodes = dataAnime.detail?.episode_list || [];
    const episodeListHtml = episodes.map(ep => {
      return `<li><a href="#" onclick="event.preventDefault(); navigateTo('watch', { slug: '${ep.slug}' });">${ep.title}</a></li>`;
    }).join('');

    document.getElementById('watch-page').innerHTML = `
      <div style="display:flex; gap: 1rem; align-items: flex-start;">
        <img src="${poster}" alt="Poster" style="width:120px; border-radius: 4px;" />
        <div>
          <h1>${title}</h1>
        </div>
      </div>
      <div style="margin: 1rem 0;">
        <iframe src="${streamUrl}" width="100%" height="500px" frameborder="0" allowfullscreen></iframe>
      </div>
      <h3>Daftar Episode</h3>
      <ul style="list-style-type: none; padding: 0;">
        ${episodeListHtml}
      </ul>
    `;
  } catch (e) {
    console.error("Error loading watch: ", e);
    document.getElementById('watch-page').innerHTML = `<h2>Error memuat episode.</h2>`;
  }
}

function generateAnimeCards(animes, useUrl = false) {
  return animes.map(a => {
    const onClickAction = useUrl
      ? `window.open('${a.oploverz_url}', '_blank')`
      : `navigateTo('detail', { slug: '${a.slug}' })`;

    return `
      <div class="anime-card" onclick="${onClickAction}">
        <img src="${a.poster}" alt="${a.title}">
        <h3>${a.title}</h3>
        <p>Ep ${a.episode || '?'} • ${a.status || a.type}</p>
      </div>
    `;
  }).join('');
}

// Event Listener untuk pencarian
const searchInput = document.querySelector('.search-box');
searchInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      const res = await fetch(`https://www.sankavollerei.com/anime/oploverz/search/${encodeURIComponent(query)}`);
      const data = await res.json();

      const container = document.querySelector('#home-page');
      container.innerHTML = `<h2>Hasil Pencarian untuk: "${query}"</h2><div class="anime-grid">${generateAnimeCards(data.anime_list, true)}</div>`;
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('home-page').classList.add('active');
    } catch (err) {
      console.error("Error searching:", err);
    }
  }
});

// Inisialisasi halaman pertama kali
document.addEventListener("DOMContentLoaded", () => {
  const initialRoute = window.location.hash.slice(1) || 'home';
  renderPage(initialRoute);

  // Tambahkan event listener ke navbar
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = e.target.getAttribute('href').slice(1);
      navigateTo(target);
    });
  });

  // Toggle search box
  const searchBtn = document.querySelector('.search-btn');
  const searchBox = document.querySelector('.search-box');

  searchBtn.addEventListener('click', () => {
    searchBox.classList.toggle('active');
    if (searchBox.classList.contains('active')) {
      searchBox.focus();
    }
  });
});
