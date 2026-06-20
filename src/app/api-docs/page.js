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
              API Base URL & Authentication
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: 'var(--space-3)' }}>
              All game server requests are routed through our central API. Secure requests using your tournament&apos;s unique secret token.
            </p>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>API BASE URL:</div>
              <pre style={{
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-primary)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)'
              }}>https://tournadash.vercel.app/api/plugin</pre>
            </div>
            
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: 'var(--space-3)' }}>
              <strong>How to get your Server Token:</strong> Log into your dashboard, navigate to your Organization page, select the specific tournament, and locate the <strong>Server Token</strong> field on the details view card. 
              <br />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                ⚠️ Note: The Server Token (prefixed with <code>tournament_tok_</code>) is only visible to the Organization <strong>OWNER</strong>. Other roles will see a padlock graphic to prevent key leaks.
              </span>
            </p>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>AUTHORIZATION HEADER EXAMPLE:</div>
            <pre style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)'
            }}>Authorization: Bearer tournament_tok_your_secret_key_here</pre>
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
                  Updates the tournament status or gates whitelist access settings.
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
  "status": "ENDED", // Optional: 'SOON', 'ONGOING', 'ENDED'
  "whitelist_enabled": true // Optional: boolean
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
  "updated": {
    "status": "ENDED"
  }
}`}</pre>
              </div>

              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)' }} />

              {/* Endpoint 4 */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <Badge variant="primary" style={{ fontFamily: 'var(--font-mono)' }}>POST</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-text-white)' }}>/api/plugin/leaderboard</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                  Creates a new custom tournament leaderboard (standings board) or overwrites an existing one of the same name.
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
  "name": "Round 1 Standings",
  "is_public": true,
  "entries": [
    { "position": 1, "username": "Steve", "notes": "Winner - 15 Kills" },
    { "position": 2, "username": "Alex", "notes": "10 Kills" }
  ]
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
  "leaderboard_id": "c1387d89-9e8c-4a3b-821f-0e6d63bcde6b",
  "name": "Round 1 Standings",
  "is_public": true,
  "entries_count": 2
}`}</pre>
              </div>

              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)' }} />

              {/* Endpoint 5 */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <Badge variant="success" style={{ fontFamily: 'var(--font-mono)' }}>GET</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-text-white)' }}>/api/plugin/leaderboard</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                  Retrieves all custom leaderboards and entries for the authorized tournament.
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
  "tournament_id": "b139de67-1111-2222-3333-444455556666",
  "leaderboards": [
    {
      "id": "c1387d89-9e8c-4a3b-821f-0e6d63bcde6b",
      "name": "Round 1 Standings",
      "is_public": true,
      "entries": [
        { "position": 1, "username": "Steve", "notes": "Winner - 15 Kills" }
      ]
    }
  ]
}`}</pre>
              </div>

              <hr style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)' }} />

              {/* Endpoint 6 */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <Badge variant="danger" style={{ fontFamily: 'var(--font-mono)' }}>DELETE</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-text-white)' }}>/api/plugin/leaderboard?name=&lt;name&gt;</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                  Deletes a custom leaderboard and all its standings entries by name.
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
  "success": true,
  "message": "Leaderboard 'Round 1 Standings' deleted successfully"
}`}</pre>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
