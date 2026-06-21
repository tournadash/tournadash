'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function OrgAnnouncementsPage() {
  const { orgId } = useParams()
  const [announcements, setAnnouncements] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchAnnouncements()
  }, [orgId])

  const fetchAnnouncements = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('organization_announcements')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    
    setAnnouncements(data || [])
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newAnnouncement.trim()) return

    setSubmitting(true)
    const { error } = await supabase
      .from('organization_announcements')
      .insert([{
        organization_id: orgId,
        content: newAnnouncement.trim()
      }])

    if (!error) {
      setNewAnnouncement('')
      fetchAnnouncements()
    } else {
      alert('Failed to post announcement.')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return
    
    const { error } = await supabase
      .from('organization_announcements')
      .delete()
      .eq('id', id)

    if (!error) {
      setAnnouncements(announcements.filter(a => a.id !== id))
    } else {
      alert('Failed to delete announcement.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Announcements Bulletin</h1>
          <p className="dashboard-page-subtitle">
            Post updates, news, and rules. The 3 most recent announcements will be displayed publicly on your organization page.
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="td-label">New Announcement</label>
            <textarea
              className="td-input-field"
              rows="4"
              placeholder="Type your announcement here..."
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={submitting}>
              Post Announcement
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        <h3 className="dashboard-page-title" style={{ fontSize: '1.125rem' }}>History</h3>
        
        {loading ? (
          <div className="skeleton" style={{ height: '100px' }} />
        ) : announcements.length > 0 ? (
          announcements.map((a) => (
            <Card key={a.id} className="p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  {new Date(a.created_at).toLocaleString()}
                </span>
                <button 
                  onClick={() => handleDelete(a.id)}
                  className="btn btn-ghost btn-sm" 
                  style={{ color: 'var(--color-danger)' }}
                >
                  Delete
                </button>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-white)' }}>{a.content}</p>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted">
            No announcements posted yet.
          </Card>
        )}
      </div>
    </div>
  )
}
