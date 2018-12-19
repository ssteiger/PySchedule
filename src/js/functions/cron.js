function createCronJob (file) {
  // TODO: implement time zones
  // let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // if a cronJob already exists -> update
  if (cronManager.exists(file._id)) {
    cronManager.update(file.id, file.cronJob, function () {
      executePythonFile(file)
    })
  } else {
    // create cronJob from cronValueString
    cronManager.add(file._id, file.cronJob, function () {
      executePythonFile(file)
    })
    // activate cronJob
    cronManager.start(file._id)
  }
  // shorten long redundant humanCron
  if (file.cronJob === '* * * * *') {
    file.humanCron = 'Every minute'
  }
  // save cronJob in database
  db.update({ _id: file.fileId }, { $set: { cronJob: file.cronJob, humanCron: file.humanCron } })
}

function disableCron (fileId) {
  if (cronManager.exists(fileId)) {
    console.log('cronJob found -> stopping')
    // disable cronJob
    cronManager.stop(fileId)
    toastr.success('Timer disabled')
  } else {
    console.log('error: cronJob does not exist')
  }
}
