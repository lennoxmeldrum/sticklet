/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';

// Behind the ExplAIn Sims Cloudflare Worker the app is served at
// /<app>/... but Cloud Run sees the request at root. Derive the
// prefix from the live URL so React Router's pathname matching and
// generated navigation URLs stay under /<app>/.
const basename = '/' + (window.location.pathname.split('/').filter(Boolean)[0] || '');

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}
