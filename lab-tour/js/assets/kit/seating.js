// Seating: the technician's task chair and the reception sofa.
import { box, cyl, group } from './_parts.js';

export const chairMeta = {
  id: 'task-chair',
  name: 'Task chair',
  kind: 'furniture',
  mount: 'floor',
  sizeMm: { w: 570, d: 620, h: 950 },
};

/** Five-star task chair. The sitter faces +Z. */
export function createTaskChair() {
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.3;
    const reach = 150;
    parts.push(
      box({ w: 300, h: 26, d: 44, x: Math.sin(angle) * reach, y: 48, z: Math.cos(angle) * reach, rotY: angle - Math.PI / 2, mat: 'charcoal', shadow: false }),
      cyl({ r: 26, h: 46, x: Math.sin(angle) * 285, y: 0, z: Math.cos(angle) * 285, mat: 'charcoal', seg: 10 }),
    );
  }
  parts.push(
    cyl({ r: 42, h: 40, y: 40, mat: 'charcoal', seg: 14 }),
    cyl({ r: 24, h: 300, y: 80, mat: 'steel', seg: 12 }),
    box({ w: 300, h: 40, d: 300, y: 372, mat: 'charcoal' }),
    box({ w: 490, h: 80, d: 470, y: 405, mat: 'fabricDark', r: 34 }),
    box({ w: 70, h: 330, d: 26, y: 400, z: -238, rotX: -0.1, mat: 'charcoal' }),
    box({ w: 450, h: 430, d: 62, y: 520, z: -262, rotX: -0.14, mat: 'fabricDark', r: 30 }),
  );
  return group('task-chair', parts);
}

export const sofaMeta = {
  id: 'sofa',
  name: 'Waiting sofa',
  kind: 'furniture',
  mount: 'floor',
  sizeMm: { w: 1900, d: 850, h: 780 },
};

/** Three-seat sofa. People sit facing +Z. */
export function createSofa() {
  const parts = [
    box({ w: 1900, h: 230, d: 850, y: 110, mat: 'fabricLight', r: 40 }),
    box({ w: 1900, h: 470, d: 210, y: 310, z: -320, mat: 'fabricLight', r: 60 }),
  ];
  for (const side of [-1, 1]) {
    parts.push(box({ w: 190, h: 330, d: 850, x: side * 855, y: 290, mat: 'fabricLight', r: 60 }));
    for (const z of [-340, 340]) parts.push(cyl({ r: 22, h: 110, x: side * 840, y: 0, z, mat: 'steel', seg: 10 }));
  }
  for (let i = -1; i <= 1; i++) {
    parts.push(box({ w: 496, h: 130, d: 610, x: i * 506, y: 330, z: 95, mat: 'fabricLight', r: 46 }));
  }
  return group('sofa', parts);
}
