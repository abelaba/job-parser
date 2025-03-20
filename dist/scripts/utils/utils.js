export async function getStorageValue(key) {
  const result = await new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => {
      resolve(res[key])
    })
  })
  return result
}

export const sendNotification = (title, message) => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../..//images/icon.png',
    title: title,
    message: message,
  })
}
