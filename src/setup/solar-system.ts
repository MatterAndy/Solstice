import { PlanetaryObject } from "./planetary-object";
import planetData from "../planets.json";
import { Body } from "./planetary-object";
import { setTextureCount } from "./textures";
import { getAsteroids } from "./asteroids";

export type SolarSystem = Record<string, PlanetaryObject>;

export const createSolarSystem = (
  scene: THREE.Scene
): [SolarSystem, string[]] => {
  const solarSystem: SolarSystem = {};
  let textureCount = 0;

  const planets: Body[] = planetData;
  const traversable: string[] = [];

  for (const singleAsteroidData of getAsteroids()) {
    let asteroid: Body = {
      name: singleAsteroidData.name,
      radius: singleAsteroidData.radius,
      period: singleAsteroidData.per,
      daylength: singleAsteroidData.day,
      textures: { map: "./textures/asteroid.jpg" },
      eccentricity: singleAsteroidData.e,
      semiMajorAxis: singleAsteroidData.sma,
      inclination: singleAsteroidData.i,
      longitudeAscendingNode: singleAsteroidData.node,
      type: "asteroid",
      tilt: 0,
      orbits: "Sun",
      traversable: true
    };
    planets.push(asteroid);
  }

  for (const planet of planets) {
    const name = planet.name;

    if (planet.period === 0 && planet.orbits) {
      planet.period = planet.daylength / solarSystem[planet.orbits].daylength;
    }

    const object = new PlanetaryObject(planet);

    solarSystem[name] = object;

    textureCount += Object.keys(planet.textures).length;

    if (object.orbits) {
      const parentMesh = solarSystem[object.orbits].mesh;
      parentMesh.add(object.mesh);
      object.path && parentMesh.add(object.path);
    }

    if (planet.traversable) {
      traversable.push(planet.name);
    }
  }

  scene.add(solarSystem["Sun"].mesh);
  setTextureCount(textureCount);

  return [solarSystem, traversable];
};
