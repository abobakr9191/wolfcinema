/* =====================================================
   WOLFCINEMA — DETAILS JAVASCRIPT
===================================================== */

"use strict";

const API_URL = window.location.origin + "/api";
const SERVER_URL = window.location.origin;

/* =====================================================
   البيانات المحلية
===================================================== */

const movies = [
    { id: "spider-man", title: "Spider-Man: Brand New Day", image: "assets/movies/spider-man.jpg", type: "فيلم", year: "2026", genre: "أكشن • مغامرة", description: "بعد أحداث مليئة بالفقد والتضحية، يجد بيتر باركر نفسه وحيدًا في مدينة لا تتذكره، ومسؤوليات البطل الخارق تثقل كاهله أكثر من أي وقت مضى. لكن عندما تظهر تهديدات جديدة تهدد حياة من يحب، يقرر بيتر أن يبدأ صفحة جديدة، ليكتشف أن الطريق إلى الخلاص قد يكون أخطر مما تخيل." },
    { id: "shelter", title: "Shelter", image: "assets/movies/shelter.jpg", type: "فيلم", year: "2026", genre: "أكشن • إثارة", description: "قاتل محترف متقاعد، طفلة هاربة، ومنظومة استخباراتية كاملة تريد رأسهما. عندما ينقذ العميل السابق مايكل ماسون طفلة غامضة من الغرق في جزيرة معزولة، ينفجر ماضيه الدموي في وجهه، ليتحول فجأة إلى الهدف الأول لأخطر قتلة العالم، في مطاردة لا ترحم لا مجال فيها للخطأ." },
    { id: "moana", title: "Moana", image: "assets/movies/moana.jpg", type: "فيلم", year: "2026", genre: "مغامرة • فانتازيا", description: "بعد أن اختارتها المحيطات نفسها، تنطلق موانا في رحلة ملحمية عبر أعالي البحار لاكتشاف أسرار أسلافها. بمساعدة النصف إله ماوي، تواجه عواصف عاتية ووحوش أسطورية في سبيل إعادة قلب تيفيتي وإنقاذ شعبها من لعنة قديمة، في رحلة ستغير مصير جزيرتها إلى الأبد." },
    { id: "runner", title: "Runner", image: "assets/movies/runner.jpg", type: "فيلم", year: "2026", genre: "أكشن • إثارة", description: "هانك مالون، جندي سابق تحول إلى مندوب توصيل، يعتقد أن مهمته الأخيرة مجرد رحلة عادية. لكنه يجد نفسه في سباق مميت مع الزمن، مطاردًا من عصابة كارتيل مسلحة تسعى لسرقة كبد متبرع به يخص طفلة تحتضر. في شوارع المدينة، تتحول مهمة الرحمة إلى مطاردة نارية لا هوادة فيها، حيث كل ثانية قد تعني حياة أو موت." },
    { id: "motor-city", title: "Motor City", image: "assets/movies/motor-city.jpg", type: "فيلم", year: "2026", genre: "أكشن • جريمة", description: "في مدينة يعشش فيها الفساد في كل زاوية، يخرج شاب من ظلام السجون ليجد أن العصابة التي دمرت حياته ما زالت تسيطر على كل شيء. بلا سلطة ولا حلفاء، يقرر أن يخوض حربه الخاصة ضد عالم الجريمة، ليكتشف أن الانتقام قد يكون الدرب الوحيد لإعادة ما سُلب منه." },
    { id: "one-piece-film-red", title: "One Piece Film: Red", image: "assets/movies/one-piece-film-red.jpg", type: "فيلم", year: "2022", genre: "أنمي • مغامرة", description: "في حفلة موسيقية عالمية تستقطب ملايين المعجبين، تتقاطع خطوط المغنية الأسطورية أوتا مع طاقم قبعة القش. ما لا يعرفه أحد أن أوتا هي ابنة القرصان الأسطوري شانكس، وأن صدى أنغامها سيوقظ أسرارًا دفنت منذ زمن بعيد، ليصبح العالم على موعد مع حقيقة قد تقلب موازين كل شيء." },
    { id: "wlad-raz-1", title: "ولاد رزق 1", image: "assets/movies/wlad-raz-1.jpg", type: "فيلم", year: "2015", genre: "دراما • أكشن", description: "أربعة أشقاء يجمعهم الدم والإجرام في آنٍ واحد، يخوضون عمليات سرقة باحترافية خارقة تحت إمرة أخوهم الأكبر رضا. لكن عندما تتسلل يد الخيانة إلى داخل العصابة وتتفكك الروابط، تجد العائلة نفسها في مواجهة خطة انتقام قاتلة تهدد بتدمير كل ما بنوه، وتكشف أن الدم لا يكون دائمًا أقوى من الطموح." },
    { id: "wlad-raz-2", title: "ولاد رزق 2", image: "assets/movies/wlad-raz-2.jpg", type: "فيلم", year: "2019", genre: "دراما • أكشن", description: "بعد سنوات من التشتت، يعود الأشقاء للعمل معًا في عملية سرقة هي الأضخم في تاريخهم. لكن ما يبدو أنه عودة إلى القمة يتحول إلى مواجهة قاتلة مع أعداء لا يعرفون الرحمة، وظروف تضع ولاءهم للعائلة على المحك. في هذا الجزء، كل خطوة محسوبة، وكل قرار قد يكون الأخير." },
    { id: "mortal-kombat-2", title: "Mortal Kombat 2", image: "assets/movies/mortal-kombat-2.jpg", type: "فيلم", year: "2026", genre: "أكشن • فانتازيا", description: "تعود البطولة القتالية الأشرس بين أبطال الأرض وعوالم الظلام، لكن هذه المرة الخطر أكبر من أي وقت مضى. تحالفات جديدة تنشأ، وأعداء أقوى يستعدون للهجوم، بينما يقف مقاتلو الأرض أمام اختبار مصيري لتحديد مستقبل الكوكب، حيث الهزيمة لا تعني الخسارة فقط، بل الفناء الكامل." },
    { id: "captain-america-brave-new-world", title: "Captain America: Brave New World", image: "assets/movies/captain-america.jpg", type: "فيلم", year: "2025", genre: "أكشن • مغامرة", description: "بعد أن حمل سام ويلسون الدرع رسميًا، يجد نفسه أمام مهمة لا تحتمل الخطأ: مواجهة مؤامرة دولية تهدد بإشعال حرب عالمية. بين ولائه لبلده ومسؤوليته تجاه العالم، يقف سام في وجه قوى خفية تتحرك في الظل، ليكتشف أن أعظم معركة قد تكون معركة المبادئ وليس الأعداء." },
    { id: "kraven", title: "Kraven the Hunter", image: "assets/movies/kraven.jpg", type: "فيلم", year: "2024", genre: "أكشن • مغامرة", description: "قصة صعود واحدة من أشرس الشخصيات في عالم مارفل، حيث يتحول صبي مدلل إلى صياد لا يرحم يحمل بداخله ندوب ماضٍ دموي. في رحلة انتقام وصراع على الهوية، يصبح كرافن صيادًا للفرائس البشرية، ليكتشف أن أخطر الوحوش ليست في الأدغال، بل في ذكريات الماضي." },
    { id: "lion-fest", title: "Lion Fest", image: "assets/movies/lion-fest.jpg", type: "فيلم", year: "2026", genre: "أكشن", description: "بطل يمتلك قوة القبضة الخارقة يخوض معركة شرسة ضد قوى الظلام التي تحاول السيطرة على مدينته. في سلسلة من المواجهات المتتالية، يكتشف أن القوة الحقيقية لا تكمن في قبضته، بل في إرادته على الحماية والوفاء لمن يحب." }
];

const series = [
    { id: "reacher", title: "Reacher", image: "assets/series/reacher.jpg", type: "مسلسل", year: "2022", genre: "أكشن • جريمة", description: "جاك ريتشر، شرطي عسكري سابق يتجول بين المدن بلا وجهة، يستخدم عقله التحليلي وقوته البدنية الهائلة لكشف المؤامرات التي تهدد الأبرياء. في كل مدينة يزورها، يجد نفسه منجذبًا نحو الجرائم التي تحتاج إلى عدالة لا ترحم، ليطبق قانونًا خاصًا به لا يعرف المساومة." },
    { id: "the-mentalist", title: "The Mentalist", image: "assets/series/the-mentalist.jpg", type: "مسلسل", year: "2008", genre: "جريمة • غموض", description: "باتريك جين، مستشار عبقري بقدرات ملاحظة خارقة، يستطيع كشف أدق التفاصيل التي تغيب عن أعين المحققين. لكن وراء ابتسامته الهادئة تسكن رغبة انتقامية دفينة تجاه ريد جون، القاتل الذي أخذ منه عائلته. بين حل القضايا المستحيلة ومطاردته الشخصية لعدوه الأول، تتشابك مسيرته بين العدالة والانتقام." },
    { id: "fakhr-el-delta", title: "فخر الدلتا", image: "assets/series/fakhr-el-delta.jpg", type: "مسلسل", year: "2026", genre: "دراما", description: "في قلب الدلتا حيث تختلط رائحة الأرض الطيبة بتعب الفلاحين، تنطلق قصة مجموعة من الشباب يحلمون بمستقبل مختلف. وسط تحديات الحياة القاسية وصراع بين القديم والجديد، يحاولون أن يثبتوا أن الطموح لا يعرف المستحيل، وأن الأرض التي ربتهم قادرة على احتضان أحلامهم مهما كلفها ذلك." },
    { id: "game-of-thrones", title: "Game of Thrones", image: "assets/series/game-of-thrones.jpg", type: "مسلسل", year: "2011", genre: "فانتازيا • دراما", description: "في قارة ويستروس، تتصارع العائلات النبيلة على العرش الحديدي بكل ما أوتيت من دهاء وخيانة وسيوف. وبينما تشتعل ألاعيب السلطة، يستيقظ في الشمال خطر أقدم وأفتك: جيش الموتى السائرين يتقدم، حاملًا معه نهاية كل شيء. ملحمة ملوك وأبطال، حيث لا أحد يفوز بالعرش دون ثمن باهظ." }
];

const anime = [
    { id: "one-piece", title: "ون بيس", image: "assets/anime/one-piece.jpg", type: "أنمي", year: "1999", genre: "أكشن • مغامرة", description: "في عالم تسيطر عليه البحار، ينطلق مونكي د. لوفي، الفتى المطاطي، في رحلة ملحمية للبحث عن الكنز الأسطوري «ون بيس» ليتوج ملكًا للقراصنة. مع طاقم قبعة القش، يواجه قراصنة وحوشًا وبحريات قاتلة، في قصة عن الحرية والصداقة والحلم الذي لا يقهر." },
    { id: "jujutsu-kaisen", title: "جوجوتسو كايسن", image: "assets/anime/jjk.jpg", type: "أنمي", year: "2020", genre: "أكشن • فانتازيا", description: "بعد أن يبتلع يوجي إيتادوري لعنة أسطورية، يجد نفسه منقادًا إلى عالم السحرة السري. ينضم لمدرسة جوجوتسو ليتعلم مواجهة الأرواح الملعونة التي تهدد البشرية، لكن القوة التي يحملها داخل جسده قد تكون أخطر مما يظن، وقد تكون نهايته أقرب مما يتخيل." },
    { id: "demon-slayer", title: "ديمون سلاير", image: "assets/anime/demon-slayer.jpg", type: "أنمي", year: "2019", genre: "أكشن • فانتازيا", description: "بعد أن فقد تانجيرو عائلته وتحولت شقيقته إلى شيطان، يبدأ رحلة يائسة لإنقاذها. ينضم لفيلق قتلة الشياطين، حيث يخوض معارك دامية ضد وحوش لا تعرف الرحمة، في رحلة يملؤها الألم والأمل والانتقام، ليكتشف أن قوته الحقيقية تنبع من حبه لأخته." },
    { id: "black-clover", title: "بلاك كلوفر", image: "assets/anime/black-clover.jpg", type: "أنمي", year: "2017", genre: "أكشن • فانتازيا", description: "في عالم يحكمه السحر، وُلد أستا بلا أي موهبة سحرية، حاملًا حلمًا مستحيلًا: أن يصبح إمبراطور السحر. بكتاب نادر يمنحه قوة إبطال السحر، يتحدى أستا كل التوقعات، ليخوض معركة طويلة أمام أعداء أقوى منه، ويعلّم الجميع أن اليأس أضعف من الإصرار." },
    { id: "solo-leveling", title: "سولو ليفيلينج", image: "assets/anime/solo-leveling.jpg", type: "أنمي", year: "2024", genre: "أكشن • فانتازيا", description: "في عالم أصبح فيه الصيد مهنة قاتلة، يعد سونغ جين-وو أضعف الصيادين على الإطلاق. لكن عندما يُترك ليموت داخل زنزانة لا نهائية، يحصل على نظام غامض يمنحه قدرة تطوير لا حدود لها. ليبدأ صعوده من الفشل إلى قمة الظلال، في رحلة تلقي بظلالها على مصير العالم كله." },
    { id: "naruto", title: "ناروتو", image: "assets/anime/naruto.jpg", type: "أنمي", year: "2002", genre: "أكشن • نينجا", description: "في قرية كونوها حيث النينجا شرف ودم، وُلد ناروتو وحيدًا، يحمل داخله ثعلبًا أسطوريًا يقرض أهواله على الجميع. نبذه الناس، لكنه لم يستسلم. بإرادة حديدية وحلم أكبر من عمره، يسعى ليصبح الهوكاجي، ليثبت للعالم أن من كان منبوذًا قد يصبح الحامي الأعظم لقريته." },
    { id: "bleach", title: "بليتش", image: "assets/anime/bleach.jpg", type: "أنمي", year: "2004", genre: "أكشن • فانتازيا", description: "بعد أن يكتسب إيتشيغو كروساكي قدرات الشينيغامي في ليلة دامية، يصبح المسؤول عن حماية البشر من وحوش الهولو والسفاحين. بين تدريبه الشاق ومعاركه المتصاعدة، يكتشف أن قدراته لم تُمنح له بالصدفة، وأن مصيره أعظم مما يتخيل، وأن عليه حماية التوازن بين عالمين لا يعرف عنهما إلا القليل." }
];

const allContent = [...movies, ...series, ...anime];

/* =====================================================
   Backend Helper
===================================================== */

async function fetchWorkFromBackend(workId) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${API_URL}/works/${workId}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.log("ℹ️ السيرفر مش متاح");
        return null;
    }
}

/* =====================================================
   التشغيل
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("WOLFCINEMA DETAILS: START");

    /* ===== الخطوة 1: قراءة الـ ID ===== */

    const urlParams = new URLSearchParams(window.location.search);
    const workId    = urlParams.get("id");
    const detailsWrapper = document.getElementById("detailsWrapper");

    if (!detailsWrapper) {
        console.error("detailsWrapper غير موجود");
        return;
    }

    if (!workId) {
        detailsWrapper.innerHTML = `
            <div style="text-align:center;padding:80px 20px">
                <h2>لم يتم تحديد عمل</h2>
                <a href="../index.html" class="btn btn-back">← الرئيسية</a>
            </div>`;
        return;
    }

    /* ===== الخطوة 2: جلب بيانات العمل ===== */

    let work = allContent.find(item => String(item.id) === String(workId));
    let imagePath = "../assets/images/placeholder.jpg";
    let isLocal = false;

    if (work) {
        imagePath = "../" + work.image;
        isLocal = true;
    }

    if (!work) {

        const apiWork = await fetchWorkFromBackend(workId);

        if (apiWork) {

            work = {
                id: apiWork.id,
                title: apiWork.title,
                type: apiWork.type,
                year: apiWork.year || "-",
                genre: apiWork.genre || "-",
                description: apiWork.description || ""
            };

            imagePath = apiWork.poster
                ? (apiWork.poster.startsWith("http")
                    ? apiWork.poster
                    : `${SERVER_URL}/${apiWork.poster}`)
                : "../assets/images/placeholder.jpg";
        }
    }

    if (!work) {
        detailsWrapper.innerHTML = `
            <div style="text-align:center;padding:80px 20px">
                <h2>عذراً، العمل غير موجود!</h2>
                <a href="../index.html" class="btn btn-back">← الرئيسية</a>
            </div>`;
        return;
    }

    /* ===== الخطوة 3: جلب الحلقات والمواسم ===== */

    let episodesHTML = "";

    if (!isLocal) {

        try {

            const res = await fetch(`${API_URL}/works/${workId}`);

            if (res.ok) {

                const apiWork = await res.json();

                const seasons  = apiWork.seasons  || [];
                const episodes = apiWork.episodes || [];

                /* ============================================
                   حالة 1: العمل ده "أب" عنده مواسم
                ============================================ */
                if (seasons.length > 0) {

                    const totalEps = seasons.reduce(
                        (sum, s) => sum + (s.episodes || []).length,
                        0
                    );

                    console.log(`📺 العمل ده أب عنده ${seasons.length} مواسم و ${totalEps} حلقة`);

                    /* أزرار المواسم */
                    const seasonsTabsHTML = `
                        <div class="seasons-tabs">
                            ${seasons.map((s, i) => `
                                <button class="season-tab ${i === 0 ? "active" : ""}"
                                        data-season-id="${s.id}">
                                    ${s.title || "الموسم " + (s.season_number || i + 1)}
                                    <span class="season-count">${(s.episodes || []).length}</span>
                                </button>
                            `).join("")}
                        </div>
                    `;

                    /* محتوى كل موسم */
                    const seasonsContentHTML = seasons.map((s, idx) => {

                        const seasonPoster = s.poster
                            ? (s.poster.startsWith("http")
                                ? s.poster
                                : `${SERVER_URL}/${s.poster}`)
                            : imagePath;

                        const epsList = (s.episodes || []).sort(
                            (a, b) => (a.number || 0) - (b.number || 0)
                        );

                        const episodeCards = epsList.length > 0
                            ? epsList.map(ep => `
                                <a class="episode-card"
                                   href="watch.html?id=${s.id}&ep=${ep.number}&season=${s.season_number || 1}">
                                    <div class="episode-thumb">
                                        <img src="${seasonPoster}"
                                             alt="الحلقة ${ep.number}"
                                             loading="lazy"
                                             onerror="this.src='../assets/images/placeholder.jpg'">
                                        <span class="episode-play">▶</span>
                                        <span class="episode-num">حلقة ${ep.number}</span>
                                    </div>
                                    <div class="episode-info">
                                        <h4 class="episode-title">${ep.title || "الحلقة " + ep.number}</h4>
                                        <span class="episode-count">${ep.video ? "🎥 متاحة" : "⚠️ لا يوجد فيديو"}</span>
                                    </div>
                                </a>
                            `).join("")
                            : `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666;">
                                   لا توجد حلقات في هذا الموسم بعد
                               </div>`;

                        return `
                            <div class="season-content ${idx === 0 ? "active" : ""}"
                                 data-season-id="${s.id}">
                                <div class="episodes-grid">
                                    ${episodeCards}
                                </div>
                            </div>
                        `;
                    }).join("");

                    episodesHTML = `
                        <section class="episodes-section">
                            <div class="episodes-header">
                                <span class="episodes-line"></span>
                                <h2>📺 المواسم</h2>
                                <span class="episodes-count">${seasons.length} موسم • ${totalEps} حلقة</span>
                            </div>

                            ${seasonsTabsHTML}

                            <div class="seasons-container">
                                ${seasonsContentHTML}
                            </div>
                        </section>
                    `;

                }
                /* ============================================
                   حالة 2: عمل عادي - حلقاته مباشرة
                ============================================ */
                else if (episodes.length > 0) {

                    console.log(`📺 العمل ده عنده ${episodes.length} حلقة`);

                    const episodeCards = episodes.map(ep => `
                        <a class="episode-card"
                           href="watch.html?id=${work.id}&ep=${ep.number}">
                            <div class="episode-thumb">
                                <img src="${imagePath}"
                                     alt="الحلقة ${ep.number}"
                                     loading="lazy"
                                     onerror="this.src='../assets/images/placeholder.jpg'">
                                <span class="episode-play">▶</span>
                                <span class="episode-num">حلقة ${ep.number}</span>
                            </div>
                            <div class="episode-info">
                                <h4 class="episode-title">${ep.title || "الحلقة " + ep.number}</h4>
                                <span class="episode-count">${ep.video ? "🎥 متاحة" : "⚠️ لا يوجد فيديو"}</span>
                            </div>
                        </a>
                    `).join("");

                    episodesHTML = `
                        <section class="episodes-section">
                            <div class="episodes-header">
                                <span class="episodes-line"></span>
                                <h2>📺 الحلقات</h2>
                                <span class="episodes-count">${episodes.length} حلقة</span>
                            </div>
                            <div class="episodes-grid">
                                ${episodeCards}
                            </div>
                        </section>
                    `;
                }
                /* ============================================
                   حالة 3: مفيش حلقات ولا مواسم
                ============================================ */
                else {
                    console.log("ℹ️ العمل ده مش عنده حلقات ولا مواسم");
                }
            }

        } catch (err) {
            console.log("ℹ️ مش قادر أجيب الحلقات:", err);
        }
    }

    /* ===== الخطوة 4: عرض الصفحة ===== */

    detailsWrapper.innerHTML = `
        <div class="details-hero" style="background-image:
            linear-gradient(to top, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.85) 45%, rgba(10,10,15,0.4) 100%),
            url('${imagePath}');">

            <div class="details-container">

                <div class="details-poster-wrap">
                    <img src="${imagePath}"
                         alt="${work.title}"
                         class="details-poster"
                         onerror="this.src='../assets/images/placeholder.jpg'">
                </div>

                <div class="details-info">
                    <span class="details-type">${work.type}</span>
                    <h1 class="details-title">${work.title}</h1>

                    <div class="meta-tags">
                        <span class="meta-tag">📅 ${work.year}</span>
                        <span class="meta-tag">🎬 ${work.genre}</span>
                    </div>

                    <p class="details-desc">${work.description}</p>

                    <div class="action-buttons">
                        <a href="watch.html?id=${work.id}" class="btn btn-watch">▶ مشاهدة الآن</a>
                        <button class="btn btn-favorite" id="favoriteBtn" data-id="${work.id}">
                            <span class="fav-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                            </span>
                            <span class="fav-text">أضف للمفضلة</span>
                        </button>
                        <button class="btn btn-share-trigger" id="shareBtn">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="18" cy="5" r="3"/>
                                    <circle cx="6" cy="12" r="3"/>
                                    <circle cx="18" cy="19" r="3"/>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                                </svg>
                            </span>
                            <span>مشاركة</span>
                        </button>
                        <a href="../index.html" class="btn btn-back">← الرئيسية</a>
                    </div>

                    <div class="rating-section" id="ratingSection">

                        <div class="rating-stars-wrap">
                            <span class="rating-label">قيّم هذا العمل:</span>
                            <div class="rating-stars" id="ratingStars">
                                <button class="star" data-value="1" aria-label="1">★</button>
                                <button class="star" data-value="2" aria-label="2">★</button>
                                <button class="star" data-value="3" aria-label="3">★</button>
                                <button class="star" data-value="4" aria-label="4">★</button>
                                <button class="star" data-value="5" aria-label="5">★</button>
                            </div>
                            <div class="rating-user-text" id="ratingUserText">لم تقيّم بعد</div>
                        </div>

                        <div class="rating-stats">
                            <div class="rating-avg">
                                <strong id="ratingAvg">—</strong>
                                <span>/ 5</span>
                            </div>
                            <div class="rating-count">
                                <span id="ratingCount">0</span> تقييم
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>

        <!-- ===== قائمة المشاركة ===== -->
        <div class="share-menu" id="shareMenu">
            <div class="share-menu-content">

                <div class="share-header">
                    <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;display:inline-block;vertical-align:middle;margin-left:8px;">
                            <circle cx="18" cy="5" r="3"/>
                            <circle cx="6" cy="12" r="3"/>
                            <circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        شارك العمل
                    </h3>
                    <button class="share-close" id="shareClose">✕</button>
                </div>

                <div class="share-work-info">
                    <img src="${imagePath}" alt="${work.title}" onerror="this.src='../assets/images/placeholder.jpg'">
                    <div>
                        <strong>${work.title}</strong>
                        <span>${work.type} • ${work.year}</span>
                    </div>
                </div>

                <div class="share-buttons">

                    <button class="share-option share-whatsapp" data-platform="whatsapp">
                        <span class="share-icon">
                            <img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="واتساب" loading="lazy">
                        </span>
                        <span class="share-label">واتساب</span>
                    </button>

                    <button class="share-option share-facebook" data-platform="facebook">
                        <span class="share-icon">
                            <img src="https://cdn.simpleicons.org/facebook/1877F2" alt="فيسبوك" loading="lazy">
                        </span>
                        <span class="share-label">فيسبوك</span>
                    </button>

                    <button class="share-option share-twitter" data-platform="twitter">
                        <span class="share-icon">
                            <img src="https://cdn.simpleicons.org/x/FFFFFF" alt="X" loading="lazy">
                        </span>
                        <span class="share-label">X / تويتر</span>
                    </button>

                    <button class="share-option share-telegram" data-platform="telegram">
                        <span class="share-icon">
                            <img src="https://cdn.simpleicons.org/telegram/26A5E4" alt="تيليجرام" loading="lazy">
                        </span>
                        <span class="share-label">تيليجرام</span>
                    </button>

                    <button class="share-option share-tiktok" data-platform="tiktok">
                        <span class="share-icon">
                            <img src="https://cdn.simpleicons.org/tiktok/FFFFFF" alt="تيك توك" loading="lazy">
                        </span>
                        <span class="share-label">تيك توك</span>
                    </button>

                    <button class="share-option share-copy" data-platform="copy">
                        <span class="share-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                        </span>
                        <span class="share-label">نسخ الرابط</span>
                    </button>

                    <button class="share-option share-native" data-platform="native" id="nativeShareBtn" style="display:none;">
                        <span class="share-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                <polyline points="16 6 12 2 8 6"/>
                                <line x1="12" y1="2" x2="12" y2="15"/>
                            </svg>
                        </span>
                        <span class="share-label">مشاركة</span>
                    </button>

                </div>

                <div class="share-copied" id="shareCopied">✅ تم نسخ الرابط</div>

            </div>
        </div>

        ${episodesHTML}
    `;

    document.title = `${work.title} | WOLFCINEMA`;

    /* ===== تفعيل تبويبات المواسم ===== */
    const seasonTabs = document.querySelectorAll(".season-tab");

    if (seasonTabs.length > 0) {

        console.log("✅ تم العثور على", seasonTabs.length, "تاب موسم");

        seasonTabs.forEach(tab => {
            tab.addEventListener("click", () => {

                const seasonId = tab.dataset.seasonId;

                seasonTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");

                document.querySelectorAll(".season-content").forEach(content => {
                    content.classList.toggle("active", content.dataset.seasonId === seasonId);
                });
            });
        });
    }

    /* ===== الخطوة 5: نظام المفضلة ===== */

    const favoriteBtn = document.getElementById("favoriteBtn");

    if (favoriteBtn) {

        const FAVORITES_KEY = "wolfcinema_favorites";

        const getFavorites = () => {
            try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); }
            catch (e) { return []; }
        };

        const saveFavorites = (list) => {
            try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(list)); }
            catch (e) {}
        };

        const isFavorite = (id) => getFavorites().some(f => String(f.id) === String(id));

        const updateFavoriteBtn = () => {
            const icon = favoriteBtn.querySelector(".fav-icon svg");
            const text = favoriteBtn.querySelector(".fav-text");

            if (isFavorite(work.id)) {
                favoriteBtn.classList.add("active");
                if (icon) {
                    icon.setAttribute("fill", "currentColor");
                    icon.setAttribute("stroke", "none");
                }
                if (text) text.textContent = "في المفضلة";
            } else {
                favoriteBtn.classList.remove("active");
                if (icon) {
                    icon.setAttribute("fill", "none");
                    icon.setAttribute("stroke", "currentColor");
                }
                if (text) text.textContent = "أضف للمفضلة";
            }
        };

        favoriteBtn.addEventListener("click", () => {
            let favorites = getFavorites();
            const idx = favorites.findIndex(f => String(f.id) === String(work.id));

            if (idx === -1) {
                favorites.unshift({
                    id: work.id,
                    title: work.title,
                    type: work.type,
                    year: work.year,
                    genre: work.genre,
                    image: imagePath,
                    timestamp: Date.now()
                });
            } else {
                favorites.splice(idx, 1);
            }

            saveFavorites(favorites);
            updateFavoriteBtn();
        });

        updateFavoriteBtn();
    }

    /* ===== الخطوة 6: نظام التقييم بالنجوم ===== */

    const ratingSection = document.getElementById("ratingSection");

    if (ratingSection) {

        const RATING_KEY = "wolfcinema_user_ratings";

        const stars     = document.querySelectorAll("#ratingStars .star");
        const userText  = document.getElementById("ratingUserText");
        const avgEl     = document.getElementById("ratingAvg");
        const countEl   = document.getElementById("ratingCount");

        const getUserRating = (id) => {
            try {
                const data = JSON.parse(localStorage.getItem(RATING_KEY) || "{}");
                return data[id] || 0;
            } catch (e) { return 0; }
        };

        const setUserRating = (id, value) => {
            try {
                const data = JSON.parse(localStorage.getItem(RATING_KEY) || "{}");
                data[id] = value;
                localStorage.setItem(RATING_KEY, JSON.stringify(data));
            } catch (e) {}
        };

        const updateStarsDisplay = (hoverValue) => {

            const currentRating = hoverValue || getUserRating(work.id);

            stars.forEach(s => {
                const val = parseInt(s.dataset.value);
                s.classList.toggle("active", val <= currentRating);
            });

            const userRating = getUserRating(work.id);

            if (userRating > 0) {
                userText.textContent = `تقييمك: ${"★".repeat(userRating)}${"☆".repeat(5 - userRating)}`;
                userText.classList.add("rated");
            } else {
                userText.textContent = "لم تقيّم بعد";
                userText.classList.remove("rated");
            }
        };

        const loadRatingStats = async () => {
            try {
                const res = await fetch(`${API_URL}/works/${workId}`);
                if (!res.ok) return;

                const data = await res.json();
                const count = data.rating_count || 0;
                const avg   = data.avg_rating || 0;

                avgEl.textContent   = count > 0 ? avg : "—";
                countEl.textContent = count;
            } catch (err) {}
        };

        const submitRating = async (value) => {

            setUserRating(work.id, value);
            updateStarsDisplay();

            try {
                const res = await fetch(`${API_URL}/works/${workId}/rate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rating: value })
                });

                if (!res.ok) throw new Error("فشل الإرسال");

                const data = await res.json();

                avgEl.textContent   = data.avg_rating;
                countEl.textContent = data.rating_count;

            } catch (err) {
                console.log("ℹ️ التقييم اتحفظ محليًا");
            }
        };

        stars.forEach(star => {

            star.addEventListener("mouseenter", () => {
                const val = parseInt(star.dataset.value);
                stars.forEach(s => {
                    const sv = parseInt(s.dataset.value);
                    s.classList.toggle("hover", sv <= val);
                });
            });

            star.addEventListener("click", () => {
                const val = parseInt(star.dataset.value);
                submitRating(val);
            });
        });

        const starsContainer = document.getElementById("ratingStars");
        if (starsContainer) {
            starsContainer.addEventListener("mouseleave", () => {
                stars.forEach(s => s.classList.remove("hover"));
            });
        }

        updateStarsDisplay();
        loadRatingStats();
    }

    /* ===== الخطوة 7: نظام المشاركة ===== */

    const shareBtn   = document.getElementById("shareBtn");
    const shareMenu  = document.getElementById("shareMenu");
    const shareClose = document.getElementById("shareClose");

    if (shareBtn && shareMenu) {

        const pageURL = window.location.href;
        const shareText = `شاهد "${work.title}" على WOLFCINEMA 🎬`;

        function openShareMenu() {
            shareMenu.classList.add("active");
            document.body.style.overflow = "hidden";
        }

        function closeShareMenu() {
            shareMenu.classList.remove("active");
            document.body.style.overflow = "";
        }

        shareBtn.addEventListener("click", openShareMenu);
        shareClose.addEventListener("click", closeShareMenu);

        shareMenu.addEventListener("click", (e) => {
            if (e.target === shareMenu) closeShareMenu();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && shareMenu.classList.contains("active")) {
                closeShareMenu();
            }
        });

        if (navigator.share) {
            const nativeBtn = document.getElementById("nativeShareBtn");
            if (nativeBtn) nativeBtn.style.display = "flex";
        }

        const shareURLs = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + pageURL)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageURL)}`,
            twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageURL)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(pageURL)}&text=${encodeURIComponent(shareText)}`,
            tiktok:   `https://www.tiktok.com/`
        };

        document.querySelectorAll(".share-option").forEach(btn => {

            btn.addEventListener("click", async () => {

                const platform = btn.dataset.platform;

                if (platform === "copy") {
                    try {
                        await navigator.clipboard.writeText(pageURL);
                    } catch (err) {
                        const temp = document.createElement("input");
                        temp.value = pageURL;
                        document.body.appendChild(temp);
                        temp.select();
                        document.execCommand("copy");
                        document.body.removeChild(temp);
                    }

                    const copied = document.getElementById("shareCopied");
                    if (copied) {
                        copied.classList.add("show");
                        setTimeout(() => copied.classList.remove("show"), 2000);
                    }
                    return;
                }

                if (platform === "native") {
                    try {
                        await navigator.share({
                            title: work.title,
                            text: shareText,
                            url: pageURL
                        });
                        closeShareMenu();
                    } catch (err) {}
                    return;
                }

                if (shareURLs[platform]) {
                    window.open(shareURLs[platform], "_blank", "width=600,height=600");
                    closeShareMenu();
                }
            });
        });
    }

    console.log("WOLFCINEMA DETAILS: Loaded", work.title);
});