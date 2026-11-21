import test from 'node:test';import assert from 'node:assert/strict';
import {createScene,addLayer,serializeScene,deserializeScene,renderPasses} from '../src/hybrid-scene.mjs';
test('2D and 3D layers share one ordered scene',()=>{let s=createScene();s=addLayer(s,{id:'bear',kind:'3d',depth:10});s=addLayer(s,{id:'background',kind:'2d',depth:0});assert.deepEqual(renderPasses(s).map(p=>p.renderer),['konva','three']);});
test('mixed scene survives JSON round trip',()=>{let s=addLayer(createScene(),{id:'sprite',kind:'2d',depth:1});s=addLayer(s,{id:'mesh',kind:'3d',depth:2});assert.deepEqual(deserializeScene(serializeScene(s)),s);});
test('duplicate IDs rejected',()=>{let s=addLayer(createScene(),{id:'a',kind:'2d',depth:0});assert.throws(()=>addLayer(s,{id:'a',kind:'3d',depth:1}));});
test('unknown renderer rejected',()=>assert.throws(()=>addLayer(createScene(),{id:'x',kind:'video',depth:0})));
test('hidden layer skipped in render plan',()=>{const s=addLayer(createScene(),{id:'hidden',kind:'2d',depth:0,visible:false});assert.equal(renderPasses(s).length,0);});
