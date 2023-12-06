import * as THREE from 'three'
import { MapControls } from 'three/addons/controls/MapControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

async function GetData() {
    return (await fetch("./public/data.json")).json();
}

let previousHighlight = new THREE.Mesh();

/*
Uluru - AUS
Great barrier reef - AUS
Sydney opera house - AUS
Glow Worm Caves - NZ
Hobbiton - NZ
Mount Cook - NZ
Milford sound - NZ
The entirety of the country of Fiji - FJ
Mount field national park - AUS (Tasmania)
Hawaii - US
*/

async function Work() {

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const geometry = new THREE.PlaneGeometry(2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);
    const controls = new MapControls(camera, renderer.domElement);
    const loader = new GLTFLoader();

    const lightA = new THREE.AmbientLight(0xFFFFFF); // soft white light
    scene.add(lightA);

    const lightP = new THREE.PointLight(0xddff00, 1);
    lightP.position.set(-1, 3, 500);
    scene.add(lightP);

    const txloader = new THREE.CubeTextureLoader();
    const texture = txloader.load([
        'public/skybox/3.png',
        'public/skybox/1.png',
        'public/skybox/2.png',
        'public/skybox/4.png',
        'public/skybox/5.png',
        'public/skybox/6.png',
    ]);
    scene.background = texture;

    const data = await GetData();
    const pinrefs = {};
    const hasValue = (obj, value) => Object.values(obj).includes(value);
    function getKeyByValue(object, value) {
        const keys = Object.keys(object);
        for (let i = 0; i < Object.keys(object).length; i++)
        {
            if (object[keys[i]].children[0] == value) return keys[i];
        }
    }

    loader.load('public/scene.gltf', function (gltf) {

        scene.add(gltf.scene);

    }, undefined, function (error) {

        console.error(error);

    });

    let pinmodel = new THREE.Mesh();

    await loader.load('public/pin.gltf', function (gltf) {

        pinmodel = gltf.scene;
        pinmodel.scale.set(.02, .02, .02);
        pinmodel.translateY(.17);
        pinmodel.translateX(4);
        pinmodel.translateZ(1.6);
        for (const x in data) {
            pinrefs[x] = pinmodel.clone();
            pinrefs[x].children[0].material = pinrefs[x].children[0].material.clone();
            pinrefs[x].translateX(data[x].posX);
            pinrefs[x].translateZ(data[x].posZ);
            scene.add(pinrefs[x]);
        }

    }, undefined, function (error) {

        console.error(error);

    });

    const originalRotation = cube.position;

    controls.enableDamping = true;
    controls.screenSpacePanning = false;

    controls.minDistance = 1;
    controls.maxDistance = 1;

    controls.maxPolarAngle = Math.PI / 2.4;

    function onPointerMove(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        let intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length == 0) return;
        if (hasValue(pinrefs, intersects[0].object.parent)) {
            intersects[0].object.material.color.set(0xffffff);
            previousHighlight = intersects[0].object;
        }
        else
        {
            previousHighlight.material.color.set(0xff0000);
            previousHighlight = new THREE.Mesh();
        }

        if (previousHighlight !== intersects[0].object) {
            previousHighlight.material.color.set(0xff0000);
        }

    }

    function click(e)
    {
        if (previousHighlight.name == "Cylinder")
        {
            document.getElementById("title").innerText = getKeyByValue(pinrefs, previousHighlight);
            document.getElementById("regionexpl").innerText = data[getKeyByValue(pinrefs, previousHighlight)].description;
            document.getElementById("regionimg").src = data[getKeyByValue(pinrefs, previousHighlight)].image;

            document.getElementById("backdrop").style.zIndex = 399;
            document.getElementById("backdrop").style.backgroundColor = "rgba(10, 10, 18, 0.4)";
            document.getElementById("infobox").style.top = "50%";
        }
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('click', click);

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);	// required if controls.enableDamping or controls.autoRotate are set to true
        controls.update();
        for (const x in data) {
            pinrefs[x].lookAt(camera.position);
        }
    }


    animate();
}

function exitprompt()
{
    document.getElementById("backdrop").style.backgroundColor = "rgba(10, 10, 18, 0)";
    setTimeout(() => {document.getElementById("backdrop").style.zIndex = -1}, 1000);
    document.getElementById("infobox").style.top = "150%";
}

document.getElementById("backdrop").addEventListener("click", exitprompt, false);

Work();