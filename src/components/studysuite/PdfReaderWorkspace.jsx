import React, { useEffect, useMemo, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import StudyProgressRing from "./StudyProgressRing";
import { resolveStudyMediaUrl } from "./studyConfig";

GlobalWorkerOptions.workerSrc = workerSrc;

const HIGHLIGHT_COLOR = "#facc15";

const PdfReaderWorkspace = ({
  pdfs,
  activePdf,
  currentUserId,
  onSelectPdf,
  onUploadPdf,
  onPersistPdfMetadata,
  onSaveHighlight,
  onSaveProgress,
  showToast,
}) => {
  const canvasRef = useRef(null);
  const textPaneRef = useRef(null);
  const progressTimerRef = useRef(null);
  const [localFile, setLocalFile] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [textPages, setTextPages] = useState([]);
  const [selectionText, setSelectionText] = useState("");
  const [visitedPages, setVisitedPages] = useState([]);
  const [highlightedPages, setHighlightedPages] = useState([]);

  const activeProgress = useMemo(() => {
    const progressEntries = activePdf?.readingProgress || [];
    return (
      progressEntries.find(
        (entry) => String(entry.userId) === String(currentUserId)
      ) || progressEntries[0] || null
    );
  }, [activePdf, currentUserId]);

  const totalPages = activePdf?.pdfMetadata?.totalPages || pdfDocument?.numPages || 0;

  const coveragePercent = useMemo(() => {
    if (!totalPages) {
      return 0;
    }
    const visitedWeight = visitedPages.length / totalPages;
    const highlightedWeight = highlightedPages.length / totalPages;
    return Math.min(100, Math.round((visitedWeight * 0.65 + highlightedWeight * 0.35) * 100));
  }, [totalPages, visitedPages, highlightedPages]);

  useEffect(() => {
    setCurrentPage(activeProgress?.lastPageRead || 1);
    setVisitedPages(activeProgress?.pagesVisited || []);
    setHighlightedPages(activeProgress?.pagesHighlighted || []);
  }, [activePdf?._id, activeProgress]);

  useEffect(() => {
    if (!activePdf?.fileUrl) {
      setPdfDocument(null);
      setTextPages([]);
      return;
    }

    const loadPdf = async () => {
      setLoadingPdf(true);
      try {
        const loadingTask = getDocument(resolveStudyMediaUrl(activePdf.fileUrl));
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);

        if (activePdf?.pdfMetadata?.textPages?.length) {
          setTextPages(activePdf.pdfMetadata.textPages);
        } else {
          const extractedPages = [];
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ").trim();
            extractedPages.push({
              pageNumber,
              text: pageText,
              wordCount: pageText ? pageText.split(/\s+/).length : 0,
            });
          }
          setTextPages(extractedPages);
          await onPersistPdfMetadata?.(activePdf, {
            totalPages: pdf.numPages,
            extractedAt: new Date().toISOString(),
            source: activePdf.fileUrl?.startsWith("/uploads") ? "local" : "external",
            textPages: extractedPages,
          });
        }
      } catch (error) {
        console.error("Failed to load PDF:", error);
        showToast("Failed to open PDF reader", "error");
      } finally {
        setLoadingPdf(false);
      }
    };

    loadPdf();
  }, [activePdf?._id, activePdf?.fileUrl]);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || !currentPage) {
      return;
    }

    const renderPage = async () => {
      const page = await pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
    };

    renderPage();
    setVisitedPages((previousPages) =>
      previousPages.includes(currentPage)
        ? previousPages
        : [...previousPages, currentPage].sort((a, b) => a - b)
    );
  }, [pdfDocument, currentPage]);

  useEffect(() => {
    if (!activePdf?._id || !totalPages) {
      return undefined;
    }

    clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      onSaveProgress?.(activePdf._id || activePdf.id, {
        lastPageRead: currentPage,
        pagesVisited: visitedPages,
        pagesHighlighted: highlightedPages,
        coveragePercent,
      });
    }, 350);

    return () => clearTimeout(progressTimerRef.current);
  }, [activePdf?._id, currentPage, visitedPages, highlightedPages, coveragePercent, totalPages]);

  const pageText = useMemo(
    () => textPages.find((page) => page.pageNumber === currentPage)?.text || "",
    [textPages, currentPage]
  );

  const currentHighlights = useMemo(
    () =>
      (activePdf?.highlights || []).filter(
        (highlight) => Number(highlight.pageNumber || 1) === Number(currentPage)
      ),
    [activePdf?.highlights, currentPage]
  );

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || !textPaneRef.current?.contains(selection.anchorNode)) {
      return;
    }
    const selectedText = selection.toString().trim();
    setSelectionText(selectedText);
  };

  const handleSaveHighlight = async () => {
    if (!selectionText || !activePdf) {
      return;
    }

    await onSaveHighlight?.(activePdf._id || activePdf.id, {
      text: selectionText,
      color: HIGHLIGHT_COLOR,
      pageNumber: currentPage,
      pageLabel: `Page ${currentPage}`,
      position: {
        start: pageText.indexOf(selectionText),
        end: pageText.indexOf(selectionText) + selectionText.length,
      },
    });

    setHighlightedPages((previousPages) =>
      previousPages.includes(currentPage)
        ? previousPages
        : [...previousPages, currentPage].sort((a, b) => a - b)
    );
    setSelectionText("");
    window.getSelection()?.removeAllRanges();
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!localFile) {
      showToast("Choose a PDF before uploading", "warning");
      return;
    }
    await onUploadPdf?.(localFile);
    setLocalFile(null);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-fuchsia-300/15 bg-white/5 p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-200/70">Lumina Reader</p>
          <h2 className="mt-2 text-2xl font-semibold text-amber-100">Upload and study your PDFs</h2>
          <form className="mt-5 space-y-3" onSubmit={handleUpload}>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setLocalFile(event.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-white/10 bg-stone-950/60 px-4 py-3 text-amber-50"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-300 px-5 py-3 font-semibold text-black"
            >
              Upload into Lumina Study Room
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-amber-300/15 bg-stone-950/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-amber-100">Your documents</h3>
            <StudyProgressRing value={coveragePercent} size={120} />
          </div>
          <div className="space-y-3">
            {pdfs.length ? (
              pdfs.map((pdf) => (
                <button
                  key={pdf._id || pdf.id}
                  type="button"
                  onClick={() => onSelectPdf?.(pdf)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    String(activePdf?._id || activePdf?.id) === String(pdf._id || pdf.id)
                      ? "border-amber-300/30 bg-amber-300/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="font-medium text-amber-100 break-words [overflow-wrap:anywhere]">
                    {pdf.title}
                  </div>
                  <div className="mt-1 text-xs text-amber-100/60">
                    {pdf.pdfMetadata?.totalPages || 0} pages • {(pdf.highlights || []).length} highlights
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-amber-100/60">
                Uploaded PDFs will appear here with saved reading progress.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-amber-300/15 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.16),_transparent_38%),rgba(10,10,20,0.88)] p-6">
        {activePdf ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-200/70">Current document</p>
                <h3 className="text-2xl font-semibold text-amber-100 break-words [overflow-wrap:anywhere]">
                  {activePdf.title}
                </h3>
                <p className="text-sm text-amber-100/65">
                  You have covered {coveragePercent}% of this document.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="rounded-full border border-white/10 px-4 py-2 text-amber-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-amber-100">
                  Page {currentPage} / {totalPages || 1}
                </div>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  className="rounded-full border border-white/10 px-4 py-2 text-amber-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4">
                <div className="mb-3 text-sm text-amber-100/70">PDF page preview</div>
                {loadingPdf ? (
                  <div className="flex min-h-[420px] items-center justify-center text-amber-100/60">
                    Opening your PDF beautifully...
                  </div>
                ) : (
                  <div className="overflow-auto rounded-2xl bg-white/90 p-3">
                    <canvas ref={canvasRef} className="mx-auto block max-w-full" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-[2rem] border border-white/10 bg-stone-950/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-amber-100">Extracted text</div>
                      <div className="text-xs text-amber-100/60">
                        Drag across the text below and save your highlight.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveHighlight}
                      disabled={!selectionText}
                      className="rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-300 px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                    >
                      Save highlight
                    </button>
                  </div>
                  <div
                    ref={textPaneRef}
                    onMouseUp={handleSelection}
                    className="max-h-[420px] overflow-auto rounded-2xl border border-white/5 bg-black/20 p-4 text-sm leading-7 text-amber-50 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                  >
                    {pageText || "Extracted page text will appear here once the document is processed."}
                  </div>
                  {selectionText ? (
                    <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100 break-words [overflow-wrap:anywhere]">
                      Ready to save: <span className="font-medium">{selectionText}</span>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-stone-950/60 p-4">
                  <div className="mb-3 text-sm font-medium text-amber-100">Saved highlights on this page</div>
                  <div className="space-y-3">
                    {currentHighlights.length ? (
                      currentHighlights.map((highlight) => (
                        <div
                          key={highlight._id}
                          className="rounded-2xl border border-amber-300/15 p-3 text-sm text-amber-50 break-words [overflow-wrap:anywhere]"
                          style={{ backgroundColor: "rgba(250, 204, 21, 0.08)" }}
                        >
                          {highlight.text}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-amber-100/60">
                        No highlights saved for this page yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[540px] items-center justify-center rounded-[2rem] border border-dashed border-white/10 text-center text-amber-100/70">
            Select a PDF from your library or upload a new one to open the Lumina reader.
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfReaderWorkspace;
