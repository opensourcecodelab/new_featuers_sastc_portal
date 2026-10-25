/**
 * Utility functions for SASTC Portal
 */

export function escapeJS(str) {
  return String(str ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

export function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeSearchText(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(/[।\,\-\_\.\:\;\']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getNoticeKey(item) {
  return item._key || `${item.title || ''}_${item.date || ''}_${item.url || item.pdf_url || item.link || ''}`;
}

export function getNoticeDate(item) {
  if (!item || !item.date) return null;
  const d = new Date(item.date);
  return isNaN(d.getTime()) ? null : d;
}

export function formatPdfUrl(rawLink) {
  if (!rawLink || rawLink === "#") return "";
  let url = String(rawLink).trim();
  if (url.startsWith("/")) {
    url = "https://hstu.ac.bd" + url;
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url.replace(/'/g, "%27");
}

/**
 * Debounce helper for fast and smooth search input
 */
export function debounce(func, wait = 180) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function extractGoogleDriveFileId(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (!url.includes("drive.google.com") && !url.includes("docs.google.com")) return null;
  if (/\/drive\/(?:u\/\d+\/)?folders\//i.test(url)) return null;

  const fileMatch = url.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  return null;
}

export function isGoogleDriveFolderUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  return /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//i.test(rawUrl.trim());
}

export function resolveThumbnailUrl(rawThumb) {
  if (!rawThumb || typeof rawThumb !== "string") return "";
  const trimmed = rawThumb.trim();
  if (!trimmed || trimmed === "#") return "";
  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId && trimmed.includes("drive.google.com") && !trimmed.includes("/thumbnail?")) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
  }
  return trimmed;
}

export function getEmbedPreviewUrl(rawUrl) {
  if (!rawUrl || rawUrl === "#") return "";
  const url = String(rawUrl).trim();
  if (isGoogleDriveFolderUrl(url)) return "";

  const rkMatch = url.match(/[?&]resourcekey=([a-zA-Z0-9_-]+)/i);
  const rkQuery = rkMatch && rkMatch[1] ? `?resourcekey=${encodeURIComponent(rkMatch[1])}` : "";

  const driveId = extractGoogleDriveFileId(url);
  if (driveId) {
    if (url.includes("docs.google.com/document/")) {
      return `https://docs.google.com/document/d/${driveId}/preview${rkQuery}`;
    }
    if (url.includes("docs.google.com/spreadsheets/")) {
      return `https://docs.google.com/spreadsheets/d/${driveId}/preview${rkQuery}`;
    }
    if (url.includes("docs.google.com/presentation/")) {
      return `https://docs.google.com/presentation/d/${driveId}/preview${rkQuery}`;
    }
    return `https://drive.google.com/file/d/${driveId}/preview${rkQuery}`;
  }

  if (url.endsWith(".pdf") || url.includes("/pdf")) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
}

export function getDirectDownloadUrl(rawUrl, title = "SASTC_Document") {
  if (!rawUrl || rawUrl === "#") return "";
  const url = String(rawUrl).trim();
  const rkMatch = url.match(/[?&]resourcekey=([a-zA-Z0-9_-]+)/i);
  const rkParam = rkMatch && rkMatch[1] ? `&resourcekey=${encodeURIComponent(rkMatch[1])}` : "";

  const driveId = extractGoogleDriveFileId(url);
  if (driveId) {
    if (url.includes("docs.google.com/document/")) {
      return `https://docs.google.com/document/d/${driveId}/export?format=pdf${rkParam}`;
    }
    if (url.includes("docs.google.com/spreadsheets/")) {
      return `https://docs.google.com/spreadsheets/d/${driveId}/export?format=pdf${rkParam}`;
    }
    if (url.includes("docs.google.com/presentation/")) {
      return `https://docs.google.com/presentation/d/${driveId}/export/pdf`;
    }
    return `https://drive.google.com/uc?export=download&id=${driveId}${rkParam}`;
  }
  if (isGoogleDriveFolderUrl(url)) {
    return url;
  }
  const safeTitle = String(title).replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60) || "SASTC_Document";
  const filename = safeTitle.toLowerCase().endsWith(".pdf") ? safeTitle : `${safeTitle}.pdf`;
  return `/api/download-pdf?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
}

export function downloadPdfDirect(url, title = "SASTC_Document") {
  if (!url || url === "#") {
    showToast("No document link provided yet", "fa-circle-exclamation");
    return;
  }

  const driveId = extractGoogleDriveFileId(url);
  const isFolder = isGoogleDriveFolderUrl(url);
  const downloadEndpoint = getDirectDownloadUrl(url, title);

  const link = document.createElement("a");
  link.href = downloadEndpoint;
  if (driveId || isFolder) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  } else {
    const safeTitle = String(title).replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60) || "SASTC_Document";
    const filename = safeTitle.toLowerCase().endsWith(".pdf") ? safeTitle : `${safeTitle}.pdf`;
    link.setAttribute("download", filename);
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(isFolder ? "Opening Google Drive folder..." : "Starting download...", "fa-download");
}

export function openPdfModal(url, title, textContentBase64 = null) {
  const modal = document.getElementById("pdfModal");
  const pdfFrame = document.getElementById("pdfFrame");
  const pdfLoadingState = document.getElementById("pdfLoadingState");
  const modalTitle = document.getElementById("modalNoticeTitle");
  const modalDirectLink = document.getElementById("modalDirectLink");
  const modalDownloadBtn = document.getElementById("modalDownloadBtn");
  const modalTextContent = document.getElementById("modalTextContent");
  const modalFooter = document.getElementById("modalFooter");

  if (!modal) return;

  modalTitle.textContent = title || "Notice Document";

  if (textContentBase64 && textContentBase64 !== "null") {
    // Show text mode
    if (pdfLoadingState) pdfLoadingState.style.display = "none";
    if (pdfFrame) pdfFrame.style.display = "none";
    if (modalDirectLink) modalDirectLink.style.display = "none";
    if (modalFooter) modalFooter.style.display = "none";
    if (modalTextContent) {
      modalTextContent.style.display = "block";
      const decoded = decodeURIComponent(textContentBase64);
      modalTextContent.innerHTML = decoded.replace(/<img\s+/gi, '<img loading="lazy" decoding="async" ');
    }
  } else {
    // Show PDF mode
    if (modalTextContent) modalTextContent.style.display = "none";
    if (pdfFrame) {
      pdfFrame.style.display = "block";
      if (url && url !== "#") {
        if (pdfLoadingState) pdfLoadingState.style.display = "flex";
        pdfFrame.onload = () => {
          if (pdfLoadingState) pdfLoadingState.style.display = "none";
        };
        const embedUrl = getEmbedPreviewUrl(url);
        pdfFrame.src = embedUrl || url;
      } else {
        if (pdfLoadingState) pdfLoadingState.style.display = "none";
        pdfFrame.src = "about:blank";
      }
    }
    if (modalDirectLink) {
      modalDirectLink.style.display = "inline-flex";
      modalDirectLink.href = url || "#";
    }
    if (modalDownloadBtn) {
      modalDownloadBtn.style.display = (url && url !== "#") ? "inline-flex" : "none";
      modalDownloadBtn.onclick = () => downloadPdfDirect(url, title || "SASTC_Notice");
    }
    if (modalFooter) modalFooter.style.display = "flex";
  }

  const bottomNav = document.querySelector(".bottom-nav");
  if (bottomNav) bottomNav.classList.add("nav-hidden");

  modal.classList.add("active");
}

export function closePdfModal() {
  const modal = document.getElementById("pdfModal");
  const pdfFrame = document.getElementById("pdfFrame");
  const pdfLoadingState = document.getElementById("pdfLoadingState");
  const bottomNav = document.querySelector(".bottom-nav");
  if (bottomNav) bottomNav.classList.remove("nav-hidden");

  if (modal) modal.classList.remove("active");
  if (pdfLoadingState) pdfLoadingState.style.display = "none";
  if (pdfFrame) {
    pdfFrame.onload = null;
    pdfFrame.src = "about:blank";
  }
}

let toastTimer;
export function showToast(message, iconClass = "fa-circle-check") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  if (toastIcon) toastIcon.className = `fa-solid ${iconClass}`;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

export async function shareLink(url, title = "SASTC Notice") {
  if (!url || url === "#") {
    showToast("No valid link available to share", "fa-circle-exclamation");
    return;
  }
  
  const appUrl = window.location.href.split('#')[0];
  const shareText = `📌 ${title}\n\n📄 Document Link: ${url}\n\n🌐 Shared via SASTC Portal:\n${appUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: shareText
      });
      showToast("Link shared successfully!", "fa-circle-check");
    } catch (err) {
      if (err.name !== 'AbortError') {
         copyLink(shareText);
      }
    }
  } else {
    copyLink(shareText);
  }
}

export function copyLink(url) {
  if (!url || url === "#") {
    showToast("No valid link available to copy", "fa-circle-exclamation");
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = url;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand("copy");
    showToast("Link copied to clipboard!", "fa-circle-check");
  } catch (err) {
    showToast("Failed to copy link", "fa-circle-xmark");
  }
  document.body.removeChild(textArea);
}

export function handleNoticeClick(e, url, title, textContentBase64 = null) {
  if (e) e.preventDefault();
  if ((url && url !== "#") || textContentBase64) openPdfModal(url, title, textContentBase64);
}

export function handlePdfView(e, url, title, textContentBase64 = null) {
  if (e) e.preventDefault();
  if ((url && url !== "#") || textContentBase64) {
    openPdfModal(url, title, textContentBase64);
  } else {
    showToast("PDF document link unavailable", "fa-circle-exclamation");
  }
}

export function initSecurityProtections() {
  // Disable drag
  document.addEventListener("dragstart", (e) => e.preventDefault());

  // Disable right-click context menu
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // Disable text selection start (except inside input/textarea/select)
  document.addEventListener("selectstart", (e) => {
    const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : "";
    if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
      e.preventDefault();
    }
  });

  // Disable copy & cut shortcuts on page content
  document.addEventListener("copy", (e) => {
    const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : "";
    if (tag !== "INPUT" && tag !== "TEXTAREA") {
      e.preventDefault();
    }
  });

  document.addEventListener("cut", (e) => {
    const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : "";
    if (tag !== "INPUT" && tag !== "TEXTAREA") {
      e.preventDefault();
    }
  });

  // Block keyboard shortcuts (Ctrl/Cmd/Alt combinations, F1-F12, PrintScreen, etc.)
  document.addEventListener("keydown", (e) => {
    const key = (e.key || "").toLowerCase();

    // Block function keys (F1 - F12)
    if (/^f([1-9]|1[0-2])$/i.test(e.key) || e.keyCode >= 112 && e.keyCode <= 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block any Ctrl, Meta (Cmd), or Alt shortcut combinations
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block PrintScreen
    if (key === "printscreen") {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
}

/**
 * Calculates and returns tag text and CSS class based on creation timestamp.
 * @param {string|number|Date} dateInput - Created date/timestamp
 * @returns {{ text: string, className: string } | null}
 */
export function getTagInfo(dateInput) {
  if (!dateInput) return null;

  const createdDate = new Date(dateInput);
  const now = new Date();
  const diffInMs = now - createdDate;

  // Invalid date or future date check
  if (isNaN(createdDate.getTime()) || diffInMs < 0) return null;

  const diffInHours = diffInMs / (1000 * 60 * 60);

  // Less than 24 hours -> NEW Tag
  if (diffInHours < 24) {
    return { text: 'NEW', className: 'tag-new' };
  }

  // Calculate full days passed
  const diffInDays = Math.floor(diffInHours / 24);

  // 1 to 7 days ago
  if (diffInDays >= 1 && diffInDays <= 7) {
    const label = `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    return { text: label, className: 'tag-recent' };
  }

  // Older than 7 days -> No Tag
  return null;
}

/**
 * Helper to format standard dates
 */
export function formatDate(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
export function formatDateString(dateStr) {
  if (!dateStr || dateStr === "N/A") return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
