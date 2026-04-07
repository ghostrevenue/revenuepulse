import { PixelTracker } from './PixelTracker.jsx';

export default function index(remixContext, options) {
  return {
    name: 'fb-pixel',
    tracksPage: true,
    handler: PixelTracker
  };
}
