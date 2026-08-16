const fs = require('fs');
let file = fs.readFileSync('src/components/RefinedBiomeEditor.tsx', 'utf8');

const replacement = `                      {/* Top Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Top Edge Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Top Edge Overlay Trim"
                          badge="Top"
                          imageUrl={selectedTileType.tileDetails.top.overlayTextureUrl}
                          fallbackColor="#052e16"
                          fallbackText="Top"
                          accentColor="emerald"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Bottom Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Bottom Edge Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Bottom Edge Trim"
                          badge="Bottom"
                          imageUrl={selectedTileType.tileDetails.bottom.overlayTextureUrl}
                          fallbackColor="#1e1e1e"
                          fallbackText="Bottom"
                          accentColor="purple"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Left Side Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Left Side Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Left Wall Trim"
                          badge="Left"
                          imageUrl={selectedTileType.tileDetails.leftSide.overlayTextureUrl}
                          fallbackColor="#2d2d2d"
                          fallbackText="Left"
                          accentColor="blue"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Right Side Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Right Side Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Right Wall Trim"
                          badge="Right"
                          imageUrl={selectedTileType.tileDetails.rightSide.overlayTextureUrl}
                          fallbackColor="#2d2d2d"
                          fallbackText="Right"
                          accentColor="blue"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Slope Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Slope Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="45° Slope Trim"
                          badge="Slope"
                          imageUrl={(selectedTileType.tileDetails as any).slope?.overlayTextureUrl}
                          fallbackColor="#2c1a1a"
                          fallbackText="Slope"
                          accentColor="orange"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, slope: { ...((tt.tileDetails as any).slope || {}), overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, slope: { ...((tt.tileDetails as any).slope || {}), overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Inner Corner Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Inner Corner Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Inside Corner Trim"
                          badge="Inner"
                          imageUrl={(selectedTileType.tileDetails as any).innerCorner?.overlayTextureUrl}
                          fallbackColor="#1e1e38"
                          fallbackText="Inner"
                          accentColor="emerald"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, innerCorner: { ...((tt.tileDetails as any).innerCorner || {}), overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, innerCorner: { ...((tt.tileDetails as any).innerCorner || {}), overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>`;

const regex = /\{\/\* Top Overlay \*\/\}[\s\S]*?\{\/\* Destructibility & Traversal \*\/\}/;
file = file.replace(regex, replacement + "\n\n                      {/* Destructibility & Traversal */}");

fs.writeFileSync('src/components/RefinedBiomeEditor.tsx', file);
