var Game = new function() {                                                                  
  var boards = [];

  // Game Initialization
  this.initialize = function(canvasElementId,sprite_data,callback) {
    this.canvas = document.getElementById(canvasElementId)
    this.width = this.canvas.width;
    this.height= this.canvas.height;

    this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
    if(!this.ctx) { return alert("Please upgrade your browser to play"); }

    this.setupInput();

    this.loop(); 

    SpriteSheet.load(sprite_data,callback);
  };

  // Handle Input
  var KEY_CODES = { 37:'left', 39:'right', 32 :'fire' };
  this.keys = {};

  this.setupInput = function() {
    window.addEventListener('keydown',function(e) {
      if(KEY_CODES[e.keyCode]) {
       Game.keys[KEY_CODES[e.keyCode]] = true;
       e.preventDefault();
      }
    },false);

    window.addEventListener('keyup',function(e) {
      if(KEY_CODES[e.keyCode]) {
       Game.keys[KEY_CODES[e.keyCode]] = false;
       e.preventDefault();
      }
    },false);
  }

  // Game Loop
  this.loop = function() { 
    var dt = 30 / 1000;

    for(var i=0,len = boards.length;i<len;i++) {
      if(boards[i]) { 
        boards[i].step(dt);
        boards[i].draw(Game.ctx);
      }
    }

    setTimeout(Game.loop,30);
  };
  
  // Change an active game board
  this.setBoard = function(num,board) { boards[num] = board; };
};


var SpriteSheet = new function() {
  this.map = { }; 

  this.load = function(spriteData,callback) { 
    this.map = spriteData;
    this.image = new Image();
    this.image.onload = callback;
    this.image.src = 'images/sprites.png';
  };

  this.draw = function(ctx,sprite,x,y,frame) {
    var s = this.map[sprite];
    if(!frame) frame = 0;
    ctx.drawImage(this.image,
                     s.sx + frame * s.w, 
                     s.sy, 
                     s.w, s.h, 
                     Math.floor(x), Math.floor(y),
                     s.w, s.h);
  };
}

var TitleScreen = function TitleScreen(title,subtitle,callback) {
  var up = false;

  this.step = function(dt) {
    if(!Game.keys['fire']) up = true;
    if(up && Game.keys['fire'] && callback) callback();
  };

  this.draw = function(ctx) {
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";

    ctx.font = "bold 40px bangers";
    ctx.fillText(title,Game.width/2,Game.height/2);

    ctx.font = "bold 20px bangers";
    ctx.fillText(subtitle,Game.width/2,Game.height/2 + 40);
  };
};

var GameBoard = function() {
    var board = this;
    //The current list of objects
    this.objects = [];
    this.cnt = [];

    //Add a new object to the object list
    //Alternatives
    //  - mark object as removed
    //  - then either iterate with filter or maybe just reuse as necessary
    this.add = function(obj) {
        obj.board = this;
        this.objects.push(obj);
        this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1;
        return obj;
    }

    //Mark an object for removal
    this.remove = function(obj) {
        var wasStillAlive = this.removed.indexOf(obj) != 1;
        if (wasStillAlive) {
            this.removed.push(obj);
        }
    };

    this.resetRemoved = function() {
        this.removed = [];
    }

    this.finalizeRemoved = function() {
        for(var i = 0, len = this.removed.length; i < len; i++) {
            var idx = this.objects.indexOf(this.removed[i]);
            if (idx != -1) {
                this.cnt[this.removed[i].type]--;
                this.objects.splice(idx,1);
            }
        }
    }

    this.iterate = function(funcName) {
        var args = Array.prototype.slice.call(arguments,1);
        for(var i = 0, len = this.objects.length;i < len; i++) {
            var obj = this.objects[i];
            obj[funcName].apply(obj, args);
        }
    }

    //Find first object for which func is true
    this.detect = function(func) {
        for(var i = 0, len = this.objects.length;i < len; i++) {
            if (func.call(this.objects[i])) {
                return this.objects[i];
            }
        }

    }

    this.step = function(dt) {
        this.resetRemoved();
        this.iterate('step', dt);
        this.finalizeRemoved();
    }
    this.draw = function(ctx) {
        this.iterate('draw', ctx);
    };

    this.overlap = function(o1,o2) {
        return !((o1.y+o1.h < o2.y) || (o1.y>o2.y+o2.h-1) ||
                 (o1.x+o1.w < o2.x) || (o1.x>o2.x+o2.w-1));
    };

    this.collide = function(obj, type) {
        return this.detect(function() {
            if(obj != this) {
                var col = (!type || this.type & type) && board.overlap(obj, this);
                return col ? this : false;
            }
        });
    };
}

var Sprite = function() {}

Sprite.prototype.setup = function(sprite, props) {
    this.sprite = sprite;
    this.merge(props);
    this.frame = this.frame || 0;
    this.w = SpriteSheet.map[sprite].w;
    this.h = SpriteSheet.map[sprite].h;
};

Sprite.prototype.merge = function(props) {
    if(props) {
        for (var prop in props) {
            this[prop] = props[prop];
        }
    }
};

Sprite.prototype.draw = function(ctx) {
    SpriteSheet.draw(ctx, this.sprite, this.x, this.y, this.frame);
};