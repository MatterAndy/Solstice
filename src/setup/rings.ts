import * as THREE from "three";

export const createRingMesh = (texture: THREE.Texture): THREE.Mesh => {
  const innerRadius = 1.5; // Adjust the inner radius as needed
  const outerRadius = 3.5;
  const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);
  const pos = ringGeometry.attributes.position;
  const v3 = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    // Adjust the UV calculation to map correctly based on the new inner radius
    const radiusRatio = (v3.length() - innerRadius) / (outerRadius - innerRadius);
    ringGeometry.attributes.uv.setXY(i, radiusRatio, 1);
  }

  const ringMaterial = new THREE.MeshPhongMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const rings = new THREE.Mesh(ringGeometry, ringMaterial);
  rings.receiveShadow = true;
  rings.rotation.x = Math.PI / 2;

  return rings;
};