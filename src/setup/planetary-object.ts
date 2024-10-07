import * as THREE from "three";
import { createRingMesh } from "./rings";
import { createPath } from "./path";
import { loadTexture } from "./textures";
import { Label } from "./label";
import { PointOfInterest } from "./label";

export interface Body {
  name: string;
  radius: number;
  period: number;
  daylength: number;
  textures: TexturePaths;
  eccentricity: number;
  semiMajorAxis: number;
  inclination: number;
  longitudeAscendingNode: number;
  type: string;
  tilt: number;
  orbits?: string;
  labels?: PointOfInterest[];
  traversable: boolean;
  offset?: number;
}

interface TexturePaths {
  map: string;
  bump?: string;
  atmosphere?: string;
  atmosphereAlpha?: string;
  specular?: string;
}

interface Atmosphere {
  map?: THREE.Texture;
  alpha?: THREE.Texture;
}

const timeFactor = 8 * Math.PI * 2; // 1s real-time => 8h simulation time

const degreesToRadians = (degrees: number): number => {
  return (Math.PI * degrees) / 180;
};

export class PlanetaryObject {
  name: string;
  radius: number; // in km
  period: number; // in days
  daylength: number; // in hours
  eccentricity: number;
  semiMajorAxis: number;
  inclination: number; // degrees
  longitudeAscendingNode: number; // degrees
  orbits?: string;
  type: string;
  tilt: number; // degrees
  mesh: THREE.Mesh;
  path?: THREE.Line;
  rng: number;
  map: THREE.Texture;
  bumpMap?: THREE.Texture;
  specularMap?: THREE.Texture;
  atmosphere: Atmosphere = {};
  labels: Label;

  constructor(body: Body) {
    const { name, radius, period, daylength, eccentricity, semiMajorAxis, inclination, longitudeAscendingNode, orbits, type, tilt } = body;

    this.name = name;
    this.radius = radius;
    this.period = period / (365.26 / 10);
    this.daylength = daylength;
    this.eccentricity = eccentricity;
    this.semiMajorAxis = semiMajorAxis * 10;
    this.inclination = degreesToRadians(inclination);
    this.longitudeAscendingNode = degreesToRadians(longitudeAscendingNode);
    this.orbits = orbits;
    this.type = type;
    this.tilt = degreesToRadians(tilt);
    this.rng = body.offset ?? Math.random() * 2 * Math.PI;

    this.loadTextures(body.textures);

    this.mesh = this.createMesh();

    let lineColor = "";
    if (this.type === "planet") {
      lineColor = "white";
    } else {
      lineColor = "#666666";
    }
    if (this.name === "Earth") {
      lineColor = "green";
    }

    if (this.orbits) {
      this.path = createPath(this.eccentricity, this.semiMajorAxis, this.inclination, this.longitudeAscendingNode, lineColor);
    }

    if (this.atmosphere.map) {
      this.mesh.add(this.createAtmosphereMesh());
    }

    this.initLabels(body.labels);
  }

  /**
   * Creates label objects for each point-of-interest.
   * @param labels - List of labels to display.
   */
  private initLabels = (labels?: PointOfInterest[]) => {
    this.labels = new Label(this.mesh, this.radius);

    if (labels) {
      labels.forEach((poi) => {
        this.labels.createPOILabel(poi);
      });
    }
  };

  /**
   * Prepare and load textures.
   * @param textures - Object of texture paths to load.
   */
  private loadTextures(textures: TexturePaths) {
    this.map = loadTexture(textures.map);
    if (textures.bump) {
      this.bumpMap = loadTexture(textures.bump);
    }
    if (textures.specular) {
      this.specularMap = loadTexture(textures.specular);
    }
    if (textures.atmosphere) {
      this.atmosphere.map = loadTexture(textures.atmosphere);
    }
    if (textures.atmosphereAlpha) {
      this.atmosphere.alpha = loadTexture(textures.atmosphereAlpha);
    }
  }

  /**
   * Creates the main mesh object with textures.
   * @returns celestial body mesh.
   */
  private createMesh = () => {
    if (this.type === "ring") {
      return createRingMesh(this.map);
    }

    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    let material;
    if (this.type === "star") {
      material = new THREE.MeshBasicMaterial({
        map: this.map,
        lightMapIntensity: 2,
        toneMapped: false,
        color: new THREE.Color(2.5, 2.5, 2.5),
      });
    } else {
      material = new THREE.MeshPhongMaterial({
        map: this.map,
        shininess: 5,
        toneMapped: true,
      });

      if (this.bumpMap) {
        material.bumpMap = this.bumpMap;
        material.bumpScale = this.radius / 50;
      }

      if (this.specularMap) {
        material.specularMap = this.specularMap;
      }
    }

    const sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.x = this.tilt;
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    return sphere;
  };

  /**
   * Creates the atmosphere mesh object with textures.
   * @returns atmosphere mesh.
   */
  private createAtmosphereMesh = () => {
    const geometry = new THREE.SphereGeometry(this.radius + 0.0005, 64, 64);

    const material = new THREE.MeshPhongMaterial({
      map: this.atmosphere?.map,
      transparent: true,
    });

    if (this.atmosphere.alpha) {
      material.alphaMap = this.atmosphere.alpha;
    }

    const sphere = new THREE.Mesh(geometry, material);
    sphere.receiveShadow = true;
    sphere.rotation.x = this.tilt;
    return sphere;
  };

  private getRotation = (elapsedTime: number) => {
    return this.daylength ? (elapsedTime * timeFactor) / this.daylength : 0;
  };

private solveKepler = (M: number, e: number, tolerance: number = 1e-6) => {
  let E: number = M; // Start with the mean anomaly as the first guess
  let delta: number = 1;

  // Newton-Raphson iteration to solve for E
  while (Math.abs(delta) > tolerance) {
      delta = E - e * Math.sin(E) - M;
      E = E - delta / (1 - e * Math.cos(E));
  }

  return E;
};

private calculateTrueAnomaly = (E: number, e: number) => {
  return 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
  );
};

  /**
   * Updates orbital position and rotation.
   * @param elapsedTime - number of seconds elapsed.
   */
  tick = (elapsedTime: number) => {
    const meanAnomaly = (2 * Math.PI * elapsedTime / this.period) % (2 * Math.PI);

    // Solve for the eccentric anomaly E
    const eccentricAnomaly = this.solveKepler(meanAnomaly, this.eccentricity);

    // Calculate the true anomaly θ
    const trueAnomaly = this.calculateTrueAnomaly(eccentricAnomaly, this.eccentricity);

    // Calculate the distance from the Sun (r) based on true anomaly and semi-major axis
    const distance = this.semiMajorAxis * (1 - this.eccentricity * Math.cos(eccentricAnomaly));

    // Position in 2D plane (x, z), using the true anomaly
    let x = distance * Math.cos(trueAnomaly);
    let z = distance * Math.sin(trueAnomaly);
    let y = 0; // Initially the y coordinate is 0 for a planar orbit

    // Apply inclination (rotation around x-axis)
    const zInclined = z * Math.cos(this.inclination) - y * Math.sin(this.inclination);
    const yInclined = z * Math.sin(this.inclination) + y * Math.cos(this.inclination);

    // Apply rotation for longitude of ascending node (around z-axis)
    const xRotated = x * Math.cos(this.longitudeAscendingNode) - zInclined * Math.sin(this.longitudeAscendingNode);
    const zRotated = x * Math.sin(this.longitudeAscendingNode) + zInclined * Math.cos(this.longitudeAscendingNode);

    // Set the final position of the mesh
    this.mesh.position.set(xRotated, yInclined, zRotated);

    // Rotate mesh for day/night cycle
    const rotation = this.getRotation(elapsedTime);
    if (this.type === "ring") {
      this.mesh.rotation.z = rotation;
    } else {
      this.mesh.rotation.y = rotation;
    }
  };

  /**
   * @returns the minimum orbital control camera distance allowed.
   */
  getMinDistance = (): number => {
    return this.radius * 3.5;
  };
}