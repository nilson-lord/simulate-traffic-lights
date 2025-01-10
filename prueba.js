function calculateIntersection(line1, line2) {
    const [p1, p2] = line1;
    const [p3, p4] = line2;

    const denominator =
        (p1.lat - p2.lat) * (p3.lng - p4.lng) -
        (p1.lng - p2.lng) * (p3.lat - p4.lat);

    if (denominator === 0) {
        return null; // Líneas paralelas o coincidentes
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
        // Punto de intersección
        return {
            lat: p1.lat + t * (p2.lat - p1.lat),
            lng: p1.lng + t * (p2.lng - p1.lng),
        };
    }

    return null; // No hay intersección
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

// Ejemplo con tus carriles
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

const intersections = findIntersections(lanes);
console.log(intersections);
