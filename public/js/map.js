import * as maplibregl from "https://unpkg.com/maplibre-gl@6.6.0/dist/maplibre-gl.mjs";

const mapElement = document.getElementById("map");

const coordinates = JSON.parse(mapElement.dataset.coordinates);

const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/bright",
  center: coordinates,
  zoom: 12,
});

// =============================
// 🏠 HOME MARKER
// =============================

const markerElement = document.createElement("div");

markerElement.innerHTML = `
  <i class="fa-solid fa-house"></i>
`;

markerElement.style.fontSize = "28px";
markerElement.style.color = "#ff385c";
markerElement.style.cursor = "pointer";

new maplibregl.Marker({
  element: markerElement,
  anchor: "bottom",
})
  .setLngLat(coordinates)
  .addTo(map);

// =============================
// ⭕ RADIUS
// =============================

map.on("load", () => {
  map.addSource("radius", {
    type: "geojson",

    data: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
    },
  });

  map.addLayer({
    id: "radius",
    type: "circle",
    source: "radius",

    paint: {
      // screen radius
      "circle-radius": 50,

      "circle-color": "#ff385c",
      "circle-opacity": 0.15,

      // "circle-stroke-color": "#ff385c",
      // "circle-stroke-width": 2,
      // "circle-stroke-opacity": 0.5,
    },
  });
});
