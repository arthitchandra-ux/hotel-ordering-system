import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { OrderFlow } from './pages/OrderFlow';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/order?rid=Walk-In" replace />} />
        <Route path="/order" element={<OrderFlow />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
