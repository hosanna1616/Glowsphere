// API service for StudySuite functionality
import apiClient from "./apiClient";

class StudyApi {
  // Create a new study material
  async createStudyMaterial(materialData) {
    try {
      return await apiClient.post("/study", materialData, true);
    } catch (error) {
      throw error;
    }
  }

  // Get all study materials
  async getStudyMaterials() {
    try {
      return await apiClient.get("/study", true);
    } catch (error) {
      throw error;
    }
  }

  // Get study material by ID
  async getStudyMaterial(id) {
    try {
      return await apiClient.get(`/study/${id}`, true);
    } catch (error) {
      throw error;
    }
  }

  // Update study material
  async updateStudyMaterial(id, materialData) {
    try {
      return await apiClient.put(`/study/${id}`, materialData, true);
    } catch (error) {
      throw error;
    }
  }

  // Delete study material
  async deleteStudyMaterial(id) {
    try {
      return await apiClient.delete(`/study/${id}`, true);
    } catch (error) {
      throw error;
    }
  }

  // Add highlight to study material
  async addHighlight(id, highlightData) {
    try {
      return await apiClient.post(
        `/study/${id}/highlights`,
        highlightData,
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Remove highlight from study material
  async removeHighlight(id, highlightId) {
    try {
      return await apiClient.delete(
        `/study/${id}/highlights/${highlightId}`,
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Download study material
  async downloadStudyMaterial(id) {
    try {
      return await apiClient.get(`/study/${id}/download`, true);
    } catch (error) {
      throw error;
    }
  }

  // Upload PDF document
  async uploadPdf(formData) {
    try {
      const token = apiClient.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${apiClient.getApiBaseUrl()}/study`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type for FormData, browser handles it
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          apiClient.removeToken();
          throw new Error("Authentication required. Please log in again.");
        }
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

      return await response.json();
    } catch (error) {
      console.error("PDF upload error:", error);
      // Re-throw with better error message for network errors
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("connect to server")
      ) {
        throw new Error(
          "Unable to connect to server. Please check your internet connection and ensure the backend is running."
        );
      }
      throw error;
    }
  }

  // Get notebooks (using study materials with fileType: 'notebook')
  async getNotebooks() {
    try {
      const materials = await this.getStudyMaterials();
      // Filter for notebooks (materials with fileType 'notebook' or no file)
      return materials
        .filter((m) => !m.fileType || m.fileType === "notebook")
        .map((m) => ({
          id: m._id || m.id,
          title: m.title,
          description: m.description,
          pages: m.pages || [],
          updatedAt: m.updatedAt || m.createdAt,
          createdAt: m.createdAt,
        }));
    } catch (error) {
      console.error("Failed to get notebooks:", error);
      return []; // Return empty array on error
    }
  }

  // Get PDF documents (using study materials with fileType: 'pdf')
  async getPdfDocuments() {
    try {
      const materials = await this.getStudyMaterials();
      // Filter for PDFs
      return materials
        .filter((m) => m.fileType === "pdf")
        .map((m) => ({
          id: m._id || m.id,
          title: m.title,
          fileName: m.title,
          fileSize: m.fileSize || 0,
          fileUrl: m.fileUrl,
          highlights: m.highlights || [],
          uploadedAt: m.createdAt,
        }));
    } catch (error) {
      console.error("Failed to get PDFs:", error);
      return []; // Return empty array on error
    }
  }

  // Get study resources (all public materials)
  async getStudyResources() {
    try {
      const materials = await this.getStudyMaterials();
      // Return formatted as resources
      return materials
        .filter((m) => m.isPublic)
        .map((m) => ({
          id: m._id || m.id,
          title: m.title,
          description: m.description,
          type: m.fileType === "pdf" ? "pdf" : "article",
          tags: m.tags || [],
          level: "Intermediate",
          duration: "30 min",
          progress: 0,
          bookmarked: false,
        }));
    } catch (error) {
      console.error("Failed to get study resources:", error);
      return []; // Return empty array on error
    }
  }

  // Create notebook
  async createNotebook(notebookData) {
    try {
      const materialData = {
        title: notebookData.title,
        description: notebookData.description || "",
        fileType: "notebook",
        tags: [],
        isPublic: false,
        pages: [],
      };
      const material = await this.createStudyMaterial(materialData);
      return {
        id: material._id || material.id,
        title: material.title,
        description: material.description,
        pages: material.pages || [],
        updatedAt: material.updatedAt || material.createdAt,
        createdAt: material.createdAt,
      };
    } catch (error) {
      console.error("Failed to create notebook:", error);
      throw error;
    }
  }

  // Add page to notebook
  async addPage(notebookId, pageData) {
    try {
      const notebook = await this.getStudyMaterial(notebookId);
      const pages = notebook.pages || [];
      const newPage = {
        id: Date.now().toString(),
        title: pageData.title || "Untitled Page",
        content: pageData.content || "",
        createdAt: new Date().toISOString(),
      };
      pages.push(newPage);
      
      await this.updateStudyMaterial(notebookId, {
        pages: pages,
      });
      
      return newPage;
    } catch (error) {
      console.error("Failed to add page:", error);
      throw error;
    }
  }

  // Add highlight to notebook page
  async addHighlightToNotebook(notebookId, pageId, highlightData) {
    try {
      // This uses the same highlight endpoint
      return await this.addHighlight(notebookId, highlightData);
    } catch (error) {
      console.error("Failed to add highlight:", error);
      throw error;
    }
  }

  // Add highlight to PDF
  async addPdfHighlight(pdfId, highlightData) {
    try {
      const highlight = await this.addHighlight(pdfId, highlightData);
      const pdf = await this.getStudyMaterial(pdfId);
      return {
        ...pdf,
        highlights: pdf.highlights || [],
      };
    } catch (error) {
      console.error("Failed to add PDF highlight:", error);
      throw error;
    }
  }

  // Update study resource (bookmark toggle)
  async updateStudyResource(id, resourceData) {
    try {
      return await this.updateStudyMaterial(id, resourceData);
    } catch (error) {
      console.error("Failed to update study resource:", error);
      throw error;
    }
  }
}

export default new StudyApi();
