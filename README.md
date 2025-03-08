# JobParser 

**JobParser** is a lightweight and efficient Chrome extension built with JavaScript (Manifest V3) that allows users to **save, view, and track job postings** from any website using the **Groq API** and store them directly in a **Notion database**. Additionally, it provides a **streak counter** and **stat viewer** to track your job hunting progress.

---

## Features


- **Save job postings** directly to your Notion workspace
- **View saved job postings** with detailed information
- **Streak counter** to track your daily activity (job-saving consistency)
- **Stat viewer** to display job-related stats like the number of jobs saved across different categories 
- Uses the **Groq API** for intelligent content extraction

---

## Tech Stack

- JavaScript
- Chrome Extension API (Manifest V3)
- [Groq API](https://groq.com)
- [Notion API](https://developers.notion.com/)

---

## Installation

1. Clone or download this repository.
2. Open **Google Chrome** and go to `chrome://extensions`
3. Enable **Developer Mode** (top right).
4. Click **Load unpacked** and select the extension directory.

---

## Configuration

Before using the extension, you must provide the following in the extension's settings:

- `GROQ API KEY`: Your Groq API key  
- `NOTION DATABASE ID`: The ID of the Notion database where job data should be stored  
- `NOTION API KEY`: Your Notion integration secret key

> Make sure your Notion integration has access to the specified database.

### Use This Notion Template

To get started quickly, you can duplicate this ready-made Notion database template:

 [Click here to duplicate the JobParser Notion template](https://actually-scooter-8cb.notion.site/1cfc5249688a80ffaf9fef5505ae88fa?v=1cfc5249688a81438497000c5980f30e&pvs=4)

---

## Usage

1. Navigate to any job listing page in your browser.
2. Click the **JobParser** icon in your extensions bar.
3. The extension will use the Groq API to extract relevant job data (e.g., title, company, location, description).
4. Review the extracted data, then click **Save Job** to add the job posting to your Notion database.
5. Open the **JobParser** dashboard to view your saved job postings, track your **streak counter**, and see various **job stats** like the total number of jobs saved.

---

## Permissions

The extension requires the following permissions:

- `activeTab`: To access and parse job postings on the current webpage  
- `storage`: To store user-provided keys and settings securely
