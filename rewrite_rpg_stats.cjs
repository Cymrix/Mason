const fs = require('fs');
let code = fs.readFileSync('src/components/CharacterEditor.tsx', 'utf8');

const targetStr = `        {/* TAB 4: RPG STATS */}
        {activeTab === 'rpg_stats' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Heart size={16} />
              Base Attributes & RPG Stats
            </h3>`;

const index = code.indexOf(targetStr);
if(index === -1) {
  console.log('not found');
  process.exit(1);
}

const replacement = `        {/* TAB 4: RPG STATS */}
        {activeTab === 'rpg_stats' && (() => {
          const linkedBehaviorFile = (project.fileSystem.behaviors || []).find(b => b.fileName === char.assignedBehaviorFileName);
          const exposedVars = linkedBehaviorFile?.behaviorData?.exposedVariables || [];
          
          return (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <Heart size={16} />
                Attributes & Proficiencies
              </h3>
              
              {exposedVars.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-xs text-neutral-400">
                    This character's attributes are dictated by its linked behavior script: 
                    <strong className="text-rose-400 ml-1">{char.assignedBehaviorFileName}</strong>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exposedVars.map(v => {
                      const val = char.behaviorVariables?.[v.name] ?? v.defaultValue;
                      return (
                        <div key={v.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 relative overflow-hidden group">
                          {v.isStatic && (
                            <div className="absolute top-0 right-0 bg-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                              STATIC
                            </div>
                          )}
                          <label className="text-neutral-400 font-bold block mb-1 text-xs uppercase flex flex-col">
                            <span className="text-[9px] text-rose-500 font-mono tracking-widest">{v.category}</span>
                            <span className="text-neutral-200">{v.name}</span>
                          </label>
                          
                          {v.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={val}
                              disabled={v.isStatic}
                              onChange={(e) => updateCharacter(c => ({
                                ...c,
                                behaviorVariables: { ...(c.behaviorVariables || {}), [v.name]: e.target.checked }
                              }))}
                              className="mt-1"
                            />
                          ) : v.type === 'number' ? (
                            <input
                              type="number"
                              value={val}
                              disabled={v.isStatic}
                              onChange={(e) => updateCharacter(c => ({
                                ...c,
                                behaviorVariables: { ...(c.behaviorVariables || {}), [v.name]: parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono text-xs disabled:opacity-50"
                            />
                          ) : (
                            <input
                              type="text"
                              value={val}
                              disabled={v.isStatic}
                              onChange={(e) => updateCharacter(c => ({
                                ...c,
                                behaviorVariables: { ...(c.behaviorVariables || {}), [v.name]: e.target.value }
                              }))}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono text-xs disabled:opacity-50"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (`;

let nextPart = code.substring(index + targetStr.length);
// Find the end of activeTab === 'rpg_stats' which is }
// We can just find the end of it by matching the grid div
const endGridStr = `              </div>
            </div>
          </div>
        )}`;

const endGridIndex = nextPart.indexOf(endGridStr);
if (endGridIndex === -1) {
  console.log('endGridStr not found');
  process.exit(1);
}

const finalReplacement = code.substring(0, index) + replacement + nextPart.substring(0, endGridIndex) + `              </div>
            </div>
          )}
          </div>
        );
        })()}
`;

fs.writeFileSync('src/components/CharacterEditor.tsx', finalReplacement + nextPart.substring(endGridIndex + endGridStr.length));
console.log('success');
