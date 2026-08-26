import re

with open('src/components/EditorLayout.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I need to add a dirty check there.
# But EditorLayout doesn't know about `isDirty` in SpriteEditorWrapper.
# The user asked: "Instead of keeping the cash between Sprite files, I'd rather just get a pop-up message prompting to save or lose all changes."
# To fully prevent switching modules without saving, I would need to hoist `isDirty` to EditorLayout.
