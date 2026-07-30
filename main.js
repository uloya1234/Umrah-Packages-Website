// ============================================================
// Supabase Configuration
// ============================================================
const SUPABASE_URL = 'https://idosxouzulookidzikxh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RoWVD_wik-DnpBVckZAe8g_JoLjlzWq';

// Use the global 'supabase' from the CDN to create a client instance
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ============================================================
// DOM References
// ============================================================
const publicSite = document.getElementById('publicSite');
const dashboardWrapper = document.getElementById('dashboardWrapper');

// Auth modal
const authModal = document.getElementById('authModal');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const resetForm = document.getElementById('resetForm');

// Dashboard user elements
const dashUserName = document.getElementById('dashUserName');
const dashUserEmail = document.getElementById('dashUserEmail');
const dashUserAvatar = document.getElementById('dashUserAvatar');
const dashGreetingName = document.getElementById('dashGreetingName');

// Settings fields
const settingsFullName = document.getElementById('settingsFullName');
const settingsEmail = document.getElementById('settingsEmail');
const settingsPhone = document.getElementById('settingsPhone');
const settingsLanguage = document.getElementById('settingsLanguage');

// Chat
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ============================================================
// Auth Functions with detailed logging
// ============================================================
async function handleSignUp() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        showToast('Please fill in all required fields.');
        return;
    }

    console.log('Signing up with email:', email);

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: name, phone: phone },
        },
    });

    if (error) {
        console.error('Sign-up error:', error);
        showToast('Error: ' + error.message);
    } else {
        console.log('Sign-up successful, check email for confirmation:', data);
        showToast('Account created! Please check your email to confirm.');
        closeAuthModal();
    }
}

async function handleSignIn() {
    console.log('🔵 Sign-in button clicked!');
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;

    if (!email || !password) {
        showToast('Please enter email and password.');
        return;
    }

    console.log('Attempting sign-in with email:', email);

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('Sign-in error:', error);
        let msg = error.message;
        if (error.message.includes('Email not confirmed')) {
            msg = 'Please confirm your email address first. Check your inbox for the confirmation link.';
        } else if (error.message.includes('Invalid login credentials')) {
            msg = 'Incorrect email or password. Please try again.';
        }
        showToast('Error: ' + msg);
    } else {
        console.log('Sign-in successful:', data);
        closeAuthModal();
        showDashboard();
    }
}

async function handleResetPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    if (!email) {
        showToast('Please enter your email.');
        return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) {
        console.error('Reset error:', error);
        showToast('Error: ' + error.message);
    } else {
        showToast('Password reset link sent to your email.');
        closeAuthModal();
    }
}

async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Sign-out error:', error);
        showToast('Error signing out: ' + error.message);
    } else {
        showPublic();
    }
}

// ============================================================
// Session Management
// ============================================================
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        console.log('Active session found, showing dashboard.');
        showDashboard();
        updateUserInfo(session.user);
    } else {
        console.log('No active session.');
        showPublic();
    }
}

function updateUserInfo(user) {
    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    dashUserName.textContent = name;
    dashUserEmail.textContent = user.email;
    dashUserAvatar.textContent = name.charAt(0).toUpperCase();
    dashGreetingName.textContent = name;

    settingsFullName.value = name;
    settingsEmail.value = user.email;
    settingsPhone.value = user.user_metadata?.phone || '';
}

// ============================================================
// UI Toggles
// ============================================================
function showPublic() {
    publicSite.style.display = 'block';
    dashboardWrapper.classList.remove('active');
    document.body.style.overflow = 'auto';
    closeAuthModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDashboard() {
    publicSite.style.display = 'none';
    dashboardWrapper.classList.add('active');
    document.body.style.overflow = 'auto';
    const hour = new Date().getHours();
    let greeting = 'Assalamu Alaikum';
    if (hour < 12) greeting = 'Sabah al-Khair';
    else if (hour < 18) greeting = 'Assalamu Alaikum';
    else greeting = 'Masa al-Khair';
    document.getElementById('dashGreeting').textContent = greeting;
}

function closeAuthModal() {
    authModal.style.display = 'none';
}

function showAuthForm(mode) {
    signinForm.style.display = 'none';
    signupForm.style.display = 'none';
    resetForm.style.display = 'none';
    if (mode === 'signin') signinForm.style.display = 'block';
    else if (mode === 'signup') signupForm.style.display = 'block';
    else if (mode === 'reset') resetForm.style.display = 'block';
}

function showAuthModal(mode = 'signin') {
    authModal.style.display = 'flex';
    showAuthForm(mode);
}

// ============================================================
// Email Confirmation Handler
// ============================================================
async function handleEmailConfirmation() {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        // Supabase sends the token as #access_token=...
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
            console.log('Processing email confirmation token...');
            const { data, error } = await supabaseClient.auth.setSession({
                access_token,
                refresh_token
            });
            if (error) {
                console.error('Error confirming email:', error);
                showToast('Error confirming email. Please try again.');
            } else {
                console.log('Email confirmed, session set:', data);
                showToast('Email confirmed! You are now signed in.');
                // Clean URL
                window.location.hash = '';
                showDashboard();
            }
        }
    }
}

// ============================================================
// Toast
// ============================================================
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// Package Rendering (static data)
// ============================================================
const packagesData = [
    { id: 1, name: 'Economy Umrah Package', category: 'economy', nights: '8 nights', makkah: 'Al Safwah Hotel', madinah: 'Al Eiman Royal', stars: 3, distance: '15 min to Haram', flight: 'Economy class included', transport: 'Group transfers', includes: ['Flights', 'Hotels', 'Group transfers', 'Visa assistance'], excludes: ['Meals', 'Extra luggage'], price: '£1,450' },
    { id: 2, name: 'Standard Umrah Package', category: 'standard', nights: '10 nights', makkah: 'Makkah Tower Hotel', madinah: 'Al Majeedi Hotel', stars: 4, distance: '8 min to Haram', flight: 'Economy class included', transport: 'Private transfers', includes: ['Flights', 'Hotels', 'Private transfers', 'Visa assistance', 'Breakfast'], excludes: ['Lunch & dinner', 'Sightseeing tours'], price: '£2,150' },
    { id: 3, name: 'Premium Umrah Package', category: 'premium', nights: '10 nights', makkah: 'Hilton Suites', madinah: 'Anwar Al Madinah', stars: 5, distance: '5 min to Haram', flight: 'Business class upgrade available', transport: 'Private luxury transfers', includes: ['Flights', 'Luxury hotels', 'Private transfers', 'Visa assistance', 'All meals', 'VIP support'], excludes: ['Personal expenses', 'Extra tours'], price: '£3,450' },
    { id: 4, name: 'Family Umrah Package', category: 'family', nights: '12 nights', makkah: 'Family Suite Hotel', madinah: 'Family Hotel Madinah', stars: 4, distance: '10 min to Haram', flight: 'Economy class included', transport: 'Private family minivan', includes: ['Flights', 'Family rooms', 'Private transfers', 'Visa assistance', 'Kids meals', 'Family support'], excludes: ['Extra activities', 'Personal shopping'], price: '£4,200' },
    { id: 5, name: 'Custom Umrah Package', category: 'custom', nights: 'Flexible', makkah: 'Your choice', madinah: 'Your choice', stars: 'Your choice', distance: 'Your preference', flight: 'Your choice', transport: 'Your choice', includes: ['Fully customized', 'Your preferred hotels', 'Flexible transport', 'Visa assistance', 'Dedicated support'], excludes: ['Tailored to your needs'], price: 'Custom quote' }
];

function renderPackages(filter = 'all') {
    const grid = document.getElementById('packagesGrid');
    if (!grid) return;
    const filtered = filter === 'all' ? packagesData : packagesData.filter(p => p.category === filter);
    grid.innerHTML = filtered.map(p => `
        <div class="package-card animated-border">
            <div class="pkg-header">
                <div class="pkg-name">${p.name}</div>
                <div class="pkg-stars">${'★'.repeat(p.stars)}${p.stars !== 'Your choice' ? '' : ' · Custom'}</div>
            </div>
            <div class="pkg-body">
                <div class="pkg-meta">
                    <span><i class="fas fa-moon"></i> ${p.nights}</span>
                    <span><i class="fas fa-hotel"></i> ${p.makkah} · ${p.madinah}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${p.distance}</span>
                    <span><i class="fas fa-plane"></i> ${p.flight}</span>
                    <span><i class="fas fa-bus"></i> ${p.transport}</span>
                </div>
            </div>
            <div class="pkg-footer">
                <div class="price">${p.price} <small>per person</small></div>
                <div class="pkg-actions">
                    <button class="btn-sm btn-sm-outline" onclick="showPackageDetail(${p.id})">View</button>
                    <button class="btn-sm btn-sm-gold" onclick="showAuthModal('signin')">Book</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showPackageDetail(id) {
    const p = packagesData.find(p => p.id === id);
    if (!p) return;
    alert(`📋 ${p.name}\nNights: ${p.nights}\nMakkah: ${p.makkah}\nMadinah: ${p.madinah}\nStars: ${p.stars}\nDistance: ${p.distance}\nFlight: ${p.flight}\nTransport: ${p.transport}\nPrice: ${p.price}\n\nIncludes: ${p.includes.join(', ')}\nExcludes: ${p.excludes.join(', ')}`);
}

// ============================================================
// Dashboard Navigation
// ============================================================
document.querySelectorAll('.dash-nav .nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const tabId = this.dataset.tab;
        if (!tabId) return;
        document.querySelectorAll('.dash-nav .nav-item').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.dash-tab').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
        if (window.innerWidth <= 768) {
            document.getElementById('dashSidebar').classList.remove('open');
        }
        if (tabId === 'dash-settings') {
            activateSettingsPane('settings-profile');
        }
    });
});

// ============================================================
// Settings Sub-navigation
// ============================================================
document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const paneId = this.dataset.stab;
        if (!paneId) return;
        document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.settings-pane').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(paneId);
        if (target) target.classList.add('active');
    });
});

function activateSettingsPane(paneId) {
    document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.settings-pane').forEach(el => el.classList.remove('active'));
    const navBtn = document.querySelector(`.settings-nav-item[data-stab="${paneId}"]`);
    if (navBtn) navBtn.classList.add('active');
    const pane = document.getElementById(paneId);
    if (pane) pane.classList.add('active');
}

// ============================================================
// Notifications Dropdown
// ============================================================
const notifToggle = document.getElementById('notifToggle');
const notifDropdown = document.getElementById('notifDropdown');
if (notifToggle && notifDropdown) {
    notifToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        notifDropdown.classList.toggle('active');
    });
    document.addEventListener('click', function(e) {
        if (!notifToggle.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.remove('active');
        }
    });
    document.getElementById('markAllRead')?.addEventListener('click', function() {
        document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
        document.querySelector('.notif-dot').style.display = 'none';
        showToast('All notifications marked as read.');
        notifDropdown.classList.remove('active');
    });
}

// ============================================================
// Sidebar Toggle (mobile)
// ============================================================
const dashHeader = document.querySelector('.dash-header');
const toggleBtn = document.createElement('button');
toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
toggleBtn.style.cssText = 'display:none;background:none;border:none;font-size:1.4rem;color:var(--charcoal);padding:4px 8px;';
toggleBtn.onclick = function() { document.getElementById('dashSidebar').classList.toggle('open'); };
if (dashHeader) dashHeader.prepend(toggleBtn);

function handleDashToggleVisibility() {
    if (window.innerWidth <= 768) {
        toggleBtn.style.display = 'block';
    } else {
        toggleBtn.style.display = 'none';
        document.getElementById('dashSidebar')?.classList.remove('open');
    }
}
window.addEventListener('resize', handleDashToggleVisibility);
handleDashToggleVisibility();

document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('dashSidebar');
    if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// ============================================================
// FAQ Accordion
// ============================================================
document.querySelectorAll('.faq-item .faq-question').forEach(btn => {
    btn.addEventListener('click', function() {
        const item = this.parentElement;
        const wasActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
        if (!wasActive) item.classList.add('active');
    });
});

// ============================================================
// Navbar Scroll & Mobile Nav Toggle
// ============================================================
window.addEventListener('scroll', function() {
    const nav = document.getElementById('navbar');
    if (nav) {
        if (window.scrollY > 60) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    }
});

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    document.querySelectorAll('#navLinks a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ============================================================
// Public Buttons -> Show Auth Modal
// ============================================================
document.getElementById('publicSignInBtn')?.addEventListener('click', () => showAuthModal('signin'));
document.getElementById('publicPlanBtn')?.addEventListener('click', () => showAuthModal('signin'));
document.getElementById('heroPlanBtn')?.addEventListener('click', () => showAuthModal('signin'));
document.getElementById('searchFindBtn')?.addEventListener('click', () => showAuthModal('signin'));
document.getElementById('goToWebsiteBtn')?.addEventListener('click', showPublic);
document.getElementById('signOutBtn')?.addEventListener('click', signOut);

// ============================================================
// Auth Buttons (using addEventListener)
// ============================================================
document.getElementById('signInBtn')?.addEventListener('click', handleSignIn);
document.getElementById('signUpBtn')?.addEventListener('click', handleSignUp);
document.getElementById('resetBtn')?.addEventListener('click', handleResetPassword);

// ============================================================
// Settings: Save Profile
// ============================================================
document.getElementById('saveProfileBtn')?.addEventListener('click', async function() {
    const fullName = settingsFullName.value;
    const phone = settingsPhone.value;
    const language = settingsLanguage.value;

    const { data, error } = await supabaseClient.auth.updateUser({
        data: { full_name: fullName, phone: phone, language: language }
    });

    if (error) {
        showToast('Error updating profile: ' + error.message);
    } else {
        showToast('Profile updated successfully!');
        const user = data.user;
        dashUserName.textContent = fullName;
        dashUserAvatar.textContent = fullName.charAt(0).toUpperCase();
        dashGreetingName.textContent = fullName;
    }
});

// ============================================================
// Settings: Update Password
// ============================================================
document.getElementById('updatePasswordBtn')?.addEventListener('click', async function() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPass || !confirm) {
        showToast('Please fill in all password fields.');
        return;
    }
    if (newPass !== confirm) {
        showToast('New passwords do not match.');
        return;
    }

    const { data, error } = await supabaseClient.auth.updateUser({ password: newPass });

    if (error) {
        showToast('Error updating password: ' + error.message);
    } else {
        showToast('Password updated successfully!');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }
});

// ============================================================
// AI Chat (Noor AI)
// ============================================================
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    chatInput.value = '';

    // Typing indicator
    appendMessage('assistant', '...');

    try {
        const response = await fetch('/api/ai-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: message })
        });

        const data = await response.json();
        chatMessages.removeChild(chatMessages.lastChild);
        if (data.success) {
            appendMessage('assistant', data.response);
        } else {
            appendMessage('assistant', 'Sorry, I encountered an error. Please try again later.');
        }
    } catch (error) {
        chatMessages.removeChild(chatMessages.lastChild);
        appendMessage('assistant', 'Network error. Please check your connection.');
    }
}

function appendMessage(role, content) {
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `${content}<span class="timestamp">${time}</span>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChatBtn?.addEventListener('click', sendMessage);
chatInput?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
});

// ============================================================
// Package Filtering
// ============================================================
document.querySelectorAll('.packages-filters button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.packages-filters button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderPackages(this.dataset.filter);
    });
});

// ============================================================
// Init
// ============================================================
renderPackages('all');
checkSession();
handleEmailConfirmation(); // <-- handles the confirmation link

// Listen for auth changes (e.g., sign out)
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        showPublic();
    } else if (event === 'SIGNED_IN' && session) {
        updateUserInfo(session.user);
        showDashboard();
    }
});

console.log('🌙 Nur Travel — Your Umrah Journey Awaits.');
