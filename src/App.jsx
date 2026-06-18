import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import Companies from './pages/masters/Companies';

function App() {
  return (
    <BrowserRouter>

      <Layout>

        <Routes>

          <Route
            path="/"
            element={<Companies />}
          />

        </Routes>

      </Layout>

    </BrowserRouter>
  );
}

export default App;
