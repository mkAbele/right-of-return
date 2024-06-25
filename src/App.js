import "./index.css";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useTexture, Reflector, Environment, OrbitControls, MeshReflectorMaterial, PerspectiveCamera, Lightformer, AsciiRenderer} from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { DDSLoader } from "three-stdlib";
import React, { Suspense, useEffect, useState, useMemo, useRef } from 'react'
import { Bloom, EffectComposer, LUT } from '@react-three/postprocessing'
import { LUTCubeLoader } from 'postprocessing'

THREE.DefaultLoadingManager.addHandler(/\.dds$/i, new DDSLoader());

const OriginIndicator = () => {
  return (
    <mesh position={[0, 0, 0]} >
      <sphereGeometry args={[0.05, 32, 32]} />
      <meshBasicMaterial color="green" />
    </mesh>
  );
};


const lAtX = 0;
const lAtY = 1.3;
const lAtZ = 0;
const LookAtIndicator = () => {
  return (
    <mesh position={[lAtX, lAtY, lAtZ]}>
      <sphereGeometry args={[0.05, 32, 32]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
};

const Objects = () => {
  const objRef = useRef();
  const [rotationSpeed, setRotationSpeed] = useState(0.005);
  const defaultSpeed = 0.005;
  const maxSpeed = 0.25;
  const resetDelay = 1000;
  const timerRef = useRef(null);

  const handleScroll = (event) => {
    const delta = event.deltaY;
    setRotationSpeed((prevSpeed) => {
      const newSpeed = prevSpeed + delta * 0.0001;
      return Math.min(maxSpeed, Math.max(0.001, newSpeed));
    });

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
    }, resetDelay);
  };

  // const materials = useLoader(MTLLoader, "/3D/Model.mtl");
  const obj = useLoader(OBJLoader, "./3D/Model.obj", (loader) => {
    // materials.preload();
    // loader.setMaterials(materials);
  });
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F6F5F8", emissive: "#FFF", emissiveIntensity: 3}), []);

  useEffect(() => {
    if (obj) {
      obj.traverse((child) => {
        
        if (child.isMesh) {
          child.geometry.computeVertexNormals();
          child.material = material;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    window.addEventListener('wheel', handleScroll);
    return () => {
      window.removeEventListener('wheel', handleScroll);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [obj, material]);

  // useFrame(() => {
  //   if (obj) {
  //     obj.rotation.y += 0.005;
  //   }
  // });

  useFrame(() => {
    if (objRef.current) {
      objRef.current.rotation.y += rotationSpeed;
    }
  });

  if (!timerRef.current && rotationSpeed !== defaultSpeed) {
    setRotationSpeed((prevSpeed) => {
      const newSpeed = prevSpeed + (defaultSpeed - prevSpeed) * 0.5;
      if (Math.abs(newSpeed - defaultSpeed) < 0.001) {
        return defaultSpeed;
      }
      return newSpeed;
    });
  }

  return (
    <group rotation={[0.1, 0.3, 0.3]} position={[0, 1.5, 0]}>
      {/* <OriginIndicator/> */}
      <primitive object={obj} scale={1} ref={objRef}/>
    </group>
  );
};

function Ground() {
  const [floor, normal] = useTexture(['./SurfaceImperfections003_1K_var1.jpg', './SurfaceImperfections003_1K_Normal.jpg'])
  return (
    <Reflector blur={[500, 300]} resolution={512*2} args={[50, 50]} mirror={0.5} mixBlur={8} mixStrength={2.5} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      {(Material, props) => <Material color="#a0a0a0" metalness={0.5} roughnessMap={floor} normalMap={normal} normalScale={[2, 2]} {...props} />}
    </Reflector>
  )
}

function VideoObj(props) {
  const [video] = useState(() => Object.assign(document.createElement('video'), { src: './righttoreturn.mp4', crossOrigin: 'Anonymous', loop: true, muted: true }))
  useEffect(() => void video.play(), [video])
  return (
    <mesh position={[0, ((9/3)/2), 0]}>
      <planeGeometry args={[(9/3), (9/3)]} />
      <meshBasicMaterial toneMapped={false}>
        <videoTexture attach="map" args={[video]} />
      </meshBasicMaterial>
    </mesh>
  )
}

const CamZ = 2.5;



export default function App() {
  const lutTexture = useLoader(LUTCubeLoader, './F-6800-STD.cube')
  return (
    <div className="App">
      <Canvas dpr={[1, 1.5]} shadows gl={{ alpha: false }}>
        {/* <AsciiRenderer /> */}
        <PerspectiveCamera  makeDefault position={[0, 1.5, 5]} fov={55} />
        {/* <OrbitControls 
          enabled={true} 
          target={[lAtX, lAtY, lAtZ]}
        /> */}

        <OrbitControls 
          enabled={true} 
          target={[lAtX, lAtY, lAtZ]} 
          enablePan={false} 
          enableRotate={false} 
          enableZoom={false}
        />
        {/* <LookAtIndicator/> */}

        <color attach="background" args={['#000']} />
        <fog attach="fog" args={['#000', 0, 8]} />
        <ambientLight intensity={0.05} color="#36DCAE"/>
        <pointLight position={[-0.01, 1.3, -0.05]} intensity={10}/>
        <pointLight position={[6, 1.3, -2]} intensity={10}/>
        <directionalLight castShadow color="#DB5C37" intensity={0.025} position={[0, 0, 6]} shadow-mapSize={[1024, 1024]}></directionalLight>

        
        <Suspense fallback={null}>
          <Objects />
          <VideoObj/>
          <Ground/>
          {/* <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
              blur={[400, 100]}
              resolution={1024}
              mixBlur={1}
              mixStrength={15}
              depthScale={0}
              minDepthThreshold={0}
              color="#151515"
              metalness={0.8}
              roughness={0.5}
              />
          </mesh> */}
        </Suspense>
        {/* <Environment preset="dawn" /> */}
        {/* <Environment preset="night"/> */}
        {/* <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={1} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={1} />
            <Lightformer form="circle" intensity={1} rotation-y={Math.PI / 2} position={[-5, 5, -1]} scale={1} />
            <Lightformer form="circle" intensity={1} rotation-y={Math.PI / 2} position={[-5, 5, -1]} scale={1} />
            <Lightformer form="circle" intensity={1} rotation-y={-Math.PI / 2} position={[10, 5, 0]} scale={1} />
          </group>
        </Environment> */}
        <EffectComposer disableNormalPass>
          <Bloom mipmapBlur levels={9} intensity={0.15 * 4} luminanceThreshold={1.3} luminanceSmoothing={1} />
          <LUT lut={lutTexture} />
          
        </EffectComposer>
      </Canvas>
    </div>
  );
}