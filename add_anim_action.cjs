const fs = require('fs');
let code = fs.readFileSync('src/components/BehaviorEditor.tsx', 'utf8');

const targetStr = `                            {act.actionType === 'attack' && (
                              <div className="flex items-center gap-2">`;

const index = code.indexOf(targetStr);
if(index === -1) {
  console.log('not found');
  process.exit(1);
}

const replacement = `                            {act.actionType === 'animation' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Anim State (e.g. idle, attack)"
                                  value={act.animState || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBehavior(b => ({
                                      ...b,
                                      rules: (b.rules || []).map((r, i) => i === ruleIdx ? {
                                        ...r,
                                        actions: (r.actions || []).map((a, ai) => ai === actIdx ? { ...a, animState: val } : a)
                                      } : r)
                                    }));
                                  }}
                                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-fuchsia-300 font-mono font-bold flex-1"
                                />
                                <select 
                                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-fuchsia-300 font-mono font-bold w-8 cursor-pointer"
                                  onChange={(e) => {
                                    if(e.target.value) {
                                      const val = e.target.value;
                                      updateBehavior(b => ({
                                        ...b,
                                        rules: (b.rules || []).map((r, i) => i === ruleIdx ? {
                                          ...r,
                                          actions: (r.actions || []).map((a, ai) => ai === actIdx ? { ...a, animState: val } : a)
                                        } : r)
                                      }));
                                    }
                                  }}
                                  value=""
                                  title="Pick animation from assigned characters"
                                >
                                  <option value="">▼</option>
                                  {Array.from(new Set(
                                    (project.fileSystem.characters || [])
                                      .filter(c => c.characterData.assignedBehaviorFileName === currentBehaviorFile.fileName)
                                      .flatMap(c => c.characterData.animations || [])
                                      .map(a => a.name)
                                  )).map(animName => (
                                    <option key={animName} value={animName}>{animName}</option>
                                  ))}
                                </select>
                              </div>
                            )}

` + targetStr;

fs.writeFileSync('src/components/BehaviorEditor.tsx', code.substring(0, index) + replacement + code.substring(index + targetStr.length));
console.log('success');
