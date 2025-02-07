document.getElementById("saveJobButon")?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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
        } else {
          alert("Problem parsing content");
          console.error("Problem parsing content");
        }
      },
    );
  }
});
