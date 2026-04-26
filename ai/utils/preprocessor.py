import numpy as np
from typing import List, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE


def sliding_window(signal: np.ndarray, window_size: int = 1024, overlap: float = 0.5) -> np.ndarray:
    """Segment a 1D signal into overlapping windows."""
    step = int(window_size * (1 - overlap))
    starts = range(0, len(signal) - window_size + 1, step)
    return np.array([signal[s:s + window_size] for s in starts])


def segment_signals(
    signals: List[np.ndarray],
    labels: List[int],
    window_size: int = 1024,
    overlap: float = 0.5,
) -> Tuple[np.ndarray, np.ndarray]:
    """Apply sliding window to all signals and return (X, y)."""
    X_list, y_list = [], []
    for signal, label in zip(signals, labels):
        windows = sliding_window(signal, window_size, overlap)
        X_list.append(windows)
        y_list.extend([label] * len(windows))
    X = np.vstack(X_list)
    y = np.array(y_list)
    print(f"Segmented → X: {X.shape}, y: {y.shape}")
    return X, y


def zscore_normalize(X: np.ndarray) -> np.ndarray:
    """Per-sample Z-score normalization along the time axis."""
    mean = X.mean(axis=1, keepdims=True)
    std  = X.std(axis=1, keepdims=True) + 1e-8
    return (X - mean) / std


def add_noise(X: np.ndarray, snr_db: float = 20.0) -> np.ndarray:
    """Add Gaussian noise at a given SNR (dB) for augmentation."""
    signal_power = np.mean(X ** 2, axis=1, keepdims=True)
    noise_power  = signal_power / (10 ** (snr_db / 10))
    noise        = np.random.randn(*X.shape) * np.sqrt(noise_power)
    return X + noise


def split_data(
    X: np.ndarray,
    y: np.ndarray,
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_state: int = 42,
) -> Tuple[np.ndarray, ...]:
    """Split into train / val / test sets (stratified)."""
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=random_state
    )
    val_ratio = val_size / (1 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=val_ratio, stratify=y_temp, random_state=random_state
    )
    print(f"Train: {X_train.shape} | Val: {X_val.shape} | Test: {X_test.shape}")
    return X_train, X_val, X_test, y_train, y_val, y_test


def apply_smote(X_train: np.ndarray, y_train: np.ndarray, random_state: int = 42):
    """Apply SMOTE on flattened training data to handle class imbalance."""
    smote = SMOTE(random_state=random_state)
    X_res, y_res = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE → X: {X_res.shape}, y: {y_res.shape}")
    return X_res, y_res


def compute_fft(signal: np.ndarray, sample_rate: int = 12000) -> Tuple[np.ndarray, np.ndarray]:
    """Compute single-sided FFT magnitude spectrum."""
    n    = len(signal)
    fft  = np.fft.rfft(signal)
    freq = np.fft.rfftfreq(n, d=1.0 / sample_rate)
    mag  = np.abs(fft) / n
    return freq, mag


def compute_snr(signal: np.ndarray, noise_floor_percentile: float = 10.0) -> float:
    """Estimate SNR by comparing signal power to noise floor."""
    power       = signal ** 2
    noise_floor = np.percentile(power, noise_floor_percentile)
    signal_pwr  = np.mean(power)
    if noise_floor < 1e-12:
        return float("inf")
    return 10 * np.log10(signal_pwr / noise_floor)
