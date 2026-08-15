// js/upload.js

const API_BASE_URL = 'https://enroy-backend.onrender.com';

// 1. Kiểm tra đăng nhập
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
  alert("Bạn cần đăng nhập để thực hiện chức năng tải nhạc!");
  window.location.href = "login.html";
}

const fileInput = document.getElementById('mp3-file');
const coverInput = document.getElementById('cover-file');
const fileNameLabel = document.getElementById('file-name');
const coverNameLabel = document.getElementById('cover-name');
const titleInput = document.getElementById('song-title-input');
const artistInput = document.getElementById('song-artist-input');
const submitUpload = document.getElementById('submit-upload');

function validateForm() {
  const hasAudio = fileInput.files.length > 0;
  const hasTitle = titleInput.value.trim() !== "";
  const hasArtist = artistInput.value.trim() !== "";

  if (hasAudio && hasTitle && hasArtist) {
    submitUpload.removeAttribute('disabled');
  } else {
    submitUpload.setAttribute('disabled', 'true');
  }
}

if (fileInput) {
  fileInput.addEventListener('change', () => {
    if (fileNameLabel) {
      fileNameLabel.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : "Chưa chọn tệp nhạc";
    }
    validateForm();
  });
}

if (coverInput) {
  coverInput.addEventListener('change', () => {
    if (coverNameLabel) {
      coverNameLabel.textContent = coverInput.files.length > 0 ? coverInput.files[0].name : "Chưa chọn ảnh bìa";
    }
  });
}

if (titleInput) titleInput.addEventListener('input', validateForm);
if (artistInput) artistInput.addEventListener('input', validateForm);

// 2. Gửi dữ liệu bài hát lên Backend
const uploadForm = document.getElementById('upload-form');
if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const audioFile = fileInput.files[0];
    const coverFile = coverInput.files[0];
    const title = titleInput.value.trim();
    const artist = artistInput.value.trim();

    submitUpload.setAttribute('disabled', 'true');
    submitUpload.innerHTML = 'Đang tải lên... <i class="ri-loader-4-line"></i>';

    const formData = new FormData();
    formData.append('audio', audioFile);
    if (coverFile) {
      formData.append('cover', coverFile);
    }
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('uploader', currentUser.username || currentUser.email);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-music`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error("Tải nhạc thất bại!");

      alert("Tải lên bài hát thành công!");
      window.location.href = "index.html";

    } catch (error) {
      console.error("Lỗi:", error);
      alert("Đã xảy ra lỗi: " + error.message);
      submitUpload.removeAttribute('disabled');
      submitUpload.innerHTML = 'Tải nhạc lên <i class="ri-upload-2-line"></i>';
    }
  });
}
