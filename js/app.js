const REALTIME_URL =
  "https://api.nationaltransport.ie/gtfsr/v2/vehiclePositions?format=json";

const API_KEY = "88222d735d72448ebf895d6988bef20e";

let map = L.map("map").setView([53.3498, -6.2603], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

let busMarkers = [];
let routeColors = {};
const palette = ["#ff595e", "#1982c4", "#6a4c93", "#8ac926", "#ffca3a", "#1982c4"];

function clearMarkers() {
  busMarkers.forEach(m => map.removeLayer(m));
  busMarkers = [];
}

async function fetchRealtime() {
  const res = await fetch(REALTIME_URL, {
    headers: { "x-api-key": API_KEY }
  });
  const data = await res.json();
  return data.entity || [];
}

async function drawLiveBuses(routeIds) {
  clearMarkers();
  const entities = await fetchRealtime();

  entities.forEach(e => {
    const v = e.vehicle;
    if (!v || !v.trip || !v.position) return;

    const routeId = v.trip.routeId;
    if (!routeIds.includes(routeId)) return;

    const lat = v.position.latitude;
    const lon = v.position.longitude;
    const color = routeColors[routeId] || "#888";

    const marker = L.circleMarker([lat, lon], {
      radius: 7,
      color,
      fillColor: color,
      fillOpacity: 0.9
    })
      .bindPopup(`Route: ${routeId}`)
      .addTo(map);

    busMarkers.push(marker);
  });
}

async function computeHopNetwork(baseRoute, hops) {
  let visited = new Set([baseRoute]);
  let frontier = [baseRoute];

  for (let h = 0; h < hops; h++) {
    let next = [];

    for (const route of frontier) {
      const trips = getTripsForRoute(route);
      const tripIds = new Set(trips.map(t => t.trip_id));
      const stops = getStopsForTrips(tripIds);
      const connected = getRoutesServingStops(stops);

      connected.forEach(r => {
        if (!visited.has(r)) {
          visited.add(r);
          next.push(r);
        }
      });
    }

    frontier = next;
  }

  return [...visited];
}

document.getElementById("goBtn").addEventListener("click", async () => {
  const route = document.getElementById("routeInput").value.trim();
  const hops = parseInt(document.getElementById("hopInput").value);

  if (!route) return alert("Enter a route");

  document.getElementById("status").textContent = "Loading GTFS…";
  await loadGTFS();

  document.getElementById("status").textContent = "Computing network…";
  const routes = await computeHopNetwork(route, hops);

  routes.forEach((r, i) => {
    routeColors[r] = palette[i % palette.length];
  });

  document.getElementById("status").textContent =
    "Routes: " + routes.join(", ");

  await drawLiveBuses(routes);
});

