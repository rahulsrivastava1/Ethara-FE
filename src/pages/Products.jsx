import { useEffect, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { Button, IconButton } from '../components/Button'
import ErrorAlert from '../components/ErrorAlert'
import { FormField } from '../components/FormField'
import { useConfirm } from '../components/ConfirmProvider'
import { useToast } from '../components/ToastProvider'
import { api } from '../api'
import { hasErrors, required } from '../utils/validate'
import './pages.css'

const emptyForm = { product_name: '', sku_code: '', price: '', available_qty: '' }

function validateProductForm(form) {
  return {
    product_name: required(form.product_name),
    sku_code: required(form.sku_code),
    price: required(form.price),
    available_qty: required(form.available_qty),
  }
}

export default function Products() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  function load() {
    setLoading(true)
    setError('')
    api
      .listProducts()
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []))
      .catch((e) => setError(e.message || 'Failed to load products'))
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

  function startEdit(p) {
    setEditing(p)
    setFieldErrors({})
    setForm({
      product_name: p.product_name ?? p.name ?? '',
      sku_code: p.sku_code ?? p.sku ?? '',
      price: p.price != null ? String(p.price) : '',
      available_qty:
        p.available_qty != null
          ? String(p.available_qty)
          : p.stock != null
            ? String(p.stock)
            : p.quantity != null
              ? String(p.quantity)
              : '',
    })
  }

  function reset() {
    setEditing(null)
    setForm(emptyForm)
    setFieldErrors({})
  }

  async function onSubmit(e) {
    e.preventDefault()
    const errors = validateProductForm(form)
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    setSaving(true)
    setError('')

    const payload = {
      product_name: form.product_name.trim(),
      sku_code: form.sku_code.trim(),
      price: form.price.trim(),
      available_qty: Number(form.available_qty),
    }

    try {
      if (editing) {
        const id = editing.id ?? editing._id
        await api.updateProduct(id, payload)
      } else {
        await api.createProduct(payload)
      }
      reset()
      load()
      toast.success(editing ? 'Product updated successfully.' : 'Product created successfully.')
    } catch (e2) {
      setError(e2.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(p) {
    const name = p.product_name ?? p.name ?? 'this product'
    const id = p.id ?? p._id

    await confirm({
      title: 'Delete product',
      message: (
        <>
          Are you sure you want to delete <strong>{name}</strong>? This action
          cannot be undone.
        </>
      ),
      onConfirm: async () => {
        setError('')
        await api.deleteProduct(id)
        load()
      },
      onError: (e) => setError(e.message || 'Delete failed'),
    })
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <h1>Products</h1>
        <p className="muted">Add, update, and delete products.</p>
      </header>

      <div className="grid2 grid2Equal">
        <form className="card cardStretch" onSubmit={onSubmit} noValidate>
          <h2>{editing ? 'Update product' : 'Add product'}</h2>

          <FormField label="Product name" required error={fieldErrors.product_name}>
            <input
              value={form.product_name}
              onChange={(e) => updateField('product_name', e.target.value)}
              placeholder="e.g. Widget"
            />
          </FormField>

          <FormField label="SKU code" required error={fieldErrors.sku_code}>
            <input
              value={form.sku_code}
              onChange={(e) => updateField('sku_code', e.target.value)}
              placeholder="e.g. WDG-001"
            />
          </FormField>

          <div className="fieldRow">
            <FormField label="Price" required error={fieldErrors.price}>
              <input
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 19.99"
              />
            </FormField>
            <FormField label="Available qty" required error={fieldErrors.available_qty}>
              <input
                value={form.available_qty}
                onChange={(e) => updateField('available_qty', e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 10"
              />
            </FormField>
          </div>

          <ErrorAlert message={error} />

          <div className="actions">
            <Button type="submit" loading={saving}>
              {editing ? (
                <>
                  <Save size={16} />
                  Update
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add
                </>
              )}
            </Button>
            {editing ? (
              <Button
                type="button"
                className="secondary"
                onClick={reset}
                disabled={saving}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        <div className="card cardStretch cardListPanel">
          <h2>Product list</h2>

          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && !items.length ? (
            <p className="muted">No products yet.</p>
          ) : null}

          {!!items.length ? (
            <div className="tableWrap tableWrapScroll">
              <table className="table tableProducts">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th className="colNum">Qty</th>
                    <th className="colNum">Price</th>
                    <th className="colActions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id ?? p._id ?? p.sku_code ?? p.product_name}>
                      <td>{p.product_name ?? p.name ?? '—'}</td>
                      <td>{p.sku_code ?? p.sku ?? '—'}</td>
                      <td className="colNum">
                        {p.available_qty ?? p.stock ?? p.quantity ?? '—'}
                      </td>
                      <td className="colNum">{p.price ?? '—'}</td>
                      <td className="colActions">
                        <div className="rowActions">
                          <IconButton
                            className="iconBtn"
                            type="button"
                            title="Edit"
                            aria-label="Edit product"
                            disabled={saving}
                            onClick={() => startEdit(p)}
                          >
                            <Pencil size={15} strokeWidth={2} />
                          </IconButton>
                          <IconButton
                            className="iconBtn iconBtnDanger"
                            type="button"
                            title="Delete"
                            aria-label="Delete product"
                            disabled={saving}
                            onClick={() => onDelete(p)}
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
