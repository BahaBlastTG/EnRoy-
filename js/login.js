// js/login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Cấu hình Firebase (Đồng bộ với server)
const firebaseConfig = {
  apiKey: "AIzaSyCZrRRXjsG9eQj9Wctii2jmiVIg7FwFFSs",
  authDomain: "enroy-9aadc.firebaseapp.com",
  projectId: "enroy-9aadc",
  storageBucket: "enroy-9aadc.firebasestorage.app",
  messagingSenderId: "106595022635",
  appId: "1:106595022635:web:784063e6bdd39dfbe8776e",
  measurementId: "G-48SMHDZLX9"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      alert("Vui lòng điền đầy đủ email và mật khẩu!");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Đang đăng nhập...";

    try {
      // Đăng nhập với Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Lấy username từ displayName (nếu chưa có thì lấy phần tên từ email)
      const username = user.displayName || email.split('@')[0];

      // Lưu thông tin phiên đăng nhập vào localStorage
      const userData = {
        uid: user.uid,
        email: user.email,
        username: username,
        avatar: user.photoURL || 'img/logo.png'
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));

      alert(`Chủ nhân tài khoản ${username} đã đăng nhập thành công!`);
      window.location.href = "index.html";

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      let errorMessage = "Đăng nhập thất bại! Vui lòng thử lại.";
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMessage = "Email hoặc mật khẩu không chính xác!";
          break;
        case 'auth/invalid-email':
          errorMessage = "Định dạng Email không hợp lệ!";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau!";
          break;
      }
      
      alert(errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Đăng nhập";
    }
  });
}