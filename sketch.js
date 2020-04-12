let cameraAuthorized = true;
navigator.mediaDevices.getUserMedia({ audio: false, video: true })
.catch(function(err) {
  // alert("Le site à besoin de l'accès à la webcam pour prendre une photo, vous pouvez quand même charger une image");
  cameraAuthorized = false;
});
let bodypix;
let video;
let segmentation;
let img;
let theShader;
let myFont;

let wWidth = document.getElementsByTagName("body")[0].clientWidth;
let wHeight = document.getElementsByTagName("body")[0].clientHeight;

let imgWidth;
let imgHeight;
if(wWidth < 640 || wHeight < 480){
  imgWidth = 240;
  imgHeight = 180;
} else {
  imgWidth = 640
  imgHeight = 480;
}


let timer;
let timerOn;

let destroyProg;

let imgUpload;

let selectedMode;


var chrome   = navigator.userAgent.indexOf('Chrome') > -1;
var explorer = navigator.userAgent.indexOf('MSIE') > -1;
var firefox  = navigator.userAgent.indexOf('Firefox') > -1;
var safari   = navigator.userAgent.indexOf("Safari") > -1;
var camino   = navigator.userAgent.indexOf("Camino") > -1;
var opera    = navigator.userAgent.toLowerCase().indexOf("op") > -1;
if ((chrome) && (safari)) safari = false;
if ((chrome) && (opera)) chrome = false;

const options = {
  outputStride: 8, // 8, 16, or 32, default is 16
  segmentationThreshold: 0.3 // 0 - 1, defaults to 0.5 
}

function preload() {
  bodypix = ml5.bodyPix(options);
  theShader = loadShader('webcam.vert', 'webcam.frag');
  myFont = loadFont('assets/PTMono-Regular.ttf');

  //Load camera and video
  video = createCapture(VIDEO);
  video.size(imgWidth, imgHeight);
  video.hide(); // Hide the video element, and just show the canvas

  shaderTexture = createGraphics(imgWidth, imgHeight, WEBGL);
  shaderTexture.noStroke();
}

function setup() {
  createCanvas(wWidth, wHeight, WEBGL);
  noStroke();
  textFont(myFont);
  textSize(18);
  fill(255);

  resetSketch();

}

function gotResults(err, result) {
  if (err) {
    console.log(err)
    return;
  }

  segmentation = result;

  switch (selectedMode) {
    case "cam":
      bodypix.segment(video, gotResults);
      break;
    case "photo":
      bodypix.segment(img, gotResults);
      break;
  
    default:
      return;
      break;
  }
  

}

function drawcontour() {
  
  shaderTexture.shader(theShader);
  theShader.setUniform('tex0', segmentation.backgroundMask);
  theShader.setUniform('iResolution', [imgWidth, 480]);
  theShader.setUniform('iTime', frameCount * 0.01);
  theShader.setUniform('destroyProg', destroyProg);

  shaderTexture.rect((width-imgWidth) / 2, 160, imgWidth, imgHeight);


  if(safari) {
    push();
    scale(1, -1);
    translate(0, -height);
    
    image(shaderTexture, (width-imgWidth) / 2, height - imgHeight -160);
    pop();
 } else {
  image(shaderTexture, (width-imgWidth) / 2, 160);
 }
  

}

function draw() {
  // console.log(frameRate());
  background(0);
  translate(-width / 2, -height / 2, 0);
  switch (selectedMode) {
    case "cam":
      if (timerOn && millis() - timer > 5000) {
        video.stop();
       }
       image(video, (width-imgWidth) / 2, 160, imgWidth, imgHeight);
     
     
       if (segmentation != null) {
         textAlign(CENTER);
         if (!timerOn) {
           timer = millis();
           timerOn = true;
         }
         if (millis() - timer < 5000) {
           let s = "Installez-vous, la photo sera prise dans " + ceil(5 - (millis() - timer) / 1000);
           text(s, (wWidth - 320)/2, 160+imgHeight+40, 320);
         } else {
           if(destroyProg<1){
             destroyProg += 0.004;
           }
           let s = "Correction "+ int(destroyProg*100) + "%";
           
           text(s, (wWidth - 320)/2, 160+imgHeight+40, 320);
           drawcontour();
         }
       }

      break;
    
    case "photo":
      
      video.stop();
      image(imgUpload, (width-imgWidth) / 2, 160, imgWidth, imgHeight);
      if (segmentation != null) {
        textAlign(CENTER);
        if (!timerOn) {
          timer = millis();
          timerOn = true;
        }
        if(destroyProg<1){
          destroyProg += 0.004;
        }
        let s = "Correction "+ int(destroyProg*100) + "%";
        
        text(s, (wWidth - 320)/2, 160+imgHeight+40, 320);
        drawcontour();
      }
      break;
    default:
      break;
  }
  

  if(destroyProg >= 1){
    noLoop();
    button1 = createButton('Relancer');
    button1.class("btnReset");
    button1.position((wWidth - 310)/2, 40);
    button1.mousePressed(function(){
      resetSketch();
      button1.remove();
    });
  }
}

function resetSketch(){
  video.play();
  segmentation = null;
  selectedMode = null;
  background(0);
  timer = millis();
  timerOn = false;
  destroyProg = 0;

  // Start Program
  noLoop();
  textAlign(LEFT);
  let s1 = "Bonjour, je corrige automatiquement vos photos en effaçant les anomalies de l'image. \n\nComment voulez-vous procéder ?"
  typeWriter(s1, 0, (wWidth - min(400, wWidth-40))/2, 120, min(400, wWidth-40), 50, function(){
    showButtons();
    
    // loop();
  });
}

function typeWriter(sentence, n, x, y, width, speed, callBack) {

  if (n < (sentence.length)) {
    background(0);
    if(n % 8 <4){
      text(concat(sentence.substring(0, n+1), "_"), x, y, width);
    } else {
      text(sentence.substring(0, n+1), x, y, width);
    }
    n++;
    setTimeout(function() {
      typeWriter(sentence, n, x, y, width, speed, callBack)
    }, speed);
  } else {
    callBack();
  }
}

function showButtons(){
  if(cameraAuthorized){
    button1 = createButton('Prendre une photo');
    button1.class("btnPhoto");
    button1.position((wWidth - 310)/2, 272);
    button1.mousePressed(takePhoto);
  }
  

  button2 = createFileInput(uploadPhoto);
  button2.class("btnUpload");
  button2.position((wWidth - 310)/2, 392);
}

function takePhoto(){
  bodypix.segment(video, gotResults);
  if(cameraAuthorized){
    button1.remove();
  }
  button2.remove();
  selectedMode = "cam";
  loop();
}

function uploadPhoto(file){
  
  if (file.type === 'image') {
    img = createImg(file.data, '');
    imgUpload = loadImage(file.data);
    img.hide();
    img.size(imgWidth, imgHeight);
    bodypix.segment(img, gotResults);
    if(cameraAuthorized){
    button1.remove();
  }
    button2.remove();
    setTimeout(
      function(){
        selectedMode = "photo";
        loop();
      }, 1000
    );
    
  } else {
    imgUpload = null;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // if(windowWidth<imgWidth || windowHeight<imgHeight){
  //   alert("Cette expérience nécessite un écran")
  // }
}