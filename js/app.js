import { CvDataError, loadCvData } from "./data-loader.js";
import { renderCv, updateDocumentMetadata } from "./renderer.js";

const THEME_STORAGE_KEY = "cv-theme";
const themeToggle = document.getElementById("theme-toggle");
const classicStylesheet = document.getElementById("theme-classic");
const modernStylesheet = document.getElementById("theme-modern");
const themeColorMeta = document.getElementById("theme-color");

const elements = {
  main: document.getElementById("main-content"),
  cvRoot: document.getElementById("cv-root"),
  status: document.getElementById("loading-status"),
  errorPanel: document.getElementById("error-panel"),
  errorTitle: document.getElementById("error-title"),
  errorMessage: document.getElementById("error-message"),
  retryButton: document.getElementById("retry-button"),
  printButton: document.getElementById("print-button"),
};

let isLoading = false;

setupTheme();

const missingElements = Object.entries(elements)
  .filter(([, element]) => !element)
  .map(([name]) => name);

if (missingElements.length > 0) {
  console.error(`CV application could not start. Missing elements: ${missingElements.join(", ")}`);
} else {
  elements.printButton.addEventListener("click", () => window.print());
  elements.retryButton.addEventListener("click", initialize);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
}

async function initialize() {
  if (isLoading) {
    return;
  }

  isLoading = true;
  beginLoading();

  try {
    const data = await loadCvData();

    renderCv(elements.cvRoot, data);
    updateDocumentMetadata(data.personal, data.summary);

    elements.status.hidden = true;
    elements.errorPanel.hidden = true;
    elements.main.setAttribute("aria-busy", "false");
    elements.printButton.hidden = false;
  } catch (error) {
    console.error("Unable to load the CV:", error);
    showError(error);
  } finally {
    isLoading = false;
  }
}

function beginLoading() {
  elements.status.textContent = "Loading CV…";
  elements.status.hidden = false;
  elements.errorPanel.hidden = true;
  elements.printButton.hidden = true;
  elements.cvRoot.replaceChildren();
  elements.main.setAttribute("aria-busy", "true");
}

function showError(error) {
  const message =
    error instanceof CvDataError
      ? error.message
      : "The CV could not be displayed. Please reload the page and try again.";

  elements.status.hidden = true;
  elements.cvRoot.replaceChildren();
  elements.errorMessage.textContent = message;
  elements.errorPanel.hidden = false;
  elements.main.setAttribute("aria-busy", "false");
  elements.printButton.hidden = true;
  elements.errorTitle.focus();
}

function setupTheme() {
  if (!themeToggle) {
    return;
  }

  const initialTheme =
    document.documentElement.dataset.theme === "classic" ? "classic" : "modern";

  applyTheme(initialTheme, false);

  themeToggle.addEventListener("change", () => {
    applyTheme(themeToggle.checked ? "classic" : "modern", true);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(event.newValue === "classic" ? "classic" : "modern", false);
    }
  });
}

function applyTheme(theme, persist) {
  const isClassic = theme === "classic";
  const activeTheme = isClassic ? "classic" : "modern";

  document.documentElement.dataset.theme = activeTheme;

  if (classicStylesheet) {
    classicStylesheet.media = isClassic ? "all" : "not all";
  }

  if (modernStylesheet) {
    modernStylesheet.media = isClassic ? "not all" : "all";
  }

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", isClassic ? "#f1e8d7" : "#fcfcfa");
  }

  themeToggle.checked = isClassic;

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    } catch {
      // The theme still applies for this page even if storage is unavailable.
    }
  }
}
