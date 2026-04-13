
function doGet(e) {
  var t = HtmlService.createTemplateFromFile('AppIndex');
  t.serverContext = JSON.stringify({
    token: (e && e.parameter && e.parameter.token) ? e.parameter.token : '',
    v: '1.0.0'
  });
  return t.evaluate()
    .setTitle(APP_CFG.ORG_NAME + ' Â· ' + APP_CFG.APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


