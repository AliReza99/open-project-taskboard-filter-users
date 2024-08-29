// ==UserScript==
// @name         Taskboard utils
// @namespace    http://tampermonkey.net/
// @version      2024-08-21
// @description  will create a box with all of the users so you're be able to filter tasks per specific user
// @author       Alireza Bahrani
// @match        https://taskboard.delinternet.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=https://www.openproject.org
// @grant        none
// ==/UserScript==

function getFilterParameter() {
  const url = new URL(window.location);
  return url.searchParams.get("filter");
}

function setFilterParameter(filterValue) {
  const url = new URL(window.location);
  url.searchParams.set("filter", filterValue);
  window.history.replaceState({}, "", url);
}

function addStylesToHead(styles) {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}

function runWithInterval(intervalFn, stopConditionFn, intervalTime = 1000) {
  const intervalId = setInterval(() => {
    intervalFn();

    if (stopConditionFn()) {
      clearInterval(intervalId);
    }
  }, intervalTime);
}

function setTaskboardItemsFullWidth() {
  runWithInterval(
    () => {
      const inputElement = document.querySelector(".toolbar-input-group input");

      if (inputElement) {
        inputElement.value = "2";

        inputElement.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13, // Deprecated, but still commonly used
            which: 13, // Deprecated, but still commonly used
            bubbles: true,
          })
        );
      }
    },
    () => {
      const inputElement = document.querySelector(".toolbar-input-group input");
      return Boolean(inputElement);
    }
  );

  const styles = `
    .swimlane>div {
      width: 200px !important;
    }
    .swimlane>div>div {
      width: 190px !important;
    }
  `;

  addStylesToHead(styles);
}

function saveContentBodyScrollPosition() {
  localStorage.setItem(
    "contentBodyScrollPosition",
    document.querySelector("#content-body").scrollTop
  );
}

function listenAndSaveContentBodyScrollPosition() {
  const contentBody = document.querySelector("#content-body");
  contentBody.addEventListener("scroll", saveContentBodyScrollPosition);
}

function restoreContentBodyScrollPosition() {
  const scrollPosition = localStorage.getItem("contentBodyScrollPosition");
  if (!scrollPosition) return;
  document.querySelector("#content-body").scrollTo(0, Number(scrollPosition));
}

function initializeTaskboardUtils() {
  let optionsPopulated = false;

  const filterValue = getFilterParameter();

  const refreshOptions = () => {
    if (optionsPopulated) {
      clearInterval(refreshInterval);
      return;
    }

    const users = new Set();
    document.querySelectorAll(`tr[class] a[title]`).forEach((e) => {
      const name = e.innerText;
      if (!name) return;
      users.add(name);
    });

    const sortedUsers = [...users].sort();

    if (sortedUsers.length !== 0) {
      optionsPopulated = true;
    }

    const options = ["All", "Unassigned", ...sortedUsers].map((name) => ({
      label: name,
      value: name,
    }));

    const currentSelection = filterValue || selectInput.value;

    selectInput.innerHTML = "";

    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      selectInput.appendChild(optionElement);
    });

    if (options.some((option) => option.value === currentSelection)) {
      selectInput.value = currentSelection;
    } else {
      selectInput.value = "All";
    }
  };

  const newElement = document.createElement("div");

  newElement.style.position = "fixed";
  newElement.style.bottom = "10px";
  newElement.style.right = "1rem";
  newElement.style.width = "200px";
  newElement.style.padding = "8px";
  newElement.style.borderRadius = "4px";
  newElement.style.backgroundColor = "lightgray";
  newElement.style.zIndex = "999999";

  const selectInput = document.createElement("select");

  function hideRowsExcept(v) {
    document
      .querySelectorAll(`tr[class]`)
      .forEach((e) => e.classList.remove("hide"));

    if (v === "All" || !v) return;
    if (v === "Unassigned") {
      document
        .querySelectorAll(`tr[class]:has(a[title])`)
        .forEach((e) => e.classList.add("hide"));
      return;
    }

    document
      .querySelectorAll(`tr[class]:not(:has(a[title*='${v}']))`)
      .forEach((e) => e.classList.add("hide"));
  }

  hideRowsExcept(filterValue);

  selectInput.onchange = function () {
    const v = this.value;

    setFilterParameter(v);
    hideRowsExcept(this.value);
  };

  newElement.appendChild(selectInput);
  document.body.appendChild(newElement);

  refreshOptions();

  const refreshInterval = setInterval(refreshOptions, 1000);
}

function initializeBacklogsUtils() {
  function collapseToggles() {
    const togglers = document.querySelectorAll("#content-body .toggler");
    if (togglers.length === 0) return;
    clearInterval(refreshInterval);
    togglers.forEach((e) => e.click());
  }

  const refreshInterval = setInterval(collapseToggles, 1000);
}

const globalStyles = `
  .op-app-header{
    background: rgba(22, 26, 29, 0.9) !important;
  }
  .op-logo{
    opacity: .4
  }
  #taskboard td>div{
    height: 120px !important;
    border-radius: 6px;
  }
  #taskboard .work_package .id{
    top: .25rem;
  }
  #taskboard .work_package .id, #taskboard .story-bar{
    background: transparent !important;
    position: relative;
  }
  #taskboard .work_package .subject.editable{
    margin-top: -1rem;
    padding-right: 2rem;
  }
  .work_package.dark .id a{
    color: #fff !important;
  }
  .work_package.light .id a{
    color: #000 !important;
  }

  #taskboard .work_package .assigned_to_id.editable{
    position: absolute;
    bottom: .5rem;
    left: .5rem;
  }
  #taskboard .work_package .subject.editable, #taskboard .subject{
    height: auto !important;
    line-height: 1.5 !important;
  }
  #taskboard .story-footer{
    position: absolute;
    bottom: .5rem;
    left: .5rem;
    width: 90%;
  }
  #col_width{
    opacity: 0;
    user-select: none;
    pointer-events: none;
  }
`;

function applyGlobalStyles() {
  addStylesToHead(globalStyles);

  const r = document.querySelector(":root");
  r.style.setProperty("--header-item-font-color", "rgb(159, 173, 188)");
  r.style.setProperty("--main-menu-font-color", "rgb(159, 173, 188)");
  r.style.setProperty("--main-menu-bg-color", "rgba(22, 26, 29, 0.9)");
}

(() => {
  const urlPath = window.location.pathname;
  applyGlobalStyles();

  if (urlPath.endsWith("/taskboard")) {
    initializeTaskboardUtils();
    setTaskboardItemsFullWidth();
    listenAndSaveContentBodyScrollPosition();
    restoreContentBodyScrollPosition();
  }
  if (urlPath.endsWith("/backlogs")) {
    initializeBacklogsUtils();
  }
})();
