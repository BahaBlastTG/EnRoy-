// js/signin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZrRRXjsG9eQj9Wctii2jmiVIg7FwFFSs",
  authDomain: "enroy-9aadc.firebaseapp.com",
  projectId: "enroy-9aadc",
  storageBucket: "enroy-9aadc.firebasestorage.app",
  messagingSenderId: "106595022635",
  appId: "1:106595022635:web:784063e6bdd39dfbe8776e",
  measurementId: "G-48SMHDZLX9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const signupForm = document.getElementById('signup-form');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Đang tạo tài khoản...";

    try {
      // 1. Tạo tài khoản Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Mặc định đặt tên người dùng từ phần trước @ của Email
      const defaultName = email.split('@')[0];
      await updateProfile(user, {
        displayName: defaultName
      });

      // 3. Tự động lưu phiên đăng nhập
      const userData = {
        uid: user.uid,
        email: user.email,
        username: defaultName,
        avatar: 'img/logo.png'
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));

      alert("Đăng ký tài khoản thành công!");
      window.location.href = "index.html";

    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      let errorMessage = "Đăng ký thất bại!";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email này đã được sử dụng!";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Mật khẩu quá yếu, cần tối thiểu 6 ký tự!";
      }
      
      alert(errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Đăng kí";
    }
  });
}