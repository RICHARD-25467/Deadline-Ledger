import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, Circle,
  ClipboardList, Edit3, LogOut, Plus, Search, Trash2, X, Bell, LayoutDashboard
} from "lucide-react";
import "./styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

const CATEGORIES = ["Assignment", "Exam", "Project", "Reading", "Other"];
const PRIORITIES = ["low", "medium", "high"];

function isoDate(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
}
function todayISO(){ return isoDate(new Date()); }
function daysBetween(a,b){
  return Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);
}
function fmtDate(v){
  if(!v) return "";
  return new Date(v+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
function fmtTime(v){
  if(!v) return "";
  const [h,m]=v.slice(0,5).split(":").map(Number);
  return `${((h+11)%12)+1}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}
function statusOf(d){
  if(d.completed) return "completed";
  const diff=daysBetween(todayISO(),d.due_date);
  if(diff<0) return "overdue";
  if(diff<=7) return "soon";
  return "later";
}

function AuthScreen(){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function submit(e){
    e.preventDefault(); setLoading(true); setError(""); setMessage("");
    if(!supabaseUrl || !supabaseAnonKey){ setError("Add your Supabase URL and anon key to .env.local first."); setLoading(false); return; }
    const result=mode==="login"
      ? await supabase.auth.signInWithPassword({email,password})
      : await supabase.auth.signUp({email,password});
    if(result.error) setError(result.error.message);
    else if(mode==="signup") setMessage("Account created. Check your email if email confirmation is enabled.");
    setLoading(false);
  }
  return <div className="auth-page">
    <div className="auth-card">
      <div className="brand-mark">Deadline Ledger</div>
      <p className="auth-sub">Keep every due date in one place.</p>
      <h1>{mode==="login"?"Welcome back":"Create your account"}</h1>
      <p className="muted">{mode==="login"?"Sign in to manage your deadlines.":"Start organizing assignments, exams and projects."}</p>
      <form onSubmit={submit} className="auth-form">
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required /></label>
        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}
        <button className="primary full" disabled={loading}>{loading?"Please wait…":mode==="login"?"Sign in":"Create account"}</button>
      </form>
      <button className="text-btn" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("")}}>
        {mode==="login"?"Need an account? Create one":"Already have an account? Sign in"}
      </button>
    </div>
  </div>
}

function DeadlineModal({item,onClose,onSave,onDelete}){
  const editing=!!item;
  const [form,setForm]=useState(item ? {
    title:item.title, course:item.course||"", category:item.category, due_date:item.due_date,
    due_time:item.due_time?.slice(0,5)||"", priority:item.priority, reminder_days:item.reminder_days,
    notes:item.notes||""
  } : {title:"",course:"",category:"Assignment",due_date:todayISO(),due_time:"",priority:"medium",reminder_days:1,notes:""});
  const [saving,setSaving]=useState(false);
  function set(k,v){setForm(f=>({...f,[k]:v}))}
  async function submit(e){
    e.preventDefault(); setSaving(true);
    await onSave(form);
    setSaving(false);
  }
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal">
      <div className="modal-head"><h2>{editing?"Edit deadline":"Add deadline"}</h2><button className="icon" onClick={onClose}><X size={18}/></button></div>
      <form onSubmit={submit}>
        <label>Title<input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Problem Set 4" required maxLength="200"/></label>
        <div className="two">
          <label>Course<input value={form.course} onChange={e=>set("course",e.target.value)} placeholder="e.g. CS 201"/></label>
          <label>Category<select value={form.category} onChange={e=>set("category",e.target.value)}>{CATEGORIES.map(x=><option key={x}>{x}</option>)}</select></label>
        </div>
        <div className="two">
          <label>Due date<input type="date" value={form.due_date} onChange={e=>set("due_date",e.target.value)} required/></label>
          <label>Due time <span className="hint">(optional)</span><input type="time" value={form.due_time} onChange={e=>set("due_time",e.target.value)}/></label>
        </div>
        <label>Priority</label>
        <div className="priority-picker">{PRIORITIES.map(p=><button type="button" key={p} className={`priority ${p} ${form.priority===p?"selected":""}`} onClick={()=>set("priority",p)}>{p[0].toUpperCase()+p.slice(1)}</button>)}</div>
        <label>Remind me
          <select value={form.reminder_days} onChange={e=>set("reminder_days",Number(e.target.value))}>
            <option value="0">On the day</option><option value="1">1 day before</option><option value="2">2 days before</option>
            <option value="3">3 days before</option><option value="7">1 week before</option>
          </select>
        </label>
        <label>Notes <span className="hint">(optional)</span><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Details, links, what to bring…"/></label>
        <div className="modal-actions">
          {editing ? <button type="button" className="danger-text" onClick={onDelete}><Trash2 size={14}/> Delete</button> : <span/>}
          <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving?"Saving…":editing?"Save changes":"Save deadline"}</button></div>
        </div>
      </form>
    </div>
  </div>
}

function DeadlineCard({d,onToggle,onEdit,onDelete}){
  const s=statusOf(d);
  let label=fmtDate(d.due_date);
  const diff=daysBetween(todayISO(),d.due_date);
  if(!d.completed){ if(diff===0) label="Today"; else if(diff===1) label="Tomorrow"; else if(diff<0) label=`${fmtDate(d.due_date)} (${Math.abs(diff)}d overdue)`; }
  return <div className={`deadline-card ${d.priority} ${s==="overdue"?"overdue":""} ${d.completed?"completed":""}`}>
    <button className={`check ${d.completed?"checked":""}`} onClick={()=>onToggle(d)}>{d.completed?<Check size={12}/>:<Circle size={14}/>}</button>
    <div className="deadline-main" onClick={()=>onEdit(d)}>
      <div className="deadline-title">{d.title}</div>
      <div className={`deadline-meta ${s}`}>{label}{d.due_time?`, ${fmtTime(d.due_time)}`:""} {d.course&&<>· {d.course}</>} · <span className="tag">{d.category}</span></div>
      {d.notes&&<div className="note-preview">{d.notes}</div>}
    </div>
    <div className="card-actions"><button className="icon" onClick={()=>onEdit(d)} title="Edit"><Edit3 size={15}/></button><button className="icon" onClick={()=>onDelete(d)} title="Delete"><Trash2 size={15}/></button></div>
  </div>
}

function Calendar({deadlines,onAdd,onEdit,onToggle,onDelete}){
  const [cursor,setCursor]=useState(new Date());
  const [selected,setSelected]=useState(todayISO());
  const y=cursor.getFullYear(), m=cursor.getMonth();
  const first=new Date(y,m,1), start=new Date(y,m,1-first.getDay());
  const cells=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});
  const selectedItems=deadlines.filter(d=>d.due_date===selected).sort((a,b)=>(a.due_time||"").localeCompare(b.due_time||""));
  return <div className="calendar-layout">
    <div>
      <div className="cal-head"><h2>{cursor.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h2><div className="cal-controls"><button className="secondary iconish" onClick={()=>setCursor(new Date(y,m-1,1))}><ChevronLeft size={16}/></button><button className="secondary today-btn" onClick={()=>{setCursor(new Date());setSelected(todayISO())}}>Today</button><button className="secondary iconish" onClick={()=>setCursor(new Date(y,m+1,1))}><ChevronRight size={16}/></button></div></div>
      <div className="calendar"><div className="dow">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=><div key={x}>{x}</div>)}</div><div className="calendar-grid">
        {cells.map((d,i)=>{const iso=isoDate(d), items=deadlines.filter(x=>x.due_date===iso);return <button key={i} className={`cal-cell ${d.getMonth()!==m?"other":""} ${iso===todayISO()?"today":""} ${iso===selected?"selected":""}`} onClick={()=>setSelected(iso)}>
          <span>{d.getDate()}</span><div className="dots">{items.slice(0,5).map(x=><i className={x.priority} key={x.id}/>)}</div>
        </button>})}
      </div></div>
    </div>
    <aside className="cal-side"><h3>{new Date(selected+"T00:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</h3>
      {selectedItems.length?selectedItems.map(d=><DeadlineCard key={d.id} d={d} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete}/>):<div className="empty">Nothing due this day.</div>}
      <button className="secondary full" onClick={()=>onAdd(selected)}><Plus size={15}/> Add deadline for this day</button>
    </aside>
  </div>
}

function App(){
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);
  const [deadlines,setDeadlines]=useState([]);
  const [view,setView]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("active");
  const [category,setCategory]=useState("all");
  const [sort,setSort]=useState("date-asc");
  const [bannerDismissed,setBannerDismissed]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    let mounted=true;
    supabase.auth.getSession().then(({data})=>{if(mounted){setSession(data.session);setLoading(false)}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>{mounted=false;subscription.unsubscribe()};
  },[]);

  useEffect(()=>{ if(session) load(); },[session]);

  async function load(){
    setError("");
    const {data,error}=await supabase.from("deadlines").select("*").order("due_date",{ascending:true}).order("due_time",{ascending:true});
    if(error)setError(error.message); else setDeadlines(data||[]);
  }
  async function saveDeadline(form){
    setError("");
    const payload={title:form.title.trim(),course:form.course.trim(),category:form.category,due_date:form.due_date,due_time:form.due_time||null,priority:form.priority,reminder_days:Number(form.reminder_days),notes:form.notes.trim()};
    let res;
    if(modal?.id) res=await supabase.from("deadlines").update(payload).eq("id",modal.id);
    else res=await supabase.from("deadlines").insert({...payload,user_id:session.user.id});
    if(res.error){setError(res.error.message);return}
    setModal(null); await load();
  }
  async function toggle(d){
    const {error}=await supabase.from("deadlines").update({completed:!d.completed}).eq("id",d.id);
    if(error)setError(error.message);else load();
  }
  async function remove(d){
    if(!window.confirm(`Delete "${d.title}"? This cannot be undone.`))return;
    const {error}=await supabase.from("deadlines").delete().eq("id",d.id);
    if(error)setError(error.message);else {setModal(null);load();}
  }
  async function logout(){await supabase.auth.signOut()}
  function requestNotifications(){if("Notification" in window)Notification.requestPermission()}

  const active=deadlines.filter(d=>!d.completed), overdue=active.filter(d=>statusOf(d)==="overdue"), soon=active.filter(d=>statusOf(d)==="soon"), done=deadlines.filter(d=>d.completed);
  const reminders=active.filter(d=>{const diff=daysBetween(todayISO(),d.due_date);return diff>=0&&diff<=d.reminder_days});
  const filtered=useMemo(()=>{
    let x=deadlines.filter(d=>{
      if(search && !(`${d.title} ${d.course||""}`.toLowerCase().includes(search.toLowerCase())))return false;
      if(category!=="all"&&d.category!==category)return false;
      const s=statusOf(d);
      if(status==="active"&&d.completed)return false;
      if(status==="overdue"&&s!=="overdue")return false;
      if(status==="completed"&&!d.completed)return false;
      return true;
    });
    const rank={high:0,medium:1,low:2};
    x.sort((a,b)=>{
      if(sort==="date-asc")return a.due_date.localeCompare(b.due_date)||(a.due_time||"").localeCompare(b.due_time||"");
      if(sort==="date-desc")return b.due_date.localeCompare(a.due_date);
      if(sort==="priority")return rank[a.priority]-rank[b.priority]||a.due_date.localeCompare(b.due_date);
      return (a.course||"").localeCompare(b.course||"")||a.due_date.localeCompare(b.due_date);
    }); return x;
  },[deadlines,search,category,status,sort]);

  if(loading)return <div className="loading">Loading Deadline Ledger…</div>;
  if(!session)return <AuthScreen/>;

  const title={dashboard:"Dashboard",calendar:"Calendar",list:"All deadlines"}[view];

  return <div className="app">
    <aside className="sidebar">
      <div><div className="brand-mark">Deadline Ledger</div><div className="brand-sub">Keep every due date in one place</div></div>
      <nav>
        <button className={view==="dashboard"?"active":""} onClick={()=>setView("dashboard")}><LayoutDashboard size={16}/>Dashboard</button>
        <button className={view==="calendar"?"active":""} onClick={()=>setView("calendar")}><CalendarDays size={16}/>Calendar</button>
        <button className={view==="list"?"active":""} onClick={()=>setView("list")}><ClipboardList size={16}/>All deadlines</button>
      </nav>
      <div className="sidebar-spacer"/>
      <button className="primary full" onClick={()=>setModal({prefill:todayISO()})}><Plus size={16}/> Add deadline</button>
      <button className="account" onClick={logout}><span>{session.user.email}</span><LogOut size={14}/></button>
    </aside>
    <main className="main">
      <header><div><h1>{title}</h1><div className="date-line">{new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div></div><button className="notify" onClick={requestNotifications}><Bell size={15}/> Notifications</button></header>
      {error&&<div className="error-banner"><AlertTriangle size={16}/>{error}<button onClick={()=>setError("")}><X size={15}/></button></div>}
      {reminders.length>0&&!bannerDismissed&&<div className="reminder"><Bell size={16}/><span><strong>{reminders.length} deadline{reminders.length>1?"s":""}</strong> need attention soon: {reminders.slice(0,3).map(x=>x.title).join(", ")}{reminders.length>3?` and ${reminders.length-3} more`:""}.</span><button onClick={()=>setBannerDismissed(true)}><X size={15}/></button></div>}
      <div className="content">
        {view==="dashboard"&&<><div className="stats">
          <Stat n={active.length} label="Active deadlines"/><Stat n={soon.length} label="Due in 7 days" tone="soon"/><Stat n={overdue.length} label="Overdue" tone="overdue"/><Stat n={done.length} label="Completed" tone="done"/>
        </div><div className="columns"><Section title="Overdue" count={overdue.length} items={overdue} empty="No overdue deadlines. You're caught up." {...{toggle,remove}} onEdit={d=>setModal(d)}/><Section title="Due soon" count={soon.length} items={soon} empty="Nothing due in the next 7 days." {...{toggle,remove}} onEdit={d=>setModal(d)}/></div></>}
        {view==="calendar"&&<Calendar deadlines={deadlines} onAdd={d=>setModal({prefill:d})} onEdit={d=>setModal(d)} onToggle={toggle} onDelete={remove}/>}
        {view==="list"&&<><div className="filters"><div className="search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title or course…"/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Active</option><option value="overdue">Overdue</option><option value="completed">Completed</option><option value="all">All</option></select><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="date-asc">Due date (soonest)</option><option value="date-desc">Due date (latest)</option><option value="priority">Priority</option><option value="course">Course</option></select></div><div className="list">{filtered.map(d=><DeadlineCard key={d.id} d={d} onToggle={toggle} onEdit={d=>setModal(d)} onDelete={remove}/>)}</div>{!filtered.length&&<div className="empty large">No deadlines match these filters.</div>}</>}
      </div>
    </main>
    {modal&&<DeadlineModal item={modal.id?modal:null} onClose={()=>setModal(null)} onSave={saveDeadline} onDelete={()=>remove(modal)}/>}
  </div>
}

function Stat({n,label,tone=""}){return <div className={`stat ${tone}`}><div className="stat-number">{n}</div><div>{label}</div></div>}
function Section({title,count,items,empty,toggle,remove,onEdit}){return <section><h2>{title}<span>{count}</span></h2><div className="list">{items.map(d=><DeadlineCard key={d.id} d={d} onToggle={toggle} onEdit={onEdit} onDelete={remove}/>)}</div>{!items.length&&<div className="empty">{empty}</div>}</section>}

createRoot(document.getElementById("root")).render(<App/>);
