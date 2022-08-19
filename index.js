var titleCard = document.getElementById('title');
var canvas = document.getElementById('myCanvas');   // On récupère le canvas
var player = document.getElementsByTagName("input")[0]
var player_name = ""

let t = 0, ms = 0, s = 0, mn = 0, h = 0, time = [], score = [];
const timer = () => {
    let time = [];
    ms += 1;
    if (ms == 10) {
        ms = 1;
        s += 1;
    }
    if (s == 60) {
        s = 0;
        mn += 1;
    }
    if (mn == 60) {
        mn = 0;
        h += 1;
    }
    (h < 10) ? time.push("0" + h) : time.push(h);
    (mn < 10) ? time.push("0" + mn) : time.push(mn);
    (s < 10) ? time.push("0" + s) : time.push(s);

    return time;
}
const resetTimer = () => {
    ms = 0, s = 0, mn = 0, h = 0;
    time = [];
    t = setInterval(timer, 1);
}

if (!canvas ||!canvas.getContext) {                 // Si le canvas n'a pas été récupéré
    alert(canvas);}                                 // Envoyer une alerte a l'utilisateur

context = canvas.getContext('2d');                  // On récupère le contexte du canvas
if (!context) {                                     // Si le contexte n'a pas été récupéré
    alert(context);}                                // Envoyer une alerte a l'utilisateur

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var largeur_canvas = window.innerWidth;	    // La largeur de la fenetre
var hauteur_canvas = window.innerHeight;	// La hauteur de la fenetre  

let destroy_shot = false;
let destroy_enemy = false;
let destroy_canon = false;

let hit_enemy = false;

let enemy_score = 0;
let enemy_abs = 0;
let enemy_ord = 0;

let gameTime = 0

window.addEventListener('load', function () {   // Au chargement de la page :
    var bgMusic = document.getElementById('bgAudio')
    bgMusic.volume=0.1
    bgMusic.loop="true"
}, false)

const startGame = () => {
    canvas.style.display="block";
    titleCard.style.display="none";

    player_name = player.value

    if (player_name==="") {
        player_name = "???"
    }
    
    resetTimer();

    let gameParameters = {
        "canonCoordinates":[largeur_canvas/2-15,hauteur_canvas-150],
        "shotCoordinates":[largeur_canvas/2-4,hauteur_canvas-165],
        "enemyCoordinates":[Math.round(Math.random()*(largeur_canvas-100)),Math.round(Math.random()*100)],
        "displayCoordinates":[0,0],
        "enemyShotCoordinates":[0,0],
        "explosionCoordinates":[0,0],
        "gameData":
        {
            "enemyData":
            {
                "enemyId":"",
                "enemyExplosionId":"",
                "enemySize":"",
                "enemyDisplayScoreTime":1000,
                "enemyLives":1,
                "enemySpeed":0.1,
                "enemyAttribute":"",
                "enemyShoots":false,
                "enemyMove":
                {
                    "enemyTimeMoving":Math.round(Math.random()*500+1),
                    "enemyDirection":Math.round(Math.random())
                }
            },
            "playerData":
            {
                "playerName":player_name,
                "nbKills":0,
                "points":0,
                "level":1,
                "maxLevel":10,
                "lives":3
            },
            "displayScoreData":
            {
                "display":false,
                "displayTime":50,
                "displayScore":0
            },
            "explosionData":
            {
                "explosionSize":0,
                "explosionType":Math.round(Math.random()*3+1)                
            },
            "enemyShotData":
            {
                "projectileId":""
            }
        }
    }

    getEnemyAttribute(gameParameters)

    new_enemy(gameParameters)

    window.addEventListener('keydown', function(event) {
        pressedKey(event,gameParameters)
    })

    boucleJeu = setInterval(refreshGame,1,gameParameters)
    };

const refreshGame = (gameParameters) => {  
    if (hit_enemy) {
        playHitSound()
        hit_enemy = false;
        gameParameters["gameData"]["enemyData"]["enemyLives"]-=1;
        if (gameParameters["gameData"]["enemyData"]["enemyLives"]===0) {
            destroy_enemy=true;
        }
    }

    if (destroy_enemy) {
        setExplosion(gameParameters);

        gameParameters['gameData']["playerData"]['points']+=enemy.score;
        gameParameters['gameData']["playerData"]['nbKills']+=1;

        gameParameters['gameData']['displayScoreData'] = {"display":true,"displayTime":50,"displayScore":enemy.score};

        enemy = undefined;
        destroy_enemy = false;

        if (gameParameters["gameData"]["playerData"]["level"]===gameParameters["gameData"]["playerData"]["maxLevel"]) {
            endGame(gameParameters);
            return;
        }
        check_level(gameParameters);
        if (gameParameters["gameData"]["playerData"]["level"]===gameParameters["gameData"]["playerData"]["maxLevel"]-1){
            gameParameters["gameData"]["playerData"]["level"]+=1
            gameParameters['gameData']['enemyData']['enemyId'] = 6;
            gameParameters['gameData']["enemyData"]["enemySize"] = 3;
            gameParameters['gameData']["explosionData"]["explosionSize"] = 3
        }        
        new_enemy(gameParameters);
    }

    if (destroy_canon) {
        canon = undefined
        destroy_canon = false
        new_canon(gameParameters)
    }
    
    if (destroy_shot) {
        shoot = undefined;
        destroy_shot = false;
        new_shot(gameParameters);
    }

	// NETTOYAGE DU CANVAS
	context.clearRect(0,0,largeur_canvas,hauteur_canvas);   // On nettoie le canvas

    context.font = "30px DDBB";
    context.fillStyle = 'rgba(255,255,255)'
    let timeLapse = timer();
    context.fillText("Temps : "+timeLapse[0] + ':' + timeLapse[1] + ':' + timeLapse[2], 10, 50);
    context.fillText("Vies : "+gameParameters["gameData"]["playerData"]["lives"],10,100);

    context.fillText("Score : "+"0".repeat(6-gameParameters["gameData"]["playerData"]["points"].toString().length)+gameParameters["gameData"]["playerData"]["points"], largeur_canvas-250, 50);
    context.fillText("Niveau "+"0".repeat(2-gameParameters["gameData"]["playerData"]["level"].toString().length)+gameParameters["gameData"]["playerData"]["level"], largeur_canvas-250,100);

    if (gameParameters["gameData"]["displayScoreData"]["display"]) {
        context.fillStyle = 'rgba(255,255,255,'+gameParameters["gameData"]["displayScoreData"]["displayTime"]/50+')'
        context.fillText('+'+gameParameters["gameData"]["displayScoreData"]["displayScore"],gameParameters["displayCoordinates"][0],gameParameters["displayCoordinates"][1])        
        gameParameters["displayCoordinates"][1]-=0.5
        gameParameters["gameData"]["displayScoreData"]["displayTime"]-=0.5

        explosion = new Explosion(gameParameters["explosionCoordinates"][0],gameParameters["explosionCoordinates"][1],gameParameters["gameData"]["explosionData"]["explosionSize"],gameParameters["gameData"]["explosionData"]["explosionType"])
    }

    if (gameParameters["gameData"]["displayScoreData"]["displayTime"]===0) {
        gameParameters["gameData"]["displayScoreData"]["display"]=false;
    }

    if (gameParameters["gameData"]["enemyData"]["enemyShoots"]) {  
        enemy_shot = new EnemyShot(gameParameters["enemyShotCoordinates"][0],gameParameters["enemyShotCoordinates"][1],gameParameters["gameData"]["enemyShotData"]["projectileId"])
    }

    
    move_enemy(gameParameters)

    canon = new Canon(gameParameters["canonCoordinates"][0],gameParameters["canonCoordinates"][1]);  // Mise en route de la boucle du jeu

    enemy = new Enemy(gameParameters["enemyCoordinates"][0],gameParameters["enemyCoordinates"][1],gameParameters["gameData"]["enemyData"]["enemyId"],gameParameters["gameData"]["enemyData"]["enemySize"])

    let enemy_data = {"enemyHeight" : enemy.height, "enemyWidth" : enemy.width, "enemyAbs" : enemy.abs, "enemyOrd" : enemy.ord, "enemyType" : "enemy"}
    let canon_data = {"canonHeight" : canon.height, "canonWidth" : canon.width, "canonAbs" : canon.abs, "canonOrd" : canon.ord}
    check_enemy(enemy_data,canon_data);

    if (gameParameters["gameData"]["enemyData"]["enemyShoots"]) {
        let enemy_shot_data = {"enemyHeight" : enemy_shot.height, "enemyWidth" : enemy_shot.width, "enemyAbs" : enemy_shot.abs, "enemyOrd" : enemy_shot.ord, "enemyType" : "shot"}
        check_enemy(enemy_shot_data,canon_data)
    }

    if (typeof(shoot)==='undefined') {
        return
    }  
    check_shoot(gameParameters);
    check_hit(enemy,shoot);
}

const pressedKey = (event,gameParameters) => {
    switch(event.keyCode) {
        case 37:
            console.log("Gauche");
            if (!(gameParameters["canonCoordinates"][0]>-3)){
                return;
            }
            gameParameters["canonCoordinates"][0]-=15;
            if (!(typeof(shoot)==='undefined')){
                return;
            }
            gameParameters["shotCoordinates"][0]-=15;
            break;
        case 39:
            console.log("Droite");
            if (!(gameParameters["canonCoordinates"][0]<largeur_canvas-100)){
                return;
            }
            gameParameters["canonCoordinates"][0]+=15;
            if (!(typeof(shoot)==='undefined')){
                return;    
            }
            gameParameters["shotCoordinates"][0]+=15;
            break;
        case 32:
            console.log("Tir");
            shoot = new Shot(gameParameters['shotCoordinates'][0],gameParameters['shotCoordinates'][1]);
            var shootSound = document.getElementById('shootAudio');
            if (shootSound.paused) {
                shootSound.volume=0.05;
                shootSound.play();
                return;
            }
            var shootSound2 = document.getElementById("shootAudioBackup");
            shootSound2.volume=0.05;
            shootSound2.play();
            break;
    }
}

const getEnemyAttribute = (gameParameters) => {
    switch(gameParameters["gameData"]["enemyData"]["enemyId"]) {
        case 1:
            gameParameters["gameData"]["enemyData"]["enemyAttribute"] = "fast";
            gameParameters["gameData"]["enemyData"]["enemySpeed"]*=1.5;
            break;
        case 2:
            gameParameters["gameData"]["enemyData"]["enemyAttribute"] = "classic";
            break;
        case 3:
            gameParameters["gameData"]["enemyData"]["enemyAttribute"] = "shootback";
            gameParameters["gameData"]["enemyData"]["enemyShoots"] = true;
            gameParameters["gameData"]["enemyShotData"]["projectileId"] = 1;
            break;
        case 4:
            gameParameters["gameData"]["enemyData"]["enemyAttribute"] = "tank";
            gameParameters["gameData"]["enemyData"]["enemyLives"] = 3;
            break;
        case 5:
            gameParameters["gameData"]["enemyData"]["enemyAttribute"] = "dodge";
            break;
        case 6:
            gameParameters["gameData"]["enemyData"]["enemyAttribute"] = "boss_dodge_shootback";
            gameParameters["gameData"]["enemyData"]["enemyLives"] = 10;
            gameParameters["gameData"]["enemyData"]["enemyShoots"] = true;
            gameParameters["gameData"]["enemyShotData"]["projectileId"] = 2;
            gameParameters["gameData"]["enemyData"]["enemySpeed"]=0.1;
            break;
    }
}

const move_enemy = (gameParameters) => {
    gameParameters["enemyCoordinates"][1]+=gameParameters["gameData"]["enemyData"]["enemySpeed"]

    if (gameParameters["gameData"]["enemyData"]["enemyShoots"]) {
        gameParameters["enemyShotCoordinates"][1]+=10
    }

    if (!(gameParameters["gameData"]["enemyData"]["enemyAttribute"].includes("dodge"))) {
        return;
    }
    gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyTimeMoving"]-=1;
    switch (gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyDirection"]) {
        case 0:
            gameParameters["enemyCoordinates"][0]+=gameParameters["gameData"]["enemyData"]["enemySpeed"];
            break;
        case 1:
            gameParameters["enemyCoordinates"][0]-=gameParameters["gameData"]["enemyData"]["enemySpeed"];
            break;
    }
    if(!(gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyTimeMoving"]==0)) {
        return;
    }
    if (gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyDirection"]===0) {
        gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyDirection"]=1
        gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyTimeMoving"]=Math.round(Math.random()*gameParameters["enemyCoordinates"][0]+1);
        return;
    }
    if (gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyDirection"]===1) {
        gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyDirection"]=0
        gameParameters["gameData"]["enemyData"]["enemyMove"]["enemyTimeMoving"]=Math.round(Math.random()*(largeur_canvas-gameParameters["enemyCoordinates"][0])+1);
        return;
    }
 }

const check_shoot = (gameParameters) => {
    gameParameters["shotCoordinates"][1]-=10
    shoot = new Shot(gameParameters['shotCoordinates'][0],gameParameters['shotCoordinates'][1])
    if (gameParameters["shotCoordinates"][1]>-48) {
        return
    }
    destroy_shot = true
}

const check_enemy = (enemy,canon) => {
    enemy_top = enemy["enemyOrd"];
    enemy_bot = enemy_top+enemy["enemyHeight"]

    if (hauteur_canvas<enemy_bot && enemy["enemyType"]==="enemy") {
        console.log("Vie perdue !")

        destroy_enemy = true;
        destroy_canon = true;
        destroy_shot = true;
    
        return;
    }
    
    canon_top = canon["canonOrd"];
    canon_bot = canon_top+canon["canonHeight"];

    if (!((canon_top<enemy_top && enemy_top<=canon_bot) || (canon_top<enemy_bot && enemy_bot<=canon_bot))) {
        return;
    }

    enemy_left = enemy["enemyAbs"];
    enemy_right = enemy_left+enemy["enemyWidth"];

    canon_left = canon["canonAbs"];
    canon_right = canon_left+canon["canonWidth"];

    if (!((canon_left<enemy_left && enemy_left<=canon_right) || (canon_left<enemy_right && enemy_right<=canon_right))) {
        return;
    }

    console.log("Vie perdue !")

    destroy_enemy = true;
    destroy_canon = true;
    destroy_shot = true;

    return;
}

const check_hit = (enemy,shoot) => {
    if (typeof(shoot) === 'undefined') {
        return;
    } 
    const shoot_top = shoot.ord;

    const enemy_bot = enemy.ord+enemy.height;

    if (!(enemy_bot>=shoot_top)) {
        return;
    }
    const shoot_left = shoot.abs;
    const shoot_right = shoot.abs+shoot.width;

    const enemy_left = enemy.abs;
    const enemy_right = enemy.abs+enemy.width;

    if (!((enemy_left<shoot_left && enemy_right>=shoot_left) || (enemy_right>shoot_right && enemy_left<=shoot_right))) {
        return;
    }
    console.log("Touché");

    hit_enemy = true;
    destroy_shot = true;
}

const check_level = (gameParameters) => {
    isLevel = gameParameters["gameData"]["playerData"]["nbKills"]%10
    if (isLevel===0) {
        gameParameters["gameData"]["playerData"]["level"] = gameParameters["gameData"]["playerData"]["nbKills"]/10+1
        gameParameters["gameData"]["enemyData"]["enemySpeed"]+=0.1
    }
}

const new_shot = (gameParameters) => {
    gameParameters["shotCoordinates"][0] = gameParameters["canonCoordinates"][0]+11
    gameParameters["shotCoordinates"][1] = hauteur_canvas-165
    gameParameters['gameData']['nbShots']+=1;
}

const new_enemy = (gameParameters) => {
    console.log("Nouvel ennemi en cours de création...")
    if (gameParameters["gameData"]["enemyData"]["enemyShoots"]) {
        clearInterval(enemyShot);
    }

    if (gameParameters["gameData"]["enemyData"]["enemyId"]!==6){
        gameParameters["gameData"]["enemyData"] = {"enemyId":Math.round(Math.random()*4+1),"enemyExplosionId":Math.round(Math.random()*3+1),"enemySize":Math.round(Math.random()*2+1),"enemyDisplayScoreTime":50,"enemyLives":1,"enemySpeed":0.1*gameParameters["gameData"]["playerData"]["level"],"enemyAttribute":"","enemyMove":{"enemyTimeMoving":Math.round(Math.random()*50),"enemyDirection":Math.round(Math.random())}}
    }
    getEnemyAttribute(gameParameters)
    console.log(gameParameters["gameData"]["enemyData"]["enemyShoots"])

    gameParameters["displayCoordinates"] = [gameParameters["enemyCoordinates"][0],gameParameters["enemyCoordinates"][1]]

    gameParameters["enemyCoordinates"] = [Math.round(Math.random()*(largeur_canvas-100)),Math.round(Math.random()*100)]

    enemy = new Enemy(gameParameters["enemyCoordinates"][0],gameParameters["enemyCoordinates"][1],gameParameters["gameData"]["enemyData"]["enemyId"],gameParameters["gameData"]["enemyData"]["enemySize"])

    if (gameParameters["gameData"]["enemyData"]["enemyShoots"]){
        enemy_shoot(enemy.width,enemy.height,gameParameters)
        enemyShot = setInterval(enemy_shoot,3000,enemy.width,enemy.height,gameParameters);
    }

    if (gameParameters["gameData"]["playerData"]["nbKills"]!==gameParameters["gameData"]["playerData"]['limitKills']) {
        return;
    }
    endGame(gameParameters)
    return;
}

const new_canon = (gameParameters) => {
    gameParameters["canonCoordinates"][0] = largeur_canvas/2-50;
    gameParameters["gameData"]["playerData"]["lives"]-=1
    if (gameParameters["gameData"]["playerData"]["lives"]!==0) {
        return;
    }
    endGame(gameParameters)
    return;
}

const setExplosion = (gameParameters) => {
    gameParameters["explosionCoordinates"] = gameParameters["enemyCoordinates"];
    gameParameters["gameData"]["explosionData"]["explosionSize"] = gameParameters["gameData"]["enemyData"]["enemySize"];
    gameParameters["gameData"]["explosionData"]["explosionType"] = Math.round(Math.random()*3+1);
}

const enemy_shoot = (width,height,gameParameters) => {
    gameParameters["enemyShotCoordinates"] = [gameParameters["enemyCoordinates"][0]+enemy.width/2-2,gameParameters["enemyCoordinates"][1]+height]
    enemy_shot = new EnemyShot(gameParameters["enemyShotCoordinates"][0],gameParameters["enemyShotCoordinates"][1],gameParameters["gameData"]["enemyShotData"]["projectileId"])
}

const playHitSound = () => {
    var enemyHit = document.getElementById('deathAudio');
    if (enemyHit.paused) {
        enemyHit.volume=0.05;
        enemyHit.play();

        return;
    }
    enemyHit2 = document.getElementById('deathAudioBackup');
    enemyHit2.volume=0.05;
    enemyHit2.play();

    return;
}

const endGame = (gameParameters) => {
    time = timer();
    let jsonScore = {player:'', time: '', point: '' }
    jsonScore.player = player_name;
    jsonScore.time = timer();
    jsonScore.point = Math.round(gameParameters['gameData']["playerData"]['points']+gameParameters['gameData']["playerData"]['points']*Math.round(Math.abs((parseInt(time[0])*6000+parseInt(time[1])*100+parseInt(time[2]))-100000)/10000)/100);
    score.push(jsonScore);

    window.removeEventListener('keydown', pressedKey);

    canvas.style.display="none";
    titleCard.style.display="flex";

    titleEnd = document.getElementsByTagName('h1')[0]
    titleEnd.innerHTML = "FIN DE LA PARTIE"

    subtitleEnd = document.getElementsByTagName('h2')[0]
    subtitleEnd.innerHTML = "Score final : "+jsonScore.point
    
    subtitleEnd.innerHTML += `<br/>Temps : ${time[0]}:${time[1]}:${time[2]}`

    player.value = "";

    restartButton = document.getElementsByTagName('button')[0]
    restartButton.innerHTML = "Nouvelle partie"

    const buttonScore = document.getElementById('buttonScore');
    buttonScore.style.display = "";    
    clearInterval(boucleJeu);
    clearInterval(t);
    clearInterval(enemyShot)
}

const scoreDisplay = () => {
    score.sort(function (a, b) {
        return b.point - a.point;
    });
    if (score.length > 5) score.pop();
    const buttonScore = document.getElementById('buttonScore');
    const buttonStart = document.getElementById('buttonStart');
    buttonScore.style.display = "none";
    buttonStart.style.display = "none";
    const scoreDiv = document.getElementsByTagName('h2')[0];
    scoreDiv.innerHTML = 'PSEUDO : TEMPS - POINTS';
    for (i in score) {
        scoreDiv.innerHTML += `<br/>${score[i].player} : ${score[i].time.join(':')} - ${score[i].point}`;
    }
    buttonStart.style.display = "";
}

class Canon {
    constructor (abs_canon,ord_canon) {
        let base_image = new Image();
        base_image.src = 'assets/spaceship/ship.png';
        context.drawImage(base_image, abs_canon, ord_canon);

        this.abs = abs_canon;
        this.ord = ord_canon;

        this.height = base_image.naturalHeight;
        this.width = base_image.naturalWidth;
    }
}

class Shot {
    constructor (abs_shot,ord_shot) {
        let base_image = new Image();
        base_image.src = 'assets/spaceship/fire.png';
        context.drawImage(base_image, abs_shot, ord_shot);
        
        this.abs = abs_shot;
        this.ord = ord_shot;

        this.height = base_image.naturalHeight;
        this.width = base_image.naturalWidth;
    }
}

class Enemy {
    constructor (abs_enemy,ord_enemy,enemy_id,enemy_size) {
        let base_image = new Image();
        base_image.src = 'assets/enemies/sprites/enemy'+enemy_id+'size'+enemy_size+'.png';
        context.drawImage(base_image, abs_enemy, ord_enemy);
        
        this.abs = abs_enemy;
        this.ord = ord_enemy;
        this.id = enemy_id

        this.height = base_image.naturalHeight;
        this.width = base_image.naturalWidth;

        this.score = Math.abs(Math.round((this.width*this.height)/100)-250);
    }
}

class EnemyShot {
    constructor (abs_enemy_shot,ord_enemy_shot,shotId) {
        let base_image = new Image();
        base_image.src = 'assets/enemies/sprites/enemyAttack'+shotId+'.png'
        context.drawImage(base_image, abs_enemy_shot, ord_enemy_shot)

        this.abs = abs_enemy_shot;
        this.ord = ord_enemy_shot;

        this.height = base_image.naturalHeight;
        this.width = base_image.naturalWidth;
    }
}

class Explosion {
    constructor (abs_explosion,ord_explosion,explosion_size,explosion_id) {
        let base_image = new Image();
        base_image.src = 'assets/enemies/explosions/explode'+explosion_id+'size'+explosion_size+'.png';
        context.drawImage(base_image, abs_explosion, ord_explosion)
    }
}