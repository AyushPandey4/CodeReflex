import { NextResponse } from 'next/server'
import { PdfReader } from 'pdfreader'

function formatExtractedText(text) {
  // This function cleans up the text extracted from the PDF.
  
  // 1. Consolidate multiple spaces into a single space.
  let formattedText = text.replace(/ +/g, ' ');

  // 2. Consolidate multiple newlines into a maximum of two (for paragraph breaks).
  formattedText = formattedText.replace(/\n\s*\n/g, '\n\n');

  // 3. Trim leading/trailing whitespace from the entire text.
  formattedText = formattedText.trim();

  return formattedText;
}

export async function POST(request) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const text = await new Promise((resolve, reject) => {
      const reader = new PdfReader()
      // Use an object to group text items by their y-coordinate.
      const lines = {}
      reader.parseBuffer(buffer, (err, item) => {
        if (err) {
          // An error occurred during parsing
          console.error("Error parsing PDF:", err)
          return reject(err)
        }
        if (!item) {
          // End of buffer. Sort lines by y-coordinate and join them.
          const pageText = Object.keys(lines)
            .sort((y1, y2) => parseFloat(y1) - parseFloat(y2))
            .map(y => lines[y].join('')) // Join items on the same line
            .join('\n')
          resolve(pageText)
        } else if (item.text) {
          // Append text item to the appropriate line.
          if (!lines[item.y]) {
            lines[item.y] = []
          }
          lines[item.y].push(item.text)
        }
      })
    })

    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from PDF. It might be an image-only PDF.' }, { status: 400 });
    }

    // Format the extracted text before sending it back.
    const formattedText = formatExtractedText(text);

    return NextResponse.json({ text: formattedText })

  } catch (error) {
    console.error('Failed to process PDF:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        details: error.message
      },
      { status: 500 }
    )
  }
} 