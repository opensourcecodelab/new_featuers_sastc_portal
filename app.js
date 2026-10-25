/**
 * Main Controller (Floating Rounded Navbar & Department Selector Engine)
 */

import { loadCachedData, fetchLiveData } from './api.js';
import { 
  indexDataset, 
  detectDeptCode, 
  isResultNotice, 
  getDeptIcon, 
  getFilteredNotices 
} from './filter.js';
import { 
  escapeHTML,
  escapeJS, 
  formatPdfUrl, 
  closePdfModal, 
  copyLink,
  shareLink,
  handleNoticeClick, 
  handlePdfView, 
  debounce,
  initSecurityProtections,
  showToast,
  getTagInfo,
  formatDateString,
  extractGoogleDriveFileId,
  isGoogleDriveFolderUrl,
  resolveThumbnailUrl,
  getEmbedPreviewUrl,
  downloadPdfDirect
} from './utils.js';
import { initCalculator } from './calculator.js';
import * as cseExamMod from './CSE-Exam.js';
import * as agExamMod from './AG-EXAM.js';
import * as bbaExamMod from './BBA-Exam.js';
import * as sharedByMod from './shared-by.js';

const cseExamData = cseExamMod.cseExamData || cseExamMod.default || {};
const agExamData = agExamMod.agExamData || agExamMod.default || {};
const bbaExamData = bbaExamMod.bbaExamData || bbaExamMod.default || {};
const sharedByData = sharedByMod.sharedByData || sharedByMod.default || [];

window.handleNoticeClick = handleNoticeClick;
window.handlePdfView = handlePdfView;
window.copyLink = copyLink;
window.shareLink = shareLink;

// Storage Keys
const LS_ACTIVE_DEPT = "sastc_active_dept";
const LS_DEPT_PREF = "sastc_dept_preference";
const LS_EXAM_LEVEL = "sastc_exam_level";
const LS_EXAM_SEM = "sastc_exam_semester";
const LS_EXAM_DATA_CACHE = "sastc_exam_data_cache";
const LS_EXAM_DIV_CACHE = "sastc_exam_div_cache";
const LS_SEEN_NOTICES_COUNT = "sastc_seen_notices_count";
const LS_SEEN_RESULTS_COUNT = "sastc_seen_results_count";

// State variables
const savedDeptPref = localStorage.getItem(LS_DEPT_PREF);
let deptPreference = savedDeptPref || "CSE";
let activeDept = localStorage.getItem(LS_ACTIVE_DEPT) || deptPreference;
let examLevel = localStorage.getItem(LS_EXAM_LEVEL) || "1";
let examSemester = localStorage.getItem(LS_EXAM_SEM) || "1";
let activeTab = "home";

let noticesData = [];
let resultsData = [];
let masterDataset = [];
let deferredPrompt = null;

// DOM Element Handles
let noticeSearchInput, noticeClearBtn, resultSearchInput, resultClearBtn, noticeList, resultList;
let noticeSearchQuery = "";
let resultSearchQuery = "";

const PAGE_SIZE = 25;
let noticeVisibleCount = PAGE_SIZE;
let resultVisibleCount = PAGE_SIZE;
const tabScrollPositions = { home: 0, notice: 0, result: 0, resources: 0, calculator: 0, settings: 0 };

let sastcNoticesCache = null;
let sastcNoticesLoading = false;

// Resources Section State
const RESOURCE_CATEGORIES = [
  "All",
  "Question Bank",
  "Lecture Notes",
  "Reference Books",
  "Lab Materials",
  "Previous Questions",
  "More"
];
const deptResourcesCache = {};
let activeResourceDept = "CSE";
let resLevel = examLevel || "1";
let resSemester = examSemester || "1";
let resAllSemesters = false;
let resActiveCategory = "All";
let resActiveCourse = "ALL";
let resourceSearchQuery = "";
let currentDeptResources = [];
let filteredResourcesList = [];
let activeModalResource = null;
let autocompleteHighlightIdx = -1;
let resCustomLevelSem = false;
let resLeaderboardTimer = null;
let resLeaderboardCountdownInterval = null;
let resLeaderboardCanClose = false;

document.addEventListener("DOMContentLoaded", () => {
  noticeSearchInput = document.getElementById("noticeSearchInput");
  noticeClearBtn = document.getElementById("noticeClearBtn");
  resultSearchInput = document.getElementById("resultSearchInput");
  resultClearBtn = document.getElementById("resultClearBtn");
  noticeList = document.getElementById("noticeList");
  resultList = document.getElementById("resultList");

  // Clean up any legacy notification flag
  localStorage.removeItem("sastc_notifications_enabled");

  initDeptPreference();
  initFirstVisitDeptPopup();
  initApiKeysManagement();

  // Migrate old storage keys to new format to prevent sudden large badge numbers
  if (localStorage.getItem(LS_SEEN_NOTICES_COUNT)) {
    localStorage.setItem("seen_notices_ALL", localStorage.getItem(LS_SEEN_NOTICES_COUNT));
    localStorage.removeItem(LS_SEEN_NOTICES_COUNT);
  }
  if (localStorage.getItem(LS_SEEN_RESULTS_COUNT)) {
    localStorage.setItem("seen_results_ALL", localStorage.getItem(LS_SEEN_RESULTS_COUNT));
    localStorage.removeItem(LS_SEEN_RESULTS_COUNT);
  }

  const cached = loadCachedData();
  noticesData = cached.noticesData;
  resultsData = cached.resultsData;

  rebuildMasterDataset();
  initSecurityProtections();
  initEventListeners();
  initSearchControls();
  initNavTabs();
  initPwaInstall();
  initCalculator();
  initResourcesSection();
  updateHeaderDeptPill();

  renderAllViews();

  // Background Live Sync (without browser notifications)
  syncLiveNotices(false);

  // Register Service Worker for instant repeat load & offline support
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
});

function syncLiveNotices(isManual = false) {
  const syncBtn = document.getElementById("headerSyncBtn");
  if (syncBtn && isManual) syncBtn.classList.add("spinning");

  return fetchLiveData().then(live => {
    let hasUpdates = false;
    if (live.noticesData && live.noticesData.length > 0) {
      if (live.noticesData.length !== noticesData.length || isManual) {
        noticesData = live.noticesData;
        hasUpdates = true;
      }
    }
    if (live.resultsData && live.resultsData.length > 0) {
      if (live.resultsData.length !== resultsData.length || isManual) {
        resultsData = live.resultsData;
        hasUpdates = true;
      }
    }
    if (hasUpdates) {
      rebuildMasterDataset();
      renderAllViews();
      updateBadges();
    }
    if (isManual) {
      showToast("Portal synced with latest updates");
    }
  }).finally(() => {
    if (syncBtn && isManual) {
      setTimeout(() => syncBtn.classList.remove("spinning"), 300);
    }
  });
}

function updateHeaderDeptPill() {
  const headerDeptText = document.getElementById("headerDeptText");
  if (headerDeptText) {
    headerDeptText.textContent = deptPreference;
  }
}

/**
 * Mandatory First-Visit Department Selection Popup
 */
function initFirstVisitDeptPopup() {
  const existingPref = localStorage.getItem(LS_DEPT_PREF);
  if (existingPref && ["CSE", "AG", "BBA"].includes(existingPref)) {
    return;
  }

  const modal = document.getElementById("deptOnboardingModal");
  const optionBtns = document.querySelectorAll("#deptOnboardingOptions .dept-option-btn");
  const confirmBtn = document.getElementById("confirmDeptBtn");
  if (!modal || !confirmBtn) return;

  let selectedDept = null;
  modal.classList.add("active");

  optionBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      triggerHaptic();
      selectedDept = btn.getAttribute("data-dept");
      optionBtns.forEach(b => {
        const isMatch = b === btn;
        b.classList.toggle("selected", isMatch);
        const checkIcon = b.querySelector(".dept-opt-check");
        if (checkIcon) {
          checkIcon.className = isMatch
            ? "fa-solid fa-circle-check dept-opt-check"
            : "fa-regular fa-circle dept-opt-check";
        }
      });
      confirmBtn.disabled = !selectedDept;
    });
  });

  confirmBtn.addEventListener("click", () => {
    if (!selectedDept) return;
    triggerHaptic();

    deptPreference = selectedDept;
    activeDept = selectedDept;
    localStorage.setItem(LS_DEPT_PREF, deptPreference);
    localStorage.setItem(LS_ACTIVE_DEPT, activeDept);

    const selectEl = document.getElementById("deptPreferenceSelect");
    if (selectEl) {
      selectEl.value = deptPreference;
    }

    modal.classList.remove("active");
    updateHeaderDeptPill();
    window.dispatchEvent(new Event("sastc_dept_changed"));
    renderAllViews();
    updateBadges();
    showToast(`Department set to ${deptPreference}`);
  });
}

function initApiKeysManagement() {
  const inputEl = document.getElementById("newApiKeyInput");
  const addBtn = document.getElementById("addApiKeyBtn");
  const listEl = document.getElementById("apiKeyList");
  const emptyMsg = document.getElementById("emptyApiKeyMsg");

  if (!inputEl || !addBtn || !listEl) return;

  let apiKeys = JSON.parse(localStorage.getItem("geminiApiKeys")) || [];

  function renderKeys() {
    if (apiKeys.length === 0) {
      if (emptyMsg) emptyMsg.style.display = "block";
      listEl.innerHTML = '';
      if (emptyMsg) listEl.appendChild(emptyMsg);
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";
    listEl.innerHTML = '';

    apiKeys.forEach((key, index) => {
      const maskedKey = key.substring(0, 8) + "..." + key.substring(key.length - 4);
      const div = document.createElement("div");
      div.className = "flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-[#85bdf0]";
      div.innerHTML = `
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-key text-gray-400"></i>
          <span class="font-mono text-sm text-gray-700">${maskedKey}</span>
        </div>
        <button class="text-red-400 hover:text-red-600 delete-key-btn p-1 transition-colors" data-idx="${index}" title="Delete Key">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      listEl.appendChild(div);
    });

    listEl.querySelectorAll('.delete-key-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-idx');
        apiKeys.splice(idx, 1);
        localStorage.setItem("geminiApiKeys", JSON.stringify(apiKeys));
        renderKeys();
        showToast("API key removed");
      });
    });
  }

  addBtn.addEventListener("click", () => {
    const newKey = inputEl.value.trim();
    if (!newKey) {
      showToast("Please enter an API key");
      return;
    }
    
    if (apiKeys.includes(newKey)) {
      showToast("Key already exists");
      return;
    }

    apiKeys.push(newKey);
    localStorage.setItem("geminiApiKeys", JSON.stringify(apiKeys));
    inputEl.value = "";
    renderKeys();
    showToast("API key added successfully");
  });

  renderKeys();
}

function getFilteredNoticesSet() {
  let filtered = masterDataset.filter(item => !item._isResult);
  if (deptPreference !== "ALL") {
    filtered = filtered.filter(item => item._deptCode === deptPreference);
  }
  return filtered;
}

function getFilteredResultsSet() {
  let results = masterDataset.filter(item => {
    if (!item._isResult) return false;
    const text = `${item.title || ''} ${item.department || ''} ${item.category || ''}`.toUpperCase();
    return /\bSASTC\b/i.test(text);
  });
  if (deptPreference !== "ALL") {
    results = results.filter(item => {
      const text = `${item.title || ''} ${item.department || ''} ${item.category || ''}`.toUpperCase();
      return new RegExp(`\\b${deptPreference}\\b`, "i").test(text);
    });
  }
  return results;
}

function updateBadges() {
  const seenNoticesKey = `seen_notices_${deptPreference}`;
  const seenResultsKey = `seen_results_${deptPreference}`;
  
  const seenNotices = parseInt(localStorage.getItem(seenNoticesKey) || 0);
  const seenResults = parseInt(localStorage.getItem(seenResultsKey) || 0);
  
  const noticesSet = getFilteredNoticesSet();
  const resultsSet = getFilteredResultsSet();

  const newNotices = Math.max(0, noticesSet.length - seenNotices);
  const newResults = Math.max(0, resultsSet.length - seenResults);

  const noticeBadge = document.getElementById("navNoticeBadge");
  const resultBadge = document.getElementById("navResultBadge");

  if (noticeBadge) {
    noticeBadge.textContent = newNotices;
    noticeBadge.style.display = newNotices > 0 ? "inline-block" : "none";
  }
  if (resultBadge) {
    resultBadge.textContent = newResults;
    resultBadge.style.display = newResults > 0 ? "inline-block" : "none";
  }
}

function rebuildMasterDataset() {
  masterDataset = indexDataset(noticesData, resultsData);
  updateBadges();
}

/**
 * Setup Department Selector
 */
function initDeptPreference() {
  const selectEl = document.getElementById("deptPreferenceSelect");
  if (selectEl) {
    selectEl.value = deptPreference;
    selectEl.addEventListener("change", (e) => {
      deptPreference = e.target.value;
      localStorage.setItem(LS_DEPT_PREF, deptPreference);

      if (deptPreference !== "ALL") {
        activeDept = deptPreference;
        localStorage.setItem(LS_ACTIVE_DEPT, activeDept);
      }

      // If we are currently viewing the notice or result tab, mark the newly filtered items as read
      const seenNoticesKey = `seen_notices_${deptPreference}`;
      const seenResultsKey = `seen_results_${deptPreference}`;
      
      if (activeTab === "notice") {
        localStorage.setItem(seenNoticesKey, getFilteredNoticesSet().length);
      } else if (activeTab === "result") {
        localStorage.setItem(seenResultsKey, getFilteredResultsSet().length);
      }

      noticeVisibleCount = PAGE_SIZE;
      resultVisibleCount = PAGE_SIZE;
      updateHeaderDeptPill();
      window.dispatchEvent(new Event('sastc_dept_changed'));
      renderAllViews();
      updateBadges();
      showToast(`Filter set to ${deptPreference}`);
    });
  }
}

/**
 * Instant Debounced Search Controls for Notice & Result Views
 */
function initSearchControls() {
  if (noticeSearchInput) {
    const onNoticeSearch = debounce((val) => {
      noticeSearchQuery = val.trim();
      noticeVisibleCount = PAGE_SIZE;
      renderNotices();
    }, 120);

    noticeSearchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (noticeClearBtn) noticeClearBtn.style.display = val.length > 0 ? "block" : "none";
      onNoticeSearch(val);
    });
  }

  if (noticeClearBtn) {
    noticeClearBtn.addEventListener("click", () => {
      if (noticeSearchInput) noticeSearchInput.value = "";
      noticeClearBtn.style.display = "none";
      noticeSearchQuery = "";
      noticeVisibleCount = PAGE_SIZE;
      renderNotices();
    });
  }

  if (resultSearchInput) {
    const onResultSearch = debounce((val) => {
      resultSearchQuery = val.trim();
      resultVisibleCount = PAGE_SIZE;
      renderResultsView();
    }, 120);

    resultSearchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (resultClearBtn) resultClearBtn.style.display = val.length > 0 ? "block" : "none";
      onResultSearch(val);
    });
  }

  if (resultClearBtn) {
    resultClearBtn.addEventListener("click", () => {
      if (resultSearchInput) resultSearchInput.value = "";
      resultClearBtn.style.display = "none";
      resultSearchQuery = "";
      resultVisibleCount = PAGE_SIZE;
      renderResultsView();
    });
  }
}

/**
 * Navigation Bar (Home, Notice, Result, Settings)
 */
function initNavTabs() {
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      triggerHaptic();
      const tab = item.getAttribute("data-tab");
      if (tab) switchTab(tab);
    });
  });
}

function triggerHaptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

function switchTab(tabName) {
  if (activeTab === tabName) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // Save current tab scroll position
  tabScrollPositions[activeTab] = window.scrollY;
  activeTab = tabName;

  const seenNoticesKey = `seen_notices_${deptPreference}`;
  const seenResultsKey = `seen_results_${deptPreference}`;

  if (tabName === "notice") {
    const noticesSet = getFilteredNoticesSet();
    localStorage.setItem(seenNoticesKey, noticesSet.length);
    updateBadges();
  } else if (tabName === "result") {
    const resultsSet = getFilteredResultsSet();
    localStorage.setItem(seenResultsKey, resultsSet.length);
    updateBadges();
  } else if (tabName === "resources") {
    // Apply Home page's Level & Semester by default unless customized inside Resources
    if (!resCustomLevelSem && !resAllSemesters) {
      resLevel = normalizeLevelValue(examLevel || "1");
      resSemester = normalizeSemesterValue(examSemester || "1");
      updateResourceSelectorUI();
      renderResourcesView({ resetScroll: false });
    }
    // Automatically open Full-Screen Leaderboard Popup with 3s delayed Close button
    openResourcesLeaderboard({ delayedClose: true });
  }

  document.querySelectorAll(".bottom-nav .nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
  });

  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.toggle("active", view.id === `view-${tabName}`);
  });

  // Restore scroll position instantly without re-rendering DOM unnecessarily
  window.scrollTo({ top: tabScrollPositions[tabName] || 0, behavior: "instant" });
}

function renderAllViews() {
  renderHomeView();
  renderNotices();
  renderResultsView();
  syncResourcesWithPortalContext();
}

/**
 * Home View Rendering
 */
function renderExamDatesWidget() {
  const examSemesterLabel = document.getElementById("examSemesterLabel");
  const examSemesterText = document.getElementById("examSemesterText");
  const examSemPopover = document.getElementById("examSemPopover");
  const homeExamLevelSelect = document.getElementById("homeExamLevelSelect");
  const homeExamSemSelect = document.getElementById("homeExamSemSelect");
  const saveExamSemBtn = document.getElementById("saveExamSemBtn");
  const examCardsList = document.getElementById("examCardsList");
  const examScrollNextBtn = document.getElementById("examScrollNextBtn");
  const examTodayChip = document.getElementById("examTodayChip");
  const examInfoSummary = document.getElementById("examInfoSummary");

  if (!examCardsList) return;

  // Bind Level/Semester popover events once
  if (examSemesterLabel && examSemPopover && !examSemesterLabel.dataset.bound) {
    examSemesterLabel.dataset.bound = "true";

    examSemesterLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerHaptic();
      if (homeExamLevelSelect) homeExamLevelSelect.value = examLevel;
      if (homeExamSemSelect) homeExamSemSelect.value = examSemester;
      const isOpen = examSemPopover.classList.toggle("active");
      examSemesterLabel.classList.toggle("open", isOpen);
    });

    if (saveExamSemBtn) {
      saveExamSemBtn.addEventListener("click", () => {
        triggerHaptic();
        if (homeExamLevelSelect) examLevel = homeExamLevelSelect.value;
        if (homeExamSemSelect) examSemester = homeExamSemSelect.value;
        localStorage.setItem(LS_EXAM_LEVEL, examLevel);
        localStorage.setItem(LS_EXAM_SEM, examSemester);
        resLevel = normalizeLevelValue(examLevel);
        resSemester = normalizeSemesterValue(examSemester);
        resCustomLevelSem = false;
        resAllSemesters = false;
        examSemPopover.classList.remove("active");
        examSemesterLabel.classList.remove("open");
        renderExamDatesWidget();
        syncResourcesWithPortalContext();
        showToast(`Saved Level ${examLevel} Semester ${examSemester}`);
      });
    }
  }

  // Bind horizontal scroll button once with auto-hide behavior
  const updateScrollBtnVisibility = () => {
    if (!examScrollNextBtn || !examCardsList) return;
    const maxScroll = examCardsList.scrollWidth - examCardsList.clientWidth;
    if (maxScroll <= 6 || examCardsList.scrollLeft >= maxScroll - 8) {
      examScrollNextBtn.classList.add("auto-hidden");
      examScrollNextBtn.classList.remove("visible");
    } else {
      examScrollNextBtn.classList.remove("auto-hidden");
      examScrollNextBtn.classList.add("visible");
      clearTimeout(examScrollNextBtn._hideTimer);
      examScrollNextBtn._hideTimer = setTimeout(() => {
        examScrollNextBtn.classList.remove("visible");
      }, 2200);
    }
  };

  if (examScrollNextBtn && !examScrollNextBtn.dataset.bound) {
    examScrollNextBtn.dataset.bound = "true";
    examScrollNextBtn.addEventListener("click", () => {
      triggerHaptic();
      const maxScroll = examCardsList.scrollWidth - examCardsList.clientWidth;
      if (examCardsList.scrollLeft >= maxScroll - 10) {
        examCardsList.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        examCardsList.scrollBy({ left: 130, behavior: "smooth" });
      }
      setTimeout(updateScrollBtnVisibility, 320);
    });

    examCardsList.addEventListener("scroll", updateScrollBtnVisibility, { passive: true });
    examCardsList.addEventListener("touchstart", updateScrollBtnVisibility, { passive: true });
  }

  // Update Level & Semester label
  if (examSemesterText) {
    examSemesterText.textContent = `LEVEL ${examLevel} SEMESTER ${examSemester}`;
  }

  // Real Today's Date (normalized to local midnight for accurate day comparison)
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const todayFormatted = `${String(now.getDate()).padStart(2, "0")} ${monthsShort[now.getMonth()]}`;
  if (examTodayChip) {
    examTodayChip.textContent = todayFormatted;
  }

  // Pick department exam schedule (with localStorage offline persistence)
  let deptMap = {
    CSE: cseExamData,
    AG: agExamData,
    BBA: bbaExamData
  };

  try {
    if (cseExamData && agExamData && bbaExamData) {
      localStorage.setItem(LS_EXAM_DATA_CACHE, JSON.stringify(deptMap));
    } else {
      const cachedDeptMap = JSON.parse(localStorage.getItem(LS_EXAM_DATA_CACHE) || "null");
      if (cachedDeptMap) deptMap = cachedDeptMap;
    }
  } catch (e) {
    try {
      const cachedDeptMap = JSON.parse(localStorage.getItem(LS_EXAM_DATA_CACHE) || "null");
      if (cachedDeptMap) deptMap = cachedDeptMap;
    } catch (_) {}
  }

  const currentDept = ["CSE", "AG", "BBA"].includes(deptPreference) ? deptPreference : "CSE";
  const deptSchedule = deptMap[currentDept] || deptMap.CSE || {};
  const rawExams = (deptSchedule[examLevel] && deptSchedule[examLevel][examSemester]) || [];

  // Pre-hydrate from cached Exam Dates div in localStorage if offline & data is missing
  if (!navigator.onLine && Object.keys(deptSchedule).length === 0) {
    try {
      const savedDivState = JSON.parse(localStorage.getItem(LS_EXAM_DIV_CACHE) || "null");
      if (savedDivState) {
        if (examSemesterText && savedDivState.semesterText) examSemesterText.textContent = savedDivState.semesterText;
        if (examTodayChip && savedDivState.todayText) examTodayChip.textContent = savedDivState.todayText;
        if (examCardsList && savedDivState.cardsHtml) examCardsList.innerHTML = savedDivState.cardsHtml;
        if (examInfoSummary && savedDivState.marqueeHtml) examInfoSummary.innerHTML = savedDivState.marqueeHtml;
        return;
      }
    } catch (_) {}
  }

  // Helper to parse exam date + time into exact day midnight & exact exam cutoff timestamp
  const parseExamTimings = (ex) => {
    const parts = String(ex.date || "").split("-").map(Number);
    const dayMidnight = parts.length === 3
      ? new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
      : new Date(ex.date);
    dayMidnight.setHours(0, 0, 0, 0);

    // Default to 10:00 AM if time string is missing
    let hours = 10;
    let minutes = 0;
    const timeStr = String(ex.time || "10:00 AM").trim();
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const period = (match[3] || "").toUpperCase();
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
    }

    // Exam is valid through the end of its scheduled minute (e.g. 12:30:59.999 PM); at 12:31:00 PM it hides
    const examCutoffDate = new Date(
      dayMidnight.getFullYear(),
      dayMidnight.getMonth(),
      dayMidnight.getDate(),
      hours,
      minutes,
      59,
      999
    );

    return {
      ...ex,
      _dateObj: dayMidnight,
      _dayMidnightMs: dayMidnight.getTime(),
      _cutoffMs: examCutoffDate.getTime()
    };
  };

  // Build marquee summary across all Levels (1-4) and Semesters (1-2) of the selected department
  const marqueeEntries = [];
  const levels = ["1", "2", "3", "4"];
  const sems = ["1", "2"];
  const nowMs = now.getTime();

  levels.forEach(lvl => {
    sems.forEach(sm => {
      const list = (deptSchedule[lvl] && deptSchedule[lvl][sm]) || [];
      const upcomingForSem = list
        .map(parseExamTimings)
        .filter(ex => !isNaN(ex._cutoffMs) && ex._cutoffMs >= nowMs)
        .sort((a, b) => a._cutoffMs - b._cutoffMs);

      if (upcomingForSem.length > 0) {
        const nextEx = upcomingForSem[0];
        const dStr = `${String(nextEx._dateObj.getDate()).padStart(2, "0")} ${monthsShort[nextEx._dateObj.getMonth()]}`;
        const colorKey = `l${lvl}s${sm}`;
        marqueeEntries.push(
          `<span class="marquee-sem-pill ${colorKey}">L${lvl} S${sm} - ${escapeHTML(dStr)} [${escapeHTML(nextEx.code)}]</span>`
        );
      }
    });
  });

  if (examInfoSummary) {
    if (marqueeEntries.length > 0) {
      const joinedHtml = marqueeEntries.join("");
      examInfoSummary.innerHTML = `
        <span class="exam-marquee-track">
          <span class="exam-marquee-group">${joinedHtml}</span>
          <span class="exam-marquee-group" aria-hidden="true">${joinedHtml}</span>
        </span>
      `;
    } else {
      examInfoSummary.textContent = `No published upcoming exams for ${currentDept}`;
    }
  }

  // Parse, filter out finished exams (whose exact scheduled time has passed), and sort ascending
  const parsedExams = rawExams
    .map(parseExamTimings)
    .filter(ex => !isNaN(ex._cutoffMs) && ex._cutoffMs >= nowMs)
    .sort((a, b) => a._cutoffMs - b._cutoffMs);

  if (parsedExams.length === 0) {
    examCardsList.innerHTML = `<div class="state-box" style="width:100%; padding:14px;"><span>No upcoming exams for ${currentDept} Level ${examLevel} Semester ${examSemester}.</span></div>`;
  } else {
    const cardsHtml = parsedExams.map((exam, idx) => {
      const d = exam._dateObj;
      const dateNumStr = `${String(d.getDate()).padStart(2, "0")} ${monthsShort[d.getMonth()]}`;
      const dayNameStr = daysShort[d.getDay()];
      const diffFromTodayDays = Math.round((exam._dayMidnightMs - todayMidnight.getTime()) / 86400000);

      // Status badge logic based on real date (first remaining exam is NEXT EXAM / TODAY)
      let statusTagHtml = "";
      let cardStateClass = "";

      if (idx === 0) {
        cardStateClass = "is-next";
        const badgeLabel = diffFromTodayDays === 0 ? "TODAY" : "NEXT EXAM";
        statusTagHtml = `<div class="exam-status-tag next"><span class="dot"></span> ${badgeLabel}</div>`;
      } else {
        statusTagHtml = `<div class="exam-status-tag upcoming">UPCOMING</div>`;
      }

      // Gap calculation based on real dates
      let gapText = "GAP: --";
      let gapClass = "neutral";

      if (idx === 0) {
        if (diffFromTodayDays === 0) {
          gapText = "Today";
          gapClass = "neutral";
        } else if (diffFromTodayDays === 1) {
          gapText = "Tomorrow";
          gapClass = "neutral";
        } else if (diffFromTodayDays > 1) {
          gapText = `In ${diffFromTodayDays} Days`;
          gapClass = "neutral";
        } else {
          gapText = "Today";
          gapClass = "neutral";
        }
      } else {
        const prevExam = parsedExams[idx - 1];
        const diffBetweenExams = Math.round((exam._dayMidnightMs - prevExam._dayMidnightMs) / 86400000);
        const prepGap = diffBetweenExams > 1 ? diffBetweenExams - 1 : diffBetweenExams;
        gapText = `GAP: ${prepGap} ${prepGap === 1 ? "Day" : "Days"}`;
        gapClass = "teal";
      }

      return `
        <div class="exam-slot-card ${cardStateClass}">
          ${statusTagHtml}
          <div class="exam-date-num">${escapeHTML(dateNumStr)}</div>
          <div class="exam-date-day">${escapeHTML(dayNameStr)}</div>
          <div class="exam-divider"></div>
          <div class="exam-course-code">${escapeHTML(exam.code)}</div>
          <div class="exam-meta-list">
            <div class="exam-meta-item"><i class="fa-regular fa-clock"></i> <span>${escapeHTML(exam.time || "10:00 AM")}</span></div>
          </div>
          <div class="exam-gap-pill ${gapClass}">${escapeHTML(gapText)}</div>
        </div>
      `;
    }).join("");

    examCardsList.innerHTML = cardsHtml;
  }

  // Schedule automatic re-check every 30 seconds so exams hide immediately when their minute passes
  if (!window._examAutoRefreshTimer) {
    window._examAutoRefreshTimer = setInterval(() => {
      renderExamDatesWidget();
    }, 30000);
  }

  requestAnimationFrame(updateScrollBtnVisibility);

  // Save rendered Exam Dates div state in localStorage for offline access
  try {
    localStorage.setItem(LS_EXAM_DIV_CACHE, JSON.stringify({
      dept: currentDept,
      level: examLevel,
      semester: examSemester,
      semesterText: examSemesterText ? examSemesterText.textContent : "",
      todayText: examTodayChip ? examTodayChip.textContent : "",
      cardsHtml: examCardsList.innerHTML,
      marqueeHtml: examInfoSummary ? examInfoSummary.innerHTML : "",
      savedAt: Date.now()
    }));
  } catch (_) {}
}

function renderHomeView() {
  renderExamDatesWidget();

  // Fetch and Render SASTC Notices (cached in memory for fast switching)
  const sastcNoticeList = document.getElementById("sastcNoticeList");
  if (sastcNoticeList) {
    if (sastcNoticesCache) {
      renderSastcNoticeItems(sastcNoticeList, sastcNoticesCache);
    } else if (!sastcNoticesLoading) {
      sastcNoticesLoading = true;
      fetch("./sastc-notices.json")
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then(data => {
          sastcNoticesCache = Array.isArray(data) ? data : [];
          sastcNoticesLoading = false;
          renderSastcNoticeItems(sastcNoticeList, sastcNoticesCache);
        })
        .catch(() => {
          sastcNoticesLoading = false;
          sastcNoticeList.innerHTML = `
            <div class="state-box">
              <i class="fa-solid fa-circle-exclamation" style="color:var(--accent-red)"></i>
              <span>Could not load SASTC notices.</span>
            </div>
          `;
        });
    }
  }
}

function renderSastcNoticeItems(container, data) {
  let filteredSastc = data;

  if (deptPreference !== "ALL") {
    filteredSastc = data.filter(item => {
      const code = item.deptCode || "SASTC";
      return code === deptPreference || code === "SASTC";
    });
  }

  if (!filteredSastc || filteredSastc.length === 0) {
    container.innerHTML = `
      <div class="state-box">
        <i class="fa-regular fa-folder-open"></i>
        <span>No SASTC notices found for ${deptPreference !== "ALL" ? deptPreference : "any department"}.</span>
      </div>
    `;
    return;
  }

  const sorted = [...filteredSastc].sort((a, b) => new Date(b.date) - new Date(a.date));
  container.innerHTML = sorted.map(item => createCardHTML(item, { hideCopy: true })).join("");
}

/**
 * Render Notices (Strictly filtered & paginated for instant DOM performance)
 */
function renderNotices() {
  if (!noticeList) return;
  
  let filtered = getFilteredNoticesSet();

  if (noticeSearchQuery) {
    const q = noticeSearchQuery.toLowerCase();
    filtered = filtered.filter(item => item._searchableText && item._searchableText.includes(q));
  }

  if (filtered.length === 0) {
    noticeList.innerHTML = `
      <div class="state-box">
        <i class="fa-regular fa-folder-open"></i>
        <span>${noticeSearchQuery ? `No notices matching "${escapeHTML(noticeSearchQuery)}"` : `No notices found for ${deptPreference}.`}</span>
      </div>
    `;
    return;
  }

  const visibleItems = filtered.slice(0, noticeVisibleCount);
  let html = visibleItems.map(item => createCardHTML(item)).join("");

  if (filtered.length > noticeVisibleCount) {
    const remaining = filtered.length - noticeVisibleCount;
    html += `
      <button type="button" id="loadMoreNoticesBtn" class="load-more-btn">
        <span>Load More (${remaining} remaining)</span>
        <i class="fa-solid fa-chevron-down"></i>
      </button>
    `;
  }

  noticeList.innerHTML = html;

  const loadMoreBtn = document.getElementById("loadMoreNoticesBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      noticeVisibleCount += PAGE_SIZE;
      renderNotices();
    });
  }
}

/**
 * Render Results (Strictly filtered & paginated for selected department)
 */
function renderResultsView() {
  if (!resultList) return;

  let results = getFilteredResultsSet();

  if (resultSearchQuery) {
    const q = resultSearchQuery.toLowerCase();
    results = results.filter(item => item._searchableText && item._searchableText.includes(q));
  }

  if (results.length === 0) {
    resultList.innerHTML = `
      <div class="state-box">
        <i class="fa-solid fa-square-poll-vertical"></i>
        <span>${resultSearchQuery ? `No results matching "${escapeHTML(resultSearchQuery)}"` : `No SASTC examination results published for ${deptPreference}.`}</span>
      </div>
    `;
    return;
  }

  const visibleItems = results.slice(0, resultVisibleCount);
  let html = visibleItems.map(item => createCardHTML(item)).join("");

  if (results.length > resultVisibleCount) {
    const remaining = results.length - resultVisibleCount;
    html += `
      <button type="button" id="loadMoreResultsBtn" class="load-more-btn">
        <span>Load More (${remaining} remaining)</span>
        <i class="fa-solid fa-chevron-down"></i>
      </button>
    `;
  }

  resultList.innerHTML = html;

  const loadMoreBtn = document.getElementById("loadMoreResultsBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      resultVisibleCount += PAGE_SIZE;
      renderResultsView();
    });
  }
}

/**
 * Card Builder
 */
function createCardHTML(item, options = {}) {
  const isResult = item._isResult !== undefined ? item._isResult : isResultNotice(item);
  const displayBadge = isResult ? "RESULT" : (item._deptCode || item.deptCode || detectDeptCode(`${item.department || ''} ${item.title || ''}`));
  const deptIcon = getDeptIcon(displayBadge);

  const rawLink = item.pdf || item.url || item.pdf_url || item.link || item.pdfUrl || "";
  const isTextOnly = !rawLink || rawLink === "#";
  const pdfUrl = isTextOnly ? "#" : formatPdfUrl(rawLink);
  
  const title = escapeHTML(item.title || "Untitled Notice");
  const titleJS = escapeJS(item.title || "Untitled Notice");
  const date = escapeHTML(formatDateString(item.date) || "N/A");
  
  let rawDesc = item.desc || item.description || item.text || "";
  let textContentBase64 = null;
  if (isTextOnly) {
    textContentBase64 = encodeURIComponent(rawDesc || "No detailed description available.").replace(/'/g, "%27");
  }

  // Strip heavy inline <img> tags from the 2-line preview so cards render & scroll without image layout shifts
  const previewDesc = rawDesc ? rawDesc.replace(/<img[^>]*>/gi, "") : "";

  const shareHtml = options.hideCopy ? "" : `
    <button type="button" class="btn-share" onclick="shareLink('${pdfUrl}', '${titleJS}')" title="Share Link">
      <i class="fa-solid fa-share-nodes"></i>
    </button>
  `;

  const tagInfo = getTagInfo(item.date);
  const tagHtml = tagInfo ? `<span class="badge-time ${tagInfo.className}">${tagInfo.text}</span>` : "";

  let visitBtnHtml = "";
  let linkMatch = rawDesc.match(/href=['"]([^'"]+)['"]/);
  if (linkMatch && linkMatch[1]) {
    visitBtnHtml = `
      <a href="${linkMatch[1]}" target="_blank" rel="noopener noreferrer" class="btn-visit" onclick="event.stopPropagation();">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit
      </a>
    `;
  }

  const noticeArg = textContentBase64 ? "'" + textContentBase64 + "'" : "null";

  return `
    <div class="card card-animate">
      <div class="card-header">
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span class="badge-dept ${displayBadge === 'RESULT' ? 'badge-result' : ''}">
            <i class="${deptIcon}"></i> ${displayBadge}
          </span>
          ${tagHtml}
        </div>
        <span class="date"><i class="fa-regular fa-calendar"></i> ${date}</span>
      </div>
      <a href="${pdfUrl}" class="notice-title" onclick="handleNoticeClick(event, '${pdfUrl}', '${titleJS}', ${noticeArg})">
        ${title}
      </a>
      ${previewDesc ? `<div class="notice-desc-preview">${previewDesc}</div>` : ""}
      <div class="card-footer">
        <span class="category-tag">
          <i class="fa-solid fa-tag"></i> ${escapeHTML(item.category || "General")}
        </span>
        <div class="btn-actions">
          ${shareHtml}
          ${visitBtnHtml}
          <button type="button" class="btn-view" onclick="handlePdfView(event, '${pdfUrl}', '${titleJS}', ${noticeArg})">
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * PWA Install Prompt Handler
 */
function initPwaInstall() {
  const installBanner = document.getElementById("pwaInstallBanner");
  const installBtn = document.getElementById("btnInstallApp");
  const closeBtn = document.getElementById("btnCloseInstall");

  // Listen for beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Check if dismissed before in this session
    if (!sessionStorage.getItem("pwa_install_dismissed") && installBanner) {
      setTimeout(() => {
        installBanner.classList.add("show");
      }, 2000); // 2 second delay for smooth entrance
    }
  });

  // Handle Install Button Click
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      installBanner.classList.remove("show");
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        showToast("SASTC Portal installed successfully!");
      }
      deferredPrompt = null;
    });
  }

  // Handle Dismiss Button Click
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (installBanner) installBanner.classList.remove("show");
      sessionStorage.setItem("pwa_install_dismissed", "true");
    });
  }

  window.addEventListener("appinstalled", () => {
    if (installBanner) installBanner.classList.remove("show");
    deferredPrompt = null;
    showToast("Application is now available on Home Screen");
  });
}

/**
 * Event Listeners
 */
function initEventListeners() {
  const closeModalBtn = document.getElementById("closeModalBtn");
  const pdfModal = document.getElementById("pdfModal");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closePdfModal);
  if (pdfModal) {
    pdfModal.addEventListener("click", (e) => {
      if (e.target === pdfModal) closePdfModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pdfModal && pdfModal.classList.contains("active")) {
      closePdfModal();
    }
  });

  const headerBrand = document.getElementById("headerBrand");
  if (headerBrand) {
    headerBrand.addEventListener("click", () => {
      triggerHaptic();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const headerDeptBtn = document.getElementById("headerDeptBtn");
  if (headerDeptBtn) {
    headerDeptBtn.addEventListener("click", () => {
      triggerHaptic();
      switchTab("settings");
      const selectEl = document.getElementById("deptPreferenceSelect");
      if (selectEl) selectEl.focus();
    });
  }

  const headerSyncBtn = document.getElementById("headerSyncBtn");
  if (headerSyncBtn) {
    headerSyncBtn.addEventListener("click", () => {
      triggerHaptic();
      syncLiveNotices(true);
    });
  }

  const devAboutToggleBtn = document.getElementById("devAboutToggleBtn");
  const devAboutContent = document.getElementById("devAboutContent");
  if (devAboutToggleBtn && devAboutContent) {
    devAboutToggleBtn.addEventListener("click", () => {
      triggerHaptic();
      const isOpen = devAboutContent.classList.toggle("open");
      devAboutToggleBtn.classList.toggle("open", isOpen);
      devAboutToggleBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const settingsCgpaToggleBtn = document.getElementById("settingsCgpaToggleBtn");
  const settingsCgpaToggleIcon = document.getElementById("settingsCgpaToggleIcon");
  const viewCalculator = document.getElementById("view-calculator");
  if (settingsCgpaToggleBtn && viewCalculator) {
    settingsCgpaToggleBtn.addEventListener("click", () => {
      triggerHaptic();
      viewCalculator.classList.toggle("hidden");
      if (settingsCgpaToggleIcon) {
        if (viewCalculator.classList.contains("hidden")) {
          settingsCgpaToggleIcon.classList.replace("fa-chevron-up", "fa-chevron-down");
        } else {
          settingsCgpaToggleIcon.classList.replace("fa-chevron-down", "fa-chevron-up");
        }
      }
    });
  }

  const bottomNav = document.querySelector(".bottom-nav");
  const appHeader = document.querySelector(".app-header");
  let lastScrollY = window.scrollY;
  let scrollTicking = false;

  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        if (delta > 8 && currentScrollY > 64) {
          if (bottomNav) bottomNav.classList.add("nav-hidden");
          if (appHeader) appHeader.classList.add("header-hidden");
        } else if (delta < -6 || currentScrollY <= 20) {
          if (bottomNav) bottomNav.classList.remove("nav-hidden");
          if (appHeader) appHeader.classList.remove("header-hidden");
        }
        lastScrollY = currentScrollY;
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  const headerOfflineIcon = document.getElementById("headerOfflineIcon");
  function updateOnlineStatus() {
    if (headerOfflineIcon) {
      headerOfflineIcon.style.display = navigator.onLine ? "none" : "inline-flex";
    }
  }
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();
}

/**
 * ============================================================================
 * RESOURCES SECTION ENGINE
 * Dynamically loads cse-resource.js, ag-resource.js, or bba-resource.js,
 * syncs department/level/semester, provides smart search with autocomplete,
 * category & course filters, horizontal slider, and detailed preview modal.
 * ============================================================================
 */

function getEffectiveResourceDept() {
  if (["CSE", "AG", "BBA"].includes(deptPreference)) return deptPreference;
  if (["CSE", "AG", "BBA"].includes(activeDept)) return activeDept;
  return "CSE";
}

function normalizeSemesterValue(sem) {
  const s = String(sem || "1").trim().toUpperCase();
  if (s === "I" || s === "1" || s === "S1") return "1";
  if (s === "II" || s === "2" || s === "S2") return "2";
  return "1";
}

function normalizeLevelValue(lvl) {
  const l = String(lvl || "1").trim().toUpperCase().replace(/^L/, "");
  if (["1", "2", "3", "4"].includes(l)) return l;
  return "1";
}

function normalizeCategoryName(cat) {
  if (!cat) return "More";
  const raw = String(cat).trim().toLowerCase();
  if (raw.includes("question bank") || raw === "qb") return "Question Bank";
  if (raw.includes("lecture") || raw.includes("note") || raw.includes("slide")) return "Lecture Notes";
  if (raw.includes("reference") || raw.includes("book") || raw.includes("textbook")) return "Reference Books";
  if (raw.includes("lab") || raw.includes("sessional") || raw.includes("practical")) return "Lab Materials";
  if (raw.includes("previous") || raw.includes("past") || raw.includes("archive")) return "Previous Questions";
  const matched = RESOURCE_CATEGORIES.find(c => c.toLowerCase() === raw);
  return matched && matched !== "All" ? matched : "More";
}

function normalizeDepartmentResourceDataset(rawExport, deptCode) {
  const list = [];
  let seq = 1;

  const pushNormalizedItem = (item, fallbackLevel = "1", fallbackSem = "1") => {
    if (!item || typeof item !== "object") return;
    const level = normalizeLevelValue(item.level || fallbackLevel);
    const semester = normalizeSemesterValue(item.semester || fallbackSem);
    const courseCode = String(item.courseCode || item.code || "GEN 101").trim();
    const courseTitle = String(item.courseTitle || item.courseName || "").trim();
    const title = String(item.title || item.name || `${courseCode} Resource`).trim();
    const category = normalizeCategoryName(item.category);
    const rawTags = Array.isArray(item.tags)
      ? item.tags.map(t => String(t).trim()).filter(Boolean)
      : (typeof item.tags === "string" ? item.tags.split(",").map(t => t.trim()).filter(Boolean) : []);
    const thumbnail = String(item.thumbnail || item.thumb || item.image || item.previewImage || "").trim();
    const url = String(item.url || item.documentUrl || item.link || item.pdf || item.driveUrl || "").trim();
    const downloadUrl = String(item.downloadUrl || "").trim();
    const details = String(item.details || item.description || item.desc || "").trim();
    const sharedBy = String(item.sharedBy || item.uploadedBy || "").trim();
    const author = String(sharedBy || item.author || item.source || "").trim();
    const pages = String(item.pages || "").trim();
    const size = String(item.size || item.fileSize || "").trim();
    const session = String(item.session || item.year || item.updatedAt || "").trim();

    let fileType = String(item.fileType || item.type || "").trim().toUpperCase();
    if (!fileType) {
      if (isGoogleDriveFolderUrl(url)) fileType = "FOLDER";
      else if (url.includes("drive.google.com")) fileType = "PDF / DRIVE";
      else fileType = "PDF";
    }

    const id = String(item.id || `${deptCode.toLowerCase()}-l${level}s${semester}-${seq++}`);
    const compactCode = courseCode.replace(/\s+/g, "").toLowerCase();
    const searchableText = [
      courseCode,
      compactCode,
      courseTitle,
      title,
      category,
      rawTags.join(" "),
      details,
      author,
      sharedBy,
      session,
      fileType,
      `L${level}S${semester}`,
      `L${level} S${semester}`,
      `Level ${level} Semester ${semester}`
    ].join(" ").toLowerCase();

    list.push({
      id,
      dept: deptCode,
      level,
      semester,
      courseCode,
      courseTitle,
      title,
      category,
      tags: rawTags,
      thumbnail,
      url,
      downloadUrl,
      details,
      author,
      sharedBy,
      pages,
      size,
      session,
      fileType,
      _searchText: searchableText
    });
  };

  if (Array.isArray(rawExport)) {
    rawExport.forEach(item => pushNormalizedItem(item));
  } else if (rawExport && typeof rawExport === "object") {
    Object.keys(rawExport).forEach(levelKey => {
      const levelVal = rawExport[levelKey];
      if (Array.isArray(levelVal)) {
        levelVal.forEach(item => pushNormalizedItem(item, levelKey, "1"));
      } else if (levelVal && typeof levelVal === "object") {
        Object.keys(levelVal).forEach(semKey => {
          const semArr = levelVal[semKey];
          if (Array.isArray(semArr)) {
            semArr.forEach(item => pushNormalizedItem(item, levelKey, semKey));
          }
        });
      }
    });
  }

  return list;
}

async function loadDepartmentResources(deptCode) {
  const dept = ["CSE", "AG", "BBA"].includes(deptCode) ? deptCode : "CSE";
  if (deptResourcesCache[dept]) {
    return deptResourcesCache[dept];
  }

  const fileMap = {
    CSE: "./cse-resource.js",
    AG: "./ag-resource.js",
    BBA: "./bba-resource.js"
  };

  try {
    const mod = await import(fileMap[dept]);
    const rawData =
      mod.cseResourceData ||
      mod.agResourceData ||
      mod.bbaResourceData ||
      mod.resources ||
      mod.default ||
      {};
    const normalized = normalizeDepartmentResourceDataset(rawData, dept);
    deptResourcesCache[dept] = normalized;
    return normalized;
  } catch (err) {
    console.error(`Failed to load resource file for ${dept}:`, err);
    deptResourcesCache[dept] = [];
    return [];
  }
}

function initResourcesSection() {
  activeResourceDept = getEffectiveResourceDept();
  resLevel = normalizeLevelValue(localStorage.getItem(LS_EXAM_LEVEL) || examLevel || "1");
  resSemester = normalizeSemesterValue(localStorage.getItem(LS_EXAM_SEM) || examSemester || "1");
  resCustomLevelSem = false;

  // Bind Level buttons (L1-L4) — Scoped ONLY to Resources section
  const levelBtns = document.querySelectorAll("#resLevelGroup .res-ls-btn");
  levelBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      triggerHaptic();
      const selectedLvl = btn.getAttribute("data-level");
      if (!selectedLvl) return;
      resLevel = selectedLvl;
      resCustomLevelSem = true;
      resAllSemesters = false;
      resActiveCourse = "ALL";

      updateResourceSelectorUI();
      renderResourcesView({ resetScroll: true });
    });
  });

  // Bind Semester buttons (S1, S2, All) — Scoped ONLY to Resources section
  const semBtns = document.querySelectorAll("#resSemGroup .res-ls-btn");
  semBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      triggerHaptic();
      const selectedSem = btn.getAttribute("data-sem");
      if (!selectedSem) return;

      if (selectedSem === "ALL") {
        resAllSemesters = !resAllSemesters;
      } else {
        resSemester = selectedSem;
        resCustomLevelSem = true;
        resAllSemesters = false;
      }

      resActiveCourse = "ALL";
      updateResourceSelectorUI();
      renderResourcesView({ resetScroll: true });
    });
  });

  // #resDeptBadge is non-clickable (display-only department indicator)

  // Bind Category Filter Chips
  const catChips = document.querySelectorAll("#resCategoryBar .res-cat-chip");
  catChips.forEach(chip => {
    chip.addEventListener("click", () => {
      triggerHaptic();
      const cat = chip.getAttribute("data-category") || "All";
      resActiveCategory = cat;
      catChips.forEach(c => c.classList.toggle("active", c.getAttribute("data-category") === cat));
      renderResourcesView({ resetScroll: true });
    });
  });

  // Bind Smart Search Input & Autocomplete
  const searchInput = document.getElementById("resourceSearchInput");
  const clearBtn = document.getElementById("resourceClearBtn");
  const autocompleteEl = document.getElementById("resourceAutocomplete");

  if (searchInput) {
    const onSearchInput = debounce(async (val) => {
      if (!currentDeptResources || currentDeptResources.length === 0) {
        currentDeptResources = await loadDepartmentResources(activeResourceDept);
      }
      resourceSearchQuery = val.trim();
      if (resourceSearchQuery.length > 0) {
        resActiveCourse = "ALL";
      }
      renderResourceAutocomplete(resourceSearchQuery);
      renderResourcesView({ resetScroll: true });
    }, 60);

    searchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val.length > 0 ? "block" : "none";
      onSearchInput(val);
    });

    searchInput.addEventListener("focus", async () => {
      if (!currentDeptResources || currentDeptResources.length === 0) {
        currentDeptResources = await loadDepartmentResources(activeResourceDept);
      }
      renderResourceAutocomplete(searchInput.value.trim());
    });

    searchInput.addEventListener("keydown", (e) => {
      if (!autocompleteEl || !autocompleteEl.classList.contains("open")) return;
      const items = autocompleteEl.querySelectorAll(".res-ac-item");

      if (e.key === "ArrowDown" && items.length) {
        e.preventDefault();
        autocompleteHighlightIdx = (autocompleteHighlightIdx + 1) % items.length;
        updateAutocompleteHighlight(items);
      } else if (e.key === "ArrowUp" && items.length) {
        e.preventDefault();
        autocompleteHighlightIdx = (autocompleteHighlightIdx - 1 + items.length) % items.length;
        updateAutocompleteHighlight(items);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (autocompleteHighlightIdx >= 0 && items[autocompleteHighlightIdx]) {
          items[autocompleteHighlightIdx].click();
        } else {
          closeResourceAutocomplete();
          searchInput.blur();
        }
      } else if (e.key === "Escape") {
        closeResourceAutocomplete();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      triggerHaptic();
      if (searchInput) searchInput.value = "";
      clearBtn.style.display = "none";
      resourceSearchQuery = "";
      resActiveCourse = "ALL";
      closeResourceAutocomplete();
      renderResourcesView({ resetScroll: true });
    });
  }

  document.addEventListener("click", (e) => {
    if (autocompleteEl && !e.target.closest(".res-search-wrapper")) {
      closeResourceAutocomplete();
    }
  });

  // Bind Horizontal Slider Left/Right Buttons & Scroll Progress
  initResourceSliderControls();

  // Bind Detailed Resource Modal Controls
  initResourceModalControls();

  // Bind Full-Screen Resource Contributors Leaderboard Controls
  initResourcesLeaderboardControls();

  // Listen for department changes from Settings or Onboarding modal
  window.addEventListener("sastc_dept_changed", () => {
    syncResourcesWithPortalContext();
  });
}

function updateAutocompleteHighlight(items) {
  items.forEach((el, idx) => {
    el.classList.toggle("highlighted", idx === autocompleteHighlightIdx);
    if (idx === autocompleteHighlightIdx) {
      el.scrollIntoView({ block: "nearest" });
    }
  });
}

function closeResourceAutocomplete() {
  const autocompleteEl = document.getElementById("resourceAutocomplete");
  const searchInput = document.getElementById("resourceSearchInput");
  if (autocompleteEl) {
    autocompleteEl.classList.remove("open");
    autocompleteEl.innerHTML = "";
  }
  if (searchInput) {
    searchInput.setAttribute("aria-expanded", "false");
  }
  autocompleteHighlightIdx = -1;
}

function doesResourceMatchQuery(item, rawQuery) {
  const q = String(rawQuery || "").trim().toLowerCase();
  if (!q) return true;
  const compactQ = q.replace(/[\s\-_]+/g, "");
  const hay = item._searchText || "";
  const compactHay = hay.replace(/[\s\-_]+/g, "");
  if (hay.includes(q) || compactHay.includes(compactQ)) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every(tok => {
      const cleanTok = tok.replace(/[\s\-_]+/g, "");
      return hay.includes(tok) || (cleanTok && compactHay.includes(cleanTok));
    });
  }
  return false;
}

function renderResourceAutocomplete(query) {
  const autocompleteEl = document.getElementById("resourceAutocomplete");
  const searchInput = document.getElementById("resourceSearchInput");
  const clearBtn = document.getElementById("resourceClearBtn");
  if (!autocompleteEl) return;

  const q = String(query || "").trim().toLowerCase();

  // If search input is focused but empty, show quick suggestions from active Level & Semester
  if (!q) {
    const contextSuggestions = currentDeptResources
      .filter(item => resAllSemesters || (item.level === resLevel && item.semester === resSemester))
      .slice(0, 6);

    if (contextSuggestions.length === 0) {
      closeResourceAutocomplete();
      return;
    }

    autocompleteHighlightIdx = -1;
    autocompleteEl.innerHTML = contextSuggestions.map(item => `
      <div class="res-ac-item" role="option" data-res-id="${escapeHTML(item.id)}">
        <div class="res-ac-left">
          <div class="res-ac-top-row">
            <span class="res-ac-code">${escapeHTML(item.courseCode)}</span>
            <span class="res-ac-ls">L${escapeHTML(item.level)}•S${escapeHTML(item.semester)}</span>
            <span class="res-ac-cat">${escapeHTML(item.category)}</span>
          </div>
          <div class="res-ac-title">${escapeHTML(item.title)}</div>
        </div>
        <div class="res-ac-actions">
          <button type="button" class="res-ac-filter-btn" data-action="view" title="Open resource">
            View
          </button>
        </div>
      </div>
    `).join("");

    bindAutocompleteItemEvents(autocompleteEl, searchInput, clearBtn);
    autocompleteEl.classList.add("open");
    if (searchInput) searchInput.setAttribute("aria-expanded", "true");
    return;
  }

  const compactQ = q.replace(/[\s\-_]+/g, "");
  const tokens = q.split(/\s+/).filter(Boolean);

  const matches = currentDeptResources
    .map(item => {
      if (!doesResourceMatchQuery(item, q)) return { item, score: 0 };

      let score = 10;
      const codeLower = item.courseCode.toLowerCase();
      const codeCompact = codeLower.replace(/[\s\-_]+/g, "");
      const titleLower = item.title.toLowerCase();
      const courseTitleLower = item.courseTitle.toLowerCase();
      const tagsLower = item.tags.map(t => t.toLowerCase());

      if (codeLower.startsWith(q) || codeCompact.startsWith(compactQ)) score += 120;
      else if (codeLower.includes(q) || codeCompact.includes(compactQ)) score += 85;

      if (titleLower.startsWith(q)) score += 80;
      else if (titleLower.includes(q)) score += 60;

      if (courseTitleLower.includes(q)) score += 50;
      if (tagsLower.some(t => t.includes(q))) score += 45;

      tokens.forEach(tok => {
        if (codeLower.includes(tok) || codeCompact.includes(tok)) score += 25;
        if (titleLower.includes(tok)) score += 18;
      });

      // Boost items from active level/semester
      if (!resAllSemesters && item.level === resLevel && item.semester === resSemester) {
        score += 20;
      }

      return { item, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  if (matches.length === 0) {
    autocompleteEl.innerHTML = `
      <div class="res-ac-empty">
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>No matching resources found in ${escapeHTML(activeResourceDept)}</span>
      </div>
    `;
    autocompleteEl.classList.add("open");
    if (searchInput) searchInput.setAttribute("aria-expanded", "true");
    return;
  }

  autocompleteHighlightIdx = -1;
  autocompleteEl.innerHTML = matches.map(({ item }) => {
    const matchedTag = item.tags.find(t => t.toLowerCase().includes(q)) || item.category;
    return `
      <div class="res-ac-item" role="option" data-res-id="${escapeHTML(item.id)}">
        <div class="res-ac-left">
          <div class="res-ac-top-row">
            <span class="res-ac-code">${escapeHTML(item.courseCode)}</span>
            <span class="res-ac-ls">L${escapeHTML(item.level)}•S${escapeHTML(item.semester)}</span>
            <span class="res-ac-cat">${escapeHTML(matchedTag)}</span>
          </div>
          <div class="res-ac-title">${escapeHTML(item.title)}</div>
        </div>
        <div class="res-ac-actions">
          <button type="button" class="res-ac-filter-btn" data-action="view" title="Open resource preview">
            View
          </button>
        </div>
      </div>
    `;
  }).join("");

  bindAutocompleteItemEvents(autocompleteEl, searchInput, clearBtn);
  autocompleteEl.classList.add("open");
  if (searchInput) searchInput.setAttribute("aria-expanded", "true");
}

function bindAutocompleteItemEvents(autocompleteEl, searchInput, clearBtn) {
  autocompleteEl.querySelectorAll(".res-ac-item").forEach(row => {
    row.addEventListener("mousedown", (e) => {
      // Prevent input blur before click handler runs
      e.preventDefault();
    });

    row.addEventListener("click", (e) => {
      const viewBtn = e.target.closest("[data-action='view']");
      const resId = row.getAttribute("data-res-id");
      const targetItem = currentDeptResources.find(r => r.id === resId);
      if (!targetItem) return;

      triggerHaptic();
      closeResourceAutocomplete();

      // Switch Resources section Level & Semester to match the selected item
      resLevel = targetItem.level;
      resSemester = targetItem.semester;
      resCustomLevelSem = true;
      resAllSemesters = false;
      resActiveCategory = "All";
      resActiveCourse = targetItem.courseCode;
      resourceSearchQuery = targetItem.courseCode;

      if (searchInput) searchInput.value = targetItem.courseCode;
      if (clearBtn) clearBtn.style.display = "block";

      updateResourceSelectorUI();
      renderResourcesView({ resetScroll: true });

      if (viewBtn) {
        e.stopPropagation();
        openResourceDetailModal(targetItem);
      }
    });
  });
}

function updateResourceSelectorUI() {
  const deptNameEl = document.getElementById("resDeptName");
  const deptIconEl = document.getElementById("resDeptIcon");
  const contextSubEl = document.getElementById("resContextSub");

  if (deptNameEl) deptNameEl.textContent = activeResourceDept;
  if (deptIconEl) {
    const iconMap = {
      CSE: "fa-solid fa-laptop-code",
      AG: "fa-solid fa-wheat-awn",
      BBA: "fa-solid fa-chart-line"
    };
    deptIconEl.className = iconMap[activeResourceDept] || "fa-solid fa-graduation-cap";
  }

  if (contextSubEl) {
    contextSubEl.textContent = resAllSemesters
      ? `All`
      : `L${resLevel} • S${resSemester}`;
  }

  document.querySelectorAll("#resLevelGroup .res-ls-btn").forEach(btn => {
    btn.classList.toggle("active", !resAllSemesters && btn.getAttribute("data-level") === resLevel);
  });

  document.querySelectorAll("#resSemGroup .res-ls-btn").forEach(btn => {
    const semAttr = btn.getAttribute("data-sem");
    if (semAttr === "ALL") {
      btn.classList.toggle("active", resAllSemesters);
    } else {
      btn.classList.toggle("active", !resAllSemesters && semAttr === resSemester);
    }
  });

  document.querySelectorAll("#resCategoryBar .res-cat-chip").forEach(chip => {
    chip.classList.toggle("active", chip.getAttribute("data-category") === resActiveCategory);
  });
}

async function syncResourcesWithPortalContext() {
  const detectedDept = getEffectiveResourceDept();
  const deptChanged = detectedDept !== activeResourceDept;
  activeResourceDept = detectedDept;

  // Apply Home page's Level & Semester by default unless manually changed inside Resources
  if (!resAllSemesters && !resCustomLevelSem) {
    resLevel = normalizeLevelValue(examLevel || "1");
    resSemester = normalizeSemesterValue(examSemester || "1");
  }
  if (deptChanged) {
    resActiveCourse = "ALL";
  }

  updateResourceSelectorUI();
  currentDeptResources = await loadDepartmentResources(activeResourceDept);
  renderResourcesView({ resetScroll: deptChanged });
}

function getContextFilteredResources(options = {}) {
  const ignoreCategory = Boolean(options.ignoreCategory);
  const ignoreCourse = Boolean(options.ignoreCourse);
  const q = resourceSearchQuery.trim().toLowerCase();

  const filtered = currentDeptResources.filter(item => {
    // When no search query is entered, filter strictly by active Level & Semester (unless All is active)
    if (!q && !resAllSemesters) {
      if (item.level !== resLevel || item.semester !== resSemester) return false;
    }

    if (!q && !ignoreCourse && resActiveCourse !== "ALL" && item.courseCode !== resActiveCourse) {
      return false;
    }

    if (!ignoreCategory && resActiveCategory !== "All" && item.category !== resActiveCategory) {
      return false;
    }

    if (q) {
      if (!doesResourceMatchQuery(item, q)) return false;
    }

    return true;
  });

  // When searching, prioritize items from the currently selected Level & Semester first
  if (q && !resAllSemesters) {
    filtered.sort((a, b) => {
      const aInContext = a.level === resLevel && a.semester === resSemester ? 1 : 0;
      const bInContext = b.level === resLevel && b.semester === resSemester ? 1 : 0;
      return bInContext - aInContext;
    });
  }

  return filtered;
}

function renderCourseQuickFilterBar() {
  const courseBar = document.getElementById("resCourseBar");
  if (!courseBar) return;

  const baseItems = getContextFilteredResources({ ignoreCategory: true, ignoreCourse: true });
  const courseCodes = [];
  baseItems.forEach(item => {
    if (item.courseCode && !courseCodes.includes(item.courseCode)) {
      courseCodes.push(item.courseCode);
    }
  });

  if (courseCodes.length <= 1) {
    courseBar.style.display = "none";
    courseBar.innerHTML = "";
    return;
  }

  courseBar.style.display = "flex";
  const allChip = `
    <button type="button" class="res-course-pill ${resActiveCourse === "ALL" ? "active" : ""}" data-course="ALL">
      All Courses
    </button>
  `;
  const pillsHtml = courseCodes.map(code => `
    <button type="button" class="res-course-pill ${resActiveCourse === code ? "active" : ""}" data-course="${escapeHTML(code)}">
      ${escapeHTML(code)}
    </button>
  `).join("");

  courseBar.innerHTML = allChip + pillsHtml;

  courseBar.querySelectorAll(".res-course-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      triggerHaptic();
      resActiveCourse = btn.getAttribute("data-course") || "ALL";
      renderResourcesView({ resetScroll: true });
    });
  });
}

function updateCategoryCounts() {
  const baseForCounts = getContextFilteredResources({ ignoreCategory: true });
  const counts = { All: baseForCounts.length };
  RESOURCE_CATEGORIES.forEach(cat => {
    if (cat !== "All") counts[cat] = 0;
  });

  baseForCounts.forEach(item => {
    if (counts[item.category] !== undefined) {
      counts[item.category]++;
    } else {
      counts.More = (counts.More || 0) + 1;
    }
  });

  document.querySelectorAll("#resCategoryBar [data-cat-count]").forEach(badge => {
    const cat = badge.getAttribute("data-cat-count");
    badge.textContent = counts[cat] !== undefined ? counts[cat] : 0;
  });
}

function getCategoryAccentInfo(category) {
  switch (category) {
    case "Question Bank":
      return { icon: "fa-solid fa-circle-question", cls: "cat-qb" };
    case "Lecture Notes":
      return { icon: "fa-solid fa-book-open", cls: "cat-ln" };
    case "Reference Books":
      return { icon: "fa-solid fa-book", cls: "cat-rb" };
    case "Lab Materials":
      return { icon: "fa-solid fa-flask", cls: "cat-lab" };
    case "Previous Questions":
      return { icon: "fa-solid fa-clock-rotate-left", cls: "cat-pq" };
    default:
      return { icon: "fa-solid fa-folder-open", cls: "cat-more" };
  }
}

function createResourceCardHTML(item) {
  const thumbUrl = resolveThumbnailUrl(item.thumbnail);
  const catInfo = getCategoryAccentInfo(item.category);
  const hasDocUrl = Boolean(item.url && item.url !== "#");
  const isDrive = hasDocUrl && (item.url.includes("drive.google.com") || item.url.includes("docs.google.com"));
  const fileBadgeLabel = item.fileType || (isDrive ? "DRIVE PDF" : "PDF");

  const thumbnailContent = thumbUrl
    ? `
      <img
        src="${escapeHTML(thumbUrl)}"
        alt="${escapeHTML(item.title)}"
        class="res-card-thumb-img"
        loading="lazy"
        decoding="async"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      />
      <div class="res-card-thumb-fallback ${catInfo.cls}" style="display:none;">
        <div class="res-fallback-icon"><i class="${catInfo.icon}"></i></div>
        <span class="res-fallback-code">${escapeHTML(item.courseCode)}</span>
        <span class="res-fallback-cat">${escapeHTML(item.category)}</span>
      </div>
    `
    : `
      <div class="res-card-thumb-fallback ${catInfo.cls}">
        <div class="res-fallback-icon"><i class="${catInfo.icon}"></i></div>
        <span class="res-fallback-code">${escapeHTML(item.courseCode)}</span>
        <span class="res-fallback-cat">${escapeHTML(item.category)}</span>
      </div>
    `;

  const tagsPreview = item.tags.slice(0, 3).map(tag =>
    `<span class="res-card-tag">#${escapeHTML(tag)}</span>`
  ).join("");

  const sharedByName = item.sharedBy || item.author || `Dept. of ${item.dept}`;
  const extraMetaBits = [];
  if (item.pages) extraMetaBits.push(`<span class="res-card-extra-bit"><i class="fa-regular fa-file-lines"></i> ${escapeHTML(item.pages)}p</span>`);
  if (item.size) extraMetaBits.push(`<span class="res-card-extra-bit"><i class="fa-solid fa-hard-drive"></i> ${escapeHTML(item.size)}</span>`);

  return `
    <article class="res-card" data-resource-id="${escapeHTML(item.id)}" tabindex="0" role="button" aria-label="${escapeHTML(item.title)}">
      <div class="res-card-thumb-wrap">
        ${thumbnailContent}
        <span class="res-file-badge">
          <i class="${isDrive ? "fa-brands fa-google-drive" : "fa-solid fa-file-pdf"}"></i>
          ${escapeHTML(fileBadgeLabel)}
        </span>
        <span class="res-sem-badge">L${escapeHTML(item.level)} • S${escapeHTML(item.semester)}</span>
      </div>

      <div class="res-card-body">
        <div class="res-card-top-row">
          <span class="res-course-code-badge">${escapeHTML(item.courseCode)}</span>
          <span class="res-category-pill ${catInfo.cls}">
            <i class="${catInfo.icon}"></i> ${escapeHTML(item.category)}
          </span>
        </div>

        <h4 class="res-card-title" title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</h4>

        <p class="res-card-details">
          ${escapeHTML(item.details || item.courseTitle || "Tap to view full resource details, preview, and download options.")}
        </p>

        <div class="res-card-tags">${tagsPreview}</div>

        <div class="res-card-footer">
          <div class="res-card-meta-info">
            <span class="res-shared-by-badge">
              <i class="fa-solid fa-user-pen"></i>
              <em class="res-shared-prefix">Shared by -</em>
              <strong class="res-shared-fullname">${escapeHTML(sharedByName)}</strong>
            </span>
          </div>
          <div class="res-card-actions">
            ${extraMetaBits.length ? `<div class="res-card-extra-meta">${extraMetaBits.join("")}</div>` : ""}
            ${hasDocUrl ? `
              <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" class="res-card-direct-btn" title="Open Link Directly" onclick="event.stopPropagation();">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            ` : ""}
            <span class="res-card-preview-btn">
              <span>Preview</span>
              <i class="fa-solid fa-expand"></i>
            </span>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderResourcesView(options = {}) {
  const track = document.getElementById("resourceSliderTrack");
  const sliderTitle = document.getElementById("resSliderTitle");
  const sliderCount = document.getElementById("resSliderCount");
  if (!track) return;

  updateCategoryCounts();
  renderCourseQuickFilterBar();

  filteredResourcesList = getContextFilteredResources();

  if (sliderTitle) {
    const scopeLabel = resAllSemesters ? `${activeResourceDept} All` : `${activeResourceDept} L${resLevel}S${resSemester}`;
    const catLabel = resActiveCategory === "All" ? "All Resources" : resActiveCategory;
    sliderTitle.textContent = `${scopeLabel} • ${catLabel}`;
  }

  if (sliderCount) {
    sliderCount.textContent = `${filteredResourcesList.length} ${filteredResourcesList.length === 1 ? "item" : "items"}`;
  }

  if (filteredResourcesList.length === 0) {
    // Check if there are matches in other semesters when searching
    const deptWideMatches = resourceSearchQuery
      ? currentDeptResources.filter(item => {
          const q = resourceSearchQuery.toLowerCase();
          return item._searchText.includes(q) || item._searchText.includes(q.replace(/\s+/g, ""));
        })
      : [];

    track.innerHTML = `
      <div class="state-box res-empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <span>
          ${resourceSearchQuery
            ? `No resources matching "${escapeHTML(resourceSearchQuery)}" in ${resAllSemesters ? activeResourceDept : `Level ${resLevel} Semester ${resSemester}`}.`
            : `No ${resActiveCategory !== "All" ? escapeHTML(resActiveCategory) : ""} resources found for ${activeResourceDept} Level ${resLevel} Semester ${resSemester}.`
          }
        </span>
        ${deptWideMatches.length > 0 && !resAllSemesters ? `
          <button type="button" id="resSearchAllSemBtn" class="res-reset-filter-btn">
            <i class="fa-solid fa-layer-group"></i> Show ${deptWideMatches.length} match${deptWideMatches.length > 1 ? "es" : ""} across all semesters
          </button>
        ` : (resActiveCategory !== "All" || resActiveCourse !== "ALL" || resourceSearchQuery ? `
          <button type="button" id="resResetFiltersBtn" class="res-reset-filter-btn">
            <i class="fa-solid fa-rotate-left"></i> Reset Filters
          </button>
        ` : "")}
      </div>
    `;

    const showAllSemBtn = document.getElementById("resSearchAllSemBtn");
    if (showAllSemBtn) {
      showAllSemBtn.addEventListener("click", () => {
        triggerHaptic();
        resAllSemesters = true;
        updateResourceSelectorUI();
        renderResourcesView({ resetScroll: true });
      });
    }

    const resetBtn = document.getElementById("resResetFiltersBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        triggerHaptic();
        resActiveCategory = "All";
        resActiveCourse = "ALL";
        resourceSearchQuery = "";
        const searchInput = document.getElementById("resourceSearchInput");
        const clearBtn = document.getElementById("resourceClearBtn");
        if (searchInput) searchInput.value = "";
        if (clearBtn) clearBtn.style.display = "none";
        updateResourceSelectorUI();
        renderResourcesView({ resetScroll: true });
      });
    }

    updateSliderButtonsAndProgress();
    return;
  }

  track.innerHTML = filteredResourcesList.map(item => createResourceCardHTML(item)).join("");

  track.querySelectorAll(".res-card").forEach(cardEl => {
    const openCardModal = () => {
      triggerHaptic();
      const id = cardEl.getAttribute("data-resource-id");
      const resourceItem = filteredResourcesList.find(r => r.id === id) || currentDeptResources.find(r => r.id === id);
      if (resourceItem) openResourceDetailModal(resourceItem);
    };

    cardEl.addEventListener("click", openCardModal);
    cardEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openCardModal();
      }
    });
  });

  if (options.resetScroll) {
    track.scrollTo({ left: 0, behavior: "smooth" });
  }
  requestAnimationFrame(updateSliderButtonsAndProgress);
}

function initResourceSliderControls() {
  const track = document.getElementById("resourceSliderTrack");
  const prevBtn = document.getElementById("resSlidePrevBtn");
  const nextBtn = document.getElementById("resSlideNextBtn");
  if (!track) return;

  const getSlideDistance = () => {
    const firstCard = track.querySelector(".res-card");
    return firstCard ? firstCard.offsetWidth + 14 : 290;
  };

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      triggerHaptic();
      track.scrollBy({ left: -getSlideDistance(), behavior: "smooth" });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      triggerHaptic();
      track.scrollBy({ left: getSlideDistance(), behavior: "smooth" });
    });
  }

  track.addEventListener("scroll", () => {
    requestAnimationFrame(updateSliderButtonsAndProgress);
  }, { passive: true });

  window.addEventListener("resize", () => {
    requestAnimationFrame(updateSliderButtonsAndProgress);
  }, { passive: true });
}

function updateSliderButtonsAndProgress() {
  const track = document.getElementById("resourceSliderTrack");
  const prevBtn = document.getElementById("resSlidePrevBtn");
  const nextBtn = document.getElementById("resSlideNextBtn");
  const progressFill = document.getElementById("resSliderProgressFill");
  if (!track) return;

  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const currentScroll = Math.max(0, track.scrollLeft);

  if (prevBtn) {
    prevBtn.disabled = currentScroll <= 4;
  }
  if (nextBtn) {
    nextBtn.disabled = maxScroll <= 4 || currentScroll >= maxScroll - 4;
  }
  if (progressFill) {
    if (maxScroll <= 4) {
      progressFill.style.width = filteredResourcesList.length > 0 ? "100%" : "0%";
    } else {
      const pct = Math.min(100, Math.max(12, Math.round((currentScroll / maxScroll) * 100)));
      progressFill.style.width = `${pct}%`;
    }
  }
}

function switchResourceModalTab(tabMode) {
  const detailsTab = document.getElementById("resModalTabDetails");
  const viewerTab = document.getElementById("resModalTabViewer");
  const overviewPane = document.getElementById("resModalOverviewPane");
  const viewerPane = document.getElementById("resModalViewerPane");
  const viewerFrame = document.getElementById("resViewerFrame");
  const viewerLoading = document.getElementById("resViewerLoading");
  const viewerFallback = document.getElementById("resViewerFallback");

  const isViewer = tabMode === "viewer";
  if (detailsTab) detailsTab.classList.toggle("active", !isViewer);
  if (viewerTab) viewerTab.classList.toggle("active", isViewer);
  if (overviewPane) overviewPane.classList.toggle("active", !isViewer);
  if (viewerPane) viewerPane.classList.toggle("active", isViewer);

  if (isViewer && activeModalResource) {
    const rawUrl = activeModalResource.url;
    const isFolder = isGoogleDriveFolderUrl(rawUrl);
    const embedUrl = getEmbedPreviewUrl(rawUrl);

    if (!rawUrl || rawUrl === "#") {
      if (viewerLoading) viewerLoading.style.display = "none";
      if (viewerFrame) {
        viewerFrame.style.display = "none";
        viewerFrame.src = "about:blank";
      }
      if (viewerFallback) {
        viewerFallback.style.display = "flex";
        viewerFallback.innerHTML = `
          <i class="fa-regular fa-file-pdf" style="font-size:28px; color:var(--text-muted);"></i>
          <strong>Document URL Not Added Yet</strong>
          <span>Add your Google Drive or PDF URL to the <code>url</code> field in <code>${activeModalResource.dept.toLowerCase()}-resource.js</code> to enable live document preview and download.</span>
        `;
      }
    } else if (isFolder) {
      if (viewerLoading) viewerLoading.style.display = "none";
      if (viewerFrame) {
        viewerFrame.style.display = "none";
        viewerFrame.src = "about:blank";
      }
      if (viewerFallback) {
        viewerFallback.style.display = "flex";
        viewerFallback.innerHTML = `
          <i class="fa-brands fa-google-drive" style="font-size:32px; color:#2563eb;"></i>
          <strong>Google Drive Folder Resource</strong>
          <span>This resource points to a Google Drive folder. Click below to open the folder directly in Google Drive.</span>
          <a href="${escapeHTML(rawUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="margin-top:8px;">
            <span>Open Google Drive Folder</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        `;
      }
    } else if (embedUrl) {
      if (viewerFallback) viewerFallback.style.display = "none";
      if (viewerFrame) {
        viewerFrame.style.display = "block";
        if (viewerFrame.getAttribute("data-loaded-url") !== embedUrl) {
          if (viewerLoading) viewerLoading.style.display = "flex";
          viewerFrame.onload = () => {
            if (viewerLoading) viewerLoading.style.display = "none";
          };
          viewerFrame.setAttribute("data-loaded-url", embedUrl);
          viewerFrame.src = embedUrl;
        }
      }
    }
  }
}

function openResourceDetailModal(item) {
  const modal = document.getElementById("resourceDetailModal");
  if (!modal || !item) return;

  activeModalResource = item;
  const catInfo = getCategoryAccentInfo(item.category);
  const thumbUrl = resolveThumbnailUrl(item.thumbnail);
  const hasDocUrl = Boolean(item.url && item.url !== "#");
  const isDrive = hasDocUrl && (item.url.includes("drive.google.com") || item.url.includes("docs.google.com"));

  const courseBadge = document.getElementById("resModalCourseBadge");
  const modalTitle = document.getElementById("resModalTitle");
  const thumbBox = document.getElementById("resModalThumbBox");
  const badgesRow = document.getElementById("resModalBadgesRow");
  const fullTitle = document.getElementById("resModalFullTitle");
  const courseName = document.getElementById("resModalCourseName");
  const descEl = document.getElementById("resModalDesc");
  const metaGrid = document.getElementById("resModalMetaGrid");
  const tagsWrap = document.getElementById("resModalTagsWrap");
  const exactUrlEl = document.getElementById("resModalExactUrl");
  const openBtn = document.getElementById("resModalOpenBtn");
  const downloadBtn = document.getElementById("resModalDownloadBtn");
  const viewerFrame = document.getElementById("resViewerFrame");

  if (viewerFrame) {
    viewerFrame.src = "about:blank";
    viewerFrame.removeAttribute("data-loaded-url");
  }

  if (courseBadge) courseBadge.textContent = item.courseCode;
  if (modalTitle) modalTitle.textContent = item.title;

  if (thumbBox) {
    if (thumbUrl) {
      thumbBox.innerHTML = `
        <img
          src="${escapeHTML(thumbUrl)}"
          alt="${escapeHTML(item.title)}"
          class="res-modal-thumb-img"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="res-modal-thumb-fallback ${catInfo.cls}" style="display:none;">
          <i class="${catInfo.icon}"></i>
          <strong>${escapeHTML(item.courseCode)}</strong>
          <span>${escapeHTML(item.category)}</span>
        </div>
        ${hasDocUrl ? `
          <button type="button" class="res-thumb-reader-cta" id="resThumbOpenReaderBtn">
            <i class="fa-solid fa-book-open-reader"></i> Read
          </button>
        ` : ""}
      `;
    } else {
      thumbBox.innerHTML = `
        <div class="res-modal-thumb-fallback ${catInfo.cls}">
          <i class="${catInfo.icon}"></i>
          <strong>${escapeHTML(item.courseCode)} — ${escapeHTML(item.category)}</strong>
          <span>${hasDocUrl ? "Click 'Read' or 'Open Document' to view file" : "Thumbnail & Document URL can be added in " + escapeHTML(item.dept.toLowerCase()) + "-resource.js"}</span>
        </div>
        ${hasDocUrl ? `
          <button type="button" class="res-thumb-reader-cta" id="resThumbOpenReaderBtn">
            <i class="fa-solid fa-book-open-reader"></i> Read
          </button>
        ` : ""}
      `;
    }

    const openReaderBtn = document.getElementById("resThumbOpenReaderBtn");
    if (openReaderBtn) {
      openReaderBtn.addEventListener("click", () => {
        triggerHaptic();
        switchResourceModalTab("viewer");
      });
    }
  }

  if (badgesRow) {
    badgesRow.innerHTML = `
      <span class="res-category-pill ${catInfo.cls}">
        <i class="${catInfo.icon}"></i> ${escapeHTML(item.category)}
      </span>
      <span class="res-modal-badge-neutral">
        <i class="fa-solid fa-building-columns"></i> ${escapeHTML(item.dept)}
      </span>
      <span class="res-modal-badge-neutral">
        <i class="fa-solid fa-layer-group"></i> Level ${escapeHTML(item.level)} • Sem ${escapeHTML(item.semester)}
      </span>
      <span class="res-modal-badge-neutral">
        <i class="${isDrive ? "fa-brands fa-google-drive" : "fa-solid fa-file-pdf"}"></i> ${escapeHTML(item.fileType || "PDF")}
      </span>
    `;
  }

  if (fullTitle) fullTitle.textContent = item.title;
  if (courseName) {
    courseName.textContent = item.courseTitle
      ? `${item.courseCode} — ${item.courseTitle}`
      : item.courseCode;
  }
  if (descEl) {
    descEl.textContent = item.details || "No additional description provided.";
  }

  if (metaGrid) {
    const sharedByFull = item.sharedBy || item.author || `Dept. of ${item.dept}`;
    const cells = [
      { label: "Shared by -", val: sharedByFull, icon: "fa-solid fa-user-pen", fullWidth: true },
      { label: "Course Code", val: item.courseCode, icon: "fa-solid fa-hashtag" },
      { label: "Category", val: item.category, icon: "fa-solid fa-folder" },
      { label: "Level & Sem", val: `L${item.level} • S${item.semester}`, icon: "fa-solid fa-graduation-cap" }
    ];
    if (item.pages) cells.push({ label: "Pages", val: item.pages, icon: "fa-regular fa-file-lines" });
    if (item.size) cells.push({ label: "File Size", val: item.size, icon: "fa-solid fa-hard-drive" });
    if (item.session) cells.push({ label: "Session / Info", val: item.session, icon: "fa-regular fa-calendar" });

    metaGrid.innerHTML = cells.map(c => `
      <div class="res-meta-cell ${c.fullWidth ? "res-meta-cell-shared" : ""}">
        <span class="res-meta-label"><i class="${c.icon}"></i> ${escapeHTML(c.label)}</span>
        <strong class="res-meta-val">${escapeHTML(c.val)}</strong>
      </div>
    `).join("");
  }

  if (tagsWrap) {
    if (item.tags && item.tags.length > 0) {
      tagsWrap.innerHTML = item.tags.map(t =>
        `<button type="button" class="res-modal-tag-chip" data-tag="${escapeHTML(t)}">#${escapeHTML(t)}</button>`
      ).join("");
      tagsWrap.querySelectorAll(".res-modal-tag-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          triggerHaptic();
          const tagText = btn.getAttribute("data-tag") || "";
          closeResourceDetailModal();
          const searchInput = document.getElementById("resourceSearchInput");
          const clearBtn = document.getElementById("resourceClearBtn");
          if (searchInput) searchInput.value = tagText;
          if (clearBtn) clearBtn.style.display = tagText ? "block" : "none";
          resourceSearchQuery = tagText;
          renderResourcesView({ resetScroll: true });
        });
      });
    } else {
      tagsWrap.innerHTML = "";
    }
  }

  if (exactUrlEl) {
    if (hasDocUrl) {
      exactUrlEl.innerHTML = `<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" class="res-exact-link-anchor">${escapeHTML(item.url)}</a>`;
    } else {
      exactUrlEl.innerHTML = `<span class="res-link-empty">Not set yet — paste your Google Drive or PDF URL in <code>${escapeHTML(item.dept.toLowerCase())}-resource.js</code></span>`;
    }
  }

  if (openBtn) {
    if (hasDocUrl) {
      openBtn.href = item.url;
      openBtn.classList.remove("disabled");
      openBtn.onclick = null;
    } else {
      openBtn.href = "#";
      openBtn.classList.add("disabled");
      openBtn.onclick = (e) => {
        e.preventDefault();
        showToast(`Add document URL in ${item.dept.toLowerCase()}-resource.js first`, "fa-circle-exclamation");
      };
    }
  }

  if (downloadBtn) {
    downloadBtn.onclick = () => {
      triggerHaptic();
      const targetUrl = item.downloadUrl || item.url;
      if (!targetUrl || targetUrl === "#") {
        showToast(`Add document URL in ${item.dept.toLowerCase()}-resource.js first`, "fa-circle-exclamation");
        return;
      }
      downloadPdfDirect(targetUrl, `${item.courseCode}_${item.title}`);
    };
  }

  switchResourceModalTab("details");

  const bottomNav = document.querySelector(".bottom-nav");
  if (bottomNav) bottomNav.classList.add("nav-hidden");
  modal.classList.add("active");
}

function closeResourceDetailModal() {
  const modal = document.getElementById("resourceDetailModal");
  const viewerFrame = document.getElementById("resViewerFrame");
  const bottomNav = document.querySelector(".bottom-nav");
  if (bottomNav) bottomNav.classList.remove("nav-hidden");
  if (modal) modal.classList.remove("active");
  if (viewerFrame) {
    viewerFrame.onload = null;
    viewerFrame.src = "about:blank";
    viewerFrame.removeAttribute("data-loaded-url");
  }
  activeModalResource = null;
}

function initResourceModalControls() {
  const modal = document.getElementById("resourceDetailModal");
  const closeBtn = document.getElementById("closeResModalBtn");
  const tabDetails = document.getElementById("resModalTabDetails");
  const tabViewer = document.getElementById("resModalTabViewer");
  const copyBtn = document.getElementById("resModalCopyLinkBtn");
  const shareBtn = document.getElementById("resModalShareLinkBtn");

  if (closeBtn) closeBtn.addEventListener("click", closeResourceDetailModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeResourceDetailModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeResourceDetailModal();
    }
  });

  if (tabDetails) {
    tabDetails.addEventListener("click", () => {
      triggerHaptic();
      switchResourceModalTab("details");
    });
  }

  if (tabViewer) {
    tabViewer.addEventListener("click", () => {
      triggerHaptic();
      switchResourceModalTab("viewer");
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      triggerHaptic();
      if (!activeModalResource || !activeModalResource.url) {
        showToast("No document link provided yet", "fa-circle-exclamation");
        return;
      }
      copyLink(activeModalResource.url);
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      triggerHaptic();
      if (!activeModalResource || !activeModalResource.url) {
        showToast("No document link provided yet", "fa-circle-exclamation");
        return;
      }
      shareLink(activeModalResource.url, `${activeModalResource.courseCode} - ${activeModalResource.title}`);
    });
  }
}

/**
 * Full-Screen Resource Contributors Leaderboard Popup
 * - Automatically opens when entering Resources section
 * - Close button appears after 3 seconds (3000ms)
 * - Top 3 displayed prominently in 2nd - 1st - 3rd podium order with distinct highlight colors
 * - Remaining contributors (4th+) displayed row-by-row in a ranked list
 * - Positions calculated automatically based on upload counts from shared-by.js & resource files
 */
function getInitials(name) {
  const parts = String(name || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function computeRankedContributors() {
  // Load all 3 department resource datasets to count any dynamic sharedBy / uploadedBy items
  const [cseList, agList, bbaList] = await Promise.all([
    loadDepartmentResources("CSE"),
    loadDepartmentResources("AG"),
    loadDepartmentResources("BBA")
  ]);
  const allResources = [...(cseList || []), ...(agList || []), ...(bbaList || [])];

  // Count resources explicitly attributed via sharedBy / uploadedBy (or non-empty URL items)
  const dynamicCountsByName = new Map();
  allResources.forEach(item => {
    const rawContributor = String(item.sharedBy || "").trim();
    if (!rawContributor) return;
    const key = rawContributor.toLowerCase();
    dynamicCountsByName.set(key, (dynamicCountsByName.get(key) || 0) + 1);
  });

  const contributorMap = new Map();

  // Seed from shared-by.js
  if (Array.isArray(sharedByData)) {
    sharedByData.forEach((entry, idx) => {
      if (!entry || typeof entry !== "object") return;
      const name = String(entry.name || `Contributor ${idx + 1}`).trim();
      if (!name) return;
      const key = name.toLowerCase();
      const dp = String(entry.dp || entry.avatar || entry.image || entry.photo || "").trim();
      const dept = String(entry.dept || entry.department || "").trim();
      const baseUploads = Number(entry.uploads ?? entry.count ?? entry.totalUploads ?? 0) || 0;
      const dynamicUploads = dynamicCountsByName.get(key) || 0;
      const totalUploads = baseUploads + dynamicUploads;

      contributorMap.set(key, {
        name,
        dp,
        dept,
        uploads: totalUploads
      });
    });
  }

  // Also include any contributor mentioned via sharedBy in resource files even if not yet listed in shared-by.js
  dynamicCountsByName.forEach((count, key) => {
    if (!contributorMap.has(key)) {
      const sampleItem = allResources.find(r => String(r.sharedBy || "").trim().toLowerCase() === key);
      const displayName = sampleItem ? sampleItem.sharedBy : key;
      contributorMap.set(key, {
        name: displayName,
        dp: "",
        dept: sampleItem ? sampleItem.dept : "",
        uploads: count
      });
    }
  });

  // Sort descending by upload count so 1st, 2nd, 3rd, 4th+ positions are 100% automatic
  const sorted = Array.from(contributorMap.values()).sort((a, b) => {
    if (b.uploads !== a.uploads) return b.uploads - a.uploads;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

function buildContributorAvatarHTML(contributor, sizeClass = "") {
  const resolvedDp = resolveThumbnailUrl(contributor.dp || "");
  const initials = getInitials(contributor.name);
  if (resolvedDp) {
    return `
      <div class="res-lb-avatar ${sizeClass}">
        <img
          src="${escapeHTML(resolvedDp)}"
          alt="${escapeHTML(contributor.name)}"
          loading="lazy"
          decoding="async"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <span class="res-lb-avatar-fallback" style="display:none;">${escapeHTML(initials)}</span>
      </div>
    `;
  }
  return `
    <div class="res-lb-avatar ${sizeClass}">
      <span class="res-lb-avatar-fallback">${escapeHTML(initials)}</span>
    </div>
  `;
}

async function renderResourcesLeaderboard() {
  const podiumEl = document.getElementById("resLeaderboardPodium");
  const listEl = document.getElementById("resLeaderboardList");
  const totalCountEl = document.getElementById("resLbTotalCount");

  if (!podiumEl || !listEl) return;

  const ranked = await computeRankedContributors();
  if (totalCountEl) {
    totalCountEl.textContent = `${ranked.length} Total`;
  }

  const first = ranked[0] || null;
  const second = ranked[1] || null;
  const third = ranked[2] || null;
  const rest = ranked.slice(3);

  // Podium visual order: 2nd (Left) — 1st (Center, Largest) — 3rd (Right)
  const podiumSlots = [
    { data: second, place: 2, label: "2nd", badgeIcon: "fa-medal", colorClass: "podium-2nd" },
    { data: first, place: 1, label: "1st", badgeIcon: "fa-crown", colorClass: "podium-1st" },
    { data: third, place: 3, label: "3rd", badgeIcon: "fa-award", colorClass: "podium-3rd" }
  ];

  podiumEl.innerHTML = podiumSlots
    .map(slot => {
      if (!slot.data) {
        return `
          <div class="res-lb-podium-card ${slot.colorClass} is-empty">
            <div class="res-lb-podium-rank-pill">${slot.label}</div>
            <div class="res-lb-avatar podium-avatar">
              <span class="res-lb-avatar-fallback">—</span>
            </div>
            <div class="res-lb-podium-name">Open Slot</div>
            <div class="res-lb-podium-uploads">0 Uploads</div>
          </div>
        `;
      }
      const c = slot.data;
      const deptPill = c.dept
        ? `<span class="res-lb-podium-dept">${escapeHTML(c.dept)}</span>`
        : "";
      return `
        <div class="res-lb-podium-card ${slot.colorClass}">
          ${slot.place === 1 ? `<div class="res-lb-crown-floating" aria-hidden="true"><i class="fa-solid fa-crown"></i></div>` : ""}
          <div class="res-lb-podium-rank-pill">
            <i class="fa-solid ${slot.badgeIcon}"></i>
            <span>${slot.label}</span>
          </div>
          <div class="res-lb-podium-avatar-wrap">
            ${buildContributorAvatarHTML(c, "podium-avatar")}
            <span class="res-lb-rank-num-badge">${slot.place}</span>
          </div>
          <div class="res-lb-podium-name" title="${escapeHTML(c.name)}">${escapeHTML(c.name)}</div>
          ${deptPill}
          <div class="res-lb-podium-uploads">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <span><strong>${c.uploads}</strong> Upload${c.uploads === 1 ? "" : "s"}</span>
          </div>
        </div>
      `;
    })
    .join("");

  if (rest.length === 0) {
    listEl.innerHTML = `
      <div class="res-lb-empty-list">
        Add more contributors in <code>shared-by.js</code> to display 4th place and beyond.
      </div>
    `;
  } else {
    listEl.innerHTML = rest
      .map(c => {
        const deptBadge = c.dept
          ? `<span class="res-lb-row-dept">${escapeHTML(c.dept)}</span>`
          : "";
        return `
          <div class="res-lb-row" role="listitem">
            <div class="res-lb-row-left">
              <span class="res-lb-row-rank">#${c.rank}</span>
              ${buildContributorAvatarHTML(c, "row-avatar")}
              <div class="res-lb-row-info">
                <div class="res-lb-row-name">${escapeHTML(c.name)}</div>
                <div class="res-lb-row-meta">
                  ${deptBadge}
                  <span class="res-lb-row-uploads">
                    <i class="fa-solid fa-file-arrow-up"></i>
                    <span><strong>${c.uploads}</strong> Upload${c.uploads === 1 ? "" : "s"}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }
}

function openResourcesLeaderboard(options = { delayedClose: true }) {
  const modal = document.getElementById("resLeaderboardModal");
  const closeBtn = document.getElementById("closeResLeaderboardBtn");
  const timerBadge = document.getElementById("resLbTimerBadge");
  const timerText = document.getElementById("resLbTimerText");
  if (!modal) return;

  // Render latest leaderboard ranking
  renderResourcesLeaderboard();

  // Clear any existing timers
  if (resLeaderboardTimer) {
    clearTimeout(resLeaderboardTimer);
    resLeaderboardTimer = null;
  }
  if (resLeaderboardCountdownInterval) {
    clearInterval(resLeaderboardCountdownInterval);
    resLeaderboardCountdownInterval = null;
  }

  const bottomNav = document.querySelector(".bottom-nav");
  if (bottomNav) bottomNav.classList.add("nav-hidden");

  modal.classList.add("active");

  const useDelay = options && options.delayedClose !== false;
  if (useDelay) {
    resLeaderboardCanClose = false;
    if (closeBtn) closeBtn.classList.add("hidden");
    if (timerBadge) timerBadge.classList.remove("hidden");

    let remainingSec = 3;
    if (timerText) timerText.textContent = `${remainingSec}s`;

    resLeaderboardCountdownInterval = setInterval(() => {
      remainingSec -= 1;
      if (remainingSec > 0 && timerText) {
        timerText.textContent = `${remainingSec}s`;
      }
    }, 1000);

    // Reveal Close button after 3 seconds (3000ms)
    resLeaderboardTimer = setTimeout(() => {
      if (resLeaderboardCountdownInterval) {
        clearInterval(resLeaderboardCountdownInterval);
        resLeaderboardCountdownInterval = null;
      }
      resLeaderboardCanClose = true;
      if (timerBadge) timerBadge.classList.add("hidden");
      if (closeBtn) closeBtn.classList.remove("hidden");
    }, 3000);
  } else {
    resLeaderboardCanClose = true;
    if (timerBadge) timerBadge.classList.add("hidden");
    if (closeBtn) closeBtn.classList.remove("hidden");
  }
}

function closeResourcesLeaderboard() {
  if (!resLeaderboardCanClose) return;
  const modal = document.getElementById("resLeaderboardModal");
  const bottomNav = document.querySelector(".bottom-nav");

  if (resLeaderboardTimer) {
    clearTimeout(resLeaderboardTimer);
    resLeaderboardTimer = null;
  }
  if (resLeaderboardCountdownInterval) {
    clearInterval(resLeaderboardCountdownInterval);
    resLeaderboardCountdownInterval = null;
  }

  if (modal) modal.classList.remove("active");
  if (bottomNav) bottomNav.classList.remove("nav-hidden");
}

function initResourcesLeaderboardControls() {
  const modal = document.getElementById("resLeaderboardModal");
  const closeBtn = document.getElementById("closeResLeaderboardBtn");
  const openBtn = document.getElementById("openResLeaderboardBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      triggerHaptic();
      closeResourcesLeaderboard();
    });
  }

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      triggerHaptic();
      openResourcesLeaderboard({ delayedClose: false });
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal && resLeaderboardCanClose) {
        closeResourcesLeaderboard();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active") && resLeaderboardCanClose) {
      closeResourcesLeaderboard();
    }
  });
}

