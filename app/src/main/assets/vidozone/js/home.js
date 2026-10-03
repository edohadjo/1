/**
 * ==========================================================================
 * VIDOZONE - ACCUEIL & GESTION DU FLUX (HOME.JS)
 * Filtrage par catégorie, rendu des flux vidéo, carrousel Shorts
 * ==========================================================================
 */

const VZ_Home = (() => {
  const { KEYS, formatViews, formatTimeAgo, escapeHTML } = VidoZone;

  let activeCategory = "Tous";

  // Récupération des vidéos
  const getVideos = () => {
    try {
      const data = localStorage.getItem(KEYS.VIDEOS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  // Récupération des Shorts
  const getShorts = () => {
    try {
      const data = localStorage.getItem(KEYS.SHORTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  // Rendu des catégories
  const renderCategories = () => {
    const container = document.getElementById("vzCategoriesBar");
    if (!container) return;

    const categories = [
      "Tous", "Musique", "Gaming", "Comédie", "Sport", 
      "Actualités", "Éducation", "Technologie", "Afrique"
    ];

    container.innerHTML = categories.map(cat => `
      <button class="vz-cat-pill ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">
        ${cat}
      </button>
    `).join("");

    container.querySelectorAll(".vz-cat-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCategory = btn.getAttribute("data-cat");
        container.querySelectorAll(".vz-cat-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderFeed();
      });
    });
  };

  // Rendu du carrousel de Shorts rapides sur l'accueil
  const renderShortsPreview = () => {
    const container = document.getElementById("vzShortsPreviewList");
    if (!container) return;

    const shorts = getShorts();
    if (!shorts || shorts.length === 0) {
      container.parentElement.style.display = "none";
      return;
    }

    container.innerHTML = shorts.map(short => `
      <div class="vz-short-card-compact" onclick="window.location.href='shorts.html?id=${short.id}'">
        <img src="${short.thumbnailURL || 'assets/images/thumb_gaming.jpg'}" alt="${escapeHTML(short.title)}" loading="lazy">
        <div class="vz-short-compact-overlay">
          <div class="vz-short-compact-title">${escapeHTML(short.title)}</div>
          <div class="vz-short-compact-views">${(short.likes || 0).toLocaleString()} J'aime</div>
        </div>
      </div>
    `).join("");
  };

  // Rendu du flux de vidéos
  const renderFeed = () => {
    const feed = document.getElementById("vzVideoFeed");
    if (!feed) return;

    const allVideos = getVideos();
    const filtered = activeCategory === "Tous" 
      ? allVideos 
      : allVideos.filter(v => v.category === activeCategory || (v.tags && v.tags.includes(activeCategory)));

    if (filtered.length === 0) {
      feed.innerHTML = `
        <div class="vz-empty-state">
          <div class="vz-empty-icon">
            <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
          </div>
          <div class="vz-empty-title">Aucune vidéo trouvée</div>
          <div class="vz-empty-desc">Il n'y a pas encore de vidéos dans la catégorie "${activeCategory}". Sois le premier à en publier une !</div>
          <a href="upload.html" class="vz-btn vz-btn-primary vz-btn-sm" style="margin-top:12px;">Publier une vidéo</a>
        </div>
      `;
      return;
    }

    feed.innerHTML = filtered.map(video => `
      <article class="vz-video-card" onclick="window.location.href='player.html?id=${video.id}'">
        <div class="vz-thumb-container">
          <img class="vz-thumb-img" src="${video.thumbnailURL || 'assets/images/thumb_music.jpg'}" alt="${escapeHTML(video.title)}" loading="lazy">
          <span class="vz-duration-badge">${video.duration || '03:45'}</span>
          <span class="vz-category-tag">${video.category || 'VidoZone'}</span>
        </div>
        <div class="vz-video-details">
          <div class="vz-creator-avatar">
            <img src="${video.creatorAvatar || 'assets/logo.png'}" alt="${escapeHTML(video.creatorName)}">
          </div>
          <div class="vz-video-meta">
            <h3 class="vz-video-title">${escapeHTML(video.title)}</h3>
            <div class="vz-creator-name">
              <span>${escapeHTML(video.creatorName)}</span>
              <svg class="vz-verified-badge" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div class="vz-video-stats">
              <span>${formatViews(video.views)}</span>
              <span class="vz-stat-dot"></span>
              <span>${formatTimeAgo(video.createdAt)}</span>
            </div>
          </div>
        </div>
      </article>
    `).join("");
  };

  // Initialisation au chargement
  const init = () => {
    // Vérifier avatar dans le header
    const user = VZ_Auth.getCurrentUser();
    const avatarImg = document.getElementById("vzHeaderAvatarImg");
    if (avatarImg && user && user.photoURL) {
      avatarImg.src = user.photoURL;
    }

    renderCategories();
    renderShortsPreview();
    renderFeed();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    renderFeed
  };
})();
