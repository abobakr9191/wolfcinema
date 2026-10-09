/* =====================================================
   WOLFCINEMA
   MAIN JAVASCRIPT
===================================================== */


/* =====================================================
   البيانات (تُحمَّل كلها من السيرفر)
===================================================== */

const movies = [];
const series = [];
const anime  = [];

const allContent = [
    ...movies,
    ...series,
    ...anime
];


/* =====================================================
   CREATE POSTER
===================================================== */

function createPoster(item) {

    const card = document.createElement("article");

    card.className = "poster-card";


    /*
        عند الضغط على البوستر
        نفتح صفحة التفاصيل
        ونرسل ID الخاص بالعمل
    */

    card.addEventListener("click", () => {

        window.location.href =
            `pages/details.html?id=${encodeURIComponent(item.id)}`;

    });


    /* ================= IMAGE ================= */

    const image = document.createElement("img");

    image.src = item.image;

    image.alt = item.title;

    image.loading = "lazy";

    /* fallback في حال الصورة مش موجودة */
    image.onerror = function () {

        this.onerror = null;
        this.src = "assets/images/placeholder.jpg";
    };


    /* ================= TITLE ================= */

    const title = document.createElement("div");

    title.className = "poster-title";

    title.textContent = item.title;


    /* ================= ADD ================= */

    card.appendChild(image);

    card.appendChild(title);


    return card;
}


/* =====================================================
   DISPLAY CONTENT
===================================================== */

function displayContent(items, containerId) {

    const container =
        document.getElementById(containerId);


    if (!container) {
        return;
    }


    container.innerHTML = "";


    items.forEach(item => {

        const poster =
            createPoster(item);

        container.appendChild(poster);

    });
}


/* =====================================================
   INITIALIZE HOME PAGE
===================================================== */

function initializeHomePage() {

    displayContent(
        movies,
        "movies-container"
    );


    displayContent(
        series,
        "series-container"
    );


    displayContent(
        anime,
        "anime-container"
    );

}


/* =====================================================
   BACKEND INTEGRATION (additive)
===================================================== */

const API_URL = window.location.origin + "/api";
const SERVER_URL = window.location.origin;
async function loadFromBackend() {

    try {

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${API_URL}/works`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn("⚠️ السيرفر رجّع خطأ:", res.status);
            return;
        }

        const works = await res.json();
        if (!Array.isArray(works) || !works.length) return;

        console.log(`📦 السيرفر رجّع ${works.length} عمل`);

        /* منع التكرار حسب العنوان */
        const existingTitles = new Set(
            allContent.map(w => (w.title || "").toLowerCase().trim())
        );

        let added = 0;

        /* نعكس الترتيب عشان الأحدث يظهر أولاً */
        const reversedWorks = [...works].reverse();

        reversedWorks.forEach(w => {

            if (!w.title) return;
            if (existingTitles.has(w.title.toLowerCase().trim())) {
                console.log(`⏭️ تم تخطي (موجود): ${w.title}`);
                return;
            }

            const imageURL = w.poster
                ? (w.poster.startsWith("http") ? w.poster : `${SERVER_URL}/${w.poster}`)
                : "assets/images/placeholder.jpg";

            const item = {
                id: w.id,
                title: w.title,
                type: w.type,
                year: w.year || "",
                genre: w.genre || "",
                description: w.description || "",
                image: imageURL,
                fromAPI: true
            };

            const typeRaw  = String(w.type || "").trim();
            const typeNorm = typeRaw.replace(/\s+/g, "");

            console.log(`📺 إضافة: "${w.title}" - النوع: "${typeRaw}"`);

            if (typeNorm === "فيلم") {
                movies.unshift(item);

            } else if (typeNorm === "مسلسل") {
                series.unshift(item);

            } else if (typeNorm === "أنمي") {
                anime.unshift(item);

            } else {
                console.warn(`⚠️ نوع غير معروف: "${typeRaw}" - سيتم إضافته للأفلام`);
                movies.unshift(item);
            }

            allContent.unshift(item);
            added++;
        });

        if (added > 0) {
            console.log(`✅ تمت إضافة ${added} عمل من السيرفر`);
            initializeHomePage();
        }

    } catch (err) {
        console.log("ℹ️ السيرفر مش متاح، الموقع شغال بالبيانات المحلية");
    }
}


/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeHomePage();

        await loadFromBackend();

    }
);

/* =====================================================
   WOLFCINEMA — SEARCH SYSTEM (Professional)
===================================================== */

(function () {

    "use strict";

    /* -------- العناصر -------- */
    const searchButton  = document.getElementById("searchButton");
    const searchOverlay = document.getElementById("searchOverlay");
    const searchClose   = document.getElementById("searchClose");
    const searchInput   = document.getElementById("searchInput");
    const searchClear   = document.getElementById("searchClear");
    const searchHint    = document.getElementById("searchHint");
    const searchResults = document.getElementById("searchResults");

    if (!searchButton || !searchOverlay || !searchInput || !searchResults) {
        console.warn("WOLFCINEMA SEARCH: عناصر ناقصة");
        return;
    }

    /* ================= فتح / إغلاق ================= */

    function openSearch() {
        searchOverlay.classList.add("active");
        document.body.classList.add("search-open");
        setTimeout(() => searchInput.focus(), 250);
    }

    function closeSearch() {
        searchOverlay.classList.remove("active");
        document.body.classList.remove("search-open");
        setTimeout(() => {
            searchInput.value = "";
            searchResults.innerHTML = "";
            if (searchHint) searchHint.style.display = "block";
            if (searchClear) searchClear.classList.remove("visible");
        }, 300);
    }

    /* ================= حماية النص ================= */

    function escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    /* ================= تظليل ================= */

    function highlight(text, query) {
        const sT = escapeHTML(text || "");
        const sQ = escapeHTML(query || "");
        if (!sQ) return sT;
        const r = new RegExp(
            "(" + sQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
            "gi"
        );
        return sT.replace(r, "<mark>$1</mark>");
    }

    /* ================= بناء رابط الصورة ================= */

    function getImageSrc(item) {
        if (item.image) return item.image;
        if (item.poster) {
            return item.poster.startsWith("http")
                ? item.poster
                : `http://localhost:3000/${item.poster}`;
        }
        return "assets/images/placeholder.jpg";
    }

    /* ================= عرض النتائج ================= */

    function renderResults(list, query) {

        searchResults.innerHTML = "";

        if (!list.length) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <span class="emoji">🔍</span>
                    <h3>لا توجد نتائج</h3>
                    <p>جرّب البحث بكلمة أخرى أو تصنيف مختلف.</p>
                </div>`;
            return;
        }

        /* عنوان النتائج */
        const header = document.createElement("div");
        header.className = "search-results-header";
        header.textContent = `تم العثور على ${list.length} نتيجة`;
        searchResults.appendChild(header);

        /* شبكة النتائج */
        const grid = document.createElement("div");
        grid.className = "search-results-grid";

        list.slice(0, 30).forEach(item => {

            const card = document.createElement("a");
            card.className = "search-result-card";
            card.href = `pages/details.html?id=${encodeURIComponent(item.id)}`;

            card.innerHTML = `
                <div class="search-result-img">
                    <img
                        src="${escapeHTML(getImageSrc(item))}"
                        alt="${escapeHTML(item.title)}"
                        loading="lazy"
                        onerror="this.src='assets/images/placeholder.jpg'">
                    <span class="search-result-badge">${escapeHTML(item.type || "")}</span>
                </div>
                <div class="search-result-info">
                    <h4 class="search-result-title">${highlight(item.title, query)}</h4>
                    <div class="search-result-meta">
                        <span class="year">${escapeHTML(item.year || "-")}</span>
                        <span>${escapeHTML((item.genre || "").split(" • ")[0] || "-")}</span>
                    </div>
                </div>`;

            grid.appendChild(card);
        });

        searchResults.appendChild(grid);
    }

    /* ================= تنفيذ البحث ================= */

    function performSearch() {

        const rawQuery = searchInput.value.trim();
        const query    = rawQuery.toLowerCase();

        /* زر المسح */
        if (searchClear) {
            searchClear.classList.toggle("visible", rawQuery.length > 0);
        }

        /* لو مفيش كتابة */
        if (!query) {
            if (searchHint) searchHint.style.display = "block";
            searchResults.innerHTML = "";
            return;
        }

        /* البحث الشامل في كل الأعمال */
        const filtered = allContent.filter(item => {

            const title = (item.title || "").toLowerCase();
            const genre = (item.genre || "").toLowerCase();
            const type  = (item.type  || "").toLowerCase();
            const year  = String(item.year || "");
            const desc  = (item.description || "").toLowerCase();

            return title.includes(query)  ||
                   genre.includes(query)  ||
                   type.includes(query)   ||
                   year.includes(query)   ||
                   desc.includes(query);
        });

        if (searchHint) searchHint.style.display = "none";

        renderResults(filtered, rawQuery);
    }

    /* ================= الأحداث ================= */

    searchButton.addEventListener("click", openSearch);

    if (searchClose) {
        searchClose.addEventListener("click", closeSearch);
    }

    /* بحث فوري */
    searchInput.addEventListener("input", performSearch);

    /* زر المسح */
    if (searchClear) {
        searchClear.addEventListener("click", () => {
            searchInput.value = "";
            searchInput.focus();
            performSearch();
        });
    }

    /* إغلاق بالخلفية */
    searchOverlay.addEventListener("click", (e) => {
        if (e.target === searchOverlay) closeSearch();
    });

    /* اختصارات لوحة المفاتيح */
    document.addEventListener("keydown", (e) => {

        /* ESC */
        if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
            closeSearch();
        }

        /* Ctrl + K */
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            openSearch();
        }

        /* / للفتح */
        if (
            e.key === "/" &&
            document.activeElement.tagName !== "INPUT" &&
            !searchOverlay.classList.contains("active")
        ) {
            e.preventDefault();
            openSearch();
        }
    });

})();


/* =====================================================
   WOLFCINEMA — CATEGORIES SYSTEM (Extended)
===================================================== */

(function () {

    "use strict";

    /* -------- العناصر -------- */
    const categoriesLink    = document.getElementById("categoriesLink");
    const categoriesOverlay = document.getElementById("categoriesOverlay");
    const categoriesClose   = document.getElementById("categoriesClose");
    const categoriesGrid    = document.getElementById("categoriesGrid");
    const categoriesResults = document.getElementById("categoriesResults");

    if (!categoriesLink || !categoriesOverlay || !categoriesGrid) {
        console.warn("WOLFCINEMA CATEGORIES: عناصر ناقصة");
        return;
    }

    /* =====================================================
       قائمة التصنيفات الشاملة
       (مرتبة أبجديًا حسب النوع)
    ===================================================== */

    const ALL_CATEGORIES = {

        "أنواع عامة": [
            "أكشن",
            "دراما",
            "كوميديا",
            "رومانسي",
            "إثارة",
            "غموض",
            "جريمة",
            "مغامرة",
            "فانتازيا",
            "خيال علمي",
            "رعب",
            "وثائقي",
            "تاريخي",
            "سيرة ذاتية",
            "عائلي",
            "موسيقي",
            "رياضي",
            "حربي",
            "نفسي"
        ],

        "أنواع فنية": [
            "فنون قتالية",
            "ساموراي",
            "نينجا",
            "قراصنة",
            "ميكا",
            "سيوف",
            "سحر",
            "شياطين",
            "أبطال خارقون",
            "خوارق",
            "زومبي",
            "مصاصو دماء",
            "أساطير"
        ],

        "أنواع فرعية": [
            "فانتازيا مظلمة",
            "خيال علمي مظلم",
            "دراما نفسية",
            "إثارة نفسية",
            "غموض بوليسي",
            "جريمة منظمة",
            "تجسس",
            "سرقة",
            "انتقام",
            "بقاء",
            "كوارث",
            "نهاية العالم",
            "سفر بالزمن",
            "فضاء",
            "ديس نوفا",
            "أكشن مفرط",
            "أطفال",
            "شونين",
            "سينين",
            "شوجو",
            "جوسي",
            "إيسيكاي",
            "ميكا عسكري"
        ],

        "تصنيفات عربية": [
            "اجتماعي",
            "أكشن عربي",
            "كوميديا عربية",
            "دراما عربية",
            "بوليسي",
            "إجرامي",
            "تاريخي عربي",
            "ديني",
            "كوميدي رومانسي"
        ],

        "جمهور": [
            "+18",
            "+16",
            "+13",
            "عائلي",
            "أطفال",
            "مراهقين"
        ]

    };

    /* =====================================================
       استخراج الأعمال لكل تصنيف
    ===================================================== */

    function getWorksByCategory(categoryName) {

        return allContent.filter(item => {

            if (!item.genre) return false;

            const parts = String(item.genre)
                .split("•")
                .map(g => g.trim());

            return parts.includes(categoryName);
        });
    }

    /* =====================================================
       فتح / إغلاق
    ===================================================== */

    function openCategories() {
        buildCategories();
        categoriesOverlay.classList.add("active");
        document.body.classList.add("categories-open");
    }

    function closeCategories() {
        categoriesOverlay.classList.remove("active");
        document.body.classList.remove("categories-open");

        setTimeout(() => {
            categoriesResults.innerHTML = "";
        }, 300);
    }

    /* =====================================================
       حماية النص
    ===================================================== */

    function escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    /* =====================================================
       رابط الصورة
    ===================================================== */

    function getImageSrc(item) {
        if (item.image) return item.image;
        if (item.poster) {
            return item.poster.startsWith("http")
                ? item.poster
                : `http://localhost:3000/${item.poster}`;
        }
        return "assets/images/placeholder.jpg";
    }

    /* =====================================================
       بناء كل التصنيفات
    ===================================================== */

    function buildCategories() {

        categoriesGrid.innerHTML = "";

        Object.keys(ALL_CATEGORIES).forEach(groupName => {

            const categories = ALL_CATEGORIES[groupName];

            /* ===== عنوان المجموعة ===== */
            const groupTitle = document.createElement("div");
            groupTitle.className = "categories-group-title";

            /* احسب عدد الأعمال الكلي في المجموعة */
            const totalInGroup = categories.reduce((sum, cat) => {
                return sum + getWorksByCategory(cat).length;
            }, 0);

            groupTitle.innerHTML = `
                <span class="group-name">${escapeHTML(groupName)}</span>
                <span class="group-count">${totalInGroup} عمل</span>
            `;

            categoriesGrid.appendChild(groupTitle);

            /* ===== شبكة التصنيفات ===== */
            const groupGrid = document.createElement("div");
            groupGrid.className = "categories-group-grid";

            categories.forEach(cat => {

                const count = getWorksByCategory(cat).length;

                const card = document.createElement("button");
                card.className = "category-card";
                card.type = "button";

                /* لو مفيش أعمال، الكارت يبقى خفيف */
                if (count === 0) {
                    card.classList.add("category-empty");
                }

                card.innerHTML = `
                    <span class="category-name">${escapeHTML(cat)}</span>
                    <span class="category-count">${count}</span>
                `;

                card.addEventListener("click", () => {

                    document.querySelectorAll(".category-card")
                        .forEach(c => c.classList.remove("active"));

                    card.classList.add("active");

                    showCategoryResults(cat);
                });

                groupGrid.appendChild(card);
            });

            categoriesGrid.appendChild(groupGrid);
        });
    }

    /* =====================================================
       عرض نتائج تصنيف
    ===================================================== */

    function showCategoryResults(categoryName) {

        const results = getWorksByCategory(categoryName);

        categoriesResults.innerHTML = "";

        /* لو مفيش نتائج */
        if (!results.length) {
            categoriesResults.innerHTML = `
                <div class="categories-no-results">
                    <span class="emoji">🎬</span>
                    <h3>لا توجد أعمال في تصنيف "${escapeHTML(categoryName)}"</h3>
                    <p>سيتم إضافة أعمال قريبًا</p>
                </div>`;
            return;
        }

        /* عنوان */
        const header = document.createElement("div");
        header.className = "categories-results-header";
        header.innerHTML = `
            <span>${escapeHTML(categoryName)}</span>
            <small>${results.length} عمل</small>
        `;
        categoriesResults.appendChild(header);

        /* شبكة النتائج */
        const grid = document.createElement("div");
        grid.className = "categories-results-grid";

        results.forEach(item => {

            const card = document.createElement("a");
            card.className = "category-result-card";
            card.href = `pages/details.html?id=${encodeURIComponent(item.id)}`;

            card.innerHTML = `
                <div class="category-result-img">
                    <img
                        src="${escapeHTML(getImageSrc(item))}"
                        alt="${escapeHTML(item.title)}"
                        loading="lazy"
                        onerror="this.src='assets/images/placeholder.jpg'">
                    <span class="category-result-badge">${escapeHTML(item.type || "")}</span>
                </div>
                <div class="category-result-info">
                    <h4>${escapeHTML(item.title)}</h4>
                    <div class="category-result-meta">
                        <span>${escapeHTML(item.year || "-")}</span>
                    </div>
                </div>`;

            grid.appendChild(card);
        });

        categoriesResults.appendChild(grid);
    }

    /* =====================================================
       الأحداث
    ===================================================== */

    categoriesLink.addEventListener("click", (e) => {
        e.preventDefault();
        openCategories();
    });

    if (categoriesClose) {
        categoriesClose.addEventListener("click", closeCategories);
    }

    /* إغلاق بالخلفية */
    categoriesOverlay.addEventListener("click", (e) => {
        if (e.target === categoriesOverlay) closeCategories();
    });

    /* ESC */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && categoriesOverlay.classList.contains("active")) {
            closeCategories();
        }
    });

})();

/* =====================================================
   WOLFCINEMA — CONTINUE WATCHING (Recently Watched)
===================================================== */

(function () {

    "use strict";

    const HISTORY_KEY = "wolfcinema_watch_history";

    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        } catch (e) {
            return [];
        }
    }

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "0:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }
        return `${m}:${String(s).padStart(2, "0")}`;
    }

    function renderContinueWatching() {

        const section = document.getElementById("continueSection");
        const grid    = document.getElementById("continueGrid");

        if (!section || !grid) return;

        const history = getHistory()
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 10);

        if (!history.length) {
            section.style.display = "none";
            return;
        }

        section.style.display = "block";
        grid.innerHTML = "";

        history.forEach(entry => {

            const percent = entry.duration > 0
                ? Math.min(100, Math.round((entry.currentTime / entry.duration) * 100))
                : 0;

            /* رابط مع رقم الحلقة لو موجود */
            let link = `pages/watch.html?id=${encodeURIComponent(entry.workId)}`;
            if (entry.episodeNumber) {
                link += `&ep=${encodeURIComponent(entry.episodeNumber)}`;
            }

            const card = document.createElement("a");
            card.className = "continue-card";
            card.href = link;

            card.innerHTML = `
                <div class="continue-thumb">
                    <img src="${entry.poster || 'assets/images/placeholder.jpg'}"
                         alt="${entry.workTitle}"
                         onerror="this.src='assets/images/placeholder.jpg'">
                    <span class="continue-play">▶</span>
                    <div class="continue-progress">
                        <div class="continue-progress-bar" style="width:${percent}%"></div>
                    </div>
                </div>
                <div class="continue-info">
                    <h4>${entry.workTitle}</h4>
                    <div class="continue-meta">
                        ${entry.episodeNumber ? `<span class="ep-badge">حلقة ${entry.episodeNumber}</span>` : ""}
                        <span class="time-left">${formatTime(entry.currentTime)} / ${formatTime(entry.duration)}</span>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });
    }

    /* زر مسح السجل */
    const clearBtn = document.getElementById("clearHistoryBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (confirm("هل تريد مسح كل سجل المشاهدة؟")) {
                localStorage.removeItem(HISTORY_KEY);
                renderContinueWatching();
            }
        });
    }

    /* تشغيل */
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(renderContinueWatching, 500);
    });

})();

/* =====================================================
   FAVORITES COUNTER IN NAVBAR
===================================================== */

(function () {

    const FAVORITES_KEY = "wolfcinema_favorites";

    function updateFavCount() {

        const counter = document.getElementById("favCount");
        if (!counter) return;

        try {
            const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
            const count = favorites.length;

            counter.textContent = count;

            if (count === 0) {
                counter.classList.add("empty");
            } else {
                counter.classList.remove("empty");
            }
        } catch (e) {
            counter.classList.add("empty");
        }
    }

    document.addEventListener("DOMContentLoaded", updateFavCount);

    /* تحديث عند العودة للصفحة */
    window.addEventListener("focus", updateFavCount);
    window.addEventListener("storage", updateFavCount);

})();