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
{ "jobTitle": "<job-title>", "country": "<country>", "url": "<url>", "company": "<company>" }

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
