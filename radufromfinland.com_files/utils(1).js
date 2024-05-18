function lerp(A, B, t) {
   return A + (B - A) * t;
}

function getIntersection(A, B, C, D) {
   const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
   const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
   const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

   if (bottom != 0) {
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

function drawArrow(
   ctx,
   fromx,
   fromy,
   tox,
   toy,
   arrowWidth = 2,
   color = "white"
) {
   //variables to be used when creating the arrow
   var headlen = 10;
   var angle = Math.atan2(toy - fromy, tox - fromx);

   ctx.save();
   ctx.strokeStyle = color;

   //starting path of the arrow from the start square to the end square
   //and drawing the stroke
   ctx.beginPath();
   ctx.moveTo(fromx, fromy);
   ctx.lineTo(tox, toy);
   ctx.lineWidth = arrowWidth;
   ctx.stroke();

   //starting a new path from the head of the arrow to one of the sides of
   //the point
   ctx.beginPath();
   ctx.moveTo(tox, toy);
   ctx.lineTo(
      tox - headlen * Math.cos(angle - Math.PI / 7),
      toy - headlen * Math.sin(angle - Math.PI / 7)
   );

   //path from the side point of the arrow, to the other side point
   ctx.lineTo(
      tox - headlen * Math.cos(angle + Math.PI / 7),
      toy - headlen * Math.sin(angle + Math.PI / 7)
   );

   //path from the side point back to the tip of the arrow, and then
   //again to the opposite side point
   ctx.lineTo(tox, toy);
   ctx.lineTo(
      tox - headlen * Math.cos(angle - Math.PI / 7),
      toy - headlen * Math.sin(angle - Math.PI / 7)
   );

   //draws the paths created above
   ctx.fillStyle=color;
   ctx.fill();
   ctx.stroke();
   ctx.restore();
}

function drawArrow2(
   tail,
   tip,
   ctx,
   color = "white",
   tipOffset = 30,
   size = 20
) {
   const { dir, mag } = toPolar(subtract(tip, tail));
   const newTip = add(tip, scale(normalize(subtract(tail, tip)), tipOffset));
   const v1 = { dir: dir + Math.PI * 0.8, mag: size / 2 };
   const p1 = toXY(v1);
   const t1 = add(p1, newTip);
   const v2 = { dir: dir - Math.PI * 0.8, mag: size / 2 };
   const p2 = toXY(v2);
   const t2 = add(p2, newTip);
   ctx.beginPath();
   ctx.moveTo(tail.x, tail.y);
   ctx.lineTo(newTip.x, newTip.y);
   ctx.strokeStyle = color;
   ctx.stroke();
   ctx.beginPath();
   ctx.moveTo(newTip.x, newTip.y);
   ctx.lineTo(t1.x, t1.y);
   ctx.lineTo(t2.x, t2.y);
   ctx.closePath();
   ctx.stroke();
   ctx.fillStyle = color;
   ctx.fill();
}
/*

function scale(p, scalar) {
   return { x: p.x * scalar, y: p.y * scalar };
}

function add(p1, p2) {
   return { x: p1.x + p2.x, y: p1.y + p2.y };
}

function subtract(p1, p2) {
   return { x: p1.x - p2.x, y: p1.y - p2.y };
}

function dot(p1, p2) {
   return p1.x * p2.x + p1.y * p2.y;
}

function normalize(p) {
   return scale(p, 1 / magnitude(p));
}
*/
function toPolar({ x, y }) {
   return { dir: direction({ x, y }), mag: magnitude({ x, y }) };
}

function toXY({ mag, dir }) {
   return new Point(Math.cos(dir) * mag, Math.sin(dir) * mag);
}

function direction({ x, y }) {
   return Math.atan2(y, x);
}

function magnitude({ x, y }) {
   return Math.hypot(x, y);
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
