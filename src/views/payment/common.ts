export type PaymentTagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

export const paymentProviderOptions = [
  { label: 'Stripe', value: 'stripe' }
]

const providerLabels: Record<string, string> = Object.fromEntries(
  paymentProviderOptions.map(item => [item.value, item.label])
)

const orderStatuses: Record<string, { label: string; type: PaymentTagType }> = {
  created: { label: '待支付', type: 'warning' },
  success: { label: '支付成功', type: 'success' },
  failed: { label: '支付失败', type: 'danger' },
  closed: { label: '已关闭', type: 'info' },
  refunded: { label: '已退款', type: 'info' }
}

const transactionStatuses: Record<string, { label: string; type: PaymentTagType }> = {
  created: { label: '待支付', type: 'warning' },
  success: { label: '交易成功', type: 'success' },
  failed: { label: '交易失败', type: 'danger' },
  refunded: { label: '已退款', type: 'info' }
}

const subscriptionStatuses: Record<string, { label: string; type: PaymentTagType }> = {
  active: { label: '生效中', type: 'success' },
  on_trial: { label: '试用中', type: 'primary' },
  past_due: { label: '付款逾期', type: 'warning' },
  cancelled: { label: '已取消', type: 'info' },
  expired: { label: '已过期', type: 'danger' }
}

const paymentModes: Record<string, string> = {
  checkout: '结账',
  webhook: '回调补录',
  subscription_renewal: '订阅续费'
}

export function providerLabel(provider?: string) {
  return provider ? providerLabels[provider] || provider : '-'
}

export function providerTagType(provider?: string): PaymentTagType {
  if (provider === 'stripe') return 'primary'
  return 'info'
}

export function orderStatus(status?: string) {
  return status ? orderStatuses[status] || { label: status, type: 'info' as PaymentTagType } : { label: '-', type: 'info' as PaymentTagType }
}

export function transactionStatus(status?: string) {
  return status ? transactionStatuses[status] || { label: status, type: 'info' as PaymentTagType } : { label: '-', type: 'info' as PaymentTagType }
}

export function subscriptionStatus(status?: string) {
  return status ? subscriptionStatuses[status] || { label: status, type: 'info' as PaymentTagType } : { label: '-', type: 'info' as PaymentTagType }
}

export function billingTypeLabel(type?: string) {
  return type === 'subscription' ? '订阅' : type === 'one_time' ? '一次性' : type || '-'
}

export function billingTypeTagType(type?: string): PaymentTagType {
  if (type === 'subscription') return 'primary'
  if (type === 'one_time') return 'success'
  return 'info'
}

export function paymentModeLabel(mode?: string) {
  return mode ? paymentModes[mode] || mode : '-'
}

export function intervalLabel(unit?: string, count?: number) {
  if (!unit || !count) return '-'
  const unitLabels: Record<string, string> = {
    day: '天',
    week: '周',
    month: '月',
    year: '年'
  }
  return `${count}${unitLabels[unit] || unit} / 期`
}

export function formatMoney(priceCent?: number, currency?: string) {
  return `${currency || 'USD'} ${(Number(priceCent || 0) / 100).toFixed(2)}`
}
