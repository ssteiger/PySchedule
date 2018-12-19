const { app, BrowserWindow } = require('electron')

app.on('window-all-closed', function () {
  app.quit()
})

app.on('ready', function () {
  let gui = new BrowserWindow({ height: 700, width: 1000, resizable: true })
  gui.loadURL('file://' + __dirname + '/index.html')

  gui.on('closed', function () {
    app.quit()
  })
})
