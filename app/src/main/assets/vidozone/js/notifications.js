/**
 * ==========================================================================
 * VIDOZONE - NOTIFICATIONS (NOTIFICATIONS.JS)
 * Flux des notifications, statut lu/non-lu, filtres et interactions
 * ==========================================================================
 */

const VZ_Notifications = (() => {
  const { KEYS, formatTimeAgo, escapeHTML, showToast } = VidoZone;

  const getNotifications = () => {
    try {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const saveNotifications = (notifs) => {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  };

  const getIconForType = (type) => {
    switch (type) {
      case "like":
        return `<div style="background:rgba(255,23,68,0.15);color:var(--vz-primary);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><svg style="width:20px;height:20px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></div>`;
      case "subscribe":
        return `<div style="background:rgba(0,230,118,0.15);color:var(--vz-success);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><svg style="width:20px;height:20px;fill:currentColor;" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>`;
      case "comment":
        return `<div style="background:rgba(224,64,251,0.15);color:#e040fb;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><svg style="width:20px;height:20px;fill:currentColor;" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg></div>`;
      default:
        return `<div style="background:var(--vz-surface-hover);color:var(--vz-text-primary);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><svg style="width:20px;height:20px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg></div>`;
    }
  };

  const renderNotifications = () => {
    const listEl = document.getElementById("vzNotifsList");
    if (!listEl) return;

    const notifs = getNotifications();
    if (notifs.length === 0) {
      listEl.innerHTML = `
        <div class="vz-empty-state">
          <div class="vz-empty-icon">
            <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          </div>
          <div class="vz-empty-title">Aucune notification</div>
          <div class="vz-empty-desc">Vous êtes à jour ! Vos interactions récentes apparaîtront ici.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = notifs.map(n => `
      <div class="vz-notif-item ${n.read ? 'read' : 'unread'}" style="display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--vz-border-light);background:${n.read ? 'transparent' : 'var(--vz-surface)'};cursor:pointer;" onclick="VZ_Notifications.markAsRead('${n.id}')">
        ${getIconForType(n.type)}
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
            <strong style="font-size:14px;color:var(--vz-text-primary);">${escapeHTML(n.title)}</strong>
            <span style="font-size:11px;color:var(--vz-text-muted);">${formatTimeAgo(n.createdAt)}</span>
          </div>
          <p style="font-size:13px;color:var(--vz-text-secondary);line-height:1.4;">${escapeHTML(n.message)}</p>
        </div>
        ${!n.read ? `<span style="width:8px;height:8px;background:var(--vz-primary);border-radius:50%;margin-top:6px;flex-shrink:0;"></span>` : ''}
      </div>
    `).join("");
  };

  const markAllAsRead = () => {
    const notifs = getNotifications();
    notifs.forEach(n => n.read = true);
    saveNotifications(notifs);
    renderNotifications();
    showToast("Toutes les notifications sont marquées comme lues.", "info");
  };

  const markAsRead = (id) => {
    const notifs = getNotifications();
    const target = notifs.find(n => n.id === id);
    if (target) {
      target.read = true;
      saveNotifications(notifs);
      renderNotifications();
    }
  };

  const init = () => {
    const markAllBtn = document.getElementById("vzMarkAllReadBtn");
    if (markAllBtn) markAllBtn.addEventListener("click", markAllAsRead);
    renderNotifications();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    markAllAsRead,
    markAsRead
  };
})();
