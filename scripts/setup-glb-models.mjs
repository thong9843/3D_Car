import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader cho môi trường Node.js để GLTFExporter xuất nhị phân (.glb)
if (typeof globalThis.FileReader === 'undefined') {
  class NodeFileReader {
    result = null;
    onloadend = null;
    onerror = null;
    async readAsArrayBuffer(blob) {
      try {
        this.result = await blob.arrayBuffer();
        if (this.onloadend) this.onloadend();
      } catch (err) {
        if (this.onerror) this.onerror(err);
      }
    }
    async readAsDataURL(blob) {
      try {
        const buf = Buffer.from(await blob.arrayBuffer());
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${buf.toString('base64')}`;
        if (this.onloadend) this.onloadend();
      } catch (err) {
        if (this.onerror) this.onerror(err);
      }
    }
  }
  globalThis.FileReader = NodeFileReader;
}

const OUT_DIR = path.resolve(process.cwd(), 'public', 'models');

/** Thông số hình học 4 mẫu xe chuẩn thị trường Việt Nam */
const CARS = [
  {
    id: 'vf8',
    length: 4.75, width: 1.93, belt: 1.0, roofH: 1.66,
    trunkEnd: -1.6, roofRear: -1.05, roofFront: 0.1, hoodStart: 0.8,
    noseH: 0.72, ground: 0.24, wheelR: 0.37, axleF: 1.5, axleR: -1.45,
    layout: 'ev', ladderFrame: false, paintHex: '#f2f2ee',
    cdnSource: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/ferrari.glb',
  },
  {
    id: 'cx5',
    length: 4.59, width: 1.85, belt: 0.97, roofH: 1.68,
    trunkEnd: -1.55, roofRear: -1.15, roofFront: 0.05, hoodStart: 0.78,
    noseH: 0.7, ground: 0.22, wheelR: 0.36, axleF: 1.4, axleR: -1.3,
    layout: 'ice-fwd', ladderFrame: false, paintHex: '#8a0f1b',
    cdnSource: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
  },
  {
    id: 'vios',
    length: 4.425, width: 1.73, belt: 0.9, roofH: 1.475,
    trunkEnd: -1.3, roofRear: -0.8, roofFront: 0.0, hoodStart: 0.75,
    noseH: 0.62, ground: 0.2, wheelR: 0.31, axleF: 1.3, axleR: -1.25,
    layout: 'ice-fwd', ladderFrame: false, paintHex: '#f5f5f1',
    cdnSource: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/ferrari.glb',
  },
  {
    id: 'everest',
    length: 4.914, width: 1.96, belt: 1.1, roofH: 1.84,
    trunkEnd: -1.85, roofRear: -1.55, roofFront: 0.2, hoodStart: 0.9,
    noseH: 0.8, ground: 0.28, wheelR: 0.4, axleF: 1.55, axleR: -1.35,
    layout: 'ice-4wd', ladderFrame: true, paintHex: '#4c5157',
    cdnSource: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
  },
];

function buildLowerBody(b) {
  const L = b.length / 2;
  const g = b.ground;
  const R = b.wheelR;
  const ar = R + 0.07;
  const a0 = Math.asin((g - R) / ar);
  const floorY = 0.32;
  const sh = new THREE.Shape();
  const arch = (cx) => {
    sh.lineTo(cx + ar * Math.cos(a0), g);
    sh.absarc(cx, R, ar, a0, Math.PI - a0, false);
  };
  sh.moveTo(L, g);
  arch(b.axleF);
  arch(b.axleR);
  sh.lineTo(-L, g);
  sh.lineTo(-L, b.belt - 0.14);
  sh.quadraticCurveTo(-L, b.belt, -L + 0.22, b.belt);
  sh.lineTo(b.trunkEnd, b.belt);
  sh.lineTo(b.trunkEnd, floorY);
  sh.lineTo(b.hoodStart, floorY);
  sh.lineTo(b.hoodStart, b.belt);
  sh.lineTo(b.hoodStart + 0.3, b.belt - 0.06);
  sh.lineTo(L - 0.35, b.belt - 0.1);
  sh.quadraticCurveTo(L, b.belt - 0.12, L, b.noseH);
  sh.lineTo(L, g);
  const bt = 0.15;
  const depth = b.width - bt * 2;
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.07, bevelSegments: 6, curveSegments: 24,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildGreenhouse(b) {
  const sh = new THREE.Shape();
  const y0 = b.belt - 0.02;
  sh.moveTo(b.trunkEnd, y0);
  sh.bezierCurveTo(b.trunkEnd + 0.4, b.belt + 0.05, b.roofRear - 0.35, b.roofH, b.roofRear, b.roofH);
  sh.lineTo(b.roofFront, b.roofH);
  sh.bezierCurveTo(b.roofFront + 0.45, b.roofH, b.hoodStart - 0.5, b.belt + 0.04, b.hoodStart, y0);
  sh.lineTo(b.trunkEnd, y0);
  const bt = 0.06;
  const depth = b.width * 0.8 - bt * 2;
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.03, bevelSegments: 4, curveSegments: 24,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

function createVehicleScene(b) {
  const scene = new THREE.Scene();
  scene.name = `VN_Showroom_${b.id.toUpperCase()}`;

  const paintMat = new THREE.MeshPhysicalMaterial({
    name: 'CarPaint_Body',
    color: b.paintHex,
    metalness: 0.9,
    roughness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    name: 'Windshield_Glass',
    color: '#0a1520',
    metalness: 0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.38,
  });
  const lampMat = new THREE.MeshStandardMaterial({
    name: 'Matrix_Headlamp',
    color: '#ffffff',
    emissive: '#e8f4ff',
    emissiveIntensity: 2.2,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    name: 'Tail_Light',
    color: '#7a0000',
    emissive: '#ff1a1a',
    emissiveIntensity: 2.0,
  });
  const tireMat = new THREE.MeshStandardMaterial({ name: 'Tire_Rubber', color: '#0e0e10', roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ name: 'Alloy_Wheel_Rim', color: '#d7dbe0', metalness: 0.95, roughness: 0.18 });
  const leatherMat = new THREE.MeshStandardMaterial({ name: 'Seat_Leather', color: '#17171b', roughness: 0.55 });
  const screenMat = new THREE.MeshStandardMaterial({ name: 'Infotainment_Screen_HUD', color: '#04202a', emissive: '#22d3ee', emissiveIntensity: 1.1 });
  const engineMat = new THREE.MeshStandardMaterial({ name: 'Powertrain_Engine_Battery', color: '#06323c', emissive: '#22d3ee', emissiveIntensity: 0.8, metalness: 0.6 });
  const suspMat = new THREE.MeshStandardMaterial({ name: 'Suspension_Spring', color: '#f97316', emissive: '#f97316', emissiveIntensity: 0.35 });

  // Thân vỏ chính & kính
  const bodyMesh = new THREE.Mesh(buildLowerBody(b), paintMat);
  bodyMesh.name = 'Exterior_Body_Shell';
  scene.add(bodyMesh);

  const glassMesh = new THREE.Mesh(buildGreenhouse(b), glassMat);
  glassMesh.name = 'Cabin_Window_Glass';
  scene.add(glassMesh);

  // Nóc xe & Cửa xe
  const cabinLen = b.hoodStart - b.trunkEnd;
  const cabinMid = (b.hoodStart + b.trunkEnd) / 2;
  const roofLen = b.roofFront - b.roofRear + 0.1;

  const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(roofLen, 0.06, b.width * 0.76), paintMat);
  roofMesh.name = 'Roof_Body_Panel';
  roofMesh.position.set((b.roofFront + b.roofRear) / 2, b.roofH + 0.015, 0);
  scene.add(roofMesh);

  for (const s of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(cabinLen - 0.1, b.belt - 0.3, 0.11), paintMat);
    door.name = s < 0 ? 'Door_Left_Body' : 'Door_Right_Body';
    door.position.set(cabinMid, (b.belt + 0.3) / 2, s * (b.width / 2 - 0.04));
    scene.add(door);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.38), lampMat);
    lamp.name = s < 0 ? 'Front_Headlamp_Left' : 'Front_Headlamp_Right';
    lamp.position.set(b.length / 2 + 0.065, b.belt - 0.15, s * b.width * 0.34);
    scene.add(lamp);
  }

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, b.width * 0.7), tailMat);
  tail.name = 'Rear_Tail_Lamp';
  tail.position.set(-b.length / 2 - 0.07, b.belt - 0.14, 0);
  scene.add(tail);

  // 4 Bánh xe
  const wz = b.width / 2 - 0.2;
  for (const [wx, wzPos, tag] of [
    [b.axleF, wz, 'FL'],
    [b.axleF, -wz, 'FR'],
    [b.axleR, wz, 'RL'],
    [b.axleR, -wz, 'RR'],
  ]) {
    const wGroup = new THREE.Group();
    wGroup.name = `Wheel_Assembly_${tag}`;
    wGroup.position.set(wx, b.wheelR, wzPos);

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(b.wheelR, b.wheelR, 0.26, 32), tireMat);
    tire.name = `Wheel_Tire_${tag}`;
    tire.rotation.x = Math.PI / 2;
    wGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(b.wheelR * 0.7, b.wheelR * 0.7, 0.27, 24), rimMat);
    rim.name = `Wheel_Rim_${tag}`;
    rim.rotation.x = Math.PI / 2;
    wGroup.add(rim);

    scene.add(wGroup);
  }

  // Nội thất: Ghế, Màn hình, Vô-lăng
  const dashX = b.hoodStart - 0.15;
  const seatX = b.roofFront - 0.55;
  for (const [sx, sz, sTag] of [
    [seatX, -0.4, 'Driver'],
    [seatX, 0.4, 'Passenger'],
    [seatX - 0.9, -0.4, 'RearL'],
    [seatX - 0.9, 0.4, 'RearR'],
  ]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.48), leatherMat);
    seat.name = `Interior_Seat_${sTag}`;
    seat.position.set(sx, 0.78, sz);
    scene.add(seat);
  }

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.5), screenMat);
  screen.name = 'Center_Display_Screen_HUD';
  screen.position.set(dashX - 0.26, b.belt + 0.06, 0);
  scene.add(screen);

  const steer = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 12, 28), leatherMat);
  steer.name = 'Steering_Wheel';
  steer.position.set(dashX - 0.46, b.belt - 0.02, -0.4);
  steer.rotation.y = Math.PI / 2;
  scene.add(steer);

  // Khối động cơ / Pin & Hệ thống treo
  const mid = (b.axleF + b.axleR) / 2;
  const wb = b.axleF - b.axleR;
  const powerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(b.layout === 'ev' ? wb - 0.5 : 0.65, b.layout === 'ev' ? 0.15 : 0.45, b.width * 0.55),
    engineMat,
  );
  powerMesh.name = b.layout === 'ev' ? 'Battery_Pack_Motor' : 'Engine_Powertrain_Block';
  powerMesh.position.set(b.layout === 'ev' ? mid : b.axleF - 0.3, b.layout === 'ev' ? 0.36 : 0.62, 0);
  scene.add(powerMesh);

  for (const ax of [b.axleF, b.axleR]) {
    for (const sz of [-1, 1]) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 16), suspMat);
      sp.name = `Suspension_Damper_${ax > 0 ? 'F' : 'R'}_${sz > 0 ? 'L' : 'R'}`;
      sp.position.set(ax, b.wheelR + 0.26, sz * (b.width / 2 - 0.4));
      scene.add(sp);
    }
  }

  return scene;
}

function exportToGlbBuffer(scene) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (res) => {
        if (res instanceof ArrayBuffer) resolve(Buffer.from(res));
        else resolve(Buffer.from(JSON.stringify(res)));
      },
      (err) => reject(err),
      { binary: true },
    );
  });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const useRemoteCdn = process.argv.includes('--from-cdn');

  for (const car of CARS) {
    const outFile = path.join(OUT_DIR, `${car.id}.glb`);
    if (useRemoteCdn) {
      console.log(`[CDN] Đang tải ${car.id}.glb từ ${car.cdnSource}...`);
      const res = await fetch(car.cdnSource);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(outFile, buf);
      console.log(`  ✓ Đã lưu ${outFile} (${(buf.length / 1024).toFixed(1)} kB)`);
    } else {
      const scene = createVehicleScene(car);
      const buf = await exportToGlbBuffer(scene);
      await fs.writeFile(outFile, buf);
      console.log(`  ✓ Đã tạo ${outFile} (${(buf.length / 1024).toFixed(1)} kB)`);
    }
  }

  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  const manifest = {
    _note: 'Danh sách các mẫu xe nạp trực tiếp từ tệp .glb chuẩn trong public/models/',
    models: CARS.map((c) => c.id),
  };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`  ✓ Đã cập nhật ${manifestPath} với models: ${JSON.stringify(manifest.models)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
