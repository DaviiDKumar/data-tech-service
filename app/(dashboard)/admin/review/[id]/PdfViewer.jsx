// PdfViewer.jsx — lives next to page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ fileUrl }) {
    const [numPages, setNumPages] = useState(null);
    const [containerWidth, setContainerWidth] = useState(480);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                if (width > 0) {
                    // Removed the padding subtraction so it takes 100% of the raw width
                    setContainerWidth(width); 
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            if (containerRef.current) resizeObserver.disconnect();
        };
    }, []);

    return (
        /* Stripped all paddings, background colors, and alignments */
        <div ref={containerRef} className="w-full h-full overflow-y-auto">
            <Document
                file={fileUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={null} // Removes loading text layout blocks completely
            >
                {Array.from({ length: numPages || 0 }, (_, i) => (
                    /* Stripped out shadows, borders, rounded corners, and margins */
                    <div key={i + 1} className="w-full block">
                        <Page
                            pageNumber={i + 1}
                            width={containerWidth} 
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                    </div>
                ))}
            </Document>
        </div>
    );
}