async function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 19,
        center: { lat: -12.863298, lng: -72.693054 },
        mapTypeId: "terrain",
    });
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
    simulationArea.setMap(map);
    const carriles = await drawLanes(map);
    findIntersections(carriles);
    addTrafficLightsAtIntersections(map);
    simulateRandomTraffic(map, carriles);
}

async function drawLanes(map) {
    try {
        const response = await fetch("lanes.json");
        const data = await response.json();
        const carriles = data;  

        Object.keys(carriles).forEach((key) => {
            const lane = carriles[key];

            const laneLine = new google.maps.Polyline({
                path: lane.coordinates,
                geodesic: true,
                strokeColor: "#FFFFFF",
                strokeOpacity: 1.0,
                strokeWeight: 4,
            });

            laneLine.setMap(map);

            const midPointIndex = Math.floor(lane.coordinates.length / 2);
            const midPoint = lane.coordinates[midPointIndex];

            const label = new google.maps.Marker({
                position: midPoint,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 0,
                },
                label: {
                    text: `Carril ${key}`,
                    color: "black",
                    fontSize: "14px",
                    fontWeight: "bold",
                },
            });
        });

        return Object.values(carriles).map(lane => lane.coordinates);  
    } catch (error) {
        console.error("Error al cargar los carriles:", error);
        return [];
    }
}

function calculateIntersection(line1, line2) {
    const [p1, p2] = line1;
    const [p3, p4] = line2;

    const denominator =
        (p1.lat - p2.lat) * (p3.lng - p4.lng) - (p1.lng - p2.lng) * (p3.lat - p4.lat);

    if (denominator === 0) {
        return null;
    }

    const t =
        ((p1.lat - p3.lat) * (p3.lng - p4.lng) - (p1.lng - p3.lng) * (p3.lat - p4.lat)) /
        denominator;

    const u =
        -(((p1.lat - p2.lat) * (p1.lng - p3.lng) - (p1.lng - p2.lng) * (p1.lat - p3.lat)) /
            denominator);

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

async function addTrafficLightsAtIntersections(map) {
    const config = await fetch("trafficLights.json").then((res) => res.json());
    const trafficLights = [];

    for (const intersectionKey in config) {
        if (config.hasOwnProperty(intersectionKey)) {
            const intersection = config[intersectionKey];
            intersection.forEach((lightConfig) => {
                const marker = new google.maps.Marker({
                    position: lightConfig.location,
                    map,
                    icon: {
                        url: `images/${lightConfig.initialState}-light.png`,
                        scaledSize: new google.maps.Size(16, 16),
                    },
                    label: {
                        text: String(lightConfig.id),
                        color: "black",
                        fontSize: "14px",
                        fontWeight: "bold",
                    },
                });

                trafficLights.push({
                    id: lightConfig.id,
                    position: lightConfig.location,
                    state: lightConfig.initialState, 
                    times: {
                        green: lightConfig.greenTime,
                        red: lightConfig.redTime,
                        amber: lightConfig.amberTime,
                    },
                    marker,
                });
            });
        }
    }

    trafficLights.forEach((light) => {

        let currentState = light.state; 
        function changeLightState() {
            if (currentState === "red") {
                currentState = "green";
                light.marker.setIcon({
                    url: "images/green-light.png",
                    scaledSize: new google.maps.Size(16, 16),
                });
                setTimeout(changeLightState, light.times.green);
            } else if (currentState === "green") {
                currentState = "amber";
                light.marker.setIcon({
                    url: "images/amber-light.png",
                    scaledSize: new google.maps.Size(16, 16),
                });
                setTimeout(changeLightState, light.times.amber);
            } else {
                currentState = "red";
                light.marker.setIcon({
                    url: "images/red-light.png",
                    scaledSize: new google.maps.Size(16, 16),
                });
                setTimeout(changeLightState, light.times.red);
            }
        }

        setTimeout(changeLightState, light.times[currentState]);
    });

    return trafficLights;
}

let vehicles = [];

function simulateRandomTraffic(map, lanes) {
    const vehicleIcons = ["images/car3.png", "images/car2.png"];

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

        vehicles.push(vehicle);
        moveVehicle(vehicle, start, end);
    }, 2000);
}

function getDistance(point1, point2) {
    return Math.sqrt(
        Math.pow(point2.lat - point1.lat, 2) + Math.pow(point2.lng - point1.lng, 2)
    );
}

function closestTrafficLight(position, trafficLights) {
    let closest = null;
    let minDistance = Infinity;

    trafficLights.forEach((light) => {
        const distance = getDistance(position, light.position);
        if (distance < minDistance) {
            closest = light;
            minDistance = distance;
        }
    });

    return closest;
}

function moveVehicle(vehicle, start, end) {
    let progress = 0;
    const speed = 0.002;

    const interval = setInterval(() => {
        const position = {
            lat: start.lat + progress * (end.lat - start.lat),
            lng: start.lng + progress * (end.lng - start.lng),
        };

        if (progress < 1) {
            progress += speed;
            vehicle.setPosition(position);
        } else if (progress >= 1) {
            clearInterval(interval);
            vehicle.setMap(null);
        }
    }, 30);
}
