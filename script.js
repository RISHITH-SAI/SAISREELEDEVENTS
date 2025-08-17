/* ==== Firebase Config (Corrected) ==== */
const firebaseConfig = {
  apiKey: "AIzaSyA_dPQ8JCGVi-aX7uS5NdnHpFKurT2jJC8",
  authDomain: "saisreeledevents.firebaseapp.com",
  projectId: "saisreeledevents",
  storageBucket: "saisreeledevents.appspot.com", // ✅ fixed (.appspot.com)
  messagingSenderId: "212507109156",
  appId: "1:212507109156:web:5d7e230ba3d7945532f5b1",
  measurementId: "G-Y947LKLXGF"
};

/* ==== Init Firebase (from window exposed in index.html) ==== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ==== Helpers ==== */
// Toasts
function toast(msg, type = "success"){
  const c = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "toast-error" : type === "info" ? "toast-info" : "toast-success"}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(()=> el.remove(), 4200);
}

// YouTube -> embed URL
function toYouTubeEmbed(raw){
  try{
    const url = new URL(raw.trim());
    const host = url.hostname.replace("www.", "");
    if(host === "youtu.be"){
      return `https://www.youtube.com/embed/${url.pathname.replace("/", "")}`;
    }
    if(host === "youtube.com" || host === "m.youtube.com"){
      if(url.pathname.startsWith("/shorts/")){
        return `https://www.youtube.com/embed/${url.pathname.split("/")[2]}`;
      }
      const v = url.searchParams.get("v");
      if(v) return `https://www.youtube.com/embed/${v}`;
    }
    return raw; // leave as-is for non-YouTube
  }catch{
    return raw;
  }
}

// Storage upload
async function uploadFileGetURL(file, path){
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

/* ==== DOM Refs ==== */
const eventsGrid = document.getElementById("events-grid");
const adminPanel = document.getElementById("admin-panel");

const btnNewEvent = document.getElementById("btn-new-event");
const btnAccount  = document.getElementById("btn-account");
const btnLogout   = document.getElementById("btn-logout");

const companyBtn  = document.getElementById("company-details-button");
const companyModal= document.getElementById("company-modal");
const companyClose= document.getElementById("company-close");

const adminAccess = document.getElementById("admin-access-button");
const loginModal  = document.getElementById("login-modal");
const loginClose  = document.getElementById("login-close");
const loginForm   = document.getElementById("login-form");

const eventModal  = document.getElementById("event-modal");
const eventClose  = document.getElementById("event-close");
const eventForm   = document.getElementById("event-form");
const eventModalTitle = document.getElementById("event-modal-title");
const hiddenId    = document.getElementById("event-id");
const btnDeleteEvent = document.getElementById("btn-delete-event");

const accModal    = document.getElementById("account-modal");
const accClose    = document.getElementById("account-close");
const accForm     = document.getElementById("account-form");

/* ==== Icons ==== */
lucide.createIcons();

/* ==== Company Modal ==== */
companyBtn.addEventListener("click", async ()=>{
  await loadCompanyDetails();
  companyModal.classList.remove("hidden");
});
companyClose.addEventListener("click", ()=> companyModal.classList.add("hidden"));

async function loadCompanyDetails(){
  try{
    const snap = await getDoc(doc(db, "settings", "company"));
    const data = snap.exists() ? snap.data() : {};

    // header + footer
    if(data.company?.name) document.getElementById("company-name").textContent = data.company.name;
    if(data.company?.logo) document.getElementById("company-logo").src = data.company.logo;
    if(data.company?.email) document.getElementById("footer-email").textContent = data.company.email;
    if(data.company?.phone) document.getElementById("footer-phone").textContent = data.company.phone;

    // modal: products
    const productsUl = document.getElementById("company-products");
    productsUl.innerHTML = "";
    (data.company?.products || []).forEach(p=>{
      const li = document.createElement("li");
      li.textContent = `• ${p}`;
      productsUl.appendChild(li);
    });

    // modal: social
    const socialWrap = document.getElementById("company-social");
    socialWrap.innerHTML = "";
    (data.company?.social || []).forEach(s=>{
      const a = document.createElement("a");
      a.href = s.url; a.target = "_blank"; a.rel="noopener";
      a.className = "button-style-minimal";
      a.textContent = s.label || s.platform || "Link";
      socialWrap.appendChild(a);
    });
  }catch(e){
    console.error(e);
    toast("Failed to load company details", "error");
  }
}

/* ==== Admin Login & Auth State ==== */
adminAccess.addEventListener("click", ()=> loginModal.classList.remove("hidden"));
loginClose.addEventListener("click", ()=> loginModal.classList.add("hidden"));

loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-password").value;
  try{
    await signInWithEmailAndPassword(auth, email, pass);
    loginModal.classList.add("hidden");
    toast("Logged in successfully", "success");
  }catch(err){
    console.error(err);
    toast("Login failed", "error");
  }
});

onAuthStateChanged(auth, (user)=>{
  if(user){
    adminPanel.classList.remove("hidden");
  }else{
    adminPanel.classList.add("hidden");
  }
});

btnLogout?.addEventListener("click", async ()=>{
  await signOut(auth);
  toast("Logged out", "info");
});

/* ==== Account: change email/password ==== */
btnAccount?.addEventListener("click", ()=> accModal.classList.remove("hidden"));
accClose.addEventListener("click", ()=> accModal.classList.add("hidden"));

accForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if(!user){ toast("Please login first", "error"); return; }

  const newEmail = document.getElementById("acc-email").value.trim();
  const newPass  = document.getElementById("acc-password").value;

  try{
    if(newEmail) { await updateEmail(user, newEmail); }
    if(newPass)  { await updatePassword(user, newPass); }
    toast("Account updated", "success");
    accModal.classList.add("hidden");
  }catch(err){
    console.error(err);
    toast("Update failed. You may need to re-login.", "error");
  }
});

/* ==== Events: list, create, edit, delete ==== */
function eventCard(docId, ev, isAuthed){
  const card = document.createElement("div");
  card.className = "event-card";

  const img = document.createElement("img");
  img.className = "event-thumb";
  img.src = ev.thumbnail || ev.poster || "https://placehold.co/600x360/111827/9ca3af?text=No+Image";
  img.alt = ev.title || "Event";
  card.appendChild(img);

  const body = document.createElement("div");
  body.className = "event-body";

  const title = document.createElement("div");
  title.className = "event-title";
  title.textContent = ev.title || "Untitled Event";

  const meta = document.createElement("div");
  meta.className = "event-meta";
  const date = ev.date ? new Date(ev.date).toDateString() : "";
  meta.textContent = [date, ev.time, ev.location, ev.client].filter(Boolean).join(" • ");

  const desc = document.createElement("p");
  desc.className = "mt-2 text-sm";
  desc.textContent = ev.description || "";

  // video
  const videoWrap = document.createElement("div");
  videoWrap.className = "mt-3";
  if(ev.video){
    const iframe = document.createElement("iframe");
    iframe.src = toYouTubeEmbed(ev.video);
    iframe.width = "100%";
    iframe.height = "300";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    videoWrap.appendChild(iframe);
  }

  // gallery: simple thumbnails
  const galWrap = document.createElement("div");
  galWrap.className = "mt-3 flex gap-2 flex-wrap";
  (ev.gallery || []).slice(0,6).forEach(u=>{
    const a = document.createElement("a"); a.href = u; a.target="_blank"; a.rel="noopener";
    const t = document.createElement("img");
    t.src = u; t.alt="gallery"; t.style.width="84px"; t.style.height="60px"; t.style.objectFit="cover"; t.style.borderRadius="8px";
    a.appendChild(t);
    galWrap.appendChild(a);
  });

  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(desc);
  if(ev.video) body.appendChild(videoWrap);
  if(ev.gallery?.length) body.appendChild(galWrap);

  // admin actions
  const actions = document.createElement("div");
  actions.className = "event-actions";
  if(isAuthed){
    const editBtn = document.createElement("button");
    editBtn.className = "button-style-minimal";
    editBtn.textContent = "Edit";
    editBtn.onclick = ()=> openEventModal({id: docId, ...ev});

    const delBtn = document.createElement("button");
    delBtn.className = "button-style-minimal";
    delBtn.textContent = "Delete";
    delBtn.onclick = ()=> deleteEvent(docId);

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
  }
  body.appendChild(actions);
  card.appendChild(body);
  return card;
}

async function deleteEvent(id){
  if(!confirm("Delete this event?")) return;
  try{
    await deleteDoc(doc(db, "events", id));
    toast("Event deleted", "success");
  }catch(e){
    console.error(e); toast("Delete failed", "error");
  }
}

function renderEvents(snapshot){
  const isAuthed = !!auth.currentUser;
  eventsGrid.innerHTML = "";
  snapshot.forEach(d=>{
    const ev = d.data();
    eventsGrid.appendChild(eventCard(d.id, ev, isAuthed));
  });
}

// live query
const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
onSnapshot(q, renderEvents);

// new event
btnNewEvent?.addEventListener("click", ()=> openEventModal());

function openEventModal(ev=null){
  eventForm.reset();
  hiddenId.value = ev?.id || "";
  document.getElementById("ev-title").value = ev?.title || "";
  document.getElementById("ev-client").value = ev?.client || "";
  document.getElementById("ev-date").value = ev?.date || "";
  document.getElementById("ev-time").value = ev?.time || "";
  document.getElementById("ev-location").value = ev?.location || "";
  document.getElementById("ev-description").value = ev?.description || "";
  document.getElementById("ev-video").value = ev?.video || "";

  eventModalTitle.textContent = ev ? "Edit Event" : "New Event";
  btnDeleteEvent.classList.toggle("hidden", !ev);
  eventModal.classList.remove("hidden");
}
eventClose.addEventListener("click", ()=> eventModal.classList.add("hidden"));

btnDeleteEvent.addEventListener("click", async ()=>{
  const id = hiddenId.value;
  if(!id) return;
  await deleteEvent(id);
  eventModal.classList.add("hidden");
});

// create/update
eventForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const id    = hiddenId.value;

  // fields
  const payload = {
    title: document.getElementById("ev-title").value.trim(),
    client: document.getElementById("ev-client").value.trim(),
    date: document.getElementById("ev-date").value,
    time: document.getElementById("ev-time").value,
    location: document.getElementById("ev-location").value.trim(),
    description: document.getElementById("ev-description").value.trim(),
    video: document.getElementById("ev-video").value.trim(),
    updatedAt: serverTimestamp(),
  };

  // files
  const thumbFile  = document.getElementById("ev-thumb-file").files[0];
  const posterFile = document.getElementById("ev-poster-file").files[0];
  const galleryList= Array.from(document.getElementById("ev-gallery-files").files);

  try{
    if(thumbFile){
      payload.thumbnail = await uploadFileGetURL(thumbFile, `thumbnails/${Date.now()}-${thumbFile.name}`);
    }
    if(posterFile){
      payload.poster = await uploadFileGetURL(posterFile, `posters/${Date.now()}-${posterFile.name}`);
    }
    if(galleryList.length){
      payload.gallery = payload.gallery || [];
      for(const f of galleryList){
        payload.gallery.push(await uploadFileGetURL(f, `gallery/${Date.now()}-${f.name}`));
      }
    }

    // create vs update
    if(id){
      await updateDoc(doc(db, "events", id), payload);
      toast("Event updated successfully", "success");
    }else{
      payload.createdAt = serverTimestamp();
      await addDoc(collection(db, "events"), payload);
      toast("Event saved successfully", "success");
    }
    eventModal.classList.add("hidden");
  }catch(err){
    console.error(err); toast("Failed to save event", "error");
  }
});

/* ==== UX niceties ==== */
// close modals with ESC
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    [loginModal, eventModal, companyModal, accModal].forEach(m=>{
      if(!m.classList.contains("hidden")) m.classList.add("hidden");
    });
  }
});
