import Button from './Button'

const toneStyles = {
  neutral: { bg: '#fff', border: 'rgba(0,0,0,0.07)', iconBg: '#f5f3ef', iconColor: '#5c5850' },
  warm: { bg: '#fff8f4', border: '#f3c4a2', iconBg: '#fff1e7', iconColor: '#e8672a' },
  success: { bg: '#f4fbf6', border: '#badfca', iconBg: '#eaf5ef', iconColor: '#3a9a5f' },
  danger: { bg: '#fff7f7', border: '#f5b0b0', iconBg: '#fdf0f0', iconColor: '#d94040' },
  purple: { bg: '#faf7ff', border: '#d5c5f0', iconBg: '#f3eeff', iconColor: '#7b5ea7' },
}

const StateBlock = ({
  icon = '•',
  title,
  description,
  tone = 'neutral',
  compact = false,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  secondaryLabel,
  onSecondary,
  children,
  style = {},
}) => {
  const toneStyle = toneStyles[tone] || toneStyles.neutral

  return (
    <div style={{
      background: compact ? 'transparent' : toneStyle.bg,
      border: compact ? 'none' : `1px solid ${toneStyle.border}`,
      borderRadius: compact ? 14 : 18,
      padding: compact ? '16px 14px' : '24px 20px',
      textAlign: 'center',
      boxShadow: compact ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
      ...style,
    }}>
      <div style={{
        width: compact ? 38 : 48,
        height: compact ? 38 : 48,
        borderRadius: compact ? 14 : 16,
        margin: '0 auto 12px',
        background: toneStyle.iconBg,
        color: toneStyle.iconColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: compact ? 18 : 24,
        fontWeight: 800,
      }}>
        {icon}
      </div>
      {title && (
        <p style={{
          fontWeight: 800,
          fontSize: compact ? 14 : 16,
          color: '#0f0e0c',
          lineHeight: 1.35,
          marginBottom: description ? 7 : 0,
        }}>
          {title}
        </p>
      )}
      {description && (
        <p style={{
          fontSize: compact ? 12 : 13,
          color: '#5c5850',
          lineHeight: 1.65,
          maxWidth: 420,
          margin: '0 auto',
          overflowWrap: 'anywhere',
        }}>
          {description}
        </p>
      )}
      {children}
      {(actionLabel || secondaryLabel) && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginTop: compact ? 14 : 18,
        }}>
          {actionLabel && <Button onClick={onAction} variant={actionVariant}>{actionLabel}</Button>}
          {secondaryLabel && <Button onClick={onSecondary} variant="secondary">{secondaryLabel}</Button>}
        </div>
      )}
    </div>
  )
}

export const LoadingBlock = ({ title = '加载中', description = '正在准备你的学习数据…', compact = false, style = {} }) => (
  <StateBlock
    icon={<span className="spin" style={{ display: 'inline-block' }}>⟳</span>}
    title={title}
    description={description}
    compact={compact}
    style={style}
  />
)

export default StateBlock
