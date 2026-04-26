import os
import numpy as np
import scipy.io as sio
from pathlib import Path
from typing import Dict, List, Tuple

# CWRU bearing dataset file mapping
# Format: {file_id: (fault_type, fault_size_inches, load_hp)}
CWRU_FILE_MAP = {
    # Normal
    "97":  ("Normal", 0.000, 0),
    "98":  ("Normal", 0.000, 1),
    "99":  ("Normal", 0.000, 2),
    "100": ("Normal", 0.000, 3),
    # Inner Race Fault
    "105": ("Inner_Race", 0.007, 0),
    "106": ("Inner_Race", 0.007, 1),
    "107": ("Inner_Race", 0.007, 2),
    "108": ("Inner_Race", 0.007, 3),
    "169": ("Inner_Race", 0.014, 0),
    "170": ("Inner_Race", 0.014, 1),
    "171": ("Inner_Race", 0.014, 2),
    "172": ("Inner_Race", 0.014, 3),
    "209": ("Inner_Race", 0.021, 0),
    "210": ("Inner_Race", 0.021, 1),
    "211": ("Inner_Race", 0.021, 2),
    "212": ("Inner_Race", 0.021, 3),
    # Ball Fault
    "118": ("Ball", 0.007, 0),
    "119": ("Ball", 0.007, 1),
    "120": ("Ball", 0.007, 2),
    "121": ("Ball", 0.007, 3),
    "185": ("Ball", 0.014, 0),
    "186": ("Ball", 0.014, 1),
    "187": ("Ball", 0.014, 2),
    "188": ("Ball", 0.014, 3),
    "222": ("Ball", 0.021, 0),
    "223": ("Ball", 0.021, 1),
    "224": ("Ball", 0.021, 2),
    "225": ("Ball", 0.021, 3),
    # Outer Race Fault
    "130": ("Outer_Race", 0.007, 0),
    "131": ("Outer_Race", 0.007, 1),
    "132": ("Outer_Race", 0.007, 2),
    "133": ("Outer_Race", 0.007, 3),
    "197": ("Outer_Race", 0.014, 0),
    "198": ("Outer_Race", 0.014, 1),
    "199": ("Outer_Race", 0.014, 2),
    "200": ("Outer_Race", 0.014, 3),
    "234": ("Outer_Race", 0.021, 0),
    "235": ("Outer_Race", 0.021, 1),
    "236": ("Outer_Race", 0.021, 2),
    "237": ("Outer_Race", 0.021, 3),
}

LABEL_MAP = {"Normal": 0, "Inner_Race": 1, "Ball": 2, "Outer_Race": 3}
LABEL_NAMES = {0: "Normal", 1: "Inner Race", 2: "Ball Fault", 3: "Outer Race"}


def _extract_signal(mat_data: dict) -> np.ndarray:
    """Extract drive-end accelerometer signal from .mat file."""
    for key in mat_data:
        if "DE_time" in key:
            return mat_data[key].flatten()
    # Fallback: fan end
    for key in mat_data:
        if "FE_time" in key:
            return mat_data[key].flatten()
    raise KeyError(f"No DE_time or FE_time key found. Keys: {list(mat_data.keys())}")


def load_cwru_dataset(data_dir: str) -> Tuple[List[np.ndarray], List[int], List[dict]]:
    """
    Load all CWRU .mat files from data_dir.

    Returns:
        signals   : list of 1D numpy arrays (variable length)
        labels    : list of integer class labels
        metadata  : list of dicts with fault_type, fault_size, load
    """
    data_dir = Path(data_dir)
    signals, labels, metadata = [], [], []

    mat_files = sorted(data_dir.glob("*.mat"))
    if not mat_files:
        raise FileNotFoundError(f"No .mat files found in {data_dir}")

    print(f"Found {len(mat_files)} .mat files in {data_dir}")

    for mat_path in mat_files:
        file_id = mat_path.stem.lstrip("0") or "0"
        # Try matching with and without leading zeros
        info = CWRU_FILE_MAP.get(file_id) or CWRU_FILE_MAP.get(mat_path.stem)
        if info is None:
            print(f"  [SKIP] {mat_path.name} — not in file map")
            continue

        fault_type, fault_size, load = info
        try:
            mat_data = sio.loadmat(str(mat_path))
            signal = _extract_signal(mat_data)
            signals.append(signal)
            labels.append(LABEL_MAP[fault_type])
            metadata.append({
                "file": mat_path.name,
                "fault_type": fault_type,
                "fault_size": fault_size,
                "load_hp": load,
                "signal_length": len(signal),
            })
            print(f"  [OK] {mat_path.name} | {fault_type} | {fault_size}\" | {load}HP | {len(signal):,} samples")
        except Exception as e:
            print(f"  [ERROR] {mat_path.name}: {e}")

    print(f"\nLoaded {len(signals)} signals across {len(set(labels))} classes")
    return signals, labels, metadata
