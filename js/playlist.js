const API_BASE_URL = 'https://enroy.onrender.com';
const globalAudio = new Audio();

const playerImg = document.getElementById('player-img');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerUploader = document.getElementById('player-uploader');
const playMainBtn = document.getElementById('player-play-btn');
const playerSeek = document.getElementById('player-seek');
const playerCurrentTime = document.getElementById('player-current-time');
const playerDuration = document.getElementById('player-duration');
const nextBtn = document.getElementById('player-next-btn');
const prevBtn = document.getElementById('player-prev-btn');
const repeatBtn = document.getElementById('player-repeat-btn');
const shuffleBtn = document.getElementById('player-shuffle-btn');

let allSongs = [];
let userPlaylists = [];
let currentQueue = [];
let currentSongIndex = -1;
let isShuffle = false;
let repeatMode = 0; // 0: Off, 1: List, 2: One

function checkIsAdmin(user) {
  if (!user) return false;
  return user.email === 'admin@gmail.com' || user.role === 'admin';
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function renderHeaderAuth() {
  const headerArea = document.getElementById('user-header-area');
  if (!headerArea) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    const isAdmin = checkIsAdmin(currentUser);
    headerArea.innerHTML = `
      <a href="upload.html" class="header__btn">
          Đăng nhạc <i class="ri-upload-2-line"></i>
      </a>
      <a href="profile.html" class="profile__user" style="text-decoration: none;">
          <span id="username">${currentUser.username || currentUser.email} ${isAdmin ? '<small style="color:#ff0055;">(Admin)</small>' : ''}</span>
          <img src="${currentUser.avatar || 'img/logo.png'}" alt="Profile" id="profile-picture">
      </a>
    `;
  } else {
    headerArea.innerHTML = `
      <a href="login.html" class="btn-auth btn-auth--login">Đăng nhập</a>
      <a href="signin.html" class="btn-auth btn-auth--signup">Đăng ký</a>
    `;
  }
}

async function initData() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/get-music`);
    allSongs = await res.json();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
      const username = currentUser.username || currentUser.email;
      const resPl = await fetch(`${API_BASE_URL}/api/get-user-playlists/${username}`);
      userPlaylists = await resPl.json();
    }

    checkUrlRoute();
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu:", err);
  }
}

function checkUrlRoute() {
  const params = new URLSearchParams(window.location.search);
  const playlistId = params.get('id');

  if (playlistId) {
    showPlaylistDetail(playlistId);
  } else {
    renderPlaylistsList();
  }
}

function renderPlaylistsList() {
  document.getElementById('playlists-list-view').style.display = 'block';
  document.getElementById('playlist-detail-view').style.display = 'none';

  const container = document.getElementById('my-playlists-grid');
  container.innerHTML = '';

  if (!Array.isArray(userPlaylists) || userPlaylists.length === 0) {
    container.innerHTML = '<p style="opacity:0.6; grid-column: 1/-1;">Chưa có Playlist nào.</p>';
    return;
  }

  userPlaylists.forEach(pl => {
    const songCount = pl.songIds ? pl.songIds.length : 0;
    const card = document.createElement('div');
    card.className = 'playlist-card-box';
    card.onclick = () => {
      window.history.pushState({}, '', `playlists.html?id=${pl.id}`);
      showPlaylistDetail(pl.id);
    };

    card.innerHTML = `
      <div>
        <h3 style="margin:0 0 6px 0; font-size:1.15rem; color:#fff;">${pl.name}</h3>
        <span style="font-size: 0.8rem; opacity: 0.6;">${pl.isPublic ? '<i class="fa-solid fa-globe"></i> Công khai' : '<i class="fa-solid fa-lock"></i> Riêng tư'}</span>
      </div>
      <p style="margin:0; font-size: 0.85rem; color: var(--muted);">${songCount} bài hát</p>
    `;
    container.appendChild(card);
  });
}

function showPlaylistDetail(playlistId) {
  const pl = userPlaylists.find(p => String(p.id) === String(playlistId));
  if (!pl) return renderPlaylistsList();

  document.getElementById('playlists-list-view').style.display = 'none';
  document.getElementById('playlist-detail-view').style.display = 'block';

  document.getElementById('detail-pl-title').innerText = pl.name;
  document.getElementById('detail-pl-author').innerText = pl.username;
  
  const songsInPlaylist = allSongs.filter(s => pl.songIds && pl.songIds.includes(s.id));
  document.getElementById('detail-pl-count').innerText = `${songsInPlaylist.length} bài hát`;

  const container = document.getElementById('detail-pl-songs-container');
  container.innerHTML = '';

  if (songsInPlaylist.length === 0) {
    container.innerHTML = '<p style="opacity:0.6;">Playlist này chưa có bài hát nào.</p>';
    return;
  }

  songsInPlaylist.forEach((song, idx) => {
    const item = createSongItemHTML(song, idx, `playlist-${pl.id}`, pl.id);
    container.appendChild(item);
  });
}

document.getElementById('back-to-playlists-btn').onclick = () => {
  window.history.pushState({}, '', 'playlists.html');
  renderPlaylistsList();
};

function createSongItemHTML(song, index, source = 'main', playlistId = null) {
  const songItem = document.createElement('div');
  songItem.className = 'song__item';
  songItem.setAttribute('data-id', song.id);

  songItem.innerHTML = `
    <img src="${song.cover_url || 'img/song_cover_place_holder.jpg'}" class="song__thumb">
    <div class="song__details">
        <h3 class="song-title">${song.title}</h3>
        <p class="song-artist">${song.artist} • <small style="opacity:0.7">Đăng bởi: ${song.uploader || 'Admin'}</small></p>
    </div>
    <div class="song-actions">
      ${source.startsWith('playlist-') ? `
        <button class="song__remove-from-pl-btn" data-song-id="${song.id}" data-pl-id="${playlistId}" title="Xóa khỏi Playlist" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size: 1.1rem;">
          <i class="fa-solid fa-minus"></i>
        </button>
      ` : ''}
    </div>
  `;

  songItem.onclick = (e) => {
    if (e.target.closest('button')) return;
    const songsInPl = allSongs.filter(s => {
      const pl = userPlaylists.find(p => String(p.id) === String(playlistId));
      return pl && pl.songIds && pl.songIds.includes(s.id);
    });
    currentQueue = songsInPl.length > 0 ? songsInPl : [...allSongs];
    const clickedIdx = currentQueue.findIndex(s => String(s.id) === String(song.id));
    if (clickedIdx !== -1) playSongInQueue(clickedIdx);
  };

  return songItem;
}

function playSongInQueue(index) {
  if (index < 0 || index >= currentQueue.length) return;

  currentSongIndex = index;
  const song = currentQueue[currentSongIndex];

  if (playerImg) playerImg.src = song.cover_url || "img/song_cover_place_holder.jpg";
  if (playerTitle) playerTitle.innerText = song.title || "Bài hát không tên";
  if (playerArtist) playerArtist.innerText = song.artist || "Nghệ sĩ ẩn danh";
  if (playerUploader) playerUploader.innerText = `Đăng bởi: ${song.uploader || 'Admin'}`;

  globalAudio.src = song.audio_url;
  globalAudio.play();

  if (playMainBtn) playMainBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

function nextSong() {
  if (currentQueue.length === 0) return;
  if (repeatMode === 2) return playSongInQueue(currentSongIndex);

  if (isShuffle) {
    let randomIndex = Math.floor(Math.random() * currentQueue.length);
    playSongInQueue(randomIndex);
  } else {
    let nextIndex = (currentSongIndex + 1) % currentQueue.length;
    playSongInQueue(nextIndex);
  }
}

function prevSong() {
  if (currentQueue.length === 0) return;
  let prevIndex = (currentSongIndex - 1 + currentQueue.length) % currentQueue.length;
  playSongInQueue(prevIndex);
}

// Event Listeners cho Audio & Controls
globalAudio.addEventListener('loadedmetadata', () => {
  if (playerDuration) playerDuration.innerText = formatTime(globalAudio.duration);
  if (playerSeek) playerSeek.max = Math.floor(globalAudio.duration || 0);
});

globalAudio.addEventListener('timeupdate', () => {
  if (playerCurrentTime) playerCurrentTime.innerText = formatTime(globalAudio.currentTime);
  if (playerSeek && !isNaN(globalAudio.duration)) playerSeek.value = Math.floor(globalAudio.currentTime);
});

if (playerSeek) {
  playerSeek.addEventListener('input', () => {
    globalAudio.currentTime = playerSeek.value;
  });
}

if (shuffleBtn) {
  shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.style.color = isShuffle ? '#ff0055' : '#fff';
  });
}

if (repeatBtn) {
  repeatBtn.addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    if (repeatMode === 0) {
      repeatBtn.style.color = '#fff';
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (repeatMode === 1) {
      repeatBtn.style.color = '#ff0055';
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else {
      repeatBtn.style.color = '#ff0055';
      repeatBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
    }
  });
}

globalAudio.addEventListener('ended', nextSong);
if (nextBtn) nextBtn.addEventListener('click', nextSong);
if (prevBtn) prevBtn.addEventListener('click', prevSong);
if (playMainBtn) {
  playMainBtn.addEventListener('click', () => {
    if (!globalAudio.src) return;
    if (globalAudio.paused) {
      globalAudio.play();
      playMainBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
      globalAudio.pause();
      playMainBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  });
}

// MODAL TẠO PLAYLIST & SEARCH
const modal = document.getElementById('playlist-modal');
const openModalBtn = document.getElementById('open-playlist-modal-btn');
const closeModalBtn = document.getElementById('close-playlist-modal');
const searchInput = document.getElementById('modal-song-search');

if (openModalBtn) {
  openModalBtn.onclick = () => {
    renderSongCheckboxesModal();
    modal.style.display = 'flex';
  };
}

if (closeModalBtn) closeModalBtn.onclick = () => modal.style.display = 'none';

function renderSongCheckboxesModal(filterText = '') {
  const container = document.getElementById('modal-song-checkboxes');
  if (!container) return;

  container.innerHTML = '';
  const filtered = allSongs.filter(s => 
    s.title.toLowerCase().includes(filterText.toLowerCase()) || 
    s.artist.toLowerCase().includes(filterText.toLowerCase())
  );

  filtered.forEach(song => {
    const item = document.createElement('div');
    item.className = 'song-checkbox-item';
    item.style.cssText = "display: flex; align-items: center; gap: 10px;";
    item.innerHTML = `
      <input type="checkbox" value="${song.id}" id="song-chk-${song.id}">
      <label for="song-chk-${song.id}" style="color: #fff; cursor: pointer; font-size: 0.9rem;">${song.title} - <small style="opacity:0.7">${song.artist}</small></label>
    `;
    container.appendChild(item);
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    renderSongCheckboxesModal(e.target.value);
  });
}

document.getElementById('create-playlist-form').onsubmit = async (e) => {
  e.preventDefault();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const name = document.getElementById('modal-playlist-name').value.trim();
  const isPublic = document.getElementById('modal-playlist-public').checked;
  const selected = document.querySelectorAll('#modal-song-checkboxes input:checked');
  const songIds = Array.from(selected).map(c => c.value);

  const res = await fetch(`${API_BASE_URL}/api/create-playlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      username: currentUser.username || currentUser.email,
      songIds,
      isPublic
    })
  });

  if (res.ok) {
    alert("Tạo Playlist thành công!");
    modal.style.display = 'none';
    initData();
  }
};

renderHeaderAuth();
initData();
