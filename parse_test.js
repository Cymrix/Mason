const fs = require('fs');
const ts = require('typescript');

const file = 'src/components/RefinedMapCanvas.tsx';
const code = fs.readFileSync(file, 'utf8');

const sourceFile = ts.createSourceFile(
    file,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
);

function getDiagnostics() {
    const program = ts.createProgram([file], { noEmit: true, jsx: ts.JsxEmit.React });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    diagnostics.forEach(diag => {
        if (diag.file) {
            let { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
            console.log(`Error ${diag.file.fileName} (${line + 1},${character + 1}): ${ts.flattenDiagnosticMessageText(diag.messageText, '\n')}`);
        } else {
            console.log(ts.flattenDiagnosticMessageText(diag.messageText, '\n'));
        }
    });
}
getDiagnostics();
