/// <reference types="@types/firefox-webext-browser" />

browser.devtools.panels
  .create(
    "My Panel", // title
    "/icons/star.png", // icon
    "/panel/index.html", // content
  )
  .then((newPanel) => {
    console.log('made a new panel!')
  });
