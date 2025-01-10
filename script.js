function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 18,
        center: { lat: -12.863298, lng: -72.693054 },
        mapTypeId: "terrain",
    });

    // Delimitar el área
    const simulationArea = new google.maps.Polygon({
        paths: [
            { lat: -12.862485, lng: -72.694245 },
            { lat: -12.862098956210257, lng: -72.6921365606499 },
            { lat: -12.864005, lng: -72.691590 },
            { lat: -12.864517, lng: -72.693749 },
        ],
        strokeColor: "#87CEEB",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#87CEEB",
        fillOpacity: 0.2,
    });

    simulationArea.setMap(map);

    const lanes = drawLanes(map);

    const intersections = findIntersections(lanes);
    const trafficLights = addTrafficLightsAtIntersections(map, intersections);

    simulateRandomTraffic(map, lanes, trafficLights);
}

function drawLanes(map) {
    const lanes = [
        [
            { lat: -12.86238, lng: -72.69372 },
            { lat: -12.86441, lng: -72.6933 },
        ],
        [
            { lat: -12.8644, lng: -72.69327 },
            { lat: -12.86238, lng: -72.69369 },
        ],
        [
            { lat: -12.86219, lng: -72.69267 },
            { lat: -12.86415, lng: -72.69221 },
        ],
        [
            { lat: -12.86414, lng: -72.69218 },
            { lat: -12.86219, lng: -72.69264 },
        ],
        [
            { lat: -12.86306, lng: -72.6941 },
            { lat: -12.86265, lng: -72.69197 },
        ],
        [
            { lat: -12.86262, lng: -72.69198 },
            { lat: -12.86302, lng: -72.69411 },
        ],
        [
            { lat: -12.86407, lng: -72.69385 },
            { lat: -12.86364, lng: -72.69169 },
        ],
        [
            { lat: -12.8636, lng: -72.6917 },
            { lat: -12.86403, lng: -72.69386 },
        ],
    ];

    lanes.forEach((lane) => {
        const laneLine = new google.maps.Polyline({
            path: lane,
            geodesic: true,
            strokeColor: "#FFFFFF",
            strokeOpacity: 1.0,
            strokeWeight: 4,
        });

        laneLine.setMap(map);
    });

    return lanes;
}

function calculateIntersection(line1, line2) {
    const [p1, p2] = line1;
    const [p3, p4] = line2;

    const denominator =
        (p1.lat - p2.lat) * (p3.lng - p4.lng) -
        (p1.lng - p2.lng) * (p3.lat - p4.lat);

    if (denominator === 0) {
        return null;
    }

    const t =
        ((p1.lat - p3.lat) * (p3.lng - p4.lng) -
            (p1.lng - p3.lng) * (p3.lat - p4.lat)) / denominator;

    const u =
        -(((p1.lat - p2.lat) * (p1.lng - p3.lng) -
            (p1.lng - p2.lng) * (p1.lat - p3.lat)) / denominator);

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            lat: p1.lat + t * (p2.lat - p1.lat),
            lng: p1.lng + t * (p2.lng - p1.lng),
        };
    }

    return null;
}

function findIntersections(lanes) {
    const intersections = [];

    for (let i = 0; i < lanes.length; i++) {
        for (let j = i + 1; j < lanes.length; j++) {
            const intersection = calculateIntersection(lanes[i], lanes[j]);
            if (intersection) {
                intersections.push(intersection);
            }
        }
    }

    return intersections;
}

function addTrafficLightsAtIntersections(map, intersections) {
    const trafficLights = intersections.map((intersection, index) => ({
        position: intersection,
        state: "red",
        marker: new google.maps.Marker({
            position: intersection,
            map,
            icon: {
                url: `images/red-light.png`,
                scaledSize: new google.maps.Size(16, 16),
            },
        }),
    }));

    // Definir intervalos específicos para cada semáforo
    const intervalTimes = [5000, 7000, 4000, 6000, 8000, 10000, 5500, 7500, 6500, 9500, 3000, 5500, 7000, 8000, 4000, 6000]; // Cambia cada semáforo en tiempos independientes (en milisegundos)

    trafficLights.forEach((light, index) => {
        setInterval(() => {
            light.state = light.state === "red" ? "green" : "red";
            const iconUrl =
                light.state === "red" ? "images/red-light.png" : "images/green-light.png";
            light.marker.setIcon({
                url: iconUrl,
                scaledSize: new google.maps.Size(16, 16),
            });
        }, intervalTimes[index]);
    });

    return trafficLights;
}


let vehicles = []; // Lista global para almacenar los vehículos

function simulateRandomTraffic(map, lanes, trafficLights) {
    const vehicleIcons = [
        "images/car2.png",    
        "images/car3.png", 
    ];

    setInterval(() => {
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const start = lane[0];
        const end = lane[1];

        const vehicle = new google.maps.Marker({
            position: start,
            map,
            icon: {
                url: vehicleIcons[Math.floor(Math.random() * vehicleIcons.length)],
                scaledSize: new google.maps.Size(32, 32),
            },
        });

        vehicles.push(vehicle); // Agregar el vehículo a la lista global
        moveVehicle(vehicle, start, end, trafficLights);

    }, 1000);
}


function calculateDistanceInMeters(pos1, pos2) {
    const R = 6371000; // Radio de la Tierra en metros
    const lat1 = pos1.lat();
    const lng1 = pos1.lng();
    const lat2 = pos2.lat;
    const lng2 = pos2.lng;

    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}



function moveVehicle(vehicle, start, end, trafficLights) {
    let progress = 0;
    const updateInterval = 30; // Intervalo de actualización en milisegundos
    const speed = 0.0025; // Velocidad del vehículo
    let isStopped = false; // Estado del vehículo (detenido o en movimiento)
    let leadingVehicle = null; // Vehículo que está adelante

    const interval = setInterval(() => {
        // Buscar semáforos cercanos y verificar su estado
        trafficLights.forEach((light) => {
            const distance = calculateDistanceInMeters(vehicle.getPosition(), light.position);
            if (distance < 10) { // Verifica si la distancia es menor a 10 metros
                if (light.state === "red") {
                    isStopped = true;
                } else if (light.state === "green") {
                    isStopped = false;
                }
            }
        });

        // Verificar vehículo delante
        leadingVehicle = findLeadingVehicle(vehicle);
        if (leadingVehicle) {
            const leadingDistance = calculateDistance(vehicle.getPosition(), leadingVehicle.getPosition());
            if (leadingDistance < 10) { // Ajusta la distancia mínima permitida
                isStopped = true; // Detenerse si hay otro vehículo muy cerca
            } else {
                isStopped = false;
            }
        }

        if (!isStopped) {
            // Avanzar el vehículo si no está detenido
            progress += speed;
            if (progress >= 1) {
                clearInterval(interval);
                vehicle.setMap(null); // Eliminar el vehículo del mapa al llegar al final
            } else {
                const lat = start.lat + progress * (end.lat - start.lat);
                const lng = start.lng + progress * (end.lng - start.lng);
                vehicle.setPosition({ lat, lng });
            }
        }
    }, updateInterval);
}

function findLeadingVehicle(vehicle) {
    let closestVehicle = null;
    let closestDistance = Infinity;

    vehicles.forEach((v) => {
        if (v !== vehicle) { // No comparar con el mismo vehículo
            const distance = calculateDistance(vehicle.getPosition(), v.getPosition());
            if (distance < closestDistance) {
                closestDistance = distance;
                closestVehicle = v;
            }
        }
    });

    return closestDistance < 10 ? closestVehicle : null; // Devuelve el vehículo más cercano si está dentro de los 10 metros
}



function calculateDistance(pos1, pos2) {
    const latDiff = pos1.lat() - pos2.lat; // Corrige el acceso a las propiedades lat y lng
    const lngDiff = pos1.lng() - pos2.lng; // Corrige el acceso a las propiedades lat y lng
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}