import './App.css'
import Starfield from './Starfield'
import Chat from './components/Chat'

function App() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <Starfield />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 20, width: 'min(92vw, 760px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
          <h1 style={{ marginTop: 0, marginBottom: 10 }}>AI Chat</h1>
          <p style={{ marginTop: 0, opacity: 0.8 }}>Starfield background demo</p>
          <Chat />
        </div>
      </div>
    </div>
  )
}

export default App
