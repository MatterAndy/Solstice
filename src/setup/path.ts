import * as THREE from "three";

export const createPath = (eccentricity: number, semiMajorAxis: number, inclination: number, longitudeAscendingNode: number, lineColor: string) => {
  const points: THREE.Vector3[] = [];
  const count = 1024;

  for (let i = 0; i <= count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(theta));
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    let y = 0; // Initially the y coordinate is 0 for a planar orbit

    // Apply inclination (rotation around x-axis)
    const zInclined = z * Math.cos(inclination) - y * Math.sin(inclination);
    const yInclined = z * Math.sin(inclination) + y * Math.cos(inclination);

    // Apply rotation for longitude of ascending node (around z-axis)
    const xRotated = x * Math.cos(longitudeAscendingNode) - zInclined * Math.sin(longitudeAscendingNode);
    const zRotated = x * Math.sin(longitudeAscendingNode) + zInclined * Math.cos(longitudeAscendingNode);

    points.push(new THREE.Vector3(xRotated, yInclined, zRotated));
  }

  const material = new THREE.LineBasicMaterial({
    color: lineColor,
    transparent: true,
    opacity: 0.5,
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const mesh = new THREE.Line(geometry, material);
  // mesh.scale.set(radius, radius, radius);
  mesh.visible = false;

  return mesh;
};