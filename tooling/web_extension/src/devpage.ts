console.log('I... am a devpage script!')

const main = async () => {
  const panel = await browser.devtools.panels.create(
      "@lukekaalim/act", // title
      "/public/icons/act-logo-black.png", // icon
      "/devtool_panel.html", // content
    );
}

main();

export {};