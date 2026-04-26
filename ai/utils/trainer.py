import time
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    confusion_matrix, classification_report, matthews_corrcoef,
)


# ── Focal Loss ────────────────────────────────────────────────────────────────

class FocalLoss(nn.Module):
    """Focal Loss — down-weights easy examples, focuses on hard misclassified ones."""
    def __init__(self, gamma=2.0, alpha=None, num_classes=4):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha  # class weights tensor or None

    def forward(self, logits, targets):
        ce   = F.cross_entropy(logits, targets, weight=self.alpha, reduction='none')
        pt   = torch.exp(-ce)
        loss = ((1 - pt) ** self.gamma) * ce
        return loss.mean()


# ── Dataset builder ───────────────────────────────────────────────────────────

def make_loaders(X_train, y_train, X_val, y_val, X_test, y_test, batch_size=64):
    def to_tensor(X, y):
        return TensorDataset(
            torch.tensor(X, dtype=torch.float32),
            torch.tensor(y, dtype=torch.long),
        )
    train_ds = to_tensor(X_train, y_train)
    val_ds   = to_tensor(X_val,   y_val)
    test_ds  = to_tensor(X_test,  y_test)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,  num_workers=0)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader  = DataLoader(test_ds,  batch_size=batch_size, shuffle=False, num_workers=0)
    return train_loader, val_loader, test_loader


# ── Training loop ─────────────────────────────────────────────────────────────

def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for X_batch, y_batch in loader:
        X_batch, y_batch = X_batch.to(device), y_batch.to(device)
        optimizer.zero_grad()
        logits = model(X_batch)
        loss   = criterion(logits, y_batch)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item() * len(y_batch)
        correct    += (logits.argmax(1) == y_batch).sum().item()
        total      += len(y_batch)
    return total_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    all_preds, all_targets = [], []
    for X_batch, y_batch in loader:
        X_batch, y_batch = X_batch.to(device), y_batch.to(device)
        logits = model(X_batch)
        loss   = criterion(logits, y_batch)
        total_loss += loss.item() * len(y_batch)
        preds       = logits.argmax(1)
        correct    += (preds == y_batch).sum().item()
        total      += len(y_batch)
        all_preds.extend(preds.cpu().numpy())
        all_targets.extend(y_batch.cpu().numpy())

    avg_loss = total_loss / total
    acc      = correct / total
    f1_w     = f1_score(all_targets, all_preds, average='weighted', zero_division=0)
    f1_m     = f1_score(all_targets, all_preds, average='macro',    zero_division=0)
    return avg_loss, acc, f1_w, f1_m, np.array(all_preds), np.array(all_targets)


def train_model(
    model, train_loader, val_loader, device,
    epochs=50, lr=1e-3, patience=10, class_weights=None,
):
    criterion = FocalLoss(gamma=2.0, alpha=class_weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_f1, best_state, patience_ctr = 0.0, None, 0
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': [],
               'val_f1_w': [], 'val_f1_m': []}

    t_start = time.time()
    for epoch in range(1, epochs + 1):
        tr_loss, tr_acc = train_one_epoch(model, train_loader, optimizer, criterion, device)
        vl_loss, vl_acc, vl_f1w, vl_f1m, _, _ = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        history['train_loss'].append(tr_loss)
        history['train_acc'].append(tr_acc)
        history['val_loss'].append(vl_loss)
        history['val_acc'].append(vl_acc)
        history['val_f1_w'].append(vl_f1w)
        history['val_f1_m'].append(vl_f1m)

        if vl_f1m > best_val_f1:
            best_val_f1 = vl_f1m
            best_state  = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_ctr = 0
        else:
            patience_ctr += 1

        if epoch % 10 == 0 or epoch == 1:
            print(f"  Epoch {epoch:>3}/{epochs} | "
                  f"Train Loss: {tr_loss:.4f} Acc: {tr_acc:.4f} | "
                  f"Val Loss: {vl_loss:.4f} Acc: {vl_acc:.4f} | "
                  f"F1-macro: {vl_f1m:.4f}")

        if patience_ctr >= patience:
            print(f"  Early stopping at epoch {epoch}")
            break

    train_time = time.time() - t_start
    model.load_state_dict(best_state)
    print(f"  ✅ Done in {train_time:.1f}s | Best Val F1-macro: {best_val_f1:.4f}")
    return history, train_time, best_val_f1


# ── Full metrics ──────────────────────────────────────────────────────────────

def compute_full_metrics(y_true, y_pred):
    cm         = confusion_matrix(y_true, y_pred)
    accuracy   = accuracy_score(y_true, y_pred)
    precision  = precision_score(y_true, y_pred, average='macro', zero_division=0)
    recall     = recall_score(y_true, y_pred, average='macro', zero_division=0)
    f1_macro   = f1_score(y_true, y_pred, average='macro', zero_division=0)
    f1_weighted= f1_score(y_true, y_pred, average='weighted', zero_division=0)
    mcc        = matthews_corrcoef(y_true, y_pred)
    report     = classification_report(y_true, y_pred, zero_division=0, output_dict=True)

    # Per-class specificity
    specificities = []
    for i in range(cm.shape[0]):
        TP = cm[i, i]
        FP = cm[:, i].sum() - TP
        FN = cm[i, :].sum() - TP
        TN = cm.sum() - TP - FP - FN
        specificities.append(TN / (TN + FP) if (TN + FP) > 0 else 0)

    return {
        'accuracy'   : accuracy,
        'precision'  : precision,
        'recall'     : recall,
        'f1_macro'   : f1_macro,
        'f1_weighted': f1_weighted,
        'mcc'        : mcc,
        'specificity': float(np.mean(specificities)),
        'confusion_matrix': cm,
        'report'     : report,
    }


def export_onnx(model, save_path, window_size=1024, device='cpu'):
    model.eval()
    dummy = torch.randn(1, 1, window_size).to(device)
    torch.onnx.export(
        model, dummy, save_path,
        input_names=['vibration'],
        output_names=['fault_logits'],
        dynamic_axes={'vibration': {0: 'batch'}, 'fault_logits': {0: 'batch'}},
        opset_version=14,
    )
    print(f"✅ ONNX model exported → {save_path}")
