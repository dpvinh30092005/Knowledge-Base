import { useMemo, useState } from 'react'
import './App.css'

const initialPosts = [
  {
    id: 1,
    author: 'Lena Tran',
    role: 'Product Designer',
    content: 'Shared a fresh onboarding flow today. Feedback welcome before release.',
    tags: ['design', 'ux'],
    likes: 18,
    comments: ['Looks clean and clear.', 'Can you share the mobile variant?'],
    time: '2h ago',
  },
  {
    id: 2,
    author: 'Huy Nguyen',
    role: 'Frontend Engineer',
    content: 'Deployed a performance pass: lazy-loaded non-critical widgets and reduced bundle size.',
    tags: ['frontend', 'performance'],
    likes: 31,
    comments: ['Great impact. Any benchmark result?'],
    time: '4h ago',
  },
  {
    id: 3,
    author: 'Mai Pham',
    role: 'Community Manager',
    content: 'Planning a creator workshop next week. Drop topics you want covered.',
    tags: ['community', 'events'],
    likes: 24,
    comments: ['Content strategy for short video please.'],
    time: '6h ago',
  },
]

const initialMessages = [
  {
    id: 1,
    name: 'Design Team',
    status: 'online',
    messages: [
      { from: 'them', text: 'Can we lock the icon set today?' },
      { from: 'me', text: 'Yes. I will send final assets in 20 mins.' },
    ],
  },
  {
    id: 2,
    name: 'Growth Squad',
    status: 'away',
    messages: [
      { from: 'them', text: 'Need copy review for campaign #17.' },
      { from: 'me', text: 'I can review after standup.' },
    ],
  },
]

const initialUsers = [
  { id: 'U-001', name: 'Lena Tran', email: 'lena@social.app', role: 'user', status: 'active' },
  { id: 'U-002', name: 'Huy Nguyen', email: 'huy@social.app', role: 'moderator', status: 'active' },
  { id: 'U-003', name: 'Mai Pham', email: 'mai@social.app', role: 'user', status: 'suspended' },
  { id: 'U-004', name: 'John Carter', email: 'john@social.app', role: 'user', status: 'active' },
]

const initialReports = [
  {
    id: 'R-101',
    reason: 'Hate speech',
    target: 'Post #8291',
    reporter: 'U-193',
    createdAt: '2026-02-27 14:08',
    severity: 'high',
  },
  {
    id: 'R-102',
    reason: 'Spam links',
    target: 'Comment #552',
    reporter: 'U-876',
    createdAt: '2026-02-27 16:44',
    severity: 'medium',
  },
  {
    id: 'R-103',
    reason: 'Fake profile',
    target: 'User U-559',
    reporter: 'U-302',
    createdAt: '2026-02-28 08:22',
    severity: 'low',
  },
]

function App() {
  const [mode, setMode] = useState('user')
  const [userPage, setUserPage] = useState('feed')
  const [adminPage, setAdminPage] = useState('dashboard')

  const [posts, setPosts] = useState(initialPosts)
  const [draftPost, setDraftPost] = useState('')
  const [postFilter, setPostFilter] = useState('all')
  const [searchText, setSearchText] = useState('')

  const [threads, setThreads] = useState(initialMessages)
  const [activeThreadId, setActiveThreadId] = useState(initialMessages[0].id)
  const [draftMessage, setDraftMessage] = useState('')

  const [profile, setProfile] = useState({
    fullName: 'Dang Pham',
    title: 'Fullstack Developer',
    bio: 'Building social products with scalable architecture and clean UX.',
    location: 'Ho Chi Minh City',
    website: 'https://social.app/u/dangpham',
  })

  const [users, setUsers] = useState(initialUsers)
  const [userKeyword, setUserKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [reports, setReports] = useState(initialReports)

  const totalLikes = useMemo(() => posts.reduce((sum, p) => sum + p.likes, 0), [posts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const tagMatched = postFilter === 'all' || post.tags.includes(postFilter)
      const keywordMatched =
        searchText.trim() === '' ||
        post.author.toLowerCase().includes(searchText.toLowerCase()) ||
        post.content.toLowerCase().includes(searchText.toLowerCase())
      return tagMatched && keywordMatched
    })
  }, [posts, postFilter, searchText])

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? threads[0],
    [threads, activeThreadId],
  )

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const roleMatched = roleFilter === 'all' || item.role === roleFilter
      const keywordMatched =
        userKeyword.trim() === '' ||
        item.name.toLowerCase().includes(userKeyword.toLowerCase()) ||
        item.email.toLowerCase().includes(userKeyword.toLowerCase())
      return roleMatched && keywordMatched
    })
  }, [users, roleFilter, userKeyword])

  const handleCreatePost = (event) => {
    event.preventDefault()
    const content = draftPost.trim()
    if (!content) return

    const nextPost = {
      id: Date.now(),
      author: profile.fullName,
      role: profile.title,
      content,
      tags: ['general'],
      likes: 0,
      comments: [],
      time: 'just now',
    }

    setPosts((prev) => [nextPost, ...prev])
    setDraftPost('')
  }

  const handleLikePost = (postId) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
  }

  const handleAddComment = (postId, commentText) => {
    const text = commentText.trim()
    if (!text) return

    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, text] } : post)),
    )
  }

  const handleSendMessage = (event) => {
    event.preventDefault()
    const text = draftMessage.trim()
    if (!text) return

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThread.id
          ? { ...thread, messages: [...thread.messages, { from: 'me', text }] }
          : thread,
      ),
    )
    setDraftMessage('')
  }

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const toggleUserStatus = (id) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'active' ? 'suspended' : 'active' }
          : item,
      ),
    )
  }

  const promoteToModerator = (id) => {
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, role: 'moderator' } : item)))
  }

  const resolveReport = (id) => {
    setReports((prev) => prev.filter((report) => report.id !== id))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="brand">Social App UI</h1>
        <p className="muted">Frontend standard kit: user + admin</p>

        <div className="mode-switch" role="tablist" aria-label="Mode switch">
          <button className={mode === 'user' ? 'active' : ''} onClick={() => setMode('user')}>
            User
          </button>
          <button className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}>
            Admin
          </button>
        </div>

        {mode === 'user' ? (
          <nav className="menu">
            <button className={userPage === 'feed' ? 'active' : ''} onClick={() => setUserPage('feed')}>
              Feed
            </button>
            <button className={userPage === 'discover' ? 'active' : ''} onClick={() => setUserPage('discover')}>
              Discover
            </button>
            <button className={userPage === 'messages' ? 'active' : ''} onClick={() => setUserPage('messages')}>
              Messages
            </button>
            <button className={userPage === 'profile' ? 'active' : ''} onClick={() => setUserPage('profile')}>
              Profile
            </button>
          </nav>
        ) : (
          <nav className="menu">
            <button className={adminPage === 'dashboard' ? 'active' : ''} onClick={() => setAdminPage('dashboard')}>
              Dashboard
            </button>
            <button className={adminPage === 'users' ? 'active' : ''} onClick={() => setAdminPage('users')}>
              User Management
            </button>
            <button className={adminPage === 'reports' ? 'active' : ''} onClick={() => setAdminPage('reports')}>
              Moderation Queue
            </button>
            <button className={adminPage === 'settings' ? 'active' : ''} onClick={() => setAdminPage('settings')}>
              Platform Settings
            </button>
          </nav>
        )}
      </aside>

      <main className="main-content">
        {mode === 'user' && userPage === 'feed' && (
          <section>
            <header className="section-header">
              <h2>Community Feed</h2>
              <div className="badge">Total likes: {totalLikes}</div>
            </header>

            <form className="composer" onSubmit={handleCreatePost}>
              <textarea
                value={draftPost}
                onChange={(event) => setDraftPost(event.target.value)}
                placeholder="Share something with your network..."
              />
              <button type="submit">Post</button>
            </form>

            <div className="toolbar">
              <input
                type="text"
                placeholder="Search posts"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
              <select value={postFilter} onChange={(event) => setPostFilter(event.target.value)}>
                <option value="all">All tags</option>
                <option value="design">Design</option>
                <option value="ux">UX</option>
                <option value="frontend">Frontend</option>
                <option value="performance">Performance</option>
                <option value="community">Community</option>
                <option value="events">Events</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="stack">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onLike={handleLikePost} onComment={handleAddComment} />
              ))}
              {filteredPosts.length === 0 && <p className="empty-state">No posts matched your search.</p>}
            </div>
          </section>
        )}

        {mode === 'user' && userPage === 'discover' && (
          <section>
            <header className="section-header">
              <h2>Discover</h2>
              <p className="muted">Explore communities, creators, and trends.</p>
            </header>

            <div className="grid two-cols">
              <article className="panel">
                <h3>Trending Communities</h3>
                <ul className="list">
                  <li>#frontend-architecture - 14.2k members</li>
                  <li>#ai-builders - 8.6k members</li>
                  <li>#product-growth - 7.9k members</li>
                  <li>#design-systems - 6.3k members</li>
                </ul>
              </article>

              <article className="panel">
                <h3>Suggested People</h3>
                <ul className="list spaced">
                  <li>
                    <span>Quynh Le - Data Analyst</span>
                    <button type="button">Follow</button>
                  </li>
                  <li>
                    <span>Minh Vu - Backend Lead</span>
                    <button type="button">Follow</button>
                  </li>
                  <li>
                    <span>Sarah Kim - Product Manager</span>
                    <button type="button">Follow</button>
                  </li>
                </ul>
              </article>
            </div>
          </section>
        )}

        {mode === 'user' && userPage === 'messages' && (
          <section>
            <header className="section-header">
              <h2>Messages</h2>
              <p className="muted">Real-time chat UI scaffold for API integration.</p>
            </header>

            <div className="chat-layout">
              <aside className="panel">
                <h3>Conversations</h3>
                <div className="thread-list">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      className={thread.id === activeThread.id ? 'thread active' : 'thread'}
                      onClick={() => setActiveThreadId(thread.id)}
                    >
                      <span>{thread.name}</span>
                      <small>{thread.status}</small>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="panel chat-panel">
                <h3>{activeThread.name}</h3>
                <div className="chat-box">
                  {activeThread.messages.map((message, index) => (
                    <p key={`${activeThread.id}-${index}`} className={message.from === 'me' ? 'bubble me' : 'bubble them'}>
                      {message.text}
                    </p>
                  ))}
                </div>

                <form className="chat-form" onSubmit={handleSendMessage}>
                  <input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    type="text"
                    placeholder="Type your message"
                  />
                  <button type="submit">Send</button>
                </form>
              </div>
            </div>
          </section>
        )}

        {mode === 'user' && userPage === 'profile' && (
          <section>
            <header className="section-header">
              <h2>Profile Settings</h2>
              <p className="muted">Editable profile form with controlled state.</p>
            </header>

            <form className="grid two-cols" onSubmit={(event) => event.preventDefault()}>
              <label className="field">
                Full name
                <input
                  value={profile.fullName}
                  onChange={(event) => handleProfileChange('fullName', event.target.value)}
                />
              </label>
              <label className="field">
                Job title
                <input value={profile.title} onChange={(event) => handleProfileChange('title', event.target.value)} />
              </label>
              <label className="field">
                Location
                <input
                  value={profile.location}
                  onChange={(event) => handleProfileChange('location', event.target.value)}
                />
              </label>
              <label className="field">
                Website
                <input
                  value={profile.website}
                  onChange={(event) => handleProfileChange('website', event.target.value)}
                />
              </label>
              <label className="field full">
                Bio
                <textarea
                  value={profile.bio}
                  onChange={(event) => handleProfileChange('bio', event.target.value)}
                />
              </label>
              <div className="actions full">
                <button type="button">Save Profile</button>
              </div>
            </form>
          </section>
        )}

        {mode === 'admin' && adminPage === 'dashboard' && (
          <section>
            <header className="section-header">
              <h2>Admin Dashboard</h2>
              <p className="muted">High-level monitoring for platform health.</p>
            </header>

            <div className="grid four-cols">
              <StatCard label="Daily Active Users" value="24,981" delta="+8.1%" />
              <StatCard label="New Signups" value="1,304" delta="+3.2%" />
              <StatCard label="Reported Content" value={String(reports.length)} delta="-12.0%" />
              <StatCard label="Avg Response SLA" value="18m" delta="+1.4%" />
            </div>

            <div className="grid two-cols">
              <article className="panel">
                <h3>Weekly Activity</h3>
                <div className="bars">
                  {[42, 58, 64, 61, 73, 80, 77].map((value, index) => (
                    <div key={index} className="bar-wrap">
                      <div className="bar" style={{ height: `${value}%` }} />
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <h3>System Notice</h3>
                <ul className="list">
                  <li>Content scan pipeline healthy, 99.94% uptime.</li>
                  <li>Queue backlog under threshold for 4 consecutive days.</li>
                  <li>Recommendation model v3 scheduled for rollout Monday.</li>
                </ul>
              </article>
            </div>
          </section>
        )}

        {mode === 'admin' && adminPage === 'users' && (
          <section>
            <header className="section-header">
              <h2>User Management</h2>
              <p className="muted">Search, filter, and apply moderation actions.</p>
            </header>

            <div className="toolbar">
              <input
                type="text"
                placeholder="Search by name or email"
                value={userKeyword}
                onChange={(event) => setUserKeyword(event.target.value)}
              />
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All roles</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.role}</td>
                      <td>
                        <span className={`pill ${item.status}`}>{item.status}</span>
                      </td>
                      <td className="table-actions">
                        <button type="button" onClick={() => toggleUserStatus(item.id)}>
                          {item.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button type="button" onClick={() => promoteToModerator(item.id)}>
                          Promote
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {mode === 'admin' && adminPage === 'reports' && (
          <section>
            <header className="section-header">
              <h2>Moderation Queue</h2>
              <p className="muted">Triage and resolve user reports.</p>
            </header>

            <div className="stack">
              {reports.map((report) => (
                <article className="panel" key={report.id}>
                  <div className="report-header">
                    <h3>{report.id}</h3>
                    <span className={`pill ${report.severity}`}>{report.severity}</span>
                  </div>
                  <p>
                    <strong>Reason:</strong> {report.reason}
                  </p>
                  <p>
                    <strong>Target:</strong> {report.target}
                  </p>
                  <p>
                    <strong>Reporter:</strong> {report.reporter} | <strong>Created:</strong> {report.createdAt}
                  </p>
                  <div className="actions">
                    <button type="button" onClick={() => resolveReport(report.id)}>
                      Mark resolved
                    </button>
                    <button type="button" className="secondary">
                      Escalate
                    </button>
                  </div>
                </article>
              ))}
              {reports.length === 0 && <p className="empty-state">No pending reports in queue.</p>}
            </div>
          </section>
        )}

        {mode === 'admin' && adminPage === 'settings' && (
          <section>
            <header className="section-header">
              <h2>Platform Settings</h2>
              <p className="muted">Configuration UI for governance and safety.</p>
            </header>

            <div className="grid two-cols">
              <article className="panel">
                <h3>Security Controls</h3>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Require 2FA for moderators</span>
                </label>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Auto-lock suspicious sessions</span>
                </label>
                <label className="toggle">
                  <input type="checkbox" />
                  <span>Allow legacy API tokens</span>
                </label>
              </article>

              <article className="panel">
                <h3>Content Policy</h3>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Block prohibited terms automatically</span>
                </label>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Send high-risk reports to priority queue</span>
                </label>
                <label className="toggle">
                  <input type="checkbox" />
                  <span>Enable creator pre-moderation mode</span>
                </label>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function PostCard({ post, onLike, onComment }) {
  const [commentText, setCommentText] = useState('')

  const submitComment = (event) => {
    event.preventDefault()
    onComment(post.id, commentText)
    setCommentText('')
  }

  return (
    <article className="panel post-card">
      <header className="post-header">
        <div>
          <h3>{post.author}</h3>
          <p className="muted">{post.role}</p>
        </div>
        <small className="muted">{post.time}</small>
      </header>

      <p>{post.content}</p>

      <div className="tags">
        {post.tags.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      <div className="actions">
        <button type="button" onClick={() => onLike(post.id)}>
          Like ({post.likes})
        </button>
      </div>

      <ul className="list">
        {post.comments.map((comment, index) => (
          <li key={`${post.id}-${index}`}>{comment}</li>
        ))}
      </ul>

      <form className="comment-form" onSubmit={submitComment}>
        <input
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          type="text"
          placeholder="Write a comment"
        />
        <button type="submit">Comment</button>
      </form>
    </article>
  )
}

function StatCard({ label, value, delta }) {
  return (
    <article className="panel stat-card">
      <p className="muted">{label}</p>
      <h3>{value}</h3>
      <span className="delta">{delta}</span>
    </article>
  )
}

export default App