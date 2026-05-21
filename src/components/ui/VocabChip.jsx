const VocabChip = ({ en, zh, saved, saving, onSave }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    background: saved ? '#eaf2e3' : '#f0eeff',
    border: `1px solid ${saved ? '#b8dca8' : '#d4ccf8'}`,
    borderRadius: 10, overflow: 'hidden',
  }}>
    <span style={{ fontSize: 11, color: saved ? '#5a7a3a' : '#7a6bba', padding: '3px 6px 3px 9px' }}>{en}</span>
    {zh && <span style={{ fontSize: 10, color: '#a09b95', paddingRight: 4 }}>· {zh}</span>}
    <button
      onClick={() => onSave(en, zh)}
      disabled={saved || saving}
      title={saved ? '已保存' : '加入词汇本'}
      style={{
        fontSize: 11, fontWeight: 700,
        background: saved ? '#c4e8b0' : saving ? '#e0d8f8' : '#ccc8f4',
        color: saved ? '#5a7a3a' : '#7a6bba',
        border: 'none', cursor: saved ? 'default' : 'pointer',
        padding: '3px 8px', alignSelf: 'stretch', lineHeight: 1,
      }}
    >{saved ? '✓' : saving ? '…' : '+'}</button>
  </div>
)

export default VocabChip
