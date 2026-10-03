/**
 * ==========================================================================
 * VIDOZONE - PUBLICATION DE VIDÉO (UPLOAD.JS)
 * Sélection vidéo & miniature, prévisualisation, validation, progression
 * d'envoi et enregistrement dans Firestore / LocalStorage
 * ==========================================================================
 */

const VZ_Upload = (() => {
  const { KEYS, showToast } = VidoZone;

  let selectedVideoFile = null;
  let selectedVideoURL = "";
  let selectedThumbnailURL = "";

  // Gestion des sélections de fichiers
  const handleVideoSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showToast("Veuillez sélectionner un fichier vidéo valide (.mp4, .webm, etc.).", "error");
      return;
    }
    // Vérification taille (limite à 150 Mo pour smartphone)
    if (file.size > 150 * 1024 * 1024) {
      showToast("La vidéo dépasse la taille maximale recommandée de 150 Mo.", "error");
      return;
    }

    selectedVideoFile = file;
    selectedVideoURL = URL.createObjectURL(file);

    // Aperçu vidéo
    const previewContainer = document.getElementById("vzPreviewVideoWrap");
    const previewVideo = document.getElementById("vzPreviewVideo");
    if (previewContainer && previewVideo) {
      previewVideo.src = selectedVideoURL;
      previewContainer.classList.add("active");
    }

    const dropzone = document.getElementById("vzVideoDropzone");
    if (dropzone) {
      dropzone.innerHTML = `
        <div style="color:var(--vz-success);font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;">
          <svg style="width:24px;height:24px;fill:currentColor;" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
          Vidéo sélectionnée : ${file.name}
        </div>
        <p style="font-size:12px;color:var(--vz-text-muted);margin-top:4px;">Taille : ${(file.size / (1024 * 1024)).toFixed(1)} Mo</p>
      `;
    }
    showToast("Vidéo prête pour la publication !", "success");
  };

  const handleThumbnailSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Veuillez sélectionner une image valide pour la miniature.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedThumbnailURL = e.target.result;
      const thumbPreview = document.getElementById("vzThumbPreviewImg");
      if (thumbPreview) {
        thumbPreview.src = selectedThumbnailURL;
        thumbPreview.style.display = "block";
      }
    };
    reader.readAsDataURL(file);
  };

  // Envoi de la vidéo
  const publishVideo = async () => {
    const titleInput = document.getElementById("vzUploadTitle");
    const descInput = document.getElementById("vzUploadDesc");
    const catInput = document.getElementById("vzUploadCategory");
    const tagsInput = document.getElementById("vzUploadTags");
    const visibilityInput = document.querySelector('input[name="vzVisibility"]:checked');

    const title = titleInput ? titleInput.value.trim() : "";
    const description = descInput ? descInput.value.trim() : "";
    const category = catInput ? catInput.value : "Général";
    const tagsRaw = tagsInput ? tagsInput.value.trim() : "";
    const visibility = visibilityInput ? visibilityInput.value : "public";

    if (!title) {
      showToast("Veuillez donner un titre à votre vidéo.", "error");
      if (titleInput) titleInput.focus();
      return;
    }

    if (!selectedVideoURL) {
      // Démo de secours si aucun fichier sélectionné
      selectedVideoURL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    }

    if (!selectedThumbnailURL) {
      selectedThumbnailURL = "assets/images/thumb_music.jpg";
    }

    const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

    // Barre de progression
    const progressWrap = document.getElementById("vzUploadProgressWrap");
    const progressFill = document.getElementById("vzProgressBarFill");
    const progressText = document.getElementById("vzProgressText");
    const publishBtn = document.getElementById("vzPublishBtn");

    if (progressWrap) progressWrap.classList.add("active");
    if (publishBtn) publishBtn.disabled = true;

    // Simulation de téléversement fluide
    let percent = 0;
    const interval = setInterval(() => {
      percent += Math.floor(Math.random() * 15) + 10;
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        finalizePublish({ title, description, category, tags, visibility });
      }
      if (progressFill) progressFill.style.width = `${percent}%`;
      if (progressText) progressText.innerText = `Téléversement et traitement en cours : ${percent}%`;
    }, 200);
  };

  const finalizePublish = async ({ title, description, category, tags, visibility }) => {
    const user = VZ_Auth.getCurrentUser() || {
      uid: "user_" + Date.now(),
      name: "Créateur VidoZone",
      username: "createur",
      photoURL: "assets/logo.png"
    };

    const newVideo = {
      id: "vid-" + Date.now(),
      title: title,
      description: description,
      videoURL: selectedVideoURL,
      thumbnailURL: selectedThumbnailURL,
      creatorId: user.uid,
      creatorName: user.name,
      creatorAvatar: user.photoURL || "assets/logo.png",
      category: category,
      tags: tags,
      duration: "02:40",
      views: 1,
      likes: 0,
      dislikes: 0,
      createdAt: Date.now(),
      visibility: visibility
    };

    // Si Firebase est connecté
    if (window.VZ_FIREBASE && window.VZ_FIREBASE.isReady() && window.VZ_FIREBASE.db) {
      try {
        await window.VZ_FIREBASE.db.collection("videos").doc(newVideo.id).set(newVideo);
      } catch (e) {
        console.warn("Erreur Firestore, sauvegarde locale en relais :", e);
      }
    }

    // Sauvegarde locale
    const videos = JSON.parse(localStorage.getItem(KEYS.VIDEOS) || "[]");
    videos.unshift(newVideo);
    localStorage.setItem(KEYS.VIDEOS, JSON.stringify(videos));

    showToast("Votre vidéo a été publiée avec succès !", "success");
    setTimeout(() => {
      window.location.href = `player.html?id=${newVideo.id}`;
    }, 800);
  };

  const init = () => {
    const videoInput = document.getElementById("vzVideoFileInput");
    const dropzone = document.getElementById("vzVideoDropzone");

    if (dropzone && videoInput) {
      dropzone.addEventListener("click", () => videoInput.click());
      videoInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleVideoSelect(e.target.files[0]);
        }
      });

      // Glisser-déposer
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleVideoSelect(e.dataTransfer.files[0]);
        }
      });
    }

    const thumbInput = document.getElementById("vzThumbFileInput");
    if (thumbInput) {
      thumbInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleThumbnailSelect(e.target.files[0]);
        }
      });
    }

    const publishBtn = document.getElementById("vzPublishBtn");
    if (publishBtn) {
      publishBtn.addEventListener("click", publishVideo);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    publishVideo
  };
})();
