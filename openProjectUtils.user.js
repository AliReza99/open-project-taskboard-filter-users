// ==UserScript==
// @name         Taskboard utils
// @namespace    http://tampermonkey.net/
// @version      2024-08-21
// @description  will create a box with all of the users so you're be able to filter tasks per specific user
// @author       Alireza Bahrani
// @match        https://taskboard.delinternet.com/*/taskboard
// @icon         https://www.google.com/s2/favicons?sz=64&domain=https://www.openproject.org
// @grant        none
// ==/UserScript==

(() => {
  let optionsPopulated = false;

  const refreshOptions = () => {
    console.log("refreshing options");

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

    const options = ["All", ...sortedUsers].map((name) => ({
      label: name,
      value: name,
    }));

    const currentSelection = selectInput.value;

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
  newElement.style.right = "10px";
  newElement.style.width = "200px";
  newElement.style.padding = "10px";
  newElement.style.backgroundColor = "lightgray";
  newElement.style.zIndex = "999999";

  const selectInput = document.createElement("select");

  selectInput.onchange = function () {
    const v = this.value;

    document
      .querySelectorAll(`tr[class]`)
      .forEach((e) => e.classList.remove("hide"));

    if (v === "All") return;

    document
      .querySelectorAll(`tr[class]:not(:has(a[title*='${v}']))`)
      .forEach((e) => e.classList.add("hide"));
  };

  newElement.appendChild(selectInput);
  document.body.appendChild(newElement);

  refreshOptions();

  const refreshInterval = setInterval(refreshOptions, 1000);
})();
