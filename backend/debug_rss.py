import requests
import xml.etree.ElementTree as ET

rss_url = "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"

try:
    resp = requests.get(rss_url)
    print(f"Status: {resp.status_code}")
    
    root = ET.fromstring(resp.content)
    
    items = root.findall('.//item')
    print(f"Found {len(items)} items")
    
    for i, item in enumerate(items[:3]):
        title = item.find('title')
        link = item.find('link')
        desc = item.find('description')
        
        t_text = title.text if title is not None else "NO TITLE"
        l_text = link.text if link is not None else "NO LINK"
        
        print(f"[{i}] Title: {t_text}")
        print(f"    Link: {l_text}")
        if desc is not None and desc.text:
            print(f"    Desc Len: {len(desc.text)}")
        else:
            print(f"    Desc: None")
            
except Exception as e:
    print(f"Error: {e}")
