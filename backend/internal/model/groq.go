package model

// GroqResponse is the response structure from the Groq API.
type GroqResponse struct {
	Choices []GroqChoice `json:"choices"`
}

type GroqChoice struct {
	Message GroqMessage `json:"message"`
}

type GroqMessage struct {
	Content string `json:"content"`
}

const (
	Mixtral_Saba_24b   string = "mistral-saba-24b"
	Gemma2_9B_Instruct string = "gemma2-9b-it"
)
