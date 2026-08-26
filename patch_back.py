import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

back_str = """
  const handleBackToDashboard = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes in the current sprite. Are you sure you want to exit? (Click OK to discard changes, Cancel to stay)")) {
        return;
      }
    }
    onBackToDashboard();
  };
"""

# Insert before return (
text = text.replace("  return (\n    <div className=", back_str + "  return (\n    <div className=")

text = text.replace("onBackToDashboard={onBackToDashboard}", "onBackToDashboard={handleBackToDashboard}")

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched back")
