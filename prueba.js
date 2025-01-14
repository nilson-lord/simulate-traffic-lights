function showTrafficLightRemainingTime(intersectionKey, lightId) {
    fetch('trafficLights.json')
        .then(response => response.json())
        .then(data => {
            const intersection = data[intersectionKey];
            const trafficLight = intersection.find(light => light.id === lightId);

            if (trafficLight) {
                let { initialState, greenTime, redTime, amberTime } = trafficLight;
                greenTime /= 1000; 
                redTime /= 1000;
                amberTime /= 1000;
                console.log(`Initial State: ${initialState}`);

                function displayRemainingTime() {
                    console.clear();
                    if (initialState === 'green') {
                        console.log(`GREEN: ${greenTime}s`);
                        setTimeout(() => {
                            initialState = 'amber';
                            displayRemainingTime();
                        }, greenTime * 1000);
                    } else if (initialState === 'amber') {
                        console.log(`AMBER: ${amberTime}s`);
                        setTimeout(() => {
                            initialState = 'red';
                            displayRemainingTime();
                        }, amberTime * 1000);
                    } else if (initialState === 'red') {
                        console.log(`RED: ${redTime}s`);
                        setTimeout(() => {
                            initialState = 'green';
                            displayRemainingTime();
                        }, redTime * 1000);
                    }
                }

                displayRemainingTime();
            } else {
                console.log('Semáforo no encontrado.');
            }
        })
        .catch(error => console.error('Error al cargar el JSON:', error));
}
