import { StatusBar } from 'expo-status-bar';

import { AppShell } from './src/app/AppShell';
import { LibraryProvider } from './src/state/library-context';

export default function App() {
  return (
    <LibraryProvider>
      <StatusBar style="dark" />
      <AppShell />
    </LibraryProvider>
  );
}

