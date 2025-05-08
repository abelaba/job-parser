import { STORAGEKEY } from '../utils/constants.js'
import { getStorageValue } from '../utils/utils.js' // Always add .js to import path

const fetchWrapper = async (url, options = {}) => {
  let baseURL = await getStorageValue(STORAGEKEY.baseURL)
  if (!baseURL) throw new Error('Base URL is not set')
  baseURL = baseURL.replace(/\/$/, '') + '/api/job/'
  if (!url.startsWith('/')) url = url.replace(/^\//, '')

  const response = await fetch(baseURL + url, options)
  return response
}

// Save a new job application
export const saveJob = async (job) => {
  const response = await fetchWrapper(``, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  })
  if (!response.ok) throw new Error('Failed to save job')
  return await response.json()
}

// Compare job posting and resume
export const compareJobPosting = async ({ resume, jobPosting }) => {
  const response = await fetchWrapper(`compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume: resume, jobPosting: jobPosting }),
  })

  if (!response.ok) throw new Error('Comparison failed')
  return await response.json()
}

// Get list of recently saved jobs
export const getRecentlySavedJobs = async () => {
  const response = await fetchWrapper(`recent`)

  if (!response.ok) throw new Error('Failed to get saved jobs')
  return await response.json()
}

// Get job application stats
export const getStats = async (range) => {
  const response = await fetchWrapper(`stats?range=${range}`)

  if (!response.ok) throw new Error('Failed to fetch stats')
  return await response.json()
}

// Get job application streak
export const getStreak = async () => {
  const response = await fetchWrapper(`streak`)

  if (!response.ok) throw new Error('Failed to get streak')
  return await response.json()
}

// Mark job as applied
export const updateJob = async (pageId) => {
  const response = await fetchWrapper(`${pageId}`, {
    method: 'PUT',
  })

  if (!response.ok) throw new Error('Failed to update job')
}
