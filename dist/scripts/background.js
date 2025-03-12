import { saveJob, getRecentlySavedJobs, getStats, getStreak } from './api.js'
import { sendNotification } from './utils.js'

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  const [SUCCESSMESSAGE, FAILUREMESSAGE] = ['SUCCESS', 'FAILURE']

  if (request.action === 'SAVEJOB') {
    saveJob(request.data)
      .then((data) => {
        const title = data.properties.Link.title[0].plain_text
        const company = data.properties.Company.select.name
        sendNotification(
          SUCCESSMESSAGE,
          `The job "${title}" from ${company} has been successfully saved.`
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
  } else if (request.action === 'GETSAVEDJOBS') {
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
  } else if (request.action === 'GETSTATS') {
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
  } else if (request.action === 'GETSTREAK') {
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
  }
})
