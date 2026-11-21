// In-memory / LocalStorage database for frontend demo/mock mode
const STORAGE_PREFIX = 'letters_mock_'

function getStored(key, defaults) {
  const data = localStorage.getItem(STORAGE_PREFIX + key)
  if (data) return JSON.parse(data)
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(defaults))
  return defaults
}

function setStored(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
}

// Initial seed data
const defaultUsers = [
  { id: 1, display_name: 'John Doe (Admin)', role: 'admin', email: 'admin@example.com', active: true, signature_png: null },
  { id: 2, display_name: 'Jane Smith (Manager)', role: 'manager', email: 'manager@example.com', active: true, signature_png: null },
  { id: 3, display_name: 'Bob Johnson (Staff)', role: 'staff', email: 'staff@example.com', active: true, signature_png: null }
]

const defaultCompanies = [
  { id: 1, name: 'Acme Corporation' },
  { id: 2, name: 'Globex Industries' },
  { id: 3, name: 'Initech Services' }
]

const defaultFormats = [
  {
    id: 1,
    name: 'General Proposal Template',
    letter_type: 'Proposal',
    company_id: 1,
    all_companies: false,
    plain_letterhead: false,
    no_signature: false,
    signatory: 'John Doe (Admin)',
    signature_style: 'both',
    approvals: 1,
    approver_1: 'Jane Smith (Manager)',
    status: 'active',
    field_keys: JSON.stringify(['subject', 'amount', 'proposal_details']),
    table_headers: JSON.stringify({
      amount: { orientation: 'cols', labels: ['Item', 'Description', 'Value'] }
    })
  },
  {
    id: 2,
    name: 'Employment Offer Letter',
    letter_type: 'HR',
    company_id: 2,
    all_companies: true,
    plain_letterhead: true,
    no_signature: false,
    signatory: 'Jane Smith (Manager)',
    signature_style: 'digital',
    approvals: 0,
    status: 'active',
    field_keys: JSON.stringify(['subject', 'candidate_name', 'salary', 'start_date']),
    table_headers: '{}'
  },
  {
    id: 3,
    name: 'Non-Disclosure Agreement',
    letter_type: 'Legal',
    company_id: null,
    all_companies: true,
    plain_letterhead: false,
    no_signature: true,
    status: 'pending',
    field_keys: JSON.stringify(['subject', 'party_name', 'duration']),
    table_headers: '{}'
  }
]

const defaultFields = [
  { id: 1, key: 'subject', label: 'Subject', type: 'text', description: 'Subject of the letter', example: 'Offer of Employment', category: 'General' },
  { id: 2, key: 'candidate_name', label: 'Candidate Name', type: 'text', description: 'Full name of the job candidate', example: 'Alice Wonderland', category: 'HR' },
  { id: 3, key: 'salary', label: 'Salary (Annual)', type: 'number', description: 'Proposed annual salary in USD', example: '85000', category: 'HR' },
  { id: 4, key: 'start_date', label: 'Start Date', type: 'date', description: 'First day of employment', example: '2026-09-01', category: 'HR' },
  { id: 5, key: 'amount', label: 'Pricing Table', type: 'table', description: 'List of items with costs', example: 'Table data', category: 'General' },
  { id: 6, key: 'proposal_details', label: 'Proposal Details', type: 'textarea', description: 'Detailed paragraphs about the proposal', example: 'We propose to supply...', category: 'General' }
]

const defaultLetters = [
  {
    id: 1,
    ref_no: 'ACME/2026/0001',
    subject: 'Supply Chain Partnership Agreement',
    recipient_email: 'vendor@external.com',
    valid_till: '2026-12-31',
    signatory: 'John Doe (Admin)',
    company_id: 1,
    field_values: { subject: 'Supply Chain Partnership Agreement' },
    status: 'Signed',
    creator: 'John Doe (Admin)',
    created_at: '2026-08-27T10:00:00Z'
  },
  {
    id: 2,
    ref_no: 'GLOBEX/2026/0002',
    subject: 'Senior Developer Offer - Alice Wonderland',
    recipient_email: 'alice@wonderland.com',
    valid_till: '2026-09-15',
    signatory: 'Jane Smith (Manager)',
    company_id: 2,
    field_values: { subject: 'Senior Developer Offer - Alice Wonderland', candidate_name: 'Alice Wonderland', salary: '120000', start_date: '2026-10-01' },
    status: 'Pending Signature',
    creator: 'Jane Smith (Manager)',
    created_at: '2026-08-28T09:00:00Z'
  },
  {
    id: 3,
    ref_no: 'INITECH/2026/0003',
    subject: 'Office Lease Extension 2026',
    recipient_email: 'landlord@property.com',
    valid_till: '2026-10-01',
    signatory: 'John Doe (Admin)',
    company_id: 3,
    field_values: { subject: 'Office Lease Extension 2026' },
    status: 'Pending Approval',
    creator: 'Bob Johnson (Staff)',
    created_at: '2026-08-28T08:30:00Z'
  }
]

const defaultAudit = [
  { id: 1, created_at: '2026-08-27T10:05:00Z', user: { display_name: 'John Doe (Admin)' }, event: 'Signed letter ACME/2026/0001' },
  { id: 2, created_at: '2026-08-28T09:02:00Z', user: { display_name: 'Jane Smith (Manager)' }, event: 'Created HR template' },
  { id: 3, created_at: '2026-08-28T09:15:00Z', user: { display_name: 'Jane Smith (Manager)' }, event: 'Generated letter GLOBEX/2026/0002' }
]

// Database loading helper
function getDb() {
  return {
    users: getStored('users', defaultUsers),
    companies: getStored('companies', defaultCompanies),
    formats: getStored('formats', defaultFormats),
    fields: getStored('fields', defaultFields),
    letters: getStored('letters', defaultLetters),
    audit: getStored('audit', defaultAudit)
  }
}

function saveDb(db) {
  setStored('users', db.users)
  setStored('companies', db.companies)
  setStored('formats', db.formats)
  setStored('fields', db.fields)
  setStored('letters', db.letters)
  setStored('audit', db.audit)
}

function getCurrentUser(token) {
  const db = getDb()
  if (token === 'dummy-token-manager') return db.users.find(u => u.id === 2)
  if (token === 'dummy-token-staff') return db.users.find(u => u.id === 3)
  return db.users.find(u => u.id === 1) // default admin
}

// Log an audit event
function logAudit(event, user) {
  const db = getDb()
  const newLog = {
    id: db.audit.length ? Math.max(...db.audit.map(x => x.id)) + 1 : 1,
    created_at: new Date().toISOString(),
    user: { display_name: user?.display_name || 'System' },
    event
  }
  db.audit.unshift(newLog)
  saveDb(db)
}

// Custom Axios Adapter for Mocking
export default function mockAdapter(config) {
  return new Promise((resolve, reject) => {
    // Extract token
    let token = localStorage.getItem('letters_token')
    const authHeader = config.headers?.Authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    const currentUser = getCurrentUser(token)
    const db = getDb()
    const url = config.url.replace(/^\/?/, '/') // ensure leading slash
    const method = config.method.toLowerCase()

    // Log request for debugging
    console.log(`[Mock API] ${method.toUpperCase()} ${url}`, config.data)

    // Simulate network delay (200ms) for high fidelity
    setTimeout(() => {
      // 1. Auth Microsoft Enabled
      if (url === '/api/auth/microsoft/enabled') {
        return resolve({ data: { enabled: true }, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 2. Microsoft Auth Redirect
      if (url.startsWith('/auth/microsoft')) {
        // In dummy mode, we can just redirect to the home page with a dummy admin token
        localStorage.setItem('letters_token', 'dummy-token-admin')
        window.location.href = '/?token=dummy-token-admin'
        return
      }

      // 3. Login
      if (url === '/api/auth/login' && method === 'post') {
        const { upn, password } = JSON.parse(config.data || '{}')
        let responseToken = 'dummy-token-admin'
        if (upn === 'manager@example.com' || upn?.includes('manager')) {
          responseToken = 'dummy-token-manager'
        } else if (upn === 'staff@example.com' || upn?.includes('staff')) {
          responseToken = 'dummy-token-staff'
        }
        const loggedUser = getCurrentUser(responseToken)
        logAudit('User logged in via local form', loggedUser)
        return resolve({ data: { token: responseToken }, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 4. Me Profile
      if (url === '/api/users/me' && method === 'get') {
        if (!token) {
          return reject({ response: { status: 401, data: { error: 'Unauthorized' } } })
        }
        return resolve({ data: currentUser, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 5. Signature
      if (url === '/api/users/me/signature' && method === 'get') {
        return resolve({ data: { signature_png: currentUser?.signature_png }, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url === '/api/users/me/signature' && method === 'put') {
        const { signature_png } = JSON.parse(config.data || '{}')
        db.users = db.users.map(u => u.id === currentUser.id ? { ...u, signature_png } : u)
        saveDb(db)
        logAudit('Updated signature', currentUser)
        return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 6. Companies
      if (url === '/api/companies' && method === 'get') {
        return resolve({ data: db.companies, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 7. Dashboard Stats
      if (url === '/api/dashboard' && method === 'get') {
        const awaiting = db.letters.filter(l => {
          if (l.status === 'Pending Approval') return true
          if (l.status === 'Pending Signature' && l.signatory === currentUser.display_name) return true
          return false
        })
        const signed = db.letters.filter(l => l.status === 'Signed' || l.status === 'Sent')
        const sent = db.letters.filter(l => l.status === 'Sent')

        const stats = {
          awaiting_me: awaiting.length,
          signed_this_fy: signed.length,
          sent: sent.length,
          total: db.letters.length,
          recent: db.letters.slice(0, 5)
        }
        return resolve({ data: stats, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 8. Formats (Templates)
      if (url === '/api/formats' && method === 'get') {
        return resolve({ data: db.formats, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url.startsWith('/api/formats/') && url.endsWith('/preview') && method === 'get') {
        return resolve({
          data: {
            pages: [
              'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=600&auto=format&fit=crop'
            ]
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        })
      }
      if (url === '/api/formats/inspect' && method === 'post') {
        return resolve({
          data: {
            tables: [{ key: 'amount' }],
            field_keys: ['subject', 'amount', 'proposal_details']
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        })
      }
      if (url === '/api/formats' && method === 'post') {
        let newFormat = {
          id: db.formats.length ? Math.max(...db.formats.map(x => x.id)) + 1 : 1,
          name: 'New Template',
          letter_type: 'General',
          company_id: 1,
          all_companies: false,
          plain_letterhead: false,
          no_signature: false,
          signatory: currentUser.display_name,
          signature_style: 'both',
          approvals: 0,
          status: 'pending',
          field_keys: JSON.stringify(['subject']),
          table_headers: '{}'
        }

        if (config.data instanceof FormData) {
          newFormat.name = config.data.get('name') || newFormat.name
          newFormat.letter_type = config.data.get('letter_type') || newFormat.letter_type
          newFormat.company_id = config.data.get('company_id') ? Number(config.data.get('company_id')) : null
          newFormat.all_companies = config.data.get('all_companies') === '1'
          newFormat.plain_letterhead = config.data.get('plain_letterhead') === '1'
          newFormat.no_signature = config.data.get('no_signature') === '1'
          newFormat.signatory = config.data.get('signatory') || newFormat.signatory
          newFormat.signature_style = config.data.get('signature_style') || newFormat.signature_style
          newFormat.approvals = Number(config.data.get('approvals') || '0')
          newFormat.approver_1 = config.data.get('approver_1') || ''
          
          newFormat.field_keys = JSON.stringify(['subject', 'details'])
        }

        db.formats.push(newFormat)
        saveDb(db)
        logAudit(`Created template: ${newFormat.name}`, currentUser)
        return resolve({ data: newFormat, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url.match(/^\/api\/formats\/\d+\/approve$/) && method === 'post') {
        const id = Number(url.split('/')[3])
        db.formats = db.formats.map(f => f.id === id ? { ...f, status: 'active' } : f)
        saveDb(db)
        logAudit(`Approved template ID ${id}`, currentUser)
        return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 9. Fields (Library)
      if (url === '/api/fields' && method === 'get') {
        return resolve({ data: db.fields, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url === '/api/fields' && method === 'post') {
        const fieldData = JSON.parse(config.data || '{}')
        const newField = {
          id: db.fields.length ? Math.max(...db.fields.map(x => x.id)) + 1 : 1,
          ...fieldData,
          key: (fieldData.label || 'field').toLowerCase().replace(/\s+/g, '_')
        }
        db.fields.push(newField)
        saveDb(db)
        logAudit(`Created field: ${newField.label}`, currentUser)
        return resolve({ data: newField, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url.match(/^\/api\/fields\/\d+$/)) {
        const id = Number(url.split('/')[3])
        if (method === 'put') {
          const fieldData = JSON.parse(config.data || '{}')
          db.fields = db.fields.map(f => f.id === id ? { ...f, ...fieldData } : f)
          saveDb(db)
          logAudit(`Updated field ID ${id}`, currentUser)
          return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
        }
        if (method === 'delete') {
          db.fields = db.fields.filter(f => f.id !== id)
          saveDb(db)
          logAudit(`Deleted field ID ${id}`, currentUser)
          return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
        }
      }

      // 10. Letters
      if (url === '/api/letters' && method === 'post') {
        const payload = JSON.parse(config.data || '{}')
        const format = db.formats.find(f => f.id === payload.format_id) || { name: 'Unknown', approvals: 0, signatory: 'John Doe (Admin)' }
        const company = db.companies.find(c => c.id === (payload.company_id || format.company_id)) || { name: 'Acme Corporation' }
        
        const companyPrefix = company.name.substring(0, 5).toUpperCase()
        const year = new Date().getFullYear()
        const sequence = String(db.letters.length + 1).padStart(4, '0')
        const refNo = `${companyPrefix}/${year}/${sequence}`

        const newLetter = {
          id: db.letters.length ? Math.max(...db.letters.map(x => x.id)) + 1 : 1,
          ref_no: refNo,
          subject: payload.subject || 'Generated Letter',
          recipient_email: payload.recipient_email,
          valid_till: payload.valid_till,
          signatory: payload.signatory || format.signatory,
          company_id: payload.company_id || format.company_id || 1,
          field_values: payload.field_values || {},
          status: format.approvals > 0 ? 'Pending Approval' : 'Pending Signature',
          creator: currentUser.display_name,
          created_at: new Date().toISOString()
        }

        db.letters.unshift(newLetter)
        saveDb(db)
        logAudit(`Generated letter: ${newLetter.ref_no}`, currentUser)
        return resolve({ data: newLetter, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 11. Queues
      if (url === '/api/letters/queues/mine' && method === 'get') {
        const myQueue = db.letters.filter(l => {
          if (l.status === 'Pending Approval') return true
          if (l.status === 'Pending Signature' && l.signatory === currentUser.display_name) return true
          return false
        })
        return resolve({ data: myQueue, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 12. Actions on Letters
      if (url.match(/^\/api\/letters\/\d+\/approve-content$/) && method === 'post') {
        const id = Number(url.split('/')[3])
        db.letters = db.letters.map(l => l.id === id ? { ...l, status: 'Pending Signature' } : l)
        saveDb(db)
        logAudit(`Approved letter content ID ${id}`, currentUser)
        return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url.match(/^\/api\/letters\/\d+\/reject-content$/) && method === 'post') {
        const id = Number(url.split('/')[3])
        const { reason } = JSON.parse(config.data || '{}')
        db.letters = db.letters.map(l => l.id === id ? { ...l, status: 'Rejected', reject_reason: reason } : l)
        saveDb(db)
        logAudit(`Rejected letter content ID ${id}: ${reason}`, currentUser)
        return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url.match(/^\/api\/letters\/\d+\/sign$/) && method === 'post') {
        const id = Number(url.split('/')[3])
        db.letters = db.letters.map(l => l.id === id ? { ...l, status: 'Signed' } : l)
        saveDb(db)
        logAudit(`Signed letter ID ${id}`, currentUser)
        return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url.match(/^\/api\/letters\/\d+\/send$/) && method === 'post') {
        const id = Number(url.split('/')[3])
        const { recipient_email } = JSON.parse(config.data || '{}')
        db.letters = db.letters.map(l => l.id === id ? { ...l, status: 'Sent', recipient_email } : l)
        saveDb(db)
        logAudit(`Sent letter ID ${id} to ${recipient_email}`, currentUser)
        return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 13. Folders
      if (url.startsWith('/api/folders') && method === 'get') {
        const idMatch = url.match(/^\/api\/folders\/(\d+)\/contents$/)
        if (idMatch) {
          const folderId = Number(idMatch[1])
          const letters = db.letters.filter(l => l.id === folderId || l.id % 2 === folderId % 2)
          return resolve({
            data: {
              folders: [],
              letters
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          })
        }
        const cId = Number(new URLSearchParams(url.split('?')[1] || '').get('company_id') || '1')
        const rootFolders = [
          { id: 1, name: 'Archive ' + new Date().getFullYear() },
          { id: 2, name: 'Tender Proposals' },
          { id: 3, name: 'General Correspondence' }
        ]
        return resolve({ data: rootFolders, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 14. PDF and Blobs
      if (url.match(/^\/api\/letters\/\d+\/(pdf|pdf-plain|audit)$/) && method === 'get') {
        const plainText = `DUMMY PDF DOCUMENT\nType: ${url.split('/').pop().toUpperCase()}\nReference: REF-2026\nDate: ${new Date().toLocaleDateString()}`
        const blob = new Blob([plainText], { type: 'application/pdf' })
        return resolve({ data: blob, status: 200, statusText: 'OK', headers: {}, config })
      }

      // 15. Admin Users Endpoints
      if (url === '/api/users' && method === 'get') {
        return resolve({ data: db.users, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url === '/api/users/sync-microsoft' && method === 'post') {
        logAudit('Synced users with Microsoft', currentUser)
        return resolve({ data: { success: true, count: 0 }, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url.match(/^\/api\/users\/\d+\/active$/) && method === 'post') {
        const id = Number(url.split('/')[3])
        const { active } = JSON.parse(config.data || '{}')
        db.users = db.users.map(u => u.id === id ? { ...u, active } : u)
        saveDb(db)
        logAudit(`Toggled user ID ${id} activity to ${active}`, currentUser)
        return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
      }
      if (url.match(/^\/api\/users\/\d+$/)) {
        const id = Number(url.split('/')[3])
        if (method === 'put') {
          const { role } = JSON.parse(config.data || '{}')
          db.users = db.users.map(u => u.id === id ? { ...u, role } : u)
          saveDb(db)
          logAudit(`Updated role for user ID ${id} to ${role}`, currentUser)
          return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
        }
        if (method === 'delete') {
          db.users = db.users.filter(u => u.id !== id)
          saveDb(db)
          logAudit(`Deleted user ID ${id}`, currentUser)
          return resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config })
        }
      }

      // 16. Audit Log
      if (url.startsWith('/api/audit') && method === 'get') {
        return resolve({ data: db.audit, status: 200, statusText: 'OK', headers: {}, config })
      }

      // Fallback: 404 for unhandled mock routes
      console.warn(`[Mock API 404] Unhandled route: ${method.toUpperCase()} ${url}`)
      return reject({ response: { status: 404, data: { error: `Mock API: Path not found: ${url}` } } })
    }, 200)
  })
}
