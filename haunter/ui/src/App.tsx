import { Router } from './router';
import './index.css';
import './App.css';

export default function App() {
  return (
    <Router>
      {(props) => props.children}
    </Router>
  );
}
