const GROQAPIKEY = "";
const NOTIONAPIKEY = "";
const NOTIONDATABASEID = "";

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "makeAPICall") {
    call(request.data)
      .then(() => {
        sendResponse({ message: "SUCCESS", content: "Job saved successfully" });
      })
      .catch((error) => {
        console.error("Error:", error),
          sendResponse({ message: "FAILURE", content: error.message });
      });
    return true;
  }
});

const call = async (data) => {
  try {
    await checkIfJobPostingExists(data.url);
    const parsedJSON = await formatDataToJSON(data.jobDescription);
    await saveJobPosting(parsedJSON);
  } catch (e) {
    throw e;
  }
};

const formatDataToJSON = async (jobDescription) => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQAPIKEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `
	      Provide the job title and the country from the job description as a JSON object in the following format:
{ "jobTitle": "<job-title>", "country": "<country>", "url": "<url>", "company": "<company>", "description": <a short description of minimum qualifications and required qualifications as text with bullet points> }

Respond only with the JSON object, without any additional text or explanation.
	      `,
            },
            {
              role: "user",
              content: jobDescription,
            },
          ],
          model: "mixtral-8x7b-32768",
          stream: false,
          response_format: {
            type: "json_object",
          },
        }),
      },
    );

    const responseData = await response.json();
    if (responseData.error) {
      throw new Error(responseData.error.message);
    }
    const message = responseData.choices[0].message.content;
    const parsedJSON = JSON.parse(message);
    return parsedJSON;
  } catch (error) {
    console.log("groqAPIRequest:", error);
    throw error;
  }
};

const checkIfJobPostingExists = async (url) => {
  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTIONDATABASEID}/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NOTIONAPIKEY}`,
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          filter: {
            property: "URL",
            url: {
              equals: url,
            },
          },
        }),
      },
    );

    const responseData = await response.json();
    const exists = responseData.results && responseData.results.length > 0;
    if (exists) {
      throw new Error("URL already exists in the Notion database.");
    }
  } catch (error) {
    console.error("checkIfURLExistsInNotion: ", error);

    throw error;
  }
};

const saveJobPosting = async (data) => {
  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NOTIONAPIKEY}`,
        "Notion-Version": "2022-06-28",
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
              name: "Not Applied",
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
                type: "text",
                text: {
                  content: data.description,
                },
              },
            ],
          },
        },
      }),
    });

    const responseData = await response.json();
    console.log(responseData);
  } catch (error) {
    console.error("notionAPIRequest: ", error);
    throw error;
  }
};
