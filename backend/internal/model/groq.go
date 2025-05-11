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
