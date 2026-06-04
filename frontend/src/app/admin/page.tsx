"use client";
import { useCallback, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────

interface AdminBooking {
  _id: string;
  slotId: string;
  weekId: string;
  day: string;
  start: string;
  end: string;
  night: boolean;
  band: string;
  members: { sid: string; name: string; nickname: string; phone: string }[];
  createdAt: string;
}

interface AdminMember {
  _id: string;
  name: string;
  nickname: string;
  sid: string;
  faculty: string;
  phone: string;
  createdAt: string;
}

const DAY_EN: Record<string, string> = {
  mon:"MON", tue:"TUE", wed:"WED", thu:"THU", fri:"FRI", sat:"SAT", sun:"SUN",
};
const DAY_TH: Record<string, string> = {
  mon:"จันทร์", tue:"อังคาร", wed:"พุธ", thu:"พฤหัสบดี", fri:"ศุกร์", sat:"เสาร์", sun:"อาทิตย์",
};

const api = async (token: string, path: string, opts: RequestInit = {}) =>
  fetch(`/api/admin${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
  });

// ─── Login ───────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (t: string) => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(false);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      if (!res.ok) { setErr(true); return; }
      onLogin((await res.json()).token);
    } catch { setErr(true); }
    finally { setLoading(false); }
  }

  return (
    <div className="adm-login-wrap">
      <div className="adm-login">
        <div className="adm-login-head">★ STARPARTY · ADMIN</div>
        <form onSubmit={submit}>
          {err && <div className="adm-err">Username หรือ Password ไม่ถูกต้อง</div>}
          <div className="adm-field">
            <label>USERNAME</label>
            <input value={u} onChange={e => setU(e.target.value)} autoComplete="username" autoFocus/>
          </div>
          <div className="adm-field">
            <label>PASSWORD</label>
            <input type="password" value={p} onChange={e => setP(e.target.value)} autoComplete="current-password"/>
          </div>
          <button className="adm-submit" disabled={loading}>{loading ? "..." : "LOGIN"}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Reservations Tab ────────────────────────────────────────

function ReservationsTab({ token }: { token: string }) {
  const [weeks, setWeeks]     = useState<string[]>([]);
  const [weekId, setWeekId]   = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [editId, setEditId]   = useState<string | null>(null);
  const [editBand, setEditBand] = useState("");

  const loadWeeks = useCallback(async () => {
    const res = await api(token, "/weeks");
    if (!res.ok) return;
    const { weeks: w } = await res.json();
    setWeeks(w);
    setWeekId(prev => prev || (w[0] ?? ""));
  }, [token]);

  const loadBookings = useCallback(async () => {
    if (!weekId) return;
    const res = await api(token, `/bookings?weekId=${weekId}`);
    if (res.ok) setBookings((await res.json()).bookings);
  }, [token, weekId]);

  useEffect(() => { loadWeeks(); }, [loadWeeks]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  async function del(id: string) {
    if (!confirm("ลบการจองนี้?")) return;
    await api(token, `/bookings/${id}`, { method: "DELETE" });
    loadBookings();
  }

  async function saveEdit(id: string) {
    await api(token, `/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ band: editBand }) });
    setEditId(null);
    loadBookings();
  }

  return (
    <div className="adm-section">
      <div className="adm-toolbar">
        <label className="adm-tlabel">สัปดาห์</label>
        <select className="adm-select" value={weekId} onChange={e => setWeekId(e.target.value)}>
          {weeks.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <span className="adm-count">{bookings.length} การจอง</span>
      </div>

      {bookings.length === 0 ? (
        <div className="adm-empty">ไม่มีการจองในสัปดาห์นี้</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>วัน</th>
                <th>เวลา</th>
                <th>ประเภท</th>
                <th>ชื่อวง</th>
                <th>สมาชิก</th>
                <th>จองเมื่อ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id} className={editId === b._id ? "adm-tr-edit" : ""}>
                  <td>
                    <span className="adm-day-en">{DAY_EN[b.day]}</span>
                    <span className="adm-day-th">{DAY_TH[b.day]}</span>
                  </td>
                  <td className="adm-mono">{b.start}–{b.end}</td>
                  <td>
                    {b.night
                      ? <span className="adm-pill night">NIGHT · FREE</span>
                      : <span className="adm-pill day">DAY</span>}
                  </td>
                  <td>
                    {editId === b._id
                      ? <input className="adm-inline-inp" value={editBand} onChange={e => setEditBand(e.target.value)}/>
                      : <span className="adm-band">{b.band}</span>}
                  </td>
                  <td>
                    <div className="adm-chips">
                      {b.members.map(m => (
                        <span className="adm-chip" key={m.sid} title={`${m.name} · ${m.phone}`}>
                          {m.nickname || m.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="adm-mono adm-small">{new Date(b.createdAt).toLocaleDateString("th-TH")}</td>
                  <td>
                    <div className="adm-acts">
                      {editId === b._id ? (
                        <>
                          <button className="adm-btn save" onClick={() => saveEdit(b._id)}>บันทึก</button>
                          <button className="adm-btn cancel" onClick={() => setEditId(null)}>ยกเลิก</button>
                        </>
                      ) : (
                        <>
                          <button className="adm-btn edit" onClick={() => { setEditId(b._id); setEditBand(b.band); }}>แก้ไข</button>
                          <button className="adm-btn del" onClick={() => del(b._id)}>ลบ</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Members Tab ─────────────────────────────────────────────

function MembersTab({ token }: { token: string }) {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [search, setSearch]   = useState("");
  const [editSid, setEditSid] = useState<string | null>(null);
  const [editF, setEditF]     = useState({ name:"", nickname:"", faculty:"", phone:"" });

  const load = useCallback(async () => {
    const res = await api(token, "/members");
    if (res.ok) setMembers((await res.json()).members);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function del(sid: string, name: string) {
    if (!confirm(`ลบสมาชิก "${name}"?`)) return;
    await api(token, `/members/${sid}`, { method: "DELETE" });
    load();
  }

  async function saveEdit(sid: string) {
    await api(token, `/members/${sid}`, { method: "PUT", body: JSON.stringify(editF) });
    setEditSid(null);
    load();
  }

  const q = search.toLowerCase();
  const filtered = members.filter(m =>
    !q || m.name.toLowerCase().includes(q) || m.nickname.toLowerCase().includes(q) || m.sid.includes(q)
  );

  return (
    <div className="adm-section">
      <div className="adm-toolbar">
        <input
          className="adm-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ / ชื่อเล่น / รหัสนิสิต..."
        />
        <span className="adm-count">{filtered.length} / {members.length} สมาชิก</span>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ชื่อ–นามสกุล</th>
              <th>ชื่อเล่น</th>
              <th>รหัสนิสิต</th>
              <th>คณะ / ภาควิชา</th>
              <th>เบอร์โทร</th>
              <th>สมัครเมื่อ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.sid} className={editSid === m.sid ? "adm-tr-edit" : ""}>
                <td className="adm-mono adm-small">{String(i + 1).padStart(3, "0")}</td>

                {editSid === m.sid ? (
                  <>
                    <td><input className="adm-inline-inp" value={editF.name}     onChange={e => setEditF(f => ({ ...f, name: e.target.value }))}/></td>
                    <td><input className="adm-inline-inp" value={editF.nickname} onChange={e => setEditF(f => ({ ...f, nickname: e.target.value }))}/></td>
                    <td className="adm-mono">{m.sid}</td>
                    <td><input className="adm-inline-inp" value={editF.faculty}  onChange={e => setEditF(f => ({ ...f, faculty: e.target.value }))}/></td>
                    <td><input className="adm-inline-inp" value={editF.phone}    onChange={e => setEditF(f => ({ ...f, phone: e.target.value }))}/></td>
                    <td className="adm-mono adm-small">{new Date(m.createdAt).toLocaleDateString("th-TH")}</td>
                    <td>
                      <div className="adm-acts">
                        <button className="adm-btn save" onClick={() => saveEdit(m.sid)}>บันทึก</button>
                        <button className="adm-btn cancel" onClick={() => setEditSid(null)}>ยกเลิก</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{m.name}</td>
                    <td><b>{m.nickname}</b></td>
                    <td className="adm-mono">{m.sid}</td>
                    <td>{m.faculty}</td>
                    <td className="adm-mono">{m.phone}</td>
                    <td className="adm-mono adm-small">{new Date(m.createdAt).toLocaleDateString("th-TH")}</td>
                    <td>
                      <div className="adm-acts">
                        <button className="adm-btn edit" onClick={() => { setEditSid(m.sid); setEditF({ name: m.name, nickname: m.nickname, faculty: m.faculty, phone: m.phone }); }}>แก้ไข</button>
                        <button className="adm-btn del" onClick={() => del(m.sid, m.name)}>ลบ</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab]     = useState<"bookings" | "members">("bookings");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem("adm-tok");
    if (t) setToken(t);
    setReady(true);
  }, []);

  const login = (t: string) => { sessionStorage.setItem("adm-tok", t); setToken(t); };
  const logout = () => { sessionStorage.removeItem("adm-tok"); setToken(null); };

  if (!ready) return null;
  if (!token)  return <LoginScreen onLogin={login}/>;

  return (
    <div className="adm">
      <div className="adm-header">
        <span className="adm-title">★ STARPARTY<span className="adm-badge-pill">ADMIN</span></span>
        <button className="adm-logout" onClick={logout}>LOGOUT</button>
      </div>

      <div className="adm-tabbar">
        <button className={"adm-tab" + (tab === "bookings" ? " active" : "")} onClick={() => setTab("bookings")}>
          RESERVATIONS · ตารางจอง
        </button>
        <button className={"adm-tab" + (tab === "members" ? " active" : "")} onClick={() => setTab("members")}>
          MEMBERS · สมาชิก
        </button>
      </div>

      {tab === "bookings" ? <ReservationsTab token={token}/> : <MembersTab token={token}/>}
    </div>
  );
}
