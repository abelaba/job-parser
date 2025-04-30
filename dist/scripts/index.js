import { RANGE, REQUESTACTION, SUCCESSMESSAGE } from './utils/constants.js'
import { getStorageValue, sendNotification } from './utils/utils.js'

const modal = document.querySelector('.main-modal')
const closeButton = document.querySelector('.modal-close')
closeButton.onclick = () => modalClose()
modal.style.display = 'none'

const modalClose = () => {
  modal.classList.remove('fadeIn')
  modal.classList.add('fadeOut')
  document.querySelector('.apply-button').classList.add('hidden')
  document.querySelector('.settings-save-button').classList.add('hidden')
  setTimeout(() => {
    modal.style.display = 'none'
  }, 500)
}

const openModal = (title, description) => {
  const modalTitle = document.querySelector('.modal-title')
  modalTitle.innerHTML = title
  const modalDescription = document.querySelector('.modal-description')
  modalDescription.innerHTML = description
  modal.classList.remove('fadeOut')
  modal.classList.add('fadeIn')
  modal.style.display = 'flex'
}

window.onclick = function (event) {
  if (event.target == modal) modalClose()
}

const saveJob = (url, text) => {
  const urlObject = new URL(url)
  const baseUrl = urlObject.origin + urlObject.pathname
  chrome.runtime.sendMessage(
    {
      action: REQUESTACTION.SAVEJOB,
      data: {
        jobDescription: text,
        url: baseUrl,
      },
    },
    (response) => {
      if (response.message === SUCCESSMESSAGE) {
        getSavedJobs()
      }
      document.querySelector('.save-icon-loading').classList.add('hidden')
      document.querySelector('.save-icon').classList.remove('hidden')
      const button = document.getElementById('saveJobButton')
      button.disabled = false
    }
  )
}

const compareJobPosting = async (jobPosting) => {
  const resume = await getStorageValue('resumeText')

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: REQUESTACTION.COMPAREJOB,
        resume: resume,
        jobPosting: jobPosting,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else if (response.message === SUCCESSMESSAGE) {
          resolve(response.content)
        } else {
          reject(new Error('Unexpected response'))
        }
      }
    )
  })
}

const getSavedJobs = () => {
  chrome.runtime.sendMessage(
    {
      action: REQUESTACTION.GETSAVEDJOBS,
    },
    (response) => {
      if (response.message === SUCCESSMESSAGE) {
        var table = document.querySelector('.recently-saved-jobs')
        table.innerHTML = ''
        response.content.forEach((data) => {
          const row = document.createElement('tr')
          row.className = 'hover:bg-slate-100 odd:bg-white even:bg-slate-50'
          row.innerHTML = `
		<td class="px-4 py-2">${data.title}</td>
		<td class="px-4 py-2">${data.company}</td>
		<td class="px-4 py-2">${data.country}</td>
		<td class="px-4 py-2">
		    <button style="transition:all .15s ease" class="open-button cursor-pointer outline-none mr-1 mb-1 border border-solid border-blue-500 rounded px-4 py-2 bg-transparent text-xs text-blue-500 font-bold uppercase focus:outline-none active:bg-blue-600 hover:bg-blue-600 hover:text-white">Open</button>
		</td>
		<td class="px-4 py-2">
		    <button style="transition:all .15s ease" class="apply-btn cursor-pointer outline-none mr-1 mb-1 border border-solid border-green-500 rounded px-4 py-2 bg-transparent text-xs text-green-500 font-bold uppercase focus:outline-none active:bg-green-600 hover:bg-green-600 hover:text-white" data-id="${data.id}">Applied</button>
		</td>
	    `
          row.querySelector('.apply-btn').addEventListener('click', () => updateJob(data.id))
          row.querySelector('.open-button').addEventListener('click', async () => {
            const result = await compareJobPosting(data.description)
            const missingSkills = result.missingSkills.join(', ')
            openModal(
              'Job Qualification',
              `
		<div class="p-2">
		    <p class="text-lg font-bold"> Summary </p>
		    <p class="mb-2 leading-relaxed">${data.description}</p>
		    <div class="mb-2 bg-green-100 border border-green-300 text-green-800 rounded-lg p-3">
			<strong>Match Score:</strong> ${result.matchScore}
		    </div>
		    <div class="bg-red-100 border border-red-300 text-red-800 rounded-lg p-3 mb-2">
			<strong>Missing Skills:</strong> ${missingSkills}
		    </div>
		    <div class="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg p-3">
			<strong>Recommendations:</strong> ${result.recommendations}
		    </div>

		    
		</div>`
            )
            document.querySelector('.apply-button').classList.remove('hidden')
            document.querySelector('.apply-button').href = data.url
          })

          table.appendChild(row)
        })
      }
    }
  )
}

const getStats = (range = RANGE.PASTYEAR) => {
  chrome.runtime.sendMessage(
    {
      action: REQUESTACTION.GETSTATS,
      body: {
        range: range,
      },
    },
    (response) => {
      if (response.message === SUCCESSMESSAGE) {
        const { statusCount, companyCount, countryCount } = response.content

        renderChart('statusChart', 'Status Distribution', 'bar', statusCount)
        renderChart('companyChart', 'Company Distribution', 'doughnut', companyCount)
        renderChart('countryChart', 'Country Distribution', 'doughnut', countryCount)
      }
    }
  )
}

const renderChart = (canvasId, label, chartType, data) => {
  /* eslint-disable-next-line */
  if (Chart.getChart(canvasId)) {
    /* eslint-disable-next-line */
    Chart.getChart(canvasId).destroy()
  }

  const ctx = document.getElementById(canvasId).getContext('2d')
  const labels = Object.keys(data)
  const values = Object.values(data)
  const colors = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(100, 149, 237, 0.6)',
    'rgba(34, 193, 195, 0.6)',
    'rgba(253, 187, 45, 0.6)',
    'rgba(231, 76, 60, 0.6)',
    'rgba(46, 204, 113, 0.6)',
  ]
  /* eslint-disable-next-line */
  new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, values.length),
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
      },
      responsive: true,
      maintainAspectRatio: true,
    },
  })
}

const getStreak = () => {
  chrome.runtime.sendMessage(
    {
      action: REQUESTACTION.GETSTREAK,
    },
    (response) => {
      if (response.message === SUCCESSMESSAGE) {
        const { lastAppliedDate, currentStreak } = response.content
        document.querySelector('#streakCount').innerHTML = currentStreak
        if (currentStreak === 0) {
          document.querySelector('.flame-color').classList.add('hidden')
          document.querySelector('.flame-no-color').classList.remove('hidden')
        } else {
          document.querySelector('.flame-color').classList.remove('hidden')
          document.querySelector('.flame-no-color').classList.add('hidden')
        }
        document.querySelector('#lastAppliedDate').textContent = lastAppliedDate
      }
    }
  )
}

const updateJob = (pageId) => {
  chrome.runtime.sendMessage(
    {
      action: REQUESTACTION.UPDATEJOB,
      pageId: pageId,
    },
    (response) => {
      if (response.message === SUCCESSMESSAGE) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: REQUESTACTION.SHOWDIALOG,
            })
            window.close()
          }
        })
      }
    }
  )
}

document.addEventListener('DOMContentLoaded', () => {
  getSavedJobs()
  getStats()
  getStreak()

  // On click methods for switching open tabs
  let tabsContainer = document.querySelector('#tabs')
  let tabTogglers = tabsContainer.querySelectorAll('#tabs a')

  tabTogglers.forEach(function (toggler) {
    toggler.addEventListener('click', function (e) {
      e.preventDefault()

      let tabName = this.getAttribute('href')

      let tabContents = document.querySelector('#tab-contents')

      for (let i = 0; i < tabContents.children.length; i++) {
        tabTogglers[i].parentElement.classList.remove('border-b-2')
        tabContents.children[i].classList.remove('hidden')
        if ('#' + tabContents.children[i].id === tabName) {
          continue
        }
        tabContents.children[i].classList.add('hidden')
      }
      e.target.parentElement.classList.add('border-b-2')
    })
  })

  // Job list table search method
  document.getElementById('searchInput').addEventListener('input', function (event) {
    const searchTerm = event.target.value.toLowerCase()
    const rows = document.querySelectorAll('tbody tr')
    let hasResults = false

    rows.forEach((row) => {
      const title = row.cells[0].textContent.toLowerCase()
      const company = row.cells[1].textContent.toLowerCase()
      const country = row.cells[2].textContent.toLowerCase()

      if (
        title.includes(searchTerm) ||
        company.includes(searchTerm) ||
        country.includes(searchTerm)
      ) {
        row.style.display = ''
        hasResults = true
      } else {
        row.style.display = 'none'
      }
    })
    const noResultsMessage = document.getElementById('noResults')
    if (hasResults) {
      noResultsMessage.classList.add('hidden')
    } else {
      noResultsMessage.classList.remove('hidden')
    }
  })

  // Click method for saving a job posting
  document.getElementById('saveJobButton')?.addEventListener('click', async () => {
    document.querySelector('.save-icon-loading').classList.remove('hidden')
    document.querySelector('.save-icon').classList.add('hidden')
    const button = document.getElementById('saveJobButton')
    button.disabled = true

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })

    if (tab && tab.id) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            const mainElement = document.querySelector('main')
            const jobText = mainElement
              ? mainElement.innerText.trim()
              : document.body.innerText.trim()
            return { url: document.URL, jobText: jobText }
          },
        },
        (results) => {
          if (results && results.length > 0) {
            const { url, jobText } = results[0].result
            saveJob(url, jobText)
          } else {
            alert('Problem parsing content')
            document.querySelector('.save-icon-loading').classList.add('hidden')
            document.querySelector('.save-icon').classList.remove('hidden')
            const button = document.getElementById('saveJobButton')
            button.disabled = false
            console.error('Problem parsing content')
          }
        }
      )
    }
  })

  // Method for saving api keys
  document.querySelector('.settings-save-button').addEventListener('click', () => {
    const groqAPIKey = document.querySelector('#groq-api-key').value
    const notionAPIKey = document.querySelector('#notion-api-key').value
    const notionDatabaseID = document.querySelector('#notion-database-id').value

    chrome.storage.local.set(
      {
        groqAPIKey: groqAPIKey,
        notionAPIKey: notionAPIKey,
        notionDatabaseID: notionDatabaseID,
      },
      () => {
        sendNotification('Settings Saved', 'Keys Updated')
      }
    )
  })

  // Display api key input fields when settings button is pressed
  document.querySelector('.settings-button').addEventListener('click', () => {
    document.querySelector('.settings-save-button').classList.remove('hidden')

    chrome.storage.local.get(['groqAPIKey', 'notionAPIKey', 'notionDatabaseID'], (result) => {
      const fields = [
        { id: 'groq-api-key', label: 'Groq API Key', value: result.groqAPIKey },
        { id: 'notion-database-id', label: 'Notion Database ID', value: result.notionDatabaseID },
        { id: 'notion-api-key', label: 'Notion API Key', value: result.notionAPIKey },
      ]

      let content = ''

      for (const field of fields) {
        content += `
        <div class="mb-4">
          <label for="${field.id}" class="block text-sm font-medium text-gray-700">${field.label}</label>
          <input
            type="password"
            id="${field.id}"
            class="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            placeholder="Enter ${field.label}"
            value="${field.value || ''}"
          />
        </div>
      `
      }

      openModal('Settings', content)
    })
  })

  // Add options to stat range picker dropdown
  const dropdown = document.querySelector('#stat-dropdown')
  for (const [key, value] of Object.entries(RANGE)) {
    const option = document.createElement('option')
    option.value = key
    option.textContent = value
    dropdown.appendChild(option)
  }
  dropdown.addEventListener('change', (event) => getStats(event.target.value))

  /* eslint-disable-next-line */
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'scripts/libs/pdf.worker.min.js'
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.pdf'

  // Method for extracting text from pdf using pdf.js
  document.querySelector('#save-resume').addEventListener('click', () => {
    fileInput.click()

    fileInput.onchange = async () => {
      const file = fileInput.files[0]
      if (!file) {
        alert('No file selected.')
        return
      }

      const reader = new FileReader()

      reader.onload = async function (event) {
        const typedarray = new Uint8Array(event.target.result)

        try {
          /* eslint-disable-next-line */
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise

          let extractedText = ''

          // Loop through each page of the PDF and extract text
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const content = await page.getTextContent()
            const strings = content.items.map((item) => item.str)
            extractedText += strings.join(' ') + ' '
          }

          // Store the extracted text in chrome storage
          chrome.storage.local.set({ resumeText: extractedText }, function () {
            sendNotification('Resume', 'Resume saved successfully!')
          })
        } catch (error) {
          console.error('Error reading PDF:', error)
          sendNotification('Resume', 'Failed to extract text from PDF.')
        }
      }

      reader.onerror = function (event) {
        console.error('Error reading file:', event.target.error)
        sendNotification('Resume', 'Failed to read PDF file.')
      }

      reader.readAsArrayBuffer(file)
    }
  })
})
