import torch
import torch.nn as nn
import torch.nn.functional as F


# ── Shared building blocks ────────────────────────────────────────────────────

class ConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel=7, stride=1, pool=2, dropout=0.2):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv1d(in_ch, out_ch, kernel_size=kernel, stride=stride, padding=kernel // 2),
            nn.BatchNorm1d(out_ch),
            nn.ReLU(inplace=True),
            nn.MaxPool1d(pool),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        return self.block(x)


class SelfAttention(nn.Module):
    """Scaled dot-product self-attention over time steps."""
    def __init__(self, hidden_dim):
        super().__init__()
        self.query = nn.Linear(hidden_dim, hidden_dim)
        self.key   = nn.Linear(hidden_dim, hidden_dim)
        self.value = nn.Linear(hidden_dim, hidden_dim)
        self.scale = hidden_dim ** 0.5

    def forward(self, x):
        # x: (batch, seq_len, hidden_dim)
        Q = self.query(x)
        K = self.key(x)
        V = self.value(x)
        scores = torch.bmm(Q, K.transpose(1, 2)) / self.scale
        attn   = F.softmax(scores, dim=-1)
        out    = torch.bmm(attn, V)
        return out, attn


# ── Model 1: CNN Only ─────────────────────────────────────────────────────────

class CNNOnly(nn.Module):
    def __init__(self, num_classes=4, window_size=1024):
        super().__init__()
        self.cnn = nn.Sequential(
            ConvBlock(1,   64,  kernel=7, pool=2),
            ConvBlock(64,  128, kernel=5, pool=2),
            ConvBlock(128, 256, kernel=3, pool=2),
        )
        cnn_out = 256 * (window_size // 8)
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(cnn_out, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        x = self.cnn(x)
        return self.classifier(x)


# ── Model 2: LSTM Only ────────────────────────────────────────────────────────

class LSTMOnly(nn.Module):
    def __init__(self, num_classes=4, window_size=1024, hidden=128):
        super().__init__()
        self.lstm1 = nn.LSTM(1, hidden, batch_first=True, bidirectional=True)
        self.lstm2 = nn.LSTM(hidden * 2, 64, batch_first=True, bidirectional=True)
        self.drop  = nn.Dropout(0.3)
        self.fc    = nn.Linear(64 * 2, num_classes)

    def forward(self, x):
        # x: (batch, 1, time) → (batch, time, 1)
        x = x.permute(0, 2, 1)
        x, _ = self.lstm1(x)
        x = self.drop(x)
        x, _ = self.lstm2(x)
        x = self.drop(x[:, -1, :])   # last time step
        return self.fc(x)


# ── Model 3: CNN-LSTM ─────────────────────────────────────────────────────────

class CNNLSTM(nn.Module):
    def __init__(self, num_classes=4, window_size=1024, hidden=128):
        super().__init__()
        self.cnn = nn.Sequential(
            ConvBlock(1,   64,  kernel=7, pool=2),
            ConvBlock(64,  128, kernel=5, pool=2),
            ConvBlock(128, 256, kernel=3, pool=2),
        )
        self.lstm1 = nn.LSTM(256, hidden, batch_first=True, bidirectional=True)
        self.lstm2 = nn.LSTM(hidden * 2, 64, batch_first=True, bidirectional=True)
        self.drop  = nn.Dropout(0.3)
        self.fc    = nn.Linear(64 * 2, num_classes)

    def forward(self, x):
        x = self.cnn(x)                   # (B, 256, T//8)
        x = x.permute(0, 2, 1)            # (B, T//8, 256)
        x, _ = self.lstm1(x)
        x = self.drop(x)
        x, _ = self.lstm2(x)
        x = self.drop(x[:, -1, :])
        return self.fc(x)


# ── Model 4: CNN-LSTM + Attention (Best) ─────────────────────────────────────

class CNNLSTMAttention(nn.Module):
    def __init__(self, num_classes=4, window_size=1024, hidden=128):
        super().__init__()
        self.cnn = nn.Sequential(
            ConvBlock(1,   64,  kernel=7, pool=2, dropout=0.2),
            ConvBlock(64,  128, kernel=5, pool=2, dropout=0.2),
            ConvBlock(128, 256, kernel=3, pool=2, dropout=0.2),
        )
        self.lstm1     = nn.LSTM(256, hidden, batch_first=True, bidirectional=True)
        self.lstm2     = nn.LSTM(hidden * 2, 64, batch_first=True, bidirectional=True)
        self.attention = SelfAttention(64 * 2)
        self.drop      = nn.Dropout(0.3)
        self.fc        = nn.Sequential(
            nn.Linear(64 * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes),
        )
        self._attn_weights = None

    def forward(self, x):
        x = self.cnn(x)                   # (B, 256, T//8)
        x = x.permute(0, 2, 1)            # (B, T//8, 256)
        x, _ = self.lstm1(x)
        x = self.drop(x)
        x, _ = self.lstm2(x)              # (B, T//8, 128)
        x, attn = self.attention(x)       # attended output
        self._attn_weights = attn.detach()
        x = x.mean(dim=1)                 # global average pooling over time
        x = self.drop(x)
        return self.fc(x)

    def get_attention_weights(self):
        return self._attn_weights


def get_model(name: str, num_classes: int = 4, window_size: int = 1024) -> nn.Module:
    models = {
        "CNN":              CNNOnly(num_classes, window_size),
        "LSTM":             LSTMOnly(num_classes, window_size),
        "CNN-LSTM":         CNNLSTM(num_classes, window_size),
        "CNN-LSTM+Attention": CNNLSTMAttention(num_classes, window_size),
    }
    if name not in models:
        raise ValueError(f"Unknown model '{name}'. Choose from: {list(models)}")
    return models[name]


def count_parameters(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
