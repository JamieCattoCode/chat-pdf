import React from 'react'

type Props = {
    pdfUrl: string,
}

const PDFViewer = ({ pdfUrl }: Props) => {
  const gviewUrl = `https://docs.google.com/gview?url=${pdfUrl}&embedded=true`;
  
  return (
    <iframe src={pdfUrl} className="w-full h-full">
    </iframe>
  )
}

export default PDFViewer