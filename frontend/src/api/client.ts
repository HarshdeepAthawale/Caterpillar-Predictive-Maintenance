import axios from 'axios'

export const api = axios.create({ baseURL: '/api/v1' })

export interface Prediction {
  fault_id: number
  fault_class: string
  confidence: number
  probabilities: Record<string, number>
  latency_ms: number
  is_fault: boolean
  machine_id: string
  timestamp: string
}

export interface FaultEvent {
  id: number
  machine_id: string
  fault_class: string
  fault_id: number
  confidence: number
  is_fault: boolean
  latency_ms: number
  timestamp: string
}

export interface MachineHealth {
  machine_id: string
  health_score: number
  last_fault_class: string
  last_fault_time: string | null
  fault_count_24h: number
  status: 'healthy' | 'warning' | 'critical'
}

export interface ModelMetrics {
  model: string
  num_classes: number
  class_names: string[]
  window_size: number
  sample_rate: number
  framework: string
}

export const fetchHistory = (params?: Record<string, unknown>) =>
  api.get<FaultEvent[]>('/history', { params }).then(r => r.data)

export const fetchHealth = (machine_id: string) =>
  api.get<MachineHealth>(`/health/${machine_id}`).then(r => r.data)

export const fetchModelMetrics = () =>
  api.get<ModelMetrics>('/model/metrics').then(r => r.data)

export const fetchMachines = () =>
  api.get<{ machines: string[] }>('/machines').then(r => r.data.machines)
