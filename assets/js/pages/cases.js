/* ============ Modal improvements ============ */
.modal-wide { max-width: 640px; max-height: 90dvh; overflow-y: auto; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.modal-header h3 { font-size: 1.15rem; font-weight: 700; }
.modal-close {
  width: 32px; height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
}
.modal-close:hover { background: var(--danger-soft); color: var(--danger); }

.form-section {
  padding: 18px 0;
  border-top: 1px solid var(--surface-soft);
}
.form-section:first-of-type { border-top: none; padding-top: 4px; }

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-head h4 {
  font-size: .8rem;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--text-muted);
  font-weight: 600;
}

/* ============ Stage rows ============ */
.stage-row {
  padding: 14px;
  border-radius: var(--radius);
  background: var(--surface-soft);
  margin-bottom: 10px;
  position: relative;
}
.stage-fields {
  display: grid;
  grid-template-columns: 1fr 90px 120px auto;
  gap: 10px;
  align-items: end;
}
.stage-fields .field { margin: 0; }
.stage-fields .field span { font-size: .7rem; }
.stage-fields select,
.stage-fields input {
  padding: 10px 12px;
  font-size: .9rem;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg);
  box-shadow: var(--shadow-inset);
  outline: none;
  width: 100%;
  color: var(--text);
}
.stage-price { font-weight: 600; text-align: right; }
.stage-remove {
  width: 34px; height: 34px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.3rem;
  cursor: pointer;
  line-height: 1;
}
.stage-remove:hover { background: var(--danger-soft); color: var(--danger); }
.stage-label {
  font-size: .72rem;
  color: var(--text-muted);
  margin-top: 6px;
  padding-left: 2px;
}

.case-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  margin-top: 6px;
  border-radius: var(--radius);
  background: var(--primary-soft);
  font-size: .85rem;
  color: var(--primary);
}
.case-total-row b { font-size: 1.15rem; }

@media (max-width: 560px) {
  .stage-fields {
    grid-template-columns: 1fr 70px;
    grid-template-areas:
      "type  qty"
      "price price"
      "remove remove";
  }
  .stage-fields .field:nth-child(1) { grid-area: type; }
  .stage-fields .field:nth-child(2) { grid-area: qty; }
  .stage-fields .field:nth-child(3) { grid-area: price; }
  .stage-remove { grid-area: remove; justify-self: end; }
}

/* ============ Table tweaks ============ */
.cell-main { font-weight: 500; }
.cell-sub { font-size: .75rem; color: var(--text-muted); margin-top: 2px; }
.stage-count {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: .7rem;
  font-weight: 600;
}
.empty-row {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 16px !important;
  font-size: .9rem;
}
.badge + .badge { margin-left: 4px; }
