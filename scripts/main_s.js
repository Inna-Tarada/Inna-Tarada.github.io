import * as THREE from 'three';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

/* Тестовый кубик :3
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );
*/

//Свет
const sun = new THREE.PointLight(0xffffff);
sun.position.set(3, 3, 3);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add( sun, ambientLight );

//Skybox подгрузчик
function createSkyboxEquirectangular() {
    const loader = new THREE.TextureLoader();
    loader.load('../images/textures/colorful_space_skybox.png', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });
}

//Увеличение Цветастости!
renderer.toneMapping = THREE.ACESFilmicToneMapping;
sun.intensity = 1.0;
renderer.toneMappingExposure = 1.1;

//3Д объекты
const scene_Torus_Geometry = new THREE.TorusGeometry( 10, 3, 16, 100 );
const scene_Torus_Material = new THREE.MeshStandardMaterial( {color: 0xff6347} );
const scene_Torus = new THREE.Mesh( scene_Torus_Geometry, scene_Torus_Material );
scene.add( scene_Torus );

//икс, вай, Z позиции
camera.position.setZ(30);
camera.position.setX(-3);

//Дебаг
const lightDebug = new THREE.PointLightHelper( sun );
scene.add(lightDebug);

//Маттериалы для звездочек, вне функции для оптимизации
const starGeometry = new THREE.SphereGeometry( 0.25, 24, 24 );
const starMatterial = new THREE.MeshStandardMaterial( { color: 0xffffff,  
                                                        roughness: 0,
                                                        emissive: 0xffffff,
                                                        emissiveIntensity: 12  } );

//Звездочка 
function starMaker() {
  
  const star = new THREE.Mesh( starGeometry, starMatterial );

  const [ x, y, z ] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread( 100 ));

  star.position.set( x, y, z );
  scene.add( star )
}

//Звездочкииии
Array(200).fill().forEach(starMaker);

//Анимэйшн Функция
function animate() {
  scene_Torus.rotation.x += 0.01;
  scene_Torus.rotation.y += 0.005;
  scene_Torus.rotation.z += 0.01;
  renderer.render( scene, camera );

}

//Функция, которая обновляет размер окна
function onWindowResize() {

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

}

//Если ресайз, то ресайз();
window.addEventListener('resize', onWindowResize, false);

//Онимэйшн луп
createSkyboxEquirectangular();
renderer.setAnimationLoop(animate);