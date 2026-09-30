import requests
import re

# Try BOM DMI data
url = 'http://www.bom.gov.au/climate/enso/iod.shtml'
try:
    r = requests.get(url, timeout=30)
    print('BOM IOD Status:', r.status_code)
    # Search for data file links
    links = re.findall(r'href=["\']([^"\']+\.(?:txt|csv))["\']', r.text, re.IGNORECASE)
    for link in links:
        print(f'Found data link: {link}')
except Exception as e:
    print(f'BOM IOD ERROR: {e}')

print('---')

# Try NOAA PSL DMI data file
url = 'https://psl.noaa.gov/data/correlation/dmi.data'
try:
    r = requests.get(url, timeout=30)
    print('NOAA DMI data Status:', r.status_code)
    print(r.text[:1000])
except Exception as e:
    print(f'ERROR: {e}')

print('---')

# Try another known DMI source
url = 'https://www.esrl.noaa.gov/psd/data/correlation/dmi.data'
try:
    r = requests.get(url, timeout=30)
    print('ESRL DMI data Status:', r.status_code)
    print(r.text[:1000])
except Exception as e:
    print(f'ERROR: {e}')