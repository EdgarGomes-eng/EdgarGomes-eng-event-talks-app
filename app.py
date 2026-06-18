import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# URL of the BigQuery Release Notes feed
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def extract_type_and_summary(content_html):
    """
    Extracts the type of release note (e.g. Feature, Announcement, Fix, Deprecation)
    from the h3 tag and provides a clean plain-text summary of the content.
    """
    if not content_html:
        return "Update", "", ""

    # Find the category type from <h3>...</h3>
    type_match = re.search(r'<h3>(.*?)</h3>', content_html, re.IGNORECASE)
    note_type = type_match.group(1).strip() if type_match else "Update"

    # Remove the <h3> header to avoid duplicating in summary
    body_html = re.sub(r'<h3>.*?</h3>', '', content_html, count=1, flags=re.IGNORECASE)

    # Clean HTML tags to get plain text
    clean_text = re.sub(r'<[^>]+>', ' ', body_html)
    # Decode common HTML entities (basic)
    clean_text = clean_text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    # Normalize spaces
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()

    # Generate a brief summary (first 180 characters)
    summary = clean_text[:180] + "..." if len(clean_text) > 180 else clean_text

    return note_type, summary, clean_text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    try:
        # Fetch the XML feed
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BigQueryReleaseNotesApp/1.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()

        # Parse XML
        root = ET.fromstring(xml_data)
        
        # Namespace mapping for Atom
        ns = {'ns': 'http://www.w3.org/2005/Atom'}
        
        # Extract metadata
        feed_title = root.find('ns:title', ns)
        feed_title_text = feed_title.text if feed_title is not None else "BigQuery Release Notes"
        
        feed_updated = root.find('ns:updated', ns)
        feed_updated_text = feed_updated.text if feed_updated is not None else ""

        entries = []
        for entry in root.findall('ns:entry', ns):
            title_elem = entry.find('ns:title', ns)
            id_elem = entry.find('ns:id', ns)
            updated_elem = entry.find('ns:updated', ns)
            content_elem = entry.find('ns:content', ns)
            link_elem = entry.find('ns:link', ns)

            title = title_elem.text if title_elem is not None else ""
            entry_id = id_elem.text if id_elem is not None else ""
            updated_date = updated_elem.text if updated_elem is not None else ""
            content_html = content_elem.text if content_elem is not None else ""
            link = link_elem.attrib.get('href', '') if link_elem is not None else ""

            # Extract structured info from HTML
            note_type, summary, clean_text = extract_type_and_summary(content_html)

            entries.append({
                'title': title,         # e.g., "June 17, 2026"
                'id': entry_id,
                'updated': updated_date,
                'link': link,
                'content_html': content_html,
                'type': note_type,
                'summary': summary,
                'clean_text': clean_text
            })

        return jsonify({
            'success': True,
            'title': feed_title_text,
            'updated': feed_updated_text,
            'notes': entries
        })

    except Exception as e:
        app.logger.error(f"Error fetching/parsing feed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
