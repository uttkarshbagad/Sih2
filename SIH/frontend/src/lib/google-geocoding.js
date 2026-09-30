import { loadGoogleMaps } from './google-maps';

const INDIA_BOUNDS = {
  south: 6.554607,
  west: 68.162386,
  north: 35.493310,
  east: 97.395555,
};

const PINCODE_REGEX = /^\d{6}$/;

export function validatePincode(pincode) {
  if (!pincode || typeof pincode !== 'string') {
    return { valid: false, error: 'PIN code is required' };
  }
  const trimmed = pincode.trim();
  if (!PINCODE_REGEX.test(trimmed)) {
    return { valid: false, error: 'PIN code must be exactly 6 digits' };
  }
  return { valid: true, pincode: trimmed };
}

export async function geocodePincode(pincode) {
  const validation = validatePincode(pincode);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cleanPin = validation.pincode;
  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();

  const result = await new Promise((resolve, reject) => {
    geocoder.geocode(
      {
        address: cleanPin,
        componentRestrictions: { country: 'IN' },
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(INDIA_BOUNDS.south, INDIA_BOUNDS.west),
          new google.maps.LatLng(INDIA_BOUNDS.north, INDIA_BOUNDS.east)
        ),
      },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          resolve(results);
        } else if (status === 'ZERO_RESULTS') {
          reject(new Error(`No location found for PIN code ${cleanPin}`));
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      }
    );
  });

  const topResult = result[0];
  const location = topResult.geometry.location;
  const lat = location.lat();
  const lng = location.lng();

  let postalCode = '';
  if (topResult.address_components) {
    const postalComp = topResult.address_components.find((c) =>
      c.types.includes('postal_code')
    );
    if (postalComp) {
      postalCode = postalComp.long_name;
    }
  }

  return {
    lat,
    lng,
    address: topResult.formatted_address,
    postalCode: postalCode || cleanPin,
  };
}

export async function geocodeFromCoords(lat, lng) {
  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();

  const result = await new Promise((resolve, reject) => {
    geocoder.geocode(
      { location: new google.maps.LatLng(lat, lng) },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      }
    );
  });

  const topResult = result[0];
  let postalCode = '';
  if (topResult.address_components) {
    const postalComp = topResult.address_components.find((c) =>
      c.types.includes('postal_code')
    );
    if (postalComp) {
      postalCode = postalComp.long_name;
    }
  }

  return {
    lat,
    lng,
    address: topResult.formatted_address,
    postalCode,
  };
}
