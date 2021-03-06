//const Matter = require('matter-js');

var engine = Matter.Engine.create();
engine.world.gravity = Matter.Vector.create(0,0);

const playerDiameter = 10;
const mapUnitSize = 15;


function newPlayer(x, y) {
  var player = Matter.Bodies.circle(x*mapUnitSize, y*mapUnitSize, playerDiameter/2.0, {frictionAir : 0.08, isStatic: false});
  return player;
}

function newSquareWall(x,y,w,h) {
  var ox = x + w/2;
  var oy = y + h/2;
  var wall = Matter.Bodies.rectangle(ox*mapUnitSize, oy*mapUnitSize, w*mapUnitSize, h*mapUnitSize, {isStatic : true});
  console.log("added wall "+wall);
  return wall;
}

var sampleLevel = {
  "size" : {w:100,h:100},
  "floor" : [
    {x:0,y:0,w:100,h:100,surf:"grass"}
  ],
  "walls" : [
    {x:1,y:1,w:1,h:1,surf:"grass"},
    {x:1,y:2,w:1,h:2,surf:"stone"},
    {x:4,y:5,w:1,h:1,surf:"stone"},
    {x:5,y:5,w:2,h:1,surf:"stone.break",breakable:true,breakenergy:3.5},
    {x:7,y:5,w:1,h:2,surf:"stone"}
  ],
  "entities" : [
    {
      type : "pickup.boost", //Specifies most information to be loaded
      x: 50,
      y: 50,
      properties : {
        //properties that we want to override/add
      }
    }
  ],
  "spawnpoints" : [
    {x:10, y:10},
    {x:90, y:90},
    {x:90, y:10},
    {x:10, y:90}
  ]
}



function loadLevel(level) {
  
  for(mapDesc of level.walls) {
    var wall = newSquareWall(mapDesc.x, mapDesc.y, mapDesc.w, mapDesc.h);
    if(mapDesc.breakable) {
      wall.label = "breakblock";
      wall.render.fillStyle = '#C7F464';
      wall.breakenergy = mapDesc.breakenergy;
    }
    Matter.World.add(engine.world, wall);
  }
}


var renderOpts = {
  width: 800,
  height: 600,
  pixelRatio: 1,
  background: '#fafafa',
  wireframeBackground: '#222',
  hasBounds: false,
  enabled: true,
  wireframes: false,
  showSleeping: true,
  showDebug: false,
  showBroadphase: false,
  showBounds: false,
  showVelocity: false,
  showCollisions: false,
  showSeparations: false,
  showAxes: false,
  showPositions: false,
  showAngleIndicator: false,
  showIds: false,
  showShadows: false,
  showVertexNumbers: false,
  showConvexHulls: false,
  showInternalEdges: false,
  showMousePosition: false
}

var render = Matter.Render.create({
    element: document.body,
    engine: engine,
    options: renderOpts
});


loadLevel(sampleLevel);
var player = newPlayer(10,10);
player.label = "player";
Matter.World.add(engine.world, player);

Matter.Engine.run(engine);
Matter.Render.run(render);


var accelX = 0; var accelY = 0;

var gyroargs = {
	frequency:50,					// ( How often the object sends the values - milliseconds )
	gravityNormalized:false,			// ( If the gravity related values to be normalized )
	orientationBase:GyroNorm.GAME,		// ( Can be GyroNorm.GAME or GyroNorm.WORLD. gn.GAME returns orientation values with respect to the head direction of the device. gn.WORLD returns the orientation values with respect to the actual north direction of the world. )
	decimalCount:2,					// ( How many digits after the decimal point will there be in the return values )
	logger:null,					// ( Function to be called to log messages from gyronorm.js )
	screenAdjusted:false			// ( If set to true it will return screen adjusted values. )
};

var keyboardInput = false;

var keys = {};

var gn = new GyroNorm();
gn.init(gyroargs).then(function(){
  gn.start(function(data){
   accelX = data.dm.gx		//( devicemotion event accelerationIncludingGravity x value )
   accelY = data.dm.gy		//( devicemotion event accelerationIncludingGravity y value )
   //data.dm.gz		( devicemotion event accelerationIncludingGravity z value )
  });
}).catch(function(e){
  // Catch if the DeviceOrientation or DeviceMotion is not supported by the browser or device
  console.log('no devicemotion present on device');
  console.log('should try keyboard input');
  keyboardInput = true;
  window.addEventListener("keydown",
    function(e){
      keys[e.key] = true;
    }, false);
  window.addEventListener('keyup',
    function(e){
      keys[e.key] = false;
    }, false);
});



Matter.Events.on(engine, "beforeUpdate", function() {
  if(keyboardInput) {
    var ay = 0; var ax = 0;
    if(keys["ArrowDown"]) {ay -= 3;}
    if(keys["ArrowUp"]) {ay += 3;}
    if(keys["ArrowLeft"]) {ax -= 3;}
    if(keys["ArrowRight"]) {ax += 3;}
    accelX = ax;
    accelY = ay;
    //console.log("ax and ay are "+ax+","+ay);
  }
  Matter.Body.applyForce(player, player.position, Matter.Vector.create(0.001*player.mass*accelX,-0.001*player.mass*accelY));
  //console.log("x is "+accelX+", y is "+accelY);
});


function bodyEnergy(body) {
  return 0.5*body.mass*Math.pow(body.speed,2);
}
function logPlayerCollision(body) {
  console.log("energy:"+bodyEnergy(body)+".vel:"+body.velocity+".mass:"+body.mass);
}


Matter.Events.on(engine, "collisionStart", function(event) {
//   pairs : List of affected pairs
//   timestamp Number : The engine.timing.timestamp of the event
//   source : The source object of the event
//   name : The name of the event
  var pairs = event.pairs;

  // change object colours to show those ending a collision
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    console.log("collision between "+pair.bodyA.label+" and "+pair.bodyB.label);
    if(pair.bodyA.label == "player") {
      if(pair.bodyB.label == "breakblock") {
        logPlayerCollision(pair.bodyA);
        if(bodyEnergy(pair.bodyA) > pair.bodyB.breakenergy) {
          Matter.World.remove(engine.world, pair.bodyB);
        }
      }
    }
    else if(pair.bodyB.label == "player") {
      if(pair.bodyA.label == "breakblock") {
        logPlayerCollision(pair.bodyB);
        if(bodyEnergy(pair.bodyB) > pair.bodyA.breakenergy) {
          Matter.World.remove(engine.world, pair.bodyA);
        }
      }
    }
  }
});
