import { saveJob, getRecentlySavedJobs, getStats, getStreak, updateJob } from './api.js'
import { sendNotification } from '../utils/utils.js'
import { SUCCESSMESSAGE, FAILUREMESSAGE, REQUESTACTION } from '../utils/constants.js'

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === REQUESTACTION.SAVEJOB) {
    saveJob(request.data)
      .then((data) => {
        sendNotification(
          SUCCESSMESSAGE,
          `The job "${data.title}" from ${data.company} has been successfully saved.`
        )
        sendResponse({
          message: SUCCESSMESSAGE,
          content: '',
        })
      })
      .catch((error) => {
        sendNotification(FAILUREMESSAGE, error.message)
        sendResponse({ message: FAILUREMESSAGE, content: error.message })
      })
    return true
  } else if (request.action === REQUESTACTION.GETSAVEDJOBS) {
    getRecentlySavedJobs()
      .then((data) => {
        sendResponse({
          message: SUCCESSMESSAGE,
          content: data,
        })
      })
      .catch((error) => {
        sendResponse({
          message: FAILUREMESSAGE,
          error: error,
        })
      })

    return true
  } else if (request.action === REQUESTACTION.GETSTATS) {
    getStats()
      .then((data) => {
        sendResponse({
          message: SUCCESSMESSAGE,
          content: data,
        })
      })
      .catch((error) => {
        sendResponse({
          message: FAILUREMESSAGE,
          error: error,
        })
      })

    return true
  } else if (request.action === REQUESTACTION.GETSTREAK) {
    getStreak()
      .then((data) => {
        sendResponse({
          message: SUCCESSMESSAGE,
          content: data,
        })
      })
      .catch((error) => {
        sendResponse({
          message: FAILUREMESSAGE,
          error: error,
        })
      })

    return true
  } else if (request.action === REQUESTACTION.UPDATEJOB) {
    updateJob(request.pageId)
      .then(() => {
        sendResponse({
          message: SUCCESSMESSAGE,
          content: '',
        })
      })
      .catch((error) => {
        sendNotification(FAILUREMESSAGE, error.message)
        sendResponse({
          message: FAILUREMESSAGE,
          error: error,
        })
      })

    return true
  }
})
