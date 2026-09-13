import { BrowserRouter } from 'react-router-dom';
import ExplorerAppShell from './components/ExplorerAppShell';

function App() {
  return (
    <BrowserRouter>
      <ExplorerAppShell />
    </BrowserRouter>
  );
}

export default App;
