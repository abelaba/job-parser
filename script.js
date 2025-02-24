document
  .getElementById("saveJobButton")
  ?.addEventListener("click", async () => {
    const button = document.getElementById("saveJobButton");

    button.disabled = true;
    button.textContent = "Loading...";

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
    (response) => {
      const content = document.getElementById("status");
      if (response.message === "SUCCESS") {
        content.classList.add("success");
        content.classList.remove("failure");
      } else {
        content.classList.remove("success");
        content.classList.add("failure");
      }
      content.innerText = response.content;
      const button = document.getElementById("saveJobButton");
      button.disabled = false;
      button.textContent = "Save Job Posting";
    },
  );
}
