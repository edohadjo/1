/**
 * ==========================================================================
 * VIDOZONE - SECTION COMMENTAIRES (COMMENTS.JS)
 * Publication, modération, réponses, suppression et likes de commentaires.
 * ==========================================================================
 */

const VZ_Comments = (() => {
  const { KEYS, showToast, formatTimeAgo, escapeHTML } = VidoZone;

  let currentVideoId = "vid-1";

  const getComments = () => {
    try {
      const data = localStorage.getItem(KEYS.COMMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const saveComments = (comments) => {
    localStorage.setItem(KEYS.COMMENTS, JSON.stringify(comments));
  };

  // Rendu de la liste
  const renderComments = () => {
    const listEl = document.getElementById("vzCommentsList");
    const countEl = document.getElementById("vzCommentsCount");
    if (!listEl) return;

    const allComments = getComments();
    const videoComments = allComments.filter(c => c.videoId === currentVideoId);

    if (countEl) {
      countEl.innerText = `${videoComments.length} commentaire${videoComments.length > 1 ? 's' : ''}`;
    }

    const currentUser = VZ_Auth.getCurrentUser();

    if (videoComments.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--vz-text-muted);font-size:13px;">
          Aucun commentaire pour le moment. Sois le premier à t'exprimer !
        </div>
      `;
      return;
    }

    listEl.innerHTML = videoComments.map(c => {
      const isOwner = currentUser && (currentUser.uid === c.userId || currentUser.name === c.userName);
      return `
        <div class="vz-comment-item" id="comment-${c.id}">
          <div class="vz-comment-avatar">
            <img src="${c.userAvatar || 'assets/logo.png'}" alt="${escapeHTML(c.userName)}">
          </div>
          <div class="vz-comment-body">
            <div class="vz-comment-author-bar">
              <span class="vz-comment-author-name">${escapeHTML(c.userName)}</span>
              <span class="vz-comment-date">${formatTimeAgo(c.createdAt)}</span>
            </div>
            <p class="vz-comment-text">${escapeHTML(c.text)}</p>
            <div class="vz-comment-actions">
              <button class="vz-comment-action-btn" onclick="VZ_Comments.likeComment('${c.id}')">
                <svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                <span>${c.likes || 0}</span>
              </button>
              <button class="vz-comment-action-btn" onclick="VZ_Comments.replyComment('${escapeHTML(c.userName)}')">
                <span>Répondre</span>
              </button>
              ${isOwner ? `
                <button class="vz-comment-action-btn delete" onclick="VZ_Comments.deleteComment('${c.id}')">
                  <span>Supprimer</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("");
  };

  // Publication d'un nouveau commentaire
  const addComment = () => {
    const textarea = document.getElementById("vzCommentInput");
    if (!textarea) return;

    const text = textarea.value.trim();
    if (!text) {
      showToast("Le commentaire ne peut pas être vide.", "error");
      return;
    }
    if (text.length > 500) {
      showToast("Le commentaire dépasse la limite de 500 caractères.", "error");
      return;
    }

    const currentUser = VZ_Auth.getCurrentUser() || {
      uid: "guest_" + Date.now(),
      name: "Invité VidoZone",
      photoURL: "assets/logo.png"
    };

    const newComment = {
      id: "cmt-" + Date.now(),
      videoId: currentVideoId,
      userId: currentUser.uid,
      userName: currentUser.name,
      userAvatar: currentUser.photoURL || "assets/logo.png",
      text: text,
      createdAt: Date.now(),
      likes: 0
    };

    const comments = getComments();
    comments.unshift(newComment);
    saveComments(comments);

    textarea.value = "";
    const counter = document.getElementById("vzCharCounter");
    if (counter) counter.innerText = "0 / 500";

    renderComments();
    showToast("Commentaire publié !", "success");
  };

  // Suppression
  const deleteComment = (commentId) => {
    if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    const comments = getComments().filter(c => c.id !== commentId);
    saveComments(comments);
    renderComments();
    showToast("Commentaire supprimé.", "info");
  };

  // Like sur un commentaire
  const likeComment = (commentId) => {
    const comments = getComments();
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      comment.likes = (comment.likes || 0) + 1;
      saveComments(comments);
      renderComments();
    }
  };

  // Répondre à un auteur
  const replyComment = (authorName) => {
    const textarea = document.getElementById("vzCommentInput");
    if (textarea) {
      textarea.value = `@${authorName} `;
      textarea.focus();
    }
  };

  // Initialisation
  const init = () => {
    const params = new URLSearchParams(window.location.search);
    currentVideoId = params.get("id") || "vid-1";

    const textarea = document.getElementById("vzCommentInput");
    const counter = document.getElementById("vzCharCounter");
    if (textarea && counter) {
      textarea.addEventListener("input", () => {
        counter.innerText = `${textarea.value.length} / 500`;
      });
    }

    const postBtn = document.getElementById("vzPostCommentBtn");
    if (postBtn) {
      postBtn.addEventListener("click", addComment);
    }

    renderComments();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    addComment,
    deleteComment,
    likeComment,
    replyComment
  };
})();
