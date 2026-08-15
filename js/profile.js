// js/profile.js

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

let profileSongs = [];
let profilePlaylists = [];
let currentQueue = [];
let currentSongIndex = -1;

const currentUser = JSON.parse(localStorage.getItem('currentUser'));

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
    const res = await fetch(`http://localhost:5000/api/user-profile-data/${username}`);
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

  profileSongs.forEach((song, index) => {
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
            <i class="fa-solid fa-chevron-down playlist-arrow-icon"></i>
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
        const res = await fetch(`http://localhost:5000/api/delete-music/${songId}`, {
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

  // Bấm vào bài hát để phát
  const songItem = e.target.closest('.song__item');
  if (songItem && !e.target.closest('button')) {
    const songId = songItem.getAttribute('data-id');
    currentQueue = [...profileSongs];
    const index = currentQueue.findIndex(s => s.id === songId);
    if (index !== -1) playSongInQueue(index);
  }

  // Toggle hiển thị playlist
  const playlistHeader = e.target.closest('.playlist-card-header');
  if (playlistHeader) {
    const parentCard = playlistHeader.closest('.playlist-card-item');
    const songListContainer = parentCard.querySelector('.playlist-songs-list');
    songListContainer.style.display = songListContainer.style.display === 'block' ? 'none' : 'block';
  }
});

// SỰ KIỆN PHÁT NHẠC
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