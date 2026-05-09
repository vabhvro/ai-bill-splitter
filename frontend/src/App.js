import React, { useState, useCallback, useEffect, useRef } from 'react';
import { splitBill, analyseBill, scanBill, getHistory, deleteHistory, clearHistory, sendEmail } from './utils/api';

// ── Design Tokens ──────────────────────────────────────────────
const T = {
  bg: '#F8FAFF',
  surface: '#FFFFFF',
  border: '#E4EAFF',
  primary: '#3B5BDB',
  primaryHover: '#2F4AC7',
  accent: '#845EF7',
  success: '#12B886',
  warning: '#F59F00',
  danger: '#FA5252',
  text: '#1A1D2E',
  sub: '#4A5568',
  muted: '#9AA5B1',
  ink: '#2D3748',
};
const PALETTE = ['#3B5BDB', '#845EF7', '#12B886', '#F59F00', '#FA5252', '#228BE6', '#E64980', '#40C057', '#FD7E14', '#7950F2'];

// ── CSS injected once ──────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; font-family: 'DM Sans', sans-serif; color: ${T.text}; }
  input, select, textarea { font-family: 'DM Sans', sans-serif; }
  input:focus, select:focus, textarea:focus { outline: none; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
  .card-hover { transition: box-shadow .2s, transform .15s; }
  .card-hover:hover { box-shadow: 0 8px 32px rgba(59,91,219,.10); transform: translateY(-1px); }
  .btn-primary { background: ${T.primary}; color: #fff; border: none; border-radius: 10px; padding: 11px 26px; font-weight: 700; font-size: 14px; cursor: pointer; transition: background .15s, transform .1s, box-shadow .15s; font-family: 'DM Sans', sans-serif; box-shadow: 0 2px 12px rgba(59,91,219,.25); }
  .btn-primary:hover:not(:disabled) { background: ${T.primaryHover}; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(59,91,219,.35); }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
  .btn-ghost { background: transparent; border: 1.5px solid ${T.border}; border-radius: 10px; padding: 10px 22px; font-weight: 600; font-size: 14px; cursor: pointer; color: ${T.sub}; transition: all .15s; font-family: 'DM Sans', sans-serif; }
  .btn-ghost:hover { border-color: ${T.primary}; color: ${T.primary}; background: rgba(59,91,219,.04); }
  .input-base { width: 100%; background: ${T.bg}; border: 1.5px solid ${T.border}; border-radius: 10px; padding: 10px 14px; font-size: 14px; font-weight: 500; color: ${T.text}; transition: border-color .15s, box-shadow .15s; }
  .input-base:focus { border-color: ${T.primary}; box-shadow: 0 0 0 3px rgba(59,91,219,.1); }
  .tab-active { background: ${T.primary}; color: #fff; }
  .tab-inactive { background: transparent; color: ${T.sub}; }
  .tab-inactive:hover { background: rgba(59,91,219,.06); color: ${T.primary}; }
  .badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 700; }
  .history-row:hover { background: rgba(59,91,219,.04); }
`;

// ── Utility components ─────────────────────────────────────────
const Avatar = ({ name = '?', color = T.primary, size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: color + '1A', border: `2px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 800, fontSize: size * .38, flexShrink: 0 }}>
    {name[0]?.toUpperCase()}
  </div>
);

const Chip = ({ label, color, onRemove }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: color + '15', border: `1.5px solid ${color}33`, borderRadius: 999, padding: '4px 6px 4px 8px', fontSize: 13, fontWeight: 600, color }}>
    {label}
    {onRemove && <span onClick={onRemove} style={{ cursor: 'pointer', fontWeight: 900, fontSize: 15, lineHeight: 1, color: color + '99', marginLeft: 1 }}>×</span>}
  </span>
);

const Spinner = ({ size = 24, color = T.primary }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', border: `3px solid ${color}22`, borderTop: `3px solid ${color}`, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
);

const Section = ({ title, subtitle, icon, children, action }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
    <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
    <div style={{ padding: '20px 22px' }}>{children}</div>
  </div>
);

const StepBar = ({ step }) => {
  const steps = ['Setup', 'Add Items', 'Results'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13,
              background: i < step ? T.success : i === step ? T.primary : T.border,
              color: i <= step ? '#fff' : T.muted, transition: 'all .3s', flexShrink: 0,
              boxShadow: i === step ? `0 0 0 4px ${T.primary}22` : 'none'
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? T.primary : i < step ? T.success : T.muted, whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? T.success : T.border, transition: 'background .3s', margin: '0 6px', marginBottom: 18 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Item row component ─────────────────────────────────────────
const ItemRow = ({ item, people, colors, onChange, onRemove }) => {
  const toggle = (p) => {
    const cur = item.assignedTo || [];
    onChange({ ...item, assignedTo: cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p] });
  };
  return (
    <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, animation: 'fadeUp .2s ease' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={item.name} onChange={e => onChange({ ...item, name: e.target.value })}
          placeholder="Item name" className="input-base" style={{ flex: '1 1 160px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '0 12px' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.warning }}>₹</span>
          <input type="number" value={item.amount} onChange={e => onChange({ ...item, amount: e.target.value })}
            placeholder="0.00" style={{ width: 90, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: T.text, padding: '10px 0' }} />
        </div>
        <select value={item.splitType || 'equal'} onChange={e => onChange({ ...item, splitType: e.target.value, assignedTo: [] })}
          className="input-base" style={{ width: 'auto', cursor: 'pointer', paddingRight: 32 }}>
          <option value="equal">Equal</option>
          <option value="custom">Custom</option>
          <option value="solo">Solo</option>
        </select>
        <button onClick={onRemove} style={{ background: T.danger + '12', border: `1.5px solid ${T.danger}33`, color: T.danger, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✕</button>
      </div>
      {(item.splitType === 'custom' || item.splitType === 'solo') && (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: T.muted, fontSize: 12, fontWeight: 600, marginBottom: 7 }}>
            {item.splitType === 'solo' ? 'Who paid alone?' : 'Who shares this?'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {people.map((p, i) => {
              const sel = (item.assignedTo || []).includes(p);
              return (
                <button key={p} onClick={() => toggle(p)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, border: '1.5px solid', borderRadius: 999, padding: '4px 10px',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .12s',
                  borderColor: sel ? colors[i % 10] : T.border,
                  background: sel ? colors[i % 10] + '18' : T.surface,
                  color: sel ? colors[i % 10] : T.sub,
                }}>
                  <Avatar name={p} color={sel ? colors[i % 10] : T.muted} size={18} />
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── History panel ──────────────────────────────────────────────
const HistoryPanel = ({ onRestore }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await getHistory(); setSessions(data.sessions || []); } catch { }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await deleteHistory(id);
    setSessions(s => s.filter(x => x.id !== id));
  };

  const handleClear = async () => {
    if (!window.confirm('Delete all history?')) return;
    await clearHistory();
    setSessions([]);
  };

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Section title="Bill History" subtitle="All your previous splits" icon="🕐"
      action={sessions.length > 0 && <button onClick={handleClear} style={{ background: T.danger + '12', border: `1px solid ${T.danger}33`, color: T.danger, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Clear All</button>}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><Spinner /></div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: T.muted }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>No history yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Your splits will appear here</div>
        </div>
      ) : (
        <div>
          {sessions.map((s, idx) => (
            <div key={s.id} style={{ borderRadius: 10, marginBottom: 8, border: `1px solid ${T.border}`, overflow: 'hidden', animation: `slideIn .2s ease ${idx * .03}s both` }}>
              <div className="history-row" onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', transition: 'background .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: T.primary + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🧾</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.billTitle}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{fmt(s.createdAt)} · {s.people?.length} people</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: T.primary }}>₹{(s.totalBill || s.total || 0).toFixed(2)}</span>
                  <button onClick={(e) => handleDelete(s.id, e)} style={{ background: T.danger + '12', border: 'none', color: T.danger, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
                  <span style={{ color: T.muted, fontSize: 12, transition: 'transform .2s', display: 'inline-block', transform: expanded === s.id ? 'rotate(180deg)' : 'none' }}>▼</span>
                </div>
              </div>
              {expanded === s.id && (
                <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}`, background: T.bg, animation: 'fadeUp .15s ease' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {(s.people || []).map((p, i) => {
                      const key = Object.keys(s.owes || {}).find(k => k.toLowerCase() === p.toLowerCase());
                      const amt = key ? parseFloat(s.owes[key]) || 0 : 0;
                      return <Chip key={p} label={`${p}: ₹${amt.toFixed(2)}`} color={PALETTE[i % 10]} />;
                    })}
                  </div>
                  {s.transactions?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>Settlements</div>
                      {s.transactions.map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 4 }}>
                          <span>{t.from}</span>
                          <span style={{ color: T.muted }}>→</span>
                          <span>{t.to}</span>
                          <span style={{ marginLeft: 'auto', color: T.warning, fontWeight: 800 }}>₹{t.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => onRestore(s)} style={{ background: T.primary + '15', border: `1.5px solid ${T.primary}33`, color: T.primary, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                    ↩ Load this bill
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};

// ── MD renderer ────────────────────────────────────────────────
const MD = ({ text }) => (
  <div style={{ fontSize: 14, lineHeight: 1.75, color: T.ink }}>
    {text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <div key={i} style={{ fontWeight: 800, fontSize: 15, color: T.primary, marginTop: 18, marginBottom: 6 }}>{line.slice(3)}</div>;
      if (line.startsWith('# ')) return <div key={i} style={{ fontWeight: 800, fontSize: 17, color: T.text, marginTop: 20, marginBottom: 8 }}>{line.slice(2)}</div>;
      if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 16, marginBottom: 3, color: T.sub }}>• {line.slice(2)}</div>;
      if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
      return <div key={i} style={{ marginBottom: 3 }}>{line}</div>;
    })}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState('splitter'); // 'splitter' | 'history'
  const [step, setStep] = useState(0);
  const [people, setPeople] = useState([]);
  const [personInput, setPI] = useState('');
  const [billTitle, setBT] = useState('');
  const [items, setItems] = useState([{ id: 1, name: '', amount: '', splitType: 'equal', assignedTo: [] }]);
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiL] = useState(false);
  const [error, setError] = useState('');
  const [scanFile, setSF] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanErr, setScanErr] = useState('');
  const [emails, setEmails] = useState({});
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const inputRef = useRef(null);

  const getOwes = useCallback((p, owesObj = results?.owes) => {
    if (!owesObj || !p) return 0;
    const key = Object.keys(owesObj).find(k => k.toLowerCase() === p.toLowerCase());
    return key ? parseFloat(owesObj[key]) || 0 : 0;
  }, [results?.owes]);

  const addPerson = () => {
    const n = personInput.trim();
    if (n && !people.includes(n)) { 
      setPeople([...people, n]); 
      if (emailInput.trim()) {
        setEmails(prev => ({ ...prev, [n]: emailInput.trim() }));
      }
      setPI(''); 
      setEmailInput('');
    }
  };
  const addItem = () => setItems([...items, { id: Date.now(), name: '', amount: '', splitType: 'equal', assignedTo: [] }]);
  const removeItem = (id) => setItems(items.filter(i => i.id !== id));
  const updateItem = useCallback((id, upd) => setItems(p => p.map(i => i.id === id ? upd : i)), []);

  const handleScan = async () => {

    if (!scanFile) return;

    setScanning(true);
    setScanErr('');

    try {

      const fd = new FormData();
      fd.append('bill', scanFile);

      const response = await scanBill(fd);

      console.log(response);

      const data = response.data;
      setResults(data);

      if (!data.success) {
        setScanErr('Scan failed');
        return;
      }

      setBT(data.billTitle || '');

      if (data.items?.length) {

        setItems(
          data.items.map((it, i) => ({
            id: Date.now() + i,
            name: it.name || 'Item',
            amount: String(it.amount || 0),
            splitType: 'equal',
            assignedTo: [],
          }))
        );
      }

      setTax(String(data.tax || 0));
      setTip(String(data.tip || 0));

      setScanErr('');

    } catch (e) {

      console.log(e);

      setScanErr(e.message);

    } finally {

      setScanning(false);
    }
  };

  const calculate = async () => {
    setLoading(true);
    setError('');

    try {

      const payload = {
        people,
        items,
        tax,
        tip,
        paidBy,
        billTitle
      };

      console.log("Sending:", payload);

      const response = await splitBill(payload);

      console.log("Backend Response:", response.data);

      const data = response.data;

      if (data.success) {
        let txns = Array.isArray(data.transactions) ? data.transactions : [];
        if (txns.length === 0 && paidBy && data.owes) {
          people.forEach(p => {
            if (p.toLowerCase() !== paidBy.toLowerCase()) {
              const key = Object.keys(data.owes).find(k => k.toLowerCase() === p.toLowerCase());
              const amount = key ? parseFloat(data.owes[key]) || 0 : 0;
              if (amount > 0) {
                txns.push({ from: p, to: paidBy, amount });
              }
            }
          });
        }

        setResults({
          ...data,
          totalBill:
            data.totalBill ||
            data.total ||
            calculatedTotal,

          owes:
            data.owes || {},

          transactions: txns,

          taxAmt:
            data.taxAmt || parseFloat(tax || 0),

          tipAmt:
            data.tipAmt || parseFloat(tip || 0)
        });

        setStep(2);

      } else {

        setError(data.message || "Split failed");
      }

    } catch (e) {

      console.log(e);

      setError(
        e.response?.data?.message ||
        "Calculation failed"
      );
    }

    setLoading(false);
  };

  const runAI = async () => {
    if (!results) return;
    setAiL(true); setAnalysis('');
    try {
      const { data } = await analyseBill({ billTitle, people, items, tax: results.taxAmt, tip: results.tipAmt, paidBy, owes: results.owes, totalBill: results.totalBill, transactions: results.transactions });
      if (data.success) setAnalysis(data.analysis);
      else setAnalysis('⚠️ ' + (data.message || 'AI Smart Analysis failed.'));
    } catch { setAnalysis('⚠️ AI Analysis Failed. Please verify your connection.'); }
    setAiL(false);
  };

  const handleSendEmail = async () => {
    if (!results || !results.transactions || results.transactions.length === 0) return;
    setEmailStatus('sending');
    try {
      const payload = {
        transactions: results.transactions,
        emails,
        billTitle: billTitle || 'Shared Bill'
      };
      const response = await sendEmail(payload);
      if (response.data.success) {
        setEmailStatus(`Sent ${response.data.count} emails!`);
      } else {
        setEmailStatus('Failed to send');
      }
    } catch (e) {
      setEmailStatus('Error sending emails');
    }
    setTimeout(() => setEmailStatus(''), 4000);
  };

  const reset = () => {
    setStep(0); setPeople([]); setPI(''); setBT(''); setEmailInput('');
    setItems([{ id: 1, name: '', amount: '', splitType: 'equal', assignedTo: [] }]);
    setTax(''); setTip(''); setPaidBy(''); setResults(null); setAnalysis('');
    setError(''); setSF(null); setScanErr(''); setEmailStatus('');
  };

  const restoreSession = (session) => {
    setBT(session.billTitle || '');
    setPeople(session.people || []);
    setItems(session.items || []);
    setTax(String(session.taxAmt || ''));
    setTip(String(session.tipAmt || ''));
    setPaidBy(session.paidBy || '');
    setResults({ owes: session.owes, totalBill: session.totalBill, transactions: session.transactions, taxAmt: session.taxAmt, tipAmt: session.tipAmt });
    setStep(2); setTab('splitter');
  };

  const calculatedTotal =
    items.reduce(
      (s, i) => s + (parseFloat(i.amount) || 0),
      0
    ) +
    (parseFloat(tax) || 0) +
    (parseFloat(tip) || 0);

  const total =
    results?.totalBill ||
    results?.total ||
    calculatedTotal ||
    0;

  // ════════════════════════════════════════════════════════════
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', background: T.bg }}>

        {/* ── Top Nav ─────────────────────────────────────── */}
        <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>AI Bill Splitter</div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>Advanced AI Engine</div>
              </div>
            </div>
            <div style={{ display: 'flex', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, padding: 3, gap: 3 }}>
              {[['splitter', '🧾 Splitter'], ['history', '🕐 History']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={tab === k ? 'tab-active' : 'tab-inactive'}
                  style={{ border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', fontFamily: 'DM Sans, sans-serif' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: tab === 'history' ? '1fr' : 'minmax(0,2fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }}>

          {/* ── HISTORY TAB ─────────────────────────────────── */}
          {tab === 'history' && (
            <div style={{ maxWidth: 700, width: '100%', margin: '0 auto' }}>
              <HistoryPanel onRestore={restoreSession} />
            </div>
          )}

          {/* ── SPLITTER TAB ────────────────────────────────── */}
          {tab === 'splitter' && (
            <>
              {/* LEFT COLUMN — main flow */}
              <div>
                <StepBar step={step} />

                {error && (
                  <div style={{ background: T.danger + '0F', border: `1px solid ${T.danger}33`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: T.danger, fontSize: 14, fontWeight: 600 }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* STEP 0 */}
                {step === 0 && (
                  <div style={{ animation: 'fadeUp .25s ease' }}>
                    <Section title="Bill Details" icon="📋">
                      <input value={billTitle} onChange={e => setBT(e.target.value)} className="input-base"
                        placeholder='e.g. "Dinner at Barbeque Nation"' style={{ marginBottom: 0 }} />
                    </Section>

                    <Section title="Smart OCR Bill Scanner" subtitle="Upload a photo — AI Smart Analysis extracts items" icon="📷"
                      action={<span className="badge" style={{ background: T.accent + '15', color: T.accent }}>Optional</span>}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 220px', position: 'relative' }}>
                          <input type="file" accept="image/*,.pdf" onChange={e => setSF(e.target.files[0])}
                            style={{ width: '100%', padding: '9px 14px', background: T.bg, border: `1.5px dashed ${T.border}`, borderRadius: 10, fontSize: 13, color: T.sub, cursor: 'pointer' }} />
                        </div>
                        <button onClick={handleScan} disabled={!scanFile || scanning} className="btn-primary"
                          style={{ background: T.accent, boxShadow: `0 2px 12px ${T.accent}33` }}>
                          {scanning ? <><Spinner size={16} color="#fff" /> Scanning…</> : '🔍 Smart Scan'}
                        </button>
                      </div>
                      {scanErr && <p style={{ color: T.danger, fontSize: 13, marginTop: 8, fontWeight: 500 }}>{scanErr}</p>}
                    </Section>

                    <Section title="Add People" subtitle="At least 2 people required" icon="👥">
                      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                        <input ref={inputRef} value={personInput} onChange={e => setPI(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addPerson()}
                          placeholder="Name (e.g. Vaibhav)" className="input-base" style={{ flex: 1 }} />
                        <input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addPerson()}
                          placeholder="Email Address (Optional)" className="input-base" style={{ flex: 1 }} />
                        <button onClick={addPerson} className="btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>+ Add</button>
                      </div>
                      {people.length > 0
                        ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{people.map((p, i) => <Chip key={p} label={`${p} ${emails[p] ? '✉️' : ''}`} color={PALETTE[i % 10]} onRemove={() => setPeople(people.filter(x => x !== p))} />)}</div>
                        : <p style={{ color: T.muted, fontSize: 13 }}>No people added yet.</p>}
                    </Section>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => people.length >= 2 && setStep(1)} disabled={people.length < 2} className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
                        Next: Add Items →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 1 */}
                {step === 1 && (
                  <div style={{ animation: 'fadeUp .25s ease' }}>
                    <Section title="Bill Items" icon="🧾">
                      {items.map(item => (
                        <ItemRow key={item.id} item={item} people={people} colors={PALETTE}
                          onChange={upd => updateItem(item.id, upd)} onRemove={() => removeItem(item.id)} />
                      ))}
                      <button onClick={addItem} style={{ width: '100%', padding: 11, background: T.bg, border: `1.5px dashed ${T.primary}44`, borderRadius: 10, color: T.primary, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .15s' }}>
                        + Add Item
                      </button>
                    </Section>

                    <Section title="Tax, Tip & Payer" icon="💳">
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 5 }}>Tax (₹)</label>
                          <input type="number" value={tax} onChange={e => setTax(e.target.value)} className="input-base" placeholder="0.00" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 5 }}>Tip (₹)</label>
                          <input type="number" value={tip} onChange={e => setTip(e.target.value)} className="input-base" placeholder="0.00" />
                        </div>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 5 }}>Select the person who paid the entire bill</label>
                        <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="input-base" style={{ cursor: 'pointer' }}>
                          <option value="">Select person</option>
                          {people.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div style={{ background: T.warning + '0A', border: `1.5px solid ${T.warning}33`, borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: T.sub, fontSize: 14, fontWeight: 600 }}>Total Preview</span>
                        <span style={{ color: T.warning, fontWeight: 900, fontSize: 26, fontFamily: 'DM Mono, monospace' }}>₹{(parseFloat(total || 0)).toFixed(2)}</span>
                      </div>
                    </Section>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                      <button onClick={() => setStep(0)} className="btn-ghost">← Back</button>
                      <button onClick={calculate} disabled={loading} className="btn-primary" style={{ padding: '12px 32px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {loading ? <><Spinner size={16} color="#fff" /> Calculating…</> : 'Calculate Split →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && results && (
                  <div style={{ animation: 'fadeUp .25s ease' }}>
                    {/* Total banner */}
                    <div style={{ background: T.primary, borderRadius: 16, padding: '22px 26px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        {billTitle && <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{billTitle}</div>}
                        <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13 }}>Total Bill</div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 38, fontFamily: 'DM Mono, monospace', lineHeight: 1.1 }}>₹{(parseFloat(results.totalBill || 0)).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {results.taxAmt > 0 && <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}><div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>Tax</div><div style={{ color: '#fff', fontWeight: 800 }}>₹{results.taxAmt.toFixed(2)}</div></div>}
                        {results.tipAmt > 0 && <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}><div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>Tip</div><div style={{ color: '#fff', fontWeight: 800 }}>₹{results.tipAmt.toFixed(2)}</div></div>}
                      </div>
                    </div>

                    {/* Individual shares */}
                    <Section title="Individual Shares" icon="📊">
                      {people.map((p, i) => {
                        const amt = getOwes(p);
                        const pct = results.totalBill > 0 ? (amt / results.totalBill) * 100 : 0;
                        return (
                          <div key={p} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <Avatar name={p} color={PALETTE[i % 10]} size={30} />
                                <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{p}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontWeight: 800, fontSize: 15, color: PALETTE[i % 10], fontFamily: 'DM Mono, monospace' }}>₹{(parseFloat(amt || 0)).toFixed(2)}</span>
                                <span style={{ color: T.muted, fontSize: 12, marginLeft: 6 }}>({pct.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <div style={{ height: 7, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 99, background: PALETTE[i % 10], width: `${pct}%`, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </Section>

                    {/* Settlements */}
                    <Section title="Settle Up" icon="💸">
                      {(results?.transactions?.length || 0) === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                          <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
                          <div style={{ color: T.success, fontWeight: 700, fontSize: 15 }}>Everyone is already settled!</div>
                        </div>
                      ) : (
                        <>
                          {results.transactions.map((t, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar name={t.from} color={PALETTE[i % 10]} size={36} />
                                <div><div style={{ fontWeight: 700, fontSize: 14 }}>{t.from}</div><div style={{ color: T.muted, fontSize: 11 }}>pays</div></div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', padding: '0 12px' }}>
                                <div style={{ flex: 1, height: 1.5, background: T.border, borderRadius: 99 }} />
                                <span style={{ fontSize: 16 }}>→</span>
                                <div style={{ flex: 1, height: 1.5, background: T.border, borderRadius: 99 }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.to}</div>
                                  <div style={{ color: T.warning, fontWeight: 900, fontSize: 17, fontFamily: 'DM Mono, monospace' }}>₹{parseFloat(t.amount || 0).toFixed(2)}</div>
                                </div>
                                <Avatar name={t.to} color={PALETTE[(i + 4) % 10]} size={36} />
                              </div>
                            </div>
                          ))}
                          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={handleSendEmail} disabled={emailStatus === 'sending'} style={{ background: T.success, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 2px 12px ${T.success}33`, fontFamily: 'DM Sans, sans-serif' }}>
                              ✉️ Send Email Reminders
                            </button>
                            {emailStatus && emailStatus !== 'sending' && (
                              <span style={{ fontSize: 13, fontWeight: 600, color: emailStatus.includes('Error') || emailStatus.includes('Failed') || emailStatus.includes('not configured') ? T.danger : T.success }}>
                                {emailStatus}
                              </span>
                            )}
                            {emailStatus === 'sending' && <Spinner size={16} color={T.success} />}
                          </div>
                        </>
                      )}
                    </Section>

                    {/* Per-person breakdown */}
                    <Section title="Per-Person Breakdown" icon="📑">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
                        {people.map((p, i) => (
                          <div key={p} style={{ background: T.bg, border: `1.5px solid ${PALETTE[i % 10]}33`, borderRadius: 12, padding: '14px', boxShadow: `0 2px 8px ${PALETTE[i % 10]}0A` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                              <Avatar name={p} color={PALETTE[i % 10]} size={30} />
                              <span style={{ fontWeight: 700, fontSize: 13 }}>{p}</span>
                            </div>
                            {items.filter(it => parseFloat(it.amount) > 0).map(it => {
                              const amt = parseFloat(it.amount) || 0; let share = 0;
                              if (it.splitType === 'equal') share = amt / people.length;
                              else { const ass = (it.assignedTo || []).length ? it.assignedTo : people; if (ass.includes(p)) share = amt / ass.length; }
                              if (!share) return null;
                              return (
                                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                  <span style={{ color: T.muted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{it.name || 'Item'}</span>
                                  <span style={{ color: PALETTE[i % 10], fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>₹{(parseFloat(share || 0)).toFixed(2)}</span>
                                </div>
                              );
                            })}
                            {(results.taxAmt || results.tipAmt) > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ color: T.muted, fontSize: 11 }}>Tax+Tip</span>
                                <span style={{ color: PALETTE[i % 10], fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>₹{((results.taxAmt + results.tipAmt) / people.length).toFixed(2)}</span>
                              </div>
                            )}
                            <div style={{ borderTop: `1px solid ${PALETTE[i % 10]}22`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: T.muted, fontSize: 11 }}>Total</span>
                              <span style={{ color: PALETTE[i % 10], fontSize: 16, fontWeight: 900, fontFamily: 'DM Mono, monospace' }}>₹{getOwes(p).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>

                    {/* AI Analysis */}
                    {(analysis || aiLoading) && (
                      <Section title="AI Smart Analysis" subtitle="Advanced AI Analysis" icon="✨">
                        {aiLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', color: T.muted }}>
                            <Spinner color={T.accent} /> <span style={{ fontWeight: 600 }}>Running AI Smart Analysis…</span>
                          </div>
                        ) : <MD text={analysis} />}
                      </Section>
                    )}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <button onClick={() => setStep(1)} className="btn-ghost">← Edit Bill</button>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={runAI} disabled={aiLoading} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: `0 2px 12px ${T.accent}33`, fontFamily: 'DM Sans, sans-serif' }}>
                          {aiLoading ? <Spinner size={15} color="#fff" /> : '✨'} AI Analysis
                        </button>
                        <button onClick={reset} style={{ background: T.danger + '12', border: `1.5px solid ${T.danger}33`, color: T.danger, borderRadius: 10, padding: '11px 22px', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>↺ New Bill</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN — sidebar */}
              <div>
                {/* Quick summary card */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.04)', position: 'sticky', top: 88 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>Session Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      ['People', people.length || '—'],
                      ['Items', items.filter(i => i.name || i.amount).length || '—'],
                      ['Total', total > 0 ? `₹${total.toFixed(2)}` : '—'],
                      ['Paid by', paidBy || '—'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 9, borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ color: T.muted, fontSize: 13, fontWeight: 500 }}>{k}</span>
                        <span style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {people.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>Group</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {people.map((p, i) => <Chip key={p} label={p} color={PALETTE[i % 10]} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}