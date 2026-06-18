import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Package, ShoppingCart, Users } from "lucide-react";
import ErrorAlert from "../components/ErrorAlert";
import { api } from "../api";
import "./pages.css";

function productId(p) {
  return p.id ?? p._id ?? p.sku_code ?? p.product_name;
}

function stockLevel(qty) {
  const n = Number(qty);
  if (Number.isNaN(n)) return "stockUnknown";
  if (n <= 1) return "stockCritical";
  if (n <= 5) return "stockLow";
  return "stockOk";
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .dashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const lowStock = data.low_stock_products ?? data.lowStockProducts ?? data.lowStock ?? [];
    return {
      totalProducts: data.total_products ?? data.totalProducts ?? data.products ?? 0,
      totalCustomers: data.total_customers ?? data.totalCustomers ?? data.customers ?? 0,
      totalOrders: data.total_orders ?? data.totalOrders ?? data.orders ?? 0,
      lowStock: Array.isArray(lowStock) ? lowStock : [],
    };
  }, [data]);

  const statCards = stats
    ? [
        {
          label: "Total products",
          value: stats.totalProducts,
          icon: Package,
          to: "/products",
        },
        {
          label: "Total customers",
          value: stats.totalCustomers,
          icon: Users,
          to: "/customers",
        },
        {
          label: "Total orders",
          value: stats.totalOrders,
          icon: ShoppingCart,
          to: "/orders",
        },
      ]
    : [];

  return (
    <section className="page">
      <header className="pageHeader">
        <h1>Dashboard</h1>
        <p className="muted">Summary across products, customers, and orders.</p>
      </header>

      {loading ? <div className="card">Loading…</div> : null}

      {error ? (
        <div className="card">
          <ErrorAlert message={error} />
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="dashboardStats">
            {statCards.map(({ label, value, icon: Icon, to }) => (
              <Link key={label} to={to} className="dashboardStatCard">
                <div className="dashboardStatIcon">
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className="dashboardStatBody">
                  <div className="dashboardStatLabel">{label}</div>
                  <div className="dashboardStatValue">{value}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="card">
            <div className="dashboardSectionHeader">
              <div className="dashboardSectionTitle">
                <h2>Low stock products</h2>
                <p className="text-xs text-muted">Considered any stock quantity below 10 units as low stock.</p>
              </div>
              {stats.lowStock.length ? <span className="dashboardBadge">{stats.lowStock.length} items</span> : null}
            </div>

            {stats.lowStock.length ? (
              <div className="tableWrap">
                <table className="table tableLowStock">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="colNum">Qty</th>
                      <th className="colNum">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStock.map((p) => {
                      const qty = p.available_qty ?? p.stock ?? p.quantity;
                      return (
                        <tr key={productId(p)}>
                          <td>{p.product_name ?? p.name ?? "—"}</td>
                          <td className="colSku">{p.sku_code ?? p.sku ?? "—"}</td>
                          <td className="colNum">
                            <span className={`stockBadge ${stockLevel(qty)}`}>{qty ?? "—"}</span>
                          </td>
                          <td className="colNum">{p.price ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted dashboardEmpty">
                <AlertTriangle size={15} strokeWidth={2} />
                No low stock products.
              </p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
