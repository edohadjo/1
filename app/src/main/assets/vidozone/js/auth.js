/**
 * ==========================================================================
 * VIDOZONE - GESTIONNAIRE D'AUTHENTIFICATION (AUTH.JS)
 * Inscription, Connexion, Validation, Session, Mot de passe oublié & Profil
 * ==========================================================================
 */

const VZ_Auth = (() => {
  const { KEYS, showToast } = VidoZone;

  // Récupérer l'utilisateur actuellement connecté
  const getCurrentUser = () => {
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  // Sauvegarder la session active
  const setCurrentUser = (user, rememberMe = true) => {
    if (rememberMe) {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    } else {
      sessionStorage.setItem(KEYS.USER, JSON.stringify(user));
    }
  };

  // Validation d'adresse e-mail
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Évaluation de la sécurité du mot de passe (score de 1 à 3)
  const evaluatePasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd || pwd.length < 6) return 0;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 1: Faible, 2: Moyen, 3: Fort
  };

  // Déconnexion
  const logout = () => {
    if (window.VZ_FIREBASE && window.VZ_FIREBASE.isReady() && window.VZ_FIREBASE.auth) {
      window.VZ_FIREBASE.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.USER);
    showToast("Déconnexion réussie.", "info");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 400);
  };

  // Inscription d'un nouvel utilisateur
  const register = async ({ firstName, lastName, username, email, password, confirmPassword, avatarBase64 }) => {
    // 1. Validations de base
    if (!firstName || !lastName || !username || !email || !password) {
      throw new Error("Veuillez remplir tous les champs obligatoires.");
    }
    if (!isValidEmail(email)) {
      throw new Error("Format d'adresse e-mail invalide.");
    }
    if (username.length < 3) {
      throw new Error("Le nom d'utilisateur doit contenir au moins 3 caractères.");
    }
    if (password.length < 6) {
      throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
    }
    if (password !== confirmPassword) {
      throw new Error("Les deux mots de passe ne correspondent pas.");
    }

    // 2. Si Firebase est activé, création du compte Firebase
    if (window.VZ_FIREBASE && window.VZ_FIREBASE.isReady() && window.VZ_FIREBASE.auth) {
      try {
        const userCred = await window.VZ_FIREBASE.auth.createUserWithEmailAndPassword(email, password);
        const fbUser = userCred.user;
        const profileData = {
          uid: fbUser.uid,
          name: `${firstName} ${lastName}`.trim(),
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
          email: email.toLowerCase(),
          photoURL: avatarBase64 || "assets/logo.png",
          bio: "Nouveau membre de la communauté VidoZone ! ✨",
          subscribersCount: 0,
          followingCount: 0,
          createdAt: Date.now()
        };

        if (window.VZ_FIREBASE.db) {
          await window.VZ_FIREBASE.db.collection("users").doc(fbUser.uid).set(profileData);
        }
        setCurrentUser(profileData, true);
        return profileData;
      } catch (err) {
        throw new Error(err.message || "Erreur lors de l'inscription Firebase.");
      }
    }

    // 3. Mode local (localStorage)
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || "[]");
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error("Cette adresse e-mail est déjà associée à un compte.");
    }

    const newUser = {
      uid: "user_" + Date.now(),
      name: `${firstName} ${lastName}`.trim(),
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      email: email.toLowerCase(),
      photoURL: avatarBase64 || "assets/logo.png",
      bio: "Nouveau membre de la communauté VidoZone ! ✨",
      subscribersCount: 0,
      followingCount: 0,
      createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    setCurrentUser(newUser, true);
    return newUser;
  };

  // Connexion utilisateur
  const login = async ({ email, password, rememberMe = true }) => {
    if (!email || !password) {
      throw new Error("Veuillez renseigner votre email et mot de passe.");
    }
    if (!isValidEmail(email)) {
      throw new Error("Format d'adresse e-mail invalide.");
    }

    // Si Firebase est configuré
    if (window.VZ_FIREBASE && window.VZ_FIREBASE.isReady() && window.VZ_FIREBASE.auth) {
      try {
        const userCred = await window.VZ_FIREBASE.auth.signInWithEmailAndPassword(email, password);
        const fbUser = userCred.user;
        let profile = null;
        if (window.VZ_FIREBASE.db) {
          const doc = await window.VZ_FIREBASE.db.collection("users").doc(fbUser.uid).get();
          if (doc.exists) {
            profile = doc.data();
          }
        }
        if (!profile) {
          profile = {
            uid: fbUser.uid,
            name: fbUser.displayName || email.split("@")[0],
            username: email.split("@")[0],
            email: email,
            photoURL: fbUser.photoURL || "assets/logo.png",
            subscribersCount: 0,
            followingCount: 0,
            createdAt: Date.now()
          };
        }
        setCurrentUser(profile, rememberMe);
        return profile;
      } catch (err) {
        throw new Error(err.message || "Identifiants de connexion incorrects.");
      }
    }

    // Mode local
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || "[]");
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Si aucun compte de ce nom, on crée un profil convivial pour le premier test
    if (!user) {
      user = {
        uid: "user_" + Date.now(),
        name: email.split("@")[0],
        username: email.split("@")[0],
        email: email,
        photoURL: "assets/logo.png",
        bio: "Passionné de découvertes vidéos sur VidoZone 🚀",
        subscribersCount: 12,
        followingCount: 34,
        createdAt: Date.now()
      };
      users.push(user);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }

    setCurrentUser(user, rememberMe);
    return user;
  };

  // Réinitialisation de mot de passe (Mot de passe oublié)
  const resetPassword = async (email) => {
    if (!email || !isValidEmail(email)) {
      throw new Error("Veuillez saisir une adresse e-mail valide.");
    }
    if (window.VZ_FIREBASE && window.VZ_FIREBASE.isReady() && window.VZ_FIREBASE.auth) {
      await window.VZ_FIREBASE.auth.sendPasswordResetEmail(email);
    }
    showToast(`Lien de réinitialisation envoyé à ${email}`, "success");
    return true;
  };

  // Mise à jour du profil
  const updateProfile = ({ name, username, bio, photoURL }) => {
    const user = getCurrentUser();
    if (!user) throw new Error("Aucun utilisateur connecté.");

    if (name) user.name = name.trim();
    if (username) user.username = username.trim().toLowerCase();
    if (bio !== undefined) user.bio = bio.trim();
    if (photoURL) user.photoURL = photoURL;

    // Enregistrement session
    setCurrentUser(user, true);

    // Enregistrement base de données
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || "[]");
    const idx = users.findIndex(u => u.uid === user.uid);
    if (idx !== -1) {
      users[idx] = user;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }

    // Mise à jour Firestore si actif
    if (window.VZ_FIREBASE && window.VZ_FIREBASE.isReady() && window.VZ_FIREBASE.db) {
      window.VZ_FIREBASE.db.collection("users").doc(user.uid).update({
        name: user.name,
        username: user.username,
        bio: user.bio,
        photoURL: user.photoURL
      }).catch(e => console.warn(e));
    }

    showToast("Profil mis à jour avec succès !", "success");
    return user;
  };

  return {
    getCurrentUser,
    setCurrentUser,
    isValidEmail,
    evaluatePasswordStrength,
    register,
    login,
    logout,
    resetPassword,
    updateProfile
  };
})();
