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
- TailwindCSS
- Chrome Extension API (Manifest V3)
- [Groq API](https://groq.com)
- [Notion API](https://developers.notion.com/)

---

## Installation

1. Clone or download this repository.
2. Open **Google Chrome** and go to `chrome://extensions`
3. Enable **Developer Mode** (top right).
4. Click **Load unpacked** and select the extension directory and goto the `dist` folder.

---

## Project Structure

```bash
dist/
├── css/                  # Compiled and static CSS files
├── images/               # Extension assets
└── scripts/              # Main scripts used by the extension
    ├── background/       # Background scripts
    ├── content_script/   # Script injected into web pages
    ├── libs/             # External libraries
    └── utils/            # Utility functions shared across the project
        └── index.js      # Logic for the popup interface
    ├── index.html        # Popup page HTML
    └── manifest.json     # Chrome extension manifest file (v3 or v2)
```

---

## Configuration

Before using the extension, you must provide the following in the extension's settings:

- `GROQ API KEY`: Your Groq API key  
- `NOTION DATABASE ID`: The ID of the Notion database where job data should be stored  
- `NOTION API KEY`: Your Notion integration secret key

### Use This Notion Template

To get started quickly, you can duplicate this ready-made Notion database template:

 [Click here to duplicate the JobParser Notion template](https://actually-scooter-8cb.notion.site/1cfc5249688a80ffaf9fef5505ae88fa?v=1cfc5249688a81438497000c5980f30e&pvs=4)

---

## Setting Up Notion Integration

1. Go to [https://www.notion.com/my-integrations](https://www.notion.com/my-integrations) and click **"New integration"**.  
2. Give your integration a name like `JobParser`, and select the workspace where your job database is stored.  
3. Copy the **Internal Integration Token** this will be your `NOTION API KEY`.  
4. Open the Notion database you want to use (or duplicate the template above).  
5. Click the 3 dots at the top ritght of the screen
6. Scroll down to **Connections**. Search for your integration name (e.g., `JobParser`) and give it **Full Access**.
7. Confirm the integration can access the page and all of its child pages.
8. Copy the database URL and extract the **Database ID** from it. The ID is the long alphanumeric string between `/` and `?` in the URL.  
   - Example:  
     `https://www.notion.so/yourworkspace/1cfc5249688a80ffaf9fef5505ae88fa?v=...`  
      Database ID: `1cfc5249688a80ffaf9fef5505ae88fa`  
9. Paste both your Notion API Key and Database ID into the extension's settings.

---

### Get Your GROQ API Key

To use the Groq API, you'll need to sign up for an account and generate an API key.

[Follow the instructions on the Groq website](https://groq.com) to create an account and get your API key.

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
- `notification`: To send notification for success and failure events

---

## Scripts

Below are the available NPM scripts for this project:

| Command                     | Description                                                         |
|----------------------------|---------------------------------------------------------------------|
| `npm run build:css`        | Compiles Tailwind CSS from `src/styles.css` to `dist/css/index.css` and watches for changes |
| `npm run format`           | Formats all project files using Prettier                           |
| `npm run lint`             | Runs ESLint to check for linting issues                           |
| `npm run lint:fix`         | Automatically fixes linting issues using ESLint                   |
| `npm run test`             | Runs Jest tests |
