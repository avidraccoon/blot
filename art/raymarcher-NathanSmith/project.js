/*
  Welcome to Blot!

  To get started with learning Blot's toolkit,
  you can find a handful of guides here: https://blot.hackclub.com/guides

  You can find full documentation on Blot's toolkit by clicking the button at the top!

 Before you make a submission, there are a couple *mandatory* requirements for your PR:

 - It must be drawable in Blot! This means keeping the dimensions at 125x125 or smaller
 - It must change based on different parameters; it cannot be hardcoded.

*/

/*
@title: Ray Marcher
@author: Nathan Smith
@snapshot: image2.png
*/

const width = 125;
const height = 125;
const camera_fov   = 70.0;
const camera_pos_x = bt.randInRange(-1, 1);
const camera_pos_y = bt.randInRange(-1, 1);
const camera_pos_z = 4.0;
const camera_angle_x = bt.randInRange(-10, 10);
const camera_angle_y = bt.randInRange(-10, 10);
const camera_angle_z = bt.randInRange(-10, 10);
const light_pos_x = bt.randInRange(-6, 6);
const light_pos_y = bt.randInRange(-6, 6);
const light_pos_z = bt.randInRange(-6, 6);
const sphere_radius = bt.randInRange(0.5, 1.5);
const MAX_MARCHING_STEPS = 255;
const MIN_DIST = 0.0;
const MAX_DIST = 700.0;
const EPSILON = 0.0000001;

function min(v1, v2){
  if (v1>v2) return v2;
  return v1;
}

function max(v1, v2){
  if (v1<v2) return v2;
  return v1;
}

function vMin(vec, v){
  return [min(vec[0], v), min(vec[1], v), min(vec[2], v)]
}

function vMax(vec, v){
  return [max(vec[0], v), max(vec[1], v), max(vec[2], v)]
}

function abs(v){
  if (v<0) return -v;
  return v;
}

function vAbs(vec){
  return [abs(vec[0]), abs(vec[1]), abs(vec[2])]
}

function sdUnion(d1, d2){
    return min(d1, d2);
}

function sdIntersect(d1, d2){
    return max(d1, d2);
}

function sdSubtract(d1, d2){
    return max(d1, -d2);
}

function sdSphere(p, r){
    return magnitude(p) - r;
}

function sdBox(p, b){
  const q = vecSub(vAbs(p), b);
  return magnitude(vMax(q,0.0)) + min(max(q[0],max(q[1],q[2])),0.0);
}

function sdRoundBox( p, b, r )
{
  const q = vAbs(p) - b + r;
  return magnitude(vMax(q,0.0)) + min(max(q[0],max(q[1],q[2])),0.0) - r;
}

function rayInfo(shortestDistance, hit, count, minRadius, endRadius){
  return {
    distance: shortestDistance,
    didHit: hit,
    stepCount: count,
    minRadius: minRadius,
    endRadius: endRadius
  };
}

function sceneSDF(position){
  let object = MAX_DIST;
  const sphere = sdSphere(position, sphere_radius);
  const box1 = sdBox(vvecAdd(position, [0.0, -2.0, 0.0]), [2, 0.5, 2]);
  const box2 = sdBox(vvecAdd(position, [0.0, 2.0, 0.0]), [2, 0.5, 2]);
  const box3 = sdBox(vvecAdd(position, [0.0, 0.0, 2.0]), [2, 2, 0.5]);
  const box4 = sdBox(vvecAdd(position, [-2.0, 0.0, 0.0]), [0.5, 2, 2]);
  const box5 = sdBox(vvecAdd(position, [2.0, 0.0, 0.0]), [0.5, 2, 2]);
  object = sdUnion(object, sphere)
  object = sdUnion(object, box1);
  object = sdUnion(object, box2);
  object = sdUnion(object, box3);
  object = sdUnion(object, box4);
  object = sdUnion(object, box5);
  return object; 
}

function vvecAdd(vec1, vec2){
  return [vec1[0]+vec2[0], vec1[1]+vec2[1], vec1[2]+vec2[2]];
}

function getRayInfo(eye, dir, start, end){
  let depth = start;
  let lastRadius = 0.0;
  let minRadius = 10000.0;
  for (let i = 0; i < MAX_MARCHING_STEPS; i++) {
      const dist = sceneSDF(vecAdd(eye, scalar(dir, depth)));
      //console.log(dist);
      lastRadius = dist;
      if(dist < minRadius){minRadius = dist;}
      if (dist < EPSILON) {
          return rayInfo(depth, true, i, minRadius, lastRadius);
      }
      depth += dist;
      if (depth >= end) {
          return rayInfo(end, false, i, minRadius, lastRadius);
      }
  }
  return rayInfo(end, false, MAX_MARCHING_STEPS, minRadius, lastRadius);
}

setDocDimensions(width, height);

// store final lines here
const finalLines = [];

// create a polyline
const polyline = [
  [30, 90],
  [100, 90],
  [100, 30],
  [30, 30],
  [30, 90]
];

// add the polyline to the final lines
//finalLines.push(polyline);

// transform lines using the toolkit
//bt.rotate(finalLines, 45);

function vecAdd(vec1, vec2){
  return [vec1[0]+vec2[0], vec1[1]+vec2[1], vec1[2]+vec2[2]];
}

function vecSub(vec1, vec2){
  return vecAdd(vec1, scalar(vec2, -1));
}

function scalar(vector, scale){
  return [vector[0]*scale, vector[1]*scale, vector[2]*scale];
}

function magnitude(vector){
  return Math.sqrt(vector[0]*vector[0] + vector[1]*vector[1] + vector[2]*vector[2]);
}

function setMag(vector, mag){
  return scalar(vector, 1/(magnitude(vector)/mag));
}

function normalize(vector){
  return setMag(vector, 1);
}

function radians(angle){
  return angle * Math.PI / 180;
}

function arrScalar(arr, scalar){
  return [arr[0]*scalar, arr[1]*scalar];
}

function arrSubtract(arr1, arr2){
  return [arr1[0]-arr2[0], arr1[1]-arr2[1]];
}

function rayDirection(fieldOfView, size, fragCoord) {
    const xy = arrSubtract(fragCoord, arrScalar(size, 0.5));
    const z = size[1] / Math.tan(radians(fieldOfView) / 2.0);
    return normalize([xy[0], xy[1], -z]);
    //return normalize([xy[0], xy[1], 0]);
}

function estimateNormal(p) {
    return normalize([
        sceneSDF([p[0] + EPSILON, p[1], p[2]]) - sceneSDF([p[0] - EPSILON, p[1], p[2]]),
        sceneSDF([p[0], p[1] + EPSILON, p[2]]) - sceneSDF([p[0], p[1] - EPSILON, p[2]]),
        sceneSDF([p[0], p[1], p[2] + EPSILON]) - sceneSDF([p[0], p[1], p[2] - EPSILON])
    ]);
}

function lightModifier(p, lightPos, radius){
    const lightInfo = getRayInfo(lightPos, normalize(vecSub(p, lightPos)), MIN_DIST, MAX_DIST);
    let modify = 0.0;
    const lightDist = magnitude(vecSub(p, lightPos));
    const maxDist = Math.sqrt(Math.pow(lightDist, 2.0)+Math.pow(radius, 2.0));
    if (lightInfo.distance < maxDist-EPSILON){
        modify = (lightDist-lightInfo.distance)/lightDist;
    }
    return modify;
}

function estimateLightModifier(p, lightPos, radius){
    const lightInfo = getRayInfo(lightPos, normalize(vecSub(p, lightPos)), MIN_DIST, MAX_DIST);
    const lightDist = magnitude(vecSub(p, lightPos));
    const modifyOrigin = lightModifier(p, lightPos, radius);
    return -modifyOrigin;//-dot(vec4(radius), normalize(normal));
}

function clamp(value, min, max){
  return Math.min(Math.max(value, min), max);
}

function dot(vec1, vec2){
  return vec1[0]*vec2[0]+vec1[1]*vec2[1]+vec1[2]*vec2[2];
}

// Find the contribution of diffuse light to the color of a point
function diffuseLight(p, lightPos){
    // https://timcoster.com/2020/02/11/raymarching-shader-pt1-glsl/
    const l = normalize(vecSub(p, lightPos)) // Light Vector
    const n = estimateNormal(p); // Normal Vector
    const lightRadius = 0.1;
    const modify = estimateLightModifier(p, lightPos, lightRadius);
    
    
    let dif = dot(n,l); // Diffuse light
    dif = clamp(dif,0.,1.); // Clamp so it doesnt go below 0
 
    return dif+modify;
}

function sin(angle){
  return Math.sin(radians(angle));
}

function cos(angle){
  return Math.cos(radians(angle));
}

function rotate(vec, a, b, c){
  const [x, y, z] = vec;
  return [
    x*cos(a)*cos(b)+y*(cos(a)*sin(b)*sin(c)-sin(a)*cos(c))+z*(cos(a)*sin(b)*cos(c)+sin(a)*sin(c)),
    x*sin(a)*cos(b)+y*(sin(a)*sin(b)*sin(c)+cos(a)*cos(c))+z*(sin(a)*sin(b)*cos(c)-cos(a)*sin(c)),
    -x*sin(b)+y*cos(b)*sin(c)+z*cos(b)*cos(c)
  ]
}

function drawPixel(x, y, thickness, outline, scale){
  const half = Math.ceil(thickness/2);
  for (let i = 1; i<half; i++){
    const increase = scale*i/half*2;
    const mIncrease = Math.min(increase, scale)
    const adjust = Math.max(increase-scale, 0);
    finalLines.push([[scale*x+adjust, scale*y+mIncrease], [scale*x+mIncrease, scale*y+adjust]]);
  }
  for (let i = 1; i<thickness-half; i++){
    const increase = scale*i/(thickness-half)*2;
    const mIncrease = Math.min(increase, scale)
    const adjust = Math.max(increase-scale, 0);
    finalLines.push([[scale*x+adjust, scale*y+scale-mIncrease], [scale*x+mIncrease, scale*y+scale-adjust]]);
  }
  if (outline){
    finalLines.push([
      [x*scale,          y*scale],
      [x*scale+scale,    y*scale],
      [x*scale+scale,    y*scale+scale],
      [x*scale,          y*scale+scale]
    ]);
  }
}
let pscale = 3;
for (let h = 0; h<height/pscale; h++){
  for (let w = 0; w<width/pscale; w++){
    //const thickness = w+h+2;
    const eye = [camera_pos_x, camera_pos_y, camera_pos_z];
    let dir = rayDirection(camera_fov, [width, height], [w*pscale, h*pscale]);
    dir = rotate(dir, camera_angle_z, camera_angle_y, camera_angle_x);
    const ray = getRayInfo(eye, dir, MIN_DIST, MAX_DIST);
    //let thickness = ray.stepCount*5.0;
    let thickness = 0.0;
    if (!ray.didHit){
      thickness = 8;
    }else{
      const light = [light_pos_x, light_pos_y, light_pos_z]
      const dist = ray.distance;
      const collisionPoint = vecAdd(eye, scalar(dir, (dist-EPSILON)));
      const lightReceived = diffuseLight(collisionPoint, light)+0.1;
      const ambient = min(ray.stepCount*ray.stepCount/100, 8);
      //thickness = 0.0;
      thickness = lightReceived*10+ambient;
    }
    drawPixel(w, h, thickness, false, pscale);
  }
}
/*finalLines.push([
  [0, scale],
  [scale, scale],
  [scale, 0],
  [0, 0]
])*/
// draw it
drawLines(finalLines);
//drawLines([[[50, 50], [55, 55]]])