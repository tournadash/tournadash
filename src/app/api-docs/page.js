'use client'

import { useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function ApiDocsPage() {
  useEffect(() => {
    document.title = 'Developer API Documentation | TournaDash'
  }, [])

  return (
    <div id="api-docs-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_castle_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🖥️ Developer API Docs
          </h1>
          <p className="page-header-banner-desc">
            Integrate your custom servers, plugins, and web applications with the TournaDash network.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="flex flex-col gap-8">
          
          <Card className="p-6">
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-3)' }}>
              Authentication
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: 'var(--space-4)' }}>
              All request endpoints used by the game servers are secured using the unique tournament token. You must pass this token in the header of your HTTP requests.
            </p>
            <pre style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)'
            }}>Authorization: Bearer &lt;your_server_token&gt;</pre>
          </Card>

          <Card className="p-6">
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-4)' }}>
              API Endpoints
            </h2>

            <div className="flex flex-col gap-6" style={{ fontSize: 'var(--text-sm)' }}>
              {/* Endpoint 1 */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <Badge variant="success" style={{ fontFamily: 'var(--font-mono)' }}>GET</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-text-white)' }}>/api/plugin/check</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                  Validates the server token and returns basic tournament status metadata.
                </p>
                <div style={{ fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Response Example:</div>
                <pre style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}>{`{
  "connected": true,
  "tournament": {
    "name": "Minecraft Masters Cup",
    "status": "ONGOING",
    "whitelist_enabled": true
  }
}`}</pre>
              </div>

              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)' }} />

              {/* Endpoint 2 */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <Badge variant="success" style={{ fontFamily: 'var(--font-mono)' }}>GET</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-text-white)' }}>/api/plugin/whitelist</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                  Fetches the list of all approved/selected players for the tournament whitelisting.
                </p>
                <div style={{ fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Response Example:</div>
                <pre style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}>{`{
  "whitelist": [
    { "minecraft_ign": "Steve", "minecraft_uuid": "85720e6a-72ef-401d-85d7-b08bc8c4146a" },
    { "minecraft_ign": "Alex", "minecraft_uuid": "d38bb81e-1cf6-4442-8877-cd0d5a49c3bd" }
  ]
}`}</pre>
              </div>

              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)' }} />

              {/* Endpoint 3 */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <Badge variant="primary" style={{ fontFamily: 'var(--font-mono)' }}>POST</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-text-white)' }}>/api/plugin/status</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                  Updates server status details like player online counts or custom server states.
                </p>
                <div style={{ fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Request Body:</div>
                <pre style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '8px'
                }}>{`{
  "online_players": 14,
  "server_state": "LOBBY"
}`}</pre>
                <div style={{ fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Response Example:</div>
                <pre style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}>{`{
  "success": true,
  "message": "Status updated successfully"
}`}</pre>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
