'use client'

import { useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function PluginPage() {
  useEffect(() => {
    document.title = 'Minecraft Plugin Download & Setup | TournaDash'
  }, [])

  return (
    <div id="plugin-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_hero_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🔌 In-Game Minecraft Plugin
          </h1>
          <p className="page-header-banner-desc">
            Download and set up the TournaDash Spigot/Paper plugin to automate your whitelist sync.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="flex flex-col gap-8">
          
          {/* Download Box */}
          <Card className="p-8 text-center" style={{ borderTop: '4px solid var(--color-primary)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-3)' }}>🔌</span>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: '700', color: 'var(--color-text-white)', marginBottom: 'var(--space-2)' }}>
              Download TournaDash Plugin
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-6)' }}>
              Supports Paper, Purpur, Spigot, and Bukkit servers from versions 1.16.5 up to 1.21+.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary" size="lg" onClick={() => alert('Download starting: tournadash-plugin-v1.0.0.jar')}>
                Download v1.0.0 .JAR ⚡
              </Button>
              <a href="https://github.com/tournadash/plugin" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg">
                  View GitHub Source
                </Button>
              </a>
            </div>
          </Card>

          {/* Quick Setup Instructions */}
          <Card className="p-6">
            <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-white)', marginBottom: 'var(--space-4)', fontWeight: '600' }}>
              🚀 Quick Setup Guide
            </h3>
            
            <div className="flex flex-col gap-4" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
              <div>
                <strong style={{ color: 'var(--color-text-white)', display: 'block', marginBottom: '4px' }}>Step 1: Install the JAR</strong>
                Download the `.jar` file and place it into your server&apos;s `/plugins` folder. Restart the server.
              </div>
              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)' }} />
              <div>
                <strong style={{ color: 'var(--color-text-white)', display: 'block', marginBottom: '4px' }}>Step 2: Obtain your server token</strong>
                Go to your TournaDash Dashboard, select your Organization, edit your Tournament settings, and copy the **Server Whitelist Token**.
              </div>
              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)' }} />
              <div>
                <strong style={{ color: 'var(--color-text-white)', display: 'block', marginBottom: '4px' }}>Step 3: Connect the Server</strong>
                In your Minecraft console or in-game (as OP), run:
                <pre style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-primary)',
                  fontWeight: '600',
                  marginTop: '6px',
                  fontFamily: 'var(--font-mono)'
                }}>/td token &lt;your_copied_token&gt;</pre>
              </div>
              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)' }} />
              <div>
                <strong style={{ color: 'var(--color-text-white)', display: 'block', marginBottom: '4px' }}>Step 4: Enable Whitelist sync</strong>
                Check connection and start automatic synchronization:
                <pre style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-primary)',
                  fontWeight: '600',
                  marginTop: '6px',
                  fontFamily: 'var(--font-mono)'
                }}>/td sync</pre>
              </div>
            </div>
          </Card>

          {/* Commands Card */}
          <Card className="p-6">
            <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-white)', marginBottom: 'var(--space-4)', fontWeight: '600' }}>
              🛠️ Command Reference
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '8px' }}>Command</th>
                  <th style={{ padding: '8px' }}>Permission</th>
                  <th style={{ padding: '8px' }}>Description</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-text-secondary)' }}>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px', color: 'var(--color-text-white)', fontFamily: 'var(--font-mono)' }}>/td token &lt;token&gt;</td>
                  <td style={{ padding: '8px' }}>tournadash.admin</td>
                  <td style={{ padding: '8px' }}>Sets the tournament server access token.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px', color: 'var(--color-text-white)', fontFamily: 'var(--font-mono)' }}>/td sync</td>
                  <td style={{ padding: '8px' }}>tournadash.admin</td>
                  <td style={{ padding: '8px' }}>Triggers manual synchronization of the player whitelist.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px', color: 'var(--color-text-white)', fontFamily: 'var(--font-mono)' }}>/td status</td>
                  <td style={{ padding: '8px' }}>tournadash.admin</td>
                  <td style={{ padding: '8px' }}>Checks connection state to TournaDash servers.</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', color: 'var(--color-text-white)', fontFamily: 'var(--font-mono)' }}>/td version</td>
                  <td style={{ padding: '8px' }}>Everyone</td>
                  <td style={{ padding: '8px' }}>Displays plugin version details.</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  )
}
