console.log('I... am a devpage script!')

browser.devtools.panels
  .create(
    "My Panel", // title
    "/public/icons/star.png", // icon
    "/devtool_panel.html", // content
  )
  .then((newPanel) => {
    console.log('made a new panel!')
  });
