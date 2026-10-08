/* =====================================================
   WOLFCINEMA — FAVORITES PAGE
===================================================== */

"use strict";

const FAVORITES_KEY = "wolfcinema_favorites";

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    } catch (e) {
        return [];
    }
}

function saveFavorites(list) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    } catch (e) {}
}

/* =====================================================
   عداد المفضلة في الـ Navbar
===================================================== */

function updateFavCount() {

    const counter = document.getElementById("favCount");
    if (!counter) return;

    const count = getFavorites().length;
    counter.textContent = count;

    if (count === 0) {
        counter.classList.add("empty");
    } else {
        counter.classList.remove("empty");
    }
}

/* =====================================================
   عرض المفضلة
===================================================== */

function renderFavorites() {

    const grid = document.getElementById("favoritesGrid");
    const clearBtn = document.getElementById("clearFavoritesBtn");

    if (!grid) return;

    const favorites = getFavorites()
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (clearBtn) {
        clearBtn.style.display = favorites.length ? "inline-flex" : "none";
    }

    if (!favorites.length) {
        grid.innerHTML = `
            <div class="favorites-empty">
                <div class="empty-icon">💔</div>
                <h2>مفضلتك فاضية</h2>
                <p>لسه ما ضفتش أي عمل للمفضلة</p>
                <a href="../index.html" class="empty-btn">تصفح الأعمال</a>
            </div>
        `;
        updateFavCount();
        return;
    }

    grid.innerHTML = favorites.map(item => {

        const posterSrc = item.image || "../assets/images/placeholder.jpg";

        return `
            <div class="favorite-card" data-id="${item.id}">

                <a href="details.html?id=${encodeURIComponent(item.id)}" class="favorite-poster-link">
                    <div class="favorite-poster">
                        <img src="${posterSrc}"
                             alt="${item.title}"
                             loading="lazy"
                             onerror="this.src='../assets/images/placeholder.jpg'">
                        <span class="favorite-type">${item.type || ""}</span>
                    </div>

                    <div class="favorite-info">
                        <h3>${item.title}</h3>
                        <div class="favorite-meta">
                            <span>${item.year || "-"}</span>
                            <span>${(item.genre || "").split(" • ")[0] || "-"}</span>
                        </div>
                    </div>
                </a>

                <button class="remove-fav-btn" data-id="${item.id}" title="إزالة من المفضلة">
                    ✕
                </button>

            </div>
        `;
    }).join("");

    grid.querySelectorAll(".remove-fav-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeFavorite(btn.dataset.id);
        });
    });

    updateFavCount();
}

/* =====================================================
   إزالة عمل من المفضلة
===================================================== */

function removeFavorite(workId) {

    const favorites = getFavorites().filter(f => String(f.id) !== String(workId));
    saveFavorites(favorites);

    const card = document.querySelector(`.favorite-card[data-id="${workId}"]`);
    if (card) {
        card.style.transform = "scale(0.85)";
        card.style.opacity = "0";
        setTimeout(() => renderFavorites(), 300);
    } else {
        renderFavorites();
    }
}

/* =====================================================
   تشغيل
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    renderFavorites();

    const clearBtn = document.getElementById("clearFavoritesBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (confirm("هل أنت متأكد من مسح كل المفضلة؟")) {
                saveFavorites([]);
                renderFavorites();
            }
        });
    }
});