/*********************************************************************
 *                           MAP CLASSES
 *********************************************************************/
var Game = Game || {};

Game.Map = new Class.Singleton({
  Extends: Core.StaticActor,
  Implements: Core.Dispatchable,
  name: "Map",

  options: {
    cssClass: 'map'
  },

  initialize: function(){
    $log("Game.Map: initializing...", {section: 'open'});
    this.parent();
    this.assign('<div>').addClass(this.options.cssClass);
    this.positionTo(CONFIG.mapCenterX, CONFIG.mapCenterY);
    WORLD.appendChild(this, '#play');

    this.layers = {
      title: new Game.Map.TitleLayer,
      score: new Game.Map.Score,
      actiongrid: new Game.Map.GridLayer,
      link: new Game.Map.LinkLayer,
      isometry: new Game.Map.IsometryLayer,
      input: new Game.Map.InputLayer
    };
    $log("Game.Map: Adding title layer.");
    this.appendChild(this.layers.title);
    $log("Game.Map: Adding score bar.");
    this.appendChild(this.layers.score);
    $log("Game.Map: Adding grid layer.");
    this.appendChild(this.layers.actiongrid);
    $log("Game.Map: Adding link layer.");
    this.appendChild(this.layers.link);
    $log("Game.Map: Adding isometry layer.");
    this.appendChild(this.layers.isometry);
    $log("Game.Map: Adding input layer.");
    this.appendChild(this.layers.input);
    
    this.raidersBase = null;  // raiders base (controls raiders behavior)
    
    // Messages valid only when the map is builded. We listen them at build and unlisten at clean.
    this.runningMessages = [
      $msg.info.production,
      $msg.info.raid,
      $msg.update.infrastructures
    ];
    // Map all the receivers
    this.mapReceivers([
      {map: $msg.info.playStart, to: this.start},
      {map: $msg.info.playStop, to: this.stop},
      {map: $msg.info.production, to: this.receiveProductions},
      {map: $msg.info.raid, to: this.receiveRaids},
      {map: $msg.update.infrastructures, to: this.receiveInfrastructures}
    ]);
    // Just listen the create adn leave message, the other ones are listened at build and unlistened at reset.
    this.listen([$msg.info.playStart, $msg.info.playStop]);
    $log("Game.Map: OK", {section: 'close'});
  },

  start: function(game){
    $log("Creating map:", {section: "open"});
    this.build(game.map); // creates links, bases and terrains
    if(game.infrastructures) this.receiveInfrastructures(game.infrastructures); // Updates structures levels
    $log({section: "close"});

    // Listened messages
    this.listen(this.runningMessages);

    return true;
  },

  stop: function(){
    // Unlisten running messages
    this.unlisten(this.runningMessages);

    // Destroys all links and empties links
    this.layers.link.links.each(function(link){
      link.destroy();
    });
    this.layers.link.links.empty();

    // Destroys all terrains and empties terrains
    this.layers.isometry.terrains.each(function(terrain){
      terrain.destroy();
    });
    this.layers.isometry.terrains.empty();

    // Destroys all outposts and empties outposts
    this.layers.isometry.outposts.each(function(outpost){
      outpost.destroy();
    });
    this.layers.isometry.outposts.empty();

    this.layers.input.empty();

    // Raiders were a terrain so are already destroyed. Put its reference to null
    this.raidersBase = null;

    return true;
  },

  // mapData: array che contiene il tipo di risorse, da disegnare a spirale
  build: function(map){
    $log("Game.Map: building map...", {section: 'open'});
    var input = this.layers.input;
    
    /**********************************************************************/
    /* Builds links layer *************************************************/
    $log("Game.Map: adding links.", {section: 'open'});
    var orderedBuffer = [];  // Back 2 front ordering
    var layer = this.layers.link;
    
    $log("Game.Map: ordering links...");
    map.edges.each(function(edge){
      var eX = Math.floor(edge[0]) + Math.floor(edge[2]); // unique edge X coordinate
      var eY = Math.floor(edge[1]) + Math.floor(edge[3]); // unique edge Y coordinate

      /* Distance (scaled by a fixed amount) from the x=y horizontal line at the center of the map.
       * Distance ranges from -10 to 10 (-10,-9,-8....,9, 10). We add +10 to create an index usable
       * in the orderedBuffer array that ranges from 0 to 20. */
      var dBF = eX - eY + 10;
      var dLR = eX + eY + 5;

      var link = new Game.Map.Link({
        hexX: eX / 2, // edge X coordinate in the hex MAP space
        hexY: eY / 2, // edge Y coordinate in the hex MAP space
        terrains: edge,
        bf: dBF,
        lr: dLR
      });

      if(orderedBuffer[dBF] == undefined) orderedBuffer[dBF] = [];
      orderedBuffer[dBF].push(link);

      // Saves the road in an easily accessible hash using vX + ',' + vY as key.
      layer.links.set( (eX + ',' + eY), link );
    });
    // Adds the links to the dom back to front
    orderedBuffer.each(function(linksSet){
      linksSet.each(function(link){
        layer.appendChild(link);
        input.appendChild(new Game.Map.InputPad(link));
        $log("Game.Link: added at distance " + link.bfZ + ", hex: (" + link.hexX + "," + link.hexY + "), level: " + link.level + ", terrains: " + JSON.stringify(link.terrains));    
      });
    });
    $log("Game.Map: links added.", {section: 'close'});
    
    /**********************************************************************/
    /* Builds isometry layer *********************************************/
    $log("Game.Map: adding isometry tiles.", {section: 'open'});
    orderedBuffer.empty();
    layer = this.layers.isometry;
    
    // first we add terrains in the orderedBuffer because we want them under outposts
    $log("Game.Map: ordering terrains...");
    map.terrains.each(function(hexagon){
      if(!CONFIG.drawSea){
        if(hexagon[2] == CONFIG.resources.sea)
          return;
      }
      var hX = Math.floor(hexagon[0]), hY = Math.floor(hexagon[1]); // floor just to be sure the are ints
      
      /* Distance (scaled by a fixed amount) from the x=y horizontal line at the center of the map.
       * Distance ranges from -5 to 5 (-5,-4,-3....,4, 5). We add +5 to create an index usable
       * in the orderedBuffer array that ranges from 0 to 10. */
      var dBF = hX - hY + 5;
      var dLR = (hX + hY) * 3 + 8;
      
      var options = {
        hexX: hX,
        hexY: hY,
        type: hexagon[2],
        prob: hexagon[3],
        bf: dBF,
        lr: dLR
      };
      if(options.type == CONFIG.raidersTerrain){
        this.raidersBase = new Game.Map.RaidersBase(options);
        var terrain = this.raidersBase;
      } else {
        terrain = new Game.Map.Terrain(options);
      }
      
      if(orderedBuffer[dBF] == undefined) orderedBuffer[dBF] = [];
      orderedBuffer[dBF].push(terrain);
      
      // Saves the road in an easily accessible hash using vX + ',' + vY as key.
      layer.terrains.set( (hX + ',' + hY), terrain );
    }, this);
    
    $log("Game.Map: ordering outposts...");
    map.vertices.each(function(vertex){
      var vX = Math.floor(vertex[0]) + Math.floor(vertex[2]) + Math.floor(vertex[4]); // unique vertex X coordinate
      var vY = Math.floor(vertex[1]) + Math.floor(vertex[3]) + Math.floor(vertex[5]); // unique vertex Y coordinate
      
      /* Distance (scaled by a fixed amount) from the x=y horizontal line at the center of the map.
       * Distance ranges from -5 to 5 (-5,-4,-3....,4, 5). We add +5 to create an index usable
       * in the orderedBuffer array that ranges from 0 to 10. */
      var dBF = Math.floor((vX - vY)/3) + 5;
      var dLR = (vX + vY) + 8;
      
      var outpost = new Game.Map.Outpost({
        hexX: vX / 3, // vertex X coordinate in the hex MAP space
        hexY: vY / 3, // vertex Y coordinate in the hex MAP space
        terrains: vertex,
        bf: dBF,
        lr: dLR
      });
      
      if(orderedBuffer[dBF] == undefined) orderedBuffer[dBF] = [];
      orderedBuffer[dBF].push(outpost);
      
      // Saves the road in an easily accessible hash using vX + ',' + vY as key.
      layer.outposts.set( (vX + ',' + vY), outpost );
    },this);
    
    // Adds the sorted terrains and outposts to the dom back to front
    orderedBuffer.each(function(depthSet){
      // Reorder the set from left to right
      var orderedSet = [];  // Left 2 right ordering
      
      depthSet.each(function(element){
        orderedSet[element.lrZ] = element;
      });
      orderedSet.clean();
      
      orderedSet.each(function(element){
        layer.appendChild(element);
        if(element.cmdPrefix){  // It's an outpost
          $log("Game.Map.Outpost: added at distance " + element.bfZ + ", hex: (" + element.hexX + "," + element.hexY + "), level: " + element.level + ", terrains: " + JSON.stringify(element.terrains));    
          input.appendChild(new Game.Map.InputPad(element))
        } else { // It's a terrain
          $log("Game.Map.Terrain: added at distance " + element.bfZ + ", hex: (" + element.hexX + "," + element.hexY + "), type: " + element.type + ", productivity: " + element.productivity);    
        }
      });
    });
    $log("Game.Map: isometry tiles added.", {section: 'close'});
    
    $log("Game.Map: map builded.", {section: 'close'});
    return true;
  },

  // Converts hex grid coordinate system into screen x, y coordinates. Correction defines
  // an optional translation in pixels, used to center the element around its center, if needed.
  // (0,0) is the upper right corner of the element bounding box.
  // mapCoord: {hexX: int, hexY: int}
  // correction: {dX: translationX, dY: transaltionY}, OPTIONAL.
  // return: {x: int , y: int}
  hex2screen: function(mapCoord, correction){
    correction = correction || {
      dX:0,
      dY:0
    }
    var screenX = Math.floor(CONFIG.tileDx * (mapCoord.hexX + mapCoord.hexY) + correction.dX);
    var screenY = Math.floor(CONFIG.tileDy * (mapCoord.hexX - mapCoord.hexY) + correction.dY);
    return {
      x: screenX,
      y: screenY
    };
  },

  /************* MESSAGE RECEIVERS **********************************************************/

  /* Called by server to notify terrain production. terrains is an
   * array of coordinates: [[0,0],[1,0],...] where each coordinate is an array of x and y and
   * represent the terrain producing resources. */
  receiveProductions: function(terrains){
    terrains.each(function(terrain){
      var t = this.layers.isometry.getTerrain(terrain);
      if(!$defined(GAME.stats.production[t.productivity])) GAME.stats.production[t.productivity] = 0;
      GAME.stats.production[t.productivity]++;
      t.produce();
    }, this);
    return true;
  },

  /* Called by server to notify raided terrain, that do not produce. Terrains is an
   * array of coordinates: [[0,0],[1,0],...] where each coordinate is an array of x and y and
   * represent the terrain not producing resources. */
  receiveRaids: function(terrains){
    if(this.raidersBase && terrains.length > 0){
      var terrain = this.layers.isometry.getTerrain(terrains[0]);
      this.raidersBase.raid(terrain);
    }
    return true;
  },

  /* Updates the infrastructures.
   *
   * - infrastructures => {s: [settlements], r: [roads]} where
   *   : each settlement is => {c: [x1,y1,x2,y2,x3,y3], l: level, p: player}
   *   : each road is => {c: [x1,y1,x2,y2], l: level, p: player}
   *   : level is the building level: 0..2 for settlements, 0..1 for roads
   *   : player is the player number: 1..4 (it's not related to server objects, it's
   *     only an ordinal value used to assign the proper css class).
   */
  receiveInfrastructures: function(structs){
    var counts = new Hash;  // Used to store structures counts
    GAME.pids.each(function(pid){ counts.set(pid, {stations: 0, outposts: 0, links: 0}); });

    // Update BASES -----------------
    var layer = this.layers.isometry;
    structs.s.each(function(struct){
      var outpost = layer.getOutpost(struct.c);
      if(outpost){
        // Fires audio fx only if not loading
        if(!GAME.loading && (outpost.level < struct.l)){
          this.send($msg.audio.fx, outpost.buildFx[outpost.level]);
        }
        // updates the base data
        outpost.set({
          player: GAME.players[struct.p].slot,
          level: struct.l
        });
        // updates the terrain pointers to outposts
//        if(struct.l == 1){
//          for(var i = 0; i < 6; i += 2){
//            layer.getTerrain([ struct.c[i+0], struct.c[i+1] ]).outposts.push(outpost);
//          }
//        }

        // Counts stations and outposts
        if(outpost.level == 1) counts[struct.p].outposts++;
        if(outpost.level == 2) counts[struct.p].stations++;
      }
    }, this);

    // Update LINKS -----------------
    layer = this.layers.link;
    structs.r.each(function(struct){
      var link = layer.getLink(struct.c);
      if(link){
        // Fires audio fx only if not loading
        if(!GAME.loading && (link.level < struct.l)){
          this.send($msg.audio.fx, link.buildFx[link.level]);
        }
        // updates the link data
        link.set({
          player: GAME.players[struct.p].slot,
          level: struct.l
        });
        // updates the terrain pointers to links
//        if(struct.l == 1){
//          for(var i = 0; i < 4; i += 2){
//            layer.getTerrain([ struct.c[i+0], struct.c[i+1] ]).links.push(link);
//          }
//        }

        if(link.level == 1) counts[struct.p].links++;
      }
    }, this);
    
    // Saves the structures counts into the game state
    counts.each(function(owned, pid){
      var map = GAME.players[pid].map;
      map.stations = owned.stations;
      map.outposts = owned.outposts;
      map.links = owned.links;
    })
    return true;
  }

});
