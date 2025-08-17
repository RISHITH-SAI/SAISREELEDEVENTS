// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA_dPQ8JCGVi-aX7uS5NdnHpFKurT2jJC8",
  authDomain: "saisreeledevents.firebaseapp.com",
  projectId: "saisreeledevents",
  storageBucket: "saisreeledevents.appspot.com", // ✅ FIXED
  messagingSenderId: "212507109156",
  appId: "1:212507109156:web:5d7e230ba3d7945532f5b1",
  measurementId: "G-Y947LKLXGF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Convert YouTube link to embeddable
function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    if (u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    return url;
  } catch { return url; }
}

// ✅ Render video
function renderVideo(container, url) {
  if (!url) return;
  const iframe = document.createElement("iframe");
  iframe.src = toYouTubeEmbed(url);
  iframe.width = "100%";
  iframe.height = "400";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;
  container.appendChild(iframe);
}

// ✅ Upload to Firebase Storage
async function uploadFile(file, path) {
  if (!file) return null;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ✅ Save Event
async function saveEvent(data) {
  try {
    if (data.thumbnailFile) {
      data.thumbnail = await uploadFile(data.thumbnailFile, `thumbnails/${Date.now()}-${data.thumbnailFile.name}`);
    }
    if (data.posterFile) {
      data.poster = await uploadFile(data.posterFile, `posters/${Date.now()}-${data.posterFile.name}`);
    }
    if (data.galleryFiles) {
      data.gallery = [];
      for (const f of data.galleryFiles) {
        data.gallery.push(await uploadFile(f, `gallery/${Date.now()}-${f.name}`));
      }
    }
    await addDoc(collection(db, "events"), data);
    showToast("Event saved successfully!", "success");
  } catch (err) {
    console.error(err);
    showToast("Error saving event", "error");
  }
}

// ✅ Toasts
function showToast(msg, type="success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "toast-error" : "toast-success"}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ✅ Admin login
document.getElementById("admin-access-button").addEventListener("click", () => {
  document.getElementById("admin-login-modal").classList.remove("hidden");
});
document.getElementById("admin-login-close-button").addEventListener("click", () => {
  document.getElementById("admin-login-modal").classList.add("hidden");
});
document.getElementById("admin-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-email").value;
  const pass = document.getElementById("admin-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    showToast("Logged in successfully", "success");
    document.getElementById("admin-login-modal").classList.add("hidden");
  } catch {
    showToast("Login failed", "error");
  }
});
