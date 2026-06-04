"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef, useState } from "react";

// ─── SVG GLYPHS ─────────────────────────────────────────────────────────────

function Star({ cls }: { cls?: string }) {
  return (
    <svg className={cls ?? "star"} viewBox="0 0 100 100">
      <path d="M50 2 61.8 36.3 98 36.3 68.6 57.6 80.4 92 50 70.6 19.6 92 31.4 57.6 2 36.3 38.2 36.3Z" />
    </svg>
  );
}

function Dot({ cls }: { cls?: string }) {
  return (
    <svg className={cls ?? "live-dot"} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" />
    </svg>
  );
}

function ArrowSvg() {
  return (
    <svg className="bb-arrow" viewBox="0 0 34 34">
      <line x1="6" y1="28" x2="28" y2="6" />
      <line x1="11" y1="6" x2="28" y2="6" />
      <line x1="28" y1="23" x2="28" y2="6" />
    </svg>
  );
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

type ModalType = "register" | "booking" | null;
type Mode = "launch" | "buffet";

interface BookingEntry {
  day: string;
  start: string;
  end: string;
  night: boolean;
  band: string;
  members: { sid: string; name: string }[];
}
type BookingsMap = Record<string, BookingEntry>;

interface MemberInfo {
  name: string;
  sid: string;
  faculty: string;
  phone: string;
}

// ─── SLOT MATRIX ─────────────────────────────────────────────────────────────

const WEEKDAY_DAY   = [["17:00","18:00"],["18:00","19:00"],["19:00","20:00"],["20:00","21:00"],["21:00","22:00"],["22:00","23:00"]] as const;
const WEEKDAY_NIGHT = [["23:00","00:00"],["00:00","01:00"],["01:00","02:00"],["02:00","03:00"],["03:00","04:00"],["04:00","05:00"],["05:00","06:00"]] as const;
const WEEKEND_DAY   = [["08:00","09:00"],["09:00","10:00"],["10:00","11:00"],["11:00","12:00"],["12:00","13:00"],["13:00","14:00"],["14:00","15:00"],["15:00","16:00"],["16:00","17:00"],["17:00","18:00"],["18:00","19:00"],["19:00","20:00"],["20:00","21:00"],["21:00","22:00"],["22:00","23:00"],["23:00","00:00"]] as const;
const WEEKEND_NIGHT = [["00:00","01:00"],["01:00","02:00"],["02:00","03:00"],["03:00","04:00"],["04:00","05:00"],["05:00","06:00"]] as const;

const DAYS = [
  { key:"mon", en:"MON", th:"จันทร์",   wk:false },
  { key:"tue", en:"TUE", th:"อังคาร",   wk:false },
  { key:"wed", en:"WED", th:"พุธ",      wk:false },
  { key:"thu", en:"THU", th:"พฤหัสบดี", wk:false },
  { key:"fri", en:"FRI", th:"ศุกร์",    wk:false },
  { key:"sat", en:"SAT", th:"เสาร์",    wk:true  },
  { key:"sun", en:"SUN", th:"อาทิตย์",  wk:true  },
];

interface SlotDef { id: string; day: string; start: string; end: string; night: boolean; }
function daySlots(day: typeof DAYS[number]): { day: SlotDef[]; night: SlotDef[] } {
  const dayArr   = day.wk ? WEEKEND_DAY   : WEEKDAY_DAY;
  const nightArr = day.wk ? WEEKEND_NIGHT : WEEKDAY_NIGHT;
  const mk = (arr: readonly (readonly [string,string])[], isNight: boolean): SlotDef[] =>
    arr.map(([s,e]) => ({ id:`${day.key}__${s}`, day: day.key, start:s, end:e, night: isNight }));
  return { day: mk(dayArr, false), night: mk(nightArr, true) };
}
const slotLabel = (s: { start:string; end:string }) => `${s.start}–${s.end}`;

// ─── NAV ─────────────────────────────────────────────────────────────────────

function Nav({ onOpen }: { onOpen:(m:ModalType)=>void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { en:"Live", th:"สถานะห้อง", href:"#live" },
    { en:"Activity", th:"กิจกรรม", href:"#activity" },
    { en:"About", th:"เกี่ยวกับ", href:"#about" },
  ];
  return (
    <header>
      <nav className="nav">
        <a className="nav-brand" href="#top">
          <Image src="/logo-black.png" alt="STARPARTY" width={80} height={32} unoptimized style={{height:32,width:"auto"}} />
          <span className="wm">STARPARTY<span className="th">สถาปาร์ตี้</span></span>
        </a>
        <div className="nav-links">
          {links.map(l => (
            <a className="nav-link" key={l.en} href={l.href}>
              {l.en}<span className="th">{l.th}</span>
            </a>
          ))}
          <button className="nav-link cta" onClick={() => onOpen("register")}>
            Join<span className="th">สมัครสมาชิก</span>
          </button>
        </div>
        <button className="nav-burger" aria-label="menu" onClick={() => setMenuOpen(o => !o)}>
          <svg width="26" height="26" viewBox="0 0 26 26">
            <line x1="3" y1="7" x2="23" y2="7"/><line x1="3" y1="13" x2="23" y2="13"/><line x1="3" y1="19" x2="23" y2="19"/>
          </svg>
        </button>
      </nav>
      {menuOpen && (
        <div className="nav-mobile">
          {links.map(l => (
            <a className="nav-link" key={l.en} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.en} · {l.th}
            </a>
          ))}
          <button className="nav-link cta" onClick={() => { setMenuOpen(false); onOpen("register"); }}>
            Join the Party · สมัครสมาชิก
          </button>
        </div>
      )}
    </header>
  );
}

// ─── LIVE STATUS ─────────────────────────────────────────────────────────────

const STATUSES = [
  { type:"live", th:<>วง <b>MONSOON KIDS</b> กำลังซ้อมอยู่</>, time:"17:00 – 19:00", room:"STUDIO A" },
  { type:"open", th:<>ห้องซ้อมว่าง — <b>จองได้เลยตอนนี้</b></>, time:"จนถึง 17:00", room:"STUDIO A" },
  { type:"live", th:<>วง <b>คอนกรีตหวาน</b> กำลังแจมสด</>, time:"19:00 – 21:00", room:"STUDIO B" },
];

function LiveStatus({ onOpen }: { onOpen:(m:ModalType)=>void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const t = setInterval(() => setI(n => (n + 1) % STATUSES.length), 4200);
    return () => clearInterval(t);
  }, []);
  const s = STATUSES[i];
  const isLive = s.type === "live";
  return (
    <section id="live" className={"live " + (isLive ? "is-live" : "is-open")}>
      <Dot />
      <span className="live-key">{isLive ? "● LIVE" : "○ OPEN"}</span>
      <span className="live-th">{s.th}</span>
      <div className="live-meta">
        <span>{s.time}</span>
        <span className="sep" />
        <span>{s.room}</span>
        {!isLive && <><span className="sep" /><button className="live-key" onClick={() => onOpen("booking")}>จองเลย →</button></>}
      </div>
    </section>
  );
}

// ─── MARQUEE ─────────────────────────────────────────────────────────────────

const NEWS = [
  "ตารางซ้อมสัปดาห์นี้เต็มไวมาก จองล่วงหน้าได้เลย",
  "อย่าลืมรักษาความสะอาดห้องซ้อม เก็บสายแจ็คเข้าที่ทุกครั้ง",
  "STAR JAM #05 เปิดรับวงแล้ว — ส่งชื่อวงในไลน์กลุ่ม",
  "Open Mic Night ศุกร์นี้ 20:00 ที่ Common Room ใครก็ขึ้นได้",
  "รับสมัครสมาชิกใหม่ปีการศึกษา 2569 ไม่จำกัดชั้นปี",
];

function Marquee() {
  const row = (
    <div className="marquee-track" aria-hidden="false">
      <span className="marquee-label" style={{paddingLeft:16}}>★ STARPARTY NEWS</span>
      {NEWS.map((n,idx) => <span className="marquee-item" key={idx}><Star cls="star"/>{n}</span>)}
      <span className="marquee-label">★ STARPARTY NEWS</span>
      {NEWS.map((n,idx) => <span className="marquee-item" key={"b"+idx}><Star cls="star"/>{n}</span>)}
    </div>
  );
  return <div className="marquee">{row}</div>;
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero({ onOpen }: { onOpen:(m:ModalType)=>void }) {
  return (
    <>
      <section className="hero">
        <div className="hero-kicker">
          <Star cls="star"/>
          <span className="label">MUSIC CLUB · ARCH &amp; PLANNING · TU RANGSIT</span>
        </div>
        <h1 className="hero-title">Make<br/>Noise<br/>Together</h1>
        <div className="hero-th">สถาปาร์ตี้ — ชมรมดนตรีของคณะสถาปัตย์ฯ ที่ทุกคนมาเล่นด้วยกัน ไม่มีกฎ ไม่มีกรอบ</div>
      </section>
      <section className="hero-actions">
        <button className="bigbtn blue" onClick={() => onOpen("register")}>
          <div className="bb-top"><span className="bb-tag">Membership</span><ArrowSvg/></div>
          <div className="bb-text">
            <span className="bb-en">Register<br/>Member</span>
            <span className="bb-th">สมัครสมาชิกชมรม</span>
          </div>
        </button>
        <button className="bigbtn red" onClick={() => onOpen("booking")}>
          <div className="bb-top"><span className="bb-tag">Studio</span><ArrowSvg/></div>
          <div className="bb-text">
            <span className="bb-en">Studio<br/>Booking</span>
            <span className="bb-th">จองห้องซ้อมดนตรี</span>
          </div>
        </button>
      </section>
    </>
  );
}

// ─── ABOUT ───────────────────────────────────────────────────────────────────

function About() {
  return (
    <section id="about">
      <div className="sec-head"><h2>About STARPARTY</h2><span className="th">เราคือใคร</span></div>
      <div className="about">
        <div className="about-cell about-lead">
          <span className="num">01 — IDENTITY</span>
          <h3>Music × Architecture</h3>
          <p>STARPARTY (สถาปาร์ตี้) คือชมรมดนตรีอย่างเป็นทางการของคณะสถาปัตยกรรมศาสตร์และการผังเมือง มหาวิทยาลัยธรรมศาสตร์ (รังสิต) — พื้นที่ที่นักออกแบบ นักผัง และคนรักเสียงเพลงมาเจอกัน</p>
        </div>
        <div className="about-cell">
          <span className="num">02 — WHAT WE DO</span>
          <h3>Jam · Gig · Make</h3>
          <p>เปิดห้องซ้อม จัดไลฟ์ Open Mic และอีเวนต์ตลอดทั้งปี ใครเล่นแนวไหนก็มาแจมด้วยกันได้ ไม่แบ่งวง ไม่แบ่งฝ่าย</p>
        </div>
        <div className="about-cell about-stat fill-yellow">
          <span className="num">03 — THE CLUB</span>
          <div className="big">120+</div>
          <p>สมาชิกที่ active · 2 ห้องซ้อม · อีเวนต์เฉลี่ยเดือนละ 4 ครั้ง</p>
        </div>
      </div>
    </section>
  );
}

// ─── ACTIVITY ─────────────────────────────────────────────────────────────────

const EVENTS = [
  { badge:"S", color:"r", date:"SAT 14 JUN", name:"Star Jam #05", th:"แจมสดทุกแนว เปิดเวทีให้ทุกคน · Common Room", tag:"jam", tagLabel:"JAM" },
  { badge:"O", color:"y", date:"FRI 20 JUN", name:"Open Mic Night", th:"ใครอยากขึ้นก็ขึ้น ไม่ต้องสมัคร · Studio B", tag:"open", tagLabel:"OPEN MIC" },
  { badge:"R", color:"b", date:"SAT 28 JUN", name:"Rev Up! Rooftop", th:"ไลฟ์เซ็ตบนดาดฟ้า พระอาทิตย์ตก · Rooftop", tag:"live", tagLabel:"LIVE" },
  { badge:"W", color:"o", date:"EVERY WED",  name:"Do It For The Plot", th:"ซ้อมรวมประจำสัปดาห์ มาเล่นเล่น · Jam Room", tag:"jam", tagLabel:"JAM" },
];
const GALLERY = [{ cap:"STAR JAM #04" },{ cap:"OPEN MIC · MAY" },{ cap:"ROOFTOP SET" }];

function Activity({ onOpen }: { onOpen:(m:ModalType)=>void }) {
  return (
    <section id="activity">
      <div className="sec-head"><h2>Activity &amp; Gallery</h2><span className="th">กิจกรรม &amp; ภาพบรรยากาศ</span></div>
      <div className="activity">
        <div className="cal">
          {EVENTS.map((e,i) => (
            <div className="ev" key={i} onClick={() => onOpen("booking")}>
              <div className={"ev-badge " + e.color}>{e.badge}</div>
              <div className="ev-date">{e.date}</div>
              <div className="ev-mid">
                <div className="ev-name">{e.name}</div>
                <div className="ev-th">{e.th}</div>
              </div>
              <div className={"ev-tag " + e.tag}>{e.tagLabel}</div>
            </div>
          ))}
        </div>
        <div className="gal">
          {GALLERY.map((g,i) => (
            <div className="gal-cell" key={i}>
              <div className="gal-ph"><Star cls="star"/></div>
              <span className="gal-cap">{g.cap}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer({ onOpen }: { onOpen:(m:ModalType)=>void }) {
  return (
    <footer className="foot">
      <div className="foot-top">
        <div className="foot-cell foot-brand">
          <span className="k">The Club</span>
          <Image src="/logo-white.png" alt="STARPARTY" width={80} height={30} unoptimized style={{height:30,width:"auto",marginBottom:12}} />
          <div className="th">สถาปาร์ตี้ — ชมรมดนตรี คณะสถาปัตยกรรมศาสตร์และการผังเมือง มหาวิทยาลัยธรรมศาสตร์ (รังสิต)</div>
        </div>
        <div className="foot-cell">
          <span className="k">Find Us</span>
          <div className="foot-soc">
            <a><Dot cls="dot"/>Instagram · @starparty.tu</a>
            <a><Dot cls="dot"/>Facebook · STARPARTY</a>
            <a><Dot cls="dot"/>LINE OA · @starparty</a>
            <a><Dot cls="dot"/>YouTube · STARPARTY LIVE</a>
          </div>
        </div>
        <div className="foot-cell">
          <span className="k">Get Involved</span>
          <div className="foot-soc">
            <a onClick={() => onOpen("register")}><Dot cls="dot"/>สมัครสมาชิกชมรม</a>
            <a onClick={() => onOpen("booking")}><Dot cls="dot"/>จองห้องซ้อมดนตรี</a>
            <a href="#activity"><Dot cls="dot"/>ดูกิจกรรมทั้งหมด</a>
          </div>
        </div>
        <div className="foot-cell">
          <span className="k">Studio Hours</span>
          <div className="foot-soc" style={{gap:6}}>
            <a style={{cursor:"default"}}>MON–FRI · 17:00–06:00</a>
            <a style={{cursor:"default"}}>SAT–SUN · 08:00–06:00</a>
            <a style={{cursor:"default"}}>ARCH FACULTY · TU RANGSIT</a>
          </div>
        </div>
      </div>
      <div className="foot-bar">
        <span className="copy">© 2026 STARPARTY CLUB. ALL NIGHTS RESERVED.</span>
        <span className="mark"><Star cls="star"/><Star cls="star"/><Star cls="star"/></span>
      </div>
    </footer>
  );
}

// ─── MODAL SHELL ─────────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose:()=>void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

function CloseBtn({ onClick }: { onClick:()=>void }) {
  return (
    <button className="modal-x" aria-label="close" onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 20 20">
        <line x1="3" y1="3" x2="17" y2="17"/><line x1="17" y1="3" x2="3" y2="17"/>
      </svg>
    </button>
  );
}

// ─── REGISTER MODAL ───────────────────────────────────────────────────────────

function RegisterModal({ onClose }: { onClose:()=>void }) {
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState<{ name:string; sid:string; faculty:string; phone:string; no:number }|null>(null);
  const [f, setF] = useState({ name:"", sid:"", faculty:"", phone:"" });
  const [errors, setErrors] = useState<Partial<Record<string,string>>>({});
  const [dupe, setDupe] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "sid" || k === "phone") v = v.replace(/\D/g,"");
    setF(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
    if (k === "sid") setDupe(false);
  };

  function validate() {
    const er: Record<string,string> = {};
    if (!f.name.trim())               er.name    = "กรุณากรอกชื่อ–นามสกุล";
    if (!/^\d{10}$/.test(f.sid))      er.sid     = "รหัสนิสิตต้องเป็นตัวเลข 10 หลัก";
    if (!f.faculty.trim())            er.faculty = "กรุณากรอกคณะ/ภาควิชา";
    if (!/^\d{9,10}$/.test(f.phone))  er.phone   = "เบอร์โทรศัพท์ไม่ถูกต้อง (9–10 หลัก)";
    return er;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    setDupe(false);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.name.trim(), sid: f.sid, faculty: f.faculty.trim(), phone: f.phone }),
      });
      const data = await res.json();
      if (res.status === 409) { setDupe(true); return; }
      if (!res.ok) { setErrors({ name: data.message || "Registration failed" }); return; }
      setSaved({ ...data.member, no: data.memberNo });
      setDone(true);
    } catch {
      setErrors({ name: "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  }

  const fe = (k: string) => errors[k] ? "field err" : "field";

  return (
    <Overlay onClose={onClose}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head blue">
          <div><h3>Register Member</h3><div className="th">สมัครสมาชิกชมรม STARPARTY</div></div>
          <CloseBtn onClick={onClose}/>
        </div>
        {done && saved ? (
          <div className="modal-done">
            <Star cls="star"/>
            <h3>Registration Complete!</h3>
            <div className="th"><b>ลงทะเบียนสำเร็จ</b> — ยินดีต้อนรับ <b>{saved.name}</b> สู่ STARPARTY เก็บรหัสนิสิตไว้ใช้เช็คอินและจองห้องซ้อมได้เลย</div>
            <div className="recap">
              <div><b>Name</b><span>{saved.name}</span></div>
              <div><b>Student ID</b><span>{saved.sid}</span></div>
              <div><b>Faculty</b><span>{saved.faculty}</span></div>
              <div><b>Contact</b><span>{saved.phone}</span></div>
              <div><b>Member No.</b><span>#{String(saved.no).padStart(3,"0")}</span></div>
            </div>
            <button className="modal-submit blue" onClick={onClose}>Back to Home · กลับหน้าหลัก</button>
          </div>
        ) : (
          <form className="modal-body" onSubmit={submit} noValidate>
            {dupe && (
              <div className="form-error" role="alert">
                <Star cls="star"/>
                <span>รหัสนิสิตนี้เคยลงทะเบียนไว้แล้ว!</span>
              </div>
            )}
            <div className={fe("name")}>
              <label>Full Name <span className="th">ชื่อ–นามสกุล</span></label>
              <input value={f.name} onChange={set("name")} placeholder="เช่น สมหญิง ใจดี"/>
              {errors.name && <span className="field-msg">{errors.name}</span>}
            </div>
            <div className={fe("sid")}>
              <label>Student ID <span className="th">รหัสนิสิต</span></label>
              <input value={f.sid} onChange={set("sid")} inputMode="numeric" maxLength={10} placeholder="ตัวเลข 10 หลัก"/>
              {errors.sid ? <span className="field-msg">{errors.sid}</span> : <span className="hint">10 digits · ตัวเลข 10 หลัก</span>}
            </div>
            <div className={fe("faculty")}>
              <label>Faculty / Dept. <span className="th">คณะ/ภาควิชา</span></label>
              <input value={f.faculty} onChange={set("faculty")} placeholder="เช่น สถาปัตยกรรมศาสตร์ / การผังเมือง"/>
              {errors.faculty && <span className="field-msg">{errors.faculty}</span>}
            </div>
            <div className={fe("phone")}>
              <label>Contact Number <span className="th">เบอร์โทรศัพท์</span></label>
              <input value={f.phone} onChange={set("phone")} inputMode="numeric" maxLength={10} placeholder="08X-XXX-XXXX"/>
              {errors.phone && <span className="field-msg">{errors.phone}</span>}
            </div>
            <button className="modal-submit blue" type="submit" disabled={loading}>
              {loading ? "กำลังลงทะเบียน..." : "Register · ลงทะเบียน"}
            </button>
          </form>
        )}
      </div>
    </Overlay>
  );
}

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────

function SlotLegend() {
  return (
    <div className="legend">
      <span className="lg"><i className="sw free"></i>ว่าง</span>
      <span className="lg"><i className="sw sel"></i>เลือกอยู่</span>
      <span className="lg"><i className="sw night"></i>หลังเที่ยงคืน · ฟรีไม่จำกัด</span>
      <span className="lg"><i className="sw booked"></i>จองแล้ว</span>
      <span className="lg"><i className="sw lock"></i>ติดกฎ/โควตา</span>
    </div>
  );
}

function SlotChip({ slot, bookings, selected, onPick }: {
  slot: SlotDef; bookings: BookingsMap; selected:string|null; onPick:(s:SlotDef)=>void;
}) {
  const booked = bookings[slot.id];
  const isSel = selected === slot.id;
  let cls = "chip";
  if (slot.night) cls += " night";
  if (booked) cls += " booked";
  else if (isSel) cls += " sel";
  const title = booked ? `จองแล้ว · ${booked.band}` : "ว่าง · กดเพื่อเลือก";
  return (
    <button type="button" className={cls} title={title}
            onClick={() => onPick(slot)} disabled={!!booked}>
      <span className="chip-time">{slotLabel(slot)}</span>
      <span className="chip-band">{booked ? booked.band : (slot.night ? "FREE" : "ว่าง")}</span>
    </button>
  );
}

function DayRow({ day, bookings, selected, onPick }: {
  day: typeof DAYS[number]; bookings: BookingsMap; selected:string|null; onPick:(s:SlotDef)=>void;
}) {
  const s = daySlots(day);
  return (
    <div className="day-row">
      <div className="day-label">
        <span className="dl-en">{day.en}</span>
        <span className="dl-th">{day.th}</span>
      </div>
      <div className="day-slots">
        <div className="slot-group">
          {s.day.map(slot => <SlotChip key={slot.id} slot={slot} bookings={bookings} selected={selected} onPick={onPick}/>)}
        </div>
        <div className="night-sep">หลังเที่ยงคืน · FREE</div>
        <div className="slot-group">
          {s.night.map(slot => <SlotChip key={slot.id} slot={slot} bookings={bookings} selected={selected} onPick={onPick}/>)}
        </div>
      </div>
    </div>
  );
}

function BookingModal({ onClose, bookings, mode, onRefresh }: {
  onClose:()=>void; bookings: BookingsMap; mode: Mode; onRefresh:()=>void;
}) {
  const [done, setDone] = useState(false);
  const [receipt, setReceipt] = useState<{ band:string; dayMeta:typeof DAYS[number]; slot:SlotDef; members:{sid:string;name:string}[] }|null>(null);
  const [band, setBand] = useState("");
  const [members, setMembers] = useState([""]);
  const [selected, setSelected] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);

  // member name cache: sid → MemberInfo | null | "loading" | undefined (undefined = not fetched)
  const cache = useRef<Partial<Record<string, MemberInfo | null | "loading">>>({});
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const lookupMember = async (sid: string) => {
    if (cache.current[sid] !== undefined) return;
    cache.current[sid] = "loading";
    try {
      const res = await fetch(`/api/members/${sid}`);
      cache.current[sid] = res.ok ? (await res.json()).member as MemberInfo : null;
    } catch {
      cache.current[sid] = null;
    }
    forceUpdate();
  };

  // Trigger lookup when a 10-digit ID is entered
  useEffect(() => {
    for (const sid of members) {
      const s = sid.trim();
      if (/^\d{10}$/.test(s) && cache.current[s] === undefined) {
        lookupMember(s);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members]);

  const setMember = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g,"").slice(0,10);
    setMembers(ms => ms.map((m,idx) => idx === i ? v : m));
    setError(null);
  };
  const addMember = () => setMembers(ms => ms.length < 8 ? [...ms,""] : ms);
  const removeMember = (i:number) => setMembers(ms => ms.length > 1 ? ms.filter((_,idx)=>idx!==i) : ms);

  // Build flat slot map for picking
  const flatSlots: Record<string, SlotDef> = {};
  DAYS.forEach(d => { const s = daySlots(d); [...s.day,...s.night].forEach(x => { flatSlots[x.id]=x; }); });
  const selSlot = selected ? flatSlots[selected] : null;

  function pickSlot(slot: SlotDef) {
    if (bookings[slot.id]) return;
    setSelected(slot.id);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selSlot) { setError("กรุณาเลือกช่วงเวลาที่ต้องการจองในตาราง"); return; }
    const ids = members.map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) { setError("กรุณากรอกรหัสนิสิตของสมาชิกอย่างน้อย 1 คน"); return; }
    if (ids.some(id => !/^\d{10}$/.test(id))) { setError("รหัสนิสิตต้องเป็นตัวเลข 10 หลักทุกคน"); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selSlot.id,
          day: selSlot.day,
          start: selSlot.start,
          end: selSlot.end,
          night: selSlot.night,
          band,
          members: ids,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Booking failed"); return; }

      // Build receipt
      const memberObjs = ids.map(id => {
        const info = cache.current[id];
        return { sid: id, name: (info && info !== "loading") ? info.name : id };
      });
      const dayMeta = DAYS.find(d => d.key === selSlot.day)!;
      const finalBand = band.trim() || "ซ้อมส่วนตัว";
      setReceipt({ band: finalBand, dayMeta, slot: selSlot, members: memberObjs });
      setDone(true);
      onRefresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal modal-wide" role="dialog" aria-modal="true">
        <div className="modal-head red">
          <div><h3>Studio Booking</h3><div className="th">จองห้องซ้อมดนตรี · ห้องซ้อมเดียว · รอบสัปดาห์</div></div>
          <CloseBtn onClick={onClose}/>
        </div>
        {done && receipt ? (
          <div className="modal-done">
            <Star cls="star"/>
            <h3>Booked!</h3>
            <div className="th">จองห้องซ้อมให้ <b>{receipt.band}</b> เรียบร้อย · มาตรงเวลาและช่วยกันรักษาความสะอาดห้องซ้อมนะ</div>
            <div className="recap">
              <div><b>Band</b><span>{receipt.band}</span></div>
              <div><b>Day</b><span>{receipt.dayMeta.en} · {receipt.dayMeta.th}</span></div>
              <div><b>Time</b><span>{slotLabel(receipt.slot)}{receipt.slot.night ? " · OVERNIGHT" : ""}</span></div>
              <div><b>Members</b><span>{receipt.members.length} คน</span></div>
            </div>
            <button className="modal-submit red" onClick={onClose}>Back to Home · กลับหน้าหลัก</button>
          </div>
        ) : (
          <form className="modal-body booking-body" onSubmit={submit} noValidate>
            {error && <div className="form-error" role="alert"><Star cls="star"/><span>{error}</span></div>}

            {/* Band name */}
            <div className="field">
              <label>Session Band <span className="th">ชื่อวงรอบนี้</span></label>
              <input value={band} onChange={e => setBand(e.target.value)} placeholder="เว้นว่างไว้ = ซ้อมส่วนตัว"/>
              <span className="hint">เว้นว่าง = ซ้อมส่วนตัว</span>
            </div>

            {/* Member IDs */}
            <div className="field">
              <label>Member Student IDs <span className="th">รหัสนิสิตสมาชิกที่มาซ้อม</span></label>
              <div className="member-list">
                {members.map((m,i) => {
                  const s = m.trim();
                  const isTen = /^\d{10}$/.test(s);
                  const info = s ? cache.current[s] : undefined;
                  const found = isTen && info && info !== "loading" ? info as MemberInfo : null;
                  const bad = isTen && info === null;
                  return (
                    <div className="member-row" key={i}>
                      <span className="member-no">{String(i+1).padStart(2,"0")}</span>
                      <input value={m} onChange={setMember(i)} inputMode="numeric" maxLength={10} placeholder="รหัสนิสิต 10 หลัก"/>
                      <span className={"member-name" + (s ? (found ? " ok" : bad ? " bad" : "") : "")}>
                        {s === "" ? "—" : isTen ? (found ? found.name : bad ? "ไม่พบในระบบ" : "กำลังตรวจสอบ...") : "ยังไม่ครบ 10 หลัก"}
                      </span>
                      <button type="button" className="member-x" onClick={() => removeMember(i)}
                              disabled={members.length === 1} aria-label="remove">×</button>
                    </div>
                  );
                })}
              </div>
              <button type="button" className="add-member" onClick={addMember} disabled={members.length >= 8}>
                + Add Member · เพิ่มสมาชิก
              </button>
            </div>

            {/* Slot grid */}
            <div className="field">
              <label>Pick a Slot <span className="th">เลือกช่วงเวลา · ห้องซ้อมเดียว</span></label>
              <SlotLegend/>
              <div className="grid-block">
                <div className="grid-banner">WEEKDAYS · จันทร์–ศุกร์ <span>ซ้อมได้ 17:00 เป็นต้นไป</span></div>
                {DAYS.filter(d => !d.wk).map(d => (
                  <DayRow key={d.key} day={d} bookings={bookings} selected={selected} onPick={pickSlot}/>
                ))}
                <div className="grid-banner alt">WEEKENDS · เสาร์–อาทิตย์ <span>เปิด 24 ชม.</span></div>
                {DAYS.filter(d => d.wk).map(d => (
                  <DayRow key={d.key} day={d} bookings={bookings} selected={selected} onPick={pickSlot}/>
                ))}
              </div>
            </div>

            {/* Mode badge */}
            <div style={{fontSize:13,fontFamily:"var(--font-en)",fontWeight:700,opacity:0.6}}>
              MODE: {mode === "buffet" ? "BUFFET · ไม่จำกัดโควตา" : "LAUNCH · วันธรรมดา 3 ชม./สัปดาห์ · เสาร์-อาทิตย์ 6 ชม./สัปดาห์"}
            </div>

            <button className="modal-submit red" type="submit" disabled={submitting}>
              {submitting ? "กำลังจอง..." : "Confirm Booking · ยืนยันการจอง"}
            </button>
          </form>
        )}
      </div>
    </Overlay>
  );
}

// ─── TEST PANEL ───────────────────────────────────────────────────────────────

function TestPanel({ mode, bookingCount, onStateChange }: {
  mode: Mode; bookingCount: number; onStateChange: (state:"state1"|"state2")=>Promise<void>;
}) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const trigger = async (state: "state1"|"state2") => {
    setLoading(true);
    try { await onStateChange(state); } finally { setLoading(false); }
  };

  if (!open) return <button className="tp-fab" onClick={() => setOpen(true)}>★ TEST</button>;
  return (
    <div className="testpanel">
      <div className="tp-head">
        <span>★ TEST PANEL</span>
        <button className="tp-min" onClick={() => setOpen(false)} aria-label="minimise">–</button>
      </div>
      <div className="tp-body">
        <div className="tp-state">
          <span className="tp-k">MODE</span>
          <span className={"tp-badge " + (mode === "buffet" ? "b" : "r")}>
            {mode === "buffet" ? "BUFFET · ไม่จำกัดโควตา" : "LAUNCH · จ-ศ 3ชม. / ส-อ 6ชม."}
          </span>
        </div>
        <button className="tp-btn r" onClick={() => trigger("state1")} disabled={loading}>
          STATE 1 — Sunday 18:00<small>Weekly reset · เปิดตารางใหม่ + โควตา</small>
        </button>
        <button className="tp-btn b" onClick={() => trigger("state2")} disabled={loading}>
          STATE 2 — Sunday 23:59<small>Buffet mode · ปลดล็อกโควตา</small>
        </button>
        <div className="tp-meta">
          <span>จองแล้ว {bookingCount} สล็อต</span>
        </div>
        <div className="tp-ids">
          <span className="tp-k">ทดสอบ: สมัครสมาชิกก่อน แล้วใช้รหัสจอง</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [modal, setModal] = useState<ModalType>(null);
  const [bookings, setBookings] = useState<BookingsMap>({});
  const [mode, setMode] = useState<Mode>("launch");

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) return;
      const data = await res.json();
      setBookings(data.bookings || {});
      setMode(data.mode || "launch");
    } catch {}
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleStateChange = async (state: "state1"|"state2") => {
    try {
      const res = await fetch("/api/bookings/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      if (res.ok) { await fetchBookings(); }
    } catch {}
  };

  const openModal = (m: ModalType) => setModal(m);
  const closeModal = () => setModal(null);

  return (
    <>
      <div className="app" id="top">
        <Nav onOpen={openModal}/>
        <LiveStatus onOpen={openModal}/>
        <Marquee/>
        <Hero onOpen={openModal}/>
        <About/>
        <Activity onOpen={openModal}/>
        <Footer onOpen={openModal}/>
      </div>
      <TestPanel
        mode={mode}
        bookingCount={Object.keys(bookings).length}
        onStateChange={handleStateChange}
      />
      {modal === "register" && <RegisterModal onClose={closeModal}/>}
      {modal === "booking" && (
        <BookingModal
          onClose={closeModal}
          bookings={bookings}
          mode={mode}
          onRefresh={fetchBookings}
        />
      )}
    </>
  );
}
