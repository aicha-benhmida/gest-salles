// ══════════════════════════════════════════════════════════════
//  ISIMM ROOMS — app.js (merged from app.js + navbar.js)
// ══════════════════════════════════════════════════════════════

// ── ROLE / NAV CONFIG ────────────────────────────────────────
const ROLE_LABELS = {
  admin:      'Administrateur',
  etudiant:   'Étudiant',
  prof:       'Professeur',
  technicien: 'Technicien'
};

const NAV_CONFIG = {
  admin: {
    logoTitle: 'ISIMM Rooms',
    logoSubtitle: 'Admin',
    links: [
      { href: 'admin.html',           icon: 'fas fa-flag',         label: 'Signalements' },
      { href: 'admin.html#users',     icon: 'fas fa-users',        label: 'Utilisateurs' },
      { href: 'admin.html#etudiants', icon: 'fas fa-user-graduate',label: 'Étudiants' },
      { href: 'statistiques.html',    icon: 'fas fa-chart-bar',    label: 'Statistiques' },
      { href: 'dashboard.html',       icon: 'fas fa-door-open',    label: 'Salles' },
      { href: 'nouveautes.html',      icon: 'fas fa-newspaper',    label: 'Nouveautés' },
      { href: 'presence.html',        icon: 'fas fa-clipboard-check', label: 'Présences' },
    ]
  },
  technicien: {
    logoTitle: 'ISIMM Rooms',
    logoSubtitle: 'Technicien',
    links: [
      { href: 'tech.html',         icon: 'fas fa-wrench',    label: 'Mes Interventions' },
      { href: 'his.html',          icon: 'fas fa-history',   label: 'Historique' },
      { href: 'statistiques.html', icon: 'fas fa-chart-bar', label: 'Statistiques' }
    ]
  },
  etudiant: {
    logoTitle: 'ISIMM Rooms',
    logoSubtitle: 'Étudiant',
    links: [
      { href: 'dashboard.html',        icon: 'fas fa-door-open',         label: 'Disponibilité' },
      { href: 'mes_reservations.html', icon: 'fas fa-calendar-check',    label: 'Mes Réservations' },
      { href: 'signaler.html',         icon: 'fas fa-exclamation-circle', label: 'Signaler' },
      { href: 'presence.html',         icon: 'fas fa-clipboard-check',   label: 'Ma Présence' },
      { href: 'nouveautes.html',       icon: 'fas fa-newspaper',          label: 'Nouveautés' },
      { href: 'statistiques.html',     icon: 'fas fa-chart-bar',         label: 'Statistiques' }
    ]
  },
  prof: {
    logoTitle: 'ISIMM Rooms',
    logoSubtitle: 'Enseignant',
    links: [
      { href: 'dashboard.html',        icon: 'fas fa-door-open',         label: 'Disponibilité' },
      { href: 'mes_reservations.html', icon: 'fas fa-calendar-check',    label: 'Mes Réservations' },
      { href: 'signaler.html',         icon: 'fas fa-exclamation-circle', label: 'Signaler' },
      { href: 'presence.html',         icon: 'fas fa-clipboard-check',   label: 'Présences' },
      { href: 'nouveautes.html',       icon: 'fas fa-newspaper',          label: 'Nouveautés' },
      { href: 'statistiques.html',     icon: 'fas fa-chart-bar',         label: 'Statistiques' }
    ]
  }
};

// ── SESSION / AUTH ───────────────────────────────────────────
function getUser() {
  return {
    id:    sessionStorage.getItem('user_id'),
    role:  sessionStorage.getItem('user_role'),
    name:  sessionStorage.getItem('user_name'),
    email: sessionStorage.getItem('user_email'),
  };
}

function requireAuth() {
  const u = getUser();
  if (!u.id) { window.location.href = 'login.html'; return false; }
  return true;
}

// ── UTILITIES ────────────────────────────────────────────────
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── API HELPER ───────────────────────────────────────────────
async function api(action, opts = {}) {
  const u   = getUser();
  const url = 'api.php?action=' + action + (opts.qs ? '&' + opts.qs : '');
  const headers = { 'Content-Type': 'application/json', 'X-User-Id': u.id || '' };
  const res = await fetch(url, {
    method:  opts.body ? 'POST' : 'GET',
    headers,
    body:    opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

// ══════════════════════════════════════════════════════════════
//  NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════════════════
let notifications    = [];
let notifPanelOpen   = false;

async function fetchNotifications() {
  const userId = sessionStorage.getItem('user_id');
  if (!userId) return [];
  try {
    const response = await fetch('api.php?action=get_notifications&limit=20', {
      headers: { 'X-User-Id': userId }
    });
    const data = await response.json();
    if (data.success && Array.isArray(data.notifications)) return data.notifications;
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  }
  return [];
}

async function updateNotificationBadge() {
  const userId = sessionStorage.getItem('user_id');
  if (!userId) return;
  try {
    const response = await fetch('api.php?action=get_unread_count', {
      headers: { 'X-User-Id': userId }
    });
    const data = await response.json();
    if (data.success) {
      const badge = document.getElementById('notif-count');
      if (badge) {
        if (data.count > 0) {
          badge.textContent = data.count > 99 ? '99+' : data.count;
          badge.style.display = 'flex';
          badge.classList.add('has-unread');
        } else {
          badge.style.display = 'none';
          badge.classList.remove('has-unread');
        }
      }
    }
  } catch (err) {
    console.error('Failed to get unread count:', err);
  }
}

function getNotificationIcon(type) {
  const icons = {
    signalement:  'fa-flag',
    reservation:  'fa-calendar-check',
    assignment:   'fa-wrench',
    resolved:     'fa-check-circle',
    confirmation: 'fa-info-circle',
    cancelled:    'fa-times-circle',
    system:       'fa-cog'
  };
  return icons[type] || 'fa-bell';
}

function getNotificationColor(type) {
  const colors = {
    signalement:  '#fff5f0;color:#e05c1a',
    reservation:  '#dcfce7;color:#16a34a',
    assignment:   '#fff5f0;color:#e05c1a',
    resolved:     '#dcfce7;color:#16a34a',
    confirmation: '#eef2ff;color:#2952cc',
    cancelled:    '#fef2f2;color:#ef4444',
    system:       '#f3f4f6;color:#6b7280'
  };
  return colors[type] || '#f3f4f6;color:#6b7280';
}

function createNotificationPanel() {
  const existing = document.getElementById('notification-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'notification-panel';
  panel.className = 'notification-panel';
  panel.style.cssText = 'position:fixed;width:380px;max-height:500px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);border:1px solid #dde3f0;z-index:9999;overflow:hidden;display:none;flex-direction:column;';

  document.body.appendChild(panel);
  renderNotificationPanel();
}

async function renderNotificationPanel() {
  const panel = document.getElementById('notification-panel');
  if (!panel) return;

  notifications = await fetchNotifications();
  notifications.forEach(n => { n.is_read = n.is_read == 1 || n.is_read === true; });
  const unread  = notifications.filter(n => !n.is_read).length;

  let html = `<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #dde3f0;background:#f5f7fc;">
    <span style="font-weight:700;font-size:0.95rem;color:#1a1f36;display:flex;align-items:center;gap:8px;">
      <i class="fas fa-bell" style="color:#e05c1a;"></i> Notifications
      ${unread > 0 ? `<span style="background:#e05c1a;color:white;font-size:0.75rem;padding:2px 8px;border-radius:10px;">${unread}</span>` : ''}
    </span>
    ${unread > 0 ? `<button onclick="markAllNotificationsRead()" style="background:none;border:none;color:#2952cc;font-size:0.75rem;font-weight:600;cursor:pointer;padding:4px 8px;border-radius:6px;">Tout marquer comme lu</button>` : ''}
  </div>
  <div style="overflow-y:auto;max-height:400px;padding:8px;">`;

  if (notifications.length === 0) {
    html += `<div style="display:flex;flex-direction:column;align-items:center;padding:40px 20px;color:#6b7a9b;">
      <i class="fas fa-bell-slash" style="font-size:2.5rem;margin-bottom:12px;opacity:0.5;"></i>
      <p>Aucune notification</p>
    </div>`;
  } else {
    notifications.forEach(n => {
      const iconClass = getNotificationIcon(n.type);
      const iconStyle = getNotificationColor(n.type);
      const isUnread  = !n.is_read;
      const bgStyle   = isUnread ? 'background:#f0f7ff;border:1px solid #c7d9f8;' : 'border:1px solid transparent;';
      const hoverOut  = isUnread ? '#f0f7ff' : 'transparent';
      const hoverBOut = isUnread ? '#c7d9f8' : 'transparent';
      html += `<div onclick="handleNotificationClick(${n.id_notification}, '${escapeHtml(n.link || '')}')"
        style="display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:12px;cursor:pointer;transition:all 0.2s;margin-bottom:4px;${bgStyle}"
        onmouseover="this.style.background='#f5f7fc';this.style.borderColor='#dde3f0'"
        onmouseout="this.style.background='${hoverOut}';this.style.borderColor='${hoverBOut}'">
        <div style="position:relative;flex-shrink:0;">
          <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem;background:${iconStyle};">
            <i class="fas ${iconClass}"></i>
          </div>
          ${isUnread ? '<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;background:#e05c1a;border-radius:50%;border:2px solid #fff;"></div>' : ''}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:${isUnread ? '700' : '600'};font-size:0.85rem;color:#1a1f36;margin-bottom:4px;">${escapeHtml(n.title)}</div>
          <div style="font-size:0.8rem;color:#6b7a9b;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(n.message)}</div>
          <div style="font-size:0.75rem;color:#6b7a9b;margin-top:4px;">${escapeHtml(n.time_ago || n.created_at)}</div>
        </div>
      </div>`;
    });
  }

  html += '</div>';
  panel.innerHTML = html;
}

async function toggleNotificationPanel(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }

  let panel = document.getElementById('notification-panel');
  if (!panel) {
    createNotificationPanel();
    panel = document.getElementById('notification-panel');
  }

  notifPanelOpen = !notifPanelOpen;

  if (notifPanelOpen) {
    await renderNotificationPanel();
    const bell = document.querySelector('.notification-btn');
    if (bell) {
      const rect = bell.getBoundingClientRect();
      panel.style.top   = (rect.bottom + 8) + 'px';
      panel.style.right = (window.innerWidth - rect.right) + 'px';
      panel.style.left  = 'auto';
    }
    panel.style.display = 'flex';
  } else {
    panel.style.display = 'none';
  }
}

async function handleNotificationClick(id, link) {
  const userId = sessionStorage.getItem('user_id');
  try {
    await fetch('api.php?action=mark_notification_read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify({ id })
    });
    const notif = notifications.find(n => n.id_notification === id);
    if (notif) notif.is_read = true;
    updateNotificationBadge();
    renderNotificationPanel();
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
  }

  // Navigation on notification click is intentionally disabled
}

async function markAllNotificationsRead() {
  const userId = sessionStorage.getItem('user_id');
  if (!userId) return;
  try {
    await fetch('api.php?action=mark_all_notifications_read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId }
    });
    notifications.forEach(n => n.is_read = true);
    updateNotificationBadge();
    renderNotificationPanel();
  } catch (err) {
    console.error('Failed to mark all as read:', err);
  }
}

// ══════════════════════════════════════════════════════════════
//  PROFILE DROPDOWN
// ══════════════════════════════════════════════════════════════
let profileDropdownOpen = false;

function createProfileDropdown() {
  const existing = document.getElementById('profile-dropdown');
  if (existing) existing.remove();

  const role   = sessionStorage.getItem('user_role')  || 'etudiant';
  const name   = sessionStorage.getItem('user_name')  || 'Utilisateur';
  const email  = sessionStorage.getItem('user_email') || '';
  const initials  = getInitials(name);
  const roleLabel = ROLE_LABELS[role] || role;

  const roleColors = {
    admin:      'background:#ede9fe;color:#7c3aed',
    technicien: 'background:#fff5f0;color:#e05c1a',
    etudiant:   'background:#eef2ff;color:#2952cc',
    prof:       'background:#dcfce7;color:#16a34a'
  };

  const dropdown = document.createElement('div');
  dropdown.id = 'profile-dropdown';
  dropdown.style.cssText = 'position:fixed;width:280px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);border:1px solid #dde3f0;z-index:9999;overflow:hidden;display:none;';

  dropdown.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;padding:20px;background:linear-gradient(135deg,#f0f7ff 0%,#fff 100%);">
      <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#2952cc 0%,#e84e1b 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;flex-shrink:0;">${initials}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:0.95rem;color:#1a1f36;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(name)}</div>
        <div style="font-size:0.8rem;color:#6b7a9b;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(email)}</div>
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:capitalize;${roleColors[role]}">${roleLabel}</span>
      </div>
    </div>
    <div style="height:1px;background:#dde3f0;"></div>
    <a href="#" onclick="openProfileModal(); return false;" style="display:flex;align-items:center;gap:12px;padding:14px 20px;color:#1a1f36;text-decoration:none;font-size:0.9rem;font-weight:500;transition:all 0.2s;cursor:pointer;">
      <i class="fas fa-user-circle" style="width:20px;text-align:center;color:#6b7a9b;font-size:1rem;"></i> Mon Profil
    </a>
    <a href="mes_reservations.html" style="display:flex;align-items:center;gap:12px;padding:14px 20px;color:#1a1f36;text-decoration:none;font-size:0.9rem;font-weight:500;transition:all 0.2s;cursor:pointer;">
      <i class="fas fa-calendar-alt" style="width:20px;text-align:center;color:#6b7a9b;font-size:1rem;"></i> Mes Réservations
    </a>
    ${role !== 'admin' && role !== 'technicien' ? `
    <a href="signaler.html" style="display:flex;align-items:center;gap:12px;padding:14px 20px;color:#1a1f36;text-decoration:none;font-size:0.9rem;font-weight:500;transition:all 0.2s;cursor:pointer;">
      <i class="fas fa-flag" style="width:20px;text-align:center;color:#6b7a9b;font-size:1rem;"></i> Signaler un problème
    </a>` : ''}
    <div style="height:1px;background:#dde3f0;"></div>
    <a href="login.html" onclick="sessionStorage.clear()" style="display:flex;align-items:center;gap:12px;padding:14px 20px;color:#ef4444;text-decoration:none;font-size:0.9rem;font-weight:500;transition:all 0.2s;cursor:pointer;">
      <i class="fas fa-sign-out-alt" style="width:20px;text-align:center;color:#ef4444;font-size:1rem;"></i> Déconnexion
    </a>`;

  dropdown.addEventListener('mouseover', function(e) {
    const item = e.target.closest('a');
    if (item) {
      item.style.background = '#f5f7fc';
      item.style.color = '#2952cc';
      const icon = item.querySelector('i');
      if (icon) icon.style.color = '#2952cc';
    }
  });
  dropdown.addEventListener('mouseout', function(e) {
    const item = e.target.closest('a');
    if (item) {
      item.style.background = 'transparent';
      if (item.getAttribute('onclick') && item.getAttribute('onclick').includes('sessionStorage.clear')) {
        item.style.color = '#ef4444';
        const icon = item.querySelector('i');
        if (icon) icon.style.color = '#ef4444';
      } else {
        item.style.color = '#1a1f36';
        const icon = item.querySelector('i');
        if (icon) icon.style.color = '#6b7a9b';
      }
    }
  });

  document.body.appendChild(dropdown);
}

function toggleProfileDropdown(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }

  let dropdown = document.getElementById('profile-dropdown');
  if (!dropdown) {
    createProfileDropdown();
    dropdown = document.getElementById('profile-dropdown');
  }

  profileDropdownOpen = !profileDropdownOpen;

  if (profileDropdownOpen) {
    const btn = document.querySelector('.profile-btn');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      dropdown.style.top   = (rect.bottom + 8) + 'px';
      dropdown.style.right = (window.innerWidth - rect.right) + 'px';
      dropdown.style.left  = 'auto';
    }
    dropdown.style.display = 'block';
  } else {
    dropdown.style.display = 'none';
  }
}

// ── PROFILE MODAL ────────────────────────────────────────────
function openProfileModal() {
  closeAllDropdowns();

  const existing = document.getElementById('profile-modal');
  if (existing) { existing.style.display = 'flex'; return; }

  const modal = document.createElement('div');
  modal.id = 'profile-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(26,31,54,0.8);backdrop-filter:blur(4px);z-index:10000;display:none;align-items:center;justify-content:center;padding:20px;';

  const name  = sessionStorage.getItem('user_name')  || '';
  const email = sessionStorage.getItem('user_email') || '';
  const parts = name.split(' ');

  modal.innerHTML = `
    <div onclick="event.stopPropagation()" style="background:#fff;border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #dde3f0;">
        <h3 style="font-size:1.1rem;font-weight:700;color:#1a1f36;display:flex;align-items:center;gap:10px;">
          <i class="fas fa-user-edit" style="color:#2952cc;"></i> Mon Profil
        </h3>
        <button onclick="closeProfileModal()" style="width:36px;height:36px;border-radius:50%;border:none;background:#f5f7fc;color:#6b7a9b;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;transition:all 0.2s;">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div id="profile-msg" style="padding:0 24px;margin-top:20px;"></div>
      <div style="padding:0 24px;margin-bottom:16px;">
        <label style="display:block;font-size:0.85rem;font-weight:600;color:#1a1f36;margin-bottom:8px;">Prénom</label>
        <input type="text" id="edit-prenom" value="${parts[0] || ''}" style="width:100%;padding:12px 16px;border:1.5px solid #dde3f0;border-radius:10px;font-family:inherit;font-size:0.9rem;color:#1a1f36;outline:none;box-sizing:border-box;">
      </div>
      <div style="padding:0 24px;margin-bottom:16px;">
        <label style="display:block;font-size:0.85rem;font-weight:600;color:#1a1f36;margin-bottom:8px;">Nom</label>
        <input type="text" id="edit-nom" value="${parts.slice(1).join(' ')}" style="width:100%;padding:12px 16px;border:1.5px solid #dde3f0;border-radius:10px;font-family:inherit;font-size:0.9rem;color:#1a1f36;outline:none;box-sizing:border-box;">
      </div>
      <div style="padding:0 24px;margin-bottom:16px;">
        <label style="display:block;font-size:0.85rem;font-weight:600;color:#1a1f36;margin-bottom:8px;">Email</label>
        <input type="email" id="edit-email" value="${email}" style="width:100%;padding:12px 16px;border:1.5px solid #dde3f0;border-radius:10px;font-family:inherit;font-size:0.9rem;color:#1a1f36;outline:none;box-sizing:border-box;">
      </div>
      <div style="padding:0 24px;margin-bottom:16px;">
        <label style="display:block;font-size:0.85rem;font-weight:600;color:#1a1f36;margin-bottom:8px;">Nouveau mot de passe (optionnel)</label>
        <input type="password" id="edit-password" placeholder="••••••••" style="width:100%;padding:12px 16px;border:1.5px solid #dde3f0;border-radius:10px;font-family:inherit;font-size:0.9rem;color:#1a1f36;outline:none;box-sizing:border-box;">
      </div>
      <div style="padding:0 24px;margin-bottom:20px;">
        <label style="display:block;font-size:0.85rem;font-weight:600;color:#1a1f36;margin-bottom:8px;">Confirmer le mot de passe</label>
        <input type="password" id="edit-password-confirm" placeholder="••••••••" style="width:100%;padding:12px 16px;border:1.5px solid #dde3f0;border-radius:10px;font-family:inherit;font-size:0.9rem;color:#1a1f36;outline:none;box-sizing:border-box;">
      </div>
      <div style="display:flex;gap:12px;padding:20px 24px;border-top:1px solid #dde3f0;background:#f5f7fc;border-radius:0 0 20px 20px;">
        <button onclick="saveProfile()" style="flex:1;padding:12px 20px;border:none;border-radius:10px;background:linear-gradient(90deg,#2952cc,#e84e1b);color:#fff;font-family:inherit;font-size:0.9rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
          <i class="fas fa-save"></i> Enregistrer
        </button>
        <button onclick="closeProfileModal()" style="padding:12px 20px;border:1.5px solid #dde3f0;border-radius:10px;background:#fff;color:#6b7a9b;font-family:inherit;font-size:0.9rem;font-weight:500;cursor:pointer;">
          Annuler
        </button>
      </div>
    </div>`;

  const inputs = modal.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', function() { this.style.borderColor = '#4e80f5'; this.style.boxShadow = '0 0 0 3px rgba(78,128,245,0.12)'; });
    input.addEventListener('blur',  function() { this.style.borderColor = '#dde3f0'; this.style.boxShadow = 'none'; });
  });

  document.body.appendChild(modal);
  modal.onclick = function(e) { if (e.target === modal) closeProfileModal(); };
  modal.style.display = 'flex';
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) modal.style.display = 'none';
}

function saveProfile() {
  const prenom  = document.getElementById('edit-prenom').value.trim();
  const nom     = document.getElementById('edit-nom').value.trim();
  const email   = document.getElementById('edit-email').value.trim();
  const pwd     = document.getElementById('edit-password').value;
  const pwdConf = document.getElementById('edit-password-confirm').value;

  if (!prenom || !nom || !email) { showProfileMessage('Tous les champs sont requis', 'error'); return; }
  if (pwd && pwd !== pwdConf)    { showProfileMessage('Les mots de passe ne correspondent pas', 'error'); return; }

  sessionStorage.setItem('user_name',  prenom + ' ' + nom);
  sessionStorage.setItem('user_email', email);

  showProfileMessage('Profil mis à jour avec succès !', 'success');
  setTimeout(() => { closeProfileModal(); createProfileDropdown(); updateSidebarProfile(); }, 1000);
}

function showProfileMessage(msg, type) {
  const div = document.getElementById('profile-msg');
  if (!div) return;
  const c = type === 'success'
    ? { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0', icon: 'fa-check-circle' }
    : { bg: '#fef2f2', color: '#ef4444', border: '#fee2e2', icon: 'fa-exclamation-circle' };
  div.innerHTML = `<div style="background:${c.bg};color:${c.color};border:1px solid ${c.border};border-radius:8px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
    <i class="fas ${c.icon}"></i> ${escapeHtml(msg)}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
//  SIDEBAR / NAV
// ══════════════════════════════════════════════════════════════
function buildNav() {
  const role = sessionStorage.getItem('user_role') || 'etudiant';
  const cfg  = NAV_CONFIG[role] || NAV_CONFIG.etudiant;

  const logoTitle    = document.getElementById('logo-title');
  const logoSubtitle = document.getElementById('logo-subtitle');
  if (logoTitle)    logoTitle.textContent    = cfg.logoTitle;
  if (logoSubtitle) logoSubtitle.textContent = cfg.logoSubtitle;

  const list = document.getElementById('sidebar-nav-list');
  if (!list) return;

  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  const currentHash = window.location.hash;

  list.innerHTML = cfg.links.map(item => {
    const itemFile = item.href.split('#')[0];
    const itemHash = item.href.includes('#') ? '#' + item.href.split('#')[1] : '';
    let isActive;
    if (itemFile === currentPage) {
      if (itemHash) {
        isActive = itemHash === currentHash;
      } else {
        isActive = !currentHash;
      }
    } else {
      isActive = false;
    }
    return `<li class="nav-item${isActive ? ' active' : ''}">
      <a href="${item.href}"><i class="${item.icon}"></i><span>${item.label}</span></a>
    </li>`;
  }).join('');

  updateSidebarProfile();
}

function updateSidebarProfile() {
  const container = document.getElementById('user-profile');
  if (!container) return;
  const name      = sessionStorage.getItem('user_name')  || 'Utilisateur';
  const role      = sessionStorage.getItem('user_role')  || 'etudiant';
  const initials  = getInitials(name);
  const roleLabel = ROLE_LABELS[role] || role;
  container.innerHTML = `
    <div class="user-avatar">${initials}</div>
    <div class="user-info">
      <span class="user-name">${escapeHtml(name)}</span>
      <span class="user-role">${roleLabel}</span>
    </div>`;
}

// ── HELP MODAL ───────────────────────────────────────────────
function openHelpModal() {
  closeAllDropdowns();
  const role = sessionStorage.getItem('user_role') || 'etudiant';
  const helpText = {
    admin:      'Guide Admin:\n• Signalements: Gérez les réclamations\n• Utilisateurs: Gérez les comptes\n• Statistiques: Voir les rapports',
    technicien: 'Guide Technicien:\n• Mes Tâches: Vos interventions\n• Historique: Interventions terminées',
    etudiant:   'Guide Étudiant:\n• Disponibilité: Réserver des salles\n• Mes Réservations: Gérer vos réservations\n• Signaler: Déclarer un problème',
    prof:       'Guide Prof:\n• Disponibilité: Réserver des salles\n• Mes Réservations: Gérer vos réservations\n• Signaler: Déclarer un problème'
  };
  alert(helpText[role] || helpText.etudiant);
}

// ── CLOSE ALL DROPDOWNS ──────────────────────────────────────
function closeAllDropdowns() {
  notifPanelOpen      = false;
  profileDropdownOpen = false;
  const notifPanel      = document.getElementById('notification-panel');
  const profileDropdown = document.getElementById('profile-dropdown');
  if (notifPanel)      notifPanel.style.display      = 'none';
  if (profileDropdown) profileDropdown.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════
//  CATEGORY / STATUS HELPERS
// ══════════════════════════════════════════════════════════════
const CAT_LABEL = {
  IT_RESEAU: 'Wi-Fi / Réseau', MAINTENANCE_CLIM: 'Climatisation',
  PROJECTEUR: 'Projecteur',   ELECTRIQUE: 'Électricité', Autre: 'Autre',
};
const CAT_ICON = {
  IT_RESEAU: 'fa-wifi', MAINTENANCE_CLIM: 'fa-snowflake',
  PROJECTEUR: 'fa-video', ELECTRIQUE: 'fa-bolt', Autre: 'fa-tools',
};

function catBadge(cat) {
  return `<span class="badge badge-${(cat || 'Autre').toLowerCase().replace(/[^a-z]/g, '')}">
    <i class="fas ${CAT_ICON[cat] || 'fa-tools'}"></i> ${CAT_LABEL[cat] || cat}
  </span>`;
}

function statutBadge(s) {
  const labels = { 'en attente': 'En attente', 'en cours': 'En cours', 'resolue': 'Résolue', 'confirmee': 'Confirmée', 'annulee': 'Annulée', 'terminee': 'Terminée', 'fantome': 'Ghost Booking' };
  const map    = { 'en attente': 'warning', 'en cours': 'info', 'resolue': 'success', 'confirmee': 'success', 'annulee': 'danger', 'terminee': 'secondary', 'fantome': 'danger' };
  return `<span class="badge badge-${map[s] || 'secondary'}">${labels[s] || s}</span>`;
}

function isResPast(r) {
  const fin = r.heure_fin || '00:00:00';
  return new Date(r.date + 'T' + fin) < new Date();
}

// ══════════════════════════════════════════════════════════════
//  CUSTOM CONFIRM / ALERT MODALS
// ══════════════════════════════════════════════════════════════
var _confirmCallback = null;

function showConfirm(message, onConfirm) {
  _confirmCallback = onConfirm;
  let modal = document.getElementById('_confirm_modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = '_confirm_modal';
  modal.innerHTML = `
    <div class="confirm-backdrop" onclick="closeConfirm()"></div>
    <div class="confirm-box">
      <div class="confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
      <p class="confirm-msg" id="_confirm_msg"></p>
      <div class="confirm-actions">
        <button class="confirm-btn-cancel" onclick="closeConfirm()">Annuler</button>
        <button class="confirm-btn-ok" onclick="doConfirm()">Confirmer</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('_confirm_msg').textContent = message;
  modal.style.display = 'flex';
  document.addEventListener('keydown', handleConfirmKeydown);
}

function handleConfirmKeydown(e) {
  if (e.key === 'Escape') closeConfirm();
}

function closeConfirm() {
  const m = document.getElementById('_confirm_modal');
  if (m) { m.style.display = 'none'; setTimeout(() => { if (m.parentNode) m.remove(); }, 200); }
  _confirmCallback = null;
  document.removeEventListener('keydown', handleConfirmKeydown);
}

function doConfirm() {
  const cb = _confirmCallback;
  closeConfirm();
  if (cb) setTimeout(() => cb(), 100);
}

function showAlert(message, type = 'error') {
  let modal = document.getElementById('_alert_modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = '_alert_modal';
    modal.innerHTML = `
      <div class="confirm-backdrop" onclick="closeAlert()"></div>
      <div class="confirm-box">
        <div class="confirm-icon confirm-icon-error" id="_alert_icon"><i class="fas fa-times-circle"></i></div>
        <p class="confirm-msg" id="_alert_msg"></p>
        <div class="confirm-actions">
          <button class="confirm-btn-ok" onclick="closeAlert()">OK</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  const iconEl = document.getElementById('_alert_icon');
  iconEl.className = type === 'success' ? 'confirm-icon confirm-icon-success' : 'confirm-icon confirm-icon-error';
  iconEl.innerHTML = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
  document.getElementById('_alert_msg').textContent = message;
  modal.style.display = 'flex';
}

function closeAlert() {
  const m = document.getElementById('_alert_modal');
  if (m) m.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════
//  PAGE: LOGIN
// ══════════════════════════════════════════════════════════════
function initLoginPage() {
  if (!document.getElementById('email') || document.getElementById('sidebar-nav-list')) return;
  const pwd = document.getElementById('password');
  if (pwd) pwd.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
}

async function handleLogin() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('error-msg');
  errorMsg.style.display = 'none';

  if (!email || !password) {
    errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Veuillez remplir tous les champs.';
    errorMsg.style.display = 'block'; return;
  }
  try {
    const res  = await fetch('api.php?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('user_id',    data.id_user);
      sessionStorage.setItem('user_role',  data.role);
      sessionStorage.setItem('user_name',  data.prenom + ' ' + data.nom);
      sessionStorage.setItem('user_email', email);
      if (data.role === 'admin')           window.location.href = 'admin.html';
      else if (data.role === 'technicien') window.location.href = 'tech.html';
      else                                 window.location.href = 'dashboard.html';
    } else {
      errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (data.error || 'Email ou mot de passe incorrect.');
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erreur de connexion : ' + err.message;
    errorMsg.style.display = 'block';
  }
}

function togglePwd(id) {
  const input = document.getElementById(id || 'password');
  input.type  = input.type === 'password' ? 'text' : 'password';
}

// ══════════════════════════════════════════════════════════════
//  PAGE: REGISTER (si.html)
// ══════════════════════════════════════════════════════════════
var selectedRole = 'etudiant';

function selectType(btn) {
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedRole = btn.dataset.role;
}

async function handleRegister() {
  const prenom     = document.getElementById('prenom').value.trim();
  const nom        = document.getElementById('nom').value.trim();
  const email      = document.getElementById('email').value.trim();
  const pwd1       = document.getElementById('pwd1').value;
  const pwd2       = document.getElementById('pwd2').value;
  const errorMsg   = document.getElementById('error-msg');
  const successMsg = document.getElementById('success-msg');
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';

  if (!prenom || !nom || !email || !pwd1 || !pwd2) {
    errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Veuillez remplir tous les champs.';
    errorMsg.style.display = 'block'; return;
  }
  if (pwd1 !== pwd2) {
    errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Les mots de passe ne correspondent pas.';
    errorMsg.style.display = 'block'; return;
  }
  if (pwd1.length < 6) {
    errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Le mot de passe doit contenir au moins 6 caractères.';
    errorMsg.style.display = 'block'; return;
  }
  try {
    const res  = await fetch('api.php?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom, nom, email, password: pwd1, role: selectedRole }),
    });
    const data = await res.json();
    if (data.success) {
      successMsg.style.display = 'block';
      setTimeout(() => window.location.href = 'login.html', 1800);
    } else {
      errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (data.error || "Erreur lors de l'inscription");
      errorMsg.style.display = 'block';
    }
  } catch {
    errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erreur de connexion';
    errorMsg.style.display = 'block';
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE: DASHBOARD (disponibilité / réservation)
// ══════════════════════════════════════════════════════════════
var allRooms    = [];
var selectedDate = new Date().toISOString().split('T')[0];
var calDate      = new Date();

async function initDashboard() {
  if (!document.getElementById('rooms-grid')) return;
  if (!requireAuth()) return;
  buildNav();

  const u        = getUser();
  const isAdmin  = u.role === 'admin';
  const titleEl    = document.getElementById('page-title');
  const subtitleEl = document.getElementById('page-subtitle');
  if (titleEl)    titleEl.innerHTML    = isAdmin ? 'Gestion des <span>Salles</span>' : 'Disponibilité des <span>Salles</span>';
  if (subtitleEl) subtitleEl.textContent = isAdmin ? "Consultez et gérez l'état de toutes les salles" : 'Consultez et réservez les salles disponibles';
  document.body.classList.add('role-' + (u.role || 'etudiant'));

  renderCalendar();
  document.getElementById('datepicker-label').textContent = "Aujourd'hui";
  await loadRooms();

  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  ['modal-heure-debut','modal-heure-fin'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) hours.forEach(h => sel.add(new Option(h, h)));
  });
  const md = document.getElementById('modal-date');
  if (md) md.value = selectedDate;
}

async function loadRooms() {
  const data = await api('salles');
  allRooms   = Array.isArray(data) ? data : [];
  const reservations = await api('reservations_par_date', { qs: 'date=' + selectedDate });
  allRooms.forEach(r => {
    r._reserved = (reservations || []).filter(rv => rv.id_salle == r.id_salle).map(rv => rv.heure_debut + '-' + rv.heure_fin);
  });
  filterRooms();
}

function filterRooms() {
  const q    = (document.getElementById('search-input')?.value || '').toLowerCase();
  const type = document.getElementById('filter-type')?.value || '';
  const etat = document.getElementById('filter-etat')?.value || '';
  const grid = document.getElementById('rooms-grid');
  if (!grid) return;

  const filtered = allRooms.filter(r =>
    (!q    || r.nom_salle.toLowerCase().includes(q)) &&
    (!type || r.type === type) &&
    (!etat || r.etat === etat)
  );

  if (!filtered.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-text);"><i class="fas fa-search" style="font-size:2rem;"></i><p style="margin-top:12px;">Aucune salle trouvée</p></div>';
    return;
  }

  const etatColor = { disponible: 'green', en_maintenance: 'orange', 'en panne': 'red' };
  const etatLabel = { disponible: 'Disponible', en_maintenance: 'En maintenance', 'en panne': 'En panne' };
  const typeLabel = { cours: 'Salle de cours', tp: 'Labo / TP', amphi: 'Amphithéâtre' };
  const typeIcon  = { cours: 'fa-chalkboard', tp: 'fa-flask', amphi: 'fa-university' };

  grid.innerHTML = filtered.map(r => {
    const color    = etatColor[r.etat] || 'gray';
    const label    = etatLabel[r.etat] || r.etat;
    const canBook  = r.etat === 'disponible';
    const reserved = r._reserved || [];
    const safeName = r.nom_salle.replace(/'/g, "\\'");

    const topRightBadge = `<span class="room-state-badge room-state-${color}">${label}</span>`;

    const toMin = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
    const toStr = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const DAY_S = toMin('08:00'), DAY_E = toMin('20:00');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday  = selectedDate === todayStr;
    const currentTimeMin  = isToday ? (now.getHours() * 60 + now.getMinutes()) : DAY_S;
    const effectiveStart  = isToday ? Math.max(DAY_S, currentTimeMin) : DAY_S;

    const sortedRes = [...reserved].map(s => {
      const [hd, hf] = s.split('-');
      return { s: toMin(hd), e: toMin(hf) };
    }).sort((a, b) => a.s - b.s);

    const relevantRes = isToday ? sortedRes.filter(r => r.e > currentTimeMin) : sortedRes;
    const freeSlots = [];
    let cursor = effectiveStart;
    for (const slot of relevantRes) {
      if (slot.s > cursor) freeSlots.push({ s: cursor, e: slot.s });
      if (slot.e > cursor) cursor = slot.e;
    }
    if (cursor < DAY_E) freeSlots.push({ s: cursor, e: DAY_E });
    const validFreeSlots = freeSlots.filter(f => (f.e - f.s) >= 60);

    const isFullyOccupied = (isToday && currentTimeMin >= DAY_E) ||
      (relevantRes.length > 0 && validFreeSlots.length === 0);
    const isFullyFree = relevantRes.length === 0 && validFreeSlots.length > 0;

    const freeSlotsHtml = isFullyOccupied
      ? `<div class="room-reserved-slots"><span class="room-slot-badge-full"><i class="fas fa-ban"></i> Occupé</span></div>`
      : isFullyFree
        ? `<div class="room-reserved-slots"><span class="room-slot-badge-free"><i class="fas fa-check-circle"></i> Libre toute la journée</span></div>`
        : validFreeSlots.length > 0
          ? `<div class="room-reserved-slots">${validFreeSlots.map(f =>
              `<span class="room-slot-badge-free"><i class="fas fa-check-circle"></i> ${toStr(f.s)}–${toStr(f.e)}</span>`
            ).join('')}</div>`
          : `<div class="room-reserved-slots"><span class="room-slot-badge-full"><i class="fas fa-ban"></i> Occupé</span></div>`;

    return `<div class="room-card${!canBook ? ' room-card-disabled' : ''}">
      <div class="room-card-header">
        <div class="room-icon room-icon-${r.type_salle || r.type || 'cours'}">
          <i class="fas ${typeIcon[r.type_salle || r.type] || 'fa-door-open'}"></i>
        </div>
        <div class="room-header-badges">${topRightBadge}</div>
      </div>
      <h3 class="room-name">${r.nom_salle}</h3>
      <div class="room-meta">
        <div class="room-meta-item"><i class="fas fa-users"></i><span>${r.capacite || '—'} places</span></div>
        <div class="room-meta-item"><i class="fas ${typeIcon[r.type_salle || r.type] || 'fa-door-open'}"></i><span>${typeLabel[r.type_salle || r.type] || r.type || '—'}</span></div>
      </div>
      ${freeSlotsHtml}
      <button class="btn-reserve-card" onclick="openReservationModal(${r.id_salle}, '${safeName}')" ${canBook && validFreeSlots.length > 0 ? '' : 'disabled'}>
        <i class="fas fa-calendar-plus"></i> Réserver
      </button>
    </div>`;
  }).join('');
}

// ── Datepicker ────────────────────────────────────────────────
function toggleDatepicker(e) {
  e.stopPropagation();
  document.getElementById('datepicker-dropdown').classList.toggle('open');
}
document.addEventListener('click', () => {
  const dd = document.getElementById('datepicker-dropdown');
  if (dd) dd.classList.remove('open');
});
function changeMonth(delta) {
  calDate.setMonth(calDate.getMonth() + delta);
  renderCalendar();
}
function renderCalendar() {
  const grid  = document.getElementById('calendar-grid');
  const label = document.getElementById('cal-month-label');
  if (!grid) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const y = calDate.getFullYear(), m = calDate.getMonth();
  label.textContent = new Date(y, m).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  let html = days.map(d => `<div class="cal-day-name">${d}</div>`).join('');
  const first  = new Date(y, m, 1).getDay();
  const offset = (first === 0 ? 6 : first - 1);
  for (let i = 0; i < offset; i++) html += '<div class="cal-day empty"></div>';
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d); date.setHours(0, 0, 0, 0);
    const str  = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cls  = ['cal-day', date < today ? 'past' : '', str === selectedDate ? 'selected' : '', date.toDateString() === today.toDateString() ? 'today' : ''].filter(Boolean).join(' ');
    html += `<div class="${cls}" onclick="selectCalDate('${str}')">${d}</div>`;
  }
  grid.innerHTML = html;
}
async function selectCalDate(str) {
  selectedDate = str;
  document.getElementById('datepicker-label').textContent = new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  document.getElementById('datepicker-dropdown').classList.remove('open');
  const md = document.getElementById('modal-date');
  if (md) md.value = str;
  renderCalendar();
  await loadRooms();
}

// ── Reservation Modal ─────────────────────────────────────────
var _currentRoom = null;

function openReservationModal(id, name) {
  _currentRoom = id;
  const room     = allRooms.find(r => r.id_salle == id);
  const reserved = room ? (room._reserved || []) : [];

  const blockedHours = new Set();
  reserved.forEach(slot => {
    const [startStr, endStr] = slot.split('-');
    const start = parseInt(startStr.split(':')[0]);
    const end   = parseInt(endStr.split(':')[0]);
    for (let h = start; h < end; h++) blockedHours.add(h);
  });

  const now         = new Date();
  const todayStr    = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const isToday     = selectedDate === todayStr;

  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  ['modal-heure-debut','modal-heure-fin'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Sélectionner</option>';
    hours.forEach(h => {
      const hInt      = parseInt(h.split(':')[0]);
      const isPast    = isToday && (selId === 'modal-heure-debut' ? hInt <= currentHour : hInt - 1 <= currentHour);
      const isBlocked = isPast || (selId === 'modal-heure-debut' ? blockedHours.has(hInt) : blockedHours.has(hInt - 1));
      const opt = new Option(isBlocked ? `${h} — indisponible` : h, h);
      if (isBlocked) { opt.disabled = true; opt.style.color = '#ef4444'; }
      sel.add(opt);
    });
  });

  const toMinM = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
  const toStrM = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const DAY_S  = toMinM('08:00'), DAY_E = toMinM('20:00');
  const currentTimeMin = isToday ? (now.getHours() * 60 + now.getMinutes()) : DAY_S;
  const effectiveStart = isToday ? Math.max(DAY_S, currentTimeMin) : DAY_S;

  const sortedResM = [...reserved].map(s => {
    const [hd, hf] = s.split('-');
    return { s: toMinM(hd), e: toMinM(hf) };
  }).sort((a, b) => a.s - b.s);
  const relevantResM = isToday ? sortedResM.filter(r => r.e > currentTimeMin) : sortedResM;
  const freeM = []; let curM = effectiveStart;
  for (const slot of relevantResM) {
    if (slot.s > curM) freeM.push({ s: curM, e: slot.s });
    if (slot.e > curM) curM = slot.e;
  }
  if (curM < DAY_E) freeM.push({ s: curM, e: DAY_E });

  const isFullyOccupied = (isToday && currentTimeMin >= DAY_E) ||
    (relevantResM.length > 0 && freeM.filter(f => (f.e - f.s) >= 60).length === 0);

  const slotsInfo = isFullyOccupied
    ? '<div style="margin-top:6px;font-size:.82rem;color:#ef4444;"><i class="fas fa-ban"></i> Occupé toute la journée</div>'
    : relevantResM.length === 0
      ? '<div style="margin-top:6px;font-size:.82rem;color:#16a34a;"><i class="fas fa-check-circle"></i> Libre toute la journée</div>'
      : `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${freeM.filter(f => (f.e - f.s) >= 60).map(f =>
          `<span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:6px;font-size:.78rem;font-weight:600;border:1px solid #bbf7d0;"><i class="fas fa-check-circle"></i> ${toStrM(f.s)}–${toStrM(f.e)}</span>`
        ).join('')}</div>`;

  document.getElementById('room-info-display').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:.95rem;">
      <i class="fas fa-door-open" style="color:var(--blue-mid);"></i> ${name}
    </div>
    ${slotsInfo}`;

  document.getElementById('modal-success-msg').style.display = 'none';
  document.getElementById('modal-error-msg').style.display   = 'none';
  document.getElementById('modal-date').value = selectedDate;
  document.getElementById('reservation-modal').style.display = 'flex';
}

function closeReservationModal(e) {
  if (e && e.target !== document.getElementById('reservation-modal')) return;
  document.getElementById('reservation-modal').style.display = 'none';
}

async function confirmerReservationModal() {
  const date  = document.getElementById('modal-date').value;
  const debut = document.getElementById('modal-heure-debut').value;
  const fin   = document.getElementById('modal-heure-fin').value;
  const errEl = document.getElementById('modal-error-msg');
  const sucEl = document.getElementById('modal-success-msg');
  errEl.style.display = 'none'; sucEl.style.display = 'none';

  if (!date || !debut || !fin) { errEl.textContent = 'Veuillez remplir tous les champs.'; errEl.style.display = 'block'; return; }
  if (debut >= fin)            { errEl.textContent = "L'heure de fin doit être après le début."; errEl.style.display = 'block'; return; }

  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (date < todayStr) { errEl.textContent = 'Impossible de réserver une date passée.'; errEl.style.display = 'block'; return; }
  if (date === todayStr) {
    const currentHour = now.getHours();
    const debutHour   = parseInt(debut.split(':')[0]);
    if (debutHour <= currentHour) {
      errEl.textContent = `Il est ${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')} — vous ne pouvez plus réserver un créneau déjà passé aujourd'hui.`;
      errEl.style.display = 'block'; return;
    }
  }

  const data = await api('reserver', { body: { salle: _currentRoom, date, debut, fin } });
  if (data.success) {
    sucEl.style.display = 'block';
    setTimeout(() => { document.getElementById('reservation-modal').style.display = 'none'; loadRooms(); }, 1500);
  } else {
    errEl.textContent = data.error || 'Erreur lors de la réservation.';
    errEl.style.display = 'block';
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE: MES RÉSERVATIONS
// ══════════════════════════════════════════════════════════════
var allRes = [];

async function initMesReservations() {
  if (!document.getElementById('res-list')) return;
  if (!requireAuth()) return;
  buildNav();
  const data = await api('reservations');
  allRes = Array.isArray(data) ? data : [];
  filterRes();
}

function filterRes() {
  const q      = (document.getElementById('search-res')?.value || '').toLowerCase();
  const statut = document.getElementById('filter-statut')?.value || '';
  const list   = document.getElementById('res-list');
  const filtered = allRes.filter(r =>
    (!q      || r.nom_salle.toLowerCase().includes(q)) &&
    (!statut || r.statut === statut)
  );
  if (!filtered.length) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--gray-text);">Aucune réservation trouvée</div>';
    return;
  }
  list.innerHTML = filtered.map(r => {
    const effectiveStatut = (r.statut === 'confirmee' && isResPast(r)) ? 'terminee' : r.statut;
    const canCancel = r.statut === 'confirmee' && !isResPast(r);
    return `<div class="res-item${effectiveStatut === 'terminee' ? ' res-item-past' : effectiveStatut === 'annulee' ? ' res-item-annulee' : effectiveStatut === 'fantome' ? ' res-item-fantome' : ''}">
      <div class="res-info">
        <div class="res-room-name"><i class="fas fa-door-open"></i> ${r.nom_salle}</div>
        <div class="res-meta">
          <span><i class="fas fa-calendar"></i> ${fmtDate(r.date)}</span>
          <span><i class="fas fa-clock"></i> ${r.heure_debut.slice(0, 5)} – ${r.heure_fin.slice(0, 5)}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        ${statutBadge(effectiveStatut)}
        ${canCancel ? `<button class="btn-danger-sm" onclick="annulerRes(${r.id_reservation})"><i class="fas fa-times"></i> Annuler</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function annulerRes(id) {
  showConfirm('Voulez-vous annuler cette réservation ?', async () => {
    const data = await api('annuler', { body: { id } });
    if (data.success) { allRes = allRes.map(r => r.id_reservation == id ? { ...r, statut: 'annulee' } : r); filterRes(); }
    else showAlert(data.error || "Erreur lors de l'annulation.");
  });
}

// ══════════════════════════════════════════════════════════════
//  PAGE: SIGNALER
// ══════════════════════════════════════════════════════════════
var _detectTimeout = null;

async function initSignaler() {
  if (!document.getElementById('salle-select')) return;
  if (!requireAuth()) return;
  buildNav();
  const salles = await api('salles');
  const sel    = document.getElementById('salle-select');
  (salles || []).forEach(s => sel.add(new Option(s.nom_salle, s.id_salle)));
  loadSignalerStats();
  loadRecentReports();
}

function detectCategory(text) {
  clearTimeout(_detectTimeout);
  if (text.length < 10) { document.getElementById('ai-category-display').style.display = 'none'; return; }
  _detectTimeout = setTimeout(() => {
    const cats = {
      IT_RESEAU:        ['wifi', 'réseau', 'internet', 'connexion'],
      MAINTENANCE_CLIM: ['clim', 'climatisation', 'chauffage', 'froid', 'chaud'],
      PROJECTEUR:       ['projecteur', 'vidéo', 'écran', 'vidéoprojecteur', 'beamer'],
      ELECTRIQUE:       ['électricité', 'électrique', 'prise', 'courant', 'lampe', 'lumière'],
    };
    let detected = 'Autre';
    for (const [cat, kws] of Object.entries(cats)) {
      if (kws.some(k => text.toLowerCase().includes(k))) { detected = cat; break; }
    }
    document.getElementById('detected-category').textContent = CAT_LABEL[detected] || detected;
    document.getElementById('ai-category-display').style.display = 'block';
    document.getElementById('ai-category-display').dataset.cat   = detected;
  }, 600);
}

async function envoyerSignalement() {
  const salle = document.getElementById('salle-select').value;
  const desc  = document.getElementById('description').value.trim();
  const cat   = document.getElementById('ai-category-display').dataset.cat || 'Autre';
  const errEl = document.getElementById('error-msg');
  const sucEl = document.getElementById('success-msg');
  errEl.style.display = 'none'; sucEl.style.display = 'none';

  if (!salle || !desc) { errEl.textContent = 'Veuillez remplir tous les champs.'; errEl.style.display = 'block'; return; }

  const fd = new FormData();
  fd.append('salle', salle); fd.append('description', desc); fd.append('categorie', cat);
  const u   = getUser();
  const res = await fetch('api.php?action=signaler', { method: 'POST', headers: { 'X-User-Id': u.id || '' }, body: fd });
  const data = await res.json();
  if (data.success) { sucEl.style.display = 'block'; resetSignalement(); loadRecentReports(); }
  else { errEl.textContent = data.error || 'Erreur'; errEl.style.display = 'block'; }
}

function resetSignalement() {
  document.getElementById('salle-select').value = '';
  document.getElementById('description').value  = '';
  document.getElementById('ai-category-display').style.display = 'none';
}

async function loadSignalerStats() {
  const data = await api('user_stats');
  const el   = document.getElementById('stats-container');
  if (!el || !data) return;
  el.innerHTML = `
    <div class="stat-row"><span>Ce mois</span><strong>${data.signalements_this_month}</strong></div>
    <div class="stat-row"><span>Taux résolution</span><strong>${data.resolution_rate}%</strong></div>
    <div class="stat-row"><span>Délai moyen</span><strong>${data.avg_resolution_time}</strong></div>`;
}

async function loadRecentReports() {
  const data = await api('mes_reclamations');
  const el   = document.getElementById('recent-reports');
  if (!el) return;
  if (!data || !data.length) { el.innerHTML = '<p style="color:var(--gray-text);font-size:.85rem;">Aucun signalement</p>'; return; }
  el.innerHTML = data.slice(0, 5).map(r => `
    <div class="report-item">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:.82rem;font-weight:600;">${r.nom_salle || '—'}</span>
        ${statutBadge(r.statut)}
      </div>
      <p style="font-size:.78rem;color:var(--gray-text);margin:4px 0 0;">${(r.description || '').slice(0, 60)}…</p>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════════
//  PAGE: TECH (technicien interventions)
// ══════════════════════════════════════════════════════════════
var allTasks = [];

async function initTech() {
  if (!document.getElementById('tasks-container')) return;
  if (!requireAuth()) return;
  buildNav();
  const data = await api('reclamations');
  allTasks   = Array.isArray(data) ? data : [];
  renderTasks();
}

function renderTasks() {
  const el = document.getElementById('tasks-container');
  if (!el) return;
  document.getElementById('count-assigned').textContent   = allTasks.length;
  document.getElementById('count-todo').textContent       = allTasks.filter(t => t.statut === 'en attente').length;
  document.getElementById('count-inprogress').textContent = allTasks.filter(t => t.statut === 'en cours').length;
  if (!allTasks.length) { el.innerHTML = '<p style="color:var(--gray-text);text-align:center;padding:24px;">Aucune tâche assignée</p>'; return; }
  el.innerHTML = allTasks.map(t => `
    <div class="task-card">
      <div class="task-header">
        <span class="task-room"><i class="fas fa-door-open"></i> ${t.nom_salle || '—'}</span>
        ${statutBadge(t.statut)}
      </div>
      <p class="task-desc">${t.description}</p>
      <div class="task-meta">${catBadge(t.categorie_ia)} &nbsp; ${fmtDate(t.date)}</div>
      <div class="task-actions">
        ${t.statut === 'en attente' ? `<button class="btn-primary-action" onclick="updateTask(${t.id_reclamation},'en cours')"><i class="fas fa-play"></i> Démarrer</button>` : ''}
        ${t.statut === 'en cours'   ? `<button class="btn-success-action" onclick="updateTask(${t.id_reclamation},'resolue')"><i class="fas fa-check"></i> Terminer</button>` : ''}
      </div>
    </div>`).join('');
}

async function updateTask(id, statut) {
  const data = await api('update_reclamation', { body: { id, statut } });
  if (data.success) {
    allTasks = allTasks.map(t => t.id_reclamation == id ? { ...t, statut } : t).filter(t => t.statut !== 'resolue');
    renderTasks();
  }
}

// ── Historique technicien ─────────────────────────────────────
var allHistory = [];

async function initHistory() {
  if (!document.getElementById('history-list')) return;
  if (!requireAuth()) return;
  buildNav();
  try {
    const res = await api('get_tech_history');
    if (res.success && res.data) {
      allHistory = res.data;
      filterHistory();
    } else {
      const list = document.getElementById('history-list');
      if (list) list.innerHTML = '<p style="padding:20px;text-align:center;">Aucun historique trouvé.</p>';
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function filterHistory() {
  const q   = (document.getElementById('search-hist')?.value || '').toLowerCase();
  const cat = document.getElementById('filter-categorie')?.value || '';
  const el  = document.getElementById('history-list');
  if (!el) return;
  const filtered = allHistory.filter(h =>
    (!q   || (h.nom_salle || '').toLowerCase().includes(q)) &&
    (!cat || h.categorie_ia === cat)
  );
  el.innerHTML = filtered.length
    ? filtered.map(h => `
        <div class="history-item">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${h.nom_salle || '—'}</strong> ${catBadge(h.categorie_ia)}
          </div>
          <p style="font-size:.84rem;color:var(--gray-text);margin:4px 0 0;">${h.description}</p>
          <small style="color:var(--gray-text);">${fmtDate(h.date)}</small>
        </div>`).join('')
    : '<p style="text-align:center;color:var(--gray-text);padding:24px;">Aucune intervention</p>';
}

// ══════════════════════════════════════════════════════════════
//  PAGE: ADMIN
// ══════════════════════════════════════════════════════════════
var allRec = [], allUsers = [], allStudents = [], allTechniciens = [];

async function initAdmin() {
  if (!document.getElementById('reclamations-table') && !document.querySelector('.admin-tabs')) return;
  if (!requireAuth()) return;
  buildNav();
  loadAdminStats();
  loadReclamations();
  loadTechniciens();

  setTimeout(() => {
    const hash = location.hash;
    if (hash === '#users') {
      const btn = document.querySelector('[onclick*="panel-users"]');
      if (btn && typeof switchAdminTab === 'function') {
        switchAdminTab('panel-users', btn);
        if (!window._usersLoaded) { initAdminUsers(); window._usersLoaded = true; }
      }
    } else if (hash === '#etudiants') {
      const btn = document.querySelector('[onclick*="panel-etudiants"]');
      if (btn && typeof switchAdminTab === 'function') {
        switchAdminTab('panel-etudiants', btn);
        if (!window._studentsLoaded) { initAdminStudents(); window._studentsLoaded = true; }
      }
    }
  }, 0);
}

async function loadAdminStats() {
  const data = await api('admin_stats');
  if (!data) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('stat-total-res',    data.total_reservations);
  set('stat-salles-dispo', data.salles_disponibles);
  set('stat-signalements', data.signalements_ouverts);
  set('stat-taux',         data.taux_occupation + '%');
}

async function loadReclamations() {
  const data = await api('all_reclamations');
  allRec = Array.isArray(data) ? data : [];
  filterReclamations();
}

function filterReclamations() {
  const statut = document.getElementById('filter-statut')?.value || '';
  const cat    = document.getElementById('filter-categorie')?.value || '';
  const q      = (document.getElementById('search-rec')?.value || '').toLowerCase();
  const tbody  = document.getElementById('reclamations-table');
  if (!tbody) return;
  const filtered = allRec.filter(r =>
    (!statut || r.statut === statut) &&
    (!cat    || r.categorie_ia === cat) &&
    (!q      || (r.description || '').toLowerCase().includes(q) || (r.nom_salle || '').toLowerCase().includes(q))
  );
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--gray-text);">Aucun signalement</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>#${r.id_reclamation}</td>
      <td>${r.nom_salle || '—'}</td>
      <td>${catBadge(r.categorie_ia)}</td>
      <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.description}</td>
      <td>${fmtDate(r.date)}</td>
      <td>${statutBadge(r.statut)}</td>
      <td>${r.tech_prenom ? r.tech_prenom + ' ' + r.tech_nom : '<span style="color:var(--gray-text);">—</span>'}</td>
      <td>
        <button class="btn-sm btn-blue" onclick="openAssignModal(${r.id_reclamation})"><i class="fas fa-user-cog"></i></button>
        ${r.statut !== 'resolue' ? `<button class="btn-sm btn-green" onclick="resolveRec(${r.id_reclamation})"><i class="fas fa-check"></i></button>` : ''}
      </td>
    </tr>`).join('');
}

async function resolveRec(id) {
  const data = await api('update_reclamation', { body: { id, statut: 'resolue' } });
  if (data.success) { allRec = allRec.map(r => r.id_reclamation == id ? { ...r, statut: 'resolue' } : r); filterReclamations(); }
}

async function loadTechniciens() {
  const data = await api('techniciens');
  allTechniciens = Array.isArray(data) ? data : [];
}

var _assignRecId = null;
function openAssignModal(id) {
  _assignRecId = id;
  const list = document.getElementById('techniciens-list');
  if (!list) return;
  list.innerHTML = allTechniciens.map(t => `
    <div class="tech-item" onclick="assignTech(${t.id_user})" style="cursor:pointer;padding:10px;border-radius:8px;border:1px solid var(--gray-border);margin-bottom:8px;display:flex;align-items:center;gap:10px;">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--blue-soft);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--blue-mid);">${t.prenom[0]}</div>
      <div><strong>${t.prenom} ${t.nom}</strong><br><small style="color:var(--gray-text);">${t.email}</small></div>
      ${t.disponible ? '<span class="badge badge-success" style="margin-left:auto;">Disponible</span>' : ''}
    </div>`).join('');
  document.getElementById('assign-modal').style.display = 'flex';
}

function closeAssignModal() {
  document.getElementById('assign-modal').style.display = 'none';
}

async function assignTech(techId) {
  const data = await api('assigner', { body: { id_reclamation: _assignRecId, id_technicien: techId } });
  closeAssignModal();
  if (data.success) loadReclamations();
  else alert(data.error || 'Erreur');
}

// ── Admin: Utilisateurs ───────────────────────────────────────
async function initAdminUsers() {
  if (!document.getElementById('users-tbody')) return;
  if (!requireAuth()) return;
  buildNav();
  const data = await api('utilisateurs');
  allUsers = Array.isArray(data) ? data : [];
  updateUserStats();
  filterUsers();
}

function updateUserStats() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('total-users',    allUsers.length);
  set('count-students', allUsers.filter(u => u.role === 'etudiant').length);
  set('count-profs',    allUsers.filter(u => u.role === 'prof').length);
  set('count-tech',     allUsers.filter(u => u.role === 'technicien').length);
}

function filterUsers() {
  const q     = (document.getElementById('search-user')?.value || '').toLowerCase();
  const role  = document.getElementById('filter-role')?.value || '';
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  const filtered = allUsers.filter(u =>
    (!q    || (u.nom || '').toLowerCase().includes(q) || (u.prenom || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) &&
    (!role || u.role === role)
  );
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray-text);">Aucun utilisateur trouvé</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(u => {
    const detail  = u.role === 'etudiant' ? u.etudiant_classe || u.niveau : u.role === 'prof' ? u.grade : u.domaine;
    const contact = u.etudiant_tel || u.prof_tel || u.tech_tel || u.etudiant_id_national || '—';
    return `<tr>
      <td>${u.nom}</td><td>${u.prenom}</td><td>${u.email}</td>
      <td><span class="badge badge-${u.role === 'admin' ? 'danger' : u.role === 'technicien' ? 'info' : u.role === 'prof' ? 'warning' : 'success'}">${u.role}</span></td>
      <td>${detail || '—'}</td><td>${contact}</td>
      <td>
        <button class="btn-sm btn-blue" onclick="editUser(${u.id_user})"><i class="fas fa-edit"></i></button>
        <button class="btn-sm btn-red"  onclick="deleteUser(${u.id_user})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

async function deleteUser(id) {
  showConfirm('Supprimer définitivement cet utilisateur ?', async () => {
    const data = await api('delete_user', { body: { id } });
    if (data.success) { allUsers = allUsers.filter(u => u.id_user != id); updateUserStats(); filterUsers(); }
    else showAlert(data.error || 'Erreur lors de la suppression.');
  });
}

function editUser(id) {
  alert("Modification de l'utilisateur #" + id + ' (à implémenter)');
}

// ── Admin: Étudiants ──────────────────────────────────────────
async function initAdminStudents() {
  if (!document.getElementById('students-grid')) return;
  if (!requireAuth()) return;
  buildNav();
  const data  = await api('etudiants');
  allStudents = Array.isArray(data) ? data : [];
  updateStudentStats();
  filterStudents();
}

function updateStudentStats() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('total-etudiants', allStudents.length);
  set('count-l2',     allStudents.filter(s => (s.niveau || '').startsWith('L2')).length);
  set('count-l3',     allStudents.filter(s => (s.niveau || '').startsWith('L3')).length);
  set('count-master', allStudents.filter(s => (s.niveau || '').startsWith('M')).length);
}

function filterStudents() {
  const q      = (document.getElementById('search-etudiant')?.value || '').toLowerCase();
  const niveau = document.getElementById('filter-niveau')?.value || '';
  const td     = document.getElementById('filter-td')?.value || '';
  const grid   = document.getElementById('students-grid');
  if (!grid) return;
  const filtered = allStudents.filter(s =>
    (!q      || (s.nom || '').toLowerCase().includes(q) || (s.prenom || '').toLowerCase().includes(q)) &&
    (!niveau || (s.niveau || '').startsWith(niveau)) &&
    (!td     || s.td === td)
  );
  grid.innerHTML = filtered.map(s => `
    <div class="student-card">
      <div class="student-avatar">${(s.prenom || '?')[0]}${(s.nom || '?')[0]}</div>
      <div class="student-info">
        <h4>${s.prenom} ${s.nom}</h4>
        <p>${s.email}</p>
        <div style="margin-top:6px;">
          ${s.niveau  ? `<span class="badge badge-info">${s.niveau}</span>` : ''}
          ${s.td      ? `<span class="badge badge-secondary">${s.td}</span>` : ''}
          ${s.section ? `<span class="badge badge-secondary">${s.section}</span>` : ''}
        </div>
      </div>
    </div>`).join('') || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-text);">Aucun étudiant trouvé</div>';
}

// ══════════════════════════════════════════════════════════════
//  PAGE: STATISTIQUES
// ══════════════════════════════════════════════════════════════
async function initStatistiques() {
  if (!document.getElementById('stats-grid')) return;
  if (!requireAuth()) return;
  buildNav();

  const [data, occupationData, salleStats] = await Promise.all([
    api('statistiques'),
    api('statistiques_occupation'),
    api('statistiques_par_salle')
  ]);
  if (!data) return;

  // Stat cards
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = `
    <div class="stat-card ghost">
      <div class="stat-info"><h3>Ghost Bookings</h3><div class="stat-value">${data.ghostBookings}</div><div class="stat-sub">Réservations non honorées</div></div>
      <div class="stat-icon red"><i class="fas fa-ghost"></i></div>
    </div>
    <div class="stat-card occupation">
      <div class="stat-info"><h3>Taux d'occupation</h3><div class="stat-value">${data.occupationRate}%</div><div class="stat-sub">Aujourd'hui</div></div>
      <div class="stat-icon blue"><i class="fas fa-chart-pie"></i></div>
    </div>
    <div class="stat-card signalement">
      <div class="stat-info"><h3>Signalements actifs</h3><div class="stat-value">${data.activeSignalements}</div><div class="stat-sub">En attente + En cours</div></div>
      <div class="stat-icon orange"><i class="fas fa-exclamation-triangle"></i></div>
    </div>
    <div class="stat-card prediction">
      <div class="stat-info"><h3>Prédictions IA</h3><div class="stat-value">${data.signalementStats.length || 0}</div><div class="stat-sub">Catégories détectées</div></div>
      <div class="stat-icon purple"><i class="fas fa-brain"></i></div>
    </div>`;

  // Occupation chart
  const occ      = document.getElementById('occupation-chart');
  const dayNames = { Mon: 'Lun', Tue: 'Mar', Wed: 'Mer', Thu: 'Jeu', Fri: 'Ven', Sat: 'Sam', Sun: 'Dim' };
  if (occupationData && Array.isArray(occupationData)) {
    const maxRes = Math.max(...occupationData.map(d => d.reservations), 1);
    occ.innerHTML = `
      <h3 style="margin:0 0 20px;font-size:1.1rem;font-weight:700;">
        <i class="fas fa-chart-bar" style="color:var(--blue-mid);margin-right:8px;"></i>
        Taux d'occupation des salles (7 derniers jours)
      </h3>
      <div style="display:flex;align-items:flex-end;gap:10px;height:180px;padding:0 12px;margin-bottom:8px;">
        ${occupationData.map((d, i) => {
          const height  = Math.max(8, Math.round((d.reservations / maxRes) * 100));
          const isToday = i === 6;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
            <div style="font-size:.75rem;font-weight:600;color:${isToday ? 'var(--blue-mid)' : 'var(--gray-text)'};">${d.reservations}</div>
            <div style="width:100%;height:${height}%;background:${isToday ? 'linear-gradient(180deg,var(--blue-mid),var(--red-orange))' : 'var(--blue-mid)'};border-radius:8px 8px 0 0;position:relative;transition:height 0.5s ease;" title="${d.full_day}: ${d.reservations} réservations">
              ${isToday ? '<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:var(--orange);border-radius:50%;"></div>' : ''}
            </div>
            <div style="font-size:.72rem;color:${isToday ? 'var(--blue-mid)' : 'var(--gray-text)'};font-weight:${isToday ? '600' : '400'};">${dayNames[d.day] || d.day}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--gray-bg);border-radius:12px;margin-top:12px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:.85rem;color:var(--gray-text);">
          <i class="fas fa-info-circle"></i>
          <span>Total: ${occupationData.reduce((a, b) => a + b.reservations, 0)} réservations cette semaine</span>
        </div>
        <div style="font-size:.85rem;font-weight:600;color:var(--blue-mid);">
          +${occupationData[5].reservations > 0 ? Math.round(((occupationData[6].reservations - occupationData[5].reservations) / occupationData[5].reservations) * 100) : 0}% vs hier
        </div>
      </div>`;
  }

  // Signalements chart
  const sigGrid  = document.getElementById('signalements-grid');
  const totalSig = data.signalementStats.reduce((a, s) => a + parseInt(s.count), 0) || 1;
  const catColors = {
    IT_RESEAU:        { bg: '#dbeafe', fill: '#3b82f6', icon: 'fa-wifi' },
    MAINTENANCE_CLIM: { bg: '#cffafe', fill: '#06b6d4', icon: 'fa-snowflake' },
    PROJECTEUR:       { bg: '#ede9fe', fill: '#7c3aed', icon: 'fa-video' },
    ELECTRIQUE:       { bg: '#fef3c7', fill: '#d97706', icon: 'fa-bolt' },
    AUTRE:            { bg: '#f3f4f6', fill: '#6b7280', icon: 'fa-tools' }
  };
  sigGrid.innerHTML = `
    <div class="chart-card" style="grid-column:1 / -1;">
      <h3 style="margin:0 0 20px;font-size:1.1rem;font-weight:700;">
        <i class="fas fa-chart-pie" style="color:var(--orange);margin-right:8px;"></i>
        Répartition des signalements par catégorie
      </h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
        ${data.signalementStats.map(s => {
          const pct    = Math.round(s.count / totalSig * 100);
          const colors = catColors[s.type] || catColors['AUTRE'];
          return `<div style="background:${colors.bg};border-radius:12px;padding:16px;border-left:4px solid ${colors.fill};">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <div style="width:36px;height:36px;border-radius:10px;background:${colors.fill};display:flex;align-items:center;justify-content:center;color:white;font-size:1rem;">
                <i class="fas ${colors.icon}"></i>
              </div>
              <div>
                <div style="font-size:.85rem;font-weight:600;color:var(--text-dark);">${CAT_LABEL[s.type] || s.type}</div>
                <div style="font-size:.75rem;color:var(--gray-text);">${s.count} signalements</div>
              </div>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.5);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${colors.fill};border-radius:3px;transition:width 0.5s ease;"></div>
            </div>
            <div style="text-align:right;font-size:.75rem;font-weight:600;color:${colors.fill};margin-top:6px;">${pct}%</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  // Peak hours chart
  const heures  = document.getElementById('heures-chart');
  const maxHour = Math.max(...data.peakHours.map(x => x.count), 1);
  heures.innerHTML = `
    <h3 style="margin:0 0 20px;font-size:1.1rem;font-weight:700;">
      <i class="fas fa-clock" style="color:var(--green);margin-right:8px;"></i>
      Heures de pointe (Réservations par heure)
    </h3>
    <div style="display:flex;align-items:flex-end;gap:3px;height:140px;padding:0 8px 20px 8px;position:relative;">
      <div style="position:absolute;left:0;right:0;top:0;bottom:20px;pointer-events:none;">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;background:var(--gray-border);"></div>
        <div style="position:absolute;top:33%;left:0;right:0;height:1px;border-top:1px dashed var(--gray-border);"></div>
        <div style="position:absolute;top:66%;left:0;right:0;height:1px;border-top:1px dashed var(--gray-border);"></div>
      </div>
      ${data.peakHours.map(h => {
        const pct    = Math.min(100, Math.round((h.count / maxHour) * 100));
        const isPeak = pct > 70;
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;z-index:1;">
          <div style="font-size:.65rem;font-weight:600;color:${isPeak ? 'var(--orange)' : 'var(--gray-text)'};opacity:${pct > 0 ? 1 : 0};">${h.count > 0 ? h.count : ''}</div>
          <div style="width:100%;height:${Math.max(4, pct)}%;background:${isPeak ? 'linear-gradient(180deg,var(--orange),var(--red-orange))' : 'var(--blue-mid)'};border-radius:4px 4px 0 0;min-height:4px;transition:height 0.5s ease;" title="${h.hour}h: ${h.count} réservations"></div>
          <div style="font-size:.65rem;color:var(--gray-text);font-weight:${isPeak ? '600' : '400'};">${h.hour}h</div>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:12px 16px;background:var(--gray-bg);border-radius:12px;">
      <div style="font-size:.8rem;color:var(--gray-text);">
        <i class="fas fa-fire" style="color:var(--orange);margin-right:6px;"></i>
        Heure la plus demandée: <strong style="color:var(--text-dark);">${data.peakHours.reduce((a, b) => a.count > b.count ? a : b).hour}h</strong>
      </div>
      <div style="font-size:.8rem;color:var(--gray-text);">
        Moyenne: <strong style="color:var(--text-dark);">${Math.round(data.peakHours.reduce((a, b) => a + b.count, 0) / data.peakHours.length)} réservations/heure</strong>
      </div>
    </div>`;

  // Room type occupancy
  if (salleStats && Array.isArray(salleStats)) {
    const salleChart = document.createElement('div');
    salleChart.className = 'chart-card full-width';
    salleChart.style.marginTop = '20px';
    const typeLabels = { cours: 'Salle de cours', tp: 'Laboratoire/TP', amphi: 'Amphithéâtre' };
    const typeIcons  = { cours: 'fa-chalkboard', tp: 'fa-flask', amphi: 'fa-university' };
    const typeColorsMap = {
      cours: { bg: '#dbeafe', fill: '#3b82f6' },
      tp:    { bg: '#dcfce7', fill: '#22c55e' },
      amphi: { bg: '#fef3c7', fill: '#d97706' }
    };
    salleChart.innerHTML = `
      <h3 style="margin:0 0 20px;font-size:1.1rem;font-weight:700;">
        <i class="fas fa-door-open" style="color:var(--purple);margin-right:8px;"></i>
        Occupation par type de salle (Aujourd'hui)
      </h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;">
        ${salleStats.map(s => {
          const c = typeColorsMap[s.type] || typeColorsMap.cours;
          return `<div style="background:white;border-radius:16px;padding:20px;border:1px solid var(--gray-border);box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
              <div style="width:48px;height:48px;border-radius:12px;background:${c.bg};display:flex;align-items:center;justify-content:center;color:${c.fill};font-size:1.3rem;">
                <i class="fas ${typeIcons[s.type] || 'fa-door-open'}"></i>
              </div>
              <div>
                <div style="font-size:1rem;font-weight:700;color:var(--text-dark);">${typeLabels[s.type] || s.type}</div>
                <div style="font-size:.8rem;color:var(--gray-text);">${s.total} salles au total</div>
              </div>
            </div>
            <div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:6px;">
                <span style="color:var(--gray-text);">Taux d'occupation</span>
                <span style="font-weight:700;color:${s.occupancy_rate > 80 ? 'var(--red)' : s.occupancy_rate > 50 ? 'var(--orange)' : 'var(--green)'};">${s.occupancy_rate}%</span>
              </div>
              <div style="height:10px;background:var(--gray-bg);border-radius:5px;overflow:hidden;">
                <div style="height:100%;width:${s.occupancy_rate}%;background:${s.occupancy_rate > 80 ? 'linear-gradient(90deg,var(--red),var(--red-orange))' : s.occupancy_rate > 50 ? 'linear-gradient(90deg,var(--orange),var(--yellow))' : 'linear-gradient(90deg,var(--green),var(--green-dark))'};border-radius:5px;transition:width 0.5s ease;"></div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--gray-text);">
              <span><i class="fas fa-calendar-check" style="margin-right:4px;"></i>${s.reservations_today} réservations</span>
              <span>${s.total - s.reservations_today} disponibles</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    const occupationTab = document.getElementById('occupation');
    if (occupationTab) occupationTab.appendChild(salleChart);
  }
}

function switchTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

// ══════════════════════════════════════════════════════════════
//  NAVBAR INIT (runs on every dashboard page)
// ══════════════════════════════════════════════════════════════
async function initNavbar() {
  if (!sessionStorage.getItem('user_id')) {
    const publicPages = ['login.html', 'si.html', 'acceuil.html', ''];
    const currentPage = window.location.pathname.split('/').pop();
    if (!publicPages.includes(currentPage)) { window.location.href = 'login.html'; return; }
  }

  buildNav();
  await updateNotificationBadge();

  const notifBtn  = document.querySelector('.notification-btn');
  const profileBtn = document.querySelector('.profile-btn');

  if (notifBtn)   notifBtn.addEventListener('click', toggleNotificationPanel);
  if (profileBtn) profileBtn.addEventListener('click', toggleProfileDropdown);

  document.addEventListener('click', function(e) {
    const notifPanel      = document.getElementById('notification-panel');
    const profileDropdown = document.getElementById('profile-dropdown');
    const nBtn = document.querySelector('.notification-btn');
    const pBtn = document.querySelector('.profile-btn');
    if (notifPanel      && notifPanel.contains(e.target))      return;
    if (profileDropdown && profileDropdown.contains(e.target)) return;
    if (nBtn && nBtn.contains(e.target)) return;
    if (pBtn && pBtn.contains(e.target)) return;
    closeAllDropdowns();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeAllDropdowns(); closeProfileModal(); }
  });

  // Auto-refresh badge every 30 seconds
  setInterval(updateNotificationBadge, 30000);
}

// ══════════════════════════════════════════════════════════════
//  AUTO-INIT: detect page and run its initializer
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.split('/').pop();

  if (path === 'login.html' || path === '') { initLoginPage(); return; }
  if (path === 'si.html')                   { return; } // register handled via onclick

  // All authenticated pages: run navbar init first, then page init
  initNavbar().then(() => {
    if (path === 'dashboard.html' || path === 'disponibilite.html') { initDashboard(); return; }
    if (path === 'mes_reservations.html')    { initMesReservations(); return; }
    if (path === 'signaler.html')            { initSignaler();        return; }
    if (path === 'tech.html')                { initTech();            return; }
    if (path === 'his.html')                 { initHistory();         return; }
    if (path === 'admin.html')               { initAdmin();           return; }
    // admin hash-based tabs (utilisateurs, etudiants, news) are handled by initAdmin() + handleHashChange
    if (path === 'statistiques.html')        { initStatistiques();    return; }
  });
});