/* =====================================================
   WOLFCINEMA — BACKEND SERVER
===================================================== */

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");
const sqlite3 = require("sqlite3").verbose();

const app  = express();
const PORT = 3000;

/* ===== Middleware ===== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== المجلدات ===== */
const UPLOADS_DIR   = path.join(__dirname, "uploads");
const POSTERS_DIR   = path.join(UPLOADS_DIR, "posters");
const VIDEOS_DIR    = path.join(UPLOADS_DIR, "videos");

[UPLOADS_DIR, POSTERS_DIR, VIDEOS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* ===== الملفات الثابتة ===== */
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/admin",   express.static(path.join(__dirname, "admin")));
app.use("/assets",  express.static(path.join(__dirname, "..", "assets")));

/* =====================================================
   DATABASE
===================================================== */

const db = new sqlite3.Database(
    path.join(__dirname, "database.db"),
    (err) => {
        if (err) console.error("DB Error:", err);
        else console.log("✅ قاعدة البيانات متصلة");
    }
);

/* جدول الأعمال */
db.run(`
    CREATE TABLE IF NOT EXISTS works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        year TEXT,
        genre TEXT,
        description TEXT,
        poster TEXT,
        video TEXT,
        has_episodes INTEGER DEFAULT 0,
        rating TEXT,
        country TEXT,
        language TEXT,
        status TEXT,
        featured INTEGER DEFAULT 0,
        parent_id INTEGER DEFAULT NULL,
        season_number INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/* ===== إضافة الحقول الجديدة (لو مش موجودة) ===== */
db.all("PRAGMA table_info(works)", [], (err, cols) => {
    if (err) return;

    const existing = cols.map(c => c.name);

    const newCols = [
        { name: "rating",        type: "TEXT" },
        { name: "country",       type: "TEXT" },
        { name: "language",      type: "TEXT" },
        { name: "status",        type: "TEXT" },
        { name: "featured",      type: "INTEGER DEFAULT 0" },
        { name: "parent_id",     type: "INTEGER DEFAULT NULL" },
        { name: "season_number", type: "INTEGER DEFAULT NULL" }
    ];

    newCols.forEach(col => {
        if (!existing.includes(col.name)) {
            db.run(`ALTER TABLE works ADD COLUMN ${col.name} ${col.type}`, (e) => {
                if (e) console.error(`خطأ في إضافة ${col.name}:`, e.message);
                else console.log(`✅ تم إضافة عمود: ${col.name}`);
            });
        }
    });
});

/* جدول الحلقات */
db.run(`
    CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_id INTEGER NOT NULL,
        season INTEGER DEFAULT 1,
        number INTEGER NOT NULL,
        title TEXT,
        video TEXT,
        poster TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/* ===== إضافة عمود season (لو مش موجود) ===== */
db.all("PRAGMA table_info(episodes)", [], (err, cols) => {
    if (err) return;

    const existing = cols.map(c => c.name);

    if (!existing.includes("season")) {
        db.run(`ALTER TABLE episodes ADD COLUMN season INTEGER DEFAULT 1`, (e) => {
            if (e) console.error("خطأ في إضافة season:", e.message);
            else console.log("✅ تم إضافة عمود: season");
        });
    }
});

/* جدول التقييمات */
db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/* ===== جدول الرسائل ===== */
db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/* =====================================================
   MULTER
===================================================== */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "poster" || file.fieldname === "episode_poster") {
            cb(null, POSTERS_DIR);
        } else {
            cb(null, VIDEOS_DIR);
        }
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        cb(null, Date.now() + "_" + safeName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 } /* 1GB */
});

/* =====================================================
   API ROUTES
===================================================== */

/* --- اختبار --- */
app.get("/api", (req, res) => {
    res.json({ message: "WOLFCINEMA API شغال ✅" });
});

/* --- إحصائيات --- */
app.get("/api/stats", (req, res) => {

    const stats = {};

    db.get("SELECT COUNT(*) AS total FROM works", [], (e1, r1) => {
        stats.total = r1 ? r1.total : 0;

        db.get("SELECT COUNT(*) AS c FROM works WHERE type='فيلم'", [], (e2, r2) => {
            stats.movies = r2 ? r2.c : 0;

            db.get("SELECT COUNT(*) AS c FROM works WHERE type='مسلسل'", [], (e3, r3) => {
                stats.series = r3 ? r3.c : 0;

                db.get("SELECT COUNT(*) AS c FROM works WHERE type='أنمي'", [], (e4, r4) => {
                    stats.anime = r4 ? r4.c : 0;

                    db.get("SELECT COUNT(*) AS c FROM works WHERE featured=1", [], (e5, r5) => {
                        stats.featured = r5 ? r5.c : 0;

                        db.get("SELECT COUNT(*) AS c FROM episodes", [], (e6, r6) => {
                            stats.episodes = r6 ? r6.c : 0;

                            db.get("SELECT COUNT(*) AS c FROM messages WHERE is_read=0", [], (e7, r7) => {
                                stats.unreadMessages = r7 ? r7.c : 0;
                                res.json(stats);
                            });
                        });
                    });
                });
            });
        });
    });
});

/* --- جلب الأعمال التي يمكن أن تكون "أب" --- */
app.get("/api/parents", (req, res) => {
    db.all(
        `SELECT id, title, type, year FROM works
         WHERE parent_id IS NULL
         ORDER BY title ASC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        }
    );
});

/* --- جلب كل الأعمال --- */
app.get("/api/works", (req, res) => {
    const sql = `
        SELECT
            w.*,
            (SELECT COUNT(*) FROM episodes WHERE work_id = w.id) AS episode_count,
            (SELECT COUNT(*) FROM ratings WHERE work_id = w.id) AS rating_count,
            (SELECT ROUND(AVG(rating), 1) FROM ratings WHERE work_id = w.id) AS avg_rating,
            (SELECT COUNT(*) FROM works WHERE parent_id = w.id) AS season_count
        FROM works w
        ORDER BY w.created_at DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/* --- جلب عمل واحد + حلقاته أو مواسمه --- */
app.get("/api/works/:id", (req, res) => {

    db.get("SELECT * FROM works WHERE id = ?", [req.params.id], (err, work) => {

        if (err) return res.status(500).json({ error: err.message });
        if (!work) return res.status(404).json({ error: "العمل غير موجود" });

        /* ===== نشوف لو ده أب عنده مواسم ===== */
        db.all(
            "SELECT * FROM works WHERE parent_id = ? ORDER BY season_number ASC, year ASC",
            [req.params.id],
            (err2, seasons) => {

                if (err2) return res.status(500).json({ error: err2.message });

                if (seasons && seasons.length > 0) {

                    /* جلب كل حلقات المواسم في استعلام واحد */
                    const seasonIds = seasons.map(s => s.id);
                    const placeholders = seasonIds.map(() => "?").join(",");

                    db.all(
                        `SELECT * FROM episodes WHERE work_id IN (${placeholders}) ORDER BY season ASC, number ASC`,
                        seasonIds,
                        (err3, allEps) => {

                            if (err3) return res.status(500).json({ error: err3.message });

                            seasons.forEach(s => {
                                s.episodes = (allEps || []).filter(e => e.work_id === s.id);
                            });

                            work.seasons = seasons;
                            work.episodes = [];
                            res.json(work);
                        }
                    );

                } else {

                    /* عمل عادي - جلب حلقاته */
                    db.all(
                        "SELECT * FROM episodes WHERE work_id = ? ORDER BY season ASC, number ASC",
                        [req.params.id],
                        (err4, episodes) => {

                            if (err4) return res.status(500).json({ error: err4.message });

                            work.episodes = episodes || [];
                            work.seasons = [];
                            res.json(work);
                        }
                    );
                }
            }
        );
    });
});

/* --- إضافة عمل جديد --- */
app.post(
    "/api/works",
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "video",  maxCount: 1 }
    ]),
    (req, res) => {

        const {
            title, type, year, genre, description, has_episodes,
            rating, country, language, status, featured,
            parent_id, season_number
        } = req.body;

        if (!title || !type) {
            return res.status(400).json({ error: "العنوان والنوع مطلوبان" });
        }

        const posterPath = req.files?.poster
            ? "uploads/posters/" + req.files.poster[0].filename
            : null;

        const videoPath = req.files?.video
            ? "uploads/videos/" + req.files.video[0].filename
            : null;

        const sql = `
            INSERT INTO works (
                title, type, year, genre, description,
                poster, video, has_episodes,
                rating, country, language, status, featured,
                parent_id, season_number
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                title,
                type,
                year    || null,
                genre   || null,
                description || null,
                posterPath,
                videoPath,
                has_episodes === "true" ? 1 : 0,
                rating   || null,
                country  || null,
                language || null,
                status   || null,
                featured === "true" ? 1 : 0,
                parent_id || null,
                season_number || null
            ],
            function (err) {

                if (err) return res.status(500).json({ error: err.message });

                res.json({
                    success: true,
                    id: this.lastID,
                    message: "تمت إضافة العمل"
                });
            }
        );
    }
);

/* --- تعديل عمل --- */
app.put(
    "/api/works/:id",
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "video",  maxCount: 1 }
    ]),
    (req, res) => {

        const {
            title, type, year, genre, description,
            rating, country, language, status, featured,
            parent_id, season_number
        } = req.body;

        db.get(
            "SELECT poster, video FROM works WHERE id = ?",
            [req.params.id],
            (err, oldWork) => {

                if (err) return res.status(500).json({ error: err.message });
                if (!oldWork) return res.status(404).json({ error: "العمل غير موجود" });

                const newPoster = req.files?.poster
                    ? "uploads/posters/" + req.files.poster[0].filename
                    : null;

                const newVideo = req.files?.video
                    ? "uploads/videos/" + req.files.video[0].filename
                    : null;

                if (newPoster && oldWork.poster) {
                    const full = path.join(__dirname, oldWork.poster);
                    if (fs.existsSync(full)) fs.unlinkSync(full);
                }

                if (newVideo && oldWork.video) {
                    const full = path.join(__dirname, oldWork.video);
                    if (fs.existsSync(full)) fs.unlinkSync(full);
                }

                const finalPoster = newPoster || oldWork.poster;
                const finalVideo  = newVideo  || oldWork.video;

                const sql = `
                    UPDATE works SET
                        title = ?, type = ?, year = ?, genre = ?, description = ?,
                        rating = ?, country = ?, language = ?, status = ?, featured = ?,
                        poster = ?, video = ?,
                        parent_id = ?, season_number = ?
                    WHERE id = ?
                `;

                db.run(
                    sql,
                    [
                        title || "",
                        type || "",
                        year || null,
                        genre || null,
                        description || null,
                        rating || null,
                        country || null,
                        language || null,
                        status || null,
                        featured === "true" || featured === 1 ? 1 : 0,
                        finalPoster,
                        finalVideo,
                        parent_id || null,
                        season_number || null,
                        req.params.id
                    ],
                    function (err2) {

                        if (err2) return res.status(500).json({ error: err2.message });

                        res.json({
                            success: true,
                            message: "تم التعديل"
                        });
                    }
                );
            }
        );
    }
);

/* --- حذف عمل --- */
app.delete("/api/works/:id", (req, res) => {

    db.get("SELECT poster, video FROM works WHERE id = ?", [req.params.id], (err, row) => {

        if (row) {
            [row.poster, row.video].forEach(p => {
                if (p) {
                    const full = path.join(__dirname, p);
                    if (fs.existsSync(full)) fs.unlinkSync(full);
                }
            });
        }

        /* امسح الحلقات المرتبطة */
        db.run("DELETE FROM episodes WHERE work_id = ?", [req.params.id]);

        /* امسح التقييمات المرتبطة */
        db.run("DELETE FROM ratings WHERE work_id = ?", [req.params.id]);

        /* امسح مواسم الأبناء لو ده أب */
        db.run("UPDATE works SET parent_id = NULL WHERE parent_id = ?", [req.params.id]);

        db.run("DELETE FROM works WHERE id = ?", [req.params.id], function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true, message: "تم الحذف" });
        });
    });
});

/* --- إضافة حلقة --- */
app.post(
    "/api/works/:id/episodes",
    upload.fields([
        { name: "episode_poster", maxCount: 1 },
        { name: "episode_video",  maxCount: 1 }
    ]),
    (req, res) => {

        const { number, title, season } = req.body;

        if (!number) {
            return res.status(400).json({ error: "رقم الحلقة مطلوب" });
        }

        const posterPath = req.files?.episode_poster
            ? "uploads/posters/" + req.files.episode_poster[0].filename
            : null;

        const videoPath = req.files?.episode_video
            ? "uploads/videos/" + req.files.episode_video[0].filename
            : null;

        db.run(
            `INSERT INTO episodes (work_id, season, number, title, video, poster)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.params.id,
                season || 1,
                number,
                title || null,
                videoPath,
                posterPath
            ],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID });
            }
        );
    }
);

/* --- حذف حلقة --- */
app.delete("/api/episodes/:id", (req, res) => {

    db.get("SELECT video, poster FROM episodes WHERE id = ?", [req.params.id], (err, row) => {

        if (row) {
            [row.video, row.poster].forEach(p => {
                if (p) {
                    const full = path.join(__dirname, p);
                    if (fs.existsSync(full)) fs.unlinkSync(full);
                }
            });
        }

        db.run("DELETE FROM episodes WHERE id = ?", [req.params.id], function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
        });
    });
});

/* --- إرسال تقييم --- */
app.post("/api/works/:id/rate", (req, res) => {

    const { rating } = req.body;
    const workId = req.params.id;

    const value = parseInt(rating);
    if (!value || value < 1 || value > 5) {
        return res.status(400).json({ error: "التقييم لازم يكون بين 1 و 5" });
    }

    db.get("SELECT id FROM works WHERE id = ?", [workId], (err, work) => {

        if (err) return res.status(500).json({ error: err.message });
        if (!work) return res.status(404).json({ error: "العمل غير موجود" });

        db.run(
            "INSERT INTO ratings (work_id, rating) VALUES (?, ?)",
            [workId, value],
            function (err2) {

                if (err2) return res.status(500).json({ error: err2.message });

                db.get(
                    `SELECT
                        COUNT(*) AS count,
                        ROUND(AVG(rating), 1) AS avg
                     FROM ratings WHERE work_id = ?`,
                    [workId],
                    (err3, stats) => {

                        if (err3) return res.status(500).json({ error: err3.message });

                        res.json({
                            success: true,
                            rating_count: stats.count,
                            avg_rating: stats.avg
                        });
                    }
                );
            }
        );
    });
});

/* --- حذف تقييم (للاختبار) --- */
app.delete("/api/works/:id/rate", (req, res) => {
    db.run(
        "DELETE FROM ratings WHERE work_id = ?",
        [req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, deleted: this.changes });
        }
    );
});

/* =====================================================
   CONTACT MESSAGES
===================================================== */

/* --- إرسال رسالة --- */
app.post("/api/messages", (req, res) => {

    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: "الاسم والبريد والرسالة مطلوبين" });
    }

    db.run(
        `INSERT INTO messages (name, email, subject, message)
         VALUES (?, ?, ?, ?)`,
        [name, email, subject || null, message],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

/* --- جلب كل الرسائل (للأدمن) --- */
app.get("/api/messages", (req, res) => {
    db.all(
        "SELECT * FROM messages ORDER BY created_at DESC",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        }
    );
});

/* --- عدد الرسائل غير المقروءة --- */
app.get("/api/messages/unread/count", (req, res) => {
    db.get(
        "SELECT COUNT(*) AS count FROM messages WHERE is_read = 0",
        [],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ count: row ? row.count : 0 });
        }
    );
});

/* --- تعليم رسالة كمقروءة --- */
app.put("/api/messages/:id/read", (req, res) => {
    db.run(
        "UPDATE messages SET is_read = 1 WHERE id = ?",
        [req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

/* --- حذف رسالة --- */
app.delete("/api/messages/:id", (req, res) => {
    db.run(
        "DELETE FROM messages WHERE id = ?",
        [req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

/* =====================================================
   تشغيل السيرفر
===================================================== */

app.listen(PORT, () => {
    console.log("=====================================");
    console.log("🎬 WOLFCINEMA Backend شغال");
    console.log(`🌐 API: http://localhost:${PORT}`);
    console.log(`🔧 لوحة التحكم: http://localhost:${PORT}/admin`);
    console.log("=====================================");
});
