var createGame = require('../lib/game')
var THREE = require('three')
var voxel = require('voxel')
var toolbar = require('toolbar')
var blockSelector = toolbar({el: '#tools'})
var skin = require('minecraft-skin')
var cubeSize = 25;

window.game = createGame({
  generate: voxel.generator['Valley'],
  texturePath: './textures/',
  materials: [['grass', 'dirt', 'grass_dirt'], 'brick', 'dirt', 'obsidian', 'crate'],
  cubeSize: cubeSize,
  chunkSize: 32,
  chunkDistance: 2,
  startingPosition: [1435, 1460, 35],
  worldOrigin: [0,0,0],
  controlOptions: {jump: 6}
})

var maxogden = skin(game.THREE, 'maxogden.png').createPlayerObject()
maxogden.position.set(0, 62, 20)
game.scene.add(maxogden)

var substack = skin(game.THREE, 'substack.png').createPlayerObject()
substack.position.set(0, 62, -20)
game.scene.add(substack)

//require('voxel-geometry').loadGeometry('/shapefiles/GuyFawks.stl', function(err, geometry) {
require('voxel-geometry').loadGeometry('/voxel-engine/demo/shapefiles/GuyFawks.stl', function(err, geometry) {
  geometry.computeFaceNormals();
  material = new THREE.MeshBasicMaterial( { color: 0xFF44FF, wireframe: true } )
  material.side = THREE.DoubleSide;
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-400, 1000, 0);
  mesh.scale.set(60,60,60);
  mesh.rotation.y = Math.PI / 2.0;
  game.scene.add(mesh);

  require('voxel-geometry').voxelateMesh(game, mesh);
});

var currentMaterial = 1

blockSelector.on('select', function(material) {
  var idx = game.materials.indexOf(material)
  if(idx === -1) {
    for(var m = 0; m < game.materials.length; m++) {
      if(typeof game.materials[m] === 'object' && game.materials[m][0] === material) idx = m
    }
  }
  if (idx > -1) currentMaterial = idx + 1
})

game.on('collision', function (item) {
  incrementBlockTally()
  game.removeItem(item)
})

function createDebris (pos, value) {
  var mesh = new THREE.Mesh(
    new THREE.CubeGeometry(4, 4, 4),
    game.material
  )
  mesh.geometry.faces.forEach(function (face) {
    face.materialIndex = value - 1
  })
  mesh.translateX(pos.x)
  mesh.translateY(pos.y)
  mesh.translateZ(pos.z)
  
  return {
    mesh: mesh,
    size: 4,
    collisionRadius: 22,
    value: value
  }
}

function explode (pos, value) {
  if (!value) return
  var item = createDebris(pos, value)
  item.velocity = {
    x: (Math.random() * 2 - 1) * 0.05,
    y: (Math.random() * 2 - 1) * 0.05,
    z: (Math.random() * 2 - 1) * 0.05,
  }
  game.addItem(item)
  setTimeout(function (item) {
    game.removeItem(item)
  }, 15 * 1000 + Math.random() * 15 * 1000, item)
}

game.appendTo('#container')

var tally = document.querySelector('.tally .count')
function incrementBlockTally() {
  var c = +tally.innerText
  ++c
  tally.innerText = c
}

game.on('mousedown', function (pos) {
  var cid = game.voxels.chunkAtPosition(pos)
  var vid = game.voxels.voxelAtPosition(pos)
  if (erase) {
    explode(pos, game.getBlock(pos))
    game.setBlock(pos, 0)
  } else {
    game.createBlock(pos, currentMaterial)
  }
})

var erase = true
window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 'X'.charCodeAt(0)) {
    erase = !erase
  }
})

function ctrlToggle (ev) { erase = !ev.ctrlKey }
window.addEventListener('keyup', ctrlToggle)
window.addEventListener('keydown', ctrlToggle)

var container = document.querySelector('#container')
container.addEventListener('click', function() {
  game.requestPointerLock(container)
})
