import { Routes, Route, Link } from 'react-router-dom';
import Creator from './Creator';
import Board from './Board';
import QuestionSelector from './QuestionSelector';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#ffffff',
      fontFamily: '"Inter", "Roboto", sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <nav style={{
        padding: '1rem 2rem',
        backgroundColor: '#16213e',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#e94560',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          La guerre des clans
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" style={linkStyle}>Sélection</Link>
          <Link to="/create" style={linkStyle}>Configuration</Link>
          <Link to="/play" style={linkStyle}>Jouer</Link>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<QuestionSelector />} />
          <Route path="/create" element={<Creator />} />
          <Route path="/play" element={<Board />} />
        </Routes>
      </main>
    </div>
  );
}

const linkStyle = {
  color: '#fff',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  backgroundColor: '#0f3460',
  fontWeight: 'bold',
  transition: 'background-color 0.2s'
};

export default App;
