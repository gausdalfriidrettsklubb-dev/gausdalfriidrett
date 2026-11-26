/* Three.js r128. The original game remains playable while the assets load. */
(function () {
  'use strict';
  const base = new URL('./', document.currentScript.src);
  const cache = new Map();
  function template(file) {
    if (!cache.has(file)) {
      cache.set(file, new Promise((resolve, reject) => {
        new THREE.GLTFLoader().load(new URL(file, base).href, resolve, undefined, reject);
      }));
    }
    return cache.get(file);
  }
  async function attach(runner, kit, palette) {
    const file = kit.lang ? 'sprinter-B.glb' : 'sprinter-A.glb';
    const asset = await template(file);
    const visual = THREE.SkeletonUtils.clone(asset.scene);
    const bone = name => visual.getObjectByName(name);
    const colors = { Singlet: kit.drakt, SidePanel: kit.drakt, Shorts: kit.shorts,
      Shoe: palette.shoe, Hair: palette.hair, Skin: palette.skin };
    visual.traverse(mesh => {
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.frustumCulled = false; // Animated limbs extend beyond their bind bounds.
      const key = mesh.material.name;
      if (key in colors) {
        mesh.material = mesh.material.clone();
        mesh.material.color.setHex(colors[key]).convertSRGBToLinear();
        if (key === 'SidePanel') mesh.material.color.multiplyScalar(.57);
      }
    });
    const old = runner.bekken;
    const torso = bone('Torso');
    runner.overkropp.children.filter(m => m.geometry && m.geometry.type === 'PlaneGeometry').forEach(m => {
      const bib = m.clone();
      const front = m.position.x > 0;
      bib.position.set(front ? .149 : -.10, .32, 0);
      bib.scale.set(.81,.77,1);
      torso.add(bib);
    });
    const leg = s => ({ hofte: bone('Thigh'+s), kne: bone('Shin'+s), ankel: bone('Foot'+s) });
    const arm = s => ({ skulder: bone('Arm'+s), albue: bone('Forearm'+s) });
    const next = { bekken: bone('Hips'), overkropp: torso, hode: bone('Head'),
      aV: arm('L'), aH: arm('R'), bV: leg('L'), bH: leg('R') };
    for (const key of ['bekken','overkropp','hode']) next[key].rotation.copy(runner[key].rotation);
    for (const key of ['aV','aH','bV','bH']) {
      for (const joint of Object.keys(next[key])) next[key][joint].rotation.copy(runner[key][joint].rotation);
    }
    next.bekken.position.y = old.position.y;
    runner.gruppe.add(visual);
    runner.gruppe.remove(old);
    Object.assign(runner, next);
  }
  window.GausdalRunners = { attach };
})();
