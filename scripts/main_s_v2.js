import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
//import { FunctionDeclaration } from 'three/examples/jsm/transpiler/AST.js';
//import { createElement } from 'react';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ========================= Динамическое разрешение =========================
class DynamicResolution {
    constructor(renderer, targetFPS = 60) {
        this.renderer = renderer;
        this.targetFPS = targetFPS;
        this.currentScale = 1;
        this.frames = [];
        this.lastTime = performance.now();
        this.updateInterval = 300;
        this.lastUpdateTime = 0;
    }
    
    update() {
        const currentTime = performance.now();
        const delta = currentTime - this.lastTime;
        
        if (delta > 0) {
            const fps = 1000 / delta;
            this.frames.push(fps);
            if (this.frames.length > 30) this.frames.shift();
        }
        
        this.lastTime = currentTime;
        
        if (currentTime - this.lastUpdateTime > this.updateInterval && this.frames.length > 10) {
            this.adjustQuality();
            this.lastUpdateTime = currentTime;
        }
    }
    
    adjustQuality() {
        const avgFPS = this.frames.reduce((a, b) => a + b) / this.frames.length;
        let newScale = this.currentScale;
        
        if (avgFPS < this.targetFPS - 10) {
            newScale = Math.max(0.5, this.currentScale - 0.1);
        } else if (avgFPS > this.targetFPS + 15 && this.currentScale < 1) {
            newScale = Math.min(1, this.currentScale + 0.05);
        }
        
        if (newScale !== this.currentScale) {
            this.currentScale = newScale;
            this.applyResolutionScale();
        }
    }
    
    applyResolutionScale() {
        const pixelRatio = Math.min(window.devicePixelRatio * this.currentScale, isMobile ? 1.5 : 2);
        this.renderer.setPixelRatio(pixelRatio);
        console.log(`Dynamic resolution: scale ${this.currentScale.toFixed(2)}, pixelRatio ${pixelRatio.toFixed(2)}`);
    }
    
    forceResolutionUpdate() {
        this.applyResolutionScale();
    }
}

// ========================= Менеджер ресайза =========================
class ResizeManager {
    constructor(camera, renderer, dynamicResolution) {
        this.camera = camera;
        this.renderer = renderer;
        this.dynamicResolution = dynamicResolution;
        this.resizeTimeout = null;
        this.resizeDelay = 100; //ms
    }
    
    onWindowResize = () => {
        //Дебаунс чтобы избежать частых обновлений
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.handleResize();
        }, this.resizeDelay);
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        console.log(`Resizing to: ${width}x${height}`);
        
        try {
            //Камера
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            //Рендерер
            this.renderer.setSize(width, height, false);
            
            //Динамическое разрешение
            this.dynamicResolution.applyResolutionScale();
            this.camera.updateMatrixWorld();
            
            console.log(`Resize complete. Pixel ratio: ${this.renderer.getPixelRatio().toFixed(2)}`);
            
        } catch (error) {
            console.error('Resize error:', error);
        }
    }
    
    //Принудительный ресайз
    forceResize() {
        this.handleResize();
    }
    
    destroy() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        window.removeEventListener('resize', this.onWindowResize);
    }
}

// ========================= Менеджер кнопочек =========================
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

// ========================= Камера контроллер =========================
class CameraController {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.speed = 0.05;
        this.isMoving = false;
        
        this.cameraAngles = new Map();
        this.setupCameraAngles();
    }

    setupCameraAngles() {
        //Предустановленные позиции камеры
        this.cameraAngles.set('default', {
            position: new THREE.Vector3(0, 7, 0),
            lookAt: new THREE.Vector3(0, 7, -2)
        });

        this.cameraAngles.set('building', {
            position: new THREE.Vector3(0, 7, 5),
            lookAt: new THREE.Vector3(0, 6, 0)
        });

        this.cameraAngles.set('photoCloseup', {
            position: new THREE.Vector3(0, 6.5, 1),
            lookAt: new THREE.Vector3(0, 6.5, 0)
        });

        this.cameraAngles.set('screenView', {
            position: new THREE.Vector3(0, 7.3, 20),
            lookAt: new THREE.Vector3(0, 7, -1)
        });
    }

    moveToAngle(angleName, duration = 1000) {
        const angle = this.cameraAngles.get(angleName);
        if (angle) {
            this.moveTo(
                angle.position.x, angle.position.y, angle.position.z,
                angle.lookAt.x, angle.lookAt.y, angle.lookAt.z,
                duration
            );
            return angle;
        }
        return null;
    }

    moveTo(x, y, z, lookAtX = 0, lookAtY = 0, lookAtZ = 0, duration = 1000) {
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
        if (positionDistance < 0.005 && lookAtDistance < 0.01) {
            this.isMoving = false;
        }
    }

    // Быстрые переходы
    toDefaultView() { return this.moveToAngle('default'); }
    toBuildingView() { return this.moveToAngle('building'); }
    toPhotoCloseup() { return this.moveToAngle('photoCloseup'); }
    toScreenView() { return this.moveToAngle('screenView'); }
}

// ========================= Глобальные переменные =========================

//Глобальные переменные
let Building, PhotoFrame1, PhotoFrameScreen1, PFAboutMe;
let cameraController, buttonManager, resizeManager;
let HitBoxSkills, HitBoxAboutMe;
let dynamicResolution, materialOptimizer;

// ========================= ХитБоксы =========================

const HitBoxMaterial = new THREE.MeshBasicMaterial( {transparent: true, opacity: 0, color: "#FF00FF" } );
const HitBoxDefaultG = new THREE.BoxGeometry( 2, 0.5, 0.1 );
HitBoxSkills = new THREE.Mesh(HitBoxDefaultG, HitBoxMaterial);
HitBoxAboutMe = new THREE.Mesh(HitBoxDefaultG, HitBoxMaterial);

// ========================= Инициализация =========================

function initSystems(camera, renderer) {
    cameraController = new CameraController(camera, renderer);
    buttonManager = new ButtonManager();
    dynamicResolution = new DynamicResolution(renderer, isMobile ? 50 : 60);
    resizeManager = new ResizeManager(camera, renderer, dynamicResolution);

    console.log('Optimization systems loaded. Mobile:', isMobile);
    
    return { cameraController, buttonManager, dynamicResolution, resizeManager };
}

// ========================= Лоадинг менажер =========================

const loadingManager = new THREE.LoadingManager();

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

//Инициализация сцены+камеры
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    isMobile ? 120 : 75,    
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

scene.add(HitBoxAboutMe, HitBoxSkills);
camera.position.set( 0, 7, 0 );
HitBoxAboutMe.position.set( 0, 7.5, 19.05);
HitBoxSkills.position.set( 0, 7, 19.05)

//Оптимизейшен
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: !isMobile,
    powerPreference: isMobile ? "low-power" : "high-performance"
});

dynamicResolution = new DynamicResolution(renderer, isMobile ? 50 : 60);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// Raycaster для старой системы кнопок
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

initSystems(camera, renderer);

//Свет
const sun = new THREE.PointLight(0xffffff);
sun.position.set(0.2, 10, -5);
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(sun, ambientLight);

//Скабоксек
function createSkyboxEquirectangular() {
    const loader = new THREE.TextureLoader(loadingManager);
    loader.load('../images/textures/colorful_space_skybox_lower_brightness.png', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });
}

//Загрузка текстурок
const textureLoader = new THREE.TextureLoader(loadingManager);

function loadTexture(path) {
    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;

                if (isMobile) {
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                }
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

//Текстуры аплаятся уря :3 
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
            }
        }
    });
}

//Настройки рендерера (чуть-чуть)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
sun.intensity = 100.0;
ambientLight.intensity = 1.2;
renderer.toneMappingExposure = 0.7;

//Звездашки :3
const starGeometry = new THREE.SphereGeometry(0.1, 24, 24);
const starMatterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0,
    emissive: 0xffffff,
    emissiveIntensity: 12
});

//Звездашки макер :33
function starMaker() {
    const star = new THREE.Mesh(starGeometry, starMatterial);
    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
    star.position.set(x, y, z);
    scene.add(star);
}

Array(isMobile ? 100 : 200).fill().forEach(starMaker);

// ========================= Лоадинг моделей =========================

const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const GLTFloader = new GLTFLoader(loadingManager);
GLTFloader.setDRACOLoader(dracoLoader);

function loadModel(path, name, position = null, rotation = null, scale = null) {
    return new Promise((resolve, reject) => {
        GLTFloader.load(
            path,
            function (gltf) {
                const model = gltf.scene;
                model.name = name;

                if (position) model.position.set(position.x, position.y, position.z);
                if (rotation) model.rotation.set(rotation.x, rotation.y, rotation.z);
                if (scale) model.scale.set(scale.x, scale.y, scale.z);

                scene.add(model);
                resolve(model);
            },
            undefined,
            (error) => {
                console.error('Error loading GLB model:', error);
                reject(error);
            }
        );
    });
}

async function loadMultipleModels() {
    try {
        const inna1 = await loadTexture('../images/textures/inna1.png');
        const placeholder = await loadTexture('../images/textures/ScreenMenu.png');
        /*
        inna1.wrapS = THREE.RepeatWrapping;
        inna1.wrapT = THREE.RepeatWrapping;
        inna1.repeat.set( 3, 3 );
        placeholder.repeat.set( 3,3 );
        */

        [Building, PhotoFrame1] = await Promise.all([
            loadModel('../3DM/DoricBuilding.glb', 'DoricBuilding'),
            loadModel('../3DM/PhotoFrameEmpty.glb', 'PhotoFrame1', { x: 0.005, y: 6.9, z: -0.25 }, { x: 0, y: 0, z: 0 }),
        ]);

        PhotoFrameScreen1 = PhotoFrame1.clone();
        PhotoFrameScreen1.scale.set(7, 4, 1);
        PhotoFrameScreen1.position.set(0, 7, 19);
        PhotoFrameScreen1.rotation.set(0, 0, 0);
        PFAboutMe = PhotoFrameScreen1.clone();
        PFAboutMe.position.set(-30, 6.5, -29);
        PFAboutMe.rotation.set(0, 3.14, 0);
        scene.add(PhotoFrameScreen1, PFAboutMe);

        //Текстуры аплаятсяяяя
        applyTextureToPhotoFrame(PhotoFrame1, inna1);
        applyTextureToPhotoFrame(PhotoFrameScreen1, placeholder);

        setupButtons();

    } catch (error) {
        console.error('Error loading models:', error);
    }
}

// ========================= Объявление кнопочек =========================

function setupButtons() {

    buttonManager.addButton(Building, () => {
        console.log('Building selected!');
        cameraController.toDefaultView();
        aboutMeHTMLRem();
    });

    buttonManager.addButton(PhotoFrame1, () => {
        console.log('Photo frame is clicked!');
        cameraController.toScreenView();
    });

    buttonManager.addButton(PhotoFrameScreen1, () => {
        console.log('Screen is clicked!');
        cameraController.toDefaultView();
    });

    buttonManager.addButton(HitBoxAboutMe, () => {
        cameraController.moveTo( 30, 30, 30, 0, 0, 0, 3800);
        aboutMeHTML();
        console.log('AboutMe is clicked!');
    });

    buttonManager.addButton(HitBoxSkills, () => {
        cameraController.moveTo( -30, 7, -30, -30, 7, -29, 3800);
        console.log('SkillBox is clicked!');
    });

    console.log('Buttons live');
}

function aboutMeHTMLRem() {
    setTimeout(() => {
        const contentBox = document.getElementById('contentBox');
        contentBox.style.display = 'none';
        contentBox.remove();
    }, 100);
    

}
async function aboutMeHTML() {
    try {
        const response = await fetch('../text_files/Something');
        if (!response.ok) {
            throw new Error('File not found');
        }
        const data = await response.text();
        const cleanData = data.split('//# sourceMappingURL=')[0];

        const contentBox = document.createElement('main');
        contentBox.setAttribute('id', 'contentBox');
        const header = document.createElement('header');
        const headerText = document.createElement('p');
        const contentSection = document.createElement('section');
        const contentSectionTextSomething = document.createElement('h1');

        headerText.className = 'header_text';
        contentSectionTextSomething.className = 'ContentSectionText';
        
        headerText.textContent = "Обо мне!";
        contentSectionTextSomething.textContent = cleanData;
        console.log(data);

        contentBox.appendChild(header);
        contentBox.appendChild(contentSection);
        contentSection.appendChild(contentSectionTextSomething);
        header.appendChild(headerText);
        document.body.appendChild(contentBox);
        
    } catch (err) {
        console.error('Error reading file:', err);
    }
}

//Онимейшн
let lastTime = performance.now();

function animate() {
    const currentTime = performance.now();
    const delta = currentTime - lastTime;

    dynamicResolution.update();
    
    cameraController.update();
    renderer.render(scene, camera);
    
    lastTime = currentTime;
}

//Инициализайшен
createSkyboxEquirectangular();
loadMultipleModels();

//Слухачи - теперь используем ResizeManager вместо прямой функции
window.addEventListener('resize', resizeManager.onWindowResize, false);
window.addEventListener('click', (event) => buttonManager.onClick(event), false);

resizeManager.forceResize();

//Онимейшн луууп
renderer.setAnimationLoop(animate);
window.optimizationSystems = {
    dynamicResolution,
    resizeManager
};