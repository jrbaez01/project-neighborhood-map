(function () {

	/**
	 * DOM elements
	 */
	const MAP_CONTAINER = document.getElementById('map');

	/**
	 * Google map and info window containers
	 */
	let googleMap, infoWindow;

	/**
	 * Marker constructor
	 */
	function Marker(location, filter) {
		let self = this;

		// Marker raw location data
		self.location = location;

		// The actual marker
		self.marker = new google.maps.Marker({
			position: location.position,
			title: location.name,
			map: googleMap
		});

		// True or False, depending if the marker match the filter
		self.matchMarkersFilter = ko.computed(function() {
			let isMatch = self.location.name.toLowerCase()
				.indexOf(
					filter().toLowerCase()
				) >= 0;

			self.marker.setVisible( isMatch );
			return isMatch;
		});

		// Animate marker
		self.bounce = function(time=1000) {
			self.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function() {
				self.marker.setAnimation(null);
			}, time);
		};

		// Load location info from wikipedia and open a info window
		self.loadInfoWindow = function() {
			// Center map and animate marker
			self.bounce();
			googleMap.panTo(self.marker.getPosition());
			googleMap.setZoom(15);

			// Make ajax request
			$.ajax( "http://en.wikipedia.org/w/api.php", {
				dataType: "jsonp", // jsonp request to avoid CORS
				cache: true, // let the browser cache the response
				timeout: 7000,
				data: {
					action: "opensearch",
					format: "json",
					search: self.location.name,
					limit: 10,
					profile: "fuzzy"
				}
			})
			.done(function(response) {
				// If success, format info and store
				self.location.info =
					'<div class="content">' +
						'<h2>' + response[1][0] + '</h2>' +
						'<p>' + response[2][0] + '</p>' +
						'<a class="button" target="_blank" href="' + response[3][0] + '">Read More on Wikipedia</a>' +
					'<div>';
			})
			.fail(function(jqXHR) {
				// if failed, store error message instead
				self.location.info =
					'<div class="content">' +
						'<p>Failed to load this location info data.' +
						' Status: ' + jqXHR.status + ' - ' + jqXHR.statusText + '</p>' +
					'</div>';
			})
			.always(function() {
				// Show location info, either it was a success or fail
				infoWindow.setContent(self.location.info);
		        infoWindow.open(map, self.marker);
			});
		};

		// Execute loadInfoWindow on click event
		self.marker.addListener('click', self.loadInfoWindow);
	}

	/**
	 * Markers VM constructor
	 */
	function MarkersViewModel() {
		let self = this;
		self.markers = ko.observableArray([]);
		self.markersFilter = ko.observable("");
		self.markersMenu = ko.observable(true);

		// Get json locations data with fetch
		fetch(
			"https://raw.githubusercontent.com/jrbaez01/project-neighborhood-map/master/locationsdata.json",
			{
				mode: 'corn'
			}
		)
		.then(function(response) {
			// convert response to json
			return response.json();
		})
		.then(function (locations) {
			// If success, create markers
			locations.forEach(function(loc) {
				self.markers.push(new Marker(loc, self.markersFilter));
			});
		})
		.catch(function(error) {
			// if failed, alert
			alert("Sorry, failed to load locations data and create markers. " + error);
		});

		// Show info window for a given marker
		self.showMarkerInfo = function(marker) {
			marker.loadInfoWindow();
			$(MAP_CONTAINER).click(); // to hide menu
		};

		// Toggle menu
		self.markersMenuToggle = function() {
			self.markersMenu(!self.markersMenu());
		};
	}

	/**
	 * The drop that spilled the glass.
	 */
	function init() {
		/**
		 * Create Google map
		 */
		googleMap = new google.maps.Map(MAP_CONTAINER, {
			center: {lat: 40.734389, lng: -73.993212}, // TODO: move to json file
			zoom: 13
		});

		/**
		 * Create Google map Info Window
		 */
		infoWindow = new google.maps.InfoWindow();

		/**
		 * Create markers and activates knockout.js
		 */
		let markersViewModel = new MarkersViewModel();
		ko.applyBindings(markersViewModel);

		/**
		 * Add events,
		 * Close menu when map or menu item is clicked.
		 */
		$(MAP_CONTAINER).on('click touchstart', function() {
			markersViewModel.markersMenu(false);
		});
	}

	/**
	 * Handle map loading error
	 */
	function handleError() {
		alert("Sorry, the map could not be loaded. Please refresh and try again.");
	}

	// Export functions to use as google map callback
	window.initMap = init;
	window.handleErrorLoadingMap = handleError;
})();
