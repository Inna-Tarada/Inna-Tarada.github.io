import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

//Добавление лоадинг менежера!
const loadingManager = new THREE.LoadingManager();

//Добавление эллементов экрана загрузки
const loadingScreen = document.createElement('div');
loadingScreen.id = 'loading-screen';
loadingScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000000d1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    color: white;
    font-family: 'Courier New', Courier, monospace;
`;

const loadingText = document.createElement('div');
loadingText.id = 'loading-text';
loadingText.textContent = 'Загрузка...';
loadingText.style.cssText = `
    font-size: 24px;
    margin-bottom: 20px;
`;

const progressBarContainer = document.createElement('div');
progressBarContainer.style.cssText = `
    width: 300px;
    height: 20px;
    background: #333;
    border-radius: 10px;
    overflow: hidden;
`;

const progressBar = document.createElement('div');
progressBar.id = 'progress-bar';
progressBar.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    transition: width 0.3s ease;
    border-radius: 10px;
`;

const progressText = document.createElement('div');
progressText.id = 'progress-text';
progressText.textContent = '0%';
progressText.style.cssText = `
    margin-top: 10px;
    font-size: 16px;
`;

progressBarContainer.appendChild(progressBar);
loadingScreen.appendChild(loadingText);
loadingScreen.appendChild(progressBarContainer);
loadingScreen.appendChild(progressText);
document.body.appendChild(loadingScreen);

loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

loadingManager.onLoad = function () {
    console.log('Зазгрузились :3');
    //Фейд аут
    loadingScreen.style.transition = 'opacity 0.5s ease';
    loadingScreen.style.opacity = '0';
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
    
    const progress = (itemsLoaded / itemsTotal) * 100;
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '%';
};

loadingManager.onError = function (url) {
    console.log('There was an error loading ' + url);
    loadingText.textContent = 'Проблема с загрузкой ресурсов, перезагрузите страницу, пожалуйста :3';
    loadingText.style.color = '#ff6b6b';
};

//Инициализация three сцены и тд :3
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    isMobile ? 130 : 75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: !isMobile,
    powerPreference: isMobile ? "low-power" : "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

//Оптимизация для мобилок
if (isMobile) {
    renderer.shadowMap.enabled = false;
}

//Обработка кнопок
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

class ButtonManager {
    constructor() {
        this.buttons = new Map(); 
    }
    
    onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    addButton(buttonMesh, callback) {
        this.buttons.set(buttonMesh, callback);
    }
    
    removeButton(buttonMesh) {
        this.buttons.delete(buttonMesh);
    }
    
    onClick(event) {
        this.onMouseMove(event);
        
        //Обновление матрицы объектов
        scene.traverse(object => {
            if (object.isMesh) {
                object.updateMatrixWorld(true);
            }
        });
        
        raycaster.setFromCamera(mouse, camera);
        
        //Сборка всех мешей, даже дочерних
        const allMeshes = [];
        this.buttons.forEach((callback, buttonObject) => {
            //Если объект имеет дочерние меши, добавляем их все
            buttonObject.traverse((child) => {
                if (child.isMesh) {
                    allMeshes.push(child);
                }
            });
        });
        
        const intersects = raycaster.intersectObjects(allMeshes);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            
            //Поиск родительского объекта
            let parentObject = clickedMesh;
            while (parentObject.parent && !this.buttons.has(parentObject)) {
                parentObject = parentObject.parent;
            }
            
            const callback = this.buttons.get(parentObject);
            if (callback) {
                callback();
            }
        }
    }
}

//Объявление баттон менеджера
const buttonManager = new ButtonManager();

//Свет
const sun = new THREE.PointLight(0xffffff);
sun.position.set(0.2, 10, -5);
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(sun, ambientLight);

//Skybox подгрузчик
function createSkyboxEquirectangular() {
    const loader = new THREE.TextureLoader(loadingManager);
    loader.load('../images/textures/colorful_space_skybox_lower_brightness.png', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });
}

// Загрузка текстур
const textureLoader = new THREE.TextureLoader(loadingManager);

//Загрузка текстурки
function loadTexture(path) {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                resolve(texture);
            },
            undefined,
            (error) => {
                console.error('Error loading texture:', error);
                reject(error);
            }
        );
    });
}

//Применение на фоторамку
function applyTextureToPhotoFrame(model, texture, targetName = 'Picture') {
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            if (child.name.includes(targetName)) {

                const newMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: 0.7,
                    metalness: 0.1,
                    transparent: false,
                });
                
                child.material = newMaterial;
                child.material.needsUpdate = true;
                console.log(`Текстура применена к объекту: ${child.name}`);
            } else {
                console.log(`Пропущен объект: ${child.name}`);
            }
        }
    });
}

//Увеличение Цветастости!
renderer.toneMapping = THREE.ACESFilmicToneMapping;
sun.intensity = 100.0;
ambientLight.intensity = 1.2;
renderer.toneMappingExposure = 0.7;

//икс, вай, Z позиции
camera.position.set(0, 7, 0);

//const or_controls = new OrbitControls(camera, renderer.domElement);

//Дебаг
const lightDebug = new THREE.PointLightHelper(sun);
scene.add(lightDebug);

//Маттериалы для звездочек, вне функции для оптимизации
const starGeometry = new THREE.SphereGeometry(0.25, 24, 24);
const starMatterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0,
    emissive: 0xffffff,
    emissiveIntensity: 12
});

//Звездочка 
function starMaker() {
    const star = new THREE.Mesh(starGeometry, starMatterial);

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

    star.position.set(x, y, z);
    scene.add(star);
}

//Звездочкииии
Array(isMobile ? 100 : 200).fill().forEach(starMaker);

//Функция, которая обновляет размер окна
function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

createSkyboxEquirectangular();

const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

//Загрузка модельки!
const GLTFloader = new GLTFLoader(loadingManager);
GLTFloader.setDRACOLoader(dracoLoader);

//Функция для загрузки моделей
function loadModel(path, name, position = null, rotation = null, scale = null) {
    return new Promise((resolve, reject) => {
        GLTFloader.load(
            path,
            function (gltf) {
                const model = gltf.scene;
                model.name = name;

                //Позиция
                if (position) {
                    model.position.set(position.x, position.y, position.z);
                }

                //Повороты
                if (rotation) {
                    model.rotation.set(rotation.x, rotation.y, rotation.z);
                }

                //Масштаб
                if (scale) {
                    model.scale.set(scale.x, scale.y, scale.z);
                }

                scene.add(model);

                //Возращение через промис
                resolve(model);
            },
            function (xhr) {
            },
            function (error) {
                console.error('Error loading GLB model:', error);
                reject(error);
            }
        );
    });
}

// Глобальные переменные для моделей
let Building, PhotoFrame1, PhotoFrameScreen1, PhotoFrame3;

//Новая загрузка моделек!!
async function loadMultipleModels() {
    try {

        const inna1 = await loadTexture('../images/textures/inna1.png');

        [Building, PhotoFrame1] = await Promise.all([
            loadModel('../3DM/DoricBuilding.glb', 'DoricBuilding'),
            loadModel('../3DM/PhotoFrameEmpty.glb', 'PhotoFrame1', { x: 0.2, y: 6.9, z: -0.25 }, { x: 0, y: -0.2, z: 0 }),
        ]);
        PhotoFrameScreen1 = PhotoFrame1.clone();
        PhotoFrameScreen1.scale.set( 7, 4, 1 );
        PhotoFrameScreen1.position.set( 0, 7, -1 );
        PhotoFrameScreen1.rotation.set( 0, 0, 0 );
        scene.add(PhotoFrameScreen1);

        setupButtons();

        applyTextureToPhotoFrame(PhotoFrame1, inna1);

    } catch (error) {
        console.error('Error loading models:', error);
    }
}

function setupButtons() {
    buttonManager.addButton(Building, () => {
        console.log('Building clicked!');
        cameraMover.moveTo(0, 7, 0, 0, 7, -2);
    });
    
    buttonManager.addButton(PhotoFrame1, () => {
        console.log('PhotoFrame 1 clicked!');
        cameraMover.moveTo(0, 7, 0, 0, 6, 0);
    });
    
}

loadMultipleModels();

class CameraMover {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.targetPosition = camera.position.clone();
        this.targetLookAt = new THREE.Vector3(0, 0, 0);
        this.speed = 0.05;
        this.isMoving = false;
    }

    moveTo(x, y, z, lookAtX = 0, lookAtY = 0, lookAtZ = 0) {
        this.targetPosition.set(x, y, z);
        this.targetLookAt.set(lookAtX, lookAtY, lookAtZ);
        this.isMoving = true;
    }

    update() {
        if (!this.isMoving) return;

        const positionDistance = this.camera.position.distanceTo(this.targetPosition);
        const lookAtDistance = this.camera.getWorldDirection(new THREE.Vector3())
            .distanceTo(this.targetLookAt.clone().sub(this.camera.position).normalize());

        //Изменение позиции
        this.camera.position.lerp(this.targetPosition, this.speed);
        
        //Мягкие движения
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        currentLookAt.add(this.camera.position);
        
        const smoothedLookAt = currentLookAt.lerp(this.targetLookAt, this.speed);
        this.camera.lookAt(smoothedLookAt);

        //Остановка, если достаточно близко
        if (positionDistance < 0.1 && lookAtDistance < 0.01) {
            this.isMoving = false;
        }
    }
}

const cameraMover = new CameraMover(camera, scene);

//Анимэйшн Функция
function animate() {

    cameraMover.update();
    renderer.render(scene, camera);
}   

//Если ресайз, то ресайз();
window.addEventListener('resize', onWindowResize, false);

//Слухачи
window.addEventListener('click', (event) => buttonManager.onClick(event), false);

//Онимэйшн луп
renderer.setAnimationLoop(animate);