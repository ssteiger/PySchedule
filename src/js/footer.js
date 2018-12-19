const { dialog } = require('electron').remote

document.addEventListener('DOMContentLoaded', function () {
  // footer
  $('#footer').on('click', '#showContent', function (e) {
    $('#footer .content').slideToggle()
  })

  // search
  $('#footer').keyup(function (e) {
    // save #cron
    $('#cron').detach().appendTo('#cronContainer')

    let input = $('#searchInput').val()
    if (input === '') {
      // TODO: skip if all files are already displayed
      // remove all search results
      $('#fileList').find('li.file').remove()
      // restore initial file list
      initContent()
    } else {
      let regex = new RegExp(input)
      // query documents
      db.find({ path: { $regex: regex } }, function (err, docs) {
        // if there are results
        if (docs.length > 0) {
          // clear current file list
          $('#fileList').find('li.file').remove()
          // append elements in query to list
          docs.forEach(function (doc) {
            prepareFileView(doc)
          })
        }
      })
    }
  })

  // file drop event
  document.getElementById('fileDropArea').ondrop = function (e) {
    addFileToList(e)
  }
  // file drag event
  document.ondragover = document.ondrop = function (e) {
    e.preventDefault()
    // TODO:
    // console.log('ondragover')
  }
  // click file drop area
  $('#fileDropArea').on('click', function (e) {
    dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }, function (files) {
      if (files !== undefined) {
        // handle files
        files.forEach(function (file) {
          let doc = {
            path: file,
            addedOn: new Date()
          }
          db.insert(doc, function (err, doc) {
            prepareFileView(doc)
          })
        })
      }
    })
  })

  $('#clearDb').on('click', function () {
    clearFileList()
  })
})
