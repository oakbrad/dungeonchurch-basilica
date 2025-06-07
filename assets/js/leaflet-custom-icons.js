// Custom Leaflet icons for the map
document.addEventListener('DOMContentLoaded', function() {
    // Define custom icons
    window.customIcons = {
        // DC colored bright flagred
        'flag': L.icon({
            iconUrl: '/assets/images/icons/flag.png',
            shadowUrl: '/assets/images/icons/shadow-flag.png',
            iconSize: [56, 60],     // size of the icon
            iconAnchor: [12, 54],   // point of the icon which will correspond to marker's location
            shadowSize: [60, 60],
            shadowAnchor: [12, 54],
        }),
        // Red flag icon
        'flag-red': L.icon({
            iconUrl: '/assets/images/icons/flag-red.png',
            shadowUrl: '/assets/images/icons/shadow-flag.png',
            iconSize: [56, 60],     // size of the icon
            iconAnchor: [12, 54],   // point of the icon which will correspond to marker's location
            shadowSize: [60, 60],
            shadowAnchor: [12, 54],
        }),
        // Yellow flag icon
        'flag-yellow': L.icon({
            iconUrl: '/assets/images/icons/flag-yellow.png',
            shadowUrl: '/assets/images/icons/shadow-flag.png',
            iconSize: [52, 60],     // size of the icon
            iconAnchor: [7, 56],   // point of the icon which will correspond to marker's location
            shadowSize: [60, 60],
            shadowAnchor: [7, 56],
        }),
        // Purple flag icon
        'flag-purple': L.icon({
            iconUrl: '/assets/images/icons/flag-purple.png',
            shadowUrl: '/assets/images/icons/shadow-flag.png',
            iconSize: [48, 60],     // size of the icon
            iconAnchor: [10, 54],   // point of the icon which will correspond to marker's location
            shadowSize: [60, 60],
            shadowAnchor: [10, 54],
        }),
        // Circle Map Icon
        'circle-map': L.icon({
            iconUrl: '/assets/images/icons/circle-map.png',
            //shadowUrl: '/assets/images/icons/shadow-flag.png',
            iconSize: [60, 60],     // size of the icon
            iconAnchor: [30, 30],   // point of the icon which will correspond to marker's location
            tooltipAnchor: [30, 0],   // point from which the tooltip should open relative to the iconAnchor
            //shadowSize: [60, 60],
            //shadowAnchor: [10, 54]
        }),
        // Circle Map Red
        'circle-map-red': L.icon({
            iconUrl: '/assets/images/icons/circle-map-red.png',
            //shadowUrl: '/assets/images/icons/shadow-flag.png',
            iconSize: [60, 60],     // size of the icon
            iconAnchor: [30, 30],   // point of the icon which will correspond to marker's location
            tooltipAnchor: [30, 0],   // point from which the tooltip should open relative to the iconAnchor
            //shadowSize: [60, 60],
            //shadowAnchor: [10, 54]
        })
    };
});

