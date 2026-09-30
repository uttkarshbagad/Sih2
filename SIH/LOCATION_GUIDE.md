# Location & Geospatial Database Guide

This guide documents how to maintain and expand district, block, and Gram Panchayat geospatial mapping datasets.

## Location Data Schema

Each entry in `SIH/backend/data/locations.js` contains:
- `id`: Unique slug format (e.g. `od-kendrapara-rajkanika`)
- `state`: State Name
- `district`: District Name
- `block`: Block Name
- `panchayats`: Array of Gram Panchayat strings
- `coordinates`: `{ lat, lon }`
- `elevation_m`: Elevation in meters
- `agro_zone`: Agro-climatic zone classification
- `soil_type`: Dominant soil classification
