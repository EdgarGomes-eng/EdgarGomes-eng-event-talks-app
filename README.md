# BigQuery Release Notes Explorer 📊

An elegant, modern single-page web application to browse, search, filter, and draft social media updates for the official Google Cloud BigQuery release notes. 

Built with a premium **glassmorphic design language**, this tracker connects to the live Google Cloud feeds to keep you up-to-date with the latest BigQuery developments.

---

## ✨ Features

- **Live RSS/Atom Feed Parsing**: Dynamically fetches and parses the official BigQuery Release Notes feed directly from Google Cloud.
- **Glassmorphic UI**: Beautiful, modern dashboard interface featuring custom HSL colors, responsive grids, sleek gradients, and subtle hover animations.
- **Smart Category Filtering**: Automatically categorizes release notes into:
  - 🚀 **Features**
  - 📢 **Announcements**
  - 🔧 **Fixes**
  - ⚠️ **Deprecations**
  - 📝 **Others/Updates**
- **Instant Search**: Quick real-time client-side search across all loaded release notes.
- **Tweet Composer Integration**: 
  - Select any release note to automatically generate a pre-formatted tweet draft.
  - Built-in live **character count indicator** (color-coded for safety limits).
  - One-click "Tweet" button that opens Twitter/X sharing intent.
  - Reset button to restore the original generated draft format.
- **Offline Caching**: Utilizes `localStorage` for instant page loads, and checks for updates in the background.
- **Graceful Error Handling**: Includes full loading skeleton state, clean error states, and a manual retry button.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.x, Flask (Lightweight Web Framework), `xml.etree.ElementTree` (Standard XML Parser).
- **Frontend**: HTML5, CSS3 (Vanilla custom styling, responsive CSS Flexbox/Grid), JavaScript (Vanilla ES6, state-driven UI updates, Cache/LocalStorage management).
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) and [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Python 3** installed on your system.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/EdgarGomes-eng/EdgarGomes-eng-event-talks-app.git
   cd EdgarGomes-eng-event-talks-app
   ```

2. **Create a virtual environment**:
   ```bash
   python3 -m venv .venv
   ```

3. **Activate the virtual environment**:
   - On Linux/macOS:
     ```bash
     source .venv/bin/activate
     ```
   - On Windows (CMD):
     ```cmd
     .venv\Scripts\activate.bat
     ```
   - On Windows (PowerShell):
     ```powershell
     .venv\Scripts\Activate.ps1
     ```

4. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## 🏃 Running the Application

To launch the development server, run:

```bash
python3 app.py
```

Or using Flask command:
```bash
flask run --port=5000
```

Once started, open your web browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📂 Project Structure

```text
├── app.py              # Flask server and XML feed parsing logic
├── requirements.txt    # Python package dependencies
├── .gitignore          # Files ignored by Git (venv, caches, etc.)
├── templates/
│   └── index.html      # Main page layout & templates
└── static/
    ├── css/
    │   └── style.css   # Custom CSS for design and glassmorphic styles
    └── js/
        └── app.js      # App state, events, filtering, and caching logic
```

---

## 📝 License

This project is open-source and available under the MIT License.
