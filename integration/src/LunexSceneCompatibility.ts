/**
 * Lunex GDD-01 stage 1: additive metadata for hybrid scene objects.
 * Existing layers and project mode stay unchanged.
 */
import type { Layer, Project, Scene, Vec3 } from '@/lib/types';

export type LunexDepthMode = 'auto' | 'manual';
export interface LunexSceneObjectMetadata {
  schemaVersion?: 1;
  depthMode?: LunexDepthMode;
  depth?: number;
  order?: number;
  assetRef?: string;
  parallaxFactor?: number;
}
export type CompatibleLayer = Layer & { lunex?: LunexSceneObjectMetadata };
export type CompatibleScene = Scene & { lunexSchemaVersion?: 1 };
export type CompatibleProject = Project & { lunexSchemaVersion?: 1 };

const finite = (n: unknown, fallback: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : fallback;

export function getCompatibleLayerDepth(layer: CompatibleLayer, index: number): number {
  const position = 'position' in layer ? (layer.position as Vec3 | undefined) : undefined;
  return finite(layer.lunex?.depth, finite(position?.z, index));
}

/** Read-only adapter: never rewrites old project JSON or keyframes. */
export function getCompatibleSceneObjects(scene: Scene): Array<{
  id: string;
  kind: '2d' | '3d';
  x: number;
  y: number;
  z: number;
  order: number;
  depthMode: LunexDepthMode;
  source: Layer;
}> {
  return scene.layers.map((source, index) => {
    const layer = source as CompatibleLayer;
    const is3d = 'position' in layer && !!layer.position;
    const pos = is3d ? (layer.position as Vec3) : undefined;
    return {
      id: layer.id,
      kind: is3d ? '3d' : '2d',
      x: finite(pos?.x, 'x' in layer ? layer.x : 0),
      y: finite(pos?.y, 'y' in layer ? layer.y : 0),
      z: getCompatibleLayerDepth(layer, index),
      order: finite(layer.lunex?.order, index),
      depthMode: layer.lunex?.depthMode === 'manual' ? 'manual' : 'auto',
      source,
    };
  });
}

export function isCompatibleProject(value: unknown): value is CompatibleProject {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<Project>;
  return typeof p.id === 'string' && Array.isArray(p.scenes) &&
    p.scenes.every(s => !!s && Array.isArray(s.layers) &&
      s.layers.every(l => !!l && typeof l.id === 'string' && typeof l.type === 'string'));
}
