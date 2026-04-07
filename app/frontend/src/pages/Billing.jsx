import React from 'react';
import Settings from './Settings.jsx';

// Billing page is now handled by Settings component
// This file exists to maintain compatibility with any existing links
export default function Billing(props) {
  return <Settings {...props} />;
}
