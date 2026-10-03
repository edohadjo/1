/**
 * ==========================================================================
 * VIDOZONE - LECTEUR VIDÉO (PLAYER.JS)
 * Contrôles tactiles complets, comptage des vues, likes, abonnements,
 * partage et vidéos suggérées.
 * ==========================================================================
 */

const VZ_Player = (() => {
  const { KEYS, showToast, formatViews, formatTimeAgo, escapeHTML, registerView } = VidoZone;

  let currentVideo = null;
  let videoEl = null;
  let isLiked = false;
  let isDisliked = false;
  let isSubscribed = false;
  let controlsTimeout = null;

  // Récupérer l'ID depuis l'URL (?id=...)
  const getVideoIdFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "vid-1";
  };

  // Récupération de la vidéo
  const loadVideoData = () => {
    const videoId = getVideoIdFromURL();
    const videos = JSON.parse(localStorage.getItem(KEYS.VIDEOS) || "[]");
    currentVideo = videos.find(v => v.id === videoId) || videos[0];
    return currentVideo;
  };

  // Formatage des secondes en mm:ss
  const formatSeconds = (sec) => {
    if (isNaN(sec) || sec < 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Afficher / Masquer les contrôles
  const showControls = () => {
    const overlay = document.getElementById("vzControlsOverlay");
    if (!overlay) return;
    overlay.classList.remove("hidden");
    clearTimeout(controlsTimeout);
    if (videoEl && !videoEl.paused) {
      controlsTimeout = setTimeout(() => {
        overlay.classList.add("hidden");
      }, 3500);
    }
  };

  const toggleControls = () => {
    const overlay = document.getElementById("vzControlsOverlay");
    if (!overlay) return;
    if (overlay.classList.contains("hidden")) {
      showControls();
    } else {
      overlay.classList.add("hidden");
    }
  };

  // Lecture / Pause
  const togglePlay = () => {
    if (!videoEl) return;
    if (videoEl.paused || videoEl.ended) {
      videoEl.play().catch(e => console.log("Play interrupted:", e));
      updatePlayIcon(true);
    } else {
      videoEl.pause();
      updatePlayIcon(false);
    }
    showControls();
  };

  const updatePlayIcon = (isPlaying) => {
    const playBtn = document.getElementById("vzCenterPlayBtn");
    if (!playBtn) return;
    playBtn.innerHTML = isPlaying
      ? `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  };

  // Saut de temps (+10s ou -10s)
  const seekRelative = (seconds) => {
    if (!videoEl) return;
    videoEl.currentTime = Math.max(0, Math.min(videoEl.duration, videoEl.currentTime + seconds));
    showControls();
    showToast(seconds > 0 ? "+10 secondes" : "-10 secondes", "info");
  };

  // Plein écran
  const toggleFullscreen = () => {
    const wrapper = document.getElementById("vzVideoPlayerWrapper");
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      if (wrapper.requestFullscreen) wrapper.requestFullscreen();
      else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // Gestion du son
  const toggleMute = () => {
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    const btn = document.getElementById("vzMuteBtn");
    if (btn) {
      btn.innerHTML = videoEl.muted
        ? `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    }
  };

  // Like / Dislike
  const toggleLike = () => {
    const likeBtn = document.getElementById("vzLikeBtn");
    const likeCountSpan = document.getElementById("vzLikeCount");
    const dislikeBtn = document.getElementById("vzDislikeBtn");
    if (!likeBtn || !currentVideo) return;

    if (isLiked) {
      isLiked = false;
      currentVideo.likes = Math.max(0, currentVideo.likes - 1);
      likeBtn.classList.remove("liked");
    } else {
      isLiked = true;
      currentVideo.likes = (currentVideo.likes || 0) + 1;
      likeBtn.classList.add("liked");
      if (isDisliked) {
        isDisliked = false;
        dislikeBtn.classList.remove("disliked");
      }
      showToast("Vidéo ajoutée à vos J'aime", "success");
    }

    if (likeCountSpan) likeCountSpan.innerText = (currentVideo.likes || 0).toLocaleString();
    saveVideoStats();
  };

  const toggleDislike = () => {
    const dislikeBtn = document.getElementById("vzDislikeBtn");
    const likeBtn = document.getElementById("vzLikeBtn");
    const likeCountSpan = document.getElementById("vzLikeCount");
    if (!dislikeBtn || !currentVideo) return;

    if (isDisliked) {
      isDisliked = false;
      dislikeBtn.classList.remove("disliked");
    } else {
      isDisliked = true;
      dislikeBtn.classList.add("disliked");
      if (isLiked) {
        isLiked = false;
        likeBtn.classList.remove("liked");
        currentVideo.likes = Math.max(0, currentVideo.likes - 1);
        if (likeCountSpan) likeCountSpan.innerText = (currentVideo.likes || 0).toLocaleString();
      }
    }
    saveVideoStats();
  };

  // Abonnement
  const toggleSubscribe = () => {
    const subBtn = document.getElementById("vzSubscribeBtn");
    const subCountEl = document.getElementById("vzSubCount");
    if (!subBtn || !currentVideo) return;

    const subs = JSON.parse(localStorage.getItem(KEYS.SUBSCRIPTIONS) || "{}");
    if (isSubscribed) {
      isSubscribed = false;
      delete subs[currentVideo.creatorId];
      subBtn.classList.remove("subscribed");
      subBtn.innerText = "S'abonner";
      showToast(`Désabonné de ${currentVideo.creatorName}`, "info");
    } else {
      isSubscribed = true;
      subs[currentVideo.creatorId] = Date.now();
      subBtn.classList.add("subscribed");
      subBtn.innerText = "Abonné ✓";
      showToast(`Abonné à ${currentVideo.creatorName} !`, "success");
    }

    localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
  };

  // Partage
  const shareVideo = () => {
    if (navigator.share) {
      navigator.share({
        title: currentVideo ? currentVideo.title : "VidoZone",
        text: `Regarde cette vidéo sur VidoZone : ${currentVideo ? currentVideo.title : ''}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast("Lien de la vidéo copié dans le presse-papier !", "success");
      });
    }
  };

  // Téléchargement
  const downloadVideo = () => {
    showToast("Préparation du téléchargement hors-ligne...", "info");
    setTimeout(() => {
      showToast("Vidéo enregistrée pour lecture hors-ligne !", "success");
    }, 1200);
  };

  // Sauvegarde des stats vidéo
  const saveVideoStats = () => {
    if (!currentVideo) return;
    const videos = JSON.parse(localStorage.getItem(KEYS.VIDEOS) || "[]");
    const idx = videos.findIndex(v => v.id === currentVideo.id);
    if (idx !== -1) {
      videos[idx] = currentVideo;
      localStorage.setItem(KEYS.VIDEOS, JSON.stringify(videos));
    }
  };

  // Rendu des suggestions de vidéos recommandées
  const renderRecommended = () => {
    const container = document.getElementById("vzRecommendedList");
    if (!container) return;

    const allVideos = JSON.parse(localStorage.getItem(KEYS.VIDEOS) || "[]");
    const others = allVideos.filter(v => v.id !== currentVideo.id);

    container.innerHTML = others.map(video => `
      <article class="vz-video-card" onclick="window.location.href='player.html?id=${video.id}'">
        <div class="vz-thumb-container">
          <img class="vz-thumb-img" src="${video.thumbnailURL || 'assets/images/thumb_music.jpg'}" alt="${escapeHTML(video.title)}" loading="lazy">
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

  // Initialisation du lecteur
  const init = () => {
    loadVideoData();
    if (!currentVideo) return;

    videoEl = document.getElementById("vzVideoPlayer");
    if (!videoEl) return;

    videoEl.src = currentVideo.videoURL;
    videoEl.poster = currentVideo.thumbnailURL;

    // Remplir les textes
    document.title = `${currentVideo.title} - VidoZone`;
    const titleEl = document.getElementById("vzPlayerTitle");
    if (titleEl) titleEl.innerText = currentVideo.title;

    const statsEl = document.getElementById("vzPlayerStats");
    if (statsEl) {
      statsEl.innerHTML = `
        <span>${formatViews(currentVideo.views)}</span>
        <span class="vz-stat-dot"></span>
        <span>${formatTimeAgo(currentVideo.createdAt)}</span>
        <span class="vz-stat-dot"></span>
        <span style="color:var(--vz-primary);font-weight:700;">#${currentVideo.category}</span>
      `;
    }

    const creatorNameEl = document.getElementById("vzCreatorName");
    if (creatorNameEl) creatorNameEl.innerText = currentVideo.creatorName;

    const creatorAvatarEl = document.getElementById("vzCreatorAvatar");
    if (creatorAvatarEl) creatorAvatarEl.src = currentVideo.creatorAvatar || "assets/logo.png";

    const descEl = document.getElementById("vzDescriptionText");
    if (descEl) descEl.innerText = currentVideo.description;

    const likeCountSpan = document.getElementById("vzLikeCount");
    if (likeCountSpan) likeCountSpan.innerText = (currentVideo.likes || 0).toLocaleString();

    // État abonnement
    const subs = JSON.parse(localStorage.getItem(KEYS.SUBSCRIPTIONS) || "{}");
    if (subs[currentVideo.creatorId]) {
      isSubscribed = true;
      const subBtn = document.getElementById("vzSubscribeBtn");
      if (subBtn) {
        subBtn.classList.add("subscribed");
        subBtn.innerText = "Abonné ✓";
      }
    }

    // Gestion du scrubbing de la barre de progression
    const progressTrack = document.getElementById("vzTimelineTrack");
    const progressFill = document.getElementById("vzTimelineProgress");
    const scrubberHandle = document.getElementById("vzTimelineScrubber");
    const timeDisplay = document.getElementById("vzTimeDisplay");

    videoEl.addEventListener("timeupdate", () => {
      if (videoEl.duration) {
        const percent = (videoEl.currentTime / videoEl.duration) * 100;
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (scrubberHandle) scrubberHandle.style.left = `${percent}%`;
        if (timeDisplay) {
          timeDisplay.innerText = `${formatSeconds(videoEl.currentTime)} / ${formatSeconds(videoEl.duration)}`;
        }
      }
    });

    // Enregistrement de la vue après 4 secondes de lecture effective
    let viewRecorded = false;
    videoEl.addEventListener("timeupdate", () => {
      if (!viewRecorded && videoEl.currentTime > 4) {
        viewRecorded = true;
        const counted = registerView(currentVideo.id);
        if (counted) {
          currentVideo.views = (currentVideo.views || 0) + 1;
          if (statsEl) {
            statsEl.innerHTML = `
              <span>${formatViews(currentVideo.views)}</span>
              <span class="vz-stat-dot"></span>
              <span>${formatTimeAgo(currentVideo.createdAt)}</span>
            `;
          }
        }
      }
    });

    const timelineWrap = document.getElementById("vzTimelineWrap");
    if (timelineWrap) {
      timelineWrap.addEventListener("click", (e) => {
        const rect = timelineWrap.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if (videoEl.duration) {
          videoEl.currentTime = pos * videoEl.duration;
        }
      });
    }

    videoEl.addEventListener("play", () => {
      updatePlayIcon(true);
      showControls();
    });

    videoEl.addEventListener("pause", () => {
      updatePlayIcon(false);
      showControls();
    });

    // Tap to show/hide controls
    const wrapper = document.getElementById("vzVideoPlayerWrapper");
    if (wrapper) {
      wrapper.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest(".vz-timeline-slider-wrap")) return;
        toggleControls();
      });
    }

    renderRecommended();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    togglePlay,
    seekRelative,
    toggleFullscreen,
    toggleMute,
    toggleLike,
    toggleDislike,
    toggleSubscribe,
    shareVideo,
    downloadVideo
  };
})();
