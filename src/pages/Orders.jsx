import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Trash2, X } from "lucide-react";
import { Button, IconButton } from "../components/Button";
import ErrorAlert from "../components/ErrorAlert";
import { FormField } from "../components/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "../components/ConfirmProvider";
import { api } from "../api";
import { hasErrors, required } from "../utils/validate";
import { cn } from "@/lib/utils";
import "./pages.css";

function itemId(item) {
  return String(item.id ?? item._id);
}

function customerLabel(c) {
  return c.full_name ?? c.name ?? `Customer #${itemId(c)}`;
}

function productLabel(p) {
  return p.product_name ?? p.name ?? `Product #${itemId(p)}`;
}

function normalizeList(data) {
  return Array.isArray(data) ? data : data.items || [];
}

function validateOrderForm({ customerId, productId, quantity }) {
  return {
    customerId: required(customerId),
    productId: required(productId),
    quantity: required(quantity),
  };
}

function orderCustomerName(o, customerNames) {
  if (o.customer_name) return o.customer_name;

  const id = String(o.customer_id ?? o.customerId ?? o.customer?.id ?? "");
  return (
    o.customer?.full_name ??
    o.customer?.name ??
    customerNames.get(id) ??
    (id || "—")
  );
}

function orderTotalPrice(o) {
  return o.total_amount ?? o.total ?? o.amount ?? "—";
}

function orderTotalQty(o) {
  if (o.total_items != null) return o.total_items;
  if (Array.isArray(o.items)) {
    return o.items.reduce((sum, item) => sum + (Number(item.qty ?? item.quantity) || 0), 0);
  }
  return "—";
}

function orderDisplayId(o) {
  return o.order_id ?? o.id ?? o._id ?? "—";
}

function orderRecordId(o) {
  return o.id ?? o._id;
}

function itemUnitPrice(item) {
  return item.unit_price ?? item.unitPrice ?? item.price ?? "—";
}

function itemTotalPrice(item) {
  if (item.total_price != null) return item.total_price;
  if (item.totalPrice != null) return item.totalPrice;
  if (item.line_total != null) return item.line_total;

  const unit = Number(item.unit_price ?? item.unitPrice ?? item.price);
  const qty = Number(item.qty ?? item.quantity);
  if (!Number.isNaN(unit) && !Number.isNaN(qty)) {
    return (unit * qty).toFixed(2);
  }

  return "—";
}

export default function Orders() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formKey, setFormKey] = useState(0);
  const confirm = useConfirm();

  function loadOrders() {
    setLoading(true);
    setError("");
    api
      .listOrders()
      .then((data) => setItems(normalizeList(data)))
      .catch((e) => setError(e.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }

  function loadOptions() {
    setOptionsLoading(true);
    Promise.all([api.listCustomers(), api.listProducts()])
      .then(([customerData, productData]) => {
        setCustomers(normalizeList(customerData));
        setProducts(normalizeList(productData));
      })
      .catch((e) => setError(e.message || "Failed to load customers or products"))
      .finally(() => setOptionsLoading(false));
  }

  useEffect(() => {
    loadOrders();
    loadOptions();
  }, []);

  const customerNames = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(itemId(c), customerLabel(c)));
    return map;
  }, [customers]);

  function resetForm() {
    setCustomerId("");
    setProductId("");
    setQuantity("1");
    setFieldErrors({});
    setFormKey((k) => k + 1);
  }

  function updateCustomerId(value) {
    setCustomerId(value);
    if (fieldErrors.customerId) {
      setFieldErrors((errs) => ({ ...errs, customerId: "" }));
    }
  }

  function updateProductId(value) {
    setProductId(value);
    if (fieldErrors.productId) {
      setFieldErrors((errs) => ({ ...errs, productId: "" }));
    }
  }

  function updateQuantity(value) {
    setQuantity(value);
    if (fieldErrors.quantity) {
      setFieldErrors((errs) => ({ ...errs, quantity: "" }));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errors = validateOrderForm({ customerId, productId, quantity });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    setError("");

    const payload = {
      customer_id: Number(customerId),
      items: [{ product_id: Number(productId), quantity: Number(quantity) }],
    };

    try {
      await api.createOrder(payload);
      resetForm();
      loadOrders();
    } catch (e2) {
      setError(e2.message || "Create order failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(o) {
    const displayId = orderDisplayId(o);
    const recordId = orderRecordId(o);

    await confirm({
      title: "Delete order",
      message: (
        <>
          Are you sure you want to delete order{" "}
          <strong>{displayId}</strong> for{" "}
          <strong>{orderCustomerName(o, customerNames)}</strong>? This action cannot
          be undone.
        </>
      ),
      onConfirm: async () => {
        setError("");
        await api.deleteOrder(recordId);
        if (viewingOrder && String(orderRecordId(viewingOrder)) === String(recordId)) {
          setViewingOrder(null);
        }
        loadOrders();
      },
      onError: (e) => setError(e.message || "Delete failed"),
    });
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <h1>Orders</h1>
        <p className="muted">Create orders and view details.</p>
      </header>

      <div className="grid2 grid2Equal">
        <form className="card cardStretch" onSubmit={onSubmit} noValidate>
          <h2>Create order</h2>

          <FormField label="Customer" required error={fieldErrors.customerId}>
            <Select
              key={`customer-${formKey}`}
              value={customerId || undefined}
              onValueChange={updateCustomerId}
              disabled={optionsLoading || saving}
            >
              <SelectTrigger className={cn(fieldErrors.customerId && "border-destructive")}>
                <SelectValue placeholder={optionsLoading ? "Loading customers…" : "Select customer"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={itemId(c)} value={itemId(c)}>
                    {customerLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Product" required error={fieldErrors.productId}>
            <Select
              key={`product-${formKey}`}
              value={productId || undefined}
              onValueChange={updateProductId}
              disabled={optionsLoading || saving}
            >
              <SelectTrigger className={cn(fieldErrors.productId && "border-destructive")}>
                <SelectValue placeholder={optionsLoading ? "Loading products…" : "Select product"} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={itemId(p)} value={itemId(p)}>
                    {productLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Quantity" required error={fieldErrors.quantity}>
            <input
              value={quantity}
              onChange={(e) => updateQuantity(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 2"
              disabled={saving}
            />
          </FormField>

          <ErrorAlert message={error} />

          <div className="actions">
            <Button type="submit" loading={saving} disabled={optionsLoading}>
              <Plus size={16} />
              Create
            </Button>
          </div>
        </form>

        <div className="card cardStretch cardListPanel">
          <h2>Orders</h2>

          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && !items.length ? <p className="muted">No orders yet.</p> : null}

          {!!items.length ? (
            <div className="tableWrap tableWrapScroll">
              <table className="table tableOrders">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th className="colCustomer">Customer</th>
                    <th className="colNum">Qty</th>
                    <th className="colNum">Price</th>
                    <th className="colActions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((o) => {
                    const displayId = orderDisplayId(o);
                    const recordId = orderRecordId(o);
                    return (
                      <tr key={recordId}>
                        <td>{displayId}</td>
                        <td className="colCustomer">{orderCustomerName(o, customerNames)}</td>
                        <td className="colNum">{orderTotalQty(o)}</td>
                        <td className="colNum">{orderTotalPrice(o)}</td>
                        <td className="colActions">
                          <div className="rowActions">
                            <IconButton
                              className="iconBtn"
                              type="button"
                              title="View details"
                              aria-label="View order details"
                              disabled={saving}
                              onClick={() => setViewingOrder(o)}
                            >
                              <Eye size={15} strokeWidth={2} />
                            </IconButton>
                            <IconButton
                              className="iconBtn iconBtnDanger"
                              type="button"
                              title="Delete"
                              aria-label="Delete order"
                              disabled={saving}
                              onClick={() => onDelete(o)}
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {viewingOrder ? (
        <div className="card">
          <div className="cardHeaderRow">
            <h2>
              Order details — #{orderDisplayId(viewingOrder)} ·{" "}
              {orderCustomerName(viewingOrder, customerNames)} (
              {orderTotalPrice(viewingOrder)})
            </h2>
            <IconButton
              className="iconBtn"
              type="button"
              title="Close"
              aria-label="Close order details"
              onClick={() => setViewingOrder(null)}
            >
              <X size={15} strokeWidth={2} />
            </IconButton>
          </div>
          {viewingOrder.items?.length ? (
            <div className="tableWrap">
              <table className="table tableOrderItems">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="colSku">SKU</th>
                    <th className="colNum">Qty</th>
                    <th className="colNum">Unit price</th>
                    <th className="colNum">Total price</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingOrder.items.map((item, index) => (
                    <tr key={item.sku ?? item.sku_code ?? item.product_name ?? index}>
                      <td>{item.product_name ?? item.name ?? "—"}</td>
                      <td className="colSku">{item.sku ?? item.sku_code ?? "—"}</td>
                      <td className="colNum">{item.qty ?? item.quantity ?? "—"}</td>
                      <td className="colNum">{itemUnitPrice(item)}</td>
                      <td className="colNum">{itemTotalPrice(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No items in this order.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
