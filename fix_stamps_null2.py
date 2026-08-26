import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

stamps_old = """      selectedColors = new Set(
        Array.isArray(proj.selectedColors) ? proj.selectedColors.filter(h=>allColors().includes(h)) : []
      );
      gradients = Array.isArray(proj.gradients)
        ? proj.gradients.map(g=>({name:g.name, stops:[...(g.stops||[])]})) : [];
      stamps = newStamps;
      grids = Array.isArray(proj.grids) ? proj.grids.map(g=>({...g})) : [];
      gridMasterOn = !!proj.gridMasterOn;"""

stamps_new = """      selectedColors = new Set(
        Array.isArray(proj.selectedColors) ? proj.selectedColors.filter(h=>allColors().includes(h)) : []
      );
      gradients = Array.isArray(proj.gradients)
        ? proj.gradients.map(g=>({name:g.name, stops:[...(g.stops||[])]})) : [];
      stamps = (newStamps || []).filter(s => s !== null);
      grids = Array.isArray(proj.grids) ? proj.grids.map(g=>({...g})) : [];
      gridMasterOn = !!proj.gridMasterOn;"""

if stamps_old in text:
    text = text.replace(stamps_old, stamps_new, 1)
    print("Patched stamps null filtering")
else:
    print("Could not find stamps_old")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
