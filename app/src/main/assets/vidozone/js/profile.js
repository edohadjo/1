/**
 * ==========================================================================
 * VIDOZONE - GESTION DU PROFIL UTILISATEUR (PROFILE.JS)
 * Affichage des statistiques, onglets Vidéos/Shorts/Likes, modification du profil
 * ==========================================================================
 */

const VZ_Profile = (() => {
  const { KEYS, showToast, formatViews, escapeHTML } = VidoZone;

  let activeTab = "videos";
  let currentUser = null;

  const loadUserData = () => {
    currentUser = VZ_Auth.getCurrentUser();
    if (!currentUser) {
      // Profil de secours si navigation directe sans être logué
      currentUser = {
        uid: "user_demo",
        name: "Créateur VidoZone",
        username: "vidozone_creator",
        email: "creator@vidozone.com",
        photoURL: "assets/logo.png",
        bio: "Regarde. Crée. Partage. Bienvenue sur ma chaîne officielle VidoZone !",
        subscribersCount: 1420,
        followingCount: 38,
        createdAt: Date.now()
      };
    }

    // Mise à jour de l'affichage
    const nameEl = document.getElementById("vzProfileName");
    const handleEl = document.getElementById("vzProfileHandle");
    const bioEl = document.getElementById("vzProfileBio");
    const avatarEl = document.getElementById("vzProfileAvatar");
    const subsEl = document.getElementById("vzProfileSubs");
    const followEl = document.getElementById("vzProfileFollow");
    const countVideosEl = document.getElementById("vzProfileVideosCount");
    const likesCountEl = document.getElementById("vzProfileLikesCount");

    if (nameEl) nameEl.innerText = currentUser.name;
    if (handleEl) handleEl.innerText = `@${currentUser.username || 'creator'}`;
    if (bioEl) bioEl.innerText = currentUser.bio || "Aucune biographie renseignée.";
    if (avatarEl) avatarEl.src = currentUser.photoURL || "assets/logo.png";
    if (subsEl) subsEl.innerText = (currentUser.subscribersCount || 0).toLocaleString();
    if (followEl) followEl.innerText = (currentUser.followingCount || 0).toLocaleString();

    // Calcul du nombre de vidéos
    const allVideos = JSON.parse(localStorage.getItem(KEYS.VIDEOS) || "[]");
    const userVideos = allVideos.filter(v => v.creatorId === currentUser.uid || v.creatorName === currentUser.name);
    if (countVideosEl) countVideosEl.innerText = userVideos.length;

    // Calcul du total des likes reçus
    const totalLikes = userVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
    if (likesCountEl) likesCountEl.innerText = (totalLikes || 124).toLocaleString();

    renderTabContent();
  };

  // Rendu selon l'onglet actif
  const renderTabContent = () => {
    const grid = document.getElementById("vzProfileGrid");
    if (!grid) return;

    const allVideos = JSON.parse(localStorage.getItem(KEYS.VIDEOS) || "[]");
    const userVideos = allVideos.filter(v => v.creatorId === currentUser.uid || v.creatorName === currentUser.name);

    if (activeTab === "videos") {
      grid.className = "vz-profile-grid";
      if (userVideos.length === 0) {
        grid.innerHTML = `
          <div class="vz-empty-state" style="grid-column: 1 / -1;">
            <div class="vz-empty-title">Aucune vidéo publiée</div>
            <div class="vz-empty-desc">Partagez votre première création avec la communauté !</div>
            <a href="upload.html" class="vz-btn vz-btn-primary vz-btn-sm" style="margin-top:10px;">Publier maintenant</a>
          </div>
        `;
        return;
      }

      grid.innerHTML = userVideos.map(video => `
        <div class="vz-video-card" onclick="window.location.href='player.html?id=${video.id}'">
          <div class="vz-thumb-container">
            <img class="vz-thumb-img" src="${video.thumbnailURL || 'assets/images/thumb_music.jpg'}" alt="${escapeHTML(video.title)}">
            <span class="vz-duration-badge">${video.duration || '03:00'}</span>
          </div>
          <div style="padding:10px;">
            <h4 style="font-size:13px;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHTML(video.title)}</h4>
            <div style="font-size:11px;color:var(--vz-text-muted);margin-top:4px;">${formatViews(video.views)}</div>
          </div>
        </div>
      `).join("");
    } else if (activeTab === "shorts") {
      grid.className = "vz-profile-grid shorts-mode";
      const shorts = JSON.parse(localStorage.getItem(KEYS.SHORTS) || "[]");
      grid.innerHTML = shorts.map(short => `
        <div class="vz-short-card-compact" style="width:100%;" onclick="window.location.href='shorts.html?id=${short.id}'">
          <img src="${short.thumbnailURL || 'assets/images/thumb_gaming.jpg'}" alt="${escapeHTML(short.title)}">
          <div class="vz-short-compact-overlay">
            <div class="vz-short-compact-title">${escapeHTML(short.title)}</div>
          </div>
        </div>
      `).join("");
    } else if (activeTab === "likes") {
      grid.className = "vz-profile-grid";
      grid.innerHTML = allVideos.slice(0, 2).map(video => `
        <div class="vz-video-card" onclick="window.location.href='player.html?id=${video.id}'">
          <div class="vz-thumb-container">
            <img class="vz-thumb-img" src="${video.thumbnailURL || 'assets/images/thumb_music.jpg'}" alt="${escapeHTML(video.title)}">
            <span class="vz-duration-badge">${video.duration || '03:15'}</span>
          </div>
          <div style="padding:10px;">
            <h4 style="font-size:13px;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHTML(video.title)}</h4>
            <div style="font-size:11px;color:var(--vz-text-muted);margin-top:4px;">Aimé récemment</div>
          </div>
        </div>
      `).join("");
    }
  };

  // Modal de modification du profil
  const openEditModal = () => {
    const modal = document.getElementById("vzEditProfileModal");
    if (!modal) return;

    const nameInput = document.getElementById("vzEditName");
    const userInput = document.getElementById("vzEditUsername");
    const bioInput = document.getElementById("vzEditBio");
    const avatarPreview = document.getElementById("vzEditAvatarPreview");

    if (nameInput) nameInput.value = currentUser.name || "";
    if (userInput) userInput.value = currentUser.username || "";
    if (bioInput) bioInput.value = currentUser.bio || "";
    if (avatarPreview) avatarPreview.src = currentUser.photoURL || "assets/logo.png";

    modal.classList.add("active");
  };

  const closeEditModal = () => {
    const modal = document.getElementById("vzEditProfileModal");
    if (modal) modal.classList.remove("active");
  };

  const saveProfileChanges = () => {
    const name = document.getElementById("vzEditName").value;
    const username = document.getElementById("vzEditUsername").value;
    const bio = document.getElementById("vzEditBio").value;

    try {
      VZ_Auth.updateProfile({ name, username, bio });
      closeEditModal();
      loadUserData();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const init = () => {
    loadUserData();

    // Onglets
    document.querySelectorAll(".vz-profile-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".vz-profile-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeTab = btn.getAttribute("data-tab");
        renderTabContent();
      });
    });

    const editBtn = document.getElementById("vzOpenEditProfileBtn");
    if (editBtn) editBtn.addEventListener("click", openEditModal);

    const saveBtn = document.getElementById("vzSaveProfileBtn");
    if (saveBtn) saveBtn.addEventListener("click", saveProfileChanges);

    const cancelBtn = document.getElementById("vzCancelProfileBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", closeEditModal);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    openEditModal,
    closeEditModal,
    saveProfileChanges
  };
})();
