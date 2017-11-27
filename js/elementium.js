//Elementium - arcade shoot'em up made for JS13KGames competition
//by Robert 'Aplegatt' Nowakowski - september 2014

var Game = {};

//main variables and game initialization
Game.init = function() {
  DEBUG = false;
  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  this.then = Date.now();
  this.interval = 1000/45;
  this.timeForLevel = 50000;
  this.canvas = document.querySelector('#gameCanvas');
  this.ctx = this.canvas.getContext('2d');
  this.WIDTH = this.canvas.width;
  this.HEIGHT = this.canvas.height;
  last = Date.now();
  paused = false;
  over = false;
  start = true;
  this.level = 1;
  this.score = 0;
  this.loadGraphics();
  this.setHiscore();
}

//loading some graphic assets
Game.loadGraphics = function() {
  tiles = new Image();
  tiles.src = "gfx/js13k.gif";
  numbers = new Image();
  numbers.src = "gfx/numbers.gif";
}

//this speaks for itself:)
Game.update = function() {
  World.update();
  if (!start) Sprites.update();
}

Game.draw = function() {
  World.draw();
  Sprites.draw();
  HUD.draw();
  if (DEBUG) Utils.fpsCounter();
  if (over) {
    Game.ctx.font = "78px Verdana";
    Game.ctx.fillText("GAME OVER", 2, 400);
    Game.ctx.font = "36px Verdana";
    Game.ctx.fillText("PRESS 'R' TO RESTART", 35, 450);
  };
  if (start) {
    var gradient = Game.ctx.createLinearGradient(0, 0, Game.WIDTH, 0);
    gradient.addColorStop("0","#0000FF");
    gradient.addColorStop("0.3","#FF0000");
    gradient.addColorStop("0.6","#7F3300");
    gradient.addColorStop("1.0","#7FFFC5");
    Game.ctx.font = "36px Verdana";
    Game.ctx.fillText("PRESS ANY KEY", 100, 450);
    Game.ctx.font = "14px Verdana";
    Game.ctx.fillText("by Robert 'Aplegatt' Nowakowski", 120, 700);
    Game.ctx.fillStyle = gradient;
    Game.ctx.font = "72px Verdana";
    Game.ctx.fillText("ELEMENTIUM", 1, 400);
  }
}

//main (and only) loop
Game.loop = function() {
  current = Date.now();
  fps = 1000/(current - last);
  last = current;

  requestAnimationFrame(Game.loop);

  if (!paused && !over) {
    Game.update();
    Game.draw();
  }
}

//everything is moving!!!
Game.start = function() {
  World.init();
  World.makeStars();
  Input.init();
  Sprites.init();
  requestAnimationFrame(Game.loop);
}

//managing pause
Game.pause = function() {
  if (Input.keys[80]) {
    if (!paused) {
      paused = true;
    } else {
      paused = false
    }
  }
}

//what happens after pressing 'r'
Game.restart = function() {
  if (Input.keys[82]) {
    this.level = 1;
    this.score = 0;
    World.init();
    World.makeStars();
    World.time = Date.now();
    Sprites.init();
    paused = false;
    over = false;
  }
}

//press any key
Game.anyKey = function() {
  if (start) {
    start = false;
    World.time = Date.now();
  }
}

//you lose, check hiscore
Game.over = function() {
  over = true;
  this.setHiscore();
}

//setting hiscore and putting it in browser's local storage
Game.setHiscore = function() {
  if (localStorage.hiscore) {
    if (this.score > localStorage.hiscore) {
      localStorage.setItem("hiscore", this.score);
    }
  } else {
    localStorage.setItem("hiscore", 0);	
  }	
  document.getElementById("hiscore").innerHTML = localStorage.getItem("hiscore");
}

var World = {};

World.init = function() {
  this.stars = [];
}

World.update = function() {
  this.moveStars();
  var isItTime = Date.now();
  if (isItTime > this.time+Game.timeForLevel) {
    Game.level++;
    this.time = isItTime;
  }
}

World.draw = function() {
  Game.ctx.fillStyle = "#000000";
  Game.ctx.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);
  this.drawStars();
}

//star object
World.Star = function(x, y, rad) {
  this.x = x;
  this.y = y;
  this.rad = rad;
}

//putting stars in the sky
World.makeStars = function() {
  for (var i = 0; i < 400; i++) {
    var starX = Utils.randomInt(0, 480);
    var starY = Utils.randomInt(0, 800);
    var rad = Utils.randomInt(1, 2);
    this.stars.push(new this.Star(starX, starY, rad));
  }
}

World.drawStars = function() {
  for (var s in this.stars) {
    Game.ctx.fillStyle = "#FFFFFF";
    Game.ctx.beginPath();
    Game.ctx.arc(this.stars[s].x, this.stars[s].y, this.stars[s].rad, 0, 2*Math.PI);
    Game.ctx.fill();
  }
}

World.moveStars = function() {
  for (var s in this.stars) {
    this.stars[s].y++;
    if (this.stars[s].y >= 800) this.stars[s].y = 0;
  }
}

var Input = {};

//input handling
Input.init = function() {
  this.keys = [];
  window.addEventListener("keydown", function(e) {
    Input.keys[e.keyCode] = true;
    e.preventDefault();
    Game.anyKey();
    Game.pause();
    Game.restart();
  }, false)
  window.addEventListener("keyup", function(e) {
    Input.keys[e.keyCode] = false;
    e.preventDefault();
  }, false)
}

var Sprites = {};

//setting arrays for entities, creating player
Sprites.init = function() {
  this.enemies = [];
  this.bullets = [];
  this.enemyBullets = [];
  this.player = new Player(220, 750, 25, 32, 100, 1);
}

Sprites.update = function() {
  this.updatePlayer();
  this.updateBullets();
  this.updateEnemyBullets();
  this.updateEnemies();
  this.calcCollisions();
}

Sprites.draw = function() {
  this.drawPlayer();
  this.drawBullets();
  this.drawEnemyBullets();
  this.drawEnemies();
}

//updating player position, firing bullets
Sprites.updatePlayer = function() {
  if (Input.keys[38]) {
    this.player.y -= (2 + this.player.speed);
  }
  else if (Input.keys[40]) {
    this.player.y += (2 + this.player.speed);
  }
  if (Input.keys[37]) {
    this.player.x -= (2 + this.player.speed);
  }
  else if (Input.keys[39]) {
    this.player.x += (2 + this.player.speed);
  }
  if (Input.keys[70] && this.player.coolDown == 0) {
    new Audio("snd/las1.mp3").play();
    this.bullets.push(new Bullet(this.player.x + 10, this.player.y, 3, 5, 9, "#0000FF", "water"));
    this.player.coolDown = 10;
  }
  if (Input.keys[68] && this.player.coolDown == 0) {
    new Audio("snd/las1.mp3").play();
    this.bullets.push(new Bullet(this.player.x + 10, this.player.y, 3, 5, 9, "#FF0000", "fire"));
    this.player.coolDown = 10;
  }
  if (Input.keys[65] && this.player.coolDown == 0) {
    new Audio("snd/las1.mp3").play();
    this.bullets.push(new Bullet(this.player.x + 10, this.player.y, 3, 5, 9, "#7F3300", "earth"));
    this.player.coolDown = 10;
  }
  if (Input.keys[83] && this.player.coolDown == 0) {
    new Audio("snd/las1.mp3").play();
    this.bullets.push(new Bullet(this.player.x + 10, this.player.y, 3, 5, 9, "#7FFFC5", "air"));
    this.player.coolDown = 10;
  }
  if (this.player.coolDown != 0) this.player.coolDown--;
  if (this.player.x <= 0) this.player.x = 0;
  if (this.player.x >= Game.WIDTH-this.player.width) this.player.x = Game.WIDTH-this.player.width;
  if (this.player.y >= Game.HEIGHT-this.player.height) this.player.y = Game.HEIGHT-this.player.height;
  if (this.player.y <= 0) this.player.y = 0;
  if (Game.score >= 1000 && this.player.speed == 1) this.player.speed += 1;
  if (Game.score >= 2000 && !this.player.megashot) this.player.megashot = true;
}

Sprites.drawPlayer = function() {
  if (!over) {
    Game.ctx.drawImage(tiles, this.player.width*this.player.frame, 0, 25, 32, this.player.x, this.player.y, this.player.width, this.player.height);
  }
}

Sprites.updateBullets = function() {
  for (var b in this.bullets) {
    this.bullets[b].y -= this.bullets[b].speed;
    if (this.bullets[b].y < 0) {
      this.bullets.splice(b, 1);
    }
  }
}

Sprites.drawBullets = function() {
  for (var b in this.bullets) {
    Game.ctx.fillStyle = this.bullets[b].color;
    Game.ctx.fillRect(this.bullets[b].x, this.bullets[b].y, this.bullets[b].width, this.bullets[b].height);
  }
}

Sprites.createEnemies = function() {
  var posX = Utils.randomInt(0, 440);
  var posY = Utils.randomInt(-50, -500)
  var kinds = ["water", "fire", "earth", "air"];
  var selectedKind = Utils.randomInt(0, 3);
  var decision = Utils.randomInt(1, 2);
  if (Math.random() < (0.007*Game.level)) this.enemies.push(new Enemy(posX, posY, 30, 30, 3, 2, kinds[selectedKind], decision));
}

//heart, or rather mind of enemies, randomizing their behaviour
Sprites.updateEnemies = function() {
  this.createEnemies();
  for (var e in this.enemies) {
    this.enemies[e].y += (1 * this.enemies[e].speed);
    this.enemies[e].age++;
    if (this.enemies[e].age > (300/(1+Game.level/10)) && this.enemies[e].kind == "water") this.enemies[e].x += (1 * this.enemies[e].speed);
    if (this.enemies[e].age > (250/(1+Game.level/10)) && this.enemies[e].kind == "fire") {
      this.enemies[e].x -= (1 * this.enemies[e].speed);
      this.enemies[e].y += (1 * this.enemies[e].speed);
    }
    if (this.enemies[e].age > (350/(1+Game.level/10)) && this.enemies[e].kind == "fire") {
      if (this.enemies[e].decision == 1) {
        this.enemies[e].x += (2 * this.enemies[e].speed);
        this.enemies[e].y -= (3 * this.enemies[e].speed);
      } else if (this.enemies[e].decision == 2) {
        this.enemies[e].x -= (2 * this.enemies[e].speed);
        this.enemies[e].y -= (3 * this.enemies[e].speed);
      }

    }
    if (this.enemies[e].age > (270/(1+Game.level/10)) && this.enemies[e].kind == "earth") {
      if (this.enemies[e].decision == 1) {
        this.enemies[e].x += (1 * this.enemies[e].speed);
        this.enemies[e].y += (1 * this.enemies[e].speed);
      } else if (this.enemies[e].decision == 2) {
        this.enemies[e].x -= (1 * this.enemies[e].speed);
        this.enemies[e].y += (1 * this.enemies[e].speed);
      }
    }
    if (this.enemies[e].age > (290/(1+Game.level/10)) && this.enemies[e].kind == "air") {
      if (this.enemies[e].decision == 1) {
        this.enemies[e].speed *= 1.05;
      } else if (this.enemies[e].decision == 2) {
        this.enemies[e].y -= (3 * this.enemies[e].speed);
      }
    }

    //adding score
    if (this.enemies[e].health <= 0) {
      if (this.enemies[e].kind == "water") {
        Game.score += 20;
      } else if (this.enemies[e].kind == "fire") {
        Game.score += 50;
      } else if (this.enemies[e].kind == "earth") {
        Game.score += 50;
      } else if (this.enemies[e].kind == "air") {
        Game.score += 100;
      }
      this.enemies.splice(e, 1);
    }

    //when enemies fire
    if (Math.random() < 0.0005*Game.level) {
      new Audio("snd/las2.mp3").play();
      var bulletSpeed = Utils.randomInt(this.enemies[e].speed, this.enemies[e].speed+4)
      this.enemyBullets.push(new EnemyBullet(this.enemies[e].x+15, this.enemies[e].y+30, 5, 5, bulletSpeed));
    }

    //deleting enemies leaving canvas
    if (this.enemies[e] != undefined && this.enemies.length > 0) {
      if (this.enemies[e].y > Game.HEIGHT || this.enemies[e].x > Game.WIDTH || this.enemies[e].x < -this.enemies[e].width) {
        this.enemies.splice(e, 1);
      }
    }
  }
}

Sprites.drawEnemies = function() {
  for (var e in this.enemies) {
    if (this.enemies[e].kind == "water") Game.ctx.drawImage(tiles, 0, 64, 30, 30, this.enemies[e].x, this.enemies[e].y, this.enemies[e].width, this.enemies[e].height);
    else if (this.enemies[e].kind == "fire") Game.ctx.drawImage(tiles, 0, 96, 30, 30, this.enemies[e].x, this.enemies[e].y, this.enemies[e].width, this.enemies[e].height);
    else if (this.enemies[e].kind == "air") Game.ctx.drawImage(tiles, 0, 128, 30, 30, this.enemies[e].x, this.enemies[e].y, this.enemies[e].width, this.enemies[e].height);
    else if (this.enemies[e].kind == "earth") Game.ctx.drawImage(tiles, 0, 160, 30, 30, this.enemies[e].x, this.enemies[e].y, this.enemies[e].width, this.enemies[e].height);
  }
}

Sprites.updateEnemyBullets = function() {
  for (var b in this.enemyBullets) {
    this.enemyBullets[b].y += this.enemyBullets[b].speed;
    if (this.enemyBullets[b].y > Game.HEIGHT) {
      this.enemyBullets.splice(b, 1);
    }
  }
}

Sprites.drawEnemyBullets = function() {
  for (var b in this.enemyBullets) {
    Game.ctx.fillStyle = "#FFD800";
    Game.ctx.fillRect(this.enemyBullets[b].x, this.enemyBullets[b].y, this.enemyBullets[b].width, this.enemyBullets[b].height);
  }
}

//checking collisions
Sprites.calcCollisions = function() {
  this.bullets.forEach(function(bullet) {
    Sprites.enemies.forEach(function(enemy) {
      if (Utils.checkCollision(bullet, enemy)) {
        new Audio("snd/hit1.mp3").play();
        var bulletIndex = Sprites.bullets.indexOf(bullet);
        if (bullet.kind == enemy.kind) {
          if (Sprites.player.megashot) {
            enemy.health -= 2;
          } else {
            enemy.health -= 1;
          }
        }
        Sprites.bullets.splice(bulletIndex, 1);
      }
    })
  });
  this.enemyBullets.forEach(function(enemyBullet) {
    if (Utils.checkCollision(enemyBullet, Sprites.player)) {
      Game.over();
      new Audio("snd/expl1.mp3").play();
      var enemyBulletIndex = Sprites.enemyBullets.indexOf(enemyBullet);
      Sprites.enemyBullets.splice(enemyBulletIndex, 1);
    }
  });
  this.enemies.forEach(function(enemy) {
    if (Utils.checkCollision(enemy, Sprites.player)) {
      Game.over();
      new Audio("snd/expl1.mp3").play();
      var enemyIndex = Sprites.enemies.indexOf(enemy);
      Sprites.enemies.splice(enemyIndex, 1);
    }
  });
}

var HUD = {};

HUD.draw = function() {
  this.drawScore();
  this.drawLevel();
}

//draw score display
HUD.drawScore = function() {
  Game.ctx.save();
  Utils.drawNumber(Game.score.toString(), 10, 10);
  Game.ctx.restore();
}

//draw level indicator
HUD.drawLevel = function() {
  Game.ctx.save();
  Game.ctx.font = "14px Verdana";
  Game.ctx.fillStyle = "#FFFFFF";
  Game.ctx.fillText("Level " + Game.level, 420, 20);
  Game.ctx.restore();
}

//object constructors
var Player = function(x, y, width, height, health, speed) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.health = health;
  this.speed = speed;
  this.frame = 0;
  this.megashot = false;
  this.coolDown = 0;
}

var Enemy = function(x, y, width, height, health, speed, kind, decision) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.health = health;
  this.speed = speed + (Game.level/2);
  this.kind = kind;
  this.decision = decision;
  this.age = 0;
}

var Bullet = function(x, y, width, height, speed, color, kind) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.speed = speed;
  this.color = color;
  this.kind = kind;
}

var EnemyBullet = function(x, y, width, height, speed) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.speed = speed;
}

//helping functions
var Utils = {};

//generating random integer
Utils.randomInt = function(min, max) {
  return Math.floor(Math.random()*(max - min + 1) + min);
}

//drawing fps counter (used for debugging)
Utils.fpsCounter = function() {
  Game.ctx.font = "20px Georgia";
  Game.ctx.fillStyle = "#FF0000";
  Game.ctx.fillText(fps.toFixed(2), 400, 20);
}

//collisions (based on rectangles)
Utils.checkCollision = function(obj1, obj2) {
  if (obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
          obj1.y +obj1.height > obj2.y) {
    return true;
  } else {
    return false;
  }
}

//draw single digit from spritesheet
Utils.drawSpriteFont = function(number, nx, ny) {
  Game.ctx.drawImage(numbers, number*10, 0, 10, 10, nx, ny, 10, 10);
}

//draw number from spritesheet digits
Utils.drawNumber = function(number, nx, ny) {
  var space = 0;
  for (var i in number) {
    this.drawSpriteFont(number[i], nx + space, ny);
    space += 10;
  }
}

//LET THERE BE ROCK
Game.init();
Game.start();
