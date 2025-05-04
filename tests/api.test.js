import { jest } from '@jest/globals'

const { getStats, getStreak, getRecentlySavedJobs, updateJob, compareJobPosting, saveJob } =
  await import('../dist/scripts/background/api')

const mockJob = { title: 'Software Engineer', company: 'Google' }
const mockResume = 'My resume content'
const mockJobPosting = 'Job description content'

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('API Success cases', () => {
  test('saveJob sends POST request and returns response', async () => {
    const mockResponse = { id: '1' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const data = await saveJob(mockJob)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('http'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockJob),
    })
    expect(data).toEqual(mockResponse)
  })

  test('compareJobPosting returns comparison result', async () => {
    const mockResult = { matchScore: 85 }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    })

    const data = await compareJobPosting({ resume: mockResume, jobPosting: mockJobPosting })
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/compare'), expect.any(Object))
    expect(data).toEqual(mockResult)
  })

  test('getRecentlySavedJobs returns jobs', async () => {
    const mockJobs = [{ id: '1' }, { id: '2' }]
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobs,
    })

    const data = await getRecentlySavedJobs()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/recent'))
    expect(data).toEqual(mockJobs)
  })

  test('getStats returns stats data', async () => {
    const mockStats = { countryCount: 10 }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    })

    const range = 'PASTYEAR'
    const data = await getStats(range)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/stats?range=${range}`))
    expect(data).toEqual(mockStats)
  })

  test('getStreak returns streak info', async () => {
    const mockStreak = { count: 5 }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStreak,
    })

    const data = await getStreak()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/streak'))
    expect(data).toEqual(mockStreak)
  })

  test('updateJob sends PUT request', async () => {
    fetch.mockResolvedValueOnce({ ok: true })

    await updateJob('id')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/id'), {
      method: 'PUT',
    })
  })
})

describe('API failure cases', () => {
  test('saveJob throws error when fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(saveJob(mockJob)).rejects.toThrow('Failed to save job')
  })

  test('compareJobPosting throws error when fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(
      compareJobPosting({ resume: mockResume, jobPosting: mockJobPosting })
    ).rejects.toThrow('Comparison failed')
  })

  test('getRecentlySavedJobs throws error when fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(getRecentlySavedJobs()).rejects.toThrow('Failed to get saved jobs')
  })

  test('getStats throws error when fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(getStats('PASTYEAR')).rejects.toThrow('Failed to fetch stats')
  })

  test('getStreak throws error when fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(getStreak()).rejects.toThrow('Failed to get streak')
  })

  test('updateJob throws error when fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(updateJob('id')).rejects.toThrow('Failed to update job')
  })
})
