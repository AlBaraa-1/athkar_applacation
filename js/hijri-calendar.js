// Hijri Calendar - Dynamic, Responsive, Mobile Friendly
// Uses Intl.DateTimeFormat for Hijri conversion (browser support required)

const hijriMonthNames = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

function getHijriDate(gregorianDate) {
  try {
    const formatter = new Intl.DateTimeFormat('ar-TN-u-ca-islamic', {
      day: 'numeric', month: 'numeric', year: 'numeric'
    });
    const parts = formatter.formatToParts(gregorianDate);
    const day = +parts.find(p => p.type === 'day').value;
    const month = +parts.find(p => p.type === 'month').value - 1;
    const year = +parts.find(p => p.type === 'year').value;
    return { day, month, year };
  } catch {
    return null;
  }
}

function renderHijriCalendar(year, month) {
  const container = document.getElementById('hijri-calendar-container');
  if (!container) return;

  // Calculate days in month and first weekday
  let daysInMonth = 30;
  for (let d = 29; d <= 30; d++) {
    const gDate = hijriToGregorian(year, month, d);
    const hijri = getHijriDate(gDate);
    if (hijri && hijri.month === month && hijri.day === d) daysInMonth = d;
  }
  const gFirst = hijriToGregorian(year, month, 1);
  let firstWeekday = gFirst.getDay();
  // Adjust for Arabic week start (Sunday)
  // If you want Saturday as first, use: firstWeekday = (firstWeekday + 6) % 7;

  // Header
  const today = new Date();
  const todayHijri = getHijriDate(today);
  let html = `<div class="hijri-calendar-header">
    <button class="hijri-calendar-nav-btn" id="hijri-prev-month" aria-label="الشهر السابق">&#8592;</button>
    <span class="font-bold text-lg">${hijriMonthNames[month]} ${year} هـ</span>
    <button class="hijri-calendar-nav-btn" id="hijri-today-btn">اليوم</button>
    <button class="hijri-calendar-nav-btn" id="hijri-next-month" aria-label="الشهر التالي">&#8594;</button>
  </div>`;

  // Table
  html += '<div class="hijri-calendar-table-wrapper"><table class="hijri-calendar-table"><thead><tr>';
  const weekdays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  for (let w of weekdays) html += `<th>${w}</th>`;
  html += '</tr></thead><tbody>';

  // Important Hijri dates (month, day): Ramadan 1, Eid al-Fitr 1/10, Eid al-Adha 10/12, Ashura 10/1
  const importantDates = [
    { month: 8, day: 1, label: 'رمضان', class: 'hijri-ramadan' },
    { month: 9, day: 1, label: 'عيد الفطر', class: 'hijri-eid-fitr' },
    { month: 11, day: 10, label: 'عيد الأضحى', class: 'hijri-eid-adha' },
    { month: 0, day: 10, label: 'عاشوراء', class: 'hijri-ashura' }
  ];

  let day = 1;
  // Calculate total rows needed (always 5 or 6 for full grid)
  let totalCells = firstWeekday + daysInMonth;
  let totalRows = Math.ceil(totalCells / 7);
  for (let row = 0; row < totalRows; row++) {
    html += '<tr>';
    for (let col = 0; col < 7; col++) {
      let cellNum = row * 7 + col;
      let cellDay = cellNum - firstWeekday + 1;
      if (cellNum < firstWeekday || cellDay > daysInMonth) {
        html += '<td></td>';
      } else {
        const isToday = todayHijri && todayHijri.day === cellDay && todayHijri.month === month && todayHijri.year === year;
        const imp = importantDates.find(d => d.month === month && d.day === cellDay);
        let cellClass = isToday ? 'today' : '';
        if (imp) cellClass += ' ' + imp.class;
        let label = cellDay;
        if (imp) label += `<span class='hijri-imp-label'>${imp.label}</span>`;
        html += `<td class="${cellClass.trim()}">${label}</td>`;
      }
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  container.innerHTML = html;

  // Navigation
  document.getElementById('hijri-prev-month').onclick = () => {
    let m = month - 1, y = year;
    if (m < 0) { m = 11; y--; }
    renderHijriCalendar(y, m);
  };
  document.getElementById('hijri-next-month').onclick = () => {
    let m = month + 1, y = year;
    if (m > 11) { m = 0; y++; }
    renderHijriCalendar(y, m);
  };
  document.getElementById('hijri-today-btn').onclick = () => {
    const today = new Date();
    const hijri = getHijriDate(today);
    if (hijri) renderHijriCalendar(hijri.year, hijri.month);
  };
}

// Approximate conversion: Hijri to Gregorian (for calendar rendering)
function hijriToGregorian(hYear, hMonth, hDay) {
  // Umm al-Qura calendar is not available in browser, so use a simple approximation
  // This is not 100% accurate but good for calendar display
  const hijriEpoch = 1948439.5; // Julian day for 1 Muharram 1 AH
  const days = Math.round((hYear - 1) * 354.367 + hMonth * 29.5 + (hDay - 1));
  const julian = hijriEpoch + days;
  // Julian to Gregorian
  let j = julian + 0.5;
  let z = Math.floor(j);
  let f = j - z;
  let A = z;
  if (z >= 2299161) {
    let alpha = Math.floor((z - 1867216.25) / 36524.25);
    A += 1 + alpha - Math.floor(alpha / 4);
  }
  let B = A + 1524;
  let C = Math.floor((B - 122.1) / 365.25);
  let D = Math.floor(365.25 * C);
  let E = Math.floor((B - D) / 30.6001);
  let day = B - D - Math.floor(30.6001 * E) + f;
  let month = (E < 14) ? E - 1 : E - 13;
  let year = (month > 2) ? C - 4716 : C - 4715;
  return new Date(year, month - 1, Math.floor(day));
}

// On DOMContentLoaded, render current month
window.addEventListener('DOMContentLoaded', function() {
  const today = new Date();
  const hijri = getHijriDate(today);
  if (hijri) renderHijriCalendar(hijri.year, hijri.month);
});
