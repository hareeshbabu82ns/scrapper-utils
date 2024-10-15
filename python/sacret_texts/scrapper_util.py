import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urlparse, urljoin
import json

# Example usage
# starting_url = 'https://example.com'
# scrape_page(starting_url, starting_url)


def scrape_page_json(url, starting_url, data_folder, visited_urls=None):
    if visited_urls is None:
        visited_urls = set()

    # Fetch the webpage content
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch {url}")
            return
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return

    # Parse the content using BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract elements or data that you want to save to JSON
    # For example, extracting titles, paragraphs, etc.
    page_data = {
        "url": url,
        "title": soup.title.string if soup.title else "",
        "links": [{'title': a.get_text(), 'href': a.get('href')} for a in soup.find_all('a')],
        "paragraphs": [p.get_text() for p in soup.find_all('p')],
        "contents": list(filter(None, [p.strip() for p in soup.get_text(separator='\n').split('\n')])),
        # Add more elements as needed
    }

    # Save data to a JSON file
    file_name = data_folder + url.split("/")[-1] + ".json"
    with open(file_name, "w", encoding="utf-8") as file:
        json.dump(page_data, file, ensure_ascii=False, indent=4)
        print(f"Saved {file_name}")

    # Add the current URL to visited set
    visited_urls.add(url)

    # Find all links on the page
    links = soup.find_all('a', href=True)
    for link in links:
        if link.get_text() in ['Sacred Texts', 'Hinduism', 'Index', 'English', 'Rig Veda Book 10 Index', 'Previous', 'Next'] or link.get_text().startswith('Next: Hymn'):
            continue
        next_url = link.get('href')
        full_next_url = urljoin(url, next_url)

        # Parse URLs
        parsed_starting_url = urlparse(starting_url)
        parsed_starting_url_path = '/'.join(
            parsed_starting_url.path.split('/')[:-1])
        parsed_next_url = urlparse(full_next_url)
        parsed_next_url_path = '/'.join(
            parsed_next_url.path.split('/')[:-1])

        # Check if the next URL is within the domain of the starting_url
        if parsed_next_url.netloc == parsed_starting_url.netloc and parsed_next_url_path.startswith(parsed_starting_url_path) \
                and full_next_url not in visited_urls:
            scrape_page_json(full_next_url, starting_url,
                             data_folder, visited_urls)


def scrape_page_text(url, starting_url, data_folder, visited_urls=None):
    if visited_urls is None:
        visited_urls = set()

    # Fetch the webpage content
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch {url}")
            return
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return

    # Parse the content using BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract text content
    text_content = soup.get_text()

    # Save text content to a file
    file_name = data_folder + url.split("/")[-1] + ".txt"
    with open(file_name, "w", encoding="utf-8") as file:
        file.write(text_content)
        print(f"Saved {file_name}")

    # Add the current URL to visited set
    visited_urls.add(url)

    # Find all links on the page
    links = soup.find_all('a', href=True)
    for link in links:
        next_url = link.get('href')
        full_next_url = urljoin(url, next_url)

        # Parse URLs
        parsed_starting_url = urlparse(starting_url)
        parsed_starting_url_path = '/'.join(
            parsed_starting_url.path.split('/')[:-1])
        parsed_next_url = urlparse(full_next_url)
        parsed_next_url_path = '/'.join(
            parsed_next_url.path.split('/')[:-1])

        # Check if the next URL is within the domain of the starting_url
        if parsed_next_url.netloc == parsed_starting_url.netloc and parsed_next_url_path.startswith(parsed_starting_url_path) \
                and full_next_url not in visited_urls:
            scrape_page_text(full_next_url, starting_url,
                             data_folder, visited_urls)
