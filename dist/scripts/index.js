import { REQUESTACTION, SUCCESSMESSAGE } from './utils/constants.js'
import { sendNotification } from './utils/utils.js'

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

function saveJob(url, text) {
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
    () => {
      document.querySelector('.save-icon-loading').classList.add('hidden')
      document.querySelector('.save-icon').classList.remove('hidden')
      const button = document.getElementById('saveJobButton')
      button.disabled = false
    }
  )
}

const getSavedJobs = () => {
  chrome.runtime.sendMessage(
    {
      action: REQUESTACTION.GETSAVEDJOBS,
    },
    (response) => {
      if (response.message === SUCCESSMESSAGE) {
        var table = document.querySelector('.recently-saved-jobs')
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
          row.querySelector('.open-button').addEventListener('click', () => {
            openModal('Job Qualification', `<p> ${data.description} </p>`)
            document.querySelector('.apply-button').classList.remove('hidden')
            document.querySelector('.apply-button').href = data.url
          })

          table.appendChild(row)
        })
      }
    }
  )
}

const getStats = () => {
  chrome.runtime.sendMessage(
    {
      action: REQUESTACTION.GETSTATS,
    },
    (response) => {
      if (response.message === SUCCESSMESSAGE) {
        var ctx = document.getElementById('myChart').getContext('2d')
        const labels = Object.keys(response.content)
        const values = Object.values(response.content)
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
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Jobs',
                data: values,
                backgroundColor: colors.slice(0, values.length),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRation: true,
          },
        })
      }
    }
  )
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

document.querySelector('.settings-button').addEventListener('click', () => {
  document.querySelector('.settings-save-button').classList.remove('hidden')
  chrome.storage.local.get(['groqAPIKey', 'notionAPIKey', 'notionDatabaseID'], (result) => {
    openModal(
      'Settings',
      `
	<div class="mb-4">
	<label for="groq-api-key" class="block text-sm font-medium text-gray-700">Groq API Key</label>
	<input
	type="password"
    id="groq-api-key"
    type="text"
    class="mt-1 p-2 w-full border border-gray-300 rounded-lg"
    placeholder="Enter Groq API Key"
	value = ${result.groqAPIKey}
	/>
	</div>

	<!-- Input for Notion Database ID -->
	<div class="mb-4">
	<label for="notion-database-id" class="block text-sm font-medium text-gray-700">Notion Database ID</label>
	<input
	type="password"
    id="notion-database-id"
    type="text"
    class="mt-1 p-2 w-full border border-gray-300 rounded-lg"
    placeholder="Enter Notion Database ID"
	value = ${result.notionDatabaseID}
	/>
	</div>

	<!-- Input for Notion API Key -->
	<div class="mb-4">
	<label for="notion-api-key" class="block text-sm font-medium text-gray-700">Notion API Key</label>
	<input
	type="password"
    id="notion-api-key"
    type="text"
    class="mt-1 p-2 w-full border border-gray-300 rounded-lg"
    placeholder="Enter Notion API Key"
	value = ${result.notionAPIKey}
	/>
	</div>
	`
    )
  })
})

document.addEventListener('DOMContentLoaded', () => {
  getSavedJobs()
  getStats()
  getStreak()

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
})
