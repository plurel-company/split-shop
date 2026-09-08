"use client";
import { useCart } from "./cart-context";
import { usePlurelMode } from "./plurel-mode-provider";
import { DEMO_SCENARIOS } from "@/lib/demo-scenarios";
export function DemoControls() {
  const { loadScenario, resetDemo, scenario, people, setPeople } = useCart();
  const { loading, ready, refresh } = usePlurelMode();
  return <section className="demo-controls" aria-label="Demo controls">
    <div className="demo-controls__heading"><div><h2>Try a shared moment</h2><p>Pick a starting cart, then make it yours.</p></div><button type="button" className="demo-reset" onClick={resetDemo}>Reset demo ↺</button></div>
    <div className="scenario-grid">{DEMO_SCENARIOS.map(item => <button type="button" key={item.id} className="scenario-card" aria-pressed={scenario === item.id} onClick={() => loadScenario(item)}><span>{item.title}</span><small>{item.detail}</small><span className="scenario-arrow" aria-hidden="true">↗</span></button>)}</div>
    <div className="demo-controls__bottom"><label className="people-picker">Split preview <select value={people} onChange={event => setPeople(Number(event.target.value))}>{[2,3,4,5,6].map(count => <option value={count} key={count}>{count} people</option>)}</select></label><div className="demo-readiness" role="status"><span className={ready ? "status-dot status-dot--ready" : "status-dot"} aria-hidden="true" />{loading ? "Checking sandbox…" : ready ? "Sandbox checkout available" : "Preview available · Checkout not connected"}{!loading && !ready && <button type="button" onClick={refresh}>Check again</button>}</div></div>
  </section>;
}
