// ═══════════════════════════════════════════════════════
// nav.js — شريط التنقل المشترك + القائمة الجانبية للجوال
// ═══════════════════════════════════════════════════════

function buildNav(activePage, user) {
  const isAdmin = user?.isAdmin;
  const pages = [
    { id:'dashboard', href:'dashboard.html', icon:'home',            label:'الرئيسية' },
    { id:'courses',   href:'courses.html',   icon:'book-open',       label:'المقررات' },
    { id:'qa',        href:'qa.html',        icon:'message-circle',  label:'الأسئلة' },
    { id:'about',     href:'about.html',     icon:'info',            label:'من نحن' },
    { id:'admin',     href:'admin.html',     icon:'settings',        label:'الإدارة', adminOnly:true },
    { id:'profile',   href:'profile.html',   icon:'user',            label:'ملفي' },
  ];

  const navItems = pages
    .filter(p => !p.adminOnly || isAdmin)
    .map(p => `
      <a href="${p.href}" class="nav-btn${activePage===p.id?' active':''}" id="nb-${p.id}">
        <i data-lucide="${p.icon}"></i>
        <span class="nav-label">${p.label}</span>
      </a>`).join('');

  return `
<nav id="main-nav">
  <div style="display:flex;align-items:center;gap:10px">
    <!-- Hamburger (mobile) -->
    <button id="hamburger" onclick="toggleMobileMenu()" aria-label="القائمة" class="hamburger-btn" style="flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px">
      <span style="display:block;width:22px;height:2px;background:var(--purple);border-radius:2px;transition:.3s"></span>
      <span style="display:block;width:22px;height:2px;background:var(--purple);border-radius:2px;transition:.3s"></span>
      <span style="display:block;width:22px;height:2px;background:var(--purple);border-radius:2px;transition:.3s"></span>
    </button>
    <a href="index.html" class="nav-logo">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='18' fill='%233B1B40'/%3E%3Ctext x='18' y='24' text-anchor='middle' font-size='20' font-family='serif' fill='%23D4B48E' font-weight='900'%3Eت%3C/text%3E%3C/svg%3E" width="36" height="36" alt="شعار المعهد"/>
      <span class="nav-logo-text">معهد التأصيل العلمي</span>
    </a>
  </div>
  <div class="nav-links" id="nav-links-desktop">
    ${navItems}
  </div>
  <div style="display:flex;align-items:center;gap:8px">
    <!-- Notifications -->
    <button id="notif-btn" onclick="toggleNotifPanel()" style="position:relative;background:none;border:none;cursor:pointer;padding:8px;border-radius:10px;color:var(--muted);display:flex;align-items:center" title="الإشعارات">
      <i data-lucide="bell" style="width:18px;height:18px"></i>
      <span id="notif-dot" style="position:absolute;top:5px;right:5px;width:8px;height:8px;background:#dc3545;border-radius:50%;border:2px solid #fff;display:none"></span>
    </button>
    <!-- User name - hidden, shown in mobile drawer -->
    <!-- Logout -->
    <button onclick="logout()" title="تسجيل الخروج" style="display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:10px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:12px;font-weight:700;background:rgba(220,53,69,.1);color:#dc3545;transition:.2s" onmouseover="this.style.background='#dc3545';this.style.color='#fff'" onmouseout="this.style.background='rgba(220,53,69,.1)';this.style.color='#dc3545'">
      <i data-lucide="log-out" style="width:14px;height:14px"></i><span class="nav-label">خروج</span>
    </button>
  </div>
</nav>

<!-- Mobile menu overlay -->
<div id="mob-overlay" onclick="closeMobileMenu()" style="display:none;position:fixed;inset:0;background:rgba(42,18,48,.6);z-index:498;backdrop-filter:blur(4px)"></div>

<!-- Mobile drawer -->
<div id="mob-drawer" style="display:none;position:fixed;top:0;right:0;bottom:0;width:260px;background:#fff;z-index:499;padding:20px 16px;overflow-y:auto;box-shadow:-8px 0 32px rgba(59,27,64,.2);transition:transform .3s;transform:translateX(100%)">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid rgba(212,180,142,.2)">
    <div>
      <div style="font-family:'Amiri',serif;font-size:15px;font-weight:700;color:var(--purple)">القائمة</div>
      <div id="mob-username" style="font-size:11px;color:var(--muted);margin-top:2px"></div>
    </div>
    <button onclick="closeMobileMenu()" style="background:#f5f0f8;border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;color:var(--muted)">✕</button>
  </div>
  ${pages.filter(p => !p.adminOnly || isAdmin).map(p => `
    <a href="${p.href}" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;margin-bottom:4px;font-family:'Zain',sans-serif;font-size:14px;font-weight:700;color:var(--muted);text-decoration:none;transition:.2s;${activePage===p.id?'background:linear-gradient(135deg,var(--purple),var(--purple-l));color:#fff':''}" onmouseover="if(this.style.background!=='linear-gradient(135deg, var(--purple), var(--purple-l))')this.style.background='rgba(59,27,64,.06)'" onmouseout="if(this.style.color!=='rgb(255, 255, 255)')this.style.background=''">
      <i data-lucide="${p.icon}" style="width:16px;height:16px"></i>${p.label}
    </a>`).join('')}
  <div style="margin-top:20px;padding-top:14px;border-top:1px solid rgba(212,180,142,.15)">
    <button onclick="logout()" style="display:flex;align-items:center;gap:8px;width:100%;padding:11px 14px;border-radius:12px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:14px;font-weight:700;background:rgba(220,53,69,.1);color:#dc3545">
      <i data-lucide="log-out" style="width:15px;height:15px"></i>تسجيل الخروج
    </button>
  </div>
</div>

<!-- Notification panel -->
<div id="notif-panel" style="display:none;position:fixed;top:60px;left:16px;width:300px;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(59,27,64,.18);border:1px solid rgba(212,180,142,.2);z-index:490;overflow:hidden">
  <div style="padding:14px 16px;border-bottom:1px solid rgba(212,180,142,.15);display:flex;justify-content:space-between;align-items:center">
    <span style="font-weight:800;font-size:14px;color:var(--purple)">الإشعارات</span>
    <button onclick="clearNotifs()" style="font-size:11px;color:var(--muted);background:none;border:none;cursor:pointer">مسح الكل</button>
  </div>
  <div id="notif-list" style="max-height:320px;overflow-y:auto"></div>
</div>`;
}

// ── Set username in nav ──
function setNavUser(user) {
  const name = user?.name || user?.fullName || user?.adminUsername || '';
  const el = document.getElementById('mob-username');
  if(el && name) el.textContent = name;
}

// ── Mobile menu toggle ──
function toggleMobileMenu() {
  const drawer = document.getElementById('mob-drawer');
  const overlay = document.getElementById('mob-overlay');
  const open = drawer.style.transform === 'translateX(0px)' || drawer.style.transform === 'translateX(0)';
  if(open) {
    closeMobileMenu();
  } else {
    drawer.style.display = '';
    overlay.style.display = '';
    requestAnimationFrame(() => drawer.style.transform = 'translateX(0)');
  }
}
function closeMobileMenu() {
  const drawer = document.getElementById('mob-drawer');
  const overlay = document.getElementById('mob-overlay');
  drawer.style.transform = 'translateX(100%)';
  setTimeout(() => { if(drawer) drawer.style.display='none'; if(overlay) overlay.style.display='none'; }, 300);
}

// ── Notification panel ──
let _notifData = [];
async function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if(panel.style.display !== 'none') { panel.style.display = 'none'; return; }
  panel.style.display = '';
  const user = getCachedUser();
  if(!user) return;
  _notifData = await getNotifications(user.uid);
  renderNotifPanel();
  markNotifsRead(user.uid).then(updateNotifBadge);
}
function renderNotifPanel() {
  const list = document.getElementById('notif-list');
  if(!list) return;
  if(!_notifData.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">لا توجد إشعارات</div>';
    return;
  }
  const icons = {info:'🔔', success:'✅', error:'❌', warn:'⚠️'};
  list.innerHTML = _notifData.map(n => `
    <div style="padding:12px 16px;border-bottom:1px solid rgba(212,180,142,.1);font-size:13px;${n.read?'':'background:rgba(212,180,142,.07)'}">
      <div style="display:flex;gap:8px;align-items:flex-start">
        <span>${icons[n.type]||'🔔'}</span>
        <div>
          <div style="color:#1a0a1e;line-height:1.6">${n.msg}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${n.createdAt?new Date(n.createdAt).toLocaleDateString('ar'):''}</div>
        </div>
      </div>
    </div>`).join('');
}
function clearNotifs() {
  _notifData = [];
  renderNotifPanel();
  updateNotifBadge();
}
async function updateNotifBadge() {
  const dot = document.getElementById('notif-dot');
  if(!dot) return;
  const user = getCachedUser();
  if(!user) return;
  try {
    const snap = await db.collection('notifications').where('userId','==',user.uid).where('read','==',false).limit(1).get();
    dot.style.display = snap.empty ? 'none' : '';
  } catch(e) {
    const list = lsGet('ti_notifs_'+user.uid)||[];
    dot.style.display = list.some(n=>!n.read) ? '' : 'none';
  }
}

// Close notif panel on outside click
document.addEventListener('click', e => {
  const panel = document.getElementById('notif-panel');
  const btn = document.getElementById('notif-btn');
  if(panel && btn && panel.style.display!=='none' && !panel.contains(e.target) && !btn.contains(e.target))
    panel.style.display = 'none';
});
