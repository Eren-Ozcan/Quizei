import './style.css';
import { startApp } from './ui/app.ts';

const root = document.getElementById('app');

if (!root) {
  throw new Error('Domina: #app container is missing from index.html');
}

startApp(root);
