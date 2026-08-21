# H2 Sentinel: Product and Architecture Narrative

## Product positioning

H2 Sentinel / 氢哨 is a local-first, evidence-first Web application for
weak-grid green-hydrogen EMS anomaly diagnosis and operations support. It sits
above the existing EMS and performs four bounded roles: supervision (监督),
diagnosis (诊断), impact quantification (影响量化), and advisory recommendations
(建议). It helps an operations engineer review a suspected coordination anomaly
through timing, evidence, impact, safety checks, provenance, and an advisory next
step. It does not replace an EMS, dispatch power, or turn language output into a
control action.

## Safety boundary

- **No closed-loop control.** The application never issues equipment commands to
  PV, BESS, electrolyzers, or the PCC. All power, mode, and parameter adjustments
  are advisory and require human confirmation.
- **Human confirmation is structural.** The canonical contracts carry
  `requiresHumanConfirmation`; the UI and every exported report retain the
  human-confirmation disclaimer.
- **Externalized hard constraints.** SOC 20–90 %, electrolyzer 300–1000 kW and
  the 120 kW/min ramp reference, PCC and BESS sign conventions, dynamic power
  limits, and daily energy quotas are machine-readable constraints that the
  application must not suggest breaking.
- **Bounded runtime.** Local mode is loopback-only: a same-origin
  `/api/v1/h2-sentinel` proxy to a validated `127.0.0.1` analytics target, with
  Host/Origin checks and redacted errors. It is not a remote-host interface,
  general sidecar runtime, dynamic plugin loader, or arbitrary shell surface.

## Seven anomaly classes

The official taxonomy C01–C07 is the single vocabulary for anomaly classes, each
with a primary control object, a primary impact metric, a severity (高/中),
applicable subtypes, and affected equipment normalized to the equipment master:

| Code | Class | Primary impact metric |
| --- | --- | --- |
| C01 | 电解槽功率指令振荡 (electrolyzer setpoint oscillation) | `bess_extra_regulation_energy_kwh` 储能额外调节能量 |
| C02 | 设备可用容量未同步导致功率指令持续偏差 (unsynchronized available capacity) | `unserved_elz_energy_kwh` 电解槽未执行能量 |
| C03 | 储能充放电方向异常 (BESS charge/discharge direction) | `abnormal_grid_exchange_energy_kwh` 异常电网交换电量 |
| C04 | PCC上下网功率边界跟踪异常 (PCC import/export boundary tracking) | `pcc_power_limit_violation_energy_kwh` PCC功率越限电量 |
| C05 | 上下网电量配额执行异常 (import/export energy-quota execution) | `grid_energy_quota_deviation_kwh` 上下网电量配额偏差 |
| C06 | 多台电解槽负荷分配异常 (multi-electrolyzer load allocation) | `extra_energy_consumption_kwh` 不合理负荷分配额外耗电量 |
| C07 | 储能SOC目标轨迹与调节裕度管理异常 (SOC trajectory and reserve management) | `bess_regulation_reserve_shortfall_kwh` 储能调节备用能量缺口 |

This taxonomy and its Chinese naming are read from the vocabulary package, not
re-derived in any downstream module. C03 and C04 are the classes exercised end to
end by the assembled Fixture and Local paths; the other classes are present in
the shared vocabulary and contracts but their detection and impact verification
on official data is not claimed.

## Official 69-field caliber and vocabulary single source of truth

`packages/h2-vocabulary/**` compiles the official package
(`企业资料包04_雷动`) into one machine-readable source of truth that Analytics,
Plugin, Web, QA, and Submission all consume read-only:

- **69 time-series fields** (`fields.json`) with the official field names, Chinese
  names, categories, types, units, signs, formulas, derivation flags, and
  related-anomaly links. 26 fields are derived and carry an explicit formula.
- **Equipment master** (8 records), **control constraints** (12), **electrolyzer
  efficiency curves** (12), **assistant questions** (10), **anomaly taxonomy**
  (7 classes), **knowledge base**, and a **deprecated-name to official-name map**
  (8 mappings).
- **Fixed sign conventions:** PCC power is 正值上网/负值下网; BESS power is 正值放电/
  负值充电; PV, electrolyzer, and auxiliary loads are non-negative. Limits and
  quota fields use non-negative magnitudes.
- **No fabricated variables.** The official package does not define an
  electrolyzer health score; no page, model, or report constructs one. No
  downstream module may reuse a deprecated internal field name.

This vocabulary is the calibration contract: Web pages, analytics rules, and
reports must use the same Chinese name, unit, and sign for every variable.

## Assembled architecture

```text
generic / -> existing Fixture Demo

/h2-sentinel/?mode=fixture -> statically registered H2 EMS Fixture plugin
/h2-sentinel/?mode=local   -> statically registered H2 EMS loopback plugin
                                   -> same-origin /api/v1/h2-sentinel proxy
                                       -> 127.0.0.1 deterministic analytics sidecar
```

The current assembled snapshot preserves the generic default and accepts only the
two explicit H2 modes. The Fixture path starts no Python service. The Local path
uses a fixed namespace and a validated loopback target; it is not a general
sidecar runtime, remote-host interface, dynamic plugin loader, arbitrary shell
surface, or evidence of broad network isolation.

## Current evidence

The 2026-08-19 H6 record shows the assembled H2 feature, statically reviewed
plugin service, launcher, and loopback proxy exercising C03/C04. The locked
Local golden run produced deterministic no-LLM C03 HTML output and a two-row
`submission.csv` whose validator confirmed the exact 16-column contract. The
analytics service uses loopback Host/Origin checks and no permissive CORS policy;
these source and smoke facts are not a claim of a deployed or independently
penetration-tested service.

The recorded hardening checks reject a 307 health redirect without forwarding it,
cover Windows-owned child cleanup, and make report content hashes visible for
review. They are bounded local-path evidence, not proof of general network
isolation.

Manual Chrome review at desktop and 390x844 verified the mounted Fixture
overview, C03, C04, provenance, human-confirmation boundary, corrected C04
impact of `29.333333333333332 kWh`, and no document-width overflow. No screenshot
asset or automated visual-regression proof was produced.

## Provenance and known limitation

The C03/C04 Fixture remains sanitized synthetic evidence. `FIXTURE` must never
be called official data, a plant result, a validation metric, or an organizer
score. `LIVE_ANALYSIS` describes the explicit Local adapter mode, but no official
dataset or official-data run is included or claimed.

Plugin source commit `92f7b78` resolves the Fixture report-format mismatch,
which coordinator integration `abe454b` contains. Single-event diagnosis,
period summary, and quality reports now return deterministic safe HTML with
matching filenames and media types. Analysis and validation artifacts remain
JSON, and submission output remains CSV. The format correction does not change
Fixture provenance or create official-data, score, or deployment evidence.

## Current boundaries

The candidate includes no official dataset, labels, versioned validation report,
precision/recall/F1 result, organizer score, deployment record, remote GitHub
Actions run, network-isolation proof, or committed screenshot asset. The H2
workflow is committed, but a committed workflow is not proof of a remote run.
Detection, classification, and impact verification for C01, C02, C05, C06, and
C07 against official data remain unverified; their shared vocabulary and
contract definitions exist, and C03/C04 are the verified end-to-end classes.

## Sources

- [H6 integration handoff](../../scripts/h2-sentinel/HANDOFF.md)
- [H2 contracts handoff](../../packages/h2-contracts/HANDOFF.md)
- [H2 analytics handoff](../../services/h2-analytics/HANDOFF.md)
- [H2 vocabulary base](../../packages/h2-vocabulary/README.md)
- [H2 QA acceptance matrix](../../tests/h2-sentinel/ACCEPTANCE_MATRIX.md)
