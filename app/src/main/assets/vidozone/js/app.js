/**
 * ==========================================================================
 * VIDOZONE - APPLICATION CORE (APP.JS)
 * Moteur principal, gestion des données locales, formatage, toasts,
 * détection réseau et barre de navigation.
 * ==========================================================================
 */

const VidoZone = (() => {
  // Clés de stockage
  const KEYS = {
    USER: "vz_current_user",
    USERS: "vz_users_db",
    VIDEOS: "vz_videos_db",
    SHORTS: "vz_shorts_db",
    COMMENTS: "vz_comments_db",
    LIKES: "vz_likes_db",
    SUBSCRIPTIONS: "vz_subscriptions_db",
    NOTIFICATIONS: "vz_notifications_db",
    HISTORY: "vz_search_history",
    WATCH_HISTORY: "vz_watch_history",
    THEME: "vz_theme"
  };

  // Données initiales enrichies (Vidéos de démonstration de haute qualité)
  const SEED_VIDEOS = [
    {
      id: "vid-1",
      title: "Afrobeats Fusion 2026 - Live Experience & Percussions",
      description: "Plongez au cœur des rythmes vibrants de l'Afrobeats contemporain avec les meilleurs artistes et percussions traditionnelles.",
      videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnailURL: "assets/images/thumb_music.jpg",
      creatorId: "user-kemi",
      creatorName: "Kemi Beats Official",
      creatorAvatar: "assets/logo.png",
      category: "Musique",
      tags: ["Afrobeats", "Live", "Musique", "Afrique"],
      duration: "03:15",
      views: 124500,
      likes: 8420,
      dislikes: 42,
      createdAt: Date.now() - 1000 * 60 * 60 * 5, // il y a 5 heures
      visibility: "public"
    },
    {
      id: "vid-2",
      title: "Cyber Samurai 2077 - Gameplay Ultra HD & Stratégies Pro",
      description: "Gameplay complet et découverte des meilleures combinaisons d'armes sur le jeu cyberpunk le plus attendu de l'année.",
      videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailURL: "assets/images/thumb_gaming.jpg",
      creatorId: "user-axel",
      creatorName: "Axel GameZone",
      creatorAvatar: "assets/icon.png",
      category: "Gaming",
      tags: ["Gaming", "Cyberpunk", "Action"],
      duration: "09:56",
      views: 89300,
      likes: 6310,
      dislikes: 18,
      createdAt: Date.now() - 1000 * 60 * 60 * 24, // il y a 1 jour
      visibility: "public"
    },
    {
      id: "vid-3",
      title: "L'Intelligence Artificielle en Afrique : Révolution Tech",
      description: "Comment les jeunes développeurs et innovateurs transforment l'agriculture, la santé et l'éducation grâce au numérique.",
      videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnailURL: "assets/images/thumb_gaming.jpg",
      creatorId: "user-techafrique",
      creatorName: "Tech Horizon",
      creatorAvatar: "assets/logo.png",
      category: "Technologie",
      tags: ["Tech", "Afrique", "IA", "Innovation"],
      duration: "14:20",
      views: 45200,
      likes: 3100,
      dislikes: 12,
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      visibility: "public"
    },
    {
      id: "vid-4",
      title: "Le Stand-Up Urbain : Quand le taxi refuse de rendre la monnaie !",
      description: "Un sketch hilarant inspiré de la vie quotidienne dans nos grandes villes métropolitaines.",
      videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      thumbnailURL: "assets/images/thumb_music.jpg",
      creatorId: "user-momo",
      creatorName: "Momo Le Rigolo",
      creatorAvatar: "assets/icon.png",
      category: "Comédie",
      tags: ["Humour", "Sketch", "Comédie"],
      duration: "04:45",
      views: 210000,
      likes: 15400,
      dislikes: 120,
      createdAt: Date.now() - 1000 * 60 * 60 * 72,
      visibility: "public"
    }
  ];

  const SEED_SHORTS = [
    {
      id: "short-1",
      title: "Astuce Tech secrète pour booster ton smartphone en 5 secondes ! 🔥",
      videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      thumbnailURL: "assets/images/thumb_gaming.jpg",
      creatorId: "user-techafrique",
      creatorName: "Tech Horizon",
      creatorAvatar: "assets/logo.png",
      likes: 42100,
      commentsCount: 385,
      sharesCount: 1420
    },
    {
      id: "short-2",
      title: "Solo de Guitare Électrique improvisé en live 🎸⚡",
      videoURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnailURL: "assets/images/thumb_music.jpg",
      creatorId: "user-kemi",
      creatorName: "Kemi Beats Official",
      creatorAvatar: "assets/icon.png",
      likes: 29800,
      commentsCount: 192,
      sharesCount: 890
    }
  ];

  // Initialisation de la base de données locale
  const initDatabase = () => {
    if (!localStorage.getItem(KEYS.VIDEOS)) {
      localStorage.setItem(KEYS.VIDEOS, JSON.stringify(SEED_VIDEOS));
    }
    if (!localStorage.getItem(KEYS.SHORTS)) {
      localStorage.setItem(KEYS.SHORTS, JSON.stringify(SEED_SHORTS));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      const defaultUsers = [
        {
          uid: "user-kemi",
          name: "Kemi Beats",
          username: "kemibeats",
          email: "kemi@vidozone.com",
          photoURL: "assets/logo.png",
          bio: "Producteur & Créateur de sonorités vibrantes. 🎶",
          subscribersCount: 28400,
          followingCount: 45,
          createdAt: Date.now() - 100000000
        },
        {
          uid: "user-axel",
          name: "Axel GameZone",
          username: "axelgames",
          email: "axel@vidozone.com",
          photoURL: "assets/icon.png",
          bio: "Streamer gaming passionné. Nouveautés, tests & tournois ! 🎮",
          subscribersCount: 19500,
          followingCount: 80,
          createdAt: Date.now() - 90000000
        }
      ];
      localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem(KEYS.COMMENTS)) {
      const defaultComments = [
        {
          id: "cmt-1",
          videoId: "vid-1",
          userId: "user-axel",
          userName: "Axel GameZone",
          userAvatar: "assets/icon.png",
          text: "Incroyable énergie dans ce morceau ! Bravo l'équipe !",
          createdAt: Date.now() - 1000 * 60 * 90,
          likes: 34
        },
        {
          id: "cmt-2",
          videoId: "vid-1",
          userId: "user-kemi",
          userName: "Kemi Beats",
          userAvatar: "assets/logo.png",
          text: "Merci à tous pour vos retours chaleureux ! Nouveau son vendredi prochain.",
          createdAt: Date.now() - 1000 * 60 * 30,
          likes: 56
        }
      ];
      localStorage.setItem(KEYS.COMMENTS, JSON.stringify(defaultComments));
    }
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
      const defaultNotifs = [
        {
          id: "notif-1",
          type: "welcome",
          title: "Bienvenue sur VidoZone !",
          message: "Regarde, crée et partage dès maintenant vos premières vidéos.",
          read: false,
          createdAt: Date.now() - 1000 * 60 * 60 * 12
        },
        {
          id: "notif-2",
          type: "like",
          title: "Nouveau J'aime",
          message: "Quelqu'un a aimé votre commentaire récent.",
          read: false,
          createdAt: Date.now() - 1000 * 60 * 15
        }
      ];
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(defaultNotifs));
    }
  };

  // Toast notification
  const showToast = (message, type = "info") => {
    let container = document.getElementById("vzToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "vzToastContainer";
      container.className = "vz-toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `vz-toast ${type}`;
    toast.innerHTML = `
      <span>${escapeHTML(message)}</span>
      <button onclick="this.parentElement.remove()" style="color:var(--vz-text-muted);">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 3800);
  };

  // Formatage des grands nombres
  const formatViews = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M vues";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k vues";
    return (num || 0) + " vues";
  };

  // Formatage de la date relative
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Récemment";
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "À l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `il y a ${days} j`;
    const months = Math.floor(days / 30);
    return `il y a ${months} mois`;
  };

  // Sécurisation HTML
  const escapeHTML = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Gestion du thème Sombre / Clair
  const initTheme = () => {
    const savedTheme = localStorage.getItem(KEYS.THEME) || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(KEYS.THEME, next);
    showToast(`Mode ${next === "dark" ? "sombre" : "clair"} activé`, "info");
    return next;
  };

  // Détection de connexion réseau
  const initNetworkDetection = () => {
    const banner = document.createElement("div");
    banner.id = "vzOfflineBanner";
    banner.className = "vz-offline-banner";
    banner.innerText = "Connexion Internet indisponible - Mode hors ligne activé";
    document.body.prepend(banner);

    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        banner.classList.add("visible");
      } else {
        banner.classList.remove("visible");
      }
    };

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);
    updateNetworkStatus();
  };

  // Système anti-doublon pour le comptage de vues
  const registerView = (videoId) => {
    try {
      const watched = JSON.parse(localStorage.getItem(KEYS.WATCH_HISTORY) || "{}");
      const lastView = watched[videoId];
      const now = Date.now();
      // On compte une vue au maximum toutes les 15 minutes par vidéo
      if (lastView && now - lastView < 15 * 60 * 1000) {
        return false;
      }
      watched[videoId] = now;
      localStorage.setItem(KEYS.WATCH_HISTORY, JSON.stringify(watched));

      // Incrémentation locale
      const videos = JSON.parse(localStorage.getItem(KEYS.VIDEOS) || "[]");
      const target = videos.find(v => v.id === videoId);
      if (target) {
        target.views = (target.views || 0) + 1;
        localStorage.setItem(KEYS.VIDEOS, JSON.stringify(videos));
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Initialisation globale
  const init = () => {
    initDatabase();
    initTheme();
    initNetworkDetection();
  };

  // Exécution au chargement du DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    KEYS,
    showToast,
    formatViews,
    formatTimeAgo,
    escapeHTML,
    toggleTheme,
    registerView
  };
})();
