console.log('Im a devtools page')

browser.devtools.panels
  .create(
    "My Panel", // title
    "/icons/star.png", // icon
    "/devtools/panel/index.html", // content
  )
  .then((newPanel) => {
    console.log('made a new panel!')
  });
