// Gathers up in the information that you need from webpage
var pageInfo = {
  "url": window.location.href
};

// Sends the information back to background.js
chrome.runtime.sendMessage(pageInfo);
console.log(pageInfo);
