// ══════════════════════════════════════════════════════════
// معهد التأصيل العلمي — app.js
// نظام متعدد الصفحات مع Firebase Auth + Firestore
// ══════════════════════════════════════════════════════════

// ── مسار الصفحات ──
const PAGES = {
  landing:       "index.html",
  login:         "login.html",
  dashboard:     "dashboard.html",
  courses:       "courses.html",
  "course-detail":"courses.html",
  tests:         "tests.html",
  schedule:      "schedule.html",
  qa:            "qa.html",
  "about-app":   "about.html",
  profile:       "profile.html",
  admin:         "admin.html",
  "admin-qa":    "admin.html",
};

// الصفحة الحالية من اسم الملف
function currentPage(){
  const f = location.pathname.split("/").pop() || "index.html";
  const m = {"index.html":"landing","login.html":"login","dashboard.html":"dashboard",
    "courses.html":"courses","tests.html":"tests","schedule.html":"schedule",
    "qa.html":"qa","about.html":"about-app","profile.html":"profile","admin.html":"admin"};
  return m[f] || "landing";
}

// التنقل بين الصفحات
function goTo(page){
  const file = PAGES[page];
  const cur  = (location.pathname.split("/").pop()) || "index.html";
  if(file && file !== cur){
    sessionStorage.setItem("_goto", page);
    location.href = file;
  } else {
    _renderPage(page);
  }
}

// ── متغيرات الحالة ──
const LS  = k=>{ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; }};
const SS  = (k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };

let APP = {
  user: null,
  courses: LS("ti_courses") || [{"id": 1, "title": "مدخل إلى طلب العلم", "icon": "compass", "color": "#b8965e", "visible": true, "description": "تأسيس صحيح لمنهج طالب العلم الشرعي", "info": "مقرر مدخل إلى طلب العلم — المرحلة: تمهيدي", "_order": 0, "lessons": [{"id": 1, "title": "مقدمة ومدخل — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 2, "title": "تذكرة السامع والمتكلم", "icon": "ear", "color": "#a07840", "visible": true, "description": "آداب العلم والتعلم والمعلم", "info": "مقرر تذكرة السامع والمتكلم — المرحلة: تمهيدي", "_order": 1, "lessons": [{"id": 1, "title": "مقدمة ومدخل — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 3, "title": "الجرد القرآني التطبيقي", "icon": "book-open", "color": "#8B6914", "visible": true, "description": "تطبيق عملي يختاره الشيخ لمراجعة القرآن", "info": "مقرر الجرد القرآني التطبيقي — المرحلة: تمهيدي", "_order": 2, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 4, "title": "القواعد الأربع", "icon": "square", "color": "#3B1B40", "visible": true, "description": "قواعد التوحيد الأربع للإمام محمد بن عبد الوهاب", "info": "مقرر القواعد الأربع — المرحلة: أول", "_order": 3, "lessons": [{"id": 1, "title": "مقدمة ومدخل — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 5, "title": "نواقض الإسلام", "icon": "alert-triangle", "color": "#4a2250", "visible": true, "description": "النواقض العشرة التي تنقض الإسلام", "info": "مقرر نواقض الإسلام — المرحلة: أول", "_order": 4, "lessons": [{"id": 1, "title": "مقدمة ومدخل — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 6, "title": "الأصول الثلاثة وأدلتها", "icon": "triangle", "color": "#5a2d63", "visible": true, "description": "معرفة الله ودينه ونبيه محمد ﷺ", "info": "مقرر الأصول الثلاثة وأدلتها — المرحلة: أول", "_order": 5, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 7, "title": "كشف الشبهات", "icon": "shield", "color": "#3B1B40", "visible": true, "description": "كشف شبهات المشركين في مسائل التوحيد", "info": "مقرر كشف الشبهات — المرحلة: أول", "_order": 6, "lessons": [{"id": 1, "title": "مقدمة ومدخل — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 8, "title": "متن الآجرومية", "icon": "pen-line", "color": "#1a5276", "visible": true, "description": "متن النحو الأساسي للمبتدئين", "info": "مقرر متن الآجرومية — المرحلة: ثانٍ", "_order": 7, "lessons": [{"id": 1, "title": "مقدمة ومدخل — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 9, "title": "التذكرة في علوم الحديث", "icon": "scroll", "color": "#1b4f72", "visible": true, "description": "مقدمة في مصطلح الحديث لابن الملقن", "info": "مقرر التذكرة في علوم الحديث — المرحلة: ثانٍ", "_order": 8, "lessons": [{"id": 1, "title": "مقدمة ومدخل — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 10, "title": "الأرجوزة الميئية في السيرة", "icon": "star", "color": "#154360", "visible": true, "description": "السيرة النبوية في نظم شعري مختصر", "info": "مقرر الأرجوزة الميئية في السيرة — المرحلة: ثانٍ", "_order": 9, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 11, "title": "الرسالة اللطيفة في أصول الفقه", "icon": "file-text", "color": "#0e3251", "visible": true, "description": "مقدمة في أصول الفقه للسعدي", "info": "مقرر الرسالة اللطيفة في أصول الفقه — المرحلة: ثانٍ", "_order": 10, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 12, "title": "الأربعون النووية", "icon": "list", "color": "#1a5276", "visible": true, "description": "أربعون حديثاً نبوياً مع زيادات ابن رجب", "info": "مقرر الأربعون النووية — المرحلة: ثانٍ", "_order": 11, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 13, "title": "مقدمات التفقه", "icon": "layers", "color": "#117a65", "visible": true, "description": "مقدمات في فقه الفقه للسفاريني وابن رجب", "info": "مقرر مقدمات التفقه — المرحلة: ثالث", "_order": 12, "lessons": [{"id": 1, "title": "مقدمة ومدخل — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 14, "title": "متن الأخضري في العبادات", "icon": "moon", "color": "#0e6655", "visible": true, "description": "العبادات الأساسية في الفقه المالكي", "info": "مقرر متن الأخضري في العبادات — المرحلة: ثالث", "_order": 13, "lessons": [{"id": 1, "title": "مقدمة ومدخل — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 15, "title": "متن العشماوية", "icon": "book", "color": "#117a65", "visible": true, "description": "مختصر في الفقه المالكي", "info": "مقرر متن العشماوية — المرحلة: ثالث", "_order": 14, "lessons": [{"id": 1, "title": "مقدمة ومدخل — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 16, "title": "نظم ابن أبي كف", "icon": "music", "color": "#0d5e4a", "visible": true, "description": "أدلة المذهب المالكي في نظم شعري", "info": "مقرر نظم ابن أبي كف — المرحلة: ثالث", "_order": 15, "lessons": [{"id": 1, "title": "مقدمة ومدخل — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 17, "title": "نظم المرشد المعين لابن عاشر", "icon": "map", "color": "#117a65", "visible": true, "description": "دراسة نقدية للمرشد المعين", "info": "مقرر نظم المرشد المعين لابن عاشر — المرحلة: ثالث", "_order": 16, "lessons": [{"id": 1, "title": "مقدمة ومدخل — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 18, "title": "منظومة القواعد الفقهية", "icon": "grid", "color": "#0a4d3a", "visible": true, "description": "القواعد الفقهية الكبرى في نظم ابن سند", "info": "مقرر منظومة القواعد الفقهية — المرحلة: ثالث", "_order": 17, "lessons": [{"id": 1, "title": "مقدمة ومدخل — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 19, "title": "مقدمة في أصول التفسير", "icon": "search", "color": "#6e2f0a", "visible": true, "description": "أصول تفسير القرآن لابن تيمية", "info": "مقرر مقدمة في أصول التفسير — المرحلة: رابع", "_order": 18, "lessons": [{"id": 1, "title": "مقدمة ومدخل — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 20, "title": "كتاب التوحيد", "icon": "heart", "color": "#7d3410", "visible": true, "description": "كتاب التوحيد للشيخ محمد بن عبد الوهاب", "info": "مقرر كتاب التوحيد — المرحلة: رابع", "_order": 19, "lessons": [{"id": 1, "title": "مقدمة ومدخل — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 21, "title": "القواعد السلفية في الأسماء والصفات", "icon": "settings", "color": "#6e2f0a", "visible": true, "description": "قواعد وضوابط في باب الأسماء والصفات", "info": "مقرر القواعد السلفية في الأسماء والصفات — المرحلة: رابع", "_order": 20, "lessons": [{"id": 1, "title": "مقدمة ومدخل — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 22, "title": "العقيدة الواسطية", "icon": "award", "color": "#8b3c11", "visible": true, "description": "متن العقيدة الواسطية لابن تيمية", "info": "مقرر العقيدة الواسطية — المرحلة: رابع", "_order": 21, "lessons": [{"id": 1, "title": "مقدمة ومدخل — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 23, "title": "منظومة المقاصد للعصيمي", "icon": "target", "color": "#512e5f", "visible": true, "description": "علم مقاصد الشريعة في نظم شعري", "info": "مقرر منظومة المقاصد للعصيمي — المرحلة: خامس", "_order": 22, "lessons": [{"id": 1, "title": "مقدمة ومدخل — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 24, "title": "الآداب من الجامع لابن جزي", "icon": "heart-handshake", "color": "#5b3068", "visible": true, "description": "آداب الإسلام من كتاب القوانين الفقهية", "info": "مقرر الآداب من الجامع لابن جزي — المرحلة: خامس", "_order": 23, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 25, "title": "السبل المرضية في السياسة الشرعية", "icon": "balance-scale", "color": "#6c3483", "visible": true, "description": "منظومة حافظ الحكمي في السياسة الشرعية", "info": "مقرر السبل المرضية في السياسة الشرعية — المرحلة: خامس", "_order": 24, "lessons": [{"id": 1, "title": "مقدمة ومدخل — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 26, "title": "الأمر بالمعروف والنهي عن المنكر", "icon": "megaphone", "color": "#922b21", "visible": true, "description": "رسالة ابن تيمية في الحسبة الشرعية", "info": "مقرر الأمر بالمعروف والنهي عن المنكر — المرحلة: سادس", "_order": 25, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 27, "title": "آداب البحث والمناظرة", "icon": "message-square", "color": "#a93226", "visible": true, "description": "متن طاشكبري زاده في المناظرة", "info": "مقرر آداب البحث والمناظرة — المرحلة: سادس", "_order": 26, "lessons": [{"id": 1, "title": "مقدمة ومدخل — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 28, "title": "الرد على المخالف", "icon": "shield-alert", "color": "#922b21", "visible": true, "description": "أصول الرد على أهل البدع والمخالفين", "info": "مقرر الرد على المخالف — المرحلة: سادس", "_order": 27, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 29, "title": "الحصانة الفكرية", "icon": "lock", "color": "#b03a2e", "visible": true, "description": "حماية العقل المسلم من الغزو الفكري", "info": "مقرر الحصانة الفكرية — المرحلة: سادس", "_order": 28, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 30, "title": "فقه الدعوة والتأثير", "icon": "radio", "color": "#a04000", "visible": true, "description": "أصول وأساليب الدعوة إلى الله", "info": "مقرر فقه الدعوة والتأثير — المرحلة: سادس", "_order": 29, "lessons": [{"id": 1, "title": "مقدمة ومدخل — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}],
  tests:   LS("ti_tests")   || [{"id": 1, "courseId": 1, "title": "اختبار الوحدة الأولى — مدخل إلى طلب العلم", "visible": true, "questions": [{"q": "ما موضوع مقرر مدخل إلى طلب العلم؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 2, "courseId": 1, "title": "الاختبار النهائي — مدخل إلى طلب العلم", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر مدخل إلى طلب العلم؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 3, "courseId": 2, "title": "اختبار الوحدة الأولى — تذكرة السامع والمتكلم", "visible": true, "questions": [{"q": "ما موضوع مقرر تذكرة السامع والمتكلم؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 4, "courseId": 2, "title": "الاختبار النهائي — تذكرة السامع والمتكلم", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر تذكرة السامع والمتكلم؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 5, "courseId": 3, "title": "اختبار الوحدة الأولى — الجرد القرآني التطبيقي", "visible": true, "questions": [{"q": "ما موضوع مقرر الجرد القرآني التطبيقي؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 6, "courseId": 3, "title": "الاختبار النهائي — الجرد القرآني التطبيقي", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الجرد القرآني التطبيقي؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 7, "courseId": 4, "title": "اختبار الوحدة الأولى — القواعد الأربع", "visible": true, "questions": [{"q": "ما موضوع مقرر القواعد الأربع؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 8, "courseId": 4, "title": "الاختبار النهائي — القواعد الأربع", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر القواعد الأربع؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 9, "courseId": 5, "title": "اختبار الوحدة الأولى — نواقض الإسلام", "visible": true, "questions": [{"q": "ما موضوع مقرر نواقض الإسلام؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 10, "courseId": 5, "title": "الاختبار النهائي — نواقض الإسلام", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر نواقض الإسلام؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 11, "courseId": 6, "title": "اختبار الوحدة الأولى — الأصول الثلاثة وأدلتها", "visible": true, "questions": [{"q": "ما موضوع مقرر الأصول الثلاثة وأدلتها؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 12, "courseId": 6, "title": "الاختبار النهائي — الأصول الثلاثة وأدلتها", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الأصول الثلاثة وأدلتها؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 13, "courseId": 7, "title": "اختبار الوحدة الأولى — كشف الشبهات", "visible": true, "questions": [{"q": "ما موضوع مقرر كشف الشبهات؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 14, "courseId": 7, "title": "الاختبار النهائي — كشف الشبهات", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر كشف الشبهات؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 15, "courseId": 8, "title": "اختبار الوحدة الأولى — متن الآجرومية", "visible": true, "questions": [{"q": "ما موضوع مقرر متن الآجرومية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 16, "courseId": 8, "title": "الاختبار النهائي — متن الآجرومية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر متن الآجرومية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 17, "courseId": 9, "title": "اختبار الوحدة الأولى — التذكرة في علوم الحديث", "visible": true, "questions": [{"q": "ما موضوع مقرر التذكرة في علوم الحديث؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 18, "courseId": 9, "title": "الاختبار النهائي — التذكرة في علوم الحديث", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر التذكرة في علوم الحديث؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 19, "courseId": 10, "title": "اختبار الوحدة الأولى — الأرجوزة الميئية في السيرة", "visible": true, "questions": [{"q": "ما موضوع مقرر الأرجوزة الميئية في السيرة؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 20, "courseId": 10, "title": "الاختبار النهائي — الأرجوزة الميئية في السيرة", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الأرجوزة الميئية في السيرة؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 21, "courseId": 11, "title": "اختبار الوحدة الأولى — الرسالة اللطيفة في أصول الفقه", "visible": true, "questions": [{"q": "ما موضوع مقرر الرسالة اللطيفة في أصول الفقه؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 22, "courseId": 11, "title": "الاختبار النهائي — الرسالة اللطيفة في أصول الفقه", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الرسالة اللطيفة في أصول الفقه؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 23, "courseId": 12, "title": "اختبار الوحدة الأولى — الأربعون النووية", "visible": true, "questions": [{"q": "ما موضوع مقرر الأربعون النووية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 24, "courseId": 12, "title": "الاختبار النهائي — الأربعون النووية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الأربعون النووية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 25, "courseId": 13, "title": "اختبار الوحدة الأولى — مقدمات التفقه", "visible": true, "questions": [{"q": "ما موضوع مقرر مقدمات التفقه؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 26, "courseId": 13, "title": "الاختبار النهائي — مقدمات التفقه", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر مقدمات التفقه؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 27, "courseId": 14, "title": "اختبار الوحدة الأولى — متن الأخضري في العبادات", "visible": true, "questions": [{"q": "ما موضوع مقرر متن الأخضري في العبادات؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 28, "courseId": 14, "title": "الاختبار النهائي — متن الأخضري في العبادات", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر متن الأخضري في العبادات؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 29, "courseId": 15, "title": "اختبار الوحدة الأولى — متن العشماوية", "visible": true, "questions": [{"q": "ما موضوع مقرر متن العشماوية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 30, "courseId": 15, "title": "الاختبار النهائي — متن العشماوية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر متن العشماوية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 31, "courseId": 16, "title": "اختبار الوحدة الأولى — نظم ابن أبي كف", "visible": true, "questions": [{"q": "ما موضوع مقرر نظم ابن أبي كف؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 32, "courseId": 16, "title": "الاختبار النهائي — نظم ابن أبي كف", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر نظم ابن أبي كف؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 33, "courseId": 17, "title": "اختبار الوحدة الأولى — نظم المرشد المعين لابن عاشر", "visible": true, "questions": [{"q": "ما موضوع مقرر نظم المرشد المعين لابن عاشر؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 34, "courseId": 17, "title": "الاختبار النهائي — نظم المرشد المعين لابن عاشر", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر نظم المرشد المعين لابن عاشر؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 35, "courseId": 18, "title": "اختبار الوحدة الأولى — منظومة القواعد الفقهية", "visible": true, "questions": [{"q": "ما موضوع مقرر منظومة القواعد الفقهية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 36, "courseId": 18, "title": "الاختبار النهائي — منظومة القواعد الفقهية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر منظومة القواعد الفقهية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 37, "courseId": 19, "title": "اختبار الوحدة الأولى — مقدمة في أصول التفسير", "visible": true, "questions": [{"q": "ما موضوع مقرر مقدمة في أصول التفسير؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 38, "courseId": 19, "title": "الاختبار النهائي — مقدمة في أصول التفسير", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر مقدمة في أصول التفسير؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 39, "courseId": 20, "title": "اختبار الوحدة الأولى — كتاب التوحيد", "visible": true, "questions": [{"q": "ما موضوع مقرر كتاب التوحيد؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 40, "courseId": 20, "title": "الاختبار النهائي — كتاب التوحيد", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر كتاب التوحيد؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 41, "courseId": 21, "title": "اختبار الوحدة الأولى — القواعد السلفية في الأسماء والصفات", "visible": true, "questions": [{"q": "ما موضوع مقرر القواعد السلفية في الأسماء والصفات؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 42, "courseId": 21, "title": "الاختبار النهائي — القواعد السلفية في الأسماء والصفات", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر القواعد السلفية في الأسماء والصفات؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 43, "courseId": 22, "title": "اختبار الوحدة الأولى — العقيدة الواسطية", "visible": true, "questions": [{"q": "ما موضوع مقرر العقيدة الواسطية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 44, "courseId": 22, "title": "الاختبار النهائي — العقيدة الواسطية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر العقيدة الواسطية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 45, "courseId": 23, "title": "اختبار الوحدة الأولى — منظومة المقاصد للعصيمي", "visible": true, "questions": [{"q": "ما موضوع مقرر منظومة المقاصد للعصيمي؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 46, "courseId": 23, "title": "الاختبار النهائي — منظومة المقاصد للعصيمي", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر منظومة المقاصد للعصيمي؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 47, "courseId": 24, "title": "اختبار الوحدة الأولى — الآداب من الجامع لابن جزي", "visible": true, "questions": [{"q": "ما موضوع مقرر الآداب من الجامع لابن جزي؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 48, "courseId": 24, "title": "الاختبار النهائي — الآداب من الجامع لابن جزي", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الآداب من الجامع لابن جزي؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 49, "courseId": 25, "title": "اختبار الوحدة الأولى — السبل المرضية في السياسة الشرعية", "visible": true, "questions": [{"q": "ما موضوع مقرر السبل المرضية في السياسة الشرعية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 50, "courseId": 25, "title": "الاختبار النهائي — السبل المرضية في السياسة الشرعية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر السبل المرضية في السياسة الشرعية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 51, "courseId": 26, "title": "اختبار الوحدة الأولى — الأمر بالمعروف والنهي عن المنكر", "visible": true, "questions": [{"q": "ما موضوع مقرر الأمر بالمعروف والنهي عن المنكر؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 52, "courseId": 26, "title": "الاختبار النهائي — الأمر بالمعروف والنهي عن المنكر", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الأمر بالمعروف والنهي عن المنكر؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 53, "courseId": 27, "title": "اختبار الوحدة الأولى — آداب البحث والمناظرة", "visible": true, "questions": [{"q": "ما موضوع مقرر آداب البحث والمناظرة؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 54, "courseId": 27, "title": "الاختبار النهائي — آداب البحث والمناظرة", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر آداب البحث والمناظرة؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 55, "courseId": 28, "title": "اختبار الوحدة الأولى — الرد على المخالف", "visible": true, "questions": [{"q": "ما موضوع مقرر الرد على المخالف؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 56, "courseId": 28, "title": "الاختبار النهائي — الرد على المخالف", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الرد على المخالف؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 57, "courseId": 29, "title": "اختبار الوحدة الأولى — الحصانة الفكرية", "visible": true, "questions": [{"q": "ما موضوع مقرر الحصانة الفكرية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 58, "courseId": 29, "title": "الاختبار النهائي — الحصانة الفكرية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الحصانة الفكرية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 59, "courseId": 30, "title": "اختبار الوحدة الأولى — فقه الدعوة والتأثير", "visible": true, "questions": [{"q": "ما موضوع مقرر فقه الدعوة والتأثير؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 60, "courseId": 30, "title": "الاختبار النهائي — فقه الدعوة والتأثير", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر فقه الدعوة والتأثير؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}],
  questions: LS("ti_questions") || [],
  notifications: LS("ti_notifs") || [],
  schedule: LS("ti_schedule") || {},
  schedulePeriods: LS("ti_sched_periods") || ["الفجر","الضحى","العصر","المغرب","العشاء"],
  siteConfig: LS("ti_config") || {
    introVideo:"",
    aboutText:"معهد التأصيل العلمي منصة تعليمية متخصصة في نشر العلوم الشرعية وفق منهج أهل السنة والجماعة.",
    studyPlan: [],
    contactEmail:"info@taaseel.edu",
    contactTelegram:"@TaaseelInstitute",
    contactPhone:"+966 50 000 0000",
    sheikhChannel:"",
    privateChannel:"",
    team:[],
  },
};

function saveState(){
  SS("ti_courses",   APP.courses);
  SS("ti_tests",     APP.tests);
  SS("ti_questions", APP.questions);
  SS("ti_notifs",    APP.notifications);
  SS("ti_config",    APP.siteConfig);
  SS("ti_schedule",  APP.schedule);
  SS("ti_sched_periods", APP.schedulePeriods);
}

// ── مساعدات ──
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function toId(v){ return String(v); }
function findById(arr,id){ return arr.find(x=>toId(x.id)===toId(id)); }
function isAdmin(){ return APP.user?.isAdmin===true; }
function isSuperAdmin(){ return APP.user?.isAdmin && APP.user?.adminRole==="super"; }
function hasPerm(p){
  if(!APP.user?.isAdmin) return false;
  if(APP.user.adminRole==="super") return true;
  return APP.user.adminPermissions?.[p]===true;
}

// ── Toast ──
function toast(msg,type="info",dur=3500){
  const c=document.getElementById("toast-container");
  if(!c) return;
  const t=document.createElement("div");
  t.className=`toast ${type}`;
  const icons={info:"bell",success:"check-circle",error:"x-circle"};
  t.innerHTML=`<i data-lucide="${icons[type]||"bell"}" style="width:16px;height:16px;flex-shrink:0"></i>${msg}`;
  c.appendChild(t);
  lucide.createIcons({nodes:[t]});
  setTimeout(()=>{ t.classList.add("out"); setTimeout(()=>t.remove(),400); },dur);
}

// ── Modal ──
function openModal(content,title=""){
  document.getElementById("modal-container").innerHTML=`
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-box" onclick="event.stopPropagation()">
        <div class="modal-head">
          <span class="modal-title">${title}</span>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        ${content}
      </div>
    </div>`;
  lucide.createIcons();
}
function closeModal(){ document.getElementById("modal-container").innerHTML=""; }
function confirm2(msg,cb){
  openModal(`<div style="text-align:center;padding:10px 0">
    <div style="font-size:38px;margin-bottom:12px">⚠️</div>
    <p style="color:var(--text);font-size:15px;margin-bottom:20px">${msg}</p>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn btn-danger" onclick="closeModal();(${cb.toString()})()">تأكيد الحذف</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  </div>`,"تأكيد");
}

// ── setBtnLoading ──
function setBtnLoading(id,loading,text){
  const btn=document.getElementById(id);
  if(!btn) return;
  if(loading){ btn.disabled=true; btn._orig=btn.innerHTML; if(text) btn.innerHTML=`<span style="opacity:.7">${text}</span>`; }
  else{ btn.disabled=false; if(btn._orig) btn.innerHTML=btn._orig; }
}

// ── Firebase error messages ──
function fbErr(code){
  const m={
    "auth/user-not-found":"البريد غير مسجل",
    "auth/wrong-password":"كلمة المرور غير صحيحة",
    "auth/invalid-credential":"البريد أو كلمة المرور غير صحيحة",
    "auth/email-already-in-use":"البريد مسجل مسبقاً",
    "auth/invalid-email":"صيغة البريد غير صحيحة",
    "auth/weak-password":"كلمة المرور ضعيفة (6 أحرف+)",
    "auth/too-many-requests":"محاولات كثيرة، انتظر قليلاً",
    "auth/network-request-failed":"تعذّر الاتصال بالإنترنت",
    "auth/user-disabled":"هذا الحساب موقوف",
    "auth/operation-not-allowed":"هذه الطريقة غير مفعّلة في Firebase",
    "auth/unauthorized-domain":"النطاق غير مُصرَّح به — أضفه في Firebase Console",
  };
  return m[code]||`خطأ: ${code||"غير معروف"}`;
}

// ── Notifications ──
function addNotif(msg,type="info"){
  APP.notifications.unshift({id:uid(),msg,type,date:new Date().toLocaleDateString("ar"),read:false});
  if(APP.notifications.length>50) APP.notifications=APP.notifications.slice(0,50);
  saveState();
  updateNotifBadge();
}
function updateNotifBadge(){
  const dot=document.getElementById("notif-badge-dot");
  const unread=APP.notifications.filter(n=>!n.read).length;
  if(dot) dot.style.display=unread>0?"":"none";
}
function toggleNotifPanel(){
  const p=document.getElementById("notif-panel");
  if(!p) return;
  p.style.display=p.style.display==="none"?"":"none";
  if(p.style.display!=="none") renderNotifPanel();
}
function renderNotifPanel(){
  const list=document.getElementById("notif-list");
  if(!list) return;
  APP.notifications.forEach(n=>n.read=true);
  saveState(); updateNotifBadge();
  list.innerHTML=APP.notifications.length===0
    ?`<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px">لا توجد إشعارات</div>`
    :APP.notifications.map(n=>`<div style="padding:10px 14px;border-bottom:1px solid rgba(212,180,142,.1);font-size:13px;color:var(--text)">${n.msg}<div style="font-size:11px;color:var(--muted);margin-top:2px">${n.date}</div></div>`).join("");
}
function clearNotifs(){ APP.notifications=[]; saveState(); renderNotifPanel(); updateNotifBadge(); }
function closeNotifPanel(){ const p=document.getElementById("notif-panel"); if(p) p.style.display="none"; }

// ── Mobile menu ──
function openMobileMenu(){
  document.getElementById("mobile-menu-overlay").style.display="";
  document.getElementById("mobile-menu").classList.add("open");
}
function closeMobileMenu(){
  document.getElementById("mobile-menu-overlay").style.display="none";
  document.getElementById("mobile-menu").classList.remove("open");
}

// ── Nav active state ──
function setNavActive(page){
  document.querySelectorAll(".nav-btn,.mob-nav-btn").forEach(b=>b.classList.remove("active"));
  const nb=document.getElementById("nb-"+page);
  if(nb) nb.classList.add("active");
}

// ══════════════════════════════════════════════════════════
// FIRESTORE HELPERS
// ══════════════════════════════════════════════════════════
async function fsGet(col,id){ try{ const s=await FB_DB.collection(col).doc(id).get(); return s.exists?s.data():null; }catch(e){ return null; }}
async function fsSet(col,id,data){ try{ await FB_DB.collection(col).doc(id).set(data,{merge:true}); }catch(e){ console.warn("fsSet",col,e.code); }}
async function fsDel(col,id){ try{ await FB_DB.collection(col).doc(id).delete(); }catch(e){} }
async function fsAll(col){ try{ const s=await FB_DB.collection(col).get(); return s.docs.map(d=>({id:d.id,...d.data()})); }catch(e){ return []; }}

async function fsSaveCourse(c){ await fsSet("courses",String(c.id),{...c,_order:APP.courses.findIndex(x=>toId(x.id)===toId(c.id))}); }
async function fsDeleteCourse(id){ await fsDel("courses",String(id)); }
async function fsSaveTest(t){ await fsSet("tests",String(t.id),t); }
async function fsDeleteTest(id){ await fsDel("tests",String(id)); }
async function fsSaveQuestion(q){ await fsSet("questions",String(q.id),q); }
async function fsDeleteQuestion(id){ await fsDel("questions",String(id)); }
async function fsSaveConfig(){ await fsSet("config","main",APP.siteConfig); }
async function fsSaveSchedule(){ await fsSet("schedule","main",{schedule:APP.schedule,periods:APP.schedulePeriods}); }

async function loadFromFirestore(){
  try{
    const [coursesSnap,testsSnap,qsSnap,cfgSnap,schSnap] = await Promise.all([
      FB_DB.collection("courses").orderBy("_order","asc").get().catch(()=>FB_DB.collection("courses").get()),
      FB_DB.collection("tests").get(),
      FB_DB.collection("questions").get(),
      FB_DB.collection("config").doc("main").get(),
      FB_DB.collection("schedule").doc("main").get(),
    ]);
    if(coursesSnap.docs.length) APP.courses=coursesSnap.docs.map(d=>d.data()).sort((a,b)=>(a._order||0)-(b._order||0));
    if(testsSnap.docs.length)   APP.tests=testsSnap.docs.map(d=>d.data());
    if(qsSnap.docs.length)      APP.questions=qsSnap.docs.map(d=>d.data());
    if(cfgSnap.exists)          APP.siteConfig={...APP.siteConfig,...cfgSnap.data()};
    if(schSnap.exists){ const d=schSnap.data(); if(d.schedule) APP.schedule=d.schedule; if(d.periods) APP.schedulePeriods=d.periods; }
    saveState();
    console.log(`✅ Firestore: ${APP.courses.length} مقرر, ${APP.tests.length} اختبار`);
  }catch(e){ console.warn("Firestore load:", e.code, e.message); }
}

// ══════════════════════════════════════════════════════════
// AUTH — تسجيل الدخول والخروج
// ══════════════════════════════════════════════════════════
const ADMIN_EMAIL = "abwdahm645@gmail.com";
let _adminEmail="", _adminPass="";

async function ensureSuperAdmin(){
  try{
    await FB_AUTH.createUserWithEmailAndPassword(ADMIN_EMAIL,"4m6m7878");
    const uid2=(await FB_AUTH.signInWithEmailAndPassword(ADMIN_EMAIL,"4m6m7878")).user.uid;
    await fsSet("admins",uid2,{fullName:"أبو الجواد الحنبلي",username:"dahm6",email:ADMIN_EMAIL,role:"super",permissions:{},createdAt:new Date().toISOString()});
    await FB_AUTH.signOut();
  }catch(e){ if(e.code!=="auth/email-already-in-use") console.warn("ensureSuperAdmin:",e.code); }
}

// ── دخول الطالب ──
async function doLogin(){
  const email=document.getElementById("l-email").value.trim();
  const pass=document.getElementById("l-pass").value;
  const errEl=document.getElementById("login-err");
  errEl.style.display="none";
  if(!email||!pass){ showErr(errEl,"يرجى إدخال البريد وكلمة المرور"); return; }
  setBtnLoading("btn-email-login",true,"جارٍ الدخول...");
  try{
    await FB_AUTH.signInWithEmailAndPassword(email,pass);
    // onAuthStateChanged will handle the rest
    if(document.getElementById("l-remember")?.checked)
      try{ localStorage.setItem("ti_rm",btoa(JSON.stringify({e:email,p:pass}))); }catch(_){}
    else localStorage.removeItem("ti_rm");
  }catch(e){
    showErr(errEl,fbErr(e.code));
    setBtnLoading("btn-email-login",false,"دخول");
  }
}

// ── دخول المشرف ──
async function doAdminLogin(){
  const email=document.getElementById("al-email").value.trim();
  const pass=document.getElementById("al-pass").value;
  const errEl=document.getElementById("admin-login-err");
  errEl.style.display="none";
  if(!email||!pass){ showErr(errEl,"يرجى إدخال البريد وكلمة المرور"); return; }
  setBtnLoading("btn-admin-login",true,"جارٍ التحقق...");
  try{
    const cred=await FB_AUTH.signInWithEmailAndPassword(email,pass);
    const adminData=await fsGet("admins",cred.user.uid);
    if(!adminData){ await FB_AUTH.signOut(); showErr(errEl,"ليس حساب مشرف"); setBtnLoading("btn-admin-login",false,"دخول المسؤول"); return; }
    _adminEmail=email; _adminPass=pass;
    if(document.getElementById("al-remember")?.checked)
      try{ localStorage.setItem("ti_admin_rm",btoa(JSON.stringify({e:email,p:pass,ts:Date.now()}))); }catch(_){}
    // onAuthStateChanged will handle loginUser
  }catch(e){
    showErr(errEl,fbErr(e.code));
    setBtnLoading("btn-admin-login",false,"دخول المسؤول");
  }
}

// ── تسجيل الخروج ──
async function doLogout(){
  localStorage.removeItem("ti_rm");
  localStorage.removeItem("ti_admin_rm");
  APP.user=null; _adminEmail=""; _adminPass="";
  try{ await FB_AUTH.signOut(); }catch(e){}
  location.href="index.html";
}

// ── تسجيل مستخدم جديد ──
async function doRegister(){
  const name  =document.getElementById("r-name").value.trim();
  const email =document.getElementById("r-email").value.trim();
  const pass  =document.getElementById("r-pass").value;
  const pass2 =document.getElementById("r-pass2")?.value||pass;
  const errEl =document.getElementById("reg-err");
  errEl.style.display="none";
  if(!name)  { showErr(errEl,"⚠️ يرجى إدخال الاسم الثلاثي"); return; }
  if(!email) { showErr(errEl,"⚠️ يرجى إدخال البريد الإلكتروني"); return; }
  if(!pass)  { showErr(errEl,"⚠️ يرجى إدخال كلمة المرور"); return; }
  if(pass.length<6){ showErr(errEl,"⚠️ كلمة المرور 6 أحرف على الأقل"); return; }
  if(pass!==pass2){ showErr(errEl,"⚠️ كلمتا المرور غير متطابقتَين"); return; }
  setBtnLoading("btn-register",true,"جارٍ إنشاء الحساب...");
  try{
    const cred=await FB_AUTH.createUserWithEmailAndPassword(email,pass);
    const profile={uid:cred.user.uid,name,email,
      phone:document.getElementById("r-phone")?.value.trim()||"",
      age:document.getElementById("r-age")?.value||"",
      telegram:document.getElementById("r-tg")?.value.trim()||"",
      level:document.getElementById("r-level")?.value||"",
      status:"pending",completedLessons:[],testResults:[],
      createdAt:new Date().toISOString(),provider:"email"};
    try{ await FB_DB.collection("users").doc(cred.user.uid).set(profile); }
    catch(fe){ console.warn("Firestore write:",fe.code); }
    await FB_AUTH.signOut();
    ["r-name","r-email","r-pass","r-pass2","r-phone","r-age","r-tg"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
    const lvl=document.getElementById("r-level"); if(lvl) lvl.value="";
    showOk(errEl,"🎉 تم التسجيل بنجاح! حسابك في انتظار موافقة المسؤول.");
    setTimeout(()=>switchTab("login"),3000);
  }catch(e){ showErr(errEl,fbErr(e.code)); }
  finally{ setBtnLoading("btn-register",false,"إنشاء الحساب"); }
}

function showErr(el,msg){ el.textContent=msg; el.style.cssText="display:block;color:#dc3545;font-size:13px;padding:10px 14px;background:#fff5f5;border-radius:10px;margin-bottom:12px;border:1px solid #ffcccc"; }
function showOk(el,msg){ el.innerHTML=msg; el.style.cssText="display:block;color:#155724;font-size:13px;padding:12px 16px;background:#d4edda;border-radius:10px;margin-bottom:12px;border:1px solid #c3e6cb;line-height:1.8;text-align:center"; }

function togglePassVis(inputId,btn){
  const inp=document.getElementById(inputId); if(!inp) return;
  inp.type=inp.type==="password"?"text":"password";
  const icon=btn.querySelector("i");
  if(icon) icon.setAttribute("data-lucide",inp.type==="password"?"eye":"eye-off");
  lucide.createIcons({nodes:[btn]});
}

// ── Switch tabs ──
function switchLoginMode(mode){
  const isAdmin=(mode==="admin");
  document.getElementById("student-tabs").style.display=isAdmin?"none":"";
  document.getElementById("login-form").style.display=isAdmin?"none":"";
  document.getElementById("register-form").style.display="none";
  document.getElementById("admin-login-form").style.display=isAdmin?"":"none";
  const act="flex:1;padding:9px;border-radius:9px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:12px;font-weight:700;background:linear-gradient(135deg,var(--purple),var(--purple-l));color:#fff";
  const inact="flex:1;padding:9px;border-radius:9px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:12px;font-weight:700;background:transparent;color:var(--muted)";
  document.getElementById("mode-admin").style.cssText=isAdmin?act:inact;
  document.getElementById("mode-student").style.cssText=isAdmin?inact:act;
}
function switchTab(t){
  document.getElementById("login-form").style.display=t==="login"?"":"none";
  document.getElementById("register-form").style.display=t==="register"?"":"none";
  const act="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:13px;font-weight:700;background:linear-gradient(135deg,var(--purple),var(--purple-l));color:#fff;box-shadow:0 4px 14px rgba(59,27,64,.22)";
  const inact="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:13px;font-weight:700;background:transparent;color:var(--muted)";
  document.getElementById("tab-login").style.cssText=t==="login"?act:inact;
  document.getElementById("tab-register").style.cssText=t==="register"?act:inact;
}

// ── loginUser ── 
function loginUser(u){
  APP.user=u;
  document.getElementById("public-wrapper").style.display="none";
  document.getElementById("app-wrapper").style.display="";
  // nav badges
  ["nb-admin","nb-admin-qa","admin-badge"].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=isAdmin()?"":"none"; });
  const badge=document.getElementById("admin-badge");
  if(badge && isAdmin()) badge.textContent=u.adminRole==="super"?"المشرف العام":(u.adminUsername||"مشرف");
  updateNotifBadge();
  updateAppFooter();
  const dest=sessionStorage.getItem("_goto")||"dashboard";
  sessionStorage.removeItem("_goto");
  _renderPage(dest);
  toast(`أهلاً ${u.name}! 👋`,"success");
}

// ══════════════════════════════════════════════════════════
// PAGE RENDERER — يعرض الصفحة المناسبة
// ══════════════════════════════════════════════════════════
function _renderPage(page){
  // hide all app pages
  document.querySelectorAll("#app-wrapper .page").forEach(p=>p.classList.remove("active"));
  const el=document.getElementById("app-page-"+page);
  if(el){ el.classList.add("active"); el.style.animation="none"; requestAnimationFrame(()=>el.style.animation=""); }
  APP.activePage=page;
  setNavActive(page);
  closeNotifPanel();
  const renders={
    dashboard:renderDashboard, courses:renderCourses,
    "course-detail":renderCourseDetail,
    tests:renderTests, schedule:renderSchedule,
    qa:renderQA, "about-app":renderAboutApp,
    profile:renderProfile, admin:renderAdmin,
    "admin-qa":renderAdminQA,
  };
  if(renders[page]) renders[page]();
}

// shortcut used in HTML onclick
function navTo(page){ goTo(page); }
function showPage(name){
  const pub=["landing","about-public","login"];
  if(pub.includes(name)){
    const cur=currentPage();
    if(!pub.includes(cur)){ sessionStorage.setItem("_goto",name); location.href="index.html"; return; }
    document.getElementById("public-wrapper").style.display="";
    document.getElementById("app-wrapper").style.display="none";
    document.querySelectorAll("#public-wrapper .page").forEach(p=>p.classList.remove("active"));
    const el=document.getElementById("page-"+name);
    if(el) el.classList.add("active");
    if(name==="landing"){ renderPublicPlan(); renderAboutPublic(); }
    if(name==="about-public") renderAboutPublic();
    updatePubNav();
  } else { goTo(name); }
}

// ══════════════════════════════════════════════════════════
// YOUTUBE HELPERS
// ══════════════════════════════════════════════════════════
function toYtEmbed(url){
  if(!url) return "";
  url=url.trim();
  if(url.includes("/embed/")) return url;
  const s=url.match(/youtu\.be\/([^?&\s]+)/); if(s) return `https://www.youtube.com/embed/${s[1]}`;
  const w=url.match(/[?&]v=([^&\s]+)/); if(w) return `https://www.youtube.com/embed/${w[1]}`;
  return url;
}
function fixYtUrls(courses){ return courses.map(c=>({...c,lessons:(c.lessons||[]).map(l=>({...l,youtube:toYtEmbed(l.youtube||"")}))})); }

// ══════════════════════════════════════════════════════════
// PUBLIC NAV
// ══════════════════════════════════════════════════════════
function updatePubNav(){
  const nav=document.getElementById("pub-nav");
  if(!nav) return;
  window.addEventListener("scroll",()=>{
    const scrolled=window.scrollY>50;
    nav.style.background=scrolled?"rgba(42,18,48,.94)":"transparent";
    nav.style.backdropFilter=scrolled?"blur(16px)":"none";
    nav.style.borderBottom=scrolled?"1px solid rgba(212,180,142,.15)":"none";
  });
}
function scrollToAbout(){ document.getElementById("about-teaser")?.scrollIntoView({behavior:"smooth"}); }

function updateAppFooter(){
  const cfg=APP.siteConfig;
  const tgBtn=document.getElementById("footer-tg-btn");
  if(tgBtn) tgBtn.style.display=cfg.contactTelegram?"inline-flex":"none";
  const sheikhEl=document.getElementById("app-footer-sheikh");
  if(sheikhEl) sheikhEl.style.display=cfg.sheikhChannel?"":"none";
  const shLabel=document.getElementById("footer-sheikh-channel");
  if(shLabel) shLabel.style.display=cfg.sheikhChannel?"":"none";
  const channelBtn=document.getElementById("nb-channel");
  if(channelBtn) channelBtn.style.display=cfg.privateChannel||cfg.sheikhChannel?"":"none";
  const mobCh=document.getElementById("mob-nb-channel");
  if(mobCh) mobCh.style.display=cfg.privateChannel||cfg.contactTelegram?"":"none";
}
function openTelegramFromNav(){ _openTg(APP.siteConfig.privateChannel||APP.siteConfig.contactTelegram); }
function openTelegram(){ _openTg(APP.siteConfig.contactTelegram); }
function openSheikhChannel(){ _openTg(APP.siteConfig.sheikhChannel); }
function openPrivateChannel(){ _openTg(APP.siteConfig.privateChannel); }
function _openTg(val){
  if(!val){ toast("لم يتم تعيين رابط","info"); return; }
  val=val.trim();
  const url=val.startsWith("http")?val:val.startsWith("@")?`https://t.me/${val.slice(1)}`:`https://t.me/${val}`;
  window.open(url,"_blank");
}
function openPrivateChannelWithWarning(){
  openModal(`<div style="text-align:center">
    <div style="color:#dc3545;font-size:13px;padding:8px;background:#fff5f5;border-radius:8px;margin-bottom:14px">⚠️ يُمنع نشر رابط القناة الخاصة</div>
    <button class="btn btn-primary" onclick="closeModal();openPrivateChannel()"><i data-lucide="send" style="width:14px;height:14px"></i> الانتقال للقناة</button>
  </div>`,"قناة المعهد الخاصة");
}


// localStorage sync (always works offline)
function saveState(){
  SS("ti_courses",       APP.courses);
  SS("ti_tests",         APP.tests);
  SS("ti_questions",     APP.questions);
  SS("ti_notifications", APP.notifications);
  SS("ti_config",        APP.siteConfig);
  SS("ti_schedule",      APP.schedule);
  SS("ti_schedule_periods", APP.schedulePeriods);
}

// ── Instant Firebase write for a single course (add/edit) ──
async function fbWriteCourse(course){
  const idx = APP.courses.findIndex(c=>toId(c.id)===toId(course.id));
  if(idx>=0) APP.courses[idx]=course; else APP.courses.push(course);
  saveState();
  await fsSaveCourse({...course, _order: APP.courses.findIndex(c=>toId(c.id)===toId(course.id))});
}
// ── Delete a course from Firebase ──
async function fbRemoveCourse(id){
  APP.courses=APP.courses.filter(c=>toId(c.id)!==toId(id));
  saveState();
  await fsDeleteCourse(id);
}
// ── Save entire courses array (after reorder / toggle) ──
async function fbSyncCourses(){
  saveState();
  await Promise.all(APP.courses.map((c,i)=>fsSaveCourse({...c,_order:i})));
}

// ── Test CRUD ──
async function fbWriteTest(test){
  const idx = APP.tests.findIndex(t=>toId(t.id)===toId(test.id));
  if(idx>=0) APP.tests[idx]=test; else APP.tests.push(test);
  saveState();
  await fsSaveTest(test);
}
async function fbRemoveTest(id){
  APP.tests=APP.tests.filter(t=>toId(t.id)!==toId(id));
  saveState();
  await fsDeleteTest(id);
}

// ── Question CRUD ──
async function fbWriteQuestion(q){
  const idx = APP.questions.findIndex(x=>toId(x.id)===toId(q.id));
  if(idx>=0) APP.questions[idx]=q; else APP.questions.push(q);
  saveState();
  await fsSaveQuestion(q);
}
async function fbRemoveQuestion(id){
  APP.questions=APP.questions.filter(x=>toId(x.id)!==toId(id));
  saveState();
  await fsDeleteQuestion(id);
}

// ── Config ──
async function fbWriteConfig(){
  saveState();
  await fsSaveConfig(APP.siteConfig);
}

// ── Load all data from Firestore on startup ──
async function loadFromFirestore(){
  try{
    const [coursesData, testsData, questionsData, cfgData] = await Promise.all([
      fsLoadCourses(), fsLoadTests(), fsLoadQuestions(), fsLoadConfig()
    ]);

    // Courses — تحميل من Firestore إذا وُجدت بيانات
    if(coursesData && coursesData.length > 0){
      const sorted = [...coursesData].sort((a,b)=>(a._order||0)-(b._order||0));
      APP.courses = _fixYtUrls(sorted);
      SS("ti_courses", APP.courses);
    } else if(APP.courses.length > 0){
      // رفع البيانات المحلية لـ Firestore (مزامنة أولية)
      await Promise.all(APP.courses.map((c,i)=>fsSaveCourse({...c,_order:i})));
    }

    // Tests
    if(testsData && testsData.length > 0){
      APP.tests = testsData;
      SS("ti_tests", APP.tests);
    } else if(APP.tests.length > 0){
      await Promise.all(APP.tests.map(t=>fsSaveTest(t)));
    }

    // Questions
    if(questionsData && questionsData.length > 0){
      APP.questions = questionsData;
      SS("ti_questions", APP.questions);
    }

    // Config
    if(cfgData && Object.keys(cfgData).length > 0){
      APP.siteConfig = {...APP.siteConfig, ...cfgData};
      SS("ti_config", APP.siteConfig);
    }

    // Schedule
    try{
      const schDoc = await fsLoadSchedule();
      if(schDoc){
        if(schDoc.schedule) APP.schedule=schDoc.schedule;
        if(schDoc.periods) APP.schedulePeriods=schDoc.periods;
      }
    }catch(e){}

    console.log(`✅ Firebase: ${APP.courses.length} مقرر، ${APP.tests.length} اختبار`);
    return true;
  }catch(e){
    console.warn("loadFromFirestore failed, using localStorage:", e);
    return false;
  }
}

// ══════════════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════════════
function uid(){ return Date.now() + Math.random().toString(36).slice(2); }
function toast(msg, type="info", dur=3000){
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  const icons = {info:"bell", success:"check-circle", error:"x-circle"};
  t.innerHTML = `<i data-lucide="${icons[type]||'bell'}" style="width:16px;height:16px;flex-shrink:0"></i>${msg}`;
  c.appendChild(t);
  lucide.createIcons({nodes:[t]});
  setTimeout(()=>{t.classList.add("out"); setTimeout(()=>t.remove(),400)}, dur);
}
function confirm2(msg, cb){
  openModal(`<div style="text-align:center;padding:10px 0">
    <div style="font-size:38px;margin-bottom:12px">⚠️</div>
    <p style="color:var(--text);font-size:15px;margin-bottom:20px">${msg}</p>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn btn-danger" onclick="closeModal();(${cb.toString()})()">تأكيد الحذف</button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  </div>`, "تأكيد");
}
function getFile(inputId){
  return document.getElementById(inputId)?.files?.[0] || null;
}
function isAdmin(){ return APP.user?.isAdmin === true; }
function isSuperAdmin(){ return APP.user?.isAdmin && APP.user?.adminRole==="super"; }

// ══════════════════════════════════════════════════════════
// NAVIGATION & PAGES
// ══════════════════════════════════════════════════════════
function showPage(name){
  // توجيه متعدد الصفحات
  const targetFile = _getExpectedFile(name);
  const currentFile = _getCurrentFile();
  if(targetFile && targetFile !== currentFile){
    sessionStorage.setItem("_navTarget", name);
    window.location.href = targetFile;
    return;
  }
  document.getElementById("public-wrapper").style.display = "none";
  document.getElementById("app-wrapper").style.display = "none";
  const publicPages = ["landing","about-public","login"];
  if(publicPages.includes(name)){
    document.getElementById("public-wrapper").style.display = "";
    document.querySelectorAll("#public-wrapper .page").forEach(p=>p.classList.remove("active"));
    const el = document.getElementById(`page-${name}`);
    if(el){ el.classList.add("active"); el.style.animation="none"; requestAnimationFrame(()=>{ el.style.animation=""; }); }
    if(name==="landing") renderPublicPlan();
    if(name==="about-public") renderAboutPublic();
    updatePubNav();
  }
}
function updatePubNav(){
  const nav = document.getElementById("pub-nav");
  if(!nav) return;
  window.addEventListener("scroll",()=>{
    nav.style.background = window.scrollY>50 ? "rgba(42,18,48,.92)" : "transparent";
    nav.style.backdropFilter = window.scrollY>50 ? "blur(16px)" : "none";
    nav.style.borderBottom = window.scrollY>50 ? "1px solid rgba(212,180,142,.15)" : "none";
  },{once:false});
}
function navTo(page){
  // توجيه متعدد الصفحات
  const targetFile = _getExpectedFile(page);
  const currentFile = _getCurrentFile();
  if(targetFile && targetFile !== currentFile){
    sessionStorage.setItem("_navTarget", page);
    window.location.href = targetFile;
    return;
  }
  document.getElementById("public-wrapper").style.display = "none";
  document.getElementById("app-wrapper").style.display = "";
  document.querySelectorAll("#app-wrapper .page").forEach(p=>p.classList.remove("active"));
  const el = document.getElementById(`app-page-${page}`);
  if(!el) return;
  el.classList.add("active");
  el.style.animation="none";
  requestAnimationFrame(()=>{ el.style.animation=""; });
  APP.activePage = page;
  // Nav active state
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  const nb = document.getElementById(`nb-${page}`);
  if(nb) nb.classList.add("active");
  // Render page
  const renders = {
    dashboard: renderDashboard, courses: renderCourses,
    "course-detail": renderCourseDetail,
    tests: renderTests, qa: renderQA,
    schedule: renderSchedule,
    "about-app": renderAboutApp, profile: renderProfile,
    admin: renderAdmin, "admin-qa": renderAdminQA,
  };
  if(renders[page]) renders[page]();
  closeNotifPanel();
}
function scrollToAbout(){ document.getElementById("about-teaser").scrollIntoView({behavior:"smooth"}); }

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
function switchLoginMode(mode){
  const studentTabs=document.getElementById("student-tabs");
  const loginForm=document.getElementById("login-form");
  const regForm=document.getElementById("register-form");
  const adminForm=document.getElementById("admin-login-form");
  const modeStudent=document.getElementById("mode-student");
  const modeAdmin=document.getElementById("mode-admin");
  const act="flex:1;padding:9px;border-radius:9px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:12px;font-weight:700;transition:all .25s;background:linear-gradient(135deg,var(--purple),var(--purple-l));color:#fff;box-shadow:0 3px 10px rgba(59,27,64,.2)";
  const inact="flex:1;padding:9px;border-radius:9px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:12px;font-weight:700;transition:all .25s;background:transparent;color:var(--muted)";
  if(mode==="admin"){
    modeAdmin.style.cssText=act; modeStudent.style.cssText=inact;
    studentTabs.style.display="none"; loginForm.style.display="none";
    regForm.style.display="none"; adminForm.style.display="";
  } else {
    modeStudent.style.cssText=act; modeAdmin.style.cssText=inact;
    studentTabs.style.display=""; adminForm.style.display="none";
    loginForm.style.display=""; regForm.style.display="none";
  }
}
function switchTab(t){
  document.getElementById("login-form").style.display = t==="login"?"":"none";
  document.getElementById("register-form").style.display = t==="register"?"":"none";
  const tl=document.getElementById("tab-login"), tr2=document.getElementById("tab-register");
  const act="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:13px;font-weight:700;transition:all .28s;background:linear-gradient(135deg,var(--purple),var(--purple-l));color:#fff;box-shadow:0 4px 14px rgba(59,27,64,.22)";
  const inact="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-family:'Zain',sans-serif;font-size:13px;font-weight:700;transition:all .28s;background:transparent;color:var(--muted)";
  if(t==="login"){ tl.style.cssText=act; tr2.style.cssText=inact; }
  else           { tr2.style.cssText=act; tl.style.cssText=inact; }
}

// ── Admin login — Firebase Auth + Firestore ──
async function doAdminLogin(){
  const email = document.getElementById("al-email").value.trim();
  const pass  = document.getElementById("al-pass").value;
  const err   = document.getElementById("admin-login-err");
  err.style.display="none";
  if(!email||!pass){ err.textContent="يرجى إدخال البريد وكلمة المرور"; err.style.display=""; return; }
  setBtnLoading("btn-admin-login",true,"جارٍ التحقق...");
  try{
    // 1. تسجيل دخول Firebase Auth
    const cred = await FB_AUTH.signInWithEmailAndPassword(email, pass);
    const uid = cred.user.uid;

    // 2. التحقق من وجود الحساب في مجموعة "admins"
    const adminProfile = await fsGetAdmin(uid);
    if(!adminProfile){
      // ليس مسؤولاً — أخرجه فوراً
      await FB_AUTH.signOut();
      err.textContent = "هذا الحساب ليس حساب مسؤول";
      err.style.display = "";
      return;
    }

    // 3. تسجيل الدخول كمسؤول
    _adminSessionEmail = email;
    _adminSessionPass  = pass;
    loginUser({
      id:               uid,
      name:             adminProfile.fullName || adminProfile.username,
      adminLabel:       adminProfile.username,
      adminFullName:    adminProfile.fullName,
      adminUsername:    adminProfile.username,
      isAdmin:          true,
      adminRole:        adminProfile.role,
      adminPermissions: adminProfile.permissions || {},
      completedLessons: [],
      testResults:      [],
    });
  }catch(e){
    err.textContent = _fbErrMsg(e.code);
    err.style.display = "";
    // ── حفظ بيانات المشرف دائماً في session (للاستعادة بعد redirect) ──
    try{
      sessionStorage.setItem("_adm_e", email);
      // كلمة المرور لا تُحفظ في sessionStorage للأمان
    }catch(_){}
    // ── حفظ في localStorage إذا اختار "تذكرني" ──
    if(document.getElementById("al-remember")?.checked){
      try{ 
        localStorage.setItem("ti_admin_rm", btoa(JSON.stringify({e:email,p:pass,ts:Date.now()})));
        localStorage.setItem("_adm_e", email);
      }catch(_){}
    }
  }finally{
    setBtnLoading("btn-admin-login",false,"دخول المسؤول");
  }
}

// تسجيل دخول تلقائي للمشرف
async function tryAutoAdminLogin(){
  try{
    const raw = localStorage.getItem("ti_admin_rm");
    if(!raw) return false;
    const {e,p,ts} = JSON.parse(atob(raw));
    // صلاحية 30 يوماً
    if(Date.now() - ts > 30*24*60*60*1000){ localStorage.removeItem("ti_admin_rm"); return false; }
    setBtnLoading("btn-admin-login",true,"جارٍ الدخول...");
    const cred = await FB_AUTH.signInWithEmailAndPassword(e, p);
    const adminProfile = await fsGetAdmin(cred.user.uid);
    if(!adminProfile){ await FB_AUTH.signOut(); localStorage.removeItem("ti_admin_rm"); setBtnLoading("btn-admin-login",false,"دخول المسؤول"); return false; }
    _adminSessionEmail=e; _adminSessionPass=p;
    loginUser({id:cred.user.uid, name:adminProfile.fullName||adminProfile.username, adminLabel:adminProfile.username, adminFullName:adminProfile.fullName, adminUsername:adminProfile.username, isAdmin:true, adminRole:adminProfile.role, adminPermissions:adminProfile.permissions||{}, completedLessons:[], testResults:[]});
    return true;
  }catch(e){ localStorage.removeItem("ti_admin_rm"); setBtnLoading("btn-admin-login",false,"دخول المسؤول"); return false; }
}

// ── تذكرني ──
const RM_KEY = "ti_rm";
function toggleRememberMe(checked){
  if(!checked){ localStorage.removeItem(RM_KEY); }
}
function saveRememberMe(email, pass){
  try{ localStorage.setItem(RM_KEY, btoa(JSON.stringify({e:email,p:pass}))); }catch(e){}
}
function loadRememberMe(){
  try{
    const raw = localStorage.getItem(RM_KEY);
    if(!raw) return null;
    return JSON.parse(atob(raw));
  }catch(e){ localStorage.removeItem(RM_KEY); return null; }
}
async function tryAutoLogin(){
  const saved = loadRememberMe();
  if(!saved||!saved.e||!saved.p) return false;
  try{
    const cred = await FB_AUTH.signInWithEmailAndPassword(saved.e, saved.p);
    await _handleStudentFirebaseLogin(cred.user);
    return true;
  }catch(e){
    // بيانات قديمة — احذف التذكر
    localStorage.removeItem(RM_KEY);
    return false;
  }
}

// ── Student email/password login ──
async function doLogin(){
  const email=document.getElementById("l-email").value.trim();
  const pass=document.getElementById("l-pass").value;
  const remember=document.getElementById("l-remember")?.checked||false;
  const err=document.getElementById("login-err");
  err.style.display="none";
  if(!email||!pass){err.textContent="يرجى إدخال البريد وكلمة المرور";err.style.display="";return;}
  setBtnLoading("btn-email-login",true,"جاري الدخول...");
  try{
    const cred=await FB_AUTH.signInWithEmailAndPassword(email,pass);
    if(remember){ saveRememberMe(email, pass); }
    else { localStorage.removeItem(RM_KEY); }
    await _handleStudentFirebaseLogin(cred.user);
  }catch(e){
    err.textContent=_fbErrMsg(e.code); err.style.display="";
  }finally{ setBtnLoading("btn-email-login",false,"دخول"); }
}

// ── Student registration (Firebase Auth + Firestore) ──
async function doRegister(){
  const name=document.getElementById("r-name").value.trim();
  const email=document.getElementById("r-email").value.trim();
  const pass=document.getElementById("r-pass").value;
  const err=document.getElementById("reg-err");
  const showErr=msg=>{err.textContent=msg;err.style.cssText="display:block;color:#dc3545;font-size:13px;padding:9px 13px;background:#fff5f5;border-radius:9px;margin-bottom:12px;border:1px solid #ffcccc";};
  const showOk=msg=>{err.innerHTML=msg;err.style.cssText="display:block;color:#28a745;font-size:13px;padding:14px 16px;background:#f0fff4;border-radius:12px;margin-bottom:12px;border:1px solid #b2dfdb;line-height:1.8;text-align:center";};

  err.style.display="none";
  if(!name){ showErr("⚠️ يرجى إدخال الاسم الثلاثي"); return; }
  if(!email){ showErr("⚠️ يرجى إدخال البريد الإلكتروني"); return; }
  if(!pass){ showErr("⚠️ يرجى إدخال كلمة المرور"); return; }
  if(pass.length<6){ showErr("⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }

  // التحقق من تطابق كلمتي المرور
  const pass2 = document.getElementById("r-pass2")?.value||"";
  if(pass2 && pass !== pass2){ showErr("⚠️ كلمتا المرور غير متطابقتَين"); return; }

  // التحقق من صيغة البريد
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(email)){
    showErr("⚠️ صيغة البريد الإلكتروني غير صحيحة"); return;
  }

  setBtnLoading("btn-register",true,"جارٍ إنشاء الحساب...");
  try{
    // 1. إنشاء حساب Firebase Auth
    const cred = await FB_AUTH.createUserWithEmailAndPassword(email, pass);
    const uid = cred.user.uid;

    // 2. بناء الملف الشخصي
    const profile={
      uid,
      name,
      email,
      phone:   document.getElementById("r-phone")?.value.trim()||"",
      age:     document.getElementById("r-age")?.value||"",
      telegram:document.getElementById("r-tg")?.value.trim()||"",
      level:   document.getElementById("r-level")?.value||"",
      status:  "pending",
      completedLessons: [],
      testResults: [],
      createdAt: new Date().toISOString(),
      provider: "email"
    };

    // 3. حفظ في Firestore (مع معالجة الأخطاء)
    let savedToFirestore = false;
    try{
      await FB_DB.collection("users").doc(uid).set(profile);
      savedToFirestore = true;
    }catch(fsErr){
      console.warn("Firestore write failed:", fsErr.code, fsErr.message);
      // حفظ احتياطي في localStorage
      try{
        const pending = JSON.parse(localStorage.getItem("ti_pending_reg")||"[]");
        pending.push(profile);
        localStorage.setItem("ti_pending_reg", JSON.stringify(pending));
      }catch(_){}
    }

    // 4. تسجيل خروج فوري (انتظار الموافقة)
    await FB_AUTH.signOut();

    // 5. مسح الحقول
    ["r-name","r-email","r-pass","r-phone","r-age","r-tg"].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value="";
    });
    const lvl=document.getElementById("r-level"); if(lvl) lvl.value="";

    // 6. رسالة نجاح
    showOk(
      "<strong>🎉 تم التسجيل بنجاح!</strong><br/>" +
      "حسابك في انتظار موافقة المسؤول.<br/>" +
      "<small style='color:var(--muted)'>ستتلقى إشعاراً عند القبول أو التواصل معنا على تيليجرام.</small>"
    );

    // العودة لتبويب الدخول بعد 3 ثوانٍ
    setTimeout(()=>{ try{ switchTab("login"); }catch(_){} }, 3000);

  }catch(authErr){
    console.error("Register error:", authErr.code, authErr.message);
    showErr(_fbErrMsg(authErr.code));
  }finally{
    setBtnLoading("btn-register",false,"إنشاء الحساب");
  }
}

// ── Google Sign-In (redirect — يعمل مع جميع الدول والمتصفحات) ──
async function doGoogleLogin(){
  setBtnLoading("btn-google-login",true,"جاري التوجيه...");
  try{
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    // نحفظ نوع مزود الدخول لمعالجة redirect القادم
    sessionStorage.setItem("_pendingSocial","google");
    await FB_AUTH.signInWithRedirect(provider);
  }catch(e){
    setBtnLoading("btn-google-login",false,null);
    lucide.createIcons();
    toast(_fbErrMsg(e.code),"error");
  }
}

// ── Apple Sign-In (redirect) ──
async function doAppleLogin(){
  setBtnLoading("btn-apple-login",true,"جاري التوجيه...");
  try{
    const provider=new firebase.auth.OAuthProvider("apple.com");
    provider.addScope("email"); provider.addScope("name");
    provider.setCustomParameters({locale:"ar"});
    sessionStorage.setItem("_pendingSocial","apple");
    await FB_AUTH.signInWithRedirect(provider);
  }catch(e){
    setBtnLoading("btn-apple-login",false,null);
    lucide.createIcons();
    toast(_fbErrMsg(e.code),"error");
  }
}

// ── معالجة نتيجة redirect بعد العودة من Google/Apple ──
async function _handleRedirectResult(){
  try{
    const result=await FB_AUTH.getRedirectResult();
    if(result && result.user){
      sessionStorage.removeItem("_pendingSocial");
      await _handleSocialLogin(result);
    }
  }catch(e){
    if(e.code && e.code!=="auth/no-auth-event"){
      toast(_fbErrMsg(e.code),"error");
    }
  }
}

// ── Handle social (Google / Apple) first-time or returning login ──
async function _handleSocialLogin(cred){
  const fbUser=cred.user;
  let profile=await fsGetUser(fbUser.uid);
  if(!profile){
    profile={
      name:fbUser.displayName||fbUser.email?.split("@")[0]||"مستخدم جديد",
      email:fbUser.email||"",phone:"",age:"",telegram:"",level:"",
      status:"pending",completedLessons:[],testResults:[],
      createdAt:new Date().toISOString(),
      provider:fbUser.providerData[0]?.providerId||"social"
    };
    await fsSetUser(fbUser.uid,profile);
    await FB_AUTH.signOut();
    toast("✅ تم ربط حسابك! في انتظار موافقة المسؤول.","success",5000);
    return;
  }
  await _handleStudentFirebaseLogin(fbUser,profile);
}

// ── Common post-login handler ──
async function _handleStudentFirebaseLogin(fbUser, profileArg){
  // ── جلب الملف الشخصي من Firestore ──
  let profile = profileArg || null;
  let fsError = null;

  if(!profile){
    try{
      const snap = await FB_DB.collection("users").doc(fbUser.uid).get();
      if(snap.exists) profile = snap.data();
    }catch(e){
      fsError = e;
      console.warn("Firestore read failed:", e.code, e.message);
    }
  }

  // ── حالة: Firestore غير متاح ──
  if(fsError && !profile){
    // محاولة من localStorage كاحتياط
    try{
      const cached = JSON.parse(localStorage.getItem("ti_user_cache_"+fbUser.uid)||"null");
      if(cached) profile = cached;
    }catch(_){}

    if(!profile){
      // نسمح بالدخول المؤقت مع تحذير
      toast("⚠️ تعذّر التحقق من حالة حسابك — دخول مؤقت","info",6000);
      loginUser({
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "طالب",
        email: fbUser.email||"",
        phone:"", age:"", telegram:"", level:"",
        isAdmin: false,
        completedLessons:[], testResults:[]
      });
      return;
    }
  }

  // ── حالة: مستخدم جديد لم يُسجَّل عبر النموذج ──
  if(!profile){
    // تسجيل عبر Google/Apple بدون ملف — أنشئ ملف pending
    const newProfile = {
      uid: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split("@")[0] || "طالب",
      email: fbUser.email||"",
      phone:"", age:"", telegram:"", level:"",
      status:"pending",
      completedLessons:[], testResults:[],
      createdAt: new Date().toISOString(),
      provider: fbUser.providerData?.[0]?.providerId||"unknown"
    };
    try{ await FB_DB.collection("users").doc(fbUser.uid).set(newProfile); }catch(_){}
    await FB_AUTH.signOut();
    _showLoginStatus("pending");
    return;
  }

  // ── فحص حالة الحساب ──
  const status = (profile.status||"pending").toLowerCase();

  if(status === "pending"){
    await FB_AUTH.signOut();
    _showLoginStatus("pending");
    return;
  }

  if(status === "rejected"){
    await FB_AUTH.signOut();
    _showLoginStatus("rejected");
    return;
  }

  // ── حفظ مؤقت في localStorage للتسريع ──
  try{ localStorage.setItem("ti_user_cache_"+fbUser.uid, JSON.stringify(profile)); }catch(_){}

  // ── تسجيل الدخول ──
  loginUser({
    id: fbUser.uid,
    name: profile.name || fbUser.displayName || fbUser.email?.split("@")[0] || "طالب",
    email: profile.email || fbUser.email||"",
    phone: profile.phone||"", age: profile.age||"",
    telegram: profile.telegram||"", level: profile.level||"",
    isAdmin: false,
    completedLessons: profile.completedLessons||[],
    testResults: profile.testResults||[]
  });
}

// ── عرض رسالة حالة الحساب في نموذج الدخول ──
function _showLoginStatus(status){
  // نعرض الرسالة في حقل خطأ الدخول أو نُظهر toast
  const loginErr = document.getElementById("login-err");
  if(status === "pending"){
    const msg = "⏳ حسابك في انتظار موافقة المسؤول. سيتم إشعارك قريباً.";
    if(loginErr){ loginErr.textContent=msg; loginErr.style.cssText="display:block;color:#856404;font-size:13px;padding:11px 14px;background:#fff3cd;border-radius:10px;margin-bottom:12px;border:1px solid #ffc107"; }
    else toast(msg,"info",6000);
  } else if(status === "rejected"){
    const msg = "❌ تم رفض طلب تسجيلك. يرجى التواصل مع المسؤول.";
    if(loginErr){ loginErr.textContent=msg; loginErr.style.cssText="display:block;color:#dc3545;font-size:13px;padding:11px 14px;background:#fff5f5;border-radius:10px;margin-bottom:12px;border:1px solid #dc3545"; }
    else toast(msg,"error",6000);
  }
}

// ── Firebase error messages in Arabic ──
function _fbErrMsg(code){
  const m={
    "auth/user-not-found":"البريد الإلكتروني غير مسجل",
    "auth/wrong-password":"كلمة المرور غير صحيحة",
    "auth/invalid-credential":"البريد أو كلمة المرور غير صحيحة",
    "auth/email-already-in-use":"البريد مسجل مسبقاً",
    "auth/invalid-email":"صيغة البريد الإلكتروني غير صحيحة",
    "auth/weak-password":"كلمة المرور ضعيفة (6 أحرف على الأقل)",
    "auth/too-many-requests":"محاولات كثيرة، يرجى الانتظار قليلاً",
    "auth/network-request-failed":"تعذّر الاتصال بالإنترنت",
    "auth/popup-blocked":"البوب-أب محجوب في المتصفح",
    "auth/popup-closed-by-user":"تم إغلاق نافذة تسجيل الدخول",
    "auth/account-exists-with-different-credential":"هذا البريد مرتبط بطريقة دخول أخرى",
    "auth/redirect-cancelled-by-user":"تم إلغاء عملية تسجيل الدخول",
    "auth/unauthorized-domain":"النطاق غير مُصرَّح به في Firebase Console",
    "auth/operation-not-allowed":"هذه الطريقة غير مفعّلة في Firebase Console",
    "auth/user-disabled":"هذا الحساب موقوف",
    "auth/requires-recent-login":"يرجى إعادة تسجيل الدخول لإتمام هذه العملية",
  };
  return m[code]||`حدث خطأ (${code||"غير معروف"})`;
}

// ── Button loading state ──
// ── إظهار/إخفاء كلمة المرور ──
function togglePassVis(inputId, btn){
  const inp = document.getElementById(inputId);
  if(!inp) return;
  const isHidden = inp.type === "password";
  inp.type = isHidden ? "text" : "password";
  const icon = btn.querySelector("i");
  if(icon) icon.setAttribute("data-lucide", isHidden ? "eye-off" : "eye");
  lucide.createIcons({nodes:[btn]});
}

function setBtnLoading(id,loading,text){
  const btn=document.getElementById(id);
  if(!btn) return;
  if(loading){ btn.disabled=true; btn._orig=btn.innerHTML; if(text) btn.innerHTML=`<span style="opacity:.7">${text}</span>`; }
  else{ btn.disabled=false; if(btn._orig) btn.innerHTML=btn._orig; }
}

function loginUser(u){
  APP.user=u;
  document.getElementById("public-wrapper").style.display="none";
  document.getElementById("app-wrapper").style.display="";
  if(isAdmin()){
    document.getElementById("nb-admin").style.display="";
    document.getElementById("nb-admin-qa").style.display="";
    document.getElementById("admin-badge").style.display="";
    const badge=document.getElementById("admin-badge");
    if(badge){
      badge.textContent = u.adminRole==="super" ? "المشرف العام" : (u.adminUsername||u.adminLabel||"مشرف");
    }
    const mobAdmin=document.getElementById("mob-nb-admin");
    if(mobAdmin) mobAdmin.style.display="";
  }
  const cfg=APP.siteConfig;
  const mobCh=document.getElementById("mob-nb-channel");
  if(mobCh && (cfg.privateChannel||cfg.contactTelegram||cfg.sheikhChannel)) mobCh.style.display="";
  updateNotifBadge();
  _updateAppFooter();
  const _dest = (window._PENDING_NAV && window._PENDING_NAV !== "login") ? window._PENDING_NAV : "dashboard";
  window._PENDING_NAV = null;
  navTo(_dest);
  toast(`أهلاً ${u.name}! 👋`,"success");
}


async function doLogout(){
  localStorage.removeItem(RM_KEY);
  localStorage.removeItem("ti_admin_rm");
  APP.user = null;
  _adminSessionEmail = "";
  _adminSessionPass  = "";
  try{ await FB_AUTH.signOut(); }catch(e){}
  // أخفِ شريط التطبيق وأظهر الصفحة الرئيسية
  document.getElementById("app-wrapper").style.display = "none";
  document.getElementById("nb-admin").style.display = "none";
  document.getElementById("nb-admin-qa").style.display = "none";
  document.getElementById("admin-badge").style.display = "none";
  const mobAdmin = document.getElementById("mob-nb-admin");
  if(mobAdmin) mobAdmin.style.display = "none";
  toast("تم تسجيل الخروج بنجاح","info");
  window.location.href = "index.html";
}

async function deleteMyAccount(){
  confirm2("هل تريد حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.",async()=>{
    try{
      const fbUser=FB_AUTH.currentUser;
      if(fbUser){
        // Delete Firestore profile first
        await fsDeleteUser(fbUser.uid);
        // Try to delete Firebase Auth account
        try{
          await fbUser.delete();
        }catch(authErr){
          if(authErr.code==="auth/requires-recent-login"){
            // Re-authenticate then delete
            toast("يرجى إعادة تسجيل الدخول لتأكيد حذف الحساب","info",5000);
            await FB_AUTH.signOut();
            APP.user=null;
            document.getElementById("app-wrapper").style.display="none";
            showPage("login");
            return;
          }
        }
      }
    }catch(e){ console.warn("deleteMyAccount error",e); }
    await doLogout();
    toast("تم حذف حسابك بنجاح","info");
  });
}

// ══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════
function addNotif(msg, type="info"){
  const n={id:uid(),msg,type,date:new Date().toLocaleDateString("ar"),read:false};
  APP.notifications.unshift(n);
  if(APP.notifications.length>50) APP.notifications=APP.notifications.slice(0,50);
  saveState();
  updateNotifBadge();
}
function updateNotifBadge(){
  const unread=APP.notifications.filter(n=>!n.read).length;
  const dot=document.getElementById("notif-badge-dot");
  if(dot) dot.style.display=unread>0?"":"none";
}
function toggleNotifPanel(){
  const p=document.getElementById("notif-panel");
  if(p.style.display==="none"||!p.style.display){
    renderNotifPanel();
    p.style.display="";
    APP.notifications.forEach(n=>n.read=true);
    saveState();
    updateNotifBadge();
  } else { p.style.display="none"; }
}
function closeNotifPanel(){ document.getElementById("notif-panel").style.display="none"; }
function renderNotifPanel(){
  const list=document.getElementById("notif-list");
  if(!APP.notifications.length){
    list.innerHTML=`<p style="color:var(--muted);text-align:center;padding:20px;font-size:13px">لا توجد إشعارات</p>`;return;
  }
  list.innerHTML=APP.notifications.slice(0,15).map(n=>`
    <div style="padding:10px 12px;border-radius:10px;margin-bottom:5px;background:${n.read?"var(--bg)":"rgba(212,180,142,.1)"};border:1px solid rgba(212,180,142,.15)">
      <div style="font-size:13px;color:var(--text);margin-bottom:3px">${n.msg}</div>
      <div style="font-size:11px;color:var(--muted)">${n.date}</div>
    </div>
  `).join("");
}
function clearNotifs(){ APP.notifications=[]; saveState(); updateNotifBadge(); renderNotifPanel(); }

// ── روابط التيليجرام والقنوات ──
function _tgHandle(val){
  // يحوّل @username أو t.me/... إلى رابط t.me
  if(!val) return "";
  val=val.trim();
  if(val.startsWith("http")) return val;
  if(val.startsWith("@")) return `https://t.me/${val.slice(1)}`;
  return `https://t.me/${val}`;
}
function _openTgLink(val){
  if(!val){ toast("لم يتم تعيين رابط بعد","info"); return; }
  const url=_tgHandle(val);
  // محاولة فتح التطبيق أولاً
  const appUrl = url.replace("https://t.me/","tg://resolve?domain=");
  const a=document.createElement("a"); a.href=appUrl; a.style.display="none"; document.body.appendChild(a);
  a.click(); document.body.removeChild(a);
  // فتح الرابط العادي كاحتياط
  setTimeout(()=>{ window.open(url,"_blank"); }, 300);
}
function openTelegram(){
  _openTgLink(APP.siteConfig.contactTelegram);
}
function openSheikhChannel(){
  _openTgLink(APP.siteConfig.sheikhChannel);
}
function openPrivateChannel(){
  _openTgLink(APP.siteConfig.privateChannel);
}

// ══════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════
function openModal(content, title=""){
  document.getElementById("modal-container").innerHTML=`
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-box" onclick="event.stopPropagation()">
        <div class="modal-head">
          <span class="modal-title">${title}</span>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        ${content}
      </div>
    </div>`;
  lucide.createIcons();
}
function closeModal(){ document.getElementById("modal-container").innerHTML=""; }

// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════

function renderDashboard(){
  const u=APP.user;
  const total=APP.courses.reduce((a,c)=>a+c.lessons.filter(l=>l.visible!==false).length,0);
  const done=(u.completedLessons||[]).length;
  const pct=total>0?Math.round(done/total*100):0;
  const tc=APP.courses.filter(c=>c.visible!==false)[new Date().getDay()%APP.courses.filter(c=>c.visible!==false).length];
  const tl=tc?.lessons?.filter(l=>l.visible!==false)?.[0];

  document.getElementById("app-page-dashboard").innerHTML=`
  <div class="pg">
    <!-- Welcome banner -->
    <div style="background:linear-gradient(135deg,var(--purple-d),var(--purple) 60%,var(--purple-l));padding:38px 32px;border-radius:0 0 26px 26px;margin-bottom:30px;position:relative;overflow:hidden">
      <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none"></div>
      <div style="position:absolute;bottom:-40px;left:40px;width:140px;height:140px;border-radius:50%;background:rgba(212,180,142,.04);pointer-events:none"></div>
      <div style="position:relative;z-index:1">
        <div class="fd">
          <h2 style="color:#fff;font-size:22px;font-weight:800;margin-bottom:5px">أهلاً، ${u.name} 👋</h2>
          <p style="color:rgba(232,207,168,.75);font-size:13px">${u.level||"طالب مسجل"}</p>
        </div>
        <div class="dash-stats" style="display:flex;gap:16px;margin-top:22px;flex-wrap:wrap">
          ${[["book-open",`${done}/${total}`,"الدروس","0"],["file-check",`${(u.testResults||[]).length}`,"الاختبارات","80"],["trending-up",`${pct}%`,"نسبة الإنجاز","160"]].map(([ic,v,l,d])=>`
          <div class="fu" style="animation-delay:${d}ms;background:rgba(255,255,255,.1);border-radius:14px;padding:12px 18px;border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(8px)">
            <div style="color:var(--gold);font-size:17px;font-weight:800;display:flex;align-items:center;gap:6px">
              <i data-lucide="${ic}" style="width:16px;height:16px"></i> ${v}
            </div>
            <div style="color:rgba(255,255,255,.6);font-size:11px;margin-top:2px">${l}</div>
          </div>`).join("")}
        </div>
        <div style="margin-top:16px;max-width:300px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:rgba(255,255,255,.7);font-size:11px">التقدم العام</span>
            <span style="color:var(--gold);font-size:11px;font-weight:700">${pct}%</span>
          </div>
          <div class="progress-wrap"><div class="progress-fill" style="--prog:${pct}%;width:${pct}%"></div></div>
        </div>
      </div>
    </div>

    <div style="padding:0 24px">
      ${tc&&tl?`
      <div class="fu" style="margin-bottom:28px">
        <h3 style="color:var(--purple);font-size:15px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:7px">
          <i data-lucide="calendar" style="width:16px;height:16px;color:var(--gold)"></i> مقرر اليوم
        </h3>
        <div class="card" onclick="openCourse(${tc.id})" style="padding:22px;cursor:pointer;animation:borderGlow 3s ease-in-out infinite;border-width:2px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div>
              <div style="color:var(--muted);font-size:12px;margin-bottom:4px">${tc.title}</div>
              <div style="color:var(--purple);font-size:18px;font-weight:800">${tl.title}</div>
              <div style="color:var(--gold);font-size:12px;margin-top:6px;font-weight:600;display:flex;align-items:center;gap:5px">
                <i data-lucide="play-circle" style="width:13px;height:13px"></i> ابدأ الآن
              </div>
            </div>
            <i data-lucide="book-open" style="width:44px;height:44px;color:var(--purple);opacity:.2;flex-shrink:0" class="float"></i>
          </div>
        </div>
      </div>`:""}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="color:var(--purple);font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px" class="fu">
          <i data-lucide="layers" style="width:16px;height:16px;color:var(--gold)"></i> المقررات الدراسية
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="navTo('courses')">
          <i data-lucide="arrow-left" style="width:13px;height:13px"></i> عرض الكل
        </button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;margin-bottom:28px">
        ${APP.courses.filter(c=>c.visible!==false).slice(0,3).map((c,i)=>`
        <div class="card fu" style="animation-delay:${i*80}ms;padding:20px;cursor:pointer;overflow:hidden;position:relative" onclick="openCourse(${c.id})">
          <div style="position:absolute;top:0;right:0;left:0;height:4px;background:linear-gradient(90deg,${c.color},${c.color}99)"></div>
          <div style="width:40px;height:40px;border-radius:10px;background:${c.color}15;display:flex;align-items:center;justify-content:center;margin-bottom:12px">
            <i data-lucide="${c.icon||'book'}" style="width:20px;height:20px;color:${c.color}"></i>
          </div>
          <h4 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:6px">${c.title}</h4>
          <p style="color:var(--muted);font-size:12px;line-height:1.65;margin-bottom:12px">${c.description}</p>
          <span class="tag tag-gold">${c.lessons.filter(l=>l.visible!==false).length} درس</span>
        </div>`).join("")}
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm fu d3" onclick="navTo('tests')">
          <i data-lucide="file-text" style="width:13px;height:13px"></i> الاختبارات
        </button>
        <button class="btn btn-ghost btn-sm fu d4" onclick="navTo('qa')">
          <i data-lucide="help-circle" style="width:13px;height:13px"></i> الأسئلة والاستفسارات
        </button>
      </div>

      ${APP.siteConfig.privateChannel?`
      <!-- قناة المعهد الخاصة -->
      <div class="card fu" style="margin-top:24px;padding:20px;border:2px solid rgba(212,180,142,.35);background:linear-gradient(135deg,rgba(59,27,64,.03),rgba(212,180,142,.06))">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#229ED9,#1a7bbf);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i data-lucide="send" style="width:20px;height:20px;color:#fff"></i>
          </div>
          <div>
            <div style="font-size:15px;font-weight:800;color:var(--purple)">قناة المعهد الخاصة</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">مخصصة لطلاب معهد التأصيل العلمي</div>
          </div>
        </div>
        <div style="background:rgba(220,53,69,.07);border:1px solid rgba(220,53,69,.2);border-radius:9px;padding:9px 13px;margin-bottom:12px;display:flex;align-items:flex-start;gap:7px">
          <i data-lucide="alert-circle" style="width:13px;height:13px;color:#dc3545;flex-shrink:0;margin-top:1px"></i>
          <span style="font-size:12px;color:#dc3545;font-weight:600">يُمنع نشر القناة — فهي خاصة بطلاب المعهد</span>
        </div>
        <button class="btn btn-primary" onclick="openPrivateChannelWithWarning()" style="width:100%;justify-content:center">
          <i data-lucide="send" style="width:14px;height:14px"></i> الانتقال إلى قناة المعهد
        </button>
      </div>`:""}
    </div>
  </div>`;
  lucide.createIcons();
}

// ══════════════════════════════════════════════════════════
// COURSES LIST
// ══════════════════════════════════════════════════════════
function renderCourses(){
  const visible = APP.courses.filter(c=>isAdmin()||c.visible!==false);
  const plan=APP.siteConfig.studyPlan||[];
  document.getElementById("app-page-courses").innerHTML=`
  <div class="pg" style="padding:28px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
      <h2 style="color:var(--purple);font-size:22px;font-weight:800">المقررات الدراسية <span style="font-size:13px;color:var(--muted);font-weight:400">(${visible.length}/100 مقرر)</span></h2>
      ${isAdmin()?`<button class="btn btn-gold" onclick="openCourseForm(null)" ${APP.courses.length>=100?"disabled title='الحد الأقصى 100 مقرر'":""}><i data-lucide="plus" style="width:15px;height:15px"></i> مقرر جديد</button>`:""}
    </div>

    <!-- Active courses -->
    ${visible.length>0?`
    <div class="courses-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;margin-bottom:40px">
      ${visible.map((c,i)=>`
      <div class="card fu" style="animation-delay:${i*70}ms;overflow:hidden;position:relative">
        ${!c.visible?`<div style="position:absolute;top:10px;left:10px;z-index:2"><span class="tag tag-red"><i data-lucide="eye-off" style="width:10px;height:10px"></i> مخفي</span></div>`:""}
        ${isAdmin()?`
        <div style="position:absolute;top:8px;right:8px;z-index:3;display:flex;gap:4px" onclick="event.stopPropagation()">
          <button class="btn-icon" title="تعديل" onclick="openCourseForm('${c.id}')" style="width:28px;height:28px;background:rgba(255,255,255,.9);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12)">
            <i data-lucide="edit-2" style="width:12px;height:12px;color:var(--purple)"></i>
          </button>
          <button class="btn-icon" title="حذف" onclick="adminDeleteCourse('${c.id}')" style="width:28px;height:28px;background:rgba(255,255,255,.9);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12)">
            <i data-lucide="trash-2" style="width:12px;height:12px;color:#dc3545"></i>
          </button>
        </div>`:""}
        <div style="height:5px;background:linear-gradient(90deg,${c.color},${c.color}99)"></div>
        <div style="padding:20px;cursor:pointer" onclick="openCourse(${c.id})">
          <div style="width:44px;height:44px;border-radius:11px;background:${c.color}18;display:flex;align-items:center;justify-content:center;margin-bottom:12px">
            <i data-lucide="${c.icon||'book'}" style="width:22px;height:22px;color:${c.color}"></i>
          </div>
          <h4 style="color:var(--purple);font-size:15px;font-weight:700;margin-bottom:6px">${c.title}</h4>
          <p style="color:var(--muted);font-size:12px;line-height:1.65;margin-bottom:14px">${c.description}</p>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="tag tag-gold">${c.lessons.filter(l=>l.visible!==false).length} درس</span>
            <span style="color:var(--purple);font-size:12px;font-weight:600">← دخول</span>
          </div>
        </div>
      </div>`).join("")}
    </div>`:""}

    <!-- Study plan section -->
    ${plan.length>0?`
    <div style="margin-top:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
        <div style="width:4px;height:28px;background:linear-gradient(180deg,var(--gold),var(--purple));border-radius:2px"></div>
        <h3 style="color:var(--purple);font-size:18px;font-weight:800;font-family:'Amiri',serif">الخطة الدراسية الشاملة</h3>
      </div>
      <div id="app-plan-grid" style="display:flex;flex-direction:column;gap:18px"></div>
    </div>`:""}
  </div>`;
  lucide.createIcons();
  // Render plan inside app
  const appPlanEl=document.getElementById("app-plan-grid");
  if(appPlanEl){
    const tmp=document.getElementById("public-plan-grid");
    if(tmp) appPlanEl.innerHTML=tmp.innerHTML;
    else renderPublicPlanInto(appPlanEl);
  }
}
function renderPublicPlanInto(el){
  if(!el) return;
  const plan=APP.siteConfig.studyPlan||[];
  const levelColors=["#b8965e","#3B1B40","#5a2d63"];
  el.innerHTML=plan.map((lvl,li)=>{
    const col=lvl.color||levelColors[li%levelColors.length];
    const stages=lvl.stages||[];
    if(!stages.length && lvl.courses){
      return `<div class="card" style="border-radius:16px;overflow:hidden">
        <div style="background:${col};padding:14px 18px"><h3 style="color:#fff;font-size:14px;font-weight:800">${lvl.level}</h3></div>
        <div style="padding:14px 18px">${(lvl.courses||[]).map(c=>`<div style="padding:7px 0;border-bottom:1px solid rgba(212,180,142,.15);font-size:13px;display:flex;gap:8px;align-items:flex-start"><i data-lucide="check" style="width:11px;height:11px;color:${col};margin-top:3px;flex-shrink:0"></i>${c}</div>`).join("")}</div>
      </div>`;
    }
    return `<div class="card" style="border-radius:18px;overflow:hidden">
      <div style="background:linear-gradient(135deg,${col},${col}cc);padding:16px 22px;display:flex;align-items:center;gap:12px">
        <div style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-family:'Amiri',serif;font-weight:800;color:#fff;font-size:15px;flex-shrink:0">${li===0?"◈":"◉"}</div>
        <div>
          <h3 style="color:#fff;font-size:15px;font-weight:800;font-family:'Amiri',serif">${lvl.level}</h3>
          ${stages.length?`<div style="color:rgba(255,255,255,.7);font-size:12px">${stages.length} مراحل — ${stages.reduce((a,s)=>a+(s.books?.length||0),0)} متناً</div>`:""}
        </div>
      </div>
      <div style="padding:16px 22px">
        ${stages.map((st,si)=>`
        <div style="margin-bottom:${si<stages.length-1?'16':'0'}px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid ${col}22">
            <div style="width:20px;height:20px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0">${si+1}</div>
            <span style="color:${col};font-size:12px;font-weight:800">${st.name}</span>
          </div>
          ${(st.books||[]).map((b,bi)=>`
          <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid rgba(212,180,142,.1)">
            <span style="min-width:18px;height:18px;border-radius:50%;background:${col}15;border:1px solid ${col}30;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${col};flex-shrink:0;margin-top:2px">${bi+1}</span>
            <span style="color:var(--text);font-size:13px;line-height:1.6">${b}</span>
          </div>`).join("")}
        </div>`).join("")}
      </div>
    </div>`;
  }).join("");
  lucide.createIcons({nodes:[el]});
}

function openCourse(id){
  APP.currentCourse = findById(APP.courses,id);
  APP.currentLesson = null;
  navTo("course-detail");
  renderCourseDetail();
}

// ══════════════════════════════════════════════════════════
// COURSE DETAIL
// ══════════════════════════════════════════════════════════
function renderCourseDetail(){
  const c=APP.currentCourse;
  if(!c) return;
  const lessons=c.lessons.filter(l=>isAdmin()||l.visible!==false||l.locked);
  const isCompleted=id=>(APP.user.completedLessons||[]).includes(`${c.id}_${id}`);

  document.getElementById("app-page-course-detail").innerHTML=`
  <div class="pg">
    <div style="background:linear-gradient(135deg,${c.color},${c.color}cc);padding:22px 28px;box-shadow:0 4px 24px rgba(0,0,0,.2)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <button class="btn btn-sm" onclick="navTo('courses')" style="background:rgba(255,255,255,.15);color:#fff;border:none;backdrop-filter:blur(8px)">
          <i data-lucide="arrow-right" style="width:13px;height:13px"></i> رجوع
        </button>
        ${isAdmin()?`
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" onclick="openCourseForm('${c.id}')" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(8px)">
            <i data-lucide="edit-2" style="width:13px;height:13px"></i> تعديل المقرر
          </button>
          <button class="btn btn-sm" onclick="adminDeleteCourse('${c.id}')" style="background:rgba(220,53,69,.3);color:#fff;border:1px solid rgba(220,53,69,.4);backdrop-filter:blur(8px)">
            <i data-lucide="trash-2" style="width:13px;height:13px"></i> حذف
          </button>
        </div>`:""}
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center">
          <i data-lucide="${c.icon||'book'}" style="width:24px;height:24px;color:#fff"></i>
        </div>
        <div>
          <h1 style="color:#fff;font-size:20px;font-weight:800;margin-bottom:3px">${c.title}</h1>
          <p style="color:rgba(255,255,255,.7);font-size:13px">${c.info}</p>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:260px 1fr;min-height:calc(100vh - 120px)" id="course-layout">
      <!-- Sidebar -->
      <div style="background:var(--white);border-left:1px solid rgba(212,180,142,.18);padding:16px;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <span style="color:var(--purple);font-size:13px;font-weight:700">الدروس (${lessons.length})</span>
          ${isAdmin()?`<button class="btn btn-gold btn-sm" onclick="openLessonForm('${c.id}',null)"><i data-lucide="plus" style="width:11px;height:11px"></i> درس جديد</button>`:""}
        </div>
        ${lessons.length===0?`<div style="color:var(--muted);text-align:center;padding:32px 10px;font-size:13px">لا توجد دروس</div>`:""}
        ${lessons.map((l,i)=>{
          const locked=!isAdmin()&&l.locked;
          return `
          <div class="lesson-item fu ${APP.currentLesson?.id===l.id?"active":""} ${isCompleted(l.id)?"done":""}" 
               style="animation-delay:${i*50}ms;${locked?"opacity:.75;cursor:not-allowed":""}" 
               id="li-${l.id}" 
               onclick="${locked?"showLockedMsg()":"selectLesson("+c.id+","+l.id+")"}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <i data-lucide="${locked?"lock":isCompleted(l.id)?"check-circle":"play-circle"}" style="width:13px;height:13px;color:${locked?"#dc3545":isCompleted(l.id)?"#28a745":"var(--purple)"}"></i>
                  <span style="color:${locked?"var(--muted)":isCompleted(l.id)?"#28a745":"var(--purple)"};font-size:13px;font-weight:600">${l.title}</span>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <span style="color:var(--muted);font-size:11px">📝 ${l.exercises.length}</span>
                  <span style="color:var(--muted);font-size:11px">📎 ${l.attachments.length}</span>
                  ${l.audio?`<span style="color:var(--muted);font-size:11px">🎵</span>`:""}
                  ${!l.visible&&isAdmin()?`<span class="tag tag-red" style="font-size:9px;padding:1px 6px">مخفي</span>`:""}
                  ${l.locked?`<span class="tag tag-red" style="font-size:9px;padding:1px 6px">🔒 مقفل</span>`:""}
                </div>
              </div>
              ${isAdmin()?`
              <div style="display:flex;gap:2px" onclick="event.stopPropagation()">
                <button class="btn-icon" title="${l.locked?"فتح":"قفل"}" onclick="adminToggleLessonLock('${c.id}','${l.id}')" style="width:24px;height:24px;padding:4px;color:${l.locked?"#dc3545":"var(--muted)"}">
                  <i data-lucide="${l.locked?"lock":"lock-open"}" style="width:11px;height:11px"></i>
                </button>
                <button class="btn-icon" onclick="adminToggleLesson('${c.id}','${l.id}')" title="${l.visible?"إخفاء":"إظهار"}" style="width:24px;height:24px;padding:4px">
                  <i data-lucide="${l.visible?"eye-off":"eye"}" style="width:11px;height:11px"></i>
                </button>
                <button class="btn-icon" onclick="openLessonForm('${c.id}','${l.id}')" style="width:24px;height:24px;padding:4px">
                  <i data-lucide="edit-2" style="width:11px;height:11px"></i>
                </button>
                <button class="btn-icon" style="color:#dc3545;width:24px;height:24px;padding:4px" onclick="adminDeleteLesson('${c.id}','${l.id}')">
                  <i data-lucide="trash-2" style="width:11px;height:11px"></i>
                </button>
              </div>`:""}
            </div>
          </div>`}).join("")}
      </div>

      <!-- Content -->
      <div id="lesson-content" style="padding:24px;overflow-y:auto">
        <div style="text-align:center;padding:60px 24px;color:var(--muted)">
          <i data-lucide="play-circle" style="width:48px;height:48px;margin-bottom:12px;opacity:.3"></i>
          <p style="font-size:14px">اختر درساً من القائمة الجانبية</p>
        </div>
      </div>
    </div>
  </div>`;
  lucide.createIcons();

  // Responsive: stack on mobile
  if(window.innerWidth<900){
    document.getElementById("course-layout").style.gridTemplateColumns="1fr";
  }
}

function selectLesson(cid, lid){
  const c=findById(APP.courses,cid);
  const lesson=c?findById(c.lessons,lid):null;
  if(!isAdmin()&&lesson?.locked){ showLockedMsg(); return; }
  APP.currentLesson=lesson;
  document.querySelectorAll(".lesson-item").forEach(el=>el.classList.remove("active"));
  const li=document.getElementById(`li-${lid}`);
  if(li) li.classList.add("active");
  renderLessonContent();
}
function renderLessonContent(){
  const l=APP.currentLesson;const c=APP.currentCourse;
  if(!l||!c) return;
  const isCompleted=(APP.user.completedLessons||[]).includes(`${c.id}_${l.id}`);
  // تحويل رابط YouTube دائماً عند العرض (يصلح البيانات القديمة أيضاً)
  const embedUrl = toYoutubeEmbed(l.youtube||"");
  const audioUrl=l.audio||"";

  // Detect if audio URL is embeddable (soundcloud / direct mp3)
  const isDirectAudio=audioUrl&&(audioUrl.includes(".mp3")||audioUrl.includes(".ogg")||audioUrl.includes(".wav")||audioUrl.includes(".m4a")||audioUrl.includes(".aac"));
  const isSoundcloud=audioUrl&&audioUrl.includes("soundcloud.com");
  const isArchive=audioUrl&&audioUrl.includes("archive.org");

  let audioHTML="";
  if(audioUrl){
    if(isDirectAudio||isArchive){
      audioHTML=`
      <div class="card" style="padding:18px;margin-bottom:20px;border:1px solid rgba(212,180,142,.25)">
        <h4 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px">
          <i data-lucide="music" style="width:15px;height:15px;color:var(--gold)"></i> الملف الصوتي
        </h4>
        <audio controls style="width:100%;border-radius:10px;outline:none" preload="metadata">
          <source src="${audioUrl}">
          متصفحك لا يدعم تشغيل الصوت
        </audio>
      </div>`;
    } else if(isSoundcloud){
      const scEmbed=audioUrl.replace("soundcloud.com/","soundcloud.com/").includes("/sets/")?
        `https://w.soundcloud.com/player/?url=${encodeURIComponent(audioUrl)}&color=%233B1B40&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`:
        `https://w.soundcloud.com/player/?url=${encodeURIComponent(audioUrl)}&color=%233B1B40&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
      audioHTML=`
      <div class="card" style="padding:18px;margin-bottom:20px;border:1px solid rgba(212,180,142,.25)">
        <h4 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px">
          <i data-lucide="music" style="width:15px;height:15px;color:var(--gold)"></i> الملف الصوتي
        </h4>
        <iframe width="100%" height="120" scrolling="no" frameborder="no" allow="autoplay" src="${scEmbed}" style="border-radius:10px"></iframe>
      </div>`;
    } else {
      // Generic link
      audioHTML=`
      <div class="card" style="padding:16px;margin-bottom:20px;border:1px solid rgba(212,180,142,.25);display:flex;align-items:center;gap:12px">
        <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--purple-l));display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i data-lucide="music" style="width:18px;height:18px;color:#fff"></i>
        </div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:var(--purple);margin-bottom:2px">الملف الصوتي للدرس</div>
          <a href="${audioUrl}" target="_blank" style="font-size:12px;color:var(--gold-d);text-decoration:none">استمع / تحميل ←</a>
        </div>
      </div>`;
    }
  }

  document.getElementById("lesson-content").innerHTML=`
  <div class="sr">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="color:var(--purple);font-size:20px;font-weight:800">${l.title}</h2>
      ${l.locked&&isAdmin()?`<span class="tag tag-red"><i data-lucide="lock" style="width:11px;height:11px"></i> مقفل للطلاب</span>`:""}
    </div>

    ${embedUrl?`
    <div class="video-hero" style="margin-bottom:22px;box-shadow:0 12px 40px rgba(59,27,64,.18)">
      <iframe src="${embedUrl}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title="${l.title}" loading="lazy"></iframe>
    </div>`:`<div style="background:var(--bg);border-radius:14px;padding:28px;text-align:center;margin-bottom:22px;border:1px solid rgba(212,180,142,.2)"><i data-lucide="video-off" style="width:32px;height:32px;color:var(--muted);margin-bottom:8px"></i><p style="color:var(--muted);font-size:13px">لا يوجد فيديو لهذا الدرس</p></div>`}

    ${audioHTML}

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px">
      <button class="btn btn-primary" onclick="toggleExercises()">
        <i data-lucide="edit-3" style="width:14px;height:14px"></i> التمارين (${l.exercises.length})
      </button>
      <button class="btn ${isCompleted?"btn-ghost":"btn-gold"} ${isCompleted?"":"gp"}" onclick="markLessonDone('${c.id}','${l.id}')">
        <i data-lucide="${isCompleted?"check-circle":"flag"}" style="width:14px;height:14px"></i>
        ${isCompleted?"منجز":"إنجاز الدرس"}
      </button>
      ${isAdmin()?`<button class="btn btn-ghost" onclick="adminAddExercise('${c.id}','${l.id}')"><i data-lucide="plus" style="width:13px;height:13px"></i> تمرين</button>`:""}
    </div>

    <!-- Attachments -->
    ${l.attachments.length>0||isAdmin()?`
    <div class="card" style="padding:18px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="color:var(--purple);font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px">
          <i data-lucide="paperclip" style="width:14px;height:14px;color:var(--gold)"></i> المرفقات
        </h4>
        ${isAdmin()?`<button class="btn btn-ghost btn-sm" onclick="adminUploadAttachment('${c.id}','${l.id}')"><i data-lucide="upload" style="width:12px;height:12px"></i> رفع ملف</button>`:""}
      </div>
      <div id="attachments-list">
        ${l.attachments.length===0?`<p style="color:var(--muted);font-size:13px">لا توجد مرفقات</p>`:""}
        ${l.attachments.map((a,ai)=>`
        <div class="file-chip">
          <i data-lucide="${a.type==="pdf"?"file-text":"file"}" style="width:13px;height:13px;color:var(--gold)"></i>
          ${a.name}
          ${isAdmin()?`<button onclick="removeAttachment('${c.id}','${l.id}',${ai})"><i data-lucide="x" style="width:11px;height:11px"></i></button>`:""}
        </div>`).join("")}
      </div>
    </div>`:""}

    <!-- Exercises -->
    <div id="exercises-wrap" style="display:none">
      <div class="card" style="padding:20px">
        <h4 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:6px">
          <i data-lucide="edit-3" style="width:14px;height:14px;color:var(--gold)"></i> تمارين الدرس
        </h4>
        ${l.exercises.length===0?`<p style="color:var(--muted);font-size:13px">لا توجد تمارين لهذا الدرس</p>`:""}
        ${l.exercises.map((ex,ei)=>`
        <div class="card" style="padding:16px;margin-bottom:14px;background:var(--bg)">
          ${isAdmin()?`<div style="display:flex;justify-content:flex-end;gap:5px;margin-bottom:8px">
            <button class="btn btn-ghost btn-sm" onclick="adminEditExercise('${c.id}','${l.id}',${ei})"><i data-lucide="edit-2" style="width:11px;height:11px"></i></button>
            <button class="btn btn-danger btn-sm" onclick="adminDeleteExercise('${c.id}','${l.id}',${ei})"><i data-lucide="trash-2" style="width:11px;height:11px"></i></button>
          </div>`:""}
          <p style="color:var(--purple);font-weight:700;font-size:14px;margin-bottom:4px">${ei+1}. ${ex.q}</p>
          ${ex.multi?`<p style="font-size:11px;color:var(--muted);margin-bottom:10px">(اختر كل الإجابات الصحيحة)</p>`:""}
          ${ex.options.map((opt,oi)=>ex.multi?`
          <label id="opt-${ei}-${oi}" style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:10px;margin-bottom:6px;cursor:pointer;background:var(--white);border:1.5px solid rgba(212,180,142,.28);transition:all .2s;font-size:13px">
            <input type="checkbox" id="cb-${ei}-${oi}" style="accent-color:var(--purple);width:15px;height:15px"> ${opt}
          </label>`:`
          <label id="opt-${ei}-${oi}" style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:10px;margin-bottom:6px;cursor:pointer;background:var(--white);border:1.5px solid rgba(212,180,142,.28);transition:all .2s;font-size:13px">
            <input type="radio" name="ex${ei}" value="${oi}" style="accent-color:var(--purple)"> ${opt}
          </label>`).join("")}
          <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="checkExerciseNew(${ei})">
            <i data-lucide="check-circle" style="width:13px;height:13px"></i> تحقق من الإجابة
          </button>
          <div id="ex-res-${ei}" style="display:none;margin-top:8px"></div>
        </div>`).join("")}
      </div>
    </div>
  </div>`;
  lucide.createIcons();
}

function getFileIcon(t=""){
  t=t.toLowerCase();
  if(t.includes("pdf")) return "file-text";
  if(t.includes("image")||t.includes("png")||t.includes("jpg")||t.includes("jpeg")) return "image";
  if(t.includes("video")||t.includes("mp4")) return "video";
  if(t.includes("word")||t.includes("doc")) return "file";
  if(t.includes("excel")||t.includes("xls")||t.includes("spreadsheet")) return "table";
  return "paperclip";
}
function toggleExercises(){
  const p=document.getElementById("exercises-wrap");
  if(p) p.style.display=p.style.display==="none"?"":"none";
}

function checkExerciseNew(ei){
  const l=APP.currentLesson;
  if(!l) return;
  const ex=l.exercises[ei];
  if(!ex) return;
  const resEl=document.getElementById(`ex-res-${ei}`);

  if(ex.multi){
    // خيار أو أكثر
    const selected=ex.options.map((_,oi)=>document.getElementById(`cb-${ei}-${oi}`)?.checked?oi:-1).filter(x=>x>=0);
    const correct=ex.answers||[ex.answer];
    const isRight=correct.length===selected.length && correct.every(a=>selected.includes(a));
    // تلوين الخيارات
    ex.options.forEach((_,oi)=>{
      const lbl=document.getElementById(`opt-${ei}-${oi}`);
      if(!lbl) return;
      const isCorrect=correct.includes(oi), isSelected=selected.includes(oi);
      if(isCorrect) lbl.style.cssText+="border-color:#28a745;background:#d4edda";
      else if(isSelected) lbl.style.cssText+="border-color:#dc3545;background:#f8d7da";
    });
    if(resEl){ resEl.style.display=""; resEl.innerHTML=`<div style="padding:8px 12px;border-radius:9px;background:${isRight?"#d4edda":"#f8d7da"};color:${isRight?"#28a745":"#dc3545"};font-size:13px;font-weight:700">${isRight?"✅ أحسنت! إجابة صحيحة":"❌ إجابة غير صحيحة — الإجابات الصحيحة: "+correct.map(a=>ex.options[a]).join("، ")}</div>`; }
  } else {
    // خيار واحد
    const sel=ex.options.map((_,oi)=>{const r=document.querySelector(`input[name="ex${ei}"][value="${oi}"]`);return r?.checked?oi:-1;}).find(x=>x>=0)??null;
    if(sel===null){ toast("اختر إجابة أولاً","error"); return; }
    const isRight=sel===ex.answer;
    ex.options.forEach((_,oi)=>{
      const lbl=document.getElementById(`opt-${ei}-${oi}`);
      if(!lbl) return;
      if(oi===ex.answer) lbl.style.cssText+="border-color:#28a745;background:#d4edda";
      else if(oi===sel) lbl.style.cssText+="border-color:#dc3545;background:#f8d7da";
    });
    if(resEl){ resEl.style.display=""; resEl.innerHTML=`<div style="padding:8px 12px;border-radius:9px;background:${isRight?"#d4edda":"#f8d7da"};color:${isRight?"#28a745":"#dc3545"};font-size:13px;font-weight:700">${isRight?"✅ أحسنت!":"❌ إجابة خاطئة — الصحيحة: "+ex.options[ex.answer]}</div>`; }
  }
}
function pickAnswer(qi, oi){
  window._exAnswers[qi]=oi;
  if(!window._exSubmitted) return;
  highlightAnswers();
}
function submitExercises(){
  if(window._exSubmitted) return;
  window._exSubmitted=true;
  highlightAnswers();
  const l=APP.currentLesson;
  let correct=0;
  l.exercises.forEach((ex,i)=>{ if(window._exAnswers[i]===ex.answer) correct++; });
  const pct=Math.round(correct/l.exercises.length*100);
  const res=document.getElementById("ex-result");
  if(res){
    res.style.display="";
    res.innerHTML=`<div class="pi" style="background:${pct>=80?"#d4edda":pct>=60?"#fff3cd":"#f8d7da"};border-radius:14px;padding:18px 22px;text-align:center;margin-top:14px;border:1px solid ${pct>=80?"#28a745":pct>=60?"#ffc107":"#f5c6cb"}">
      <div style="font-size:32px;margin-bottom:8px">${pct>=80?"🎉":pct>=60?"💪":"📚"}</div>
      <div style="font-weight:800;font-size:18px;color:var(--purple)">${correct} / ${l.exercises.length}</div>
      <div style="color:var(--muted);font-size:13px;margin-top:4px">${pct>=80?"ممتاز! جميع الإجابات صحيحة تقريباً":"استمر في المراجعة"}</div>
    </div>`;
    lucide.createIcons({nodes:[res]});
  }
  document.getElementById("ex-submit-wrap").style.display="none";
}
function highlightAnswers(){
  const l=APP.currentLesson;
  l.exercises.forEach((ex,i)=>{
    ex.options.forEach((_,oi)=>{
      const el=document.getElementById(`opt-${i}-${oi}`);
      if(!el) return;
      const isSel=window._exAnswers[i]===oi;
      const isCor=oi===ex.answer;
      if(window._exSubmitted){
        el.style.background=isCor?"#d4edda":isSel?"#f8d7da":"var(--bg)";
        el.style.borderColor=isCor?"#28a745":isSel?"#dc3545":"rgba(212,180,142,.28)";
        el.style.cursor="default";
        el.querySelector("input").disabled=true;
      } else {
        el.style.background=isSel?"rgba(212,180,142,.15)":"var(--bg)";
        el.style.borderColor=isSel?"var(--gold)":"rgba(212,180,142,.28)";
      }
    });
  });
}
async function markLessonDone(cid,lid){
  const key=`${cid}_${lid}`;
  const comp=APP.user.completedLessons||[];
  if(!comp.includes(key)){
    APP.user.completedLessons=[...comp,key];
    // Sync to Firestore if real user
    try{ await fsSetUser(APP.user.id,{completedLessons:APP.user.completedLessons}); }catch(e){}
    toast("تم تسجيل إنجاز الدرس! ✅","success");
    renderLessonContent();
    const li=document.getElementById(`li-${lid}`);
    if(li) li.classList.add("done");
  }
}

// Attachment upload modal
function adminUploadAttachment(cid, lid){
  openModal(`
    <div id="drop-zone" class="dropzone" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleFileDrop(event,'${cid}','${lid}')" onclick="document.getElementById('file-inp').click()">
      <i data-lucide="upload-cloud" style="width:38px;height:38px;color:var(--gold);margin-bottom:8px"></i>
      <p style="font-size:14px;font-weight:600;color:var(--purple)">اسحب وأفلت الملف هنا</p>
      <p style="font-size:12px">أو اضغط للاختيار — PDF, Word, Excel, صور, فيديو</p>
      <input type="file" id="file-inp" style="display:none" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.mov" onchange="handleFileInput(event,'${cid}','${lid}')">
    </div>
    <div id="upload-list" style="margin-top:12px"></div>
  `, "رفع مرفقات");
  lucide.createIcons();
}
function handleFileDrop(e, cid, lid){
  e.preventDefault();
  document.getElementById("drop-zone").classList.remove("drag-over");
  processFiles(Array.from(e.dataTransfer.files), cid, lid);
}
function handleFileInput(e, cid, lid){
  processFiles(Array.from(e.target.files), cid, lid);
}
function processFiles(files, cid, lid){
  const c=findById(APP.courses,cid);
  const l=c?findById(c.lessons,lid):null;
  if(!l) return;
  files.forEach(f=>{
    // In real app: upload to Firebase Storage. Here we just store name/type
    l.attachments.push({name:f.name, type:f.type, size:f.size});
    toast(`تم رفع: ${f.name}`,"success");
  });
  saveState();
  const ul=document.getElementById("upload-list");
  if(ul) ul.innerHTML=files.map(f=>`<div class="file-chip"><i data-lucide="${getFileIcon(f.type)}" style="width:13px;height:13px;color:var(--purple)"></i>${f.name}<span style="color:var(--muted);font-size:10px">${(f.size/1024).toFixed(0)}KB</span></div>`).join("");
  lucide.createIcons({nodes:[ul]});
  // Re-render attachment list
  setTimeout(()=>{ closeModal(); selectLesson(cid,lid); },1200);
}
function deleteAttachment(cid,lid,ai){
  const c=findById(APP.courses,cid);const l=c?findById(c.lessons,lid):null;
  if(!l) return;
  l.attachments.splice(ai,1);
  fbWriteCourse(c).then(()=>{}).catch(()=>{});
  selectLesson(cid,lid);toast("تم حذف المرفق","info");
}

// ══════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════
function renderTests(){
  document.getElementById("app-page-tests").innerHTML=`
  <div class="pg" style="padding:28px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
      <h2 style="color:var(--purple);font-size:22px;font-weight:800;display:flex;align-items:center;gap:8px">
        <i data-lucide="file-text" style="width:22px;height:22px;color:var(--gold)"></i> الاختبارات <span style="font-size:13px;color:var(--muted);font-weight:400">(${APP.tests.length}/100)</span>
      </h2>
      ${isAdmin()?`<button class="btn btn-gold" onclick="openTestForm(null)" ${APP.tests.length>=100?"disabled title='الحد الأقصى 100 اختبار'":""}><i data-lucide="plus" style="width:15px;height:15px"></i> اختبار جديد</button>`:""}
    </div>
    ${APP.tests.length===0?`<div style="text-align:center;padding:60px;color:var(--muted)"><i data-lucide="file-text" style="width:48px;height:48px;opacity:.2;margin-bottom:12px"></i><p>لا توجد اختبارات حالياً</p>${isAdmin()?`<button class="btn btn-gold" style="margin-top:16px" onclick="openTestForm(null)"><i data-lucide="plus" style="width:14px;height:14px"></i> أضف أول اختبار</button>`:""}</div>`:""}
    <div style="display:grid;gap:14px">
      ${APP.tests.map((t,i)=>`
      <div class="card fu" style="animation-delay:${i*70}ms;padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
          <div style="flex:1">
            <h3 style="color:var(--purple);font-size:16px;font-weight:700;margin-bottom:6px">${t.title}</h3>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="tag tag-gold"><i data-lucide="help-circle" style="width:10px;height:10px"></i> ${t.questions.length} سؤال</span>
              ${!t.visible&&isAdmin()?`<span class="tag tag-red"><i data-lucide="eye-off" style="width:10px;height:10px"></i> مخفي</span>`:""}
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="startTest(${t.id})">
              <i data-lucide="play" style="width:13px;height:13px"></i> ابدأ الاختبار
            </button>
            ${isAdmin()?`
            <button class="btn btn-ghost btn-sm" title="تعديل" onclick="openTestForm('${t.id}')">
              <i data-lucide="edit-2" style="width:13px;height:13px"></i> تعديل
            </button>
            <button class="btn btn-sm" title="حذف" onclick="adminDeleteTest('${t.id}')" style="background:#dc3545;color:#fff;border:none;padding:8px 12px;border-radius:10px;cursor:pointer;font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px">
              <i data-lucide="trash-2" style="width:13px;height:13px"></i>
            </button>`:""}
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>`;
  lucide.createIcons();
}

let _testState={id:null,answers:{},submitted:false};
function startTest(tid){
  const t=findById(APP.tests,tid);
  if(!t) return;
  _testState={id:tid,answers:{},multiAnswers:{},submitted:false};
  document.getElementById("app-page-tests").innerHTML=`
  <div class="pg" style="padding:28px">
    <button class="btn btn-ghost btn-sm" onclick="renderTests()" style="margin-bottom:22px"><i data-lucide="arrow-right" style="width:13px;height:13px"></i> رجوع</button>
    <div class="card" style="max-width:680px;margin:0 auto;padding:32px">
      <h2 style="color:var(--purple);font-size:20px;font-weight:800;margin-bottom:5px">${t.title}</h2>
      <p style="color:var(--muted);font-size:13px;margin-bottom:26px">${t.questions.length} سؤال</p>
      ${t.questions.map((q,qi)=>`
      <div class="fu" style="animation-delay:${qi*55}ms;margin-bottom:24px" id="tq-${qi}">
        <p style="color:var(--purple);font-weight:700;font-size:14px;margin-bottom:4px">${qi+1}. ${q.q}</p>
        ${q.multi?`<p style="font-size:11px;color:var(--muted);margin-bottom:8px">(اختر كل الإجابات الصحيحة)</p>`:""}
        ${q.options.map((o,oi)=>q.multi?`
        <label id="topt-${qi}-${oi}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:11px;margin-bottom:6px;cursor:pointer;background:var(--bg);border:1.5px solid rgba(212,180,142,.28);transition:all .2s;font-size:13px">
          <input type="checkbox" id="tcb-${qi}-${oi}" style="accent-color:var(--purple);width:15px;height:15px" onchange="highlightTestMulti(${qi})"> ${o}
        </label>`:`
        <label id="topt-${qi}-${oi}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:11px;margin-bottom:6px;cursor:pointer;background:var(--bg);border:1.5px solid rgba(212,180,142,.28);transition:all .2s;font-size:13px">
          <input type="radio" name="tq${qi}" value="${oi}" style="accent-color:var(--purple)" onchange="_testState.answers[${qi}]=${oi};highlightTestOpts(${qi})"> ${o}
        </label>`).join("")}
      </div>`).join("")}
      <button class="btn btn-primary" style="width:100%;justify-content:center;padding:13px;font-size:15px" onclick="submitTest('${tid}')">
        <i data-lucide="send" style="width:15px;height:15px"></i> تسليم الاختبار
      </button>
    </div>
  </div>`;
  lucide.createIcons();
}
function highlightTestOpts(qi){
  const t=findById(APP.tests,_testState.id);
  if(!t||_testState.submitted) return;
  t.questions[qi].options.forEach((_,oi)=>{
    const el=document.getElementById(`topt-${qi}-${oi}`);
    if(!el) return;
    const isSel=_testState.answers[qi]===oi;
    el.style.background=isSel?"rgba(212,180,142,.15)":"var(--bg)";
    el.style.borderColor=isSel?"var(--gold)":"rgba(212,180,142,.28)";
  });
}
function highlightTestMulti(qi){
  const t=findById(APP.tests,_testState.id);
  if(!t||_testState.submitted) return;
  t.questions[qi].options.forEach((_,oi)=>{
    const cb=document.getElementById(`tcb-${qi}-${oi}`);
    const el=document.getElementById(`topt-${qi}-${oi}`);
    if(!el||!cb) return;
    el.style.background=cb.checked?"rgba(212,180,142,.15)":"var(--bg)";
    el.style.borderColor=cb.checked?"var(--gold)":"rgba(212,180,142,.28)";
  });
}
function submitTest(tid){
  const t=findById(APP.tests,tid);
  if(!t) return;
  _testState.submitted=true;
  let correct=0;
  t.questions.forEach((q,qi)=>{
    let isCor=false;
    if(q.multi){
      const correctAns=q.answers||[q.answer];
      const selected=q.options.map((_,oi)=>document.getElementById(`tcb-${qi}-${oi}`)?.checked?oi:-1).filter(x=>x>=0);
      isCor=correctAns.length===selected.length&&correctAns.every(a=>selected.includes(a));
      q.options.forEach((_,oi)=>{
        const el=document.getElementById(`topt-${qi}-${oi}`);
        const cb=document.getElementById(`tcb-${qi}-${oi}`);
        if(!el||!cb) return;
        const isAns=correctAns.includes(oi),isSel=selected.includes(oi);
        el.style.background=isAns?"#d4edda":(isSel?"#f8d7da":"var(--bg)");
        el.style.borderColor=isAns?"#28a745":(isSel?"#dc3545":"rgba(212,180,142,.28)");
        cb.disabled=true;
      });
    } else {
      isCor=_testState.answers[qi]===q.answer;
      q.options.forEach((_,oi)=>{
        const el=document.getElementById(`topt-${qi}-${oi}`);
        if(!el) return;
        el.style.background=oi===q.answer?"#d4edda":(_testState.answers[qi]===oi?"#f8d7da":"var(--bg)");
        el.style.borderColor=oi===q.answer?"#28a745":(_testState.answers[qi]===oi?"#dc3545":"rgba(212,180,142,.28)");
        const inp=el.querySelector("input"); if(inp) inp.disabled=true;
      });
    }
    if(isCor) correct++;
  });
  const pct=Math.round(correct/t.questions.length*100);
  const rs=[...(APP.user.testResults||[]),{testId:tid,correct,total:t.questions.length,pct,date:new Date().toLocaleDateString("ar")}];
  APP.user.testResults=rs;
  fsSetUser(APP.user.id,{testResults:rs}).catch(()=>{});
  const btn=document.querySelector("[onclick*='submitTest']");
  if(btn){
    btn.insertAdjacentHTML("afterend",`<div class="pi" style="margin-top:18px;background:${pct>=80?"#d4edda":pct>=60?"#fff3cd":"#f8d7da"};border-radius:14px;padding:22px;text-align:center;border:1px solid ${pct>=80?"#28a745":pct>=60?"#ffc107":"#f5c6cb"}">
      <div style="font-size:44px;margin-bottom:10px">${pct>=80?"🎉":pct>=60?"💪":"📚"}</div>
      <div style="font-size:42px;font-weight:800;color:${pct>=80?"#28a745":pct>=60?"#f5a623":"#dc3545"}">${pct}%</div>
      <div style="font-size:14px;color:var(--muted);margin-top:6px">${correct} / ${t.questions.length} إجابة صحيحة</div>
    </div>`);
    btn.remove();
  }
  lucide.createIcons();
}

// ══════════════════════════════════════════════════════════
// Q&A (STUDENT SIDE)
// ══════════════════════════════════════════════════════════
function renderQA(){
  const myQs=APP.questions.filter(q=>q.userId===APP.user.id);
  const publicQs=APP.questions.filter(q=>q.answer);
  document.getElementById("app-page-qa").innerHTML=`
  <div class="pg" style="padding:28px;max-width:800px;margin:0 auto">
    <h2 style="color:var(--purple);font-size:22px;font-weight:800;margin-bottom:22px;display:flex;align-items:center;gap:8px">
      <i data-lucide="help-circle" style="width:22px;height:22px;color:var(--gold)"></i> الأسئلة والاستفسارات
    </h2>

    <!-- Send question -->
    <div class="card" style="padding:22px;margin-bottom:24px">
      <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:6px">
        <i data-lucide="send" style="width:14px;height:14px;color:var(--gold)"></i> أرسل سؤالك
      </h3>
      <div class="inp-group"><label>موضوع السؤال</label><input type="text" id="q-subject" placeholder="موضوع أو عنوان السؤال"/></div>
      <div class="inp-group"><label>تفاصيل السؤال</label><textarea id="q-body" rows="4" placeholder="اكتب سؤالك هنا..."></textarea></div>
      <button class="btn btn-gold" onclick="submitQuestion()">
        <i data-lucide="send" style="width:14px;height:14px"></i> إرسال السؤال
      </button>
    </div>

    <!-- My questions -->
    ${myQs.length>0?`
    <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px">
      <i data-lucide="user" style="width:14px;height:14px;color:var(--gold)"></i> أسئلتي
    </h3>
    ${myQs.map(q=>`
    <div class="qa-item fu">
      <div class="qa-question"><i data-lucide="message-circle" style="width:14px;height:14px;color:var(--gold);flex-shrink:0;margin-top:1px"></i><div><div style="font-size:13px;color:var(--muted);margin-bottom:3px">${q.subject}</div>${q.body}</div></div>
      ${q.answer?`<div class="qa-answer"><strong>رد المسؤول:</strong> ${q.answer}</div>`:
      `<div class="qa-pending"><i data-lucide="clock" style="width:12px;height:12px"></i> في انتظار الرد من المسؤول</div>`}
    </div>`).join("")}`:""}

    <!-- Public answered Qs -->
    ${publicQs.length>0?`
    <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin:20px 0 12px;display:flex;align-items:center;gap:6px">
      <i data-lucide="book-open" style="width:14px;height:14px;color:var(--gold)"></i> أسئلة أجيب عليها
    </h3>
    ${publicQs.map(q=>`
    <div class="qa-item fu">
      <div class="qa-question"><i data-lucide="help-circle" style="width:14px;height:14px;color:var(--gold);flex-shrink:0;margin-top:1px"></i><div><div style="font-size:11px;color:var(--muted);margin-bottom:3px">${q.subject}</div>${q.body}</div></div>
      <div class="qa-answer"><strong>الإجابة:</strong> ${q.answer}</div>
    </div>`).join("")}`:""}
  </div>`;
  lucide.createIcons();
}
function submitQuestion(){
  const s=document.getElementById("q-subject")?.value.trim();
  const b=document.getElementById("q-body")?.value.trim();
  if(!s||!b){toast("يرجى ملء جميع الحقول","error");return;}
  const newQ={id:uid(),userId:APP.user.id,userName:APP.user.name,subject:s,body:b,answer:null,date:new Date().toLocaleDateString("ar")};
  APP.questions.push(newQ);
  fbWriteQuestion(newQ);
  toast("تم إرسال سؤالك بنجاح!","success");
  renderQA();
}

// ══════════════════════════════════════════════════════════
// ADMIN Q&A
// ══════════════════════════════════════════════════════════
function renderAdminQA(){
  if(!isAdmin()) return;
  const unanswered=APP.questions.filter(q=>!q.answer);
  const answered=APP.questions.filter(q=>q.answer);
  document.getElementById("app-page-admin-qa").innerHTML=`
  <div class="pg" style="padding:28px;max-width:900px;margin:0 auto">
    <h2 style="color:var(--purple);font-size:22px;font-weight:800;margin-bottom:22px;display:flex;align-items:center;gap:8px">
      <i data-lucide="message-square" style="width:22px;height:22px;color:var(--gold)"></i> إدارة استفسارات الطلاب
    </h2>

    ${unanswered.length>0?`
    <div class="admin-section">
      <h3><i data-lucide="inbox" style="width:16px;height:16px;color:#dc3545"></i> في انتظار الرد (${unanswered.length})</h3>
      ${unanswered.map(q=>`
      <div class="qa-item" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <span class="tag tag-blue" style="margin-bottom:6px">${q.userName}</span>
            <div class="qa-question" style="margin-bottom:0"><i data-lucide="help-circle" style="width:14px;height:14px;color:var(--gold);flex-shrink:0"></i><div><div style="font-size:12px;color:var(--muted);margin-bottom:2px">${q.subject} — ${q.date}</div>${q.body}</div></div>
          </div>
        </div>
        <div class="inp-group" style="margin-bottom:8px"><textarea id="ans-${q.id}" rows="3" placeholder="اكتب ردك هنا..."></textarea></div>
        <button class="btn btn-primary btn-sm" onclick="submitAnswer('${q.id}')">
          <i data-lucide="send" style="width:13px;height:13px"></i> إرسال الرد
        </button>
      </div>`).join("")}
    </div>`:`<div class="admin-section"><p style="color:#28a745;font-size:14px;display:flex;align-items:center;gap:6px"><i data-lucide="check-circle" style="width:16px;height:16px"></i> لا توجد استفسارات معلقة</p></div>`}

    ${answered.length>0?`
    <div class="admin-section">
      <h3><i data-lucide="check-circle" style="width:16px;height:16px;color:#28a745"></i> تم الرد عليها (${answered.length})</h3>
      ${answered.map(q=>`
      <div class="qa-item">
        <div style="display:flex;justify-content:space-between">
          <div class="qa-question"><i data-lucide="user" style="width:13px;height:13px;color:var(--gold);flex-shrink:0"></i><div><div style="font-size:11px;color:var(--muted)">${q.userName} — ${q.subject}</div>${q.body}</div></div>
          <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
        </div>
        <div class="qa-answer"><strong>ردك:</strong> ${q.answer} <button class="btn btn-ghost btn-sm" style="margin-right:8px" onclick="editAnswer('${q.id}')"><i data-lucide="edit-2" style="width:11px;height:11px"></i></button></div>
      </div>`).join("")}
    </div>`:""}
  </div>`;
  lucide.createIcons();
}
function submitAnswer(qid){
  const txt=document.getElementById(`ans-${qid}`)?.value.trim();
  if(!txt){toast("يرجى كتابة الرد","error");return;}
  const q=findById(APP.questions,qid);
  if(q){ q.answer=txt; fbWriteQuestion(q).then(()=>{ toast("تم إرسال الرد في Firebase ✅","success"); renderAdminQA(); }); }
}
function editAnswer(qid){
  const q=findById(APP.questions,qid);
  if(!q) return;
  openModal(`
    <div class="inp-group"><label>تعديل الرد</label><textarea id="edit-ans" rows="4">${q.answer||""}</textarea></div>
    <button class="btn btn-primary" onclick="saveEditAnswer('${qid}')"><i data-lucide="save" style="width:14px;height:14px"></i> حفظ</button>
  `,"تعديل الرد");
}
function saveEditAnswer(qid){
  const txt=document.getElementById("edit-ans")?.value.trim();
  const q=findById(APP.questions,qid);
  if(q&&txt){q.answer=txt;fbWriteQuestion(q).then(()=>{closeModal();toast("تم تحديث الرد في Firebase ✅","success");renderAdminQA();});}
}
function deleteQuestion(qid){
  fbRemoveQuestion(qid).then(()=>{renderAdminQA();toast("تم الحذف من Firebase ✅","info");});
}

// ══════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════
function renderProfile(){
  const u=APP.user;
  const done=(u.completedLessons||[]).length;
  const tr=u.testResults||[];
  const avgScore=tr.length>0?Math.round(tr.reduce((a,r)=>a+r.pct,0)/tr.length):0;
  const isAdminUser=isAdmin();
  document.getElementById("app-page-profile").innerHTML=`
  <div class="pg" style="padding:28px;max-width:700px;margin:0 auto">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,var(--purple-d),var(--purple));border-radius:22px;padding:32px;margin-bottom:22px;text-align:center;position:relative;overflow:hidden" class="fu">
      <div style="position:absolute;top:-60px;right:-60px;width:170px;height:170px;border-radius:50%;background:rgba(255,255,255,.04)"></div>
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-d));display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:30px;font-weight:800;color:var(--purple);box-shadow:0 8px 24px rgba(212,180,142,.4)" class="pi">
        ${u.name.charAt(0)}
      </div>
      <h2 style="color:#fff;font-size:20px;font-weight:800;margin-bottom:4px">${isAdminUser?(u.adminFullName||u.name):u.name}</h2>
      <p style="color:rgba(232,207,168,.7);font-size:13px">${isAdminUser?(u.adminRole==="super"?"مشرف عام":"مشرف"):(u.level||"طالب")}</p>
      ${isAdminUser?`<span style="background:linear-gradient(135deg,var(--gold),var(--gold-d));color:var(--purple);padding:4px 14px;border-radius:18px;font-size:11px;font-weight:700;margin-top:10px;display:inline-block" class="gp">${u.adminRole==="super"?"👑 المشرف العام":("🛡️ "+(u.adminUsername||"مشرف"))}</span>`:""}
    </div>
    ${!isAdminUser?`
    <!-- Student Stats -->
    <div class="card" style="padding:22px;margin-bottom:20px">
      <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:16px">إنجازاتي</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
        ${[["book-check",done,"درساً منجزاً"],["file-text",tr.length,"اختباراً"],["bar-chart-2",`${avgScore}%`,"معدل الاختبارات"]].map((s,i)=>`
        <div style="background:var(--bg);border-radius:14px;padding:16px;text-align:center;border:1px solid rgba(212,180,142,.1)">
          <i data-lucide="${s[0]}" style="width:22px;height:22px;color:var(--gold);margin-bottom:6px"></i>
          <div style="color:var(--purple);font-size:20px;font-weight:800">${s[1]}</div>
          <div style="color:var(--muted);font-size:11px">${s[2]}</div>
        </div>`).join("")}
      </div>
      ${tr.length>0?`
      <div style="margin-top:18px">
        <h4 style="color:var(--purple);font-size:13px;font-weight:700;margin-bottom:10px">نتائج الاختبارات</h4>
        <table class="tbl" style="border-radius:10px;overflow:hidden">
          <thead><tr><th>الاختبار</th><th>النتيجة</th><th>التاريخ</th></tr></thead>
          <tbody>${tr.slice(-5).reverse().map(r=>`<tr><td style="color:var(--text)">اختبار #${r.testId}</td><td><span class="tag ${r.pct>=80?"tag-green":r.pct>=60?"tag-gold":"tag-red"}">${r.correct}/${r.total} (${r.pct}%)</span></td><td style="color:var(--muted)">${r.date}</td></tr>`).join("")}</tbody>
        </table>
      </div>`:""}
    </div>
    <!-- Edit student info -->
    <div class="card" style="padding:24px;margin-bottom:16px">
      <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:6px">
        <i data-lucide="edit-3" style="width:14px;height:14px;color:var(--gold)"></i> تعديل المعلومات
      </h3>
      <div class="inp-grid">
        <div class="inp-group"><label>الاسم الثلاثي</label><input type="text" id="pf-name" value="${u.name||""}"/></div>
        <div class="inp-group"><label>العمر</label><input type="number" id="pf-age" value="${u.age||""}"/></div>
        <div class="inp-group"><label>رقم الهاتف</label><input type="text" id="pf-phone" value="${u.phone||""}"/></div>
        <div class="inp-group"><label>معرف التيليجرام</label><input type="text" id="pf-tg" value="${u.telegram||""}"/></div>
      </div>
      <div class="inp-group"><label>البريد الإلكتروني</label><input type="email" id="pf-email" value="${u.email||""}"/></div>
      <button class="btn btn-primary" onclick="saveProfile()">
        <i data-lucide="save" style="width:14px;height:14px"></i> حفظ التعديلات
      </button>
    </div>
    <!-- Delete account for student -->
    <div class="card" style="padding:20px;border-color:rgba(220,53,69,.2);background:rgba(220,53,69,.02)">
      <h3 style="color:#dc3545;font-size:13px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px">
        <i data-lucide="alert-triangle" style="width:14px;height:14px"></i> حذف الحساب
      </h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px">سيتم حذف حسابك وجميع بياناتك نهائياً ولا يمكن استرجاعها.</p>
      <button class="btn btn-danger btn-sm" onclick="deleteMyAccount()">
        <i data-lucide="trash-2" style="width:13px;height:13px"></i> حذف حسابي
      </button>
    </div>`:`
    <!-- Admin info & edit -->
    <div class="card" style="padding:24px;margin-bottom:16px">
      <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:6px">
        <i data-lucide="shield" style="width:14px;height:14px;color:var(--gold)"></i> بيانات حساب المسؤول
      </h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:var(--bg);border-radius:10px;padding:12px">
          <div style="font-size:11px;color:var(--muted);margin-bottom:3px">الاسم الثلاثي</div>
          <div style="font-size:14px;font-weight:700;color:var(--purple)">${u.adminFullName||u.name}</div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:12px">
          <div style="font-size:11px;color:var(--muted);margin-bottom:3px">اسم المستخدم</div>
          <div style="font-size:14px;font-weight:700;color:var(--purple)">${u.adminUsername||"—"}</div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:12px">
          <div style="font-size:11px;color:var(--muted);margin-bottom:3px">الدور</div>
          <div style="font-size:13px;font-weight:700;color:${u.adminRole==="super"?"var(--gold-d)":"var(--purple)"}">
            ${u.adminRole==="super"?"👑 مشرف عام":"🛡️ مشرف"}
          </div>
        </div>
      </div>
      <div class="inp-group"><label>الاسم الثلاثي</label><input type="text" id="adm-fullname" value="${u.adminFullName||u.name||""}"/></div>
      <div class="inp-group"><label>اسم المستخدم</label><input type="text" id="adm-username" value="${u.adminUsername||""}"/></div>
      <div class="inp-group"><label>كلمة المرور الجديدة (اتركه فارغاً للإبقاء)</label><input type="password" id="adm-newpass" placeholder="••••••••"/></div>
      <div class="inp-group"><label>تأكيد كلمة المرور</label><input type="password" id="adm-newpass2" placeholder="••••••••"/></div>
      <button class="btn btn-primary" onclick="saveAdminProfile()">
        <i data-lucide="save" style="width:14px;height:14px"></i> حفظ التعديلات
      </button>
    </div>`}
  </div>`;
  lucide.createIcons();
}
async function saveProfile(){
  const f={name:document.getElementById("pf-name")?.value.trim(),age:document.getElementById("pf-age")?.value,phone:document.getElementById("pf-phone")?.value.trim(),telegram:document.getElementById("pf-tg")?.value.trim(),email:document.getElementById("pf-email")?.value.trim()};
  Object.assign(APP.user,f);
  try{ await fsSetUser(APP.user.id,f); }catch(e){}
  toast("تم حفظ المعلومات بنجاح ✅","success");
}
async function saveAdminProfile(){
  const fullName  = document.getElementById("adm-fullname")?.value.trim();
  const username  = document.getElementById("adm-username")?.value.trim();
  const newPass   = document.getElementById("adm-newpass")?.value;
  const newPass2  = document.getElementById("adm-newpass2")?.value;
  if(!fullName||!username){ toast("الاسم واسم المستخدم مطلوبان","error"); return; }
  if(newPass&&newPass!==newPass2){ toast("كلمتا المرور غير متطابقتين","error"); return; }
  if(newPass&&newPass.length<6){ toast("كلمة المرور 6 أحرف على الأقل","error"); return; }
  try{
    // تحديث Firestore
    await fsSetAdmin(APP.user.id, {fullName, username});
    APP.user.adminFullName = fullName;
    APP.user.adminUsername = username;
    APP.user.name = fullName;
    // تحديث كلمة المرور في Firebase Auth
    if(newPass){
      const fbUser = FB_AUTH.currentUser;
      if(fbUser) await fbUser.updatePassword(newPass);
    }
    toast("تم تحديث بيانات المسؤول ✅","success");
    renderProfile();
  }catch(e){
    toast("حدث خطأ: "+_fbErrMsg(e.code),"error");
  }
  renderProfile();
}

// ══════════════════════════════════════════════════════════
// ABOUT APP PAGE
// ══════════════════════════════════════════════════════════
function renderAboutApp(){
  renderAboutPublic(); // same content
  const el=document.getElementById("app-page-about-app");
  const src=document.getElementById("page-about-public");
  if(el&&src) el.innerHTML=`<div class="pg">${src.innerHTML}</div>`;
}
function renderAboutPublic(){
  const cfg=APP.siteConfig;
  const el=document.getElementById("about-full-content");
  if(el) el.innerHTML=`
  <div style="margin-bottom:26px">
    <h2 style="color:var(--purple);font-size:19px;font-weight:800;margin-bottom:12px;font-family:'Amiri',serif;display:flex;align-items:center;gap:8px">
      <span style="color:var(--gold)">◈</span> تعريف بالشيخ مصعب بن صلاح حفظه الله
    </h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:8px;background:rgba(212,180,142,.07);border-radius:12px;padding:14px;margin-bottom:12px;font-size:12px">
      <div><span style="color:var(--gold-d);font-weight:700">▪️ الاسم:</span> مصعب بن صلاح بن علي</div>
      <div><span style="color:var(--gold-d);font-weight:700">▪️ الميلاد:</span> 1407هـ / 1987م</div>
      <div><span style="color:var(--gold-d);font-weight:700">▪️ الأصل:</span> محسي من الشمالية — عبري</div>
      <div><span style="color:var(--gold-d);font-weight:700">▪️ الدراسة:</span> الأحساء — المدينة المنورة — السودان</div>
    </div>
    <p style="color:var(--muted);font-size:13px;line-height:1.9">درس جميع المراحل الدراسية بالأحساء، تخرج من الثانوية عام 2004م، التحق بكلية الطب بجامعة العلوم والتقانة بأمدرمان، ثم انتقل إلى كلية الحديث الشريف بالجامعة الإسلامية بالمدينة المنورة عام 2009م، وعاد إلى السودان عام 2015م.</p>
  </div>
  <div style="margin-bottom:22px">
    <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px"><span style="color:var(--gold)">◈</span> مشايخه</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:5px">
      ${["الشيخ محمد أحيد الشنقيطي (النحو)","الشيخ عبدالرحمن الشنقيطي (النحو)","الشيخ أحمد محمود الشنقيطي (أصول الفقه)","الشيخ صالح سندي (العقيدة)","الشيخ سليمان الرحيلي","الشيخ صالح العصيمي","العلامة عبدالمحسن العباد البدر","العلامة صالح السحيمي","العلامة عبدالرزاق البدر","العلامة عبدالكريم الخضير","الشيخ عبدالله البخاري","الشيخ محمد بن هادي المدخلي","الشيخ عبيد الجابري","الشيخ أنيس طاهر (الجرح والتعديل)","الشيخ ربيع المدخلي","المفتي عبدالعزيز آل الشيخ","العلامة صالح الفوزان","العلامة صالح اللحيدان","العلامة أحمد المباركي","العلامة سعد الشثري","الشيخ خالد عبداللطيف","الشيخ حسن الهواري","الشيخ عبدالرحمن حامد","الشيخ محمد سيد حاج رحمه الله","الشيخ صلاح الأمين","الشيخ المرتضى الزين","الشيخ معتصم صلاح","الشيخ حاتم عز الدين","الشيخ فخر الدين الزبير"].map(s=>`<div style="background:rgba(212,180,142,.1);border:1px solid rgba(212,180,142,.28);border-radius:7px;padding:5px 11px;font-size:11px;color:var(--text);display:flex;align-items:center;gap:4px"><span style="color:var(--gold);font-size:7px">●</span>${s}</div>`).join("")}
    </div>
  </div>
  <div style="margin-bottom:22px">
    <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px"><span style="color:var(--gold)">◈</span> مؤلفاته</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:5px">
      ${["المدخل إلى طلب العلم","البيان المهم في حكم طلب العلم","ضوابط في التبديع","الرد على المخالف","ضوابط التعامل مع زلات العلماء","الجهل وأثره على الدعوة","الحزبية","التوضيح الأنفع شرح القواعد الأربع","خلاصة الكلام شرح نواقض الإسلام"].map((b,i)=>`<div style="background:linear-gradient(135deg,var(--purple),var(--purple-l));border-radius:8px;padding:7px 12px;color:#fff;font-size:11px;display:flex;align-items:center;gap:7px"><span style="color:var(--gold);font-weight:800;font-size:13px;flex-shrink:0">${i+1}</span>${b}</div>`).join("")}
    </div>
  </div>
  <div style="margin-bottom:22px">
    <h3 style="color:var(--purple);font-size:14px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px"><span style="color:var(--gold)">◈</span> الإجازات العلمية</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:5px">
      ${["📖 كتب السنة والحديث (الصحيحان والسنن)","📖 كتب العقيدة","📖 كتب التفاسير المشهورة","📖 كتب شروح الحديث","📖 كتب التاريخ والسيرة","📖 كتب الزهد والرقائق","📖 كتب الفقه وأصوله وقواعده","📖 كتب اللغة والأدب","📖 كتب علوم الحديث والمصطلح"].map(k=>`<div style="background:rgba(59,27,64,.06);border:1px solid rgba(59,27,64,.1);border-radius:7px;padding:6px 11px;font-size:11px;color:var(--purple)">${k}</div>`).join("")}
    </div>
  </div>
  <div style="border-top:2px solid rgba(212,180,142,.25);padding-top:18px">
    <h2 style="color:var(--purple);font-size:16px;font-weight:800;margin-bottom:12px;font-family:'Amiri',serif"><span style="color:var(--gold)">◈</span> عن البرنامج</h2>
    <p style="font-size:13px;line-height:2;color:var(--text);background:rgba(212,180,142,.07);border-radius:10px;padding:12px;margin-bottom:12px">برنامج علمي ميسَّر: يدرس الطالب فيه عدداً من المتون العلمية التي يحتاجها كل طالب علم، مع روافد متممة تُعين على استكمال بناء قوة الطالب العلمية والعملية.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(192px,1fr));gap:5px;margin-bottom:12px">
      ${["تدريس المتون المعتمدة","الاعتناء بحفظ المتون","الترقي في أخذ العلم","تكوين الملكة العلمية","معرفة العلاقة بين العلوم","القدرة على المباحثة","التكامل المعرفي","التعرف على المكتبة الإسلامية","معالجة الأغلاط المنهجية"].map(g=>`<div style="display:flex;align-items:center;gap:5px;padding:6px 10px;background:var(--bg);border-radius:7px;border:1px solid rgba(212,180,142,.18);font-size:11px;color:var(--text)"><span style="color:var(--gold);font-weight:800">◈</span>${g}</div>`).join("")}
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted)">
      <span>● الفئة: طلاب العلم ذكوراً وإناثاً بمختلف الأعمار</span>
      <span>● المدة: سنة واحدة فقط</span>
      <span>● إجازات علمية وشهادات إتمام</span>
    </div>
    ${cfg.aboutText?`<div style="margin-top:12px;border-top:1px solid rgba(212,180,142,.18);padding-top:10px;white-space:pre-line;line-height:1.9;color:var(--muted);font-size:12px">${cfg.aboutText}</div>`:""}
  </div>`;
  const tg=document.getElementById("about-team-grid");
  if(tg&&cfg.team?.length){
    tg.innerHTML=cfg.team.map(m=>`
    <div class="card" style="padding:20px;text-align:center">
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--gold));display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#fff;font-size:20px;font-weight:800">${m.name.charAt(0)}</div>
      <h4 style="color:var(--purple);font-size:14px;font-weight:700">${m.name}</h4>
      <p style="color:var(--muted);font-size:12px;margin-top:4px">${m.role}</p>
    </div>`).join("");
  }
  // Video — auto-show with default if not set
  const videoUrl = cfg.introVideo || "https://www.youtube.com/embed/z1bbUyoasaE";
  const vc=document.getElementById("landing-video-container");
  const vf=document.getElementById("landing-video-frame");
  const np=document.getElementById("no-video-placeholder");
  if(vf) vf.innerHTML=`<iframe src="${videoUrl}" allowfullscreen allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" loading="lazy"></iframe>`;
  if(vc) vc.style.display="";
  if(np) np.style.display="none";

  // Contact
  const ce=document.getElementById("contact-email"); if(ce)ce.textContent=cfg.contactEmail||"";
  const ct=document.getElementById("contact-telegram");
  if(ct){ ct.textContent=cfg.contactTelegram||""; ct.style.cursor="pointer"; }
  const cp=document.getElementById("contact-phone"); if(cp)cp.textContent=cfg.contactPhone||"";
  // Sheikh channel card
  const sc=document.getElementById("sheikh-channel-link");
  if(sc) sc.textContent=cfg.sheikhChannel?"الانتقال للقناة":"اضغط للانتقال للقناة";
  const scc=document.getElementById("sheikh-channel-card");
  if(scc) scc.style.display=cfg.sheikhChannel?"":"none";
  // Footer sheikh channel (public page)
  const fc=document.getElementById("footer-sheikh-channel");
  if(fc) fc.style.display=cfg.sheikhChannel?"":"none";
  // Update app footer & nav channel button
  _updateAppFooter();
  // Study plan public
  renderPublicPlan();
}

function _updateAppFooter(){
  const cfg=APP.siteConfig;
  // Nav channel button
  const nbCh=document.getElementById("nb-channel");
  if(nbCh) nbCh.style.display=(cfg.privateChannel||cfg.sheikhChannel||cfg.contactTelegram)?"":"none";
  // App footer tg
  const ftg=document.getElementById("footer-tg-btn");
  if(ftg){ ftg.style.display=cfg.contactTelegram?"inline-flex":"none"; }
  const ftgLbl=document.getElementById("footer-tg-label");
  if(ftgLbl) ftgLbl.textContent=cfg.contactTelegram||"تيليجرام";
  // App footer sheikh
  const fsh=document.getElementById("app-footer-sheikh");
  if(fsh) fsh.style.display=cfg.sheikhChannel?"":"none";
}

function openTelegramFromNav(){
  const cfg=APP.siteConfig;
  if(cfg.privateChannel) openPrivateChannel();
  else if(cfg.contactTelegram) openTelegram();
  else if(cfg.sheikhChannel) openSheikhChannel();
}
function renderPublicPlan(){
  const el=document.getElementById("public-plan-grid");
  if(!el) return;
  const plan=APP.siteConfig.studyPlan||[];
  const levelColors=["#b8965e","#3B1B40","#5a2d63","#2a1230"];
  el.innerHTML=plan.map((lvl,li)=>{
    const col=lvl.color||levelColors[li%levelColors.length];
    const stages=lvl.stages||[];
    // fallback for old format
    if(!stages.length && lvl.courses){
      return `<div class="card fu" style="animation-delay:${li*100}ms;border-radius:18px;overflow:hidden">
        <div style="background:${col};padding:16px 20px;display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:14px">${li+1}</div>
          <h3 style="color:#fff;font-size:15px;font-weight:800">${lvl.level}</h3>
        </div>
        <div style="padding:16px 20px">${(lvl.courses||[]).map(c=>`<div style="padding:8px 0;border-bottom:1px solid rgba(212,180,142,.15);color:var(--text);font-size:13px;display:flex;align-items:flex-start;gap:8px"><i data-lucide="book-open" style="width:12px;height:12px;color:${col};flex-shrink:0;margin-top:3px"></i>${c}</div>`).join("")}</div>
      </div>`;
    }
    return `<div class="card fu" style="animation-delay:${li*80}ms;border-radius:18px;overflow:hidden;grid-column:${li===1?"1/-1":"auto"}">
      <div style="background:linear-gradient(135deg,${col},${col}cc);padding:18px 22px;display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-family:'Amiri',serif;font-weight:800;color:#fff;font-size:16px;flex-shrink:0">${li===0?"◈":"◉"}</div>
        <div>
          <h3 style="color:#fff;font-size:16px;font-weight:800;font-family:'Amiri',serif">${lvl.level}</h3>
          ${stages.length?`<div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:2px">${stages.length} مراحل — ${stages.reduce((a,s)=>a+(s.books?.length||0),0)} متناً ومؤلَّفاً</div>`:""}
        </div>
      </div>
      <div style="padding:16px 20px">
        ${stages.map((st,si)=>`
        <div style="margin-bottom:${si<stages.length-1?'18':'0'}px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid ${col}22">
            <div style="width:22px;height:22px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0">${si+1}</div>
            <span style="color:${col};font-size:13px;font-weight:800">${st.name}</span>
          </div>
          ${(st.books||[]).map((b,bi)=>`
          <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(212,180,142,.12)">
            <span style="min-width:20px;height:20px;border-radius:50%;background:${col}18;border:1px solid ${col}33;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${col};flex-shrink:0;margin-top:1px">${bi+1}</span>
            <span style="color:var(--text);font-size:13px;line-height:1.6">${b}</span>
          </div>`).join("")}
        </div>`).join("")}
      </div>
    </div>`;
  }).join("");
  lucide.createIcons({nodes:[el]});
}

// ── User management helpers (Firestore) ──
async function renderAdminUsers(filter){
  const el=document.getElementById("admin-users-list");
  if(!el) return;
  el.innerHTML=`<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px"><i data-lucide="loader" style="width:16px;height:16px;animation:spin 1s linear infinite"></i> جاري التحميل...</div>`;
  lucide.createIcons({nodes:[el]});
  let allUsers=[];
  try{ allUsers=await fsGetAllUsers(); }catch(e){ el.innerHTML=`<p style="color:#dc3545;font-size:13px">تعذّر تحميل البيانات</p>`; return; }
  const filtered=filter==="all"?allUsers:allUsers.filter(u=>(u.status||"approved")===filter);
  if(!filtered.length){el.innerHTML=`<p style="color:var(--muted);font-size:13px;padding:8px">لا يوجد مستخدمون في هذه الفئة</p>`;return;}
  const providerIcon=p=>p==="google.com"?'<span style="color:#ea4335;font-size:10px;font-weight:700">G</span>':p==="apple.com"?'<span style="color:#000;font-size:10px;font-weight:700"></span>':p==="demo"?'🎭':'📧';
  el.innerHTML=`<table class="tbl" style="border-radius:12px;overflow:hidden">
    <thead><tr><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>الحالة</th><th>إجراءات</th></tr></thead>
    <tbody>${filtered.map(u=>{
      const st=u.status||"approved";
      const stLabel=st==="pending"?"في الانتظار":st==="rejected"?"مرفوض":"مقبول";
      const stClass=st==="pending"?"tag-gold":st==="rejected"?"tag-red":"tag-green";
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:6px">${providerIcon(u.provider||"email")}<span style="font-weight:600;color:var(--purple)">${u.name||"—"}</span></div></td>
        <td style="font-size:12px;color:var(--muted)">${u.email||"—"}</td>
        <td style="font-size:12px;color:var(--muted)">${u.phone||"—"}</td>
        <td><span class="tag ${stClass}">${stLabel}</span></td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            ${st==="pending"?`
              <button class="btn btn-sm" style="background:#28a745;color:#fff;border-radius:8px;padding:5px 10px;font-size:11px" onclick="approveUser('${u.id}')"><i data-lucide="check" style="width:11px;height:11px"></i> قبول</button>
              <button class="btn btn-danger btn-sm" onclick="rejectUser('${u.id}','${u.name?.replace(/'/g,"")||""}')"><i data-lucide="x" style="width:11px;height:11px"></i> رفض</button>`
            :st==="rejected"?`<button class="btn btn-sm" style="background:#28a745;color:#fff;border-radius:8px;padding:5px 10px;font-size:11px" onclick="approveUser('${u.id}')"><i data-lucide="check" style="width:11px;height:11px"></i> قبول</button>`:""}
            <button class="btn btn-danger btn-sm" onclick="adminDeleteUser('${u.id}','${u.name?.replace(/'/g,"")||""}')"><i data-lucide="trash-2" style="width:11px;height:11px"></i></button>
          </div>
        </td>
      </tr>`;
    }).join("")}</tbody>
  </table>`;
  lucide.createIcons({nodes:[el]});
}
async function approveUser(uid2){
  try{ await FB_DB.collection("users").doc(uid2).update({status:"approved"}); toast("تم قبول المستخدم ✅","success"); }
  catch(e){ toast("حدث خطأ أثناء القبول","error"); }
  renderAdminUsers("all");
}
async function rejectUser(uid2,name){
  try{ await FB_DB.collection("users").doc(uid2).update({status:"rejected"}); toast(`تم رفض ${name||"المستخدم"}`,"info"); }
  catch(e){ toast("حدث خطأ أثناء الرفض","error"); }
  renderAdminUsers("all");
}
async function adminDeleteUser(uid2,name){
  confirm2(`هل تريد حذف حساب "${name||"المستخدم"}" نهائياً؟`,async()=>{
    try{
      // Delete from Firestore users collection
      await fsDeleteUser(uid2);
      toast(`تم حذف حساب ${name||"المستخدم"} من قاعدة البيانات ✅`,"success");
      // Note: Firebase Auth account deletion requires Admin SDK (server-side)
      // The account will be unable to log in since Firestore profile is deleted
    }catch(e){
      toast("حدث خطأ أثناء الحذف: "+e.message,"error");
    }
    renderAdminUsers("all");
  });
}

// ══════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════
function renderAdmin(){
  if(!isAdmin()) return;
  document.getElementById("app-page-admin").innerHTML=`
  <div class="pg" style="padding:28px;max-width:1000px;margin:0 auto">
    <h2 style="color:var(--purple);font-size:22px;font-weight:800;margin-bottom:24px;display:flex;align-items:center;gap:8px">
      <i data-lucide="settings" style="width:22px;height:22px;color:var(--gold)"></i> لوحة الإدارة
    </h2>

    <!-- ── إدارة المسجلين ── -->
    <div class="admin-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="border:none;padding:0;margin:0"><i data-lucide="users" style="width:16px;height:16px;color:var(--gold)"></i> إدارة المسجلين</h3>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="renderAdminUsers('all')" id="ub-all">الكل</button>
          <button class="btn btn-gold btn-sm" onclick="renderAdminUsers('pending')" id="ub-pending">في الانتظار</button>
          <button class="btn btn-primary btn-sm" onclick="renderAdminUsers('approved')" id="ub-approved">مقبولون</button>
          <button class="btn btn-danger btn-sm" onclick="renderAdminUsers('rejected')" id="ub-rejected">مرفوضون</button>
        </div>
      </div>
      <div id="admin-users-list"></div>
    </div>

    <!-- ── إدارة المشرفين (المشرف العام فقط) ── -->
    ${isSuperAdmin()?`
    <div class="admin-section" style="border-color:rgba(212,180,142,.4);background:linear-gradient(135deg,rgba(59,27,64,.03),rgba(212,180,142,.04))">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="border:none;padding:0;margin:0">
          <i data-lucide="shield-check" style="width:16px;height:16px;color:var(--gold)"></i> إدارة المشرفين
        </h3>
        <button class="btn btn-gold btn-sm" onclick="openAddSupervisorModal()">
          <i data-lucide="user-plus" style="width:12px;height:12px"></i> إضافة مشرف
        </button>
      </div>
      <div id="supervisors-list">
        <div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">
          <i data-lucide="loader" style="width:16px;height:16px;animation:spin 1s linear infinite"></i> جاري تحميل المشرفين...
        </div>
      </div>
    </div>`:""}

    <!-- ── إعدادات الموقع ── -->
    <div class="admin-section">
      <h3><i data-lucide="globe" style="width:16px;height:16px;color:var(--gold)"></i> إعدادات الموقع</h3>
      <div class="inp-group"><label>رابط فيديو التعريف (YouTube Embed)</label><input type="text" id="cfg-video" value="${APP.siteConfig.introVideo||""}" placeholder="https://www.youtube.com/embed/..."/></div>
      <div class="inp-group"><label>بريد التواصل</label><input type="text" id="cfg-email" value="${APP.siteConfig.contactEmail||""}"/></div>
      <div class="inp-group"><label>تيليجرام المعهد (يُفتح بالتطبيق)</label><input type="text" id="cfg-tg" value="${APP.siteConfig.contactTelegram||""}" placeholder="@TaaseelInstitute"/></div>
      <div class="inp-group"><label>الهاتف</label><input type="text" id="cfg-phone" value="${APP.siteConfig.contactPhone||""}"/></div>
      <div class="inp-group"><label>قناة الشيخ مصعب بن صلاح (تيليجرام)</label><input type="text" id="cfg-sheikh-channel" value="${APP.siteConfig.sheikhChannel||""}" placeholder="@channelname أو رابط t.me/..."/></div>
      <div class="inp-group">
        <label>قناة المعهد الخاصة (للطلاب فقط)</label>
        <input type="text" id="cfg-private-channel" value="${APP.siteConfig.privateChannel||""}" placeholder="@channelname أو رابط t.me/..."/>
        <span style="font-size:11px;color:#dc3545;margin-top:4px;display:block">⚠️ ستظهر في لوحة الطالب مع تحذير عدم النشر</span>
      </div>
      <button class="btn btn-gold" onclick="saveConfig()"><i data-lucide="save" style="width:14px;height:14px"></i> حفظ الإعدادات</button>
    </div>

    <!-- ── عن المعهد ── -->
    <div class="admin-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="border:none;padding:0;margin:0"><i data-lucide="info" style="width:16px;height:16px;color:var(--gold)"></i> نص "من نحن"</h3>
        <button class="btn btn-gold btn-sm" onclick="adminEditInstitute()"><i data-lucide="edit-2" style="width:12px;height:12px"></i> تعديل معلومات المعهد</button>
      </div>
      <div class="inp-group"><textarea id="cfg-about" rows="7" style="direction:rtl">${APP.siteConfig.aboutText||""}</textarea></div>
      <button class="btn btn-primary btn-sm" onclick="saveAbout()"><i data-lucide="save" style="width:13px;height:13px"></i> حفظ</button>
    </div>

    <!-- ── فريق العمل ── -->
    <div class="admin-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="border:none;padding:0;margin:0"><i data-lucide="users" style="width:16px;height:16px;color:var(--gold)"></i> فريق العمل</h3>
        <button class="btn btn-gold btn-sm" onclick="addTeamMember()"><i data-lucide="plus" style="width:12px;height:12px"></i> إضافة</button>
      </div>
      <div id="team-list">
        ${(APP.siteConfig.team||[]).map((m,i)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(212,180,142,.15)">
          <span style="font-size:13px;color:var(--text);flex:1">${m.name} — ${m.role}</span>
          <button class="btn btn-danger btn-sm" onclick="deleteTeamMember(${i})"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
        </div>`).join("")||"<p style='color:var(--muted);font-size:13px'>لا يوجد أعضاء مضافون</p>"}
      </div>
    </div>

    <!-- ── الخطة الدراسية ── -->
    <div class="admin-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="border:none;padding:0;margin:0"><i data-lucide="list" style="width:16px;height:16px;color:var(--gold)"></i> الخطة الدراسية</h3>
        <button class="btn btn-gold btn-sm" onclick="editStudyPlan()"><i data-lucide="edit-2" style="width:12px;height:12px"></i> تعديل</button>
      </div>
      <div id="plan-preview">
        ${(APP.siteConfig.studyPlan||[]).map(l=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(212,180,142,.12)">
          <div style="width:10px;height:10px;border-radius:50%;background:${l.color};flex-shrink:0"></div>
          <span style="font-size:13px;color:var(--purple);font-weight:600">${l.level}</span>
          <span style="font-size:12px;color:var(--muted)">${(l.courses||[]).join("، ")}</span>
        </div>`).join("")}
      </div>
    </div>

    <!-- ── إدارة المقررات ── -->
    <div class="admin-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="border:none;padding:0;margin:0"><i data-lucide="layers" style="width:16px;height:16px;color:var(--gold)"></i> إدارة المقررات</h3>
        <button class="btn btn-gold btn-sm" onclick="openCourseForm(null)"><i data-lucide="plus" style="width:12px;height:12px"></i> مقرر جديد</button>
      </div>
      <table class="tbl" style="border-radius:12px;overflow:hidden">
        <thead><tr><th>المقرر</th><th>الدروس</th><th>الظهور</th><th>إجراءات</th></tr></thead>
        <tbody id="courses-admin-tbl">
          ${APP.courses.map(c=>`
          <tr>
            <td><div style="display:flex;align-items:center;gap:8px"><i data-lucide="${c.icon||'book'}" style="width:15px;height:15px;color:${c.color}"></i><span style="font-weight:600;color:var(--purple)">${c.title}</span></div></td>
            <td><span class="tag tag-gold">${c.lessons.length}</span></td>
            <td>
              <label class="toggle"><input type="checkbox" ${c.visible!==false?"checked":""} onchange="adminToggleCourse('${c.id}',this.checked)"><span class="toggle-slider"></span></label>
            </td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="btn-icon btn-sm" onclick="openCourseForm('${c.id}')"><i data-lucide="edit-2" style="width:12px;height:12px"></i></button>
                <button class="btn-icon btn-sm" style="color:#dc3545" onclick="adminDeleteCourse('${c.id}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
              </div>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- ── إدارة الاختبارات ── -->
    <div class="admin-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="border:none;padding:0;margin:0"><i data-lucide="file-text" style="width:16px;height:16px;color:var(--gold)"></i> إدارة الاختبارات</h3>
        <button class="btn btn-gold btn-sm" onclick="adminAddTest()"><i data-lucide="plus" style="width:12px;height:12px"></i> جديد</button>
      </div>
      ${APP.tests.map(t=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(212,180,142,.12)">
        <span style="font-size:13px;color:var(--text)">${t.title} (${t.questions.length} سؤال)</span>
        <div style="display:flex;gap:5px">
          <button class="btn btn-ghost btn-sm" onclick="openTestForm('${t.id}')"><i data-lucide="edit-2" style="width:12px;height:12px"></i> تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="adminDeleteTest('${t.id}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
        </div>
      </div>`).join("")||"<p style='color:var(--muted);font-size:13px'>لا توجد اختبارات</p>"}
    </div>

    <!-- حالة التزامن -->
    <div class="admin-section" style="border-color:rgba(66,153,225,.3);background:rgba(66,153,225,.03)">
      <h3><i data-lucide="cloud" style="width:16px;height:16px;color:#4299e1"></i> حالة قاعدة البيانات</h3>
      <div id="sync-status" style="font-size:13px;color:var(--muted);margin-bottom:14px">جارٍ الفحص...</div>
      <button class="btn btn-ghost btn-sm" onclick="forceSyncToFirestore()" style="margin-bottom:14px">
        <i data-lucide="upload-cloud" style="width:13px;height:13px"></i> مزامنة يدوية مع Firestore
      </button>
      <div style="background:rgba(220,53,69,.05);border:1px solid rgba(220,53,69,.2);border-radius:12px;padding:14px;margin-top:4px">
        <div style="font-size:12px;font-weight:700;color:#dc3545;margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <i data-lucide="alert-triangle" style="width:13px;height:13px"></i> قواعد Firestore المطلوبة
        </div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:8px">في Firebase Console → Firestore → Rules، ضع هذه القواعد:</p>
        <div style="background:rgba(0,0,0,.06);border-radius:8px;padding:12px;font-size:11px;font-family:monospace;direction:ltr;text-align:left;overflow-x:auto;line-height:1.7;color:var(--text)">
rules_version = '2';<br>
service cloud.firestore {<br>
&nbsp;&nbsp;match /databases/{database}/documents {<br>
&nbsp;&nbsp;&nbsp;&nbsp;// المقررات — قراءة للجميع، كتابة للمسجلين<br>
&nbsp;&nbsp;&nbsp;&nbsp;match /courses/{courseId} {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read: if true;<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow write, update, delete: if request.auth != null;<br>
&nbsp;&nbsp;&nbsp;&nbsp;}<br>
&nbsp;&nbsp;&nbsp;&nbsp;// الاختبارات — قراءة للمسجلين، كتابة للمسؤولين<br>
&nbsp;&nbsp;&nbsp;&nbsp;match /tests/{testId} {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read: if request.auth != null;<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow write, update, delete: if request.auth != null;<br>
&nbsp;&nbsp;&nbsp;&nbsp;}<br>
&nbsp;&nbsp;&nbsp;&nbsp;// بقية المجموعات<br>
&nbsp;&nbsp;&nbsp;&nbsp;match /{document=**} {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if request.auth != null;<br>
&nbsp;&nbsp;&nbsp;&nbsp;}<br>
&nbsp;&nbsp;}<br>
}
        </div>
      </div>
    </div>
  </div>`;
  lucide.createIcons();
  setTimeout(()=>{ renderAdminUsers("all"); if(isSuperAdmin()) loadSupervisors(); }, 80);
}

async function checkSyncStatus(){
  const el=document.getElementById("sync-status");
  if(!el) return;
  el.innerHTML=`<span style="color:var(--muted)">جارٍ الفحص...</span>`;
  try{
    // اختبار الكتابة
    await FB_DB.collection("taaseel_app").doc("_ping").set({ping:Date.now()});
    const localTs=getLocalTs();
    const snap=await FB_DB.collection("taaseel_app").doc("_meta").get();
    const fsTs=snap.exists?(snap.data().ts||0):0;
    const inSync=localTs<=fsTs+1000; // تسامح ثانية واحدة
    el.innerHTML=`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="width:8px;height:8px;border-radius:50%;background:${inSync?"#28a745":"#ffc107"}"></div>
        <span style="font-weight:600;color:${inSync?"#28a745":"#b8860b"}">${inSync?"متزامن مع Firestore ✓":"بيانات محلية غير مزامنة"}</span>
      </div>
      <div style="font-size:11px;color:var(--muted)">
        localStorage: ${localTs?new Date(localTs).toLocaleString("ar"):"لا يوجد"}<br>
        Firestore: ${fsTs?new Date(fsTs).toLocaleString("ar"):"لا يوجد"}
      </div>`;
  }catch(e){
    el.innerHTML=`
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:8px;height:8px;border-radius:50%;background:#dc3545"></div>
        <span style="font-weight:600;color:#dc3545">Firestore غير متاح — يعمل محلياً فقط</span>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">السبب: ${e.code||e.message||"خطأ غير معروف"}</div>
      <div style="font-size:11px;color:#dc3545;margin-top:4px">⚠️ يرجى مراجعة قواعد Firestore أدناه</div>`;
  }
}

async function forceSyncToFirestore(){
  toast("جارٍ رفع كل البيانات إلى Firebase...","info",2000);
  try{
    await Promise.all([
      ...APP.courses.map((course,i)=>fsSaveCourse({...course,_order:i})),
      ...APP.tests.map(t=>fsSaveTest(t)),
      ...APP.questions.map(q=>fsSaveQuestion(q)),
      fsSaveConfig(APP.siteConfig),
    ]);
    toast(`✅ تم رفع: ${APP.courses.length} مقرر، ${APP.tests.length} اختبار، ${APP.questions.length} سؤال`,"success",5000);
  }catch(e){
    toast("❌ فشل الرفع: "+(e.code||e.message),"error");
  }
  checkSyncStatus();
}

// ══════════════════════════════════════════════════════════
// SUPERVISOR MANAGEMENT (المشرف العام فقط)
// ══════════════════════════════════════════════════════════
async function loadSupervisors(){
  const el = document.getElementById("supervisors-list");
  if(!el) return;
  el.innerHTML=`<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px"><i data-lucide="loader" style="width:16px;height:16px;animation:spin 1s linear infinite"></i></div>`;
  lucide.createIcons({nodes:[el]});
  const admins = await fsGetAllAdmins();
  if(!admins.length){
    el.innerHTML=`<p style="color:var(--muted);font-size:13px;padding:8px 0">لا يوجد مشرفون مضافون بعد</p>`;
    return;
  }
  el.innerHTML = admins.map(a=>`
  <div style="background:var(--bg);border-radius:12px;padding:14px 16px;margin-bottom:10px;border:1px solid rgba(212,180,142,.18)">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;border-radius:50%;background:${a.role==="super"?"linear-gradient(135deg,var(--gold),var(--gold-d))":"linear-gradient(135deg,var(--purple),var(--purple-l))"};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:${a.role==="super"?"var(--purple)":"#fff"};flex-shrink:0">${(a.fullName||"م").charAt(0)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;color:var(--purple)">${a.fullName||"—"}</div>
        <div style="font-size:11px;color:var(--muted)">@${a.username||"—"} · ${a.email||"—"}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="tag ${a.role==="super"?"tag-gold":"tag-blue"}">${a.role==="super"?"مشرف عام":"مشرف"}</span>
        ${a.role!=="super"?`
        <button class="btn btn-ghost btn-sm" onclick="editSupervisorPermissions('${a.id}')"><i data-lucide="sliders" style="width:12px;height:12px"></i> صلاحيات</button>
        <button class="btn btn-danger btn-sm" onclick="removeSupervisor('${a.id}','${(a.fullName||"").replace(/'/g,"")}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>`:""}
      </div>
    </div>
    ${a.role!=="super"&&a.permissions?`
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(212,180,142,.15);display:flex;flex-wrap:wrap;gap:5px">
      ${Object.entries(PERM_LABELS).map(([k,label])=>`
      <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:18px;font-size:11px;font-weight:600;background:${a.permissions[k]?"rgba(40,167,69,.1)":"rgba(0,0,0,.04)"};color:${a.permissions[k]?"#28a745":"#aaa"};border:1px solid ${a.permissions[k]?"rgba(40,167,69,.2)":"rgba(0,0,0,.08)"}">
        <i data-lucide="${a.permissions[k]?"check":"minus"}" style="width:9px;height:9px"></i>${label}
      </span>`).join("")}
    </div>`:""}
  </div>`).join("");
  lucide.createIcons({nodes:[el]});
}

function openAddSupervisorModal(){
  openModal(`
    <div style="background:rgba(59,27,64,.05);border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:var(--muted);line-height:1.8">
      سيُنشأ حساب جديد في Firebase Auth تلقائياً للمشرف بالبريد وكلمة المرور المدخلين.
    </div>
    <div class="inp-group"><label>الاسم الثلاثي *</label><input type="text" id="sv-fullname" placeholder="اسم المشرف الثلاثي"/></div>
    <div class="inp-group"><label>اسم المستخدم *</label><input type="text" id="sv-username" placeholder="مثال: mod_ahmad"/></div>
    <div class="inp-group"><label>البريد الإلكتروني *</label><input type="email" id="sv-email" placeholder="supervisor@email.com"/></div>
    <div class="inp-group"><label>كلمة المرور *</label><input type="password" id="sv-pass" placeholder="6 أحرف على الأقل"/></div>
    <div style="margin-bottom:14px">
      <div style="font-size:13px;font-weight:700;color:var(--purple);margin-bottom:10px;display:flex;align-items:center;gap:6px">
        <i data-lucide="sliders" style="width:14px;height:14px;color:var(--gold)"></i> الصلاحيات
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
        ${Object.entries(PERM_LABELS).map(([k,label])=>`
        <label style="display:flex;align-items:center;gap:8px;padding:9px 10px;background:var(--bg);border-radius:9px;cursor:pointer;border:1px solid rgba(212,180,142,.2);transition:all .2s">
          <input type="checkbox" id="perm-${k}" style="accent-color:var(--purple);width:15px;height:15px" ${DEFAULT_PERMISSIONS[k]?"checked":""}>
          <span style="font-size:12px;color:var(--text)">${label}</span>
        </label>`).join("")}
      </div>
    </div>
    <button class="btn btn-gold" id="btn-add-sv" style="width:100%;justify-content:center" onclick="addSupervisor()">
      <i data-lucide="user-plus" style="width:14px;height:14px"></i> إضافة المشرف
    </button>
  `,"إضافة مشرف جديد");
}

async function addSupervisor(){
  const fullName = document.getElementById("sv-fullname")?.value.trim();
  const username = document.getElementById("sv-username")?.value.trim();
  const email    = document.getElementById("sv-email")?.value.trim();
  const pass     = document.getElementById("sv-pass")?.value;
  if(!fullName||!username||!email||!pass){ toast("يرجى ملء جميع الحقول","error"); return; }
  if(pass.length<6){ toast("كلمة المرور 6 أحرف على الأقل","error"); return; }
  const perms = {};
  Object.keys(PERM_LABELS).forEach(k=>{ perms[k]=document.getElementById(`perm-${k}`)?.checked||false; });
  setBtnLoading("btn-add-sv",true,"جاري الإضافة...");
  try{
    // 1. إنشاء حساب Firebase Auth للمشرف الجديد
    const cred = await FB_AUTH.createUserWithEmailAndPassword(email, pass);
    const newUid = cred.user.uid;

    // 2. حفظ الملف في مجموعة admins
    await fsSetAdmin(newUid, {
      fullName, username, email,
      role: "supervisor",
      permissions: perms,
      createdAt: new Date().toISOString()
    });

    // 3. تسجيل الخروج من الحساب الجديد وإعادة دخول المشرف العام
    await FB_AUTH.signOut();
    if(_adminSessionEmail && _adminSessionPass){
      await FB_AUTH.signInWithEmailAndPassword(_adminSessionEmail, _adminSessionPass);
    }

    closeModal();
    toast(`✅ تم إضافة المشرف: ${fullName}`,"success");
    loadSupervisors();
  }catch(e){
    // في حالة الفشل — أعد تسجيل دخول المشرف العام
    if(_adminSessionEmail && _adminSessionPass){
      try{ await FB_AUTH.signInWithEmailAndPassword(_adminSessionEmail, _adminSessionPass); }catch(_){}
    }
    if(e.code==="auth/email-already-in-use"){
      toast("هذا البريد مسجل مسبقاً في Firebase Auth","error",5000);
    } else {
      toast(_fbErrMsg(e.code),"error");
    }
  } finally {
    setBtnLoading("btn-add-sv",false,"إضافة المشرف");
  }
}

function editSupervisorPermissions(uid2){
  fsGetAdmin(uid2).then(admin=>{
    if(!admin){ toast("لم يتم العثور على المشرف","error"); return; }
    openModal(`
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg);border-radius:10px;margin-bottom:14px">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--purple-l));display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700">${(admin.fullName||"م").charAt(0)}</div>
        <div><div style="font-size:14px;font-weight:700;color:var(--purple)">${admin.fullName}</div><div style="font-size:12px;color:var(--muted)">@${admin.username}</div></div>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--purple);margin-bottom:10px;display:flex;align-items:center;gap:6px">
        <i data-lucide="sliders" style="width:14px;height:14px;color:var(--gold)"></i> تعديل الصلاحيات
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:16px">
        ${Object.entries(PERM_LABELS).map(([k,label])=>`
        <label style="display:flex;align-items:center;gap:8px;padding:9px 10px;background:var(--bg);border-radius:9px;cursor:pointer;border:1px solid rgba(212,180,142,.2)">
          <input type="checkbox" id="ep-${k}" style="accent-color:var(--purple);width:15px;height:15px" ${(admin.permissions||{})[k]?"checked":""}>
          <span style="font-size:12px;color:var(--text)">${label}</span>
        </label>`).join("")}
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="saveSupervisorPermissions('${uid2}')">
        <i data-lucide="save" style="width:14px;height:14px"></i> حفظ الصلاحيات
      </button>
    `,"صلاحيات المشرف");
  });
}

async function saveSupervisorPermissions(uid2){
  const perms={};
  Object.keys(PERM_LABELS).forEach(k=>{ perms[k]=document.getElementById(`ep-${k}`)?.checked||false; });
  await fsSetAdmin(uid2,{permissions:perms});
  closeModal(); toast("✅ تم تحديث الصلاحيات","success"); loadSupervisors();
}

async function removeSupervisor(uid2,name){
  confirm2(`هل تريد إزالة المشرف "${name}" نهائياً؟`,async()=>{
    await fsDeleteAdmin(uid2);
    toast(`تم إزالة ${name}`,"info");
    loadSupervisors();
  });
}

function saveConfig(){
  APP.siteConfig.introVideo=document.getElementById("cfg-video")?.value.trim()||"";
  APP.siteConfig.contactEmail=document.getElementById("cfg-email")?.value.trim()||"";
  APP.siteConfig.contactTelegram=document.getElementById("cfg-tg")?.value.trim()||"";
  APP.siteConfig.contactPhone=document.getElementById("cfg-phone")?.value.trim()||"";
  APP.siteConfig.sheikhChannel=document.getElementById("cfg-sheikh-channel")?.value.trim()||"";
  APP.siteConfig.privateChannel=document.getElementById("cfg-private-channel")?.value.trim()||"";
  fbWriteConfig().then(()=>toast("تم حفظ الإعدادات في Firebase ✅","success"));
}
function saveAbout(){
  APP.siteConfig.aboutText=document.getElementById("cfg-about")?.value||"";
  fbWriteConfig().then(()=>toast("تم حفظ نص من نحن في Firebase ✅","success"));
}
function addTeamMember(){
  openModal(`
    <div class="inp-group"><label>الاسم</label><input type="text" id="tm-name" placeholder="اسم العضو"/></div>
    <div class="inp-group"><label>المسمى الوظيفي</label><input type="text" id="tm-role" placeholder="مدرس / مشرف..."/></div>
    <button class="btn btn-gold" onclick="saveTeamMember()"><i data-lucide="plus" style="width:14px;height:14px"></i> إضافة</button>
  `,"إضافة عضو");
}
function saveTeamMember(){
  const name=document.getElementById("tm-name")?.value.trim();const role=document.getElementById("tm-role")?.value.trim();
  if(!name) return;
  APP.siteConfig.team.push({name,role:role||""});fbWriteConfig();closeModal();renderAdmin();toast("تم إضافة العضو","success");
}
function deleteTeamMember(i){APP.siteConfig.team.splice(i,1);fbWriteConfig();renderAdmin();}

function editStudyPlan(){
  const plan=APP.siteConfig.studyPlan||[];
  openModal(`
    <div style="max-height:60vh;overflow-y:auto">
      ${plan.map((l,i)=>`
      <div style="padding:12px;background:var(--bg);border-radius:12px;margin-bottom:10px">
        <div class="inp-group" style="margin-bottom:8px"><label>المستوى</label><input type="text" id="pl-lvl-${i}" value="${l.level}"/></div>
        <div class="inp-group" style="margin-bottom:8px"><label>المقررات (مفصولة بفاصلة)</label><input type="text" id="pl-courses-${i}" value="${(l.courses||[]).join("، ")}"/></div>
        <div class="inp-group" style="margin-bottom:0"><label>اللون</label><input type="color" id="pl-color-${i}" value="${l.color||"#3B1B40"}"/></div>
      </div>`).join("")}
    </div>
    <button class="btn btn-gold" onclick="saveStudyPlan(${plan.length})" style="width:100%;justify-content:center;margin-top:12px"><i data-lucide="save" style="width:14px;height:14px"></i> حفظ الخطة</button>
  `,"تعديل الخطة الدراسية");
}
function saveStudyPlan(count){
  const plan=[];
  for(let i=0;i<count;i++){
    const lvl=document.getElementById(`pl-lvl-${i}`)?.value.trim();
    const cs=document.getElementById(`pl-courses-${i}`)?.value.split(/،|,/).map(s=>s.trim()).filter(Boolean);
    const color=document.getElementById(`pl-color-${i}`)?.value;
    if(lvl) plan.push({level:lvl,courses:cs,color:color||"#3B1B40"});
  }
  APP.siteConfig.studyPlan=plan;fbWriteConfig().then(()=>toast("تم حفظ الخطة في Firebase ✅","success"));closeModal();renderAdmin();renderPublicPlan();
}


// ══════════════════════════════════════════════════════════
// FULL-PAGE FORMS: Course / Lesson / Test
// ══════════════════════════════════════════════════════════

// ── Course Form Page ──
function openCourseForm(id){
  const c = id ? findById(APP.courses, id) : null;
  const pageId = "app-page-course-form";
  // Activate the page manually
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  APP.activePage = "course-form";

  document.getElementById(pageId).innerHTML=`
  <div class="pg" style="padding:28px;max-width:700px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
      <button class="btn btn-ghost btn-sm" onclick="${c?"navTo('course-detail')":"navTo('courses')"}">
        <i data-lucide="arrow-right" style="width:14px;height:14px"></i> رجوع
      </button>
      <h2 style="color:var(--purple);font-size:20px;font-weight:800">${c?"تعديل المقرر":"مقرر جديد"}</h2>
    </div>
    <div class="card" style="padding:28px">
      <div class="inp-group">
        <label>اسم المقرر *</label>
        <input type="text" id="cf-title" value="${c?c.title:""}" placeholder="اسم المقرر الدراسي"/>
      </div>
      <div class="inp-group">
        <label>الوصف المختصر</label>
        <input type="text" id="cf-desc" value="${c?c.description||"":""}" placeholder="وصف مختصر يظهر على البطاقة"/>
      </div>
      <div class="inp-group">
        <label>معلومات تفصيلية</label>
        <textarea id="cf-info" rows="3" placeholder="تفاصيل المقرر، منهجه، أهدافه...">${c?c.info||"":""}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="inp-group">
          <label>أيقونة Lucide</label>
          <input type="text" id="cf-icon" value="${c?c.icon||"book":"book"}" placeholder="book-open"/>
          <span style="font-size:11px;color:var(--muted);margin-top:4px;display:block">مثال: book, book-open, graduation-cap, scroll, layers</span>
        </div>
        <div class="inp-group">
          <label>لون المقرر</label>
          <input type="color" id="cf-color" value="${c?c.color||"#3B1B40":"#3B1B40"}" style="height:48px;width:100%;border-radius:10px;border:1px solid rgba(212,180,142,.3);cursor:pointer"/>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:14px;background:rgba(212,180,142,.06);border-radius:12px;border:1px solid rgba(212,180,142,.2);margin-top:4px">
        <label class="toggle">
          <input type="checkbox" id="cf-visible" ${c?c.visible!==false?"checked":"":"checked"}>
          <span class="toggle-slider"></span>
        </label>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--purple)">إظهار المقرر للطلاب</div>
          <div style="font-size:11px;color:var(--muted)">عند التعطيل لن يظهر المقرر للطلاب</div>
        </div>
      </div>
      <button class="btn btn-gold" onclick="saveCourseForm(${c?`'${c.id}'`:'null'})" style="margin-top:20px;width:100%;justify-content:center;padding:14px;font-size:15px">
        <i data-lucide="${c?"save":"plus"}" style="width:16px;height:16px"></i> ${c?"حفظ التعديلات":"إضافة المقرر"}
      </button>
    </div>
  </div>`;
  lucide.createIcons();
}

async function saveCourseForm(rawId){
  const id = (rawId===null||rawId==="null"||rawId===undefined)?null:rawId;
  const title = document.getElementById("cf-title")?.value.trim();
  if(!title){toast("اسم المقرر مطلوب","error");return;}
  const data = {
    title,
    description: document.getElementById("cf-desc")?.value.trim()||"",
    info: document.getElementById("cf-info")?.value.trim()||"",
    icon: document.getElementById("cf-icon")?.value.trim()||"book",
    color: document.getElementById("cf-color")?.value||"#3B1B40",
    visible: document.getElementById("cf-visible")?.checked!==false,
  };
  let savedCourse;
  if(id){
    const c=findById(APP.courses,id);
    if(!c){toast("لم يُعثر على المقرر","error");return;}
    Object.assign(c,data);
    savedCourse=c;
    toast("جارٍ الحفظ...","info",1000);
  } else {
    if(APP.courses.length>=100){toast("الحد الأقصى 100 مقرر","error");return;}
    savedCourse={id:uid(),...data,lessons:[],_order:APP.courses.length};
    APP.courses.push(savedCourse);
    addNotif(`مقرر جديد: ${title}`,"info");
  }
  saveState();
  try{
    await fbWriteCourse(savedCourse);
    toast(id?"✅ تم تحديث المقرر":"✅ تم إضافة المقرر","success");
  }catch(e){ toast("⚠️ خطأ في Firebase","error"); }
  if(id){ APP.currentCourse=savedCourse; navTo("course-detail"); }
  else navTo("courses");
}

// ── Lesson Form Page ──
function openLessonForm(cid, lid){
  const c = findById(APP.courses, cid);
  if(!c) return;
  const l = lid && lid!=="null" ? findById(c.lessons, lid) : null;
  const pageId = "app-page-lesson-form";
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  APP.activePage = "lesson-form";
  APP.currentCourse = c;

  document.getElementById(pageId).innerHTML=`
  <div class="pg" style="padding:28px;max-width:720px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
      <button class="btn btn-ghost btn-sm" onclick="navTo('course-detail')">
        <i data-lucide="arrow-right" style="width:14px;height:14px"></i> رجوع إلى ${c.title}
      </button>
      <h2 style="color:var(--purple);font-size:20px;font-weight:800">${l?"تعديل الدرس":"درس جديد"}</h2>
    </div>

    <!-- Breadcrumb -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:12px;color:var(--muted)">
      <span onclick="navTo('courses')" style="cursor:pointer;color:var(--purple)">المقررات</span>
      <i data-lucide="chevron-left" style="width:12px;height:12px"></i>
      <span onclick="navTo('course-detail')" style="cursor:pointer;color:var(--purple)">${c.title}</span>
      <i data-lucide="chevron-left" style="width:12px;height:12px"></i>
      <span>${l?l.title:"درس جديد"}</span>
    </div>

    <div class="card" style="padding:28px">
      <div class="inp-group">
        <label>عنوان الدرس *</label>
        <input type="text" id="lf-title" value="${l?l.title:""}" placeholder="عنوان الدرس"/>
      </div>
      <div class="inp-group">
        <label>رابط الفيديو (YouTube)</label>
        <input type="text" id="lf-yt" value="${l?l.youtube||"":""}" placeholder="https://www.youtube.com/watch?v=... أو youtu.be/..."/>
        <span style="font-size:11px;color:var(--muted);margin-top:4px;display:block">أي صيغة يوتيوب — سيتحول تلقائياً لرابط embed</span>
      </div>
      <div class="inp-group">
        <label>رابط الملف الصوتي (اختياري)</label>
        <input type="text" id="lf-audio" value="${l?l.audio||"":""}" placeholder="https://soundcloud.com/... أو رابط mp3"/>
      </div>
      <div class="inp-group">
        <label>وصف الدرس / ملاحظات</label>
        <textarea id="lf-notes" rows="3" placeholder="ملاحظات إضافية عن الدرس...">${l?l.notes||"":""}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:4px">
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(212,180,142,.06);border-radius:12px;border:1px solid rgba(212,180,142,.2)">
          <label class="toggle">
            <input type="checkbox" id="lf-visible" ${l?l.visible!==false?"checked":"":"checked"}>
            <span class="toggle-slider"></span>
          </label>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--purple)">إظهار الدرس</div>
            <div style="font-size:11px;color:var(--muted)">يظهر للطلاب</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(220,53,69,.05);border-radius:12px;border:1px solid rgba(220,53,69,.15)">
          <label class="toggle">
            <input type="checkbox" id="lf-locked" ${l?l.locked?"checked":"":""}>
            <span class="toggle-slider"></span>
          </label>
          <div>
            <div style="font-size:13px;font-weight:700;color:#dc3545">قفل الدرس</div>
            <div style="font-size:11px;color:var(--muted)">يُرى لكن لا يُفتح</div>
          </div>
        </div>
      </div>
      <button class="btn btn-gold" onclick="saveLessonForm('${cid}','${lid||'null'}')" style="margin-top:20px;width:100%;justify-content:center;padding:14px;font-size:15px">
        <i data-lucide="${l?"save":"plus"}" style="width:16px;height:16px"></i> ${l?"حفظ التعديلات":"إضافة الدرس"}
      </button>
    </div>
  </div>`;
  lucide.createIcons();
}

async function saveLessonForm(cid, lid){
  const title = document.getElementById("lf-title")?.value.trim();
  if(!title){toast("عنوان الدرس مطلوب","error");return;}
  const rawYt = document.getElementById("lf-yt")?.value.trim()||"";
  const ytVal = toYoutubeEmbed(rawYt);
  const audioVal = document.getElementById("lf-audio")?.value.trim()||"";
  const notesVal = document.getElementById("lf-notes")?.value||"";
  const visibleVal = document.getElementById("lf-visible")?.checked!==false;
  const lockedVal = document.getElementById("lf-locked")?.checked||false;
  const c = findById(APP.courses, cid);
  if(!c){toast("لم يُعثر على المقرر","error");return;}

  if(lid && lid!=="null"){
    const l = findById(c.lessons, lid);
    if(l){ Object.assign(l,{title,youtube:ytVal,audio:audioVal,notes:notesVal,visible:visibleVal,locked:lockedVal}); }
    toast("جارٍ الحفظ...","info",800);
  } else {
    if(c.lessons.length>=100){toast("الحد الأقصى 100 درس","error");return;}
    c.lessons.push({id:uid(),title,youtube:ytVal,audio:audioVal,notes:notesVal,visible:visibleVal,locked:lockedVal,attachments:[],exercises:[]});
    addNotif(`درس جديد في ${c.title}: ${title}`,"info");
  }
  saveState();
  try{
    await fbWriteCourse(c);
    toast(lid&&lid!=="null"?"✅ تم تحديث الدرس":"✅ تم إضافة الدرس","success");
  }catch(e){ toast("⚠️ خطأ في Firebase","error"); }
  navTo("course-detail");
}

// ── Test Form Page ──
function openTestForm(id){
  const t = id && id!=="null" ? findById(APP.tests, id) : null;
  const pageId = "app-page-test-detail";
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  APP.activePage = "test-detail";

  // Initialize questions array from existing test or empty
  window._editTestQs = t ? JSON.parse(JSON.stringify(t.questions||[])) : [];

  document.getElementById(pageId).innerHTML=`
  <div class="pg" style="padding:28px;max-width:800px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
      <button class="btn btn-ghost btn-sm" onclick="navTo('tests')">
        <i data-lucide="arrow-right" style="width:14px;height:14px"></i> رجوع
      </button>
      <h2 style="color:var(--purple);font-size:20px;font-weight:800">${t?"تعديل الاختبار":"اختبار جديد"}</h2>
    </div>

    <div class="card" style="padding:24px;margin-bottom:20px">
      <div class="inp-group">
        <label>عنوان الاختبار *</label>
        <input type="text" id="tf-title" value="${t?t.title:""}" placeholder="عنوان الاختبار"/>
      </div>
    </div>

    <!-- Questions List -->
    <div id="test-questions-container">
      <!-- rendered by renderTestQuestions() -->
    </div>

    <button class="btn btn-gold" onclick="addTestQuestion()" style="width:100%;justify-content:center;margin-bottom:16px">
      <i data-lucide="plus" style="width:15px;height:15px"></i> إضافة سؤال جديد
    </button>

    <button class="btn btn-primary" onclick="saveTestForm('${id||'null'}')" style="width:100%;justify-content:center;padding:14px;font-size:15px">
      <i data-lucide="${t?"save":"check"}" style="width:16px;height:16px"></i> ${t?"حفظ التعديلات":"حفظ الاختبار"}
    </button>
  </div>`;

  renderTestQuestions();
  lucide.createIcons();
}

function renderTestQuestions(){
  const container = document.getElementById("test-questions-container");
  if(!container) return;
  const qs = window._editTestQs||[];
  if(qs.length===0){
    container.innerHTML=`<div style="text-align:center;padding:32px;color:var(--muted);background:var(--bg);border-radius:14px;margin-bottom:16px">
      <i data-lucide="help-circle" style="width:32px;height:32px;opacity:.25;margin-bottom:8px"></i>
      <p style="font-size:13px">لا توجد أسئلة بعد — اضغط "إضافة سؤال" أدناه</p>
    </div>`;
    lucide.createIcons({nodes:[container]});
    return;
  }
  container.innerHTML = qs.map((q,qi)=>`
  <div class="card" style="padding:20px;margin-bottom:14px;border-right:4px solid var(--gold)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
      <span style="font-size:12px;font-weight:700;color:var(--gold)">سؤال ${qi+1}</span>
      <div style="display:flex;gap:6px">
        <button class="btn-icon" onclick="moveTestQuestion(${qi},-1)" ${qi===0?"disabled":""} style="width:28px;height:28px;background:var(--bg);border-radius:8px;border:1px solid rgba(212,180,142,.2)" title="تحريك للأعلى">
          <i data-lucide="arrow-up" style="width:12px;height:12px"></i>
        </button>
        <button class="btn-icon" onclick="moveTestQuestion(${qi},1)" ${qi===qs.length-1?"disabled":""} style="width:28px;height:28px;background:var(--bg);border-radius:8px;border:1px solid rgba(212,180,142,.2)" title="تحريك للأسفل">
          <i data-lucide="arrow-down" style="width:12px;height:12px"></i>
        </button>
        <button class="btn-icon" onclick="removeTestQuestion(${qi})" style="width:28px;height:28px;background:#dc3545;border-radius:8px;color:#fff" title="حذف السؤال">
          <i data-lucide="trash-2" style="width:12px;height:12px"></i>
        </button>
      </div>
    </div>
    <div class="inp-group" style="margin-bottom:10px">
      <input type="text" value="${q.q||""}" placeholder="نص السؤال *" oninput="window._editTestQs[${qi}].q=this.value" style="font-weight:600"/>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:rgba(212,180,142,.06);border-radius:10px">
      <label class="toggle" style="flex-shrink:0">
        <input type="checkbox" ${q.multi?"checked":""} onchange="toggleTestQMulti(${qi},this.checked)">
        <span class="toggle-slider"></span>
      </label>
      <span style="font-size:12px;color:var(--text)">إجابات متعددة (اختر أكثر من خيار)</span>
    </div>
    <div id="tq-opts-${qi}">
      ${(q.options||[]).map((o,oi)=>`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        ${q.multi?`
        <input type="checkbox" ${(q.answers||[]).includes(oi)?"checked":""} onchange="toggleTestOptAnswer(${qi},${oi},this.checked)" style="accent-color:var(--purple);width:16px;height:16px;flex-shrink:0" title="صحيحة؟">
        `:`
        <input type="radio" name="tqans${qi}" ${q.answer===oi?"checked":""} onchange="window._editTestQs[${qi}].answer=${oi}" style="accent-color:var(--purple);width:16px;height:16px;flex-shrink:0" title="الإجابة الصحيحة">
        `}
        <input type="text" value="${o}" placeholder="نص الخيار" oninput="window._editTestQs[${qi}].options[${oi}]=this.value" style="flex:1"/>
        <button class="btn-icon" onclick="removeTestOpt(${qi},${oi})" style="width:26px;height:26px;color:#dc3545;flex-shrink:0" ${q.options.length<=2?"disabled":""}>
          <i data-lucide="x" style="width:11px;height:11px"></i>
        </button>
      </div>`).join("")}
    </div>
    <button class="btn btn-ghost btn-sm" onclick="addTestOpt(${qi})" style="margin-top:8px" ${(q.options||[]).length>=6?"disabled title='الحد الأقصى 6 خيارات'":""}>
      <i data-lucide="plus" style="width:11px;height:11px"></i> إضافة خيار
    </button>
  </div>`).join("");
  lucide.createIcons({nodes:[container]});
}

function addTestQuestion(){
  if(!window._editTestQs) window._editTestQs=[];
  window._editTestQs.push({q:"",options:["",""],answer:0,answers:[],multi:false});
  renderTestQuestions();
  // scroll to bottom
  setTimeout(()=>{ const c=document.getElementById("test-questions-container"); if(c){ const last=c.lastElementChild; if(last) last.scrollIntoView({behavior:"smooth",block:"center"}); }},100);
}
function removeTestQuestion(qi){
  window._editTestQs.splice(qi,1);
  renderTestQuestions();
}
function moveTestQuestion(qi, dir){
  const qs=window._editTestQs;
  const ni=qi+dir;
  if(ni<0||ni>=qs.length) return;
  [qs[qi],qs[ni]]=[qs[ni],qs[qi]];
  renderTestQuestions();
}
function addTestOpt(qi){
  const q=window._editTestQs[qi];
  if(!q||q.options.length>=6) return;
  q.options.push("");
  renderTestQuestions();
}
function removeTestOpt(qi,oi){
  const q=window._editTestQs[qi];
  if(!q||q.options.length<=2) return;
  q.options.splice(oi,1);
  // fix answer index
  if(!q.multi){ if(q.answer>=oi) q.answer=Math.max(0,q.answer-1); }
  else { q.answers=(q.answers||[]).filter(a=>a!==oi).map(a=>a>oi?a-1:a); }
  renderTestQuestions();
}
function toggleTestQMulti(qi,val){
  const q=window._editTestQs[qi];
  if(!q) return;
  q.multi=val;
  if(val){ q.answers=q.answer!=null?[q.answer]:[]; }
  else { q.answer=(q.answers&&q.answers.length)?q.answers[0]:0; q.answers=[]; }
  renderTestQuestions();
}
function toggleTestOptAnswer(qi,oi,checked){
  const q=window._editTestQs[qi];
  if(!q) return;
  if(!q.answers) q.answers=[];
  if(checked){ if(!q.answers.includes(oi)) q.answers.push(oi); }
  else { q.answers=q.answers.filter(a=>a!==oi); }
}

async function saveTestForm(rawId){
  const id = (rawId===null||rawId==="null"||rawId===undefined)?null:String(rawId);
  const title = document.getElementById("tf-title")?.value.trim();
  if(!title){toast("عنوان الاختبار مطلوب","error");return;}
  const qs = window._editTestQs||[];
  if(qs.length===0){toast("أضف سؤالاً واحداً على الأقل","error");return;}
  // Validate questions
  for(let i=0;i<qs.length;i++){
    if(!qs[i].q?.trim()){toast(`السؤال ${i+1} لا يحتوي نصاً`,"error");return;}
    if((qs[i].options||[]).some(o=>!o?.trim())){toast(`أحد خيارات السؤال ${i+1} فارغ`,"error");return;}
  }
  if(id){
    const t=findById(APP.tests,id);
    if(!t){toast("لم يُعثر على الاختبار","error");return;}
    t.title=title; t.questions=qs;
    toast("جارٍ الحفظ...","info",800);
    try{ await fsSaveTest(t); toast("✅ تم تحديث الاختبار","success"); }
    catch(e){ toast("⚠️ خطأ في Firebase","error"); }
  } else {
    if(APP.tests.length>=100){toast("الحد الأقصى 100 اختبار","error");return;}
    const newTest={id:uid(),title,questions:qs,visible:true,locked:false};
    APP.tests.push(newTest);
    addNotif(`اختبار جديد: ${title}`,"info");
    try{ await fsSaveTest(newTest); toast("✅ تم إضافة الاختبار","success"); }
    catch(e){ toast("⚠️ خطأ في Firebase","error"); }
  }
  saveState();
  navTo("tests");
}

// Course CRUD
function adminAddCourse(){
  openModal(`
    <div class="inp-group"><label>اسم المقرر *</label><input type="text" id="nc-title" placeholder="اسم المقرر"/></div>
    <div class="inp-group"><label>الوصف</label><input type="text" id="nc-desc" placeholder="وصف مختصر"/></div>
    <div class="inp-group"><label>معلومات تفصيلية</label><input type="text" id="nc-info" placeholder="تفاصيل المقرر"/></div>
    <div class="inp-grid">
      <div class="inp-group"><label>أيقونة Lucide</label><input type="text" id="nc-icon" placeholder="book-open"/></div>
      <div class="inp-group"><label>اللون</label><input type="color" id="nc-color" value="#3B1B40"/></div>
    </div>
    <button class="btn btn-gold" onclick="saveCourse(null)"><i data-lucide="plus" style="width:14px;height:14px"></i> إضافة المقرر</button>
  `,"مقرر جديد");
}
function adminEditCourse(id){
  const c=findById(APP.courses,id);if(!c) return;
  openModal(`
    <div class="inp-group"><label>اسم المقرر</label><input type="text" id="nc-title" value="${c.title}"/></div>
    <div class="inp-group"><label>الوصف</label><input type="text" id="nc-desc" value="${c.description||""}"/></div>
    <div class="inp-group"><label>المعلومات</label><input type="text" id="nc-info" value="${c.info||""}"/></div>
    <div class="inp-grid">
      <div class="inp-group"><label>أيقونة</label><input type="text" id="nc-icon" value="${c.icon||"book"}"/></div>
      <div class="inp-group"><label>اللون</label><input type="color" id="nc-color" value="${c.color||"#3B1B40"}"/></div>
    </div>
    <button class="btn btn-primary" onclick="saveCourse(${id})"><i data-lucide="save" style="width:14px;height:14px"></i> حفظ التعديلات</button>
  `,"تعديل المقرر");
}
function saveCourse(rawId){
  const id = (rawId===null||rawId==="null"||rawId===undefined) ? null : rawId;
  const title=document.getElementById("nc-title")?.value.trim();
  if(!title){toast("اسم المقرر مطلوب","error");return;}
  const data={
    title,
    description: document.getElementById("nc-desc")?.value.trim()||"",
    info:        document.getElementById("nc-info")?.value.trim()||"",
    icon:        document.getElementById("nc-icon")?.value.trim()||"book",
    color:       document.getElementById("nc-color")?.value||"#3B1B40"
  };
  if(id){
    const c=findById(APP.courses,id);
    if(c){ Object.assign(c,data); toast("تم تحديث المقرر ✅","success"); }
    else { toast("لم يتم العثور على المقرر","error"); return; }
  } else {
    if(APP.courses.length>=100){toast("الحد الأقصى للمقررات هو 100 مقرر","error");return;}
    const newCourse={id:uid(),...data,visible:true,lessons:[]};
    APP.courses.push(newCourse);
    addNotif(`تم إضافة مقرر جديد: ${title}`,"info");
    toast(`تم إضافة مقرر: ${title} ✅`,"success");
  }
  // ── Firebase ──
  const targetCourse = id ? findById(APP.courses, id) : APP.courses[APP.courses.length-1];
  if(targetCourse){
    fbWriteCourse(targetCourse).then(()=>{
      toast(id?"تم التحديث في Firebase ✅":"تم الحفظ في Firebase ✅","success",1500);
    }).catch(()=>{});
  }
  closeModal();
  _refreshCoursesAdminTable();
  const coursesPage=document.getElementById("app-page-courses");
  if(coursesPage?.classList.contains("active")) renderCourses();
}

function _refreshCoursesAdminTable(){
  const tbody=document.getElementById("courses-admin-tbl");
  if(!tbody) return;
  tbody.innerHTML=APP.courses.map(c=>`
  <tr>
    <td><div style="display:flex;align-items:center;gap:8px"><i data-lucide="${c.icon||'book'}" style="width:15px;height:15px;color:${c.color}"></i><span style="font-weight:600;color:var(--purple)">${c.title}</span></div></td>
    <td><span class="tag tag-gold">${(c.lessons||[]).length}</span></td>
    <td>
      <label class="toggle"><input type="checkbox" ${c.visible!==false?"checked":""} onchange="adminToggleCourse('${c.id}',this.checked)"><span class="toggle-slider"></span></label>
    </td>
    <td>
      <div style="display:flex;gap:5px">
        <button class="btn-icon btn-sm" onclick="openCourseForm('${c.id}')"><i data-lucide="edit-2" style="width:12px;height:12px"></i></button>
        <button class="btn-icon btn-sm" style="color:#dc3545" onclick="adminDeleteCourse('${c.id}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
      </div>
    </td>
  </tr>`).join("");
  lucide.createIcons({nodes:[tbody]});
}
function adminDeleteCourse(id){
  confirm2("هل تريد حذف هذا المقرر نهائياً؟\n⚠️ سيتم حذف جميع الدروس المرتبطة به.",()=>{
    fbRemoveCourse(id).then(()=>{
      toast("✅ تم حذف المقرر","info");
      navTo("courses");
    });
  });
}
function adminToggleCourse(id, val){
  const c=findById(APP.courses,id);
  if(c){
    c.visible=val;
    fbWriteCourse(c);
    if(val) addNotif(`تم إظهار مقرر: ${c.title}`,"info");
    toast(val?"✅ تم إظهار المقرر":"🙈 تم إخفاء المقرر","info");
  }
}
function adminToggleLesson(cid,lid){
  const c=findById(APP.courses,cid);const l=c?findById(c.lessons,lid):null;
  if(l&&c){ l.visible=!l.visible; fbWriteCourse(c); if(l.visible) addNotif(`تم إظهار درس: ${l.title}`,"info"); }
  toast(l?.visible?"✅ تم إظهار الدرس":"🙈 تم إخفاء الدرس","info");
  renderCourseDetail();
}
function adminToggleLessonLock(cid,lid){
  const c=findById(APP.courses,cid);const l=c?findById(c.lessons,lid):null;
  if(l&&c){ l.locked=!l.locked; fbWriteCourse(c); }
  toast(l?.locked?"🔒 تم قفل الدرس":"🔓 تم فتح الدرس","info");
  renderCourseDetail();
}
function showLockedMsg(){
  toast("🔒 هذا الدرس مقفل حالياً — تواصل مع المشرف لفتحه","error",4000);
}

// ── YouTube URL normalizer ──
function toYoutubeEmbed(url){
  if(!url) return "";
  url = url.trim();
  if(url.includes("/embed/")) return url;
  const shortM = url.match(/youtu\.be\/([^?&\s]+)/);
  if(shortM) return `https://www.youtube.com/embed/${shortM[1]}`;
  const watchM = url.match(/[?&]v=([^&\s]+)/);
  if(watchM) return `https://www.youtube.com/embed/${watchM[1]}`;
  const shortsM = url.match(/\/shorts\/([^?&\s]+)/);
  if(shortsM) return `https://www.youtube.com/embed/${shortsM[1]}`;
  return url;
}
// إصلاح روابط YouTube في البيانات المخزّنة
function _fixYtUrls(courses){
  if(!Array.isArray(courses)) return courses||[];
  return courses.map(c=>({...c, lessons:(c.lessons||[]).map(l=>({...l, youtube:toYoutubeEmbed(l.youtube||"")})) }));
}

// Lesson CRUD
function adminAddLesson(cid){
  openModal(`
    <div class="inp-group"><label>عنوان الدرس *</label><input type="text" id="nl-title" placeholder="عنوان الدرس"/></div>
    <div class="inp-group">
      <label>رابط الفيديو (YouTube — أي صيغة)</label>
      <input type="text" id="nl-yt" placeholder="https://www.youtube.com/watch?v=... أو youtu.be/..."/>
      <span style="font-size:11px;color:var(--muted);margin-top:4px;display:block">يمكن لصق رابط المشاهدة مباشرةً — سيتحول تلقائياً</span>
    </div>
    <div class="inp-group"><label>رابط الملف الصوتي (MP3 / SoundCloud / أي رابط)</label><input type="text" id="nl-audio" placeholder="https://..."/></div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(220,53,69,.05);border-radius:10px;border:1px solid rgba(220,53,69,.15);margin-top:4px">
      <label class="toggle"><input type="checkbox" id="nl-locked"><span class="toggle-slider"></span></label>
      <div>
        <div style="font-size:13px;font-weight:700;color:#dc3545">قفل الدرس</div>
        <div style="font-size:11px;color:var(--muted)">الطالب يرى الدرس موجوداً لكن لا يستطيع فتحه</div>
      </div>
    </div>
    <button class="btn btn-gold" style="margin-top:14px;width:100%;justify-content:center" onclick="saveLesson('${cid}',null)"><i data-lucide="plus" style="width:14px;height:14px"></i> إضافة الدرس</button>
  `,"درس جديد");
}
function adminEditLesson(cid,lid){
  const c=findById(APP.courses,cid);const l=c?findById(c.lessons,lid):null;if(!l) return;
  openModal(`
    <div class="inp-group"><label>عنوان الدرس</label><input type="text" id="nl-title" value="${l.title||""}"/></div>
    <div class="inp-group">
      <label>رابط الفيديو (YouTube)</label>
      <input type="text" id="nl-yt" value="${l.youtube||""}" placeholder="https://www.youtube.com/watch?v=..."/>
      <span style="font-size:11px;color:var(--muted);margin-top:4px;display:block">يمكن لصق رابط المشاهدة — سيتحول تلقائياً</span>
    </div>
    <div class="inp-group"><label>رابط الملف الصوتي</label><input type="text" id="nl-audio" value="${l.audio||""}" placeholder="https://..."/></div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(220,53,69,.05);border-radius:10px;border:1px solid rgba(220,53,69,.15);margin-top:4px">
      <label class="toggle"><input type="checkbox" id="nl-locked" ${l.locked?"checked":""}><span class="toggle-slider"></span></label>
      <div>
        <div style="font-size:13px;font-weight:700;color:#dc3545">قفل الدرس</div>
        <div style="font-size:11px;color:var(--muted)">الطالب يرى الدرس موجوداً لكن لا يستطيع فتحه</div>
      </div>
    </div>
    <button class="btn btn-primary" style="margin-top:14px;width:100%;justify-content:center" onclick="saveLesson('${cid}','${lid}')"><i data-lucide="save" style="width:14px;height:14px"></i> حفظ التعديلات</button>
  `,"تعديل الدرس");
}
function saveLesson(cid,lid){
  const title=document.getElementById("nl-title")?.value.trim();
  if(!title){toast("عنوان الدرس مطلوب","error");return;}
  const rawYt=document.getElementById("nl-yt")?.value.trim()||"";
  const ytVal=toYoutubeEmbed(rawYt);
  const audioVal=document.getElementById("nl-audio")?.value.trim()||"";
  const lockedVal=document.getElementById("nl-locked")?.checked||false;
  const c=findById(APP.courses,cid);
  if(!c){toast("لم يتم العثور على المقرر","error");return;}
  if(lid&&lid!=="null"){
    const l=findById(c.lessons,lid);
    if(l){l.title=title;l.youtube=ytVal;l.audio=audioVal;l.locked=lockedVal;}
    toast("تم تحديث الدرس ✅","success");
  } else {
    if(c.lessons.length>=100){toast("الحد الأقصى للدروس في المقرر الواحد هو 100 درس","error");return;}
    c.lessons.push({id:uid(),title,youtube:ytVal,audio:audioVal,locked:lockedVal,visible:true,attachments:[],exercises:[]});
    addNotif(`درس جديد في ${c.title}: ${title}`,"info");
    toast(`تم إضافة درس: ${title} ✅`,"success");
  }
  const courseObj = findById(APP.courses, cid);
  if(courseObj){
    fbWriteCourse(courseObj).then(()=>{}).catch(()=>{});
  }
  closeModal(); renderCourseDetail();
}
function adminDeleteLesson(cid,lid){
  confirm2("حذف هذا الدرس نهائياً؟",()=>{
    const c=findById(APP.courses,cid);
    if(c){
      c.lessons=c.lessons.filter(l=>toId(l.id)!==toId(lid));
      saveState();
      fbWriteCourse(c).then(()=>toast("✅ تم حذف الدرس","info"));
      renderCourseDetail();
    }
  });
}

// Exercise CRUD
function adminAddExercise(cid,lid){
  _buildExModal(cid,lid,null);
}
function adminEditExercise(cid,lid,ei){
  _buildExModal(cid,lid,ei);
}
// ── Exercise CRUD — يدعم خيارات متعددة وإجابات متعددة ──
function adminAddExercise(cid,lid){ _buildExModal(cid,lid,null); }
function adminEditExercise(cid,lid,ei){ _buildExModal(cid,lid,ei); }

function _buildExModal(cid,lid,ei){
  const c=findById(APP.courses,cid); const l=c?findById(c.lessons,lid):null;
  const ex=ei!=null?l?.exercises?.[ei]:null;
  const opts=ex?.options||["","","",""];
  const answers=ex?.answers||[]; // multi
  const singleAns=ex?.answer??0;
  const isMulti=ex?.multi===true;
  const numOpts=opts.length;

  openModal(`
    <div class="inp-group"><label>نص السؤال *</label><input type="text" id="ex-q" value="${ex?.q||""}" placeholder="السؤال..."/></div>

    <!-- نوع الإجابة -->
    <div style="display:flex;gap:10px;margin-bottom:14px;align-items:center">
      <span style="font-size:13px;font-weight:600;color:var(--purple)">نوع السؤال:</span>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
        <input type="radio" name="ex-type" id="ex-single" value="single" ${!isMulti?"checked":""} onchange="_refreshExAnsUI()" style="accent-color:var(--purple)"> خيار واحد
      </label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
        <input type="radio" name="ex-type" id="ex-multi" value="multi" ${isMulti?"checked":""} onchange="_refreshExAnsUI()" style="accent-color:var(--purple)"> خيار أو أكثر
      </label>
    </div>

    <!-- الخيارات الديناميكية -->
    <div id="ex-opts-wrap">
      ${opts.map((o,i)=>`
      <div class="inp-group" id="ex-opt-row-${i}" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input type="text" id="ex-o${i}" value="${o}" placeholder="الخيار ${i+1}" style="flex:1;padding:10px 12px;border-radius:10px;border:1.5px solid rgba(212,180,142,.4);font-size:13px;font-family:'Zain',sans-serif;color:var(--text);background:var(--bg)"/>
        ${i>1?`<button type="button" onclick="_removeExOpt(${i})" style="width:28px;height:28px;border-radius:50%;border:none;background:#fee;cursor:pointer;color:#dc3545;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i data-lucide="x" style="width:12px;height:12px"></i></button>`:'<div style="width:28px"></div>'}
      </div>`).join("")}
    </div>
    <button type="button" class="btn btn-ghost btn-sm" onclick="_addExOpt()" style="margin-bottom:14px">
      <i data-lucide="plus" style="width:12px;height:12px"></i> إضافة خيار
    </button>

    <!-- الإجابة/الإجابات الصحيحة -->
    <div id="ex-ans-wrap">
      <label style="font-size:13px;font-weight:600;color:var(--purple);display:block;margin-bottom:6px">الإجابة الصحيحة</label>
      <div id="ex-ans-inner"></div>
    </div>

    <button class="btn btn-gold" style="width:100%;justify-content:center;margin-top:14px" onclick="saveExercise('${cid}','${lid}',${ei!=null?ei:"null"})">
      <i data-lucide="save" style="width:14px;height:14px"></i> ${ei!=null?"حفظ التعديلات":"إضافة التمرين"}
    </button>
  `, ei!=null?"تعديل التمرين":"إضافة تمرين");

  // حفظ الإجابات القديمة
  window._exInitAnswers = { single: singleAns, multi: answers };
  window._exOptCount = numOpts;
  _refreshExAnsUI();
}

function _refreshExAnsUI(){
  const isMulti = document.getElementById("ex-multi")?.checked;
  const wrap = document.getElementById("ex-ans-inner");
  if(!wrap) return;
  const count = window._exOptCount||4;
  const prev = window._exInitAnswers||{single:0,multi:[]};

  if(isMulti){
    wrap.innerHTML = Array.from({length:count},(_,i)=>`
    <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:9px;margin-bottom:5px;cursor:pointer;background:var(--bg);border:1px solid rgba(212,180,142,.25);font-size:13px">
      <input type="checkbox" id="ex-ans-${i}" value="${i}" style="accent-color:var(--purple);width:15px;height:15px" ${prev.multi.includes(i)?"checked":""}> الخيار ${i+1}
    </label>`).join("");
  } else {
    wrap.innerHTML = `<select id="ex-ans-sel" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid rgba(212,180,142,.4);font-size:13px;font-family:'Zain',sans-serif;background:var(--bg)">
      ${Array.from({length:count},(_,i)=>`<option value="${i}" ${i===prev.single?"selected":""}>الخيار ${i+1}</option>`).join("")}
    </select>`;
  }
  lucide.createIcons({nodes:[wrap]});
}

function _addExOpt(){
  window._exOptCount = (window._exOptCount||4)+1;
  const i = window._exOptCount-1;
  const wrap=document.getElementById("ex-opts-wrap");
  if(!wrap) return;
  const div=document.createElement("div");
  div.className="inp-group"; div.id=`ex-opt-row-${i}`; div.style.cssText="display:flex;align-items:center;gap:8px;margin-bottom:8px";
  div.innerHTML=`<input type="text" id="ex-o${i}" placeholder="الخيار ${i+1}" style="flex:1;padding:10px 12px;border-radius:10px;border:1.5px solid rgba(212,180,142,.4);font-size:13px;font-family:'Zain',sans-serif;color:var(--text);background:var(--bg)"/>
  <button type="button" onclick="_removeExOpt(${i})" style="width:28px;height:28px;border-radius:50%;border:none;background:#fee;cursor:pointer;color:#dc3545;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i data-lucide="x" style="width:12px;height:12px"></i></button>`;
  wrap.appendChild(div);
  lucide.createIcons({nodes:[div]});
  _refreshExAnsUI();
}

function _removeExOpt(i){
  const row=document.getElementById(`ex-opt-row-${i}`);
  if(row) row.remove();
  window._exOptCount = Math.max(2,(window._exOptCount||4)-1);
  _refreshExAnsUI();
}

function saveExercise(cid,lid,ei){
  const q=document.getElementById("ex-q")?.value.trim();
  if(!q){toast("نص السؤال مطلوب","error");return;}
  const isMulti=document.getElementById("ex-multi")?.checked;
  // جمع الخيارات
  const opts=[];
  for(let i=0;i<20;i++){
    const el=document.getElementById(`ex-o${i}`);
    if(!el) break;
    opts.push(el.value.trim());
  }
  if(opts.filter(Boolean).length<2){toast("أضف خيارَين على الأقل","error");return;}

  let answer, answers, multi;
  if(isMulti){
    answers=opts.map((_,i)=>document.getElementById(`ex-ans-${i}`)?.checked).map((v,i)=>v?i:-1).filter(x=>x>=0);
    if(!answers.length){toast("حدد إجابة صحيحة واحدة على الأقل","error");return;}
    answer=answers[0]; multi=true;
  } else {
    answer=parseInt(document.getElementById("ex-ans-sel")?.value||0);
    answers=[answer]; multi=false;
  }

  const c=findById(APP.courses,cid); const l=c?findById(c.lessons,lid):null;
  if(!l){toast("لم يتم العثور على الدرس","error");return;}
  const newEx={q, options:opts, answer, answers, multi};
  if(ei!=null&&ei!=="null"){ l.exercises[ei]=newEx; toast("تم تحديث التمرين ✅","success"); }
  else { l.exercises.push(newEx); toast("تم إضافة التمرين ✅","success"); }
  saveState(); closeModal();
  if(APP.currentLesson?.id!=null && toId(APP.currentLesson.id)===toId(lid)){ APP.currentLesson=l; renderLessonContent(); }
}
function adminDeleteExercise(cid,lid,ei){
  const c=findById(APP.courses,cid);const l=c?findById(c.lessons,lid):null;
  if(l){l.exercises.splice(ei,1);saveState();APP.currentLesson=l;renderLessonContent();toast("تم الحذف","info");}
}

// Test CRUD — يدعم خيارات متعددة وإجابات متعددة
function adminAddTest(){ openTestForm(null); }
function adminEditTest(id){ openTestForm(id); }

function _renderTestQsWrap(qs){
  return qs.map((q,qi)=>`
  <div class="card" style="padding:12px;margin-bottom:8px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:var(--purple);margin-bottom:4px">${qi+1}. ${q.q} ${q.multi?'<span class="tag tag-blue" style="font-size:10px;padding:1px 7px">متعدد</span>':''}</div>
        <div style="font-size:11px;color:var(--muted)">${(q.options||[]).map((o,i)=>{
          const isAns=q.multi?(q.answers||[]).includes(i):(q.answer===i);
          return `<span style="${isAns?"color:#28a745;font-weight:700":""}">${i+1}.${o||'—'} </span>`;
        }).join("")}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeTestQ(${qi})"><i data-lucide="x" style="width:11px;height:11px"></i></button>
    </div>
  </div>`).join("");
}

function _buildTestModal(id){
  const t=id?findById(APP.tests,id):null;
  window._pendingTestQs=[...(t?.questions||[])];
  openModal(`
    <div class="inp-group"><label>عنوان الاختبار *</label><input type="text" id="nt-title" value="${t?.title||""}"/></div>
    <div style="max-height:38vh;overflow-y:auto;margin-bottom:10px" id="nt-qs-wrap">
      ${_renderTestQsWrap(window._pendingTestQs)}
    </div>

    <!-- إضافة سؤال جديد -->
    <div style="background:var(--bg);border-radius:12px;padding:14px;border:1px solid rgba(212,180,142,.2)">
      <div style="font-size:12px;font-weight:700;color:var(--purple);margin-bottom:10px;display:flex;align-items:center;gap:6px">
        <i data-lucide="plus-circle" style="width:14px;height:14px;color:var(--gold)"></i> إضافة سؤال
      </div>
      <div class="inp-group" style="margin-bottom:8px"><input type="text" id="nq-q" placeholder="نص السؤال *"/></div>

      <!-- نوع الإجابة -->
      <div style="display:flex;gap:12px;margin-bottom:10px">
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px">
          <input type="radio" name="nq-type" id="nq-single" value="single" checked onchange="_refreshTestAnsUI()" style="accent-color:var(--purple)"> خيار واحد
        </label>
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px">
          <input type="radio" name="nq-type" id="nq-multi" value="multi" onchange="_refreshTestAnsUI()" style="accent-color:var(--purple)"> خيار أو أكثر
        </label>
      </div>

      <!-- خيارات السؤال -->
      <div id="nq-opts-wrap">
        ${[1,2,3,4].map(i=>`
        <div id="nq-opt-row-${i-1}" style="display:flex;gap:8px;margin-bottom:6px;align-items:center">
          <input type="text" id="nq-o${i}" placeholder="خيار ${i}" style="flex:1;padding:8px 10px;border-radius:9px;border:1.5px solid rgba(212,180,142,.35);font-size:12px;font-family:'Zain',sans-serif;background:var(--white)"/>
          ${i>2?`<button type="button" onclick="_removeTestOpt(${i-1})" style="width:24px;height:24px;border-radius:50%;border:none;background:#fee;cursor:pointer;color:#dc3545;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">✕</button>`:'<div style="width:24px"></div>'}
        </div>`).join("")}
      </div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="_addTestOpt()" style="margin-bottom:10px">
        <i data-lucide="plus" style="width:11px;height:11px"></i> خيار إضافي
      </button>

      <!-- الإجابة -->
      <div id="nq-ans-wrap"><div id="nq-ans-inner"></div></div>
      <button class="btn btn-ghost btn-sm" onclick="addTestQ()" style="margin-top:8px">
        <i data-lucide="check" style="width:12px;height:12px"></i> إضافة السؤال
      </button>
    </div>

    <button class="btn btn-gold" onclick="saveTest2('${id||""}')" style="width:100%;justify-content:center;margin-top:14px">
      <i data-lucide="save" style="width:14px;height:14px"></i> ${id?"حفظ التعديلات":"إنشاء الاختبار"}
    </button>
  `, id?"تعديل الاختبار":"اختبار جديد");
  lucide.createIcons();
  window._testOptCount=4;
  _refreshTestAnsUI();
}

function _refreshTestAnsUI(){
  const isMulti=document.getElementById("nq-multi")?.checked;
  const wrap=document.getElementById("nq-ans-inner");
  if(!wrap) return;
  const count=window._testOptCount||4;
  if(isMulti){
    wrap.innerHTML=`<div style="font-size:12px;color:var(--muted);margin-bottom:6px">الإجابات الصحيحة (اختر واحدة أو أكثر):</div>`+
      Array.from({length:count},(_,i)=>`
      <label style="display:inline-flex;align-items:center;gap:5px;margin-left:12px;margin-bottom:4px;cursor:pointer;font-size:12px">
        <input type="checkbox" id="nq-ans-cb-${i}" style="accent-color:var(--purple)"> خ${i+1}
      </label>`).join("");
  } else {
    wrap.innerHTML=`<div style="font-size:12px;color:var(--muted);margin-bottom:6px">الإجابة الصحيحة:</div>
      <select id="nq-ans-sel" style="width:100%;padding:8px 10px;border-radius:9px;border:1.5px solid rgba(212,180,142,.35);font-size:12px;font-family:'Zain',sans-serif;background:var(--white)">
        ${Array.from({length:count},(_,i)=>`<option value="${i}">الخيار ${i+1}</option>`).join("")}
      </select>`;
  }
}
function _addTestOpt(){
  window._testOptCount=(window._testOptCount||4)+1;
  const i=window._testOptCount-1;
  const wrap=document.getElementById("nq-opts-wrap");
  if(!wrap) return;
  const div=document.createElement("div");
  div.id=`nq-opt-row-${i}`; div.style.cssText="display:flex;gap:8px;margin-bottom:6px;align-items:center";
  div.innerHTML=`<input type="text" id="nq-o${i+1}" placeholder="خيار ${i+1}" style="flex:1;padding:8px 10px;border-radius:9px;border:1.5px solid rgba(212,180,142,.35);font-size:12px;font-family:'Zain',sans-serif;background:var(--white)"/>
  <button type="button" onclick="_removeTestOpt(${i})" style="width:24px;height:24px;border-radius:50%;border:none;background:#fee;cursor:pointer;color:#dc3545;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">✕</button>`;
  wrap.appendChild(div);
  _refreshTestAnsUI();
}
function _removeTestOpt(i){
  const row=document.getElementById(`nq-opt-row-${i}`);
  if(row) row.remove();
  window._testOptCount=Math.max(2,(window._testOptCount||4)-1);
  _refreshTestAnsUI();
}

function removeTestQ(qi){
  window._pendingTestQs.splice(qi,1);
  const wrap=document.getElementById("nt-qs-wrap");
  if(wrap){ wrap.innerHTML=_renderTestQsWrap(window._pendingTestQs); lucide.createIcons({nodes:[wrap]}); }
}

function addTestQ(){
  const q=document.getElementById("nq-q")?.value.trim();
  if(!q){toast("نص السؤال مطلوب","error");return;}
  const isMulti=document.getElementById("nq-multi")?.checked;
  const opts=[];
  for(let i=1;i<=20;i++){
    const el=document.getElementById(`nq-o${i}`);
    if(!el) break;
    opts.push(el.value.trim());
  }
  if(opts.filter(Boolean).length<2){toast("أضف خيارَين على الأقل","error");return;}
  let answer, answers, multi;
  if(isMulti){
    answers=opts.map((_,i)=>document.getElementById(`nq-ans-cb-${i}`)?.checked?i:-1).filter(x=>x>=0);
    if(!answers.length){toast("حدد إجابة واحدة على الأقل","error");return;}
    answer=answers[0]; multi=true;
  } else {
    answer=parseInt(document.getElementById("nq-ans-sel")?.value||0);
    answers=[answer]; multi=false;
  }
  window._pendingTestQs.push({q,options:opts,answer,answers,multi});
  toast("تمت إضافة السؤال","success");
  document.getElementById("nq-q").value="";
  for(let i=1;i<=20;i++){const el=document.getElementById(`nq-o${i}`);if(el)el.value="";}
  document.getElementById("nq-single").checked=true;
  window._testOptCount=4;
  _refreshTestAnsUI();
  const wrap=document.getElementById("nt-qs-wrap");
  if(wrap){ wrap.innerHTML=_renderTestQsWrap(window._pendingTestQs); lucide.createIcons({nodes:[wrap]}); }
}

async function saveTest2(id){
  const title=document.getElementById("nt-title")?.value.trim();
  if(!title){toast("عنوان الاختبار مطلوب","error");return;}
  if(!window._pendingTestQs.length){toast("أضف أسئلة أولاً","error");return;}
  let testObj;
  if(id){
    const t=findById(APP.tests,id);
    if(t){ t.title=title; t.questions=[...window._pendingTestQs]; testObj=t; }
    toast("جارٍ الحفظ...","info",1200);
  } else {
    if(APP.tests.length>=100){toast("الحد الأقصى للاختبارات هو 100 اختبار","error");return;}
    testObj={id:uid(),title,questions:[...window._pendingTestQs],visible:true,locked:false};
    APP.tests.push(testObj);
    addNotif(`اختبار جديد: ${title}`,"info");
    toast("جارٍ الحفظ...","info",1200);
  }
  if(testObj){
    await fsSaveTest(testObj);
    saveState();
    toast(id?"تم تحديث الاختبار في Firebase ✅":`تم إنشاء اختبار: ${title} ✅`,"success");
  }
  closeModal();renderAdmin();renderTests();
}
function adminDeleteTest(id){
  confirm2("حذف هذا الاختبار نهائياً؟",()=>{
    fbRemoveTest(id).then(()=>{
      toast("✅ تم حذف الاختبار","info");
      navTo("tests");
    });
  });
}

// ── الخطة الدراسية الافتراضية ──
function _defaultStudyPlan(){
  return [
    {
      level:"المرحلة التمهيدية", color:"#b8965e",
      stages:[{
        name:"كتب المرحلة التمهيدية",
        books:["كتاب المدخل إلى طلب العلم","كتاب تذكرة السامع والمتكلم","كتاب للجرد يختاره الشيخ (تطبيق عملي)"]
      }]
    },
    {
      level:"مقررات المستوى الأول", color:"#3B1B40",
      stages:[
        { name:"المرحلة الأولى — العقيدة والتوحيد", books:["القواعد الأربع","نواقض الإسلام","الأصول الثلاثة وأدلتها","كشف الشبهات"] },
        { name:"المرحلة الثانية — علوم الآلة والسنة", books:["متن الآجرومية (النحو)","متن التذكرة في علوم الحديث لابن الملقن","الأرجوزة الميئية في السيرة النبوية","الرسالة اللطيفة في أصول الفقه (للسعدي)","الأربعون النووية مع زيادات ابن رجب"] },
        { name:"المرحلة الثالثة — الفقه المالكي وأصوله وقواعده", books:["مقدمات التفقه (رد السفاريني، ابن رجب، أقوال ابن تيمية)","متن الأخضري (العبادات)","متن العشماوية (قراءة سريعة)","نظم ابن أبي كف (أدلة المذهب)","نظم المرشد المعين لابن عاشر (دراسة نقدية)","منظومة ابن سند في القواعد الفقهية"] },
        { name:"المرحلة الرابعة — أصول التفسير والعقيدة", books:["مقدمة في أصول التفسير لابن تيمية","كتاب التوحيد (للشيخ محمد بن عبد الوهاب)","القواعد والضوابط السلفية في الأسماء والصفات","العقيدة الواسطية لابن تيمية"] },
        { name:"المرحلة الخامسة — المقاصد والآداب والسياسة الشرعية", books:["منظومة تبصرة القاصد في علم المقاصد (للشيخ العصيمي)","كتاب الجامع من القوانين الفقهية لابن جزي (الآداب)","منظومة السبل المرضية في السياسة الشرعية (لحافظ الحكمي)"] },
        { name:"المرحلة السادسة — فقه الدعوة والمناظرة والحصانة", books:["رسالة الأمر بالمعروف والنهي عن المنكر لابن تيمية","متن آداب البحث والمناظرة (لطاشكبري زاده)","متن الرد على المخالف","متن الحصانة الفكرية"] }
      ]
    }
  ];
}

// ══════════════════════════════════════════════════════════
// FIREBASE LOADER UI
// ══════════════════════════════════════════════════════════
function _showFirebaseLoader(show){
  let el = document.getElementById("fb-loader");
  if(show){
    if(!el){
      el = document.createElement("div");
      el.id = "fb-loader";
      el.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:9998;background:var(--purple);color:var(--gold-l);padding:10px 16px;border-radius:22px;font-size:12px;font-family:'Zain',sans-serif;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(59,27,64,.4);pointer-events:none;transition:opacity .3s";
      el.innerHTML = `<svg style="width:14px;height:14px;animation:spin 1s linear infinite;color:var(--gold)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> جارٍ تحميل البيانات من Firebase...`;
      document.body.appendChild(el);
    }
    el.style.opacity="1";
  } else {
    if(el){ el.style.opacity="0"; setTimeout(()=>el?.remove(),400); }
  }
}

// ══════════════════════════════════════════════════════════
// ADMIN PANEL — Firebase status indicator
// ══════════════════════════════════════════════════════════
async function checkSyncStatus(){
  const el=document.getElementById("sync-status");
  if(!el) return;
  el.innerHTML=`<span style="color:var(--muted)">جارٍ الفحص...</span>`;
  try{
    await FB_DB.collection("courses").limit(1).get();
    const cCount = APP.courses.length;
    const tCount = APP.tests.length;
    el.innerHTML=`<span style="color:#28a745;display:flex;align-items:center;gap:6px"><i data-lucide="check-circle" style="width:14px;height:14px"></i> Firebase متصل — ${cCount} مقرر، ${tCount} اختبار محفوظان</span>`;
    lucide.createIcons({nodes:[el]});
  }catch(e){
    el.innerHTML=`<span style="color:#dc3545">⚠️ تعذّر الاتصال بـ Firebase: ${e.message}</span>`;
  }
}

// ══════════════════════════════════════════════════════════
// MOBILE MENU
// ══════════════════════════════════════════════════════════
function toggleMobileMenu(){
  const menu=document.getElementById("mobile-menu");
  const overlay=document.getElementById("mobile-menu-overlay");
  const isOpen=menu.classList.contains("open");
  if(isOpen){ closeMobileMenu(); }
  else {
    menu.classList.add("open");
    overlay.style.display="block";
    lucide.createIcons({nodes:[menu]});
  }
}
function closeMobileMenu(){
  document.getElementById("mobile-menu").classList.remove("open");
  document.getElementById("mobile-menu-overlay").style.display="none";
}

// ══════════════════════════════════════════════════════════
// SCHEDULE (جدول الدروس)
// ══════════════════════════════════════════════════════════
async function fsSaveSchedule(sch){
  try{ await FB_DB.collection("config").doc("schedule").set({data:sch}); }catch(e){}
}
async function fsLoadSchedule(){
  try{
    const snap=await FB_DB.collection("config").doc("schedule").get();
    return snap.exists?snap.data().data:null;
  }catch(e){return null;}
}

function renderSchedule(){
  const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];
  const sch=APP.schedule||{};
  const periods=APP.schedulePeriods||["الفجر","الضحى","العصر","المغرب","العشاء"];
  document.getElementById("app-page-schedule").innerHTML=`
  <div class="pg" style="padding:28px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
      <h2 style="color:var(--purple);font-size:22px;font-weight:800;display:flex;align-items:center;gap:8px">
        <i data-lucide="calendar" style="width:22px;height:22px;color:var(--gold)"></i> جدول الدروس
      </h2>
      ${isAdmin()?`<button class="btn btn-gold btn-sm" onclick="adminEditSchedule()"><i data-lucide="edit-2" style="width:13px;height:13px"></i> تعديل الجدول</button>`:""}
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:600px">
        <thead>
          <tr>
            <th style="padding:10px 14px;background:linear-gradient(135deg,var(--purple),var(--purple-l));color:#fff;font-size:13px;border-radius:10px 0 0 0;text-align:right">الوقت</th>
            ${days.map((d,i)=>`<th style="padding:10px 14px;background:linear-gradient(135deg,var(--purple),var(--purple-l));color:#fff;font-size:13px;${i===days.length-1?"border-radius:0 10px 0 0":""}text-align:center">${d}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${periods.map((p,pi)=>`
          <tr>
            <td style="padding:10px 14px;font-weight:700;color:var(--purple);font-size:13px;background:rgba(212,180,142,.08);border-bottom:1px solid rgba(212,180,142,.15)">${p}</td>
            ${days.map((d,di)=>{
              const cell=(sch[d]||{})[p]||"";
              return `<td style="padding:8px;border-bottom:1px solid rgba(212,180,142,.12);text-align:center">
                ${cell?`<div class="schedule-cell active-cell"><span style="font-size:12px;color:var(--purple);font-weight:600">${cell}</span></div>`:`<div class="schedule-cell" style="opacity:.4"><span style="font-size:11px;color:var(--muted)">—</span></div>`}
              </td>`;
            }).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    ${!Object.keys(sch).length?`<div style="text-align:center;padding:40px;color:var(--muted)"><i data-lucide="calendar-off" style="width:40px;height:40px;opacity:.3;margin-bottom:12px"></i><p>لم يتم إعداد الجدول بعد</p>${isAdmin()?"<button class='btn btn-gold' onclick='adminEditSchedule()'>إعداد الجدول</button>":""}</div>`:""}
  </div>`;
  lucide.createIcons();
}

function adminEditSchedule(){
  const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];
  const sch=APP.schedule||{};
  const periods=APP.schedulePeriods||["الفجر","الضحى","العصر","المغرب","العشاء"];
  openModal(`
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">أدخل اسم الدرس/المقرر في كل خانة (اتركها فارغة إذا لا يوجد)</div>
    <div style="overflow-x:auto;max-height:55vh;overflow-y:auto">
      <table style="width:100%;border-collapse:collapse;min-width:500px">
        <thead>
          <tr>
            <th style="padding:6px;font-size:12px;color:var(--purple);text-align:right">الوقت / اليوم</th>
            ${days.map(d=>`<th style="padding:6px;font-size:12px;color:var(--purple);text-align:center">${d}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${periods.map(p=>`
          <tr>
            <td style="padding:6px;font-size:12px;font-weight:600;color:var(--purple)">${p}</td>
            ${days.map(d=>`<td style="padding:4px">
              <input type="text" id="sch-${d}-${p}" value="${(sch[d]||{})[p]||""}"
                placeholder="—" style="width:100%;padding:5px 7px;border-radius:7px;border:1px solid rgba(212,180,142,.4);font-size:11px;font-family:'Zain',sans-serif;background:var(--bg)"/>
            </td>`).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="inp-group" style="margin-top:12px">
      <label style="font-size:12px">الأوقات/الحصص (افصل بفاصلة)</label>
      <input type="text" id="sch-periods" value="${periods.join("،")}" placeholder="الفجر،الضحى،العصر..."/>
    </div>
    <button class="btn btn-gold" style="margin-top:12px;width:100%;justify-content:center" onclick="saveSchedule()">
      <i data-lucide="save" style="width:14px;height:14px"></i> حفظ الجدول
    </button>
  `,"تعديل جدول الدروس");
  lucide.createIcons();
}
async function saveSchedule(){
  const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];
  const periodsStr=document.getElementById("sch-periods")?.value||"";
  const periods=periodsStr.split(/،|,/).map(s=>s.trim()).filter(Boolean);
  const sch={};
  days.forEach(d=>{
    sch[d]={};
    periods.forEach(p=>{
      const v=document.getElementById(`sch-${d}-${p}`)?.value.trim()||"";
      if(v) sch[d][p]=v;
    });
  });
  APP.schedule=sch;
  APP.schedulePeriods=periods;
  saveState();
  await fsSaveSchedule({schedule:sch,periods});
  toast("تم حفظ الجدول في Firebase ✅","success");
  closeModal();
  if(APP.activePage==="schedule") renderSchedule();
}

// ══════════════════════════════════════════════════════════
// CHANNEL WARNING MODAL
// ══════════════════════════════════════════════════════════
function openPrivateChannelWithWarning(){
  openModal(`
    <div style="text-align:center;padding:10px 0">
      <div style="width:56px;height:56px;border-radius:50%;background:rgba(220,53,69,.1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;border:2px solid rgba(220,53,69,.2)">
        <i data-lucide="alert-triangle" style="width:26px;height:26px;color:#dc3545"></i>
      </div>
      <h3 style="color:var(--purple);font-size:16px;font-weight:800;margin-bottom:10px">تنبيه مهم</h3>
      <p style="color:var(--text);font-size:14px;line-height:1.8;margin-bottom:16px">
        هذه القناة مخصصة حصراً لطلاب معهد التأصيل العلمي.<br>
        <strong style="color:#dc3545">يُمنع منعاً باتاً نشر الرابط أو مشاركته</strong> مع أي شخص خارج المعهد.
      </p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-primary" onclick="closeModal();openPrivateChannel()">
          <i data-lucide="send" style="width:14px;height:14px"></i> أفهم وأوافق — انتقل للقناة
        </button>
        <button class="btn btn-ghost" onclick="closeModal()">إغلاق</button>
      </div>
    </div>
  `,"تحذير");
  lucide.createIcons();
}

// ══════════════════════════════════════════════════════════
// INSTITUTE INFO EDIT
// ══════════════════════════════════════════════════════════
function adminEditInstitute(){
  const cfg=APP.siteConfig;
  openModal(`
    <div class="inp-group"><label>اسم المعهد</label><input type="text" id="inst-name" value="${cfg.instituteName||"معهد التأصيل العلمي"}"/></div>
    <div class="inp-group"><label>الوصف المختصر</label><textarea id="inst-tagline" rows="2">${cfg.instituteTagline||""}</textarea></div>
    <div class="inp-group"><label>نص "من نحن"</label><textarea id="inst-about" rows="6" style="direction:rtl">${cfg.aboutText||""}</textarea></div>
    <div class="inp-group"><label>رابط فيديو التعريف (YouTube Embed)</label><input type="text" id="inst-video" value="${cfg.introVideo||""}" placeholder="https://www.youtube.com/embed/..."/></div>
    <div class="inp-group"><label>البريد الإلكتروني</label><input type="text" id="inst-email" value="${cfg.contactEmail||""}"/></div>
    <div class="inp-group"><label>تيليجرام المعهد</label><input type="text" id="inst-tg" value="${cfg.contactTelegram||""}" placeholder="@TaaseelInstitute"/></div>
    <div class="inp-group"><label>رقم الهاتف</label><input type="text" id="inst-phone" value="${cfg.contactPhone||""}"/></div>
    <div class="inp-group"><label>قناة الشيخ مصعب بن صلاح</label><input type="text" id="inst-sheikh" value="${cfg.sheikhChannel||""}" placeholder="@channelname"/></div>
    <div class="inp-group"><label>القناة الخاصة للطلاب</label><input type="text" id="inst-private" value="${cfg.privateChannel||""}" placeholder="@channelname"/></div>
    <button class="btn btn-gold" onclick="saveInstituteInfo()" style="width:100%;justify-content:center">
      <i data-lucide="save" style="width:14px;height:14px"></i> حفظ معلومات المعهد
    </button>
  `,"تعديل معلومات المعهد");
  lucide.createIcons();
}
async function saveInstituteInfo(){
  APP.siteConfig.instituteName=document.getElementById("inst-name")?.value.trim()||APP.siteConfig.instituteName;
  APP.siteConfig.instituteTagline=document.getElementById("inst-tagline")?.value.trim()||"";
  APP.siteConfig.aboutText=document.getElementById("inst-about")?.value||"";
  APP.siteConfig.introVideo=document.getElementById("inst-video")?.value.trim()||"";
  APP.siteConfig.contactEmail=document.getElementById("inst-email")?.value.trim()||"";
  APP.siteConfig.contactTelegram=document.getElementById("inst-tg")?.value.trim()||"";
  APP.siteConfig.contactPhone=document.getElementById("inst-phone")?.value.trim()||"";
  APP.siteConfig.sheikhChannel=document.getElementById("inst-sheikh")?.value.trim()||"";
  APP.siteConfig.privateChannel=document.getElementById("inst-private")?.value.trim()||"";
  await fbWriteConfig();
  renderAboutPublic();
  _updateAppFooter();
  toast("تم حفظ معلومات المعهد ✅","success");
  closeModal();
  if(APP.activePage==="admin") renderAdmin();
}

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// نظام التنقل متعدد الصفحات
// ══════════════════════════════════════════════════════════
const _PAGE_FILE_MAP = {
  "landing":       "index.html",
  "about-public":  "index.html",
  "login":         "login.html",
  "dashboard":     "dashboard.html",
  "courses":       "courses.html",
  "course-detail": "courses.html",
  "course-form":   "courses.html",
  "lesson-form":   "courses.html",
  "tests":         "tests.html",
  "test-detail":   "tests.html",
  "schedule":      "schedule.html",
  "qa":            "qa.html",
  "about-app":     "about.html",
  "profile":       "profile.html",
  "admin":         "admin.html",
  "admin-qa":      "admin.html",
};

function _getCurrentFile(){
  return window.location.pathname.split("/").pop() || "01-landing.html";
}

function _getExpectedFile(page){
  return _PAGE_FILE_MAP[page] || null;
}

// إضافة ربط أزرار التنقل بالصفحات
function _injectPageLinks(){
  // ربط nav buttons
  const navMap = {
    "nb-courses":   "04-courses.html",
    "nb-tests":     "05-tests.html",
    "nb-schedule":  "06-schedule.html",
    "nb-qa":        "07-qa.html",
    "nb-about-app": "08-about.html",
    "nb-profile":   "09-profile.html",
    "nb-admin":     "10-admin.html",
    "nb-admin-qa":  "10-admin.html",
    "nb-dashboard": "03-dashboard.html",
  };
  Object.entries(navMap).forEach(([id, file])=>{
    const btn = document.getElementById(id);
    if(btn){
      const cur = _getCurrentFile();
      btn.addEventListener("click", (e)=>{
        if(cur !== file){
          e.preventDefault();
          e.stopImmediatePropagation();
          sessionStorage.setItem("_navTarget", Object.entries(_PAGE_FILE_MAP).find(([k,v])=>v===file)?.[0] || "");
          window.location.href = file;
        }
      }, true);
    }
  });
}


// ══════════════════════════════════════════════════════════
// STARTUP
// ══════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", async () => {
  // Fix data
  APP.courses = fixYtUrls(APP.courses);
  lucide.createIcons();

  // Restore sessionStorage nav target
  const _stored = sessionStorage.getItem("_navTarget");
  if(_stored){ sessionStorage.removeItem("_navTarget"); sessionStorage.setItem("_goto",_stored); }

  // Current page
  const _cur = currentPage();
  const _publicPages = ["landing","login","about-public"];

  // Show public page immediately if needed
  if(_publicPages.includes(_cur)){
    document.getElementById("public-wrapper").style.display = "";
    document.getElementById("app-wrapper").style.display = "none";
    document.querySelectorAll("#public-wrapper .page").forEach(p=>p.classList.remove("active"));
    const _el = document.getElementById("page-"+_cur);
    if(_el) _el.classList.add("active");
    renderPublicPlan();
    renderAboutPublic();
    updatePubNav();
  } else {
    // App page: show spinner while checking auth
    document.getElementById("public-wrapper").style.display = "none";
    document.getElementById("app-wrapper").style.display = "none";
    const spinner = document.createElement("div");
    spinner.id = "_spinner";
    spinner.style.cssText = "position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg,#faf8f5);z-index:9999;gap:16px;";
    spinner.innerHTML = '<div style="width:48px;height:48px;border:4px solid rgba(59,27,64,.12);border-top-color:#3B1B40;border-radius:50%;animation:spin 0.7s linear infinite"></div><div style="font-family:Zain,sans-serif;font-size:14px;color:#7a6a7e;font-weight:600">جارٍ التحقق من الجلسة...</div>';
    document.body.appendChild(spinner);
  }

  // ── onAuthStateChanged: the SINGLE source of truth for auth ──
  let _resolved = false;
  FB_AUTH.onAuthStateChanged(async (fbUser) => {
    if(_resolved && APP.user) return; // Already logged in on this page

    // Remove spinner
    document.getElementById("_spinner")?.remove();
    document.getElementById("redirect-overlay")?.remove();

    if(fbUser) {
      if(APP.user) return; // Already handled
      _resolved = true;

      // Check if admin first
      const adminData = await fsGet("admins", fbUser.uid);
      if(adminData) {
        loginUser({
          id: fbUser.uid,
          name: adminData.fullName || adminData.username || "مشرف",
          adminLabel: adminData.username,
          adminFullName: adminData.fullName,
          adminUsername: adminData.username,
          isAdmin: true,
          adminRole: adminData.role || "supervisor",
          adminPermissions: adminData.permissions || {},
          completedLessons: [],
          testResults: [],
        });
        // Load data in background
        loadFromFirestore().then(() => {
          if(APP.activePage) _renderPage(APP.activePage);
        });
        return;
      }

      // Regular student
      let profile = null;
      try {
        const snap = await FB_DB.collection("users").doc(fbUser.uid).get();
        if(snap.exists) profile = snap.data();
      } catch(e) {
        console.warn("Firestore user read:", e.code);
      }

      if(!profile) {
        // New user without profile (e.g., Google sign-in)
        await FB_AUTH.signOut();
        if(!_publicPages.includes(_cur)) location.href = "login.html";
        return;
      }

      const status = (profile.status || "pending").toLowerCase();
      if(status === "pending") {
        await FB_AUTH.signOut();
        if(!_publicPages.includes(_cur)) {
          sessionStorage.setItem("_loginMsg","pending");
          location.href = "login.html";
        } else {
          const errEl = document.getElementById("login-err");
          if(errEl) showErr(errEl,"⏳ حسابك في انتظار موافقة المسؤول");
        }
        return;
      }
      if(status === "rejected") {
        await FB_AUTH.signOut();
        if(!_publicPages.includes(_cur)) {
          sessionStorage.setItem("_loginMsg","rejected");
          location.href = "login.html";
        } else {
          const errEl = document.getElementById("login-err");
          if(errEl) showErr(errEl,"❌ تم رفض طلب تسجيلك. تواصل مع المسؤول.");
        }
        return;
      }

      // Approved student
      loginUser({
        id: fbUser.uid,
        name: profile.name || fbUser.email?.split("@")[0] || "طالب",
        email: profile.email || fbUser.email || "",
        phone: profile.phone||"", age: profile.age||"",
        telegram: profile.telegram||"", level: profile.level||"",
        isAdmin: false,
        completedLessons: profile.completedLessons||[],
        testResults: profile.testResults||[],
      });
      loadFromFirestore().then(() => {
        if(APP.activePage) _renderPage(APP.activePage);
      });

    } else {
      // Not logged in
      _resolved = true;
      if(!_publicPages.includes(_cur)) {
        // Protected page — redirect to login
        sessionStorage.setItem("_goto", _cur);
        location.href = "login.html";
      } else {
        // Show login message if any
        const msg = sessionStorage.getItem("_loginMsg");
        if(msg) {
          sessionStorage.removeItem("_loginMsg");
          const errEl = document.getElementById("login-err");
          if(errEl) {
            if(msg==="pending") showErr(errEl,"⏳ حسابك في انتظار موافقة المسؤول");
            if(msg==="rejected") showErr(errEl,"❌ تم رفض طلب تسجيلك. تواصل مع المسؤول.");
          }
        }
        // Auto-login for students
        try {
          const rm = JSON.parse(atob(localStorage.getItem("ti_rm")||""));
          if(rm?.e && rm?.p) await FB_AUTH.signInWithEmailAndPassword(rm.e, rm.p);
        } catch(_) {}
        // Auto-login for admins
        try {
          const arm = JSON.parse(atob(localStorage.getItem("ti_admin_rm")||""));
          if(arm?.e && arm?.p && (Date.now()-arm.ts < 30*24*60*60*1000)){
            await FB_AUTH.signInWithEmailAndPassword(arm.e, arm.p);
          }
        } catch(_) {}
      }
    }
  });

  // Load data from Firestore in background (for public pages)
  if(_publicPages.includes(_cur)) {
    loadFromFirestore().then(() => {
      renderPublicPlan();
      renderAboutPublic();
    });
  }

  // Ensure super admin exists
  ensureSuperAdmin();

  // Close notification panel on outside click
  document.addEventListener("click", e => {
    const panel = document.getElementById("notif-panel");
    const btn = document.getElementById("nb-notif");
    if(panel && btn && !panel.contains(e.target) && !btn.contains(e.target))
      panel.style.display = "none";
  });
});
