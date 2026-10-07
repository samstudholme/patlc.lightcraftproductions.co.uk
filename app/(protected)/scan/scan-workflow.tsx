"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { AdamAsset, PatResult } from "@/lib/types";

const oneYearFromToday = () => {
  const today = new Date();
  const year = today.getFullYear() + 1;
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const due = new Date(year, month, Math.min(today.getDate(), lastDay));
  const pad = (value:number) => String(value).padStart(2,"0");
  return `${due.getFullYear()}-${pad(due.getMonth()+1)}-${pad(due.getDate())}`;
};

export default function ScanWorkflow({initialTesters}:{initialTesters:string[]}) {
  const [testers,setTesters]=useState(initialTesters); const [adding,setAdding]=useState(false); const [newTester,setNewTester]=useState("");
  const [tester,setTester]=useState(""); const [term,setTerm]=useState(""); const [asset,setAsset]=useState<AdamAsset|null>(null);
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
  const [failMode,setFailMode]=useState(false); const [failureReason,setFailureReason]=useState(""); const [notes,setNotes]=useState("");
  const [nextDueDate,setNextDueDate]=useState(oneYearFromToday); const input=useRef<HTMLInputElement>(null);
  const reset=useCallback(()=>{setAsset(null);setTerm("");setFailMode(false);setFailureReason("");setNotes("");setNextDueDate(oneYearFromToday());setError("");setTimeout(()=>input.current?.focus(),0)},[]);
  async function lookup(event:FormEvent){event.preventDefault();if(!term.trim())return;setBusy(true);setError("");setMessage("");
    const response=await fetch(`/api/adam/lookup?q=${encodeURIComponent(term.trim())}`,{cache:"no-store"});const data=await response.json();setBusy(false);
    if(!response.ok){setError(data.error||"Asset not found");input.current?.select();return}setAsset(data.asset);
  }
  const save=useCallback(async(result:PatResult)=>{if(!asset||busy)return;if(result==="FAIL"&&!failMode){setFailMode(true);return}if(result==="FAIL"&&!failureReason.trim()){setError("Enter a failure reason");return}
    setBusy(true);setError("");const response=await fetch("/api/pat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({adamAssetId:asset.id,tester,result,failureReason,notes,nextDueDate})});const data=await response.json();setBusy(false);
    if(!response.ok){setError(data.error||"Could not save test");return}setMessage(`${asset.assetNumber} recorded as ${result}`);reset();
  },[asset,busy,failMode,failureReason,notes,nextDueDate,reset,tester]);
  useEffect(()=>{if(tester&&!asset)input.current?.focus()},[tester,asset]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();reset();return}const tag=(e.target as HTMLElement)?.tagName;if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT")return;if(asset&&e.key.toLowerCase()==="p"){e.preventDefault();save("PASS")}else if(asset&&e.key.toLowerCase()==="f"){e.preventDefault();setFailMode(true)}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[asset,reset,save]);
  async function addNewTester(event:FormEvent){event.preventDefault();setBusy(true);setError("");const response=await fetch("/api/testers",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:newTester})});const data=await response.json();setBusy(false);if(!response.ok){setError(data.error||"Could not add tester");return}setTesters(current=>[...new Set([...current,data.name])].sort());setNewTester("");setAdding(false);setTester(data.name)}
  if(!tester)return <section className="card" style={{maxWidth:560,margin:"30px auto"}}><h1>Select tester</h1><p className="muted">Choose who is carrying out this PAT session.</p><div className="stack">{testers.map(name=><button type="button" key={name} onClick={()=>setTester(name)}>{name}</button>)}{adding?<form className="stack" onSubmit={addNewTester}><label>Tester name<input autoFocus required minLength={2} maxLength={80} value={newTester} onChange={e=>setNewTester(e.target.value)}/></label>{error&&<div className="error">{error}</div>}<div className="actions"><button disabled={busy}>Save tester</button><button type="button" className="secondary" onClick={()=>setAdding(false)}>Cancel</button></div></form>:<button type="button" className="secondary" onClick={()=>setAdding(true)}>+ Add a tester</button>}</div></section>;
  return <div className="stack"><div className="asset-title"><div><h1>Scan asset</h1><p className="muted">Tester: <strong>{tester}</strong> · <button className="secondary" onClick={()=>{setTester("");reset()}}>Change</button></p></div><small><span className="kbd">P</span> pass &nbsp; <span className="kbd">F</span> fail &nbsp; <span className="kbd">Esc</span> reset</small></div>
    <form className="card" onSubmit={lookup}><label>Adam asset number or barcode<input ref={input} className="scan-input" autoFocus autoComplete="off" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Scan now…" disabled={busy||Boolean(asset)} /></label></form>
    {message&&<div className="success" role="status">{message}</div>}{error&&<div className="error" role="alert">{error}</div>}{busy&&!asset&&<div className="card">Looking up in Adam RMS…</div>}
    {asset&&<section className="card stack"><div className="asset-title"><div><h2>{asset.assetNumber} — {asset.name}</h2><p className="muted">Live from Adam RMS</p></div></div>
      <dl className="details"><div><dt>Barcode</dt><dd>{asset.barcode||"—"}</dd></div><div><dt>Manufacturer / model</dt><dd>{[asset.manufacturer,asset.model].filter(Boolean).join(" ")||"—"}</dd></div><div><dt>Serial</dt><dd>{asset.serial||"—"}</dd></div><div><dt>Location</dt><dd>{asset.location||"—"}</dd></div><div><dt>Category</dt><dd>{asset.category||"—"}</dd></div></dl>
      <label>Next due date<input type="date" value={nextDueDate} onChange={e=>setNextDueDate(e.target.value)} /></label><label>Notes (optional)<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}/></label>
      {failMode&&<label>Failure reason<input autoFocus required value={failureReason} onChange={e=>setFailureReason(e.target.value)} /></label>}
      <div className="actions"><button className="pass" disabled={busy} onClick={()=>save("PASS")}><span className="kbd">P</span> PASS</button><button className="fail" disabled={busy} onClick={()=>save("FAIL")}><span className="kbd">F</span> {failMode?"Save FAIL":"FAIL"}</button><button className="secondary" onClick={reset}>Cancel</button></div>
    </section>}
  </div>;
}
