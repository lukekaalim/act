console.log('I... am a devpage script!')

const main = async () => {
  const panel = await browser.devtools.panels.create(
      "My Panel", // title
      "/public/icons/star.png", // icon
      "/devtool_panel.html", // content
    );
}

main();

export {};