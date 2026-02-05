from GoogleNews import GoogleNews
import json

def test_news():
    print("Testing GoogleNews...")
    googlenews = GoogleNews(lang='en', region='IN')
    googlenews.search('Indian Stock Market')
    results = googlenews.result()
    print(f"Found {len(results)} results")
    if results:
        print(json.dumps(results[0], indent=2, default=str))

if __name__ == "__main__":
    test_news()
