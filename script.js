// --- Global Application State and Firebase Initialization Variables ---
// These variables are declared globally so they can be accessed by all functions.
let app;      // Firebase app instance
let auth;     // Firebase Auth instance
let db;       // Firebase Firestore instance
let storage;  // Firebase Storage instance

let currentUserId = 'anonymous'; // Stores the current authenticated user's ID (or 'anonymous')
let appInitialized = false;     // Flag to ensure Firebase and initial data load only once
let currentGalleryImages = [];  // Array to hold images for the currently displayed fullscreen gallery
let currentGalleryIndex = 0;    // Index of the currently displayed image in the gallery modal
let currentEventForGallery = null; // Stores the full event object for the active gallery

// Your web app's Firebase configuration - DIRECTLY EMBEDDED
const firebaseConfig = {
    apiKey: "AIzaSyA_dPQ8JCGVi-aX7uS5NdnHpFKurT2jJC8",
    authDomain: "saisreeledevents.firebaseapp.com",
    projectId: "saisreeledevents",
    storageBucket: "saisreeledevents.firebasestorage.app",
    messagingSenderId: "212507109156",
    appId: "1:212507109156:web:5d7e230ba3d7945532f5b1",
    measurementId: "G-Y947LKLXGF"
};

// --- Define Initial Default Application Settings (Immutable) ---
// These are the base settings, including the admin credentials, that will always be available.
const INITIAL_APP_SETTINGS = {
    companyName: "LiveStream Hub",
    companyLogoUrl: "https://placehold.co/50x50/8b5cf6/ffffff?text=LOGO",
    miniLogoType: "icon",       // Can be "icon" or "image"
    miniLogoIcon: "star",       // Lucide icon name if miniLogoType is "icon"
    miniLogoImageUrl: "",       // URL if miniLogoType is "image"
    contactEmail: "raju.saisree.rk@gmail.com",
    contactPhone: "9849135853",
    copyrightText: "© 2025 LiveStream Hub. All rights reserved.",
    instagramUrl: "https://instagram.com/yourcompany",
    youtubeUrl: "https://youtube.com/yourcompany",
    products: [
        { id: 'prod1', title: 'Premium Live Access', description: 'Unlock exclusive events and ad-free viewing with a premium pass.' },
        { id: 'prod2', title: 'Event Replays Pass', description: 'Access all past event recordings on demand.' }
    ],
    founder: {
        name: 'Dr. Tech Visionary',
        title: 'Founder & CEO',
        bio: 'A pioneer in digital event streaming, dedicated to connecting communities worldwide through innovative technology.'
    },
    teamMembers: [
        { id: 'team1', name: 'Alice Smith', role: 'Head of Content', photoUrl: 'https://placehold.co/100x100/4a5568/ffffff?text=AS' },
        { id: 'team2', name: 'Bob Johnson', role: 'Lead Engineer', photoUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=BJ' }
    ],
    theme: {
        globalBackground: "#0a0a0a",
        buttonColor: "#4f46e5",
        buttonHoverColor: "#4338ca",
        buttonTextColor: "#ffffff",
        depthStyle: "flat", // Default to flat for 2D professional look
    },
    adminUsername: "raju.saisree.rk@gmail.com", // Admin login username (IMPORTANT: Stored locally, not in Firestore)
    adminPassword: "9849135853" // Admin login password (IMPORTANT: Stored locally, not in Firestore)
};

// appSettings will be a mutable copy, initialized with the default settings.
// Its admin credentials will be protected from Firestore overwrites.
let appSettings = { ...INITIAL_APP_SETTINGS };

let eventsData = []; // Array to hold all event objects fetched from Firestore

// --- Global DOM Element References (declared here, assigned in DOMContentLoaded) ---
// Declaring them globally makes them accessible to all functions.
let appContainer;
let companyLogo;
let companyName;
let footerContact;
let footerEmail;
let footerPhone;
let copyrightText;
let miniLogoContainer;
let miniLogoIcon;
let miniLogoImg;

let companyDetailsButton;
let adminAccessButton;

let messageBoxModal;
let messageBoxText;
let messageBoxConfirm;
let messageBoxCancel;

let companyDetailsModal;
let companyDetailsCloseButton;
let modalProductsList;
let modalSocialLinks;
let modalFounderTeamSection;
let modalFounderBio;
let modalTeamMembers;

let galleryModal;
let galleryImageDisplay;
// Removed galleryPrevButton and galleryNextButton as requested
let galleryCloseButton;

let adminLoginModal;
let adminLoginForm;
let adminEmailInput;
let adminPasswordInput;
let adminLoginCloseButton;


// --- Ensure Lucide icons are rendered after DOM is loaded ---
// This script runs after the DOM is fully loaded, ensuring all HTML elements are available.
document.addEventListener('DOMContentLoaded', () => {
    // Check if Lucide library is available before creating icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- Assign DOM Elements (now that they are guaranteed to exist) ---
    appContainer = document.getElementById('app-container');
    companyLogo = document.getElementById('company-logo');
    companyName = document.getElementById('company-name');
    footerContact = document.getElementById('footer-contact');
    footerEmail = document.getElementById('footer-email');
    footerPhone = document.getElementById('footer-phone');
    copyrightText = document.getElementById('copyright-text');
    miniLogoContainer = document.getElementById('mini-logo-container');
    miniLogoIcon = document.getElementById('mini-logo-icon');
    miniLogoImg = document.getElementById('mini-logo-img');

    companyDetailsButton = document.getElementById('company-details-button');
    adminAccessButton = document.getElementById('admin-access-button');

    messageBoxModal = document.getElementById('message-box-modal');
    messageBoxText = document.getElementById('message-box-text');
    messageBoxConfirm = document.getElementById('message-box-confirm');
    messageBoxCancel = document.getElementById('message-box-cancel');

    companyDetailsModal = document.getElementById('company-details-modal');
    companyDetailsCloseButton = document.getElementById('company-details-close-button');
    modalProductsList = document.getElementById('modal-products-list');
    modalSocialLinks = document.getElementById('modal-social-links');
    modalFounderTeamSection = document.getElementById('modal-founder-team-section');
    modalFounderBio = document.getElementById('modal-founder-bio');
    modalTeamMembers = document.getElementById('modal-team-members');

    galleryModal = document.getElementById('gallery-modal');
    galleryImageDisplay = document.getElementById('gallery-image-display');
    // Removed galleryPrevButton and galleryNextButton as requested
    galleryCloseButton = document.getElementById('gallery-close-button');

    adminLoginModal = document.getElementById('admin-login-modal');
    adminLoginForm = document.getElementById('admin-login-form');
    adminEmailInput = document.getElementById('admin-email');
    adminPasswordInput = document.getElementById('admin-password');
    adminLoginCloseButton = document.getElementById('admin-login-close-button');


    // --- Attach Event Listeners for Modals ---
    // This ensures buttons are clickable as soon as they exist in the DOM.
    if (companyDetailsButton) {
        companyDetailsButton.addEventListener('click', () => {
            console.log("Company Details button clicked."); // Debugging log
            // Populate and show the Company Details modal
            modalProductsList.innerHTML = ''; // Clear previous content
            if (appSettings.products && appSettings.products.length > 0) {
                appSettings.products.forEach(product => {
                    const li = document.createElement('li');
                    li.className = 'text-gray-300';
                    li.innerHTML = `<span class="font-semibold text-white">${product.title}:</span> ${product.description}`;
                    modalProductsList.appendChild(li);
                });
            } else {
                modalProductsList.innerHTML = '<li class="text-gray-500">No products listed.</li>';
            }

            modalSocialLinks.innerHTML = ''; // Clear previous content
            if (appSettings.instagramUrl) {
                const instaBtn = document.createElement('a');
                instaBtn.href = appSettings.instagramUrl;
                instaBtn.target = '_blank'; // Open in new tab
                instaBtn.className = 'px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg button-style flex items-center';
                instaBtn.innerHTML = '<i data-lucide="instagram" class="w-5 h-5 mr-2"></i> Instagram';
                modalSocialLinks.appendChild(instaBtn);
            }
            if (appSettings.youtubeUrl) {
                const ytBtn = document.createElement('a');
                ytBtn.href = appSettings.youtubeUrl;
                ytBtn.target = '_blank'; // Open in new tab
                ytBtn.className = 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg button-style flex items-center';
                ytBtn.innerHTML = '<i data-lucide="youtube" class="w-5 h-5 mr-2"></i> YouTube';
                modalSocialLinks.appendChild(ytBtn);
            }
            if (!appSettings.instagramUrl && !appSettings.youtubeUrl) {
                modalSocialLinks.innerHTML = '<p class="text-gray-500 text-center">No social links provided.</p>';
            }
            lucide.createIcons(); // Re-render icons for social buttons

            // Populate Founder & Team section
            modalFounderBio.innerHTML = '';
            modalTeamMembers.innerHTML = '';
            const hasFounder = appSettings.founder?.name && appSettings.founder?.bio;
            const hasTeam = appSettings.teamMembers && appSettings.teamMembers.length > 0;

            if (hasFounder || hasTeam) {
                modalFounderTeamSection.classList.remove('hidden');
                if (hasFounder) {
                    modalFounderBio.innerHTML = `
                        <h4 class="text-xl font-semibold mb-2 text-white">${appSettings.founder.name} <span class="text-gray-400 text-base">(${appSettings.founder.title})</span></h4>
                        <p class="text-gray-300">${appSettings.founder.bio}</p>
                    `;
                }
                if (hasTeam) {
                    appSettings.teamMembers.forEach(member => {
                        const memberCard = document.createElement('div');
                        memberCard.className = 'bg-gray-700 p-4 rounded-lg shadow-inner text-center';
                        memberCard.innerHTML = `
                            <img src="${member.photoUrl || 'https://placehold.co/100x100/4a5568/ffffff?text=TM'}" alt="${member.name}" class="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-2 border-purple-400">
                            <h5 class="text-lg font-semibold text-white">${member.name}</h5>
                            <p class="text-gray-400 text-sm">${member.role}</p>
                        `;
                        modalTeamMembers.appendChild(memberCard);
                    });
                }
            } else {
                modalFounderTeamSection.classList.add('hidden'); // Hide if no data
            }

            showModal(companyDetailsModal); // Display the modal
            applyTheme(); // Reapply theme to ensure buttons inside modal are styled
        });
    } else {
        console.warn("Company Details button not found. Check HTML ID.");
    }

    // Event listener for the "Admin" button in the footer
    if (adminAccessButton) {
        adminAccessButton.addEventListener('click', () => {
            console.log("Admin button clicked. Showing admin login modal."); // Debugging log
            showModal(adminLoginModal); // Display the Admin Login modal
        });
    } else {
        console.warn("Admin button not found. Check HTML ID.");
    }

    // Attach close listeners for all modals
    if (companyDetailsCloseButton) companyDetailsCloseButton.addEventListener('click', () => hideModal(companyDetailsModal));
    if (adminLoginCloseButton) adminLoginCloseButton.addEventListener('click', () => hideModal(adminLoginModal));
    if (galleryCloseButton) galleryCloseButton.addEventListener('click', () => hideModal(galleryModal));

    // Admin Login Form Submission
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission to handle login asynchronously
            const email = adminEmailInput.value.trim();
            const password = adminPasswordInput.value.trim();

            console.log(`Attempting admin login with email: ${email}`); // Debugging log

            // --- IMPORTANT: This section now attempts REAL Firebase Authentication ---
            try {
                // Sign in with email and password using Firebase Auth
                const userCredential = await window.signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("Firebase Auth sign-in successful:", user.uid, user.email);

                // Successfully signed in. Now hide the modal.
                // The redirection to admin panel will be handled by onAuthStateChanged listener
                // once the auth.currentUser object is fully updated.
                hideModal(adminLoginModal);
                await showMessageBox("Login successful. Checking admin privileges..."); // Inform user
            } catch (error) {
                console.error("Firebase Auth sign-in failed:", error.code, error.message);
                let errorMessage = "Admin login failed. Please try again.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = "Incorrect email or password. Please check your credentials.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = "Invalid email format.";
                } else if (error.code === 'auth/network-request-failed') {
                    errorMessage = "Network error. Please check your internet connection.";
                }
                await showMessageBox(errorMessage);
            }
        });
    } else {
        console.warn("Admin login form not found. Check HTML ID.");
    }

    // Initialize Firebase and start routing after DOM is ready
    // This is the main entry point for the application's dynamic content.
    initializeFirebase();
});

// --- Helper Functions ---

/**
 * @function showMessageBox
 * @description Displays a custom modal message box instead of native alert/confirm.
 * @param {string} message The message text to display to the user.
 * @param {boolean} [isConfirm=false] If true, displays a "Cancel" button, making it a confirmation dialog.
 * @returns {Promise<boolean>} A Promise that resolves to `true` if "OK"/"Confirm" is clicked,
 * or `false` if "Cancel` is clicked.
 */
function showMessageBox(message, isConfirm = false) {
    // Ensure modal elements are defined before trying to use them
    // These are now globally declared and assigned in DOMContentLoaded
    if (!messageBoxModal || !messageBoxText || !messageBoxConfirm || !messageBoxCancel) {
        console.error("Message box elements not found. Cannot display custom message. Falling back to alert.");
        alert(message); // Fallback to native alert if elements aren't found
        return Promise.resolve(true); // Assume OK for fallback
    }

    return new Promise(resolve => {
        messageBoxText.textContent = message;
        messageBoxCancel.style.display = isConfirm ? 'inline-flex' : 'none'; // Show/hide cancel button
        messageBoxModal.classList.remove('hidden'); // Ensure it's visible before adding active for transition
        setTimeout(() => {
            messageBoxModal.classList.add('active'); // Show the modal
        }, 10); // Small delay to allow 'hidden' removal to process

        // Event listener for "OK" or "Confirm" button
        const confirmHandler = () => {
            messageBoxModal.classList.remove('active'); // Hide modal
            setTimeout(() => {
                messageBoxModal.classList.add('hidden'); // Fully hide after transition
            }, 300);
            messageBoxConfirm.removeEventListener('click', confirmHandler);
            messageBoxCancel.removeEventListener('click', cancelHandler);
            resolve(true); // Resolve promise with true
        };

        // Event listener for "Cancel" button
        const cancelHandler = () => {
            messageBoxModal.classList.remove('active'); // Hide modal
            setTimeout(() => {
                messageBoxModal.classList.add('hidden'); // Fully hide after transition
            }, 300);
            messageBoxConfirm.removeEventListener('click', confirmHandler);
            messageBoxCancel.removeEventListener('click', cancelHandler);
            resolve(false); // Resolve promise with false
        };

        // Attach event listeners
        messageBoxConfirm.addEventListener('click', confirmHandler);
        messageBoxCancel.addEventListener('click', cancelHandler);
    });
}

/**
 * @function generateUniqueId
 * @description Generates a simple, unique ID string. Not cryptographically secure, but sufficient for this demo.
 * @returns {string} A unique ID.
 */
function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * @function applyTheme
 * @description Applies the globally defined theme settings (colors, etc.) to the DOM elements.
 * This function is crucial for dynamic theme changes from the admin panel.
 */
function applyTheme() {
    // Ensure body exists before trying to set its style
    if (document.body) {
        document.body.style.backgroundColor = appSettings.theme.globalBackground;
    }

    // Update CSS variables for gradients based on button colors
    document.documentElement.style.setProperty('--primary-color', appSettings.theme.buttonColor);
    document.documentElement.style.setProperty('--secondary-color', appSettings.theme.buttonHoverColor);

    // Select all elements that should receive dynamic button styling
    const buttons = document.querySelectorAll('.button-style');
    buttons.forEach(button => {
        // Apply background and text colors from appSettings
        button.style.backgroundColor = appSettings.theme.buttonColor;
        button.style.color = appSettings.theme.buttonTextColor;

        // Apply hover effects using JavaScript for dynamic colors
        button.onmouseover = () => button.style.backgroundColor = appSettings.theme.buttonHoverColor;
        button.onmouseout = () => button.style.backgroundColor = appSettings.theme.buttonColor;
        // Also for touch devices to ensure visual feedback
        button.ontouchstart = () => button.style.backgroundColor = appSettings.theme.buttonHoverColor;
        button.ontouchend = () => button.style.backgroundColor = appSettings.theme.buttonColor;
    });

    // Re-create Lucide icons to ensure any color changes or data-lucide attributes are rendered
    // This is important for icons within dynamically created elements or those tied to theme colors.
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * @function updateGlobalElements
 * @description Updates the content of global elements like company name, logo, footer contact,
 * and mini-logo based on `appSettings`.
 */
function updateGlobalElements() {
    // Ensure elements exist before trying to update them
    // These are now globally declared and assigned in DOMContentLoaded
    if (companyName) companyName.textContent = appSettings.companyName;
    if (companyLogo) companyLogo.src = appSettings.companyLogoUrl;
    if (footerEmail) footerEmail.textContent = appSettings.contactEmail;
    if (footerPhone) footerPhone.textContent = appSettings.contactPhone;
    if (copyrightText) copyrightText.textContent = appSettings.copyrightText;

    // Handle mini-logo display (icon or image)
    if (miniLogoIcon && miniLogoImg) {
        if (appSettings.miniLogoType === 'icon' && appSettings.miniLogoIcon) {
            miniLogoIcon.setAttribute('data-lucide', appSettings.miniLogoIcon); // Set Lucide icon name
            miniLogoIcon.classList.remove('hidden'); // Show icon
            miniLogoImg.classList.add('hidden');    // Hide image
            if (typeof lucide !== 'undefined') {
                lucide.createIcons(); // Re-render icon to apply changes
            }
        } else if (appSettings.miniLogoType === 'image' && appSettings.miniLogoImageUrl) {
            miniLogoImg.src = appSettings.miniLogoImageUrl; // Set image source
            miniLogoImg.classList.remove('hidden'); // Show image
            miniLogoIcon.classList.add('hidden');    // Hide icon
        } else {
            // Fallback to a default star icon if no valid mini-logo type or source is set
            miniLogoIcon.setAttribute('data-lucide', 'star');
            miniLogoIcon.classList.remove('hidden');
            miniLogoImg.classList.add('hidden');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
}

/**
 * @function isAdmin
 * @description Checks if the currently authenticated user is the administrator.
 * @param {object} [user=null] The Firebase user object to check. If null, uses auth.currentUser.
 * @returns {boolean} True if the current user is the admin, false otherwise.
 */
function isAdmin(user = null) {
    const userToCheck = user || auth.currentUser; // Use provided user or current authenticated user
    if (!userToCheck || !userToCheck.email) {
        console.log("isAdmin check: User object or email is null/undefined.");
        return false;
    }
    // Ensure both values are trimmed and lowercased for a robust comparison
    const currentUserEmail = userToCheck.email.trim().toLowerCase();
    const adminEmailSetting = appSettings.adminUsername.trim().toLowerCase();
    console.log(`isAdmin check: Current User Email: '${currentUserEmail}', Admin Setting: '${adminEmailSetting}'`);
    return currentUserEmail === adminEmailSetting;
}

/**
 * @function showModal
 * @description Adds the 'active' class and removes the 'hidden' class to a modal element to make it visible.
 * @param {HTMLElement} modalElement The modal DOM element to show.
 */
function showModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('hidden'); // IMPORTANT: Remove 'hidden' first
        // Adding a slight delay before adding 'active' ensures the 'hidden' removal
        // is processed, allowing CSS transitions to work properly from 'display: block'
        setTimeout(() => {
            modalElement.classList.add('active');
        }, 10); // A small delay (e.g., 10ms) is often sufficient
    } else {
        console.warn("Attempted to show a null modal element.");
    }
}

/**
 * @function hideModal
 * @description Removes the 'active' class and adds the 'hidden' class from a modal element to hide it.
 * @param {HTMLElement} modalElement The modal DOM element to hide.
 */
function hideModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('active'); // Remove 'active' for transition effect
        // After the transition completes, add 'hidden' back
        // The transition duration for modal-backdrop is 0.3s (300ms)
        setTimeout(() => {
            modalElement.classList.add('hidden'); // Add 'hidden' after transition for full concealment
        }, 300); // Match this timeout to your CSS transition duration (0.3s = 300ms)
    } else {
        console.warn("Attempted to hide a null modal element.");
    }
}

/**
 * @function uploadFile
 * @description Uploads a given File object to Firebase Storage and returns its public download URL.
 * @param {File} file The File object to upload.
 * @param {string} path The storage path within Firebase Storage (e.g., 'logos/', 'event_thumbnails/', 'events/eventId/gallery/').
 * @returns {Promise<string|null>} A Promise that resolves with the public URL of the uploaded file,
 * or `null` if the upload fails or storage is not initialized.
 */
async function uploadFile(file, path) {
    if (!storage) {
        await showMessageBox("Firebase Storage not initialized. Cannot upload files. Ensure your Firebase configuration includes Storage.");
        console.error("Firebase Storage not initialized.");
        return null;
    }
    // Create a unique filename to prevent conflicts and ensure unique URLs
    const filename = `${file.name.split('.').slice(0, -1).join('.')}-${Date.now()}.${file.name.split('.').pop()}`;
    const storageRef = window.ref(storage, `${path}/${filename}`); // Create a reference to the file's location in Storage

    try {
        const snapshot = await window.uploadBytes(storageRef, file); // Upload the file
        const downloadURL = await window.getDownloadURL(snapshot.ref); // Get the public download URL
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        await showMessageBox(`Error uploading file: ${error.message}. Please try again.`);
        return null;
    }
}

// --- Firebase Initialization & Data Loading Functions ---

/**
 * @function initializeFirebase
 * @description Initializes Firebase services (App, Auth, Firestore, Storage) and sets up
 * the authentication state listener. This is the entry point for Firebase.
 */
async function initializeFirebase() {
    try {
        // Initialize Firebase app with your provided config
        app = window.initializeApp(firebaseConfig);
        auth = window.getAuth(app);
        db = window.getFirestore(app);
        storage = window.getStorage(app);
        console.log("Firebase services initialized with provided config.");

        // Set up a listener for Firebase authentication state changes
        window.onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUserId = user.uid; // Set current user ID
                console.log("Auth state changed: User is logged in. UID:", user.uid);

                // Add a small delay for auth.currentUser.email to fully populate
                // This is crucial for the isAdmin() check to work reliably right after sign-in
                setTimeout(async () => {
                    // --- ADMIN REDIRECTION LOGIC ---
                    // Only attempt to redirect to admin panel if app is initialized
                    // and the user is now authenticated as an admin.
                    // Pass the 'user' object directly to isAdmin for immediate accurate check
                    if (appInitialized && isAdmin(user)) {
                        console.log("User is admin, redirecting to admin panel.");
                        // Only redirect if not already on the admin page to prevent infinite loops
                        if (window.location.hash !== '#admin') {
                            window.location.hash = '#admin';
                        }
                    } else if (appInitialized && window.location.hash === '#admin' && !isAdmin(user)) {
                        // If user is on admin page but not admin, redirect them out
                        showMessageBox("Access Denied: You must be logged in as an administrator to access this panel.").then(() => {
                            window.location.hash = ''; // Redirect to home page
                        });
                    }
                    // --- END ADMIN REDIRECTION LOGIC ---
                }, 100); // 100ms delay to allow auth.currentUser to update

            } else {
                currentUserId = 'anonymous'; // User is signed out or anonymous
                console.log("Auth state changed: User is anonymous or logged out.");
                // If a user logs out while on the admin page, redirect them to home
                if (appInitialized && window.location.hash === '#admin') {
                    window.location.hash = '';
                }
            }

            // Execute initial app setup only once after authentication state is determined
            if (!appInitialized) {
                // If no user is logged in, sign in anonymously for public access
                if (!user) {
                    await window.signInAnonymously(auth);
                    console.log("Signed in anonymously.");
                }
                appInitialized = true; // Mark app as initialized
                await loadAppData();   // Load core application data from Firestore
                handleRouting();       // Render the initial page based on URL hash
            }
        });

        // Ensure an initial anonymous sign-in is attempted if no auth state is present
        if (!auth.currentUser) {
            console.log("No current user, attempting initial anonymous sign-in.");
            await window.signInAnonymously(auth);
        }

    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        await showMessageBox("Failed to initialize Firebase. Some features may not work. Check console for details.");
        appInitialized = true; // Still allow app to render with mock data
        loadMockData();
        handleRouting();
    }
}

/**
 * @function loadAppData
 * @description Loads application settings and event data from Firestore.
 * Uses `onSnapshot` for real-time updates to keep the UI synchronized.
 */
async function loadAppData() {
    if (!db) {
        console.warn("Firestore not initialized. Cannot load data. Using mock data.");
        loadMockData(); // Fallback to mock data if Firestore is not available
        return;
    }

    // Set up real-time listener for application settings (company details, theme, etc.)
    const settingsDocRef = window.doc(db, "settings", "company");
    window.onSnapshot(settingsDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            // Merge data from Firestore, but ensure original admin credentials are preserved.
            // We start with a fresh copy of INITIAL_APP_SETTINGS to ensure adminUsername/Password are always present,
            // then overlay with data from Firestore.
            appSettings = {
                ...INITIAL_APP_SETTINGS, // Use the immutable base settings
                ...docSnapshot.data()    // Overlay with loaded data (which won't contain admin credentials)
            };
            console.log("App settings loaded:", appSettings);
        } else {
            console.log("No app settings found in Firestore. Saving default settings.");
            saveAppSettings(); // Save default settings if the document doesn't exist
        }
        updateGlobalElements(); // Update header/footer based on new settings
        applyTheme();           // Apply theme colors
        handleRouting();        // Re-render current page to reflect potential theme/content changes
    }, (error) => {
        console.error("Error listening to settings data:", error);
        showMessageBox("Failed to load app settings. Using default values. Check console for errors.");
    });

    // Set up real-time listener for events data
    const eventsCollectionRef = window.collection(db, "events");
    window.onSnapshot(eventsCollectionRef, (snapshot) => {
        // Map Firestore documents to plain JavaScript objects
        eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Events data loaded:", eventsData);
        handleRouting(); // Re-render current page to reflect updated event list
    }, (error) => {
        console.error("Error listening to events data:", error);
        showMessageBox("Failed to load events data. Using mock data. Check console for errors.");
        loadMockData(); // Fallback to mock data on error
    });
}

/**
 * @function saveAppSettings
 * @description Saves the current `appSettings` object to Firestore.
 * Excludes sensitive admin credentials from the publicly accessible settings document.
 */
async function saveAppSettings() {
    if (!db) {
        await showMessageBox("Firestore not initialized. Cannot save settings.");
        return;
    }
    try {
        // Create a copy of appSettings and remove sensitive admin credentials before saving to public document
        const settingsToSave = { ...appSettings }; // Use the current appSettings
        delete settingsToSave.adminUsername; // Remove before saving to Firestore
        delete settingsToSave.adminPassword; // Remove before saving to Firestore

        // Use `setDoc` with `doc(db, "settings", "company")` to create or overwrite the single settings document
        await window.setDoc(window.doc(db, "settings", "company"), settingsToSave);
        console.log("App settings saved successfully.");
        // UI updates are handled by the onSnapshot listener in loadAppData()
    }
    catch (error) {
        console.error("Error saving app settings:", error);
        await showMessageBox("Error saving settings. Please check your Firebase setup and permissions.");
    }
}

/**
 * @function saveEvent
 * @description Saves a new event or updates an existing one in Firestore.
 * @param {object} event The event object to save/update. Must have an `id` property for updates.
 */
async function saveEvent(event) {
    if (!db) {
        await showMessageBox("Firestore not initialized. Cannot save event.");
        return;
    }
    try {
        if (event.id) {
            // If event has an ID, it's an existing event, so update it
            await window.setDoc(window.doc(db, "events", event.id), event, { merge: true }); // `merge: true` preserves existing fields not specified
            await showMessageBox("Event updated successfully!");
        } else {
            // If no ID, it's a new event, so add it to the collection
            const newDocRef = await window.addDoc(window.collection(db, "events"), event);
            event.id = newDocRef.id; // Assign the new Firestore document ID to the event object
            await showMessageBox("Event added successfully!");
        }
    } catch (error) {
            console.error("Error saving event:", error);
            await showMessageBox("Error saving event. Please check console for details.");
    }
}

/**
 * @function deleteEvent
 * @description Deletes an event from Firestore after user confirmation.
 * @param {string} eventId The ID of the event to delete.
 */
async function deleteEvent(eventId) {
    if (!db) {
        await showMessageBox("Firestore not initialized. Cannot delete event.");
        return;
    }
    // Ask for user confirmation before deleting
    const confirmed = await showMessageBox("Are you sure you want to delete this event? This action cannot be undone.", true);
    if (confirmed) {
        try {
            await window.deleteDoc(window.doc(db, "events", eventId)); // Delete the document
            await showMessageBox("Event deleted successfully!");
        } catch (error) {
            console.error("Error deleting event:", error);
            await showMessageBox("Error deleting event. Please check console for details.");
        }
    }
}

// Mock Data for offline testing
function loadMockData() {
    // Static mock data for events
    eventsData = [
        {
            id: 'mock-event-1',
            title: 'Virtual Tech Summit 2024',
            slug: 'tech-summit-2024',
            dateTime: '2024-09-15T10:00:00', // ISO string for datetime-local input
            venue: 'Online',
            video: {
                type: 'youtube',
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Rick Roll for demo
                width: '100%',
                height: 'auto',
                fit: 'contain'
            },
            thumbnailUrl: 'https://placehold.co/400x225/2563eb/ffffff?text=Tech+Summit',
            posterUrl: 'https://placehold.co/800x450/FF5733/FFFFFF?text=Mock+Poster+1', // Mock poster
            gallery: [
                { id: generateUniqueId(), url: 'https://placehold.co/800x600/6d28d9/ffffff?text=Keynote+Speaker', caption: 'Keynote Speaker' },
                { id: generateUniqueId(), url: 'https://placehold.co/800x600/8b5cf6/ffffff?text=Networking+Session', caption: 'Networking Session' },
                { id: generateUniqueId(), url: 'https://placehold.co/800x600/a78bfa/ffffff?text=Innovation+Showcase', caption: 'Innovation Showcase' }
            ],
            bg: '#1e3a8a', // Specific background for this event
            client: 'Global Tech Co.',
            description: 'Join us for the annual Virtual Tech Summit, bringing together industry leaders and innovators from around the globe to discuss the future of technology.',
            chatEnabled: false, // Chat removed
            status: 'published',
            featured: true,
            likes: 125, // Mock initial likes
            views: 500, // Mock initial views
        },
        {
            id: 'mock-event-2',
            title: 'Creative Arts Festival Live',
            slug: 'arts-fest-live',
            dateTime: '2024-10-20T14:30:00',
            venue: 'Virtual Stage',
            video: {
                type: 'other',
                url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Generic MP4 for demo
                width: '100%',
                height: 'auto',
                fit: 'contain'
            },
            thumbnailUrl: 'https://placehold.co/400x225/db2777/ffffff?text=Arts+Fest',
            posterUrl: 'https://placehold.co/800x450/33FF57/000000?text=Mock+Poster+2', // Mock poster
            gallery: [
                { id: generateUniqueId(), url: 'https://placehold.co/800x600/ec4899/ffffff?text=Artwork+Showcase', caption: 'Digital Art Showcase' },
                { id: generateUniqueId(), url: 'https://placehold.co/800x600/f472b6/ffffff?text=Live+Performance', caption: 'Live Music Performance' }
            ],
            bg: '#831843',
            client: 'Art & Culture Society',
            description: 'Experience the vibrant world of creative arts with live performances, exclusive showcases, and interactive workshops for all ages.',
            chatEnabled: false, // Chat removed
            status: 'published',
            featured: false,
            likes: 78,
            views: 300,
        }
    ];
    console.log("Loaded mock data.");
    // Update global elements and apply theme based on default appSettings
    updateGlobalElements();
    applyTheme();
}


// --- Routing Logic ---
/**
 * @function handleRouting
 * @description Manages client-side routing by interpreting the URL hash and rendering
 * the appropriate page (Home, Event Detail, or Admin Panel).
 */
function handleRouting() {
    // No chat listener to unsubscribe from as chat is removed.

    const hash = window.location.hash; // Get the current URL hash
    if (hash.startsWith('#event=')) {
        const slug = hash.substring('#event='.length); // Extract the event slug
        renderEventPage(slug); // Render the specific event page
    } else if (hash === '#admin') {
        renderAdminPanel(); // Render the admin panel
    } else {
        renderHomePage(); // Default to the home page (events list)
    }
}

// Listen for changes in the URL hash to trigger routing
window.addEventListener('hashchange', handleRouting);


// --- Public Facing Views ---

/**
 * @function renderHomePage
 * @description Renders the main public page displaying a list of live and upcoming events.
 */
function renderHomePage() {
    // Ensure appContainer is valid
    if (!appContainer) { console.error("App container not found."); return; }

    appContainer.innerHTML = ''; // Clear any existing content in the main container
    // Reset or apply base classes for the home page container
    appContainer.className = 'flex-1 p-4 overflow-hidden';

    // Ensure admin button is visible ONLY on the home page
    if (adminAccessButton) {
        adminAccessButton.classList.remove('hidden');
    }

    // Apply the global background color from appSettings
    document.body.style.backgroundColor = appSettings.theme.globalBackground;

    // Create main page content wrapper
    const pageContent = document.createElement('div');
    pageContent.className = 'max-w-7xl mx-auto py-8 px-4'; // Centered, max-width container

    // Page heading
    const eventsHeading = document.createElement('h2');
    eventsHeading.className = 'text-4xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500';
    eventsHeading.textContent = 'Upcoming & Live Events';
    pageContent.appendChild(eventsHeading);

    // Grid container for event cards
    const eventsGrid = document.createElement('div');
    eventsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'; // Responsive grid layout

    // Check if there are any published events to display
    const publishedEvents = eventsData.filter(event => event.status === 'published');
    if (publishedEvents.length === 0) {
        // Display a message if no events are available
        const noEventsMessage = document.createElement('p');
        noEventsMessage.className = 'text-center text-gray-400 text-xl col-span-full';
        noEventsMessage.textContent = 'No events available yet. Check back soon!';
        eventsGrid.appendChild(noEventsMessage);
    } else {
        // Iterate over published events and create a card for each
        publishedEvents.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 relative';
            // Set click handler to navigate to the event's detail page using its slug
            eventCard.onclick = () => window.location.hash = `#event=${event.slug}`;

            // Populate card HTML with event data
            eventCard.innerHTML = `
                <img src="${event.thumbnailUrl || 'https://placehold.co/400x225/6b7280/ffffff?text=No+Thumbnail'}" alt="${event.title}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <h3 class="text-xl font-bold text-white mb-2">${event.title}</h3>
                    <p class="text-gray-400 text-sm mb-1"><i data-lucide="calendar" class="inline-block w-4 h-4 mr-1"></i> ${new Date(event.dateTime).toLocaleString()}</p>
                    <p class="text-gray-400 text-sm"><i data-lucide="map-pin" class="inline-block w-4 h-4 mr-1"></i> ${event.venue}</p>
                    <div class="mt-4 flex items-center justify-center">
                        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md button-style">
                            View Event
                        </button>
                    </div>
                </div>
            `;
            eventsGrid.appendChild(eventCard);
        });
    }

    pageContent.appendChild(eventsGrid);
    appContainer.appendChild(pageContent);
    if (typeof lucide !== 'undefined') {
        lucide.createIcons(); // Re-render icons after adding new HTML
    }
    applyTheme(); // Ensure theme colors are applied to newly created buttons/elements
}

/**
 * @function renderEventPage
 * @description Renders the detailed page for a specific live event.
 * @param {string} slug The unique slug of the event to display.
 */
function renderEventPage(slug) {
    // Ensure appContainer is valid
    if (!appContainer) { console.error("App container not found."); return; }

    // Ensure admin button is hidden on event detail pages
    if (adminAccessButton) {
        adminAccessButton.classList.add('hidden');
    }

    // Find the event by its slug and ensure it's published
    const event = eventsData.find(e => e.slug === slug && e.status === 'published');

    if (!event) {
        // If event not found or not published, display an error message and a back button
        appContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] text-gray-400 text-2xl">
                <i data-lucide="search-x" class="w-16 h-16 mb-4 text-gray-600"></i>
                <p>Event not found or not published.</p>
                <button onclick="window.location.hash='';" class="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg button-style">
                    Back to Events
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(); // Render icons
        }
        applyTheme();        // Apply theme colors
        return;
    }

    // Apply per-event background if specified, otherwise use the global background
    document.body.style.backgroundColor = event.bg || appSettings.theme.globalBackground;

    // Determine video player dimensions
    const videoWidth = event.video?.width || '100%';
    const videoHeight = event.video?.height || 'auto'; // 'auto' for responsive height if width is 100%

    // Populate the main content area with event details
    appContainer.innerHTML = `
        <div class="max-w-7xl mx-auto py-8 px-4">
            <!-- Back Button to return to the events list -->
            <button onclick="window.location.hash='';" class="flex items-center text-gray-400 hover:text-purple-400 transition-colors duration-200 mb-6 button-style-minimal">
                <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i> Back to Events
            </button>

            <div class="bg-gray-800 rounded-lg shadow-lg p-6 mb-8 event-card">
                <!-- Event Name Highlight -->
                <h2 class="event-highlight-text text-center mb-4">${event.title}</h2>
                <!-- Event Date, Time, and Venue -->
                <p class="text-gray-400 text-center mb-6 text-lg">
                    <i data-lucide="calendar" class="inline-block w-5 h-5 mr-2 align-middle"></i> ${new Date(event.dateTime).toLocaleString()}<br>
                    <i data-lucide="map-pin" class="inline-block w-5 h-5 mr-2 align-middle"></i> ${event.venue}
                </p>

                <!-- Video Player Section -->
                <div class="relative w-full overflow-hidden bg-black rounded-lg mb-8" style="width: ${videoWidth}; height: ${videoHeight}; max-width: 100%; margin: 0 auto;">
                    ${event.video.type === 'youtube'
                        // YouTube embed iframe with autoplay muted, playsinline for mobile
                        ? `<iframe class="absolute top-0 left-0 w-full h-full" src="${event.video.url}?autoplay=1&mute=1&rel=0&playsinline=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
                        // Generic video tag for other video types (MP4, HLS, etc.)
                        : `<video class="absolute top-0 left-0 w-full h-full object-${event.video.fit || 'contain'}" controls autoplay muted playsinline>
                            <source src="${event.video.url}" type="video/mp4">
                            Your browser does not support the video tag.
                           </video>`
                    }
                </div>

                <!-- Interactions: Share Button -->
                <div class="flex items-center justify-end mb-8 flex-wrap gap-4">
                    <button id="share-button" class="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md button-style">
                        <i data-lucide="share-2" class="w-5 h-5 mr-2"></i> Share
                    </button>
                </div>

                <!-- Client and Description (Optional sections, displayed if content exists) -->
                ${event.client || event.description ? `
                    <div class="mb-8 p-4 bg-gray-850 rounded-lg shadow-inner">
                        ${event.client ? `<p class="text-gray-400 text-sm mb-2"><span class="font-semibold text-white">Client/Organizer:</span> ${event.client}</p>` : ''}
                        ${event.description ? `<div class="text-gray-300 prose prose-invert max-w-none">${event.description}</div>` : ''}
                    </div>
                ` : ''}

                <!-- Optional Poster Section -->
                ${event.posterUrl ? `
                    <h3 class="text-3xl font-bold mb-6 text-white text-center flex items-center justify-center">
                        <i data-lucide="megaphone" class="w-7 h-7 mr-3 text-orange-400"></i> Event Poster
                    </h3>
                    <div class="mb-8 rounded-lg overflow-hidden shadow-lg cursor-pointer" onclick="openGallery(0, '${event.id}', true)">
                        <img src="${event.posterUrl}" alt="Event Poster" class="w-full h-auto object-cover">
                    </div>
                ` : ''}

                <!-- Gallery Section: Displays event images in a grid, clickable for fullscreen view -->
                ${event.gallery && event.gallery.length > 0 ? `
                    <h3 class="text-3xl font-bold mb-6 text-white text-center flex items-center justify-center">
                        <i data-lucide="image" class="w-7 h-7 mr-3 text-cyan-400"></i> Gallery
                    </h3>
                    <div id="event-gallery" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        ${event.gallery.map((img, index) => `
                            <div class="relative group cursor-pointer overflow-hidden rounded-lg shadow-md aspect-video" onclick="openGallery(${index}, '${event.id}')">
                                <img src="${img.url}" alt="${img.caption || 'Event Image'}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300">
                                <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <i data-lucide="expand" class="w-10 h-10 text-white"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Attach event listeners for dynamic elements after they are added to the DOM
    document.getElementById('share-button')?.addEventListener('click', () => handleShare(event));

    // View count increment still happens internally, not displayed on public page
    incrementViewCount(event.id);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons(); // Re-render icons for new content
    }
    applyTheme(); // Reapply theme to ensure all new buttons and elements are styled
}

/**
 * @function handleLike
 * @description Handles the liking/unliking of an event.
 * Uses a subcollection to track individual user likes.
 * Note: This function is still present for potential future use or if admin panel needs to display likes.
 * It's not directly triggered from the public event page anymore.
 * @param {string} eventId The ID of the event being liked.
 */
async function handleLike(eventId) {
    // This function is retained for internal logic or if you decide to re-add likes visually.
    // It's not triggered from the public event page as per current request.
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        await showMessageBox("Please sign in to like events.");
        return;
    }

    if (!db) {
        await showMessageBox("Database not initialized for liking. Please refresh or check Firebase setup.");
        return;
    }

    // Reference to the specific user's like document for this event
    const likeDocRef = window.doc(db, `events/${eventId}/userLikes/${currentUserId}`);
    const eventRef = window.doc(db, "events", eventId);

    try {
        const docSnap = await window.getDoc(likeDocRef); // Check if the user has already liked this event
        const eventData = eventsData.find(e => e.id === eventId); // Get current event data from local cache
        let newLikesCount = eventData?.likes || 0; // Get current likes count

        if (docSnap.exists()) {
            // If document exists, user has liked it, so unlike (delete the like record)
            await window.deleteDoc(likeDocRef);
            newLikesCount = Math.max(0, newLikesCount - 1); // Decrement, ensuring not less than 0
            // showMessageBox("Event unliked!"); // Removed for silent operation if not displayed
        } else {
            // If document does not exist, user is liking it, so add a like record
            await window.setDoc(likeDocRef, { likedAt: new Date(), userId: currentUserId });
            newLikesCount += 1; // Increment likes count
            // showMessageBox("Event liked!"); // Removed for silent operation if not displayed
        }
        // Update the main event document's likes count in Firestore
        await window.updateDoc(eventRef, { likes: newLikesCount });

        // If you re-add like count display, update it here:
        // const likeCountElement = document.getElementById(`event-like-count`);
        // if (likeCountElement) {
        //     likeCountElement.textContent = newLikesCount;
        // }
    } catch (error) {
        console.error("Error handling like:", error);
        await showMessageBox("Failed to process like. Please try again or check console for details.");
    }
}

/**
 * @function handleShare
 * @description Handles sharing an event using the Web Share API if available,
 * otherwise copies the event URL to the clipboard.
 * @param {object} event The event object to share.
 */
async function handleShare(event) {
    // Construct the shareable URL for the event page
    const shareUrl = window.location.origin + window.location.pathname + `#event=${event.slug}`;

    if (navigator.share) {
        // Use Web Share API if supported by the browser (mobile devices)
        try {
            await navigator.share({
                title: event.title,
                text: `Check out this live event: ${event.title} by ${event.client || appSettings.companyName}`,
                url: shareUrl,
            });
            console.log('Event shared successfully');
        } catch (error) {
            console.error('Error sharing via Web Share API:', error);
            // If sharing is cancelled by user or fails for other reasons, still provide fallback
            document.execCommand('copy'); // Use deprecated execCommand for broader iFrame compatibility
            showMessageBox('Failed to share via system dialog. Event link copied to clipboard!');
        }
    } else {
        // Fallback for browsers that do not support Web Share API (desktop)
        const dummyElement = document.createElement('textarea');
        document.body.appendChild(dummyElement);
        dummyElement.value = shareUrl;
        dummyElement.select();
        document.execCommand('copy'); // Use deprecated execCommand for broader iFrame compatibility
        document.body.removeChild(dummyElement);
        showMessageBox('Event link copied to clipboard!');
    }
}

/**
 * @function incrementViewCount
 * @description Increments the view count for an event.
 * Uses `localStorage` to prevent multiple increments from the same user/session.
 * @param {string} eventId The ID of the event to increment views for.
 */
async function incrementViewCount(eventId) {
    const viewKey = `viewed_${eventId}`; // Key for localStorage to track if this event has been viewed
    if (!localStorage.getItem(viewKey)) { // Check if the event has already been viewed in this session
        if (!db) {
            console.warn("Firestore not initialized. Cannot increment view count.");
            return;
        }
        const eventRef = window.doc(db, "events", eventId);
        try {
            const eventSnap = await window.getDoc(eventRef); // Get the current event document
            if (eventSnap.exists()) {
                const currentViews = eventSnap.data().views || 0; // Get current views count
                await window.updateDoc(eventRef, { views: currentViews + 1 }); // Increment in Firestore
                localStorage.setItem(viewKey, 'true'); // Mark as viewed in localStorage
                // View count is not displayed on public page, so no UI update here.
            }
        } catch (error) {
            console.error("Error incrementing view count:", error);
        }
    }
}

/**
 * @function openGallery
 * @description Opens the fullscreen image gallery modal, displaying the selected image.
 * @param {number} startIndex The index of the image within the gallery array to start with.
 * @param {string} eventId The ID of the event whose gallery images are to be displayed.
 * @param {boolean} [isPoster=false] If true, indicates that the clicked item is a poster, not a regular gallery image.
 */
function openGallery(startIndex, eventId, isPoster = false) {
    // Ensure gallery elements are defined
    if (!galleryImageDisplay || !galleryModal) { // Removed prev/next buttons
        console.error("Gallery modal elements not found.");
        showMessageBox("Gallery feature is not fully initialized. Please check console for errors.");
        return;
    }

    currentEventForGallery = eventsData.find(e => e.id === eventId);
    if (!currentEventForGallery) {
        showMessageBox("Event not found for gallery.");
        return;
    }

    if (isPoster && currentEventForGallery.posterUrl) {
        // If it's a poster, set the gallery images to just the poster
        currentGalleryImages = [{ url: currentEventForGallery.posterUrl, caption: currentEventForGallery.title + " Poster" }];
        currentGalleryIndex = 0;
    } else if (currentEventForGallery.gallery && currentEventForGallery.gallery.length > 0) {
        // Otherwise, use the regular gallery images
        currentGalleryImages = currentEventForGallery.gallery;
        currentGalleryIndex = startIndex;
    } else {
        showMessageBox("No gallery images or poster available for this event.");
        return;
    }

    updateGalleryDisplay(); // Update the image displayed in the modal
    showModal(galleryModal); // Show the gallery modal
}

/**
 * @function updateGalleryDisplay
 * @description Updates the image source in the fullscreen gallery modal.
 */
function updateGalleryDisplay() {
    // These are now globally declared and assigned in DOMContentLoaded
    if (!galleryImageDisplay) {
        console.error("Gallery display elements not found for update.");
        return;
    }

    if (currentGalleryImages.length > 0) {
        galleryImageDisplay.src = currentGalleryImages[currentGalleryIndex].url; // Set current image URL
        galleryImageDisplay.alt = currentGalleryImages[currentGalleryIndex].caption || 'Gallery Image'; // Set alt text
        // Removed logic for prev/next button visibility as buttons are removed
    }
}

// Keyboard navigation for gallery (Escape key only)
document.addEventListener('keydown', (e) => {
    // These are now globally declared and assigned in DOMContentLoaded
    if (galleryModal && galleryModal.classList.contains('active')) { // Only respond if gallery modal is open
        if (e.key === 'Escape' && galleryCloseButton) {
            galleryCloseButton.click(); // Simulate click on close button
        }
    }
});

// --- Admin Panel Views and Logic ---

/**
 * @function renderAdminPanel
 * @description Renders the main administrative dashboard, accessible only to authenticated admins.
 * Includes navigation for different admin sections.
 */
function renderAdminPanel() {
    // Ensure appContainer is valid
    if (!appContainer) { console.error("App container not found."); return; }

    // Restrict access: If current user is not admin, show message and redirect to home
    if (!isAdmin()) {
        showMessageBox("Access Denied: You must be logged in as an administrator to access this panel.").then(() => {
            window.location.hash = ''; // Redirect to home page
        });
        return;
    }

    // Set a specific background color for the admin panel for visual distinction
    document.body.style.backgroundColor = '#1a202c'; // Dark admin background

    // Populate the app container with the admin panel structure
    appContainer.innerHTML = `
        <div class="max-w-7xl mx-auto py-8 px-4">
            <h2 class="text-4xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Admin Dashboard</h2>

            <!-- Admin Navigation Bar -->
            <nav class="bg-gray-800 p-4 rounded-lg shadow-md mb-8 flex flex-wrap justify-center gap-4">
                <button id="admin-nav-company" class="px-6 py-3 button-style text-white bg-blue-600 hover:bg-blue-700">
                    <i data-lucide="building-2" class="w-5 h-5 mr-2"></i> Company Settings
                </button>
                <button id="admin-nav-events" class="px-6 py-3 button-style text-white bg-green-600 hover:bg-green-700">
                    <i data-lucide="calendar-check" class="w-5 h-5 mr-2"></i> Events Management
                </button>
                <button id="admin-nav-theme" class="px-6 py-3 button-style text-white bg-purple-600 hover:bg-purple-700">
                    <i data-lucide="palette" class="w-5 h-5 mr-2"></i> Theme & Appearance
                </button>
                <button id="admin-logout" class="px-6 py-3 button-style text-white bg-red-600 hover:bg-red-700">
                    <i data-lucide="log-out" class="w-5 h-5 mr-2"></i> Logout
                </button>
            </nav>

            <!-- Admin Content Area: Dynamic content for selected admin section -->
            <div id="admin-content" class="bg-gray-800 rounded-lg shadow-lg p-6">
                <!-- Content will be loaded dynamically here by section-specific render functions -->
                <p class="text-center text-gray-400">Select a section from the navigation above.</p>
            </div>
        </div>
    `;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons(); // Render icons for admin navigation
    }
    applyTheme();        // Apply theme colors to admin navigation buttons

    // Attach event listeners to admin navigation buttons
    document.getElementById('admin-nav-company')?.addEventListener('click', renderCompanySettings);
    document.getElementById('admin-nav-events')?.addEventListener('click', renderEventsManagement);
    document.getElementById('admin-nav-theme')?.addEventListener('click', renderThemeSettings);
    document.getElementById('admin-logout')?.addEventListener('click', async () => {
        await window.signOut(auth); // Sign out the current user
        await showMessageBox("Logged out successfully!").then(() => {
            window.location.hash = ''; // Redirect to the home page
            window.location.reload(); // Force a full reload to clear all state
        });
    });

    // Default: Load the Company Settings section when admin panel is first opened
    renderCompanySettings();
}

/**
 * @function renderCompanySettings
 * @description Renders the "Company Settings" form within the admin panel, allowing
 * admins to update company-wide information and details.
 */
function renderCompanySettings() {
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) { console.error("Admin content area not found."); return; }

    adminContent.innerHTML = `
        <h3 class="text-3xl font-bold mb-6 text-white flex items-center">
            <i data-lucide="building-2" class="w-7 h-7 mr-3 text-blue-400"></i> Company Settings
        </h3>
        <form id="company-settings-form" class="space-y-6">
            <!-- Company Name -->
            <div>
                <label for="company-name-input" class="block text-gray-300 text-lg font-medium mb-2">Company Name</label>
                <input type="text" id="company-name-input" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.companyName}" required>
            </div>

            <!-- Company Logo URL/Upload -->
            <div>
                <label for="company-logo-url-input" class="block text-gray-300 text-lg font-medium mb-2">Company Logo URL</label>
                <input type="url" id="company-logo-url-input" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.companyLogoUrl}" placeholder="https://example.com/logo.png">
                <p class="text-gray-400 text-sm mt-1">Or upload a new logo from your device (overrides URL if both are provided):</p>
                <input type="file" id="company-logo-file-input" accept="image/*" class="w-full p-3 rounded-lg bg-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer">
            </div>

            <!-- Mini Logo Type (Icon or Image URL/Upload) -->
            <div class="flex items-center space-x-4">
                <label class="block text-gray-300 text-lg font-medium">Mini Logo Type:</label>
                <input type="radio" id="mini-logo-type-icon" name="mini-logo-type" value="icon" class="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500" ${appSettings.miniLogoType === 'icon' ? 'checked' : ''}>
                <label for="mini-logo-type-icon" class="text-gray-300">Icon</label>
                <input type="radio" id="mini-logo-type-image" name="mini-logo-type" value="image" class="ml-4 mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500" ${appSettings.miniLogoType === 'image' ? 'checked' : ''}>
                <label for="mini-logo-type-image" class="text-gray-300">Image URL</label>
            </div>
            <!-- Mini Logo Icon Settings (visible if 'icon' type selected) -->
            <div id="mini-logo-icon-settings" class="${appSettings.miniLogoType === 'icon' ? '' : 'hidden'}">
                <label for="mini-logo-icon-select" class="block text-gray-300 text-lg font-medium mb-2">Choose Icon (Lucide Icon Name)</label>
                <input type="text" id="mini-logo-icon-select" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.miniLogoIcon}" placeholder="e.g., star, circle, diamond, heart">
                <p class="text-gray-400 text-sm mt-1">Find icon names at <a href="https://lucide.dev/icons/" target="_blank" class="text-blue-400 hover:underline">lucide.dev/icons</a></p>
            </div>
            <!-- Mini Logo Image Settings (visible if 'image' type selected) -->
            <div id="mini-logo-image-settings" class="${appSettings.miniLogoType === 'image' ? '' : 'hidden'}">
                <label for="mini-logo-image-url-input" class="block text-gray-300 text-lg font-medium mb-2">Mini Logo Image URL</label>
                <input type="url" id="mini-logo-image-url-input" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.miniLogoImageUrl}" placeholder="https://example.com/mini_logo.png">
                <p class="text-gray-400 text-sm mt-1">Or upload a new mini logo image:</p>
                <input type="file" id="mini-logo-file-input" accept="image/*" class="w-full p-3 rounded-lg bg-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer">
            </div>

            <!-- Contact Information -->
            <div>
                <label for="contact-email-input" class="block text-gray-300 text-lg font-medium mb-2">Contact Email</label>
                <input type="email" id="contact-email-input" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.contactEmail}" required>
            </div>
            <div>
                <label for="contact-phone-input" class="block text-gray-300 text-lg font-medium mb-2">Contact Phone</label>
                <input type="tel" id="contact-phone-input" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.contactPhone}" required>
            </div>
            <div>
                <label for="copyright-text-input" class="block text-gray-300 text-lg font-medium mb-2">Copyright Text</label>
                <input type="text" id="copyright-text-input" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.copyrightText}" required>
            </div>

            <!-- Social Media Links -->
            <div>
                <label for="instagram-url-input" class="block text-gray-300 text-lg font-medium mb-2">Instagram URL</label>
                <input type="url" id="instagram-url-input" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.instagramUrl}">
            </div>
            <div>
                <label for="youtube-url-input" class="block text-gray-300 text-lg font-medium mb-2">YouTube URL</label>
                <input type="url" id="youtube-url-input" class="w-full p-3 rounded-lg bg-gray-700 text-white" value="${appSettings.youtubeUrl}">
            </div>

            <h4 class="text-2xl font-semibold mt-8 mb-4 text-white">Products</h4>
            <div id="products-list-admin" class="space-y-4">
                <!-- Product input fields will be dynamically loaded here -->
            </div>
            <button type="button" id="add-product-button" class="px-5 py-2 button-style text-white bg-teal-600 hover:bg-teal-700 mt-4">
                <i data-lucide="plus" class="w-5 h-5 mr-2"></i> Add Product
            </button>

            <h4 class="text-2xl font-semibold mt-8 mb-4 text-white">Founder & Team</h4>
            <div id="founder-settings" class="space-y-4 mb-4 p-4 bg-gray-700 rounded-lg shadow-inner">
                <label for="founder-name-input" class="block text-gray-300 text-lg font-medium mb-2">Founder Name</label>
                <input type="text" id="founder-name-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" value="${appSettings.founder?.name || ''}">
                <label for="founder-title-input" class="block text-gray-300 text-lg font-medium mb-2">Founder Title</label>
                <input type="text" id="founder-title-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" value="${appSettings.founder?.title || ''}">
                <label for="founder-bio-input" class="block text-gray-300 text-lg font-medium mb-2">Founder Bio</label>
                <textarea id="founder-bio-input" class="w-full p-3 rounded-lg bg-gray-600 text-white h-24">${appSettings.founder?.bio || ''}</textarea>
            </div>
            <h5 class="text-xl font-medium mb-3 text-white">Team Members</h5>
            <div id="team-members-list-admin" class="space-y-4">
                <!-- Team member input fields will be dynamically loaded here -->
            </div>
            <button type="button" id="add-team-member-button" class="px-5 py-2 button-style text-white bg-teal-600 hover:bg-teal-700 mt-4">
                <i data-lucide="plus" class="w-5 h-5 mr-2"></i> Add Team Member
            </button>

            <button type="submit" class="w-full px-6 py-3 button-style text-white bg-indigo-600 hover:bg-indigo-700 mt-8">
                Save Company Settings
            </button>
        </form>
    `;

    // Initialize and render dynamic lists (products, team members)
    renderAdminProductsList();
    renderAdminTeamMembersList();

    // Add event listeners for mini-logo type radio buttons to toggle visibility
    document.querySelectorAll('input[name="mini-logo-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'icon') {
                document.getElementById('mini-logo-icon-settings').classList.remove('hidden');
                document.getElementById('mini-logo-image-settings').classList.add('hidden');
            } else {
                document.getElementById('mini-logo-icon-settings').classList.add('hidden');
                document.getElementById('mini-logo-image-settings').classList.remove('hidden');
            }
        });
    });

    // Add event listeners for product and team member management buttons
    document.getElementById('company-settings-form')?.addEventListener('submit', handleSaveCompanySettings);
    document.getElementById('add-product-button')?.addEventListener('click', () => addAdminProductField());
    document.getElementById('add-team-member-button')?.addEventListener('click', () => addAdminTeamMemberField());

    if (typeof lucide !== 'undefined') {
        lucide.createIcons(); // Render any new icons
    }
    applyTheme(); // Apply theme to all new buttons and elements
}

/**
 * @function renderAdminProductsList
 * @description Renders the current list of products in the admin "Company Settings" form.
 */
function renderAdminProductsList() {
    const productsListAdmin = document.getElementById('products-list-admin');
    if (!productsListAdmin) { console.error("Products list admin container not found."); return; }
    productsListAdmin.innerHTML = ''; // Clear existing list
    appSettings.products.forEach((product, index) => {
        productsListAdmin.appendChild(createAdminProductField(product, index)); // Add each product field
    });
}

/**
 * @function createAdminProductField
 * @description Creates and returns a DOM element for a single product input field (title, description).
 * @param {object} product The product object to pre-populate the fields.
 * @param {number} index The index of the product in the array.
 * @returns {HTMLElement} The created product input div.
 */
function createAdminProductField(product = {}, index) {
    const productDiv = document.createElement('div');
    productDiv.className = 'p-4 bg-gray-700 rounded-lg shadow-inner flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4';
    productDiv.innerHTML = `
        <div class="flex-1">
            <label class="block text-gray-400 text-sm mb-1">Title</label>
            <input type="text" class="w-full p-2 rounded-lg bg-gray-600 text-white product-title-input" value="${product.title || ''}" placeholder="Product Title" data-index="${index}">
        </div>
        <div class="flex-1">
            <label class="block text-gray-400 text-sm mb-1">Description</label>
            <textarea class="w-full p-2 rounded-lg bg-gray-600 text-white product-description-input h-20 md:h-auto" placeholder="Product Description" data-index="${index}">${product.description || ''}</textarea>
        </div>
        <button type="button" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg button-style remove-product-button" data-index="${index}">
            <i data-lucide="trash-2" class="w-5 h-5"></i> Remove
        </button>
    `;
    // Attach event listener to the "Remove" button
    productDiv.querySelector('.remove-product-button')?.addEventListener('click', (e) => removeAdminProductField(e.currentTarget.dataset.index));
    return productDiv;
}

/**
 * @function addAdminProductField
 * @description Adds a new, empty product input field to the admin form.
 */
function addAdminProductField() {
    appSettings.products.push({ id: generateUniqueId(), title: '', description: '' }); // Add a new empty product to settings
    renderAdminProductsList(); // Re-render the list to show the new field
    applyTheme(); // Ensure new button/elements are styled
}

/**
 * @function removeAdminProductField
 * @description Removes a product input field from the admin form and updates `appSettings`.
 * @param {string} index The index of the product to remove.
 */
function removeAdminProductField(index) {
    appSettings.products.splice(index, 1); // Remove from the array
    renderAdminProductsList(); // Re-render the list
    applyTheme(); // Reapply theme for remaining buttons
}

/**
 * @function renderAdminTeamMembersList
 * @description Renders the current list of team members in the admin "Company Settings" form.
 */
function renderAdminTeamMembersList() {
    const teamMembersListAdmin = document.getElementById('team-members-list-admin');
    if (!teamMembersListAdmin) { console.error("Team members list admin container not found."); return; }
    teamMembersListAdmin.innerHTML = ''; // Clear existing list
    appSettings.teamMembers.forEach((member, index) => {
        teamMembersListAdmin.appendChild(createAdminTeamMemberField(member, index)); // Add each team member field
    });
}

/**
 * @function createAdminTeamMemberField
 * @description Creates and returns a DOM element for a single team member input field (name, role, photo URL/upload).
 * @param {object} member The team member object to pre-populate the fields.
 * @param {number} index The index of the team member in the array.
 * @returns {HTMLElement} The created team member input div.
 */
function createAdminTeamMemberField(member = {}, index) {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'p-4 bg-gray-700 rounded-lg shadow-inner space-y-3';
    memberDiv.innerHTML = `
        <div>
            <label class="block text-gray-400 text-sm mb-1">Name</label>
            <input type="text" class="w-full p-2 rounded-lg bg-gray-600 text-white team-name-input" value="${member.name || ''}" placeholder="Team Member Name" data-index="${index}">
        </div>
        <div>
            <label class="block text-gray-400 text-sm mb-1">Role</label>
            <input type="text" class="w-full p-2 rounded-lg bg-gray-600 text-white team-role-input" value="${member.role || ''}" placeholder="Team Member Role" data-index="${index}">
        </div>
        <div>
            <label class="block text-gray-400 text-sm mb-1">Photo URL</label>
            <input type="url" class="w-full p-2 rounded-lg bg-gray-600 text-white team-photo-url-input" value="${member.photoUrl || ''}" placeholder="https://example.com/photo.png" data-index="${index}">
            <p class="text-gray-400 text-sm mt-1">Or upload a new photo:</p>
            <input type="file" class="w-full p-2 rounded-lg bg-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer team-photo-file-input" accept="image/*" data-index="${index}">
        </div>
        <button type="button" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg button-style remove-team-member-button" data-index="${index}">
            <i data-lucide="trash-2" class="w-5 h-5"></i> Remove
        </button>
    `;
    // Attach event listener to the "Remove" button
    memberDiv.querySelector('.remove-team-member-button')?.addEventListener('click', (e) => removeAdminTeamMemberField(e.currentTarget.dataset.index));
    return memberDiv;
}

/**
 * @function addAdminTeamMemberField
 * @description Adds a new, empty team member input field to the admin form.
 */
function addAdminTeamMemberField() {
    appSettings.teamMembers.push({ id: generateUniqueId(), name: '', role: '', photoUrl: '' }); // Add a new empty member
    renderAdminTeamMembersList(); // Re-render the list
    applyTheme(); // Ensure new elements are styled
}

/**
 * @function removeAdminTeamMemberField
 * @description Removes a team member input field from the admin form and updates `appSettings`.
 * @param {string} index The index of the team member to remove.
 */
function removeAdminTeamMemberField(index) {
    appSettings.teamMembers.splice(index, 1); // Remove from the array
    renderAdminTeamMembersList(); // Re-render the list
    applyTheme(); // Reapply theme
}

/**
 * @function handleSaveCompanySettings
 * @description Handles the submission of the "Company Settings" form.
 * Gathers all input values, processes image uploads, and saves to Firestore.
 * @param {Event} e The form submit event.
 */
async function handleSaveCompanySettings(e) {
    e.preventDefault(); // Prevent default form submission

    // Gather basic text inputs for company details
    const companyNameInput = document.getElementById('company-name-input');
    const contactEmailInput = document.getElementById('contact-email-input');
    const contactPhoneInput = document.getElementById('contact-phone-input');
    const copyrightTextInput = document.getElementById('copyright-text-input');
    const instagramUrlInput = document.getElementById('instagram-url-input');
    const youtubeUrlInput = document.getElementById('youtube-url-input');

    if (!companyNameInput || !contactEmailInput || !contactPhoneInput || !copyrightTextInput || !instagramUrlInput || !youtubeUrlInput) {
        console.error("Company settings form elements not found.");
        await showMessageBox("Error: Missing form elements for company settings. Cannot save.");
        return;
    }

    appSettings.companyName = companyNameInput.value.trim();
    appSettings.contactEmail = contactEmailInput.value.trim();
    appSettings.contactPhone = contactPhoneInput.value.trim();
    appSettings.copyrightText = copyrightTextInput.value.trim();
    appSettings.instagramUrl = instagramUrlInput.value.trim();
    appSettings.youtubeUrl = youtubeUrlInput.value.trim();

    // --- Handle Company Logo ---
    const companyLogoFile = document.getElementById('company-logo-file-input')?.files[0];
    const companyLogoUrlInput = document.getElementById('company-logo-url-input')?.value.trim();
    if (companyLogoFile) {
        // If a file is selected, upload it and use the generated URL
        const url = await uploadFile(companyLogoFile, 'logos');
        if (url) appSettings.companyLogoUrl = url;
    } else if (companyLogoUrlInput) {
        // If no file, but a URL is provided, use the URL
        appSettings.companyLogoUrl = companyLogoUrlInput;
    }

    // --- Handle Mini Logo ---
    const miniLogoTypeRadio = document.querySelector('input[name="mini-logo-type"]:checked');
    if (!miniLogoTypeRadio) {
        console.error("Mini logo type radio buttons not found.");
        await showMessageBox("Error: Mini logo type not selected. Cannot save.");
        return;
    }
    appSettings.miniLogoType = miniLogoTypeRadio.value;

    if (appSettings.miniLogoType === 'icon') {
        // If icon type, save icon name and clear image URL
        const miniLogoIconSelect = document.getElementById('mini-logo-icon-select');
        if (miniLogoIconSelect) appSettings.miniLogoIcon = miniLogoIconSelect.value.trim();
        appSettings.miniLogoImageUrl = '';
    } else { // 'image' type
        const miniLogoFile = document.getElementById('mini-logo-file-input')?.files[0];
        const miniLogoUrlInput = document.getElementById('mini-logo-image-url-input')?.value.trim();
        if (miniLogoFile) {
            // If file, upload and use URL
            const url = await uploadFile(miniLogoFile, 'logos');
            if (url) appSettings.miniLogoImageUrl = url;
        } else if (miniLogoUrlInput) {
            // If no file, but URL, use URL
            appSettings.miniLogoImageUrl = miniLogoUrlInput;
        }
        appSettings.miniLogoIcon = ''; // Clear icon if image is selected
    }

    // --- Handle Products List ---
    const newProducts = [];
    document.querySelectorAll('#products-list-admin > div').forEach(productDiv => {
        const titleInput = productDiv.querySelector('.product-title-input');
        const descriptionInput = productDiv.querySelector('.product-description-input');
        if (titleInput && descriptionInput && titleInput.value.trim()) {
            newProducts.push({
                id: generateUniqueId(), // Generate new ID for each product, simplifies updates
                title: titleInput.value.trim(),
                description: descriptionInput.value.trim()
            });
        }
    });
    appSettings.products = newProducts; // Update products in appSettings

    // --- Handle Founder & Team Members ---
    const founderNameInput = document.getElementById('founder-name-input');
    const founderTitleInput = document.getElementById('founder-title-input');
    const founderBioInput = document.getElementById('founder-bio-input');

    appSettings.founder = {
        name: founderNameInput ? founderNameInput.value.trim() : '',
        title: founderTitleInput ? founderTitleInput.value.trim() : '',
        bio: founderBioInput ? founderBioInput.value.trim() : ''
    };

    const newTeamMembers = [];
    const teamMemberDivs = document.querySelectorAll('#team-members-list-admin > div');
    for (const memberDiv of teamMemberDivs) {
        const nameInput = memberDiv.querySelector('.team-name-input');
        const roleInput = memberDiv.querySelector('.team-role-input');
        const photoUrlInput = memberDiv.querySelector('.team-photo-url-input');
        const photoFileInput = memberDiv.querySelector('.team-photo-file-input');

        if (nameInput && roleInput && photoUrlInput && photoFileInput && nameInput.value.trim()) {
            let photoUrl = photoUrlInput.value.trim();
            if (photoFileInput.files[0]) {
                // If a new photo file is uploaded, use its URL
                const uploadedUrl = await uploadFile(photoFileInput.files[0], 'team_photos');
                if (uploadedUrl) photoUrl = uploadedUrl;
            }
            newTeamMembers.push({
                id: generateUniqueId(), // Generate new ID for each team member
                name: nameInput.value.trim(),
                role: roleInput.value.trim(),
                photoUrl: photoUrl
            });
        }
    }
    appSettings.teamMembers = newTeamMembers; // Update team members in appSettings

    await saveAppSettings(); // Save all updated app settings to Firestore
    await showMessageBox("Company settings saved successfully!");
}

/**
 * @function renderEventsManagement
 * @description Renders the "Events Management" section in the admin panel, displaying
 * a list of events and providing options to add, edit, or delete them.
 */
function renderEventsManagement() {
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) { console.error("Admin content area not found."); return; }

    adminContent.innerHTML = `
        <h3 class="text-3xl font-bold mb-6 text-white flex items-center">
            <i data-lucide="calendar-check" class="w-7 h-7 mr-3 text-green-400"></i> Events Management
        </h3>
        <button id="add-new-event-button" class="px-6 py-3 button-style text-white bg-green-600 hover:bg-green-700 mb-6">
            <i data-lucide="plus" class="w-5 h-5 mr-2"></i> Add New Event
        </button>

        <div id="events-list-admin" class="space-y-4">
            <!-- List of events will be rendered here -->
        </div>

        <!-- Event Edit/Add Form (initially hidden, shown when adding or editing an event) -->
        <div id="event-edit-form-container" class="hidden mt-8 p-6 bg-gray-700 rounded-lg shadow-inner custom-scrollbar">
            <h4 id="event-form-title" class="text-2xl font-bold mb-4 text-white">Add New Event</h4>
            <form id="event-form" class="space-y-4">
                <input type="hidden" id="event-id-input"> <!-- Hidden input to store event ID for updates -->

                <!-- Basic Event Details -->
                <div>
                    <label for="event-title-input" class="block text-gray-300 text-lg font-medium mb-2">Title</label>
                    <input type="text" id="event-title-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" required>
                </div>
                <div>
                    <label for="event-slug-input" class="block text-gray-300 text-lg font-medium mb-2">Unique URL Slug</label>
                    <input type="text" id="event-slug-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" placeholder="e.g., my-awesome-event" required>
                    <p class="text-gray-400 text-sm mt-1">This will be used in the event's URL: #event=<span id="slug-preview" class="font-mono text-purple-300"></span></p>
                </div>
                <div>
                    <label for="event-datetime-input" class="block text-gray-300 text-lg font-medium mb-2">Date & Time</label>
                    <input type="datetime-local" id="event-datetime-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" required>
                </div>
                <div>
                    <label for="event-venue-input" class="block text-gray-300 text-lg font-medium mb-2">Venue</label>
                    <input type="text" id="event-venue-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" required>
                </div>
                <div>
                    <label for="event-client-input" class="block text-gray-300 text-lg font-medium mb-2">Client/Organizer (Optional)</label>
                    <input type="text" id="event-client-input" class="w-full p-3 rounded-lg bg-gray-600 text-white">
                </div>
                <div>
                    <label for="event-description-input" class="block text-gray-300 text-lg font-medium mb-2">Description (Optional)</label>
                    <textarea id="event-description-input" class="w-full p-3 rounded-lg bg-gray-600 text-white h-32"></textarea>
                </div>

                <!-- Video Settings -->
                <h5 class="text-xl font-medium mt-6 mb-3 text-white">Video Settings</h5>
                <div class="space-y-3">
                    <div>
                        <label for="video-type-select" class="block text-gray-300 text-lg font-medium mb-2">Video Type</label>
                        <select id="video-type-select" class="w-full p-3 rounded-lg bg-gray-600 text-white">
                            <option value="youtube">YouTube Embed</option>
                            <option value="other">Other (MP4, HLS, etc.)</option>
                        </select>
                    </div>
                    <div>
                        <label for="video-url-input" class="block text-gray-300 text-lg font-medium mb-2">Video URL/Embed Code</label>
                        <input type="text" id="video-url-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" placeholder="For YouTube: e.g., https://www.youtube.com/embed/dQw4w9WgXcQ. For Other: Direct MP4/HLS URL." required>
                    </div>
                    <div>
                        <label for="video-width-input" class="block text-gray-300 text-lg font-medium mb-2">Video Width (e.g., 100%, 800px)</label>
                        <input type="text" id="video-width-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" value="100%">
                    </div>
                    <div>
                        <label for="video-height-input" class="block text-gray-300 text-lg font-medium mb-2">Video Height (e.g., auto, 450px)</label>
                        <input type="text" id="video-height-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" value="auto">
                    </div>
                    <div>
                        <label for="video-fit-select" class="block text-gray-300 text-lg font-medium mb-2">Video Fit</label>
                        <select id="video-fit-select" class="w-full p-3 rounded-lg bg-gray-600 text-white">
                            <option value="contain">Contain (show whole video)</option>
                            <option value="cover">Cover (fill frame, crop if needed)</option>
                        </select>
                    </div>
                </div>

                <!-- Thumbnail Image Settings -->
                <h5 class="text-xl font-medium mt-6 mb-3 text-white">Thumbnail Image</h5>
                <div>
                    <label for="thumbnail-url-input" class="block text-gray-300 text-lg font-medium mb-2">Thumbnail URL</label>
                    <input type="url" id="thumbnail-url-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" placeholder="https://example.com/thumbnail.jpg">
                    <p class="text-gray-400 text-sm mt-1">Or upload a new thumbnail image:</p>
                    <input type="file" id="thumbnail-file-input" accept="image/*" class="w-full p-3 rounded-lg bg-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer">
                </div>

                <!-- Optional Poster Section -->
                <h5 class="text-xl font-medium mt-6 mb-3 text-white">Event Poster (Optional)</h5>
                <div>
                    <label for="poster-url-input" class="block text-gray-300 text-lg font-medium mb-2">Poster URL</label>
                    <input type="url" id="poster-url-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" placeholder="https://example.com/poster.jpg">
                    <p class="text-gray-400 text-sm mt-1">Or upload a new poster image:</p>
                    <input type="file" id="poster-file-input" accept="image/*" class="w-full p-3 rounded-lg bg-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer">
                </div>

                <!-- Gallery Images Settings -->
                <h5 class="text-xl font-medium mt-6 mb-3 text-white">Gallery Images</h5>
                <div id="gallery-images-admin" class="space-y-4 p-4 bg-gray-800 rounded-lg shadow-inner">
                    <!-- Gallery image input fields will be dynamically added here -->
                </div>
                <button type="button" id="add-gallery-image-button" class="px-5 py-2 button-style text-white bg-teal-600 hover:bg-teal-700 mt-4">
                    <i data-lucide="image-plus" class="w-5 h-5 mr-2"></i> Add Gallery Image
                </button>


                <!-- Event Appearance Settings -->
                <h5 class="text-xl font-medium mt-6 mb-3 text-white">Event Appearance (Overrides Global Theme)</h5>
                <div>
                    <label for="event-bg-color-input" class="block text-gray-300 text-lg font-medium mb-2">Event Background Color (Optional)</label>
                    <input type="color" id="event-bg-color-input" class="w-full h-12 rounded-lg cursor-pointer" value="#1e3a8a">
                </div>
                <div>
                    <label for="event-bg-image-url-input" class="block text-gray-300 text-lg font-medium mb-2">Event Background Image URL (Optional)</label>
                    <input type="url" id="event-bg-image-url-input" class="w-full p-3 rounded-lg bg-gray-600 text-white" placeholder="https://example.com/event-bg.jpg">
                    <p class="text-gray-400 text-sm mt-1">Or upload a new background image:</p>
                    <input type="file" id="event-bg-file-input" accept="image/*" class="w-full p-3 rounded-lg bg-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer">
                </div>

                <!-- Status Settings -->
                <h5 class="text-xl font-medium mt-6 mb-3 text-white">Status</h5>
                <div>
                    <label for="event-status-select" class="block text-gray-300 text-lg font-medium mb-2">Status</label>
                    <select id="event-status-select" class="w-full p-3 rounded-lg bg-gray-600 text-white">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                <div class="flex items-center mt-4">
                    <input type="checkbox" id="event-featured-checkbox" class="mr-2 h-5 w-5 text-blue-600 rounded focus:ring-blue-500">
                    <label for="event-featured-checkbox" class="text-gray-300">Mark as Featured</label>
                </div>

                <!-- Action Buttons for Event Form -->
                <div class="flex space-x-4 mt-8">
                    <button type="submit" class="flex-1 px-6 py-3 button-style text-white bg-indigo-600 hover:bg-indigo-700">
                        Save Event
                    </button>
                    <button type="button" id="cancel-event-edit" class="flex-1 px-6 py-3 button-style text-white bg-red-600 hover:bg-red-700">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    // Populate the list of existing events in the admin view
    renderAdminEventsList();

    // Attach event listeners for the "Add New Event" button and form actions
    document.getElementById('add-new-event-button')?.addEventListener('click', () => {
        showEventEditForm(); // Show empty form for new event
        if (document.getElementById('event-id-input')) document.getElementById('event-id-input').value = ''; // Clear ID for new event
        document.getElementById('event-form')?.reset();       // Reset form fields
        if (document.getElementById('event-form-title')) document.getElementById('event-form-title').textContent = 'Add New Event'; // Set form title
        if (document.getElementById('gallery-images-admin')) document.getElementById('gallery-images-admin').innerHTML = ''; // Clear gallery inputs for new event
        if (document.getElementById('slug-preview')) document.getElementById('slug-preview').textContent = ''; // Clear slug preview
        if (document.getElementById('thumbnail-file-input')) document.getElementById('thumbnail-file-input').value = ''; // Clear file input
        if (document.getElementById('poster-file-input')) document.getElementById('poster-file-input').value = ''; // Clear poster file input
        if (document.getElementById('event-bg-file-input')) document.getElementById('event-bg-file-input').value = ''; // Clear file input
        applyTheme(); // Reapply theme for new buttons
    });
    document.getElementById('cancel-event-edit')?.addEventListener('click', () => hideEventEditForm());
    document.getElementById('event-form')?.addEventListener('submit', handleSaveEvent);

    // Dynamic slug generation based on title input
    document.getElementById('event-title-input')?.addEventListener('input', (e) => {
        const titleInput = e.target;
        const slugInput = document.getElementById('event-slug-input');
        const slugPreview = document.getElementById('slug-preview');

        if (titleInput && slugInput && slugPreview) {
            const title = titleInput.value;
            const slug = title.toLowerCase()
                              .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric (except spaces/hyphens)
                              .replace(/\s+/g, '-')       // Replace spaces with hyphens
                              .replace(/-+/g, '-')        // Replace multiple hyphens with single
                              .trim();                    // Trim whitespace
            slugInput.value = slug;
            slugPreview.textContent = slug;
        }
    });

    // Event listener for adding new gallery image fields
    document.getElementById('add-gallery-image-button')?.addEventListener('click', () => addGalleryImageField());

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    applyTheme();
}

/**
 * @function renderAdminEventsList
 * @description Renders the list of events (from `eventsData`) in the admin "Events Management" section,
 * each with "Edit" and "Delete" buttons.
 */
function renderAdminEventsList() {
    const eventsListAdmin = document.getElementById('events-list-admin');
    if (!eventsListAdmin) { console.error("Events list admin container not found."); return; }
    eventsListAdmin.innerHTML = ''; // Clear existing list

    if (eventsData.length === 0) {
        eventsListAdmin.innerHTML = '<p class="text-center text-gray-400">No events added yet. Click "Add New Event" to start!</p>';
        return;
    }

    // Sort events by date, newest first
    const sortedEvents = [...eventsData].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    sortedEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'p-4 bg-gray-700 rounded-lg shadow-inner flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0';
        eventItem.innerHTML = `
            <div class="flex-1">
                <h4 class="text-xl font-bold text-white">${event.title}</h4>
                <p class="text-gray-400 text-sm">Status: <span class="capitalize ${event.status === 'published' ? 'text-green-400' : 'text-yellow-400'}">${event.status}</span></p>
                <p class="text-gray-400 text-sm">Date: ${new Date(event.dateTime).toLocaleDateString()} | Venue: ${event.venue}</p>
                <p class="text-gray-500 text-xs">ID: ${event.id}</p>
            </div>
            <div class="flex space-x-3">
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg button-style edit-event-button" data-id="${event.id}">
                    <i data-lucide="edit" class="w-5 h-5"></i> Edit
                </button>
                <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg button-style delete-event-button" data-id="${event.id}">
                    <i data-lucide="trash-2" class="w-5 h-5"></i> Delete
                </button>
            </div>
        `;
        eventsListAdmin.appendChild(eventItem);
    });

    // Attach event listeners for edit and delete buttons
    document.querySelectorAll('.edit-event-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = e.currentTarget.dataset.id;
            const eventToEdit = eventsData.find(ev => ev.id === eventId);
            if (eventToEdit) {
                showEventEditForm(eventToEdit); // Show the form, pre-filled with event data
            } else {
                showMessageBox("Event not found for editing.");
            }
        });
    });

    document.querySelectorAll('.delete-event-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = e.currentTarget.dataset.id;
            deleteEvent(eventId); // Call delete function
        });
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    applyTheme();
}

/**
 * @function showEventEditForm
 * @description Populates the event edit form with existing event data or clears it for a new event, then shows the form.
 * @param {object} [event=null] The event object to pre-fill the form with. If null, the form is cleared for a new event.
 */
function showEventEditForm(event = null) {
    const formContainer = document.getElementById('event-edit-form-container');
    if (!formContainer) { console.error("Event edit form container not found."); return; }
    formContainer.classList.remove('hidden'); // Show the form container

    // Get all input fields by their IDs
    const eventIdInput = document.getElementById('event-id-input');
    const titleInput = document.getElementById('event-title-input');
    const slugInput = document.getElementById('event-slug-input');
    const dateTimeInput = document.getElementById('event-datetime-input');
    const venueInput = document.getElementById('event-venue-input');
    const clientInput = document.getElementById('event-client-input');
    const descriptionInput = document.getElementById('event-description-input');
    const videoTypeSelect = document.getElementById('video-type-select');
    const videoUrlInput = document.getElementById('video-url-input');
    const videoWidthInput = document.getElementById('video-width-input');
    const videoHeightInput = document.getElementById('video-height-input');
    const videoFitSelect = document.getElementById('video-fit-select');
    const thumbnailUrlInput = document.getElementById('thumbnail-url-input');
    const thumbnailFileInput = document.getElementById('thumbnail-file-input');
    const posterUrlInput = document.getElementById('poster-url-input');
    const posterFileInput = document.getElementById('poster-file-input');
    const eventStatusSelect = document.getElementById('event-status-select');
    const eventFeaturedCheckbox = document.getElementById('event-featured-checkbox');
    const eventBgColorInput = document.getElementById('event-bg-color-input');
    const eventBgImageUrlInput = document.getElementById('event-bg-image-url-input');
    const eventBgFileInput = document.getElementById('event-bg-file-input');
    const galleryImagesAdmin = document.getElementById('gallery-images-admin');
    const eventFormTitle = document.getElementById('event-form-title');
    const slugPreview = document.getElementById('slug-preview');

    // Ensure all elements are found before proceeding
    if (!eventIdInput || !titleInput || !slugInput || !dateTimeInput || !venueInput || !videoTypeSelect || !videoUrlInput || !videoWidthInput || !videoHeightInput || !videoFitSelect || !thumbnailUrlInput || !thumbnailFileInput || !posterUrlInput || !posterFileInput || !eventStatusSelect || !eventFeaturedCheckbox || !eventBgColorInput || !eventBgImageUrlInput || !eventBgFileInput || !galleryImagesAdmin || !eventFormTitle || !slugPreview) {
        console.error("One or more event form elements not found.");
        showMessageBox("Error: Event editing form is incomplete. Cannot display.");
        return;
    }


    if (event) {
        // Populate form fields with existing event data
        eventFormTitle.textContent = 'Edit Event';
        eventIdInput.value = event.id;
        titleInput.value = event.title;
        slugInput.value = event.slug;
        slugPreview.textContent = event.slug;
        // Format date-time for datetime-local input
        dateTimeInput.value = event.dateTime ? new Date(event.dateTime).toISOString().slice(0, 16) : '';
        venueInput.value = event.venue;
        clientInput.value = event.client || '';
        descriptionInput.value = event.description || '';
        videoTypeSelect.value = event.video?.type || 'youtube';
        videoUrlInput.value = event.video?.url || '';
        videoWidthInput.value = event.video?.width || '100%';
        videoHeightInput.value = event.video?.height || 'auto';
        videoFitSelect.value = event.video?.fit || 'contain';
        thumbnailUrlInput.value = event.thumbnailUrl || '';
        posterUrlInput.value = event.posterUrl || ''; // Populate poster URL
        eventStatusSelect.value = event.status || 'draft';
        eventFeaturedCheckbox.checked = event.featured || false;

        // Set event background inputs: prefer image URL if present, otherwise color
        if (event.bg && !event.bg.startsWith('#')) { // It's likely an image URL
            eventBgImageUrlInput.value = event.bg;
            eventBgColorInput.value = '#000000'; // Default to black for color if image is chosen
        } else { // It's a color or empty
            eventBgColorInput.value = event.bg || '#1e3a8a'; // Default color
            eventBgImageUrlInput.value = '';
        }

        // Populate gallery images
        galleryImagesAdmin.innerHTML = ''; // Clear existing gallery fields
        event.gallery?.forEach((img) => {
            galleryImagesAdmin.appendChild(createAdminGalleryImageField(img));
        });

    } else {
        // Clear form fields for a new event
        eventFormTitle.textContent = 'Add New Event';
        eventIdInput.value = ''; // Ensure ID is empty for new event
        document.getElementById('event-form')?.reset(); // Reset other form elements
        eventStatusSelect.value = 'draft';
        eventFeaturedCheckbox.checked = false;
        eventBgColorInput.value = '#1e3a8a'; // Default background color
        eventBgImageUrlInput.value = '';
        galleryImagesAdmin.innerHTML = ''; // Clear gallery fields
        slugPreview.textContent = '';
    }
    // Always clear file inputs as their value cannot be set programmatically due to security
    thumbnailFileInput.value = '';
    posterFileInput.value = ''; // Clear poster file input
    eventBgFileInput.value = '';

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    applyTheme();
}

/**
 * @function createAdminGalleryImageField
 * @description Creates and returns a DOM element for a single gallery image input field
 * (URL, file upload, caption, and remove button).
 * @param {object} image The image object to pre-populate the fields.
 * @returns {HTMLElement} The created gallery image input div.
 */
function createAdminGalleryImageField(image = {}) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'p-4 bg-gray-700 rounded-lg shadow-inner flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4';
    imageDiv.innerHTML = `
        <div class="flex-1">
            <label class="block text-gray-400 text-sm mb-1">Image URL</label>
            <input type="url" class="w-full p-2 rounded-lg bg-gray-600 text-white gallery-url-input" value="${image.url || ''}" placeholder="https://example.com/gallery.jpg">
            <p class="text-gray-400 text-sm mt-1">Or upload a new image:</p>
            <input type="file" class="w-full p-2 rounded-lg bg-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer gallery-file-input" accept="image/*">
        </div>
        <div class="flex-1">
            <label class="block text-gray-400 text-sm mb-1">Caption</label>
            <input type="text" class="w-full p-2 rounded-lg bg-gray-600 text-white gallery-caption-input" value="${image.caption || ''}" placeholder="Image Caption">
        </div>
        <button type="button" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg button-style remove-gallery-image-button">
            <i data-lucide="trash-2" class="w-5 h-5"></i> Remove
        </button>
    `;
    // Attach event listener to the "Remove" button to delete this field
    imageDiv.querySelector('.remove-gallery-image-button')?.addEventListener('click', () => imageDiv.remove());
    return imageDiv;
}

/**
 * @function addGalleryImageField
 * @description Adds a new, empty gallery image input field to the event form.
 */
function addGalleryImageField() {
    const galleryImagesAdmin = document.getElementById('gallery-images-admin');
    if (galleryImagesAdmin) {
        galleryImagesAdmin.appendChild(createAdminGalleryImageField()); // Append a new field
        applyTheme(); // Ensure new element is styled
    }
}

/**
 * @function hideEventEditForm
 * @description Hides the event edit form and refreshes the list of events.
 */
function hideEventEditForm() {
    const formContainer = document.getElementById('event-edit-form-container');
    if (formContainer) {
        formContainer.classList.add('hidden'); // Hide form
    }
    renderAdminEventsList(); // Refresh the event list display
}

/**
 * @function handleSaveEvent
 * @description Handles the submission of the event creation/edit form.
 * Gathers all input data, manages image uploads, and saves/updates the event in Firestore.
 * @param {Event} e The form submit event.
 */
async function handleSaveEvent(e) {
    e.preventDefault(); // Prevent default form submission

    // Get all input values from the form
    const eventId = document.getElementById('event-id-input')?.value;
    const title = document.getElementById('event-title-input')?.value.trim();
    const slug = document.getElementById('event-slug-input')?.value.trim();
    const dateTime = document.getElementById('event-datetime-input')?.value; // ISO string
    const venue = document.getElementById('event-venue-input')?.value.trim();
    const client = document.getElementById('event-client-input')?.value.trim();
    const description = document.getElementById('event-description-input')?.value.trim();
    const videoType = document.getElementById('video-type-select')?.value;
    const videoUrl = document.getElementById('video-url-input')?.value.trim();
    const videoWidth = document.getElementById('video-width-input')?.value.trim(); // Get video width
    const videoHeight = document.getElementById('video-height-input')?.value.trim(); // Get video height
    const videoFit = document.getElementById('video-fit-select')?.value;
    const posterUrlInput = document.getElementById('poster-url-input')?.value.trim(); // Get poster URL
    const posterFileInput = document.getElementById('poster-file-input')?.files[0]; // Get poster file
    const status = document.getElementById('event-status-select')?.value;
    const featured = document.getElementById('event-featured-checkbox')?.checked;
    const eventBgColor = document.getElementById('event-bg-color-input')?.value;
    const eventBgImageUrl = document.getElementById('event-bg-image-url-input')?.value.trim();
    const eventBgFile = document.getElementById('event-bg-file-input')?.files[0];

    // Basic validation for required fields
    if (!title || !slug || !dateTime || !venue || !videoUrl) {
        await showMessageBox("Please fill in all required event details (Title, URL Slug, Date & Time, Venue, Video URL).");
        return;
    }

    // --- Handle Thumbnail Image ---
    let thumbnailUrl = document.getElementById('thumbnail-url-input')?.value.trim();
    const thumbnailFile = document.getElementById('thumbnail-file-input')?.files[0];
    if (thumbnailFile) {
        // If a file is provided, upload it to Storage
        const uploadedUrl = await uploadFile(thumbnailFile, 'event_thumbnails');
        if (uploadedUrl) thumbnailUrl = uploadedUrl; // Use uploaded URL
    }
    // If no file and no URL was provided, thumbnailUrl will remain empty or previous value

    // --- Handle Poster Image ---
    let posterUrl = posterUrlInput;
    if (posterFileInput) {
        const uploadedUrl = await uploadFile(posterFileInput, `events/${eventId || 'new_event_temp'}/poster`);
        if (uploadedUrl) posterUrl = uploadedUrl;
    }

    // --- Handle Event Background (Color or Image) ---
    let eventBackground = eventBgColor; // Default to color picker value
    if (eventBgFile) {
        // If a file is provided, upload it to Storage
        const uploadedUrl = await uploadFile(eventBgFile, 'event_backgrounds');
        if (uploadedUrl) eventBackground = uploadedUrl; // Use uploaded URL
    } else if (eventBgImageUrl) {
        // If no file, but a URL is provided, use the URL
        eventBackground = eventBgImageUrl;
    }

    // --- Handle Gallery Images ---
    const gallery = [];
    const galleryImageDivs = document.querySelectorAll('#gallery-images-admin > div');
    for (const div of galleryImageDivs) {
        const urlInput = div.querySelector('.gallery-url-input');
        const fileInput = div.querySelector('.gallery-file-input');
        const captionInput = div.querySelector('.gallery-caption-input');

        if (urlInput && fileInput && captionInput) {
            let imageUrl = urlInput.value.trim();
            if (fileInput.files[0]) {
                // If a file is provided, upload it to Storage
                const uploadedUrl = await uploadFile(fileInput.files[0], `events/${eventId || 'new_event_temp'}/gallery`); // Use temp ID if new event
                if (uploadedUrl) imageUrl = uploadedUrl;
            }

            if (imageUrl) {
                gallery.push({
                    id: generateUniqueId(), // Generate new ID for each gallery image
                    url: imageUrl,
                    caption: captionInput.value.trim()
                });
            }
        }
    }

    // Prepare the event object for saving
    const eventObj = {
        title,
        slug,
        dateTime, // Stored as ISO string
        venue,
        video: { type: videoType, url: videoUrl, width: videoWidth, height: videoHeight, fit: videoFit }, // Include width/height
        thumbnailUrl,
        posterUrl, // Include poster URL
        gallery,
        bg: eventBackground,
        client,
        description,
        chatEnabled: false, // Chat functionality removed, always false
        status,
        featured,
        // Preserve existing likes/views for updates, initialize to 0 for new events
        likes: (eventId ? eventsData.find(e => e.id === eventId)?.likes : 0) || 0,
        views: (eventId ? eventsData.find(e => e.id === eventId)?.views : 0) || 0,
    };

    if (eventId) {
        eventObj.id = eventId; // Set ID for updating an existing event
    }

    await saveEvent(eventObj); // Call the function to save/update in Firestore
    hideEventEditForm();       // Hide the form after saving
}


/**
 * @function renderThemeSettings
 * @description Renders the "Theme & Appearance" section in the admin panel, allowing
 * admins to customize global colors and styling.
 */
function renderThemeSettings() {
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) { console.error("Admin content area not found."); return; }

    adminContent.innerHTML = `
        <h3 class="text-3xl font-bold mb-6 text-white flex items-center">
            <i data-lucide="palette" class="w-7 h-7 mr-3 text-purple-400"></i> Theme & Appearance
        </h3>
        <form id="theme-settings-form" class="space-y-6">
            <div>
                <label for="global-background-color-input" class="block text-gray-300 text-lg font-medium mb-2">Global Background Color</label>
                <input type="color" id="global-background-color-input" class="w-full h-12 rounded-lg cursor-pointer" value="${appSettings.theme.globalBackground}">
            </div>
            <div>
                <label for="button-color-input" class="block text-gray-300 text-lg font-medium mb-2">Button Color (Global)</label>
                <input type="color" id="button-color-input" class="w-full h-12 rounded-lg cursor-pointer" value="${appSettings.theme.buttonColor}">
            </div>
            <div>
                <label for="button-hover-color-input" class="block text-gray-300 text-lg font-medium mb-2">Button Hover Color</label>
                <input type="color" id="button-hover-color-input" class="w-full h-12 rounded-lg cursor-pointer" value="${appSettings.theme.buttonHoverColor}">
            </div>
            <div>
                <label for="button-text-color-input" class="block text-gray-300 text-lg font-medium mb-2">Button Text Color</label>
                <input type="color" id="button-text-color-input" class="w-full h-12 rounded-lg cursor-pointer" value="${appSettings.theme.buttonTextColor}">
            </div>

            <!-- 3D Style Options -->
            <div class="flex items-center space-x-4">
                <label class="block text-gray-300 text-lg font-medium">Depth Style (Visual Hint):</label>
                <input type="radio" id="style-flat" name="depth-style" value="flat" class="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500" ${appSettings.theme.depthStyle === 'flat' ? 'checked' : ''}>
                <label for="style-flat" class="text-gray-300">Flat</label>
                <!-- Removed neumorphic and glass options as requested for 2D focus -->
            </div>
             <p class="text-gray-400 text-sm mt-1">Note: This setting acts as a visual hint for administrators, actual styling is 2D.</p>

            <button type="submit" class="w-full px-6 py-3 button-style text-white bg-indigo-600 hover:bg-indigo-700 mt-8">
                Save Theme Settings
            </button>
        </form>
    `;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    applyTheme(); // Ensure colors are applied to the theme settings form elements too

    document.getElementById('theme-settings-form')?.addEventListener('submit', handleSaveThemeSettings);

    // Live preview for global background color
    document.getElementById('global-background-color-input')?.addEventListener('input', (e) => {
        if (document.body) document.body.style.backgroundColor = e.target.value;
    });

    // Live preview for button colors
    document.getElementById('button-color-input')?.addEventListener('input', (e) => {
        appSettings.theme.buttonColor = e.target.value; // Temporarily update setting for applyTheme
        applyTheme();
    });
    document.getElementById('button-hover-color-input')?.addEventListener('input', (e) => {
        appSettings.theme.buttonHoverColor = e.target.value; // Temporarily update setting for applyTheme
        applyTheme();
    });
    document.getElementById('button-text-color-input')?.addEventListener('input', (e) => {
        appSettings.theme.buttonTextColor = e.target.value; // Temporarily update setting for applyTheme
        applyTheme();
    });
}

/**
 * @function handleSaveThemeSettings
 * @description Handles the submission of the "Theme Settings" form.
 * Gathers input values and updates the `appSettings.theme` object in Firestore.
 * @param {Event} e The form submit event.
 */
async function handleSaveThemeSettings(e) {
    e.preventDefault(); // Prevent default form submission

    // Get input elements
    const globalBackgroundInput = document.getElementById('global-background-color-input');
    const buttonColorInput = document.getElementById('button-color-input');
    const buttonHoverColorInput = document.getElementById('button-hover-color-input');
    const buttonTextColorInput = document.getElementById('button-text-color-input');
    const depthStyleRadio = document.querySelector('input[name="depth-style"]:checked');

    if (!globalBackgroundInput || !buttonColorInput || !buttonHoverColorInput || !buttonTextColorInput || !depthStyleRadio) {
        console.error("Theme settings form elements not found.");
        await showMessageBox("Error: Missing form elements for theme settings. Cannot save.");
        return;
    }

    // Update appSettings.theme with values from the form
    appSettings.theme.globalBackground = globalBackgroundInput.value;
    appSettings.theme.buttonColor = buttonColorInput.value;
    appSettings.theme.buttonHoverColor = buttonHoverColorInput.value;
    appSettings.theme.buttonTextColor = buttonTextColorInput.value;
    appSettings.theme.depthStyle = depthStyleRadio.value;

    await saveAppSettings(); // Save updated settings to Firestore
    await showMessageBox("Theme settings updated successfully!");
}
