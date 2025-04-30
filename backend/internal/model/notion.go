package model

type NotionProperties struct {
	AppliedDate struct {
		Date *struct {
			Start string `json:"start"`
		} `json:"date"`
	} `json:"Applied Date"`
	Status struct {
		Status struct {
			Name string `json:"name"`
		} `json:"status"`
	} `json:"Status"`
	Link struct {
		Title []struct {
			PlainText string `json:"plain_text"`
		} `json:"title"`
	} `json:"Link"`
	Company struct {
		Select struct {
			Name string `json:"name"`
		} `json:"select"`
	} `json:"Company"`
	Country struct {
		Select struct {
			Name string `json:"name"`
		} `json:"select"`
	} `json:"Country"`
	URL struct {
		URL string `json:"url"`
	} `json:"URL"`
	Description struct {
		RichText []struct {
			PlainText string `json:"plain_text"`
		} `json:"rich_text"`
	} `json:"Description"`
}

type NotionPage struct {
	Properties NotionProperties `json:"properties"`
}

type NotionResponse struct {
	Results []struct {
		ID         string           `json:"id"`
		Link       string           `json:"link"`
		Properties NotionProperties `json:"properties"`
	} `json:"results"`
}
