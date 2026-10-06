import type * as Three from "three";

/** Original procedural flowers and paper pieces; no additional remote assets. */
export function createLoginAmbient(THREE: typeof Three) {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({
    color: 0xf8f5ed,
    roughness: 0.85,
  });
  const green = new THREE.MeshStandardMaterial({
    color: 0x548b43,
    roughness: 1,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xe5bd57,
    roughness: 1,
  });
  const sphere = new THREE.SphereGeometry(1, 12, 8);
  const flower = () => {
    const bloom = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const petal = new THREE.Mesh(sphere, white);
      petal.scale.set(0.028, 0.16, 0.012);
      petal.position.set(
        Math.sin(angle) * 0.16,
        Math.cos(angle) * 0.16,
        Math.sin(i) * 0.014,
      );
      petal.rotation.z = -angle;
      bloom.add(petal);
    }
    const center = new THREE.Mesh(sphere, gold);
    center.scale.set(0.06, 0.06, 0.025);
    center.position.z = 0.035;
    bloom.add(center);
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, -0.015),
      new THREE.Vector3(-0.22, -0.3, -0.04),
      new THREE.Vector3(0.02, -0.7, 0),
    );
    bloom.add(
      new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.013, 5, false), green),
    );
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(sphere, green);
      leaf.scale.set(0.035, 0.18, 0.012);
      leaf.position.set(side * 0.09, -0.4, 0);
      leaf.rotation.z = side * -1.1;
      bloom.add(leaf);
    }
    return bloom;
  };
  const flowers = [
    { x: 0.2, y: 0.53, scale: 0.55 },
    { x: 0.49, y: 0.29, scale: 0.4 },
    { x: 0.76, y: 0.84, scale: 1.1 },
    { x: 0.94, y: 0.96, scale: 0.65 },
    { x: 0.97, y: 0.03, scale: 0.75 },
    { x: 0.14, y: 0.83, scale: 0.4 },
  ].map((placement, i) => {
    const object = flower();
    object.scale.setScalar(placement.scale);
    group.add(object);
    return { ...placement, object, phase: i * 1.6 };
  });
  const paperColors = [0x39ff60, 0x56efff, 0xff38d9, 0xffe953];
  const paper = Array.from({ length: 14 }, (_, i) => {
    const object = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, i === 0 ? 0.5 : 0.14),
      new THREE.MeshBasicMaterial({
        color: paperColors[i % 4],
        side: THREE.DoubleSide,
      }),
    );
    const x = i === 0 ? 0.76 : (i * 0.137 + 0.07) % 1;
    const y = (i * 0.217 + 0.1) % 1;
    group.add(object);
    return { object, x, y, phase: i * 0.9 };
  });
  let width = 1,
    height = 1;
  const resize = (w: number, h: number) => {
    width = w;
    height = h;
  };
  const animate = (time: number) => {
    for (const item of flowers) {
      item.object.position.set(
        (item.x - 0.5) * width + Math.sin(time * 0.16 + item.phase) * 0.12,
        (0.5 - item.y) * height + Math.cos(time * 0.19 + item.phase) * 0.2,
        0,
      );
      item.object.rotation.set(
        Math.sin(time * 0.22 + item.phase) * 0.55,
        Math.sin(time * 0.18 + item.phase) * 0.6,
        Math.sin(time * 0.12 + item.phase) * 0.35,
      );
    }
    for (const item of paper) {
      item.object.position.set(
        (item.x - 0.5) * width + Math.sin(time * 0.23 + item.phase) * 0.13,
        (0.5 - item.y) * height + Math.sin(time * 0.17 + item.phase) * 0.35,
        0.1,
      );
      item.object.rotation.set(
        time * 0.25 + item.phase,
        time * 0.35 + item.phase,
        time * 0.16 + item.phase,
      );
    }
  };
  return { group, resize, animate };
}
