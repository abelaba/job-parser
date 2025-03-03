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
          console.error('Problem parsing content')
          button.disabled = false
        }
      }
    )
  }
})

function saveJob(url, text) {
  chrome.runtime.sendMessage(
    {
      action: 'SAVEJOB',
      data: {
        jobDescription: text,
        url: url,
      },
    },
    /* eslint-disable-next-line */
    (_) => {
      const button = document.getElementById('saveJobButton')
      button.disabled = false
    }
  )
}

const getSavedJobs = () => {
  chrome.runtime.sendMessage(
    {
      action: 'GETSAVEDJOBS',
    },
    (response) => {
      if (response.message === 'SUCCESS') {
        var table = document.querySelector('.recently-saved-jobs')
        response.content.forEach((data) => {
          const row = document.createElement('tr')
          row.className = 'hover:bg-slate-100 cursor-pointer odd:bg-white even:bg-slate-50'
          row.innerHTML = `
		<td class="px-4 py-2">${data.title}</td>
		<td class="px-4 py-2">${data.company}</td>
		<td class="px-4 py-2">${data.country}</td>
	    `

          row.addEventListener('click', () => {
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
      action: 'GETSTATS',
    },
    (response) => {
      if (response.message === 'SUCCESS') {
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
          type: 'pie',
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
            responsive: false,
          },
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
        console.log('Settings saved!')
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
