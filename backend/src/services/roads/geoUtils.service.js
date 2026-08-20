export function getSegmentMidpoint(segment) {
  if (segment.start && segment.end) {
    return {
      lat: (segment.start.lat + segment.end.lat) / 2,
      lng: (segment.start.lng + segment.end.lng) / 2,
    };
  }

  const coordinates = segment.geometry?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const [startLng, startLat] = coordinates[0];
    const [endLng, endLat] = coordinates[coordinates.length - 1];
    return {
      lat: (startLat + endLat) / 2,
      lng: (startLng + endLng) / 2,
    };
  }

  throw new Error("Segment geometry is required");
}

export function calculateDistanceMeters(start, end) {
  const earthRadiusMeters = 6371000;
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lng - start.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusMeters * c).toFixed(2));
}

export function coordinatesToPoint([lng, lat]) {
  return { lat, lng };
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}
