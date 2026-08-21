// js/index.js

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
let currentQueue = [];
let currentSongIndex = -1;

let isShuffle = false;
let repeatMode = 0; // 0: Off, 1: Repeat All, 2: Repeat One

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

// 1. HEADER AUTHENTICATION
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

async function loadSongsFromBackend() {
  const container = document.getElementById('song-list-container');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const isAdmin = checkIsAdmin(currentUser);

  try {
    const response = await fetch(`${API_BASE_URL}/api/get-music`);
    allSongs = await response.json();
    
    if (currentQueue.length === 0) {
      currentQueue = [...allSongs];
    }

    if (!container) return;
    container.innerHTML = '';

    allSongs.forEach((song, index) => {
      const canDelete = isAdmin || (currentUser.username && currentUser.username === song.uploader);
      const songItem = createSongItemHTML(song, index, canDelete, 'main');
      container.appendChild(songItem);
    });

    loadUserPlaylists();

  } catch (error) {
    console.error("Lỗi khi tải bài hát:", error);
  }
}

// TẠO HTML BÀI HÁT
function createSongItemHTML(song, index, canDelete, source = 'main', playlistId = null) {
  const songItem = document.createElement('div');
  songItem.className = 'song__item';
  songItem.setAttribute('data-id', song.id);
  songItem.setAttribute('data-source', source);
  songItem.setAttribute('data-index', index);

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  songItem.innerHTML = `
    <img src="${song.cover_url || 'img/song_cover_place_holder.jpg'}" class="song__thumb">
    <div class="song__details">
        <h3 class="song-title">${song.title}</h3>
        <p class="song-artist">${song.artist} • <small style="opacity:0.7">Đăng bởi: ${song.uploader || 'Admin'}</small></p>
    </div>
    
    <div class="song-actions" style="display: flex; gap: 8px; align-items: center;">
      ${currentUser ? `
        <button class="song__add-playlist-btn" data-id="${song.id}" title="Thêm vào Playlist" style="background:none; border:none; color:#fff; cursor:pointer;">
          <i class="fa-solid fa-plus"></i>
        </button>
      ` : ''}

      ${source.startsWith('playlist-') ? `
        <button class="song__remove-from-pl-btn" data-song-id="${song.id}" data-pl-id="${playlistId}" title="Xóa khỏi Playlist" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">
          <i class="fa-solid fa-minus"></i>
        </button>
      ` : ''}

      ${canDelete && source === 'main' ? `
        <button class="song__delete-btn" data-id="${song.id}" title="Xóa toàn bộ bài hát khỏi hệ thống" style="background:none; border:none; color:#ff0055; cursor:pointer;">
          <i class="fa-solid fa-trash"></i>
        </button>
      ` : ''}
    </div>
  `;
  return songItem;
}

// 3. TẢI VÀ RENDER PLAYLIST
async function loadUserPlaylists() {
  const container = document.getElementById('playlist-list-container');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!container || !currentUser) return;

  const isAdmin = checkIsAdmin(currentUser);

  try {
    const username = currentUser.username || currentUser.email;
    const res = await fetch(`${API_BASE_URL}/api/get-user-playlists/${username}`);
    const userPlaylists = await res.json();

    container.innerHTML = '';

    if (!Array.isArray(userPlaylists) || userPlaylists.length === 0) {
      container.innerHTML = '<p style="opacity:0.6; font-size: 0.9rem;">Chưa có Playlist nào.</p>';
      return;
    }

    userPlaylists.forEach(pl => {
      const songsInPlaylist = allSongs.filter(song => pl.songIds && pl.songIds.includes(song.id));
      const canDeletePL = isAdmin || pl.username === username;

      const card = document.createElement('div');
      card.className = 'playlist-card-item';
      card.setAttribute('data-playlist-id', pl.id);

      card.innerHTML = `
        <div class="playlist-card-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px;">
            <div class="playlist-title-info">
                <strong style="font-size: 1.1rem; color: #fff;">${pl.name}</strong> 
                <small style="opacity:0.6;">(${songsInPlaylist.length} bài hát)</small>
            </div>
            <div class="playlist-status-info" style="display:flex; gap:12px; align-items:center;">
              <span style="font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.1);">
                  ${pl.isPublic ? '<i class="fa-solid fa-globe"></i> Công khai' : '<i class="fa-solid fa-lock"></i> Riêng tư'}
              </span>
              ${canDeletePL ? `
                <button class="delete-playlist-btn" data-pl-id="${pl.id}" title="Xóa Playlist" style="background:none; border:none; color:#ff0055; cursor:pointer;">
                  <i class="fa-solid fa-trash"></i>
                </button>
              ` : ''}
              <i class="fa-solid fa-chevron-down playlist-arrow-icon"></i>
            </div>
        </div>

        <div class="playlist-songs-list" style="display:none; padding: 10px;"></div>
      `;

      const songsListContainer = card.querySelector('.playlist-songs-list');
      if (songsInPlaylist.length > 0) {
        songsInPlaylist.forEach((song, idx) => {
          const songElem = createSongItemHTML(song, idx, false, `playlist-${pl.id}`, pl.id);
          songsListContainer.appendChild(songElem);
        });
      } else {
        songsListContainer.innerHTML = '<p style="opacity:0.5; font-size:0.85rem; padding: 10px;">Playlist chưa có bài hát nào.</p>';
      }

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Lỗi khi tải Playlist:", err);
  }
}

// 4. PHÁT NHẠC
function playSongInQueue(index) {
  if (index < 0 || index >= currentQueue.length) return;

  currentSongIndex = index;
  const song = currentQueue[currentSongIndex];

  if (playerImg) playerImg.src = song.cover_url || "img/song_cover_place_holder.jpg";
  if (playerTitle) playerTitle.innerText = song.title || "Bài hát không tên";
  if (playerArtist) playerArtist.innerText = song.artist || "Nghệ sĩ ẩn danh";
  if (playerUploader) playerUploader.innerText = `Đăng bởi: ${song.uploader || 'Admin'}`;

  document.body.classList.add('has-player');
  globalAudio.src = song.audio_url;
  globalAudio.play();

  if (playMainBtn) playMainBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

function nextSong() {
  if (currentQueue.length === 0) return;

  if (repeatMode === 2) {
    // Lặp lại 1 bài
    playSongInQueue(currentSongIndex);
    return;
  }

  if (isShuffle) {
    // Tráo bài ngẫu nhiên
    let randomIndex = Math.floor(Math.random() * currentQueue.length);
    if (currentQueue.length > 1 && randomIndex === currentSongIndex) {
      randomIndex = (currentSongIndex + 1) % currentQueue.length;
    }
    playSongInQueue(randomIndex);
  } else {
    // Chuyển bài kế tiếp
    let nextIndex = (currentSongIndex + 1) % currentQueue.length;
    playSongInQueue(nextIndex);
  }
}

function prevSong() {
  if (currentQueue.length === 0) return;

  if (isShuffle) {
    let randomIndex = Math.floor(Math.random() * currentQueue.length);
    playSongInQueue(randomIndex);
  } else {
    let prevIndex = (currentSongIndex - 1 + currentQueue.length) % currentQueue.length;
    playSongInQueue(prevIndex);
  }
}

// 5. SỰ KIỆN CLICK TOÀN CỤC
document.addEventListener('click', async (e) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  // A. XÓA BÀI HÁT
  const deleteSongBtn = e.target.closest('.song__delete-btn');
  if (deleteSongBtn) {
    e.stopPropagation();
    const songId = deleteSongBtn.getAttribute('data-id');

    if (!currentUser) {
      alert("Vui lòng đăng nhập!");
      return;
    }

    if (confirm("Bạn có chắc chắn muốn xóa bài hát này khỏi hệ thống không?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/delete-music/${songId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser.username || currentUser.email,
            isAdmin: checkIsAdmin(currentUser)
          })
        });

        const data = await res.json();
        if (res.ok) {
          alert("Đã xóa bài hát thành công!");
          loadSongsFromBackend();
        } else {
          alert(data.message || "Không thể xóa bài hát!");
        }
      } catch (err) {
        alert("Có lỗi xảy ra khi gửi yêu cầu xóa!");
      }
    }
    return;
  }

  // B. THÊM BÀI HÁT VÀO PLAYLIST
  const addPlaylistBtn = e.target.closest('.song__add-playlist-btn');
  if (addPlaylistBtn) {
    e.stopPropagation();
    const songId = addPlaylistBtn.getAttribute('data-id');

    if (!currentUser) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này!");
      return;
    }

    const openModal = document.getElementById('open-playlist-modal-btn');
    if (openModal) {
      openModal.click();
      setTimeout(() => {
        const chk = document.getElementById(`song-chk-${songId}`);
        if (chk) chk.checked = true;
      }, 100);
    }
    return;
  }

  // C. XÓA PLAYLIST
  const deletePlBtn = e.target.closest('.delete-playlist-btn');
  if (deletePlBtn) {
    e.stopPropagation();
    const plId = deletePlBtn.getAttribute('data-pl-id');
    if (confirm("Bạn có chắc chắn muốn xóa Playlist này không?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/delete-playlist/${plId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser.username || currentUser.email,
            isAdmin: checkIsAdmin(currentUser)
          })
        });

        if (res.ok) {
          alert("Đã xóa Playlist!");
          loadUserPlaylists();
        }
      } catch (err) {
        alert("Không thể xóa Playlist!");
      }
    }
    return;
  }

  // D. XÓA BÀI HÁT KHỎI PLAYLIST
  const removeSongFromPlBtn = e.target.closest('.song__remove-from-pl-btn');
  if (removeSongFromPlBtn) {
    e.stopPropagation();
    const songId = removeSongFromPlBtn.getAttribute('data-song-id');
    const plId = removeSongFromPlBtn.getAttribute('data-pl-id');

    const username = currentUser.username || currentUser.email;
    const resPl = await fetch(`${API_BASE_URL}/api/get-user-playlists/${username}`);
    const playlists = await resPl.json();
    const targetPl = playlists.find(p => String(p.id) === String(plId));

    if (targetPl) {
      const updatedSongIds = targetPl.songIds.filter(id => String(id) !== String(songId));
      await fetch(`${API_BASE_URL}/api/update-playlist-songs/${plId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songIds: updatedSongIds,
          username,
          isAdmin: checkIsAdmin(currentUser)
        })
      });
      alert("Đã xóa bài hát khỏi Playlist!");
      loadUserPlaylists();
    }
    return;
  }

  // E. BẤM BÀI HÁT ĐỂ PHÁT NHẠC
  const songItem = e.target.closest('.song__item');
  if (songItem && !e.target.closest('button')) {
    const songId = songItem.getAttribute('data-id');
    const source = songItem.getAttribute('data-source');

    if (source && source.startsWith('playlist-')) {
      const playlistCard = songItem.closest('.playlist-card-item');
      const songElements = playlistCard.querySelectorAll('.song__item');
      currentQueue = [];
      songElements.forEach(elem => {
        const id = elem.getAttribute('data-id');
        const songObj = allSongs.find(s => String(s.id) === String(id));
        if (songObj) currentQueue.push(songObj);
      });
    } else {
      currentQueue = [...allSongs];
    }

    const clickedIndex = currentQueue.findIndex(s => String(s.id) === String(songId));
    if (clickedIndex !== -1) playSongInQueue(clickedIndex);
  }

  // F. TOGGLE ĐỔ MỞ PLAYLIST
  const playlistHeader = e.target.closest('.playlist-card-header');
  if (playlistHeader && !e.target.closest('.delete-playlist-btn')) {
    const parentCard = playlistHeader.closest('.playlist-card-item');
    const songListContainer = parentCard.querySelector('.playlist-songs-list');
    if (songListContainer) {
      songListContainer.style.display = songListContainer.style.display === 'block' ? 'none' : 'block';
    }
  }
});

// 6. SỰ KIỆN PLAYER & THANH TUA
globalAudio.addEventListener('loadedmetadata', () => {
  if (playerDuration) playerDuration.innerText = formatTime(globalAudio.duration);
  if (playerSeek) playerSeek.max = Math.floor(globalAudio.duration || 0);
});

globalAudio.addEventListener('timeupdate', () => {
  if (playerCurrentTime) playerCurrentTime.innerText = formatTime(globalAudio.currentTime);
  if (playerSeek && !isNaN(globalAudio.duration)) {
    playerSeek.value = Math.floor(globalAudio.currentTime);
  }
});

if (playerSeek) {
  playerSeek.addEventListener('input', () => {
    globalAudio.currentTime = playerSeek.value;
  });
}

// BẬT / TẮT SHUFFLE
if (shuffleBtn) {
  shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.style.color = isShuffle ? '#ff0055' : '#fff';
    shuffleBtn.style.opacity = isShuffle ? '1' : '0.7';
  });
}

// CHUYỂN ĐỔI CHẾ ĐỘ REPEAT (0: Tắt, 1: Lặp tất cả, 2: Lặp 1 bài)
if (repeatBtn) {
  repeatBtn.addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    if (repeatMode === 0) {
      repeatBtn.style.color = '#fff';
      repeatBtn.style.opacity = '0.7';
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (repeatMode === 1) {
      repeatBtn.style.color = '#ff0055';
      repeatBtn.style.opacity = '1';
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (repeatMode === 2) {
      repeatBtn.style.color = '#ff0055';
      repeatBtn.style.opacity = '1';
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat-1"></i>';
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

// MODAL TẠO PLAYLIST
const playlistModal = document.getElementById('playlist-modal');
const openModalBtn = document.getElementById('open-playlist-modal-btn');
const closeModalBtn = document.getElementById('close-playlist-modal');
const createPlaylistForm = document.getElementById('create-playlist-form');

if (openModalBtn) {
  openModalBtn.addEventListener('click', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      alert("Vui lòng đăng nhập để tạo Playlist!");
      return;
    }
    renderSongCheckboxesModal();
    playlistModal.style.display = 'flex';
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    playlistModal.style.display = 'none';
  });
}

function renderSongCheckboxesModal() {
  const checkboxContainer = document.getElementById('modal-song-checkboxes');
  if (!checkboxContainer) return;

  checkboxContainer.innerHTML = '';
  allSongs.forEach((song) => {
    const item = document.createElement('div');
    item.className = 'song-checkbox-item';
    item.style.cssText = "display: flex; align-items: center; gap: 8px; padding: 6px 0;";
    item.innerHTML = `
      <input type="checkbox" value="${song.id}" id="song-chk-${song.id}">
      <label for="song-chk-${song.id}" style="color: #fff; cursor: pointer;">${song.title} - <small style="opacity:0.7">${song.artist}</small></label>
    `;
    checkboxContainer.appendChild(item);
  });
}

if (createPlaylistForm) {
  createPlaylistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const name = document.getElementById('modal-playlist-name').value.trim();
    const isPublic = document.getElementById('modal-playlist-public').checked;
    const selectedCheckboxes = document.querySelectorAll('#modal-song-checkboxes input:checked');
    const songIds = Array.from(selectedCheckboxes).map(chk => chk.value);

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username: currentUser.username || currentUser.email,
          songIds,
          isPublic
        })
      });

      if (response.ok) {
        alert("Tạo Playlist thành công!");
        playlistModal.style.display = 'none';
        createPlaylistForm.reset();
        loadUserPlaylists();
      }
    } catch (err) {
      console.error(err);
    }
  });
}

// KHỞI CHẠY
renderHeaderAuth();
loadSongsFromBackend();

