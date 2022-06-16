// Initialize map
mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9hbmRzbyIsImEiOiJja3libW4yMmEwZ3hiMm9xb3Rzajhhd2ZlIn0.cvrAHAQJ8RyrY8zNU1qmBA";

// create empty locations geojson object
let mapLocations = {
  type: "FeatureCollection",
  features: []
};

// create empty locations geojson object
let regionLocations = {
  type: "FeatureCollection",
  features: []
};


// Initialize map and load in #map wrapper
let map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/joandso/cksj6jwag3q6417r3gon707ru",
  center: [-17, 38],
  zoom: 5,
  pitch: 0,
  bearing: 0
});

// Get cms items
let listLocations = $(".map-items");

// Get cms items
let listRegions = $(".region-items");


// For each collection item, grab hidden fields and convert to geojson proerty
function getGeoData() {
  listLocations.each(function (index) {
    let locationLat = $(this).find(".location-latitude").val();
    let locationLong = $(this).find(".location-longitude").val();
    let locationInfo = $(this).find(".map-card").html();
    let coordinates = [locationLong, locationLat];
    let locationID = $(this).find(".location-id").val();
    let geoData = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates
      },
      properties: {
        id: locationID,
        description: locationInfo
      }
    };

    if (mapLocations.features.includes(geoData) === false) {
      mapLocations.features.push(geoData);
    }
  });
}

// Invoke function
getGeoData();

// NEW

// For each collection item, grab hidden fields and convert to geojson proerty
function getRegionsGeoData() {
  listRegions.each(function (index) {
    let locationLat = $(this).find(".region-latitude").val();
    let locationLong = $(this).find(".region-longitude").val();
    let coordinates = [locationLong, locationLat];
    let regionID = $(this).find(".region-id").val();
    let geoData = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates
      },
      properties: {
        id: regionID,
      }
    };

    if (regionLocations.features.includes(geoData) === false) {
      regionLocations.features.push(geoData);
    }
  });
}

// Invoke function
getRegionsGeoData();


// define mapping function to be invoked later
function addMapPoints() {
  /* Add the data to your map as a layer */
  map.addLayer({
    id: "locations",
    type: "circle",
    /* Add a GeoJSON source containing place coordinates and information. */
    source: {
      type: "geojson",
      data: mapLocations
  
    },
    paint: {
      "circle-radius": 5,
      "circle-stroke-width": 1,
      "circle-color": "black",
      "circle-stroke-color": "white"
    }
  });
 
  // NEW
  
  map.addLayer({
id: 'clusters',
type: 'circle',
source: 'mapLocations',
filter: ['has', 'point_count'],
paint: {
// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
// with three steps to implement three types of circles:
//   * Blue, 20px circles when point count is less than 100
//   * Yellow, 30px circles when point count is between 100 and 750
//   * Pink, 40px circles when point count is greater than or equal to 750
'circle-color': [
'step',
['get', 'point_count'],
'#51bbd6',
100,
'#f1f075',
750,
'#f28cb1'
],
'circle-radius': [
'step',
['get', 'point_count'],
20,
100,
30,
750,
40
]
}
});
 
map.addLayer({
id: 'cluster-count',
type: 'symbol',
source: 'mapLocations',
filter: ['has', 'point_count'],
layout: {
'text-field': '{point_count_abbreviated}',
'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
'text-size': 12
}
});
 
map.addLayer({
id: 'unclustered-point',
type: 'circle',
source: 'mapLocations',
filter: ['!', ['has', 'point_count']],
paint: {
'circle-color': '#11b4da',
'circle-radius': 4,
'circle-stroke-width': 1,
'circle-stroke-color': '#fff'
}
});
 
// inspect a cluster on click
map.on('click', 'clusters', (e) => {
const features = map.queryRenderedFeatures(e.point, {
layers: ['clusters']
});
const clusterId = features[0].properties.cluster_id;
map.getSource('mapLocations').getClusterExpansionZoom(
clusterId,
(err, zoom) => {
if (err) return;
 
map.easeTo({
center: features[0].geometry.coordinates,
zoom: zoom
});
}
);
});
 
// When a click event occurs on a feature in
// the unclustered-point layer, open a popup at
// the location of the feature, with
// description HTML from its properties.
map.on('click', 'unclustered-point', (e) => {
const coordinates = e.features[0].geometry.coordinates.slice();
 
// Ensure that if the map is zoomed out such that
// multiple copies of the feature are visible, the
// popup appears over the copy being pointed to.
while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
}

 
map.on('mouseenter', 'clusters', () => {
map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', 'clusters', () => {
map.getCanvas().style.cursor = '';
});
  

  // When a click event occurs on a feature in the places layer, open a popup at the
  // location of the feature, with description HTML from its properties.
  map.on("click", "locations", (e) => {
    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
  });

  // Center the map on the coordinates of any clicked circle from the 'locations' layer.
  map.on("click", "locations", (e) => {
    map.flyTo({
      center: e.features[0].geometry.coordinates,
      speed: 0.5,
      curve: 1,
      easing(t) {
        return t;
      }
    });
  });

  // Change the cursor to a pointer when the mouse is over the 'locations' layer.
  map.on("mouseenter", "locations", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // Change it back to a pointer when it leaves.
  map.on("mouseleave", "locations", () => {
    map.getCanvas().style.cursor = "";
  });
}

//When map is loaded initialize with data
map.on("load", function (e) {
  addMapPoints();
   cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
});

// disable map zoom when using scroll
map.scrollZoom.disable();

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


$(".map-items").on("click", function () {
  let myIndex = $(this).index();
  map.flyTo({
    center: mapLocations.features[myIndex].geometry.coordinates,
    speed: 0.5,
    curve: 1,
    easing(t) {
      return t;
    }
  });
});


$(".region-items").on("click", function () {
  let myIndex = $(this).index();
  map.flyTo({
    center: regionLocations.features[myIndex].geometry.coordinates,
    speed: 2,
    zoom: 7,
    curve: 1,
    easing(t) {
      return t;
    }
  });
});
