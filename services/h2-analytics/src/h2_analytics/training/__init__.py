"""Training package: reproducible candidate-scorer fitting from the official pack.

Run from the analytics service root with the read-only official data pack:

    H2_OFFICIAL_DATA_DIR="<pack>/数据与材料" python -m h2_analytics.training.fit

The script streams the 525,600-row training series, computes windowed
features over the 69 official fields, fits a LightGBM multi-class scorer with
06_train_row_labels.csv codes as labels, and writes the artifact plus its
metadata into `services/h2-analytics/models/` (git-ignored). The artifact is
loaded by `h2_analytics.detection.factory` when present; the rule layer always
runs as the confirmation authority.
"""
