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
        response.content.forEach((data) => {
          const row = document.createElement("tr");
          row.className =
            "hover:bg-slate-100 cursor-pointer odd:bg-white even:bg-slate-50";
          row.innerHTML = `
		<td class="px-4 py-2">${data.title}</td>
		<td class="px-4 py-2">${data.company}</td>
		<td class="px-4 py-2">${data.country}</td>
	    `;
          row.addEventListener("click", () => {
            window.open(data.url, "_blank");
          });

          table.appendChild(row);
        });
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
        const colors = [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(100, 149, 237, 0.6)",
          "rgba(34, 193, 195, 0.6)",
          "rgba(253, 187, 45, 0.6)",
          "rgba(231, 76, 60, 0.6)",
          "rgba(46, 204, 113, 0.6)",
        ];
        new Chart(ctx, {
          type: "pie",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Jobs",
                data: values,
                backgroundColor: colors.slice(0, values.length),
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
