// used for executing python files
const exec = require('child_process').exec
// print python output to nodejs console
const nodeConsole = require('console')
const myConsole = new nodeConsole.Console(process.stdout, process.stderr)

function addFileToList (e) {
  e.preventDefault()

  if (e.dataTransfer.items) {
    // use DataTransferItemList interface to access the file(s)
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      // if dropped items aren't files, reject them
      if (e.dataTransfer.items[i].kind === 'file') {
        let file = e.dataTransfer.items[i].getAsFile()
        console.log('file[' + i + '].name = ' + file.name)
        // check if got a python file
        if (file.type === 'text/x-python-script') {
          let doc = {
            addedOn: new Date(),
            path: file.path,
            logs: []
          }
          // add file info to database
          // and update view
          db.insert(doc, function (err, doc) {
            prepareFileView(doc)
          })
          toastr.success('File added to list')
        } else {
          toastr.error('Please only add valid python files')
        }
      }
    }
  } else {
    // TODO:
  }
}

function prepareFileView (file) {
  let fileName = file.path.split('/').pop()
  let onlyFilePath = file.path.replace(fileName, '')
  // create view
  let temp = $('#fileList > .file-template').clone()
  temp.removeClass('file-template')
  temp.addClass('file')
  // display
  temp.removeAttr('style')
  // add file info's
  temp.find('.file-name').text(fileName)
  temp.find('.path').text(onlyFilePath)
  temp.find('.added-on').text(file.addedOn)
  temp.attr('data-id', file._id)
  temp.find('.execute').attr('data-path', file.path)
  // create cronJob
  if (file.cronJob) {
    // add cronJob info as attribute
    temp.find('.cron-info').attr('data-cron', file.cronJob)
    // add cronJob info to view
    temp.find('.cron-info').text(file.humanCron)
  } else {
    temp.find('.cron-info').text('No timer set')
  }
  // append view to dom
  temp.appendTo('#fileList')
  // add logs to view
  for (let i = 0; i < file.logs.length; i++) {
    addLogToView(file._id, file.logs[i])
  }
}

function executePythonFile (file) {
  let fileName = file.path.split('/').pop()
  toastr.info('Executing file: ' + fileName + ' [' + file.path + ']')
  let child = exec('python -i ' + file.path, function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error)
    }
  })
  // this is a listener for peers output
  child.stdout.on('data', function (data) {
    // print python output to nodejs console
    myConsole.log('executing ' + file.path)
    myConsole.log('output:')
    myConsole.log(data.toString())
    // print python output to developer console
    console.log(data.toString())
    // save python output
    let log = {
      executedOn: new Date(),
      output: data.toString()
    }
    db.update({ _id: file._id }, { $push: { logs: log } })
    // update view
    addLogToView(file._id, log)
  })
}

function addLogToView (fileId, log) {
  let file = $('#fileList > .file' + '[data-id=' + fileId + ']')
  let logTemp = file.find('.log-template').clone()
  logTemp.removeClass('log-template')
  // add time
  logTemp.find('.time').text(log.executedOn)
  // prepare output
  let output = log.output.split('\n')
  // add lines
  output.forEach(function (line) {
    let lineTemp = file.find('.line-template').clone()
    lineTemp.removeClass('line-template')
    // add text
    lineTemp.append(document.createTextNode(line))
    // display
    lineTemp.removeAttr('style')
    logTemp.find('.output').append(lineTemp)
  })
  // display
  logTemp.removeAttr('style')
  // append
  file.find('.logs-container > .logs').prepend(logTemp)
  file.find('.message-empty').hide()
}

function clearFileList (e) {
  // clear database
  db.remove({}, { multi: true }, function (err, numRemoved) {
    console.log('removed ' + numRemoved + ' document(s)')
  })
  // save #cron tool
  $('#cron').detach().appendTo('#cronContainer')
  // save .file-template
  let fileTemplate = $('#fileList .file-template').detach()
  // remove all files from dom
  $('#fileList > li').remove()
  // put .file-template back
  $('#fileList').append(fileTemplate)
  // stop and delete all cronJobs
  resetCronManager()
  toastr.success('Database cleared')
}
