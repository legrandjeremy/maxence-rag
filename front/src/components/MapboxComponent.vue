<script setup lang="ts">
	import { onMounted, ref, watch } from "vue"
	import mapboxgl from "mapbox-gl"

	import axios from "axios"

	const emit = defineEmits(["update-mapbox", "select-marker"]);

	const props = defineProps<{displaySearchBox?: boolean, zoom?: number}>();


	// Replace with your Mapbox token
	const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || ''
	mapboxgl.accessToken = MAPBOX_TOKEN

	const mapContainer = ref<HTMLElement | null>(null)
	const searchQuery = ref<string>("")
	const searchResults = ref<{ name: string; mapbox_id: string }[]>([])
	let map: mapboxgl.Map|null = null
	let marker: mapboxgl.Marker|null = null
	let searchTimeout: ReturnType<typeof setTimeout> | null = null
	// Store all markers to be able to clear them
	let markers: mapboxgl.Marker[] = []

	onMounted(() => {
		if (!mapContainer.value) return;

		const mapObject = new mapboxgl.Map({
			container: mapContainer.value,
			style: 'mapbox://styles/jeremylegranduci/cm7n7j1oj00y101ry63zu75zp',
			center: [6.933483, 46.318279], // Default to Paris
			zoom: props.zoom ?? 10,
		})

		// Handle map clicks to place a marker
		mapObject.on("click", (e: mapboxgl.MapMouseEvent) => {
			if (!map) {
				return
			}

			if (!props.displaySearchBox) {
				return
			}

			const lngLat = e.lngLat
			setMarker([lngLat.lng, lngLat.lat], null)

			emit("update-mapbox", { coords: [lngLat.lng, lngLat.lat] });
		});

		map = mapObject
	})

	interface SuggestionType {
		name: string;
		mapbox_id: string;
		place_formatted: string;
	}

	// Fetch search results from Mapbox API
	const searchPlaces = async () => {
		if (!searchQuery.value.trim()) {
			searchResults.value = [];
			return;
		}

		const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(searchQuery.value)}&access_token=${MAPBOX_TOKEN}&limit=10&session_token=dsksdjk`;

		try {
			const response = await axios.get(url);
			searchResults.value = response.data.suggestions.map((suggestion: SuggestionType) => ({
			name: suggestion.name + ' => ' + suggestion.place_formatted,
			mapbox_id: suggestion.mapbox_id,
			}));
		} catch (error) {
			console.error("Error fetching places:", error);
		}
	};

	// Set marker on the map
	const setMarker = (chosenCoords: [number, number], feature: mapboxgl.MapboxGeoJSONFeature | null) => {
		const currentMap = map; 
		if (!currentMap) {
			console.error("Map instance is not available");
			return;
		}

		let coords: [number, number] = chosenCoords;
		
		// Handle feature coordinate extraction if available
		if (feature && feature.geometry.type === 'Point') {
			coords = feature.geometry.coordinates as [number, number];
		}

		currentMap.flyTo({ center: coords, zoom: props.zoom	?? 10 });
		if (marker) {
			marker.remove()
		}

		marker = new mapboxgl.Marker().setLngLat(coords).addTo(currentMap)

		emit("update-mapbox", { coords, feature });
	};

	export interface AddMarkerData {
		color: string,
		label?: string
		id?: string
	}

	// Add marker on the map
	const addMarker = (coords: [number, number], data: AddMarkerData, flyToCoordinates = false) => {
		const currentMap = map; 
		if (!currentMap) {
			console.error("Map instance is not available");
			return;
		}

		const color = data.color ?? '#2003fc'

		const newMarker = new mapboxgl.Marker({ "color": color })
		.setLngLat(coords)
		.setPopup(new mapboxgl.Popup().setHTML("<span>" + data.label + "</span>"))
		.addTo(currentMap)

		newMarker.getElement().addEventListener('click', () => {
			newMarker.togglePopup()
			emit("select-marker", { coords, data })
		});
		
		if (flyToCoordinates) {
			currentMap.flyTo({ center: coords, zoom: props.zoom ?? 14 });
			currentMap.resize();
		}
		
		// Store the marker for later removal
		markers.push(newMarker);
		
		return newMarker;
	};

	// Clear all markers from the map
	const clearMarkers = () => {
		markers.forEach(marker => {
			marker.remove();
		});
		markers = [];
	};

	const selectPlace = async (suggestion: { mapbox_id: string}) => {
		if (!props.displaySearchBox) {
			return
		}
		try {
			const response = await axios.get(`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?access_token=${MAPBOX_TOKEN}&session_token=dsksdjk&language=en`);
			searchResults.value = [];
			
			const feature = response.data.features[0];
			// Ensure we have a Point geometry and can get coordinates
			if (feature && feature.geometry.type === 'Point') {
				setMarker(feature.geometry.coordinates as [number, number], feature);
			}
		} catch (error) {
			console.error("Error in selectPlace:", error);
			return null;
		}
	};

	// Debounced search function
	watch(searchQuery, () => {
		if (searchTimeout) {
			clearTimeout(searchTimeout)
		}

		searchTimeout = setTimeout(() => {
			void searchPlaces();
		}, 300);
	});

	// Watch for zoom changes
	watch(() => props.zoom, (newZoom) => {
		if (map && newZoom) {
			map.setZoom(newZoom)
		}
	})

	// Set zoom level on the map
	const setZoom = (zoom: number) => {
		if (map) {
			map.setZoom(zoom)
		}
	}

	// Expose setMarker so parent components can use it
	defineExpose({ setMarker, addMarker, setZoom, clearMarkers });
</script>

<template>
	<link href='https://api.tiles.mapbox.com/mapbox-gl-js/v0.45.0/mapbox-gl.css' rel='stylesheet' />

  <div class="container" :class="!props.displaySearchBox ? ' no-search' : ''">
    <!-- Left Panel (Search) -->
    <div class="search-panel" v-if="props.displaySearchBox">
			Find a place by searching here or select a point on the map : <br />
      <input
        v-model="searchQuery"
        :placeholder="$t('mapbox_component.search_place_input')"
        class="search-input"
      />
      <ul v-if="searchResults.length" class="results-list">
        <li v-for="(suggestion, index) in searchResults" :key="index" @click="selectPlace(suggestion)">
          {{ suggestion.name }}
        </li>
      </ul>
    </div>

    <!-- Right Panel (Map) -->
    <div class="map-container" ref="mapContainer"></div>
  </div>
</template>

<style scoped>
	.container {
		display: flex;
		width: 100%;
		height: 400px;
	}

	.container.no-search {
		height: 600px;
	}

	/* Left Panel */
	.search-panel {
		width: 35%;
		padding: 16px;
		box-shadow: 2px 0px 10px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		border-right: 2px solid #ddd;
	}

	.search-input {
		width: 100%;
		padding: 10px;
		font-size: 16px;
		border: 1px solid #ddd;
		border-radius: 4px;
		outline: none;
		transition: all 0.2s ease-in-out;
	}

	.search-input:focus {
		border-color: #007bff;
		box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
	}

	.results-list {
		list-style: none;
		padding: 0;
		margin-top: 10px;
		max-height: 200px;
		overflow-y: auto;
		border-radius: 4px;
		border: 1px solid #ddd;
		box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease-in-out;
	}

	.results-list li {
		padding: 12px;
		cursor: pointer;
		border-bottom: 1px solid #eee;
		transition: background 0.2s;
	}

	.results-list li:hover {
		background: #f0f0f0;
		color: #007bff;
	}

	/* Right Panel */
	.map-container {
		flex: 1;
		height: 100%;
		border-left: 2px solid #ddd;
	}

	#map {
		width: 100%;
		height: 100vh;
	}

	.mapboxgl-marker {
			width: 25px;
			height: 25px;
			border-radius: 50%;
			border:1px solid gray;
			background-color:yellow;
	}
</style>