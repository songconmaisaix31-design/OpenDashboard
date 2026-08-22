export function splitCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (quoted) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          current += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        current += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      cells.push(current)
      current = ''
    } else {
      current += character
    }
  }
  cells.push(current)
  return cells
}

export function parseCsvText(text) {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const normalized = withoutBom.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  const headerLine = lines[0]
  if (headerLine === undefined || headerLine.trim() === '') {
    throw new Error('CSV must include a header row.')
  }
  const columns = splitCsvLine(headerLine)
  const rows = lines
    .slice(1)
    .filter((line) => line.trim() !== '')
    .map((line) => splitCsvLine(line))
  return { columns, rows }
}

export function serializeCsv(columns, rows) {
  const lines = [columns.map(formatCsvCell).join(',')]
  for (const row of rows) {
    lines.push(row.map((cell) => formatCsvCell(cell)).join(','))
  }
  return `${lines.join('\n')}\n`
}

export function formatCsvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function decodeUtf8Strict(buffer) {
  return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
}
