async function getStorageValue(key) {
  const result = await new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => {
      resolve(res[key])
    })
  })
  return result
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  const [SUCCESSMESSAGE, FAILUREMESSAGE] = ['SUCCESS', 'FAILURE']

  if (request.action === 'SAVEJOB') {
    saveJob(request.data)
      .then((data) => {
        const title = data.properties.Link.title[0].plain_text
        const company = data.properties.Company.select.name

        sendResponse({
          message: SUCCESSMESSAGE,
          content: `The job "${title}" from ${company} has been successfully saved.`,
        })
      })
      .catch((error) => {
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

const saveJob = async (data) => {
  await checkIfJobPostingExists(data.url)

  const parsedJSON = await formatDataToJSON(data.jobDescription)
  parsedJSON['url'] = data.url
  return await saveJobPosting(parsedJSON)
}

const formatDataToJSON = async (jobDescription) => {
  try {
    const GROQAPIKEY = getStorageValue('groqAPIKey')
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
            content: `
	      Provide the job title and the country from the job description as a JSON object in the following format:
{ "jobTitle": "<job-title>", "country": "<country>",  "company": "<company>", "description": <a short description of minimum qualifications and required qualifications as text with bullet points> }

Respond only with the JSON object, without any additional text or explanation.
	      `,
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
    console.log('groqAPIRequest:', error)
    throw error
  }
}

const checkIfJobPostingExists = async (url) => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const NOTIONAPIKEY = await getStorageValue('notionAPIKey')
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTIONDATABASEID}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NOTIONAPIKEY}`,
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'URL',
          url: {
            equals: url,
          },
        },
      }),
    })

    const responseData = await response.json()
    const exists = responseData.results && responseData.results.length > 0
    if (exists) {
      throw new Error('URL already exists in the Notion database.')
    }
  } catch (error) {
    console.error('checkIfURLExistsInNotion: ', error)

    throw error
  }
}

const saveJobPosting = async (data) => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const NOTIONAPIKEY = await getStorageValue('notionAPIKey')

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NOTIONAPIKEY}`,
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
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
      }),
    })

    const responseData = await response.json()
    console.log(responseData)
    return responseData
  } catch (error) {
    console.error('notionAPIRequest: ', error)
    throw error
  }
}

const getRecentlySavedJobs = async () => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const NOTIONAPIKEY = await getStorageValue('notionAPIKey')
    const url = `https://api.notion.com/v1/databases/${NOTIONDATABASEID}/query`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTIONAPIKEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        // sorts: [{ property: "Created Date", direction: "ascending" }],
        filter: {
          property: 'Status',
          status: {
            equals: 'Not Applied',
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    const data = await response.json()

    return data.results.map((content) => {
      var { link, Company, Country, Link, Description, URL } = content.properties

      return {
        link: link,
        country: Country.select.name,
        company: Company.select.name,
        url: URL.url,
        title: Link.title[0].plain_text,
        description: Description.rich_text[0].plain_text,
      }
    })
  } catch (error) {
    console.error('Error fetching data from Notion:', error)
    throw error
  }
}

const getStats = async () => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const NOTIONAPIKEY = await getStorageValue('notionAPIKey')

    const url = `https://api.notion.com/v1/databases/${NOTIONDATABASEID}/query`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTIONAPIKEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    const responseJSON = await response.json()

    const count = {}

    responseJSON.results.forEach((data) => {
      const { name } = data.properties.Status.status
      if (count[name] === undefined) {
        count[name] = 1
      } else {
        count[name] += 1
      }
    })

    return count
  } catch (error) {
    console.error('Error fetching data from Notion:', error)
    throw error
  }
}

const getStreak = async () => {
  try {
    const NOTIONDATABASEID = await getStorageValue('notionDatabaseID')
    const NOTIONAPIKEY = await getStorageValue('notionAPIKey')
    const url = `https://api.notion.com/v1/databases/${NOTIONDATABASEID}/query`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTIONAPIKEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        sorts: [{ property: 'Applied Date', direction: 'descending' }],
        filter: {
          property: 'Applied Date',
          date: {
            is_not_empty: true,
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    const responseJSON = await response.json()
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

      if (diffDays === 0) {
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
      lastAppliedDate: dates[0],
    }
  } catch (error) {
    console.error('Error fetching data from Notion:', error)
    throw error
  }
}
