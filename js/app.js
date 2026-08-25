/* ═══════════════════════════════════════════════════════════════════════
   የንባብ መዝገብ · سِجِلُّ القُرّاء · Reading Log
   js/app.js
   ─ منطق التطبيق الكامل:
     الدخول والصلاحيات · القراءات · الطلاب · الحضور اليومي
     الدرجات والنِسَب · التقارير الأسبوعية · رسائل أولياء الأمور
     المستخدمون · النسخ الاحتياطي · تثبيت PWA
   ═══════════════════════════════════════════════════════════════════════ */
"use strict";

/* ──────────────── أدوات عامة ──────────────── */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function toISO(d){
  return d.getFullYear() + "-" +
         String(d.getMonth() + 1).padStart(2, "0") + "-" +
         String(d.getDate()).padStart(2, "0");
}
function shiftISO(iso, days){
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}
function debounce(fn, ms){
  let timer;
  return function(){
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/* ──────────────── حالة التطبيق ──────────────── */
let CURRENT_USER       = null;
let currentAttDate     = todayISO();          /* تاريخ تبويب الحضور  */
let currentReportDate  = null;                /* بداية أسبوع التقارير */
let msgTargetPhone     = "";                  /* جوال وليّ الأمر الحالي */
let deferredInstall    = null;                /* حدث تثبيت PWA */

/* ═══════════════════════════════════════════════════════════════════════
   1) التنبيهات (Toast)
   ═══════════════════════════════════════════════════════════════════════ */
function showToast(msg, type){
  const wrap = $("#toastWrap");
  const el = document.createElement("div");
  el.className = "toast" +
    (type === "error" ? " toast-error" : type === "info" ? " toast-info" : "");
  const icon = type === "error" ? "i-alert" : type === "info" ? "i-clock" : "i-check";
  el.innerHTML = '<svg class="ic"><use href="#' + icon + '"/></svg><span></span>';
  el.querySelector("span").textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 350);
  }, 2600);
}

/* ═══════════════════════════════════════════════════════════════════════
   2) النوافذ المنبثقة
   ═══════════════════════════════════════════════════════════════════════ */
function openModal(id){ $("#" + id).hidden = false; }

(function wireModals(){
  $$(".modal-backdrop").forEach(bd => {
    bd.addEventListener("click", e => { if (e.target === bd) bd.hidden = true; });
    $$("[data-close]", bd).forEach(b => b.addEventListener("click", () => bd.hidden = true));
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") $$(".modal-backdrop").forEach(bd => bd.hidden = true);
  });
})();

/* ── نافذة التأكيد (وعد يُحلّ عند الاختيار) ── */
let confirmResolver = null;

function confirmDialog(title, text){
  return new Promise(resolve => {
    $("#confirmTitle").textContent = title;
    $("#confirmText").textContent  = text;
    confirmResolver = resolve;
    openModal("modalConfirm");
  });
}
 $("#confirmOk").addEventListener("click", () => {
  $("#modalConfirm").hidden = true;
  if (confirmResolver){ confirmResolver(true); confirmResolver = null; }
});
 $("#confirmCancel").addEventListener("click", () => {
  $("#modalConfirm").hidden = true;
  if (confirmResolver){ confirmResolver(false); confirmResolver = null; }
});

/* ═══════════════════════════════════════════════════════════════════════
   3) الدخول والخروج والصلاحيات
   ═══════════════════════════════════════════════════════════════════════ */
function renderLoginHints(){
  const risky = Store.getUsers().some(u => u.role === "teacher" && u.password === "1234");
  const hint = $("#firstRunHint");
  hint.hidden = !risky;
  if (risky) hint.textContent = t("login.firstRun");
}

function showLogin(){
  Store.logout();
  CURRENT_USER = null;
  document.body.classList.remove("role-assistant");
  $("#appScreen").hidden = true;
  $("#loginScreen").hidden = false;
  $("#loginPassword").value = "";
  $("#loginError").hidden = true;
  renderLoginHints();
}

function enterApp(user){
  CURRENT_USER = user;
  document.body.classList.toggle("role-assistant", user.role === "assistant");

  $("#loginScreen").hidden = true;
  $("#appScreen").hidden = false;

  $("#currentUserName").textContent = user.name;
  const badge = $("#currentUserRole");
  badge.textContent = t(user.role === "teacher" ? "role.teacher" : "role.assistant");
  badge.classList.toggle("role-assistant", user.role === "assistant");

  currentAttDate    = todayISO();
  currentReportDate = weekStartISO(todayISO());

  /* ضمان قراءة حالية صالحة */
  const readings = Store.getReadings();
  if (!Store.getCurrentReading() && readings.length){
    Store.setCurrentReading(readings[0].id);
  }

  switchTab("students");
  renderAll();

  /* أول دخول لمعلّم بلا قراءات: افتح نافذة الإنشاء مباشرة */
  if (user.role === "teacher" && !readings.length) openReadingModal(null);
}

 $("#loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const u = Store.authenticate($("#loginUsername").value, $("#loginPassword").value);
  if (!u){
    const err = $("#loginError");
    err.textContent = t("login.error");
    err.hidden = false;
    return;
  }
  $("#loginError").hidden = true;
  Store.login(u.id);
  enterApp(u);
});

 $("#btnLogout").addEventListener("click", showLogin);

/* ── التبويبات مع حراسة الصلاحيات ── */
const TABS_ALLOWED = {
  teacher:    ["students", "attendance", "grades", "reports", "users"],
  assistant:  ["students", "attendance"]
};

function switchTab(name){
  const role = CURRENT_USER ? CURRENT_USER.role : "teacher";
  if (TABS_ALLOWED[role].indexOf(name) === -1) name = "students";
  $$("#mainNav .tab").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  $$(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + name));
}
 $$("#mainNav .tab").forEach(b =>
  b.addEventListener("click", () => switchTab(b.dataset.tab)));

/* ═══════════════════════════════════════════════════════════════════════
   4) إعادة الرسم الشاملة
   ═══════════════════════════════════════════════════════════════════════ */
function renderAll(){
  renderReadingsSelect();
  renderReadingMeta();
  renderStudents();
  renderAttendance();
  renderGrades();
  renderReports();
  renderAssistants();
}

/* ═══════════════════════════════════════════════════════════════════════
   5) القراءات (المجموعات)
   ═══════════════════════════════════════════════════════════════════════ */
function renderReadingsSelect(){
  const sel = $("#readingSelect");
  const readings = Store.getReadings();
  const cur = Store.db.settings.currentReadingId;
  sel.innerHTML = "";

  if (!readings.length){
    const o = document.createElement("option");
    o.value = ""; o.disabled = true; o.selected = true;
    o.textContent = t("reading.select");
    sel.appendChild(o);
  } else {
    readings.forEach(r => {
      const o = document.createElement("option");
      o.value = r.id; o.textContent = r.name;
      if (r.id === cur) o.selected = true;
      sel.appendChild(o);
    });
  }
  const eb = $("#btnEditReading");
  eb.disabled = !readings.length;
  eb.style.opacity = readings.length ? "" : "0.45";
}

 $("#readingSelect").addEventListener("change", e => {
  if (e.target.value){
    Store.setCurrentReading(e.target.value);
    renderAll();
  }
});

/* ── نافذة القراءة ── */
function renderDayChips(selected){
  const wrap = $("#readingDays");
  wrap.innerHTML = "";
  WEEK_DAYS.forEach(d => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "day-chip" + (selected.indexOf(d) !== -1 ? " on" : "");
    b.dataset.day = d;
    b.textContent = tDay(d);
    b.addEventListener("click", () => b.classList.toggle("on"));
    wrap.appendChild(b);
  });
}

function openReadingModal(reading){
  $("#readingModalTitle").textContent = t(reading ? "reading.edit" : "reading.add");
  $("#readingEditId").value = reading ? reading.id : "";
  $("#readingName").value = reading ? reading.name : "";
  $("#btnDeleteReading").hidden = !reading;
  renderDayChips(reading ? reading.days : []);
  openModal("modalReading");
}

 $("#btnAddReading").addEventListener("click", () => openReadingModal(null));
 $("#btnEditReading").addEventListener("click", () => {
  const r = Store.getCurrentReading();
  if (r) openReadingModal(r);
});

 $("#readingForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#readingName").value.trim();
  if (!name) return;
  const days = $$("#readingDays .day-chip.on").map(b => Number(b.dataset.day));
  if (!days.length){ showToast(t("reading.daysHint"), "error"); return; }

  const editId = $("#readingEditId").value;
  if (editId){
    Store.updateReading(editId, { name, days });
    showToast(t("reading.updated"));
  } else {
    const r = Store.addReading(name, days);
    Store.setCurrentReading(r.id);
    showToast(t("reading.created"));
  }
  $("#modalReading").hidden = true;
  renderAll();
});

 $("#btnDeleteReading").addEventListener("click", async () => {
  const id = $("#readingEditId").value;
  if (!id) return;
  const ok = await confirmDialog(t("confirm.title"), t("reading.deleteConfirm"));
  if (!ok) return;
  Store.deleteReading(id);
  $("#modalReading").hidden = true;
  showToast(t("reading.deleted"));
  renderAll();
});

/* ── سطر معلومات القراءة ── */
function renderReadingMeta(){
  const el = $("#readingMeta");
  const r = Store.getCurrentReading();
  el.textContent = "";
  if (!r){ el.textContent = t("reading.none"); return; }
  const b = document.createElement("b");
  b.textContent = t("reading.meta", { days: r.days.map(tDay).join("، ") });
  el.appendChild(b);
  el.append(" · " + t("reading.studentsCount", { n: r.students.length }));
}

/* ═══════════════════════════════════════════════════════════════════════
   6) الطلاب
   ═══════════════════════════════════════════════════════════════════════ */
function renderStudents(){
  const r = Store.getCurrentReading();
  const body = $("#studentsBody");
  body.innerHTML = "";

  const q = ($("#studentSearch").value || "").trim().toLowerCase();
  const students = r ? r.students : [];
  const list = q
    ? students.filter(s =>
        (s.name + " " + s.father + " " + s.guardianName + " " + (s.guardianPhone || ""))
          .toLowerCase().indexOf(q) !== -1)
    : students;

  const emptyP = $("#studentsEmpty p");
  emptyP.textContent = r ? t("student.none") : t("reading.none");
  $("#studentsEmpty").hidden = list.length > 0;

  /* إحصاءات اليوم (من سجل حضور اليوم) */
  const todayRecs = r ? Store.getDayAttendance(r.id, todayISO()) : {};
  let present = 0, absent = 0, late = 0;
  students.forEach(s => {
    const rec = todayRecs[s.id];
    if (!rec) return;
    if (rec.status === "present") present++;
    else if (rec.status === "late"){ present++; late++; }
    else if (rec.status === "absent") absent++;
  });
  $("#statTotal").textContent   = students.length;
  $("#statPresent").textContent = present;
  $("#statAbsent").textContent  = absent;
  $("#statLate").textContent    = late;

  if (!r) return;

  list.forEach((s, i) => {
    const rel = s.guardianRelation === "mother"
      ? t("student.relationMother") : t("student.relationFather");
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="col-num">' + (i + 1) + '</td>' +
      '<td><span class="student-name">' + esc(s.name) + '</span>' +
      '<span class="student-sub">' + esc(s.father) + '</span></td>' +
      '<td class="teacher-only guardian-cell">' +
        '<b>' + esc(s.guardianName) + '</b> <small>(' + esc(rel) + ')</small><br>' +
        '<a class="phone-link" href="tel:' + esc(s.guardianPhone) + '">' +
          esc(s.guardianPhone) + '</a>' +
      '</td>' +
      '<td class="teacher-only col-actions">' +
        '<div class="row-actions">' +
          '<button class="icon-btn sm act-edit" title="' + esc(t("common.edit")) + '">' +
            '<svg class="ic"><use href="#i-edit"/></svg></button>' +
          '<button class="icon-btn sm danger act-del" title="' + esc(t("common.delete")) + '">' +
            '<svg class="ic"><use href="#i-trash"/></svg></button>' +
        '</div>' +
      '</td>';

    tr.querySelector(".act-edit").addEventListener("click", () => openStudentModal(s));
    tr.querySelector(".act-del").addEventListener("click", async () => {
      const ok = await confirmDialog(t("confirm.title"), t("student.deleteConfirm"));
      if (ok){
        Store.deleteStudent(r.id, s.id);
        showToast(t("student.deleted"));
        renderAll();
      }
    });
    body.appendChild(tr);
  });
}

 $("#studentSearch").addEventListener("input", debounce(renderStudents, 200));

/* ── نافذة الطالب ── */
function openStudentModal(student){
  $("#studentModalTitle").textContent = t(student ? "student.edit" : "student.add");
  $("#studentEditId").value = student ? student.id : "";
  $("#studentName").value    = student ? student.name : "";
  $("#studentFather").value  = student ? student.father : "";
  $("#guardianName").value   = student ? student.guardianName : "";
  $("#guardianRelation").value = student ? student.guardianRelation : "father";
  $("#guardianPhone").value  = student ? student.guardianPhone : "";
  openModal("modalStudent");
}

 $("#btnAddStudent").addEventListener("click", () => {
  const r = Store.getCurrentReading();
  if (!r){ showToast(t("reading.none"), "error"); return; }
  openStudentModal(null);
});

 $("#studentForm").addEventListener("submit", e => {
  e.preventDefault();
  const r = Store.getCurrentReading();
  if (!r) return;
  const data = {
    name:             $("#studentName").value,
    father:           $("#studentFather").value,
    guardianName:     $("#guardianName").value,
    guardianRelation: $("#guardianRelation").value,
    guardianPhone:    $("#guardianPhone").value
  };
  const editId = $("#studentEditId").value;

  if (Store.studentExists(r.id, data.name, data.father, editId || undefined)){
    showToast(t("student.duplicate"), "error");
    return;
  }
  if (editId){
    Store.updateStudent(r.id, editId, data);
    showToast(t("student.updated"));
  } else {
    Store.addStudent(r.id, data);
    showToast(t("student.saved"));
  }
  $("#modalStudent").hidden = true;
  renderAll();
});

/* ═══════════════════════════════════════════════════════════════════════
   7) الحضور اليومي
   ═══════════════════════════════════════════════════════════════════════ */
function renderAttendance(){
  const r = Store.getCurrentReading();
  const body = $("#attendanceBody");
  body.innerHTML = "";

  $("#attendanceDate").value = currentAttDate;
  $("#attDayName").textContent = fmtDate(currentAttDate);

  const students = r ? r.students : [];
  const isStudy  = r ? isStudyDay(r, currentAttDate) : false;
  $("#notStudyDay").hidden = !r || isStudy;

  const emptyP = $("#attendanceEmpty p");
  emptyP.textContent = r ? t("student.none") : t("reading.none");
  $("#attendanceEmpty").hidden = students.length > 0;

  if (!r){ updateAttStats(); return; }

  const dayRecs = Store.getDayAttendance(r.id, currentAttDate);

  students.forEach((s, i) => {
    const rec = dayRecs[s.id] || { status: null, minutes: 0, book: null, note: "" };
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="col-num">' + (i + 1) + '</td>' +
      '<td><span class="student-name">' + esc(s.name) + '</span>' +
      '<span class="student-sub">' + esc(s.father) + '</span></td>' +
      '<td><div class="att-status" data-sid="' + s.id + '">' +
        '<button type="button" class="st-btn st-present ' + (rec.status === "present" ? "active" : "") + '" data-st="present">' + esc(t("att.btn.present")) + '</button>' +
        '<button type="button" class="st-btn st-late '    + (rec.status === "late"    ? "active" : "") + '" data-st="late">'    + esc(t("att.btn.late"))    + '</button>' +
        '<button type="button" class="st-btn st-absent '  + (rec.status === "absent"  ? "active" : "") + '" data-st="absent">'  + esc(t("att.btn.absent"))  + '</button>' +
      '</div></td>' +
      '<td><input class="min-input" type="number" min="0" max="600" step="1" ' +
        'value="' + (rec.minutes || "") + '" placeholder="0"></td>' +
      '<td><div class="book-seg" data-sid="' + s.id + '">' +
        '<button type="button" class="bk-btn bk-yes ' + (rec.book === true  ? "active" : "") + '" data-bk="1">' + esc(t("att.btn.bookYes")) + '</button>' +
        '<button type="button" class="bk-btn bk-no '  + (rec.book === false ? "active" : "") + '" data-bk="0">' + esc(t("att.btn.bookNo"))  + '</button>' +
      '</div></td>' +
      '<td class="teacher-only"><input class="note-input" type="text" ' +
        'placeholder="' + esc(t("att.notePh")) + '" value="' + esc(rec.note || "") + '"></td>';

    const seg   = tr.querySelector(".att-status");
    const bseg  = tr.querySelector(".book-seg");
    const minIn = tr.querySelector(".min-input");
    const noteIn= tr.querySelector(".note-input");
    const sid   = s.id;

    /* الحضور / الغياب / التأخير */
    seg.addEventListener("click", e => {
      const b = e.target.closest(".st-btn");
      if (!b) return;
      Store.setStudentDay(r.id, currentAttDate, sid, { status: b.dataset.st });
      $$(".st-btn", seg).forEach(x => x.classList.toggle("active", x === b));
      if (b.dataset.st === "late"){ minIn.focus(); minIn.select(); }
      updateAttStats();
    });

    /* حالة الكتاب */
    bseg.addEventListener("click", e => {
      const b = e.target.closest(".bk-btn");
      if (!b) return;
      Store.setStudentDay(r.id, currentAttDate, sid, { book: b.dataset.bk === "1" });
      $$(".bk-btn", bseg).forEach(x => x.classList.toggle("active", x === b));
      updateAttStats();
    });

    /* دقائق التأخير (حفظ مؤجّل + ضبط الحالة تلقائياً) */
    minIn.addEventListener("input", debounce(() => {
      const v = Math.max(0, Number(minIn.value) || 0);
      const cur = Store.getDayAttendance(r.id, currentAttDate)[sid] || {};
      const patch = { minutes: v };
      if (v > 0 && cur.status !== "late"){
        patch.status = "late";
        $$(".st-btn", seg).forEach(x =>
          x.classList.toggle("active", x.dataset.st === "late"));
      }
      Store.setStudentDay(r.id, currentAttDate, sid, patch);
      updateAttStats();
    }, 350));

    /* ملاحظة سريعة (حفظ مؤجّل) */
    if (noteIn){
      noteIn.addEventListener("input", debounce(() => {
        Store.setStudentDay(r.id, currentAttDate, sid, { note: noteIn.value });
      }, 450));
    }

    body.appendChild(tr);
  });

  updateAttStats();
}

function updateAttStats(){
  const r = Store.getCurrentReading();
  let p = 0, a = 0, l = 0, nb = 0;
  if (r){
    const recs = Store.getDayAttendance(r.id, currentAttDate);
    Object.keys(recs).forEach(sid => {
      const rec = recs[sid];
      if (!rec) return;
      if (rec.status === "present") p++;
      else if (rec.status === "late"){ p++; l++; }
      else if (rec.status === "absent") a++;
      if (rec.book === false) nb++;
    });
  }
  $("#attPresent").textContent = p;
  $("#attAbsent").textContent  = a;
  $("#attLate").textContent    = l;
  $("#attNoBook").textContent  = nb;
}

/* ── التنقل بين أيام الدراسة ── */
function jumpStudyDate(iso, dir){
  const r = Store.getCurrentReading();
  const d = parseISO(iso);
  if (!r || !r.days.length){
    d.setDate(d.getDate() + dir);
    return toISO(d);
  }
  for (let i = 0; i < 15; i++){
    d.setDate(d.getDate() + dir);
    if (r.days.indexOf(d.getDay()) !== -1) return toISO(d);
  }
  return iso;
}

 $("#attendanceDate").addEventListener("change", e => {
  if (e.target.value){ currentAttDate = e.target.value; renderAttendance(); }
});
 $("#attPrev").addEventListener("click", () => {
  currentAttDate = jumpStudyDate(currentAttDate, -1); renderAttendance();
});
 $("#attNext").addEventListener("click", () => {
  currentAttDate = jumpStudyDate(currentAttDate, 1); renderAttendance();
});

/* ═══════════════════════════════════════════════════════════════════════
   8) الاختبارات والدرجات
   ═══════════════════════════════════════════════════════════════════════ */
function renderGrades(){
  const r = Store.getCurrentReading();
  const tests    = r ? Store.getTests(r.id) : [];
  const students = r ? r.students : [];

  /* رقائق الاختبارات */
  const chips = $("#testsList");
  chips.innerHTML = "";
  tests.forEach(ts => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "test-chip";
    chip.innerHTML =
      '<span>' + esc(ts.title) + '</span>' +
      '<span class="tc-date">' + esc(fmtShort(ts.date)) + ' · /' + esc(ts.max) + '</span>' +
      '<span class="tc-del" title="' + esc(t("common.delete")) + '">✕</span>';
    chip.addEventListener("click", e => {
      if (e.target.closest(".tc-del")) return;
      openTestModal(ts);
    });
    chip.querySelector(".tc-del").addEventListener("click", async e => {
      e.stopPropagation();
      const ok = await confirmDialog(t("confirm.title"), t("grades.test.deleteConfirm"));
      if (ok){
        Store.deleteTest(r.id, ts.id);
        showToast(t("grades.test.deleted"));
        renderGrades();
      }
    });
    chips.appendChild(chip);
  });

  const head = $("#gradesHead"), bodyC = $("#gradesBody"), foot = $("#gradesFoot");
  head.innerHTML = ""; bodyC.innerHTML = ""; foot.innerHTML = "";

  const hasData = students.length > 0 && tests.length > 0;
  $("#gradesTable").style.display = hasData ? "" : "none";
  const empty = $("#gradesEmpty");
  empty.hidden = hasData;
  if (!hasData){
    const p = empty.querySelector("p");
    if (p) p.textContent = students.length ? t("grades.none") : t("student.none");
    return;
  }

  const maxSum = tests.reduce((a, ts) => a + ts.max, 0);

  /* الرأس */
  const hr = document.createElement("tr");
  hr.innerHTML =
    '<th class="col-num">#</th>' +
    '<th>' + esc(t("common.student")) + '</th>' +
    tests.map(ts =>
      '<th>' + esc(ts.title) +
      '<br><small class="tc-date">' + esc(fmtShort(ts.date)) + ' · /' + esc(ts.max) + '</small></th>'
    ).join("") +
    '<th>' + esc(t("grades.colSum")) + '</th>' +
    '<th>' + esc(t("grades.colPct")) + '</th>';
  head.appendChild(hr);

  /* الصفوف */
  students.forEach((s, i) => {
    const tr = document.createElement("tr");
    const cells = tests.map(ts => {
      const v = ts.scores[s.id];
      const has = v !== undefined && v !== null;
      return '<td><input class="grade-input" data-tid="' + ts.id + '" ' +
             'type="number" min="0" max="' + ts.max + '" step="0.5" ' +
             'value="' + (has ? v : "") + '" placeholder="—"></td>';
    }).join("");
    tr.innerHTML =
      '<td class="col-num">' + (i + 1) + '</td>' +
      '<td><span class="student-name">' + esc(s.name) + '</span>' +
      '<span class="student-sub">' + esc(s.father) + '</span></td>' +
      cells +
      '<td class="row-sum"></td>' +
      '<td><span class="pct"></span></td>';

    /* حفظ الدرجة عند التغيير + تحديث فوري للمجموع والنسبة */
    tr.addEventListener("change", e => {
      const inp = e.target.closest(".grade-input");
      if (!inp) return;
      const ts = tests.find(x => x.id === inp.dataset.tid);
      const raw = inp.value.trim();
      if (raw === ""){
        Store.setScore(r.id, ts.id, s.id, null);
      } else {
        let n = Number(raw);
        if (isNaN(n)){
          inp.value = "";
          Store.setScore(r.id, ts.id, s.id, null);
        } else {
          if (n > ts.max){
            showToast(t("grades.invalid"), "error");
            n = ts.max;
            inp.value = n;
          }
          Store.setScore(r.id, ts.id, s.id, n);
        }
      }
      updateGradeRow(tr, s.id, tests);
    });

    updateGradeRow(tr, s.id, tests);
    bodyC.appendChild(tr);
  });

  /* صف الدرجة العظمى */
  const fr = document.createElement("tr");
  fr.innerHTML =
    '<td colspan="2">' + esc(t("grades.test.max")) + '</td>' +
    tests.map(ts => '<td>' + ts.max + '</td>').join("") +
    '<td>' + maxSum + '</td><td>100%</td>';
  foot.appendChild(fr);
}

function updateGradeRow(tr, studentId, tests){
  let sum = 0;
  tests.forEach(ts => {
    const v = ts.scores[studentId];
    if (v !== undefined && v !== null) sum += Number(v) || 0;
  });
  const maxSum = tests.reduce((a, ts) => a + ts.max, 0);
  const pct = maxSum ? Math.round((sum / maxSum) * 100) : 0;
  tr.querySelector(".row-sum").innerHTML = "<b>" + sum + "</b> / " + maxSum;
  const pc = tr.querySelector(".pct");
  pc.className = "pct " + (pct >= 75 ? "pct-good" : pct >= 50 ? "pct-mid" : "pct-low");
  pc.textContent = pct + "%";
}

/* ── نافذة الاختبار ── */
function openTestModal(test){
  $("#testModalTitle").textContent = t(test ? "grades.test.edit" : "grades.test.add");
  $("#testEditId").value = test ? test.id : "";
  $("#testTitle").value  = test ? test.title : "";
  $("#testDate").value   = test ? test.date : todayISO();
  $("#testMax").value    = test ? test.max : 10;
  openModal("modalTest");
}

 $("#btnAddTest").addEventListener("click", () => {
  const r = Store.getCurrentReading();
  if (!r){ showToast(t("reading.none"), "error"); return; }
  openTestModal(null);
});

 $("#testForm").addEventListener("submit", e => {
  e.preventDefault();
  const r = Store.getCurrentReading();
  if (!r) return;
  const data = {
    title: $("#testTitle").value,
    date:  $("#testDate").value || todayISO(),
    max:   $("#testMax").value
  };
  const editId = $("#testEditId").value;
  if (editId){
    Store.updateTest(r.id, editId, data);
    showToast(t("grades.test.updated"));
  } else {
    Store.addTest(r.id, data);
    showToast(t("grades.test.saved"));
  }
  $("#modalTest").hidden = true;
  renderGrades();
});

/* ═══════════════════════════════════════════════════════════════════════
   9) التقارير الأسبوعية
   ═══════════════════════════════════════════════════════════════════════ */
function renderReports(){
  const r = Store.getCurrentReading();
  $("#reportDate").value = currentReportDate;
  const body = $("#reportsBody");
  body.innerHTML = "";

  if (!r){
    $("#reportsEmpty").hidden = false;
    $("#weekRange").textContent = "";
    return;
  }

  const stats = Store.computeWeekStats(r.id, currentReportDate);
  $("#weekRange").textContent =
    t("report.weekOf", { a: fmtDate(stats.weekStart), b: fmtDate(stats.weekEnd) });

  const students = r.students;
  $("#reportsEmpty").hidden = students.length > 0;

  students.forEach((s, i) => {
    const st = stats.students.find(x => x.student.id === s.id);
    if (!st) return;

    const shortDates = arr => arr.length
      ? arr.map(d => fmtShort(d)).join("، ") : "—";
    const pctVal = st.gradePct === null ? "—" : st.gradePct + "%";
    const pctNum = st.gradePct === null ? 0 : st.gradePct;

    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="col-num">' + (i + 1) + '</td>' +
      '<td><span class="student-name">' + esc(s.name) + '</span>' +
      '<span class="student-sub">' + esc(s.father) + '</span></td>' +
      '<td>' + st.present + '/' + st.studyDays.length + '</td>' +
      '<td>' + esc(shortDates(st.absentDates)) + '</td>' +
      '<td>' + (st.lateMinutes || "—") + '</td>' +
      '<td>' + esc(shortDates(st.noBookDates)) + '</td>' +
      '<td><span class="pct ' +
        (pctNum >= 75 ? "pct-good" : pctNum >= 50 ? "pct-mid" : "pct-low") +
        '">' + pctVal + '</span></td>' +
      '<td><div class="send-actions">' +
        '<button class="icon-btn tg act-tg" title="Telegram"><svg class="ic"><use href="#i-send"/></svg></button>' +
        '<button class="icon-btn sms act-sms" title="SMS"><svg class="ic"><use href="#i-sms"/></svg></button>' +
        '<button class="icon-btn shr act-shr" title="' + esc(t("msg.share")) + '"><svg class="ic"><use href="#i-share"/></svg></button>' +
      '</div></td>';

    tr.querySelector(".act-tg").addEventListener("click", () => openMessageModal(r, st));
    tr.querySelector(".act-sms").addEventListener("click", () => openMessageModal(r, st));
    tr.querySelector(".act-shr").addEventListener("click", () => openMessageModal(r, st));
    body.appendChild(tr);
  });
}

 $("#reportDate").addEventListener("change", e => {
  if (e.target.value){
    currentReportDate = weekStartISO(e.target.value);
    renderReports();
  }
});
 $("#repPrev").addEventListener("click", () => {
  currentReportDate = shiftISO(currentReportDate, -7); renderReports();
});
 $("#repNext").addEventListener("click", () => {
  currentReportDate = shiftISO(currentReportDate, 7); renderReports();
});

/* ═══════════════════════════════════════════════════════════════════════
   10) رسالة وليّ الأمر — عربيةٌ فصيحةٌ أدبية
   ═══════════════════════════════════════════════════════════════════════ */
function buildParentMessage(reading, stat){
  const s = stat.student;
  const g = s.guardianName || "—";
  const full = s.name + (s.father ? " " + s.father : "");
  const range = fmtDate(stat.weekStart, "ar") + " — " + fmtDate(stat.weekEnd, "ar");
  const arDates = arr => arr.map(d => fmtDate(d, "ar")).join("، ");

  const L = [];
  L.push(AR_MSG.greeting);
  L.push(fillTpl(s.guardianRelation === "mother" ? AR_MSG.vocMother : AR_MSG.vocFather, { g }));
  L.push(AR_MSG.opener);
  L.push(fillTpl(AR_MSG.intro, { s: full, r: reading.name, range }));
  L.push(AR_MSG.head);
  L.push(fillTpl(AR_MSG.present, { n: stat.present, t: stat.studyDays.length }));

  if (stat.absentDates.length)
    L.push(fillTpl(AR_MSG.absent, { n: stat.absentDates.length, d: arDates(stat.absentDates) }));
  else
    L.push(AR_MSG.absentNone);

  if (stat.lateMinutes > 0)
    L.push(fillTpl(AR_MSG.late, { n: stat.lateMinutes, d: arDates(stat.lateDates) }));
  else
    L.push(AR_MSG.lateNone);

  if (stat.noBookDates.length)
    L.push(fillTpl(AR_MSG.noBook, { d: arDates(stat.noBookDates) }));
  else
    L.push(AR_MSG.bookAll);

  if (stat.tests.length){
    L.push(AR_MSG.gradesHead);
    stat.tests.forEach(item => {
      const score = (item.score === null || item.score === undefined) ? "—" : item.score;
      L.push(fillTpl(AR_MSG.gradeLine, { t: item.test.title, s: score, m: item.test.max }));
    });
    L.push(fillTpl(AR_MSG.gradesSum, {
      a: stat.gradeSum,
      b: stat.gradeMax,
      p: stat.gradePct === null ? "—" : stat.gradePct
    }));
  }

  const perfect = !stat.absentDates.length && stat.lateMinutes === 0 &&
                  !stat.noBookDates.length &&
                  (stat.gradePct === null || stat.gradePct >= 80);
  L.push(perfect ? AR_MSG.praise : AR_MSG.encourage);
  L.push(AR_MSG.closing);
  L.push("— " + AR_MSG.signature);

  return L.join("\n");
}

function openMessageModal(reading, stat){
  const s = stat.student;
  const rel = s.guardianRelation === "mother"
    ? t("student.relationMother") : t("student.relationFather");
  $("#msgTo").textContent =
    s.guardianName + " (" + rel + ") — " + (s.guardianPhone || "—");
  msgTargetPhone = (s.guardianPhone || "").trim();
  $("#messageText").value = buildParentMessage(reading, stat);
  openModal("modalMessage");
}

function currentMsg(){ return $("#messageText").value; }
function normalizePhone(p){ return String(p || "").replace(/[^\d+]/g, ""); }

/* تليجرام: ورقة مشاركة تليجرام — يختار المعلّم محادثة وليّ الأمر ويرسل */
 $("#btnTelegram").addEventListener("click", () => {
  window.open("https://t.me/share/url?text=" + encodeURIComponent(currentMsg()), "_blank");
  showToast(t("msg.telegramHint"), "info");
});

/* رسالة قصيرة: فتح تطبيق الرسائل بالرقم والنص جاهزين */
 $("#btnSms").addEventListener("click", () => {
  const ph = normalizePhone(msgTargetPhone);
  if (!ph){ showToast(t("msg.noPhone"), "error"); return; }
  const body = encodeURIComponent(currentMsg());
  const sep = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? "&" : "?";
  window.location.href = "sms:" + ph + sep + "body=" + body;
  showToast(t("msg.smsHint"), "info");
});

/* مشاركة عبر أي تطبيق */
 $("#btnShareMsg").addEventListener("click", async () => {
  const msg = currentMsg();
  if (navigator.share){
    try { await navigator.share({ text: msg }); } catch(e){ /* أُلغيت */ }
  } else {
    copyMsg();
  }
});

 $("#btnCopyMsg").addEventListener("click", copyMsg);

function copyMsg(){
  const msg = currentMsg();
  const done = () => showToast(t("msg.copied"));
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(msg).then(done).catch(() => fallbackCopy(msg, done));
  } else {
    fallbackCopy(msg, done);
  }
}
function fallbackCopy(text, done){
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done(); }
  catch(e){ showToast(t("toast.error"), "error"); }
  ta.remove();
}

/* ═══════════════════════════════════════════════════════════════════════
   11) المستخدمون (المساعدون + كلمة المرور)
   ═══════════════════════════════════════════════════════════════════════ */
function renderAssistants(){
  const list = $("#assistantsList");
  list.innerHTML = "";
  Store.getUsers().filter(u => u.role === "assistant").forEach(u => {
    const li = document.createElement("li");
    li.className = "user-item";
    li.innerHTML =
      '<svg class="ic"><use href="#i-user"/></svg>' +
      '<div class="user-info"><strong>' + esc(u.name) + '</strong>' +
      '<span class="user-un">' + esc(u.username) + '</span></div>' +
      '<button class="icon-btn sm danger u-del" title="' + esc(t("common.delete")) + '">' +
      '<svg class="ic"><use href="#i-trash"/></svg></button>';
    li.querySelector(".u-del").addEventListener("click", async () => {
      const ok = await confirmDialog(t("confirm.title"), t("users.deleteConfirm"));
      if (ok){
        Store.deleteUser(u.id);
        showToast(t("users.assistantDeleted"));
        renderAssistants();
      }
    });
    list.appendChild(li);
  });
}

 $("#addAssistantForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = {
    name:     $("#assistName").value,
    username: $("#assistUsername").value,
    password: $("#assistPass").value,
    role:     "assistant"
  };
  if (Store.findUserByUsername(data.username)){
    showToast(t("users.usernameTaken"), "error");
    return;
  }
  Store.addUser(data);
  showToast(t("users.assistantAdded"));
  e.target.reset();
  renderAssistants();
});

 $("#changePassForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!CURRENT_USER) return;
  const res = Store.changePassword(
    CURRENT_USER.id, $("#curPass").value, $("#newPass").value);
  if (res.ok){
    showToast(t("users.passChanged"));
    e.target.reset();
  } else {
    showToast(t("users.wrongPass"), "error");
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   12) النسخ الاحتياطي (تصدير / استيراد)
   ═══════════════════════════════════════════════════════════════════════ */
 $("#btnExport").addEventListener("click", () => {
  const blob = new Blob([Store.exportData()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "qira-log-backup-" + todayISO() + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
});

 $("#importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const res = Store.importData(reader.result);
    if (res.ok){
      showToast(t("users.importDone"));
      const u = Store.getSessionUser();
      if (u) enterApp(u); else showLogin();
    } else {
      showToast(t("users.importBad"), "error");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

/* ═══════════════════════════════════════════════════════════════════════
   13) PWA: زر التثبيت + عامل الخدمة
   ═══════════════════════════════════════════════════════════════════════ */
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredInstall = e;
  $("#btnInstall").hidden = false;
});

 $("#btnInstall").addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  try { await deferredInstall.userChoice; } catch(e){}
  deferredInstall = null;
  $("#btnInstall").hidden = true;
});

window.addEventListener("appinstalled", () => { $("#btnInstall").hidden = true; });

if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   14) مزامنة اللغة والبيانات الخارجية
   ═══════════════════════════════════════════════════════════════════════ */
document.addEventListener("langchange", () => {
  renderLoginHints();
  if (CURRENT_USER){
    const badge = $("#currentUserRole");
    badge.textContent = t(CURRENT_USER.role === "teacher" ? "role.teacher" : "role.assistant");
    renderAll();
  }
});

document.addEventListener("dbexternal", () => {
  if (CURRENT_USER) renderAll();
});

document.addEventListener("sessionexternal", () => {
  const u = Store.getSessionUser();
  if (u && CURRENT_USER && u.id === CURRENT_USER.id) return;
  if (u) enterApp(u); else showLogin();
});

/* ═══════════════════════════════════════════════════════════════════════
   15) الإقلاع
   ═══════════════════════════════════════════════════════════════════════ */
(function initApp(){
  /* شعار التطبيق في الشاشتين */
  const tpl = $("#brandMarkTpl");
  const make = () => tpl.content.firstElementChild.cloneNode(true);
  $("#loginBrandMark").appendChild(make());
  $("#topBrandMark").appendChild(make());

  /* استئناف الجلسة إن وُجدت */
  const user = Store.getSessionUser();
  if (user) enterApp(user);
  else showLogin();
})();
