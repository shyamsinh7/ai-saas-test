import './style.css';
import { loadProfile } from './data';
import { renderProfile } from './render';
import { initBackToTop } from './backToTop';

const root = document.getElementById('app');
if (root) {
  void loadProfile().then((profile) => {
    renderProfile(root, profile);
    initBackToTop();
  });
}
