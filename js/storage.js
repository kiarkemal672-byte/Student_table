/* ═══════════════════════════════════════════════════════════════════════
   የቂራአት መዝገብ · سِجِلُّ القُرّاء · Reading Log
   js/storage.js
   ─ طبقة قاعدة البيانات المحلية (localStorage)
   ─ القراءات · الطلاب · الحضور · الاختبارات · المستخدمون · النسخ الاحتياطي
   ═══════════════════════════════════════════════════════════════════════ */
"use strict";

/* ──────────────── المفاتيح والإصدار ──────────────── */
const DB_KEY     = "ql_db";       // قاعدة البيانات الرئيسية
const SESSION_KEY = "ql_session"; // الجلسة الحالية (معرّف المستخدم)
const DB_VERSION = 1;

/* ──────────────── أدوات مساعدة ──────────────── */

// معرّف فريد قصير
function uid(){
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

// نسخة عميقة (لعزل البيانات قبل الإرجاع عند الحاجة)
function deepClone(o){
  return JSON.parse(JSON.stringify(o));
}

// تاريخ اليوم بصيغة ISO محلي (بدون انزياح المنطقة الزمنية)
function todayISO(){
  const d = new Date();
  return d.getFullYear() + "-" +
         String(d.getMonth() + 1).padStart(2, "0") + "-" +
         String(d.getDate()).padStart(2, "0");
}

// تحويل نص تاريخ ISO إلى كائن Date
function parseISO(iso){
  if (iso instanceof Date) return iso;
  const parts = String(iso).split("-");
  if (parts.length < 3) return new Date();
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// هل هذا التاريخ من أيام دراسة القراءة؟
function isStudyDay(reading, iso){
  if (!reading || !reading.days || !reading.days.length) return false;
  const d = parseISO(iso);
  return reading.days.indexOf(d.getDay()) !== -1;
}

/* ═══════════════════════════════════════════════════════════════════════
   بنية قاعدة البيانات:
   {
     version: 1,
     users: [
       { id, name, username, password, role, createdAt }
     ],
     readings: [
       {
         id, name, days, createdAt,
         students: [
           { id, name, father, guardianName,
             guardianRelation, guardianPhone, createdAt }
         ],
         attendance: {
           // المفتاح: تاريخ ISO
           "2026-08-25": {
             "<studentId>": {
               status: "present" | "late" | "absent",  // null = لم يُسجَّل
               minutes: 0,
               book: true | false | null,
               note: ""
             }
           }
         },
         tests: [
           { id, title, date, max,
             scores: { "<studentId>": number } }
         ]
       }
     ],
     settings: { currentReadingId: null }
   }
   ═══════════════════════════════════════════════════════════════════════ */

const Store = {
  db: null,

  /* ─────────── الحفظ والتحميل ─────────── */

  load(){
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw){
        const parsed = JSON.parse(raw);
        if (parsed && parsed.readings && parsed.users) return parsed;
      }
    } catch(e){ /* وضع التصفح الخاص أو تلف البيانات */ }
    return null;
  },

  save(){
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.db));
      return true;
    } catch(e){
      console.warn("Storage save failed:", e);
      return false;
    }
  },

  // التهيئة الأولى: بيانات نظامية فارغة + حساب الأستاذ الافتراضي
  init(){
    const existing = this.load();
    if (existing){
      this.db = existing;
      // ترقيات مستقبلية حسب الإصدار
      if (!this.db.settings) this.db.settings = { currentReadingId: null };
      this.ensureIntegrity();
      return false; // ليس أول تشغيل
    }

    this.db = {
      version: DB_VERSION,
      users: [{
        id: uid(),
        name: (typeof t === "function") ? t("role.teacher") : "Teacher",
        username: "kiar",
        password: "1234",
        role: "kiar",
        createdAt: todayISO()
      }],
      readings: [],
      settings: { currentReadingId: null }
    };
    this.save();
    return true; // أول تشغيل
  },

  // إصلاح أي نقص في البنية (وقاية من ملفات قديمة/تالفة)
  ensureIntegrity(){
    const db = this.db;
    if (!Array.isArray(db.users))      db.users = [];
    if (!Array.isArray(db.readings))   db.readings = [];
    if (!db.settings)                  db.settings = { currentReadingId: null };

    db.readings.forEach(r => {
      if (!Array.isArray(r.students))   r.students = [];
      if (!r.attendance)                r.attendance = {};
      if (!Array.isArray(r.tests))      r.tests = [];
      if (!Array.isArray(r.days))       r.days = [];
      r.tests.forEach(ts => { if (!ts.scores) ts.scores = {}; });
    });

    // ضمان وجود حساب أستاذ واحد على الأقل
    if (!db.users.some(u => u.role === "teacher")){
      db.users.push({
        id: uid(),
        name: (typeof t === "function") ? t("role.teacher") : "Teacher",
        username: "kiar",
        password: "1234",
        role: "kiar",
        createdAt: todayISO()
      });
    }
  },

  /* ─────────── القراءات ─────────── */

  getReadings(){
    return this.db.readings;
  },

  getReading(id){
    return this.db.readings.find(r => r.id === id) || null;
  },

  addReading(name, days){
    const reading = {
      id: uid(),
      name: name.trim(),
      days: days.slice(),
      createdAt: todayISO(),
      students: [],
      attendance: {},
      tests: []
    };
    this.db.readings.push(reading);
    if (!this.db.settings.currentReadingId){
      this.db.settings.currentReadingId = reading.id;
    }
    this.save();
    return reading;
  },

  updateReading(id, data){
    const r = this.getReading(id);
    if (!r) return null;
    if (data.name !== undefined) r.name = String(data.name).trim();
    if (data.days !== undefined && Array.isArray(data.days) && data.days.length){
      r.days = data.days.slice();
    }
    this.save();
    return r;
  },

  deleteReading(id){
    const i = this.db.readings.findIndex(r => r.id === id);
    if (i === -1) return false;
    this.db.readings.splice(i, 1);
    if (this.db.settings.currentReadingId === id){
      this.db.settings.currentReadingId =
        this.db.readings.length ? this.db.readings[0].id : null;
    }
    this.save();
    return true;
  },

  // القراءة الحالية
  getCurrentReading(){
    return this.getReading(this.db.settings.currentReadingId);
  },

  setCurrentReading(id){
    this.db.settings.currentReadingId = id;
    this.save();
  },

  /* ─────────── الطلاب ─────────── */

  getStudents(readingId){
    const r = this.getReading(readingId);
    return r ? r.students : [];
  },

  getStudent(readingId, studentId){
    const r = this.getReading(readingId);
    return r ? r.students.find(s => s.id === studentId) || null : null;
  },

  // البحث عن تكرار الاسم + اسم الأب في نفس القراءة
  studentExists(readingId, name, father, exceptId){
    const r = this.getReading(readingId);
    if (!r) return false;
    const n = String(name).trim().toLowerCase();
    const f = String(father || "").trim().toLowerCase();
    return r.students.some(s =>
      s.id !== exceptId &&
      s.name.trim().toLowerCase() === n &&
      (s.father || "").trim().toLowerCase() === f
    );
  },

  addStudent(readingId, data){
    const r = this.getReading(readingId);
    if (!r) return null;
    const student = {
      id: uid(),
      name: String(data.name).trim(),
      father: String(data.father || "").trim(),
      guardianName: String(data.guardianName || "").trim(),
      guardianRelation: data.guardianRelation === "mother" ? "mother" : "father",
      guardianPhone: String(data.guardianPhone || "").trim(),
      createdAt: todayISO()
    };
    r.students.push(student);
    this.save();
    return student;
  },

  updateStudent(readingId, studentId, data){
    const r = this.getReading(readingId);
    if (!r) return null;
    const s = r.students.find(s => s.id === studentId);
    if (!s) return null;
    if (data.name !== undefined)            s.name = String(data.name).trim();
    if (data.father !== undefined)          s.father = String(data.father).trim();
    if (data.guardianName !== undefined)    s.guardianName = String(data.guardianName).trim();
    if (data.guardianRelation !== undefined)
      s.guardianRelation = data.guardianRelation === "mother" ? "mother" : "father";
    if (data.guardianPhone !== undefined)   s.guardianPhone = String(data.guardianPhone).trim();
    this.save();
    return s;
  },

  deleteStudent(readingId, studentId){
    const r = this.getReading(readingId);
    if (!r) return false;
    const i = r.students.findIndex(s => s.id === studentId);
    if (i === -1) return false;
    r.students.splice(i, 1);

    // تنظيف سجلّه من الحضور
    Object.keys(r.attendance).forEach(dateISO => {
      delete r.attendance[dateISO][studentId];
    });

    // تنظيف درجاته من الاختبارات
    r.tests.forEach(ts => { delete ts.scores[studentId]; });

    this.save();
    return true;
  },

  /* ─────────── الحضور اليومي ─────────── */

  // سجل يوم كامل: { studentId: {...} }
  getDayAttendance(readingId, dateISO){
    const r = this.getReading(readingId);
    if (!r || !r.attendance[dateISO]) return {};
    return r.attendance[dateISO];
  },

  // تعديل جزئي لطالب في يوم معيّن (حفظ فوري تلقائي)
  setStudentDay(readingId, dateISO, studentId, patch){
    const r = this.getReading(readingId);
    if (!r) return null;
    if (!r.attendance[dateISO]) r.attendance[dateISO] = {};
    const day = r.attendance[dateISO];
    if (!day[studentId]){
      day[studentId] = { status: null, minutes: 0, book: null, note: "" };
    }
    const rec = day[studentId];
    if (patch.status  !== undefined) rec.status  = patch.status;
    if (patch.minutes !== undefined) rec.minutes = Math.max(0, Number(patch.minutes) || 0);
    if (patch.book    !== undefined) rec.book    = patch.book;
    if (patch.note    !== undefined) rec.note    = String(patch.note);
    this.save();
    return rec;
  },

  // سجل نطاق تواريخ (للتقارير): { dateISO: { studentId: {...} } }
  getAttendanceRange(readingId, startISO, endISO){
    const r = this.getReading(readingId);
    const out = {};
    if (!r) return out;
    const start = startISO + "", end = endISO + "";
    Object.keys(r.attendance).forEach(dateISO => {
      if (dateISO >= start && dateISO <= end){
        out[dateISO] = r.attendance[dateISO];
      }
    });
    return out;
  },

  /* ─────────── الاختبارات والدرجات ─────────── */

  getTests(readingId){
    const r = this.getReading(readingId);
    if (!r) return [];
    // مرتّبة بالتاريخ ثم وقت الإنشاء
    return r.tests.slice().sort((a, b) =>
      a.date === b.date ? (a.id < b.id ? -1 : 1) : (a.date < b.date ? -1 : 1)
    );
  },

  addTest(readingId, data){
    const r = this.getReading(readingId);
    if (!r) return null;
    const test = {
      id: uid(),
      title: String(data.title).trim(),
      date: data.date,
      max: Math.max(1, Number(data.max) || 10),
      scores: {}
    };
    r.tests.push(test);
    this.save();
    return test;
  },

  updateTest(readingId, testId, data){
    const r = this.getReading(readingId);
    if (!r) return null;
    const ts = r.tests.find(x => x.id === testId);
    if (!ts) return null;
    if (data.title !== undefined) ts.title = String(data.title).trim();
    if (data.date  !== undefined) ts.date  = data.date;
    if (data.max   !== undefined){
      const newMax = Math.max(1, Number(data.max) || 10);
      ts.max = newMax;
      // إسقاط الدرجات التي تتجاوز الحد الجديد
      Object.keys(ts.scores).forEach(sid => {
        if (ts.scores[sid] > newMax) ts.scores[sid] = newMax;
      });
    }
    this.save();
    return ts;
  },

  deleteTest(readingId, testId){
    const r = this.getReading(readingId);
    if (!r) return false;
    const i = r.tests.findIndex(x => x.id === testId);
    if (i === -1) return false;
    r.tests.splice(i, 1);
    this.save();
    return true;
  },

  // رصد درجة طالب في اختبار (value = null للحذف)
  setScore(readingId, testId, studentId, value){
    const r = this.getReading(readingId);
    if (!r) return false;
    const ts = r.tests.find(x => x.id === testId);
    if (!ts) return false;
    if (value === null || value === "" || isNaN(Number(value))){
      delete ts.scores[studentId];
    } else {
      const v = Math.min(ts.max, Math.max(0, Number(value)));
      ts.scores[studentId] = v;
    }
    this.save();
    return true;
  },

  /* ─────────── المستخدمون والصلاحيات ─────────── */

  getUsers(){
    return this.db.users;
  },

  findUserByUsername(username){
    const u = String(username).trim().toLowerCase();
    return this.db.users.find(x => x.username.toLowerCase() === u) || null;
  },

  // التحقق من بيانات الدخول
  authenticate(username, password){
    const u = this.findUserByUsername(username);
    if (u && u.password === password) return u;
    return null;
  },

  addUser(data){
    // اسم المستخدم فريد إلزامياً
    if (this.findUserByUsername(data.username)) return null;
    const user = {
      id: uid(),
      name: String(data.name).trim(),
      username: String(data.username).trim(),
      password: String(data.password),
      role: data.role === "teacher" ? "teacher" : "assistant",
      createdAt: todayISO()
    };
    this.db.users.push(user);
    this.save();
    return user;
  },

  deleteUser(userId){
    // لا يمكن حذف آخر حساب أستاذ
    const user = this.db.users.find(u => u.id === userId);
    if (!user || user.role === "teacher") return false;
    const i = this.db.users.findIndex(u => u.id === userId);
    this.db.users.splice(i, 1);
    this.save();
    return true;
  },

  changePassword(userId, currentPass, newPass){
    const u = this.db.users.find(x => x.id === userId);
    if (!u) return { ok: false, reason: "nouser" };
    if (u.password !== currentPass) return { ok: false, reason: "wrongpass" };
    u.password = String(newPass);
    this.save();
    return { ok: true };
  },

  /* ─────────── الجلسة ─────────── */

  login(userId){
    try { localStorage.setItem(SESSION_KEY, userId); } catch(e){}
  },

  logout(){
    try { localStorage.removeItem(SESSION_KEY); } catch(e){}
  },

  getSessionUser(){
    let id = null;
    try { id = localStorage.getItem(SESSION_KEY); } catch(e){}
    if (!id) return null;
    return this.db.users.find(u => u.id === id) || null;
  },

  /* ─────────── النسخ الاحتياطي ─────────── */

  exportData(){
    return JSON.stringify({
      app: "qira-log",
      version: DB_VERSION,
      exportedAt: todayISO(),
      data: this.db
    }, null, 2);
  },

  importData(jsonText){
    let parsed;
    try { parsed = JSON.parse(jsonText); } catch(e){ return { ok: false }; }
    const candidate = parsed && parsed.data ? parsed.data : parsed;
    if (!candidate || !Array.isArray(candidate.readings) || !Array.isArray(candidate.users)){
      return { ok: false };
    }
    this.db = candidate;
    if (!this.db.version) this.db.version = DB_VERSION;
    this.ensureIntegrity();
    this.save();
    return { ok: true };
  },

  /* ─────────── إحصاءات الأسبوع (للتقارير ورسائل الأولياء) ───────────
     يعيد لكل طالب: الحضور، تواريخ الغياب، دقائق التأخير وتواريخها،
     أيام نسيان الكتاب، واختبارات الأسبوع بدرجاتها والمجموع والنسبة.
  ─────────────────────────────────────────────────────────────────────── */
  computeWeekStats(readingId, weekStartISO){
    const r = this.getReading(readingId);
    if (!r) return null;

    // أيام الأسبوع السبعة (من السبت)
    const days = [];
    const start = parseISO(weekStartISO);
    for (let i = 0; i < 7; i++){
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                String(d.getDate()).padStart(2, "0"));
    }
    const endISO = days[6];

    // سجل الحضور خلال الأسبوع
    const range = this.getAttendanceRange(readingId, weekStartISO, endISO);

    // أيام الدراسة الفعلية داخل الأسبوع
    const studyDays = days.filter(iso => isStudyDay(r, iso));

    // اختبارات الأسبوع
    const weekTests = this.getTests(readingId).filter(ts =>
      ts.date >= weekStartISO && ts.date <= endISO
    );

    const students = r.students.map(st => {
      const stat = {
        student: st,
        present: 0,
        absentDates: [],
        lateMinutes: 0,
        lateDates: [],
        noBookDates: [],
        tests: []
      };

      days.forEach(iso => {
        const rec = range[iso] && range[iso][st.id];
        if (!rec) return;
        if (rec.status === "present") stat.present++;
        if (rec.status === "absent")  stat.absentDates.push(iso);
        if (rec.status === "late"){
          stat.present++;
          stat.lateMinutes += Number(rec.minutes) || 0;
          if ((Number(rec.minutes) || 0) > 0) stat.lateDates.push(iso);
        }
        if (rec.book === false) stat.noBookDates.push(iso);
      });

      let sum = 0, maxSum = 0;
      weekTests.forEach(ts => {
        const sc = ts.scores[st.id];
        const val = (sc === undefined || sc === null) ? null : Number(sc);
        stat.tests.push({ test: ts, score: val });
        if (val !== null){ sum += val; maxSum += ts.max; }
        else { maxSum += ts.max; }
      });
         stat.gradeSum = sum;
      stat.gradeMax = maxSum;
      stat.gradePct = maxSum > 0 ? Math.round((sum / maxSum) * 100) : null;

      /* معلومات الأسبوع مرفقة لكل طالب (تحتاجها التقارير ورسائل الأولياء) */
      stat.weekStart = weekStartISO;
      stat.weekEnd   = endISO;
      stat.studyDays = studyDays;

      return stat;    
    });

    return { weekStart: weekStartISO, weekEnd: endISO, days, studyDays, weekTests, students };
  }
};

/* ─────────── التهيئة + مزامنة النوافذ المتعددة ─────────── */

(function initStorage(){
  Store.init();

  // لو فُتح التطبيق في نافذة أخرى وعدَّل البيانات: تحديث تلقائي هنا
  window.addEventListener("storage", e => {
    if (e.key === DB_KEY && e.newValue){
      try {
        const fresh = JSON.parse(e.newValue);
        if (fresh && fresh.readings){
          Store.db = fresh;
          Store.ensureIntegrity();
          document.dispatchEvent(new CustomEvent("dbexternal"));
        }
      } catch(err){}
    }
    if (e.key === SESSION_KEY){
      document.dispatchEvent(new CustomEvent("sessionexternal"));
    }
  });
})();
