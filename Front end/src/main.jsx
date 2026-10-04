import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function api(path, options={}) {
  const token = localStorage.getItem('taskflow_token');
  const headers = {'Content-Type':'application/json', ...(options.headers||{})};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {...options, headers});
  const data = await res.json().catch(()=>({detail:'Unexpected server response'}));
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

function App(){
  const [token,setToken]=useState(localStorage.getItem('taskflow_token'));
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('demo@example.com');
  const [password,setPassword]=useState('password123');
  const [error,setError]=useState('');
  const [tasks,setTasks]=useState([]);
  const [form,setForm]=useState({title:'',description:'',status:'pending'});
  const [editing,setEditing]=useState(null);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{if(token) loadTasks()},[token]);
  async function loadTasks(){try{setTasks(await api('/tasks'))}catch(e){setError(e.message)}}
  async function submitAuth(e){
    e.preventDefault(); setError(''); setLoading(true);
    try{
      const path=mode==='login'?'/auth/login':'/auth/register';
      const body=mode==='login'
  ? new URLSearchParams({username:email,password})
  : JSON.stringify({email,password});

const data=await api(path,{
  method:'POST',
  headers:mode==='login'
    ? {'Content-Type':'application/x-www-form-urlencoded'}
    : {'Content-Type':'application/json'},
  body
});
      if(mode==='login'){localStorage.setItem('taskflow_token',data.access_token);setToken(data.access_token)} else {setMode('login');setError('Account created. Please log in.');}
    }catch(e){setError(e.message)} finally{setLoading(false)}
  }
  function logout(){localStorage.removeItem('taskflow_token');setToken(null);setTasks([])}
  async function saveTask(e){
    e.preventDefault(); setError('');
    try{
      if(editing){await api(`/tasks/${editing.id}`,{method:'PATCH',body:JSON.stringify(form)})}
      else {await api('/tasks',{method:'POST',body:JSON.stringify(form)})}
      setForm({title:'',description:'',status:'pending'});setEditing(null);loadTasks();
    }catch(e){setError(e.message)}
  }
  async function removeTask(id){try{await api(`/tasks/${id}`,{method:'DELETE'});loadTasks()}catch(e){setError(e.message)}}
  function editTask(t){setEditing(t);setForm({title:t.title,description:t.description||'',status:t.status})}

  if(!token) return <main className="auth"><section className="card"><h1>TaskFlow</h1><p className="muted">Simple team task management</p><form onSubmit={submitAuth}><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required/><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" required/><button disabled={loading}>{loading?'Please wait...':mode==='login'?'Sign in':'Create account'}</button></form>{error&&<p className="error">{error}</p>}<button className="link" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Need an account? Register':'Already registered? Sign in'}</button></section></main>;

  return <main className="app"><header><div><h1>TaskFlow</h1><span className="muted">Your tasks</span></div><button onClick={logout}>Log out</button></header><section className="grid"><div className="card"><h2>{editing?'Edit task':'New task'}</h2><form onSubmit={saveTask}><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Task title" required/><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description"/><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select><button>{editing?'Save changes':'Create task'}</button>{editing&&<button type="button" className="secondary" onClick={()=>{setEditing(null);setForm({title:'',description:'',status:'pending'})}}>Cancel</button>}</form></div><div className="card"><h2>Tasks</h2>{error&&<p className="error">{error}</p>}{tasks.length===0?<p className="muted">No tasks yet.</p>:tasks.map(t=><article className="task" key={t.id}><div><strong>{t.title}</strong><p>{t.description}</p><small>{t.status}</small></div><div className="actions"><button onClick={()=>editTask(t)}>Edit</button><button className="danger" onClick={()=>removeTask(t.id)}>Delete</button></div></article>)}</div></section></main>
}

createRoot(document.getElementById('root')).render(<App/>);
