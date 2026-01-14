const GTFS_URL = "https://spoofster123.github.io/dublin-bus-explorer/data/gtfs.zip";

let GTFS = {
  routes: [],
  trips: [],
  stop_times: [],
  stops: [],
  shapes: []
};

async function loadGTFS() {
  const response = await fetch(GTFS_URL);
  const blob = await response.blob();

  const reader = new zip.ZipReader(new zip.BlobReader(blob));
  const entries = await reader.getEntries();

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

  for (const entry of entries) {
    if (entry.filename === "routes.txt") {
      GTFS.routes = parseCSV(await entry.getData(new zip.TextWriter()));
    }
    if (entry.filename === "trips.txt") {
      GTFS.trips = parseCSV(await entry.getData(new zip.TextWriter()));
    }
    if (entry.filename === "stop_times.txt") {
      GTFS.stop_times = parseCSV(await entry.getData(new zip.TextWriter()));
    }
    if (entry.filename === "stops.txt") {
      GTFS.stops = parseCSV(await entry.getData(new zip.TextWriter()));
    }
    if (entry.filename === "shapes.txt") {
      GTFS.shapes = parseCSV(await entry.getData(new zip.TextWriter()));
    }
  }

  await reader.close();
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

