import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import StudyApi from "../../api/studyApi";
import apiClient from "../../api/apiClient";

const StudySuite = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  // Pomodoro timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("focus"); // focus, shortBreak, longBreak
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Note-taking state
  const [notes, setNotes] = useState("");
  const [sessionNotes, setSessionNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);

  // Notebook state
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [showNotebookForm, setShowNotebookForm] = useState(false);
  const [newNotebook, setNewNotebook] = useState({
    title: "",
    description: "",
  });

  // PDF state
  const [pdfs, setPdfs] = useState([]);
  const [activePdf, setActivePdf] = useState(null);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);

  // Study resources (existing data)
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load notebooks
        const notebookData = await StudyApi.getNotebooks();
        setNotebooks(notebookData || []);

        // Load PDFs
        const pdfData = await StudyApi.getPdfDocuments();
        setPdfs(pdfData || []);

        // Load resources
        const resourceData = await StudyApi.getStudyResources();
        setResources(resourceData || []);
      } catch (error) {
        console.error("Failed to load study data:", error);
        // Set empty arrays on error to prevent crashes
        setNotebooks([]);
        setPdfs([]);
        setResources([]);
        showToast("Failed to load study data. Please try again.", "error");
      }
    };

    loadData();
  }, [showToast]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Timer completed
      setIsRunning(false);
      if (mode === "focus") {
        setSessionsCompleted(sessionsCompleted + 1);
        // After focus session, start break
        if ((sessionsCompleted + 1) % 4 === 0) {
          // Long break after 4 sessions
          setMode("longBreak");
          setTimeLeft(15 * 60); // 15 minutes
        } else {
          // Short break
          setMode("shortBreak");
          setTimeLeft(5 * 60); // 5 minutes
        }
      } else {
        // After break, start focus session
        setMode("focus");
        setTimeLeft(25 * 60); // 25 minutes
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessionsCompleted]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === "focus") {
      setTimeLeft(25 * 60);
    } else if (mode === "shortBreak") {
      setTimeLeft(5 * 60);
    } else {
      setTimeLeft(15 * 60);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getModeColor = () => {
    switch (mode) {
      case "focus":
        return "text-red-400";
      case "shortBreak":
        return "text-green-400";
      case "longBreak":
        return "text-blue-400";
      default:
        return "text-amber-400";
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case "focus":
        return "Focus Time";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
      default:
        return "Focus Time";
    }
  };

  const saveNote = () => {
    if (notes.trim()) {
      const newNote = {
        id: Date.now(),
        content: notes,
        timestamp: new Date().toLocaleString(),
        sessionType: mode,
        sessionCompleted: mode !== "focus" || !isRunning, // Save as completed if not in active focus
      };
      setSessionNotes([newNote, ...sessionNotes]);
      setNotes("");
    }
  };

  const deleteNote = (id) => {
    setSessionNotes(sessionNotes.filter((note) => note.id !== id));
  };

  const exportNote = (note) => {
    // In a real app, this would export the note
    console.log("Exporting note:", note);
  };

  // Notebook functions
  const handleCreateNotebook = async (e) => {
    e.preventDefault();
    if (!newNotebook.title || !newNotebook.title.trim()) {
      showToast("Please enter a notebook title", "warning");
      return;
    }

    try {
      const notebook = await StudyApi.createNotebook(newNotebook);
      setNotebooks([...notebooks, notebook]);
      setNewNotebook({ title: "", description: "" });
      setShowNotebookForm(false);
      showToast("Notebook created successfully!", "success");
    } catch (error) {
      console.error("Failed to create notebook:", error);
      const errorMessage = error.message || "Failed to create notebook. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  const handleAddPage = async (notebookId, pageData) => {
    try {
      const page = await StudyApi.addPage(notebookId, pageData);
      // Update local state
      setNotebooks(
        notebooks.map((notebook) =>
          notebook.id === notebookId || notebook.id?.toString() === notebookId?.toString()
            ? {
                ...notebook,
                pages: [...(notebook.pages || []), page],
                updatedAt: new Date().toISOString(),
              }
            : notebook
        )
      );
      showToast("Page added successfully!", "success");
      return page;
    } catch (error) {
      console.error("Failed to add page:", error);
      showToast("Failed to add page. Please try again.", "error");
    }
  };

  const handleAddHighlight = async (notebookId, pageId, highlightData) => {
    try {
      const highlight = await StudyApi.addHighlightToNotebook(notebookId, pageId, highlightData);
      // Reload notebooks to get updated data
      const notebookData = await StudyApi.getNotebooks();
      setNotebooks(notebookData || notebooks);
      showToast("Highlight added successfully!", "success");
    } catch (error) {
      console.error("Failed to add highlight:", error);
      showToast("Failed to add highlight. Please try again.", "error");
    }
  };

  // PDF functions
  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      showToast("Please select a PDF file", "warning");
      return;
    }

    try {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("title", pdfFile.name.replace(".pdf", ""));
      formData.append("fileType", "pdf");
      formData.append("description", `Uploaded PDF: ${pdfFile.name}`);
      
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Please log in to upload files", "error");
        return;
      }

      const response = await fetch(`${apiClient.getApiBaseUrl()}/study`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to upload PDF (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const pdf = await response.json();
      // Format the response to match expected structure
      const formattedPdf = {
        id: pdf._id || pdf.id,
        title: pdf.title || pdfFile.name,
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        fileUrl: pdf.fileUrl,
        highlights: pdf.highlights || [],
        uploadedAt: pdf.createdAt || new Date().toISOString(),
      };
      
      setPdfs([...pdfs, formattedPdf]);
      setPdfFile(null);
      setPdfPreview(null);
      setShowPdfUpload(false);
      showToast("PDF uploaded successfully!", "success");
    } catch (error) {
      console.error("Failed to upload PDF:", error);
      const errorMessage = error.message || "Failed to upload PDF. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPdfPreview(url);
    } else {
      showToast("Please select a valid PDF file", "error");
    }
  };

  const handleAddPdfHighlight = async (pdfId, highlightData) => {
    try {
      const updatedPdf = await StudyApi.addPdfHighlight(pdfId, highlightData);
      // Update local state
      setPdfs(pdfs.map((pdf) => (pdf.id === pdfId || pdf.id?.toString() === pdfId?.toString() ? updatedPdf : pdf)));
      showToast("Highlight added successfully!", "success");
    } catch (error) {
      console.error("Failed to add PDF highlight:", error);
      showToast("Failed to add highlight. Please try again.", "error");
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (filter === "all") return matchesSearch;
    if (filter === "bookmarked") return matchesSearch && resource.bookmarked;
    return matchesSearch && resource.type === filter;
  });

  const toggleBookmark = async (id) => {
    try {
      const resource = resources.find((r) => r.id === id || r.id?.toString() === id?.toString());
      if (resource) {
        // For now, just update local state since backend doesn't have bookmark field
        setResources(
          resources.map((r) =>
            r.id === id || r.id?.toString() === id?.toString()
              ? { ...r, bookmarked: !r.bookmarked }
              : r
          )
        );
        showToast(resource.bookmarked ? "Bookmark removed" : "Bookmarked!", "success");
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      showToast("Failed to update bookmark. Please try again.", "error");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "course":
        return "📚";
      case "tutorial":
        return "👨‍💻";
      case "article":
        return "📰";
      case "video":
        return "🎥";
      case "pdf":
        return "📄";
      default:
        return "📖";
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "Beginner":
        return "bg-amber-500/20 text-amber-300";
      case "Intermediate":
        return "bg-amber-400/20 text-amber-200";
      case "Advanced":
        return "bg-amber-600/20 text-amber-400";
      default:
        return "bg-stone-700/20 text-amber-300";
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/feed")}
            className="text-amber-300 hover:text-amber-200 text-xl"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-amber-400">StudySuite</h1>
        </div>
        <div className="flex space-x-2">
          <button
            className="bg-gold-gradient px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
            onClick={() => setShowNotebookForm(true)}
          >
            New Notebook
          </button>
          <button
            className="bg-gold-gradient px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
            onClick={() => setShowPdfUpload(true)}
          >
            Upload PDF
          </button>
        </div>
      </div>

      {/* Notebook Creation Form */}
      {showNotebookForm && (
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-300">
            Create New Notebook
          </h2>
          <form onSubmit={handleCreateNotebook}>
            <div className="mb-4">
              <label className="block text-amber-200 mb-2">Title</label>
              <input
                type="text"
                className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Notebook title"
                value={newNotebook.title}
                onChange={(e) =>
                  setNewNotebook({ ...newNotebook, title: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-amber-200 mb-2">Description</label>
              <textarea
                className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Notebook description"
                value={newNotebook.description}
                onChange={(e) =>
                  setNewNotebook({
                    ...newNotebook,
                    description: e.target.value,
                  })
                }
                rows="3"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors"
                onClick={() => setShowNotebookForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
              >
                Create Notebook
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PDF Upload Form */}
      {showPdfUpload && (
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-300">
            Upload PDF Document
          </h2>
          <form onSubmit={handlePdfUpload}>
            <div className="mb-4">
              <label className="block text-amber-200 mb-2">
                Select PDF File
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfFileChange}
                className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              {pdfPreview && (
                <div className="mt-4">
                  <div className="bg-stone-800 rounded-lg p-4">
                    <p className="text-amber-200 mb-2">PDF Preview:</p>
                    <div className="bg-stone-900 rounded p-4">
                      <p className="text-amber-300">
                        📄 {pdfFile?.name || "Document.pdf"}
                      </p>
                      <p className="text-amber-400 text-sm mt-1">
                        {Math.round((pdfFile?.size || 0) / 1024)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors"
                onClick={() => {
                  setShowPdfUpload(false);
                  setPdfFile(null);
                  setPdfPreview(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
                disabled={!pdfFile}
              >
                Upload PDF
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pomodoro Timer Section */}
      <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-amber-300">
          Pomodoro Timer
        </h2>

        <div className="text-center mb-6">
          <div className={`text-6xl font-bold mb-2 ${getModeColor()}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-amber-200 text-xl mb-6">{getModeLabel()}</div>

          <div className="flex justify-center space-x-4 mb-4">
            {!isRunning ? (
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                onClick={startTimer}
              >
                Start
              </button>
            ) : (
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                onClick={pauseTimer}
              >
                Pause
              </button>
            )}
            <button
              className="bg-stone-700 hover:bg-stone-600 text-amber-200 px-6 py-3 rounded-full font-semibold transition-colors"
              onClick={resetTimer}
            >
              Reset
            </button>
          </div>

          <div className="flex justify-center space-x-2">
            <button
              className={`px-4 py-2 rounded-full text-sm ${
                mode === "focus"
                  ? "bg-red-500/20 text-red-300"
                  : "bg-stone-700 text-amber-200"
              }`}
              onClick={() => {
                setMode("focus");
                setTimeLeft(25 * 60);
                setIsRunning(false);
              }}
            >
              Focus
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm ${
                mode === "shortBreak"
                  ? "bg-green-500/20 text-green-300"
                  : "bg-stone-700 text-amber-200"
              }`}
              onClick={() => {
                setMode("shortBreak");
                setTimeLeft(5 * 60);
                setIsRunning(false);
              }}
            >
              Short Break
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm ${
                mode === "longBreak"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-stone-700 text-amber-200"
              }`}
              onClick={() => {
                setMode("longBreak");
                setTimeLeft(15 * 60);
                setIsRunning(false);
              }}
            >
              Long Break
            </button>
          </div>
        </div>

        {/* Session Counter */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  i < sessionsCompleted % 4 ? "bg-green-500" : "bg-stone-700"
                }`}
              ></div>
            ))}
            <span className="text-amber-200 ml-2">
              Sessions: {sessionsCompleted}
            </span>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-amber-300">
          Session Notes
        </h2>

        <div className="mb-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Take notes during your study session..."
            className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-4 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
            rows="4"
          />
          <div className="flex justify-between items-center">
            <div className="text-amber-300 text-sm">
              <span>Auto-saved notes for this session</span>
            </div>
            <button
              className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
              onClick={saveNote}
            >
              Save Note
            </button>
          </div>
        </div>

        {/* Saved Notes */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3 text-amber-300">Saved Notes</h3>
          {sessionNotes.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {sessionNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-stone-800 rounded-lg p-4 border border-amber-500/20"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-amber-200">
                      {note.timestamp} • {note.sessionType}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="text-amber-300 hover:text-amber-100"
                        onClick={() => exportNote(note)}
                      >
                        📤
                      </button>
                      <button
                        className="text-red-400 hover:text-red-300"
                        onClick={() => deleteNote(note.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-amber-100">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-amber-400 text-center py-4">
              No saved notes yet. Start taking notes during your study sessions!
            </p>
          )}
        </div>
      </div>

      {/* Notebooks Section */}
      <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-300">Your Notebooks</h2>
          <button
            className="text-amber-300 hover:text-amber-100"
            onClick={() => setShowNotebookForm(true)}
          >
            + New
          </button>
        </div>

        {notebooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="bg-stone-800 rounded-lg p-4 border border-amber-500/20 hover:border-amber-400 transition-colors cursor-pointer"
                onClick={() => setActiveNotebook(notebook)}
              >
                <h3 className="font-bold text-amber-300 mb-2">
                  {notebook.title}
                </h3>
                <p className="text-amber-200 text-sm mb-3">
                  {notebook.description}
                </p>
                <div className="flex justify-between text-xs text-amber-400">
                  <span>{notebook.pages.length} pages</span>
                  <span>
                    {new Date(notebook.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-amber-400 text-center py-4">
            No notebooks yet. Create your first notebook to start organizing
            your study materials!
          </p>
        )}
      </div>

      {/* PDF Documents Section */}
      <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-300">PDF Documents</h2>
          <button
            className="text-amber-300 hover:text-amber-100"
            onClick={() => setShowPdfUpload(true)}
          >
            + Upload
          </button>
        </div>

        {pdfs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="bg-stone-800 rounded-lg p-4 border border-amber-500/20 hover:border-amber-400 transition-colors cursor-pointer"
                onClick={() => setActivePdf(pdf)}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">📄</span>
                  <h3 className="font-bold text-amber-300 truncate">
                    {pdf.title}
                  </h3>
                </div>
                <p className="text-amber-200 text-sm mb-1">
                  {Math.round(pdf.fileSize / 1024)} KB
                </p>
                <div className="flex justify-between text-xs text-amber-400">
                  <span>{pdf.highlights.length} highlights</span>
                  <span>{new Date(pdf.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-amber-400 text-center py-4">
            No PDF documents yet. Upload your first PDF to start highlighting
            and taking notes!
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {resources.length}
          </div>
          <div className="text-amber-200 text-sm">Total Resources</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {notebooks.length}
          </div>
          <div className="text-amber-200 text-sm">Notebooks</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {pdfs.length}
          </div>
          <div className="text-amber-200 text-sm">PDF Documents</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            3
          </div>
          <div className="text-amber-200 text-sm">Bookmarked</div>
        </div>
      </div>

      {/* Resources List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-amber-300">
          Learning Resources
        </h2>
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start">
                  <div className="text-3xl mr-4">
                    {getTypeIcon(resource.type)}
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold mr-3 text-amber-300">
                        {resource.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getLevelColor(
                          resource.level
                        )}`}
                      >
                        {resource.level}
                      </span>
                    </div>
                    <p className="text-amber-200 mb-4">
                      {resource.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                        ⏱️ {resource.duration}
                      </span>
                      {resource.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-sm bg-amber-500/10 px-2 py-1 rounded-full text-amber-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  className="text-2xl"
                  onClick={() => toggleBookmark(resource.id)}
                >
                  {resource.bookmarked ? "🔖" : "📑"}
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-200">Progress</span>
                  <span className="text-amber-200">{resource.progress}%</span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-2">
                  <div
                    className="bg-gold-gradient h-2 rounded-full"
                    style={{ width: `${resource.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 bg-stone-700 rounded-full text-sm font-medium hover:bg-stone-600 transition-colors text-amber-200">
                  Details
                </button>
                <button className="px-4 py-2 bg-gold-gradient rounded-full text-sm font-medium hover:opacity-90 transition-opacity text-black">
                  {resource.progress > 0 ? "Continue" : "Start"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card-bg backdrop-blur-sm rounded-xl p-12 border border-amber-500/30 text-center">
            <p className="text-amber-200 text-lg">
              No resources found matching your criteria.
            </p>
            <button
              className="mt-4 bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
              onClick={() => {
                setSearchTerm("");
                setFilter("all");
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudySuite;
