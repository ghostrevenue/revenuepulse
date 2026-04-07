import React from 'react';
import { createRoot } from 'react-dom/client';
import { WaitlistEmbed } from './WaitlistEmbed.jsx';
import { CountdownTimer } from './CountdownTimer.jsx';
import { ShareWidget } from './ShareWidget.jsx';

class LaunchPadWidget {
  constructor(config) {
    this.config = config;
    this.container = null;
  }

  mount(selector) {
    this.container = document.querySelector(selector);
    if (!this.container) return;
    this.render();
  }

  render() {
    if (!this.container) return;
    const root = createRoot(this.container);
    root.render(
      <div className="launchpad-widget">
        {this.config.showCountdown !== false && <CountdownTimer launchDate={this.config.launchDate} />}
        {this.config.showWaitlist !== false && <WaitlistEmbed campaignId={this.config.campaignId} />}
        {this.config.showShare !== false && this.config.referralCode && <ShareWidget code={this.config.referralCode} />}
      </div>
    );
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.render();
  }
}

export { LaunchPadWidget, WaitlistEmbed, CountdownTimer, ShareWidget };

if (typeof window !== 'undefined') {
  window.LaunchPadWidget = LaunchPadWidget;
}
