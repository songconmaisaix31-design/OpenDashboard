"""Compile the official H2 data package into the read-only vocabulary package.

Inputs (read-only, UTF-8 with BOM):
  $H2_PACK/data/00_变量中文描述与数据字典.csv
  $H2_PACK/data/04_train_event_labels.csv
  $H2_PACK/data/05_validation_event_labels.csv
  $H2_PACK/data/08_equipment_master.csv
  $H2_PACK/data/09_control_constraints.csv
  $H2_PACK/data/10_electrolyzer_efficiency_curves.csv
  $H2_PACK/data/16_assistant_questions.csv
  $H2_PACK/data/15_knowledge_base.md

Outputs:
  packages/h2-vocabulary/data/*.json
  packages/h2-vocabulary/data/knowledge-base.md
  packages/h2-vocabulary/data/version.json
"""

from __future__ import annotations

import csv
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

H2_PACK = Path(
    r"C:\Users\DW\Desktop\T03_设备故障排查与智能运维助手\T03_设备故障排查与智能运维助手\企业资料包04_雷动\数据与材料"
)
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
SOURCE_PACKAGE = "企业资料包04_雷动"

EQUIPMENT_CODE_MAP = {
    "PV": "PV01",
    "BESS": "BESS01",
    "PCC": "PCC01",
    "ELZ1": "ELZ01",
    "ELZ2": "ELZ02",
    "ELZ3": "ELZ03",
}

ELECTROLYZER_IDS = ["ELZ01", "ELZ02", "ELZ03"]

# Expected code-level rule from the official labels: C01/C06 medium, rest high.
EXPECTED_SEVERITY = {
    "C01": "中",
    "C02": "高",
    "C03": "高",
    "C04": "高",
    "C05": "高",
    "C06": "中",
    "C07": "高",
}

ANOMALY_CODES = [f"C{code:02d}" for code in range(1, 8)]

DEPRECATED_FIELD_MAP = {
    "schemaVersion": 1,
    "mappings": [
        {"internal": "bess_power_kw", "official": "bess_power_actual_kw", "note": "储能实际功率"},
        {"internal": "bess_dispatch_command_kw", "official": "bess_power_cmd_kw", "note": "储能功率指令"},
        {"internal": "pcc_power_kw", "official": "pcc_power_actual_kw", "note": "PCC实际有功功率"},
        {"internal": "pcc_export_limit_kw", "official": "grid_export_power_limit_kw", "note": "上网功率上限"},
        {"internal": "pcc_import_limit_kw", "official": "grid_import_power_limit_kw", "note": "下网功率上限"},
        {"internal": "bess_soc_percent", "official": "bess_soc_pct", "note": "储能实际SOC"},
        {"internal": "auxiliary_load_kw", "official": "aux_load_kw", "note": "制氢辅助负荷功率"},
        {
            "internal": "total_electrolyzer_power_kw",
            "official": None,
            "derived": "elz1_power_actual_kw + elz2_power_actual_kw + elz3_power_actual_kw",
            "note": "电解槽实际总功率，官方无单列",
        },
    ],
}


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def split_list(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


def write_json(obj: object, name: str) -> None:
    target = DATA / name
    with target.open("w", encoding="utf-8", newline="\n") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"wrote {target.relative_to(ROOT.parent)} ({len(target.read_bytes())} bytes)")


def build_fields() -> list[dict]:
    rows = read_csv_rows(H2_PACK / "00_变量中文描述与数据字典.csv")
    timeseries = [r for r in rows if r["source_file"] == "01/02/03_timeseries.csv"]
    fields = []
    for r in timeseries:
        fields.append(
            {
                "name": r["variable_name"],
                "chineseName": r["chinese_name"],
                "category": r["category"],
                "dataType": r["data_type"],
                "unit": r["unit"],
                "sign": r["sign_or_enum"],
                "description": r["description"],
                "formula": r["formula_or_rule"],
                "isDerived": r["is_derived"] == "是",
                "relatedAnomaly": split_list(r["related_anomaly"]),
                "sourceFile": r["source_file"],
            }
        )
    return fields


def build_anomaly_taxonomy() -> list[dict]:
    labels = read_csv_rows(H2_PACK / "04_train_event_labels.csv") + read_csv_rows(
        H2_PACK / "05_validation_event_labels.csv"
    )
    by_code: dict[str, list[dict]] = defaultdict(list)
    for row in labels:
        by_code[row["anomaly_code"]].append(row)

    equipment_rows = read_csv_rows(H2_PACK / "08_equipment_master.csv")
    equipment_name_by_id = {r["equipment_id"]: r["equipment_name"] for r in equipment_rows}
    ledger_order = [r["equipment_id"] for r in equipment_rows]

    taxonomy = []
    for code in ANOMALY_CODES:
        rows = by_code.get(code, [])
        if not rows:
            raise SystemExit(f"missing labels for {code}")

        names = {r["anomaly_name"] for r in rows}
        control_objects = {r["primary_control_object"] for r in rows}
        impact = {r["primary_impact_metric"] for r in rows}
        impact_zh = {r["primary_impact_metric_cn"] for r in rows}
        severities = {r["severity"] for r in rows}

        if len(names) != 1 or len(control_objects) != 1 or len(impact) != 1 or len(impact_zh) != 1:
            raise SystemExit(
                f"{code} inconsistent official fields: names={names} control={control_objects} "
                f"impact={impact} impact_zh={impact_zh}"
            )
        if len(severities) != 1 or severities != {EXPECTED_SEVERITY[code]}:
            raise SystemExit(f"{code} severity mismatch: {severities} != {EXPECTED_SEVERITY[code]}")

        subtypes = []
        seen = set()
        for row in rows:
            st = row["anomaly_subtype"]
            if st not in seen:
                seen.add(st)
                subtypes.append({"code": st, "nameZh": row["anomaly_name"]})

        affected: set[str] = set()
        for row in rows:
            for token in split_list(row["affected_equipment"]):
                if token == "ELZ":
                    affected.update(ELECTROLYZER_IDS)
                elif token in EQUIPMENT_CODE_MAP:
                    affected.add(EQUIPMENT_CODE_MAP[token])
                else:
                    raise SystemExit(f"{code} unknown affected equipment token: {token!r}")

        affected_sorted = [
            {"equipmentId": eid, "equipmentName": equipment_name_by_id[eid]}
            for eid in ledger_order
            if eid in affected
        ]

        taxonomy.append(
            {
                "code": code,
                "nameZh": next(iter(names)),
                "primaryControlObject": next(iter(control_objects)),
                "primaryImpactMetric": next(iter(impact)),
                "primaryImpactMetricZh": next(iter(impact_zh)),
                "severity": EXPECTED_SEVERITY[code],
                "subtypes": subtypes,
                "affectedEquipment": affected_sorted,
            }
        )
    return taxonomy


def build_from_csv(source_name: str) -> list[dict]:
    rows = read_csv_rows(H2_PACK / source_name)
    return [dict(r) for r in rows]


def build_assistant_questions() -> list[dict]:
    rows = read_csv_rows(H2_PACK / "16_assistant_questions.csv")
    return [{"questionId": r["question_id"], "question": r["question"]} for r in rows]


def copy_knowledge_base() -> None:
    src = H2_PACK / "15_knowledge_base.md"
    dst = DATA / "knowledge-base.md"
    dst.write_bytes(src.read_bytes())
    print(f"copied {src.name} -> {dst.relative_to(ROOT.parent)} ({dst.stat().st_size} bytes)")


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)

    fields = build_fields()
    if len(fields) != 69:
        raise SystemExit(f"expected 69 timeseries fields, got {len(fields)}")
    write_json({"schemaVersion": 1, "fields": fields}, "fields.json")

    taxonomy = build_anomaly_taxonomy()
    if [t["code"] for t in taxonomy] != ANOMALY_CODES:
        raise SystemExit("taxonomy does not cover C01..C07 in order")
    write_json(taxonomy, "anomaly-taxonomy.json")

    equipment = build_from_csv("08_equipment_master.csv")
    constraints = build_from_csv("09_control_constraints.csv")
    curves = build_from_csv("10_electrolyzer_efficiency_curves.csv")
    questions = build_assistant_questions()
    if len(questions) != 10:
        raise SystemExit(f"expected 10 questions, got {len(questions)}")
    write_json(equipment, "equipment.json")
    write_json(constraints, "constraints.json")
    write_json(curves, "efficiency-curves.json")
    write_json(questions, "assistant-questions.json")

    write_json(DEPRECATED_FIELD_MAP, "deprecated-field-map.json")

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_json(
        {
            "schemaVersion": 1,
            "generatedAt": generated_at,
            "sourcePackage": SOURCE_PACKAGE,
        },
        "version.json",
    )

    copy_knowledge_base()

    print(f"fields={len(fields)} taxonomy={len(taxonomy)} equipment={len(equipment)} "
          f"constraints={len(constraints)} curves={len(curves)} questions={len(questions)}")


if __name__ == "__main__":
    sys.exit(main())
