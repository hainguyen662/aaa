import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from '@docusaurus/router';
import styles from './styles.module.css';

function escapeRegExp(string) {
  // Escape all regex special characters
  return string.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

function highlightSnippet(snippet, query) {
  if (!query) return snippet;
  const safeQuery = escapeRegExp(query);
  if (!safeQuery) return snippet;
  try {
    const parts = snippet.split(new RegExp(`(${safeQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? `<span class='${styles.searchHighlight}'>${part}</span>`
        : part
    ).join('');
  } catch (err) {
    return snippet;
  }
}

function SearchModal({ open, onClose, index }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const history = useHistory();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (query.length > 1) {
      const searchResults = index.map(doc => {
        const matchIndex = doc.content.toLowerCase().indexOf(query.toLowerCase());
        if (matchIndex > -1) {
          const snippetStart = Math.max(0, matchIndex - 50);
          const snippetEnd = Math.min(doc.content.length, matchIndex + 50);
          const snippet = doc.content.substring(snippetStart, snippetEnd);
          return { ...doc, snippet };
        }
        return null;
      }).filter(Boolean);
      setResults(searchResults);
      setActiveIndex(0);
    } else {
      setResults([]);
    }
  }, [query, index]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      if (results[activeIndex]) {
        history.push(results[activeIndex].path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalSearchBar}>
          <span className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search docs..."
            className={styles.modalSearchInput}
          />
        </div>
        <ul className={styles.modalResultsList}>
          {results.length === 0 && query.length > 1 ? (
            <li className={styles.noResults}>No results found</li>
          ) : (
            results.map((result, i) => (
              <li
                key={i}
                className={i === activeIndex ? styles.activeResult : styles.resultItem}
                onClick={() => { history.push(result.path); onClose(); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <strong dangerouslySetInnerHTML={{__html: highlightSnippet(result.title, query)}} />
                <p dangerouslySetInnerHTML={{__html: '...' + highlightSnippet(result.snippet, query) + '...'}} />
                {i === activeIndex && <span className={styles.selectionIcon}>↵</span>}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default function CustomSearchBar() {
  const [index, setIndex] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchIndex() {
      try {
        const response = await fetch('/ops/search-index.json');
        const data = await response.json();
        setIndex(data);
      } catch (error) {
        console.error("Failed to load search index:", error);
      }
    }
    fetchIndex();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button className={styles.searchButton} onClick={() => setOpen(true)}>
        <span className={styles.searchIcon} />
        Search
        <span className={styles.searchShortcut}>Ctrl+K</span>
      </button>
      <SearchModal open={open} onClose={() => setOpen(false)} index={index} />
    </>
  );
}
