import { useRef, useEffect, useState } from 'react';
import './SummaryHighlight.css';
import PropTypes from 'prop-types';

/**
 * SummaryHighlight Component
 *
 * This component allows users to highlight text within a given initial text,
 * add comments to the highlights, and view or remove these comments.
 *
 * @param {string} initialText - The initial text to be displayed and highlighted.
 * @param {function} onHighlight - Callback function to handle the highlighted text.
 */
const SummaryHighlight = ({
  initialText,
  onHighlight,
  index,
  disableHighlighting,
  setHighlightError,
  highlights
}) => {
  // propTypes validation for the SummaryHighlight component
  SummaryHighlight.propTypes = {
    initialText: PropTypes.string.isRequired,
    onHighlight: PropTypes.func,
  };
  // Reference to the text container element
  const textContainerRef = useRef(null);
  const [hoveredComment, setHoveredComment] = useState('');

  // Set the initial text content in the container when the component mounts or initialText changes
  useEffect(() => {
    textContainerRef.current.innerHTML = initialText;
    setHighlightError(false);

    try {
      if (highlights.length > 0) {
        // Create a new Range object
        const range = document.createRange();
        for (let i = 0; i < highlights.length; i++) {
          // Set the start and end points of the range
          const element = document.getElementById(`text-container-${index}`);
          range.setStart(element.firstChild, highlights[i].start);
          range.setEnd(element.firstChild, highlights[i].end);
          const selectedText = range.toString();

          // Create a span element to wrap the highlighted text
          const span = document.createElement('span');
          span.className = 'highlight';
          span.style.backgroundColor = highlights[i].color; // Apply the chosen color
          span.textContent = selectedText;
          span.title = highlights[i].comment; // Ensure comment is set or empty string

          // Add event listeners to show the comment in a hover box
          span.addEventListener('mouseenter', () => setHoveredComment(highlights[i].comment));
          span.addEventListener('mouseleave', () => setHoveredComment(''));

          // Replace the selected text with the span element
          range.deleteContents();
          range.insertNode(span);
        }
      }
    } catch (e) {
      console.log('ERROR', e);
      setHighlightError(true);
    }
  }, [index, highlights]);

  /**
   * Handle mouse up event to capture selected text.
   */
  const handleMouseUp = () => {
    if (!disableHighlighting) {
      const selection = window.getSelection();
      const selectedText = selection.toString();
      if (selectedText) {
        // Get the start and end positions of the highlighted text
        const { start, end } = highlightSelectedText(selection);
        if (onHighlight) {
          // Call the onHighlight callback with the selected text and its positions
          onHighlight(selectedText, start, end);
        }
      }
    }
  };

  /**
   * Highlight the selected text and return the start and end positions.
   *
   * @param {Selection} selection - The current text selection.
   * @returns {Object} - The start and end positions of the highlighted text.
   */
  // Update the currentHighlight and highlights states to ensure the highlight is tracked correctly
  const highlightSelectedText = (selection) => {
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    // Calculate the start and end positions of the highlighted text
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(textContainerRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + selectedText.length;

    return { start, end };
  };


  return (
    <>
      <span id={`text-container-${index}`} ref={textContainerRef} onMouseUp={handleMouseUp} />
      {hoveredComment && (
        <div className="styled-hover-box">
          {hoveredComment}
        </div>
      )}
    </>
  );
};

export default SummaryHighlight;
