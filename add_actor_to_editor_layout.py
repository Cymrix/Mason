import re

with open('src/components/EditorLayout.tsx', 'r') as f:
    content = f.read()

# Add actor to PaintCategory
content = re.sub(r"type PaintCategory = 'tile_type' \| 'environmental' \| 'interactive' \| 'wildlife' \| 'particles';", "type PaintCategory = 'tile_type' | 'environmental' | 'interactive' | 'wildlife' | 'particles' | 'actor';", content)

# Add Actors to PAINT_CATEGORIES
paint_categories_pattern = r"const PAINT_CATEGORIES = \[\n  \{ id: 'tile_type', label: 'Terrain', icon: Layers \},\n  \{ id: 'environmental', label: 'Flora', icon: TreePine \},\n  \{ id: 'interactive', label: 'Props', icon: Box \},\n  \{ id: 'wildlife', label: 'Wildlife', icon: Skull \},\n  \{ id: 'particles', label: 'Particles', icon: Sparkles \}\n\];"
new_paint_categories = """const PAINT_CATEGORIES = [
  { id: 'tile_type', label: 'Terrain', icon: Layers },
  { id: 'environmental', label: 'Flora', icon: TreePine },
  { id: 'interactive', label: 'Details', icon: Box },
  { id: 'actor', label: 'Actors/Props', icon: Zap },
  { id: 'wildlife', label: 'Wildlife', icon: Skull },
  { id: 'particles', label: 'Particles', icon: Sparkles }
];"""
content = re.sub(paint_categories_pattern, new_paint_categories, content)

# Add actor panel
actor_panel = """
                      {paintCategory === 'actor' && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAssetId('')}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                              selectedAssetId === '' 
                                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded border border-dashed border-cyan-500/50 flex items-center justify-center text-cyan-400 text-xs">
                                ∅
                              </div>
                              <div className="text-xs font-bold">Clear Actor / Prop</div>
                            </div>
                          </button>

                          {(project.fileSystem.characters && project.fileSystem.characters.length > 0) ? (
                            project.fileSystem.characters.map(actor => (
                              <button
                                key={actor.id}
                                type="button"
                                onClick={() => setSelectedAssetId(actor.id)}
                                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition group ${
                                  selectedAssetId === actor.id
                                    ? 'bg-cyan-900/60 border-cyan-500 text-cyan-100 shadow-sm'
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {actor.spriteUrl ? (
                                    <img src={actor.spriteUrl} alt={actor.name} className="w-8 h-8 object-contain pixelated bg-neutral-950 rounded" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                                      <Zap size={14} className="text-neutral-600" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold font-mono">{actor.name}</span>
                                    <span className="text-[10px] text-neutral-500 uppercase">{actor.type === 'prop' ? 'Prop' : 'Actor'}</span>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="text-center p-4 border border-dashed border-neutral-800 rounded-xl">
                              <p className="text-xs text-neutral-500">No actors/props in project.</p>
                            </div>
                          )}
                        </div>
                      )}
"""

content = content.replace("{paintCategory === 'particles' && (", actor_panel + "\n                      {paintCategory === 'particles' && (")

with open('src/components/EditorLayout.tsx', 'w') as f:
    f.write(content)
