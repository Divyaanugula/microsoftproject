import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewIncident from './pages/NewIncident';
import IncidentDetails from './pages/IncidentDetails';
import IncidentHistory from './pages/IncidentHistory';
import PostMortem from './pages/PostMortem';
import Memory from './pages/Memory';
import SettingsPage from './pages/Settings';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-incident" element={<NewIncident />} />
            <Route path="/incidents/:id" element={<IncidentDetails />} />
            <Route path="/history" element={<IncidentHistory />} />
            <Route path="/post-mortem" element={<PostMortem />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
