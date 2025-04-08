import { RANGE } from '../utils/constants.js'
import { compareJobPostingPrompt, formatDataToJsonPrompt } from '../utils/prompts.js'
import { getStorageValue } from '../utils/utils.js'

const notionFetchWrapper = async ({ url, method, body = null }) => {
  const notionBaseURL = 'https://api.notion.com/v1'
  const NOTIONAPIKEY = await getStorageValue('notionAPIKey')
  const response = await fetch(notionBaseURL + url, {
    method: method,
    headers: {
      Authorization: `Bearer ${NOTIONAPIKEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: body ? JSON.stringify(body) : null,
  })

  if (!response.ok) {
    const errorResponse = await response.json()
    throw new Error(errorResponse.message)
  }
  return await response.json()
}

export const saveJob = async (data) => {
  await checkIfJobPostingExists(data.url)

  const parsedJSON = await formatDataToJSON(data.jobDescription)
  parsedJSON['url'] = data.url
  const savedJob = await saveJobPosting(parsedJSON)

  return {
    title: savedJob.properties.Link.title[0].plain_text,
    company: savedJob.properties.Company.select.name,
  }
}

export const formatDataToJSON = async (jobDescription) => {
  try {
    const GROQAPIKEY = await getStorageValue('groqAPIKey')
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQAPIKEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: formatDataToJsonPrompt,
          },
          {
            role: 'user',
            content: jobDescription,
          },
        ],
        model: 'mistral-saba-24b',
        stream: false,
        response_format: {
          type: 'json_object',
        },
      }),
    })

    const responseData = await response.json()
    if (responseData.error) {
      throw new Error(responseData.error.message)
    }
    const message = responseData.choices[0].message.content
    const parsedJSON = JSON.parse(message)
    return parsedJSON
  } catch (error) {
    console.error('groqAPIRequest:', error)
    throw error
  }
}

export const compareJobPosting = async ({ resume, jobPosting }) => {
  try {
    const GROQAPIKEY = await getStorageValue('groqAPIKey')
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQAPIKEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: compareJobPostingPrompt,
          },
          {
            role: 'user',
            content: 'Resume:\n' + resume,
          },
          {
            role: 'user',
            content: 'Job Posting:\n' + jobPosting,
          },
        ],
        model: 'gemma2-9b-it',
        stream: false,
        response_format: {
          type: 'json_object',
        },
      }),
    })

    const responseData = await response.json()
    if (responseData.error) {
      throw new Error(responseData.error.message)
    }
    const message = responseData.choices[0].message.content
    const parsedJSON = JSON.parse(message)
    return parsedJSON
  } catch (error) {
    console.error('groqAPIRequest:', error)
    throw error
  }
}

export const checkIfJobPostingExists = async (url) => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const responseData = await notionFetchWrapper({
      url: `/databases/${NOTIONDATABASEID}/query`,
      method: 'POST',
      body: {
        filter: {
          property: 'URL',
          url: {
            equals: url,
          },
        },
      },
    })
    const exists = responseData.results && responseData.results.length > 0
    if (exists) {
      const status = responseData.results[0].properties.Status.status.name
      throw new Error(`You have already saved this job. Status=${status}`)
    }
  } catch (error) {
    console.error('checkIfURLExistsInNotion: ', error)
    throw error
  }
}

export const saveJobPosting = async (data) => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const responseData = await notionFetchWrapper({
      url: `/pages`,
      method: 'POST',
      body: {
        parent: {
          database_id: NOTIONDATABASEID,
        },
        properties: {
          Link: {
            title: [
              {
                text: {
                  content: data.jobTitle,
                  link: {
                    url: data.url,
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
              name: data.country,
            },
          },
          Company: {
            select: {
              name: data.company,
            },
          },
          URL: {
            url: data.url,
          },
          Description: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: data.description,
                },
              },
            ],
          },
        },
      },
    })

    return responseData
  } catch (error) {
    console.error('notionAPIRequest: ', error)
    throw error
  }
}

export const getRecentlySavedJobs = async () => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const url = `/databases/${NOTIONDATABASEID}/query`

    const data = await notionFetchWrapper({
      url: url,
      method: 'POST',
      body: {
        filter: {
          property: 'Status',
          status: {
            equals: 'Not Applied',
          },
        },
      },
    })
    return data.results.map((content) => {
      const { id } = content
      var { link, Company, Country, Link, Description, URL } = content.properties

      return {
        link: link,
        country: Country.select.name,
        company: Company.select.name,
        url: URL.url,
        title: Link.title[0].plain_text,
        description: Description.rich_text[0].plain_text,
        id: id,
      }
    })
  } catch (error) {
    console.error('Error fetching data from Notion:', error)
    throw error
  }
}

export const getStats = async (range) => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const url = `/databases/${NOTIONDATABASEID}/query`

    let dateFilter = {}
    if (range === RANGE.PASTYEAR) {
      dateFilter = { past_year: {} }
    } else if (range === RANGE.PASTMONTH) {
      dateFilter = { past_month: {} }
    } else if (range === RANGE.PASTWEEK) {
      dateFilter = { past_week: {} }
    }

    const responseJSON = await notionFetchWrapper({
      url,
      method: 'POST',
      body: {
        filter: {
          property: 'Created Date',
          date: dateFilter,
        },
      },
    })

    const statusCount = {}
    const companyCount = {}
    const countryCount = {}

    responseJSON.results.forEach((data) => {
      const status = data.properties.Status?.status?.name
      const company = data.properties.Company?.select?.name
      const country = data.properties.Country?.select?.name

      if (status) {
        statusCount[status] = (statusCount[status] || 0) + 1
      }

      if (company) {
        companyCount[company] = (companyCount[company] || 0) + 1
      }

      if (country) {
        countryCount[country] = (countryCount[country] || 0) + 1
      }
    })

    return {
      statusCount,
      companyCount,
      countryCount,
    }
  } catch (error) {
    console.error('Error fetching data from Notion:', error)
    throw error
  }
}

export const getStreak = async () => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const url = `/databases/${NOTIONDATABASEID}/query`
    const responseJSON = await notionFetchWrapper({
      url: url,
      method: 'POST',
      body: {
        sorts: [{ property: 'Applied Date', direction: 'descending' }],
        filter: {
          property: 'Applied Date',
          date: {
            is_not_empty: true,
          },
        },
      },
    })

    const dates = responseJSON.results.map((data) => data.properties['Applied Date'].date.start)
    if (dates.length === 0) {
      return { maxStreak: 0, currentStreak: 0, lastAppliedDate: '' }
    }

    const parsed = dates.map((d) => new Date(d))
    let maxStreak = 1
    let currentStreak = 1

    for (let i = 1; i < parsed.length; i++) {
      const prev = parsed[i - 1]
      const curr = parsed[i]

      const diffDays = Math.floor((prev - curr) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }

    let realCurrentStreak = 0
    let today = new Date()
    today.setHours(0, 0, 0, 0)
    let currentDate = today

    for (let i = 0; i < parsed.length; i++) {
      const streakDate = parsed[i]
      streakDate.setHours(0, 0, 0, 0)

      const diffDays = Math.floor((currentDate - streakDate) / (1000 * 60 * 60 * 24))

      if (i == 0 && diffDays === 0) {
        realCurrentStreak++
      } else if (i !== 0 && diffDays === 1) {
        realCurrentStreak++
        currentDate = streakDate
      } else {
        break
      }

      currentDate = streakDate
    }
    return {
      maxStreak: maxStreak,
      currentStreak: realCurrentStreak,
      lastAppliedDate: parsed[0].toLocaleDateString(),
    }
  } catch (error) {
    console.error('Error fetching data from Notion:', error)
    throw error
  }
}

export const updateJob = async (pageId) => {
  try {
    const url = `/pages/${pageId}`
    const today = new Date()
    await notionFetchWrapper({
      url: url,
      method: 'PATCH',
      body: {
        properties: {
          Status: {
            status: {
              name: 'Applied',
            },
          },
          'Applied Date': {
            date: {
              start: today.toISOString(),
            },
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching data from Notion:', error)
    throw error
  }
}
