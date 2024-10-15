from scrapper_util import scrape_page_json

# RigVeda English
# starting_url = 'https://sacred-texts.com/hin/rigveda/index.htm'
# scrape_page_json(starting_url, starting_url, data_folder="./data/rigveda_en/")

# RigVeda Sanskrit
starting_url = 'https://sacred-texts.com/hin/rvsan/index.htm'
scrape_page_json(starting_url, starting_url, data_folder="./data/rigveda_san/")
