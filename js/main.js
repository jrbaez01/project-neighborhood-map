(function () {

	/**
	 * DOM elements
	 */
	const _burger = document.querySelector('.navbar-burger'),
		  _menu = document.getElementById(_burger.dataset.target),
		  _map = document.getElementById('map'),
		  _markersFilterInput = document.getElementById('markersFilterInput'),
		  _markersFilterDropdown = document.getElementById('markersFilterDropdown');

	/**
	 * Location Data
	 */
	const _newyork_city  = {lat: 40.734389, lng: -73.993212};
	const _newyork_locations = [
		{
				name: 'Lower Manhattan',
				position: {
						lat: 40.712429,
						lng: -74.007803
				},
				info: ''
		},
		{
				name: 'Central Park',
				position: {
						lat: 40.771178,
						lng: -73.974239
				},
				info: ''
		},
		{
				name: 'Statue of Liberty National Monument',
				position: {
						lat: 40.689247,
						lng: -74.044471
				},
				info: ''
		},
		{
				name: 'Brooklyn Bridge',
				position: {
						lat: 40.706072,
						lng: -73.996894
				},
				info: ''
		},
		{
				name: 'Manhattan Bridge',
				position: {
						lat: 40.707571,
						lng: -73.990727
				},
				info: ''
		}
	];

	/**
	 * Google map and info window containers
	 */
	let _googleMap, _infoWindow;

	/**
	 * Marker constructor
	 */
	function Marker(location, filter) {
		let self = this;

		// Marker raw location data
		self._location = location;

		// The actual marker
		self._marker = new google.maps.Marker({
			position: location.position,
			title: location.name,
			map: _googleMap
		});

		// True or False, depending if the marker match the filter
		self._matchMarkersFilter = ko.computed(function() {
			let isMatch = self._location.name.toLowerCase()
				.indexOf(
					filter().toLowerCase()
				) >= 0;

			self._marker.setMap( isMatch ? _googleMap : null );
			return isMatch;
		});

		// Animate marker
		self.bounce = function(time=1000) {
			self._marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function() {
				self._marker.setAnimation(null);
			}, time);
		}

		// Load location info from wikipedia and open a info window
		self.loadInfoWindow = function() {
			// Center map and animate marker
			self.bounce();
			_googleMap.panTo(self._marker.getPosition());
			_googleMap.setZoom(15);

			// Make ajax request
			$.ajax( "http://en.wikipedia.org/w/api.php", {
				dataType: "jsonp", // jsonp request to avoid CORS
				cache: true, // let the browser cache the response
				timeout: 7000,
				data: {
					action: "opensearch",
					format: "json",
					search: self._location.name,
					limit: 10,
					profile: "fuzzy"
				}
			})
			.done(function(response) {
				// If success, format info and store
				self._location.info =
					'<div class="content">' +
						'<h2>' + response[1][0] + '</h2>' +
						'<p>' + response[2][0] + '</p>' +
						'<a class="button" target="_blank" href="' + response[3][0] + '">Read More on Wikipedia</a>'
					'<div>';
			})
			.fail(function(jqXHR) {
				// if failed, store error message instead
				self._location.info =
					'<div class="content">' +
						'<p>Failed to load this location info data.' +
						' Status: ' + jqXHR.status + ' - ' + jqXHR.statusText + '</p>'
					'</div>';
			})
			.always(function() {
				// Show location info, either it was a success or fail
				_infoWindow.setContent(self._location.info);
		        _infoWindow.open(map, self._marker);
			});
		}

		// Execute loadInfoWindow on click event
		self._marker.addListener('click', self.loadInfoWindow);
	}

	/**
	 * Markers VM constructor
	 */
	function MarkersViewModel() {
		let self = this;
		self._markers = ko.observableArray([]);
		self._markersFilter = ko.observable("");

		// Create markers
		_newyork_locations.forEach(function(loc) {
			self._markers.push(new Marker(loc, self._markersFilter));
		});

		// Show info window for a given marker
		self.showMarkerInfo = function(marker) {
			marker.loadInfoWindow();
			$(_map).click();
		}
	}

	/**
	 * The drop that spilled the glass.
	 */
	function init() {
		/**
		 * Create Google map
		 */
		_googleMap = new google.maps.Map(_map, {
			center: _newyork_city ,
			zoom: 13
		});

		/**
		 * Create Google map Info Window
		 */
		_infoWindow = new google.maps.InfoWindow();

		/**
		 * Create markers and activates knockout.js
		 */
		ko.applyBindings(new MarkersViewModel());

		/**
		 * Add events,
		 * Open/close menu when burger is clicked, hide when map is clicked.
		 */
		$(_burger).on('click', function() {
			_menu.classList.toggle('is-active');
		});

		$(_markersFilterInput).on('click', function() {
			_markersFilterDropdown.classList.add('is-active');
		});

		$(_map).on('click touchstart', function() {
			_menu.classList.remove('is-active');
			_markersFilterDropdown.classList.remove('is-active');
		});
	}

	// Export init function to use as google map callback
	window.initMap = init;
})()
