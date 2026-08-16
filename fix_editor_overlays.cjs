const fs = require('fs');
let file = fs.readFileSync('src/components/RefinedBiomeEditor.tsx', 'utf8');

// Replace {enabled: true, ...} logic with just the object
file = file.replace(/enabled: true/g, "");
file = file.replace(/enabled: false/g, "");
file = file.replace(/,\s*,/g, ",");
file = file.replace(/{\s*,/g, "{");

// We need to strip out the <div className="flex items-center justify-between px-1"> that holds the checkbox.
// Actually, it's easier to just use a targeted replace for the exact blocks in RefinedBiomeEditor.tsx

// It might be complex with Regex. 
// I'll manually edit RefinedBiomeEditor.tsx.
