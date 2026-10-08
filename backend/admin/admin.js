/* =====================================================
   WOLFCINEMA ADMIN PANEL — PRO
===================================================== */

const API = "http://localhost:3000/api";

let currentWorkId = null;
let selectedGenres = [];
let editingWorkId = null;
let allWorks = [];

/* =====================================================
   التصنيفات
===================================================== */

const GENRE_GROUPS = {

    "أنواع عامة": [
        "أكشن", "دراما", "كوميديا", "رومانسي", "إثارة", "غموض",
        "جريمة", "مغامرة", "فانتازيا", "خيال علمي", "رعب",
        "وثائقي", "تاريخي", "سيرة ذاتية", "عائلي", "موسيقي",
        "رياضي", "حربي", "نفسي"
    ],

    "أنواع فنية": [
        "فنون قتالية", "ساموراي", "نينجا", "قراصنة", "ميكا",
        "سيوف", "سحر", "شياطين", "أبطال خارقون", "خوارق",
        "زومبي", "مصاصو دماء", "أساطير"
    ],

    "أنواع فرعية": [
        "فانتازيا مظلمة", "خيال علمي مظلم", "دراما نفسية",
        "إثارة نفسية", "غموض بوليسي", "جريمة منظمة", "تجسس",
        "سرقة", "انتقام", "بقاء", "كوارث", "نهاية العالم",
        "سفر بالزمن", "فضاء", "ديس نوفا", "أكشن مفرط",
        "شونين", "سينين", "شوجو", "إيسيكاي"
    ],

    "تصنيفات عربية": [
        "اجتماعي", "أكشن عربي", "كوميديا عربية", "دراما عربية",
        "بوليسي", "إجرامي", "تاريخي عربي", "ديني", "كوميدي رومانسي"
    ],

    "جمهور": [
        "+18", "+16", "+13", "عائلي", "أطفال", "مراهقين"
    ]
};

/* =====================================================
   بناء واجهة اختيار التصنيفات
===================================================== */

function buildGenreSelector(filterText = "") {

    const container = document.getElementById("genreSelector");
    if (!container) return;

    container.innerHTML = "";

    Object.keys(GENRE_GROUPS).forEach(groupName => {

        const allGenres = GENRE_GROUPS[groupName];

        const filtered = filterText
            ? allGenres.filter(g => g.includes(filterText))
            : allGenres;

        if (!filtered.length) return;

        const group = document.createElement("div");
        group.className = "genre-group";

        group.innerHTML = `
            <div class="genre-group-title">${groupName}</div>
            <div class="genre-chips"></div>
        `;

        const chipsBox = group.querySelector(".genre-chips");

        filtered.forEach(genre => {

            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "genre-chip";

            if (selectedGenres.includes(genre)) {
                chip.classList.add("selected");
            }

            chip.textContent = genre;

            chip.addEventListener("click", () => {

                const idx = selectedGenres.indexOf(genre);

                if (idx === -1) {
                    selectedGenres.push(genre);
                } else {
                    selectedGenres.splice(idx, 1);
                }

                chip.classList.toggle("selected");
                renderSelectedGenres();
            });

            chipsBox.appendChild(chip);
        });

        container.appendChild(group);
    });
}

/* =====================================================
   عرض التصنيفات المختارة
===================================================== */

function renderSelectedGenres() {

    const list = document.getElementById("selectedGenresList");
    if (!list) return;

    if (!selectedGenres.length) {
        list.innerHTML = '<span class="no-genres">لم تختر أي تصنيف</span>';
        return;
    }

    list.innerHTML = selectedGenres.map(g => `
        <span class="selected-genre-tag">
            ${g}
            <button type="button" data-genre="${g}">✕</button>
        </span>
    `).join("");

    list.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const genre = btn.dataset.genre;
            selectedGenres = selectedGenres.filter(g => g !== genre);
            buildGenreSelector(document.getElementById("genreSearchInput").value);
            renderSelectedGenres();
        });
    });
}

document.getElementById("genreSearchInput").addEventListener("input", (e) => {
    buildGenreSelector(e.target.value.trim());
});

/* =====================================================
   PARENT SERIES — تحميل قائمة الأعمال اللي تنفع تكون أب
===================================================== */

async function loadParentsOptions() {

    try {

        const res = await fetch(API + "/parents");
        if (!res.ok) throw new Error("فشل تحميل الآباء");

        const parents = await res.json();

        const addSelect  = document.getElementById("addParentSelect");
        const editSelect = document.getElementById("editParentSelect");

        const optionsHTML = `
            <option value="">— لا، عمل مستقل —</option>
            ${parents.map(p => `
                <option value="${p.id}">
                    ${p.title} ${p.year ? "(" + p.year + ")" : ""} — ${p.type || ""}
                </option>
            `).join("")}
        `;

        if (addSelect)  addSelect.innerHTML  = optionsHTML;
        if (editSelect) editSelect.innerHTML = optionsHTML;

        console.log("✅ تم تحميل", parents.length, "عمل يمكن أن يكون أب");

    } catch (err) {
        console.error("❌ خطأ في تحميل الآباء:", err);
    }
}

/* =====================================================
   TABS
===================================================== */

document.querySelectorAll(".nav-item[data-tab]").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        showTab(link.dataset.tab);
        if (link.dataset.tab === "list") loadWorks();
        if (link.dataset.tab === "dashboard") loadStats();
    });
});

document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.goto;
        showTab(target);
        if (target === "list") loadWorks();
    });
});

function showTab(tabName) {
    document.querySelectorAll(".nav-item").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    const tab = document.getElementById("tab-" + tabName);
    if (tab) tab.classList.add("active");

    const navLink = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (navLink) navLink.classList.add("active");
}

/* =====================================================
   TOAST
===================================================== */

function toast(msg, type = "success") {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast show " + type;
    setTimeout(() => el.classList.remove("show"), 3500);
}

/* =====================================================
   PREVIEW
===================================================== */

document.getElementById("posterInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById("posterPreview");
    preview.innerHTML = "";
    if (file) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        preview.appendChild(img);
    }
});

document.getElementById("videoInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    document.getElementById("videoName").textContent = file ? "🎥 " + file.name : "";
});

document.getElementById("episodeVideoInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    document.getElementById("episodeVideoName").textContent = file ? "🎥 " + file.name : "";
});

/* =====================================================
   إضافة عمل
===================================================== */

document.getElementById("addForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector(".submit-btn");
    const formData = new FormData(form);

    /* دمج التصنيفات المختارة */
    const genreString = selectedGenres.join(" • ");
    formData.set("genre", genreString);

    btn.disabled = true;
    btn.textContent = "⏳ جاري الرفع...";

    try {
        const res = await fetch(API + "/works", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "حدث خطأ");

        toast("✅ تمت إضافة العمل بنجاح", "success");

        form.reset();
        selectedGenres = [];
        buildGenreSelector();
        renderSelectedGenres();
        document.getElementById("posterPreview").innerHTML = "";
        document.getElementById("videoName").textContent = "";
        document.getElementById("genreSearchInput").value = "";

        /* إعادة تحميل قائمة الآباء */
        loadParentsOptions();

    } catch (err) {
        toast("❌ " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "💾 حفظ العمل";
    }
});

/* =====================================================
   تحميل إحصائيات
===================================================== */

async function loadStats() {
    try {
        const res = await fetch(API + "/works");
        const works = await res.json();

        const total = works.length;
        const movies = works.filter(w => w.type === "فيلم").length;
        const series = works.filter(w => w.type === "مسلسل").length;
        const anime = works.filter(w => w.type === "أنمي").length;
        const featured = works.filter(w => w.featured === 1).length;

        let episodes = 0;
        for (const w of works) {
            try {
                const r = await fetch(`${API}/works/${w.id}`);
                const d = await r.json();
                episodes += (d.episodes || []).length;
            } catch (e) {}
        }

        document.getElementById("statTotal").textContent = total;
        document.getElementById("statMovies").textContent = movies;
        document.getElementById("statSeries").textContent = series;
        document.getElementById("statAnime").textContent = anime;
        document.getElementById("statEpisodes").textContent = episodes;
        document.getElementById("statFeatured").textContent = featured;

    } catch (err) {
        console.error("Stats error:", err);
    }
}

/* =====================================================
   تحميل الأعمال
===================================================== */

async function loadWorks() {

    const grid = document.getElementById("worksGrid");
    grid.innerHTML = "<div class='empty'>⏳ جاري التحميل...</div>";

    try {
        const res = await fetch(API + "/works");
        allWorks = await res.json();

        renderWorks(allWorks);

    } catch (err) {
        grid.innerHTML = "<div class='empty'>❌ تعذّر تحميل الأعمال</div>";
    }
}

function renderWorks(works) {

    const grid = document.getElementById("worksGrid");

    if (!works.length) {
        grid.innerHTML = "<div class='empty'>لا توجد أعمال مطابقة</div>";
        return;
    }

    grid.innerHTML = works.map(w => {

        const isMovie = String(w.type || "").trim() === "فيلم";
        const epCount = w.episode_count || 0;
        const seasonCount = w.season_count || 0;
        const isSeason = w.parent_id !== null && w.parent_id !== undefined;

        const posterSrc = w.poster
            ? (w.poster.startsWith("http") ? w.poster : "http://localhost:3000/" + w.poster)
            : "https://via.placeholder.com/300x450/12121a/e50914?text=No+Poster";

        return `
        <div class="work-card ${isSeason ? "is-season" : ""}">

            <img src="${posterSrc}"
                 alt="${w.title}"
                 onerror="this.src='https://via.placeholder.com/300x450/12121a/e50914?text=No+Poster'">

            ${isSeason ? `<div class="season-badge">موسم ${w.season_number || "?"}</div>` : ""}

            <div class="work-card-info">
                <h3>${w.title}</h3>
                <div class="meta">
                    <span class="type-badge">${w.type || "-"}</span>
                    <span>${w.year || "-"}</span>
                    ${w.featured === 1 ? '<span class="featured-badge">⭐</span>' : ""}
                    ${seasonCount > 0 ? `<span class="season-count-badge">📺 ${seasonCount} موسم</span>` : ""}
                </div>
                <div class="card-buttons">
                    <button class="btn-small btn-edit" data-id="${w.id}">
                        ✏️ تعديل
                    </button>
                    ${isMovie && !seasonCount ? "" : `
                        <button class="btn-small btn-episodes" data-id="${w.id}" data-title="${w.title}">
                            📺 ${epCount > 0 ? "(" + epCount + ")" : ""}
                        </button>
                    `}
                    <button class="btn-small btn-delete" data-id="${w.id}">
                        🗑
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join("");

    grid.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });

    grid.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", () => deleteWork(btn.dataset.id));
    });

    grid.querySelectorAll(".btn-episodes").forEach(btn => {
        btn.addEventListener("click", () => openEpisodes(btn.dataset.id, btn.dataset.title));
    });
}

/* =====================================================
   بحث وفلترة الأعمال
===================================================== */

document.getElementById("worksSearch").addEventListener("input", filterWorks);
document.getElementById("worksFilter").addEventListener("change", filterWorks);

function filterWorks() {

    const search = document.getElementById("worksSearch").value.trim().toLowerCase();
    const type = document.getElementById("worksFilter").value;

    let filtered = allWorks;

    if (type) {
        filtered = filtered.filter(w => w.type === type);
    }

    if (search) {
        filtered = filtered.filter(w =>
            (w.title || "").toLowerCase().includes(search)
        );
    }

    renderWorks(filtered);
}

/* =====================================================
   حذف عمل
===================================================== */

async function deleteWork(id) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;

    try {
        const res = await fetch(API + "/works/" + id, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل الحذف");

        toast("🗑 تم الحذف", "success");
        loadWorks();
        loadParentsOptions();

    } catch (err) {
        toast("❌ " + err.message, "error");
    }
}

/* =====================================================
   صفحة الحلقات
===================================================== */

function openEpisodes(workId, workTitle) {
    currentWorkId = workId;
    document.getElementById("episodesPageTitle").textContent = `📺 حلقات: ${workTitle}`;
    showTab("episodes");
    loadEpisodes(workId);
}

document.getElementById("backToList").addEventListener("click", () => {
    currentWorkId = null;
    showTab("list");
    loadWorks();
});

document.getElementById("episodeForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentWorkId) {
        toast("❌ لم يتم تحديد العمل", "error");
        return;
    }

    const form = e.target;
    const btn = form.querySelector(".submit-btn");
    const formData = new FormData(form);

    btn.disabled = true;
    btn.textContent = "⏳ جاري الرفع...";

    try {
        const res = await fetch(`${API}/works/${currentWorkId}/episodes`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "حدث خطأ");

        toast("✅ تمت إضافة الحلقة بنجاح", "success");

        form.reset();
        document.getElementById("episodeVideoName").textContent = "";
        loadEpisodes(currentWorkId);

    } catch (err) {
        toast("❌ " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "💾 حفظ الحلقة";
    }
});

async function loadEpisodes(workId) {

    const grid = document.getElementById("episodesAdminGrid");
    grid.innerHTML = "<div class='empty'>⏳ جاري التحميل...</div>";

    try {
        const res = await fetch(`${API}/works/${workId}`);
        const work = await res.json();
        const episodes = work.episodes || [];

        if (!episodes.length) {
            grid.innerHTML = "<div class='empty'>لا توجد حلقات بعد</div>";
            return;
        }

        grid.innerHTML = episodes.map(ep => {
            const seasonNum = ep.season || 1;
            const seasonBadge = seasonNum > 1 ? `م${seasonNum} • ` : "";

            return `
            <div class="episode-admin-card">
                <div class="episode-admin-num">
                    ${seasonBadge}حلقة ${ep.number}
                </div>
                <div class="episode-admin-info">
                    <h4>${ep.title || "بدون عنوان"}</h4>
                    <p>${ep.video ? "🎥 فيديو مرفوع" : "⚠️ لا يوجد فيديو"}</p>
                </div>
                <button class="btn-small btn-delete" data-id="${ep.id}">🗑</button>
            </div>
            `;
        }).join("");

        grid.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", () => deleteEpisode(btn.dataset.id));
        });

    } catch (err) {
        grid.innerHTML = "<div class='empty'>❌ تعذّر تحميل الحلقات</div>";
    }
}

async function deleteEpisode(id) {
    if (!confirm("هل أنت متأكد من حذف الحلقة؟")) return;

    try {
        const res = await fetch(`${API}/episodes/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل الحذف");

        toast("🗑 تم حذف الحلقة", "success");
        loadEpisodes(currentWorkId);
    } catch (err) {
        toast("❌ " + err.message, "error");
    }
}

/* =====================================================
   EDIT WORK SYSTEM
===================================================== */

async function openEditModal(workId) {

    try {

        const res = await fetch(`${API}/works/${workId}`);
        if (!res.ok) throw new Error("فشل تحميل البيانات");

        const work = await res.json();

        editingWorkId = workId;

        /* ===== تحميل قائمة الآباء أولاً ===== */
        await loadParentsOptions();

        /* ===== تعبئة الحقول العادية ===== */
        document.getElementById("editTitle").value       = work.title || "";
        document.getElementById("editType").value        = work.type || "فيلم";
        document.getElementById("editYear").value        = work.year || "";
        document.getElementById("editRating").value      = work.rating || "";
        document.getElementById("editCountry").value     = work.country || "";
        document.getElementById("editLanguage").value    = work.language || "";
        document.getElementById("editStatus").value      = work.status || "";
        document.getElementById("editFeatured").value    = work.featured === 1 ? "true" : "false";
        document.getElementById("editDescription").value = work.description || "";
        document.getElementById("editGenre").value       = work.genre || "";

        /* ===== تعبئة حقول الموسم ===== */
        const editParent = document.getElementById("editParentSelect");
        const editSeason = document.getElementById("editSeasonNumber");

        if (editParent) editParent.value = work.parent_id || "";
        if (editSeason) editSeason.value = work.season_number || "";

        /* ===== الصورة الحالية ===== */
        const posterBox = document.getElementById("editCurrentPoster");
        if (work.poster) {
            const src = work.poster.startsWith("http")
                ? work.poster
                : `http://localhost:3000/${work.poster}`;

            posterBox.innerHTML = `
                <p style="color:#888;font-size:12px;margin:8px 0 6px;">الصورة الحالية:</p>
                <img src="${src}" style="max-width:80px;border-radius:8px;" onerror="this.style.display='none'">
            `;
        } else {
            posterBox.innerHTML = `<p style="color:#666;font-size:12px;">لا توجد صورة</p>`;
        }

        /* ===== الفيديو الحالي ===== */
        const videoBox = document.getElementById("editCurrentVideo");
        if (work.video) {
            videoBox.innerHTML = `
                <p style="color:#4caf50;font-size:12px;margin:8px 0 0;">🎥 يوجد فيديو مرفوع</p>
            `;
        } else {
            videoBox.innerHTML = `<p style="color:#666;font-size:12px;">لا يوجد فيديو</p>`;
        }

        /* ===== إعادة تعيين ===== */
        document.getElementById("editPosterInput").value = "";
        document.getElementById("editVideoInput").value = "";
        document.getElementById("editPosterPreview").innerHTML = "";
        document.getElementById("editVideoName").textContent = "";

        /* ===== فتح المودال ===== */
        document.getElementById("editModalOverlay").classList.add("active");
        document.body.style.overflow = "hidden";

    } catch (err) {
        toast("❌ " + err.message, "error");
    }
}

/* ================= إغلاق المودال ================= */

function closeEditModal() {
    document.getElementById("editModalOverlay").classList.remove("active");
    document.body.style.overflow = "";
    editingWorkId = null;
}

/* ================= الأحداث ================= */

document.getElementById("editModalClose").addEventListener("click", closeEditModal);
document.getElementById("editCancelBtn").addEventListener("click", closeEditModal);

document.getElementById("editModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "editModalOverlay") closeEditModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editingWorkId) closeEditModal();
});

/* ================= معاينة الملفات ================= */

document.getElementById("editPosterInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById("editPosterPreview");
    preview.innerHTML = "";
    if (file) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        preview.appendChild(img);
    }
});

document.getElementById("editVideoInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    document.getElementById("editVideoName").textContent = file ? "🎥 " + file.name : "";
});

/* ================= إرسال التعديلات ================= */

document.getElementById("editForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!editingWorkId) return;

    const btn = document.getElementById("editSubmitBtn");
    const form = e.target;
    const formData = new FormData(form);

    btn.disabled = true;
    btn.textContent = "⏳ جاري الحفظ...";

    try {

        const res = await fetch(`${API}/works/${editingWorkId}`, {
            method: "PUT",
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل التعديل");

        toast("✅ تم حفظ التعديلات", "success");

        closeEditModal();
        loadWorks();
        loadParentsOptions();

    } catch (err) {
        toast("❌ " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "💾 حفظ التعديلات";
    }
});

/* =====================================================
   INIT
===================================================== */

buildGenreSelector();
renderSelectedGenres();
loadStats();
loadParentsOptions();
/* =====================================================
   MESSAGES SYSTEM
===================================================== */

async function loadMessages() {

    const grid = document.getElementById("messagesGrid");
    if (!grid) return;

    grid.innerHTML = "<div class='empty'>⏳ جاري التحميل...</div>";

    try {

        const res = await fetch(`${API}/messages`);
        if (!res.ok) throw new Error("فشل التحميل");

        const messages = await res.json();

        /* الإحصائيات */
        const total = messages.length;
        const unread = messages.filter(m => m.is_read === 0).length;

        document.getElementById("msgTotal").textContent = total;
        document.getElementById("msgUnread").textContent = unread;

        /* البادج في الـ Sidebar */
        updateMessagesBadge(unread);

        /* لو فاضية */
        if (!messages.length) {
            grid.innerHTML = `
                <div class="messages-empty">
                    <span class="emoji">📭</span>
                    <h3>لا توجد رسائل بعد</h3>
                    <p>ستظهر الرسائل هنا عند إرسالها من صفحة "اتصل بنا"</p>
                </div>
            `;
            return;
        }

        /* عرض الرسائل */
        grid.innerHTML = messages.map(msg => {

            const isUnread = msg.is_read === 0;

            const date = new Date(msg.created_at);
            const formatted = formatMessageDate(date);

            const initial = (msg.name || "?").trim().charAt(0).toUpperCase();

            return `
                <div class="message-card ${isUnread ? "unread" : ""}" data-id="${msg.id}">

                    <div class="message-header">

                        <div class="message-sender">

                            <div class="message-avatar">${initial}</div>

                            <div class="message-sender-info">
                                <h4>${escapeHtml(msg.name)}</h4>
                                <a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a>
                            </div>

                        </div>

                        <div class="message-meta">
                            ${msg.subject ? `<span class="message-subject">${escapeHtml(msg.subject)}</span>` : ""}
                            <span class="message-date">🕐 ${formatted}</span>
                        </div>

                    </div>

                    <div class="message-body">${escapeHtml(msg.message)}</div>

                    <div class="message-actions">

                        <a href="mailto:${escapeHtml(msg.email)}?subject=رد على: ${escapeHtml(msg.subject || "رسالتك")}"
                           class="msg-btn msg-btn-reply">
                            📧 رد
                        </a>

                        ${isUnread ? `
                            <button class="msg-btn msg-btn-read" data-action="read" data-id="${msg.id}">
                                ✓ تعليم كمقروءة
                            </button>
                        ` : ""}

                        <button class="msg-btn msg-btn-delete" data-action="delete" data-id="${msg.id}">
                            🗑 حذف
                        </button>

                    </div>

                </div>
            `;
        }).join("");

        /* ربط الأزرار */
        grid.querySelectorAll("[data-action='read']").forEach(btn => {
            btn.addEventListener("click", () => markMessageRead(btn.dataset.id));
        });

        grid.querySelectorAll("[data-action='delete']").forEach(btn => {
            btn.addEventListener("click", () => deleteMessage(btn.dataset.id));
        });

    } catch (err) {
        grid.innerHTML = "<div class='empty'>❌ تعذّر تحميل الرسائل</div>";
        console.error(err);
    }
}

/* ===== تعليم كمقروءة ===== */
async function markMessageRead(id) {

    try {
        await fetch(`${API}/messages/${id}/read`, { method: "PUT" });
        toast("✓ تم تعليم الرسالة كمقروءة", "success");
        loadMessages();
    } catch (err) {
        toast("❌ فشل التحديث", "error");
    }
}

/* ===== حذف رسالة ===== */
async function deleteMessage(id) {

    if (!confirm("هل أنت متأكد من حذف الرسالة؟")) return;

    try {
        await fetch(`${API}/messages/${id}`, { method: "DELETE" });
        toast("🗑 تم حذف الرسالة", "success");
        loadMessages();
    } catch (err) {
        toast("❌ فشل الحذف", "error");
    }
}

/* ===== تحديث البادج ===== */
async function updateMessagesBadge(count) {

    const badge = document.getElementById("messagesBadge");
    if (!badge) return;

    if (count === undefined) {
        /* جلب العدد من السيرفر */
        try {
            const res = await fetch(`${API}/messages/unread/count`);
            const data = await res.json();
            count = data.count;
        } catch (err) {
            return;
        }
    }

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = "inline-block";
    } else {
        badge.style.display = "none";
    }
}

/* ===== تنسيق التاريخ ===== */
function formatMessageDate(date) {

    const now = new Date();
    const diff = Math.floor((now - date) / 1000); /* بالثواني */

    if (diff < 60) return "منذ لحظات";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/* ===== حماية النص ===== */
function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

/* ===== ربط تاب الرسائل ===== */
document.querySelectorAll(".nav-item[data-tab='messages']").forEach(link => {
    link.addEventListener("click", () => {
        loadMessages();
    });
});

/* ===== زر التحديث ===== */
const refreshBtn = document.getElementById("refreshMessagesBtn");
if (refreshBtn) {
    refreshBtn.addEventListener("click", loadMessages);
}

/* ===== تحديث البادج كل 30 ثانية ===== */
setInterval(() => updateMessagesBadge(), 30000);

/* ===== تحديث البادج عند بدء التشغيل ===== */
updateMessagesBadge();
/* =====================================================
   MESSAGES SYSTEM
===================================================== */

async function loadMessages() {

    const grid = document.getElementById("messagesGrid");
    if (!grid) return;

    grid.innerHTML = "<div class='empty'>⏳ جاري التحميل...</div>";

    try {

        const res = await fetch(`${API}/messages`);
        if (!res.ok) throw new Error("فشل التحميل");

        const messages = await res.json();

        /* الإحصائيات */
        const total = messages.length;
        const unread = messages.filter(m => m.is_read === 0).length;

        document.getElementById("msgTotal").textContent = total;
        document.getElementById("msgUnread").textContent = unread;

        /* البادج في الـ Sidebar */
        updateMessagesBadge(unread);

        /* لو فاضية */
        if (!messages.length) {
            grid.innerHTML = `
                <div class="messages-empty">
                    <span class="emoji">📭</span>
                    <h3>لا توجد رسائل بعد</h3>
                    <p>ستظهر الرسائل هنا عند إرسالها من صفحة "اتصل بنا"</p>
                </div>
            `;
            return;
        }

        /* عرض الرسائل */
        grid.innerHTML = messages.map(msg => {

            const isUnread = msg.is_read === 0;
            const date = new Date(msg.created_at);
            const formatted = formatMessageDate(date);
            const initial = (msg.name || "?").trim().charAt(0).toUpperCase();

            return `
                <div class="message-card ${isUnread ? "unread" : ""}" data-id="${msg.id}">

                    <div class="message-header">

                        <div class="message-sender">

                            <div class="message-avatar">${initial}</div>

                            <div class="message-sender-info">
                                <h4>${escapeHtml(msg.name)}</h4>
                                <a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a>
                            </div>

                        </div>

                        <div class="message-meta">
                            ${msg.subject ? `<span class="message-subject">${escapeHtml(msg.subject)}</span>` : ""}
                            <span class="message-date">🕐 ${formatted}</span>
                        </div>

                    </div>

                    <div class="message-body">${escapeHtml(msg.message)}</div>

                    <div class="message-actions">

                        <a href="mailto:${escapeHtml(msg.email)}?subject=رد على: ${escapeHtml(msg.subject || "رسالتك")}"
                           class="msg-btn msg-btn-reply">
                            📧 رد
                        </a>

                        ${isUnread ? `
                            <button class="msg-btn msg-btn-read" data-action="read" data-id="${msg.id}">
                                ✓ تعليم كمقروءة
                            </button>
                        ` : ""}

                        <button class="msg-btn msg-btn-delete" data-action="delete" data-id="${msg.id}">
                            🗑 حذف
                        </button>

                    </div>

                </div>
            `;
        }).join("");

        /* ربط الأزرار */
        grid.querySelectorAll("[data-action='read']").forEach(btn => {
            btn.addEventListener("click", () => markMessageRead(btn.dataset.id));
        });

        grid.querySelectorAll("[data-action='delete']").forEach(btn => {
            btn.addEventListener("click", () => deleteMessage(btn.dataset.id));
        });

    } catch (err) {
        grid.innerHTML = "<div class='empty'>❌ تعذّر تحميل الرسائل</div>";
        console.error(err);
    }
}

/* ===== تعليم كمقروءة ===== */
async function markMessageRead(id) {

    try {
        await fetch(`${API}/messages/${id}/read`, { method: "PUT" });
        toast("✓ تم تعليم الرسالة كمقروءة", "success");
        loadMessages();
    } catch (err) {
        toast("❌ فشل التحديث", "error");
    }
}

/* ===== حذف رسالة ===== */
async function deleteMessage(id) {

    if (!confirm("هل أنت متأكد من حذف الرسالة؟")) return;

    try {
        await fetch(`${API}/messages/${id}`, { method: "DELETE" });
        toast("🗑 تم حذف الرسالة", "success");
        loadMessages();
    } catch (err) {
        toast("❌ فشل الحذف", "error");
    }
}

/* ===== تحديث البادج ===== */
async function updateMessagesBadge(count) {

    const badge = document.getElementById("messagesBadge");
    if (!badge) return;

    if (count === undefined) {
        try {
            const res = await fetch(`${API}/messages/unread/count`);
            const data = await res.json();
            count = data.count;
        } catch (err) {
            return;
        }
    }

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = "inline-block";
    } else {
        badge.style.display = "none";
    }
}

/* ===== تنسيق التاريخ ===== */
function formatMessageDate(date) {

    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "منذ لحظات";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/* ===== حماية النص ===== */
function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

/* ===== ربط تاب الرسائل ===== */
document.querySelectorAll(".nav-item[data-tab='messages']").forEach(link => {
    link.addEventListener("click", () => {
        loadMessages();
    });
});

/* ===== زر التحديث ===== */
const refreshMessagesBtn = document.getElementById("refreshMessagesBtn");
if (refreshMessagesBtn) {
    refreshMessagesBtn.addEventListener("click", loadMessages);
}

/* ===== تحديث البادج كل 30 ثانية ===== */
setInterval(() => updateMessagesBadge(), 30000);

/* ===== تحديث البادج عند بدء التشغيل ===== */
updateMessagesBadge();