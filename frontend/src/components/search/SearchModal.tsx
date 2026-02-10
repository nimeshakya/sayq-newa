import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../../constants";
import "../../styles/search/searchModal.scss";

interface Word {
  _id: string;
  id: string;
  newari_word: string;
  nepali_meaning: string;
  category: string;
  expertise_lvl: number;
  type: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedResult, setSelectedResult] = useState<Word | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/words/search?query=${encodeURIComponent(query)}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError("No words found");
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="search-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="search-modal">
        {/* Header */}
        <div className="search-modal-header">
          <h2>Search Words</h2>
          <button
            className="search-modal-close"
            onClick={onClose}
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="search-modal-input-container">
          <input
            ref={searchInputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search by word, meaning, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {isLoading && (
            <div className="search-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="search-modal-results">
          {error && !selectedResult && (
            <div className="search-no-results">{error}</div>
          )}

          {selectedResult ? (
            // Detail View
            <div className="search-detail-view">
              <button
                className="back-button"
                onClick={() => setSelectedResult(null)}
              >
                ← Back to Results
              </button>

              <div className="detail-card">
                <div className="detail-row">
                  <span className="label">Newari Word:</span>
                  <span className="value newari-text">
                    {selectedResult.newari_word}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Nepali Meaning:</span>
                  <span className="value">{selectedResult.nepali_meaning}</span>
                </div>

                <div className="detail-row">
                  <span className="label">ID:</span>
                  <span className="value code">{selectedResult.id}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Category:</span>
                  <span className="value category-badge">
                    {selectedResult.category}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Expertise Level:</span>
                  <span className="value expertise-badge">
                    Level {selectedResult.expertise_lvl}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value type-badge">{selectedResult.type}</span>
                </div>
              </div>
            </div>
          ) : (
            // List View
            <div className="search-results-list">
              {results.length > 0 ? (
                <>
                  <div className="results-count">
                    Found {results.length} result
                    {results.length !== 1 ? "s" : ""}
                  </div>
                  {results.map((word) => (
                    <div
                      key={word._id}
                      className="search-result-item"
                      onClick={() => setSelectedResult(word)}
                    >
                      <div className="result-main">
                        <div className="result-word">
                          <span className="newari-text">
                            {word.newari_word}
                          </span>
                        </div>
                        <div className="result-meaning">
                          {word.nepali_meaning}
                        </div>
                      </div>

                      <div className="result-meta">
                        <span className="meta-badge category">
                          {word.category}
                        </span>
                        <span className="meta-badge expertise">
                          Lv. {word.expertise_lvl}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                searchQuery && (
                  <div className="search-empty-state">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <p>No words found</p>
                    <p className="hint">Try different search terms</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchModal;
