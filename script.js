/* =============================================
   LiveStream Hub — App Logic (Firebase + UI)
   ============================================= */

// ---- Firebase Config (Update with your project values) ----
// IMPORTANT: storageBucket MUST be <projectId>.appspot.com for uploads to work.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "saisreeledevents.firebaseapp.com",
  projectId: "saisreeledevents",
  storageBucket: "saisreeledevents.appspot.com", // <-- FIXED FROM firebasestorage.app
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ---- Initialize Firebase (using modules exposed from index.html) ----
const app = window.initializeApp(firebaseConfig);
const auth = window.getAuth(app);
const db = window.getFirestore(app);
const storage = window.getStorage(app);

/* ----------------------- Utilities ------------------------ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function icon(name, cls = "w-4 h-4") { const i = document.createElement("i"); i.setAttribute("data-lucide", name); i.className = cls; return i; }

function showModal(id){ const m = document.getElementById(id); m.classList.remove("hidden"); }
function hideModal(id){ const m = document.getElementById(id); m.classList.add("hidden"); }

// Toasts
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);
function toast(msg, type = 'success', timeout = 2200){
  const div = document.createElement('div');
  div.className = `toast ${type==='success'?'toast-success':'toast-error'}`;
  div.textContent = msg;
  toastContainer.appendChild(div);
  setTimeout(()=>{ div.remove(); }, timeout);
}

// Convert any YouTube URL -> embeddable URL
function toYouTubeEmbed(url){
  try{
    const u = new URL(url);
    if(!/youtube\.com|youtu\.be/.test(u.hostname)) return url;
    // watch?v=ID or youtu.be/ID or shorts/ID
    if(u.hostname.includes('youtu.be')){
      return `https://www.youtube.com/embed/${u.pathname.replace('/', '')}`;
    }
    const path = u.pathname;
    if(path.startsWith('/shorts/')){
      return `https://www.youtube.com/embed/${path.split('/')[2]}`;
    }
    const id = u.searchParams.get('v');
    if(id) return `https://www.youtube.com/embed/${id}`;
    // fallback
    return `https://www.youtube.com/embed${path}`;
  }catch(e){ return url; }
}

// Simple ID
const uid = () => Math.random().toString(36).slice(2,10);

/* ------------------ State & App Settings ------------------ */
let appSettings = {
  adminEmail: "admin@example.com", // stored in Firestore settings/company
  company: {
    name: "LiveStream Hub",
    email: "contact@example.com",
    phone: "0000000000",
    logo: "https://placehold.co/64x64/8b5cf6/ffffff?text=LS",
    miniLogo: { type: 'icon', value: 'star' }, // or {type:'image', value:'url'}
    products: ["LED Screens", "Drone Shoots", "Live Streaming"],
    social: [
      { name: 'YouTube', url: 'https://youtube.com' },
      { name: 'Instagram', url: 'https://instagram.com' },
    ]
  }
};

let state = {
  view: 'home',
  events: [],
  selectedEvent: null,
  user: null
};

/* -------------------- Firebase Sync ----------------------- */
const settingsDocRef = window.doc(db, 'settings', 'company');
window.onSnapshot(settingsDocRef, snap => {
  if(snap.exists()){
    appSettings = Object.assign({}, appSettings, snap.data());
    renderHeaderFooter();
    if(state.view === 'home') renderHome();
  }
});

const eventsColRef = window.collection(db, 'events');
window.onSnapshot(eventsColRef, (snap)=>{
  state.events = snap.docs.map(d=> ({ id: d.id, ...d.data() }));
  if(state.view === 'home') renderHome();
  if(state.view === 'event' && state.selectedEvent){
    const fresh = state.events.find(e=>e.id===state.selectedEvent.id);
    if(fresh) renderEventPage(fresh);
  }
});

// Auth state
window.onAuthStateChanged(auth, (user)=>{
  state.user = user;
  updateAdminButton();
});

/* -------------- Storage: Upload helper -------------------- */
async function uploadFileReturnURL(file, pathPrefix='uploads'){
  const fileRef = window.ref(storage, `${pathPrefix}/${Date.now()}_${file.name}`);
  await window.uploadBytes(fileRef, file);
  const url = await window.getDownloadURL(fileRef);
  return url;
}

/* ---------------------- Rendering ------------------------- */
function renderHeaderFooter(){
  // Header
  const nameEl = document.getElementById('company-name');
  const logoEl = document.getElementById('company-logo');
  const miniIcon = document.getElementById('mini-logo-icon');
  const miniImg = document.getElementById('mini-logo-img');
  $('#company-name').textContent = appSettings.company?.name || 'LiveStream Hub';
  if(appSettings.company?.logo){ logoEl.src = appSettings.company.logo; }
  // mini logo
  if(appSettings.company?.miniLogo?.type === 'image'){
    miniIcon.classList.add('hidden');
    miniImg.classList.remove('hidden');
    miniImg.src = appSettings.company.miniLogo.value;
  }else{
    miniImg.classList.add('hidden');
    miniIcon.classList.remove('hidden');
    miniIcon.setAttribute('data-lucide', appSettings.company?.miniLogo?.value || 'star');
  }

  // Footer
  const emailEl = document.getElementById('footer-email');
  const phoneEl = document.getElementById('footer-phone');
  emailEl.textContent = appSettings.company?.email || '';
  phoneEl.textContent = appSettings.company?.phone || '';

  // Icons refresh
  window.lucide && window.lucide.createIcons();
}

function updateAdminButton(){
  const btn = document.getElementById('admin-access-button');
  btn.onclick = () => {
    if(state.user){ renderAdminPanel(); }
    else{ showModal('admin-login-modal'); }
  };
}

// Home view
function renderHome(){
  state.view = 'home';
  const root = document.getElementById('app-container');
  root.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-8 flex items-center justify-between">
        <h2 class="text-2xl md:text-3xl font-bold">Upcoming & Recent Events</h2>
        ${state.user ? `<button id="add-event-btn" class="button-style">Add Event</button>` : ''}
      </div>
      <div id="events-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </section>

    <section class="max-w-7xl mx-auto px-4 pb-12">
      <h3 class="text-xl font-semibold mb-3">Products</h3>
      <div id="products-wrap" class="flex flex-wrap gap-3"></div>
    </section>
  `;

  // Products
  const pw = document.getElementById('products-wrap');
  (appSettings.company?.products||[]).forEach(p=>{
    const chip = document.createElement('span');
    chip.className = 'px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm';
    chip.textContent = p;
    pw.appendChild(chip);
  });

  // Events
  const grid = document.getElementById('events-grid');
  if(!state.events.length){
    grid.innerHTML = `<div class="text-gray-400">No events yet.</div>`;
  }else{
    state.events.forEach(ev => grid.appendChild(eventCard(ev)));
  }

  if(state.user){ $('#add-event-btn').addEventListener('click', ()=> openEventForm()); }

  window.lucide && window.lucide.createIcons();
}

function eventCard(ev){
  const card = document.createElement('article');
  card.className = 'event-card overflow-hidden bg-[#1f2937]';
  const thumb = ev.thumbnail || ev.poster || '';
  card.innerHTML = `
    <img src="${thumb}" alt="thumb" class="w-full h-48 object-cover" />
    <div class="p-4">
      <h4 class="text-lg font-semibold">${ev.title||'Untitled Event'}</h4>
      <p class="text-sm text-gray-400">${ev.date||''} ${ev.time||''} • ${ev.location||''}</p>
      <div class="mt-3 flex items-center gap-2">
        <button class="button-style" data-action="view">View</button>
        ${state.user ? `<button class="button-style bg-gray-700" data-action="edit">Edit</button>
        <button class="button-style bg-red-600" data-action="delete">Delete</button>`: ''}
      </div>
    </div>`;

  card.querySelector('[data-action="view"]').onclick = ()=> openEvent(ev);
  if(state.user){
    card.querySelector('[data-action="edit"]').onclick = ()=> openEventForm(ev);
    card.querySelector('[data-action="delete"]').onclick = ()=> deleteEvent(ev.id);
  }
  return card;
}

function openEvent(ev){
  state.selectedEvent = ev;
  renderEventPage(ev);
}

function renderEventPage(ev){
  state.view = 'event';
  const root = document.getElementById('app-container');
  const embed = ev.video ? toYouTubeEmbed(ev.video) : '';
  root.innerHTML = `
    <section class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-6 flex items-center justify-between">
        <button class="button-style bg-gray-700" id="back-home">Back</button>
        ${state.user ? `<div class="flex items-center gap-2">
          <button class="button-style bg-gray-700" id="edit-event">Edit</button>
          <button class="button-style bg-red-600" id="delete-event">Delete</button>
        </div>`: ''}
      </div>

      <h2 class="event-highlight-text mb-6">${ev.title||''}</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-[#111827] rounded-xl overflow-hidden border border-white/10">
          ${embed ? `<iframe class="w-full h-[320px] md:h-[380px]" src="${embed}" title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : `<div class="p-6 text-gray-400">No video added.</div>`}
        </div>
        <div class="bg-[#111827] rounded-xl p-5 border border-white/10">
          <div class="text-gray-300 mb-1"><b>Date</b>: ${ev.date||'-'}</div>
          <div class="text-gray-300 mb-1"><b>Time</b>: ${ev.time||'-'}</div>
          <div class="text-gray-300 mb-1"><b>Location</b>: ${ev.location||'-'}</div>
          <div class="text-gray-300 mb-1"><b>Client</b>: ${ev.client||'-'}</div>
          <p class="text-gray-400 mt-3">${ev.description||''}</p>
        </div>
      </div>

      <div class="mt-8">
        <h3 class="text-xl font-semibold mb-3">Gallery</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3" id="gallery-grid"></div>
      </div>
    </section>
  `;
  $('#back-home').onclick = ()=> renderHome();
  if(state.user){
    $('#edit-event').onclick = ()=> openEventForm(ev);
    $('#delete-event').onclick = ()=> deleteEvent(ev.id);
  }

  const g = $('#gallery-grid');
  (ev.gallery||[]).forEach(u=>{
    const img = document.createElement('img');
    img.src = u; img.className = 'w-full h-40 object-cover rounded-lg cursor-pointer';
    img.onclick = ()=> { $('#gallery-image-display').src = u; showModal('gallery-modal'); };
    g.appendChild(img);
  });
  window.lucide && window.lucide.createIcons();
}

/* ------------------- Event Form (Add/Edit) ---------------- */
function openEventForm(edit=null){
  // Build modal HTML dynamically for clarity
  const modalId = 'dynamic-event-modal';
  let modal = document.getElementById(modalId);
  if(!modal){
    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content custom-scrollbar">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">${edit? 'Edit Event' : 'Add Event'}</h3>
          <button id="event-close" class="button-style-minimal"><i data-lucide="x" class="w-6 h-6"></i></button>
        </div>
        <form id="event-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="id" value="${edit?.id||''}">
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Title</label>
            <input name="title" type="text" value="${edit?.title||''}" required />
          </div>
          <div>
            <label class="block text-sm mb-1">Date</label>
            <input name="date" type="date" value="${edit?.date||''}" />
          </div>
          <div>
            <label class="block text-sm mb-1">Time</label>
            <input name="time" type="time" value="${edit?.time||''}" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Location</label>
            <input name="location" type="text" value="${edit?.location||''}" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Client</label>
            <input name="client" type="text" value="${edit?.client||''}" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Description</label>
            <textarea name="description" rows="3">${edit?.description||''}</textarea>
          </div>

          <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm mb-1">YouTube Video URL (watch/shorts)</label>
              <input name="video" type="url" value="${edit?.video||''}" placeholder="https://youtu.be/... or https://youtube.com/watch?v=..." />
            </div>
            <div>
              <label class="block text-sm mb-1">Thumbnail URL (optional)</label>
              <input name="thumbnailUrl" type="url" value="${edit?.thumbnail||''}" placeholder="https://..." />
              <label class="block text-xs mt-2">or upload file</label>
              <input name="thumbnailFile" type="file" accept="image/*" />
            </div>
            <div>
              <label class="block text-sm mb-1">Poster URL (optional)</label>
              <input name="posterUrl" type="url" value="${edit?.poster||''}" placeholder="https://..." />
              <label class="block text-xs mt-2">or upload file</label>
              <input name="posterFile" type="file" accept="image/*" />
            </div>
            <div>
              <label class="block text-sm mb-1">Gallery URLs (comma separated)</label>
              <input name="galleryUrls" type="text" value="${(edit?.gallery||[]).join(', ')}" placeholder="https://img1, https://img2" />
              <label class="block text-xs mt-2">or upload multiple files</label>
              <input name="galleryFiles" type="file" accept="image/*" multiple />
            </div>
          </div>

          <div class="md:col-span-2 flex items-center justify-end gap-3 mt-2">
            <button type="button" id="event-cancel" class="button-style bg-gray-700">Cancel</button>
            <button type="submit" class="button-style">${edit? 'Save Changes' : 'Create Event'}</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);
  }else{
    modal.querySelector('h3').textContent = edit? 'Edit Event' : 'Add Event';
    modal.querySelector('form').reset();
    modal.querySelector('form').innerHTML = ''; // will be rebuilt below for simplicity
    modal.remove(); // remove old to rebuild to fill values
    return openEventForm(edit); // recurse once to rebuild cleanly
  }

  // Close
  $('#event-close', modal).onclick = ()=> hideModal(modalId);
  $('#event-cancel', modal).onclick = ()=> hideModal(modalId);

  // Submit
  $('#event-form', modal).onsubmit = async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get('id') || null;
    const payload = {
      title: fd.get('title')?.trim(),
      date: fd.get('date')||'',
      time: fd.get('time')||'',
      location: fd.get('location')?.trim()||'',
      client: fd.get('client')?.trim()||'',
      description: fd.get('description')?.trim()||'',
      video: fd.get('video') ? toYouTubeEmbed(fd.get('video')) : '',
      createdAt: (id? undefined : Date.now())
    };

    try{
      // Thumbnail
      const thumbFile = fd.get('thumbnailFile');
      const thumbUrl = fd.get('thumbnailUrl');
      if(thumbFile && thumbFile.size){ payload.thumbnail = await uploadFileReturnURL(thumbFile, 'thumbnails'); }
      else if(thumbUrl) payload.thumbnail = thumbUrl.trim();

      // Poster
      const posterFile = fd.get('posterFile');
      const posterUrl = fd.get('posterUrl');
      if(posterFile && posterFile.size){ payload.poster = await uploadFileReturnURL(posterFile, 'posters'); }
      else if(posterUrl) payload.poster = posterUrl.trim();

      // Gallery
      const gallery = [];
      const galFiles = fd.getAll('galleryFiles');
      for(const f of galFiles){ if(f && f.size){ gallery.push(await uploadFileReturnURL(f, 'gallery')); } }
      const galUrls = (fd.get('galleryUrls')||'').split(',').map(s=>s.trim()).filter(Boolean);
      gallery.push(...galUrls);
      if(gallery.length) payload.gallery = gallery;

      if(id){
        await window.setDoc(window.doc(db, 'events', id), payload, { merge: true });
        toast('Event updated successfully');
      }else{
        const ref = await window.addDoc(window.collection(db, 'events'), payload);
        toast('Event saved successfully');
      }
      hideModal(modalId);
      renderHome();
    }catch(err){
      console.error(err);
      toast('Failed to save event', 'error');
    }
  };

  showModal(modalId);
  window.lucide && window.lucide.createIcons();
}

async function deleteEvent(id){
  if(!id) return;
  try{
    await window.deleteDoc(window.doc(db, 'events', id));
    toast('Event deleted');
    renderHome();
  }catch(e){ console.error(e); toast('Failed to delete', 'error'); }
}

/* ---------------------- Admin Panel ----------------------- */
function renderAdminPanel(){
  state.view = 'admin';
  const root = document.getElementById('app-container');
  const email = state.user?.email || '(anonymous)';
  root.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl md:text-3xl font-bold">Admin Panel</h2>
        <div class="flex items-center gap-2">
          <button id="back" class="button-style bg-gray-700">Back</button>
          <button id="logout" class="button-style bg-red-600">Logout</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="admin-card p-5 bg-[#1f2937]">
          <h3 class="font-semibold mb-3">Account</h3>
          <div class="text-sm text-gray-300 mb-2">Signed in as: <b>${email}</b></div>
          <form id="change-cred-form" class="space-y-3">
            <div>
              <label class="block text-sm mb-1">New Email</label>
              <input type="email" name="newEmail" placeholder="new@email.com" />
            </div>
            <div>
              <label class="block text-sm mb-1">New Password</label>
              <input type="password" name="newPassword" placeholder="At least 6 characters" />
            </div>
            <button class="button-style" type="submit">Update Credentials</button>
          </form>
        </div>

        <div class="admin-card p-5 bg-[#1f2937] lg:col-span-2">
          <h3 class="font-semibold mb-3">Company Details</h3>
          <form id="company-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm mb-1">Company Name</label>
              <input name="name" type="text" value="${appSettings.company?.name||''}" />
            </div>
            <div>
              <label class="block text-sm mb-1">Email</label>
              <input name="email" type="email" value="${appSettings.company?.email||''}" />
            </div>
            <div>
              <label class="block text-sm mb-1">Phone</label>
              <input name="phone" type="text" value="${appSettings.company?.phone||''}" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm mb-1">Logo URL</label>
              <input name="logo" type="url" value="${appSettings.company?.logo||''}" />
            </div>
            <div>
              <label class="block text-sm mb-1">Mini Logo Type</label>
              <select name="miniType">
                <option value="icon" ${appSettings.company?.miniLogo?.type==='icon'?'selected':''}>Icon</option>
                <option value="image" ${appSettings.company?.miniLogo?.type==='image'?'selected':''}>Image URL</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">Mini Logo Value (icon name or image URL)</label>
              <input name="miniValue" type="text" value="${appSettings.company?.miniLogo?.value||'star'}" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm mb-1">Products (comma separated)</label>
              <input name="products" type="text" value="${(appSettings.company?.products||[]).join(', ')}" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm mb-1">Social Links (Name|URL per line)</label>
              <textarea name="social" rows="4">${(appSettings.company?.social||[]).map(s=>`${s.name}|${s.url}`).join('\n')}</textarea>
            </div>
            <div class="md:col-span-2 flex items-center justify-end gap-3">
              <button type="submit" class="button-style">Save Company</button>
            </div>
          </form>
        </div>
      </div>

      <div class="mt-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">All Events</h3>
          <button id="add-from-admin" class="button-style">Add Event</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="admin-events"></div>
      </div>
    </section>
  `;

  $('#back').onclick = ()=> renderHome();
  $('#logout').onclick = async ()=> { await window.signOut(auth); toast('Logged out'); renderHome(); };

  $('#add-from-admin').onclick = ()=> openEventForm();

  // List events
  const wrap = $('#admin-events');
  state.events.forEach(e=>{
    const el = document.createElement('div');
    el.className = 'bg-[#1f2937] rounded-lg p-4 border border-white/10';
    el.innerHTML = `<div class="font-semibold mb-1">${e.title}</div>
    <div class="text-xs text-gray-400 mb-2">${e.date||''} ${e.time||''}</div>
    <div class="flex gap-2">
      <button class="button-style bg-gray-700" data-act="edit">Edit</button>
      <button class="button-style bg-red-600" data-act="delete">Delete</button>
    </div>`;
    el.querySelector('[data-act="edit"]').onclick = ()=> openEventForm(e);
    el.querySelector('[data-act="delete"]').onclick = ()=> deleteEvent(e.id);
    wrap.appendChild(el);
  });

  // Company form
  $('#company-form').onsubmit = async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      company: {
        name: fd.get('name')?.trim(),
        email: fd.get('email')?.trim(),
        phone: fd.get('phone')?.trim(),
        logo: fd.get('logo')?.trim(),
        miniLogo: { type: fd.get('miniType'), value: fd.get('miniValue')?.trim()||'star' },
        products: (fd.get('products')||'').split(',').map(s=>s.trim()).filter(Boolean),
        social: (fd.get('social')||'').split('\n').map(line=>{ const [n,...rest]=line.split('|'); const url=rest.join('|').trim(); return n? {name:n.trim(), url} : null; }).filter(Boolean)
      }
    };
    try{
      await window.setDoc(settingsDocRef, data, { merge: true });
      toast('Company details saved');
      renderHeaderFooter();
    }catch(err){ console.error(err); toast('Failed to save company', 'error'); }
  };

  // Change credentials
  $('#change-cred-form').onsubmit = async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const newEmail = fd.get('newEmail')?.trim();
    const newPassword = fd.get('newPassword')?.trim();
    try{
      if(newEmail){ await window.updateEmail(auth.currentUser, newEmail); await window.setDoc(settingsDocRef, { adminEmail: newEmail }, { merge: true }); }
      if(newPassword){ await window.updatePassword(auth.currentUser, newPassword); }
      toast('Credentials updated');
      e.target.reset();
    }catch(err){ console.error(err); toast(err.message||'Failed to update', 'error'); }
  };

  window.lucide && window.lucide.createIcons();
}

/* --------------------- Company Modal ---------------------- */
$('#company-details-button').onclick = ()=>{
  // Fill products
  const list = document.getElementById('modal-products-list');
  list.innerHTML = '';
  (appSettings.company?.products||[]).forEach(p=>{
    const li = document.createElement('li');
    li.className = 'px-3 py-2 bg-[#1f2937] rounded-lg border border-white/10';
    li.textContent = p;
    list.appendChild(li);
  });
  // Social
  const soc = document.getElementById('modal-social-links');
  soc.innerHTML = '';
  (appSettings.company?.social||[]).forEach(s=>{
    const a = document.createElement('a'); a.href = s.url; a.target = '_blank';
    a.className = 'px-3 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10';
    a.textContent = s.name; soc.appendChild(a);
  });
  showModal('company-details-modal');
};
$('#company-details-close-button').onclick = ()=> hideModal('company-details-modal');
$('#gallery-close-button').onclick = ()=> hideModal('gallery-modal');

/* ----------------------- Login Modal ---------------------- */
$('#admin-access-button').onclick = ()=>{
  if(state.user) renderAdminPanel(); else showModal('admin-login-modal');
};
$('#admin-login-close-button').onclick = ()=> hideModal('admin-login-modal');
$('#admin-login-form').onsubmit = async (e)=>{
  e.preventDefault();
  const email = $('#admin-email').value.trim();
  const password = $('#admin-password').value.trim();
  try{
    await window.signInWithEmailAndPassword(auth, email, password);
    hideModal('admin-login-modal');
    toast('Welcome back');
    renderAdminPanel();
  }catch(err){ console.error(err); toast('Invalid credentials', 'error'); }
};

/* --------------------- App bootstrap ---------------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderHeaderFooter();
  renderHome();
});
