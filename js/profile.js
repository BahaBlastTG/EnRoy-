// js/profile.js

// 1. Cấu hình URL Backend Render
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

let profileSongs = [];
let profilePlaylists = [];
let currentQueue = [];
let currentSongIndex = -1;
let isShuffle = false;
let repeatMode = 0; // 0: Off, 1: Repeat All, 2: Repeat One

const currentUser = JSON.parse(localStorage.getItem('currentUser'));

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 1. KIỂM TRA ĐĂNG NHẬP VÀ HIỂN THỊ PROFILE
function initProfile() {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const username = currentUser.username || currentUser.email;
  document.getElementById('profile-username').innerText = username;
  document.getElementById('profile-email').innerText = currentUser.email || "";
  if (currentUser.avatar) {
    document.getElementById('profile-avatar').src = currentUser.avatar;
  }

  // Nút đăng xuất
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      alert("Đã đăng xuất thành công!");
      window.location.href = "login.html";
    });
  }

  loadProfileData(username);
}

// 2. TẢI BÀI HÁT & PLAYLIST CỦA USER
async function loadProfileData(username) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/user-profile-data/${username}`);
    const data = await res.json();

    profileSongs = data.uploadedSongs || [];
    profilePlaylists = data.publicPlaylists || [];

    renderUploadedSongs();
    renderPublicPlaylists();
  } catch (err) {
    console.error("Lỗi tải dữ liệu Profile:", err);
  }
}

// 3. RENDER BÀI HÁT ĐÃ ĐĂNG
function renderUploadedSongs() {
  const container = document.getElementById('user-uploaded-songs');
  if (!container) return;
  container.innerHTML = '';

  if (profileSongs.length === 0) {
    container.innerHTML = '<p style="opacity:0.6;">Bạn chưa đăng bài hát nào.</p>';
    return;
  }

  profileSongs.forEach((song) => {
    const songItem = document.createElement('div');
    songItem.className = 'song__item';
    songItem.setAttribute('data-id', song.id);
    songItem.setAttribute('data-source', 'uploaded');

    songItem.innerHTML = `
      <img src="${song.cover_url || 'img/song_cover_place_holder.jpg'}" class="song__thumb">
      <div class="song__details">
          <h3 class="song-title">${song.title}</h3>
          <p class="song-artist">${song.artist} • <small style="opacity:0.7">Đăng bởi: ${song.uploader || 'Admin'}</small></p>
      </div>
      <div class="song-actions">
        <button class="song__delete-btn" data-id="${song.id}" title="Xóa bài hát" style="background:none; border:none; color:#ff0055; cursor:pointer;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(songItem);
  });
}

// 4. RENDER PLAYLIST CÔNG KHAI
function renderPublicPlaylists() {
  const container = document.getElementById('user-public-playlists');
  if (!container) return;
  container.innerHTML = '';

  if (profilePlaylists.length === 0) {
    container.innerHTML = '<p style="opacity:0.6;">Chưa có Playlist công khai nào.</p>';
    return;
  }

  profilePlaylists.forEach(pl => {
    const songsInPl = profileSongs.filter(s => pl.songIds && pl.songIds.includes(s.id));

    const card = document.createElement('div');
    card.className = 'playlist-card-item';
    card.setAttribute('data-playlist-id', pl.id);

    card.innerHTML = `
      <div class="playlist-card-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px; cursor: pointer;">
          <div class="playlist-title-info">
              <strong style="font-size: 1.1rem; color: #fff;">${pl.name}</strong> 
              <small style="opacity:0.6;">(${pl.songIds ? pl.songIds.length : 0} bài hát)</small>
          </div>
          <div class="playlist-status-info" style="display:flex; gap:12px; align-items:center;">
            <span style="font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.1); color: #4caf50;">
                <i class="fa-solid fa-globe"></i> Công khai
            </span>
            <i class="fa-solid fa-chevron-down playlist-arrow-icon" style="transition: transform 0.3s;"></i>
          </div>
      </div>
      <div class="playlist-songs-list" style="display:none; padding: 10px;"></div>
    `;

    const songsListContainer = card.querySelector('.playlist-songs-list');
    if (songsInPl.length > 0) {
      songsInPl.forEach(song => {
        const item = document.createElement('div');
        item.className = 'song__item';
        item.setAttribute('data-id', song.id);
        item.setAttribute('data-source', `playlist-${pl.id}`);
        item.innerHTML = `
          <img src="${song.cover_url || 'img/song_cover_place_holder.jpg'}" class="song__thumb">
          <div class="song__details">
              <h3 class="song-title">${song.title}</h3>
              <p class="song-artist">${song.artist}</p>
          </div>
        `;
        songsListContainer.appendChild(item);
      });
    } else {
      songsListContainer.innerHTML = '<p style="opacity:0.5; font-size:0.85rem; padding: 8px;">Không có bài hát thuộc quyền sở hữu của bạn trong playlist này.</p>';
    }

    container.appendChild(card);
  });
}

// 5. TRÌNH PHÁT NHẠC
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
    playSongInQueue(currentSongIndex);
    return;
  }
  playSongInQueue((currentSongIndex + 1) % currentQueue.length);
}

function prevSong() {
  if (currentQueue.length === 0) return;
  playSongInQueue((currentSongIndex - 1 + currentQueue.length) % currentQueue.length);
}

// 6. XỬ LÝ SỰ KIỆN CLICK
document.addEventListener('click', async (e) => {
  // Xóa bài hát đã đăng
  const deleteBtn = e.target.closest('.song__delete-btn');
  if (deleteBtn) {
    e.stopPropagation();
    const songId = deleteBtn.getAttribute('data-id');
    if (confirm("Bạn có chắc chắn muốn xóa bài hát này khỏi hệ thống?")) {
      try {
        const username = currentUser.username || currentUser.email;
        const res = await fetch(`${API_BASE_URL}/api/delete-music/${songId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, isAdmin: currentUser.email === 'admin@gmail.com' })
        });
        if (res.ok) {
          alert("Đã xóa bài hát!");
          loadProfileData(username);
        }
      } catch (err) {
        alert("Lỗi khi xóa bài hát!");
      }
    }
    return;
  }

  // Toggle hiển thị playlist
  const playlistHeader = e.target.closest('.playlist-card-header');
  if (playlistHeader) {
    const parentCard = playlistHeader.closest('.playlist-card-item');
    const songListContainer = parentCard.querySelector('.playlist-songs-list');
    const arrowIcon = playlistHeader.querySelector('.playlist-arrow-icon');
    
    const isHidden = songListContainer.style.display === 'none' || !songListContainer.style.display;
    songListContainer.style.display = isHidden ? 'block' : 'none';
    if (arrowIcon) {
      arrowIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
    return;
  }

  // Bấm vào bài hát để phát
  const songItem = e.target.closest('.song__item');
  if (songItem && !e.target.closest('button')) {
    const songId = songItem.getAttribute('data-id');
    const dataSource = songItem.getAttribute('data-source');

    if (dataSource === 'uploaded') {
      currentQueue = [...profileSongs];
    } else if (dataSource && dataSource.startsWith('playlist-')) {
      const playlistId = dataSource.replace('playlist-', '');
      const playlist = profilePlaylists.find(pl => String(pl.id) === String(playlistId));
      if (playlist && playlist.songIds) {
        currentQueue = profileSongs.filter(s => playlist.songIds.includes(s.id));
      }
    }

    const index = currentQueue.findIndex(s => String(s.id) === String(songId));
    if (index !== -1) playSongInQueue(index);
  }
});

// 7. SỰ KIỆN PHÁT NHẠC & THANH SEEK
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

// CHUYỂN ĐỔI CHẾ ĐỘ REPEAT
if (repeatBtn) {
  repeatBtn.addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    
    if (repeatMode === 0) {
      repeatBtn.style.color = '#fff';
      repeatBtn.style.opacity = '0.5';
      repeatBtn.title = "Tắt lặp lại";
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (repeatMode === 1) {
      repeatBtn.style.color = '#ff0055';
      repeatBtn.style.opacity = '1';
      repeatBtn.title = "Lặp lại danh sách";
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (repeatMode === 2) {
      repeatBtn.style.color = '#ff0055';
      repeatBtn.style.opacity = '1';
      repeatBtn.title = "Lặp lại 1 bài";
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

// Khởi chạy
initProfile();
