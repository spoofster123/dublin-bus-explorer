const GTFS_URL = "https://spoofster123.github.io/dublin-bus-explorer/data/gtfs.zip";

let GTFS = {
  routes: [],
  trips: [],
  stop_times: [],
  stops: [],
  shapes: []
};

async function loadGTFS() {
  const res = await fetch(GTFS_URL);
  const blob = await res.blob();
  const zip = await unzip(blob);

  function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
      const cols = line.split(",");
      const obj = {};
      headers.forEach((h, i) => obj[h] = cols[i]);
      return obj;
    });
  }

  GTFS.routes = parseCSV(await zip["routes.txt"].text());
  GTFS.trips = parseCSV(await zip["trips.txt"].text());
  GTFS.stop_times = parseCSV(await zip["stop_times.txt"].text());
  GTFS.stops = parseCSV(await zip["stops.txt"].text());
  GTFS.shapes = parseCSV(await zip["shapes.txt"].text());
}

function getTripsForRoute(routeId) {
  return GTFS.trips.filter(t => t.route_id === routeId);
}

function getStopsForTrips(tripIds) {
  const stopIds = new Set(
    GTFS.stop_times
      .filter(st => tripIds.has(st.trip_id))
      .map(st => st.stop_id)
  );
  return [...stopIds];
}

function getRoutesServingStops(stopIds) {
  const stopSet = new Set(stopIds);
  const tripIds = new Set(
    GTFS.stop_times
      .filter(st => stopSet.has(st.stop_id))
      .map(st => st.trip_id)
  );
  const routes = new Set(
    GTFS.trips
      .filter(t => tripIds.has(t.trip_id))
      .map(t => t.route_id)
  );
  return [...routes];
}

