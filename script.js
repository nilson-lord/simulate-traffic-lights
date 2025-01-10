async function initMap() {
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

    const lanes = await drawLanes(map);

    const intersections = findIntersections(lanes);
    const trafficLights = await addTrafficLightsAtIntersections(map, intersections);

    simulateRandomTraffic(map, lanes, trafficLights);
}


async function drawLanes(map) {
    try {
        const response = await fetch("lanes.json");
        const data = await response.json();

        const lanes = data.lanes;

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
    } catch (error) {
        console.error("Error loading lanes:", error);
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
        ((p1.lat - p3.lat) * (p3.lng - p4.lng) -
            (p1.lng - p3.lng) * (p3.lat - p4.lat)) /
        denominator;

    const u =
        -(((p1.lat - p2.lat) * (p1.lng - p3.lng) -
            (p1.lng - p2.lng) * (p1.lat - p3.lat)) /
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

async function addTrafficLightsAtIntersections(map, intersections) {
    const config = await fetch("duration_light.json").then((res) => res.json());

    const trafficLights = intersections.map((intersection, index) => {
        const lightConfig = config.trafficLights[index];
        const marker = new google.maps.Marker({
            position: intersection,
            map,
            icon: {
                url: `images/red-light.png`,
                scaledSize: new google.maps.Size(16, 16),
            },
            label: {
                text: String(lightConfig.id),
                color: "black",
                fontSize: "14px",
                fontWeight: "bold",
            },
        });

        return {
            id: lightConfig.id,
            position: intersection,
            state: "red",
            times: {
                green: lightConfig.greenTime,
                red: lightConfig.redTime,
                amber: lightConfig.amberTime,
            },
            marker,
        };
    });

    trafficLights.forEach((light) => {
        let currentState = "red";

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

        changeLightState();
    });

    return trafficLights;
}


let vehicles = [];

function simulateRandomTraffic(map, lanes, trafficLights) {
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
        moveVehicle(vehicle, start, end, trafficLights);
    }, 2000);
}

function moveVehicle(vehicle, start, end, trafficLights) {
    let progress = 0;
    const speed = 0.002;
    const interval = setInterval(() => {
        if (progress < 1) {
            progress += speed;
            const lat = start.lat + progress * (end.lat - start.lat);
            const lng = start.lng + progress * (end.lng - start.lng);
            vehicle.setPosition({ lat, lng });
        } else {
            clearInterval(interval);
            vehicle.setMap(null);
        }
    }, 30);
}
