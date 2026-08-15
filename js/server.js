const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const fs = require('fs');
const { initializeApp } = require('firebase/app');

// BỔ SUNG CÁC HÀM CÒN THIẾU TỪ FIREBASE (where, doc, getDoc, deleteDoc)
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} = require('firebase/firestore');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCZrRRXjsG9eQj9Wctii2jmiVIg7FwFFSs",
  authDomain: "enroy-9aadc.firebaseapp.com",
  projectId: "enroy-9aadc",
  storageBucket: "enroy-9aadc.firebasestorage.app",
  messagingSenderId: "106595022635",
  appId: "1:106595022635:web:784063e6bdd39dfbe8776e",
  measurementId: "G-48SMHDZLX9"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// 2. Cloudinary Config
cloudinary.config({
  cloud_name: 'dkdtimqgr',
  api_key: '951729244121754',
  api_secret: '-cVcKm0qDRynYR3DAdmYj5YQt1k'
});

// 3. Multer config
const upload = multer({ dest: 'uploads/' });

// ==========================================
// API 1: LẤY TẤT CẢ BÀI HÁT (Thêm mới để sửa lỗi 404)
// ==========================================
app.get('/api/get-music', async (req, res) => {
  try {
    const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const songs = [];
    querySnapshot.forEach((doc) => {
      songs.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(songs);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhạc:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// API 2: TẠO PLAYLIST (Kèm bài hát & Public status)
// ==========================================
app.post('/api/create-playlist', async (req, res) => {
  try {
    const { name, username, songIds, isPublic } = req.body;

    if (!name || !username) {
      return res.status(400).json({ message: "Thiếu thông tin tên Playlist hoặc người tạo!" });
    }

    const docRef = await addDoc(collection(db, "playlists"), {
      name,
      username,
      songIds: songIds || [],
      isPublic: Boolean(isPublic),
      createdAt: serverTimestamp()
    });

    res.status(200).json({ message: "Tạo Playlist thành công!", id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// API 3: LẤY PLAYLIST CỦA USER DÀNH CHO TRANG CHỦ
// ==========================================
app.get('/api/get-user-playlists/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const q = query(collection(db, "playlists"), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    const playlists = [];
    querySnapshot.forEach((doc) => {
      playlists.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(playlists);
  } catch (error) {
    console.error("Lỗi lấy Playlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// API 4: LẤY DỮ LIỆU DÀNH CHO TRANG PROFILE
// ==========================================
app.get('/api/user-profile-data/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // 1. Lấy bài hát do User đăng
    const songsQuery = query(collection(db, "songs"), where("uploader", "==", username));
    const songsSnap = await getDocs(songsQuery);
    const uploadedSongs = [];
    songsSnap.forEach((doc) => uploadedSongs.push({ id: doc.id, ...doc.data() }));

    // 2. Lấy Playlist CÔNG KHAI của User
    const playlistQuery = query(
      collection(db, "playlists"),
      where("username", "==", username),
      where("isPublic", "==", true)
    );
    const playlistSnap = await getDocs(playlistQuery);
    const publicPlaylists = [];
    playlistSnap.forEach((doc) => publicPlaylists.push({ id: doc.id, ...doc.data() }));

    res.status(200).json({ uploadedSongs, publicPlaylists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// API 5: XÓA BÀI HÁT (Chỉ người đăng hoặc Admin)
// ==========================================
app.delete('/api/delete-music/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    const { username, isAdmin } = req.body;

    const songRef = doc(db, "songs", songId);
    const songSnap = await getDoc(songRef);

    if (!songSnap.exists()) {
      return res.status(404).json({ message: "Bài hát không tồn tại!" });
    }

    const songData = songSnap.data();

    if (!isAdmin && songData.uploader !== username) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài hát này!" });
    }

    await deleteDoc(songRef);
    res.status(200).json({ message: "Đã xóa bài hát thành công!" });

  } catch (error) {
    console.error("Lỗi khi xóa bài hát:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// API 6: TẢI NHẠC LÊN CLOUDINARY & FIREBASE (SỬA LỖI 404)
// ==========================================
app.post('/api/upload-music', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, artist, uploader } = req.body;
    const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

    if (!audioFile || !title || !artist) {
      return res.status(400).json({ message: "Thiếu dữ liệu file nhạc hoặc thông tin bài hát!" });
    }

    // 1. Upload file mp3 lên Cloudinary (loại resource: video/raw)
    const audioResult = await cloudinary.uploader.upload(audioFile.path, {
      resource_type: "video", // Cloudinary lưu audio dưới định dạng video
      folder: "enroy_music"
    });

    // 2. Upload ảnh bìa lên Cloudinary (nếu có)
    let coverUrl = "";
    if (coverFile) {
      const coverResult = await cloudinary.uploader.upload(coverFile.path, {
        folder: "enroy_covers"
      });
      coverUrl = coverResult.secure_url;
    }

    // Xóa file tạm trên server local sau khi upload thành công
    if (fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path);
    if (coverFile && fs.existsSync(coverFile.path)) fs.unlinkSync(coverFile.path);

    // 3. Lưu thông tin bài hát vào Firestore Database
    const songDoc = await addDoc(collection(db, "songs"), {
      title,
      artist,
      uploader: uploader || "Admin",
      audio_url: audioResult.secure_url,
      cover_url: coverUrl,
      createdAt: serverTimestamp()
    });

    res.status(200).json({ message: "Đăng nhạc thành công!", id: songDoc.id });

  } catch (error) {
    console.error("Lỗi khi upload nhạc:", error);
    res.status(500).json({ error: error.message });
  }
});


// server.js

// API XÓA PLAYLIST (Admin hoặc Chủ sở hữu)
app.delete('/api/delete-playlist/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { username, isAdmin } = req.body;

    const plRef = doc(db, "playlists", playlistId);
    const plSnap = await getDoc(plRef);

    if (!plSnap.exists()) {
      return res.status(404).json({ message: "Playlist không tồn tại!" });
    }

    const plData = plSnap.data();
    if (!isAdmin && plData.username !== username) {
      return res.status(403).json({ message: "Bạn không có quyền xóa Playlist này!" });
    }

    await deleteDoc(plRef);
    res.status(200).json({ message: "Đã xóa Playlist thành công!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API CẬP NHẬT DẠNG THÊM / XÓA BÀI HÁT KHỎI PLAYLIST
app.put('/api/update-playlist-songs/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { songIds, username, isAdmin } = req.body;

    const plRef = doc(db, "playlists", playlistId);
    const plSnap = await getDoc(plRef);

    if (!plSnap.exists()) return res.status(404).json({ message: "Playlist không tồn tại!" });

    const plData = plSnap.data();
    if (!isAdmin && plData.username !== username) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa!" });
    }

    const { updateDoc } = require('firebase/firestore');
    await updateDoc(plRef, { songIds });

    res.status(200).json({ message: "Cập nhật Playlist thành công!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
  
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

