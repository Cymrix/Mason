/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EditorLayout } from './components/EditorLayout';
import { ThemeProvider } from './theme/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <EditorLayout />
    </ThemeProvider>
  );
}

