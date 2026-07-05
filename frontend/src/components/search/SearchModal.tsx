import { useState, useEffect, useRef, useCallback } from "react";
import { BACKEND_API } from "../../constants";
import "../../styles/search/searchModal.scss";

interface Word {
  _id?: string;
  id: string;
  newari_word: string;
  nepali_meaning: string;
  category: string;
  expertise_lvl: number;
  type: string;
  isHomonym?: boolean;
  homonymData?: {
    meanings: string[];
    wordIds?: Word[];
    wordDetails?: Word[];
  } | null;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchWordRecord = {
  _id?: string;
  id?: string;
  newari_word?: string;
  nepali_meaning?: string;
  category?: string;
  expertise_lvl?: number;
  type?: string;
  isHomonym?: boolean;
  homonymData?: {
    meanings?: string[];
    wordIds?: unknown[];
    wordDetails?: unknown[];
  } | null;
  _doc?: SearchWordRecord;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeWordRecord = (
  record: unknown,
  includeHomonymData = true,
): Word | null => {
  if (!isObject(record)) {
    return null;
  }

  const typedRecord = record as SearchWordRecord;
  const source = isObject(typedRecord._doc)
    ? (typedRecord._doc as SearchWordRecord)
    : typedRecord;

  const normalized: Word = {
    _id: source._id ?? typedRecord._id,
    id: source.id ?? "",
    newari_word: source.newari_word ?? "",
    nepali_meaning: source.nepali_meaning ?? "",
    category: source.category ?? "",
    expertise_lvl: Number(source.expertise_lvl ?? 0),
    type: source.type ?? "",
    isHomonym: Boolean(source.isHomonym ?? typedRecord.isHomonym),
  };

  if (!includeHomonymData) {
    return normalized;
  }

  const homonymData = source.homonymData ?? typedRecord.homonymData;

  if (homonymData) {
    normalized.homonymData = {
      meanings: Array.isArray(homonymData.meanings)
        ? homonymData.meanings
        : [],
      wordIds: Array.isArray(homonymData.wordIds)
        ? homonymData.wordIds
            .map((item) => normalizeWordRecord(item, false))
            .filter((item): item is Word => item !== null)
        : [],
      wordDetails: Array.isArray(homonymData.wordDetails)
        ? homonymData.wordDetails
            .map((item) => normalizeWordRecord(item, false))
            .filter((item): item is Word => item !== null)
        : [],
    };
  }

  return normalized;
};

const normalizeSearchResults = (data: unknown): Word[] => {
  const records = Array.isArray(data) ? data : data ? [data] : [];

  const flattened = records.flatMap((record) => {
    const normalized = normalizeWordRecord(record);

    if (!normalized) {
      return [];
    }

    const homonymDetails = normalized.homonymData?.wordDetails;

    if (normalized.isHomonym && homonymDetails?.length) {
      return homonymDetails.map((detail) => ({
        ...detail,
        isHomonym: true,
        homonymData: normalized.homonymData,
      }));
    }

    return [normalized];
  });

  const deduped = new Map<string, Word>();

  flattened.forEach((item) => {
    const key = item.id || item._id || `${item.newari_word}-${item.nepali_meaning}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  });

  return Array.from(deduped.values());
};

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
        `${BACKEND_API}/words/search?query=${encodeURIComponent(query)}`,
        {
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(normalizeSearchResults(data));
    } catch (err: unknown) {
      if (!(err instanceof DOMException) || err.name !== "AbortError") {
        setError("No words found");
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    setSelectedResult(null);

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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="search-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="search-modal">
        {/* Header with Search Input */}
        <div className="search-modal-header">
          <div className="search-header-content">
            <div className="search-title-row">
              <h2>Search Dictionary</h2>
              <button
                className="search-modal-close"
                onClick={onClose}
                aria-label="Close search"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="search-input-wrapper">
              <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="search-modal-input"
                placeholder="Search for Newari words..."
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
          </div>
        </div>

        {/* Results Section */}
        <div className="search-modal-results">
          {selectedResult ? (
            // Detail View
            <div className="search-detail-view">
              <button
                className="back-button"
                onClick={() => setSelectedResult(null)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Results
              </button>

              <div className="detail-card">
                <div className="detail-header">
                  <div className="detail-word">
                    {selectedResult.newari_word}
                  </div>
                  <div className="detail-badges">
                    {selectedResult.isHomonym && (
                      <span className="badge badge-homonym">Homonym</span>
                    )}
                    <span className="badge badge-expertise">
                      Level {selectedResult.expertise_lvl}
                    </span>
                  </div>
                </div>

                <div className="detail-meaning">
                  <span className="meaning-label">Nepali Meaning</span>
                  <span className="meaning-value">
                    {selectedResult.nepali_meaning}
                  </span>
                </div>

                <div className="detail-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">Category</span>
                    <span className="meta-value badge-category">
                      {selectedResult.category}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Type</span>
                    <span className="meta-value badge-type">
                      {selectedResult.type}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Word ID</span>
                    <span className="meta-value meta-id">
                      {selectedResult.id}
                    </span>
                  </div>
                </div>

                {selectedResult.homonymData?.meanings?.length ? (
                  <div className="detail-homonym-section">
                    <span className="meaning-label">
                      Other meanings for this word
                    </span>
                    <div className="homonym-meaning-list">
                      {selectedResult.homonymData.meanings.map((meaning) => (
                        <span key={meaning} className="homonym-meaning-pill">
                          {meaning}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            // List View
            <div className="search-results-list">
              {error && !results.length ? (
                <div className="search-empty-state">
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <p className="empty-title">No words found</p>
                  <p className="empty-hint">
                    Try searching with different keywords
                  </p>
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="results-header">
                    <span className="results-count">
                      {results.length}{" "}
                      {results.length === 1 ? "result" : "results"} found
                    </span>
                  </div>
                  <div className="results-grid">
                    {results.map((word) => (
                      <div
                        key={word._id}
                        className="search-result-card"
                        onClick={() => setSelectedResult(word)}
                      >
                        <div className="search-card-content">
                          <div className="card-word">{word.newari_word}</div>
                          <div className="card-meaning">
                            {word.nepali_meaning}
                          </div>
                          <div className="card-footer">
                            {word.isHomonym && (
                              <span className="card-badge badge-homonym">
                                Homonym
                              </span>
                            )}
                            <span className="card-badge badge-category">
                              {word.category}
                            </span>
                            <span className="card-badge badge-level">
                              Lv. {word.expertise_lvl}
                            </span>
                          </div>
                        </div>
                        <div className="card-arrow">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : searchQuery ? (
                <div className="search-empty-state">
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <p className="empty-title">No words found</p>
                  <p className="empty-hint">
                    Try searching with different keywords
                  </p>
                </div>
              ) : (
                <div className="search-empty-state">
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <p className="empty-title">Start searching</p>
                  <p className="empty-hint">Type to search for Newari words</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchModal;
