"use client";
import React, { useCallback, useEffect, useState } from "react";

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

// ─── Timetable helpers ───────────────────────────────────────

const WDAY_KEYS  = ["mon","tue","wed","thu","fri"];
const WEND_KEYS  = ["sat","sun"];

const WDAY_SLOTS = ["17:00","18:00","19:00","20:00","21:00","22:00",
                    "23:00","00:00","01:00","02:00","03:00","04:00","05:00"];
const WEND_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00",
                    "16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00",
                    "00:00","01:00","02:00","03:00","04:00","05:00"];

const WDAY_NIGHT = new Set(["23:00","00:00","01:00","02:00","03:00","04:00","05:00"]);
const WEND_NIGHT = new Set(["00:00","01:00","02:00","03:00","04:00","05:00"]);

const TT_COLORS = ["#E04E38","#E8734A","#E8A030","#C8B820","#5AAA60",
                   "#3AACAC","#4690D5","#7868C8","#C050A0","#D4785A"];
function ttBandColor(band: string) {
  let h = 0;
  for (let i = 0; i < band.length; i++) h = (h * 31 + band.charCodeAt(i)) & 0xffff;
  return TT_COLORS[h % TT_COLORS.length];
}

type SlotMap = Record<string, Record<string, AdminBooking>>;

type EditorState =
  | { mode: "create"; day: string; start: string; end: string; night: boolean }
  | { mode: "edit";   bk: AdminBooking }
  | null;

function nextHour(t: string) {
  return `${String((parseInt(t) + 1) % 24).padStart(2, "0")}:00`;
}

// ─── Booking Editor Panel ────────────────────────────────────

function BookingEditorPanel({ token, weekId, editor, onDone }: {
  token: string; weekId: string; editor: EditorState; onDone: () => void;
}) {
  const isCreate  = editor?.mode === "create";
  const existingBk = editor?.mode === "edit" ? editor.bk : null;

  const [band, setBand]   = useState("");
  const [sids, setSids]   = useState<string[]>([""]);
  const [lookup, setLookup] = useState<Record<string, string | null | "loading">>({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setBand(existingBk?.band ?? "");
    setSids(existingBk ? existingBk.members.map(m => m.sid) : [""]);
    setLookup({});
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    sids.forEach(sid => {
      if (!/^\d{10}$/.test(sid) || lookup[sid] !== undefined) return;
      setLookup(l => ({ ...l, [sid]: "loading" }));
      fetch(`/api/members/${sid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => setLookup(l => ({ ...l, [sid]: d ? (d.member.nickname || d.member.name) : null })))
        .catch(() => setLookup(l => ({ ...l, [sid]: null })));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sids]);

  async function save() {
    setSaving(true); setError(null);
    try {
      const validSids = sids.filter(s => /^\d{10}$/.test(s.trim()));
      let res: Response;
      if (isCreate && editor?.mode === "create") {
        res = await api(token, "/bookings", {
          method: "POST",
          body: JSON.stringify({
            slotId: `${editor.day}__${editor.start}`,
            weekId, day: editor.day,
            start: editor.start, end: editor.end, night: editor.night,
            band, members: validSids,
          }),
        });
      } else {
        res = await api(token, `/bookings/${existingBk!._id}`, {
          method: "PATCH",
          body: JSON.stringify({ band, members: validSids }),
        });
      }
      if (!res.ok) { setError((await res.json()).message || "เกิดข้อผิดพลาด"); return; }
      onDone();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function del() {
    if (!existingBk || !confirm("ลบการจองนี้?")) return;
    await api(token, `/bookings/${existingBk._id}`, { method: "DELETE" });
    onDone();
  }

  if (!editor) return null;

  const info = editor.mode === "create"
    ? { day: editor.day, start: editor.start, end: editor.end, night: editor.night }
    : { day: existingBk!.day, start: existingBk!.start, end: existingBk!.end, night: existingBk!.night };

  return (
    <div className="tt-editor">
      <div className="tt-editor-head">
        <span>{isCreate ? "✦ จองใหม่" : "✎ แก้ไขการจอง"}</span>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <b style={{ fontFamily:"var(--font-en)" }}>{DAY_EN[info.day]} {DAY_TH[info.day]}</b>
          <span style={{ fontFamily:"var(--font-en)" }}>{info.start}–{info.end}</span>
          <span className={"adm-pill " + (info.night ? "night" : "day")}>{info.night ? "NIGHT·FREE" : "DAY"}</span>
        </div>
        <button className="adm-btn cancel" style={{ marginLeft:"auto" }} onClick={onDone}>✕ ปิด</button>
      </div>

      <div className="tt-editor-body">
        {error && <div className="adm-err">{error}</div>}

        <div className="adm-field">
          <label>ชื่อวง · BAND NAME</label>
          <input style={{ fontFamily:"var(--font-mix)", fontSize:15, padding:"10px 12px",
            border:"2px solid #000", outline:"none", width:"100%", background:"#fff" }}
            value={band} onChange={e => setBand(e.target.value)} placeholder="ซ้อมส่วนตัว" autoFocus/>
        </div>

        <div className="adm-field">
          <label>สมาชิก · MEMBER STUDENT IDs</label>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {sids.map((sid, i) => {
              const v = /^\d{10}$/.test(sid);
              const info = sid ? lookup[sid] : undefined;
              return (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"30px 1fr 1fr 34px", gap:6, alignItems:"stretch" }}>
                  <span style={{ background:"#000", color:"#fff", display:"flex", alignItems:"center",
                    justifyContent:"center", fontFamily:"var(--font-en)", fontWeight:700, fontSize:12 }}>
                    {String(i+1).padStart(2,"0")}
                  </span>
                  <input className="adm-inline-inp" style={{ background:"#fff" }}
                    value={sid}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g,"").slice(0,10);
                      setSids(s => s.map((x,j) => j===i ? val : x));
                    }}
                    inputMode="numeric" maxLength={10} placeholder="รหัสนิสิต 10 หลัก"/>
                  <span style={{ padding:"0 10px", border:"2px solid #000", display:"flex", alignItems:"center",
                    fontFamily:"var(--font-th)", fontWeight:600, fontSize:13, overflow:"hidden",
                    whiteSpace:"nowrap", textOverflow:"ellipsis",
                    background: !sid ? "#fff" : !v ? "#fff" : info === "loading" ? "#eee" : info ? "var(--blue)" : "var(--red)" }}>
                    {!sid ? "—" : !v ? "ยังไม่ครบ 10 หลัก" : info === "loading" ? "กำลังตรวจสอบ..." : info ? String(info) : "ไม่พบในระบบ"}
                  </span>
                  <button style={{ border:"2px solid #000", background:"#fff", cursor:"pointer",
                    fontSize:18, fontWeight:700, opacity: sids.length===1 ? 0.3 : 1 }}
                    disabled={sids.length===1}
                    onClick={() => setSids(s => s.filter((_,j) => j!==i))}>×</button>
                </div>
              );
            })}
            <button className="adm-btn edit" style={{ alignSelf:"flex-start", marginTop:4 }}
              disabled={sids.length >= 8}
              onClick={() => setSids(s => [...s, ""])}>+ เพิ่มสมาชิก</button>
          </div>
        </div>
      </div>

      <div className="tt-editor-foot">
        <button className="adm-btn save"   onClick={save} disabled={saving}>{saving ? "..." : "บันทึก"}</button>
        {existingBk && <button className="adm-btn del" onClick={del}>ลบการจอง</button>}
        <button className="adm-btn cancel" onClick={onDone}>ยกเลิก</button>
      </div>
    </div>
  );
}

// ─── Timetable Grid ──────────────────────────────────────────

function TimetableGrid({ days, slots, nightSet, slotMap, onSelectSlot, onEdit }: {
  days: string[]; slots: string[]; nightSet: Set<string>;
  slotMap: SlotMap;
  onSelectSlot: (day: string, start: string, night: boolean) => void;
  onEdit: (b: AdminBooking) => void;
}) {
  return (
    <div className="tt-grid" style={{ gridTemplateColumns: `54px repeat(${days.length}, 1fr)` }}>
      <div className="tt-corner">TIME</div>
      {days.map(d => (
        <div key={d} className="tt-day-head">
          <span className="tt-den">{DAY_EN[d]}</span>
          <span className="tt-dth">{DAY_TH[d]}</span>
        </div>
      ))}
      {slots.map(time => (
        <React.Fragment key={time}>
          <div className={"tt-time" + (nightSet.has(time) ? " night" : "")}>{time}</div>
          {days.map(day => {
            const bk = slotMap[day]?.[time];
            const isNight = nightSet.has(time);
            return (
              <div key={day + time}
                className={"tt-cell" + (isNight ? " night" : "") + (bk ? " booked" : " empty")}
                onClick={() => { if (!bk) onSelectSlot(day, time, isNight); }}>
                {bk ? (
                  <div className="tt-bk" style={{ background: ttBandColor(bk.band) }}>
                    <div className="tt-bk-band">{bk.band}</div>
                    <div className="tt-bk-members">
                      {bk.members.map(m => `${m.nickname||m.name} ${m.phone}`).join(" · ")}
                    </div>
                    <div className="tt-bk-acts">
                      <button title="แก้ไข" onClick={e => { e.stopPropagation(); onEdit(bk); }}>✎</button>
                    </div>
                  </div>
                ) : (
                  <div className="tt-empty-hint">+</div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Reservations Tab ────────────────────────────────────────

function ReservationsTab({ token }: { token: string }) {
  const [weeks, setWeeks]       = useState<string[]>([]);
  const [weekId, setWeekId]     = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [editor, setEditor]     = useState<EditorState>(null);

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

  const slotMap: SlotMap = {};
  bookings.forEach(b => {
    if (!slotMap[b.day]) slotMap[b.day] = {};
    slotMap[b.day][b.start] = b;
  });

  return (
    <div className="adm-section">
      <div className="adm-toolbar">
        <label className="adm-tlabel">สัปดาห์</label>
        <select className="adm-select" value={weekId} onChange={e => setWeekId(e.target.value)}>
          {weeks.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <span className="adm-count">{bookings.length} การจอง</span>
        <span className="adm-count" style={{ color:"#aaa" }}>คลิกช่องว่าง = จองใหม่ · คลิก ✎ = แก้ไข</span>
      </div>

      <BookingEditorPanel
        token={token} weekId={weekId} editor={editor}
        onDone={() => { setEditor(null); loadBookings(); }}
      />

      <div className="tt-section-label">WEEKDAYS · จันทร์–ศุกร์<span>17:00–06:00 · Night FREE</span></div>
      <div className="tt-wrap">
        <TimetableGrid days={WDAY_KEYS} slots={WDAY_SLOTS} nightSet={WDAY_NIGHT} slotMap={slotMap}
          onSelectSlot={(day, start, night) => setEditor({ mode:"create", day, start, end: nextHour(start), night })}
          onEdit={bk => setEditor({ mode:"edit", bk })}/>
      </div>

      <div className="tt-section-label">WEEKENDS · เสาร์–อาทิตย์<span>08:00–06:00 · Night FREE</span></div>
      <div className="tt-wrap">
        <TimetableGrid days={WEND_KEYS} slots={WEND_SLOTS} nightSet={WEND_NIGHT} slotMap={slotMap}
          onSelectSlot={(day, start, night) => setEditor({ mode:"create", day, start, end: nextHour(start), night })}
          onEdit={bk => setEditor({ mode:"edit", bk })}/>
      </div>
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

// ─── Activities Tab ───────────────────────────────────────────

interface AdminActivity {
  _id: string;
  badge: string;
  color: 'r'|'y'|'b'|'o';
  date: string;
  name: string;
  nameTh: string;
  tag: 'jam'|'live'|'open'|'other';
  tagLabel: string;
  imageUrl: string;
  description: string;
  active: boolean;
  order: number;
}

const EMPTY_ACT: Omit<AdminActivity, '_id'> = {
  badge:"", color:"r", date:"", name:"", nameTh:"", tag:"jam", tagLabel:"JAM",
  imageUrl:"", description:"", active:true, order:0,
};

const DAY_SHORT  = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MON_SHORT  = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function formatActivityDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_SHORT[date.getDay()]} ${d} ${MON_SHORT[m - 1]}`;
}

const COLOR_LABELS = { r:"Red", y:"Yellow", b:"Blue", o:"Orange" };
const TAG_LABELS   = { jam:"JAM", live:"LIVE", open:"OPEN MIC", other:"OTHER" };
const COLOR_HEX    = { r:"#E04E38", y:"#FFDE25", b:"#4690D5", o:"#DD643F" };

function ActivitiesTab({ token }: { token: string }) {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [form, setForm] = useState<(Omit<AdminActivity,"_id"> & { _id?: string }) | null>(null);
  const [rawDate, setRawDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await api(token, "/activities");
    if (res.ok) setActivities((await res.json()).activities);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function del(id: string, name: string) {
    if (!confirm(`ลบกิจกรรม "${name}"?`)) return;
    await api(token, `/activities/${id}`, { method: "DELETE" });
    load();
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    const isNew = !form._id;
    await api(token, isNew ? "/activities" : `/activities/${form._id}`, {
      method: isNew ? "POST" : "PUT",
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm(null);
    load();
  }

  async function toggleActive(act: AdminActivity) {
    await api(token, `/activities/${act._id}`, { method: "PUT", body: JSON.stringify({ ...act, active: !act.active }) });
    load();
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => f ? { ...f, [k]: e.target.value } : f);

  return (
    <div className="adm-section">
      {form ? (
        /* ── Form ── */
        <div className="adm-act-form">
          <div className="adm-act-form-head">
            {form._id ? "แก้ไขกิจกรรม" : "สร้างกิจกรรมใหม่"}
          </div>
          <div className="adm-act-fields">
            <div className="adm-field">
              <label>BADGE (1–2 ตัวอักษร)</label>
              <input value={form.badge} onChange={set("badge")} maxLength={2} placeholder="S"/>
            </div>
            <div className="adm-field">
              <label>COLOR</label>
              <select className="adm-select" value={form.color} onChange={set("color")}>
                {(Object.keys(COLOR_LABELS) as (keyof typeof COLOR_LABELS)[]).map(k => (
                  <option key={k} value={k}>{COLOR_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label>DATE · เลือกวันที่</label>
              <input
                type="date"
                className="adm-date-pick"
                value={rawDate}
                onChange={e => {
                  setRawDate(e.target.value);
                  setForm(f => f ? { ...f, date: formatActivityDate(e.target.value) } : f);
                }}
              />
              <div className="adm-date-preview">
                {form.date
                  ? <><span>แสดงเป็น:</span><b>{form.date}</b></>
                  : <span className="adm-date-hint">เลือกวันที่จากปฏิทินด้านบน</span>}
              </div>
            </div>
            <div className="adm-field">
              <label>NAME · ชื่อกิจกรรม (EN)</label>
              <input value={form.name} onChange={set("name")} placeholder="Star Jam #06"/>
            </div>
            <div className="adm-field adm-field-wide">
              <label>SHORT DESC · รายละเอียดสั้น (TH) · แสดงในการ์ด</label>
              <input value={form.nameTh} onChange={set("nameTh")} placeholder="แจมสดทุกแนว · Common Room"/>
            </div>
            <div className="adm-field adm-field-wide">
              <label>LONG DESC · รายละเอียดเพิ่มเติม · แสดงใน popup</label>
              <input value={form.description} onChange={set("description")} placeholder="รายละเอียดกิจกรรม เช่น กฎ กติกา สถานที่จอดรถ ฯลฯ"/>
            </div>
            <div className="adm-field adm-field-wide">
              <label>IMAGE URL · ลิงก์รูปภาพ (URL หรือ base64)</label>
              <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://... หรือ data:image/png;base64,..."/>
            </div>
            {form.imageUrl && (
              <div className="adm-field adm-field-wide">
                <label>PREVIEW · ตัวอย่างรูป</label>
                <div className="adm-img-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    onLoad={e => { (e.target as HTMLImageElement).style.display = "block"; }}
                  />
                  <div className="adm-img-err">⚠ โหลดรูปไม่ได้ — ตรวจสอบ URL อีกครั้ง</div>
                </div>
              </div>
            )}
            <div className="adm-field">
              <label>TAG TYPE</label>
              <select className="adm-select" value={form.tag} onChange={set("tag")}>
                {(Object.keys(TAG_LABELS) as (keyof typeof TAG_LABELS)[]).map(k => (
                  <option key={k} value={k}>{TAG_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label>TAG LABEL · ป้ายแท็ก</label>
              <input value={form.tagLabel} onChange={set("tagLabel")} placeholder="JAM"/>
            </div>
            <div className="adm-field">
              <label>ORDER · ลำดับ</label>
              <input type="number" value={form.order} onChange={e => setForm(f => f ? { ...f, order: Number(e.target.value) } : f)}/>
            </div>
          </div>
          <div className="adm-act-form-foot">
            <label className="adm-check">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => f ? { ...f, active: e.target.checked } : f)}/>
              แสดงบนเว็บไซต์ (active)
            </label>
            <div className="adm-acts">
              <button className="adm-btn save" onClick={save} disabled={saving}>{saving ? "..." : "บันทึก"}</button>
              <button className="adm-btn cancel" onClick={() => setForm(null)}>ยกเลิก</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="adm-toolbar">
          <button className="adm-btn-new" onClick={() => { setRawDate(""); setForm({ ...EMPTY_ACT }); }}>+ สร้างกิจกรรมใหม่</button>
          <span className="adm-count">{activities.length} กิจกรรม</span>
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Badge</th><th>วันที่</th><th>ชื่อกิจกรรม</th><th>รายละเอียด</th><th>Tag</th><th>สถานะ</th><th>ลำดับ</th><th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 && (
              <tr><td colSpan={8} className="adm-empty">ยังไม่มีกิจกรรม — กดสร้างกิจกรรมใหม่ด้านบน</td></tr>
            )}
            {activities.map(a => (
              <tr key={a._id} style={!a.active ? { opacity: 0.45 } : {}}>
                <td>
                  <div className="adm-ev-badge" style={{ background: COLOR_HEX[a.color] }}>{a.badge}</div>
                </td>
                <td className="adm-mono">{a.date}</td>
                <td><b>{a.name}</b></td>
                <td className="adm-small">{a.nameTh}</td>
                <td><span className="adm-pill day">{a.tagLabel}</span></td>
                <td>
                  <button className={"adm-btn " + (a.active ? "save" : "cancel")} onClick={() => toggleActive(a)}>
                    {a.active ? "แสดง" : "ซ่อน"}
                  </button>
                </td>
                <td className="adm-mono adm-small">{a.order}</td>
                <td>
                  <div className="adm-acts">
                    <button className="adm-btn edit" onClick={() => { setRawDate(""); setForm({ ...a }); }}>แก้ไข</button>
                    <button className="adm-btn del"  onClick={() => del(a._id, a.name)}>ลบ</button>
                  </div>
                </td>
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
  const [tab, setTab]     = useState<"bookings" | "members" | "activities">("bookings");
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
        <button className={"adm-tab" + (tab === "bookings"   ? " active" : "")} onClick={() => setTab("bookings")}>
          RESERVATIONS · ตารางจอง
        </button>
        <button className={"adm-tab" + (tab === "members"    ? " active" : "")} onClick={() => setTab("members")}>
          MEMBERS · สมาชิก
        </button>
        <button className={"adm-tab" + (tab === "activities" ? " active" : "")} onClick={() => setTab("activities")}>
          ACTIVITIES · กิจกรรม
        </button>
      </div>

      {tab === "bookings"   && <ReservationsTab token={token}/>}
      {tab === "members"    && <MembersTab token={token}/>}
      {tab === "activities" && <ActivitiesTab token={token}/>}
    </div>
  );
}
