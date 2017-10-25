(function () {
	/*
	 * Google map and info window containers
	 */
	var _googleMap, _infoWindow;

	/*
	 * Get DOM elements
	 */
	var _burger = document.querySelector('.navbar-burger');
	var _menu = document.getElementById(_burger.dataset.target);
	var _map = document.getElementById('map');
	var _markersFilterInput = document.getElementById('markersFilterInput');
	var _markersFilterDropdown = document.getElementById('markersFilterDropdown');


	/*
	 * Location Data
	 */
	var _sanjuan_city = {lat: 19.47103, lng: -70.676351};
	var _sanjuan_locations = [
		{
				name: 'Gran Arena del Cibao',
				position: {
						lat: 19.4653224,
						lng: -70.7095788
				},
				info: ''
		},
		{
				name: 'Fortaleza San Luis',
				position: {
						lat: 19.4480365,
						lng: -70.7029076
				},
				info: ''
		},
		{
				name: 'Monumento de Santiago',
				position: {
						lat: 19.4509573,
						lng: -70.694637
				},
				info: ''
		},
		{
				name: 'Pontificia Universidad Católica Madre y Maestra',
				position: {
						lat: 19.4445363,
						lng: -70.683252
				},
				info: ''
		},
		{
				name: 'Universidad Tecnológica de Santiago',
				position: {
						lat: 19.432889,
						lng: -70.692654
				},
				info: ''
		}
	];

	/*
	 * Marker constructor
	 */
	function Marker(location, filter) {
		var self = this;

		self._location = location;

		self._marker = new google.maps.Marker({
			position: location.position,
			title: location.name,
			map: _googleMap
		});

		self._matchMarkersFilter = ko.computed(function() {
			var isMatch = self._location.name.toLowerCase()
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
			self.bounce();
			_googleMap.panTo(self._marker.getPosition());
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
						'<h2>' + response[1] + '</h2>' +
						'<p>' + response[2] + '</p>' +
						'<a class="button" target="_blank" href="' + response[3] + '">Read More on Wikipedia</a>'
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

	/*
	 * Markers VM constructor
	 */
	function MarkersViewModel() {
		var self = this;
		self._markers = ko.observableArray([]);
		self._markersFilter = ko.observable("");

		// Create markers
		_sanjuan_locations.forEach(function(loc) {
			self._markers.push(new Marker(loc, self._markersFilter));
		});

		// Show info window for a given marker
		self.showMarkerInfo = function(marker) {
			marker.loadInfoWindow();
			$(_map).click();
		}
	}

	/*
	 * The drop that spilled the glass.
	 */
	function init() {
		/*
		 * Create Google map
		 */
		_googleMap = new google.maps.Map(_map, {
			center: _sanjuan_city,
			zoom: 15
		});

		/*
		 * Create Google map Info Window
		 */
		_infoWindow = new google.maps.InfoWindow();

		/*
		 * Create markers and activates knockout.js
		 */
		ko.applyBindings(new MarkersViewModel());

		/*
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
