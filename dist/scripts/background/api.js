const BASE_URL = 'http://localhost:8000/api/job'

// Save a new job application
export const saveJob = async (job) => {
  const response = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  })
  if (!response.ok) throw new Error('Failed to save job')
  return await response.json()
}

// Compare job posting and resume
export const compareJobPosting = async ({ resume, jobPosting }) => {
  const response = await fetch(`${BASE_URL}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume: resume, jobPosting: jobPosting }),
  })

  if (!response.ok) throw new Error('Comparison failed')
  return await response.json()
}

// Get list of recently saved jobs
export const getRecentlySavedJobs = async () => {
  const response = await fetch(`${BASE_URL}/recent`)

  if (!response.ok) throw new Error('Failed to get saved jobs')
  return await response.json()
}

// Get job application stats
export const getStats = async (range) => {
  const response = await fetch(`${BASE_URL}/stats?range=${range}`)

  if (!response.ok) throw new Error('Failed to fetch stats')
  return await response.json()
}

// Get job application streak
export const getStreak = async () => {
  const response = await fetch(`${BASE_URL}/streak`)

  if (!response.ok) throw new Error('Failed to get streak')
  return await response.json()
}

// Mark job as applied
export const updateJob = async (pageId) => {
  const response = await fetch(`${BASE_URL}/${pageId}`, {
    method: 'PUT',
  })

  if (!response.ok) throw new Error('Failed to update job')
}
