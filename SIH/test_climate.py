from pipeline.sources.enso import fetch_enso_data, get_latest_enso
from pipeline.sources.iod import get_dmi_timeseries, get_latest_dmi

# Test ENSO
print('Testing ENSO...')
oni = fetch_enso_data('oni')
print(f'ONI: {len(oni)} records, latest: {oni.iloc[-1] if not oni.empty else "empty"}')

nino34 = fetch_enso_data('nino34_anom')
print(f'Niño 3.4 anom: {len(nino34)} records, latest: {nino34.iloc[-1] if not nino34.empty else "empty"}')

latest = get_latest_enso('nino34_anom')
print(f'Latest ENSO: {latest}')

# Test IOD
print('\nTesting IOD...')
dmi = get_dmi_timeseries(2020, 2024)
print(f'DMI: {len(dmi)} records')
print(dmi.tail())

latest_dmi = get_latest_dmi()
print(f'Latest DMI: {latest_dmi}')