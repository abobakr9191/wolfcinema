/* =====================================================
   WOLFCINEMA — WATCH JAVASCRIPT (PRO CINEMA PLAYER v2)
   Features: Ambient, Screenshot, Share, Sleep Timer,
             Touch Gestures, Stats, Skip Intro, Retry
===================================================== */

"use strict";

const API_BASE     = window.location.origin;
const API_URL      = API_BASE + "/api";
const SERVER_URL   = API_BASE;
const HISTORY_KEY  = "wolfcinema_watch_history";
const FAVORITES_KEY = "wolfcinema_favorites";
const PREF_KEY     = "wolfcinema_player_prefs";

/* =====================================================
   Utilities
===================================================== */

function throttle(fn, wait) {
    let last = 0;
    return function (...args) {
        const now = Date.now();
        if (now - last >= wait) {
            last = now;
            fn.apply(this, args);
        }
    };
}

function debounce(fn, wait) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/* =====================================================
   Preferences (Speed, Volume, Ambient)
===================================================== */

function getPrefs() {
    try {
        return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
    } catch (e) { return {}; }
}

function savePrefs(prefs) {
    try {
        localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch (e) {}
}

function setPref(key, value) {
    const p = getPrefs();
    p[key] = value;
    savePrefs(p);
}

/* =====================================================
   Watch History
===================================================== */

function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch (e) { return []; }
}

function saveHistory(h) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch (e) {}
}

function findHistoryEntry(workId, episodeNum, seasonNum) {
    return getHistory().find(h =>
        String(h.workId) === String(workId) &&
        String(h.episodeNumber || "") === String(episodeNum || "") &&
        String(h.seasonNumber || "1") === String(seasonNum || "1")
    );
}

function upsertHistoryEntry(entry) {
    let history = getHistory();
    const idx = history.findIndex(h =>
        String(h.workId) === String(entry.workId) &&
        String(h.episodeNumber || "") === String(entry.episodeNumber || "") &&
        String(h.seasonNumber || "1") === String(entry.seasonNumber || "1")
    );
    if (idx >= 0) history[idx] = { ...history[idx], ...entry };
    else history.unshift(entry);
    history = history.slice(0, 50);
    saveHistory(history);
}

function removeHistoryEntry(workId, episodeNum, seasonNum) {
    const h = getHistory().filter(x =>
        !(String(x.workId) === String(workId) &&
          String(x.episodeNumber || "") === String(episodeNum || "") &&
          String(x.seasonNumber || "1") === String(seasonNum || "1"))
    );
    saveHistory(h);
}

/* =====================================================
   Favorites
===================================================== */

function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); }
    catch (e) { return []; }
}

function isFavorite(workId) {
    return getFavorites().some(f => String(f.id) === String(workId));
}

function toggleFavorite(work) {
    let favs = getFavorites();
    if (isFavorite(work.id)) {
        favs = favs.filter(f => String(f.id) !== String(work.id));
        saveFavorites(favs);
        return false;
    } else {
        favs.unshift({
            id: work.id,
            title: work.title,
            poster: work.poster,
            type: work.type,
            year: work.year,
            addedAt: Date.now()
        });
        saveFavorites(favs);
        return true;
    }
}

function saveFavorites(f) {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(f)); } catch (e) {}
}

/* =====================================================
   Toast Notifications
===================================================== */

function showToast(msg, type = "info", duration = 2500) {
    let toast = document.getElementById("cinemaToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "cinemaToast";
        toast.className = "cinema-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.className = `cinema-toast ${type} show`;

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

/* =====================================================
   Backend Helper (with retry)
===================================================== */

async function fetchWorkFromBackend(workId, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${API_URL}/works/${workId}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            if (i === retries) {
                console.log("ℹ️ السيرفر مش متاح");
                return null;
            }
            await new Promise(r => setTimeout(r, 500));
        }
    }
}

/* =====================================================
   Ambient Mode
===================================================== */

function extractAmbientColor(video, playerEl) {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 18;
        const ctx = canvas.getContext("2d");

        const sample = () => {
            if (video.paused || video.ended || !video.videoWidth) return;
            try {
                ctx.drawImage(video, 0, 0, 32, 18);
                const data = ctx.getImageData(0, 0, 32, 18).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 16) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                const mixed = [
                    Math.floor(r * 0.55),
                    Math.floor(g * 0.45),
                    Math.floor(b * 0.65)
                ];

                playerEl.style.setProperty("--ambient-color", `rgb(${mixed.join(",")})`);
            } catch (e) {}
        };

        const intervalId = setInterval(sample, 1500);
        video.addEventListener("ended", () => clearInterval(intervalId));
        video.addEventListener("pause", () => clearInterval(intervalId));
        video.addEventListener("play", () => {
            clearInterval(intervalId);
            const newId = setInterval(sample, 1500);
            video.addEventListener("ended", () => clearInterval(newId), { once: true });
        });
    } catch (e) {
        console.log("Ambient mode not available:", e);
    }
}

/* =====================================================
   MAIN
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("🎬 WOLFCINEMA WATCH v2");

    const urlParams = new URLSearchParams(window.location.search);
    const workId     = urlParams.get("id");
    const episodeNum = urlParams.get("ep");
    const seasonNum  = urlParams.get("season");
    const startTime  = parseFloat(urlParams.get("t") || "0");

    const watchTitle     = document.getElementById("watchTitle");
    const watchMeta      = document.getElementById("watchMeta");
    const videoContainer = document.getElementById("videoContainer");
    const watchInfo      = document.getElementById("watchInfo");
    const downloadBar    = document.getElementById("downloadBar");
    const downloadButton = document.getElementById("downloadButton");

    if (!watchTitle || !videoContainer) return;

    if (!workId) {
        watchTitle.textContent = "لم يتم تحديد عمل";
        return;
    }

    let work = null;
    let videoPath = null;
    let posterPath = "../assets/images/placeholder.jpg";
    let currentSeason = seasonNum ? parseInt(seasonNum) : 1;

    const apiWork = await fetchWorkFromBackend(workId);

    if (apiWork) {
        work = {
            id: apiWork.id,
            title: apiWork.title,
            type: apiWork.type,
            year: apiWork.year || "-",
            genre: apiWork.genre || "-",
            description: apiWork.description || "",
            poster: apiWork.poster
        };

        posterPath = apiWork.poster
            ? (apiWork.poster.startsWith("http") ? apiWork.poster : `${SERVER_URL}/${apiWork.poster}`)
            : "../assets/images/placeholder.jpg";

        if (episodeNum && apiWork.episodes && apiWork.episodes.length > 0) {
            const episode = apiWork.episodes.find(e => {
                const sameEp = String(e.number) === String(episodeNum);
                if (!sameEp) return false;
                if (seasonNum) return String(e.season || 1) === String(seasonNum);
                return true;
            });

            if (episode && episode.video) {
                videoPath = episode.video.startsWith("http")
                    ? episode.video
                    : `${SERVER_URL}/${episode.video}`;

                const seasonText = (episode.season && episode.season > 1) ? ` — موسم ${episode.season}` : "";
                work.title = `${apiWork.title}${seasonText} — حلقة ${episode.number}`;
                work.episodeTitle = episode.title || "";
                currentSeason = episode.season || 1;
            }
        } else if (!episodeNum && apiWork.video) {
            videoPath = apiWork.video.startsWith("http")
                ? apiWork.video
                : `${SERVER_URL}/${apiWork.video}`;
        }
    }

    if (!work) {
        watchTitle.textContent = "العمل غير موجود";
        videoContainer.innerHTML = `
            <div class="video-error">
                <h2>عذراً، هذا العمل غير موجود</h2>
                <a href="../index.html" class="btn btn-back">← الرئيسية</a>
            </div>`;
        return;
    }

    watchTitle.textContent = work.title;
    document.title = `مشاهدة ${work.title} | WOLFCINEMA`;

    if (watchMeta) {
        let episodeTag = "";
        if (episodeNum) {
            const seasonText = (currentSeason > 1) ? `م${currentSeason} • ` : "";
            episodeTag = `<span class="meta-tag">📺 ${seasonText}حلقة ${episodeNum}</span>`;
        }
        watchMeta.innerHTML = `
            <span class="meta-tag">${work.type}</span>
            ${episodeTag}
            <span class="meta-tag">📅 ${work.year}</span>
            <span class="meta-tag">🎬 ${work.genre}</span>
        `;
    }

    if (!videoPath) {
        const message = episodeNum
            ? `لم يتم رفع فيديو الحلقة ${episodeNum} بعد.`
            : "لم يتم رفع فيديو هذا العمل بعد.";

        videoContainer.innerHTML = `
            <div class="video-error">
                <h2>🎬 الفيديو غير متوفر حالياً</h2>
                <p>${message}</p>
                <a href="javascript:history.back()" class="btn btn-back">← رجوع</a>
            </div>`;
        return;
    }

    /* ===== آخر تقدم ===== */
    const savedEntry = findHistoryEntry(workId, episodeNum, currentSeason);
    const savedTime  = savedEntry ? savedEntry.currentTime : 0;
    const savedDuration = savedEntry ? savedEntry.duration : 0;

    let percent = 0;
    if (savedDuration > 0) {
        percent = Math.min(100, Math.round((savedTime / savedDuration) * 100));
    }

    const prefs = getPrefs();
    const favActive = isFavorite(work.id);

    let resumeHTML = "";
    if (savedTime > 5 && percent < 95) {
        resumeHTML = `
            <div class="resume-banner" id="resumeBanner">
                <div class="resume-info">
                    <span class="resume-icon">▶</span>
                    <div class="resume-text">
                        <strong>استكمال من حيث توقفت</strong>
                        <span>${formatTime(savedTime)} من ${formatTime(savedDuration)} (${percent}%)</span>
                    </div>
                </div>
                <div class="resume-actions">
                    <button class="resume-btn" id="resumeBtn">▶ استكمال</button>
                    <button class="restart-btn" id="restartBtn">↻ من البداية</button>
                </div>
            </div>
        `;
    }

    /* ===== بناء المشغل ===== */
    videoContainer.innerHTML = `
        ${resumeHTML}
        <div class="cinema-player" id="cinemaPlayer" data-ambient="${prefs.ambient !== false}">

            <video
                id="mainVideo"
                class="cinema-video"
                poster="${posterPath}"
                preload="metadata"
                playsinline
                crossorigin="anonymous"
            >
                <source src="${videoPath}" type="video/mp4">
                متصفحك لا يدعم تشغيل الفيديو.
            </video>

            <div class="cinema-loader" id="cinemaLoader">
                <div class="cinema-spinner"></div>
                <div class="cinema-loading-percent" id="cinemaLoadingPercent"></div>
            </div>

            <button class="cinema-center-btn" id="cinemaCenterBtn" aria-label="تشغيل">
                <span class="play-icon">▶</span>
            </button>

            <!-- ===== Quick Actions Bar (Top) ===== -->
            <div class="cinema-quick-actions" id="cinemaQuickActions">
                <button class="qa-btn" id="qaFavorite" title="إضافة للمفضلة">${favActive ? "⭐" : "☆"}</button>
                <button class="qa-btn" id="qaScreenshot" title="لقطة شاشة">📸</button>
                <button class="qa-btn" id="qaShare" title="مشاركة">🔗</button>
                <button class="qa-btn" id="qaSleep" title="مؤقت النوم">🌙</button>
                <button class="qa-btn" id="qaStats" title="إحصائيات">📊</button>
                <button class="qa-btn" id="qaShortcuts" title="اختصارات">⌨️</button>
            </div>

            <!-- ===== Sleep Timer Menu ===== -->
            <div class="cinema-sleep-menu" id="cinemaSleepMenu">
                <div class="sleep-menu-title">🌙 مؤقت النوم</div>
                <button data-min="10">10 دقائق</button>
                <button data-min="20">20 دقيقة</button>
                <button data-min="30">30 دقيقة</button>
                <button data-min="45">45 دقيقة</button>
                <button data-min="60">ساعة</button>
                <button data-min="0" class="danger">إلغاء المؤقت</button>
            </div>

            <!-- ===== Stats Panel ===== -->
            <div class="cinema-stats-panel" id="cinemaStatsPanel">
                <div class="stats-header">
                    <h4>📊 إحصائيات الفيديو</h4>
                    <button id="closeStatsBtn">✕</button>
                </div>
                <div class="stats-body" id="statsBody"></div>
            </div>

            <!-- ===== Keyboard Shortcuts Panel ===== -->
            <div class="cinema-shortcuts-panel" id="cinemaShortcutsPanel">
                <div class="stats-header">
                    <h4>⌨️ اختصارات الكيبورد</h4>
                    <button id="closeShortcutsBtn">✕</button>
                </div>
                <div class="shortcuts-body">
                    <div><kbd>Space</kbd> / <kbd>K</kbd><span>تشغيل / إيقاف</span></div>
                    <div><kbd>J</kbd><span>رجوع 10 ثواني</span></div>
                    <div><kbd>L</kbd><span>تقديم 10 ثواني</span></div>
                    <div><kbd>←</kbd> / <kbd>→</kbd><span>5 ثواني</span></div>
                    <div><kbd>↑</kbd> / <kbd>↓</kbd><span>الصوت</span></div>
                    <div><kbd>M</kbd><span>كتم الصوت</span></div>
                    <div><kbd>F</kbd><span>ملء الشاشة</span></div>
                    <div><kbd>C</kbd><span>ترجمات</span></div>
                    <div><kbd>0-9</kbd><span>الانتقال إلى نسبة</span></div>
                </div>
            </div>

            <!-- ===== Skip Intro Button ===== -->
            <button class="cinema-skip-intro" id="skipIntroBtn" style="display:none;">
                ⏭ تخطي المقدمة
            </button>

            <!-- ===== Gesture Indicators ===== -->
            <div class="gesture-indicator gesture-left" id="gestureLeft">
                <div class="gesture-icon">⏪</div>
                <div class="gesture-value"></div>
            </div>
            <div class="gesture-indicator gesture-right" id="gestureRight">
                <div class="gesture-icon">⏩</div>
                <div class="gesture-value"></div>
            </div>
            <div class="gesture-indicator gesture-volume" id="gestureVolume">
                <div class="gesture-icon">🔊</div>
                <div class="gesture-value"></div>
            </div>
            <div class="gesture-indicator gesture-brightness" id="gestureBrightness">
                <div class="gesture-icon">☀️</div>
                <div class="gesture-value"></div>
            </div>

            <!-- ===== Controls ===== -->
            <div class="cinema-controls" id="cinemaControls">

                <div class="cinema-progress-wrap" id="cinemaProgressWrap">
                    <div class="cinema-progress-buffered" id="cinemaProgressBuffered"></div>
                    <div class="cinema-progress-played" id="cinemaProgressPlayed">
                        <div class="cinema-progress-handle"></div>
                    </div>
                    <div class="cinema-tooltip" id="cinemaTooltip">0:00</div>
                </div>

                <div class="cinema-buttons">

                    <div class="cinema-btns-left">

                        <button class="cinema-btn" id="cinemaPlayBtn" aria-label="تشغيل/إيقاف">
                            <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        </button>

                        <button class="cinema-btn" id="cinemaPrevBtn" aria-label="10 ثوان للخلف">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
                        </button>

                        <button class="cinema-btn" id="cinemaNextBtn" aria-label="10 ثوان للأمام">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z"/></svg>
                        </button>

                        <div class="cinema-volume-wrap" id="cinemaVolumeWrap">
                            <button class="cinema-btn" id="cinemaMuteBtn" aria-label="كتم الصوت">
                                <svg class="icon-vol" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                                <svg class="icon-muted" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                            </button>

                            <div class="cinema-volume-popup" id="cinemaVolumePopup">
                                <div class="cinema-volume-percent" id="cinemaVolumePercent">100%</div>
                                <div class="cinema-volume-vertical" id="cinemaVolumeVertical">
                                    <div class="cinema-volume-vertical-fill" id="cinemaVolumeFill"></div>
                                    <div class="cinema-volume-vertical-handle" id="cinemaVolumeHandle"></div>
                                </div>
                            </div>
                        </div>

                        <div class="cinema-time" id="cinemaTime">
                            <span id="cinemaCurrentTime">0:00</span>
                            <span class="cinema-time-sep">/</span>
                            <span id="cinemaDuration">0:00</span>
                        </div>
                    </div>

                    <div class="cinema-btns-right">

                        <div class="cinema-speed-wrap">
                            <button class="cinema-btn cinema-speed-btn" id="cinemaSpeedBtn">
                                <span id="cinemaSpeedLabel">1×</span>
                            </button>
                            <div class="cinema-speed-menu" id="cinemaSpeedMenu">
                                <button data-speed="0.5">0.5×</button>
                                <button data-speed="0.75">0.75×</button>
                                <button data-speed="1" class="active">1×</button>
                                <button data-speed="1.25">1.25×</button>
                                <button data-speed="1.5">1.5×</button>
                                <button data-speed="2">2×</button>
                            </div>
                        </div>

                        <button class="cinema-btn" id="cinemaPipBtn" aria-label="صورة داخل صورة">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>
                        </button>

                        <button class="cinema-btn" id="cinemaFullBtn" aria-label="ملء الشاشة">
                            <svg class="icon-fs" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                            <svg class="icon-fs-exit" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="cinema-speed-indicator" id="cinemaSpeedIndicator">
                <span id="cinemaSpeedIndicatorText">▶▶ 10 ثوان</span>
            </div>

            <div class="cinema-volume-indicator" id="cinemaVolumeIndicator">
                <span id="cinemaVolumeIndicatorText">🔊 100%</span>
            </div>

            <div class="cinema-sleep-badge" id="cinemaSleepBadge" style="display:none;">
                🌙 <span id="sleepTimeRemaining">00:00</span>
            </div>
        </div>
    `;

    if (downloadBar && downloadButton) {
        downloadBar.style.display = "flex";
        downloadButton.href = videoPath;
        let fileName = work.title;
        if (episodeNum) fileName += ` - حلقة ${episodeNum}`;
        fileName += ".mp4";
        downloadButton.setAttribute("download", fileName);
    }

    /* =====================================================
       PLAYER LOGIC
    ===================================================== */

    const player          = document.getElementById("cinemaPlayer");
    const video           = document.getElementById("mainVideo");
    const loader          = document.getElementById("cinemaLoader");
    const loadingPercent  = document.getElementById("cinemaLoadingPercent");
    const centerBtn       = document.getElementById("cinemaCenterBtn");
    const controls        = document.getElementById("cinemaControls");

    const playBtn         = document.getElementById("cinemaPlayBtn");
    const prevBtn         = document.getElementById("cinemaPrevBtn");
    const nextBtn         = document.getElementById("cinemaNextBtn");
    const muteBtn         = document.getElementById("cinemaMuteBtn");
    const fullBtn         = document.getElementById("cinemaFullBtn");
    const pipBtn          = document.getElementById("cinemaPipBtn");
    const speedBtn        = document.getElementById("cinemaSpeedBtn");
    const speedLabel      = document.getElementById("cinemaSpeedLabel");
    const speedMenu       = document.getElementById("cinemaSpeedMenu");

    const progressWrap    = document.getElementById("cinemaProgressWrap");
    const progressPlayed  = document.getElementById("cinemaProgressPlayed");
    const progressBuffered = document.getElementById("cinemaProgressBuffered");
    const tooltip         = document.getElementById("cinemaTooltip");

    const timeCurrent     = document.getElementById("cinemaCurrentTime");
    const timeDuration    = document.getElementById("cinemaDuration");

    const volumePopup     = document.getElementById("cinemaVolumePopup");
    const volumeVertical  = document.getElementById("cinemaVolumeVertical");
    const volumeFill      = document.getElementById("cinemaVolumeFill");
    const volumeHandle    = document.getElementById("cinemaVolumeHandle");
    const volumePercent   = document.getElementById("cinemaVolumePercent");

    const speedIndicator      = document.getElementById("cinemaSpeedIndicator");
    const volumeIndicator     = document.getElementById("cinemaVolumeIndicator");

    const iconPlay   = playBtn.querySelector(".icon-play");
    const iconPause  = playBtn.querySelector(".icon-pause");
    const iconVol    = muteBtn.querySelector(".icon-vol");
    const iconMuted  = muteBtn.querySelector(".icon-muted");
    const iconFs     = fullBtn.querySelector(".icon-fs");
    const iconFsExit = fullBtn.querySelector(".icon-fs-exit");

    /* Quick action buttons */
    const qaFavorite   = document.getElementById("qaFavorite");
    const qaScreenshot = document.getElementById("qaScreenshot");
    const qaShare      = document.getElementById("qaShare");
    const qaSleep      = document.getElementById("qaSleep");
    const qaStats      = document.getElementById("qaStats");
    const qaShortcuts  = document.getElementById("qaShortcuts");

    const sleepMenu    = document.getElementById("cinemaSleepMenu");
    const statsPanel   = document.getElementById("cinemaStatsPanel");
    const statsBody    = document.getElementById("statsBody");
    const shortcutsPanel = document.getElementById("cinemaShortcutsPanel");
    const sleepBadge   = document.getElementById("cinemaSleepBadge");
    const sleepTimeRemaining = document.getElementById("sleepTimeRemaining");
    const skipIntroBtn = document.getElementById("skipIntroBtn");

    let controlsTimer = null;
    let speedIndicatorTimer = null;
    let volumeIndicatorTimer = null;
    let statsUpdateTimer = null;
    let isSeeking = false;
    let isVolumeSeeking = false;
    let sleepTimerInterval = null;
    let sleepEndTime = 0;

    /* ===== Initial volume ===== */
    video.volume = prefs.volume !== undefined ? prefs.volume : 1;
    video.muted = prefs.muted || false;

    /* ===== Cinema Player Class for cursor hiding ===== */
    function updateCursorVisibility(visible) {
        if (visible) {
            player.classList.remove("hide-cursor");
        } else if (!video.paused) {
            player.classList.add("hide-cursor");
        }
    }

    function fmt(sec) {
        if (!sec || isNaN(sec)) return "0:00";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return h > 0
            ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${m}:${String(s).padStart(2, "0")}`;
    }

    function showIndicator(el, text) {
        el.querySelector("span").textContent = text;
        el.classList.add("show");

        if (el.id === "cinemaSpeedIndicator") {
            clearTimeout(speedIndicatorTimer);
            speedIndicatorTimer = setTimeout(() => el.classList.remove("show"), 800);
        } else if (el.id === "cinemaVolumeIndicator") {
            clearTimeout(volumeIndicatorTimer);
            volumeIndicatorTimer = setTimeout(() => el.classList.remove("show"), 800);
        }
    }

    function showControls() {
        player.classList.add("controls-visible");
        updateCursorVisibility(true);
        clearTimeout(controlsTimer);
        if (!video.paused) {
            controlsTimer = setTimeout(() => {
                player.classList.remove("controls-visible");
                updateCursorVisibility(false);
            }, 3000);
        }
    }

    function togglePlay() {
        if (video.paused) video.play();
        else video.pause();
    }

    playBtn.addEventListener("click", togglePlay);
    centerBtn.addEventListener("click", togglePlay);

    video.addEventListener("play", () => {
        iconPlay.style.display  = "none";
        iconPause.style.display = "block";
        centerBtn.style.display = "none";
        showControls();

        /* Apply ambient mode if enabled */
        if (player.dataset.ambient === "true") {
            extractAmbientColor(video, player);
        }
    });

    video.addEventListener("pause", () => {
        iconPlay.style.display  = "block";
        iconPause.style.display = "none";
        centerBtn.style.display = "flex";
        player.classList.add("controls-visible");
        updateCursorVisibility(true);
        clearTimeout(controlsTimer);
    });

    function updateProgress() {
        if (!video.duration || isSeeking) return;
        const p = (video.currentTime / video.duration) * 100;
        progressPlayed.style.width = p + "%";
        timeCurrent.textContent = fmt(video.currentTime);
    }

    video.addEventListener("timeupdate", updateProgress);

    video.addEventListener("loadedmetadata", () => {
        timeDuration.textContent = fmt(video.duration);

        /* Jump to start time from URL (?t=xx) */
        if (startTime > 0 && startTime < video.duration) {
            video.currentTime = startTime;
            showToast(`⏩ تم الانتقال إلى ${fmt(startTime)}`, "info", 2000);
        }

        /* Apply saved speed */
        if (prefs.speed && prefs.speed !== 1) {
            video.playbackRate = prefs.speed;
            speedLabel.textContent = prefs.speed + "×";
            speedMenu.querySelectorAll("button").forEach(b => {
                b.classList.toggle("active", parseFloat(b.dataset.speed) === prefs.speed);
            });
        }

        updateProgress();
    });

    video.addEventListener("progress", () => {
        if (video.buffered.length > 0) {
            const buffered = video.buffered.end(video.buffered.length - 1);
            const p = (buffered / video.duration) * 100;
            progressBuffered.style.width = p + "%";

            /* Loading percentage */
            if (video.buffered.length > 0 && video.duration) {
                const loaded = Math.round((buffered / video.duration) * 100);
                if (loadingPercent && loaded < 100) {
                    loadingPercent.textContent = loaded + "%";
                }
            }
        }
    });

    /* ===== Seeking ===== */
    function seekTo(e) {
        const rect = progressWrap.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const p = x / rect.width;
        video.currentTime = p * video.duration;
    }

    progressWrap.addEventListener("mousedown", (e) => {
        isSeeking = true;
        seekTo(e);
        const onMove = (ev) => seekTo(ev);
        const onUp = () => {
            isSeeking = false;
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    });

    progressWrap.addEventListener("mousemove", (e) => {
        const rect = progressWrap.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const p = x / rect.width;
        const t = p * video.duration;
        tooltip.textContent = fmt(t);
        tooltip.style.left = x + "px";
        tooltip.classList.add("show");
    });

    progressWrap.addEventListener("mouseleave", () => {
        tooltip.classList.remove("show");
    });

    /* ===== Seek Buttons ===== */
    prevBtn.addEventListener("click", () => {
        video.currentTime = Math.max(0, video.currentTime - 10);
        showIndicator(speedIndicator, "◀◀ 10 ثوان");
    });

    nextBtn.addEventListener("click", () => {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        showIndicator(speedIndicator, "▶▶ 10 ثوان");
    });

    /* ===== Volume ===== */
    function updateVolumeUI() {
        const v = video.muted ? 0 : video.volume;
        const percentVal = Math.round(v * 100);

        volumeFill.style.height = percentVal + "%";
        volumeHandle.style.bottom = `calc(${percentVal}% - 7px)`;
        volumePercent.textContent = percentVal + "%";

        if (video.muted || video.volume === 0) {
            iconVol.style.display = "none";
            iconMuted.style.display = "block";
        } else {
            iconVol.style.display = "block";
            iconMuted.style.display = "none";
        }

        setPref("volume", video.volume);
        setPref("muted", video.muted);
    }

    muteBtn.addEventListener("click", () => {
        video.muted = !video.muted;
        updateVolumeUI();
        showIndicator(volumeIndicator, video.muted ? "🔇 مكتوم" : "🔊 " + Math.round(video.volume * 100) + "%");
    });

    function seekVolume(e) {
        const rect = volumeVertical.getBoundingClientRect();
        let y = rect.bottom - e.clientY;
        y = Math.max(0, Math.min(y, rect.height));
        const v = y / rect.height;
        video.volume = v;
        video.muted = v === 0;
        updateVolumeUI();

        clearTimeout(volumeIndicatorTimer);
        volumeIndicator.querySelector("span").textContent = "🔊 " + Math.round(v * 100) + "%";
        volumeIndicator.classList.add("show");
    }

    volumeVertical.addEventListener("mousedown", (e) => {
        isVolumeSeeking = true;
        seekVolume(e);
        const onMove = (ev) => { if (isVolumeSeeking) seekVolume(ev); };
        const onUp = () => {
            isVolumeSeeking = false;
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            clearTimeout(volumeIndicatorTimer);
            volumeIndicatorTimer = setTimeout(() => volumeIndicator.classList.remove("show"), 800);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    });

    muteBtn.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        video.volume = Math.max(0, Math.min(1, video.volume + delta));
        video.muted = video.volume === 0;
        updateVolumeUI();
        showIndicator(volumeIndicator, "🔊 " + Math.round(video.volume * 100) + "%");
    });

    video.addEventListener("volumechange", updateVolumeUI);

    /* ===== Speed ===== */
    speedBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        speedMenu.classList.toggle("active");
    });

    speedMenu.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const speed = parseFloat(btn.dataset.speed);
            video.playbackRate = speed;
            speedLabel.textContent = speed + "×";
            speedMenu.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            speedMenu.classList.remove("active");
            showIndicator(speedIndicator, "⚡ " + speed + "×");
            setPref("speed", speed);
        });
    });

    document.addEventListener("click", (e) => {
        if (!speedMenu.contains(e.target) && e.target !== speedBtn) {
            speedMenu.classList.remove("active");
        }
    });

    /* ===== Picture in Picture ===== */
    pipBtn.addEventListener("click", async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch (err) {
            console.log("PiP غير مدعوم:", err);
            showToast("⚠️ صورة داخل صورة غير مدعومة", "warning");
        }
    });

    video.addEventListener("enterpictureinpicture", () => {
        showToast("🎬 تم تفعيل صورة داخل صورة", "info", 2000);
    });

    /* ===== Fullscreen ===== */
    fullBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            (player.requestFullscreen || player.webkitRequestFullscreen).call(player);
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        }
    });

    document.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement) {
            iconFs.style.display = "none";
            iconFsExit.style.display = "block";
        } else {
            iconFs.style.display = "block";
            iconFsExit.style.display = "none";
        }
    });

    /* ===== Loader ===== */
    video.addEventListener("waiting", () => loader.classList.add("active"));
    video.addEventListener("canplay", () => {
        loader.classList.remove("active");
        loadingPercent.textContent = "";
    });
    video.addEventListener("playing", () => {
        loader.classList.remove("active");
        loadingPercent.textContent = "";
    });

    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    /* Favorite */
    qaFavorite.addEventListener("click", () => {
        const nowFav = toggleFavorite({
            id: work.id,
            title: work.title,
            poster: work.poster,
            type: work.type,
            year: work.year
        });
        qaFavorite.textContent = nowFav ? "⭐" : "☆";
        showToast(nowFav ? "⭐ تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة", "success");
    });

    /* Screenshot */
    qaScreenshot.addEventListener("click", () => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `wolfcinema_${work.title.replace(/\s+/g, "_")}_${fmt(video.currentTime).replace(/:/g, "-")}.png`;
                a.click();
                URL.revokeObjectURL(url);
                showToast("📸 تم حفظ اللقطة", "success");
            }, "image/png");
        } catch (e) {
            showToast("⚠️ تعذّر التقاط اللقطة (CORS)", "warning");
        }
    });

    /* Share */
    qaShare.addEventListener("click", async () => {
        const t = Math.floor(video.currentTime);
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${workId}${episodeNum ? "&ep=" + episodeNum : ""}${currentSeason > 1 ? "&season=" + currentSeason : ""}&t=${t}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: work.title,
                    text: `شاهد "${work.title}" على WOLFCINEMA`,
                    url: shareUrl
                });
            } catch (e) {}
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showToast("🔗 تم نسخ الرابط (يبدأ من " + fmt(t) + ")", "success");
            } catch (e) {
                showToast("⚠️ تعذّر النسخ", "warning");
            }
        }
    });

    /* Sleep Timer */
    qaSleep.addEventListener("click", (e) => {
        e.stopPropagation();
        sleepMenu.classList.toggle("active");
    });

    sleepMenu.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const min = parseInt(btn.dataset.min);
            if (min === 0) {
                clearInterval(sleepTimerInterval);
                sleepEndTime = 0;
                sleepBadge.style.display = "none";
                showToast("🌙 تم إلغاء مؤقت النوم", "info");
            } else {
                sleepEndTime = Date.now() + (min * 60 * 1000);
                sleepBadge.style.display = "flex";
                if (sleepTimerInterval) clearInterval(sleepTimerInterval);
                updateSleepTimer();
                sleepTimerInterval = setInterval(updateSleepTimer, 1000);
                showToast(`🌙 سيتوقف التشغيل بعد ${min} دقيقة`, "info");
            }
            sleepMenu.classList.remove("active");
        });
    });

    function updateSleepTimer() {
        const remaining = Math.max(0, sleepEndTime - Date.now());
        if (remaining <= 0) {
            clearInterval(sleepTimerInterval);
            video.pause();
            sleepBadge.style.display = "none";
            showToast("🌙 انتهى مؤقت النوم - تم الإيقاف", "info", 4000);
            return;
        }
        const min = Math.floor(remaining / 60000);
        const sec = Math.floor((remaining % 60000) / 1000);
        sleepTimeRemaining.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }

    /* Stats */
    qaStats.addEventListener("click", (e) => {
        e.stopPropagation();
        statsPanel.classList.toggle("active");
        if (statsPanel.classList.contains("active")) {
            updateStats();
            statsUpdateTimer = setInterval(updateStats, 1000);
        } else {
            clearInterval(statsUpdateTimer);
        }
    });

    document.getElementById("closeStatsBtn").addEventListener("click", () => {
        statsPanel.classList.remove("active");
        clearInterval(statsUpdateTimer);
    });

    function updateStats() {
        const buffered = video.buffered.length > 0
            ? video.buffered.end(video.buffered.length - 1)
            : 0;

        const droppedFrames = video.getVideoPlaybackQuality
            ? video.getVideoPlaybackQuality().droppedVideoFrames
            : "N/A";
        const totalFrames = video.getVideoPlaybackQuality
            ? video.getVideoPlaybackQuality().totalVideoFrames
            : "N/A";

        const res = video.videoWidth && video.videoHeight
            ? `${video.videoWidth}×${video.videoHeight}`
            : "غير معروف";

        const bandwidth = navigator.connection
            ? (navigator.connection.downlink + " Mbps")
            : "غير معروف";

        statsBody.innerHTML = `
            <div class="stat-row"><span>الدقة</span><strong>${res}</strong></div>
            <div class="stat-row"><span>الوقت الحالي</span><strong>${fmt(video.currentTime)}</strong></div>
            <div class="stat-row"><span>المدة</span><strong>${fmt(video.duration)}</strong></div>
            <div class="stat-row"><span>المخزّن مؤقتًا</span><strong>${fmt(buffered)}</strong></div>
            <div class="stat-row"><span>سرعة التشغيل</span><strong>${video.playbackRate}×</strong></div>
            <div class="stat-row"><span>مستوى الصوت</span><strong>${Math.round(video.volume * 100)}%</strong></div>
            <div class="stat-row"><span>الإطارات المُسقطة</span><strong>${droppedFrames} / ${totalFrames}</strong></div>
            <div class="stat-row"><span>عرض النطاق</span><strong>${bandwidth}</strong></div>
            <div class="stat-row"><span>الحالة</span><strong>${video.paused ? "⏸ متوقف" : "▶ يعمل"}</strong></div>
        `;
    }

    /* Shortcuts Panel */
    qaShortcuts.addEventListener("click", (e) => {
        e.stopPropagation();
        shortcutsPanel.classList.toggle("active");
    });

    document.getElementById("closeShortcutsBtn").addEventListener("click", () => {
        shortcutsPanel.classList.remove("active");
    });

    /* Close menus on outside click */
    document.addEventListener("click", (e) => {
        if (!sleepMenu.contains(e.target) && e.target !== qaSleep) {
            sleepMenu.classList.remove("active");
        }
    });

    /* =====================================================
       SKIP INTRO
    ===================================================== */

    /* Configurable skip interval - default: first 90 seconds */
    const SKIP_INTRO_END = 90;
    let skipIntroShown = false;

    video.addEventListener("timeupdate", () => {
        if (skipIntroShown) return;
        if (video.currentTime > 2 && video.currentTime < SKIP_INTRO_END) {
            skipIntroBtn.style.display = "block";
        } else if (video.currentTime >= SKIP_INTRO_END) {
            skipIntroBtn.style.display = "none";
            skipIntroShown = true;
        }
    });

    skipIntroBtn.addEventListener("click", () => {
        video.currentTime = SKIP_INTRO_END;
        skipIntroBtn.style.display = "none";
        skipIntroShown = true;
        showToast("⏭ تم تخطي المقدمة", "info", 1500);
    });

    /* =====================================================
       TOUCH GESTURES (Mobile)
    ===================================================== */

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchStartVolume = 0;
    let touchStartBrightness = 1;
    let gestureMode = null;
    let lastTapTime = 0;
    let touchMoved = false;

    const gestureLeft = document.getElementById("gestureLeft");
    const gestureRight = document.getElementById("gestureRight");
    const gestureVolume = document.getElementById("gestureVolume");
    const gestureBrightness = document.getElementById("gestureBrightness");

    function showGesture(el, icon, text) {
        el.querySelector(".gesture-icon").textContent = icon;
        el.querySelector(".gesture-value").textContent = text;
        el.classList.add("show");
    }

    function hideGestures() {
        [gestureLeft, gestureRight, gestureVolume, gestureBrightness].forEach(g => {
            g.classList.remove("show");
        });
    }

    player.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        touchStartVolume = video.volume;
        touchMoved = false;
        gestureMode = null;

        const rect = player.getBoundingClientRect();
        const xPercent = (touch.clientX - rect.left) / rect.width;
        const yPercent = (touch.clientY - rect.top) / rect.height;

        /* Top-right = brightness zone */
        if (yPercent < 0.5 && xPercent > 0.5) {
            gestureMode = "brightness";
        }
        /* Top-left = volume zone */
        else if (yPercent < 0.5 && xPercent < 0.5) {
            gestureMode = "volume";
        }
    }, { passive: true });

    player.addEventListener("touchmove", (e) => {
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            touchMoved = true;
        }

        /* Horizontal = seek */
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
            const rect = player.getBoundingClientRect();
            const percent = dx / rect.width;
            const seekAmount = percent * 90; // Max 90 seconds
            const seekTo = Math.max(0, Math.min(video.duration, video.currentTime + seekAmount));
            const diff = seekTo - video.currentTime;

            if (diff > 0) {
                showGesture(gestureRight, "⏩", `+${Math.round(diff)}s`);
            } else {
                showGesture(gestureLeft, "⏪", `${Math.round(diff)}s`);
            }
        }
        /* Vertical (volume) */
        else if (gestureMode === "volume" && Math.abs(dy) > 30) {
            const rect = player.getBoundingClientRect();
            const change = -dy / rect.height;
            const newVol = Math.max(0, Math.min(1, touchStartVolume + change));
            video.volume = newVol;
            video.muted = newVol === 0;
            updateVolumeUI();
            showGesture(gestureVolume, newVol === 0 ? "🔇" : "🔊", Math.round(newVol * 100) + "%");
        }
        /* Vertical (brightness - visual only) */
        else if (gestureMode === "brightness" && Math.abs(dy) > 30) {
            const rect = player.getBoundingClientRect();
            const change = -dy / rect.height;
            const newBright = Math.max(0.3, Math.min(1, touchStartBrightness + change));
            player.style.filter = `brightness(${newBright})`;
            showGesture(gestureBrightness, "☀️", Math.round(newBright * 100) + "%");
        }
    }, { passive: true });

    player.addEventListener("touchend", (e) => {
        const touchDuration = Date.now() - touchStartTime;

        /* Double tap detection */
        if (!touchMoved && touchDuration < 300) {
            const now = Date.now();
            if (now - lastTapTime < 300) {
                /* Double tap */
                const touch = e.changedTouches[0];
                const rect = player.getBoundingClientRect();
                const xPercent = (touch.clientX - rect.left) / rect.width;

                if (xPercent < 0.3) {
                    /* Left side - rewind */
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    showGesture(gestureLeft, "⏪", "10s");
                    setTimeout(hideGestures, 500);
                } else if (xPercent > 0.7) {
                    /* Right side - forward */
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    showGesture(gestureRight, "⏩", "10s");
                    setTimeout(hideGestures, 500);
                } else {
                    /* Center - toggle play */
                    togglePlay();
                }
                lastTapTime = 0;
                return;
            }
            lastTapTime = now;
        }

        /* Single tap toggles controls */
        if (!touchMoved && touchDuration < 300) {
            if (player.classList.contains("controls-visible")) {
                player.classList.remove("controls-visible");
                updateCursorVisibility(false);
            } else {
                showControls();
            }
        }

        setTimeout(hideGestures, 300);
    }, { passive: true });

    /* =====================================================
       KEYBOARD SHORTCUTS
    ===================================================== */

    document.addEventListener("keydown", (e) => {

        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

        switch (e.key) {

            case " ":
            case "k":
            case "K":
                e.preventDefault();
                togglePlay();
                break;

            case "j":
            case "J":
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 10);
                showIndicator(speedIndicator, "◀◀ 10 ثوان");
                showControls();
                break;

            case "l":
            case "L":
                e.preventDefault();
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
                showIndicator(speedIndicator, "▶▶ 10 ثوان");
                showControls();
                break;

            case "ArrowRight":
                e.preventDefault();
                video.currentTime = Math.min(video.duration, video.currentTime + 5);
                showIndicator(speedIndicator, "▶ 5 ثوان");
                showControls();
                break;

            case "ArrowLeft":
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 5);
                showIndicator(speedIndicator, "◀ 5 ثوان");
                showControls();
                break;

            case "ArrowUp":
                e.preventDefault();
                video.volume = Math.min(1, video.volume + 0.05);
                video.muted = false;
                updateVolumeUI();
                showIndicator(volumeIndicator, "🔊 " + Math.round(video.volume * 100) + "%");
                showControls();
                break;

            case "ArrowDown":
                e.preventDefault();
                video.volume = Math.max(0, video.volume - 0.05);
                if (video.volume === 0) video.muted = true;
                updateVolumeUI();
                showIndicator(volumeIndicator, "🔊 " + Math.round(video.volume * 100) + "%");
                showControls();
                break;

            case "m":
            case "M":
                e.preventDefault();
                video.muted = !video.muted;
                updateVolumeUI();
                showIndicator(volumeIndicator, video.muted ? "🔇 مكتوم" : "🔊 " + Math.round(video.volume * 100) + "%");
                break;

            case "f":
            case "F":
                e.preventDefault();
                if (!document.fullscreenElement) player.requestFullscreen();
                else document.exitFullscreen();
                break;

            case "Escape":
                if (document.fullscreenElement) document.exitFullscreen();
                if (document.pictureInPictureElement) document.exitPictureInPicture();
                break;

            case "c":
            case "C":
                /* Placeholder for captions */
                showToast("ℹ️ الترجمات غير متوفرة", "info");
                break;

            case "?":
                e.preventDefault();
                shortcutsPanel.classList.toggle("active");
                break;

            default:
                if (e.key >= "0" && e.key <= "9") {
                    const p = parseInt(e.key) / 10;
                    video.currentTime = p * video.duration;
                    showIndicator(speedIndicator, "⏩ " + (p * 100) + "%");
                }
        }

        showControls();
    });

    player.addEventListener("mousemove", showControls);
    player.addEventListener("mouseleave", () => {
        if (!video.paused) {
            player.classList.remove("controls-visible");
            updateCursorVisibility(false);
        }
    });

    video.addEventListener("dblclick", () => {
        if (!document.fullscreenElement) player.requestFullscreen();
        else document.exitFullscreen();
    });

    /* =====================================================
       PROGRESS SAVING
    ===================================================== */

    const resumeBtn    = document.getElementById("resumeBtn");
    const restartBtn   = document.getElementById("restartBtn");
    const resumeBanner = document.getElementById("resumeBanner");

    if (resumeBtn) {
        resumeBtn.addEventListener("click", () => {
            video.currentTime = savedTime;
            video.play();
            if (resumeBanner) resumeBanner.style.display = "none";
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener("click", () => {
            video.currentTime = 0;
            video.play();
            if (resumeBanner) resumeBanner.style.display = "none";
        });
    }

    let lastSave = 0;

    function saveProgress(force = false) {
        const now = Date.now();
        if (!force && now - lastSave < 3000) return;
        lastSave = now;

        if (!video.duration || isNaN(video.duration)) return;

        if (video.currentTime >= video.duration - 2) {
            removeHistoryEntry(workId, episodeNum, currentSeason);
            return;
        }

        if (video.currentTime < 5) return;

        upsertHistoryEntry({
            workId: workId,
            workTitle: work.title.replace(/ — (موسم \d+ )?حلقة \d+$/, ""),
            episodeNumber: episodeNum || null,
            seasonNumber: currentSeason || 1,
            episodeTitle: work.episodeTitle || null,
            currentTime: video.currentTime,
            duration: video.duration,
            poster: posterPath,
            type: work.type || "",
            timestamp: Date.now()
        });
    }

    video.addEventListener("timeupdate", () => saveProgress());
    video.addEventListener("pause", () => saveProgress(true));
    window.addEventListener("beforeunload", () => saveProgress(true));

    video.addEventListener("play", () => {
        if (resumeBanner) resumeBanner.style.display = "none";
    });

    /* =====================================================
       ERROR HANDLING with RETRY
    ===================================================== */

    let retryCount = 0;
    const MAX_RETRIES = 3;

    video.addEventListener("error", () => {
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            showToast(`⚠️ محاولة إعادة التحميل (${retryCount}/${MAX_RETRIES})...`, "warning");
            setTimeout(() => {
                video.load();
                video.play().catch(() => {});
            }, 2000);
            return;
        }

        videoContainer.innerHTML = `
            <div class="video-error">
                <h2>🎬 الفيديو غير متوفر حالياً</h2>
                <p>الملف المطلوب غير موجود على السيرفر أو حدث خطأ في الاتصال.</p>
                <a href="javascript:history.back()" class="btn btn-back">← رجوع</a>
                <button class="btn btn-back" onclick="location.reload()" style="margin-right:10px;">🔄 إعادة المحاولة</button>
            </div>`;
    });

    /* =====================================================
       NEXT EPISODE
    ===================================================== */

    let nextEpisodeData = null;

    if (episodeNum && apiWork && apiWork.episodes && apiWork.episodes.length > 0) {
        const sortedEps = [...apiWork.episodes].sort((a, b) => {
            const sa = a.season || 1;
            const sb = b.season || 1;
            if (sa !== sb) return sa - sb;
            return a.number - b.number;
        });

        const currentIdx = sortedEps.findIndex(e => {
            const sameEp = String(e.number) === String(episodeNum);
            if (!sameEp) return false;
            if (seasonNum) return String(e.season || 1) === String(seasonNum);
            return true;
        });

        if (currentIdx !== -1 && currentIdx < sortedEps.length - 1) {
            nextEpisodeData = sortedEps[currentIdx + 1];
        }
    }

    if (nextEpisodeData) {
        let countdownTimer = null;
        let countdownValue = 10;
        const nextSeason = nextEpisodeData.season || 1;

        const nextOverlay = document.createElement("div");
        nextOverlay.className = "next-episode-overlay";
        nextOverlay.id = "nextEpisodeOverlay";

        const seasonText = nextSeason > 1 ? `م${nextSeason} • ` : "";

        nextOverlay.innerHTML = `
            <div class="next-episode-card">
                <div class="next-episode-badge">⏭️ الحلقة التالية</div>
                <div class="next-episode-content">
                    <div class="next-episode-thumb">
                        <img src="${posterPath}" alt="الحلقة التالية">
                        <div class="next-episode-thumb-overlay">
                            <span class="next-episode-play">▶</span>
                        </div>
                    </div>
                    <div class="next-episode-info">
                        <h3>${seasonText}حلقة ${nextEpisodeData.number}</h3>
                        <p class="next-episode-title-text">${nextEpisodeData.title || "بدون عنوان"}</p>
                    </div>
                </div>
                <div class="next-episode-countdown">
                    <span>تبدأ خلال</span>
                    <strong id="nextCountdownNum">10</strong>
                    <span>ثانية</span>
                    <div class="countdown-ring">
                        <svg viewBox="0 0 60 60">
                            <circle class="countdown-bg" cx="30" cy="30" r="26"></circle>
                            <circle class="countdown-progress" id="nextCountdownProgress" cx="30" cy="30" r="26"></circle>
                        </svg>
                    </div>
                </div>
                <div class="next-episode-actions">
                    <button class="next-btn next-btn-primary" id="nextWatchBtn">▶ شغّل الآن</button>
                    <button class="next-btn next-btn-secondary" id="nextCancelBtn">✕ إلغاء</button>
                </div>
            </div>
        `;

        player.appendChild(nextOverlay);

        function goToNextEpisode() {
            clearInterval(countdownTimer);
            let url = `watch.html?id=${workId}`;
            if (nextSeason > 1) url += `&season=${nextSeason}`;
            url += `&ep=${nextEpisodeData.number}`;
            window.location.href = url;
        }

        function startCountdown() {
            countdownValue = 10;
            const numEl = document.getElementById("nextCountdownNum");
            const progressEl = document.getElementById("nextCountdownProgress");
            if (numEl) numEl.textContent = countdownValue;

            const circumference = 163.36;
            if (progressEl) {
                progressEl.style.strokeDasharray = circumference;
                progressEl.style.strokeDashoffset = 0;
            }

            countdownTimer = setInterval(() => {
                countdownValue--;
                if (numEl) numEl.textContent = countdownValue;
                if (progressEl) {
                    const offset = ((10 - countdownValue) / 10) * circumference;
                    progressEl.style.strokeDashoffset = offset;
                }
                if (countdownValue <= 0) {
                    clearInterval(countdownTimer);
                    goToNextEpisode();
                }
            }, 1000);
        }

        function cancelCountdown() {
            clearInterval(countdownTimer);
            nextOverlay.classList.remove("active");
        }

        video.addEventListener("ended", () => {
            nextOverlay.classList.add("active");
            startCountdown();
        });

        document.getElementById("nextWatchBtn").addEventListener("click", goToNextEpisode);
        document.getElementById("nextCancelBtn").addEventListener("click", cancelCountdown);

        video.addEventListener("play", () => {
            if (nextOverlay.classList.contains("active")) cancelCountdown();
        });
    }

    /* =====================================================
       INFO SECTION
    ===================================================== */

    if (watchInfo) {
        let episodeTitleHTML = "";
        if (episodeNum && work.episodeTitle) {
            const seasonText = (currentSeason > 1) ? `م${currentSeason} • ` : "";
            episodeTitleHTML = `<p style="color:#e50914;font-weight:700;margin-bottom:10px;">${seasonText}حلقة ${episodeNum}: ${work.episodeTitle}</p>`;
        }

        watchInfo.innerHTML = `
            <div class="watch-info-box">
                <img src="${posterPath}" alt="${work.title}" class="watch-info-poster"
                     onerror="this.src='../assets/images/placeholder.jpg'">
                <div class="watch-info-text">
                    <h2>${work.title}</h2>
                    ${episodeTitleHTML}
                    <p>${work.description}</p>
                </div>
            </div>`;
    }

    /* ===== Init ===== */
    updateVolumeUI();

    console.log("🎬 WOLFCINEMA WATCH v2 loaded:", work.title);
});