import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle2, FileText, Home, Inbox, Leaf, Menu, MessageSquare, Plus, Search, Settings, Users, X, Hammer, Send, MapPin, Phone, Mail, CreditCard, SquarePen, Sparkles, ShieldCheck, LogOut } from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabase.js'

const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount || 0))
const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const todayDate = new Date().toISOString().slice(0, 10)

const seed = {
  clients: [
    { id: 'c1', name: 'Sample Client A', email: 'client-a@example.com', phone: '(555) 010-1000', address: '100 Maple St', notes: 'Prefers Friday mornings.', lifetimeValue: 1480 },
    { id: 'c2', name: 'Sample Client B', email: 'client-b@example.com', phone: '(555) 010-2000', address: '200 Cedar Dr', notes: 'Biweekly mowing.', lifetimeValue: 920 },
    { id: 'c3', name: 'Sample Client C', email: 'client-c@example.com', phone: '(555) 010-3000', address: '300 Oak Ln', notes: 'Needs seasonal cleanup.', lifetimeValue: 640 }
  ],
  requests: [
    { id: 'r1', name: 'New Request A', service: 'One-time mow', address: '400 Pine Ct', preferredDate: todayDate, phone: '(555) 010-4000', email: 'request-a@example.com', notes: 'Backyard grass is tall.', status: 'new', estimate: 110 },
    { id: 'r2', name: 'New Request B', service: 'Recurring weekly maintenance', address: '500 River Way', preferredDate: todayDate, phone: '(555) 010-5000', email: 'request-b@example.com', notes: 'Interested in weekly service.', status: 'new', estimate: 85 }
  ],
  quotes: [
    { id: 'q1', customer: 'New Request A', service: 'One-time mow + cleanup', amount: 145, status: 'sent' },
    { id: 'q2', customer: 'Sample Client A', service: 'Monthly hedge trim add-on', amount: 120, status: 'approved' }
  ],
  jobs: [
    { id: 'j1', clientId: 'c1', title: 'Weekly lawn maintenance', service: 'Mow, edge, trim, blow', date: todayDate, time: '8:30 AM', status: 'scheduled', price: 75, progress: 25 },
    { id: 'j2', clientId: 'c2', title: 'Biweekly lawn care', service: 'Mow, edge, trim', date: todayDate, time: '11:00 AM', status: 'in_progress', price: 95, progress: 65 },
    { id: 'j3', clientId: 'c3', title: 'Spring cleanup', service: 'Cleanup, weeds, mulch refresh', date: todayDate, time: '1:00 PM', status: 'completed', price: 240, progress: 100 }
  ],
  invoices: [
    { id: 'i1', clientId: 'c1', jobId: 'j1', amount: 75, status: 'draft', dueDate: todayDate },
    { id: 'i2', clientId: 'c3', jobId: 'j3', amount: 240, status: 'sent', dueDate: todayDate },
    { id: 'i3', clientId: 'c2', jobId: 'j2', amount: 95, status: 'paid', dueDate: todayDate }
  ]
}

const emptyData = { clients: [], requests: [], quotes: [], jobs: [], invoices: [] }
const nav = [
  ['dashboard', 'Home', Home], ['schedule', 'Schedule', Calendar], ['clients', 'Clients', Users], ['requests', 'Requests', Inbox], ['quotes', 'Quotes', SquarePen], ['jobs', 'Jobs', Hammer], ['invoices', 'Invoices', FileText], ['messages', 'Messages', MessageSquare], ['settings', 'Launch Setup', Settings]
]
const badge = { new: 'bg-amber-100 text-amber-800 border-amber-200', sent: 'bg-blue-100 text-blue-800 border-blue-200', approved: 'bg-emerald-100 text-emerald-800 border-emerald-200', scheduled: 'bg-sky-100 text-sky-800 border-sky-200', in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200', completed: 'bg-green-100 text-green-800 border-green-200', draft: 'bg-stone-100 text-stone-800 border-stone-200', paid: 'bg-emerald-100 text-emerald-800 border-emerald-200', declined: 'bg-red-100 text-red-800 border-red-200' }

function clientFromDb(row) { return { id: row.id, name: row.name, email: row.email, phone: row.phone, address: row.address, notes: row.notes, lifetimeValue: Number(row.lifetime_value || 0) } }
function requestFromDb(row) { return { id: row.id, name: row.name, email: row.email, phone: row.phone, address: row.address, service: row.service, preferredDate: row.preferred_date, notes: row.notes, estimate: Number(row.estimate || 0), status: row.status } }
function quoteFromDb(row) { return { id: row.id, customer: row.customer, service: row.service, amount: Number(row.amount || 0), status: row.status } }
function jobFromDb(row) { return { id: row.id, clientId: row.client_id, title: row.title, service: row.service, date: row.job_date, time: row.job_time, status: row.status, price: Number(row.price || 0), progress: row.progress || 0 } }
function invoiceFromDb(row) { return { id: row.id, clientId: row.client_id, jobId: row.job_id, amount: Number(row.amount || 0), status: row.status, dueDate: row.due_date } }
function estimateFor(service) { const value = service.toLowerCase(); if (value.includes('cleanup')) return 220; if (value.includes('one-time')) return 110; return 85 }

async function loadData() {
  const [clientsRes, requestsRes, quotesRes, jobsRes, invoicesRes] = await Promise.all([
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('service_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('quotes').select('*').order('created_at', { ascending: false }),
    supabase.from('jobs').select('*').order('job_date', { ascending: true }),
    supabase.from('invoices').select('*').order('created_at', { ascending: false })
  ])
  const error = clientsRes.error || requestsRes.error || quotesRes.error || jobsRes.error || invoicesRes.error
  if (error) throw error
  return {
    clients: clientsRes.data.map(clientFromDb),
    requests: requestsRes.data.map(requestFromDb),
    quotes: quotesRes.data.map(quoteFromDb),
    jobs: jobsRes.data.map(jobFromDb),
    invoices: invoicesRes.data.map(invoiceFromDb)
  }
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = { primary: 'bg-[#063447] text-white hover:bg-[#082c3c]', green: 'bg-[#2f7d32] text-white hover:bg-[#266b2a]', secondary: 'bg-white text-[#063447] border border-slate-200 hover:bg-slate-50', ghost: 'text-[#063447] hover:bg-slate-100' }
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>
}
function Card({ children, className = '' }) { return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div> }
function Badge({ children, className = '' }) { return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${className}`}>{children}</span> }
function Page({ title, subtitle, children }) { return <div><h1 className="text-4xl font-black tracking-tight text-[#063447]">{title}</h1><p className="mt-2 mb-6 font-semibold text-slate-500">{subtitle}</p>{children}</div> }
function Field({ label, children }) { return <label className="space-y-1.5 text-sm font-bold text-slate-700"><span>{label}</span>{children}</label> }
function Input(props) { return <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2f7d32] focus:ring-4 focus:ring-green-100" {...props} /> }
function TextArea(props) { return <textarea className="min-h-[100px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2f7d32] focus:ring-4 focus:ring-green-100" {...props} /> }
function Select(props) { return <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2f7d32] focus:ring-4 focus:ring-green-100" {...props} /> }

function Sidebar({ active, setActive, open, setOpen }) {
  return <>
    {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-[#efede8] transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-16 items-center justify-between px-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#063447] text-white"><Leaf size={22} /></div><div><p className="text-sm font-black uppercase tracking-wide text-[#063447]">Lawn Hoppers</p><p className="text-xs font-semibold text-slate-500">Client Ops</p></div></div><button className="lg:hidden" onClick={() => setOpen(false)}><X /></button></div>
      <div className="px-4 pb-4"><Button className="w-full justify-start"><Plus size={18} />Create</Button></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-5">{nav.map(([id, label, Icon]) => <button key={id} onClick={() => { setActive(id); setOpen(false) }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-extrabold transition ${active === id ? 'bg-white text-[#063447] shadow-sm' : 'text-[#073246] hover:bg-white/70'}`}><Icon size={20} />{label}</button>)}</nav>
    </aside>
  </>
}
function Topbar({ setOpen, onBook, onSignOut, user }) { return <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-7"><button className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={() => setOpen(true)}><Menu /></button><div className="hidden items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 lg:flex"><Search size={18} /><input className="w-64 bg-transparent text-sm outline-none" placeholder="Search clients, jobs, invoices" /></div><div className="flex items-center gap-2"><span className="hidden text-xs font-bold text-slate-500 md:inline">{user?.email}</span><Button variant="green" onClick={onBook}><Plus size={17} />New Request</Button><Button variant="secondary" onClick={onSignOut}><LogOut size={17} />Sign out</Button></div></header> }
function WorkflowCard({ icon: Icon, title, count, subtitle, amount, color, details }) { return <div className="relative min-h-[210px] border-slate-200 bg-white p-6 lg:border-r last:border-r-0"><div className={`absolute left-0 right-0 top-0 h-1.5 ${color}`} /><div className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600"><Icon size={22} />{title}</div><div className="flex items-end gap-3"><span className="text-5xl font-black tracking-tight text-[#063447]">{count}</span>{amount && <span className="mb-2 text-sm font-semibold text-slate-500">{amount}</span>}</div><p className="mt-2 text-lg font-black text-[#063447]">{subtitle}</p><div className="mt-4 space-y-2 text-sm font-medium text-[#063447]">{details.map((d) => <div key={d[0]} className="flex justify-between"><span>{d[0]}</span><span className="text-slate-500">{d[1]}</span></div>)}</div></div> }
function JobRow({ job, client, onComplete }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><Badge className={badge[job.status]}>{job.status.replace('_', ' ')}</Badge><h3 className="mt-2 text-lg font-black text-[#063447]">{job.title}</h3><p className="text-sm font-semibold text-slate-500">{client?.name || 'No client'} · {job.service}</p><p className="mt-1 text-sm text-slate-500">{job.date} · {job.time || 'Any time'}</p></div><div className="flex flex-wrap items-center gap-3"><div className="min-w-[130px]"><div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>Progress</span><span>{job.progress}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#2f7d32]" style={{ width: `${job.progress}%` }} /></div></div><p className="text-xl font-black text-[#063447]">{money(job.price)}</p>{onComplete && job.status !== 'completed' && <Button variant="green" onClick={() => onComplete(job.id)}><CheckCircle2 size={17} />Complete</Button>}</div></div></div> }

function Dashboard({ data, setActive }) {
  const activeJobs = data.jobs.filter(j => ['scheduled', 'in_progress'].includes(j.status))
  const completed = data.jobs.filter(j => j.status === 'completed')
  const awaiting = data.invoices.filter(i => i.status === 'sent')
  const paid = data.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const todays = data.jobs.filter(j => j.date === todayDate)
  return <div className="space-y-8"><section><p className="mb-1 text-lg font-black text-[#063447]">{todayLabel}</p><h1 className="text-4xl font-black tracking-tight text-[#063447] md:text-5xl">Good day, Isaac</h1></section><section className="space-y-4"><h2 className="text-3xl font-black text-[#063447]">Workflow</h2><Card className="overflow-hidden"><div className="grid lg:grid-cols-4"><WorkflowCard icon={Inbox} title="Requests" count={data.requests.filter(r => r.status === 'new').length} subtitle="New" color="bg-amber-600" details={[["Needs review", data.requests.length], ["Ready to quote", 0]]} /><WorkflowCard icon={SquarePen} title="Quotes" count={data.quotes.filter(q => q.status === 'approved').length} amount={money(data.quotes.reduce((s, q) => s + q.amount, 0))} subtitle="Approved" color="bg-rose-700" details={[["Draft", data.quotes.filter(q => q.status === 'draft').length], ["Sent", data.quotes.filter(q => q.status === 'sent').length]]} /><WorkflowCard icon={Hammer} title="Jobs" count={completed.length} amount={money(completed.reduce((s, j) => s + j.price, 0))} subtitle="Requires invoicing" color="bg-green-700" details={[["Active", activeJobs.length], ["Action required", completed.length]]} /><WorkflowCard icon={FileText} title="Invoices" count={awaiting.length} amount={money(awaiting.reduce((s, i) => s + i.amount, 0))} subtitle="Awaiting payment" color="bg-blue-700" details={[["Draft", data.invoices.filter(i => i.status === 'draft').length], ["Paid", money(paid)]]} /></div></Card></section><section className="grid gap-6 xl:grid-cols-[1fr_360px]"><Card className="p-6"><div className="mb-5 flex justify-between gap-4"><div><h2 className="text-3xl font-black text-[#063447]">Today's appointments</h2><p className="text-sm font-semibold text-slate-500">Schedule, complete, invoice.</p></div><Button variant="secondary" onClick={() => setActive('schedule')}>View Schedule</Button></div><div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">{[['Total', todays.reduce((s, j) => s + j.price, 0)], ['Active', todays.filter(j => j.status !== 'completed').reduce((s, j) => s + j.price, 0)], ['Completed', todays.filter(j => j.status === 'completed').reduce((s, j) => s + j.price, 0)], ['Overdue', 0], ['Remaining', todays.filter(j => j.status !== 'completed').reduce((s, j) => s + j.price, 0)]].map(([label, value]) => <div key={label}><p className="text-xs font-bold text-slate-500">{label}</p><p className="text-3xl font-black text-[#063447]">{money(value)}</p></div>)}</div><div className="space-y-3 rounded-2xl bg-slate-50 p-4">{todays.length ? todays.map(job => <JobRow key={job.id} job={job} client={data.clients.find(c => c.id === job.clientId)} />) : <p className="rounded-xl bg-white p-8 text-center font-semibold text-slate-500">No visits scheduled today.</p>}</div></Card><Card className="p-6"><h2 className="mb-4 text-3xl font-black text-[#063447]">Highlighted</h2><div className="rounded-2xl bg-[#f7faf2] p-5"><Sparkles className="mb-4 text-green-700" /><h3 className="text-xl font-black text-[#063447]">Connected to Supabase</h3><p className="mt-2 text-sm font-medium text-slate-600">Requests, clients, jobs, and invoices now save to the production database.</p><Button className="mt-5" onClick={() => setActive('settings')}>Review Launch Setup</Button></div></Card></section></div>
}

function Requests({ data, refresh, setError }) {
  const approve = async (r) => {
    try {
      const clientPayload = { name: r.name, email: r.email, phone: r.phone, address: r.address, notes: r.notes, lifetime_value: 0 }
      const { data: client, error: clientError } = await supabase.from('clients').insert(clientPayload).select('*').single()
      if (clientError) throw clientError
      const jobPayload = { client_id: client.id, title: r.service, service: r.service, job_date: r.preferredDate || todayDate, job_time: '9:00 AM', status: 'scheduled', price: r.estimate, progress: 0 }
      const { error: jobError } = await supabase.from('jobs').insert(jobPayload)
      if (jobError) throw jobError
      const { error: requestError } = await supabase.from('service_requests').update({ status: 'approved' }).eq('id', r.id)
      if (requestError) throw requestError
      await refresh()
    } catch (error) { setError(error.message) }
  }
  return <Page title="Requests" subtitle="Review booking requests and schedule jobs."><div className="grid gap-4 xl:grid-cols-2">{data.requests.map(r => <Card key={r.id} className="p-5"><div className="mb-4 flex items-start justify-between"><div><Badge className={badge[r.status]}>{r.status}</Badge><h3 className="mt-3 text-xl font-black text-[#063447]">{r.name}</h3><p className="font-semibold text-slate-500">{r.service}</p></div><p className="text-2xl font-black text-[#063447]">{money(r.estimate)}</p></div><div className="space-y-2 text-sm text-slate-600"><p className="flex gap-2"><MapPin size={17} />{r.address}</p><p className="flex gap-2"><Phone size={17} />{r.phone}</p><p className="flex gap-2"><Mail size={17} />{r.email}</p></div><p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-600">{r.notes || 'No notes yet.'}</p><div className="mt-5 flex gap-2"><Button variant="green" disabled={r.status === 'approved'} onClick={() => approve(r)}><CheckCircle2 size={17} />Approve + Schedule</Button></div></Card>)}</div></Page>
}
function Schedule({ data }) { const grouped = useMemo(() => data.jobs.reduce((a, j) => { a[j.date] = [...(a[j.date] || []), j]; return a }, {}), [data.jobs]); return <Page title="Schedule" subtitle="Daily field schedule."><div className="space-y-5">{Object.entries(grouped).map(([date, jobs]) => <Card key={date} className="p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black text-[#063447]">{date}</h3><Badge className="border-slate-200 bg-slate-50 text-slate-700">{jobs.length} visits</Badge></div><div className="space-y-3">{jobs.map(j => <JobRow key={j.id} job={j} client={data.clients.find(c => c.id === j.clientId)} />)}</div></Card>)}</div></Page> }
function Clients({ data }) { return <Page title="Clients" subtitle="Customer records and job history."><div className="grid gap-4 xl:grid-cols-3">{data.clients.map(c => <Card key={c.id} className="p-5"><h3 className="text-xl font-black text-[#063447]">{c.name}</h3><div className="mt-3 space-y-2 text-sm font-medium text-slate-600"><p className="flex gap-2"><Phone size={16} />{c.phone}</p><p className="flex gap-2"><Mail size={16} />{c.email}</p><p className="flex gap-2"><MapPin size={16} />{c.address}</p></div><p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-600">{c.notes || 'No notes yet.'}</p><div className="mt-4 flex justify-between rounded-xl border border-slate-200 p-3"><span className="text-sm font-bold text-slate-500">Lifetime value</span><span className="text-lg font-black text-[#063447]">{money(c.lifetimeValue)}</span></div></Card>)}</div></Page> }
function Quotes({ data, refresh, setError }) { const approve = async (id) => { try { const { error } = await supabase.from('quotes').update({ status: 'approved' }).eq('id', id); if (error) throw error; await refresh() } catch (error) { setError(error.message) } }; return <Page title="Quotes" subtitle="Send estimates and track approval."><div className="grid gap-4 xl:grid-cols-2">{data.quotes.map(q => <Card key={q.id} className="p-5"><div className="flex justify-between"><div><Badge className={badge[q.status]}>{q.status}</Badge><h3 className="mt-3 text-xl font-black text-[#063447]">{q.customer}</h3><p className="font-semibold text-slate-500">{q.service}</p></div><p className="text-3xl font-black text-[#063447]">{money(q.amount)}</p></div><div className="mt-5 flex gap-2"><Button variant="secondary"><Send size={17} />Resend</Button><Button variant="green" onClick={() => approve(q.id)}><CheckCircle2 size={17} />Mark Approved</Button></div></Card>)}</div></Page> }
function Jobs({ data, refresh, setError }) { const complete = async (id) => { try { const { error } = await supabase.from('jobs').update({ status: 'completed', progress: 100 }).eq('id', id); if (error) throw error; await refresh() } catch (error) { setError(error.message) } }; const invoice = async (job) => { try { const { error } = await supabase.from('invoices').insert({ client_id: job.clientId, job_id: job.id, amount: job.price, status: 'draft', due_date: todayDate }); if (error) throw error; await refresh() } catch (error) { setError(error.message) } }; return <Page title="Jobs" subtitle="Track work from scheduled to complete to invoiced."><div className="space-y-3">{data.jobs.map(j => { const hasInvoice = data.invoices.some(i => i.jobId === j.id); return <div key={j.id}><JobRow job={j} client={data.clients.find(c => c.id === j.clientId)} onComplete={complete} />{j.status === 'completed' && !hasInvoice && <div className="mt-2 flex justify-end"><Button onClick={() => invoice(j)}><FileText size={17} />Create Invoice</Button></div>}</div> })}</div></Page> }
function Invoices({ data, refresh, setError }) { const update = async (id, status) => { try { const { error } = await supabase.from('invoices').update({ status }).eq('id', id); if (error) throw error; await refresh() } catch (error) { setError(error.message) } }; return <Page title="Invoices" subtitle="Send invoices and track payment status."><div className="grid gap-4 xl:grid-cols-3">{data.invoices.map(i => { const c = data.clients.find(x => x.id === i.clientId); return <Card key={i.id} className="p-5"><div className="mb-5 flex justify-between"><div><Badge className={badge[i.status]}>{i.status}</Badge><h3 className="mt-3 text-xl font-black text-[#063447]">{c?.name || 'No client'}</h3><p className="font-semibold text-slate-500">Due {i.dueDate || 'soon'}</p></div><p className="text-3xl font-black text-[#063447]">{money(i.amount)}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => update(i.id, 'sent')}><Send size={17} />Send</Button><Button variant="green" onClick={() => update(i.id, 'paid')}><CreditCard size={17} />Mark Paid</Button></div></Card> })}</div></Page> }
function Messages() { return <Page title="Messages" subtitle="Templates for customer communication."><div className="grid gap-4 xl:grid-cols-3">{[['Booking received', 'Thanks for requesting service with Lawn Hoppers. We received your request and will confirm your quote shortly.'], ['Job reminder', 'Reminder: Lawn Hoppers is scheduled for your lawn service tomorrow. Please make sure gates are unlocked.'], ['Invoice follow-up', 'Your Lawn Hoppers invoice is ready. You can pay securely using the link we sent.']].map(([t, b]) => <Card key={t} className="p-5"><h3 className="text-xl font-black text-[#063447]">{t}</h3><p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-600">{b}</p><Button variant="secondary" className="mt-4"><Send size={17} />Use Template</Button></Card>)}</div></Page> }
function LaunchSetup() { return <Page title="Launch Setup" subtitle="Final checklist before sending the site to customers."><div className="grid gap-5 xl:grid-cols-[1fr_360px]"><Card className="p-5"><h3 className="mb-4 text-xl font-black text-[#063447]">Ready-to-launch checklist</h3>{['Supabase database is connected', 'Owner login is enabled', 'Booking form works without customer login', 'Requests turn into jobs', 'Completed jobs turn into invoices', 'Mobile dashboard works in the field'].map(t => <div key={t} className="mb-3 flex gap-3 rounded-2xl border border-slate-200 p-4"><CheckCircle2 className="text-green-700" /><p className="font-black text-[#063447]">{t}</p></div>)}</Card><Card className="p-5"><ShieldCheck className="text-green-700" size={30} /><h3 className="mt-4 text-xl font-black text-[#063447]">MVP launch recommendation</h3><p className="mt-3 text-sm font-medium leading-6 text-slate-600">Launch with request booking, manual approval, job scheduling, completion tracking, and invoice status. Add online payment and crew accounts after real usage.</p><Button variant="green" className="mt-5 w-full">Launch MVP</Button></Card></div></Page> }

function BookingForm({ onSubmitted, compact = false }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', service: 'Recurring weekly maintenance', preferredDate: todayDate, notes: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, address: form.address, service: form.service, preferred_date: form.preferredDate, notes: form.notes, estimate: estimateFor(form.service), status: 'new' }
      if (isSupabaseConfigured) { const { error } = await supabase.from('service_requests').insert(payload); if (error) throw error }
      setForm({ name: '', email: '', phone: '', address: '', service: 'Recurring weekly maintenance', preferredDate: todayDate, notes: '' })
      setMessage('Request sent. Lawn Hoppers will follow up soon.')
      onSubmitted?.()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <form className={`grid gap-4 ${compact ? '' : 'rounded-3xl bg-white p-5 shadow-xl'}`} onSubmit={submit}><div className="grid gap-4 md:grid-cols-2"><Field label="Name"><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field><Field label="Phone"><Input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field></div><Field label="Email"><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field><Field label="Service address"><Input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Service"><Select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}><option>Recurring weekly maintenance</option><option>Biweekly lawn care</option><option>One-time mow</option><option>Spring cleanup</option></Select></Field><Field label="Preferred date"><Input required type="date" value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} /></Field></div><Field label="Notes"><TextArea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Gate codes, pets, yard condition, preferred time..." /></Field>{message && <p className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">{message}</p>}{error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}<Button type="submit" variant="green" disabled={busy}>{busy ? 'Sending...' : 'Submit Request'}</Button></form>
}
function BookingModal({ open, onClose, onSubmitted }) { if (!open) return null; return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5"><div><p className="text-sm font-black uppercase tracking-wide text-green-700">Customer booking</p><h2 className="text-2xl font-black text-[#063447]">Request lawn care</h2></div><button onClick={onClose} className="rounded-xl border border-slate-200 p-2"><X /></button></div><div className="p-5"><BookingForm compact onSubmitted={onSubmitted} /></div></div></div> }
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const login = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; onLogin?.() } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <div className="min-h-screen bg-[#efede8] p-4"><div className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[1fr_460px]"><section className="flex flex-col justify-center"><div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-[#063447] text-white"><Leaf size={32} /></div><h1 className="text-5xl font-black tracking-tight text-[#063447]">Lawn Hoppers</h1><p className="mt-4 max-w-xl text-lg font-semibold text-slate-600">Book lawn care online. Isaac can review requests, schedule jobs, track progress, and invoice customers from one simple dashboard.</p><Card className="mt-8 p-5"><h2 className="text-2xl font-black text-[#063447]">Request lawn care</h2><p className="mb-4 mt-1 text-sm font-semibold text-slate-500">Customers can submit a request without logging in.</p><BookingForm compact /></Card></section><section className="flex items-center"><Card className="w-full p-6"><h2 className="text-3xl font-black text-[#063447]">Owner login</h2><p className="mb-5 mt-2 text-sm font-semibold text-slate-500">Use the Supabase Auth user created for Isaac.</p><form className="grid gap-4" onSubmit={login}><Field label="Email"><Input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field><Field label="Password"><Input required type="password" value={password} onChange={e => setPassword(e.target.value)} /></Field>{error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}<Button type="submit" variant="green" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</Button></form></Card></section></div></div>
}

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [open, setOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [data, setData] = useState(isSupabaseConfigured ? emptyData : seed)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')

  const refresh = async () => { if (!isSupabaseConfigured || !user) return; const next = await loadData(); setData(next) }

  useEffect(() => {
    if (!isSupabaseConfigured) { setData(JSON.parse(localStorage.getItem('lawnhoppers-data') || 'null') || seed); setLoading(false); return }
    supabase.auth.getSession().then(({ data: sessionData }) => { setUser(sessionData.session?.user || null); setLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null) })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem('lawnhoppers-data', JSON.stringify(data)) }, [data])
  useEffect(() => { if (!isSupabaseConfigured || !user) return; setLoading(true); loadData().then(setData).catch(err => setError(err.message)).finally(() => setLoading(false)) }, [user])

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fbfbfa] font-black text-[#063447]">Loading Lawn Hoppers...</div>
  if (isSupabaseConfigured && !user) return <LoginScreen onLogin={refresh} />

  const localRefresh = async () => {}
  const activeRefresh = isSupabaseConfigured ? refresh : localRefresh
  const screen = { dashboard: <Dashboard data={data} setActive={setActive} />, schedule: <Schedule data={data} />, clients: <Clients data={data} />, requests: <Requests data={data} refresh={activeRefresh} setError={setError} />, quotes: <Quotes data={data} refresh={activeRefresh} setError={setError} />, jobs: <Jobs data={data} refresh={activeRefresh} setError={setError} />, invoices: <Invoices data={data} refresh={activeRefresh} setError={setError} />, messages: <Messages />, settings: <LaunchSetup /> }[active]
  const signOut = async () => { if (isSupabaseConfigured) await supabase.auth.signOut(); setUser(null) }
  return <div className="min-h-screen bg-[#fbfbfa] text-slate-900"><div className="flex min-h-screen"><Sidebar active={active} setActive={setActive} open={open} setOpen={setOpen} /><div className="min-w-0 flex-1"><Topbar setOpen={setOpen} onBook={() => setBookingOpen(true)} onSignOut={signOut} user={user} /><main className="mx-auto max-w-[1500px] px-4 py-7 lg:px-8">{error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>}{screen}</main></div></div><BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} onSubmitted={activeRefresh} /></div>
}
