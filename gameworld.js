"use strict";
/*
  Map coordinates are specified in a two-int array, x, y. So [4, 3] is x=4, y=3. Various places may have
  shortcut methods that expose x and y values that map to/from these structures.
*/ 



class MapSquare {
  constructor(world,x,y) {
    this.world = world;
    this.position = [x, y];
    this.type = 'empty';
  }
}

class GamePlayer {
  constructor(world, name) {
    this.world = world;
    this.name = name;
    this.actionQueue = [];
    var x = Math.floor(Math.random() * world.width); // random placement
    var y = Math.floor(Math.random() * world.height);
    this.position = [x,y];
  }

  get x() { return this.position[0]; }
  get y() { return this.position[1]; }

  queueAction(action) {
    this.actionQueue.push(action);
  }

  move(direction) {
    this.queueAction({action:'move', direction});
  }
}

class DefaultLayoutBuilder {
  constructor(world) {
    this.world = world;
  }
  neighborList(square) {
    var list = [[-2,0],[0,-2],[2,0],[0,2]]
      .map(GameWorld.transformCoords(square.coords))
      .filter((sq) => world.isInBounds(sq)); // remove out of bounds
    return list;
  }
  buildLayout() {
    // fill the world with walls
    for(var sq of this.world.iterateMap()) {
      sq.type = 'empty';
    }

  }
}

class GameWorld {
  constructor(height, width) {
    this.height = height;
    this.width = width;
    this.time = 0;
    this.players = new Set();
    this.layoutBuilder = new DefaultLayoutBuilder(this);
    this.buildMap();
  }

  // offsets coordiate a by relative value b (returning a new value)
  static transformCoords(a, b) {
    if (!b) { // return a closure if only a first parameter was specified
      return function (c) { return transformCoords(a, c); };
    } else {
      return [a[0] + b[0],a[1] + b[1]];
    }
  }

  isInBounds(coords) { // return true if coords is in the bounds of this map
    return ((coords[0] >= 0 && coords[0] < this.width) && (coords[1] >= 0 && coords[1] < this.height));
  }

  *iterateMap() {
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        yield this.map[x][y];
      }
    }
  }

  buildMap() {
    this.map = [];
    for(var y = 0; y < this.height; y++) {
      var thisRow = [];
      this.map.push(thisRow);
      for(var x = 0; x < this.height; x++) {
        var thisSquare = new MapSquare(this, x, y);
        thisRow.push(thisSquare);
      }
    }
    this.layoutBuilder.buildLayout();

  }

  getWorldSquare(coords) {
    if (!this.isInBounds(coords)) return null; 
    return this.map[coords[0]][coords[1]];
  }

  isInBounds(coords) {
    if (coords[0] < 0 || coords[0] >= this.width) return false;
    if (coords[1] < 0 || coords[1] >= this.height) return false;
    return true;
  }

  addPlayer(name) {
    var newPlayer = new GamePlayer(this, name);
    this.players.add(newPlayer);
    return newPlayer;
  }

  movePlayer(player, direction) {
    var proposedPosition = player.position;

    switch (direction) {
      case 'north': proposedPosition = GameWorld.transformCoords(player.position, [ 0,-1]); break;
      case 'south': proposedPosition = GameWorld.transformCoords(player.position, [ 0, 1]); break;
      case 'west':  proposedPosition = GameWorld.transformCoords(player.position, [-1, 0]); break;
      case 'east':  proposedPosition = GameWorld.transformCoords(player.position, [ 1, 0]); break;
    }
    if (this.isInBounds(proposedPosition)) {
        player.position = proposedPosition;
    }
  }

  tick() {
    var world = this;
    this.time++;
    this.players.forEach((player) => {
      while (player.actionQueue.length) {
        var thisAction = player.actionQueue.shift();
        switch (thisAction.action) {
          case 'move':
            world.movePlayer(player,thisAction.direction);
            break;
        }
      }
    });
  }
}

module.exports.GameWorld = GameWorld;