// js/upload.js

// 1. Cập nhật đúng URL Backend Render
const API_BASE_URL = 'https://enroy.onrender.com';

// Kiểm tra đăng nhập
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

// Đọc preview ảnh bìa
const coverPreviewImg = document.getElementById('cover-preview-img');
const placeholderIcon = document.querySelector('.placeholder-icon');

function validateForm() {
  const hasAudio = fileInput.files && fileInput.files.length > 0;
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
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (fileNameLabel) fileNameLabel.textContent = file.name;

      // Tự động điền tên bài hát từ tên file mp3 nếu khung title đang trống
      if (titleInput && !titleInput.value.trim()) {
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        titleInput.value = fileNameWithoutExt;
      }
    } else {
      if (fileNameLabel) fileNameLabel.textContent = "Chưa chọn tệp nhạc (.mp3, .wav, .m4a)";
    }
    validateForm();
  });
}

if (coverInput) {
  coverInput.addEventListener('change', () => {
    if (coverInput.files.length > 0) {
      const file = coverInput.files[0];
      if (coverNameLabel) coverNameLabel.textContent = file.name;

      // Hiển thị ảnh xem trước (Preview)
      if (coverPreviewImg) {
        const reader = new FileReader();
        reader.onload = (e) => {
          coverPreviewImg.src = e.target.result;
          coverPreviewImg.classList.remove('hidden');
          if (placeholderIcon) placeholderIcon.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    } else {
      if (coverNameLabel) coverNameLabel.textContent = "Chưa chọn ảnh bìa (.jpg, .png, .webp)";
      if (coverPreviewImg) coverPreviewImg.classList.add('hidden');
      if (placeholderIcon) placeholderIcon.style.display = 'block';
    }
  });
}

if (titleInput) titleInput.addEventListener('input', validateForm);
if (artistInput) artistInput.addEventListener('input', validateForm);

// 2. Gửi dữ liệu bài hát lên Backend Render
const uploadForm = document.getElementById('upload-form');
if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const audioFile = fileInput.files[0];
    const coverFile = coverInput.files[0];
    const title = titleInput.value.trim();
    const artist = artistInput.value.trim();

    submitUpload.setAttribute('disabled', 'true');
    submitUpload.innerHTML = '<span>Đang tải lên...</span> <i class="ri-loader-4-line"></i>';

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Tải nhạc thất bại!");
      }

      alert("Tải lên bài hát thành công!");
      window.location.href = "index.html";

    } catch (error) {
      console.error("Lỗi:", error);
      alert("Đã xảy ra lỗi: " + error.message);
      submitUpload.removeAttribute('disabled');
      submitUpload.innerHTML = '<span>Tải nhạc lên</span> <i class="ri-upload-2-line"></i>';
    }
  });
}
