/* ═══════════════════════════════════════════════════════════════════════
   የንባብ መዝገብ · سِجِلُّ القُرّاء · Reading Log
   js/i18n.js
   ─ نظام الترجمة: الأمهرية (الأصل) + العربية + الإنجليزية
   ─ القوالب الأدبية الفصيحة لرسائل أولياء الأمور (عربية دائماً)
   ─ تنسيق التواريخ وأسماء الأيام والشهور لكل لغة
   ═══════════════════════════════════════════════════════════════════════ */
"use strict";

/* ──────────────── معلومات اللغات ──────────────── */
const LANG_META = {
  am: { dir: "ltr", name: "አማርኛ"   },
  en: { dir: "ltr", name: "English"  },
  ar: { dir: "rtl", name: "العربية"  }
};

/* ترتيب أيام الأسبوع في محرر أيام القراءة: السبت أولاً (يناسب حلقات القراءة) */
const WEEK_DAYS = [6, 0, 1, 2, 3, 4, 5]; /* 0=الأحد … 6=السبت (فهرس getDay) */

/* ═══════════════════════════════════════════════════════════════════════
   القاموس ①: الأمهرية (اللغة الأصلية — الافتراضية)
   ═══════════════════════════════════════════════════════════════════════ */
const I18N = {};

I18N.am = {
  /* ── عام ── */
  "app.title":  "የንባብ መዝገብ",
  "app.motto":  "ትምህርት ብርሃን ናት",
  "app.foot":   "ሙሉ በሙሉ በአሳሽዎ ውስጥ ይሠራል — ዳታዎ በአሳሽዎ ውስጥ በአስተማማኝ ሁኔታ ይቀመጣል።",
  "confirm.title": "እባክዎ ያረጋግጡ",
  "toast.saved":   "በተሳካ ሁኔታ ተቀምጧል ✓",
  "toast.deleted": "በተሳካ ሁኔታ ተጠፍቷል ✓",
  "toast.error":   "ስህተት ተከስቷል!",

  /* ── تسجيل الدخول ── */
  "login.username": "የተጠቃሚ ስም",
  "login.password": "የይለፍ ቃል",
  "login.submit":   "ግባ",
  "login.error":    "የተጠቃሚ ስም ወይም የይለፍ ቃል አልተሳከም።",
  "login.firstRun": "የመጀመሪያ ጊዜ፦ የአስተማሪ መግቢያ «teacher» · የይለፍ ቃል «1234» — እባክዎ በኋላ ይቀይሩት።",

  /* ── التبويبات ── */
  "nav.students":    "ተማሪዎች",
  "nav.attendance":  "ዕለታዊ መገኘት",
  "nav.grades":      "ውጤቶች",
  "nav.reports":     "ሪፖርቶች",
  "nav.users":       "ተጠቃሚዎች",

  /* ── مشترك ── */
  "common.student":  "ተማሪ",
  "common.actions":  "ተግባራት",
  "common.edit":     "አርትዕ",
  "common.delete":   "አጥፋ",
  "common.cancel":   "ሰርዝ",
  "common.save":     "አስቀምጥ",
  "common.confirm":  "አዎ፣ አጥፋ",
  "common.logout":   "ውጣ",
  "common.prev":     "ቀዳሚ",
  "common.next":     "ቀጣይ",
  "common.close":    "ዝጋ",
  "common.total":    "ድምር",
  "common.percent":  "መቶኛ",
  "common.date":     "ቀን",
  "common.yes":      "አዎ",
  "common.no":       "አይደለም",

  /* ── الصلاحيات ── */
  "role.teacher":    "አስተማሪ",
  "role.assistant":  "አጋዝ",

  /* ── القراءات ── */
  "reading.add":     "አዲስ ንባብ ጨምር",
  "reading.edit":    "ንባብ አርትዕ",
  "reading.name":    "የንባብ ስም",
  "reading.days":    "የትምህርት ቀናት",
  "reading.daysHint":"ቢያንስ አንድ ቀን መምረጥ አለብዎት",
  "reading.select":  "ንባብ ይምረጡ…",
  "reading.none":    "እስካሁን ምንም ንባብ አልተፈጠረም። «አዲስ ንባብ ጨምር» የሚለውን ይንኩ።",
  "reading.meta":    "የትምህርት ቀናት፦ {days}",
  "reading.studentsCount": "{n} ተማሪዎች",
  "reading.deleteConfirm": "ይህን ንባብ ማጥፋት ተማሪዎቹን፣ የመገኘት መዝገባቸውንና ውጤቶቻቸውን ለዘላለም ያጠፋል።",
  "reading.created": "ንባቡ በተሳካ ሁኔታ ተፈጥሯል ✓",
  "reading.updated": "ንባቡ ተዘምኗል ✓",
  "reading.deleted": "ንባቡ ተጠፍቷል ✓",

  /* ── الطالب ── */
  "student.add":     "ተማሪ ጨምር",
  "student.edit":    "ተማሪ አርትዕ",
  "student.name":    "የተማሪ ስም",
  "student.father":  "የአባት ስም",
  "student.guardian":"ወላጅ",
  "student.guardianName": "የወላጅ ሙሉ ስም",
  "student.relation":     "ዝምድነት",
  "student.relationFather":"አባት",
  "student.relationMother":"እናት",
  "student.phone":    "የወላጅ ስልክ ቁጥር",
  "student.searchPh": "ተማሪ ፈልግ…",
  "student.none":     "እስካሁን ምንም ተማሪ አልተመዘገበም። «ተማሪ ጨምር» የሚለውን ቁልፍ ይጠቀሙ።",
  "student.saved":    "ተማሪው ተቀምጧል ✓",
  "student.updated":  "ተማሪው ተዘምኗል ✓",
  "student.deleted":  "ተማሪው ተጠፍቷል ✓",
  "student.deleteConfirm": "የዚህ ተማሪ ሁሉም መዝገብ (መገኘትና ውጤቶች) ይጠፋል።",
  "student.duplicate": "በዚህ ንባብ ውስጥ በዚህ ስም ተማሪ አስቀድሞ አለ።",

  /* ── الإحصاءات ── */
  "stat.total":   "ጠቅላላ ተማሪዎች",
  "stat.present": "ዛሬ ተገኝተዋል",
  "stat.absent":  "ዛሬ አልተገኙም",
  "stat.late":    "ዘግይተዋል",
  "stat.noBook":  "ያለ መጽሐፍ",

  /* ── الحضور اليومي ── */
  "att.status":   "ሁኔታ",
  "att.minutes":  "የመዘግየት ደቂቃ",
  "att.book":     "መጽሐፍ",
  "att.note":     "ማስታወሻ",
  "att.notePh":   "ቀላል ማስታወሻ…",
  "att.notStudyDay": "የተመረጠው ቀን የዚህ ንባብ የትምህርት ቀን አይደለም።",
  "att.autosave": "ሁሉም ለውጦች በራስ-ሰር ይቀመጣሉ — እርስዎ በተለየ ማስቀመጥ አያስፈልግዎም።",
  "att.btn.present": "ተገኝ",
  "att.btn.late":    "ዘግይቷል",
  "att.btn.absent":  "አልተገኝም",
  "att.btn.bookYes": "አመጣ",
  "att.btn.bookNo":  "ያለ",
  "att.unset":       "ያልተመዘገበ",

  /* ── الدرجات ── */
  "grades.test.add":  "አዲስ ፈተና ጨምር",
  "grades.test.edit": "ፈተና አርትዕ",
  "grades.test.title":"የፈተና ርዕስ",
  "grades.test.date": "የፈተና ቀን",
  "grades.test.max":  "ከፍተኛ ነጥብ",
  "grades.hint":      "ፈተናዎችን ይጨምሩ — ድምሩና መቶኛው በራስ-ሰር ይሰላሉ።",
  "grades.none":      "እስካሁን ምንም ፈተና አልተመዘገበም።",
  "grades.colSum":    "ድምር",
  "grades.colPct":    "መቶኛ",
  "grades.saved":     "ውጤቱ ተቀምጧል ✓",
  "grades.test.saved":   "ፈተናው ተቀምጧል ✓",
  "grades.test.updated": "ፈተናው ተዘምኗል ✓",
  "grades.test.deleted": "ፈተናው ተጠፍቷል ✓",
  "grades.test.deleteConfirm": "የዚህ ፈተና ውጤቶች ሁሉ ለሁሉም ተማሪዎች ይጠፋሉ።",
  "grades.needTest":  "እባክዎ በመጀመሪያ ፈተና ይጨምሩ።",
  "grades.invalid":   "የገባው ነጥብ ከከፍተኛው ነጥብ በላይ ነው።",

  /* ── التقارير ── */
  "report.present":  "የመገኘት ቀናት",
  "report.absent":   "የመቅረት ቀናት",
  "report.lateMin":  "የመዘግየት ደቂቃ",
  "report.bookMiss": "ያለ መጽሐፍ",
  "report.grades":   "ውጤት %",
  "report.send":     "ለወላጅ መላክ",
  "report.prev":     "ያለፈ ሳምንት",
  "report.next":     "ቀጣይ ሳምንት",
  "reports.none":    "ሪፖርት ለማየት እባክዎ ተማሪዎችን ይጨምሩ።",
  "report.weekOf":   "የሳምንቱ ክልል፦ {a} — {b}",

  /* ── رسالة ولي الأمر ── */
  "msg.title":      "ለወላጅ የተዘጋጀ መልእክት",
  "msg.hint":       "መልእክቱ በጥራት ባለው ዓረብኛ (ፉሻ) ይጻፋል — ከዚያ በቴሌግራም፣ በኤስኤምኤስ ወይም በማንኛውም መተግበሪያ ይላኩት።",
  "msg.telegram":   "ቴሌግራም",
  "msg.sms":        "ኤስኤምኤስ",
  "msg.share":      "አጋራ",
  "msg.copy":       "ቅዳ",
  "msg.copied":     "መልእክቱ ተቀምጧል ✓",
  "msg.noPhone":    "የወላጁ ስልክ ቁጥር አልተመዘገበም።",
  "msg.telegramHint": "ቴሌግራም ተከፍቷል — መልእክቱ ዝግጁ ነው።",
  "msg.smsHint":      "የኤስኤምኤስ መተግበሪያ ተከፍቷል።",

  /* ── المستخدمون ── */
  "users.assistants": "የአጋዝ ተጠቃሚዎች",
  "users.fullName":   "ሙሉ ስም",
  "users.username":   "የተጠቃሚ ስም",
  "users.password":   "የይለፍ ቃል",
  "users.addAssistant": "አጋዝ ጨምር",
  "users.changePass":   "የይለፍ ቃል ቀይር",
  "users.currentPass":  "አሁን ያለው የይለፍ ቃል",
  "users.newPass":      "አዲስ የይለፍ ቃል",
  "users.save":         "አስቀምጥ",
  "users.backup":       "መጠባበቂያ ቅጂ",
  "users.backupHint":   "መረጃዎን በፋይል ማውጣትና ወደ ሌላ መሣሪያ ማጓጓዝ ይችላሉ።",
  "users.export":       "መረጃ አውጣ",
  "users.import":       "መረጃ አስገባ",
  "users.assistantAdded":   "የአጋዝ መግቢያ ተፈጥሯል ✓",
  "users.assistantDeleted": "የአጋዝ መግቢያ ተጠፍቷል ✓",
  "users.usernameTaken": "ይህ የተጠቃሚ ስም አስቀድሞ ተወስዷል።",
  "users.passChanged":   "የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል ✓",
  "users.wrongPass":     "አሁን ያለው የይለፍ ቃል አልተሳከም።",
  "users.deleteConfirm": "ይህ የአጋዝ መግቢያ ይጠፋል።",
  "users.importDone":    "መረጃው በተሳካ ሁኔታ ገብቷል ✓",
  "users.importBad":     "ፋይሉ ትክክለኛ አይደለም — መረጃው አልተነበበም።",

  /* ── التثبيت PWA ── */
  "install.title": "መተግበሪያውን ጫን",
  "install.hint":  "ይህን መተግበሪያ በስልክዎ ላይ እንደ አፕሊኬሽን ማድረግ ይችላሉ።",

  /* ── الأيام (فهرس getDay: 0=الأحد) ── */
  "day.0": "እሑድ",   "day.1": "ሰኞ",    "day.2": "ማክሰኞ",
  "day.3": "ረቡዕ",   "day.4": "ሐሙስ",   "day.5": "ዓርብ",
  "day.6": "ቅዳሜ",

  /* ── الشهور (ميلادية) ── */
  "month.1":  "ጃንዩወሪ",  "month.2":  "ፌብሩወሪ", "month.3":  "ማርች",
  "month.4":  "ኤፕሪል",    "month.5":  "ሜይ",      "month.6":  "ጁን",
  "month.7":  "ጁላይ",     "month.8":  "ኦገስት",   "month.9":  "ሴፕቴምበር",
  "month.10": "ኦክቶበር",  "month.11": "ኖቬምበር", "month.12": "ዲሴምበር"
};

/* ═══════════════════════════════════════════════════════════════════════
   القاموس ②: الإنجليزية
   ═══════════════════════════════════════════════════════════════════════ */
I18N.en = {
  "app.title":  "Reading Log",
  "app.motto":  "Knowledge is light",
  "app.foot":   "Runs entirely in your browser — your data stays on your device.",
  "confirm.title": "Please confirm",
  "toast.saved":   "Saved successfully ✓",
  "toast.deleted": "Deleted ✓",
  "toast.error":   "An error occurred!",

  "login.username": "Username",
  "login.password": "Password",
  "login.submit":   "Sign in",
  "login.error":    "Invalid username or password.",
  "login.firstRun": "First run — Teacher login: «teacher» · Password: «1234» (please change it later).",

  "nav.students":   "Students",
  "nav.attendance": "Daily Attendance",
  "nav.grades":     "Grades",
  "nav.reports":    "Reports",
  "nav.users":      "Users",

  "common.student": "Student",
  "common.actions": "Actions",
  "common.edit":    "Edit",
  "common.delete":  "Delete",
  "common.cancel":  "Cancel",
  "common.save":    "Save",
  "common.confirm": "Yes, delete",
  "common.logout":  "Log out",
  "common.prev":    "Previous",
  "common.next":    "Next",
  "common.close":   "Close",
  "common.total":   "Total",
  "common.percent": "Percent",
  "common.date":    "Date",
  "common.yes":     "Yes",
  "common.no":      "No",

  "role.teacher":   "Teacher",
  "role.assistant": "Assistant",

  "reading.add":     "New Reading",
  "reading.edit":    "Edit Reading",
  "reading.name":    "Reading name",
  "reading.days":    "Study days",
  "reading.daysHint":"Select at least one day",
  "reading.select":  "Select a reading…",
  "reading.none":    "No readings yet — tap “New Reading” to begin.",
  "reading.meta":    "Study days: {days}",
  "reading.studentsCount": "{n} students",
  "reading.deleteConfirm": "Deleting this reading permanently removes its students, attendance and grades.",
  "reading.created": "Reading created ✓",
  "reading.updated": "Reading updated ✓",
  "reading.deleted": "Reading deleted ✓",

  "student.add":     "Add Student",
  "student.edit":    "Edit Student",
  "student.name":    "Student name",
  "student.father":  "Father’s name",
  "student.guardian":"Guardian",
  "student.guardianName": "Guardian full name",
  "student.relation":     "Relation",
  "student.relationFather":"Father",
  "student.relationMother":"Mother",
  "student.phone":    "Guardian phone",
  "student.searchPh": "Search student…",
  "student.none":     "No students registered yet — use “Add Student”.",
  "student.saved":    "Student saved ✓",
  "student.updated":  "Student updated ✓",
  "student.deleted":  "Student deleted ✓",
  "student.deleteConfirm": "All of this student’s records (attendance & grades) will be removed.",
  "student.duplicate": "A student with this name already exists in this reading.",

  "stat.total":   "Total students",
  "stat.present": "Present today",
  "stat.absent":  "Absent today",
  "stat.late":    "Late",
  "stat.noBook":  "No book",

  "att.status":   "Status",
  "att.minutes":  "Late minutes",
  "att.book":     "Book",
  "att.note":     "Notes",
  "att.notePh":   "Quick note…",
  "att.notStudyDay": "The selected date is not a study day for this reading.",
  "att.autosave": "Every change is saved automatically — no save button needed.",
  "att.btn.present": "Present",
  "att.btn.late":    "Late",
  "att.btn.absent":  "Absent",
  "att.btn.bookYes": "Brought",
  "att.btn.bookNo":  "Missing",
  "att.unset":       "Unrecorded",

  "grades.test.add":  "Add Test",
  "grades.test.edit": "Edit Test",
  "grades.test.title":"Test title",
  "grades.test.date": "Date",
  "grades.test.max":  "Max score",
  "grades.hint":      "Add tests — totals and percentages are calculated automatically.",
  "grades.none":      "No tests recorded yet.",
  "grades.colSum":    "Total",
  "grades.colPct":    "Percent",
  "grades.saved":     "Score saved ✓",
  "grades.test.saved":   "Test saved ✓",
  "grades.test.updated": "Test updated ✓",
  "grades.test.deleted": "Test deleted ✓",
  "grades.test.deleteConfirm": "All scores of this test will be removed for every student.",
  "grades.needTest":  "Please add a test first.",
  "grades.invalid":   "The entered score exceeds the maximum.",

  "report.present":  "Days present",
  "report.absent":   "Days absent",
  "report.lateMin":  "Late minutes",
  "report.bookMiss": "No-book days",
  "report.grades":   "Score %",
  "report.send":     "Send to guardian",
  "report.prev":     "Previous week",
  "report.next":     "Next week",
  "reports.none":    "Add students to see weekly reports.",
  "report.weekOf":   "Week: {a} — {b}",

  "msg.title":      "Guardian Message",
  "msg.hint":       "The message is composed in eloquent Arabic, ready to send via Telegram, SMS, or any app.",
  "msg.telegram":   "Telegram",
  "msg.sms":        "SMS",
  "msg.share":      "Share",
  "msg.copy":       "Copy",
  "msg.copied":     "Message copied ✓",
  "msg.noPhone":    "Guardian phone number is not registered.",
  "msg.telegramHint": "Telegram opened — the message is ready.",
  "msg.smsHint":      "SMS app opened.",

  "users.assistants": "Assistant Accounts",
  "users.fullName":   "Full name",
  "users.username":   "Username",
  "users.password":   "Password",
  "users.addAssistant": "Add Assistant",
  "users.changePass":   "Change Password",
  "users.currentPass":  "Current password",
  "users.newPass":      "New password",
  "users.save":         "Save",
  "users.backup":       "Backup",
  "users.backupHint":   "Export your data to a JSON file and move it to another device anytime.",
  "users.export":       "Export",
  "users.import":       "Import",
  "users.assistantAdded":   "Assistant account created ✓",
  "users.assistantDeleted": "Assistant account deleted ✓",
  "users.usernameTaken": "This username is already taken.",
  "users.passChanged":   "Password changed ✓",
  "users.wrongPass":     "Current password is incorrect.",
  "users.deleteConfirm": "This assistant account will be deleted.",
  "users.importDone":    "Data imported successfully ✓",
  "users.importBad":     "Invalid file — could not read data.",

  "install.title": "Install App",
  "install.hint":  "Install this app on your device to use it like a native app.",

  "day.0": "Sunday", "day.1": "Monday", "day.2": "Tuesday",
  "day.3": "Wednesday", "day.4": "Thursday", "day.5": "Friday",
  "day.6": "Saturday",

  "month.1":  "January",  "month.2":  "February", "month.3":  "March",
  "month.4":  "April",    "month.5":  "May",      "month.6":  "June",
  "month.7":  "July",     "month.8":  "August",   "month.9":  "September",
  "month.10": "October",  "month.11": "November", "month.12": "December"
};

/* ═══════════════════════════════════════════════════════════════════════
   القاموس ③: العربية
   ═══════════════════════════════════════════════════════════════════════ */
I18N.ar = {
  "app.title":  "سِجِلُّ القُرّاء",
  "app.motto":  "العِلْمُ نورٌ يُهتدى به",
  "app.foot":   "يعمل بالكامل داخل متصفّحك — بياناتك تُحفَظ على جهازك وحدك.",
  "confirm.title": "تأكيد",
  "toast.saved":   "تم الحفظ ✓",
  "toast.deleted": "تم الحذف ✓",
  "toast.error":   "حدث خطأ!",

  "login.username": "اسم المستخدم",
  "login.password": "كلمة المرور",
  "login.submit":   "دخول",
  "login.error":    "اسم المستخدم أو كلمة المرور غير صحيحة.",
  "login.firstRun": "الدخول الأول: حساب المعلّم «teacher» وكلمة المرور «1234» — يُرجى تغييرها بعد الدخول.",

  "nav.students":   "الطلاب",
  "nav.attendance": "الحضور اليومي",
  "nav.grades":     "الدرجات",
  "nav.reports":    "التقارير",
  "nav.users":      "المستخدمون",

  "common.student": "الطالب",
  "common.actions": "إجراءات",
  "common.edit":    "تعديل",
  "common.delete":  "حذف",
  "common.cancel":  "إلغاء",
  "common.save":    "حفظ",
  "common.confirm": "نعم، احذف",
  "common.logout":  "خروج",
  "common.prev":    "السابق",
  "common.next":    "التالي",
  "common.close":   "إغلاق",
  "common.total":   "المجموع",
  "common.percent": "النسبة",
  "common.date":    "التاريخ",
  "common.yes":     "نعم",
  "common.no":      "لا",

  "role.teacher":   "المعلّم",
  "role.assistant": "مساعد",

  "reading.add":     "إضافة قراءة جديدة",
  "reading.edit":    "تعديل القراءة",
  "reading.name":    "اسم القراءة",
  "reading.days":    "أيام الدراسة",
  "reading.daysHint":"اختر يومًا واحدًا على الأقل",
  "reading.select":  "اختر قراءة…",
  "reading.none":    "لا توجد قراءات بعد — اضغط «إضافة قراءة جديدة».",
  "reading.meta":    "أيام الدرس: {days}",
  "reading.studentsCount": "{n} طالب",
  "reading.deleteConfirm": "حذف هذه القراءة يمحو طلابها وسجلّ حضورهم ودرجاتهم نهائيًّا.",
  "reading.created": "أُنشئت القراءة ✓",
  "reading.updated": "حُدِّثت القراءة ✓",
  "reading.deleted": "حُذِفت القراءة ✓",

  "student.add":     "إضافة طالب",
  "student.edit":    "تعديل بيانات الطالب",
  "student.name":    "اسم الطالب",
  "student.father":  "اسم الأب",
  "student.guardian":"وليّ الأمر",
  "student.guardianName": "اسم وليّ الأمر",
  "student.relation":     "صلة القرابة",
  "student.relationFather":"الأب",
  "student.relationMother":"الأم",
  "student.phone":    "رقم الجوال",
  "student.searchPh": "ابحث عن طالب…",
  "student.none":     "لا يوجد طلاب بعد — استخدم زر «إضافة طالب».",
  "student.saved":    "حُفظ الطالب ✓",
  "student.updated":  "حُدِّثت بيانات الطالب ✓",
  "student.deleted":  "حُذِف الطالب ✓",
  "student.deleteConfirm": "سيُمحى سجلّ هذا الطالب كاملًا (الحضور والدرجات).",
  "student.duplicate": "يوجد طالب بهذا الاسم في هذه القراءة.",

  "stat.total":   "إجمالي الطلاب",
  "stat.present": "حاضرون اليوم",
  "stat.absent":  "غائبون اليوم",
  "stat.late":    "متأخرون",
  "stat.noBook":  "بلا كتاب",

  "att.status":   "الحالة",
  "att.minutes":  "دقائق التأخير",
  "att.book":     "الكتاب",
  "att.note":     "ملاحظات",
  "att.notePh":   "ملاحظة سريعة…",
  "att.notStudyDay": "اليوم المختار ليس من أيام دراسة هذه القراءة.",
  "att.autosave": "كل تغيير يُحفَظ تلقائيًّا فور حدوثه — لا حاجة لزر حفظ.",
  "att.btn.present": "حاضر",
  "att.btn.late":    "متأخر",
  "att.btn.absent":  "غائب",
  "att.btn.bookYes": "أحضره",
  "att.btn.bookNo":  "خالٍ",
  "att.unset":       "لم يُسجَّل",

  "grades.test.add":  "إضافة اختبار",
  "grades.test.edit": "تعديل الاختبار",
  "grades.test.title":"عنوان الاختبار",
  "grades.test.date": "التاريخ",
  "grades.test.max":  "الدرجة العظمى",
  "grades.hint":      "أضف الاختبارات — يُحسب المجموع والنسبة تلقائيًّا.",
  "grades.none":      "لا توجد اختبارات بعد.",
  "grades.colSum":    "المجموع",
  "grades.colPct":    "النسبة",
  "grades.saved":     "حُفظت الدرجة ✓",
  "grades.test.saved":   "حُفظ الاختبار ✓",
  "grades.test.updated": "حُدِّث الاختبار ✓",
  "grades.test.deleted": "حُذِف الاختبار ✓",
  "grades.test.deleteConfirm": "ستمحى درجات هذا الاختبار لجميع الطلاب.",
  "grades.needTest":  "أضف اختبارًا أولًا.",
  "grades.invalid":   "الدرجة المُدخلة أكبر من الدرجة العظمى.",

  "report.present":  "أيام الحضور",
  "report.absent":   "أيام الغياب",
  "report.lateMin":  "دقائق التأخير",
  "report.bookMiss": "أيام نسيان الكتاب",
  "report.grades":   "النسبة %",
  "report.send":     "الإرسال لوليّ الأمر",
  "report.prev":     "الأسبوع السابق",
  "report.next":     "الأسبوع التالي",
  "reports.none":    "أضف طلابًا لتظهر التقارير الأسبوعية.",
  "report.weekOf":   "الأسبوع: {a} — {b}",

  "msg.title":      "رسالة وليّ الأمر",
  "msg.hint":       "تُصاغ الرسالة بعربيةٍ فصيحةٍ راقية، جاهزة للإرسال عبر تليجرام أو الرسائل القصيرة أو أي تطبيق آخر.",
  "msg.telegram":   "تليجرام",
  "msg.sms":        "رسالة SMS",
  "msg.share":      "مشاركة",
  "msg.copy":       "نسخ",
  "msg.copied":     "نُسِخت الرسالة ✓",
  "msg.noPhone":    "رقم جوال وليّ الأمر غير مسجَّل.",
  "msg.telegramHint": "فُتح تليجرام — الرسالة جاهزة، اختر المحادثة وأرسِل.",
  "msg.smsHint":      "فُتح تطبيق الرسائل — الرسالة جاهزة للإرسال.",

  "users.assistants": "الحسابات المساعدة",
  "users.fullName":   "الاسم الكامل",
  "users.username":   "اسم المستخدم",
  "users.password":   "كلمة المرور",
  "users.addAssistant": "إضافة مساعد",
  "users.changePass":   "تغيير كلمة المرور",
  "users.currentPass":  "كلمة المرور الحالية",
  "users.newPass":      "كلمة المرور الجديدة",
  "users.save":         "حفظ",
  "users.backup":       "نسخة احتياطية",
  "users.backupHint":   "صدِّر بياناتك إلى ملف JSON وانقلها إلى أي جهاز آخر متى شئت.",
  "users.export":       "تصدير",
  "users.import":       "استيراد",
  "users.assistantAdded":   "أُنشئ حساب المساعد ✓",
  "users.assistantDeleted": "حُذِف حساب المساعد ✓",
  "users.usernameTaken": "اسم المستخدم مستخدَم مسبقًا.",
  "users.passChanged":   "غُيِّرت كلمة المرور ✓",
  "users.wrongPass":     "كلمة المرور الحالية غير صحيحة.",
  "users.deleteConfirm": "سيُحذَف هذا الحساب المساعد نهائيًّا.",
  "users.importDone":    "استُوردت البيانات بنجاح ✓",
  "users.importBad":     "ملف غير صالح — تعذّرت قراءة البيانات.",

  "install.title": "تثبيت التطبيق",
  "install.hint":  "ثبِّت التطبيق على جهازك ليعمل كتطبيق مستقل حتى دون اتصال.",

  "day.0": "الأحد",    "day.1": "الاثنين",  "day.2": "الثلاثاء",
  "day.3": "الأربعاء", "day.4": "الخميس",   "day.5": "الجمعة",
  "day.6": "السبت",

  "month.1":  "يناير",  "month.2":  "فبراير", "month.3":  "مارس",
  "month.4":  "أبريل",  "month.5":  "مايو",   "month.6":  "يونيو",
  "month.7":  "يوليو",  "month.8":  "أغسطس",  "month.9":  "سبتمبر",
  "month.10": "أكتوبر", "month.11": "نوفمبر", "month.12": "ديسمبر"
};

/* ═══════════════════════════════════════════════════════════════════════
   قوالب رسائل أولياء الأمور — عربيةٌ فصيحةٌ أدبية دائمًا
   (تُستعمل في app.js مع fillTpl)
   ═══════════════════════════════════════════════════════════════════════ */
const AR_MSG = {
  greeting:  "السلامُ عليكم ورحمةِ اللهِ وبركاته،",
  vocFather: "الوالدُ الكريمُ «{g}»،",
  vocMother: "الوالدةُ الكريمةُ «{g}»،",
  opener:    "حياكم اللهُ وبَيّاكم، وبعدُ؛",
  intro:     "فيسرُّنا أن نُهدِيَ إليكم خلاصةَ متابعةِ ابنِكم «{s}» في حلقةِ «{r}» خلالَ الأسبوعِ المنصرمِ ({range})، سائلينَ اللهَ أن يُثمِرَ اجتهادَه ويُنيرَ دربَه.",
  head:      "وكانَ من حاصلِ أيّامِه:",
  present:      "• أيّامُ حضورِه: {n} من أصلِ {t}.",
  absent:       "• أيّامُ غيابِه: {n} — وذلك يومَ: {d}.",
  absentNone:   "• أيّامُ غيابِه: لا شيءَ، فللَّهِ الحمدُ.",
  late:         "• مجموعُ تأخُّرِه: {n} دقيقة — وذلك يومَ: {d}.",
  lateNone:     "• تأخُّرُه: لم يتأخَّرْ قطُّ.",
  noBook:       "• وقد وردَ خاليَ اليدينَ من كتابِه يومَ: {d}.",
  bookAll:      "• ورافَقَه كتابُه في سائرِ أيّامِه.",
  gradesHead:   "أمَّا اختباراتُه:",
  gradeLine:    "◆ {t}: نالَ {s} من {m}.",
  gradesSum:    "فبلغَ مجموعُه {a} من {b}، بنسبةِ {p}٪.",
  praise:       "وللَّهِ الحمدُ، فقد أتمَّ أسبوعَه موصولَ الحضورِ مُصاحِبًا كتابَه، فحَقَّ له التهنئةُ والشكرُ.",
  encourage:    "ونرجو منكم — أكرمكم اللهُ — مُرافقتَه بالحثِّ والتوجيهِ؛ فإنَّ تعاونَ البيتِ والحلقةِ حبلُ النجاحِ الممتينُ.",
  closing:      "نسألُ اللهَ أن يجعلَه من أهلِ القرآنِ الذين هم أهلُ اللهِ وخاصَّتُه، وأن يُقرَّ عيونَكم بصلاحِه، وتقبَّلوا فائقَ الاحترامِ والتقديرِ،،",
  signature:    "مُعلِّمُ الحلقة"
};

/* ═══════════════════════════════════════════════════════════════════════
   الدوال المساعدة
   ═══════════════════════════════════════════════════════════════════════ */

/* تعبئة القوالب: fillTpl('مرحبا {a}', {a:'علي'}) → 'مرحبا علي' */
function fillTpl(tpl, vars){
  let s = String(tpl);
  if (vars){
    for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  }
  return s;
}

/* الترجمة مع متغيرات: t('report.weekOf', {a:'..', b:'..'}) */
function t(key, vars){
  const dict = I18N[CURRENT_LANG] || I18N.am;
  let s = dict[key];
  if (s === undefined) s = I18N.am[key];   /* الاحتياط: الأمهرية */
  if (s === undefined) return key;          /* ثم المفتاح نفسه   */
  return vars ? fillTpl(s, vars) : s;
}

/* اسم اليوم/الشهر بالفهرس (getDay: 0=الأحد / الشهر من 1 إلى 12) */
function tDay(i){ return t("day." + i); }
function tMonth(m){ return t("month." + m); }

/* قراءة تاريخ ISO بدون مشاكل المنطقة الزمنية */
function parseISO(iso){
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* تاريخ كامل منسَّق حسب اللغة الحالية (أو لغة مفروضة مثل 'ar' للرسائل) */
function fmtDate(iso, lang){
  if (!iso) return "";
  const L = lang || CURRENT_LANG;
  const d = parseISO(iso);
  const day = (I18N[L] || I18N.am)["day." + d.getDay()];
  const mon = (I18N[L] || I18N.am)["month." + (d.getMonth() + 1)];
  const n = d.getDate(), y = d.getFullYear();
  if (L === "ar") return day + " " + n + " " + mon + " " + y;
  if (L === "en") return day + ", " + mon + " " + n + ", " + y;
  return day + "፣ " + mon + " " + n + " " + y; /* الأمهرية */
}

/* تاريخ قصير: 5/3 */
function fmtShort(iso){
  if (!iso) return "";
  const d = parseISO(iso);
  return d.getDate() + "/" + (d.getMonth() + 1);
}

/* بداية الأسبوع (السبت) لتاريخ معطى — تُستعمل في التقارير */
function weekStartISO(iso){
  const d = parseISO(iso);
  const shift = (d.getDay() + 1) % 7; /* السبت=6 → 0 */
  d.setDate(d.getDate() - shift);
  return d.getFullYear() + "-" +
         String(d.getMonth() + 1).padStart(2, "0") + "-" +
         String(d.getDate()).padStart(2, "0");
}

/* ═══════════════════════════════════════════════════════════════════════
   تطبيق اللغة على الواجهة
   ═══════════════════════════════════════════════════════════════════════ */
let CURRENT_LANG = "am";
try { CURRENT_LANG = localStorage.getItem("ql_lang") || "am"; } catch(e){}

function applyTranslations(){
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const v = t(el.dataset.i18n);
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
}

function setLang(lang, opts){
  const o = opts || {};
  if (!I18N[lang]) lang = "am";
  CURRENT_LANG = lang;

  /* الحفظ والتوجّه */
  try { localStorage.setItem("ql_lang", lang); } catch(e){}
  document.documentElement.lang = lang;
  document.documentElement.dir = LANG_META[lang].dir;
  document.body.classList.remove("lang-am", "lang-en", "lang-ar");
  document.body.classList.add("lang-" + lang);
  document.title = t("app.title") + " · " + LANG_META[lang].name;

  applyTranslations();

  /* حالة الأزرار والقوائم */
  document.querySelectorAll("#loginLang .lang-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  const ls = document.getElementById("langSelect");
  if (ls) ls.value = lang;

  /* إبلاغ app.js كي يُعيد رسم الجداول الديناميكية */
  if (o.silent !== true){
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }
}

/* ── ربط أزرار تغيير اللغة (شاشة الدخول + الشريط العلوي) ── */
(function wireLangControls(){
  const loginLang = document.getElementById("loginLang");
  if (loginLang){
    loginLang.addEventListener("click", e => {
      const btn = e.target.closest(".lang-btn");
      if (btn && btn.dataset.lang) setLang(btn.dataset.lang);
    });
  }
  const ls = document.getElementById("langSelect");
  if (ls){
    ls.addEventListener("change", () => setLang(ls.value));
  }
})();

/* ── التهيئة الأولى: تطبيق اللغة المحفوظة دون إرسال حدث ── */
(function initLang(){
  if (!I18N[CURRENT_LANG]) CURRENT_LANG = "am";
  setLang(CURRENT_LANG, { silent: true });
})();
