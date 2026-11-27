import {readFileSync} from 'node:fs';
const s=readFileSync('user-app/src/assets/sprite/hero.svg','utf8');
const g=Array.from({length:22},()=>Array(17).fill('.'));
const cols={};let n=0;
for(const m of s.matchAll(/<path id="[^"]*" d="([^"]+)" fill="([^"]+)"/g)){
 const c=m[2];if(!cols[c])cols[c]='abcdefghijklmn'[n++];
 for(const r of m[1].split('Z')){const nums=[...r.matchAll(/-?\d+/g)].map(Number);if(nums.length<4)continue;
  const x1=nums[0],y1=nums[1],x2=nums[2],y2=nums[3];
  for(let y=y1/5;y<y2/5;y++)for(let x=x1/5;x<x2/5;x++)g[y][x]=cols[c];}}
console.log(cols);console.log(g.map(r=>r.join('')).join('\n'));
