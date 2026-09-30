// Lightweight WebSocket / Event-bus service for instant GIS Risk Map updates

class LocationSocket {
  constructor() {
    this.listeners = new Set();
    
    // Listen for custom browser location events across components
    if (typeof window !== 'undefined') {
      window.addEventListener('moes:location-change', (e) => {
        this.emit(e.detail);
      });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit(data) {
    this.listeners.forEach((cb) => cb(data));
  }

  changeLocation(locationData) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('moes:location-change', { detail: locationData })
      );
    }
  }
}

export const locationSocket = new LocationSocket();
export default locationSocket;

/** LocationSocket - Event Bus for Immediate Cross-Page Sync */
