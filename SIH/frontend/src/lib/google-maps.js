import { Loader } from '@googlemaps/js-api-loader';

let googleInstance = null;
let loaderInstance = null;

export function getGoogleMapsLoader() {
  if (loaderInstance) return loaderInstance;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY environment variable');
  }

  loaderInstance = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['maps', 'geocoding'],
  });

  return loaderInstance;
}

export async function loadGoogleMaps() {
  if (googleInstance) return googleInstance;

  const loader = getGoogleMapsLoader();
  googleInstance = await loader.load();
  return googleInstance;
}

export function isGoogleMapsLoaded() {
  return googleInstance !== null && typeof googleInstance.maps !== 'undefined';
}
