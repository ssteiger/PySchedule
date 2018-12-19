const Datastore = require('nedb')
const db = new Datastore({ filename: 'database/datafile', autoload: true })

const CronJobManager = require('cron-job-manager')
let cronManager = new CronJobManager()

function resetCronManager () {
  cronManager.stopAll()
  cronManager = new CronJobManager()
}
