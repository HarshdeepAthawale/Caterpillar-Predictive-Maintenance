import time
import numpy as np
import onnxruntime as ort
from typing import Dict
from app.core.config import settings


class FaultClassifier:
    def __init__(self):
        self.session = None
        self.input_name = None
        self._load_model()

    def _load_model(self):
        opts = ort.SessionOptions()
        opts.inter_op_num_threads = 2
        opts.intra_op_num_threads = 2
        self.session    = ort.InferenceSession(settings.ONNX_MODEL_PATH, opts)
        self.input_name = self.session.get_inputs()[0].name
        print(f"✅ ONNX model loaded: {settings.ONNX_MODEL_PATH}")

    def preprocess(self, raw_signal: list) -> np.ndarray:
        sig  = np.array(raw_signal, dtype=np.float32)
        mean = sig.mean()
        std  = sig.std() + 1e-8
        sig  = (sig - mean) / std
        return sig.reshape(1, 1, -1)   # (1, 1, window_size)

    def predict(self, raw_signal: list) -> Dict:
        t0      = time.time()
        x       = self.preprocess(raw_signal)
        logits  = self.session.run(None, {self.input_name: x})[0][0]
        # softmax
        e       = np.exp(logits - logits.max())
        probs   = e / e.sum()
        pred_id = int(probs.argmax())
        latency = (time.time() - t0) * 1000

        return {
            "fault_id"      : pred_id,
            "fault_class"   : settings.CLASS_NAMES[pred_id],
            "confidence"    : float(probs[pred_id]),
            "probabilities" : {
                settings.CLASS_NAMES[i]: float(probs[i])
                for i in range(settings.NUM_CLASSES)
            },
            "latency_ms"    : round(latency, 2),
            "is_fault"      : pred_id != 0,
        }


# Singleton — loaded once at startup
classifier = FaultClassifier()
