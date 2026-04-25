import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useStudyLock } from "../../context/StudyLockContext";
import StudyApi from "../../api/studyApi";
import StudySessionApi from "../../api/studySessionApi";
import FocusTimerPanel from "./FocusTimerPanel";
import PdfReaderWorkspace from "./PdfReaderWorkspace";
import SilentPodPanel from "./SilentPodPanel";

const StudySuite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { activateLock, releaseLock, isLocked } = useStudyLock();
  const [pdfs, setPdfs] = useState([]);
  const [activePdfId, setActivePdfId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastCoverage, setLastCoverage] = useState(0);

  const activePdf = useMemo(
    () => pdfs.find((pdf) => String(pdf._id || pdf.id) === String(activePdfId)) || null,
    [pdfs, activePdfId]
  );

  const activeReadingProgress = useMemo(() => {
    if (!activePdf) {
      return null;
    }

    return (
      activePdf.readingProgress?.find(
        (entry) => String(entry.userId) === String(user?._id)
      ) || activePdf.readingProgress?.[0] || null
    );
  }, [activePdf, user?._id]);

  const loadStudyData = async () => {
    setLoading(true);
    try {
      const [pdfDocuments, sessions] = await Promise.all([
        StudyApi.getPdfDocuments(),
        StudySessionApi.getSessions(),
      ]);
      setPdfs(pdfDocuments || []);
      if (pdfDocuments?.length) {
        setActivePdfId((previousId) => previousId || (pdfDocuments[0]._id || pdfDocuments[0].id));
      }
      setSessionCount((sessions || []).filter((session) => session.status === "completed").length);
    } catch (error) {
      console.error("Failed to load Lumina Study Room:", error);
      showToast(error.message || "Failed to load Lumina Study Room", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudyData();
  }, []);

  const handleUploadPdf = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.pdf$/i, ""));
    formData.append("description", `Lumina Study upload for ${file.name}`);
    formData.append("fileType", "pdf");

    try {
      const createdPdf = await StudyApi.uploadPdf(formData);
      setPdfs((previousPdfs) => [createdPdf, ...previousPdfs]);
      setActivePdfId(createdPdf._id || createdPdf.id);
      showToast("PDF uploaded into Lumina Study Room", "success");
    } catch (error) {
      showToast(error.message || "Failed to upload PDF", "error");
    }
  };

  const handlePersistPdfMetadata = async (pdf, pdfMetadata) => {
    try {
      const updatedPdf = await StudyApi.persistPdfMetadata(
        pdf._id || pdf.id,
        pdfMetadata,
        pdf.originalFileName || pdf.title
      );
      setPdfs((previousPdfs) =>
        previousPdfs.map((entry) =>
          String(entry._id || entry.id) === String(updatedPdf._id || updatedPdf.id)
            ? updatedPdf
            : entry
        )
      );
    } catch (error) {
      showToast(error.message || "Failed to store PDF metadata", "error");
    }
  };

  const handleSaveHighlight = async (pdfId, highlightData) => {
    try {
      const updatedPdf = await StudyApi.addPdfHighlight(pdfId, highlightData);
      setPdfs((previousPdfs) =>
        previousPdfs.map((pdf) =>
          String(pdf._id || pdf.id) === String(updatedPdf._id || updatedPdf.id)
            ? updatedPdf
            : pdf
        )
      );
      setLastCoverage((updatedPdf.readingProgress?.[0]?.coveragePercent || lastCoverage));
      showToast("Highlight saved with glow", "success");
    } catch (error) {
      showToast(error.message || "Failed to save highlight", "error");
    }
  };

  const handleSaveProgress = async (pdfId, payload) => {
    try {
      await StudySessionApi.saveReadingProgress(pdfId, payload);
      setPdfs((previousPdfs) =>
        previousPdfs.map((pdf) =>
          String(pdf._id || pdf.id) === String(pdfId)
            ? {
                ...pdf,
                readingProgress: [
                  {
                    ...(pdf.readingProgress?.find(
                      (entry) => String(entry.userId) === String(user?._id)
                    ) || {}),
                    userId: user?._id,
                    ...payload,
                  },
                ],
              }
            : pdf
        )
      );
      setLastCoverage(payload.coveragePercent || 0);
    } catch (error) {
      console.error("Failed to save reading progress:", error);
    }
  };

  const handleSessionStart = async (payload) => {
    try {
      await StudySessionApi.startSession({
        ...payload,
        studyMaterialId: activePdf?._id || activePdf?.id || null,
      });
    } catch (error) {
      showToast(error.message || "Failed to start study session", "error");
    }
  };

  const handleSessionComplete = async (payload) => {
    try {
      const activeSession = await StudySessionApi.getActiveSession();
      if (activeSession?._id || activeSession?.id) {
        await StudySessionApi.completeSession(activeSession._id || activeSession.id, payload);
      }
      setSessionCount((previousCount) => previousCount + 1);
      setLastCoverage(payload.coverageAtEnd || lastCoverage);
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  };

  const handleLockStateChange = (lockPayload) => {
    if (lockPayload) {
      activateLock(lockPayload);
    } else {
      releaseLock();
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/feed")}
            className="text-amber-300 hover:text-amber-200 text-xl"
          >
            ←
          </button>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-fuchsia-200/70">
              Lumina Study Room
            </p>
            <h1 className="text-3xl font-bold text-amber-100">
              Premium focus, radiant reading, silent sister pods
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-full border border-amber-300/20 bg-white/5 px-4 py-2 text-sm text-amber-100/80">
            Sessions completed: {sessionCount}
          </div>
          <div className="rounded-full border border-fuchsia-300/20 bg-white/5 px-4 py-2 text-sm text-amber-100/80">
            Last coverage: {Math.round(lastCoverage)}%
          </div>
          {isLocked ? (
            <div className="rounded-full border border-red-300/20 bg-red-400/10 px-4 py-2 text-sm text-red-100">
              Silent pod lock active
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-amber-100/70">
          Loading your Lumina Study Room...
        </div>
      ) : (
        <div className="space-y-8">
          <PdfReaderWorkspace
            pdfs={pdfs}
            activePdf={activePdf}
            currentUserId={user?._id}
            onSelectPdf={(pdf) => setActivePdfId(pdf._id || pdf.id)}
            onUploadPdf={handleUploadPdf}
            onPersistPdfMetadata={handlePersistPdfMetadata}
            onSaveHighlight={handleSaveHighlight}
            onSaveProgress={handleSaveProgress}
            showToast={showToast}
          />

          <div className="grid gap-8 2xl:grid-cols-[1.05fr_1fr]">
            <FocusTimerPanel
              documentCoverage={activeReadingProgress?.coveragePercent || lastCoverage}
              onSessionStart={handleSessionStart}
              onSessionComplete={handleSessionComplete}
            />
            <div className="rounded-[2rem] border border-amber-300/15 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-200/70">Glow metrics</p>
              <h2 className="mt-2 text-2xl font-semibold text-amber-100">
                You have covered {Math.round(activeReadingProgress?.coveragePercent || lastCoverage)}% of this document
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-stone-950/60 p-5">
                  <div className="text-sm text-amber-100/60">PDFs in room</div>
                  <div className="mt-2 text-3xl font-bold text-amber-100">{pdfs.length}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-stone-950/60 p-5">
                  <div className="text-sm text-amber-100/60">Pages highlighted</div>
                  <div className="mt-2 text-3xl font-bold text-amber-100">
                    {activeReadingProgress?.pagesHighlighted?.length || 0}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-stone-950/60 p-5">
                  <div className="text-sm text-amber-100/60">Pages visited</div>
                  <div className="mt-2 text-3xl font-bold text-amber-100">
                    {activeReadingProgress?.pagesVisited?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SilentPodPanel
            showToast={showToast}
            onLockStateChange={handleLockStateChange}
          />
        </div>
      )}
    </div>
  );
};

export default StudySuite;
