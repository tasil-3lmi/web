// ══════════════════════════════════════════════════════════
// STATE & STORAGE
// ══════════════════════════════════════════════════════════
const LS  = key => { try{ return JSON.parse(localStorage.getItem(key)||"null"); }catch(e){ return null; } };
const SS  = (key,val) => { try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} };
const LS_TS_KEY = "ti_ts";
function getLocalTs(){ return LS(LS_TS_KEY)||0; }
function bumpLocalTs(){ const t=Date.now(); SS(LS_TS_KEY,t); return t; }

// ══════════════════════════════════════════════════════════
// Firestore — collections مخصصة لكل نوع بيانات
// courses/{id}  tests/{id}  config/main  questions/{id}
// ══════════════════════════════════════════════════════════

// ── Courses ──
async function fsSaveCourse(course){
  try{ await FB_DB.collection("courses").doc(String(course.id)).set(course); }catch(e){ console.warn("fsSaveCourse",e); }
}
async function fsDeleteCourse(id){
  try{ await FB_DB.collection("courses").doc(String(id)).delete(); }catch(e){}
}
async function fsLoadCourses(){
  try{
    const snap = await FB_DB.collection("courses").orderBy("_order","asc").get().catch(()=>
      FB_DB.collection("courses").get()
    );
    return snap.docs.map(d=>d.data());
  }catch(e){ return null; }
}

// ── Tests ──
async function fsSaveTest(test){
  try{ await FB_DB.collection("tests").doc(String(test.id)).set(test); }catch(e){ console.warn("fsSaveTest",e); }
}
async function fsDeleteTest(id){
  try{ await FB_DB.collection("tests").doc(String(id)).delete(); }catch(e){}
}
async function fsLoadTests(){
  try{
    const snap = await FB_DB.collection("tests").get();
    return snap.docs.map(d=>d.data());
  }catch(e){ return null; }
}

// ── Site Config ──
async function fsSaveConfig(cfg){
  try{ await FB_DB.collection("config").doc("main").set(cfg); }catch(e){}
}
async function fsLoadConfig(){
  try{
    const snap = await FB_DB.collection("config").doc("main").get();
    return snap.exists ? snap.data() : null;
  }catch(e){ return null; }
}

// ── Questions ──
async function fsSaveQuestion(q){
  try{ await FB_DB.collection("questions").doc(String(q.id)).set(q); }catch(e){}
}
async function fsDeleteQuestion(id){
  try{ await FB_DB.collection("questions").doc(String(id)).delete(); }catch(e){}
}
async function fsLoadQuestions(){
  try{
    const snap = await FB_DB.collection("questions").get();
    return snap.docs.map(d=>d.data());
  }catch(e){ return null; }
}

// ── Legacy (fallback) ──
async function fsGetAppData(doc){
  try{
    const s = await FB_DB.collection("taaseel_app").doc(doc).get();
    return s.exists ? s.data() : null;
  }catch(e){ return null; }
}
async function fsSetAppData(doc, val){
  try{
    if(JSON.stringify(val).length > 850000) return;
    await FB_DB.collection("taaseel_app").doc(doc).set({payload:val, ts:Date.now()});
  }catch(e){}
}
async function fsGetUser(uid2){
  try{ const s=await FB_DB.collection("users").doc(uid2).get(); return s.exists?s.data():null; }catch(e){ return null; }
}
async function fsSetUser(uid2,data){
  try{ await FB_DB.collection("users").doc(uid2).set(data,{merge:true}); }catch(e){}
}
async function fsGetAllUsers(){
  try{ const s=await FB_DB.collection("users").get(); return s.docs.map(d=>({id:d.id,...d.data()})); }catch(e){ return []; }
}
async function fsDeleteUser(uid2){
  try{ await FB_DB.collection("users").doc(uid2).delete(); }catch(e){}
}

// ── ID helpers ──
function toId(v){ return String(v); }
function findById(arr, id){ return arr.find(x=>toId(x.id)===toId(id)); }

// مخزن مؤقت لبيانات الجلسة الإدارية (في الذاكرة فقط)
let _adminSessionEmail = "";
let _adminSessionPass  = "";
// يُخزَّن في مجموعة "admins/{uid}"
// الحقول: fullName, username, email, role ("super"|"supervisor"), permissions{}, createdAt

const SUPER_ADMIN_EMAIL = "abwdahm645@gmail.com";

// جلب ملف مسؤول من Firestore
async function fsGetAdmin(uid2){
  try{ const s=await FB_DB.collection("admins").doc(uid2).get(); return s.exists?{id:s.id,...s.data()}:null; }catch(e){ return null; }
}
async function fsSetAdmin(uid2, data){
  try{ await FB_DB.collection("admins").doc(uid2).set(data,{merge:true}); }catch(e){ console.warn("fsSetAdmin",e); }
}
async function fsGetAllAdmins(){
  try{ const s=await FB_DB.collection("admins").get(); return s.docs.map(d=>({id:d.id,...d.data()})); }catch(e){ return []; }
}
async function fsDeleteAdmin(uid2){
  try{ await FB_DB.collection("admins").doc(uid2).delete(); }catch(e){}
}

// الصلاحيات الافتراضية للمشرف
const DEFAULT_PERMISSIONS = {
  canApproveUsers:  true,
  canRejectUsers:   true,
  canDeleteUsers:   false,
  canManageCourses: false,
  canManageTests:   false,
  canAnswerQA:      true,
  canViewAdmins:    false,
};
const PERM_LABELS = {
  canApproveUsers:  "قبول الأعضاء",
  canRejectUsers:   "رفض الأعضاء",
  canDeleteUsers:   "حذف الأعضاء",
  canManageCourses: "إدارة المقررات",
  canManageTests:   "إدارة الاختبارات",
  canAnswerQA:      "الرد على الاستفسارات",
  canViewAdmins:    "عرض قائمة المشرفين",
};

function hasPerm(perm){
  if(!APP.user?.isAdmin) return false;
  if(APP.user.adminRole==="super") return true;
  return APP.user.adminPermissions?.[perm] === true;
}

// إنشاء حساب المشرف العام إن لم يكن موجوداً
async function ensureSuperAdmin(){
  try{
    // تحقق إذا كان المشرف العام مسجلاً في Firebase Auth بالفعل
    // (لا نستطيع فحص ذلك مباشرة من client، لكن نحاول الإنشاء)
    // إذا كان موجوداً سيفشل بـ email-already-in-use وهذا طبيعي
    let uid = null;
    try{
      const cred = await FB_AUTH.createUserWithEmailAndPassword(
        SUPER_ADMIN_EMAIL, "4m6m7878"
      );
      uid = cred.user.uid;
      await FB_AUTH.signOut();
    } catch(authErr){
      if(authErr.code === "auth/email-already-in-use"){
        // الحساب موجود — لا نحتاج فعل شيء
        return;
      }
      throw authErr;
    }
    // أنشئ ملف المشرف العام في Firestore
    if(uid){
      await fsSetAdmin(uid, {
        fullName:    "أبو الجواد الحنبلي",
        username:    "dahm6",
        email:       SUPER_ADMIN_EMAIL,
        role:        "super",
        permissions: {},
        createdAt:   new Date().toISOString(),
      });
    }
  }catch(e){ console.warn("ensureSuperAdmin:", e.code||e.message); }
}

let APP = {
  user: null,
  courses: LS("ti_courses") || [{"id": 1, "title": "مدخل إلى طلب العلم", "icon": "compass", "color": "#b8965e", "visible": true, "description": "تأسيس صحيح لمنهج طالب العلم الشرعي", "info": "مقرر مدخل إلى طلب العلم — المرحلة: تمهيدي", "_order": 0, "lessons": [{"id": 1, "title": "مقدمة ومدخل — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — مدخل إلى طلب العلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 2, "title": "تذكرة السامع والمتكلم", "icon": "ear", "color": "#a07840", "visible": true, "description": "آداب العلم والتعلم والمعلم", "info": "مقرر تذكرة السامع والمتكلم — المرحلة: تمهيدي", "_order": 1, "lessons": [{"id": 1, "title": "مقدمة ومدخل — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — تذكرة السامع والمتكلم", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 3, "title": "الجرد القرآني التطبيقي", "icon": "book-open", "color": "#8B6914", "visible": true, "description": "تطبيق عملي يختاره الشيخ لمراجعة القرآن", "info": "مقرر الجرد القرآني التطبيقي — المرحلة: تمهيدي", "_order": 2, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الجرد القرآني التطبيقي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 4, "title": "القواعد الأربع", "icon": "square", "color": "#3B1B40", "visible": true, "description": "قواعد التوحيد الأربع للإمام محمد بن عبد الوهاب", "info": "مقرر القواعد الأربع — المرحلة: أول", "_order": 3, "lessons": [{"id": 1, "title": "مقدمة ومدخل — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — القواعد الأربع", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 5, "title": "نواقض الإسلام", "icon": "alert-triangle", "color": "#4a2250", "visible": true, "description": "النواقض العشرة التي تنقض الإسلام", "info": "مقرر نواقض الإسلام — المرحلة: أول", "_order": 4, "lessons": [{"id": 1, "title": "مقدمة ومدخل — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — نواقض الإسلام", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 6, "title": "الأصول الثلاثة وأدلتها", "icon": "triangle", "color": "#5a2d63", "visible": true, "description": "معرفة الله ودينه ونبيه محمد ﷺ", "info": "مقرر الأصول الثلاثة وأدلتها — المرحلة: أول", "_order": 5, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الأصول الثلاثة وأدلتها", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 7, "title": "كشف الشبهات", "icon": "shield", "color": "#3B1B40", "visible": true, "description": "كشف شبهات المشركين في مسائل التوحيد", "info": "مقرر كشف الشبهات — المرحلة: أول", "_order": 6, "lessons": [{"id": 1, "title": "مقدمة ومدخل — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — كشف الشبهات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 8, "title": "متن الآجرومية", "icon": "pen-line", "color": "#1a5276", "visible": true, "description": "متن النحو الأساسي للمبتدئين", "info": "مقرر متن الآجرومية — المرحلة: ثانٍ", "_order": 7, "lessons": [{"id": 1, "title": "مقدمة ومدخل — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — متن الآجرومية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 9, "title": "التذكرة في علوم الحديث", "icon": "scroll", "color": "#1b4f72", "visible": true, "description": "مقدمة في مصطلح الحديث لابن الملقن", "info": "مقرر التذكرة في علوم الحديث — المرحلة: ثانٍ", "_order": 8, "lessons": [{"id": 1, "title": "مقدمة ومدخل — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — التذكرة في علوم الحديث", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 10, "title": "الأرجوزة الميئية في السيرة", "icon": "star", "color": "#154360", "visible": true, "description": "السيرة النبوية في نظم شعري مختصر", "info": "مقرر الأرجوزة الميئية في السيرة — المرحلة: ثانٍ", "_order": 9, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الأرجوزة الميئية في السيرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 11, "title": "الرسالة اللطيفة في أصول الفقه", "icon": "file-text", "color": "#0e3251", "visible": true, "description": "مقدمة في أصول الفقه للسعدي", "info": "مقرر الرسالة اللطيفة في أصول الفقه — المرحلة: ثانٍ", "_order": 10, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الرسالة اللطيفة في أصول الفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 12, "title": "الأربعون النووية", "icon": "list", "color": "#1a5276", "visible": true, "description": "أربعون حديثاً نبوياً مع زيادات ابن رجب", "info": "مقرر الأربعون النووية — المرحلة: ثانٍ", "_order": 11, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الأربعون النووية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 13, "title": "مقدمات التفقه", "icon": "layers", "color": "#117a65", "visible": true, "description": "مقدمات في فقه الفقه للسفاريني وابن رجب", "info": "مقرر مقدمات التفقه — المرحلة: ثالث", "_order": 12, "lessons": [{"id": 1, "title": "مقدمة ومدخل — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — مقدمات التفقه", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 14, "title": "متن الأخضري في العبادات", "icon": "moon", "color": "#0e6655", "visible": true, "description": "العبادات الأساسية في الفقه المالكي", "info": "مقرر متن الأخضري في العبادات — المرحلة: ثالث", "_order": 13, "lessons": [{"id": 1, "title": "مقدمة ومدخل — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — متن الأخضري في العبادات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 15, "title": "متن العشماوية", "icon": "book", "color": "#117a65", "visible": true, "description": "مختصر في الفقه المالكي", "info": "مقرر متن العشماوية — المرحلة: ثالث", "_order": 14, "lessons": [{"id": 1, "title": "مقدمة ومدخل — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — متن العشماوية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 16, "title": "نظم ابن أبي كف", "icon": "music", "color": "#0d5e4a", "visible": true, "description": "أدلة المذهب المالكي في نظم شعري", "info": "مقرر نظم ابن أبي كف — المرحلة: ثالث", "_order": 15, "lessons": [{"id": 1, "title": "مقدمة ومدخل — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — نظم ابن أبي كف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 17, "title": "نظم المرشد المعين لابن عاشر", "icon": "map", "color": "#117a65", "visible": true, "description": "دراسة نقدية للمرشد المعين", "info": "مقرر نظم المرشد المعين لابن عاشر — المرحلة: ثالث", "_order": 16, "lessons": [{"id": 1, "title": "مقدمة ومدخل — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — نظم المرشد المعين لابن عاشر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 18, "title": "منظومة القواعد الفقهية", "icon": "grid", "color": "#0a4d3a", "visible": true, "description": "القواعد الفقهية الكبرى في نظم ابن سند", "info": "مقرر منظومة القواعد الفقهية — المرحلة: ثالث", "_order": 17, "lessons": [{"id": 1, "title": "مقدمة ومدخل — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — منظومة القواعد الفقهية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 19, "title": "مقدمة في أصول التفسير", "icon": "search", "color": "#6e2f0a", "visible": true, "description": "أصول تفسير القرآن لابن تيمية", "info": "مقرر مقدمة في أصول التفسير — المرحلة: رابع", "_order": 18, "lessons": [{"id": 1, "title": "مقدمة ومدخل — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — مقدمة في أصول التفسير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 20, "title": "كتاب التوحيد", "icon": "heart", "color": "#7d3410", "visible": true, "description": "كتاب التوحيد للشيخ محمد بن عبد الوهاب", "info": "مقرر كتاب التوحيد — المرحلة: رابع", "_order": 19, "lessons": [{"id": 1, "title": "مقدمة ومدخل — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — كتاب التوحيد", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 21, "title": "القواعد السلفية في الأسماء والصفات", "icon": "settings", "color": "#6e2f0a", "visible": true, "description": "قواعد وضوابط في باب الأسماء والصفات", "info": "مقرر القواعد السلفية في الأسماء والصفات — المرحلة: رابع", "_order": 20, "lessons": [{"id": 1, "title": "مقدمة ومدخل — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — القواعد السلفية في الأسماء والصفات", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 22, "title": "العقيدة الواسطية", "icon": "award", "color": "#8b3c11", "visible": true, "description": "متن العقيدة الواسطية لابن تيمية", "info": "مقرر العقيدة الواسطية — المرحلة: رابع", "_order": 21, "lessons": [{"id": 1, "title": "مقدمة ومدخل — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — العقيدة الواسطية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 23, "title": "منظومة المقاصد للعصيمي", "icon": "target", "color": "#512e5f", "visible": true, "description": "علم مقاصد الشريعة في نظم شعري", "info": "مقرر منظومة المقاصد للعصيمي — المرحلة: خامس", "_order": 22, "lessons": [{"id": 1, "title": "مقدمة ومدخل — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — منظومة المقاصد للعصيمي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 24, "title": "الآداب من الجامع لابن جزي", "icon": "heart-handshake", "color": "#5b3068", "visible": true, "description": "آداب الإسلام من كتاب القوانين الفقهية", "info": "مقرر الآداب من الجامع لابن جزي — المرحلة: خامس", "_order": 23, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الآداب من الجامع لابن جزي", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 25, "title": "السبل المرضية في السياسة الشرعية", "icon": "balance-scale", "color": "#6c3483", "visible": true, "description": "منظومة حافظ الحكمي في السياسة الشرعية", "info": "مقرر السبل المرضية في السياسة الشرعية — المرحلة: خامس", "_order": 24, "lessons": [{"id": 1, "title": "مقدمة ومدخل — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — السبل المرضية في السياسة الشرعية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 26, "title": "الأمر بالمعروف والنهي عن المنكر", "icon": "megaphone", "color": "#922b21", "visible": true, "description": "رسالة ابن تيمية في الحسبة الشرعية", "info": "مقرر الأمر بالمعروف والنهي عن المنكر — المرحلة: سادس", "_order": 25, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الأمر بالمعروف والنهي عن المنكر", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 27, "title": "آداب البحث والمناظرة", "icon": "message-square", "color": "#a93226", "visible": true, "description": "متن طاشكبري زاده في المناظرة", "info": "مقرر آداب البحث والمناظرة — المرحلة: سادس", "_order": 26, "lessons": [{"id": 1, "title": "مقدمة ومدخل — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — آداب البحث والمناظرة", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 28, "title": "الرد على المخالف", "icon": "shield-alert", "color": "#922b21", "visible": true, "description": "أصول الرد على أهل البدع والمخالفين", "info": "مقرر الرد على المخالف — المرحلة: سادس", "_order": 27, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الرد على المخالف", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 29, "title": "الحصانة الفكرية", "icon": "lock", "color": "#b03a2e", "visible": true, "description": "حماية العقل المسلم من الغزو الفكري", "info": "مقرر الحصانة الفكرية — المرحلة: سادس", "_order": 28, "lessons": [{"id": 1, "title": "مقدمة ومدخل — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — الحصانة الفكرية", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}, {"id": 30, "title": "فقه الدعوة والتأثير", "icon": "radio", "color": "#a04000", "visible": true, "description": "أصول وأساليب الدعوة إلى الله", "info": "مقرر فقه الدعوة والتأثير — المرحلة: سادس", "_order": 29, "lessons": [{"id": 1, "title": "مقدمة ومدخل — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 2, "title": "الفصل الأول: التعريف والأهمية — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 3, "title": "الفصل الثاني: الأصول والقواعد — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 4, "title": "الفصل الثالث: الشروط والأركان — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 5, "title": "الفصل الرابع: الفروع والتطبيقات — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 6, "title": "الفصل الخامس: المسائل المهمة — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 7, "title": "الفصل السادس: الخلافات وتحقيقها — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 8, "title": "مسائل مختارة (1) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 9, "title": "مسائل مختارة (2) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 10, "title": "التطبيق العملي (1) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 11, "title": "التطبيق العملي (2) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 12, "title": "مراجعة شاملة (1) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 13, "title": "مراجعة شاملة (2) — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 14, "title": "أسئلة وإشكالات — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 15, "title": "الربط بالعلوم الأخرى — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 16, "title": "نماذج تطبيقية من التراث — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 17, "title": "الدرس الخاص بالأدلة — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 18, "title": "التلخيص والمراجعة — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 19, "title": "الاختبار التمهيدي — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}, {"id": 20, "title": "الخاتمة والتوصيات — فقه الدعوة والتأثير", "visible": true, "locked": false, "youtube": "", "audio": "", "attachments": [], "exercises": []}]}],
  tests: LS("ti_tests") || [{"id": 1, "courseId": 1, "title": "اختبار الوحدة الأولى — مدخل إلى طلب العلم", "visible": true, "questions": [{"q": "ما موضوع مقرر مدخل إلى طلب العلم؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 2, "courseId": 1, "title": "الاختبار النهائي — مدخل إلى طلب العلم", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر مدخل إلى طلب العلم؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 3, "courseId": 2, "title": "اختبار الوحدة الأولى — تذكرة السامع والمتكلم", "visible": true, "questions": [{"q": "ما موضوع مقرر تذكرة السامع والمتكلم؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 4, "courseId": 2, "title": "الاختبار النهائي — تذكرة السامع والمتكلم", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر تذكرة السامع والمتكلم؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 5, "courseId": 3, "title": "اختبار الوحدة الأولى — الجرد القرآني التطبيقي", "visible": true, "questions": [{"q": "ما موضوع مقرر الجرد القرآني التطبيقي؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 6, "courseId": 3, "title": "الاختبار النهائي — الجرد القرآني التطبيقي", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الجرد القرآني التطبيقي؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 7, "courseId": 4, "title": "اختبار الوحدة الأولى — القواعد الأربع", "visible": true, "questions": [{"q": "ما موضوع مقرر القواعد الأربع؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 8, "courseId": 4, "title": "الاختبار النهائي — القواعد الأربع", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر القواعد الأربع؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 9, "courseId": 5, "title": "اختبار الوحدة الأولى — نواقض الإسلام", "visible": true, "questions": [{"q": "ما موضوع مقرر نواقض الإسلام؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 10, "courseId": 5, "title": "الاختبار النهائي — نواقض الإسلام", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر نواقض الإسلام؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 11, "courseId": 6, "title": "اختبار الوحدة الأولى — الأصول الثلاثة وأدلتها", "visible": true, "questions": [{"q": "ما موضوع مقرر الأصول الثلاثة وأدلتها؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 12, "courseId": 6, "title": "الاختبار النهائي — الأصول الثلاثة وأدلتها", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الأصول الثلاثة وأدلتها؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 13, "courseId": 7, "title": "اختبار الوحدة الأولى — كشف الشبهات", "visible": true, "questions": [{"q": "ما موضوع مقرر كشف الشبهات؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 14, "courseId": 7, "title": "الاختبار النهائي — كشف الشبهات", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر كشف الشبهات؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 15, "courseId": 8, "title": "اختبار الوحدة الأولى — متن الآجرومية", "visible": true, "questions": [{"q": "ما موضوع مقرر متن الآجرومية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 16, "courseId": 8, "title": "الاختبار النهائي — متن الآجرومية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر متن الآجرومية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 17, "courseId": 9, "title": "اختبار الوحدة الأولى — التذكرة في علوم الحديث", "visible": true, "questions": [{"q": "ما موضوع مقرر التذكرة في علوم الحديث؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 18, "courseId": 9, "title": "الاختبار النهائي — التذكرة في علوم الحديث", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر التذكرة في علوم الحديث؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 19, "courseId": 10, "title": "اختبار الوحدة الأولى — الأرجوزة الميئية في السيرة", "visible": true, "questions": [{"q": "ما موضوع مقرر الأرجوزة الميئية في السيرة؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 20, "courseId": 10, "title": "الاختبار النهائي — الأرجوزة الميئية في السيرة", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الأرجوزة الميئية في السيرة؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 21, "courseId": 11, "title": "اختبار الوحدة الأولى — الرسالة اللطيفة في أصول الفقه", "visible": true, "questions": [{"q": "ما موضوع مقرر الرسالة اللطيفة في أصول الفقه؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 22, "courseId": 11, "title": "الاختبار النهائي — الرسالة اللطيفة في أصول الفقه", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الرسالة اللطيفة في أصول الفقه؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 23, "courseId": 12, "title": "اختبار الوحدة الأولى — الأربعون النووية", "visible": true, "questions": [{"q": "ما موضوع مقرر الأربعون النووية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 24, "courseId": 12, "title": "الاختبار النهائي — الأربعون النووية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الأربعون النووية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 25, "courseId": 13, "title": "اختبار الوحدة الأولى — مقدمات التفقه", "visible": true, "questions": [{"q": "ما موضوع مقرر مقدمات التفقه؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 26, "courseId": 13, "title": "الاختبار النهائي — مقدمات التفقه", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر مقدمات التفقه؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 27, "courseId": 14, "title": "اختبار الوحدة الأولى — متن الأخضري في العبادات", "visible": true, "questions": [{"q": "ما موضوع مقرر متن الأخضري في العبادات؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 28, "courseId": 14, "title": "الاختبار النهائي — متن الأخضري في العبادات", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر متن الأخضري في العبادات؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 29, "courseId": 15, "title": "اختبار الوحدة الأولى — متن العشماوية", "visible": true, "questions": [{"q": "ما موضوع مقرر متن العشماوية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 30, "courseId": 15, "title": "الاختبار النهائي — متن العشماوية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر متن العشماوية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 31, "courseId": 16, "title": "اختبار الوحدة الأولى — نظم ابن أبي كف", "visible": true, "questions": [{"q": "ما موضوع مقرر نظم ابن أبي كف؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 32, "courseId": 16, "title": "الاختبار النهائي — نظم ابن أبي كف", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر نظم ابن أبي كف؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 33, "courseId": 17, "title": "اختبار الوحدة الأولى — نظم المرشد المعين لابن عاشر", "visible": true, "questions": [{"q": "ما موضوع مقرر نظم المرشد المعين لابن عاشر؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 34, "courseId": 17, "title": "الاختبار النهائي — نظم المرشد المعين لابن عاشر", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر نظم المرشد المعين لابن عاشر؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 35, "courseId": 18, "title": "اختبار الوحدة الأولى — منظومة القواعد الفقهية", "visible": true, "questions": [{"q": "ما موضوع مقرر منظومة القواعد الفقهية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 36, "courseId": 18, "title": "الاختبار النهائي — منظومة القواعد الفقهية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر منظومة القواعد الفقهية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 37, "courseId": 19, "title": "اختبار الوحدة الأولى — مقدمة في أصول التفسير", "visible": true, "questions": [{"q": "ما موضوع مقرر مقدمة في أصول التفسير؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 38, "courseId": 19, "title": "الاختبار النهائي — مقدمة في أصول التفسير", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر مقدمة في أصول التفسير؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 39, "courseId": 20, "title": "اختبار الوحدة الأولى — كتاب التوحيد", "visible": true, "questions": [{"q": "ما موضوع مقرر كتاب التوحيد؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 40, "courseId": 20, "title": "الاختبار النهائي — كتاب التوحيد", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر كتاب التوحيد؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 41, "courseId": 21, "title": "اختبار الوحدة الأولى — القواعد السلفية في الأسماء والصفات", "visible": true, "questions": [{"q": "ما موضوع مقرر القواعد السلفية في الأسماء والصفات؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 42, "courseId": 21, "title": "الاختبار النهائي — القواعد السلفية في الأسماء والصفات", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر القواعد السلفية في الأسماء والصفات؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 43, "courseId": 22, "title": "اختبار الوحدة الأولى — العقيدة الواسطية", "visible": true, "questions": [{"q": "ما موضوع مقرر العقيدة الواسطية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 44, "courseId": 22, "title": "الاختبار النهائي — العقيدة الواسطية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر العقيدة الواسطية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 45, "courseId": 23, "title": "اختبار الوحدة الأولى — منظومة المقاصد للعصيمي", "visible": true, "questions": [{"q": "ما موضوع مقرر منظومة المقاصد للعصيمي؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 46, "courseId": 23, "title": "الاختبار النهائي — منظومة المقاصد للعصيمي", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر منظومة المقاصد للعصيمي؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 47, "courseId": 24, "title": "اختبار الوحدة الأولى — الآداب من الجامع لابن جزي", "visible": true, "questions": [{"q": "ما موضوع مقرر الآداب من الجامع لابن جزي؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 48, "courseId": 24, "title": "الاختبار النهائي — الآداب من الجامع لابن جزي", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الآداب من الجامع لابن جزي؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 49, "courseId": 25, "title": "اختبار الوحدة الأولى — السبل المرضية في السياسة الشرعية", "visible": true, "questions": [{"q": "ما موضوع مقرر السبل المرضية في السياسة الشرعية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 50, "courseId": 25, "title": "الاختبار النهائي — السبل المرضية في السياسة الشرعية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر السبل المرضية في السياسة الشرعية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 51, "courseId": 26, "title": "اختبار الوحدة الأولى — الأمر بالمعروف والنهي عن المنكر", "visible": true, "questions": [{"q": "ما موضوع مقرر الأمر بالمعروف والنهي عن المنكر؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 52, "courseId": 26, "title": "الاختبار النهائي — الأمر بالمعروف والنهي عن المنكر", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الأمر بالمعروف والنهي عن المنكر؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 53, "courseId": 27, "title": "اختبار الوحدة الأولى — آداب البحث والمناظرة", "visible": true, "questions": [{"q": "ما موضوع مقرر آداب البحث والمناظرة؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 54, "courseId": 27, "title": "الاختبار النهائي — آداب البحث والمناظرة", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر آداب البحث والمناظرة؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 55, "courseId": 28, "title": "اختبار الوحدة الأولى — الرد على المخالف", "visible": true, "questions": [{"q": "ما موضوع مقرر الرد على المخالف؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 56, "courseId": 28, "title": "الاختبار النهائي — الرد على المخالف", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الرد على المخالف؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 57, "courseId": 29, "title": "اختبار الوحدة الأولى — الحصانة الفكرية", "visible": true, "questions": [{"q": "ما موضوع مقرر الحصانة الفكرية؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 58, "courseId": 29, "title": "الاختبار النهائي — الحصانة الفكرية", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر الحصانة الفكرية؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}, {"id": 59, "courseId": 30, "title": "اختبار الوحدة الأولى — فقه الدعوة والتأثير", "visible": true, "questions": [{"q": "ما موضوع مقرر فقه الدعوة والتأثير؟", "options": ["دراسة علمية شرعية متخصصة", "دراسة لغوية فقط", "دراسة تاريخية", "دراسة فلسفية"], "answer": 0}, {"q": "ما الهدف الرئيسي من دراسة هذا المقرر؟", "options": ["التعمق في العلم الشرعي", "الحصول على شهادة", "التفوق على الآخرين", "ليس لهدف محدد"], "answer": 0}, {"q": "ما منهج المعهد في التدريس؟", "options": ["منهج أهل السنة والجماعة", "المنهج العقلاني", "المنهج الفلسفي", "المنهج الإلحادي"], "answer": 0}, {"q": "كم عدد الدروس في هذا المقرر؟", "options": ["20 درساً", "10 دروس", "5 دروس", "30 درساً"], "answer": 0}, {"q": "ما أول خطوة في طلب العلم؟", "options": ["الإخلاص لله", "حضور الدروس", "شراء الكتب", "البحث في الإنترنت"], "answer": 0}]}, {"id": 60, "courseId": 30, "title": "الاختبار النهائي — فقه الدعوة والتأثير", "visible": true, "questions": [{"q": "ما أبرز مباحث مقرر فقه الدعوة والتأثير؟", "options": ["المباحث الشرعية الأساسية", "المباحث الرياضية", "المباحث الأدبية", "المباحث الطبية"], "answer": 0}, {"q": "ما الفرق بين العلم النافع وغير النافع؟", "options": ["ما أورث خشية الله وما لا يورثها", "ما يُدرَّس في الجامعة فقط", "ما ينفع في الدنيا فقط", "لا فرق بينهما"], "answer": 0}, {"q": "ما حكم طلب العلم الشرعي؟", "options": ["فرض كفاية وبعضه فرض عين", "مستحب فقط", "مباح", "واجب على العلماء فقط"], "answer": 0}, {"q": "من أبرز العلماء المعتمدين في هذا المقرر؟", "options": ["علماء أهل السنة المعتمدون", "علماء المتكلمين", "الفلاسفة", "الصوفية فقط"], "answer": 0}, {"q": "ما المنهج الصحيح في التلقي عن العلماء؟", "options": ["التلقي المباشر مع الضبط والإتقان", "القراءة المنفردة فقط", "الاعتماد على الإنترنت", "السماع دون تدوين"], "answer": 0}]}],
  questions: LS("ti_questions") || [],
  notifications: LS("ti_notifications") || [],
  siteConfig: LS("ti_config") || {
    introVideo:"https://www.youtube.com/embed/z1bbUyoasaE",
    aboutText:"معهد التأصيل العلمي منصة تعليمية متخصصة في نشر العلوم الشرعية وفق منهج أهل السنة والجماعة، يجمع بين الأصالة في المنهج والحداثة في الأسلوب.\n\nتأسس المعهد بهدف إيصال العلم الشرعي الأصيل إلى طلاب العلم في كل مكان عبر منصة رقمية متكاملة تعتمد المتون الكلاسيكية مع الشرح المبسّط.",
    studyPlan:[
      {
        level:"المرحلة التمهيدية",
        color:"#b8965e",
        stages:[{
          name:"كتب المرحلة التمهيدية",
          books:[
            "كتاب المدخل إلى طلب العلم",
            "كتاب تذكرة السامع والمتكلم",
            "كتاب للجرد يختاره الشيخ (تطبيق عملي)"
          ]
        }]
      },
      {
        level:"مقررات المستوى الأول",
        color:"#3B1B40",
        stages:[
          {
            name:"المرحلة الأولى — العقيدة والتوحيد",
            books:[
              "القواعد الأربع",
              "نواقض الإسلام",
              "الأصول الثلاثة وأدلتها",
              "كشف الشبهات"
            ]
          },
          {
            name:"المرحلة الثانية — علوم الآلة والسنة",
            books:[
              "متن الآجرومية (النحو)",
              "متن التذكرة في علوم الحديث لابن الملقن",
              "الأرجوزة الميئية في السيرة النبوية",
              "الرسالة اللطيفة في أصول الفقه (للسعدي)",
              "الأربعون النووية مع زيادات ابن رجب"
            ]
          },
          {
            name:"المرحلة الثالثة — الفقه المالكي وأصوله وقواعده",
            books:[
              "مقدمات التفقه (رد السفاريني، ابن رجب، أقوال ابن تيمية)",
              "متن الأخضري (العبادات)",
              "متن العشماوية (قراءة سريعة)",
              "نظم ابن أبي كف (أدلة المذهب)",
              "نظم المرشد المعين لابن عاشر (دراسة نقدية)",
              "منظومة ابن سند في القواعد الفقهية"
            ]
          },
          {
            name:"المرحلة الرابعة — أصول التفسير والعقيدة",
            books:[
              "مقدمة في أصول التفسير لابن تيمية",
              "كتاب التوحيد (للشيخ محمد بن عبد الوهاب)",
              "القواعد والضوابط السلفية في الأسماء والصفات",
              "العقيدة الواسطية لابن تيمية"
            ]
          },
          {
            name:"المرحلة الخامسة — المقاصد والآداب والسياسة الشرعية",
            books:[
              "منظومة تبصرة القاصد في علم المقاصد (للشيخ العصيمي)",
              "كتاب الجامع من القوانين الفقهية لابن جزي (الآداب)",
              "منظومة السبل المرضية في السياسة الشرعية (لحافظ الحكمي)"
            ]
          },
          {
            name:"المرحلة السادسة — فقه الدعوة والمناظرة والحصانة",
            books:[
              "رسالة الأمر بالمعروف والنهي عن المنكر لابن تيمية",
              "متن آداب البحث والمناظرة (لطاشكبري زاده)",
              "متن الرد على المخالف",
              "متن الحصانة الفكرية"
            ]
          }
        ]
      }
    ],
    contactEmail:"info@taaseel.edu",
    contactTelegram:"@TaaseelInstitute",
    contactPhone:"+966 50 000 0000",
    sheikhChannel:"",
    privateChannel:"",
    team:[],
  },
  currentCourse: null,
  currentLesson: null,
  activePage: "dashboard",
  schedule: LS("ti_schedule")||{},
  schedulePeriods: LS("ti_schedule_periods")||["الفجر","الضحى","العصر","المغرب","العشاء"],
};

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
    // ── حفظ بيانات المشرف إذا اختار "تذكرني" ──
    if(document.getElementById("al-remember")?.checked){
      try{ localStorage.setItem("ti_admin_rm", btoa(JSON.stringify({e:email,p:pass,ts:Date.now()}))); }catch(_){}
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
  // عند تسجيل الخروج اليدوي — احذف التذكر
  localStorage.removeItem(RM_KEY);
  APP.user=null;
  _adminSessionEmail = "";
  _adminSessionPass  = "";
  try{ await FB_AUTH.signOut(); }catch(e){}
  document.getElementById("app-wrapper").style.display="none";
  document.getElementById("nb-admin").style.display="none";
  document.getElementById("nb-admin-qa").style.display="none";
  document.getElementById("admin-badge").style.display="none";
  // الانتقال للصفحة المطلوبة
  const _targetPage = window._PAGE_TARGET || "landing";
  // استدعاء showPage مباشرة بدون redirect (نحن بالفعل في الملف الصحيح)
  const _publicPages = ["landing","about-public","login"];
  if(_publicPages.includes(_targetPage)){
    document.getElementById("public-wrapper").style.display = "";
    document.getElementById("app-wrapper").style.display = "none";
    document.querySelectorAll("#public-wrapper .page").forEach(p=>p.classList.remove("active"));
    const _el = document.getElementById("page-" + _targetPage);
    if(_el){ _el.classList.add("active"); }
    if(_targetPage==="landing") renderPublicPlan();
    if(_targetPage==="about-public") renderAboutPublic();
    updatePubNav();
  } else {
    // App pages — login check happens via auth state
    window._PENDING_NAV = _targetPage;
  }
  toast("تم تسجيل الخروج بنجاح","info");
}

// ── Delete student account (self) ──
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

window.addEventListener("DOMContentLoaded", async ()=>{
  // ── استعادة الصفحة المستهدفة من sessionStorage ──
  const _storedTarget = sessionStorage.getItem("_navTarget");
  if(_storedTarget){
    sessionStorage.removeItem("_navTarget");
    window._PAGE_TARGET = window._PAGE_TARGET || _storedTarget;
  }
  // تفعيل روابط التنقل
  setTimeout(_injectPageLinks, 100);

  // ── تسجيل دخول تلقائي للمشرف إذا كان "تذكرني" مفعلاً ──
  const currentFile = _getCurrentFile();
  if(currentFile === "login" || currentFile === "landing"){
    tryAutoAdminLogin();
  }


  // ── إصلاح الخطة الدراسية إذا كانت بالصيغة القديمة (courses بدل stages) ──
  const plan = APP.siteConfig.studyPlan||[];
  const hasOldFormat = plan.length>0 && plan.every(l=>!l.stages && l.courses);
  if(hasOldFormat || plan.length===0){
    // أعد تحميل الخطة الافتراضية الجديدة
    APP.siteConfig.studyPlan = _defaultStudyPlan();
    SS("ti_config", APP.siteConfig);
  }

  // إصلاح روابط YouTube في البيانات المحفوظة عند كل تشغيل
  APP.courses = _fixYtUrls(APP.courses);

  lucide.createIcons();

  // إذا كان المستخدم قادماً من redirect Google/Apple — أظهر شاشة انتظار
  const pendingSocial = sessionStorage.getItem("_pendingSocial");
  if(pendingSocial){
    document.getElementById("public-wrapper").style.display="none";
    document.getElementById("app-wrapper").style.display="none";
    const overlay=document.createElement("div");
    overlay.id="redirect-overlay";
    overlay.style.cssText="position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:16px";
    overlay.innerHTML=`
      <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--purple-l));display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(59,27,64,.3)">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD+CAYAAACA/DjlAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAAHsEAAB7BAcNpVFMAAAAHdElNRQfqAw4TDQvgaCVLAACAAElEQVR42uydd5xcV3n+n3PunV63996bykpadcmybEmW3A3GYHoNBJJAEkhCCO1HgAQSElIgtBCMC8Xdsnrv2tX23vv03m85vz/u7Eqy3C1ZtjRff9aytTNzz9w795lz3vO87wukSJHipoMxBp7nMTM7U7t3797//dWvfjW/f//+rzPGyNDQ0PUe3ivCX+8BpEiR4u1lfs6BaCRhOnLk+MPPPPXsF46fOFbPGMN73vOeegA0kUhI13uMr0RKsFKkuElIJOLo7e2HKMfrDx48+M29e/fdffLkCbXJrMcDDzzQX1tb+z979+6VampqrvdQU6RIcTMTCPjBGFN3d3ft+vnPf956zz33s8KCUrZxwy3s3//933s7OztbfvOb34Axdr2HmiJFipuZgD8Mxpj23Nm2P/n+9//Zu27dBpafV8RWNK9m//ajH88MDg7d89xzL6TEKkWKFNeX2dlZMMY0Rw4f/+uv/t03Y02NK1hmRh6rrqpn//id73s6O7s/sGnDVkjSOzZslSJFihsdxhj6+nrh8/vSdu/e/Z3PffYLkfLSJpZuLWQlxTXs83/6xfDJE2c+yRijoVD4eg83RYoUNzMDfZOwzfkLfv+7Z5/84MMfE0tLalhedhUrzK9hH/voZ8UXnt/3L4wx7dTk3PUeaooUKW5menvG4HIGMp9+8sCTD733M6wwr4FlpZez/Nwq9p77P8yee3b/Y7GolDYz7bjeQ02RIsXNzMzMPILBcNbuFw4+9vD7PysW5DaxrPQqlplextavvZ39+ldPtM/NuMsG+sev91DfFPR6DyBFihRXB78vgoKCXNLR3v3Z557b/b6TJ05z0WgUsiwhPc2Kbdtvd69cteKrTz71zHhRYf71Hu6bImUcTZHiBoAxhqNHTiMzM2PTieNn/vTQweMkGAiDUg5qNY+Nm9aLW7fe8n/1DRX7cnOzYDBprveQU6RIcbMyNj4Gp9NR83+/fvTsxnV3sKz0GpaVVsey0+vYbVvuY48/+swfGGPmqUnbu9pvlVoSpkjxLsft9qOstEzX1dX/1b1797cMDY1BkmQwJiErJx3bt9823dy8/PtnT3cHiktyQQi53kN+06SWhClSvIthjOH8uS44TKZbTx4/e/+pE62QJBkcB/Aqhg0bV7J1G1b9uLq2+Hw0Ervew33LpGZYKVK8ixkcGMWSJXWmtra2zxw6dMQQDkfAmAxCGGpqqrBly+bjy5Yt+b+ZaRt0eu31Hu5bJiVYKVK8S/G4A6itq8SpU+c+fOzoiR0DA0OQJAZAhsGgw6ZNG+YaGxv+4cSJM/bCotzrPdyrQkqwUqR4lzIzM4uZaXtRe3vHZ8+ePa+SJQJZlkE5gpWrmrFhw7rdDY3Vxxsb6673UK8aKcFKkeJdiNvtxZKldeju7v7kmTPnGmw2B2SZgeN4ZGVl4pZbNk00NjX8eKB/VC4ozLnew71qpAQrRYp3IeNjkxgfm2rs6ur+UFdHDyQJYAxgTEJtXTkaGmsfyS/I6qqsLLveQ72qpHYJU6R4l+FyuZGRka7av+/wl86eOV/mdHoBxoFXURgMGjSvWOIoKc3/Y09PD1Rq7noP96qSEqwUKd5FMMbQ1toBr9fXcu7c+Xs6OroBUMiMQZYlVFbVoKGh4cXS0tJet9t9vYd71UktCVOkeBfhcDiwYuUy1ejo2CdPnjydHg5HoVKpQQiD3qBB84plgeLikl8ePXpCyMzMvN7DveqkZlgpUryLcLvdCIfDTZ2dnXcODo4ikZDAUQ6EMJSWFmHlqhVnm5uXts/MzF/voV4TUjOsFCneJdhsNtTX12NoaGjL+XPnM4L+EAgomCxDpeJRW1eN4uLCJ3//u6eCeXk3hu/qpaQEK0WKdwnhUBzhUDxzYnz64YH+ESLLFBzlwSAjMzMdy5YtGy4vL39xefNy8PyNeWunloQpUrxLsM07EAyGl/f0DNU67D6AcSAcBQVDRWUZKiuqdmdmpk3znOp6D/WacWPKcIoUNxgupw/rNqxUT03NPNzb06eTZBmEAIQw6PQ61NTW+HPzch49c7pdTks3Xe/hXjNSM6wUKd4FOJ0eJBJS/tDg8KaZmTkAFIQAkiTAak1DbU2VvaysZNbj8V7voV5TUjOsFCne4TDGMDE+hampmdUDA0PFgWSwHUSGzEQUFeUjLz/3pNGkmddq1dd7uNeUlGClSPEOx+0KYMfOzWq3y333xPgkJwgSAALGZHAcRXFJEXJyss/u3XNIzsnNuN7DvaakloQpUrzDCfiDYAyFI6OjG8cnJkEIB4CAEAqDQY2ysiJbfn7OCYvFeL2Hes1JCVaKFO9wZufmYI1YV42OjOUFg2EgWZKdAcjJyUJBYe6F3LzsUa/Xc72Hes1JLQlTpHgH43EHsXFTC+bn5jZMTk7wsiRBlmUwBoAxFBYVori4ZCg7oywWjyeu93CvOSnBSpHiHUwikQBjzDBvm186NTUNWZZByMXbNjMjU0qzpp995rknkJt7Y7rbLyW1JEyR4h1MMBgEIch3OBylgYAfAEA5CjACnldBp9MFGTCoJEC/e7vhvF5SgpUixTsYm20eoVBw1dTUVEEkElVEiQGEADq9DmazOWQ2mYMRLnK9h/q2kFoSpkjxDiUeiWGgbwCz0zNp0xPTNBEVQRkPyAAYg1rNgePojNFosHk8N37AHUgJVooU71g8bg8+9ScfgxCPL/W4vIBMQZkKlFGAMfA8hTXNgoxMK9LT06/3cN8WUoKVIsU7FJ1WB8aY0e12VXm9HnCUA8BAKQEYA+U4mM0WAIDJfOPmD15KSrBSpHiHEovHIETipnA4XJhIJEApVewMIAAB1Go1jAYDAECv013v4b4tpAQrRYp3KLF4DG6vpzQSieQIggDG2OLvKKHQabUQJWkCQIzSm+NWvjneZYoU70LcbjfcbrfZ6XRqYrG4YhhN2twZGHieh5AQ5h6478NiWrr5eg/3bSElWClSvEOx2RwQJKkpEIioRYFBlgkooQAYwBhEUYRKrc7841P/R73e4PUe7ttCSrBSpHiH4nZ7EQlHjeFQFIwp5ZAp5cCSLb0SiQQ4jlYD0AuCcL2H+7aQMo6muClhTAJAiZzwpkmJcCVjcqUso5/Xmsd5jTUMMOHSFJjrQSgUQigcQjQWBWMMhACyLENmMhhjiMfjCAYDAIBI5OYwjqYEK8VNh5yYA2RXdtDv/Zhzfu49AZejSojHjBIjfr01fSIjJ2/IYs34+dxU28G8oubrlvISi8WRSCQgiiIAgEAZByUUoBwSgoBgMAQACCX/vNFJCVaKmwop4QBRZZGAu+8vJ0d7vzw12ImYxwkICTCVJp0YzekzM/nNdY0tJaWlNZ2RwLTreo01HAohEo5ASAighIAQAllm4DgKQjkIiQQkSUzz+0MWg0F3UyhWSrBS3DQwFodvZhAafXjTzNjoR4e6z0AOzsMgi+CYBJmpEI6E4ZdFxKL1pZIoZhGG6yZYPr8P/oAf8XgclCrudmW2x8AYQyIhQJKknEQinkkonb3e5/ftICVYKW4a5Kgd1sIiq2O89+8nhruzY8EA1JQiQVUAoRBlBpkypGfkwWhO/y2vzxlC5KIOyEIMhNfQkGu2TkjEl6nUqgOyLNstOaXXZLyBQBDBQAiJhAAGGYQIIOBAKIUsAaLA4PeF4PMGEYvFrvfpfVtICVaKm4ZoNAZelOvsLnuLLxRCWm4lMjMtCb1eL8Xjcc5ud6gj0Rgy8qr6dZbcX8/bRqT8vCowJmPyyM8ghF3FXpf7A7Nzc5+JxRMl5VU1XwkFA/98rcYbi8WREBJIJOKQJAGUMhAwMMaDyQyiyBAIhLlQKKyPRKLX+/S+LaQEK8VNQTAwj9mZIej0xmKH168vrmqIlpZU/9psNj1nNBr80UgsK9MTfCASjWYaTNb/cc1M9BRUNiI+dwGIObPN5SsfmBpo/fTs9NQym8MDfVouisorVLH4tRGKQCCAmvImLGteolEaTrCk051BkiQQovxdKBQyMSYv8/v9p4OBEEzmG7uue0qwUtwUqChBdd0m/WD/0Q9Fo36+pLBuviC/4BGizb8AQDZoETek41kABJA1kKNWFgkVxaBbMTPU9cnp8b417tkRLh5LgPFm5ORmhQ0G3RmNOueajXnOOcE/8djvy7RarZJHKMsA4ZTkZxBITIbL5UQsFl25687b4Hbd+CVmUoKV4qZATITBUVtG1G+vD9iHMZ0IFQmewB/UetOcWq2yMUkYY2AgIFTFc7ViLJ4uJISCoN+dbp8b4ULBOTBJgAQ90nNzkVNQ8Mf0nMKz0aD7mo35Iw9/Urz1ts0jOr0OlFJIyaA7IQQyYyAAfF4f5m3zOsYYGR+fZG/5oO9wUoKV4qYgGvYjEQuXR/yOXC7qgi/gQXB2Kpdqtbk8z1/mtaKSACYKEAUJopwASBwcTUDktbBmF6NmybK+7Lz8bwU9U2FTeuU1Ga/ZbMY3v/aP0Op0IsdxSeMoAaUEjAFMlsEo4PX5YLfZcwHodTpd+Hqf52tNSrBS3BSEvV4YTNb6RDCiUzMCAx+HJMchRnkIAJB0jxMCEEJBGQBJAmUEkkqHqGSGpbCWlTes3F9QVvl1XlM0Nm+fh+gLGsfHJ5dxHJ0XEsJoRWX5VRuzwWCATqsHz6kARkFAwRgFJRwYIWBMRNAXRMgXXWqbcdVGI/G2632erzWpXMIUNwXRSAyyTHJicQZZ1kCmHGRIYEgAEECJBBUFeMZAZQmUyCCUQiQqiLwVRbXr0LTq1sczS+o+6A0LZ6Ym55hOZSxpa73wy+efeWFvd2f3t8orylTT0zNXbcxmixUmkwk6nV4RUcopsytGQEDAUQ6yIGFuds5in3eUz0zPXe/TfM1JCVaKm4K0rFzwGu2AKS1bSlAjAqIecaIFoyqA8GASB0g8qKwGx3jIIoFIdIAhF0W1LZHqppZ/zyso+QsdRKdzTIBK5opPHD75k6cef+q9z/7+Wf344Hg5AE3Yf/VWZVaLBSaTSVIEiyQL+LFk8rMyIxQlEXNzc5zP7206feo0IsEb296QWhKmuCmwZmSD4/nzpVWN50DJao9jlgpRN5gcBQGg0jDI8TikhACOUggMYJpMlDWu9eaX130vq7DhR0Lck+hv8yM7P2vl+dNt//LsU89tbG/tACVAyBvOsY3bM6lIr1qKTFZWFiCTbo1GI1JKeVlWhIpyAEAgyxJkJsFms8Hv9y/98tf+Qu2yuW/obqopwUpxU6A252F+6MRoVkH1e3RG4z3hUHB9OOApIVI8S6uihYmg2zA22ImY5IFA1NBlFiC/aulgflnNX6UX1O+R4n7xqV+ewNqtLZuOHz31b3uf27ust6MPiBEwMER90ayIP1oYjyQmrtaYc3JyoFKrg2lpVpnjecgJ8bLfMyX6Do/bA5ttviHsi+TEY/Hp632uryUpwUpxU0Dp4kd9jjH5v9OBnwNEBTGQJgQ935gc7vxkRKKQ1ToUFtcIBeVLz2cUlP2tb7LrmJBWDZXewje01H94/77DX9v97O7S8b4xqGQVtEQFmUkQoqKRyaxOSkgnrtaY9Xo99Hr9rNFocqtUfF4iLoBSZWZFKAUlFLJMEA6HMTE+YZ2ankqPRKIpwUqR4kYiWedKEP0zAserat32ue3DA4OAKgNFNWscpaWl38kuKPmN4HN5jUW3Q6Xnua5T3Z85fvTsd599+kWTY9YOKnKQJCUIzDgZ3oAXLo9La5+zI+AJwpz+1rvYqFU8sjItdq2OzqrULI8hAUpVYIyBoyTpGiOIJ+KYmprK8Ho8d62/ZX1nyBeC0XpjOt5TQfcUNy1zDjdsHn/j0NhkAa81o25JS2tx1fKHsstW/WdENnoT+nKYMvV8R2v3nxw4dPC7f/zDkybbnA2yKCvdl5PdayQmIRAMQJCFZfd85C4I8atT/ZNSGVDBp9drRvR6DRikZBK0sgyVZQbGAFlmGBkdxdzc/F2MMXP4Bi7mlxKsFDctEZEiIfNaS3bJaP3yNT+tqK5/T2Ks+zAQl4gIGIxarqez79NtFy58d2R8zCTKIkRJUISDSaBUye2TZRmxeAzhcFjHGCOx6NWpnJBICCCEsNzcPGdaWhqUQLsMAItixWSAEh5ulxdDg0OFk6NT+S7ndauIc81JLQlT3LSkZeaCgPzGWpX2jMlocCfiUbF4031IRGPQGfXcQHffZ44cPPS9uXmbcceunR4i8enHD50EFQECBkIYiCyDAJAkGdGYYikQpKszwyoqL8QTj/weZrOpNzMrE4QAIET5EwSE8AAIABnhcBTDw2PZNptj3b49ewf8njAs6YbrfYqvOqkZVoqblpysLGRnZUYt1jQ75dWi1mBBJBaBWqelI0NDHzh5/MR3uy60m5Y0No0sb17+3aKSohjPUxDKlB8iA0QGwCAICYSCQQIABoP+qoyPEILi4iLk5+fLuTm54DgumUuoBNwpOMX1LhMICRHj45O83eb48Ne+/VVTNHpjZumkBCtFiiRMYti3bx8GBwd3Hjp4+If7Xtxjrquu8a5sbv5eTn7OU+kZaQ61mockiUi2YAZL/hOPxUEorQJg5VRXb+GSlZ2NjMyM3ty8XL9Op1MEiyoJ0EjOtADF/T41NYPOzq668ZHpYtcNWrkhJVgpUiQZGZvAmtUbmgcu9P3wwFN7siwGC1asWvVoZVPVr9VqzKp0fL8xzQhKVSBMBUkikAgAykMUZQiCYI5HE+pYLH7VxmQw65BbmNOXnp02pDfrwSiDKEsQWTKtiAgghEGlUiEWTaCvbyR7ZGRyw7mz7df7dF4TUoKV4qaHMYbx/jFkma1FrafOfueFZ56vlgUZmzff0lVTW/uvQ+39EoB4Rla622QxgRIKwigYKBgIOI6HLDFEI1FEozFcraA7AOgMGgDwW6yW9rT0NDACSEwGIwCIEvRnUDrpMJlgdGQU09Ozuz72qYf0UxPO631qrzopwUpx0+OctKO0qszQdaHzuwef37tjaGgYLRvWCStaVv2wq717tKiiBN/+2veYXqfvNRgMyUXgAkpunyRLiCcSkCQJoiS+hdFcjtWSjueefZGVFJecqaysXMwnJIQAjIIxDmAUskwBRmGzOTE8Mrylr3dsnc02f71P7VUnJVgpbmpCvjCySnJI6+m2zx7Yd/DBsyfPIr+gCI3Llz1bu6L+qRUtK6G3GLB+4zpYLBan1ZoGSqkSSwJwcY6jzNQkSYQkSVd1jLW1tSgsLJqrrKiIazQacBwHZYpFAUZAoFRxkBkQjwvo6Og0jo4O72xZswTRqzjbeyeQEqwUNy1BbwC7n30RA50D954+dfqvjx0/qYoKIuqWNEZLq8t/c+bUhWBGUQYAwGyyQK/TD2ZmZITVarXyApf1V10Ifl/9ceoNehQU5F/Iyc3rsVqtICBJiaQXf5IzLcaAiYlxjI+Pb/N4vEXz87brfZqvKinBSnHT4p51YfttW/MvnG376r4X92d7fH4UV5ajvKr6kfrGqhdz8/MWH5uWboHFavZnZmYIarUKjCXd7osCpfzHtWgSrVZpQDm48vPyzuXm5iq5hFDquisNKhYOSkBAEQyE0Nvb29DT3XPP8WMnks0rbgxSgpXipiTiDKCkoYwf6h/6wrkT51bMjM2CMIrGJY1i49L63WdPtSfKyvIXH68zqmFON4SNVl1IyaOWQBgDYQBhih+LUgIVz0N1FW0NAJCdk4bdLxxgBqP+6YLC3BjlaFIY5WS6jghCGCgFKGEQ4wIunOtAX9fAfe9/8H2WscGJ6326rxopwUpxU9LfN4DJgfHbzree/0x7WwdkQUZhfj6WNy8brKgo6ygpLbrs8RqtBmaTeZZX8f1qNY8FGxQBAWMyKKXQaNRQqVVQq1RXfbw1NdWora2erK2pchuMekiSBErJ4g8hC2ZWgDAC27wd/X2DGwf6B97X0d55vU/3VSMlWCluOmzzdjRvWmXp6x/46yOHj6UFgiEYDHqsW79WqKmq+uHvfvn4RGZGxmXP4SgHQkiUSWxMrdFctsxijIHjKLRaLVQqNVQLMa6riMlkRHZO+nRFZUVHZkYaZFlcrDoqy/LCghSMEciMQEhI6OjoUvX19n/g/gfvSZubujFiWSnBSnFTEQqFMDA4gMHBwTvaLlxYPz42BQKKouJiLF2y5Hh9Xe0zu+7dCZX28lsjWZpYV1hUWKlRq7EwxWKMgckMHOWg0+kEjU4tazSaqz7u7Jx0PPmHFyLp6WmPl5WVMI4jkJl8WbefBUhy93BsbAJnz7Vu6Grvfk97WzuC3qtWDPW6kRKsFDcVNpsNDQ11Je3t7X91+sw5TSwmgoBDbU2NVFpS8rPTh894crKyr3heMo8vCkaGNFoNXioTvIqHkBAGAHgpufq3FSEEVVWVKCku7qytq3XpDbrF7s8XRYsBIKCEA6UchISI06fOchfaOt63Y+d2i9v97k/XSQlWipsG96wXD3/wA+jvGfzEkYNHV0yNT0OWGYwWE8qrK0ZLSkvPlleUgxivnLVYrBb8+ce+BMZYlCpF1bFoZSAMPM9Dq9XFAUhux7Up75KWbkV5ZdFETU1lX35+Nghhi+VmFlqAKTW6CAjhQEAxOzOHk6dObzp+7OSH/uTjn4HHFbzel+EtkRKsFDcN4UAY+58+VDTeN3XfSMcEuBgHIjNY88zIKEtvNebrJ/W5r1xpgfAcKM+BcBSMEhBe+ZMRQG/SIS3TCgAwmK5NWReLxYh//MfvByuri/fUN1WA45QSN2AEYDyIrAGTVcnlqwyAQhBEtJ5vV3V29Xzufx//Vd3M9AQE4d1rJk0JVoqbAjEh4snHn8HE+MSD/d39jV6HDyqiAs/zyM3PhTXT2vHEY7+XeT33yi+idFm9aLZajGPJsKRZYTAYhv/hi19nGt3Vj2EBgNlixHvfez/Kyop/t3JF84Q1zQx2SRyLQSn/rCwVlRpdsgQ47E6cPHmqrru358tNyxp5n+/dG8tKCVaKmwL3nBuf/PxHakaGhz/T3tYOWZABEGjUGpSXl0fy8/I7GxobYNK+ci30i7KwkI6jxIx4lQoZ6Rmy2WQeuPPeO5GWmXbN3kdmZiaysrJnKisrjxQXF4JygMxEgMggRAaDDCYrS0SO8gDhICQknD/XhhPHztzT3z9y+7mzFxCLXr18x7eTlGCluCkYHxnH9OTUyu7Ongq30wOOqCAJMswWMwoLigZKS0svZKRnvvqLEKUkMRggS7JSphhKaReL2ew3G8396db0a/o+jEYT9jy3P2EymP6zaUmja6HWOyGy4sUiAMBBubWVDtGE8AiHYjh69FRad1f/391yy5ZMm+3dWckhJVgpbnj8Ni9Wb12tdtgdO0eHRikTGYhMIEsyMjIykJeTe4jjiMugf+X4lTcWRDgYhiRfrMYgyxIkSYJOp4PRYJxKz0if4fmr53IXhAQEUeAFUTAzxghjDGq1Cg2NDVi9fmXfqpUr2gqLCgBIii+LiYuxK8YWcgwpSLId2MjwJE6eOLOmq6v3gds23w/3uzAAnxKsFDc8Po8frklHzfjI+NbpiRlIggxZksHxHMxmo6jX6k7tf/IQLK/SmovGZfz0t/+hoRQ18VgMNGkp4DgKS7oZ+cX5Tn2GLqzTX53yyD6fDyqVGj1dPZ8+fuT4i4N9g5s7LyiO9aKyfOx//nCkuqbq1ytXNie0WjUIBShdCKtdmjuo+PEp4RAJx3Dk8DG+rbX1a0eOP93iuka7mdeSlGCluKFhjOHYwaOYHJ/Y0tvZmxP2hJXiexwDU0mgGuL1B30Dkfir10CPK2VaVCF/ICMRjYJABpMSIESEKUcPS76pd+eOnVFz2lvvRwgA0WgUjDGur7d/4+G9R9Z5HZ4df/elryHo9oMQgrqGGjQ21r+4vHnpyaKiAjAmgkEGiJSsQiqCQVqsKEEIAWWAfW4OB/buL+jp6vpUdV0p75h7dy0NU4KV4obGPmXDQ5/4QPb0zOwH+3sHIQqSUjGUApSjyMnNIWXlJbS4pOhVX0cSJERDkbSAL5ARj8aU3TmOgPAEOfnZLDMnc/izf/pZ6NN0V2Xc4XAYkiwaHXZH6fDQCFxOd9MLR55VC6KyHLVYzXj2med9S5Y0/aZ55fIor+YgyQIYk5QSEosFHJSNAQICjioO+I72Thw/fuK+/u6BrY8/9gRioatX0vlak2rzleKGZn7OCY/HXzkwMFLvdvkAcElbAgPHccjLy9Xm5ednvFZZ43g4hoCM9IDXnxWPJUAoBWMy9CYDqqqq57Kys/YZDVev27IkSZidmV0dioSXOJ1uOJyuqng4nhlPJOYAwJxuwuzkHPIL8p7euHH9p7u7etcM9I8ky95wWCx3k2z2Cqb0L5QhIhKO4tDBIxmNjfX/8vAHP3CX3WYfu97X6fWSmmGluGFhjGF8fAYul79xYmLWEI/JoESl9BGURRhNBhgMxnGT2TjwWoWsQr4wIoFYsdvu0ccjMaUbIJGQmZuOsrLS0wV5BdNZmVlXbexOpxMulzvT7XLpvd4AbPN2i23Onu7z+BcfYzGb8Y1/+I63qqryP1aubI7odGqAyQt5j5fXwSLJWFayNdjk5DT27tlf19c38OHiiiISDb87zKQpwUpxw+L1BHDf++/gfP7AOrvNA0lSjJWKoVKEyWRERkaGAxr4X02vYp4o5qfn4XV5izxOj1oWGShHodKqUVFdgayszEOHnjsQs1gtV23s3d3diMfjBX5/ALFoDC6XO8PpcFY5LwmUG9OM+OjHPoRlq5Y81bxi+dGi4kJIySoOABYNpUognoAxpWkGIRxEQUJr6wVyvrX188PDI3efPXtWWU6+w0kJVoobFkkUwWRkB4OBNV63N5lvpyyWZDDwGhX0RiXmxKtfuYaVw+7C7e/dBtu8fen8jA0AgSTLsKZbUNNQO1RSWryvorryZSsnvFm+881/BEe4ykRMAJOA6ckZzu32bN1423ou5Lu4QZCdnYU9zx2I1DfU/XZVS3OCVxPFSLq4U6g0q1Bqv18ULkJ4eNx+vLh7X0ZvT99fbN6yyWqbf+cnR6cEK8UNi8fhw/TYbOHMxFR20O9bjENzPA/Cq8Ab1CBaOgNAoOpXvhXUGi2YwCzTk7O1LrsHhHEQJRnltZWoaap9MSM/a9SUYb6qYw/Z4xAjMuQIQERgfnoe9ln7fV6br9rjvCgsBoseS1c2YemKxheaVy89UFlTAo6XAYgQRSEpViooZlIGxgACHoSpkYgRDPSN49DBUxuOHT37oe3b7kM49M52wKcEK8UNy0D/AMbHJyonJiasQjyh2NRlWdkx4zhotVqAkolf/uI3suVV7AhTU1Po7xm+bX5+fnUwGIJMZGTmZGDV6lXOioqKx0b7x5CRlfEGRvbaRFkUkiBCEERQUERDUQwNDOXNzc6unp6cBktcjE/l5WXj6NGjvvr6uh/cunWLz2o1Q2ZSMiy3kEKEl2maQRGJxHD40BG+vb3zL5997nfNg4ND7+ga8CnBSnHDcujQYSSExFKf10coLu72EwAcKLRqDfR6fcJseuXZkWvOg5ZbVmBmZmbT6OiYRpQFUC3BkpYm1DfW/TanMLstO+vqBdsXUEGleKcIBU94MBEYGRoh05PTG9ZtXUuD/osudUIo6urqsGzZsrNrVq/ZW1NTCUIZKMcAIkNZAMuLQiTLMmRZBs/zoITCZnPgyOGjJX29/X+/vLnO7HL6rvele0VSgpXihiTqj+PwocMIBoLaeDQKIjNwIKAyQGUAkgxKiBCNRrvM5leeXdnsDkyPz68aGhq6b3pqBpSjyC3JwYbb1o9X1lX+cnpsRjRlXh2z6KWYDRZwPA+1Sg0KDkwCpsanMTE6fpdtYn6Dw2a/7PHZ2dnoauuO1NXU/njd+rU+k8kAxqSkeVQGSVZHlWWlugNN2uIpxwHg0NrajkOHj9zVer7zfbt370Ui/s4MwKcEK8UNSTgcQedgq04QhMZQKATCACbJIIyBsuQHn4GJghB9pWB5KBBFw7IaMjo2+uHzra1FAX8Aao0GK9euEKvqK//x57/4WXdOQc41GX9LyyqoeD6mUqkgiwyUUQT9YbS1XsgeGxl7oKKxkgScFy0OhBCUlpehtLLkXNOSxv9rbKwH5QgI5KRgsUWhIoQkNwiUmBYYQTgUxYH9B/lTp878+bp1LVWdnd3vyKVhSrBS3JCIooCwN1oYjURrYuEYKOFBkEwEhrJIAgBZBmT55W9Mr8ODqD9eONQ3uGV4YAiEB1aua8aGTRt+V1Zd9ocPf/zD0GivfsMJAPj0n30CIhM79EYdKFM64fCUw+DAMPr7B+51z7lqvR7vZc+xpJvQ3z0oLFmy5H+27bh9Kjc/BzJksOQ/lFJwHJ/0aCVNpYyAyQxqXg3bvAMH9h1o6Gzv/srKVUu1zrl33q5hSrBS3JAEAwF4PW69x+EyxsMCZImCgYcECpEAIgUYx/M6nSknkbhSsEKeMAor8lVd7Z2f677Q1RDxhVFYmYd129e0Llu57G8ds05fQUHBNRt/bnEWLDmWuCXTAEoAIsvgQBEKhtDR3lE8Njb+0H/++39dMQsqLitGcXlh74qW5h+v3bBG1hq0YBwgypLiP5MZFkrPKEZSAp5QEEYAkaCvawDnzrR9sO1M98d/+T+/xfzsOyvXMCVYKW5IwsEwQoEwgoEAmKwU6wOUwnuELqarUK1WVx2PJS57Losz7H5uN8b6x+8/e/bsF9ra2pBbkIM7775zfsnyJd/q7OqYysi+tnWvLFYLLBZzICMzI6HWqkA5DgwEQlxEd1cv+rr77/rq1/++aGJg8rLnGU16jI1OoLqm+pH169cdqaquAIjSbFUUBYiSAEAprbzQwIJSHmDKJmogEMbB/Yc0Z86e/YsPfvK9q13ulGClSHHNkWUZkiQpRlF2SV7d4g4/QUIQEIvFEYlGFp/HRIberj5s3ry5uv1C+1cPHT5koDzBHbt2eDdv2vy5utq651taVsNivnqu9pdDo9EgLy/vtNVi7dYZ9WB0YdQ8vA4/Oi/0LO/v7/9saW0JuXTHEADKykvQ2zNoW7582ddu2bLRpdfzYEQEr6LJqqRisuifBEBWasIvzrooZmdtOHbsRNXw8PiXGpvqtF7PO6ekckqwUtyQhMIhBENBhEMhSJKy40UoSSYtKzEdURSRSCRwaeLz/LgNRQXFBW3nL/zXC8++0ORwOLB129bI5q2b/6W6qer5oCvEDMarU/Pq1TAajSAgHoslrd2SmQZRliBKMlRUA45p0NHahQsXLnxgbmq+VnHfX4QQgurqCtQ3VJ9bvWbl71a1LIdWS8HzBDxPlcYVyWA8AwNjBIRREKLkGTKZ4EJbF04cP7NjsH96a+v5Dvi97wxDaUqwUtyQRMIRhMNhBJOCtbATyHHcog8pFo8hEonwo6NjCPgimJm0QZtuKDx/rvV7Lz7/4q2jI6PYsmWLuOOOHf+xdNWSf3bbPaI56+pbGF4Oq9WKpx55nhXkF/QXFBUCXLLkMaOgMgev04/z51pLBgYH/qyqvlLteEnJ4+ycDHR1dYlLljR8Z8vWjWfzC3IgMwGSlACItFj/HQDIQkllpiwPKeXh84Xw4u795rbW9q+uXr0q3+dzX+9LCiAlWCluUFRqFYwmYyYADaVE2danyiyLJf2UUkyAXqNe8v0ffE0VivhhtGhLW1vP/fiFvc9/cGR8hNy243bx7nvv/veW1S3fds654pm5V9fN/lo0LWtEQUFhW0lFcVitVYGnPJjAwDEOlFEM9Q2hq63robGB8S1DfUOIeqOLzyWEYMmSJdi3b/dcS8uKH2259Zao3qRXdg0ZLs6qGEnuIULJkk7uGgLA0NAI9uzZu7a19cKfF5dmc17P9S+pnKqHleKGxGgywmwxV2q1Wh0AEMoWN/gJCHiZA43LYDFBD4AQFcs/fuLYt/ftPnDv0PAQ1m5Z696y9ZZ/XrV25X/6/L5QdsHVd7O/FpY0IzIyM/rM6bohvUG1PBqVIYsMHAAZMsLuOM4dP29tqm/6yta7bj3rs/t9lz6fEIK5uTlkZ2e+6HaFjw0Ojm8/ffIcCKOAxAEyBaUc5GRlUmWpjOQZopBkASdPnkRVddmnsrLTD7uc7j2xWALaa2TleD2kZlgpbkgYY2CyHOY4yhZd3pIMSZaSxkmKWDSGSDhsmByfvO/I4SNP/fHJPz7scrlw5113zm/fse2rGzau/yeX1xXKyLy2O4KvhFanAaelzuzcrLbM7AxIsghQQGZJgZEZRkdGceLEiY1dbd1fsOZaiG3mcgd8Xl4eBgYn/fUNDd/esWP7WGFRPhhkUAowWVLmVpf4ZlmynAVjDBzl4fcH8OKevWmnT5/5TlVNeePY6MR1vKopwUpxgxIOhuF2efolSQ4QonzMZUXEACizD3/Aj/6B/pXPPfv8r5559pmW9IwM8uCD731u185dd65Zs+aXsiyznOxr42R/PXAqHod3H0FJacnZ0opSpQ49lQGOgaqU9xSNRnH8xHG+p6fnISEqXjFYQgiKi0pw7PCRk+vWr/nq/fffG87ITAdjEgiFkr5ziZdrwQWvlOIhYIxgeGgEe/fsa77QduGzdfVV/Mz0/HU7J6klYYobErVaDZVKJapUKkYJASMENFl1c+H2DIVC2LdvH59fkce3rGoJtrS0/O/SxuXfCYVDdkAJ0F9PDGY9poanYbKYjtbU1oy0nrhQ6XP4ABngwIFQAo1Gg5LiElgslhme56Iv9zpmsxo+bxgWq/6pgC+4ZWxk/NP7XzwISVZylBasHwtipVhLKURZhCwr3rX29k5UVJZ/JD+/4MSeFw88tvD4t5uUYKW4IVGpVVCr1dBoNIqV4WUeIyQS0Kg1uP222ztXrV/xjerKmt3BaCCRl5t7vYe/iNVqhTnLNHzg6UPPlZaXfLHbE4QkixDkBPIL87Fpy8Zoy/pVe+qW1P09UZFQTkG2JhwOmcORSDoBgcFgCOp0OjsAaXxkJl5TU/1P27bdvmxuar6lu6M3ObtKCtUlZZUZlNkVAQdKgGAwjIMHDhlqaiu/87FPPDQ5NDR86nqcj5RgpbghUavUC7MsgABSsmUzJQQUFAQSVJwK5aUVQl1V/bem++eerq6sgVl/bQ2hbxRzlgkdp7qg0+v2VjZU/knfwICOIyrU1FZj46b1o7feuuXfeaN2or9/9J7jp84u9fq8WcFAIFOShDxKKdLT0zz5+fnHKysqf/37R397YuOW20eXLm364qYt654aGR3J9nmD4Dg1kBSoBQOpIlaKN4swpTTP/JwTu5/fV5abm/eZnTtv73Q5AuHM7KtbuPC14EdHR2sTiUS9yWQ6duzYMdeuXbtgsbyzLlqKFG8UvV4PrVYLvV4PmcmQAFCiLG84YLGFu5wgoYg/Pi4nyHVZ4rwecgqzYbVa2patXnp+bHZiU05Wvn/btm0nzVbD+KHTx7YPD49unhifMthsdgQDIYQjYQhCApQD9AZdVmVlec269Wt3bNq2/TsbNrb8AsDZVfPNf+jq6/7c4YPHIQsxMJGAoxpQqgKTKQhj4CkAUBBwIIyBJWRcaO1Gbe359xcVlBwdG5v8pSgy8Pzbd974SCRydzAY/IzBYPhONBr95fW+OClSvFUSQgIqXkWmR6ZLAKgJoaAcAZKlzkVZAs/JYDKDIAppeqN+rcPubL+WY5JEAZTjSSISymKCxKvUGgeTZZE3Gl7zuWazEefPt7nKK8q+8NGPffhvzWarfnhoJPfx3x3Y2trappmfs0MQlBQbZZYEABIYZAQDATjsdgwNDxdGYrF/0um19gP7jj/1kY+95/s7d+5c7rS71/Z19wIchSwxZQcSwEIXoYVXY8kZasAfxJ49e1Xl5WV/sXPX9qMjwxOjb2c8i09PT/8tx3GPq9Xq1OwqxbuesalRhCLB3LHRsY/0dfb/WWdXp17pIkMhyzIoWejZRwBC4PP5EI6E1t//0Tt/6r8nKL1au/o3S9RrA5XjmtmJ/nv9Pu+XxXjCaknPeD49O+df3fPjExl5Za/6fIPVCJ/bD0u6ua/7Qm/roYOHvv7MM8+bhodGIAgiCOGV2u0gkGUGjlIQyoEQGTITwWQJtnkHXnjhRVN6hvVvPvrxB3pycnJGW1av+tuAz/+o2+HIt9tdYEyELMmgnAaUJKNFi4q1cMooZqbnsHfvvqa8vOwv37Fr65/Nztjftk6sfEFBwezbdbAUKa4VjjkntFqteXxyfFNXR9dfdHR23GqbchBKCFQqFRIxISlWAM/zIEwACIHf74fT7awDYIrF4r6rPS4haANvzOG8U12fnx3r+ubkaI8BkoT03NI/K2fLysqq6z8c9k/6DJaSV3wN+4wLlnSz6szx85/fu2f/N5966jmD3eYAAMgyUbb5wIFLmkAliYEC4DgKjqogyQBAMT42jdOnz6xa3tz0wFe+8o3v/e///uRYJLD630aGhr77zNPP04iUAE+55OvJUBpXKDAAsiQDlEKWGc6ebUVRUcHDGZnphw8cOPK43xeCxXr1Gsm+Eqmge4p3NW63GzqdTjc4OHjH0MDwh8ZGR3dGhLA6PSPds+yO5oNcnC/8v8Cjawd6R0EpB8KUWJUsy2CSjFg0BrfbrQ6HYnwkEnnrA7qERNCFO0yZeHyi+6OTw53/MDN0ykDiDqgpgW/WhTk9t9NoMnwyq3DZDxNhJ1MbrnTTu+Z8yMiz8McOnP7TF3fv/fazz+w2OJ1eqFQaMEhgspCsIkoBUHAcTVoUAEAph8xRHgSAIEno7e0nIyPDD/zyV//2y/nZWUd9fe3Pd+7ccYvL5bnjyOETSMRE5fkgyvkiyo6hYiaVIUkMHOEQDIRw5MgxQ1197Vf+5E8+cczpdM29Hdc7JVgp3pWEw2Ho9Xr14OBgS39//5/0D/Tf73K4dUWFhYElK5b8V3Vt1W8qS6u6W4+1/XlGrnUtHZQBWQIYgQwCUB6EyohGogh4AwWueVdJIpZwvdLxYokwQDk+HvKWUSGi06o5xmvNc1CneQDGFsypl+JyOfE721Th+GDPF8ZGhs0Q4uDAQCkDRxKwTw9zmTmln07PdDwuCNGZlz7fPe/D6dPnUFRUuO3IkaNff/rp5wxeTxAEHERByY3kOBUWbAlgDHSx1peyhlNcCjwoABWh8LsDGB+drh0fnSmPxeKOoC/qWblq1ZeCoUiaw+la09baBcYAnvJAMjkaUEr98ZwaFAwyY+AIj7mZORw+eHBpWUnh39x6+y1/7Zx3xLPysq/pdU8JVop3FYIggOd5Mj8/33D27Nm/6urqunt2djYtMzMztG792icbGxsfqampeT4cDgsnT5yESqseNmcaJMJLnCwIIOAWsgkBiJAFBseMy+R3Bqt9Xl/byx1zfmYA507vQ3Z23gM+l/0HiPiMOjUvG6yZ4xpL2pMWS1arFHWdk8S4T2XMByEEQa8NRmsONzbQ9WexhNRUVrPcrlPVW9zOCa3DOY1EPAEpGoPbOV+YF/TWiqJwpWB53VizfmXp0398/h92737R6vP5wHEqSFjY5eTASLIzbDLFhkECICUTmWnyh1M6BTFAjDJMj9vUs9OO9EAgiJ07b8fZ860DS5Y3/d2uu3c9MjvvyJ+ZtoGnTLHYLmTuJAWZMoASJQAvC3G0njtPamsqP56fl3tifHz8d9FwDDqD9ppd/5RgpXjXMDs7i0gkktbb2/upwcHBzw0PD5dotVph1apVp+rq6v6lvr7+BZfLFQOUelJDQ0PQaDTh/IJ8QaNRc1FBXqg0CiDp8BYluJ1Ozuv11L749D5EvBHo015S70oIY+Ome0nn6afunuk7VyiHnOCYCKq3pusyCpsz80qF7MycA1nZub9R6UP7GJP881MDUiwWXCvKiY/nF5f8rjA361uUj1cEAtV3zMxM3DM+OlLgsjkQCEZ0sUh0ldtlP3DpIaemZlFUlE8O7j/6l4cPH109O2MDITwSCREAAc+RZBycYKEu4aXxcSC50bfwi+RfypIMh8OhliTptrvu3b7b5fChsakBZrPhcPuF3u/Nz9n/+bHHfqeJBOMA6OV5hsDibqDychR+XwgH9x82VNfU/vmOnTuO2x3Oa5q3kxKsFO94otEotFotPzExcfexY8f+tLu7e1M0GuWrqqrampqaflxVVfX84cOH3Y2NjcjJuZhOZzQYYbZaRtOsaS6VSlUYYbHLbkDCACbLcDtd8Hk9K7/3s29qPLPeK3a80s2KgGWZtcyuFiHQICgTICQk+GwCcTudapslfWdRftGWzKz8flNazi+yM3Kfmpwa+VvCmGy2Wn/oC8f6M/MK+636kt2cPu1XGkPOp0c1Qx8J+QNqrydY+J47diDinYc+LQ8A4LB7kYhLjadPnd/V1toFSVyITVEo0x7lvy/NA1wUKroQc0r+vcySaUmKDy0YDCAUDlUwxvi5WYeYmW2Fbd6NnNz0n7tctyyfm5/52JGDJyBE5eRrXJTDi2JIAMZBlhjGRqdx4MDRdRlZuV/cetv6r7mdwXjGNaoblhKsFO9oOjo6EAwGrWfOnPmrsbGxzzscDkteXp6rsrLyqZKSku8FAoExs9mMe++994rnajRaGPR6n16nm9fpdIUBksClOTpKXFqGx+mC0+5Y6p3xlkXC4YGXvo7aaML0hWdYWm7R8fSc0gdnAnYVZQxpOcWoyK93h2OQZydGs/rbzujMJmNzZkFJgy4t+xPucKwpN7/41+nZRRcSYRcIUQGAHPDOtZZVNPbx1OCam537kkg0a1onQ5nRSMQFAF53HNZ0Nbdn9/HPnj/fWeb1hJVlHZHBUQKZyVf4nuhCJdXkDwFJ2jjIxYRmpszK4okEgkGltlUiodSzz8lNx9DgWHTp0qa/8/q2Z/g8vrsvnO1BIiEocbGFc0boJV4vCoBHIg6cOHYWRcWln8vPKzzm83mfD/hEmK1XX15SgpXiHYnNZoPVauXHx8e3nzlz5vNjY2O3aTSa2KpVq35VW1v7k4KCgvZoNCoUFxe/4mswUQYAv1FvHDVbLKsc88k+fknRosmdsFgkCtvcXJ7L5VwWDl0pWERTiIh7DDqj9dGc8uht7oD/PZGQCwV1Lb2llcs/Hw4Kgkln/vl457FaMTCL+ci8RlDrm4mlFOlZeRfOnXheblm7cfH1zGn5iAbdkbLyqm+pdeZuRlVLo3GRgSq3o9PpRjxuLhocHN0+NDgOyDwUeZVAqKwsB9nljTUkSQKlFJSjUKl4qNUaiIKMSDgGjqMgTKlWAQJltrW4LE7Wu08KYF9fr231mpXfcdk9LbOT9tzp6Zlk/GpxbpV8YjKRXAZAOXi9Iezfd9hQUlL6tW3bbu2z2ebHrsXnIiVYKd5x2Gw2GI1GfXt7+ydGRka+HolE0quqqvYUFRX9oLKy8lQsFou9Hme1Tq/HEz//nVxcWnQkMyv7fUN9k4QubNmzZKk6QsAEhtnJOeq0OZefPHLq8ZdzbuszyuGcHwhac4r/Lqd8ZW08Hq225FZ9bdbuPBKf6EdhxfJvIOb76eTAGUtC8IGJcahoDjQqyNBQEN56+dhMGQAQA/BY8gcA4POG8c2v/Rve/8G7d/Z09ZZ4XX6legJJ7v4lDbBMJgAHyJAgywJUag65edmoratBWVlpMDszN+D1Bs27d+8zjY1MghIKyCI4DlCpVDCZFM+UQalvuEhJSTH0emPrmtVrvjM6NP4vv//9H1SxWEJJzyHJpCZCwZiy6UqgAsBBEhIYGRrBwf0HWooKcj+95fZ1X/XY/VJ6ztU1oqcEK8U7jng8DkmS8mKx2F8ZjcZYVVXVV8rLy3/mcrl8Op0Oev3rawJhMOvReboHao26u7C4MKrSdOpZTFkaKXteyvKJMg6OWSf8Hn/TX3/vr3X+Oe/Ll2lJL8XXvvYPw1/4wuc/CqCa15oOmDQMuekFUFlzn8wRYzs8AfdH52e6wWgcHElARUTI9PU3cBAEAf/y47/VPf3HvfcODQxzssBAucWtOqXcCyMA4SAzAZRnqCgtxpp1KyPNzU2DxcWFTxYUFB4uK62caj3f+7nBkeG/GZuYVHYVKYHMROh0Whh0+llCiOh3XV722GAwwW1zy8tXNf3a6ZjfND09/t4jR04C4JQd1mRSNJLLQkr5ZIyMAxMFtJ49j8qKks/l5maedzldf7zan42UYKV4x6HVakEImSkuLv5UaWnpfGlpaZ8kSVJ29hv3+GRlZ8JsNtlKSoqdBoOuJBiNKQXdk7EeRQCAgD8El9u93DvvKY1EIv0v91oajbJd/0//9E9tAC6zQCTco0Jads7PSqoabnd75wsCIRv0SVl8I1l2NpsN0Vgks6+/r2p2ZuaSsi8XdziV/2ZIzzBj9dpV8tatt5xvaKz5fmNj7RGNVhWKRkM6lZoPJxKxjEg4DEoIOKokMEuyBIPBAJ7jR377qydgybwyOJ6ek46+zr7g8ublf3f/A76sUCh6S0dHLyCzZCNWxVJBKS52kU4a7j0eL3a/sMdUWJD3xbvu2dU62DM8WdNYddU+GynBSvGOI7nTFwew762+lsGggyFTP5eWZu0zmgwlAVcILFmUDgDAKAgIwqEoJiamspxu95Jw6OUF69VQGcyAJvO0Jcv/D7nFdf/h6wvqGDioVJrirgv7kfDNQm197U7RExMTsFotRUODg9ZAMAhAnfRcEUiyCEJk8CqKkrJi7Lpnh2fjxg0/bFrS8MvDB8/a6uoTCIdjPECMAMSpqenqufl5MMYQTySg4pSihFqtNs6rVNP3PXBXRey9kVlZlmN688W0mgWRPHeidWTt2rWfCgYjv/J4fBvGxqaSS8CF3OhkDAtYLPTHgWB6agYHDhxaX1xS9Hdbd2z5osfhi6RnW6/KZyNVIjnFDY0l14IsdXEsPT1tMisrA0AyIRhicveMX/Q3zc/bOafLkz/QNwSv9411iCHaLAjBOWbKq38sp7DyD+b0Qggigyiysns+/H0iiq+9LPT5A7jr7h1gYPeHQkHrQn11AgKe5wEwcDxQ31iNj3784al77tn12c1b1nzfYFDb3vO+2xeK8clqDe+dn3Pmzc7OlPu8XlCaXADLDCqVCkVFxXG1WnXfvr17jw0MDvyFzmTgI6Hw5e+HELRsWInJiemRlpZV/3jfffcEMzPTASgNakVRgpJUzpLpPxx4Tg2O4yHLwNmzrTh29MRH+7uHHjx3pvUy+8VbISVYKW54nnz6UWRmpp8oLS0W1OqFlJPk1ICRxc7Hc3M2eLzeze//+Hs1kiy94eOozQXwzPZH07PyHsnJLw0JgoRAMAAAiMZir/n8eDwOxpjB43avdrpcSZECkCxbrFLxqKmtwoPvu79169bNH16yrP53ACStTlmqmoxWGA0W+YlHn4tOTk5sHB0dyQsGlb6MKpUKAINWq0VlRXlofn6u9re//W3+qVOn/qa/r+/2/v7+K0SFEILlzUuxZEXDgVu3bvl/u3bdEV0I1i/0dpQX291zIIRClgkkUUYgEMSBg4fU7R3tn16zaUXu6MjoVbmWKcFKccNTVlGK7JzsU8UlhXNGsw6MMMjgAFkGJaLSWJQCLqcb9ln70oA7nBf1vblEaKPZAlNWxdG07OKnqD4DEVnOBqBTp712JYOALwgA3Oz0nDrg9YNABiMCGE1AZDGUVhThwYfeM7Vx08Yv22zOoy+3m2mbd+KDH3ooY3bW/qm+3hFeEABKVRAlEXFJhNFiQUZm1oDfF1BNTkzj+adftJw91vblbFNBScfJ3ivGZEo3Yn7SKaxcu+xfN2/Z8E9rNqyCSseD8LKSy0ipElpLbgYwpiwPJZFhZnoWhw4dXtvW1vnJyqrKpEv/rZESrBQ3PFq9FtYC63xuQXa/Kc0ImchgIBBlCYAIRiTIjCERTWBucrbQPj2/yjFrf1PH0pgLMTLaGzdlFv6PNafYKRKuLhieLxRex83KBAlzk/P5Xre3OOAPQhQTIFSETOLIyU/HXffumF63cc2f3Lrl/sPrNq26QqwYYxgeHkVXZ++ac2fbmqen7ABb8HApXXiKikuQnZubPjI8XibEJcxMzOHI/uO3dHZ2/Vd1fVWObfzK/O/80myMjo4JK9cs+8Wd9+462ri0BoSTQKgEjgI0uSlAiGJg5TgePKdGPCbi5Mkz6O7q/fTsjH3l6MjEW76WKcFKccOjM2rxj1/5bsyaZj2ak5et9PYjMiQmQ2IMkgzIEgOTgcmxCX5iYqLhwvkLb/p4WdlZKMgvPZ2ZlfOUTmvKERJSkSy/9l6hw+GAw+Eod7lcaYm44kCnHIXBoMOOHdvY1q1bf/TE40++2Dd8+mU7+szPO7Bx0xrt6Oj4R0+fPqsNhYIAGGRZBMcTaNRqVJSVBYVoItrd0WOIRwTICYbejh4cPXjkjs62zi/nlGboA47wFa9dUFCMyUnndEtLy9/fe99dtqLifACK4IMk/4SEhTQeZaZF4HEHcOzYyaKO9q4v1NZV6OZn31rL+3eUYCXTCghjTMMY073kR3W1Ancpbi6M6Sbc9cCdyMrJbC0tL4lzag4SkwCOg0w4pdwMlBLKtul5uF2ulk9+6eMWp935po5nNedgcmpIykzPOWS1ZoXjcYkkEq/92XW5XPD7/UVul0sjiAIooZAlCSWlRVi/YW3r0mVNT3zxS59H+stURWWMoaenH729g5tbWy9sHx+bVKo5MBkgEhgTYTEZUVddq3I53FVuhxcQOUDiIMdlnDl+mpw4evzPes/3f74kuxKeee9lr6/TqdBQX4mysryTa9as+srOXdtCljQDQEQwJCCzBBhEADIYU3IQKeFBiBpdnQM4dercPZ3tAxuOHDn5lgLwr2prSL5w8mpe+WsA7K3UcmaysgUS8UbTbfO2+vPHW/OCoeCSQCDYFAqH06LRGCOEQK/XE6vVMmW06Ht7enouFBcXt/l8PldRUdE7rnHAq5yzt3y+XvL6l/55VY/xdjE6OgpKqT4ej99HCOn/y7/80oVf//r/kJGRcdWPlZWdBWuaZaCgqGDYaDE0euN+ZYdQ5kFkqviIZBlBXwhen3fT7OxscywaO/xmj2e1ZoIQ8nwkHD1IKVcov0YQ3+fyYee2O/Gd7/2/0mAoBGBheUWxdGmTWFxc+KNDhw7Orl+/4YrnMsYwPj6O5uaG0j0vHvj20SPHTcFgBDyvBUcBEBmESSgpLEBleVn0+NETaX5vEJSpwDMCFaEIeQPYv3svrzdoP3O+89jBjnPtbVJCBKe+KBFGkw4Ou5stb254wutxN9jm5r90cO8RPh6OgxA5+dlUSjVTygPgwGSCgC+CY0dPWqprKn+wdevme4cGx8ff7Hl9RcGamJiAy+XWdXd1fX5icmJ1wB+QBVGAWq2G2WwhOdnZY8UlJSc9bu+heCIRyst7Yx1yT+8+h4meyeq5mfmPjY2PbZ+Ymqhx2O0ap9PFedw+xGKJxZ0InudhNptgytKjtLo40VDfcKK2tva/CgoKn/e4PfH0jOvTSnwBSZJBKeFmZ+aa2s5fWD02PFbm8/oqfH4f02l1JC0tLZaWmdZZVVM55ff69icSCW9WzhszQcaicajVKv30+Ez11OTUMqfTucbr9WYkEgmm0WhgspqQnZPVWVpatp8x1hmPJ+Jarea6npdXw263IycnB8eOHfvcsWPHvpOWljb5gx/84ANjY2Ot1+J4liwLdEb9zMHnD58oKi1q9Lp8ydw6AgYCjnAASyAciGCgf8DQPLNi5fjo2JsXLEsGXC53WKPR/y2AxGvNKiihONl2XLX7mRdrA34/AAJJlpCVmYGGhvqpmtrqE9nZWbBYr3T5O50ulJWVGfbu3fuNZ599btXoyDjUag3ACAgYCGHQaNRY2tQUy8xIf9Fhc9wvJRjHQQXKACaI4CkPt82FQ3sPlJuM+p9t3LzxEwefOtj+0sB+dk4GBnqH46vXtHwrEgznuWzOD505dQ4yk5Q68AuFDJNufCYBMmSMjExg9wsvNmVlpX38jp23f8vtcgkZmZlv+Ly+omBF/TEgQYrOn2798z179hTEYrFF8dCqdcjJzEZVTXVsefOKp+sbGv6VMdYajwqyVq9+zYNOj43DZDFmH3z+6E/2Pr9/y/DQMEKhEERRBKUUPNGAgIMsSxBlERKT4XG6wSYE9LR3qNsKWm+9ZeuW1SFf6AcrW1r+zTbr8OYWXNtKhy8HYwzH957C/OR8zfDg2Gd7evoeHBkaypsan4Db44Ysy1DxKmg0GuTkZX+wurZSrKtt2FNVVfvvTGDHo8FETJ/+2qIyPTCNiDuc1Tky8t2z587f39PTY5mZmaF+vz/5LcxBr9OhID//vcubV32poXHJT2pqq3515kDnyOqtS95xs1AAiMcTYIzxv//9Hzfu2bNXbbEYq4qK8v/0rrvu/bTDYROys69uM1Mqczh26DgsFstjJZVFH+zp6jbKMRGQKZjMQUbSrS0Dc5MOeGYDLQ994CHV9s13C+mFr93Z5uXIzMwAgMHX89iknBnC4WhBIBBRiqMyERkZZhQU5Ln1eo1fEHRXPM9h9+Kxxx7HmtVr3r9/39GHzpxugywCHCUQRAGEABwPZGdmoaGxtlcWEYkEE1qISndGnshgkggCAhWnwvjgJHY/tWe52WL9+eptqx8eHR29Ihm8tqEKF852hFesbP7mxORY8+jEUMP8vBOKJyvZRTrZHoyCgjEKKS6go62bLF/a/fmK0rJDHrfn8JvptvOKgqVVa6Hm1RlEIqZ4OK6kBIgMgUAAnrgHtgkbersGtN2dvQ9t3LJ586bwpu81tzT+xOsKJ9IyX/0Ch8MRSLJcMzY2vvrsmVZIkgSj0Yiy0grkFxQgPycvYjKZIryao5F4BB6/xzA1PamZGB6F1+PG3MQMnvvjs4ZgIPQPapWWrd28+tuuOY+cmf/2zbSEcAwAaG6B9Y6jhw5/59Sxs0s723oQDISVZFQVB5VKjYQswCt4MT02hY7Wdr6yuufONevX3eLx+3+yfGXTP0+OzDlKKvNf8TjTwzNIS0/LPHLwyL/u33Pw4XPnzsEXDEASpcXuxoIgAKKMqZFpdF4YSF+1ZvXf3bpt045lKxo/cfLo2Y5oKAad8dpVgXxzKEFjUZARjcYxOzuFnp7eXbW19Y2RSPiqt9zSmjUYGxuH2WKaLCjJt+sMWmMkFgMlDHKypLDiJ+LhdQbhnPMuiXqkrFgs+rbUKpeUThGaREIwx6IJgBHwPIecvCykp1tPEUL8Pp/vsuck4hLUGg69PcO37H5hz5cOHjiuiYQEcOAhCSKUftcyKDjU1taitqG6baB/YNn05Awoo6CUQRIT4IniuZIkBkgEY4OT2Lf3QLOpwPQ3W2/d+mmHy5HIzrx8QlBcUYjMzMzRs2fP/nJkYvifnnnyBS4WEiHLEkiy86NieqUgMgMYRdAXxtHDJ6z1tTV/c+c9u9rnp+2+13d2LvKKgkU5Co7n+ptXNj9dUFSwhhAih8Nhld1hz5uemNaPj07AbrOhv78fLq8nL5EQvktAWPPqxh8HA2GYzC8vWrZJG8xWS3pPV9f752YdekmmoBwPymmg0hhQWVWHlS3LxovK8r+bkZbeEY6FidPrLJ2emV49NTx23/kzZxta2y7A4/HiyMEjJDM9608zMjIOB/yBY2/HBwsAhGAcvF5Nhlv7Hjx24ti/P/PUc1nT47PQqHUoKy1AcUWJVFhUKKalpSEejzOnw8ENDg2phodH0dc3hJlZp3F6dv6vYrFo3qaN674wP+7w5pVdOUOMBKLQm3VoPdH2+aNHjj186vhJhGMRGK1G1NXVoaq6OpGeni6HQkEyPTGpHhkaJTMzdpw+fQpun71ZZon/vvXWTe+1zc7NvIm3eU3RaRUBNRj00Gp0CASiOH++PWvpkuZ7d925sz0YDMNkenMzm1fCoDcgIz3DVlJc0peTm1Mx4ZlSqhiwhWReJck44PdjamqyZHZuZkUk/PYIligKgATE43GlfSmnxNUsFgt0Ov35I4eOw2q1Lj6eMYZTJ1sxOjK5cu/eA//97LMv1M7N2qEkKVOQhXbNkGG1mrF8edNEWVnZ8/3dw9tjgh8S4oBEwBGiLOOS9bQoTyGIMtpa21FYnX9ncV7JepfLdcVsKDMzE3a7HZmZmb+w2+0rZybn33/q+DnIogTKcWCyrJRrZkDSaA9BENHX24cjR47fkpGdddvUxPQf3ugs6xUFq6S6GHKc+W7NvfVPQGAkPBANxdTzs3M1Lqd75cjQ8PsOHTrSfP7cBbjsLux9fp8+Kyvzy7OzcyccDscV35CMMQx2DEEW5cxjh4796OiRow+fOHEaCUmEhtPAHwqiu68X07MzOHHucMO6zau/tX7T+n9oXrX8Md6i6uEk+fkVTUt+W1Ja/D0JuOfM6bMIeIM4d+p8VmV15Qfufu+dJ2zzNjk37+ouJV5KIp5A35k+mDMt28+eav33Pz76dNbs3CwMBgM2bdqAFS2rjhdXlv6qsKhw3GQ0kUQiwdxud9rE5ORtHR09Hzt44JhubtaBw/uPALL4fhXPnb9156Z/C/ojMFkuj0/Y5+3w2LyFzzz5zENnTp5FIpqAyWLGlu1bYrduufUXpSUlu9PS0yLRaJRzzNtWdnZ0feaZZ3aXTU5Mo7ujG2ajbk12dtYXN23d+Dcup0vIzHrjMYO3gt/vh9/vh16v3wEgLMvy8YUEZsV5DWYwGBNGoxFM5tHfN4LR0ckPOh2eR5wO1/DVHk9ObjZ+89NH4rWNtecKCgrumhmeAwSyWEF4IcokiiJGRkc1Nod928atq59zO/zIyL62/TpjsRhi0Rgi4TAkSUqm41DodXovIXRApboYamGM4czpDmRlZlccO3bqX59+6vna/r4RMKZ0BVKC3gQyk8Agora+Eo1NdbuzCtL3VFaXPb1kRd2fnzl6BkJEAiUqABRSslYWKAEhDJFQDOdOtGY01S75+23bt3XPj9uuMGjl5ORgeHjYv2Llyh/Mz9g3jg6PFzrsHsiSnCwzTy7uChEZBASRSBzHj59SV9VVfvG+B+48Ozw8Mv1GztOr7hJSDQGAaPJn4WTNzkzNHtqydcuTRrP529FI/KG2c+1w2d04c+pMYXlN4f23bLml3eFw4NLsetecGzXLqtV7n9739WeefO7h8+cuQJZlNC2rRUVFpcBxnGS327T9/QNou9CKeedMOcdz/2w2mcd9Pt+pVWtXYnJgbKB51Yq/CoXCBXabY+Xk2AzGh8fR19d729KpxoKgP/SG3vybYd42j6KlRTmHXjj6td0vHMqy2XzQ6s3YfPtm4d577/7Z0qVLvhvw+meyK/MWvzmCrjCqaqv3llVW9Gfn5n796T8+lzk+MoYzJ0/T4pLcr/b39Q/39XbvfumxpsanoNaoGzsvdJUFPH7wRI1VK1dh5507H1u3fu1XHHZnOCs/HfFoHE/89umD973njtaEiF/84YknS+xzc+ho60J9U91HCkrzH4+EI+ev9bl5KYlEAjqd3hgOh7/M8/xeURSPL/6SAD/61/+Qli9f3mmxpL2Hoxp4PQFcuNBR3tTUcHtnZ/dwNBqDTnd1l7IrVq6AVqc9UlRYGLyg6jAJcfmS5vXJ/nuMYWZmBjOzM82MMYvd5vZf63MVTyQQi8cRiUah5B0ycBwHk8kk6HWG4EI5F8YY+npHUVFZWnHk0In/+cPvn97Q3dUPMB4UqqToyiBQjJwWqwktq5sdtXWVTwz1Dgh1jdX/suuubcuCXu/mjtZeyJISb5KT6eAyAxghoFBhemQGJ46cvCU3J/dPWm5Z9f8C9iDMOZdbKgoLi6DTaS+cO3X+R2vWtHz/xd37uZgoKJeYSIslnSVZeU+U8pidseHkyVPryiuLH96+ffv3vD4v0qxpr+s8vWEfFiEEm7dtQiQSH2lpWf3dbdu2z2RmZEGICejr7sXg0ND77HZ7id8fWHwOkxl6u3rQ39H/3tbzbR8/f64NhHHYfsc24VOf/djTH/7YBz7ykY9/8N6PffJDP3r/h97jLCsthXPWhaP7j+YN9g7+fVNdY9r0yAyKa8rQcb5jpKq6+qd1dfWMgiAWjmFyYrLE6XDt7OntfaNv5w0zMDCAwYGhjcdPnlw1MDQBETyWrVqFXffe+/vVt63562AiOpNTk3/ZNNeUaUBcjkWqG8v/89atm/7qzru2ha1WA+LRME6dPJHV29v7oZa1LerJycnLjtXX0w+Py5Pv9XjVYAQGnR6N9Q1T9Y2135uZmg7nFypfCBqdBl/68ufw/JOHD25Yv/6na9esgYpXIRaKoqujK2NmZub+nXfsRCDwxhJ63wqJRAKhUBChUHCZy+lcGgwGRxbK8gKA1WrC8uXLkZZmnTWbLIxABUki6Ojowvj4xGc++tEPFtltb85t/mpkZmaipKRkqKysfMJoNECUlBvp4uVS6qT4fT5MTIxXjY1Nljhdb86P9UaIx+OIxWKIRhTBkmWlZrvBYIDJZILRaARjDAMDg8jLT8s8c/r0j5988qlbO9q7EYsKYHKyTb18sQopx1E0Ny/DqlXNTxeXl53Myc2Ac252anlz05du33HrRE5eNgRJQkKUIDEGmSmCJTGAMAokCM6dPE/bWts+OdI7unx0bPQKD5VOp8Xk6BSWLl36i02bNu6prq4Eg5K2o4SxxGQnH+XcUspDlgna2i6gp6fnTycmJpfNzrz+VfebNo4WFBQiryS7q76+9udNjfXgOYKwP4SxvrHs6bGZTPvMxQ+bbcqBzTs282PDk/e0ne3Qx6MJLF3exLbedut/br/79g9lZFofK68s2rvx9vVf3LHz9r/fvvP2uFanw8jgGHo6+jZOjE01uGwuEEJQ3VCH4rLSvdW1NaNGkwmEEnjsXt4161nx0EPvIwHntb0pOzs74fV4GqemplTRSBwEFJIoweNyVUz2jW3MykpTR92BK57nnPUh5I3l2uZtDS6Xi4Io3+RTUzOw2W0bnU5nkSRd7tU5e/YsVBp1fTQeg8hkqA068Gp1X0ZG2rTVfPkShdMSvP+D96O8vOyppqbakbQ0CzjCYW7SBseUc+v07LQ1HnzbOoojFnKgtLSMF6LuD4WDDgNPhaCav/z9WaxGqNTcoN6gixBCIUsU87MudLT3NIyOTmwaGZnASwPNbxVezePOe+5y5BRlP59XlgeJU9zZyn6WCgQqcOAgRGOYGZvKCjp9n25srOWDrsBbPvarnq9EAtF4HJF4AjJTdtY4ykPDq6GiHFSUx+yMA7k5RSUnjp/76WOP/u72k8dOQ0pI4CkHnhKoKEA5BoGJEJgIS4YVa9avm66tb/hxf2+fZMnIQnlVBe6//8MXlq5Y9s8bbl8bU6fzkHgZ4AHGJBBRgkpgUIkc1LIOIU8UJ4+eKRkeHv3qsjVLTR7XldejuLwIfX2DvlUtq3+4bcd2jzUjDYzKkKBUxaBUBscRxZ2fbDvmtgdw5uSFwrGhqU80NNRTrz30us7TmxYsnUWF88daYTDonknPsHpUKgpZEBHxR80c4+rF2MXcqWgsBr8rlD09Nds0NzsPtVqNpc1LXA1LGn4x2jcVyivNg9qogc/jR1V99WO1DXUnCoryEY1EMT4yZvT7fM0jQ6PwOfwwW8wwZhjdObk5U3qjAYwxhAMRiFGhAYBeSBbVv1bU1dUhIzNzunnF8nhFVREoJ+FC63n8+pe/Wv3C8y/+/vzpti9o000q94ySgiAmRDDGCM+TNYf2Hfrto7997K+fe+45nT/gh9Fixup1a1lZadlZo8no1mgutzgkJAESk4ggiWAcAeMJAqHQFCEkas26Mqai1hDo0/nBrOz0g9nZGZAlhrA/Ao/Daw27w5po+Op2Nn41JDGORNhuDfldqyBFmcmgDpsMl7+/tDQr0tOtLCsrQ6k7DgpJJOjuHuCGh0d3bL1tk0oQ3nrC7KWk56Xhm//4DeSV5vaX15VJKi2XNFYy0ORWPAEHIjJMDI5hdHBkJQBdwPfGV4VKbt8w/H6/2el0VodCIcOls8xLEQQZgiAjIYhghIDjeKgoD8iAKEqIxeOQZbn8xImTP/rjH56+/9jRk7wQk8AkpgTOmQQCETwng+MZ1Foeq9e2yMuam/+voKioN6+gEIQQqE16PL3nCTSuXPLz9VvX/seaTavA6zmIRAThABVHoSIAzyiIREFkipHBUZw7c35X27mObRfOt79sVYeK6kpU1pYeW9Gy6icbNm6QORUHOTm7kllyFouFFoocIHPo6ehHx4WuBydHZjdOTEy8Lgf8W0rN0Wq10Go1EbPZLHIct1D4i1CO6hdq8ACAw+nAxOSkcXZuJj0SDiE9PQ2lJcUTuSWZ0+lp1sXHadRqPPqLx4K5ObmPlZSUiDzHYXZuFl6/t/m9H38AoVAI5iwzCOEjOq1uxGq1gjGGaDQKfyBAAZBw6NrelM3NzaioLH90166dH/rk5z586LY7NiV0Rg0GBobx2KN/NO3bc/hbbccvfC69IJ0GHEGMD05gfsK28szp048++shvtxw5eAihYADVdZX44Ecfnn74gw9/ZeWqVZ912Jy+goKXFngji//mOA4EBBx95UuWlmfF47/4HdPpdANGgxGyLEOURIRCIUTCEUQiUbxdhIJ++LyezT6fZ4kgxKfVKn6CI1d+0NVqtctgMHjUatViG6vxsUkM9A/unJyYWe10eK762LKzslFQULC3tLi0PS3dCgalrhMgK+KV7KjsdnsxOjZWND0ynRcMh9/wcaanp5GXl2c6c+bMfz3//POnent7/8pkMsFms13xWFmSIYlKramFVvOSJCMajVFBEHnC8+v37jn4fz//2a/u3b//MGIxEcBCi3qlKYUoKekxHC+juroCW7ZsPrCiefkPh4cmWFraxS+47OxsTE1OJVa1rPrnXbvu/F3j0noQKoPwygQIlAJUMa5KkoxEXMTJY6e07ec7vlxfV1c+2HXlfojZosPgwIS0YkXzDzbfsvHFysry5Lkkl/cyTFYnJYSD2+3Dvn37s/v7B766rKXB4px77Wv9lgRLr9fDYDBCp9OB4zgl4z0hRPxe/0jAf/GbhOMBlYpkxxNRncwkaLQqiGKiD0BQo1UtPk5n1KFxSSP0On2/wWCIUo5DNBpDIBBQM8ZINHnDfeI9n0BaenrYYDAsCpbb7UYimIDHc/U/4JdSUFCAjLTMqBwWf7/rvm333v/QvV+978H7Arl5efC4/Hjxhb36Y0ePf623ve/e9vZ2lJQXm86dPff3Tzz6RFlfdx9UPI/169fKD3/o/Ufv2LX9PWs3t/ww3ZruKC0recVjMiRTcpJVHl8Ns9mESCQywPN8YqFypCwraRNMfntyMZngwjf/9s8Qi4VvCfg9nFGnNxu1BqtBd7lNgeM4pKWlubKysrwWqzkZR6KIRBLo6uxPHxudvqO+oRo+79UV2pLSYmyqucVRXFR0oqSkEITIkGURsiwqeXAyIElI+sNs2U6na+1A3yDc828scXdsbAxTU1Nr9+/ff/dPf/rTjAsXLmxjjJlfuvQHLqkvJcuQJRmyzJBIxJFIJNR2l+djzz334q8feeSx9WfPtCIRl0CJGoxxyXw9ZVeQQYIsJ6DVcdh62+bwypXNP+ns7PJWVZe+zDkowdy427F82fK/3XbH1r6iskKIspA0agOCLIMRBp5yYCKDY9aF1lNtLaND45+vWVLF+b1XLpFraktx6tRpb0ND/Xc3blrvMpmNIMn+icpnUV4sqawEuCgGB4Zx/lzr+v6u4XVjo6+dsfOWBIujHCiliwpKQCCKQsJus7v8/otTaLVGBbVGRXV6DVHxFKIYRywWkQFAloTLXjMcDiMWi6UJQkLLGINarYJOr8sGoMspUNJ/Hnz/eyEkEh0ajQY8zy8kTRuj0ZjBZLk2DRwvhRCClVtWIi4IwbWbVv9o+47tX7rvgXtCmVlWeFxO7N+3P2NocOjLm27fmHehrf2+Y0eObevr6gUPiiUNjdi1a+fvbt9+24OOads5ALJK89qVqpmstHV6LcmJxWKwWqwNIEQty0par1arhUarwUuXnNeKeDSCnz2x1xyNBJuFWBhGnZbyPEf5l1QYUJpJkIjZbJk0GY2LtZSYTDA8PIHR0Yn3BQOxUqXqwNW9fr/63c9RVFBwuLKyIsHzJLlsUQr7KYm7SrxlfGyCn5qefuCeh+7WsDd4t/z1X/81HA7HPYODg6aJiQnMzc02zM7ONkQiV64CJElOzmikxb6DoihibGzc9Pjjv//ir//3kYqe7gFIIgUlaqVsjMyBMQpZVsq7cDxAORnLljdixcol/1XfUP1CfX3NK/qcCgpzsXnj5rHmFUv/duvtt7jSMtMASiAn46tKQ1YGiAwsLqOvvR893T0fGR8b3zw5OfGyS8MlS5qwYmXj2bVrV/+heflSAMpnV5k5XixNTQkHjuMRDkVx4vgp/fjYxEdXb1yhctt8r3pO35JgsZe5fQihnM6g16lUF29ClYqHSsXbzGZjhFdxCIdDAGG3xQPR8mjs4ren3+PHn336z5FIJDYE/AGVLEuwWC0wGU0uAPGFE0QpgSTJ4uI3FWPQ6XSFAMt9vR1VrgYmixHRQFxsWlH361u2bPyPW2/bAINBBducDW2tbSuH+oY/2N/f/7nO9k4tAUFJUTHuuvPO9paWlq/bp+yONbeteQ3T3KVdP5UIgFarMTPGOP/LlPANOoN434c/gHA4VBAOhUAIgUajgdlihk6vg07/9rjdRUlAIuwuCQf9lUSWodGo56HTz7z005aeno6/+fK34gaD4XxmZjoY2OLsxm53obOzq2Rycnz76dNnrvoYs7OzUFJcdL6wMH9kYSaA5NKQEgpAaRjqcroxOzNX4/cErH7fGwu8nz9/HvPz87zf74coiHA4XEa3253t9XqveKwkiZBEEZIoLc6KJUlCW9sF8szTz3OzMzYo+dMcwHgQ8KAcr4xTZpBlCZIkoqAwD7ffvmWksbH2Z729XYmMzFfO/jCl63Gm9RQaltc8v2HT+p9s2LiOqbRqMBDF/AkGSZYV1z14RHxhnD5xOn1gYPAzTUubNPb5K3dx8wsy0NM9KC5btuRfN2xcN5GWZrmsxf3FfohKByBJkjEyMoqe3t6V81OOCttr7Ay/JcESEgISiUTyG4kqbYSULczLohVpaekoLilxF5WWzBjTTPAGfBjoG8ocG56oP7b/BGQlLQFutweHWg8WjI+Pb5ucmIQgJ5BblIv0zPRjLzy5W7q0+ePi9FmUoaYaCBHRRiTqTESEN/o23hJ6ixaeOafYuKLhh40rm45kFmZDlmR0t3Vz/e39XxnoHFjmsruh0vBo3tAcr1ta9099fb1D5Y3lr/naHE8hyiJAkss5GTCbTdkANC+3NIwEQxBY1OCyO5vdTicYGIzpRlhzLONqkzqo1r09M6xENIJ4NJIVD3pNKiaC4/gxQB9WbrDLuf+BXcjOzuyrqCyR9HoVCFWcz6IgobdngO/rG9r+nvfepZ6ZdlzVMfI8D1Wa1paek3k8syATIlWWg5xIQGUZTBZAGEEiJsM25zQ6593WkP/1x0e9niAYY3qN2lAuJjgwWYNQKEZDoYjO5bpSsJgsQpYEcFSGimMAUZZmXl8IAV8QPFVBRbWgsgqUqUFkHpKkLGOVOBGg1+mxbds2acOGjb8qKSkfLiwsfM1xpmdbMD9ql5c0Nf7bho3r/lBdVw6iliBTCRIDKFGBAw8qU1CRYLx/DD2tvTuGO0c3zI5dGYsjhCA3NweFRbmjzc3L9i1vXqo43RfDGRRMpiBMCehzlEc0Fkfrhdby3sH+z9UvraY2u+sVx/vWBEsQkUgIkJIF9hlj4HhOZTIbrZca/jRaHSjPufPzC56rrK4Ck4G21nbdwODQ9zdu39R84sBJ2KbsKKss1XS0dXz13OnzzQ67E5Y0K+rqauezcrKO1NbVwpJhBgAkEiIooWqaXBsTECQiCR+LI+C4yh/s14OkJnjqmWddFbU1T9Q3NckEFLYZB3Y/uzejp71PE48IyMnPR/3yhrO1zXUvVi+pUabbrwJjDJKktFWSRBmJREJZNiQdePQlgsUYw9TEFIY6BtcMDvQvdzkdIDyQW5QjZ+ZmPP3f//2TiPQG+uO9WRhjCIdCiMWFRiEa1nFMAiHM8Y+f3JRQGa6s6JGVlYHiksIzRcX5gxarCYqmyeA4irGxcXR2dm/p7RlcMzMz/abqKDHG4PF44PP59DabrdnpdBpcLheyynJw5MWjrKCk8FxhWREjKgJCsdizkBJAxakgxmXY5xx5Lqfrlo62Dvgcb2i3UMNxqmxRZFBauouE4/ilAwNDVzxQzfPgKcczSaKSKCTrWBEQqtgsaHIPU1m1MsiSCEkSQCkDYxJ4FYe161Zj44ZN/9W0ZMm/2eedsFpfX5me/MpcDPUPuxoa676+acuGgbQsE0QkkrWKkvmAjIIDRcQfwfmTbeahgeFPNa9fqrWPXxnXy8pOQ29vn1RXX/1PGzdu6MrJyVYsEyTZLXphf4MBAIXMgN6+fnR2de2anXOWeD2vfI4v+8qzTTpgTjdpAr6AikmMsWSXXEIJWHKdzBiDVqe1UI7Tqzm1e2ZqpjkYCOqUG0qAiuNUGl5deNeDd2q96zycKImQoyICzqAuHAq3tqxsCQ73jZhmp+fw9B+fqo1Ewo9UVVY95nF4PR1tHbccOnRo56kTpyAmJKxbvwIrlq88YTVbRa1WW+Scc4U4Qk0ENPP08TP3+LxeMDDITIZGq8mRwVaU15efd8+6CafiAPliw0fGFpIvkvG2ZEBaEBLJQvrKUnMBRQiTS3iRKaVIFvOelC68lBJQQsElKL117a18XIx11pTXBc9o2yyhUBit5zoBAvCcDgV5JSgpKAtCgNqgMme6prwxAExmcrL7yMXjAkDAFtT+94//o3jP3r1rQoEwOI4iGosiEPQtnZ6cvr24tPhZISFAldxd62rtQVFNWcmJQ0e/ce7cOXMkFoUlIw0rVq6wFxQWHE1LS8Ob6ev3RolE5lFYtYbMjrc2xSJBcJRBzXPQvsJXI8fzsFjMtuLiova8vJx6rzsEmTAwMIRCIbSeb7WuXLXsU/feu+uM0+l+Q54Vxhi6u7uRkZFRcvbs2X8Oh8O31NXVfUiSpL0AUFFZAYPRcLSiqmK0Lf1CZdgZBWRlNqu0C+UgSyImxyfJ7MzMhz/86Q/83jXvel27OgviKggCBEHp0BMJRxDw+9Wzs7OXPTYWjUOr06DzfPeDsViiRJJkJYGYKR2WySUufEKTpYiZrEQ0iQQQEXX1tbjzrp0H165t+e7kyEy4tKroDV236iWV+M/v/k//bTu3fM9ut/3nnmf3GWL+hFLckBDwhAPAgRAeUxOz6Onq21FVU70+4AscFEIiVMbLZ89Z6bl46K4Pj373h9/8VfOKZT9wOA9wkqCEcC6NeVOqdLJ2OX3oaO8t27Bh5rOrVy//ms/nj1utV1p3Fo8yOT4FXselHTty7HvdHT3LxLgoKUsvCTSZGMmgRPh1Ol2aVqc1JKJxjyyxis6OTmNCjIMRhqnJCe7IocPfOnns+MeYxJQsdJ5ArdOYwKD3unw6FVUBItDb2Qf7vKOuuqb6Wwa9AWPj4xgdGUEsHIOKVyERTeDk8ZObzpw5s0+GJMRjcb9Wo7MSRrIG+4cMU1NToDxBJBFB/0Bf2W8feeRxX9A3rlLz4FQ8IF8MUit6pey0LYoOGERRTO5aMBBypXAovdeS7cEZXjIzkpVvH0ooJURDCKFzs3ajJCnZ6fF4ApRSUMrD4/Lh8P6jt58+fvZgIpGQE4l4FAsrerZ4qMUedBq1Wk+BnN7e/hyPwwOVSo1YPIrDhw/nqPTkv8+eOFcc9kd+wxgLAYDGaLz1yJETX9v73O71U1NT0OjVWLZyKVu6bOkvS0tKB/1X2YD5ysgAoI5EfIWRsA96lQZqlQqZ5pffDCkpKcKePfulgoL8/ZVV5R/o7xsllAIyU+JJgwPD6Ovt27VsWdOaYDD4uhPco9EoAKjy8vIqjh8//m+PPfbYNqvViuLi4ozk75CWkQZjumE8vzD/dGZuZmXAOQ5KVcr1kAiYCHCEh8/tx8ToRPXU8FR+JBJ5XYK1ULBPCZkoVThjsRjCkQi8yZ1sxhhsNjsoT/Vnz5z77KHDR77c3z/IU8KDEQ4LPgNCyWLzVDAleE15AsYkSLKAgsIcPPCee+fWrVv9tYmJifllq5a84aumM2rhmfUiLd/6qC/gWWWfn//TM0fPgUmKe14GgSxTEKgQD0vobO+xNC1t/NTOB7edcEy6r3Ak5+RnYHxwGhkZ6Y+3tKz6eEdHZ9PcjANIzgjBSHIVIUFKxi47O/pIX2/fBysqCn8WCkVeNpd0UbDCwTBEQSzu7+t/8Pmnn7cKERGQFdcsR2kywH7JDERR/SJRFBGNxcDzHNKsGYhEInj+mWdzZVHOZQKUejgqApFKSt1skSERSYAyDpLAMDcxh/kpGyghEAQRHEehoVqAEXS396C7uztHhgzCEXDgwBEOkighFotBkiWo1RpYrVb09feh7UJbriiKuRzPJ2dQl4rLpbOnhf9nSSEGFGOb/DKhIQIwflHULn+AvDjrVHrcEQgJEaIgguM4WKxmRKNRxGIxjI4OY2JqTE052rTw2ORhQS5Z6ii/o6AMEBMC4vE4RMhQadUwmkwYHh6G8//m83uW9fwgPy///Xq93iFJEucPR1d2tXfljQ70gwNDdU0Vbtm65UhNXe2Px0cmpfKq0jf8IX4zMDBI8GXG49GqRCwIq04LnqPITHvlzZDqqkoYjIbWurqaqUMHj5f4fWHlWoAhFI7g/Pm2tJbVKz92221bTs3OzosFBXmvOoZgMIi9e/di+fJlS0+ePPm93//+D1tHRkbw8Y9/3F1cXDy1sEsXT8Rx7I/H5PzCvLMFxfkfGu8fhyzKIBIFZRSQCChHkYjFMTU5nWG321sc846e13Me4nHlHvb5fIjGYpd84SuB7GSfQhoIhFadPHnqL48fO3H30YMnNPZ5lyJUhANhHC5GbWQwppQ6BmEgDKCUISs9Dffce2dkw4a13yurLj3j97x5R356QRpGeoeEuoaqH2++dcP66YmpZVPjM0o6jSQr95NIAEoxOTqNnu7eO6prKzbPzdn3JQIRqM2XX+PsnCwYrFrb6aPnnlqypKlpbu4AICnLWUKUJS6lvLKJxhicDi9OnTqdUVNb1rJv3/7hcDgMg+FyK8yiYFFCleUN5ZheqwflOciiDIlISY/HxWluMh9cufEpgUrDI68gH6vXrLRDFsnRw0ez7bMOEImCAweJZ0hQEUwGOEZBLMk1MUfBq3hQQqHRaCCKIhKCkNzCVxoFiEyAvGBAkwiITCEzGRarBdY0Kyqrq2JLly6dGxkezjl5/KQhEo5CxfGLo8RLdycu/R/gsl26iwbCS98rBaACXfSSLM7ZFnOkFrvgMgYQGZQHKisqWXV19azb7Tb19fVZPF4fJFmZAlNCks0tk9+c0ksFi4BjBEySQXgKo9WMZSuXx8oryu2nz5zIO3PulHr/nv0avV6/TqVWgckMkbiAWDQOk1aD1S0r5Fu23XpkVcvKz48PD9uXrmx+0x/iN4oYj0KghItGAmpZSig+HDDwrxItzcnNhcGg633m6Refqago+7MLbV1Y6BsoiQxdnT04c/rstvKysmaf33/u1UqSMMbw3HPPY8mSZSsOHjz8q8cee6yxr68P27dvw+rVq39bWlp6KhBQburMvAyM9I5Cb9CfraiqcLWebMuM+mJQJQ2ZcjKKwEQZ0xPTxOP1vHfX+3Y95rzFGc3KzXrV8xCNRGG3uYs9Hk92NBJNVl9Qged5/PrXP8f3v/v9so6O9k+cO3fuY8dPHM/v7x9APCQqu38EygwkWW6YLfjokjl6PE8gSSJ0eh127tqR2HHH9u83NTf9JOAJMGvGW6sqUVFfhdN7Tg62tKz6xvjoxP/Nzv7BzBIA4RXnOyUqyIwhFAjjQtsF8/KVDZ+9/Z5tR1xzjiuW6warFuODUzCZTY+sXr3q4ba29oq5WSco5ZXpTvI+YISCEuVa9/cNqKempj77jW98/bmpqekr1HdRsEwWE/Q6/UTzqub/yC/I38iBZ5IoghHlw7E4wYBygy7cwCAgWp1WMOgMpyorKp+MxUL64orSz/t9/gIwwggjYBSQqKwE2qB0iVUcrwRqtRoqlRpqjRpCIoFwOAxRkkAJUXpcMsXABgIQWYmlyUwGr1IRq9Xqz8rMfK6msnbPwHD/xxqaG26PRiISR7lLln3JD/Il/wa7VLIutQ5gMW7FFnpwJw1uIAuRhIW/ZqDJ3ZlLbx6ZyVCpeJKbk9NZlFv03w6Xo2qtc/VD4UikIJEQmbJEpCBJxzq5xJtCcHG5SpIfVEIJMVvMwYK8osfKK8pOFpbkfqyyquxz7e3t2ePj44iEIwABLGlG1DRUonnZ0nDLypWPNNY3fm10eNS57vYNb2vFURYLQoYIKRqAREQkZBlCXIQ9/MrmT71ei3PnWqHT6f64dFnNJ3p6Og3xGEn6jQCXLYDzp9vz16xa/fnbdmz5hM/lf9mtYJ9iO1Dn5uTf++wzL3ztuedeaOzuGkRtXQ22b99+sqmp8QeTk5NyaWnp4nOsaVZk5KV3ZuSkvWDNMX0kHAxDJnwyhpCMs8gEPrsHU0OTDfZxe2EkFH7N0jeOeTei4USFbcaZEQsJkOJAIiKBSurVZ463//gPTzy16+TJUyVtrReoPxAAkwkgq0GosgxU5vJiUriU1YBy3wEyk6DRqbB56zps33XbI6vXr/pXp80tZOe99fJBhBCE7AEYsk0vrlqz8rmenp6H+zuHwEnJztGgkBmDxChGhybQ1TOwrHbZksKgPzj2cq+nMxqQmZc2fPzI6d+uaFn+D3PP7lVmj1BqZoEpKxuSFJiZaRsutPXUNzYMLg0Gg8df+nqLglVQnA/GmH/95nXfBKDCG4MBEJD8WixrqGzDQknJa4ucPC5b0tL0vSUtTT94G475ehEASHnVeYNLsXTvWzwfMgAhFoqx9bet+U5hQd6zK1aseHjeNr/R7XbrRVGENdOayC7IOp2fn//78vLy1ng8Hl6/bePb/6YjAojIQYpKoIyHGJcgRITCD3376Zzb/nx2LRidDUWD5zMtWUhPUzYBCCGYn59FTk5275Kl9WeOHcvfOjw4rVQekAl0agMG+oZx/lzbneXlpeudDteRl86yJiamIIpi1tEjJ/5y//4Dn3/uuRcMtnkHSkvLce+9DwwtW7b8b06ePDu9YcPay8abmZ+BZ598RiivKjtZVl32kblJO2RBWXIREBAGcIRDwOfH2PBYgdPmXOv3+V5VsBzzHmTlphme/v2Lu8aGJ1RMolDzOjjtbjz1x6fXJ4TE+o72TrjdXsgSAYEKhBHIYJd8OSqXneHiJs9CmRa1isO69WvYPffe/duWtav+H2MsojddPY+dIduE/gt9idr6mn/buHnjmrkpW4XPoTStkGURTCbgOIp4LI6+voHisbHxBzZvWfsDvy/ELNbLG8bmFmRgdHQSVqvlVytbmu89d759icMexMI+E01eQwoGRoBIOIqe7oG00dHxe+69747jDrsH2TkXvWSXhfaTHwAp+fOWPrfJn7cTMfnzTuRqng+RMdZeUlfSCRkmISJysixDrVfJhCdBANL1rOEejwmQJQohLkBFZAgRF5xzw7dHWOypuUBwudFa8Pvly9Z+eHLq8tbleXkF2Lt3v7uiournK1as3Dw+auOFuAxKOPA8j1AojOPHTqQtW9b0N3fcvb3dMefyM8YwMTGD0tJCvqurZ9PJE6f+6sCBQztOnDhO3G4v8vML8dD7H/TfumXLV3p7Rk/s2HEb9IYrv4ubliyBVqdtr66p9Z4/3pGWiAvgyGLbuaSBUsLs7Ay12eZrv/jZv0DYE4Yh/cqKqE6HF5lZVvXpU21/cerU6Q8NDY2Aycpmjcftw549+yDJEkRBKZ7H8zxkGZDll8ZHgYtxVhlcMrdPo1Nj/frVePDB9/5+3dp1X3zmib2uex7cflUvOCEEgi+On//sf8+vXLX8X6bGZ/59//OHODkBSLIISjgwxsBTiomRcTo1OvnxYNOyx/y+4MtWtlWr1Pj2N787ce99dz+7fPnSJYcOnIKcYIubeQvHVN4rwcjIGPr7BnZNTcz/cH7OPn/pa712TkiKdxxJQZIBXPPCcm8UlV4NtVoDtYGHRMMQ5Qgmx0+oiCNjrTsho7RmC88YI5NTo1eYqurq6mExm06taF4xcuzIudqZKTsox0MQRMhMRH/fME6dPH9LQUHprs4LXY9+6FPv5QhI0/59h//s5MkT9xw9ejx9eHgUoigiPz8fd921K7hhw7q/W7q89rnyipKXFSsAMBiNyMrJHMjOze02WcybnH4XKJPBZLIYAiUgcLlc8Pp9d7UOt//Y6/ZcdiMxxnD+XD9kGU2HD57+9P79Bz6+d+9BVTQah0qlToqSmLSwEHBUDSU+BQAUlF4MQ7x09qjErijUKh7Ny5fiPe+9v239urVfDwfDrg998r3AJ18zY+uNX0erBrYxG3Lycx61zzvvGuwd3jE6MAGO8EoIg4ngCIXf6cNAZ3/pUFVdXTQafVnBKirOw+DAKAwG/e5ly5d+9uyZ9oyAJ5wU6ctDKoRQBINhjI1NFM3N2erD4chl5/kd1Ug1xbsfvcmKtJwinz4tf4rqLJApgyiGEQo4YNTxSLOYHJ9+j5G9XApVVmYGGuu3TpWWlf93XX0dI+RiwJlSHtGIgBPHz2p6ewb+fONtG1YdOnjiO3/4w5Mv/Od//tfHHnnksfSe7n4ICRnFRSX4wAceDu7Yse1vV7Us/R+3yyuZLa+8S0k5FQgxh/LyC84XlhQlN1cu/l7ZCAHcbjfGxsaqZmfnVjldiht7oflvMBjI1mjlTx07dvyJ3/728c8//tgf9XPJdBomK3XjCUuWryE0GaVUdrIJo1A8ThcF8mIytARABq/isGHjenz4Ix9qW7N29ScnxqcHSsuLr+m1zCnLwbkTbb7q2tr/XrdxXVhv0oERCaAyCGGQ4gKESAKj/SNap81+34Yda4jP+fLfoRkZ6SgozG2tqa5+trq6UtnIu/QkL/4nRTwmYHJy2uB0ue+/9bZ11H3Ja6ZmWCmuKjIx47nHfh5Ysnrb/2Tnu5bax2GMxwGiMaK4qDGRk5116hs/OIqszCutCTq9Fn094zCbTXuWL1s6e+bk+cJwIJL0silxnJGRCfzxyaeaB0f7dg8ODaZ1dHRwTqdSEVSn1aO5eRV27Ng2tnHT+q83NlU97vOGxcysV++mlJllRWfrAPQG3b7yyorP9pzr1UtRKbn0SRqKGUE8nsDY2JhmZnbmk5W11a6xsUn7YP/ACrvDvnZqavqWnp6BxlMnz/PDQxOIx0WoOVUyW0G+uEl1WQ/cZM4iaHIjiCz+ekG4KKUwWYzYtHkDu+uuO57YsHHd10aGR0dWrVsGwl3bpT8hBO5pH9ILLXuWTy3/6UD/0JfOHjsDyjjwPEUsLoDjKeyzdkzNTO6anZ77SSQU6Xr5c5yGUyfbhfLy8l+tXNV8f3/3oCUUCC+Wx1lI3WFKHB5zs3OYmpzaGI/KOZFIbHGWlRKst4hr3gWT2azp7+u/e2Jy4k6P10Os6RZaXVO9p7Gx8RGXy4XMN9Ew8t2KNTMPHucMjEbLExJLFOvMuQ8l4mKhRqtzFxTmP5qdm/d8PBx5xZ3L3NwMpGWYxpcuqz/cuKTqQ2fPXADhCCRZsZhE4yLOnG3j27vaMoNBZdeb51TIycnB5ls2sttvv23/sqXNf/eFz/1921PP/xRp6cbXNe7MTCuyc7IvlJQXDFizzM3OGQ/AREWsZAaa9OIN9gzjD489eWdWfvaWUDTkjcQiubZZl2p8ZApOpwuxWAKAkiyczK4BTc5IFn18yayLy2ZxIMmbV2lis2BUNluN2HXP5ujOXXf8cHXL2h8F/H73mk1vn00lo8iKsf6JRO2y6sfW2FZ8oG+gMzcw54eaaaHh1ADHEAh50d/XX7RkaElDIBDoeqXXqqoqRWaWtb2xv+pMQVHG9qF+HwhVJb8YuGRuAQAiweN0YWJ0uGF0eOC2UCjym4XXSAnWW8A550JaerrxzJkz39q/b/+n29vbDYwwZGSl4z7VfZWMseccjjeWfHYjkJ5ViKgQjRdWLftuWn7lTyELpSB0Xm8wOqKSnNCbXz7HjS0WSgIrKy86Ut9Y+1BnV68qFk1Akhg4qgIIRTwhIhwNg+c5qFQcGhrrsHXrrbaNG9f9omlJ7Y/9/oD9md0/A6U/e91jtqYZoNJR15H9Rw8VFBU022fcIJDAlAw+EEbBRA4eZxD7dx8mcZYwCkQyJkQBEDlQmVO8gkyZScmQFevOgkt90RN4uTWGMCWorjxC8QGyS+xD5eWluHXrLXtv337Ld51OR6So7I11WL8aZJdkwKAzttU0Vf9k1dqV3zi2+xhYXAmay0yEIAqYGJ0gHpfvgZ3v2/60e8YTzSi8clarM/DYu2dfqKq69Km161q2TY5PklhMAGjS5pDUdI5wEBIxdHV10Z6ensLdL+xBNBKBTq9PCdZbweVyIRQKNZw5feYT+/btM9TX14u1dbWDlgxzPDMz8wUAoUvzBG8mdCodoOw2O5M/L8uCSCUSknFsdGrt/Pz8hunpmVUTExNL+/v7VGALOawXq3RQMKh4DUxmA7ZuvUXeuWv7i/X1Nd+srim/4PeFpOLiNx7bMVhMaDvVDp1Bt7e0tOxznWd79UxKJuwu7GTJavAcD0GMKbuh/5+9/46P47rOx+Hn3pntfbELLHrvBFjBLomiRIoS1VxkxyV2HMc1dlzjEvuVk3xty0kcx0kc23G37Mi2LFmUxCb23juJSvSywALbe5m59/1jdkFQpCiwSJT109FnBQK7O3PnzsyZc895zvMIQlYumoMK9NL4slg7dpVa+yXEnfIboRycSeCMKfhCUYAoCGCcgTMOlys/4XS4fv7in3bEH37HmttyLo16Ewb6BnhjQ+Mvli5fur77XE/bxIAHCn0KhUBVmJycwtjY6J3eEW9VPJ64qhqM0WCC2z2BPLt944IFvX+5b8+BFX29g5DlDESBKqypElMIT0UVxt0e+H2BR3/28x/9Yv++I55IIPiWw7oZCwQCsNlt84eGhsx2ux0PPfTQxrX3rf2E1qiJAUgBkAsLC292N28qmxFFUa/X7+ro6Lynr2+wbXhoonVifHxBX3+vsa+vDx7PBJLJNNJJDkIuEUUKggBAcQx6nQGLFy+ZWH336i9Fo/GOm4Vz6HQ66HW6qE6rzQiCgIykNC0rKSwKChFgKgjgEImEtJwGoQJAFOI9AJimBueXGuwvG1cueqLZhD1kMEggFNBp1aivr4cgiujq6kQmk4HFaoiIgthjtZlv63mzWW3Y9dKekdr6uh/OWdjy06lxn8iTikQYOEUykcLg4KB1bNxdE4/FX1G+Kt+Zjx/954/H6hrqflpfX7tiSMHPQZIJCEQIVAChAggAnzeAgf7B5tFR97q71971m2gwzN5yWDdhXKFQ1HDOYTKZYDKZ9v70Jz+d+LsvfPp2D+0NZ0zmIBQ695ivZGx0bK173L10ZGR4weDgQH1X10VhaGACXq8XqXQChDAIYpapgNJsh0EWSpmtngmigHA4hsOHDxdUVZd8YvU9d3zN7w+E7fbZ6du93Dxjk8jLs9t27dzzhfMXzltSqSTodLuVIi5KOQHLCiqLhELiZLpJmxNMd0LwbCsFybbYXAmvIllnJoOxDASBo7i4CEuXLc3cfffdJ4aGBusHhy7aCZVR4HJIRcUFLBq9fk75W2nWPMD5ZAIAAIAASURBVCuGBkaQ78p/cWHvwqPnT7avGO/zQBRFQKaQ0hKGhodUE5MTy9c9dN/z0VgMRsOVODVRRdF9oQd6vf7C/AVzfUePHsvz+yIAVyIrcIU4kMlK18jFi32Gjvaukuf+9AL73Jc+81aEdTNmtVmh1Wo6nE5nsq+vTzsyMvKex971rj2f/vynutPptE4QhDClVKL0/3vokVwkJUmydnRkou7gwSN3j4667xsaHGvu7e0r7u3tpR7PBCKRCOLxNCgUZWOFo5xBJQowmUwoKiqDlGHo6xtEOpVRIhhOIWcYYtE49u7ZK1htuk9otVRYuGD+Nybc7ilXUdF1jXVizAOjyZh34OChJ1544YW3HTt2HCQjQiOqsq0jyJJUMjCeAYUMgXJQxrPqygodTQ76qbSyZX8jl/rAOPg0dIEQDkEErDYb5i+Yy++8Y2VvS2vrd+e0NG/9nx/8z9NUwBKjUQ+1WhwoKsmfuNj96nznr7WVVZTghae3+OrqG346d/68tqnhXWrCFCIezjnGRkcRDAYfSsTi/xUMBMdeaTvO/HzYnJb2pqam3VXVVe8M+M9mub+UHKDCUKoCA8PIyBgmJiYXfO5Ln9EGJkPJtxzWDdrFzi6o1KqSiz3dH0ok4pqpKS82bHhhsdfn32hzmAdUapW+tLT093fdddf3uru75fr6+ts95NfclOVPEeKxIevgwOjcoaHhO0eGR5cPj4wt7OrscfZ0X8TkpBfxeBwyk6dZngSqdC0JIoXFbEdxiQu1tdVSfUO9p6qy6szUlL/iyV//trn9QjcIJRAEFbgkgzIB0VASzz+7WYBEPp6KyaZ58+b+w4WTXSPNC+pftYeSMQZCCPWMTjXs2rH3c1u2bP3rl7Zup/FYGhatFTSrBEVyzC6QQMBBCYNIOShYlmlDzLbQKB+khEBimWwPLAGowljHmQwqAKKawG63YO68uXzZsqXjrS2tv6qtrf1FQZG9n0kwcMq4xDNQa1Ww5lmSIMgw3P5cKCEEI73jKKl2Pdd5rPOvOo62r/KOTwGC0lcbD0UwMeyumBzz1KZTmVd0WPZ8K44cPJ0sLiv7TcvceQ+dPtOhyWSykWxWh4BlQbShYAzBYHSFZ8xfGYvFOt9yWDdoyWQSjLG5Z8+efeepUyeJwaBHMBDEtm3bikUNKbbn2fHAAw+MAvh+KpW62VanN7Rlb3xxaHC0cu/eZ9Zv2PD8O3t7B+a2X2g39vcPwucLIhFPI5PJQJJTCvEhVUJ/URThdDhQUlqM2rpqqba2drioyLW/uLhoa2lpyfGiYufI6ZNdD3R0dP52YGDIkEhkAM6gFlUgWT3BWCSJFzZsIj6v//0jq0ebGhobnvSMTu3hnPekE5mERq+eHms28hMj4ZjtYmf/vPGxiZVdXd0f3LFjZ/nxYycRjydAmQppKQOVIEJF6IzIKYucIgrUYVoBhuYgCcp6kXFZoQvnSgKeZ8Ut9CYtystL0NLawJubG/ubm+f8trGp4Q/5+Xm9mbScOXumHXPnNoNk23C0Wi1chQUyAOQ5bmype6vNajTh7x76YvhvvvihnfWNdasmxtyKLBoRwDMyRgaGVd4JrzX2KrJoRcVFKCzMP1hbV3vGWZC/xD3mAWMyCEOWdFMGoRyxWBzj4xMOn9/XlEgk33JYN2o6nQ5qtfpEc3Pzb2zWvCpZhlclqklGznCi4iar1cJKS0u/9+STT2bWrVt3u4d7y41zjs72XpSUFhp7uvvm9vcP/NX58xfWXrjQUXqxp4+43R7EonElD0UUdDfnHILAodVpkJ+fj8qKClTX1CSqKiu6S8uKd5eUFB8pLy87arWZxgBIhBAMD06isbF+/+LFi44dOXz07p6efiiRjCLQSbJahtFoArt27kX7hc4FrXNb5re0NHkLC10nzBZj+9aNO85Qqkqq1aqKHS/trwgGA7ZA0D93eGC46mJPr7676yI8nknIMkCJBoIoggGQOQPLLt8oURwVJQSUMwiCAFEUFJUfCmTvNCgMshIEUYAkSyCCiJLiItTX1fDG5gZfbW31/praipfKy4t3OZ3OPgAsFwmePnV+en4ppcjPz4fBYDhXXlqXOn/h5O0+5QAAk8uIvlODMJvNv6turPrLI0cP1yUiMQiEQJJkuEfcos/rb/u/X/12Q9QbgdFxdeJGtUYFlUbv27N7z9GGhrolnolJSBkZIlHN4LJTaHQ8Ho/gdrstXq/vrRzWjVp1fR3A4SmtqPgkABEEcVxqMFBDwbjFlyxZ8rrSu7weNjAwhEAwaIwlwmteeunCR8+cObv8zJlz5u6ui4hGE4rsFMM0/a0gcOj0ahQUOFFTW46amupARWVlb1Vl1dnCwqI/Fha6TpnMWh/n4PRlXPel5U7s2nHU19BQ/9MFC+ff2dc3IEjpDIScQCdBtn1H6XwfGhrD6KibHNh/0GnPs91vs1nu1+sMXKXWgckySSSTCIWC8Pv8CIcjCiMoIwAEMIkrSX6iOKsMkyEyGQoafQZGnVKIVITIVJAkDokrVUIqKJgrSgHGMjBb9Fi2fJl8992rTjc2NTxTUlK0tbzC1ZNKygmNVrjiuhAEAcmkRDnnAqUULpdLtlptx37z21/BYr29VcKZZsmzwFFu69v0h81bXKUFdX0XeiEQEZCBqQkvAr7Ayl89/6Q5OBZ4RTbBApcNp0+ehNFofLG6uvIDR44cszKWVlgy+OWtUZMeD0Lh4KL3vP8dv3hNHVYwFMTw0DDMZnNhLBa7I51OG7RabcRoMm6XZTlUUV5xu+f+hi13scXDidT5c+2pgoL8kmQitTLDJB1VcbfFaj6ayWTilRWVN72voeEhiIJoCwaDqzKZjEUURW4wGM5VVFScCYVC3Gq1orunG4IgGFKp1J2yLLsIITG9Xr/f7/OPNzY1wmiYHeL7lSyXRPf5go4L5y+s7+zs/Mtz584vu3ChUzc0NIJELAkQRdhTlmRwZGCxmFBcUoiqqgpWVVUxXlVVebK6pupIQYFrZ1lZSZdKJcaRjaSuNc+jIz7k2e175s+fe+rQocNtw4NjAJGnE93K05iCMQKBagAwhIIxhMNRDA4MgcmEEC5MU5nkbgZOkCXJU16EEAhEBZllAC5BJYjI4dMZGBhXSC5zNcvcsGUmKTkXRkAoh96gRV19LV+6YsnQshXLnlmwYO6/OZyWKQD8WsdqtVoQj8eLBUEoU6vVqKqq8rhcrvMm02uvtXk95ii34ejeIzAYjVvrm+s+OtDRr+MZBkFQIRlLIugLzfUOeZsTicTha53Xnu4B1NSWHq2prep0OGzLRobHwTnLkmYCORCtZ3ISfr9vHufc+po6rGQ8iZaWFrpn155/2rN7z0empqZQWlrK7rn3nm8tXrr48VAgBMsMCe0/R5sYn8DiFQtVW1986V+OHj7+Xr/fj+KKwvQ9967+xy2bNz8RCoZhVsRdCWfMDM5TkOUkUasBDgGABUAYHBIorhqNnTtzDoWFRe/cs2vPD/v7+0WD0YAVK1fsqiiveMjvC8TDgQh+/eSvsHDhog/t27vvuyMjIxqrzYq7Vt350zVr13x8ZGj4hjO2nHN4x/2Q08zY3tG5/syZs1/as2dP88mTJzWeyUmkUzIAAaKoVpgHBIKyslI0NVdjTkvjVGVVxcbKyrIDRUWugwWu/IFMOpM2GK7vBiwpzcOTv3p2fO7clqfb2ha0ecY9YOlsQnuaAJZc6kubQeRPqAAKgMsUnCg8TshW6mTOIDEZyIohUEEAAVFEP8HBVCzH8KKwLcwgr50mtOQMlHIQwmEyGVBZVYElS9o8ixe3PV3bUPODhuaqvkxGnhXljyzLyGTSapnJmuKSYtTW1XYXFjlHvFOv/UKIcw6PewCCqKqTM4lVWpXcabYYuonG6QPSMiGX36euIhfKKssOV9VUnrXmWZdGpiLgXEYylsLoyKjFO+WtTCaSh6+1T4cjDyCI1tVVny4tK1k2MjyG3OMB2Yoq4xyRcBRer08nSRnhNZ0JpuSaqc/tKzi68yjGRsZQ31hHV7Qtn8s5F6OB6BuVv2rWFo1FAIAODwwW7HtpN7yeABrmNqiry6oToqQGyzCAQXv25JlPDPT3/YVGo5msrqr5r0JX4blz589+2uPzPWC25Z2tqan5H6/Xd+Jq+/jyx7+KX/7+lwvPH74gnjp2Bma7BcX5ZXpZBo2EYnDYHfAO+jGVP2U+sfe0puNCFwpLCtBY01AAgKbiqRtyWPFoHABoLBa979SpU5/Zs2ffnXv27NWNDI8gkUiBigIoFSAzGTqdiPKKCsyfNz8xb/68042NNfuLilx/KisvOR2LJTNGo+6m5nnV6mUwGY0vts6t+8z+fXtL/J54lk8pS2tNcn16JAsfUJ7SnCm5J5LlaL4cw6ksBUEYGMsAJA1CAZWgsNtCZuCZLJqbC+AAJMaVJDslUIkUoCpYbVrUNFRi/vz5ky2trWfKSyr+eX5by5FoKHld3GRUAKiAUHV1xaTZbBAqKkr/+LOf/yz28EOP3oIr9drm943Amucw9nWd+Rf3YMejBg2L2u2uEZuz8uf2wsb/jky50ybnJbiIwWQEBBItr63sdZYXLA2Gw+AShSzL8I4HEA3Eiy+cbb/mPu15Zhw5fIznOawvVVQUf/jYUarhafnSOYXCOptOAbFo2hLwx/JeU4eVA9IJECBAhMAEEJmCZMUhKP/zz+3MvB4JJ1nxAiAVTyWsFhtOnT6FoqKiD+zZvfeJrS9u0egNejz2zscq583lu7e8+NInDxw5TKsa6+e/4x1vy1//4Np3jo16EsUll/eLpSIpEA4CRkBlRYAyJ18GTmC2mfCDb/8ImaSUgkQgcBVEooJAFLiASK+P7JRzjvev+jDkDDMd2X/0k0eOHPvirp37HB3tXYhEI+CMQxQ0IIRAq6MoKy/BkiVLw21tbQdqamp/1tBQt7e7a8hfVl5yy/J3eoMKVpupt7qm4oXq6opPBiY7wJgMxvh0kpZnz0fuupvGQ02rIk0LJ023yCg5Mw5OiKKaRJQ2G4X+RIYgkCxQVIDMLoELOAcMBgPmL5rHlty9YLS8ruTF0pKSX9TW1nUDSj7TZL0+J20yGWGz2YYXL277a1mWRafTeaSsrBROp/O6tnO9lk558anHluFb//v8A1PjvfeOD56DinLjmG6qsXlB3t8a7dE/SJxdxnXlcDmw7YXtcoGr4Fhhiev9nee6IBARoqBCMBhCNBqt/dDffwA8wUF0r3wNFLjyYTabzpeWlkzqdLrSaCqptEDnzlU2mR+LxfP9/kD1axtrZp9yVBBAqSKrjSyUH8BlibU/V8vdHDSndkNmIps5Xtr6Eu5Zc0/90SPHNe4RD8CBob7RpoqS6rrTx8/RibFJhBJxzJnTVHLPPau10ehVyM+nddxyeyQz8igvVwO60q5nmnmaY9NzW/Htn/3jnTu27/r69u077jyw/5DGMxEAOIUgaCDJGajVajQ01qN1QVNg8ZK2Y9XV1f9RV1e39z/+7cnkorYWLFp8a3Fnjjwnzpw5I1dVV/9xUduiD1w402tMxJPTVchpql16SYeS57zTjHmanqOsFqUC7qTKspEAnEvgROnrcxUXoshZiKmxSaTjKUUrJHtNgwAqlQqtra3Bh9c/+ld5Jea9TGbsZhy03W4HlPXQwVs6ea9iTI7hR3/aXz062PNEYLLPqEYC4DrY8kuYwWzeqDdavHL4ysVQRUUFNBrN8ZLikoBGo7alYxLUohqxaBShcKiOc24MuSPRa+1brzPAbrdPFhYW9dntttJY8Eo1aVmWMDU1ZfD7/QteUwg2mZnk5FkiM8yQLmJ//hEWm2aJfNlyI4vRWbhoIawW60RZeRl0BgNsjjzk5TsntXrd9qLSEqbV61BUVASXq9Cj1YmpmYrZORNEIYsEVp78hGb/LSLbW4esIAaZ7rkD+LT6EJ9lA3bYHwFUUBWXlLxj46atP/vJ//58zfMbNmvG3VPgjIAxDrVKhYamWrz3fY+l/vZTH9v/vve+952PPPrgOxYumrvNZNYlv/HNj79mVdHCwkLU1dadaW5qOl5S4oIgZHNPVAAlKuWhyHPULJcx8E2rEU2frJcZz86XwrQgweY04x3vejRy3/33RPUmNSSeBidsem4JgFgsBrfbbZ1wTxQf2XGaCeLrIWNwa02SxuEZaUciFljjGbtYFg9NQaAiHPnlcnll3Y9LK6q+Hg2PJ8121xXfNZvNKKsrPZWfX7AvLy8vq66lYKcmJ6fs6aCkzikUvZJlT0W8rKysp7i4ZMYpu3TOGOPw+XzwTE5qXh9YA6fgPJsQvSzC+vN3WDxL85pTcM7dKLn/L1myBFqN5qn77r9vUWl5+T06rS4yf978/3DkOTasf/v6HzbMb1hcXFrqa53b+t0D+4/H77hz8VX2kouopuOqS+/MEHzN/uHS2Kb/MbsY6/TJ87DZbI/u2rnn58888yfTQP8wOCdZZ0BhMGqxYuUS3Lfu3nPNc5r+qbauZo/P4/NrtZrXZa61WiNefHZrsMhV9F8trc3Lh4aGNZxn81acKiKjZMaab0Y0lZN+n36yzJCsy00RFQQAMvR6Hdauu1e66547/186nCg+eaz0M5OeCQhUnJ5YxjmYLKO3t5cOjw6tvP/ta54KBoPMarXe8uOe0TB+xVs3+3BgSRlldXdY3f2n3jc52i9ymcFV1oiaxkVbHKV1X0sEvWGTs/qq31ULanzs0U+kP/jxD7aXlpY9MjnmndYMzUiZwngiViqqxWsKz7oKnTh04CS3WKzPlZeXffDE4dMaWXq5jBtHOp1CKpl8bXFYl98nL2dbxJsKn5RVss9GkySbpyMoryrD1GRgbMmKxX/dMKexWhCFSH5+3rBnwievWnPXB9pii/PUam0iz2F2ZzJXB8TnnOKrG0Hufp25DuSznOcjR46hrr62edeuPab+/kEQIoAxDlEQUVFZhLX33RNZsWLZfy5qm/8Le759gDGG0pqSWW37VpjFYsBIvxsWi+XMvHmto7t3760O+KIAFy6F8TTL7kmVJ3MuHpL5pQhqphwwy548TjgoONRqEXfdvRKr197988V3LPjvyd7Jhua5TX9x4cK5gnSUX3J0XHn6e8Yn4PVO3hMJhQsjgfDYjRzXtYzLMXScO4SCfNfiMffoJyMhn9ZiNmUKnHlbnIWlmxITh4PagkUgROGrTwZ8EFQabXBquJZDrtBodYMGm+sik1JJtfFKHrJI0A8xFls2PjiwMOr1wmEvREXt3JOOwsrHMxFfUF/Y+Ipjs5facO7ABeh02p0lZSWfPX3ijD4jS5BkCfF4XBdPJPTpVBqvZnqDHmaLpdNqtYypNaqqhJSawXKR8xVKJP26RFg8dyfnukinOTZej72/tkayT11KRICLAFdBwfQIWf7u6YOMAXg5G6M/+7qmpZOSclPOwKdcYTyLJeIUVKaKvPh00+3sJtof9iMUCyOSjEBCGgIVoFKLmL9gDh56aF3nHStXfL+psfHXwWAoBcygUnkdTa8zwpxnGNz03PbN5WVln/Z7z0Oh3SJK/ilL86JoUyq4KQDIsHSWG55e0tYlAAOBJEtgPAWTSYPldyzm73zs0U1Lly78z7HhkWRxTWmnyWE8prfqHkrGw0rRg4ugnEKgQDIcwWjvcIFnwFMXjURvyGHNiKAEzKjrE0IQDU6htqbOOdzX/u/unkMr4sFxBFUCYq6yxyLhebutjtLPBQcvdCbjYUQjMchqrX7gYse3vaNd70/HJo1GW17E6qp61lZQ8n3OeQ+T40wQFRaFaMADgzVfHOjY/+DkSK9OnWaoKGhM5udVfiPlC502ZPntr2WWQjP0Br3HUZIXo1pBL6czkBhDNBZHLJZEJv3qDstoUqOoyBHOd1miRpMaiXh0ejpmrsw0am3Ba3rF8Rk31lVFjN4UEdalqJEgN7kvW6bdrM0iBUVmpORzY8g5qtnGZ4xLCvsAl8Ehw2jSYe1997IPfOB9G9asWfPYxd6hn0BAyuawvh4Te1XLKzTj4O5jKCkpfqm+oS4piBQAAxU4hGx1T2mRUY5DZhlIchqEchAhd4wK/xShHCASBBEoKS3EI297KPH+v3zvr5YuW/6xaDzTWVxWisX1C1PlleUjRcWF0/MyXYlkQCqRwkDfgGlqyvv2eXfMJ1Ff5LqOJxwaRTzmMY4Onf9wb8f+Z4YuHnwq6D3/eSk90sq5LKxsqYB/vO9Dw72nlwXHO0FT48iEBjHWe0rdde74feHg1LdcFfM0PB0GIxIyUtKclGL3eKYG8ybG2zX93Xsd7We3fGyg+8A23+jpL1AhZUzHBhGLxXB+12Z4BnvvHxsYfG/YPwWtzgSTLb9LbXMd05nzQFSvfp41eg0cBXlDtjz7BaPZCAXsyZFMpkgqlRKTydSrbsNqtUCtViXLykrcBS7nDFjDjHkKR5BMJle+trAGfqlik01rvup3hnqHoVKpjF6ftzgQCBCrxcqKS4rHgoFArKqmGlR1uRPwTvggCFQ9OjpWFgwGRaPBiIKC/Il4LBGsabpy7Z17miVCSfPw4HBlKBRqTKfTcyPRiCMRT3C9QU8MBkOfVq09Xl5e1pVfnj/BOX9Fipir+txXOcypqSlQSo0TExPFk5OTsFgspKysbCKVSgWLi4uv3Aellylvz2ruMcNtzvLBIIiK3JQgEOTnO/DII49kHnjggZ8uWDD/8XA44nv0bffPfgCvoVVUlcFut59tbGwYNZtNNV5vEAQKyydVJDnBuKI2A3DIsgxREEGpAgqVZQaZpSGoVTAYtZg3fwHuuffu7ra2Bd9atGj+M8FgKFFZWQoAOLbnCKx2267q6poPd5+5qJFTHJzJYEzIRpgihofHMDo6thCAIRqJRWd7HFwK4tSBHaisaXjPyMULP3APn1er1IA1L/9drqIqd2FR+B9PdQ129ncc+UzQ3UE1PAw1V0gDZZJBOu4FZclKIGoUVUhxmePor788Mecdn/+qyOd+b7Q7VRsODCLp78VAZKI0E418syqdnOtwVX0hk/J7mu9/tMzd3f7NycEeKziDweGCymJ54WtvK5z61h9nR2djs9jw2D3vi37ycx87bbfn3T015lWUoZms1+o0c5LJ5P5X24bD4UChqzTx7J+eHs7Lc0z7i0s8+EAoFEI0Gm143ZaE05XCaySAA94gbA4rDuw++JnDhw5/dmJighcUFGDV3at+17Z80d9H/JEr4suR4RGoRNXyAwcOPNnT3aO159np6rtXP7981bK/DXiCSVuBFQCQSCTwzM/+hKH+4TL3gPuD/b0D63p7LzZMeCZs4VCYxOIxJJMpqNVqWCxm5OU5Eg0NDWONTY17qpuqfsY5P4arJDlVopI7INNwBp7FkPBXPNYLFy5Aq9WuPnTo0E+Ghoaoy+USVq1a9T8vvPDC4+FwGGbz5X1jKq0as7XcfhUaFjE7ttkF0mq1AEEgcBXmY/nyJdGHH3nkvxYuXPQv4VAo/HJs2O00g1EPrVHldjrztpeUFtYEAyEADLmVld1uQ36+HfFkFIlEDOl0ElJGhiCKEEURhBBYLBaUV5WjrqE2vmD+/Bfnzpv7+NEjJ3oWLJgPh9M6va/i4mLkOfIOlBQX95jM+pbAZBSEqLJ5ewpBUCEYCGN01F0+MTRZFI3Ge2ZzDLGYF5LnIua2LW8c7j73eW/vWTUSw8gIMka9g/AM9xdF68P/lmcr8HmGLxZRKQqRSCCyDCKoAE5hNltgMBr6AWNMECIoyCsBl6IgonFjZLJ30KI2fmdk4Pw6j7tbSKfDGLl4Us0kvI/LwmhRbd1vfOPDX5kYOt/C0z4QkcKYXxQ22J27vvrLkyCvwLv/ctPo1XjuyRehVmnOmUwmJfHDGGRZgixL+tksCQHgc5/7LIxGY9BsNmejZHLpWiYETGbISBn62jqsV4sIXvZ+doCal17ctmrfnn2Ovt4+lJaVYl7r3HUAvk048bx8ExfOXEBTc9OS40eOlx4+fBgF+QVoqmtaBEDHMizJOcf4uBuCIFgbltb+5fMvPP+RzuNdc/ovDhCPxwMpS4NLSFZ9N6v0K6pUujPHztZUVFfULFuzZP3SFUu+O7d17g/DkXDSbLrkUC7hewjILJeAmzZtwpo1axbv27+voLOjA2Vl5WhsbFz2xBNP6IPBYPzln59OFE9vfnb7mRYBnWWEtWjRQtjt9sijjz484XK5nliypO1HU1NTmfz8/Ju5Cm65WfPM2PLCduZyFWyprKz4cEdHt5rLHLLMQEBQVFSED3zwPZNqDRmamppQJ5NJrahSFWYykkejVseMJiO1WqzjTpfzWFFJ4S6Xq/BUMpEK/8V7H71iX2qNGhqrzltaUnyuoMDR4vMEQKEGgZi9fEUkkwkMDQ3nT0xOLhvuH+4JBaKw2K7du0kIhVi0iHgGzr1vpLerAZFJ6EkGjMsQCEM6HsBA10nLqNpkkaJTEGSAEhVARMhcC5maYM+vjOiN1t8ERk8m7aWLlO2KRnDOER24cKG4Yu77tXrrEyqd5aODF49QlvZhfLADWpXhM0YN/6BvtKvAP3qacJqAyuKA0Zl3UO8sPxoPXV8qrrCoEGqNOmizWZlAqSDJMjIZCZIkIZ2ZneD5fevWQqfV7bLbbJ8WBFEHEDCZTD+Ecpf8a1slnHmDkSwwjwCMsRSugmqg0wBJQpjEwSQOLgHRSHwUQPRqN2rQ54co0nwwABIBky5tmFCK0yfOo7S0uHrXjj3f27Vr1wMH9h0QA+4ARKKCzWZFfn4+8vIczGwycc45YvE4nZz0kLGxMQRDQRw7dhS9472Fk5OT30qEE7qlK5f+W3AymLbmW5VjzMEYso4u12g2o7RwhQV8QYATHZcAlibgEhCLxqeg8MBfYYzzl23vtUHcLlq0CISQX1dXV2+02Wx9iURCeqM5q5zV1lZDb9APNrc0Bvfu258fCsRAqAgmM0hMQmFxYfuaB1a8W07LmWg4pmOMlwIYMxgNMZVOJIQgCSDxas7cWVaArc9skksqyi8Wl5ejq70fXFZAp5RRkKyO3tjouOj3+d/x8Lsf+H1wMvyqiZuQL4i4JlU1PDLysH9yDFqSgYrJkJgEaCgYASwWC+zOchbxGkhwapAk0iyL6tfD5qyEs6hqg85eu0VQXe5gcseUCY8FnaUVXxF1lAlq6a8HOw5o08kERi+e1WYCg65E1A2a8UGialgd+bA4HAdOH/9lsnnu+us6F3q9Dmq1GjqdLlvouARLmG0WV68zwGw2dRgMhjG1Rl2TSmQwnZkl09Wj19hh5f6hsJ4BVGmfmJrynfnSRx+Xv/HE1172eTL9kzMCKqtAmQqxaMIDID42eiUKlvE0wDOg4CCyCpRrgWzg6A8FkGexNu7bvf8XmzduXXri2Clk0hkUlhehubkxNX/BglFXgWuHQac/arPavJmMhGQqURiORu67eLFn+cmTJ11nz57HhDuI5/+4Ravhmq8Y1Max//vVb381NeKFs/SS3mAufGWcTyuevBJgkyUBgasgZDRQZwxQSXpIcRYhhFwV15BKpRRHT15brG2RQi3szb7e0GZx6OFwFAyWVxf15hVY8n2BEAAKIgDhWBBDo0MEWBEdHvEkqmqKgwDGb3Rf1a3N0Bt0JworKiMq/TFTJiGDyAwqIoBJDIJI4J3wYrhvuDXsiRTFIrFXTQClEglwmc0PTE01xuNRaNQAl5QiQRoU1GBBaUPbcGlp8z9Hfb6SKd/wX014LlZMTo0B0CGvrG7E7iz6t9BET8riunpXgcpcjFTcHbIV138xxdHBRMO3RjrPWBDxIDTpAZNTEASAgsBico0bDXkbKyuXQKO5vuU/pQAVlOKm4rAECFSAIAqyqJqdi/G4J1BTWzklimRYr9PWxKJpiFQEFbgi0kGU++t1irCAmWngjCSlXEUFMDouR3VfilZmfv4SN87V4wqS/TsF4YLyYhQAuJGqKvftO/Bfz214fmn7hS4IVMTihYvYPetX9dQ31v1LVVXVrrwC+xiA6SZVKSNBEIVftQzNaWyZN+cL27fveu+WzbuEWCiKndt2GwsKXJ/90uP/sDsSDg/NHPP12HQvJSgoz/ZWXgNEeyP7uPz7N/X1N6TpTVp8/GOfirzjnQ9vKCoqXH6xZyTLLc4QDocRCgWr/N6YixByTecxA1Kgyv7MYAapHgBY7TY48sw7CvILdjoKnI8O949CZEp/ISEEoiAiGo5gqH+weNIzuTgciryqw1KrVRBE8XRhcXEfEqX1sak+yNyIDCRIRIuysmYpv7Ds3w/t+K+f3/MX3yPWSP7Wkrrqf3OPj9Vm0sSY7yz+pc5W1q6Oea655Nfoi5BOBROukrk/1mjUslGt/Ze+M/vMUtQDmu0+0VkccOQVdhpMlX0ZYeS6zwWhmE6rkKzCtSSzZCQUvSBlZsdvYLGYAYBbLBauUqunCR9z/+Vu/te4+XnGhZFd1FyrcnVFv9cVf7/yOzwr9c25QmBPGVXIKOOs6vzpc9/Z+vzmezvPXIDJZMTylXfwtffd938Lli/4mr3QOsY5v6L3K/tESHunfGfvuPuOT+sMxngylvnIvu176cSYB6dPnJ3bPLflQw/e+fZ/DPkiGHdf/uC+3Ee/0oVErvHeVexVlpjT83tFTjA3jDefxzJorTh48BB0Ou3uyqrq4PFjF6zpFEcqlUE0GoXP59P6AwHVtah6uRSFb6wTGp1+hcc99sVUMqEvcLm25xXkP5mJjnpURgUUKyQ5fvCd/021zm054ip2PTrQP6jQ0ECGIIiQJQZOGEYGR8TxsfFldz5wxx/C42GYC1+ZdM+R74S/73BfTW3T3zpt2u8OdJvnBSc8iERC0Bnz4CpuPmvNK3xq5f1/B85CXNAZj5mNxoc0xoJCWeJWtVp3TkoFmMrowquZWmMFS3lkm7PxJ2pC9HI68S8D5w6JSAYgMcCaVwazzbGz7/SGWPX8R6/7XEy30Uy3hQGUUJnJLEZn2Xiv1SrBi1qtnhb+UE5S1mFl45fXpzUnx1vEL+8RetUJIJf64wBAuAq0QOYUnAhgXMFBUUahIqLhxOFj39i8ccua9nMd0OkMuHPVqsT6h9b/pG1J2zfDwYj31XIXDmceRgfcoXmtc78xMTi+oPtsV9tw/ygudvdhoK//jgmpXzsyMJrMfV6hz6VZHTsKQaAQ6NX3QSjJNktfSiZeazwSk8FkpiwxX8H3cJZdiuZONkcWz/LmteLiYtjtdndpScmEwWCwJuKhbPGEIRAI6ELBoDMai121asd5DN7BTugtea2ekb7vd505sjAejSBSXXuvlG6aa3OU/aMZ6A1xCYSIOHnwLHR63YmikqK4Vq/RZ2ISZEgKiSDjgEzgHp2Ad9J3XyqQKg74A9fMXKv1NnAuI3rhNzvzq9a8TaszfWBizDN3whtYa7Rao2Zb8b988NFHvb945gVQwQooZz6UfV23UU0B5MQEMzgKf1ZWyyqltPQ3AxeOaUEFWAuqxw1m50tqneWGsJHJZBKMM2TSCm8/OIVer4PJZEQ6PbukuyAo97YoiqACBWMcuds95wgppZc7LJkxUEJILB5zpNMZrU6n84LzhE53Y1xG13vs5BUAl9eOygRlEQ2q5L04RXDSX33q5MHqgweOgHGClXfdye9bf/8PV6xb8XXviC/prHZgNmYzGvHEPzzhefSxh14qLy1tG+oZg38qgKlJT1U44C8QBD40PaarHusrOKxrv33L7c0Az726UZhMRm9+fsGAxWJp8Ez4QakAEI5oNGpKpZOVyWT8qswHiUgQeWW1juGuc/9+8cyhhXF3JyhlGOmYILHQ1Psq6xfOc49f/Nhk7/GDcmAS4wEZNputs6auut/utM+ZTE0BDGCyDJGKYGAI+UO42HOxcGiguSQRj79qqY2Q6ehjMObz/HNFQ7HWFo3eTUUxaCssPfqL53dCVGlfbTOzNkHngpz0hE0FNV8uTWWCsXj6q8FwWNBbXE+rjGWnSHLyhrbr8/lgNBo14UiEAIrTsVgsMJvNSM8S1mBQGHG5Xq9Pq9VKb6qi+M1AoPTpypI83euBiYFx0AwRj+8/dt/mDZs2b3z+xcPt586//9CBm2C6mE4+5RY0SmhnsRhLPveNTyLqu7yCnwseSDZaIiCXr4WuEl0QQqcJVwgIUskU9u3dR/fv208TUgoN85pw34Prdi2/c+W/TA77ks7y2TkrADA4zXj7ux6ByWQ87sjLS6tVKiQTKXinvJZIKJIXj8Uvy7vlgLHTeLdXSB4VuFyIhKOjTGLKsXJyzfUeB8sqr0zP0FU/dfUXLlVZ3mRmNpnw3vf8TdrhcJx1OPKyvQYUXGaIhCNIJZMVe/fsu+J74aAXOlMR9brdHx8d6L4n6huEnsagRwRaOYzQWDsunj3YPDU++k2Hq9ESTyVgMhhhsGndxSXFO/Pz85UWn5wWoZIyRTwaw2DfoCUUCr3t/jsfQCoyu5sVAAx5BdDZ85Ousqot+UVlhwkh7FY6q5wJ2gKkwt64raD0u2W1rT+qblrUbjA7/jQy0M5VuuvH2iUDCfz+V38AAVkYDUUpJQRajRp6vS6o1Wv9KvXsFnFarRbzm5ekE4nEWY1GDcxIcUzjOJFtTgt5Azh5/CTOnDz18L6d+/7vF//zi0V/euqZ4uGBoVWr771HCPuDNzY7042iDAJRPKVAOEwmfRXn/IojudReIkLgalAmgM4sjV2lhiZLEpisLH1EUUAsHsOFjgvwhfywlliwYt2yzsZ59V88cuLgVH7Z7MBwM01UqwBKhwS1GOc06/E5tQpUVacS1GAzKoEKak7RVlM4da/uKJx5+RgdHO3nEpdpNiok/JXX+pxL4FxGlqH/6h/Kks9xKO0j02J6ygm4sfP3Bjd7nhV/8RfvhNFoaLfZzUykBIJMIDCKdDKFdDrt/MVPf3nlVCk/jD6P5wHP2CChJAO1hkAtcGghwcgTSPpH4fNNVMWTcUtGkmApMOHgzqPIL8g/Wl5RzlSCGoRRCEwAIxKIIIMzjpHBUbjd7ntGU6N5wWDgdk/RVU1rKYYkk1BBed2Xymua77Pb8g8UFt2Y9kA6lcbPnvupLh5OLAx7IyAyg04nwmw0+CxG86TC2PrqZskzY/36B6BWqVNqtebSEjBL2aPX66DT6wYpAMTjCax/14OY8nofPnr0mH1ocBiJRArJREpCLiy6ASPTla/LqTym37/i90vYjZnLw2vtnXE5q5qi5G9kWUYu0dq2ZBFf1LbwN0/867fOtMyfA0JvYnFELgE4CVFSjDk07uWWhTZkc0rX3CDPsSu8CuR0mojuKjxO05n1ay3B37yLQqfTAbVaM242myUhy8lOCUE6nUY8Htd6/ENXfIcSAhshYSKQozqjFRlokJJVkIgGGU6RlAgEnRkGk+mU0VE4pdYonQYlZcUoLHKdKysv82p0ahCaPf/ZQqNKUCEcjGBkZLTOPTJWFY3MukvndTe1wQ61zprQmfLGNAYLU2kNN7SdWDKKRDjm8Hg85ZFQBLIkQaAUZpMprLIIGYNx9tvVajXQaLVKBTXL8ybLyn1tMplhNlu6s0tCCs45SSbT6kxaVoj2OAVjSEPh7LixWbmsTMgvgSun/3T5DXgZCJPn2qX5dBTDroJr4kzZImN8WgqcUorikmIsX7psf2NT4y+++tWvwmaz3eCpvbS0mlkFyZVbLxHovZxFlb/iMi+TycBgNBiokqUHAAiiqOWck4j/CqD7yyhRlG1fT5/gzcIi3shmMBhgNpsCer0hqjgsZU5SqRQkScrnnKtDwctJ5AyWPPSNdaCwpORn9a0LDztLG5AmZiS5DhmqQ5zqYS2uRkFx6Q53z4GEIdvsbTIZ4SiyDRWXFJ7Oc9oBykHEbLGFEwhEVJqheweN7rHxOV3t3ZDSN66hGwgEwDknPp+vzOfzNUWjUW00+sZygsFQEFOTkw1j42PF4XAYjDEYjEYY9IYuQkhUp59d/tvjnsTX//krAoD6aDQGOUc+mfUFoiiCUuqjAKDTKm0EAlUphG1UAAFFOBiZXNV2z01f7RwKWjvXS8hnrE0v/2DWYc2oeDHGIUkKlkOSrqw45A6Iz9i+VqvF4rbFmZqKmv/c++Juz82QqjHMqL4RxWkBioNkjCN3QkQx17cHiIIAMdu3djXru9iP4pKiVkEUFaEpSqBWqy5n5pthoqBS5NzJjP4qSi/b70ybdm/TZIJvXoeVTKZAqThGCfWJopgNM5UISxBIFQCDzK50GnnFTVALvL2ssuajcxas2FJW1wZZZUdGZYS5tA6umuZd1nzXC3mFZSBEUfnRG3R48n+filps1t2FJYVgRAYjSuVWYAIoo2BphtGhUerz+h594J336yPB8PUd0AyLRCKYnJwsPHr06JPbtm3b09XVtercuXM3vL1bbWPDI/jnx/8Jg0OD9/b2XtRJsgSVSgW73Q6rzer91Ds/C4Nzdg4rEU8AgBiNRZ3RaBQsRxOUDQhUKhVkmY1SYOZTml7qnwGFJLFMc0sLzPYb00V7pSf7Ky32+IzvKYRdOerIV77hCKXKBZN1EgBQUFCABfMXnGtuaj7UtnQxbkbXbZqCN7sfWZYVZtHsOHORlSK/TrJKLhwqlco00DeAuO9KinZJkkApVeUOmjGOdCqdIIQwk11/xedT6RRkJkOWLokuiNnG5ssc1sv9//Q/3rxLQrPZBIvFDLPFnL24swywjCGZUjpkUq9AIqe1VUMAueAoqflkddPCHZb8clgKStG8YPGZvJKqz04EfSNac/mlz5s0WNA2HyWlxecqqyuTVEXBoOgjUi4ouUhGMeGewOjI2GKfx18WucFlYTKRwN69e9HX1/eurVu33vXHP/7R6Zn0vGvZsmWiz/fGaETIZNL4+W9/7ujo7Fjec7FnOrq1WqxQCaoL737/u2a9rVwaJx6LQZZlCIKQDVgUlW1HXh4KXQXx7NU+84LO0hjnkFo3cbHnAIsKM1OWl0xpXaEAVAaHns5wagwA4vFEaTAcyovH4wpTJhWg1RnsAIyNbXWpqzhB+fThM1SgBBk5DbWoRmNzI6+uqf2NaFZPOc356ptcEskdx9rLIpGwWuYZMCKBg8scSHFk5YYBEJ6tGhGOeCoBvcmw5okff/MXACL88q5JDsC08dmXSlKZFGTKQARArVHrOOcaXOmdOQD9Sy9sd8UTUTDKwAUKKr6MiSFXiSUK6ybAZ+Tc37wRlslkhMVihslkUvA7WVoSWZKQSqQADqSTV3dYhBDIkTEQQYwlksmpjCRBq1NDI6r8WpVKsuY3Es75ZQwd9jw78hz2kxVV5d12p33u5IgXTJ5Rp6YU8Ugcgz19zrHB4ZZoNNZ1I8c14Z3C+9//fv1vnvztfZ3nu5CRJESDsUYA2kQsddvXhZxz7Ni0HT5P8J6B7qGlPk8AcopDp9Mjvyg/4nTlDyUTyVlvLx6PT/+UpIzCGCspqxu1RkR+gTNutVlOZR1WLmRmuMQWl+Nev3mOP0EgoNkKVyQSwfn29iW+VOB5UM6JUgEk0Wh0TKUS7dForOH0kXO1gaAfMpERTybgmfDesfl3O1+QeDItqJWcAWMsG11x7vNMNXgnPMhIKegtOnDCWU9393t6h3rvZznml1fI9cx0ZsIMVO5MiIJnfKK+u7tDL9EkuEig0mmmKBE7OBcUdk8AerUeGpUITmSM+zw4euz43al0apNGI4RAZMI5g8wYOCM8nZadR4+caHFPusFEhnAkiLGRkfWbn9m6iVFZlomsMFpmK4epVMp45syZRWMTI5BVHIJOA5U2G2oTirg3ine/7b34+Kc+aoXAwAUZnMiXioM3nkZ5w5teb4RKTZhGrc5QSsAgg4JBkiRI6TQgAVy+evEjEx2DYCyGb+j0Z0YHOt4TnhxASk3Rc1ZcXRyXXswvjHzdaK99Wk5PMUGtSG0p1DbqyR2b92woKHLNHR+aAoEi+JkTcuWSjOGLfYLfM/HwqofXPRd0T0jWoldHpM+0cCiM3kzfwpER99LgeAQmkwksG6xT9vrgva9lI32juHf9GvH5p158rO/ckEhSArggQ2PWwlmW780rdoyEgrPHuJosJiTjKW0imTBKmcy0+AQhFCqVGvn51pizwDKRfUxnv3XFPX2TBPfZp79EBGSoCEbU8E6F8dtfPuVUm8U1RFRwM8Cl5HkmnUY8GIeclKEWBGRScWx49o96lUq1SuIZUJFCyC67crpz6WgS4UAEKkFEOpHEwX0HhVMnjy2BmoLxHI/3TGUC5SfH5ZxVOWwNAEXMIIu0SSbj8Pl9kDlDVXUNaupreorKCkaGB9zQqXUAkC4uKdpb01i9etw7QaLhKDY9v0m1f8++pSqRAkTBUXEOcAbIEkc4HEUikYJGpYaUkfDcM8/Z1RrVPZxysKwMO2HKeGQmIxQMIRaPQRDVqK2rQnl52WkACa1GAwaGF/Y9Lxzctn8OgwzlpbSLAMhiuN6cli3EBPz+QJcoik2E5Cq3WQdCMU2TPNO47MNobzf8E533D3Wd+cj4YDvUiIJkJEwNnkM44K+O1i34n6IKudaSV/Lv0aAnbrQWwOow49iB09DqtIfKK8uSnWd6tCzBsoXcHEsBxfjYBIaGRu4MTngrorFE7/Ue14sbNuPuu+9aMzwwbE3GkzAYjJCzeZ03QgPD6NAoZEle3H6+ffH42LjisEUCa54FZov5qN6uHkumZo8j0+i0CIaDSwghrem0BM54Fv3OoVILEETBbbWaBkUA00ltzvlleSSeVYK5UZOzW5NAIBERDCJkiUCOpBBPRAEhy4UOns0VKReWShBgyTNg/vz5cnV1deLgwYPGvr6+y7jJWY6knnOAEYhqDbJcekhn0kgFk4DAwaBwJCkI6CvHyPnV211m1CjBBQlaowYlpWW474F17nkLWn9CKIn6fWHY88zoPzfAq2urfrxq7V13M8ruPnf6PCKRCMLB0OWMDeTSyk0QBNitFixatEiqqqqKHD16xNbT05Pd98u6vQmBSqWGw65HTUMt7l59x5bamqrvnDvZI89dVI+Q1w8ARIZMJSZB4hJEjQi1TinHi5o/P/mp2Vo2chZUKpUm18rFoTx8VCoVQC8lbmdaIhpGSd0y1WDnvo+4R3rzIYWhJkkQnoKKZZD2j+DiOdkO0fgZjcG6QUqnz+e+W1BYAIvV0llVWzWmN+mqgzE/BKLKIkgJwClisRS6u/tKBvpGVnqnpnpjU4lZJ6Anhz1wlubrnn1qQ9to/9i0vJpOp+MAoNO9PipFr2SR8TiMLp121wt7PtN1oas0Go0q3SYC4ChwwO6wHf7dL5+R3vvXj816m6FQCKmU1hkJx3SyxCHLSiueJKeg1aqQn+/kKlHDLnNYAr0kBMoYgyiKxh8/+X0Ep2KwOq8fp6FWCQCgyqRTeiZlwJgEi82G1Wvukqz5pjgV6XQOJqd0AgCcS7JKJQ431je8WF5WdqSituJjI2Mji5nM9YTQafdCpnPyQpY3R1b+kF3KMjAFQAkCKlC8Ctop65z5ZQB1zmWe4cmkyWxSuYqKjlXV1Py4rqHmBUmSp0FtxZXFOHvu7NSSlUs+ne9y/u2itgV3RmOxEgBEIe+gWUWd7PbBQCkhFovZW15W8YuqyurDlXUVnx8bHW0DJ1rCCeeEX4qQOFg6nR4xGAyp0rLSU9UN1d/yTY0Pz13cqgxSGQanaiobzHq4il1YedcKXlFVceTTH/609I3v/P9e40v4tpvVaDLW5iIQQGFbVaqGwNUacOPxJHRm0IA/aI5GIlDLSpVZoCKYxCBSgmQ6hWQiIXDO6My+TJPFCItd7y4pKz3syM+r9o9PQkWVhD/ngMw45EQGHe29dGR4/J0Pv+eBp/1jkfjsDkXRh5RT8tzR/tG2qVEvCCfQarUghPQAiKtUqts20TzGcfrIOdg81nUdpzofHO4dBTgBFzmoSFBcVpx2FOR1Wmzm69rulo0vYc19q5u83gAymZz+o8LVX1DgQH6+sxNAWASUkuH7H/wr/pd/8/6L2YlBOp2GzqBr4ZxrJkZ8r84kfxVLp5MIh8IOKRmrkeMRqIiEkrICrF6z6snWRXN+IHGJkukcGZmxNOWyWiuM6E26oJSW5ftrinaFApFKJjM9zWbyCch0TzVh2eoQkZSkExcALkDmmWn1X0EQrt6LmNtv1qHkuNNnxpqEsqQgUpVGp+uT0pnoy7ejMSmRDGe83VVW8Hfz2+ba06lMCWcgnOccFp9eqoBwEMqJWiP69BbjUMKfZOseve9IPByvgAwdAeUAg0yzNwkHo5SOGoz6pKAVkgAyM0GwRCD48X/+SF6xavlzj7ztkUbCSKamoXZTXXPt/37jicfhfIOS8N0KkyTFScmyTBhjWbCuMm+qLBeT6iqcTIKoLOXNVuf+wqKqu3xDMTGTSoMKHLJAkYIaGpMNZqv9gsFoGk/MoGq3O8zYvnG/XFhceKGqtgr9nT2KhBiUa48QAZKcwbh7Cl1dfSuaL4yuCIcj22dzPP4JH2wFdnJk++G/7LnQnZeOZUAphU6ng06r833kPZ9gP/v9j2/bfE+MT2L+3a3Gjb/d8tFDew/r46E4VCoVMjQNvcmAiqry8cJi13AsOmv/DAD46tf/HnPmbnKMuycgyxyUiCBEKdY58/Og1+n2/PoXv8mIAGAvsGLT01tg0OvdJrMRlALJeBzRUMgMQJvJZG7IYUVDUXDGVSFvQMVTaagEgjyHGQazpuPIgcOn177j3tluKgGg47adpVla1olIACazr+uxGID2G9mv2WxDKp4ACJ6qq6x7SSWqGdULfmTADDcB6fhzsGQygUTCiHQqBVlW2mMIUWAmoihmAHBFWedyszkrEJvq5+XlNd81qSnxGDQfmRjoKoqGvZAApIgGlUXlcp4z7ycTw12TxdVtl32/sroMJrPpxcKy/E9pjaqSVDgDkgU5UypApGqkEmmcO3vOOn9B6/vWPHLX7oA7LNmKrh15TIxMIRmT6k6fOr+2q+Ni9tHFodKqoDfpYHfcKAD65i3sicOUryPnDrV/6Njh46sHeoYgpWRABXANRUFRAQqLXIfsTmvvbHUEZtrIsBuTXoXyRiAcIEoFPd/lZM4CZ9BoMl4qARaXuOByOacKi50ZKsiQknEEff65PR0Dd4+PXz9ZI+ccAz1D8I775o8OjjsT0QwYZ8gvzk/ZndaekvLC6c9xzkXOuY5zLmR/J5xzdfZv9M2M1L5VptHroNHpZK1FPykYRC8hhBH1mxd/lbNkMomA32+LxWKGTCaT1R0k0Gg0kGW5A0D4ajksADA4qyDq9bH82iX/XD1n2cfqF957ylm2gFFDCQrKmlBaXv0HR17e5rw8xxXRucmuR36RbaCgxN5hdhghEym7hFeoZgQugMgMQ319aD9/Yf1g1+iK3ot9r3gcnHE89ZNNsBc5K0+dOv/9o4dO1QT8QTBkIKgI8vKtMNoNE0vuaMPtMCYzPP/bzRi5OL761PEzXzl+6JSGZQDKVICsaHCWV1TAke/c9+zvN8yaaRQAhgY84Jzro5F0dSSaACcEjBJwSmCymlFSVjZQWFR40u7Iu+Sw8gucKC4tPtrY3Nhjs9uQltI4feaM7uy585+urqst6uwYmHWLB+ccfef7sXzFMldPZ8/ftbe3q1NyElaHFWVlpeeKS4qP2vPsGBwYgmfCU7Z3777v//GPf9x+4MDBL0ciUdtA9+Cy7Zt3/O5PTz+36fjRE38TjcXUw8PXz4T4lr35TZIyiCfixalUyqGADClACNRqNbRabYIQwsz2V45qiGAEWISRRGJjaf2chxoX3fnt+UvXbmtpXfbNwqLyzyajCZ/OVnXF9wSB4LGH3pEoKi46VFCQDxACQRAgiGI2V6kQSsZCcZw4esLR2dH1eFNrY+FY/5U031zmePxv/wn3PtDWduzg0f/b8Mzz6zoudIFmGUtUKjUKClwBi8Wyp6GhHrfDhvqHsPY9d8w9e+b0j7ZufqloatKrQA40KhBBaU6urq72lZWUHpk3bz7M1tnnvEPhIAb63CWRcLg+mUxkFYlkMC7DZrOipKS4x+l0jJhM5kt8WGazBX/x2LvHHv+nf/zt3IVzn9i9YxcGhwawZfPW1QIVflpXW/39cCDazjkfx1XkroAZmn+RRIHM5SVbNm350Etbt90xNjEKruFoWdDCa+tr/vitx785+YkvfgrlhS6yc9uuL2zYsOFvL1y4gMWLFy8TITpGB0eXbHhuw/Ip/xRW3LFiKSEQn3n62R96JiZR4Hrz5mPesuu3cDgMtVqNcDisFI+4UozR6/WwWKyz2gYRFIfGOXfnVbq+kaeUMWQATP0K+D2Hw4Ej+w9Dq9NuLS+v+Hz32X6zlGAgWWQ2OAMkhTqo+3wPdm/bvdpsNH19/qK5/whgasbDnwR9wfKH3//AQzu37Pr0ti27as+d7IScZoDMIYgCTCYTqquqJkuKSkYD/tefAWKkexQlJcX6l7Zu+/SLz22svdjRAyKLSgVcRQDCUVBUgMrKqgOFZfk9Xvf1jXFychJpa3r5+MR4cTqdzPK3Kw+FkpIi2GzWQx/5m79N//v3/uWSwzI6TRgfcMNgMDy1+p673zUx7p7f1XURxw8fh3/K90Bra/Pq6urKi3l59kNGk3Fo+8btPaJKRRhTMvqyJPHtm3c4EvFEa8AXWDY8ONx88tgp9dDAMDJyGi0LmnH3ulW7GluafllYUgQucQAwjwyOLD557CSmpqbAJU6XtS37aG9Pr6b9XAfSUhrHxGO6JUuWvOM7333i10F/KHZdM/GWvenN7/dDrVYjFA4pOSwZAGTodDpotVrvF//uK/juf31nVtvKPoRnoqevaWWlZbDarMN1NXWDx6wnWz3RACADKkEEOIcaaoiCgHQmhcN7jiCTynysu6tn8fN/3Hrkuac3n03HUyGr2dTm8089fPrU6br24x1k0h0AlwWIRKU084OhoqIcRa6iLRqDesKQvDFWhRs1d98EjCZj4Z7t+766beOOD5w/cQGQKAQI4ABkngETGaprq1hBgevp7Rv3xdc+dNestz8y4kZpaRE2vrhtyfDwEMlIaVBBBDiBVqtCY2NdvKy89OAnPvlRWCymyxlHHS4HDu45MLxg4fy/5eD/8fxzLy45dfICejp6MNDbqzUYdC15ebYWs8UCrVrHRVGY7m2TZRnxZBzhcIj4fX7EwnFABrRqHRavXIR1j9y7f1Hbwq+OTAx5m1taMTHkAYCow+boqK2sXcoljvrqejjznKdjRfG8spKyRm/Ai7raelhMlpMA4rPV/XvL/r9jPp8PxcVFpbFYTJXJZCASpQFap9NBkqSONWvXzNphXa/p1Fq4LEXjG194fl9xcXHrpDsEOaPIjImUQIAAZAgoERELxXFgz0Hh1KnTi6x59kU6nY5TDqQTSeL3+RAOhKBiGoiSCjKj0xVwjVqD+rr6eElJ6eaOY928eUnD6zKvOWA21Kx5/759j296bsu7Th0+hUxSBmECCKcA4ZA5g8FiQGNz41Btbc2JSCRyXftRln/c+uMf/3z+xIQHjMlQq1SQJBlmiw01dTUXGxoa2icnpwC8jNNdpVODc47f/PevDq95dO3bORe+UFpW/fEzZ07pJyYmEAqHEQgFIUIAZZQwlpWgzzEliBwZnoFaVMFqsyLfWYBF8xellq5c8vOGRXVPhAKh0eaW1ukE5ulDZ+T6uvpvv/s976ZT3qkVxUXF56urq79mNdoa9Cb948FQQFdVXXW0vKz8BwNdg7yq8cZIxt6yN6f5fAHY7VayfduexdFIgoBQcKrwg5utZpgsZk7F166NxVaUh4NbDqHAVbC3pKLkr9vPdurTkqygZIgALme1NSkHFQSwjIygLwSfNwRKKBFAlWUfBBCmAZMVLnNBJGBEgswkuEqK0TK/dTKWjrcFEoHKoYGRDeWVpZPTDuU1sGRIYU7oPtN978HdB/9z84atdWePnoOKqSAylRKkUK701YoySsqLUFTi2mUr0PdS8foKZKFgBLLE8t2j7rJwOAxKhSwHFkNpaTGKi4pPUoopq8UC4CoiFLlJCP5F1L3+oQe/VlVdvX/O3KaHvd6pO9xud8X4+LiYSaYBSVFJlmUGxmROKIVGryaCVoDL5UqWlJT0FBUVna6uqt5UW1O7OZlMxoqbSi7b1/zl88Bk1lfTUv1JzmAkFAlwRF2VBT2Nixr2gXOBiDQM8BSlN9/T+Ja9uSwRTwJ2qAP+UF04pLQtESJB1AgwWc1pg8kQJsJre90UVpeisKRoR2VD1QXTft3iUCYAzkVIjEGkIgRQEKpQyjEAIiVK2xQnYIxCIAIIRIi5SiaVwagMmaSg0QuYu7AlUVpZptn4wsb/NzQywJcuXfzhC6fOfQvAlrgvmtHZDbfEcclKgzihGhUikyFHx/nODx3Yd/DLO7bssI8PeqBmWqi4GpRQyFRGGinIYgZUy9DYUpeqrCnfdPzwCbZ4+eyrmJxzbNq4DU6nc/HQ0Eh+NBqDQLXIZCRodSrU1dekHHmOF7Zv28eXLFGUrV/x8WPNNwJAUpbYhta2po3ByXDRuMcz1+Px2LgsOzLJdNJsMddNTXnPxWOxKCEEFrvFqDfqJafT6S4pLTlrtBj8mKH5dzWjygWVyL5yxgD4X4sL7Fo2OuKBRqMR/V7/XZl0uoJCjul06oNP//4PIx/9xMdgy3e+3kNSxtXvBqVU7/FMNYPwglQqMV5YXOgtqywdTkQTXG/SY6hvCFSg5qA3MIfJsgUijdud9gH/lH+4uqEaRoPx5gfyBrOswIF6zO3WhUJh5HqZNBoNjAbjhMlkan+tITFmkwE6vRA8tu/4iZqGmsVHJg6DgEAQVMjRPOawyYQTUEYhQFEnp3y6c1WBRBAOUA5RRQGIqKyuwN2r71GfP3Pe/tLmbdTrncRg78DiiRH3k2NDYxur6it/UmGuPBkM+GJW2/XTf+csO0c0FogW9Z/pel/7hfZ3nzpxuuX4kZNiYCoAQRZBuLL8kxlTKHVEgBEZBS4nGuc0nq+tq9k36bk+6OHY6CTWP7hW89yfNr6rt7dPkGUGgXKIIoXdbkNzU9NIVXXlWUc4D5Zs1fFV4+Us6E4CMJx9vWnN7/VBq9O27d61+/86L3Tk67RqvmxZ28GPfOxjj0UjMc/tGtexI0dRXlb27t279/7H8NCQ1mQ2SatWr9pdVln6roA3mPBOefHpv/kMPvWFT35y7459Xx8dHhWcLidZ88C9v1txx4oPT01NvgHaZW+9JZIJDA+NukKhYFU4rBDlUUqh1xtgNBr7nfm2iVDohlSxZm2OQju6znTDbDX/oG3Z4pX9fQOtk2NeMCZDJhIYz7WEkazAL4dIhGyPKcnyDcqQucLFr7SHCSguLcKj73h7RKPVpbdt3pHndXvBOMPYgBsbJl+wnD119n2tbS0PzZ0/d09lVfVPo6HYIYNZH8ArVPBnWq6aL8uyKuyL5PedH2h1j42t6+7qWd7d2d3cfq5d6xmfBJMAASoQQiFzAJAhUAJBoMhQCRCAlvkt6bqGup9/7Utf8z3+zceva+4CgSAYYxUdHd2tbrcHAs1RJnFUV1eirLz0aXueaXDcfYn/6/bzVLyBLJ1MQi0KjV3tnQXbtuyAXqslhfmu+iVLJUsmJd82h/WpD38Mf3pxw9LzJ09bTp88gzxngaaqvNoBDiERTUJn0uCpDb8Vd2/bvezE0dOGC2c7UF5dgrkLWuwAaCadelM6rIDfj1QyWTcxMWGPx+Ngcs5h6eByFcgAmF5/65VnXm71c+vw1K+e6Vy8cunPJyanvrvp2Y2qmD8KmSi9sgIRFUwVAzgjEKjiADjJEgwQBlCuLAe5DIerBOsevD/QOn9u4Lnnni/rPNeVzR0REM6RDCfReaYLF3t6zaeOnHm4dd68NZVV1R1OZ/5eV6Grc6Bz8LTZZBqy5ds4UZEkOGIg0LEU1wc8QWG0213lC3iXDY0MrZpwe5rHRyaK+y/2a4cGhhEJRsEkBgpxGgfGGFcEVSiHIFLITEKGZVBWWYZFbYv2z2mZ89Qn/u4TMJpnX8H0eYN4/P/3bbzv/e96d29vX3k8ngIggDEZGq2I1tbmREVl2e7Tpy6gsOiS0tVbDmuGJRNJEKAzk8pEKAQTkwjARIhUDYHOThDytTCeyoAyDoFxqLgIQRKUmJcDRCYQs/k9wgHIFCqqA2F0mgfqlfig/tztF798Eo899ujikZERtdL4LIAxBofDgTyHowdAWqfT3+xuXtUIIfBM+JFfYPuJzx+sT8VSn9y3ZScCgShAFGEMAQJoFgrAMjIESsGIDAkyIChtKAwSKqsq8ODDD3nuXL1q+KXtO8t37NglZuISKBchUgGynAEIAyUEPMLRc7oXA50jOpvdvtBRkL/QVeRieU5LyGQ2jefl5XFRED2xaKxfq9EWMYmXB/wBmkgmiic8E6b+/n7im/IhGk1ASkugjEKkKqiJBkzmAGi2z1ZZBoIwxdFChslqxPKVyxJNzU0/eeEPL4TvfttdQiDql21G+6zmLJ1O4wc//BfrU//37LrOju6scKoKkpxAYVEJGpsaDjY0VB8fHnJf9r23HNYMYxkZGWTiPMNkKhOIIs3mGRTFu9s3MDU4KDgXAVlQ1HYoUahTVFThPwWUilSGQchqHTJ2STPxzWYT434UuGzGJ3/9h6Xj7kkQogANCWWw2S2SqKI7N2zYxN/2tgdfl/EUuOxwD3mTC9sW/aOa06hWLX5219Y96qkJP2RICulkTjiVKMo+VOAAU/jLNFo1yqsr8NDDD/euWLHy6N7d++/ZsWVbfsDjB2XCtNalwEWFd4tnt8M5WILDN+bD1JgP3ee6qaAWbCqVyqZSqaDRqJtVKvVqOSMjlUghk8kgk8kgnU4rHF4EAChErlZoySEAnGYZgrP7JBQCoeCMQRZkUB3DvGXz2KIli77fsnDOC6XNxQJkGADMisCec47jR87A7w20nj19bo57ZAIswwGagUpNMKelXiotLf7V73/3TGj9+vWXffcthzXDCKMAIxCIAJErnAk5iqPXqII8K5OhgUQFMIjgEJRUbpZlR1AJYFndRp5dWYgcoJxkaXYAzt98Fdbx8UkEg5Gm/t6RJVOToaxACINaLaK4OF8qKLD7rdbXt9BQVO7A5MTU1KI7F/yTaKCTDofzE6eOn6nq6e4lwUAIspwBJwCVKASBgogMgorA6czDwsULUotXLj1dXFza99zzG9bt2Lwzb2psCoKcvfhyjoWIWSZZDkaYIjaXZQKhHOASIGUACRkkSAaUJJGjvSHkEjMJmAiaJbbMEWEqRhRWdMKnn3Q0K/QrywDXyKhqrcSd963cPm/p3H/vvdiXrK2rAWbprADAO+5D29J5+k3PvfTJMyfOmZKxtDJ2loHL5cSyZYv66uqrjhUVF8BsuTxCfsth/VnYyylh+WVv8avx7l/G6XW7x39rzTMRxH33Popvfvvxe0+fOWdJJtMgRFkOGo1GlJaWjZSUlPQFAsHXfWz5LidkSY63LWv7XqG98LnmeS3vHx4Zfs/wyGjVxMSkEAqGKdKccMa42WrkRaUFofrG2q7SkuL/rG1qPP/cM889s2Xr5rxJ9xQElo12iHBZhE+m45/c3zgYm8kFdnmzN886OFmWp2XwKFVoxnOdKrm/5wgQL1UvleogpRRUICiuLMGaNWsOL2pb9Hft59p9d91z53XP0djYOAKB4NLTp8+sv3ixLyuYqgIVRbQtXpSura39f//93/998ctf/vIV333LYb2CTVMw80un73YZg6Qo9UyTyJFpJ6RccFd+ZyaP/ZsNw5ZKJXHq7O68n/zkt4/09w2CZJO1VFDK4Xl5jrMmk2mM3ya1IEEhduSc8f6S+pJvtoTn/MznDcyZmPCok4lUqYaqCzPp5KRKq5pyFRZcLK0o7h/sHQ4azQZjRVXF2ebWpoaA9xBhyUtsuDyr1MSgVBoVm6E/NeNQZ0rfzXRGM9/P/U25ri4pDeU+zzgD4WwaIAqRorCkEOsfWT+2dOmSx3s7ensWLl543XMT8AVhtVvI5ue3rT558owxHksAIJDkFIpcTtxxx0r33LlzD1ZVVV1V7eoth3UNu7w8fPucFoPyJOSMZ5t7LzUpvaKU2oyL9LVCRN8uGxkZQSgUWtnd1T3PO+VT2FyhLLNcrkK4XK5RQsyyx9N/W8eZ5UdjANzZ1ysa5xzDvSPRBYsWfD6dTNuSsdR9Jw6fBOMKmwPLwiBo7lySnKKVwrudi8D4jP/ntps7/zMjr5nO7OU06ErniiJAQAjAqARHoRNrH77Hu/yOpZ9pmt+4s3l+0w1dV/0DA7D4zSs7Ojs/0tnRA0lS9iGqOObNb0FDff1vbTbbsChenVX1DeuwcliRq73153ADXmv8wK1zIpfENa7xmTf+dM3a3G4PCgvzzc8+8+JfnTl9Ti1JDAAFJQIoISgpKUlZrbYd+/buQH6+46b393pZLpof6RkZb1vc9glI+IlAhHtPHD6FTFyRc6OEQCUqOSxF6ZzmriYgx5Y7fa6vvCb45Tu84hMzl4qccwhZFaKCQifWPXRf+I67l3+9qa1xQzKa5DrT7PjpZ1owGILFYqZbt7703oMHD+cHg2GoVGowJqG4pAArVixrr6wo/0lfdy+raai96jbeUA5LSkkQVIJqathTceHoucpkKtmWkaXmdDpNdDpdUK3W7Mgvch3mnI9zDk7prb4TSVbYQvnt0lNodt9WPq9GOp00DPS6y32eyVWJeGxlLBqFQAViNJknTWbzdpvT2s45H+UcmdkcQxqZaSpnThQGypzAR1YlLTuAnHj0TG3JGe//mRvnHL/77TNontOw8vDBI2sv9lwEsgyj4DL0Bh2Kipx9JaXFJ71T3j+7yDLntPrPDQ7MX7DgozJn3xW14tuP7z+FaCgKloWqCESlRFRMBnLRNsF0Mp6DKRgvhfcbJBeB5Yov2S8QZBH3RCnkEKLoasqQwQmDQAmKyoux/m33u5fdtexrzYvn/Dbqi8gmx/XxtefsYvcgbHbbktOnOh7t6OyBzDko4aAqEUtXLGVtSxb/4uc//+3IF7/8mVfcxhvCYckZGVSkZKzPXd3T0/P53q6Ljwz09dv8fr8uFApBkiQYTUbkOfI+XN1Q29M8r/V/W+bP/XVf/0i4qrLkll2YNBsiX1J654o4Bl7daU26p5COp1Rd5zrXbn1x56c7OzrnD/cP5Pm9PiEZi0OgFCarFa7iwo+VVpR4GprqX6yprf1vznlPKprh2iwv/NUsg8zlOQpyiXNeCeZnOiYBl5zVDL78N4GNjAxh3YN3l2/fuvsfDx84ok/H0xCIGgQK+LKo0InKqpJzTqfVm07/eTIR5a7lwYHBgbnLWj6ntahYXp71kR1bd6mCvjAkJoBxRRyPcj6ttjzzulX8EbmkmZ7936Xgi0zvh2SrgjnRExkymCBDpRbR0FiH+x9ed75tRdsXqlordkghid+os+rvH4TdbivYsW3v4/v2HnEFQxGAcjDOUV5ehsVLFp9samn6jd3puCoHf85uu8OKBeOgIhXOH7/wwePHjn9l7+59tT3tXUjFU2BMvrTOlhkApjp66Gjz/OVt/+71+e5e1Lbwi91dfbc1UcE5x+9+/DQIJzV7du37xImjp/762JFT1pGhUWSSSYDxaUfIQQB6RmMwG8oamuv/9q677lq3cOGCrzW31T+XDKfTWrP6uvefped4tU/dzim6JRaLJaDXa8nhw0cf3b//4MLRETdUKjWkDIfEMlBpgNraGpSVlx9rbZovHTy6TwyHw5LZfGM32O228opyTI1MDq9YtuKvLVrL39ntjr/bvXNf/mDvCFhGUpaEXFkGc0JmPLRzGpy5TkZ+SV4u9wmC6VwYAwMjEhjhYJBAKGDNs2LB/HlYvequjUuWLf7smtpH+k6nDkBlvTG1nrGxcfzof36C+9ff95EdO3auO3/ufPZ+BrQ6EcuWt6F5TtPTX/3SN6e+9vgXrrmt2+qwmMzwzG+fRVNL09t279r9veee3WCZ8kxB4BSF+QWoqqpiZpNZAgFxu92qgb4+hL1B7HtplyoSDr9Nq9WEH1i/9hNu92SiqOgWMJHmVlPTj6ZXtzNHz+Du9XfNOXr46P9u3Lhx+Ykjp5CIpGA0GFHd0IjCQhfTaXWSJMvw+33i0NAw9fv9OHbgOEb7x6r9U/6fp+R0zYKlLd/1eyIpe8GVlRE11NOJqKs5p+mn5fSF++fvoF5u7ee7Yc+zrzh5/OxXDh08TjNpGZwL2flg0Om0qKwscxcXFe0413FaFYlEVFD6Af4sLXdO4+F4ZN7y+d/RGYwHikpK//Xg/kMLTh0/JYb8EUi5jh5KFcUnziFQYXppCKIoUisbVJaHjDNFWJZAYVqBBFlIAYRDb9ShtrEWi5csHpo3b95TjQ0N/xOLxMfO4CCI5savKc+EH3/zkY/UP/fchscOHTqKVDoNxng2iqvGyjsW762trfrdZz73Udhs18bO3VaHNdg9hHvX3FO1ZcvWr218cZNlYmwCFpMVixYv4HfcseJidVX1k3qd4Qgh0LnH3W87e+b8o3t27bGPjQ7jwokzKCsrfXeRq3Db+PjEU7dqTLln06sZ5xwXO3phMOgrDx049MMNz25Yfv7cBXCJo7mlAUuXLfW3tM7dkp9fsF9UqfpkSWKhcOiOMffYB0+fPO08fuSEcdLjwTPP/MkQSsS+zjiVFy1r/rep8YjsLLzcaWmgmfEEvXJsM6uBMyuIbwbjnKOzow95efaCbS/tfHzDhs2usREPmHTJSVNKUViUj/KK0uNl5WVdnnFPxlXkun29VLfQ9GY95BSXz5/p2bt2/b2PFhQW3FdZXfbZ9gsdLQPdbuqZmITEMkrEQhXYA+WAkNVi5GDZh3COu45B4hyMUYASqHQCbHYbKmsq5MamhpE5c1s219bV/Xd1Q0VPPJxizorZtdq8kg0NjqGoqNDy9B+e+8b2l/a0eqeCAGeglMBut+L+B9b6582b86+9vT1jCxbOe9Xt3TaHFZoI4xMf/wQ++clPfnDvrr3zJsYmoFPrsHL5Srz93Y/+sqG15p/thc5hADwVTqFxWdPWkqrqPTKhP3zh6T8aY9Ewzh8/q13StuSdD7zj/mdCnnDaUnDrw/9XCrbcg27UNtWoX3px2z88v+H5O04cOwm1qEbb4kVY+8CarQsWLvjn6ubqk+lYJq0xqnN5un2xQOIXNXU1LcWlxd97afPW+uERN7Zu2ak1WixfNJoNJ6am/DuYzEEFctkYrjlGfnPvv5FtsH8E5eXF5h079vzHhg0vrrlwvhOSRECRBVNyBlEloLV1jtzU1LjxD7/9Xebe+9be7mHfUhM009H1+IrVS35dWlG4beGiBetGByf+pquru7Wvr9cwNjamqCcnUgoffLYNiBGmJOYpB6UcAqXQarWw2+2orKxk5ZVlUVd5YWdVTeXzBYUFv6uqrxpLp9OZW5EXjsWi0OsN5PDhY3+/a9eevzh96gIykgzGObQaDe5YuZItXLjgm7V11VtisdisctG3zWFFInH8/Je/dD379LOPdl7oAeECSirLsHz18oNLly37um/KNz7zACZGglL9vMo/NPbUP3ioIP9dsUgMQW8I/kl/NTIwJGLx9M2OiTEOmSnpbEYBRgkkMKUy97K57O7oQsDrvffEkZPvbD/bAy4JaGltwdsffdv2tjsXfTjgDbhnjl9QVLAlnuEjiVB05IH716oEhqd+++vf62O+EI7uPZBXV1X2mYceu/+wZ3DqZRnj7AVLrt4jNPMvHICcE5jlV77/52Kcc7iHx1FUUmh6acvOz774/MZ3Hjl0DFKKgVIVqCCAcwaZSXDm2dHQ1NxRVV2z0Wq1w/FnBGe4HsteT5xz7i6rKvtlKpLeMG+gZe6Ye3TtxKRn6eSUp8o75bWG/GFjOBwhOXFZtVrNDQY9Nxq1MBqNLM+eN+LKd50tLizeU1JacthZkt8j6lUh3ELIUDIpYfeuA6irq7njwP4jHzp06AiRZAUArVar0dLaiPvWrd63cNGi/xsZ8fCyMtestnvbHFYwFEQynVwwNDxSH43EQYmIptYmXttS+/Qzz/9pfM1D91z2eVepFU/++Lfp4pLil2x59nf1dw8iGksgHk+4ooFYCUBvWk6EZ+meebZywqgCIeAU4DPgB9FgCAaLmex5aeejHe0d1mQ8DYGI0Gq0EEVBHQ3HXHu373HzFL9i7R8JhrDygeWanhM9Vq2ol/QqHWKZCPq7e9Db073CM7KwKZlOHp/5HZJNrILSqzosOsMx8Wk84SWQIZ1lhNXb2wudTluaTqcdDoejO5OR4nb7zS0JbtRGB8dgNpsL9u3e/70tmzc/tnvHHlUqnoIAdRbxLUNiaajUBLUNNahvaNhjd9gmpiaDt2W8r6flHBcAP+d8d21r9R4mM73X583z+wIlfn8wP5OR8rVaTYMkyUSWpD4qkhG7zUr0er1kNBrbHU7HKLKcH68F/KO7uxNz59WV7t51+Iktm7cXeb1eMK5QRTvznXjo4fsH5y9s/kZX1/nJRYtmj5i/bQ7L4/FAp9NZx93jGibLUKlUKC0t8xa5CndbTBbYbdYrvpOf7wQB92nUGhkEuUW6gTNuvKWTTi77cVX7jyf+k6+8c3l3TX2NPDw8JoT8IZw5fxbxTOyu1ffd/dTiO5d9GWpsigZjktFqUHIx584jKSUqT7508ssHdx99/+G9JwzheBSCjqKkoghWu3VYEOiIxKRXHNPLjXMOcouAo6dOnUZBQcFfXrx48SvFxcU/nj9/wXcOHDjsX7Fi6euGaeKc47lnNwOC2LR77/5vbnr+xbft23cQ8VgCoqACZ7kHCwPnMkxGCxa1LfBVVJb//vixs3DmW1+Xcb5RbIbzimVft51kc2TEDYvFUrRn957/ee5Pzy3v7u7JFkc4jEYt1q27ly9evOTfn/3jtn2f/+JHr+vaum0OKxwOI5PJEAVnJcNut8NqsQ7lFdiGM8NXL+4IggBBEKebNEVBQCwWc8syG4nHbiHuhvMZLoDMKBQrZrRaMNI3Cp1e99N196+VKysrPrtv977y8+facaG9A76gvz6ZTP1ar9d/vKen5/cswTE6OICy8lLb0SPH/+v5P2168NjhU4gEEygqduHOu5dKrfNat1VWV37HUeTwkJf1/rHp3jA2XfWZWRnM/Y1nq0A3Sgt87uwF1NWn1c9veNFktVq/EPCH5i1atOjLAM7IEruq5PuttFg0DQC0salh1Y4du/7j+Q0vtJ47eR6ZjATwXFuJkofJcA5BIKhvqMXcuS1b6huqjnunXlt20bfs1W3SE4Qz36LduWP/lza+uPWh48dPIZVMQxAJRFHAkqULcM+9d/1fS8uc3xUXFynCt9dht81hnTx+Gvc/eF8tyzb0ZqXFuwFEtdqrw/4VhyVMOyxCCdKZdCKZTMb8vtdCYDIHyLsSKlBaXQKWlMLLVi37r5ra6gOFhQWfKCwsfM/ePQd07hE3Xtyw0WKz2v7xnrX3dA0MDJypaqwkh/cc+Pzmjdse2L/vCJLxBCoqS/G2xx7pW37H8u/UVNc8E4vGglcVqMUlh4Qcejm33Jtu0M71gN340UoSA2dAJBLDmTPnqM8XWOPxTNUt9S393zktjT9DVgD0Vkdb2aZbYXhorL7nUO9fnTh+6kNbtrzk6OnqBSQBlAqKU872oXMwcC7BYjFi+YqlE/X1db8+cfx8pm1x62twDbxls7WpyQAcTovu2NEz//DSSzs/sWvXAcSiKQUzJslontOM++9fu711btPnO7su+BYsmHvd+5h2WDN633Lt4ByvYd9eTW0VUqnUpCAIIJQgI0kghDgBqFKplHzTO7hBI1fgAl7ZA1CtCADMN+o9cd8j6z5pMtqHNBrjP2zbvEUzOjyGHdt31jsceZ9Z+8jaj/ae75t/eP/xD+3bdZhmUjLKKkvxrvc+4l61+s5PbH7uD9ubvvh1aE1XzxeRa42E85ct+fgV/+az9GIEl6hMksk0Tp8+i5GRsfLu7ov/vPqeO9526tTpn4ZC4ac552Hc5LUx83obGRlbNjIy9p4zp888uG/fgbIzp88jEAiBMwrKBcgSsg8NJdKUJQmCimDuvBbMnzfvJ3X1lTsi4dRNnvlbZ8FgEADKOefNlJKdAFKzVaH+c7XJySk4nFbtkcPHv/rCC1u+tGnjFnUkHIcgiCAEKCsvwmOPvWNi+fJl/6+3t3/qjjuW3dB+RAAYHRiDd8KXP9A78MnR4dH5zkLnYG1T7T+nEknfa3WAhWUuiBohqDNoQQSCRCKBTCbTGAskSjhjvVf/lgAOCpkRMD6DuC7bO3WzZjQbYDQZatVqtVHhZ8kuv/i181l5JQ54Rvyp5fcs/hdZYrrgVOAre3buRM+5LpyvP/9YY1PT9oHBoXeeOHKqOBQIIr8oH+sfuT+0ZPnSz1TW1m9PJyPXpICJIQpZlhSRAnClCpgb0GXfU9LRSqlgJh3N7OaGEhkUEggYeAaQJGBi1IuNGzaLHefb2xYsnD+3Zc6c9zc1NRwqLCzcloqnTsbC8bDdZZvV9mc4Kb1ndKJifGJy1cDA0Kre3t472tu7Ck6cOAXvlFdhTWQAGAeT2WU0OZwrVL0OpwWr7l7RN29+6/91tvfCZNbc9Pm/VRaNhQBgHgf/kVqrXgeOc7d7TK+lBYNRWCwGzZHDxz+1efPWLz377LNqvy+U7V0UkF/gxNvf/nb/ypV3fL62rvpAaWnpDUfpYt/FfmiNWtOhfYe+t2/Xvvd1tXdj9bq75bKqsqOJROKWATJfbvmufGh12lRBUYFMCIR4PIax0TGXe2x80dSkrzcWSMBge9nSkFMQTsEVzAE4JxBVolGlVpltdutNrwlVKhGiqLKrVCpRoBScKWjgnLzRtayg1I6B9pFU69zW70+MTiy/2NV553D/IE4fPW2Y27rgK+0dneUjQyPQqlVYvHghW7Zs6X81zml5PhgIQq01XXPbKSTBZEkBVJGXYcPITLaG7DtEcVz8OiMsgSjNqIRzUCKCQgPGGFIJGd0dfRgeHFMf3Hfozuqaqjvraqs/bc+zHdVqNV0v/ulFarfbJ9RqTZfRZIJarco6F45MWkIwGBAYY63bNm0zj42NkVQq1eCdCjQMDY3k9/cN0pERN6LROGRJUqqblCiUwgAkxiAIQrYFScnP6fQq3HnXUj5/wZxfFZfk9wSCr0U64MYtHFbGk0onnPY8e6ssy29Kh8U5x+joKECkgt27Dv39Sy9t/8QLz7+o8ftCICCQuQyTUY+1a++NrVlzz7+2tNY/HfBHuT3PdMP7FJPxJAhI4dmzZ9fs3LYTmZSMoC8oMInppPRrtzKzmCyw2W1HyovLL5iNlrkBbwAXzrWrerovvnP9O+77k88duAJXleNWJ1nHBRnQqLQFKkEsMur1Qzc7JiktQ07L4DLAZShPeT77Tp3C0iLs3b3TU99a+73WtpYl4yOjGnefGzue290yOj6GwGQAjkIHFs5b0N3S2PK/nqHJjKuiYFZjyyX+X47EvxbB4MzustlYtpVWcdQSV+ihsxIKhABSmmF0ZBxDQyM4dPCwwWDQrzaZTautFgvMZjNMJhPXGwzQabXTNCXpdBrxeJxEo1GEQmEEAxFEozFEIjEk4kkozwECDpZtNFceFJwAgqCaps9hXBFfEFVAS2szHli/fvvixW0/Hh0dhc06uwjv9TJZVopGQf+UqFWRxkNHDiEaccNoKrrdQ7ul1t83DJPJWHTi+OkfPvfs5ke2bN6JUDgEJlMIAoFOq8Mdd67MrL3vnv9sW9LyH57xgOwqujmYjMgkBjkjIx1Pg0vIymZTBgnJ6+nE4pwjE01AUIsOUCpTUZhNUsHbUNu4q7mhee7xI8cx1D+EE8dO3OssyHt08cpFT4dDEZgtijf2uf2wF9oMR7afWJNJZgQmKfzViWhcFU/E5haU5w8mYwkV59yC6eTNpSR0jiZGcT4UOY4ymsUscc5BRSKfO3y+3j8VACRA0IpQCSpRJNRSUVOk4ZwLr3ZAax9ewyLBSH9VdaXXoDMWJ0NpnNx/GslMCoRRlBaVoray7rTGog4WWPL1s6jocTktF2zbuGNOKpEAZ/xlyPVbB2MnXMgiZBWhC56lqyEUACdIp2UQohQ+ZAnwTgUxNRkEIaPKxSSKZCbVrizLkJTcJACAMYBwjSLbLssAxKw7UnrghGxUlkuwM6bwQHEugXMZgsBQXFKINWtWtzc2NH7m2NGT3jvvWnnLjn+25g8NQxTUTlniLQTiYRCSsFougVVVAgGhFPFIAEm95r6/fu9f/WcsFr0+ldE3sHHO8ZMfPwWVSj1v9+5939q8eesDu3ceQiyaAbIPN1EUsWz5UjzyyENPrli5+Fvt53vSc1rrb3rfopyWIVEJXAZEKkKSZBBOqEAEo0Be9f6ctv07DsBqt64cHR75diQc0YMgcYnCgioqLlzJSXDOQSkBIQJnaZQTpjjKRCSB/XsPWHQmzfcZJMOChQs2cs59AISJ0Ym5+3fs/9ShPUffO9g3CJGIYBmO0yfOqM1O4/dErepzBBDUGrU9twaibAalxoxudg5BkQrnCpNCrvKUlpPwDE8Z+3p6ARmADAwPjNq2b931K064j1JKcpAH5VZmlwU3lFBwyiFB1k95fPmUU4iUIhqKgIuAQWeElJLR29O7eswztjXFkmCcg2TnmRKazWVxEMbBmYwMyXCZyc6zx87VjQ2PAOAw6PWw2WxpAEytUV3DZ11vnoAqpHCg2QtPnME+qfApKTkkRbRAFHRgck7gACBc+byUU/FhFJyrQGmWbwkEgCqbgOOgQpaLnHMQIir750pYm1WXAuccKo0ILqVgsRpx//o18TvvXPHEs7/7fdcXvvLl153zKhQZgKgirR6P+7upJG+wWvLvAfjFmZ9Ri6LilFMJFpzyzPFOej82OOoVOjs69jU0Nu4Oh8PcYrG8ruO+ZccfCgKAsHT53Pt27Nj53Weffb7x1MmzSKey3FoU0GrVaFs8Hw8/8sAzq1ev+vrQwHi8dd7NOysAEJnMFXkomUPJZ2aXW9fBWAAAZ09ewPy2eQ9u2bj9juPHj0OlUiNHTidwAQKjCp6IycoFTonS5wQBckyGSlRDhozJ8UlsenFToc/v/VF/38Bn8/LyetPptGZ4eLjt7Mkz+e0nu0CSWpj0JoTjfnRcaEfPYLdO1KjqFK7zbK6JAyoG0NwiajosUW4aBgLOGAihCg0skZEicQhMBEmKIKBIJVLYv3s/OXXqVBPPVuNyhP4guXatS9UrRXGEgTEJcjSNZDgBNTRQG/RglCPNJAwNDOEXP/+li4myS0JGycNxJWGcY1ogABjPQOZJMEFJoMf8ccgxDq3GiNr6OpSVlR+osyyKH+3fDS5dyq/lFE+mqUUuO/ZrG88xBOYWn3wGdzwnoFSpIMqyBMgcVKAgVHkYAUpElOMSVyAhAihVRBEUwYPceBhINs8GIivzx1Rg04IaCrI/l6NPpzPQG3S4/4H7sHbtvT9cuGTh05WVZVBrr5+O52YsEnPDqHdqBkfOfbKnp2uNVmOZyLO7IEmXL0U0ahFUEKERCY+F/JpMOvnpCxfO58Uz8lA0nvj7RQsXPO8PBKWrgaPfqMY5R3d3N0RRtO/fv+9j+/cf+vtNL26z9fYOI5NmivKiQKHRimhbMg+PPfa2LcuWLf3C4FD/xIKFLbdsHCKhahCqBoMImSvk8znWQRmzz2G1LV8Ki9X8YnVD/QdPnTvvCoVjIDJFKpkGZYDIOAQVhaAmoAIAwiBlxROrKqqxbOkyuW+gjx47eYx4xr3YtmWX5tihk616g76VMw6/349IMIwCewHWPHCfLKcZjp04Ikz5PMjIGUgpCTMjClEQsi02WZUQzJA4IgJEQiFJEiQpk0VPM5DskkSlFaDRa5DvyodOr8PwyAji2ebMaYcFpV0nt6TJYaA4OECzcltmDZzOAsydN1+OxqK0s/0C8Qf8CIQCAFUUSZToM3WpoT73lKAyGM1AZjI4ONRqNYwGHRrnNOOutSv2FxUV/vCP238Du8MM/5SS5JVVDLI6hZQqBqLnEPWi8tiZJdoulZGRljkYISAiBxFkgCnHJuBSkEq5AM4Exd/kJKGA6fm/POrhl6Immqti8unvUCKAE0DOctZzzrOlcAESS4NDgtGsxb3r7sZDjzz81NJlS//VOzGVcRZeP51Q1nEr4aMSQ7OXR2iccwz2dUCl1tSlE4kPmQz6g47iqk2J2ATX6S1a92j7V4d62v/KOzKI+oYF/U67fSLgn7psGyqVGoIgQqMWEJ2aBDJhCCotf+6Pz1d6x8M/jXrjFQvbFj7ZfrJ3qmlB9RueGTURTwIApUS1ZNtL+76xY/vOe3fv2SdMTnjBOQWBACrI0Bo4lixZiEceefAPS5ct/qLXNzXa1rbglo5FFFQiBLUKVBAhMUXnjGdvpuuBCtTOqYfdpjviDy/8jMFs+Fw8kqyVkly7f89+w8XObogaES1zm7Fo6YKoSktTROAAKGESiVkt1vOL2tp+Oz4+vri8puQDhw8ftY+OjCLoD8E76YOoUkGv12FOyxzcffdd46vuuvsJKSMF6+dXvSccDs2XZFk1c6kGQpLpVHpQEARZoAKhAoUoitMUtIwxEBCekTKUEFJBKdFDaSoFByAIAueMjzryHCeNRmNyZHT4jmQqVZwDaV5tVi7jpLoENZDtdvvZ+oaGXyZjiUXd3a1L4vFYKaHUyGT5cq2ulxknSvTBZAbGGVSiKi2K4kB5TcWF+jkNP51wD421ZoF3GZYGAM4FJlEdYCkwYtmqpay4rPjAt7/9bfljH//YrM5heUU5nPn5GbvDDpWWgrFMNjriAJMA0CxbJc0eI8G0BLUy6qu2AeUkqC51keQUPHPRKZlG/ykMmIoSMhEBs9mIB9avxTve+cjv5s2b89lR99RUReXsk9cKZMxEkPE4Y572heFgZF0olqw3Wm1bikqLfpmIjIZ1ppLpzydDg6goczi72ru+19vdvb6yvGzcoGZf0lnz9gfGej423HPu84OdZzQ6nQE2kzEBqk1rX/ZAUERSqUelEqIsHbMkQpPGmpoaTyIhFf3h/562TY57/jWWSN4/f17rpwkhnVzmIMIbz2lxzrF/7wnE48miI0dOfPLokWMf3rVrv6v9QhfSaSVfxblSnNHqBKxYuQgPP/zQ1rbFbV/y+6dG29oW3fIxiTq9GlqtGiazHqJIIaUziEXjCIUiiEais95Qnl0Pzrm8YuX3n46Gf75TzsA51Du0ZLC/+0cDfT06USWidX5r+B3vfMffGMya80SAQAiFIIgJrVk7TihJ1rRWPJNfaH+hpr76A4ODw22JRKIyHotRUaXiLpdrtLyidF9NTdWvappqDvkHgqxxYf2zyWiyRJbYNBUiIQAVhZTOpB2nIr0mFoFJjCbDKRfnXDvjNIFSgYsacVKlFwMAeCKccEgp2am8e3UnPs1JBSVRrIyFyCqdakzUClEAf1x013x1Jia5ZEnSZTJS7jO4Oro9i6fiip6cWq3O6Mx6NxWFBAC5rKxs+rOCIOBXv/qV3Nzc/MIDDzwwn1IabW1t/XVjY+NPS0tL4cibHXvBqrvvhFar3fngg+s+mIhHa0+dOoN0OgVKBYApQg+XwtTc0eKy1MHVIpZLx3TZG9ktKNsjAIigFEZkOQ1CKApceXhg/drUww8/+Pt581r+PhyOTlVWFc/qWJSojpBMzFuejA2+N+wbfffk6HCdd9KjjcSTKCyrulevnqfJK237V8ZSoFQDKTIJwejU+gaOfH5q6NwDvsF2kPBQIeJT/2u0Orxez2CRe6BDRCIFY14hDAbzWQBplVp72b5FkUCjUbn1en2YM2bxTowKJU31U5UVRfm9F86IGzdupuMTk/fct+7e588cP/8/8WjiVxMjkyFX6S0gobwFxjnH6MgkZIkbdHrVIy++uPkL+/cdnLd//0EaCIQBTkGpUlQRBMBg0GHV6hXskUfXPbN48eIvBQKB4YULr18CbDYm6rRqmMyGRF6eJaLVqfIDsTgmPJMIBEKV3378CXgnQ3Dkzy5BOH2xyv/r275lm8/lKlicTMU0EkvBpNPDYrMMOZzOvVNTU5PFdVct52eYxHbXt9bvDfuiBfF4vDoajQqiKDKz2TxoL7C6WYbLM26KOICem5yDvll8ZjL7uhmTsq9bTunscDhy6OqnKioqduv1+pjBYAhyzmWdbvbqJjU1VVBryFHOVzxmtZp/sGnT5hUH9h8iPl8AMpNBRQVyQIhSbCDZJ+ys23Vmct7gcufGGANhABE4BJGhqakWDz/yUGjp0iVPLFs+/799U7F4SVneq++Cc8ihDkAO2GL+qQ9Pjo99ZHKsu9Y/0UmSYT8gpcFA4On3Ckad5otBd2eEEPXPvgpkBKNOG3R3fGVssOtzgZFzxESikEMR9J/16InGWJZJBSHLGahEC/IcRSGd3vgn72g7d5bOuWwMaq0WWoMppdbowiIliAYm1RrEE/V15ZOHTNqieETC4UPHMTI6WtvT0/1vy1csWT1/wfx/5pyf5pyz26UjyTlHOi0BgMiYtOJPf3rxi/v3H1x9+PBR/diIGxlJBiViVr6MgWad1br712TWr1/3g2XLF30zHI7458yZc5MjeWUTBYHA7DB6HA57u9VmqQ75w3C7xzHmHl++5eCm/Inxqeu+UX3eAO5bv65444aNnxgcHKKEEOQ585Dvcp5VWYlPDL5y9ZEqDbYMwHj29ZbNwqxWKwBkcBPd+hotBeecT0x4zq66+85322yWT1dVV/zlgf2Hins6ehGPJcFkDqWCSLKJ80u9jK/ktC45NeX3nMrLdA9kNvYSRAq73YQFC1vY/Q+s7Vi0qO1r9Q1Vm5MJSXLkv7rsvJzxAkhqk0x8JNR79lOTI31Lxwe7xWTMC/AYRJ6BQGUwIiCdDGCo+7hToPQ7cir4wJdHT/d6ek5Wjg1fXDvef0ojyAGoxHRWUiuFTCKmAFepFtb8cuS5yp+2FNSeiAVGrxwISwHE6FOphH6tVtucjPgR8Y1a5s9rCLxU7Cy62OEBqIjhQTf+4H5W1d7e/vC9a1YvnLew9ZmGpvrfcc6Pv56OSzk3VQgFowWDg4P3dXV33d97sf+evXsOOzs7uxCPJRVHRVTZRnslXeFyOXHvmrvC69ff/4Nly5Z+2+v1xSorK17TsYpWqwXP/PqZdGV1xa6mpoaHPe4pBPwBnDhx8o7SitLP3rVq6dd9vhDLy5tdlDU57oXNbrMfPXz8a4cOH13qmZgCCEVdYx1KykuO7ti0V17z4KrX5US8ZddvlzBTzL3q7ju+XlRc+LuWOS1fPnXszEOHDh4xdXb2IJlIIwvNgswUbv6cpl12I7gS3JoF6pMZi2oOyEyGqBJhtVrQ2FyPO+9c5lnUNu/XTc11P3A48kY5B9fpry1+wDlHLNABKR1v9Ln7Hh8fuviQZ6jTkPKPgKbDECgFBFHBdslcgZkxhmR0Ej3n95rdw70PqtRGJGJ+xENjoCwKNcmA87QCVaYUAhGQYgLUlgKU17V25hdX/LffM5DKc1VdMR61RgsAXG8wM0EQkEpEEfBOlDfULb3YNKdJ6u32ilypZyCZSOP0qXMYGhoqbjpe95k77lz5roULFz1VVVm9PRqOH0gmU7E8p/WWJ+ZntEkJ3slg9Yljf3rXhg3PP3L2zNl5J0+dEoaH3YhGkuCMgBARkqx0QYiiABCGuroa3L9+zejKlUu/euddy34fDISlisqSmxzVq5uos+ox1jcKk9m0YdHSBR/u6OxsGR2dwOHdh2FQGz7KZQmNTQ2/4ZyPAYjgKk2v0wfPYXYPuFt2n9z5xd279z58+NBBxJNxVNVWYOGSeYfrG2ufDYXeogD5c7Bsa41sNlrPrV1774cry2vubJ037x8OHz6y/PTp06rBwUFEI3EwTiEzBgYGYRq39bJtiQSMKZgrShgEgYIQCq1WA4fDgcamBjZ/wZzxOXPmbK2uqf5FVXXx0XhMkmdzk0rpCQBBHYfw2GjP2U+P9p1f5Bnvg5QJQkVlqNQCGDWCq83QajQw6HUQRBEZiSGVkRCNJ+DxToKwcQgsBZFkQDkBoAYELTJcQIaLYFQDXUEtSmsX9BWUlH/82P4Xz6+6/31XHxSh2PvMf8mNbXecFTTmRxgfQniyX1/SMM8zb/Ey84F9pysDngAoESCKOmh1BOHQFPbsdONiZ3/hmQVdX6irq/9kRUXZpobGmm2Ekk2c80nGIAk3mZxnMgOhRPB5pur6+/tXj42Nrx7oH13Y1d1TfvrUWUyMTyKZTEOSOQgVp8HWAgVkloFaS9G2eB4eeeSRjoULFn5kTmvd4WAwxm321wdXRgBAlmX84Lv/g5V3LXvPphe2/mTzCy8Zo6EEjGYjWhfO4fX1deOFhQUjJpOh06DXndFqdQGTyUJkWUbAH6BEoHNSqaQjFIjUu0cn6o8ePWzt6GxHJpOG1WrBY+99LHrfQ/f9jWfC84c5rXPgdDhfl4N7y26Ncc7xn997Gu//wLq8sbHxu93uscc6u7qWXOzpdU1O+DVTUz5Meb1IJpNIp1OQJDnLdqpASQRBQbGr1SpY7UY48uwoKChgZeXlocrKqpMV5eVPV1QV7auoKOtLp9OSRjO7RuZEoBeiWl8Q8o19cWK451PD3We0sYAHRJSRZhkQlR56o+P/3965xsZxXXf8f2dn9v1+73K5Ly5FPSjREilLkRMnsV5OHTho0RQwgqKtgxZtgQJtv6RGk6JKYKQQjCCKG7RwHNtwE7RuDLuqJMNJJddGFUumZUsmJYaiSJoSyeW+37vzntsPs6KkJrGkWjJph78vC5DY2XuH3Isz55z//8DpSYguf2Le63Ged7hspw0MiqpKNomy1MsLnfWNSinKN2suoVllhVYDVGpDlWXIlNGv4fLBG4wo3ujASZsn/ZfhcGBMURTKcb8+8svPnQPLGXdPvvPG0crM22ajyYj08N5zRSZ1+p+++49/+rNj/wWzyYF9+/Zq69YlW0eOveScvDgNA7FAVQjMZjNS6Rg2bV4vpzLpmWhPdKy3t+etUChw0ef3TbtcjiWWZTsAlA96FAdABF70VCuNUKPaTBYKhYFCIX/v0lL2/omJC5GpqWkmu5BHpVqDqgCswQRNI5BVBQaOBWMAFEUCwwAejwv79n9Oe+iLe/996J6hA9FodEoQBO128qQfluWdZi9nEYlH2Df/+9Sfn3zj548f/9kJezFfhiwpMJmMcLps8PrccLtcsFgsMJmsUFUVzVYLoihCFATUKi3Uqm0IQhsgCvwBJ/Y/uEf8wsMPPTa0c9uTtWpd8XjdH9nm1rjzqIoGxkBMxUI1fOXKwqZyqTJUq9c3Nxr1oWq14i2VSpBEaTkvRQiBxWKFy+WEx+Pu2OyWC1aL9VwkErkSCATPxnp7LtZrrVboFh0fAEBVG2AYB1MrTm+vFeYP5GbH9xfnxqFKPChjAjgzWJsXrkCi7Q/Fjrs9oWd9gdQZk9VWoJoqM2YLKG0CICyo7JI7jZQsdJJ8q7WF7/AjIt90aUBKo0yTsNy0zWE/Z3c4R612zxlF7ixaXX03XWOzNAPOZM5MnT352tzY672q3EF43fZO//C+7/7biycefv7ZHw2GwzE8+uhXXx/ctP7os8898/iPn/9XU6shAuC6j88yjBYDHC4XvD4PEsleJJNxKRQKVBxO55zX45t0Ol0LRo4j/7d6rWkaWq02yqWSTZTE++rVRqqQLdsXFxfNS0tLyGazaDQaV73IulHxtQG8KrTuHF4KsJm5dAAACpdJREFUhgH61/Vh//699fs/e993tm7b+GSz0a7Gem+tYnsnueFoLucq8IY83HtvjX1pfHzsG6dPjm6ZGJtCq9kAz7e7jX9XpRiGrh5Pu3YpysJkdsDnd6EvE8eOHfdk771323PrNw58u9Vqt1w9q6Nsu8ad4fo8iMCL/kq1aq9VqxAl6YZEvNVihcPhgNvjEq1WSx56ceC2/bQo5cELOVjMPkexsPCV7Nz0N+Yvno2K5XkYaQcUHFhHFJHEgOqPpP7D7PB/3+mPvsXXSx13NPOBeaAbmkq1loWqYgDEIBDWVQTIba+3XZ2H1R1yTL372k8nRl/9lNQqwuKNYuP2ByZkQ/Ds8eOvf6W3NzE/vG3k+zwv/c742OS9Txz8HmamroBqrN43aFCgQYai6bk+hgFMJhYmsxF2uw1erw8ej2e5v3DZyo0QUI2CF3jU63XUanUIHQGKoEGWleVWGUqp/jkMdJddSqFRVU9BGhioVIHX68GOHSN0954HJkaGt/3t4JaBV2rVtuzx3rwIcjf4pb8ApRR/8eU/w98dOpCemph+5PLMwm9fnr+cKRRy9g7fZASBJ3pXst6LcVVHZrFYYbM71VA4LCUS8clEPPZSKhU/HElHJ6BSldxle901PtlQSiFUZsGZrJlqNfedmZnxfXMXx01yqwKOASxWB/yRlBrqGTgZCMWedngir2iyUGHdH30UAAB8q4BDX/9d/N4ff+sfJt45/rVOeQ4qCKLJTRja+eC0TA1+UehgcTGvNmqyTxQYHDz4FCYnLwOU6wrIZWhEgaLprv1Mt4BOu826LDHcYIt9dUDqsgvaskwKYBkDGMosy8uu6Xl1Vw29a1cDoEKjKgwsg3gqjj17d9c/85n7nt6yZfP3oj3BeUopXam2C+AD1LGaRkEISKcieUvlYqZaqwREqdMnSHxEUzWoKgilFEajUdM0DSaTqW02W877Av66x+M+73DZSiu9uTU+GVCtChCLSags7sotLn7z8uz5T+cXL0DsNGGz2eENJ+GPZ94PhhOHvO7ojzvtSskZ3Ljikpfc3ChYzvSlqbGTP1m49DZHFRGcyYFIeiuI0UTn568QSaSIRQdw5swlPPXMEdTqEkD1iiZhFFCiQgMLCqo7izAUlOreaAztmg4RgGrdXjiGQIMekV3dP6UUBkJgIPoT0nIBhCFgGA6KrEKD3gTKGDQ4HFYMDg3iwS/sPz+yfeRvtg1v/mkhX1FC4Zv3wd1tfq3KrCtcpgDKlNJy5+02YukeV7VYDTmcjkYoGcyLosqUSqVYu902+Xy+hs/nyuMu2iqv8ZsFpRSFsRehCpqnUZ74+/yVmd+/MnXRU6+UQBgDwuEBxPoGqoGexEs2r/8Jiz05Baiayx5Z6aUDABxOL8xm67teX2IuNzvTT8U8mE4Z+anToKyVKCoLfyANs9mKc2PvodWpgxAWKpVBKWAA042EZCxLmuiyNB3LMweAa3IwqovRGY0BIbpwflkE1dUKX1VQaFSDplJoDIGqyTCZOawbyOCB3ffz20e2v7Bx0+C3E8nYFKUUq+GwAm5hCEUxX8LxV06gJ96z5+jRowemJqYGovGe0tDw1q8ZWIPr1KlT3yoWi7ahoS254eGRPxEE4c27Mahgjd8cKKWgnSVAKHgd0a1fvDI99uj70xOfKi3OGSGrcLgCCMSS1Z548og3EnvK5A6NUkm8I9OK7yQcZwVjiSwGQr1HQtH+v85eqsHEqlAVHpoK2K1h9Kc34O1zs5i4cAmSJIIQFboHGQOA1XWboMsH1DVvbOCqthNXf9d93COUwrAsStfzUrqBBrPcvMtyulaUGBg4HA7EEz3YsXObuHPn8MmNgwP/nMmkj/Edngewqr7LNz2wKKXY81u7ncf+85XHDh8+vOvSLy4hFA37vEH/kyCwHT582JvL5TAzM+3zB/x/tGfP508tLeU+xsPR11hJKBXxixPPI7n1cyPt+sJj+cWph9+fnWartQbsdjei0SQNReInXIGeA55oalQT6xIh5g//wXcBoyMKuXZZ8wYjh+KZ9Z+tVrLDnfoiqMaDMbCIBCJQFAZvvPYmyoWGPgGJ6GaGlDIA1XT9Jv3VX1N63eG1rNkkFIDSfVX1CItouts/VUFAwRgIzBYjnE43MuvWYXj79urg4KbRvkzymYGBzKu5bLXBEA52+0dr33Mr3PTAIoQAGsyyLAdr9RokSUKr1YIkS7166bQFWZZRrzcg8LwbAKOq6opNvVnj4welFFPjBP2DLbMiVmO+gXu+PHVx7Ku5+Ut91cI0KDEiGuuT4umBs8Fw7Dmny3tYEfkl3fRvlWM0ITt78Yo72PP1xIaRH0xOkBhfz8NhdcPmjeLV42/g56dHIcoyNIbpTjzpOrYqmm4H3jWcBK6PdroV++7Yt64DGQBNt5OGBtCruSn9PSzLwmg0IpWKY8uWQX5w86bLyXT6WDKVfrl/IHG2XpU6nHF155xvKcL6/M4HCgcPHXx67569j78z+o4tlUmriXjiOQqKXbt2/eHi4qJhZGSED4ZCh19+6Yh636d3rvS+1vgYIKtVEIazisLi1kh4fNf89Nn7a9XaPeVCLpLLLhhkSYDHE9d645mlUDT5pD8c+SFni5ZBVWq0fgwOKwCcNQy5XQJn879aXpp8lFjt3yzlFjaajGbOFUnOmb3z4fiGtIfOZVGpNCFJip5Uh55WkRURDKP7pgFdb/9ueplCu1YhZJiu1bduJU2hAoTCxHFwuuyIRqJIpVJyX6av2N/fdyaVSr6QSidPuP3ukiqpt6QqWA3c0ior+Qqcbqdp/Nz5PfVyfZ/NaR/vSfb+RFYk5HK5v2o0mmm3230slUoeEUWx0xMLr/S+1lhFXNevxVK57hCERp/AtzO82Mp0+M6uTqu2q1PMOkuFImr1JjQwCASCtCeezjndkX/xeoM/dIZSs1SRFIZbPeO8bu8eyMgVJuFwBMKtWiXCsqaQze4Ye38uu3Upn/+D2Zm5LbMX58ML81l7sVAylEoVNBttiKIMTaWQFRWqqnR7rXSLakJUfbBwV+rEGgyw223wB31wuZyK1+PSQuFgM5mMlxOJ5FmP2/NiOBJ6rzcVm++0O4LNYVvp23Lb3PKxet0/3fKPfsU11iqEa9zA0tIiGMawvlIpPdKolzcY1GYGipDqNMtuoV2GxNfAdxpQVQWc0QlfKA1vIJlzuf3PBKPBH5ndvVNQ2irh3Cu9lTuObgapgYBwHaHtzV4uJHJLuX5JkfeWSuWBQiGfLBbLTKvJE14Q3M1Gg1PUa2aIFgsLo5HrsCzXtNqsxOf1IRAMNH1e3zgB87LdZl1IpVPVUCi4aLGZ65RSkTBkVSXRb5dbjqvJNbvIX7rvK72JNVY3hCCuquojlWqlr1XNMorYApU6YDQJViOHgD8Om8er+cOxvC8Q/x+zxfcE54y+q0m8Sgj34RewSrnu4JAB5AHkKaWjAF6QJMlab9SD9VqdaTZFxsAY1rVaLbsoSnrkwAB2u4lwnCEnSdK8zWYjbrcbbrenY7VaC/h/qglWO5+s3ayx6mg0ajAaTYZKtdTLdxoPKWp7tyKJGzRZDrAgvIU1XLCYuXdtblfJ4nS+xhg9k4AqEOJc6aWvsQr5X5mEZKpzI6ZHAAAAAElFTkSuQmCC" style="width:100%;height:100%;object-fit:contain" alt="معهد التأصيل العلمي">
      </div>
      <div style="font-family:'Zain',sans-serif;font-size:15px;font-weight:700;color:var(--purple)">جاري تسجيل الدخول...</div>
      <div style="width:40px;height:3px;background:rgba(212,180,142,.3);border-radius:2px;overflow:hidden">
        <div style="height:100%;background:linear-gradient(90deg,var(--gold),var(--purple));border-radius:2px;animation:progressFill 2s ease infinite alternate"></div>
      </div>`;
    document.body.appendChild(overlay);
  }

  // ── الانتقال للصفحة المطلوبة حسب الملف المفتوح ──
  const _targetPage = window._PAGE_TARGET || "landing";
  const _publicPages = ["landing","about-public","login"];
  if(_publicPages.includes(_targetPage)){
    document.getElementById("public-wrapper").style.display = "";
    document.getElementById("app-wrapper").style.display = "none";
    document.querySelectorAll("#public-wrapper .page").forEach(p=>p.classList.remove("active"));
    const _el = document.getElementById("page-" + _targetPage);
    if(_el){ _el.classList.add("active"); }
    renderPublicPlan();
    renderAboutPublic();
    updatePubNav();
  } else {
    // صفحة تطبيق — الانتقال يحدث بعد التحقق من الجلسة
    window._PENDING_NAV = _targetPage;
    // إظهار شاشة التحميل حتى يتم التحقق من تسجيل الدخول
    document.getElementById("public-wrapper").style.display = "none";
    document.getElementById("app-wrapper").style.display = "none";
  }

  // ── تذكرني: تسجيل دخول تلقائي ──
  const savedCreds = loadRememberMe();
  if(savedCreds){
    // ملء الحقول وتفعيل مؤشر التحميل
    const emailEl=document.getElementById("l-email");
    const passEl=document.getElementById("l-pass");
    const remEl=document.getElementById("l-remember");
    if(emailEl) emailEl.value=savedCreds.e||"";
    if(remEl) remEl.checked=true;
    // محاولة تسجيل الدخول التلقائي
    tryAutoLogin();
  }

  // معالجة نتيجة redirect من Google/Apple
  await _handleRedirectResult();

  // إزالة overlay الانتظار إن وُجد
  const overlay=document.getElementById("redirect-overlay");
  if(overlay) overlay.remove();

  // ── تحميل البيانات من Firebase ──
  _showFirebaseLoader(true);
  loadFromFirestore().then((loaded)=>{
    _showFirebaseLoader(false);
    if(APP.activePage==="landing"){ renderPublicPlan(); renderAboutPublic(); }
    if(loaded) console.log("✅ Firebase loaded successfully");
  }).catch(()=>{ _showFirebaseLoader(false); });

  // إنشاء حساب المشرف العام إذا لم يكن موجوداً
  ensureSuperAdmin();

  document.addEventListener("click", e=>{
    const panel=document.getElementById("notif-panel");
    const btn=document.getElementById("nb-notif");
    if(panel&&btn&&!panel.contains(e.target)&&!btn.contains(e.target)){
      panel.style.display="none";
    }
  });
});
