import { jest } from '@jest/globals'

jest.unstable_mockModule('../dist/scripts/utils', () => ({
  getStorageValue: jest.fn(),
}))

global.console = {
  error: jest.fn(),
}

const { getStorageValue } = await import('../dist/scripts/utils')
const {
  formatDataToJSON,
  checkIfJobPostingExists,
  saveJobPosting,
  getStats,
  getStreak,
  getRecentlySavedJobs,
} = await import('../dist/scripts/api')

describe('formatDataToJSON', () => {
  const mockAPIKey = 'fake-api-key'
  const jobDescription =
    'Software Engineer at Google in Switzerland. Must have experience with JavaScript and React.'

  const mockResponse = {
    choices: [
      {
        message: {
          content: JSON.stringify({
            jobTitle: 'Software Engineer',
            country: 'Switzerland',
            company: 'Google',
            description: '- Experience with JavaScript\n- Experience with React',
          }),
        },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    )
    getStorageValue.mockResolvedValue(mockAPIKey)
  })

  it('should return parsed JSON from valid job description', async () => {
    const result = await formatDataToJSON(jobDescription)
    expect(result).toEqual({
      jobTitle: 'Software Engineer',
      country: 'Switzerland',
      company: 'Google',
      description: '- Experience with JavaScript\n- Experience with React',
    })
    expect(getStorageValue).toHaveBeenCalledWith('groqAPIKey')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should throw an error if fetch returns an error', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
      })
    )

    await expect(formatDataToJSON(jobDescription)).rejects.toThrow('Unauthorized')
  })

  it('should throw if JSON parsing fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: '{ invalidJSON }',
                },
              },
            ],
          }),
      })
    )

    await expect(formatDataToJSON(jobDescription)).rejects.toThrow()
  })

  it('should throw if fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))
    await expect(formatDataToJSON(jobDescription)).rejects.toThrow('Network error')
  })
})

describe('checkIfJobPostingExists', () => {
  it('should not throw if the URL does not exist in the database', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ results: [] }),
    })

    await expect(checkIfJobPostingExists('https://example.com/job')).resolves.not.toThrow()
    expect(fetch).toHaveBeenCalled()
  })

  it('should throw an error if the URL already exists', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ results: [{ id: 'existing-job' }] }),
    })

    await expect(checkIfJobPostingExists('https://example.com/job')).rejects.toThrow(
      'URL already exists in the Notion database.'
    )
  })

  it('should throw an error if fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network Error'))

    await expect(checkIfJobPostingExists('https://example.com/job')).rejects.toThrow(
      'Network Error'
    )
  })
})

describe('saveJobPosting', () => {
  it('should call the Notion API with the correct data', async () => {
    const fakeDatabaseId = 'test-database-id'
    const fakeApiKey = 'test-api-key'
    const mockData = {
      jobTitle: 'Frontend Developer',
      url: 'https://example.com/job/frontend-dev',
      country: 'Germany',
      company: 'Acme Corp',
      description: '• Proficiency in React\n• Experience with CSS-in-JS',
    }

    getStorageValue.mockResolvedValueOnce(fakeDatabaseId).mockResolvedValueOnce(fakeApiKey)

    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'mock-page-id' }),
    })

    await expect(saveJobPosting(mockData)).resolves.not.toThrow()

    expect(fetch).toHaveBeenCalledWith('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fakeApiKey}`,
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: {
          database_id: fakeDatabaseId,
        },
        properties: {
          Link: {
            title: [
              {
                text: {
                  content: mockData.jobTitle,
                  link: {
                    url: mockData.url,
                  },
                },
              },
            ],
          },
          Status: {
            status: {
              name: 'Not Applied',
            },
          },
          Country: {
            select: {
              name: mockData.country,
            },
          },
          Company: {
            select: {
              name: mockData.company,
            },
          },
          URL: {
            url: mockData.url,
          },
          Description: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: mockData.description,
                },
              },
            ],
          },
        },
      }),
    })
  })

  it('should throw and log an error if the API call fails', async () => {
    getStorageValue.mockResolvedValueOnce('test-database-id').mockResolvedValueOnce('test-api-key')

    fetch.mockRejectedValue(new Error('Failed to post to Notion'))

    await expect(
      saveJobPosting({
        jobTitle: 'Backend Dev',
        url: 'https://example.com/job/backend-dev',
        country: 'Sweden',
        company: 'Beta Inc',
        description: '• Python\n• Django',
      })
    ).rejects.toThrow('Failed to post to Notion')
  })
})

describe('getRecentlySavedJobs', () => {
  it('should return a list of Not Applied jobs', async () => {
    getStorageValue.mockResolvedValueOnce('fake-database-id').mockResolvedValueOnce('fake-api-key')

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            properties: {
              link: null,
              Company: { select: { name: 'Google' } },
              Country: { select: { name: 'USA' } },
              Link: { title: [{ plain_text: 'SWE' }] },
              URL: { url: 'https://example.com' },
              Description: { rich_text: [{ plain_text: 'Job desc' }] },
            },
          },
        ],
      }),
    })

    const jobs = await getRecentlySavedJobs()

    expect(jobs).toEqual([
      {
        link: null,
        country: 'USA',
        company: 'Google',
        url: 'https://example.com',
        title: 'SWE',
        description: 'Job desc',
      },
    ])
  })

  it('should throw an error if response is not ok', async () => {
    getStorageValue.mockResolvedValueOnce('db-id').mockResolvedValueOnce('api-key')

    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    })

    await expect(getRecentlySavedJobs()).rejects.toThrow('Failed to fetch data: Bad Request')
  })
})

describe('getStats', () => {
  it('should return counts of each status', async () => {
    getStorageValue.mockResolvedValueOnce('fake-database-id').mockResolvedValueOnce('fake-api-key')

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { properties: { Status: { status: { name: 'Applied' } } } },
          { properties: { Status: { status: { name: 'Not Applied' } } } },
          { properties: { Status: { status: { name: 'Applied' } } } },
        ],
      }),
    })

    const stats = await getStats()

    expect(stats).toEqual({
      Applied: 2,
      'Not Applied': 1,
    })
  })

  it('should throw an error if response is not ok', async () => {
    getStorageValue.mockResolvedValueOnce('db-id').mockResolvedValueOnce('api-key')

    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    })

    await expect(getStats()).rejects.toThrow('Failed to fetch data: Unauthorized')
  })
})

describe('getStreak', () => {
  it('should return correct streak info', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(today.getDate() - 2)

    getStorageValue.mockResolvedValueOnce('fake-database-id').mockResolvedValueOnce('fake-api-key')

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { properties: { 'Applied Date': { date: { start: today.toISOString() } } } },
          { properties: { 'Applied Date': { date: { start: yesterday.toISOString() } } } },
          { properties: { 'Applied Date': { date: { start: twoDaysAgo.toISOString() } } } },
        ],
      }),
    })

    const result = await getStreak()

    expect(result).toEqual({
      maxStreak: 3,
      currentStreak: 3,
      lastAppliedDate: today.toISOString(),
    })
  })

  it('should return 0s if no dates exist', async () => {
    getStorageValue.mockResolvedValueOnce('fake-database-id').mockResolvedValueOnce('fake-api-key')

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [],
      }),
    })

    const result = await getStreak()

    expect(result).toEqual({
      maxStreak: 0,
      currentStreak: 0,
      lastAppliedDate: '',
    })
  })

  it('should throw an error if response is not ok', async () => {
    getStorageValue.mockResolvedValueOnce('db-id').mockResolvedValueOnce('api-key')

    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    })

    await expect(getStreak()).rejects.toThrow('Failed to fetch data: Server Error')
  })
})
