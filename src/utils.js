function getNearestPoint(loc, points, threshold = Number.MAX_SAFE_INTEGER) {
   let minDist = Number.MAX_SAFE_INTEGER;
   let nearest = null;
   for (const point of points) {
      const dist = distance(point, loc);
      if (dist < minDist && dist < threshold) {
         minDist = dist;
         nearest = point;
      }
   }
   return nearest;
}

function getNearestSegment(loc, segments, threshold = Number.MAX_SAFE_INTEGER) {
   let minDist = Number.MAX_SAFE_INTEGER;
   let nearest = null;
   for (const seg of segments) {
      const dist = seg.distanceToPoint(loc);
      if (dist < minDist && dist < threshold) {
         minDist = dist;
         nearest = seg;
      }
   }
   return nearest;
}
function getNearestSegments(loc, segments, threshold = Number.MAX_SAFE_INTEGER) {
   let nearest = [];
   for (const seg of segments) {
      const dist = seg.distanceToPoint(loc);
      if (dist < threshold) {
         nearest.push(seg);
      }
   }
   nearest.sort((a,b)=>a.distanceToPoint(loc)-b.distanceToPoint(loc));
   return nearest;
}

function distance(p1, p2) {
   return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function average(p1, p2) {
   return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2,false);
}

function dot(p1, p2) {
   return p1.x * p2.x + p1.y * p2.y;
}

//new
function cross(p1, p2) {
   return p1.x * p2.y - p1.y * p2.x;
}

function add(p1, p2,round=true) {
   return new Point(p1.x + p2.x, p1.y + p2.y,round);
}

function subtract(p1, p2) {
   return new Point(p1.x - p2.x, p1.y - p2.y);
}

function scale(p, scaler) {
   return new Point(p.x * scaler, p.y * scaler,false);
}

function normalize(p) {
   return scale(p, 1 / magnitude(p));
}

function magnitude(p) {
   return Math.hypot(p.x, p.y);
}

function perpendicular(p) {
   return new Point(-p.y, p.x,false);
}

function translate(loc, angle, offset) {
   return new Point(
      loc.x + Math.cos(angle) * offset,
      loc.y + Math.sin(angle) * offset,
      false
   );
}

function angle(p) {
   return Math.atan2(p.y, p.x);
}

function getIntersection(A, B, C, D) {
   const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
   const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
   const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

   const eps = 0.001;
   if (Math.abs(bottom) > eps) {
      const t = tTop / bottom;
      const u = uTop / bottom;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
         return {
            x: lerp(A.x, B.x, t),
            y: lerp(A.y, B.y, t),
            offset: t,
         };
      }
   }

   return null;
}

function lerp(a, b, t) {
   return a + (b - a) * t;
}

function lerp2D(A, B, t) {
   return new Point(lerp(A.x, B.x, t), lerp(A.y, B.y, t),false);
}

function invLerp(a, b, v) {
   return (v - a) / (b - a);
}

function degToRad(degree) {
   return (degree * Math.PI) / 180;
}


function getFake3dPoint(point, viewPoint, height) {
   const dir = normalize(subtract(point, viewPoint));
   const dist = distance(point, viewPoint);
   const scaler = Math.atan(dist / 300) / (Math.PI / 2);
   return add(point, scale(dir, height * scaler),false);
}

function polysIntersect(poly1, poly2) {
   for (let i = 0; i < poly1.length; i++) {
      for (let j = 0; j < poly2.length; j++) {
         const touch = getIntersection(
             poly1[i],
             poly1[(i + 1) % poly1.length],
             poly2[j],
             poly2[(j + 1) % poly2.length]
         );
         if (touch) {
            return true;
         }
      }
   }
   return false;
}

function getRGBA(value) {
   const alpha = Math.abs(value);
   const R = value < 0 ? 0 : 255;
   const G = R;
   const B = value > 0 ? 0 : 255;
   return "rgba(" + R + "," + G + "," + B + "," + alpha + ")";
}

function getRandomColor() {
   const hue = 290 + Math.random() * 260;
   return "hsl(" + hue + ", 100%, 60%)";
}


function direction({ x, y }) {
   return Math.atan2(y, x);
}

function generateImages(emojis, size = 20) {
   const result = {};
   for (const color of ["yellow", "blue","gray"]) {
      for (const emoji of emojis) {
         const canvas = document.createElement("canvas");
         canvas.width = size + 10;
         canvas.height = size + 10;

         const ctx = canvas.getContext("2d");
         ctx.beginPath();
         ctx.textAlign = "center";
         ctx.textBaseline = "middle";
         ctx.fillStyle="white";
         ctx.font = size + "px Courier";

         const colorHueMap = {
            red: 0,
            yellow: 60,
            green: 120,
            cyan: 180,
            blue: 240,
            magenta: 300,
         };
         const hue = -45 + colorHueMap[color];
         if (!isNaN(hue)) {
            /*
         ctx.filter = `
            brightness(2)
            contrast(0.3)
            sepia(1)
            brightness(0.7)
            hue-rotate(${hue}deg)
            saturate(3)
            contrast(3)
         `;
         */
            ctx.filter = `
            brightness(2)
            contrast(0.6)
            sepia(1)
            brightness(0.7)
            hue-rotate(${hue}deg)
            brightness(0.9)
            saturate(3)
            contrast(3)
         `;
         } else {
            ctx.filter = "grayscale(1)";
         }

         ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);

         if (!result[emoji]) {
            result[emoji] = {};
         }
         result[emoji][color] = new Image();
         result[emoji][color].src = canvas.toDataURL();
      }
   }
   return result;

}
