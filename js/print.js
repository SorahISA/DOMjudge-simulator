"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("print-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    window.location.href = "print-error.html";
  });
});
