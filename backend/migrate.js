/* =====================================================
   WOLFCINEMA — Migration Script
   ينقل البيانات من database.db المحلي إلى Turso
   ===================================================== */

const sqlite3 = require("sqlite3").verbose();
const { createClient } = require("@libsql/client");
const path = require("path");

const OLD_DB_PATH = path.join(__dirname, "database.db");

const TURSO_URL   = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_TOKEN) {
    console.error("❌ TURSO_AUTH_TOKEN مش موجود");
    process.exit(1);
}

const oldDb = new sqlite3.Database(OLD_DB_PATH);
const newDb = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN
});

/* ===== helper: وعد للـ sqlite3 ===== */
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        oldDb.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function migrate() {

    console.log("🚀 بدء نقل البيانات...\n");

    /* ===== 1. الأعمال ===== */
    const works = await query("SELECT * FROM works");
    console.log(`📦 عدد الأعمال في القاعدة القديمة: ${works.length}`);

    for (const w of works) {
        await newDb.execute({
            sql: `
                INSERT INTO works (
                    id, title, type, year, genre, description,
                    poster, video, has_episodes, rating, country,
                    language, status, featured, parent_id, season_number,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
                w.id, w.title, w.type, w.year, w.genre, w.description,
                w.poster, w.video, w.has_episodes, w.rating, w.country,
                w.language, w.status, w.featured, w.parent_id, w.season_number,
                w.created_at
            ]
        });
        console.log(`   ✅ ${w.title}`);
    }

    /* ===== 2. الحلقات ===== */
    const episodes = await query("SELECT * FROM episodes");
    console.log(`\n📺 عدد الحلقات: ${episodes.length}`);

    for (const e of episodes) {
        await newDb.execute({
            sql: `
                INSERT INTO episodes (
                    id, work_id, season, number, title, video, poster, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
                e.id, e.work_id, e.season, e.number, e.title,
                e.video, e.poster, e.created_at
            ]
        });
    }
    console.log(`   ✅ تم نقل ${episodes.length} حلقة`);

    /* ===== 3. التقييمات ===== */
    const ratings = await query("SELECT * FROM ratings");
    console.log(`\n⭐ عدد التقييمات: ${ratings.length}`);

    for (const r of ratings) {
        await newDb.execute({
            sql: `
                INSERT INTO ratings (id, work_id, rating, created_at)
                VALUES (?, ?, ?, ?)
            `,
            args: [r.id, r.work_id, r.rating, r.created_at]
        });
    }
    console.log(`   ✅ تم نقل ${ratings.length} تقييم`);

    /* ===== 4. الرسائل ===== */
    const messages = await query("SELECT * FROM messages");
    console.log(`\n📬 عدد الرسائل: ${messages.length}`);

    for (const m of messages) {
        await newDb.execute({
            sql: `
                INSERT INTO messages (id, name, email, subject, message, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            args: [m.id, m.name, m.email, m.subject, m.message, m.is_read, m.created_at]
        });
    }
    console.log(`   ✅ تم نقل ${messages.length} رسالة`);

    console.log("\n🎉 اكتمل النقل بنجاح!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("❌ خطأ:", err.message);
    process.exit(1);
});