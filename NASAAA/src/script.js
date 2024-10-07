import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetPlanet = null; // The planet that will be zoomed into
let isLockedOn = false;  // To track if the camera is locked on a planet


// Canvas and Scene
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Load textures for planets
const mercuryTexture = textureLoader.load('/textures/8k_mercury.jpg');
const venusTexture = textureLoader.load('/textures/8k_venus_surface.jpg');
const earthTexture = textureLoader.load('/textures/8k_earth_nightmap.jpg');
const marsTexture = textureLoader.load('/textures/8k_mars.jpg');
const jupiterTexture = textureLoader.load('/textures/8k_jupiter.jpg');
const saturnTexture = textureLoader.load('/textures/8k_saturn.jpg');
const uranusTexture = textureLoader.load('/textures/2k_uranus.jpg');
const neptuneTexture = textureLoader.load('/textures/2k_neptune.jpg');
const sunTexture = textureLoader.load('/textures/8k_sun.jpg')
const saturnRingTexture = textureLoader.load('/textures/ring.jpg');
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({map: sunTexture})
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planet helper function
function createPlanet(size, texture) {
    const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
    const planetMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    return planet;
}

// Create planets with sizes, textures, and distances
// Units
// Size: km * 0.000119662 for rocky planets or * 2.76537E-05 for gas giants
const mercury = createPlanet(0.29, mercuryTexture);
const venus = createPlanet(0.72, venusTexture);
const earth = createPlanet(0.76, earthTexture);
const mars = createPlanet(0.41, marsTexture);
const jupiter = createPlanet(1.93, jupiterTexture);
const saturn = createPlanet(1.61, saturnTexture);

const ringInnerRadius = 2.125;  // Inner radius of the ring
const ringOuterRadius = 3.125;    // Outer radius of the ring
const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);

// Create the material for the ring with the texture
const ringMaterial = new THREE.MeshBasicMaterial({
    map: saturnRingTexture,
    side: THREE.DoubleSide,  // Make the ring visible from both sides
    transparent: true        // Ensure transparency for the ring texture
});

// Create the ring mesh
const saturnRing = new THREE.Mesh(ringGeometry, ringMaterial);

// Position the ring at Saturn's position
saturnRing.position.set(0, 0, 0); // Ensure it is centered on Saturn
saturnRing.rotation.x = Math.PI / 2; // Align the ring horizontally
saturnRing.rotation.x = Math.PI / 2; // Align horizontally
saturnRing.rotation.z = THREE.MathUtils.degToRad(27); // Tilt the ring by 27 degrees
// Add the ring to Saturn so it moves with the planet
saturn.add(saturnRing);

const uranus = createPlanet(0.70, uranusTexture);
const neptune = createPlanet(0.68, neptuneTexture);

// Data about the planets
// Units
// Eccentricity: rad, SemiMajorAxis: au, OrbitalPeriod: days, Inclination: deg, LongitudeOfAscendingNode: deg
// Rocky planets SemiMajorAxis multiplied by 1.25
// Gas giants SemiMajorAxis multiplied by 0.75
const planetOrbitData = [
    { planet: mercury, eccentricity: 0.20563593, semiMajorAxis: 0.4838740875, orbitalPeriod: 87.97, inclination: 7.00497902, longitudeOfAscendingNode: 48.33076593 },  
    { planet: venus, eccentricity: 0.00677672, semiMajorAxis: 0.904169575, orbitalPeriod: 224.70, inclination: 3.39467605, longitudeOfAscendingNode: 76.67984255 },
    { planet: earth, eccentricity: 0.01671123, semiMajorAxis: 1.2500032625, orbitalPeriod: 365.26, inclination: -0.00001531, longitudeOfAscendingNode: 0.0 },
    { planet: mars, eccentricity: 0.09339410, semiMajorAxis: 1.904637925, orbitalPeriod: 686.98, inclination: 1.84969142, longitudeOfAscendingNode: 49.55953891 },
    { planet: jupiter, eccentricity: 0.04838624, semiMajorAxis: 3.90216525, orbitalPeriod: 4331.98, inclination: 1.30439695, longitudeOfAscendingNode: 100.47390909 },
    { planet: saturn, eccentricity: 0.05386179, semiMajorAxis: 7.152506955, orbitalPeriod: 10760.56, inclination: 2.48599187, longitudeOfAscendingNode: 113.66242448 },
    { planet: uranus, eccentricity: 0.04725744, semiMajorAxis: 14.39187348, orbitalPeriod: 30685.49, inclination: 0.77263783, longitudeOfAscendingNode: 74.01692503 },
    { planet: neptune, eccentricity: 0.00859048, semiMajorAxis: 22.55244207, orbitalPeriod: 60191.20, inclination: 1.77004347, longitudeOfAscendingNode: 131.78422574 }
];

planetOrbitData.forEach(({ planet, eccentricity, semiMajorAxis, orbitalPeriod, inclination, longitudeOfAscendingNode }) => {
    // Scale the units
    semiMajorAxis *= 10;

    const group = new THREE.Object3D();

    // Convert values from degrees to radians and rotate the group
    const inclinationRadians = THREE.MathUtils.degToRad(inclination);
    const longitudeOfAscendingNodeRadians = THREE.MathUtils.degToRad(longitudeOfAscendingNode);
    group.rotation.x = inclinationRadians;
    group.rotation.y = longitudeOfAscendingNodeRadians;

    // Add the planet to the group
    group.add(planet);

    // Add the orbit to the group
    const orbit = createOrbit(eccentricity, semiMajorAxis);
    group.add(orbit);

    // Add the group to the scene
    scene.add(group);
});

// Create the material for the skybox with the texture
const skyboxImagePaths = [
    '/textures/skybox/front.jpg',  // Front
    '/textures/skybox/back.jpg',  // Back
    '/textures/skybox/top.jpg',  // Top
    '/textures/skybox/bottom.jpg',  // Bottom
    '/textures/skybox/left.jpg',  // Left
    '/textures/skybox/right.jpg'   // Right
];
const skyboxMaterialArray = skyboxImagePaths.map(image => {
    let texture = textureLoader.load(image);
    return new THREE.MeshBasicMaterial({map: texture, side: THREE.BackSide});
});

// Create skybox geometry and mesh
const skyboxGeometry = new THREE.BoxGeometry(100000, 100000, 100000);
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterialArray);

// Add skybox to scene
scene.add(skybox);

// Camera setup
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 300000);

// Define initial camera angles and radius
const initialAzimuthalAngle = 0;  // degrees
const initialPolarAngle = 45;     // degrees
const initialRadius = 60;         // distance from origin

// Convert angles to radians
const phi = THREE.MathUtils.degToRad(initialPolarAngle);       // Polar angle
const theta = THREE.MathUtils.degToRad(initialAzimuthalAngle); // Azimuthal angle

// Set camera position using spherical coordinates
const spherical = new THREE.Spherical(initialRadius, phi, theta);
camera.position.setFromSpherical(spherical);

camera.lookAt(0, 0, 0);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Limit zoom
controls.minDistance = 10;
controls.maxDistance = 400;

// Limit pan
const minPan = new THREE.Vector3(-250, 0, -250);
const maxPan = new THREE.Vector3(250, 0, 250);
const _v = new THREE.Vector3();
controls.addEventListener("change", () => {
    _v.copy(controls.target);
    controls.target.clamp(minPan, maxPan);
    _v.sub(controls.target);
    camera.position.sub(_v);
});

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Animation loop for planetary orbits
const clock = new THREE.Clock();
// Helper function to solve Kepler's Equation iteratively
function solveKepler(M, e, tolerance = 1e-6) {
    let E = M; // Start with the mean anomaly as the first guess
    let delta = 1;
    
    // Newton-Raphson iteration to solve for E
    while (Math.abs(delta) > tolerance) {
        delta = E - e * Math.sin(E) - M;
        E = E - delta / (1 - e * Math.cos(E));
    }
    
    return E;
}

// Function to calculate the true anomaly from eccentric anomaly
function calculateTrueAnomaly(E, e) {
    return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

// Modified animatePlanets function with Keplerian orbits
function animatePlanets(elapsedTime) {
    planetOrbitData.forEach(({ planet, eccentricity, semiMajorAxis, orbitalPeriod, inclination }) => {
        // Scale the units
        orbitalPeriod /= 365.26 / 10;
        semiMajorAxis *= 10;

        // Calculate the mean anomaly M (elapsedTime represents time in years)
        const meanAnomaly = (2 * Math.PI * elapsedTime / orbitalPeriod) % (2 * Math.PI);

        // Solve for the eccentric anomaly E
        const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);

        // Calculate the true anomaly θ
        const trueAnomaly = calculateTrueAnomaly(eccentricAnomaly, eccentricity);

        // Calculate the distance from the Sun (r) based on true anomaly and semi-major axis
        const distance = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));

        // Position in 2D plane (x, z), using the true anomaly
        planet.position.x = distance * Math.cos(trueAnomaly);
        planet.position.z = distance * Math.sin(trueAnomaly);

        // Rotate planets around themselves (not part of Keplerian mechanics)
        planet.rotation.y += 0.01;
    });
}

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast ray from camera to mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with planets
    const planets = [mercury, venus, earth, mars, jupiter, saturn, uranus, neptune];
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
        targetPlanet = intersects[0].object;
        isLockedOn = false;  // Unlock the camera to start the zoom process
        console.log('Clicked on:', targetPlanet.name);  // Debug
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        camera.position.set(0, 0, 60);  // Reset camera to the default position
        isLockedOn = false;
        targetPlanet = null;
    }
});

function createOrbit(eccentricity, semiMajorAxis) {
    const points = [];
    const segments = 128; // Number of segments for smoother orbits

    // Loop to calculate points for the elliptical orbit
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        points.push(new THREE.Vector3(x, 0, z)); // Adding points to the orbit path
    }

    // Create geometry from the calculated points
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    // Create the orbit line
    return new THREE.Line(orbitGeometry, orbitMaterial);
}

// Animate the skybox with a simple rotation
function animateSkybox() {
    skybox.rotation.x += 0.00025;
    skybox.rotation.y += 0.00025;
}

// Create variables to store the orbit speed and elapsed time
let orbitSpeed = 1;
let elapsedTime = 0;

// Add an event listener to the slider to capture the value
const speedSlider = document.getElementById('speed');
speedSlider.addEventListener('input', (event) => {
    orbitSpeed = parseFloat(event.target.value);  // Update orbit speed based on slider
});

// Animation loop
function tick() {
    elapsedTime += orbitSpeed / 100;

    // Update the planets and other objects
    animatePlanets(elapsedTime);
    animateSkybox();

    const zoomSpeed = 1; // Speed of zoom
    const lockDistance = 3;  // Distance from planet to lock on

    if (targetPlanet && !isLockedOn) {
        // Calculate the direction from the camera to the planet
        const targetPosition = new THREE.Vector3().copy(targetPlanet.position);
        const direction = targetPosition.sub(camera.position).normalize();

        // Move the camera towards the planet
        camera.position.add(direction.multiplyScalar(zoomSpeed));

        // If close enough, lock onto the planet
        if (camera.position.distanceTo(targetPlanet.position) < lockDistance) {
            isLockedOn = true;  // Lock the camera on the planet
        }
    }

    // Lock-on and follow the planet if the camera is locked on
    if (isLockedOn && targetPlanet) {
        // Update camera position to follow the planet
        const offset = new THREE.Vector3(0, 3, 10); // Offset position for camera (distance from planet)
        camera.position.copy(targetPlanet.position).add(offset); // Move camera relative to planet

        // Make the camera look at the planet's center
        camera.lookAt(targetPlanet.position);
    }

    // Update controls every frame
    controls.update();

    // Render the scene
    renderer.render(scene, camera);

    // Call tick again on the next frame
    requestAnimationFrame(tick);
}

tick();