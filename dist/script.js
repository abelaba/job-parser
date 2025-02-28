document
  .getElementById("saveJobButton")
  ?.addEventListener("click", async () => {
    const button = document.getElementById("saveJobButton");

    button.disabled = true;

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab && tab.id) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            const mainElement = document.querySelector("main");
            const jobText = mainElement
              ? mainElement.innerText.trim()
              : document.body.innerText.trim();
            return { url: document.URL, jobText: jobText };
          },
        },
        (results) => {
          if (results && results.length > 0) {
            const { url, jobText } = results[0].result;
            saveJob(url, jobText);
          } else {
            alert("Problem parsing content");
            console.error("Problem parsing content");
            button.disabled = false;
            button.textContent = "Save Job Posting";
          }
        },
      );
    }
  });

function saveJob(url, text) {
  chrome.runtime.sendMessage(
    {
      action: "makeAPICall",
      data: {
        jobDescription: text,
        url: url,
      },
    },
    (_) => {
      const button = document.getElementById("saveJobButton");
      button.disabled = false;
    },
  );
}

const getSavedJobs = () => {
  chrome.runtime.sendMessage(
    {
      action: "GETSAVEDJOBS",
    },
    (response) => {
      if (response.message === "SUCCESS") {
        var table = document.querySelector(".recently-saved-jobs");
        var tableContent = `
	    <tr>
		<th>Company</th>
		<th>Country</th>
		<th>URL</th>
		<th>Title</th>
	    </tr>
	`;
        response.content.forEach((data) => {
          tableContent += `
	   <tr>
		<td data-th="Title">
		${data.title}
		</td>
		<td data-th="Company">
		${data.company}
		</td>
		<td data-th="Country">
		${data.country}
		</td>
		<td data-th="URL">
		    <a href="${data.URL}" target="_blank">Apply Here</a>
		</td>
	   </tr>
	  `;
        });
        table.innerHTML = tableContent;
      }
    },
  );
};

const getStats = () => {
  chrome.runtime.sendMessage(
    {
      action: "GETSTATS",
    },
    (response) => {
      if (response.message === "SUCCESS") {
        var ctx = document.getElementById("myChart").getContext("2d");
        const labels = Object.keys(response.content);
        const values = Object.values(response.content);
        const colors = values.map(() => {
          const r = Math.floor(Math.random() * 256);
          const g = Math.floor(Math.random() * 256);
          const b = Math.floor(Math.random() * 256);
          return `rgba(${r}, ${g}, ${b}, 0.6)`;
        });
        new Chart(ctx, {
          type: "pie",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Jobs",
                data: values,
                backgroundColor: colors,
              },
            ],
          },
          options: {
            responsive: false,
          },
        });
      }
    },
  );
};

document.addEventListener("DOMContentLoaded", () => {
  getSavedJobs();
  getStats();

  let tabsContainer = document.querySelector("#tabs");

  let tabTogglers = tabsContainer.querySelectorAll("#tabs a");

  tabTogglers.forEach(function (toggler) {
    toggler.addEventListener("click", function (e) {
      e.preventDefault();

      let tabName = this.getAttribute("href");

      let tabContents = document.querySelector("#tab-contents");

      for (let i = 0; i < tabContents.children.length; i++) {
        tabTogglers[i].parentElement.classList.remove("border-b-2");
        tabContents.children[i].classList.remove("hidden");
        if ("#" + tabContents.children[i].id === tabName) {
          continue;
        }
        tabContents.children[i].classList.add("hidden");
      }
      e.target.parentElement.classList.add("border-b-2");
    });
  });
});
