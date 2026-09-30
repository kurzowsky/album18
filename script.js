/**
 * ==============================================================================
 * GŁÓWNA LOGIKA ALBUMU (ZABEZPIECZENIE HASŁEM + CAŁY FOLDER Z GOOGLE DRIVE)
 * ==============================================================================
 */

// Stan globalny galerii
const State = {
  photos: [],
  currentPhotoIndex: 0,
  isLightboxOpen: false,
  isAuthenticated: false,
  activeProfile: 'friends' // 'friends' | 'family'
};

const STORAGE_KEY = 'album_18_auth_token';
const PROFILE_KEY = 'album_18_active_profile';

document.addEventListener('DOMContentLoaded', () => {
  initPasswordProtection();
});

/**
 * ==============================================================================
 * 1. ZABEZPIECZENIE HASŁEM (GATEKEEPER / DWA PROFILE: ZNAJOMI VS RODZINA)
 * ==============================================================================
 */
function resolvePasswordProfile(entered) {
  if (!entered) return null;
  const str = String(entered).trim();
  const profiles = ALBUM_CONFIG.accessProfiles;

  if (profiles) {
    if (profiles.family && profiles.family.password && str === String(profiles.family.password).trim()) {
      return 'family';
    }
    if (profiles.friends && profiles.friends.password && str === String(profiles.friends.password).trim()) {
      return 'friends';
    }
  }

  return null;
}

function initPasswordProtection() {
  const lockOverlay = document.getElementById('lockscreenOverlay');
  const passwordForm = document.getElementById('passwordForm');
  const passwordInput = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('lockErrorMessage');
  const toggleBtn = document.getElementById('btnTogglePassword');
  const relockBtn = document.getElementById('btnRelockAlbum');
  const lockTitle = document.getElementById('lockTitle');

  // Personalizacja nagłówka w oknie logowania
  if (lockTitle && ALBUM_CONFIG.birthdayPerson) {
    lockTitle.innerHTML = `${ALBUM_CONFIG.birthdayPerson} • <span class="highlight-gold">${ALBUM_CONFIG.age}</span>`;
  }

  // Sprawdzamy, czy użytkownik podał już wcześniej prawidłowe hasło (zapamiętane w przeglądarce)
  const savedToken = localStorage.getItem(STORAGE_KEY);
  const matchedProfile = resolvePasswordProfile(savedToken);
  if (matchedProfile) {
    State.activeProfile = matchedProfile;
    unlockAlbum(false); // Odblokowujemy bez ponownego wpisywania hasła
  } else {
    // Ustawiamy fokus na pole hasła
    setTimeout(() => {
      if (passwordInput) passwordInput.focus();
    }, 200);
  }

  // Obsługa zatwierdzenia formularza z hasłem
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      verifyPassword();
    });
  }

  // Ukrywanie komunikatu błędu, gdy użytkownik zaczyna ponownie pisać
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      if (errorMsg) errorMsg.classList.remove('visible');
    });
  }

  // Przełącznik pokazywania/ukrywania hasła (ikonka oka)
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      toggleBtn.style.color = isPassword ? 'var(--accent-gold)' : 'var(--text-muted)';
    });
  }

  // Przycisk ponownego zablokowania albumu w stopce
  if (relockBtn) {
    relockBtn.addEventListener('click', () => {
      relockAlbum();
    });
  }
}

function verifyPassword() {
  const passwordInput = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('lockErrorMessage');
  if (!passwordInput) return;

  const entered = passwordInput.value.trim();
  const matchedProfile = resolvePasswordProfile(entered);

  if (matchedProfile) {
    State.activeProfile = matchedProfile;
    localStorage.setItem(STORAGE_KEY, entered);
    localStorage.setItem(PROFILE_KEY, matchedProfile);
    if (errorMsg) errorMsg.classList.remove('visible');
    unlockAlbum(true);
  } else {
    if (errorMsg) {
      errorMsg.classList.remove('visible');
      // Wymuszenie restartu animacji shake
      void errorMsg.offsetWidth;
      errorMsg.classList.add('visible');
    }
    passwordInput.value = '';
    passwordInput.focus();
  }
}

function unlockAlbum(triggerConfetti = true) {
  State.isAuthenticated = true;
  document.body.classList.remove('is-locked');

  const lockOverlay = document.getElementById('lockscreenOverlay');
  if (lockOverlay) {
    lockOverlay.classList.add('unlocked');
  }

  // Inicjalizacja głównych funkcji albumu i ładowanie zdjęć DOPIERO po odblokowaniu!
  initAlbumDetails();
  initVideoSection();
  initLightbox();
  initScrollTop();
  loadAllPhotos();

  if (triggerConfetti) {
    setTimeout(() => {
      firePartyConfetti();
    }, 400);
  }
}

function relockAlbum() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_KEY);
  State.isAuthenticated = false;
  State.activeProfile = 'friends';
  document.body.classList.add('is-locked');

  const lockOverlay = document.getElementById('lockscreenOverlay');
  if (lockOverlay) {
    lockOverlay.classList.remove('unlocked');
  }

  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.focus();
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * ==============================================================================
 * 2. POBIERANIE ZDJĘĆ Z FOLDERU GOOGLE DRIVE
 * ==============================================================================
 */
async function loadAllPhotos() {
  const statusEl = document.getElementById('galleryStatusMessage');

  // Wariant 1: Pobieranie całego folderu ze skryptu Google Apps Script
  if (ALBUM_CONFIG.folderScriptUrl && ALBUM_CONFIG.folderScriptUrl.trim() !== '') {
    showStatus("Wczytywanie zdjęć z Twojego folderu na Dysku Google...", true);
    try {
      const cacheBuster = (ALBUM_CONFIG.folderScriptUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      const response = await fetch(ALBUM_CONFIG.folderScriptUrl.trim() + cacheBuster);
      if (!response.ok) throw new Error("Błąd pobierania danych ze skryptu Google");
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        // Jeśli skrypt zwraca nazwy plików { id, name }, sortujemy naturalnie: 1.jpg, 2.jpg ... 10.jpg
        if (typeof data[0] === 'object' && data[0].name) {
          data.sort((a, b) => {
            return String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' });
          });
        }
        State.photos = data.map(item => typeof item === 'object' && item.id ? item.id : item);
        hideStatus();
        renderGallery();
        updatePhotosCount();
        checkAndOpenDeepLink();
        return;
      } else {
        showStatus("Folder na Dysku Google jest pusty lub nie zawiera zdjęć.", false);
        return;
      }
    } catch (err) {
      console.error(err);
      showStatus("Nie udało się pobrać folderu. Sprawdź, czy skrypt Google Apps Script jest wdrożony jako publiczny (dostęp: Każdy).", false);
      return;
    }
  }

  // Wariant 2: Wklejona lista ID w ALBUM_CONFIG.photoIds
  if (Array.isArray(ALBUM_CONFIG.photoIds) && ALBUM_CONFIG.photoIds.length > 0) {
    State.photos = ALBUM_CONFIG.photoIds;
    hideStatus();
    renderGallery();
    updatePhotosCount();
    checkAndOpenDeepLink();
    return;
  }

  showStatus("Brak skonfigurowanych zdjęć w pliku config.js.", false);
}

function showStatus(msg, isSpinner = false) {
  const statusEl = document.getElementById('galleryStatusMessage');
  if (!statusEl) return;
  statusEl.style.display = 'block';
  statusEl.innerHTML = `
    ${isSpinner ? '<div style="margin-bottom:8px;font-size:1.4rem;">⏳</div>' : ''}
    <p>${msg}</p>
  `;
}

function hideStatus() {
  const statusEl = document.getElementById('galleryStatusMessage');
  if (statusEl) statusEl.style.display = 'none';
}

function updatePhotosCount() {
  const countEl = document.getElementById('photosCountText');
  if (countEl) {
    countEl.textContent = `${State.photos.length} zdjęć`;
  }
}

/**
 * ==============================================================================
 * 3. OBSŁUGA BEZPOŚREDNICH LINKÓW CDN GOOGLE DRIVE
 * ==============================================================================
 */
function parseGoogleDriveId(input) {
  if (!input) return null;
  const str = String(input).trim();

  if (str.startsWith('http') && !str.includes('drive.google.com') && !str.includes('googleusercontent.com')) {
    return { isExternalUrl: true, url: str };
  }

  const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return { isDrive: true, id: matchFileD[1] };

  const matchIdParam = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return { isDrive: true, id: matchIdParam[1] };

  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) {
    return { isDrive: true, id: str };
  }

  return { isExternalUrl: true, url: str };
}

function getDirectPhotoUrl(item, size = 'thumb') {
  const parsed = parseGoogleDriveId(item);
  if (!parsed) return '';

  if (parsed.isExternalUrl) {
    return parsed.url;
  }

  const width = size === 'thumb' ? 'w800' : 'w2400';
  return `https://lh3.googleusercontent.com/d/${parsed.id}=${width}`;
}

function getBackupGoogleDriveUrl(item, size = 'thumb') {
  const parsed = parseGoogleDriveId(item);
  if (parsed && parsed.isDrive) {
    const width = size === 'thumb' ? 'w1000' : 'w2000';
    return `https://drive.google.com/thumbnail?id=${parsed.id}&sz=${width}`;
  }
  return '';
}

/**
 * ==============================================================================
 * 4. WYPEŁNIENIE DANYCH NAGŁÓWKA
 * ==============================================================================
 */
function initAlbumDetails() {
  if (typeof ALBUM_CONFIG === 'undefined') return;

  const titleEl = document.getElementById('heroHeadline');
  if (titleEl) {
    titleEl.innerHTML = `${ALBUM_CONFIG.birthdayPerson} • <span class="highlight-gold">${ALBUM_CONFIG.age}</span>`;
  }

  const dateEl = document.getElementById('eventDateText');
  if (dateEl && ALBUM_CONFIG.date) {
    dateEl.textContent = ALBUM_CONFIG.date;
  }

  const locationEl = document.getElementById('eventLocationText');
  if (locationEl && ALBUM_CONFIG.location) {
    locationEl.textContent = ALBUM_CONFIG.location;
  }

  const confettiBtn = document.getElementById('btnConfetti');
  if (confettiBtn) {
    confettiBtn.onclick = (e) => {
      e.preventDefault();
      firePartyConfetti();
    };
  }
}

/**
 * ==============================================================================
 * 4b. OBSŁUGA SEKCJI TELEDYSKU (GOOGLE DRIVE / YOUTUBE)
 * ==============================================================================
 */
function initVideoSection() {
  const section = document.getElementById('videoSection');
  const heroBtn = document.getElementById('btnHeroVideo');
  const playerWrapper = document.getElementById('videoPlayerWrapper');
  const actionsBar = document.getElementById('videoActionsBar');

  if (!section || !playerWrapper) return;

  // Rozpoznanie aktywnego profilu (znajomi vs rodzina)
  const profileKey = State.activeProfile || 'friends';
  const profileConfig = (ALBUM_CONFIG.accessProfiles && ALBUM_CONFIG.accessProfiles[profileKey])
    ? ALBUM_CONFIG.accessProfiles[profileKey]
    : null;

  const rawUrl = ((profileConfig && profileConfig.videoUrl !== undefined)
    ? profileConfig.videoUrl
    : ALBUM_CONFIG.videoUrl || '').trim();

  // Dynamiczna aktualizacja tytułu i podtytułu filmu w zależności od profilu
  const videoTitleEl = document.querySelector('.video-title');
  const videoSubtitleEl = document.querySelector('.video-subtitle');
  if (profileConfig) {
    if (videoTitleEl && profileConfig.videoTitle) videoTitleEl.textContent = profileConfig.videoTitle;
    if (videoSubtitleEl && profileConfig.videoSubtitle) videoSubtitleEl.textContent = profileConfig.videoSubtitle;
  }

  // Jeśli brak linku do filmu dla tego profilu, ukrywamy sekcję i przycisk w Hero
  if (!rawUrl) {
    section.style.display = 'none';
    if (heroBtn) heroBtn.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  if (heroBtn) heroBtn.style.display = 'inline-flex';

  // 1. Sprawdzamy, czy to film z YouTube (pełne linki, youtu.be, embed, shorts)
  const ytMatch = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    // playsinline=1 jest kluczowe dla telefonów (iPhone Safari i Android), aby film odtwarzał się BEZPOŚREDNIO na stronie!
    const embedUrl = `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
    const directViewUrl = `https://www.youtube.com/watch?v=${videoId}`;

    playerWrapper.innerHTML = `
      <iframe
        src="${embedUrl}"
        class="video-iframe"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowfullscreen="true"
        webkitallowfullscreen="true"
        mozallowfullscreen="true"
        title="Oficjalny teledysk z 18-stki"
      ></iframe>
    `;

    if (actionsBar) {
      actionsBar.innerHTML = `
        <a href="${directViewUrl}" target="_blank" rel="noopener noreferrer" class="btn-video-action btn-video-youtube" title="Otwórz teledysk w aplikacji YouTube">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          <span>Otwórz w aplikacji YouTube</span>
        </a>
      `;
    }
    return;
  }

  // 2. Sprawdzamy, czy to bezpośredni plik wideo (.mp4, .webm, .mov lub lokalny plik w folderze)
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(rawUrl) || 
                        (!rawUrl.includes('drive.google.com') && !rawUrl.includes('youtube.com') && !rawUrl.includes('youtu.be') && !/^[a-zA-Z0-9_-]{25,}$/.test(rawUrl));

  if (isDirectVideo) {
    playerWrapper.innerHTML = `
      <video
        class="video-native-player"
        controls
        playsinline
        webkit-playsinline
        preload="metadata"
      >
        <source src="${rawUrl}" type="video/mp4">
        Twoja przeglądarka nie obsługuje wbudowanego odtwarzacza wideo.
      </video>
    `;

    if (actionsBar) {
      actionsBar.innerHTML = `
        <a href="${rawUrl}" download class="btn-video-action btn-video-download" title="Pobierz plik wideo na telefon lub komputer">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          <span>Pobierz plik wideo</span>
        </a>
      `;
    }
    return;
  }

  // 3. Wariant: Dysk Google (link do pliku lub samo ID pliku)
  let embedUrl = '';
  let directViewUrl = '';
  let directDownloadUrl = '';

  const parsedDrive = parseGoogleDriveId(rawUrl);
  if (parsedDrive && parsedDrive.isDrive) {
    embedUrl = `https://drive.google.com/file/d/${parsedDrive.id}/preview`;
    directViewUrl = `https://drive.google.com/file/d/${parsedDrive.id}/view`;
    directDownloadUrl = `https://drive.google.com/uc?export=download&id=${parsedDrive.id}`;
  } else {
    embedUrl = rawUrl;
    directViewUrl = rawUrl;
  }

  playerWrapper.innerHTML = `
    <iframe
      src="${embedUrl}"
      class="video-iframe"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      allowfullscreen="true"
      webkitallowfullscreen="true"
      mozallowfullscreen="true"
      title="Oficjalny teledysk z 18-stki"
    ></iframe>
  `;

  if (actionsBar) {
    let actionsHtml = '';
    if (directViewUrl) {
      actionsHtml += `
        <a href="${directViewUrl}" target="_blank" rel="noopener noreferrer" class="btn-video-action btn-video-external" title="Odtwórz w pełnej jakości w aplikacji Dysk Google lub nowym oknie">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          <span>Otwórz w aplikacji / nowym oknie</span>
        </a>
      `;
    }
    if (directDownloadUrl) {
      actionsHtml += `
        <a href="${directDownloadUrl}" target="_blank" rel="noopener noreferrer" class="btn-video-action btn-video-download" title="Pobierz plik wideo na telefon lub komputer">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          <span>Pobierz wideo</span>
        </a>
      `;
    }
    // Wskazówka dla użytkowników urządzeń mobilnych z blokadą ciasteczek
    actionsHtml += `
      <div class="video-hint">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span><strong>Wskazówka na telefon:</strong> Jeśli na telefonie (iPhone/Safari) Dysk Google blokuje odtwarzanie przez politykę ciasteczek stron trzecich, użyj przycisku powyżej lub wklej w <code>config.js</code> link z YouTube (z opcją <em>Niepubliczny</em>).</span>
      </div>
    `;
    actionsBar.innerHTML = actionsHtml;
  }
}

/**
 * ==============================================================================
 * 5. RENDEROWANIE SIATKI ZDJĘĆ W UKŁADZIE CHRONOLOGICZNYM
 * ==============================================================================
 * Zdjęcia rozkładane są poziomo (wiersz po wierszu), zachowując kolejność 1, 2, 3...
 */
let currentColumnCount = 0;

function getOptimalColumnCount() {
  const w = window.innerWidth;
  if (w >= 1200) return 4;
  if (w >= 840) return 3;
  if (w >= 480) return 2;
  return 1;
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid || !State.photos || State.photos.length === 0) return;

  const numCols = getOptimalColumnCount();
  currentColumnCount = numCols;

  // Tworzymy kolumny w pamięci podręcznej (poza drzewem DOM)
  const colElements = [];
  for (let c = 0; c < numCols; c++) {
    const col = document.createElement('div');
    col.className = 'masonry-col';
    colElements.push(col);
  }

  // Rozmieszczamy zdjęcia chronologicznie od lewej do prawej
  // Rząd 1: Zdjęcie 1, Zdjęcie 2, Zdjęcie 3...
  // Rząd 2: Zdjęcie 4, Zdjęcie 5, Zdjęcie 6...
  State.photos.forEach((photoItem, index) => {
    const targetCol = colElements[index % numCols];
    const card = createPhotoCard(photoItem, index);
    targetCol.appendChild(card);
  });

  // Jeden pojedynczy atomiczny update DOMu (zero zacięć nawet przy 1000 zdjęć)
  grid.replaceChildren(...colElements);
}

function createPhotoCard(photoItem, index) {
  const card = document.createElement('div');
  card.className = 'photo-card loading';
  card.dataset.index = index;

  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'photo-img-wrapper';

  const img = document.createElement('img');
  img.alt = `Zdjęcie z 18-stki #${index + 1}`;
  img.loading = 'lazy';
  img.decoding = 'async';

  const primaryUrl = getDirectPhotoUrl(photoItem, 'thumb');
  img.src = primaryUrl;

  img.onload = () => {
    card.classList.remove('loading');
    card.classList.add('loaded');
  };

  img.onerror = () => {
    const backup = getBackupGoogleDriveUrl(photoItem, 'thumb');
    if (backup && img.src !== backup) {
      img.src = backup;
    } else {
      card.classList.remove('loading');
    }
  };

  imgWrapper.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';
  overlay.innerHTML = `
    <div class="photo-expand-icon" title="Powiększ zdjęcie">
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
      </svg>
    </div>
  `;

  card.appendChild(imgWrapper);
  card.appendChild(overlay);

  card.addEventListener('click', () => {
    openLightbox(index);
  });

  return card;
}

// Dynamiczne dostosowanie liczby kolumn przy zmianie rozmiaru ekranu
let resizeDebounce;
window.addEventListener('resize', () => {
  clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(() => {
    if (State.isAuthenticated && State.photos.length > 0) {
      if (getOptimalColumnCount() !== currentColumnCount) {
        renderGallery();
      }
    }
  }, 150);
});

/**
 * ==============================================================================
 * 6. INTERAKTYWNY LIGHTBOX (PEŁNY EKRAN + SWIPE)
 * ==============================================================================
 */
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function initLightbox() {
  const modal = document.getElementById('lightboxModal');
  const closeBtn = document.getElementById('lbCloseBtn');
  const prevBtn = document.getElementById('lbPrevBtn');
  const nextBtn = document.getElementById('lbNextBtn');
  const shareBtn = document.getElementById('lbShareBtn');
  const downloadBtn = document.getElementById('lbDownloadBtn');

  if (!modal) return;

  if (closeBtn) closeBtn.onclick = closeLightbox;
  if (prevBtn) prevBtn.onclick = showPrevPhoto;
  if (nextBtn) nextBtn.onclick = showNextPhoto;

  modal.onclick = (e) => {
    if (e.target === modal || e.target.classList.contains('lightbox-body')) {
      closeLightbox();
    }
  };

  document.onkeydown = (e) => {
    if (!State.isLightboxOpen) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') showNextPhoto();
    else if (e.key === 'ArrowLeft') showPrevPhoto();
  };

  const stage = document.getElementById('lightboxStage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    }, { passive: true });
  }

  if (shareBtn) {
    shareBtn.onclick = () => {
      const shareUrl = window.location.href.split('#')[0] + `#photo-${State.currentPhotoIndex + 1}`;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast("Skopiowano link do zdjęcia!");
        }).catch(() => {
          copyFallback(shareUrl);
        });
      } else {
        copyFallback(shareUrl);
      }
    };
  }

  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const current = State.photos[State.currentPhotoIndex];
      const parsed = parseGoogleDriveId(current);
      let downloadUrl = '';
      if (parsed && parsed.isDrive) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${parsed.id}`;
      } else {
        downloadUrl = getDirectPhotoUrl(current, 'full');
      }
      window.open(downloadUrl, '_blank');
    };
  }
}

function handleSwipeGesture() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const minSwipeDistance = 45;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX < 0) {
      showNextPhoto();
    } else {
      showPrevPhoto();
    }
  }
}

function openLightbox(index) {
  if (!State.photos || State.photos.length === 0) return;

  State.currentPhotoIndex = index;
  State.isLightboxOpen = true;

  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Aktualizujemy adres URL na bieżący numer zdjęcia (#photo-X)
  history.replaceState(null, null, `#photo-${index + 1}`);

  updateLightboxContent();
}

function closeLightbox() {
  State.isLightboxOpen = false;
  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Usuwamy hash z adresu URL po zamknięciu Lightboxa
  if (window.location.hash.startsWith('#photo-')) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
  }
}

function showNextPhoto() {
  if (State.photos.length <= 1) return;
  State.currentPhotoIndex = (State.currentPhotoIndex + 1) % State.photos.length;
  updateLightboxContent('next');
}

function showPrevPhoto() {
  if (State.photos.length <= 1) return;
  State.currentPhotoIndex = (State.currentPhotoIndex - 1 + State.photos.length) % State.photos.length;
  updateLightboxContent('prev');
}

function updateLightboxContent(direction = 'none') {
  const modal = document.getElementById('lightboxModal');
  const imgEl = document.getElementById('lbImage');
  const counterEl = document.getElementById('lbCounter');
  const stageEl = document.getElementById('lightboxStage');

  const photo = State.photos[State.currentPhotoIndex];
  if (!photo || !imgEl) return;

  modal.classList.add('loading');

  // Aktualizacja hasha w pasku adresu przy przeglądaniu kolejnych zdjęć
  history.replaceState(null, null, `#photo-${State.currentPhotoIndex + 1}`);

  if (stageEl && direction !== 'none') {
    const shift = direction === 'next' ? '20px' : '-20px';
    stageEl.style.transform = `translateX(${shift})`;
    stageEl.style.opacity = '0.5';
    setTimeout(() => {
      stageEl.style.transform = 'translateX(0)';
      stageEl.style.opacity = '1';
    }, 120);
  }

  const highResUrl = getDirectPhotoUrl(photo, 'full');
  imgEl.onload = () => modal.classList.remove('loading');
  imgEl.onerror = () => {
    const backup = getBackupGoogleDriveUrl(photo, 'full');
    if (backup && imgEl.src !== backup) imgEl.src = backup;
    else modal.classList.remove('loading');
  };

  imgEl.src = highResUrl;

  if (counterEl) {
    counterEl.textContent = `${State.currentPhotoIndex + 1} / ${State.photos.length}`;
  }

  preloadAdjacentImages();
}

function preloadAdjacentImages() {
  if (State.photos.length <= 1) return;
  const nextIdx = (State.currentPhotoIndex + 1) % State.photos.length;
  const prevIdx = (State.currentPhotoIndex - 1 + State.photos.length) % State.photos.length;

  const nextImg = new Image();
  nextImg.src = getDirectPhotoUrl(State.photos[nextIdx], 'full');

  const prevImg = new Image();
  prevImg.src = getDirectPhotoUrl(State.photos[prevIdx], 'full');
}

/**
 * ==============================================================================
 * 7. POWIADOMIENIA TOAST, KONFETTI, GŁĘBOKIE LINKOWANIE I SCROLL TOP
 * ==============================================================================
 */
function copyFallback(text) {
  try {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast("Skopiowano link do zdjęcia!");
  } catch {
    prompt("Skopiuj link do zdjęcia:", text);
  }
}

function showToast(message) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * Otwiera bezpośrednie zdjęcie po wejściu z linku typu #photo-5 lub #photo-ID
 */
function checkAndOpenDeepLink() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#photo-')) return;
  if (!State.photos || State.photos.length === 0) return;

  const target = hash.replace('#photo-', '').trim();

  // 1. Numer zdjęcia (np. #photo-5)
  const photoNum = parseInt(target, 10);
  if (!isNaN(photoNum) && photoNum >= 1 && photoNum <= State.photos.length) {
    setTimeout(() => {
      openLightbox(photoNum - 1);
    }, 200);
    return;
  }

  // 2. ID zdjęcia (np. #photo-1Xfl4Rwp...)
  const foundIdx = State.photos.findIndex(p => {
    const id = typeof p === 'object' && p.id ? p.id : p;
    return id === target;
  });
  if (foundIdx !== -1) {
    setTimeout(() => {
      openLightbox(foundIdx);
    }, 200);
  }
}

// Obsługa przycisków Wstecz / Dalej w przeglądarce
window.addEventListener('hashchange', () => {
  if (State.isAuthenticated && State.photos.length > 0) {
    checkAndOpenDeepLink();
  }
});

function firePartyConfetti() {
  if (typeof confetti !== 'function') return;
  const defaults = { origin: { y: 0.7 }, zIndex: 10001 };
  const colors = ['#f5c518', '#ffd700', '#a855f7', '#ec4899', '#ffffff'];

  confetti({ ...defaults, particleCount: 50, spread: 26, startVelocity: 55, colors });
  confetti({ ...defaults, particleCount: 50, spread: 60, colors });
  confetti({ ...defaults, particleCount: 60, spread: 100, decay: 0.91, scalar: 0.8, colors });
  confetti({ ...defaults, particleCount: 40, spread: 120, startVelocity: 25, decay: 0.92, colors });
}

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  }, { passive: true });

  btn.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}
