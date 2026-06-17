import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, IconButton } from '../components/Button'
import ErrorAlert from '../components/ErrorAlert'
import { FormField } from '../components/FormField'
import { useConfirm } from '../components/ConfirmProvider'
import { api } from '../api'
import { hasErrors, phoneNumberDigits, required } from '../utils/validate'
import './pages.css'

const PHONE_PREFIX = '+91'
const emptyForm = { full_name: '', email: '', phone_number: '' }

function validateCustomerForm(form) {
  return {
    full_name: required(form.full_name),
    email: required(form.email),
    phone_number: phoneNumberDigits(form.phone_number),
  }
}

function customerName(c) {
  return c.full_name ?? c.name ?? '—'
}

function formatPhoneNumber(phone) {
  if (!phone) return '—'
  const s = String(phone).trim()
  if (s.startsWith('+91') && s.length > 3 && s[3] !== ' ') {
    return `+91 ${s.slice(3)}`
  }
  return s
}

export default function Customers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const confirm = useConfirm()

  function load() {
    setLoading(true)
    setError('')
    api
      .listCustomers()
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []))
      .catch((e) => setError(e.message || 'Failed to load customers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors((errs) => ({ ...errs, [key]: '' }))
    }
  }

  function updatePhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    updateField('phone_number', digits)
  }

  async function onSubmit(e) {
    e.preventDefault()
    const errors = validateCustomerForm(form)
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    setSaving(true)
    setError('')

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone_number: `${PHONE_PREFIX}${form.phone_number.trim()}`,
    }

    try {
      await api.createCustomer(payload)
      setForm(emptyForm)
      setFieldErrors({})
      load()
    } catch (e2) {
      setError(e2.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(c) {
    const name = customerName(c) === '—' ? 'this customer' : customerName(c)
    const id = c.id ?? c._id

    await confirm({
      title: 'Delete customer',
      message: (
        <>
          Are you sure you want to delete <strong>{name}</strong>? This action
          cannot be undone.
        </>
      ),
      onConfirm: async () => {
        setError('')
        await api.deleteCustomer(id)
        load()
      },
      onError: (e) => setError(e.message || 'Delete failed'),
    })
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <h1>Customers</h1>
        <p className="muted">Add customers and manage the list.</p>
      </header>

      <div className="grid2">
        <form className="card" onSubmit={onSubmit} noValidate>
          <h2>Add customer</h2>

          <FormField label="Full name" required error={fieldErrors.full_name}>
            <input
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </FormField>

          <FormField label="Email" required error={fieldErrors.email}>
            <input
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              type="email"
              placeholder="jane@example.com"
            />
          </FormField>

          <FormField label="Phone number" required error={fieldErrors.phone_number}>
            <div className="phoneInput">
              <span className="phonePrefix">{PHONE_PREFIX}</span>
              <input
                value={form.phone_number}
                onChange={(e) => updatePhone(e.target.value)}
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
          </FormField>

          <ErrorAlert message={error} />

          <div className="actions">
            <Button type="submit" loading={saving}>
              <Plus size={16} />
              Add
            </Button>
          </div>
        </form>

        <div className="card">
          <h2>Customer list</h2>

          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && !items.length ? (
            <p className="muted">No customers yet.</p>
          ) : null}

          {!!items.length ? (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th className="colActions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id ?? c._id ?? c.email ?? c.full_name ?? c.name}>
                      <td>{customerName(c)}</td>
                      <td>{c.email ?? '—'}</td>
                      <td>{formatPhoneNumber(c.phone_number ?? c.phone)}</td>
                      <td className="colActions">
                        <div className="rowActions">
                          <IconButton
                            className="iconBtn iconBtnDanger"
                            type="button"
                            title="Delete"
                            aria-label="Delete customer"
                            disabled={saving}
                            onClick={() => onDelete(c)}
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
