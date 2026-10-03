/**
 * ==========================================================================
 * VIDOZONE - SECTION SHORTS PLEIN ÉCRAN VERTICAL (SHORTS.JS)
 * Défilement vertical, lecture/pause, likes, abonnements & son
 * ==========================================================================
 */

const VZ_Shorts = (() => {
  const { KEYS, showToast, escapeHTML } = VidoZone;

  let shortsData = [];

  const getShorts = () => {
    try {
      const data = localStorage.getItem(KEYS.SHORTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const renderShorts = () => {
    const container = document.getElementById("vzShortsContainer");
    if (!container) return;

    shortsData = getShorts();
    if (shortsData.length === 0) {
      container.innerHTML = `
        <div style="height:100vh;display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px;">
          <div>
            <h3>Aucun Short disponible</h3>
            <p style="color:var(--vz-text-secondary);margin:8px 0 16px;">Sois le premier à publier un Short vertical !</p>
            <a href="upload.html" class="vz-btn vz-btn-primary vz-btn-sm">Créer un Short</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = shortsData.map((short, idx) => `
      <section class="vz-short-slide" data-id="${short.id}" id="short-slide-${idx}">
        <video class="vz-short-video" src="${short.videoURL}" loop playsinline preload="metadata" poster="${short.thumbnailURL || ''}"></video>
        
        <div class="vz-short-overlay">
          <div class="vz-short-info-left">
            <div class="vz-short-creator-row">
              <div class="vz-short-creator-avatar">
                <img src="${short.creatorAvatar || 'assets/logo.png'}" alt="${escapeHTML(short.creatorName)}">
              </div>
              <span class="vz-short-creator-name">@${escapeHTML(short.creatorName)}</span>
              <button class="vz-btn vz-btn-primary vz-btn-sm vz-btn-pill" style="height:28px;padding:0 10px;font-size:11px;" onclick="VZ_Shorts.followCreator('${short.creatorId}', this)">
                Suivre
              </button>
            </div>
            <div class="vz-short-title">${escapeHTML(short.title)}</div>
          </div>

          <div class="vz-short-actions-right">
            <div class="vz-short-action-item" onclick="VZ_Shorts.toggleShortLike('${short.id}', this)">
              <div class="vz-short-action-icon">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              <span class="vz-short-action-count">${(short.likes || 0).toLocaleString()}</span>
            </div>

            <div class="vz-short-action-item" onclick="VZ_Shorts.openCommentsModal('${short.id}')">
              <div class="vz-short-action-icon">
                <svg viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
              </div>
              <span class="vz-short-action-count">${short.commentsCount || 14}</span>
            </div>

            <div class="vz-short-action-item" onclick="VZ_Shorts.shareShort('${short.id}')">
              <div class="vz-short-action-icon">
                <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
              </div>
              <span class="vz-short-action-count">Partager</span>
            </div>

            <div class="vz-short-action-item" onclick="VZ_Shorts.toggleMute(this)">
              <div class="vz-short-action-icon" id="vzShortMuteIcon">
                <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    `).join("");

    attachSlideListeners();
  };

  // Gestion de la lecture automatique au scroll avec IntersectionObserver
  const attachSlideListeners = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector("video");
        if (!video) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.6 });

    document.querySelectorAll(".vz-short-slide").forEach(slide => {
      observer.observe(slide);

      // Tap pour play/pause
      const video = slide.querySelector("video");
      if (video) {
        slide.addEventListener("click", (e) => {
          if (e.target.closest(".vz-short-actions-right") || e.target.closest("button")) return;
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        });
      }
    });
  };

  const toggleShortLike = (id, el) => {
    const short = shortsData.find(s => s.id === id);
    if (!short) return;
    const isLiked = el.classList.toggle("liked");
    short.likes = (short.likes || 0) + (isLiked ? 1 : -1);
    const countEl = el.querySelector(".vz-short-action-count");
    if (countEl) countEl.innerText = short.likes.toLocaleString();
    localStorage.setItem(KEYS.SHORTS, JSON.stringify(shortsData));
    showToast(isLiked ? "Short liké ! ❤️" : "Like retiré", "info");
  };

  const followCreator = (creatorId, btn) => {
    btn.innerText = "Abonné ✓";
    btn.style.background = "var(--vz-surface)";
    btn.style.color = "var(--vz-text-secondary)";
    showToast("Abonnement réussi !", "success");
  };

  const shareShort = (id) => {
    if (navigator.share) {
      navigator.share({
        title: "VidoZone Short",
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast("Lien du Short copié !", "success");
      });
    }
  };

  const toggleMute = () => {
    const videos = document.querySelectorAll(".vz-short-video");
    let isMuted = false;
    videos.forEach(v => {
      v.muted = !v.muted;
      isMuted = v.muted;
    });
    showToast(isMuted ? "Son coupé" : "Son activé", "info");
  };

  const openCommentsModal = (id) => {
    const modal = document.getElementById("vzShortsCommentsModal");
    if (modal) modal.classList.add("active");
  };

  const init = () => {
    renderShorts();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    toggleShortLike,
    followCreator,
    shareShort,
    toggleMute,
    openCommentsModal
  };
})();
