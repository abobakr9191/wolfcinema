/* =====================================================
   WOLFCINEMA — BACKEND SERVER (Turso Edition) - FIXED
===================================================== */

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");
const { createClient } = require("@libsql/client");

const app  = express();
const PORT = process.env.PORT || 3000;

/* ===== إعداد قاعدة البيانات ===== */
/* الإنتاج (Vercel / Fly.io): Turso Cloud */
/* التطوير المحلي: SQLite ملف محلي */

const TURSO_URL   = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let db;

if (TURSO_URL && TURSO_AUTH_TOKEN) {
    db = createClient({
        url: TURSO_URL,
        authToken: TURSO_AUTH_TOKEN
    });
    console.log("✅ متصل بـ Turso Cloud");
} else {
    const localDbPath = path.join(__dirname, "database.db");
    db = createClient({
        url: "file:" + localDbPath
    });
    console.log("✅ متصل بـ SQLite المحلي:", localDbPath);
}

/* ===== مجلد البيانات ===== */
const isVercel = process.env.VERCEL === "1";
const DATA_DIR = isVercel
    ? "/tmp"
    : (process.env.DATA_DIR || __dirname);

function safeMkdir(dir) {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (e) {
        console.warn("⚠️ تعذّر إنشاء المجلد:", dir, e.message);
    }
}

/* ===== Middleware ===== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== المجلدات ===== */
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const POSTERS_DIR = path.join(UPLOADS_DIR, "posters");
const VIDEOS_DIR  = path.join(UPLOADS_DIR, "videos");

[UPLOADS_DIR, POSTERS_DIR, VIDEOS_DIR].forEach(safeMkdir);

/* =====================================================
   خدمة الملفات الثابتة (Static Files)
===================================================== */

/* ←←← ده أهم سطر ناقص: بيقدم لوحة التحكم */
app.use("/admin", express.static(path.join(__dirname, "admin")));

/* خدمة الصور والفيديوهات */
app.use("/uploads", express.static(UPLOADS_DIR));

/* خدمة ملفات الواجهة الأمامية لو موجودة */
app.use(express.static(path.join(__dirname, "..")));

/* =====================================================
   إنشاء الجداول
===================================================== */

async function initDatabase() {
    try {
        await db.execute(`
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

        await db.execute(`
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

        await db.execute(`
            CREATE TABLE IF NOT EXISTS ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                work_id INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
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

        console.log("✅ الجداول جاهزة");
    } catch (err) {
        console.error("❌ خطأ في إنشاء الجداول:", err.message);
    }
}

initDatabase();

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
    limits: { fileSize: 1024 * 1024 * 1024 }
});

/* =====================================================
   API ROUTES
===================================================== */

app.get("/api", (req, res) => {
    res.json({ message: "WOLFCINEMA API شغال ✅ (Turso)" });
});

app.get("/api/stats", async (req, res) => {
    try {
        const totalR    = await db.execute("SELECT COUNT(*) AS total FROM works");
        const moviesR   = await db.execute("SELECT COUNT(*) AS c FROM works WHERE type='فيلم'");
        const seriesR   = await db.execute("SELECT COUNT(*) AS c FROM works WHERE type='مسلسل'");
        const animeR    = await db.execute("SELECT COUNT(*) AS c FROM works WHERE type='أنمي'");
        const featuredR = await db.execute("SELECT COUNT(*) AS c FROM works WHERE featured=1");
        const epsR      = await db.execute("SELECT COUNT(*) AS c FROM episodes");
        const unreadR   = await db.execute("SELECT COUNT(*) AS c FROM messages WHERE is_read=0");

        res.json({
            total: Number(totalR.rows[0].total),
            movies: Number(moviesR.rows[0].c),
            series: Number(seriesR.rows[0].c),
            anime: Number(animeR.rows[0].c),
            featured: Number(featuredR.rows[0].c),
            episodes: Number(epsR.rows[0].c),
            unreadMessages: Number(unreadR.rows[0].c)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/parents", async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT id, title, type, year FROM works
             WHERE parent_id IS NULL
             ORDER BY title ASC`
        );
        res.json(result.rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/works", async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT
                w.*,
                (SELECT COUNT(*) FROM episodes WHERE work_id = w.id) AS episode_count,
                (SELECT COUNT(*) FROM ratings WHERE work_id = w.id) AS rating_count,
                (SELECT ROUND(AVG(rating), 1) FROM ratings WHERE work_id = w.id) AS avg_rating,
                (SELECT COUNT(*) FROM works WHERE parent_id = w.id) AS season_count
            FROM works w
            ORDER BY w.created_at DESC
        `);
        res.json(result.rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/works/:id", async (req, res) => {
    try {
        const workR = await db.execute({
            sql: "SELECT * FROM works WHERE id = ?",
            args: [req.params.id]
        });

        if (!workR.rows.length) {
            return res.status(404).json({ error: "العمل غير موجود" });
        }

        const work = workR.rows[0];

        const seasonsR = await db.execute({
            sql: "SELECT * FROM works WHERE parent_id = ? ORDER BY season_number ASC, year ASC",
            args: [req.params.id]
        });

        const seasons = seasonsR.rows || [];

        if (seasons.length > 0) {
            const seasonIds = seasons.map(s => s.id);
            const placeholders = seasonIds.map(() => "?").join(",");

            const epsR = await db.execute({
                sql: `SELECT * FROM episodes WHERE work_id IN (${placeholders}) ORDER BY season ASC, number ASC`,
                args: seasonIds
            });

            const allEps = epsR.rows || [];
            seasons.forEach(s => {
                s.episodes = allEps.filter(e => e.work_id === s.id);
            });

            work.seasons = seasons;
            work.episodes = [];
            res.json(work);
        } else {
            const epsR = await db.execute({
                sql: "SELECT * FROM episodes WHERE work_id = ? ORDER BY season ASC, number ASC",
                args: [req.params.id]
            });

            work.episodes = epsR.rows || [];
            work.seasons = [];
            res.json(work);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post(
    "/api/works",
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "video",  maxCount: 1 }
    ]),
    async (req, res) => {
        try {
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

            const result = await db.execute({
                sql: `
                    INSERT INTO works (
                        title, type, year, genre, description,
                        poster, video, has_episodes,
                        rating, country, language, status, featured,
                        parent_id, season_number
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                    title,
                    type,
                    year || null,
                    genre || null,
                    description || null,
                    posterPath,
                    videoPath,
                    has_episodes === "true" ? 1 : 0,
                    rating || null,
                    country || null,
                    language || null,
                    status || null,
                    featured === "true" ? 1 : 0,
                    parent_id || null,
                    season_number || null
                ]
            });

            res.json({
                success: true,
                id: Number(result.lastInsertRowid),
                message: "تمت إضافة العمل"
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

app.put(
    "/api/works/:id",
    upload.fields([
        { name: "poster", maxCount: 1 },
        { name: "video",  maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const {
                title, type, year, genre, description,
                rating, country, language, status, featured,
                parent_id, season_number
            } = req.body;

            const oldR = await db.execute({
                sql: "SELECT poster, video FROM works WHERE id = ?",
                args: [req.params.id]
            });

            if (!oldR.rows.length) {
                return res.status(404).json({ error: "العمل غير موجود" });
            }

            const oldWork = oldR.rows[0];

            const newPoster = req.files?.poster
                ? "uploads/posters/" + req.files.poster[0].filename
                : null;

            const newVideo = req.files?.video
                ? "uploads/videos/" + req.files.video[0].filename
                : null;

            if (newPoster && oldWork.poster) {
                const full = path.join(DATA_DIR, oldWork.poster);
                if (fs.existsSync(full)) fs.unlinkSync(full);
            }

            if (newVideo && oldWork.video) {
                const full = path.join(DATA_DIR, oldWork.video);
                if (fs.existsSync(full)) fs.unlinkSync(full);
            }

            const finalPoster = newPoster || oldWork.poster;
            const finalVideo  = newVideo  || oldWork.video;

            await db.execute({
                sql: `
                    UPDATE works SET
                        title = ?, type = ?, year = ?, genre = ?, description = ?,
                        rating = ?, country = ?, language = ?, status = ?, featured = ?,
                        poster = ?, video = ?,
                        parent_id = ?, season_number = ?
                    WHERE id = ?
                `,
                args: [
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
                ]
            });

            res.json({ success: true, message: "تم التعديل" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

app.delete("/api/works/:id", async (req, res) => {
    try {
        const rowR = await db.execute({
            sql: "SELECT poster, video FROM works WHERE id = ?",
            args: [req.params.id]
        });

        if (rowR.rows.length) {
            const row = rowR.rows[0];
            [row.poster, row.video].forEach(p => {
                if (p) {
                    const full = path.join(DATA_DIR, p);
                    if (fs.existsSync(full)) fs.unlinkSync(full);
                }
            });
        }

        await db.execute({ sql: "DELETE FROM episodes WHERE work_id = ?", args: [req.params.id] });
        await db.execute({ sql: "DELETE FROM ratings WHERE work_id = ?", args: [req.params.id] });
        await db.execute({ sql: "UPDATE works SET parent_id = NULL WHERE parent_id = ?", args: [req.params.id] });
        await db.execute({ sql: "DELETE FROM works WHERE id = ?", args: [req.params.id] });

        res.json({ success: true, message: "تم الحذف" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post(
    "/api/works/:id/episodes",
    upload.fields([
        { name: "episode_poster", maxCount: 1 },
        { name: "episode_video",  maxCount: 1 }
    ]),
    async (req, res) => {
        try {
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

            const result = await db.execute({
                sql: `INSERT INTO episodes (work_id, season, number, title, video, poster)
                      VALUES (?, ?, ?, ?, ?, ?)`,
                args: [
                    req.params.id,
                    season || 1,
                    number,
                    title || null,
                    videoPath,
                    posterPath
                ]
            });

            res.json({ success: true, id: Number(result.lastInsertRowid) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

app.delete("/api/episodes/:id", async (req, res) => {
    try {
        const rowR = await db.execute({
            sql: "SELECT video, poster FROM episodes WHERE id = ?",
            args: [req.params.id]
        });

        if (rowR.rows.length) {
            const row = rowR.rows[0];
            [row.video, row.poster].forEach(p => {
                if (p) {
                    const full = path.join(DATA_DIR, p);
                    if (fs.existsSync(full)) fs.unlinkSync(full);
                }
            });
        }

        await db.execute({ sql: "DELETE FROM episodes WHERE id = ?", args: [req.params.id] });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/works/:id/rate", async (req, res) => {
    try {
        const { rating } = req.body;
        const workId = req.params.id;

        const value = parseInt(rating);
        if (!value || value < 1 || value > 5) {
            return res.status(400).json({ error: "التقييم لازم يكون بين 1 و 5" });
        }

        const workR = await db.execute({
            sql: "SELECT id FROM works WHERE id = ?",
            args: [workId]
        });

        if (!workR.rows.length) {
            return res.status(404).json({ error: "العمل غير موجود" });
        }

        await db.execute({
            sql: "INSERT INTO ratings (work_id, rating) VALUES (?, ?)",
            args: [workId, value]
        });

        const statsR = await db.execute({
            sql: `SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS avg
                  FROM ratings WHERE work_id = ?`,
            args: [workId]
        });

        res.json({
            success: true,
            rating_count: Number(statsR.rows[0].count),
            avg_rating: Number(statsR.rows[0].avg)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/works/:id/rate", async (req, res) => {
    try {
        const result = await db.execute({
            sql: "DELETE FROM ratings WHERE work_id = ?",
            args: [req.params.id]
        });
        res.json({ success: true, deleted: Number(result.rowsAffected) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =====================================================
   CONTACT MESSAGES
===================================================== */

app.post("/api/messages", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "الاسم والبريد والرسالة مطلوبين" });
        }

        const result = await db.execute({
            sql: `INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
            args: [name, email, subject || null, message]
        });

        res.json({ success: true, id: Number(result.lastInsertRowid) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/messages", async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM messages ORDER BY created_at DESC");
        res.json(result.rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/messages/unread/count", async (req, res) => {
    try {
        const result = await db.execute("SELECT COUNT(*) AS count FROM messages WHERE is_read = 0");
        res.json({ count: Number(result.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/messages/:id/read", async (req, res) => {
    try {
        await db.execute({
            sql: "UPDATE messages SET is_read = 1 WHERE id = ?",
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/messages/:id", async (req, res) => {
    try {
        await db.execute({
            sql: "DELETE FROM messages WHERE id = ?",
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =====================================================
   تشغيل السيرفر
===================================================== */

module.exports = app;

if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
        console.log("=====================================");
        console.log("🎬 WOLFCINEMA Backend شغال (Turso)");
        console.log(`🌐 API: http://localhost:${PORT}`);
        console.log(`🔒 الداشبورد: http://localhost:${PORT}/admin`);
        console.log(`📁 مجلد البيانات: ${DATA_DIR}`);
        console.log("=====================================");
    });
}