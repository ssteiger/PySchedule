// notifications
const toastr = require('toastr')
toastr.options = {
  'closeButton': true,
  'positionClass': 'toast-top-full-width',
  'preventDuplicates': true,
  'onclick': null,
  'showDuration': '300',
  'hideDuration': '1000',
  'timeOut': '5000',
  'extendedTimeOut': '10000',
  'showEasing': 'swing',
  'hideEasing': 'linear',
  'showMethod': 'slideDown',
  'hideMethod': 'slideUp',
  'closeMethod': 'slideUp'
}

function initContent () {
  // get all files stored in database/datafile
  db.find({
    path: {
      $exists: true
    }
  }, function (err, docs) {
    // add each file to view and create/start the cornJob
    docs.forEach(function (file) {
      prepareFileView(file)
      if (file.cronJob) {
        createCronJob(file)
      }
    })
  })
}

// helper function for hiding all
// relevant cron settings from view
function hideJqCron () {
  let cron = $('#cron')
  let cronSettings = cron.parent().find('.cron-settings-container')
  let currentCronText = cron.parent().find('.cron-info')
  let editButton = cron.parent().find('.edit-timer')
  cronSettings.hide()
  cron.hide()
  currentCronText.show()
  editButton.show()
}

document.addEventListener('DOMContentLoaded', function () {
  // NOTE: markup added to the DOM asynchronously
  //       -> for events need to move the child element to the .on() selector

  // init jqCron
  let jqCronInstance = $('#cron').jqCron({
    enabled_minute: true,
    multiple_dom: true,
    multiple_month: true,
    multiple_mins: true,
    multiple_dow: true,
    multiple_time_hours: true,
    multiple_time_minutes: true,
    numeric_zero_pad: true, // 01 or 1
    no_reset_button: false,
    bind_to: $('#cron .current-value'),
    bind_method: {
      set: function ($element, value) {
        $element.html(value)
      }
    }
  })

  // move buttons beneath jqCron
  // TODO: don't be lazy and do this more elegantly!
  $('#cron > .action-buttons').detach().appendTo('#cron')

  initContent()

  // display controls on hover
  $('#fileList').on('mouseover', '.file', function (e) {
    let file = $(this)
    file.find('.execute').show()
    file.find('.show-logs').show()
  })
  $('#fileList').on('mouseleave', '.file', function (e) {
    let file = $(this)
    file.find('.execute').hide()
    file.find('.show-logs').hide()
  })

  // execute file manually
  $('#fileList').on('click', '.execute', function (e) {
    let file = $(this).parents('.file')
    let fileId = file.attr('data-id')
    db.findOne({ _id: fileId }, function (err, doc) {
      executePythonFile(doc)
    })
  })

  // show and hide logs-container
  $('#fileList').on('click', '.show-logs', function (e) {
    let button = $(this)
    let logsContainer = button.parents('.file').find('.logs-container').slideToggle(400, function () {
      let visibility = window.getComputedStyle(logsContainer[0]).display
      // update text on button
      let text
      visibility == 'none' ? text = 'show logs' : text = 'hide logs'
      button.text(text)
    })

    $(this).text('hide logs')
  })

  // edit cronJob time
  $('#fileList').on('click', '.edit-timer', function (e) {
    let cron = $('#cron')
    let button = $(this)

    let cronSettings = button.parent().parent().parent().find('.cron-settings-container')
    let currentCronText = button.parent().parent().find('.cron-info')
    let cronValueString = currentCronText.attr('data-cron')

    // reset if no valid timer selected
    if (currentCronText.text() === 'No timer set') {
      cronValueString = '* * * * *'
    }
    // set view of jqCron to match current timer
    jqCronInstance.data('jqCron').setCron(cronValueString)

    // show and hide cronSettings
    let cs_are_attached_here = button.parent().parent().find('#cron').length === 1
    let cs_are_visible = cron.is(':visible')

    // if #cron is attached to this file
    if (cs_are_attached_here) {
      // if #cron is visible in this file
      if (cs_are_visible) {
        cronSettings.hide()
        currentCronText.show()
        cron.hide()
      } else {
        cron.show()
        button.hide()
        currentCronText.hide()
      }
    } else {
      $('#cron').parent().find('.cron-info').show()
      $('#cron').parent().find('.edit-timer').show()
      // remove cron-settings gui from current location and append it to this file
      $('#cron').detach().appendTo(button.parent()).show()
      currentCronText.hide()
      button.hide()
    }
  })

  // save user selection
  $('#cron').on('click', '#save', function (e) {
    let file = $(this).parents('.file')
    let fileId = file.attr('data-id')

    let cronValueString = $('#cron .current-value').text()
    let cronHumanString = jqCronInstance.data('jqCron').getHumanText()
    // save changes in database
    db.update({ _id: fileId }, { $set: { cronJob: cronValueString, humanCron: cronHumanString } }, function (err, numReplaced) {
      db.findOne({ _id: fileId }, function (err, doc) {
        createCronJob(doc)
        // update view
        file.find('.cron-info').attr('data-cron', doc.cronJob)
        file.find('.cron-info').text(doc.humanCron)
        toastr.success('Timer saved')
      })
    })
    hideJqCron()
  })

  // stop editing cronSettings
  $('#cron').on('click', '#cancel', function (e) {
    hideJqCron()
  })

  // disable timer
  $('#cron').on('click', '#disableTimer', function (e) {
    let fileId = $(this).parents('.file').attr('data-id')
    disableCron(fileId)
    db.update({ _id: fileId }, { $unset: { cronJob: true, humanCron: true } })
    // update view
    $(this).parents('.file').find('.cron-info').text('No timer set')
    hideJqCron()
  })
})
