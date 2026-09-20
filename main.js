let slide = 0;
let simStarted = false;

const nxt = document.getElementById("next");
const prev = document.getElementById("prev");

const card1 = document.getElementById("infoCard1");
const card2 = document.getElementById("infoCard2");
const card3 = document.getElementById("infoCard3");

const card4 = document.getElementById("infoCard4");
const card5 = document.getElementById("infoCard5");
const card6 = document.getElementById("infoCard6");

const card7 = document.getElementById("infoCard7");
const card8 = document.getElementById("infoCard8");

const card9 = document.getElementById("infoCard9");


const slides = [card1, card2, card3, card4, card5, card6, card7, card8, card9];

function showSlide() {
    slides.forEach(card => card.classList.add("hidden"));
    slides[slide].classList.remove("hidden");
}

nxt.addEventListener("click", () => {
    slide++;
    if (slide >= slides.length) slide = slides.length - 1;
    showSlide();
});

prev.addEventListener("click", () => {
    slide--;
    if (slide < 0) slide = 0;
    showSlide();
});

showSlide();

// animation section

function getInputs() {
    const iC = parseFloat(document.getElementById("iInput").value) || 0;
    const jC = parseFloat(document.getElementById("jInput").value) || 0;
    const kC = parseFloat(document.getElementById("kInput").value) || 0;

    console.log(iC);
    return { iC, jC, kC };
}




const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 4, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("sim"),
    antialias: true
});

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 1.0;
controls.panSpeed = 0.8;

// lighting
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 10, 7);
light.castShadow = true;
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

renderer.setPixelRatio(window.devicePixelRatio);
const canvas = document.getElementById("sim");
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.antialias = true;

// axes 

function makeAxis(dir, color) {
    const origin = new THREE.Vector3(0, 0, 0);

    const posArrow = new THREE.ArrowHelper(dir, origin, 2, color);
    posArrow.isAxis = true;

    const negArrow = new THREE.ArrowHelper(dir.clone().multiplyScalar(-1), origin, 2, color);
    negArrow.isAxis = true;

    scene.add(posArrow, negArrow);
}

function labels(text, position, color = "#ffffff") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 512;
    canvas.height = 256;

    ctx.font = "80px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);

    sprite.scale.set(0.3, 0.14, 1);
    sprite.position.copy(position);
    sprite.isAxis = true;

    sprite.name = "label" + text;
    sprite.material.sizeAttenuation = false;

    scene.add(sprite);
}

function updateAxisLabels(axisLength) {
    // X labels
    scene.getObjectByName("label+X").position.set(axisLength, 0, 0);
    scene.getObjectByName("label-X").position.set(-axisLength, 0, 0);

    // Y labels
    scene.getObjectByName("label+Y").position.set(0, axisLength, 0);
    scene.getObjectByName("label-Y").position.set(0, -axisLength, 0);

    // Z labels
    scene.getObjectByName("label+Z").position.set(0, 0, axisLength);
    scene.getObjectByName("label-Z").position.set(0, 0, -axisLength);
}

// create axes

// X axis
makeAxis(new THREE.Vector3(1, 0, 0), 0xffffff);
labels("+X", new THREE.Vector3(2.5, 0, 0));
labels("-X", new THREE.Vector3(-2.5, 0, 0));

// Y axis
makeAxis(new THREE.Vector3(0, 1, 0), 0xffffff);
labels("+Y", new THREE.Vector3(0, 2.5, 0));
labels("-Y", new THREE.Vector3(0, -2.5, 0));

// Z axis
makeAxis(new THREE.Vector3(0, 0, 1), 0xffffff);
labels("+Z", new THREE.Vector3(0, 0, 2.5));
labels("-Z", new THREE.Vector3(0, 0, -2.5));

function updMag() {
    const { iC, jC, kC } = getInputs();
    const mag = Math.sqrt(iC * iC + jC * jC + kC * kC);
    document.getElementById("vecMag").textContent = mag.toFixed(4);
}

// clear scene function

function clearScene() {
    const toRemove = [];

    scene.traverse(obj => {
        if (!obj.isAxis && (obj.type === "ArrowHelper" || obj.type === "Mesh")) {
            toRemove.push(obj);
        }
    });

    toRemove.forEach(obj => scene.remove(obj));
}

// vector animation

document.getElementById("runSimBtn").addEventListener("click", () => {
    updMag();
    clearScene();
    simStarted = true;
    startVectorAnimation();
});

function startVectorAnimation() {
    const { iC, jC, kC } = getInputs();

    // detect zero vector
    if (iC === 0 && jC === 0 && kC === 0) {
        return; // stop the rest of the simulation
    }

    // i component
    const iDir = new THREE.Vector3(iC >= 0 ? 1 : -1, 0, 0);
    const iO = new THREE.Vector3(0, 0, 0);

    // j component
    const jDir = new THREE.Vector3(0, jC >= 0 ? 1 : -1, 0);
    const jO = new THREE.Vector3(iC, 0, 0);   // use raw iC

    // k component
    const kDir = new THREE.Vector3(0, 0, kC >= 0 ? 1 : -1);
    const kO = new THREE.Vector3(iC, jC, 0);  // use raw jC

    const iArrow = new THREE.ArrowHelper(iDir, iO, 0, 0x00ff00);
    const jArrow = new THREE.ArrowHelper(jDir, jO, 0, 0x0000ff);
    const kArrow = new THREE.ArrowHelper(kDir, kO, 0, 0xff00ff);

    scene.add(iArrow, jArrow, kArrow);

    const fDir = new THREE.Vector3(iC, jC, kC).normalize();
    const fLength = Math.sqrt(iC * iC + jC * jC + kC * kC);

    // make axes longer than the final vector

    const axisLength = Math.max(fLength * 1.5,2);

    scene.traverse(obj => {
        if (obj.isAxis && obj.type === "ArrowHelper") {
            obj.setLength(axisLength);
        }
    });

    updateAxisLabels(axisLength);

    const fArrow = new THREE.ArrowHelper(fDir, iO, 0, 0xff0000);

    const distance = Math.max(fLength * 1.8, 3);
    camera.position.set(0, 4, distance);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    controls.update();

    scene.add(fArrow);

    animateComponents(iArrow, jArrow, kArrow, fArrow, iC, jC, kC, fLength);
}

function animateComponents(iArrow, jArrow, kArrow, fArrow, iC, jC, kC, fLength) {
    let iLen = 0, jLen = 0, kLen = 0;

    // tiny vector detection
    const tiny = fLength < 0.5;

    // interpolation for tiny vectors
    let t = 0;

    // track final arrow length manually
    let fLen = 0;

    function step() {

        // i component
        if (iLen < Math.abs(iC)) {
            iLen += 0.05;
            iArrow.setLength(iLen);

        // j component
        } else if (jLen < Math.abs(jC)) {
            jLen += 0.05;
            jArrow.setLength(jLen);

        // k component
        } else if (kLen < Math.abs(kC)) {
            kLen += 0.05;
            kArrow.setLength(kLen);

        // final vector
        } else {

            // normal mode
            if (!tiny) {

                if (fLen < fLength) {
                    fLen += 0.05;
                    fArrow.setLength(fLen);
                }

            // precise mode
            } else {
                if (t < 1) {
                    t += 0.03;

                    const tip = new THREE.Vector3(iC, jC, kC).multiplyScalar(t);
                    const dir = tip.clone().normalize();
                    const len = tip.length();

                    fArrow.setDirection(dir);
                    fArrow.setLength(len);
                }
            }
        }

        requestAnimationFrame(step);
    }

    step();
}


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();


function checkAnswers(){
    const answers = {
  answer1: 10,
  answer2x: 36,
  answer2y: 15,
  answer3x: 1,
  answer3y: 6,
  answer3z: 2,
  answer4x: 4,
  answer4y: 6,
  answer5: 13,
  answer6x: 0.95,
  answer6y: -0.32,
  answer7x: 8.73,
  answer7y: -4.37,
  answer7z: 17.46,
  answer8x: 12.99,
  answer8y: 7.50,
  answer9: -11,
  answer10: -8,
  answer11: 30,
  answer12: 45,
  answer13: -17,
  answer14: 8.77,
  answer15a: 12,
  answer15b: 6.16,
  answer15c: 4.58
};

  for (const id in answers){
    const userVal = parseFloat(document.getElementById(id).value);
    const correctVal = answers[id]

    if (userVal === correctVal){
        document.getElementById(id).style.background = "#c8ffcf"; 
    } else {
        document.getElementById(id).style.background = "#ffbdbd";
    }
  }
}