const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.65;

const width = canvas.width;
const height = canvas.height;

let objects = [];
let sparks = [];
let explosions = [];
let score = 0;

let shakeTime = 0;
let difficulty = 1;

/* SONIDO */
let explosionSound = new Audio("assets/explosion.mp3");

/* CURSOR ARREGLADO AUTOMÁTICO */
const cursorImg = new Image();
cursorImg.src = "assets/freezer-cursor.png";

cursorImg.onload = () => {
let c = document.createElement("canvas");
let cx = c.getContext("2d");
c.width = 32;
c.height = 32;
cx.drawImage(cursorImg,0,0,32,32);
document.body.style.cursor = `url(${c.toDataURL()}) 16 16, auto`;
};

/* IMÁGENES */
let img = new Image();
img.src = "assets/krilin.png";

let bg = new Image();
bg.src = "assets/namek.jpg";

/*
OBJETO
*/
class GameObject{

constructor(){

this.size = Math.random()*25 + 35;
this.posX = Math.random()*width;
this.posY = Math.random()*height;

this.dx = (Math.random()-0.5)*4;
this.dy = (Math.random()-0.5)*4;

}

move(){

this.posX += this.dx * difficulty;
this.posY += this.dy * difficulty;

/* efecto vuelo */
this.posX += Math.sin(Date.now()*0.002 + this.posY)*0.3;
this.posY += Math.cos(Date.now()*0.002 + this.posX)*0.3;

/* rebotes */
if(this.posX <=0){ this.posX = 0; this.dx *= -1; }
if(this.posX + this.size >= width){ this.posX = width-this.size; this.dx *= -1; }
if(this.posY <=0){ this.posY = 0; this.dy *= -1; }
if(this.posY + this.size >= height){ this.posY = height-this.size; this.dy *= -1; }

}

draw(){

let g = ctx.createRadialGradient(
this.posX + this.size/2,
this.posY + this.size/2,
10,
this.posX + this.size/2,
this.posY + this.size/2,
this.size
);

g.addColorStop(0,"rgba(255,255,0,0.5)");
g.addColorStop(1,"rgba(255,255,0,0)");

ctx.fillStyle = g;
ctx.beginPath();
ctx.arc(this.posX+this.size/2,this.posY+this.size/2,this.size,0,Math.PI*2);
ctx.fill();

ctx.drawImage(img,this.posX,this.posY,this.size,this.size);
}

checkCollision(other){

let dx = (this.posX+this.size/2)-(other.posX+other.size/2);
let dy = (this.posY+this.size/2)-(other.posY+other.size/2);

let dist = Math.sqrt(dx*dx+dy*dy);
let minDist = this.size/2 + other.size/2;

if(dist < minDist){

let overlap = minDist - dist;
let nx = dx/dist;
let ny = dy/dist;

this.posX += nx*overlap/2;
this.posY += ny*overlap/2;
other.posX -= nx*overlap/2;
other.posY -= ny*overlap/2;

/* rebote */
let tdx = this.dx;
let tdy = this.dy;

this.dx = other.dx;
this.dy = other.dy;

other.dx = tdx;
other.dy = tdy;

/* chispa */
sparks.push(new Spark(
(this.posX+other.posX)/2,
(this.posY+other.posY)/2
));

}
}

isClicked(mx,my){
return mx>this.posX && mx<this.posX+this.size && my>this.posY && my<this.posY+this.size;
}

update(){
this.move();
this.draw();
}

}

/* CHISPA */
class Spark{
constructor(x,y){
this.p=[];
for(let i=0;i<12;i++){
this.p.push({x,y,dx:(Math.random()-0.5)*6,dy:(Math.random()-0.5)*6,a:1});
}
}
update(){
this.p.forEach(p=>{
p.x+=p.dx; p.y+=p.dy; p.a-=0.1;
ctx.fillStyle=`rgba(255,255,200,${p.a})`;
ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill();
});
}
}

/* EXPLOSIÓN */
class Explosion{
constructor(x,y){

this.p=[];

for(let i=0;i<45;i++){
this.p.push({
x,y,
dx:(Math.random()-0.5)*8,
dy:(Math.random()-0.5)*8,
a:1,
s:Math.random()*6+2
});
}

shakeTime=10;
explosionSound.currentTime=0;
explosionSound.play();

}

update(){
this.p.forEach(p=>{
p.x+=p.dx; p.y+=p.dy; p.a-=0.03;
ctx.fillStyle=`rgba(255,200,50,${p.a})`;
ctx.beginPath(); ctx.arc(p.x,p.y,p.s,0,Math.PI*2); ctx.fill();
});
}
}

/* FONDO */
function drawBackground(){
ctx.fillStyle="rgba(0,0,0,0.25)";
ctx.fillRect(0,0,width,height);
ctx.drawImage(bg,0,0,width,height);
}

/* GENERAR */
function generateObjects(){
while(objects.length<25){
let n=new GameObject();
objects.push(n);
}
}

/* CLICK */
canvas.addEventListener("click",e=>{

let rect=canvas.getBoundingClientRect();
let mx=e.clientX-rect.left;
let my=e.clientY-rect.top;

objects.forEach(o=>{
if(o.isClicked(mx,my)){

explosions.push(new Explosion(o.posX+o.size/2,o.posY+o.size/2));

score++;
document.getElementById("score").innerText="Krilins explotados: "+score;

o.posX=Math.random()*width;
o.posY=Math.random()*height;

}
});
});

/* LOOP */
function animate(){

ctx.save();

/* shake */
if(shakeTime>0){
ctx.translate((Math.random()-0.5)*10,(Math.random()-0.5)*10);
shakeTime--;
}

/* dificultad */
if(score>10) difficulty=1.4;
if(score>20) difficulty=1.8;
if(score>30) difficulty=2.2;

drawBackground();

/* colisiones */
for(let i=0;i<objects.length;i++){
for(let j=i+1;j<objects.length;j++){
objects[i].checkCollision(objects[j]);
}
}

objects.forEach(o=>o.update());

sparks=sparks.filter(s=>{s.update(); return s.p[0].a>0;});
explosions=explosions.filter(e=>{e.update(); return e.p[0].a>0;});

ctx.restore();

requestAnimationFrame(animate);
}

generateObjects();
animate();