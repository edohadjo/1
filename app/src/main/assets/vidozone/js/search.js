/**
 * ==========================================================================
 * VIDOZONE - RECHERCHE INSTANTANÉE (SEARCH.JS)
 * Recherche en direct sur vidéos, créateurs et catégories, avec historique
 * ==========================================================================
 */

const VZ_Search = (() => {
  const { KEYS, formatViews, formatTimeAgo, escapeHTML } = VidoZone;

  let searchTimeout = null;

  const getHistory = () => {
    try {
      const data = localStorage.getItem(KEYS.HISTORY);
      return data ? JSON.parse(data) : ["Afrobeats", "Gaming", "Tech", "Comédie"];
    } catch (e) {
      return [];
    }
  };

  const saveHistory = (items) => {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(items));
  };

  const addHistoryItem = (query) => {
    if (!query) return;
    let list = getHistory().filter(item => item.toLowerCase() !== query.toLowerCase());
    list.unshift(query);
    if (list.length > 8) list = list.slice(0, 8);
    saveHistory(list);
    renderHistoryChips();
  };

  const clearHistory = () => {
    saveHistory([]);
    renderHistoryChips();
  };

  const renderHistoryChips = () => {
    const container = document.getElementById("vzSearchChipsList");
    if (!container) return;

    const list = getHistory();
    if (list.length === 0) {
      container.innerHTML = `<span style="font-size:12px;color:var(--vz-text-muted);">Aucun historique récent.</span>`;
      return;
    }

    container.innerHTML = list.map(q => `
      <div class="vz-search-chip" onclick="VZ_Search.applyQuery('${escapeHTML(q)}')">
        <svg style="width:12px;height:12px;fill:currentColor;" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
        <span>${escapeHTML(q)}</span>
      </div>
    `).join("");
  };

  const applyQuery = (q) => {
    const input = document.getElementById("vzSearchInput");
    if (input) {
      input.value = q;
      performSearch(q);
    }
  };

  const performSearch = (query) => {
    const trimmed = query.trim().toLowerCase();
    const resultsContainer = document.getElementById("vzSearchResultsFeed");
    const historySection = document.getElementById("vzSearchHistorySection");
    if (!resultsContainer) return;

    if (!trimmed) {
      resultsContainer.innerHTML = "";
      if (historySection) historySection.style.display = "block";
      return;
    }

    if (historySection) historySection.style.display = "none";

    const allVideos = JSON.parse(localStorage.getItem(KEYS.VIDEOS) || "[]");
    const matches = allVideos.filter(v => 
      (v.title && v.title.toLowerCase().includes(trimmed)) ||
      (v.creatorName && v.creatorName.toLowerCase().includes(trimmed)) ||
      (v.category && v.category.toLowerCase().includes(trimmed)) ||
      (v.tags && v.tags.some(t => t.toLowerCase().includes(trimmed)))
    );

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div class="vz-empty-state">
          <div class="vz-empty-icon">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </div>
          <div class="vz-empty-title">Aucun résultat pour "${escapeHTML(query)}"</div>
          <div class="vz-empty-desc">Essaie avec d'autres mots-clés ou vérifie l'orthographe.</div>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = matches.map(video => `
      <article class="vz-video-card" onclick="window.location.href='player.html?id=${video.id}'">
        <div class="vz-thumb-container">
          <img class="vz-thumb-img" src="${video.thumbnailURL || 'assets/images/thumb_music.jpg'}" alt="${escapeHTML(video.title)}">
          <span class="vz-duration-badge">${video.duration || '03:45'}</span>
        </div>
        <div class="vz-video-details">
          <div class="vz-creator-avatar">
            <img src="${video.creatorAvatar || 'assets/logo.png'}" alt="${escapeHTML(video.creatorName)}">
          </div>
          <div class="vz-video-meta">
            <h3 class="vz-video-title">${escapeHTML(video.title)}</h3>
            <div class="vz-creator-name">${escapeHTML(video.creatorName)}</div>
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

  const init = () => {
    const input = document.getElementById("vzSearchInput");
    if (input) {
      input.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          performSearch(input.value);
        }, 250);
      });

      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
          addHistoryItem(input.value.trim());
          performSearch(input.value);
        }
      });
    }

    const clearBtn = document.getElementById("vzClearHistoryBtn");
    if (clearBtn) clearBtn.addEventListener("click", clearHistory);

    renderHistoryChips();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    applyQuery,
    clearHistory
  };
})();
