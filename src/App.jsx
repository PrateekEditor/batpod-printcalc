import { useMemo, useState } from 'react';
import { PRINTERS, printerById } from './data/printers';
import { FILAMENTS, filamentById } from './data/filaments';
import { costJob, fitsOnPlate, gramsFromVolume, DEFAULT_SETTINGS } from './calc';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export default function App() {
  const [printerId, setPrinterId] = useState('bambu-a1');
  const [filamentId, setFilamentId] = useState('pla');

  // Overrides, so the presets are a starting point rather than a cage.
  const [printerOverride, setPrinterOverride] = useState({});
  const [filamentPrice, setFilamentPrice] = useState(null);

  const [job, setJob] = useState({
    grams: 12,
    printHours: 0.6,
    handsOnMinutes: 7,
    setupMinutes: 5,
    quantity: 1,
    sellPrice: '',
  });

  const [dims, setDims] = useState({ x: '', y: '', z: '' });
  const [volumeCm3, setVolumeCm3] = useState('');
  const [infill, setInfill] = useState(25);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [image, setImage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const printer = useMemo(() => ({ ...printerById(printerId), ...printerOverride }), [printerId, printerOverride]);
  const filament = useMemo(() => {
    const f = filamentById(filamentId);
    return filamentPrice !== null && filamentPrice !== '' ? { ...f, pricePerKg: Number(filamentPrice) } : f;
  }, [filamentId, filamentPrice]);

  const result = useMemo(() => costJob(job, printer, filament, settings), [job, printer, filament, settings]);

  const fit = useMemo(() => {
    const d = [dims.x, dims.y, dims.z].map(Number).filter((n) => n > 0);
    return d.length === 3 ? fitsOnPlate(d, printer) : { fits: true, unknown: true };
  }, [dims, printer]);

  const setJobField = (k) => (e) => setJob((j) => ({ ...j, [k]: e.target.value }));
  const setSetting = (k) => (e) => setSettings((s) => ({ ...s, [k]: Number(e.target.value) }));

  function pickPrinter(id) {
    setPrinterId(id);
    setPrinterOverride({});
  }

  function pickImage(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return setImage(null);
    // Preview only. Nothing is uploaded and nothing is read from the pixels —
    // when a slicer or mesh parser is wired in later, this is where it hooks.
    setImage({ name: f.name, url: URL.createObjectURL(f), sizeKb: Math.round(f.size / 1024) });
  }

  function useVolume() {
    const v = Number(volumeCm3);
    if (!(v > 0)) return;
    setJob((j) => ({ ...j, grams: gramsFromVolume(v, filament, infill) }));
  }

  const maxBar = Math.max(...result.breakdown.map((b) => b.total), 1);
  const marginChip = result.marginPercent >= 55 ? 'good' : result.marginPercent >= 35 ? 'warn' : 'bad';

  return (
    <div className="wrap">
      <header className="top">
        <span className="eyebrow">For print shops · figures in ₹</span>
        <h1>What this job actually costs you</h1>
        <p>
          Most print pricing counts filament and stops. Filament is rarely the biggest line — your own time usually is,
          and the printer wearing out is the one nobody counts at all. Put a real job in and see where the money goes.
        </p>
      </header>

      <div className="layout">
        {/* ------------------------------- inputs ------------------------------ */}
        <div className="stack">
          <section className="card">
            <h2>Your setup</h2>
            <div className="grid">
              <label className="field">
                <span>Printer</span>
                <select value={printerId} onChange={(e) => pickPrinter(e.target.value)}>
                  {PRINTERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <small>
                  {printer.buildVolume.join(' × ')} mm · {printer.avgWatts} W · {printer.multiColour}
                </small>
              </label>

              <label className="field">
                <span>What it cost you ₹</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={printer.priceInr}
                  onChange={(e) => setPrinterOverride((o) => ({ ...o, priceInr: Number(e.target.value) }))}
                />
                <small>Drives machine wear and break-even</small>
              </label>

              <label className="field">
                <span>Filament</span>
                <select
                  value={filamentId}
                  onChange={(e) => {
                    setFilamentId(e.target.value);
                    setFilamentPrice(null);
                  }}
                >
                  {FILAMENTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <small>
                  {filament.density} g/cm³ · {filament.nozzleTemp}°C
                </small>
              </label>

              <label className="field">
                <span>What you pay ₹/kg</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={filament.pricePerKg}
                  onChange={(e) => setFilamentPrice(e.target.value)}
                />
                <small>The single biggest lever here</small>
              </label>
            </div>
          </section>

          <section className="card">
            <h2>The job</h2>
            <div className="grid">
              <label className="field">
                <span>Filament per unit (g)</span>
                <input type="number" min="0" step="1" value={job.grams} onChange={setJobField('grams')} />
                <small>Bambu Studio tells you after slicing</small>
              </label>
              <label className="field">
                <span>Print hours per unit</span>
                <input type="number" min="0" step="0.1" value={job.printHours} onChange={setJobField('printHours')} />
                <small>Also from the slice preview</small>
              </label>
              <label className="field">
                <span>Hands-on minutes per unit</span>
                <input type="number" min="0" step="1" value={job.handsOnMinutes} onChange={setJobField('handsOnMinutes')} />
                <small>Supports, sanding, packing</small>
              </label>
              <label className="field">
                <span>Setup minutes (once)</span>
                <input type="number" min="0" step="1" value={job.setupMinutes} onChange={setJobField('setupMinutes')} />
                <small>Plate layout, first-layer watch</small>
              </label>
              <label className="field">
                <span>Quantity</span>
                <input type="number" min="1" step="1" value={job.quantity} onChange={setJobField('quantity')} />
              </label>
              <label className="field">
                <span>Your price ₹ (optional)</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={job.sellPrice}
                  placeholder={String(result.suggestedUnitPrice)}
                  onChange={setJobField('sellPrice')}
                />
                <small>Leave blank to use the suggestion</small>
              </label>
            </div>

            <details>
              <summary>I only know the model&rsquo;s volume</summary>
              <div className="grid" style={{ marginTop: 12 }}>
                <label className="field">
                  <span>Volume (cm³)</span>
                  <input type="number" min="0" step="1" value={volumeCm3} onChange={(e) => setVolumeCm3(e.target.value)} />
                </label>
                <label className="field">
                  <span>Infill %</span>
                  <input type="number" min="0" max="100" step="5" value={infill} onChange={(e) => setInfill(Number(e.target.value))} />
                </label>
                <div className="field" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn ghost" type="button" onClick={useVolume}>
                    Convert to grams
                  </button>
                </div>
              </div>
              <p className="tiny muted" style={{ marginTop: 8 }}>
                A rough conversion — shell plus infill, not a real slice. Use the slicer&rsquo;s number when you have it.
              </p>
            </details>
          </section>

          <section className="card">
            <h2>Does it fit</h2>
            <div className="grid">
              {['x', 'y', 'z'].map((axis) => (
                <label className="field" key={axis}>
                  <span>{axis.toUpperCase()} (mm)</span>
                  <input
                    type="number"
                    min="0"
                    value={dims[axis]}
                    onChange={(e) => setDims((d) => ({ ...d, [axis]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            {!fit.unknown &&
              (fit.fits ? (
                <p className="notice good">
                  Fits on the {printer.label} plate ({printer.buildVolume.join(' × ')} mm), rotating if needed.
                </p>
              ) : (
                <p className="notice bad">
                  Too big for the {printer.label} ({printer.buildVolume.join(' × ')} mm). Split the model, or the job
                  needs a different machine — worth knowing before you quote it.
                </p>
              ))}
          </section>

          <section className="card">
            <h2>Reference photo</h2>
            {image ? (
              <div className="preview">
                <img src={image.url} alt="" />
                <div style={{ minWidth: 0 }}>
                  <div className="mono tiny" style={{ wordBreak: 'break-all' }}>{image.name}</div>
                  <div className="tiny muted">{image.sizeKb} KB</div>
                  <button className="btn ghost small" style={{ marginTop: 6 }} onClick={() => setImage(null)}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input type="file" accept="image/*" onChange={pickImage} className="drop" />
                <p className="tiny muted">
                  Preview only, so you can see what you are quoting. Nothing is uploaded and nothing is read from the
                  image — this is where mesh parsing would hook in later to fill the weight and time in for you.
                </p>
              </>
            )}
          </section>

          <section className="card">
            <div className="row">
              <h2>Your rates</h2>
              <button className="btn ghost small" onClick={() => setShowSettings((s) => !s)}>
                {showSettings ? 'Hide' : 'Change'}
              </button>
            </div>
            {!showSettings ? (
              <p className="tiny muted">
                Time at {inr(settings.labourPerHour)}/hr · power {inr(settings.electricityPerUnit)}/unit ·{' '}
                {settings.failRate}% failures · {settings.platformFeePercent}% fees · targeting{' '}
                {settings.targetMarginPercent}% margin
              </p>
            ) : (
              <div className="grid">
                <label className="field">
                  <span>Your time ₹/hour</span>
                  <input type="number" min="0" step="25" value={settings.labourPerHour} onChange={setSetting('labourPerHour')} />
                </label>
                <label className="field">
                  <span>Electricity ₹/unit</span>
                  <input type="number" min="0" step="0.5" value={settings.electricityPerUnit} onChange={setSetting('electricityPerUnit')} />
                </label>
                <label className="field">
                  <span>Failed prints %</span>
                  <input type="number" min="0" max="50" value={settings.failRate} onChange={setSetting('failRate')} />
                </label>
                <label className="field">
                  <span>Packaging ₹/order</span>
                  <input type="number" min="0" value={settings.packagingPerOrder} onChange={setSetting('packagingPerOrder')} />
                </label>
                <label className="field">
                  <span>Shipping ₹/order</span>
                  <input type="number" min="0" value={settings.shippingPerOrder} onChange={setSetting('shippingPerOrder')} />
                  <small>Zero if the customer pays it</small>
                </label>
                <label className="field">
                  <span>Platform fee %</span>
                  <input type="number" min="0" max="50" step="0.5" value={settings.platformFeePercent} onChange={setSetting('platformFeePercent')} />
                  <small>Gateway, Etsy, marketplace</small>
                </label>
                <label className="field">
                  <span>Target margin %</span>
                  <input type="number" min="0" max="90" value={settings.targetMarginPercent} onChange={setSetting('targetMarginPercent')} />
                </label>
                <label className="field">
                  <span>Machine life (hours)</span>
                  <input type="number" min="500" step="500" value={settings.machineLifeHours} onChange={setSetting('machineLifeHours')} />
                  <small>Before replacement or a rebuild</small>
                </label>
                <label className="field">
                  <span>Printing hours/day</span>
                  <input type="number" min="1" max="24" value={settings.printerHoursPerDay} onChange={setSetting('printerHoursPerDay')} />
                </label>
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------ results ------------------------------ */}
        <div className="stack">
          <section className="card">
            <div className="headline">
              <span className="eyebrow">{result.usingSuggestedPrice ? 'Suggested price each' : 'Your price each'}</span>
              <span className="price">{inr(result.actualPrice)}</span>
              <span className="sub">
                costs {inr(result.unitCost)} to make · <span className={`chip ${marginChip}`}>{result.marginPercent}% margin</span>
              </span>
            </div>

            {result.usingSuggestedPrice && (
              <p className="tiny muted">
                Priced to hit your {settings.targetMarginPercent}% target after the {settings.platformFeePercent}% fee.
                Type your own price above to see what it really leaves you.
              </p>
            )}

            <div className="tiles">
              <div className="tile">
                <span className="k">Profit each</span>
                <span className="v" style={{ color: result.profitPerUnit >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                  {inr(result.profitPerUnit)}
                </span>
              </div>
              <div className="tile">
                <span className="k">Job total</span>
                <span className="v">{inr(result.totalRevenue)}</span>
                <span className="n">{result.quantity} units</span>
              </div>
              <div className="tile">
                <span className="k">Job profit</span>
                <span className="v">{inr(result.totalProfit)}</span>
              </div>
              <div className="tile">
                <span className="k">Per print-hour</span>
                <span className="v">{inr(result.profitPerPrintHour)}</span>
                <span className="n">{result.totalPrintHours} h on the machine</span>
              </div>
              <div className="tile">
                <span className="k">Per hour of yours</span>
                <span className="v">{inr(result.profitPerHandsOnHour)}</span>
                <span className="n">{result.totalHandsOnHours} h hands-on</span>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Where the cost goes</h2>
            <div className="bars">
              {result.breakdown.map((b) => (
                <div className="bar-row" key={b.key}>
                  <div className="bar-name">{b.label}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(0, b.total / maxBar) * 72}%` }} />
                    <span className="bar-val">{inr(b.total)}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="tiny muted">
              Totals for all {result.quantity} units, largest first. If &ldquo;your time&rdquo; is at the top, that is
              not a mistake — it is the finding.
            </p>
          </section>

          <section className="card">
            <h2>What it means</h2>
            <div className="row">
              <span className="muted">To pay off the {printer.label}</span>
              <span className="mono">
                {result.breakEvenUnits === null ? 'never at this price' : `${result.breakEvenUnits.toLocaleString('en-IN')} units`}
              </span>
            </div>
            <div className="row">
              <span className="muted">Most you could print in a month</span>
              <span className="mono">{result.maxUnitsPerMonth === null ? '—' : `${result.maxUnitsPerMonth} units`}</span>
            </div>
            <div className="row">
              <span className="muted">Profit if you sold every one</span>
              <span className="mono">{result.ceilingMonthlyProfit === null ? '—' : inr(result.ceilingMonthlyProfit)}</span>
            </div>
            <p className="tiny muted">
              That last figure is a ceiling, not a forecast. Selling them is the hard part — the printer almost never
              is.
            </p>
          </section>

          {result.warnings.length > 0 && (
            <section className="card">
              <h2>Worth a second look</h2>
              {result.warnings.map((w, i) => (
                <p className="notice warn" key={i}>
                  {w}
                </p>
              ))}
            </section>
          )}
        </div>
      </div>

      <footer className="foot">
        Printer presets are hand-entered from manufacturer specs; throughput figures are conservative real-world
        numbers, since no manufacturer publishes grams per hour. Change any of them — they are a starting point, not
        the truth about your machine. Filament prices are Indian street prices and will drift; set yours.
      </footer>
    </div>
  );
}
