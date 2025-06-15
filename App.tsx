
import React, { useState, useCallback, useEffect } from 'react';
import { SubtitleEntry, ProcessingState, SubtitleSubject } from './types';
import { parseSrt, parseVtt } from './services/subtitleParser';
import { translateTextWithContext } from './services/geminiService';
import { formatSrt } from './utils/srtFormatter';
import { formatVtt } from './utils/vttFormatter';
import Header from './components/Header';
import Footer from './components/Footer';
import FileUpload from './components/FileUpload';
import SubtitleDisplay from './components/SubtitleDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ProgressBar from './components/ProgressBar';
import { AVAILABLE_TEXT_MODELS, DEFAULT_CONTEXT_WINDOW_SIZE, SUBTITLE_SUBJECTS, GEMINI_MODEL_NAME } from './constants';

const apiKeyAvailable = !!process.env.API_KEY;
const TRANSLATION_ERROR_MARKER = "[Translation Error]";

const App: React.FC = () => {
  const [originalSubtitles, setOriginalSubtitles] = useState<SubtitleEntry[]>([]);
  const [translatedSubtitles, setTranslatedSubtitles] = useState<SubtitleEntry[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [originalFileType, setOriginalFileType] = useState<'srt' | 'vtt' | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<SubtitleSubject>(SUBTITLE_SUBJECTS[0]);
  const [selectedModel, setSelectedModel] = useState<string>(GEMINI_MODEL_NAME);
  const [uiContextWindowSize, setUiContextWindowSize] = useState<number>(DEFAULT_CONTEXT_WINDOW_SIZE);

  // New state for resuming translation
  const [lastProcessedIndex, setLastProcessedIndex] = useState<number>(-1);
  const [currentActionText, setCurrentActionText] = useState<string>("");


  useEffect(() => {
    if (!apiKeyAvailable) {
      setError("Gemini API Key is not configured. Please set process.env.API_KEY. Translation functionality will be disabled.");
      setProcessingState(ProcessingState.ERROR);
    }
  }, []);

  const resetTranslationState = () => {
    setOriginalSubtitles([]);
    setTranslatedSubtitles([]);
    setLastProcessedIndex(-1);
    setTranslationProgress(0);
    setError(null);
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setProcessingState(ProcessingState.PARSING);
    resetTranslationState();
    setOriginalFileName(file.name);
    setOriginalFileType(null);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      const content = await file.text();
      let parsed: SubtitleEntry[] = [];

      if (fileExtension === 'srt') {
        parsed = parseSrt(content);
        setOriginalFileType('srt');
      } else if (fileExtension === 'vtt') {
        parsed = parseVtt(content);
        setOriginalFileType('vtt');
      } else {
        setError("Unsupported file type. Please upload an .srt or .vtt file.");
        setProcessingState(ProcessingState.ERROR);
        return;
      }
      
      if (parsed.length === 0 && content.trim() !== '') {
          setError(`Could not parse ${fileExtension?.toUpperCase()} file. It might be empty, malformed, or not a valid ${fileExtension?.toUpperCase()} file.`);
          setProcessingState(ProcessingState.ERROR);
          return;
      }
      setOriginalSubtitles(parsed);
      // Initialize translatedSubtitles with undefined translatedText
      setTranslatedSubtitles(parsed.map(entry => ({ ...entry, translatedText: undefined })));
      setProcessingState(ProcessingState.IDLE);
    } catch (e) {
      console.error("Error parsing file:", e);
      setError(e instanceof Error ? e.message : `Failed to parse ${fileExtension?.toUpperCase()} file.`);
      setProcessingState(ProcessingState.ERROR);
    }
  }, []);

  const performTranslation = async (
    entriesToTranslate: SubtitleEntry[],
    startIndex: number = 0,
    isRetry: boolean = false
  ): Promise<SubtitleEntry[]> => {
    
    let currentTranslations = isRetry ? [...translatedSubtitles] : entriesToTranslate.map(entry => ({ ...entry, translatedText: undefined }));
    if (!isRetry && translatedSubtitles.length === entriesToTranslate.length) { // Preserve existing translations if resuming
        currentTranslations = translatedSubtitles.map((ts, idx) => ({...ts, translatedText: ts.translatedText || undefined}));
    }


    let linesProcessedInThisRun = 0;
    const totalLinesToProcessForProgress = isRetry 
        ? entriesToTranslate.filter(entry => entry.translatedText === TRANSLATION_ERROR_MARKER || entry.translatedText === undefined).length
        : entriesToTranslate.length - (startIndex);


    for (let i = 0; i < entriesToTranslate.length; i++) {
        const originalEntryIndex = isRetry 
            ? originalSubtitles.findIndex(os => os.id === entriesToTranslate[i].id && os.startTime === entriesToTranslate[i].startTime) 
            : startIndex + i;
        
        if (originalEntryIndex < 0) continue; // Should not happen in normal flow

        const entry = originalSubtitles[originalEntryIndex];

        // Skip if already translated (and not a retry of an error) or not part of the retry batch
        if (!isRetry && currentTranslations[originalEntryIndex]?.translatedText && currentTranslations[originalEntryIndex]?.translatedText !== TRANSLATION_ERROR_MARKER) {
            setLastProcessedIndex(originalEntryIndex);
            // Progress update for already processed lines when resuming
            if (originalSubtitles.length > 0) {
              setTranslationProgress(((originalEntryIndex + 1) / originalSubtitles.length) * 100);
            }
            continue;
        }
        
        // If it's a retry, only process those marked with error or undefined
        if (isRetry && !(currentTranslations[originalEntryIndex]?.translatedText === TRANSLATION_ERROR_MARKER || currentTranslations[originalEntryIndex]?.translatedText === undefined)) {
            continue;
        }


        const previousLines = originalSubtitles.slice(Math.max(0, originalEntryIndex - uiContextWindowSize), originalEntryIndex).map(e => e.text);
        const followingLines = originalSubtitles.slice(originalEntryIndex + 1, Math.min(originalSubtitles.length, originalEntryIndex + 1 + uiContextWindowSize)).map(e => e.text);
        
        try {
            setCurrentActionText(isRetry ? `Retrying line ${entry.id}...` : `Translating line ${entry.id}...`);
            const translation = await translateTextWithContext(entry.text, previousLines, followingLines, selectedSubject, selectedModel, uiContextWindowSize);
            currentTranslations[originalEntryIndex] = { ...currentTranslations[originalEntryIndex], id: entry.id, startTime: entry.startTime, endTime: entry.endTime, text: entry.text, translatedText: translation };
        } catch (e) {
            console.error(`Error translating entry ${entry.id}:`, e);
            currentTranslations[originalEntryIndex] = { ...currentTranslations[originalEntryIndex], id: entry.id, startTime: entry.startTime, endTime: entry.endTime, text: entry.text, translatedText: TRANSLATION_ERROR_MARKER };
            setError((prevError) => {
                const newError = `Error translating line ${entry.id}.`;
                return prevError ? `${prevError}\n${newError}` : newError;
            });
        }
        
        linesProcessedInThisRun++;
        setTranslatedSubtitles([...currentTranslations]); // Update UI progressively
        
        if (!isRetry) {
            setLastProcessedIndex(originalEntryIndex);
            if (originalSubtitles.length > 0) {
              setTranslationProgress(((originalEntryIndex + 1) / originalSubtitles.length) * 100);
            }
        } else {
            if (totalLinesToProcessForProgress > 0) {
              setTranslationProgress((linesProcessedInThisRun / totalLinesToProcessForProgress) * 100);
            }
        }
    }
    return currentTranslations;
  }


  const handleTranslate = useCallback(async () => {
    if (originalSubtitles.length === 0 || !apiKeyAvailable) {
      setError(apiKeyAvailable ? "No subtitles to translate." : "Cannot translate: API Key not configured.");
      setProcessingState(ProcessingState.ERROR);
      return;
    }

    setProcessingState(ProcessingState.TRANSLATING);
    setError(null); // Clear previous errors
    
    const startIndex = lastProcessedIndex > -1 ? lastProcessedIndex + 1 : 0;
    
    // Ensure `translatedSubtitles` is initialized correctly if it's a fresh start or new file.
    // If resuming, `translatedSubtitles` should already hold the progress.
    if (startIndex === 0 || translatedSubtitles.length !== originalSubtitles.length) {
        setTranslatedSubtitles(originalSubtitles.map(entry => ({ ...entry, translatedText: undefined })));
    }


    await performTranslation(originalSubtitles, startIndex, false);
    
    // Check if all lines are processed (either translated or marked with error)
    const allAttempted = translatedSubtitles.every(entry => entry.translatedText !== undefined);
    if (allAttempted || lastProcessedIndex === originalSubtitles.length -1 ) { // also consider if loop finished
        setProcessingState(ProcessingState.DONE);
        const finalErrorCount = translatedSubtitles.filter(s => s.translatedText === TRANSLATION_ERROR_MARKER).length;
        if (finalErrorCount > 0) {
            setError(prevError => {
                const summary = `${finalErrorCount} line(s) failed to translate. You can try 'Retry Failed Translations'.`;
                return prevError ? `${prevError}\n${summary}` : summary;
            });
        }
    } else {
        // This case implies interruption, state should remain TRANSLATING or an error state if a critical error occurred.
        // For now, if loop finishes, we assume done with attempt.
        setProcessingState(ProcessingState.DONE); 
    }

  }, [originalSubtitles, apiKeyAvailable, selectedSubject, selectedModel, uiContextWindowSize, lastProcessedIndex, translatedSubtitles]);


  const handleRetryFailedTranslations = useCallback(async () => {
    const failedEntriesIndices: number[] = [];
    const entriesForRetry = translatedSubtitles.reduce((acc, entry, index) => {
        if (entry.translatedText === TRANSLATION_ERROR_MARKER || entry.translatedText === undefined) {
            // Find the corresponding original subtitle entry for context, but pass the current state for retry
            const originalEntry = originalSubtitles.find(os => os.id === entry.id && os.startTime === entry.startTime);
            if (originalEntry) {
                 // We pass a representation of the entry that needs retry, which might be just an ID or enough data for performTranslation to find it.
                 // performTranslation's retry logic will use originalSubtitles for context.
                acc.push(originalEntry); 
                failedEntriesIndices.push(index);
            }
        }
        return acc;
    }, [] as SubtitleEntry[]);


    if (entriesForRetry.length === 0) {
        setError("No failed translations to retry.");
        return;
    }

    setProcessingState(ProcessingState.TRANSLATING);
    setError(null); // Clear previous errors, especially summary ones
    setTranslationProgress(0);

    // performTranslation will update translatedSubtitles internally
    await performTranslation(entriesForRetry, 0, true); 
    
    setProcessingState(ProcessingState.DONE);
    const finalErrorCount = translatedSubtitles.filter(s => s.translatedText === TRANSLATION_ERROR_MARKER).length;
    if (finalErrorCount > 0) {
        setError(prevError => {
            const summary = `${finalErrorCount} line(s) still failed to translate after retry.`;
            return prevError ? `${prevError}\n${summary}` : summary;
        });
    } else if (error && error.includes("failed to translate")) { // Clear old error if all retries succeeded
        setError(null);
    }

  }, [translatedSubtitles, apiKeyAvailable, selectedSubject, selectedModel, uiContextWindowSize, originalSubtitles, error]);


  const handleDownload = useCallback(() => {
    if (translatedSubtitles.length === 0 || processingState !== ProcessingState.DONE) return;
    
    let fileContent: string;
    let mimeType: string;
    let fileExtension: string;

    if (originalFileType === 'vtt') {
      fileContent = formatVtt(translatedSubtitles);
      mimeType = 'text/vtt;charset=utf-8;';
      fileExtension = '.vtt';
    } else { // Default to SRT if not VTT or if type is null (e.g. error during parse)
      fileContent = formatSrt(translatedSubtitles);
      mimeType = 'text/srt;charset=utf-8;';
      fileExtension = '.srt';
    }
    
    const blob = new Blob([fileContent], { type: mimeType });
    const link = document.createElement('a');
    
    let downloadFileName = `translated_subtitles${fileExtension}`;
    if (originalFileName) {
        const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.') > -1 ? originalFileName.lastIndexOf('.') : originalFileName.length);
        downloadFileName = `translated_${baseName}_${selectedSubject.toLowerCase().replace(/\s+/g, '-')}${fileExtension}`;
    }
    
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', downloadFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [translatedSubtitles, processingState, originalFileName, originalFileType, selectedSubject]);

  const isProcessing = processingState === ProcessingState.TRANSLATING || processingState === ProcessingState.PARSING;
  
  const getTranslateButtonText = () => {
    if (originalSubtitles.length === 0) return "Translate";
    if (lastProcessedIndex > -1 && lastProcessedIndex < originalSubtitles.length - 1) {
        // Check if there are genuinely untranslated lines or lines with errors *after* the last processed index
        const remainingLines = translatedSubtitles.slice(lastProcessedIndex + 1);
        const hasPendingWork = remainingLines.some(e => e.translatedText === undefined || e.translatedText === TRANSLATION_ERROR_MARKER);
        if (hasPendingWork) {
            return `Resume Translation (${originalSubtitles.length} lines)`;
        }
    }
    return `Translate ${originalSubtitles.length} ${originalSubtitles.length === 1 ? 'line' : 'lines'}`;
  }

  const canTranslate = originalSubtitles.length > 0 && !isProcessing && apiKeyAvailable && (processingState === ProcessingState.IDLE || processingState === ProcessingState.DONE || processingState === ProcessingState.ERROR);
  const canDownload = processingState === ProcessingState.DONE && translatedSubtitles.some(s => s.translatedText && s.translatedText !== TRANSLATION_ERROR_MARKER);
  
  const getRetryButtonInfo = () => {
    const failedCount = translatedSubtitles.filter(s => s.translatedText === TRANSLATION_ERROR_MARKER || (s.translatedText === undefined && originalSubtitles.find(os => os.id === s.id))).length;
    return {
      count: failedCount,
      canRetry: failedCount > 0 && !isProcessing && apiKeyAvailable && (processingState === ProcessingState.DONE || processingState === ProcessingState.ERROR || (processingState === ProcessingState.IDLE && lastProcessedIndex > -1))
    };
  };
  const retryInfo = getRetryButtonInfo();

  const downloadButtonText = originalFileType === 'vtt' ? 'Download Translated VTT' : 'Download Translated SRT';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 md:p-8 flex-grow w-full" aria-live="polite">
        {!apiKeyAvailable && processingState === ProcessingState.ERROR && error && error.includes("API Key is not configured") && (
           <div className="my-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md shadow-md" role="alert">
            <div className="flex">
              <div className="py-1">
                <svg className="fill-current h-6 w-6 text-red-500 dark:text-red-300 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg>
              </div>
              <div>
                <p className="font-bold">Configuration Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
          <section className="mb-8" aria-labelledby="upload-section-title">
            <h2 id="upload-section-title" className="text-2xl font-semibold mb-4 text-sky-700 dark:text-sky-300">1. Upload Subtitle File</h2>
            <FileUpload onFileSelect={handleFileSelect} disabled={isProcessing} />
            {processingState === ProcessingState.PARSING && (
              <div className="flex items-center justify-center mt-4 text-sky-600 dark:text-sky-300" role="status" aria-label="Parsing file">
                <LoadingSpinner size={6} />
                <span className="ml-2">Parsing file...</span>
              </div>
            )}
          </section>

          {apiKeyAvailable && (
            <section className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg" aria-labelledby="settings-section-title">
              <h2 id="settings-section-title" className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">2. Configure Translation Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle Subject</label>
                  <select
                    id="subject-select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as SubtitleSubject)}
                    disabled={isProcessing}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50"
                  >
                    {SUBTITLE_SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gemini Model</label>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isProcessing}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50"
                  >
                    {AVAILABLE_TEXT_MODELS.map(modelName => (
                       <option key={modelName} value={modelName}>{modelName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="context-window-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Context Window Size (lines)</label>
                  <input
                    type="number"
                    id="context-window-size"
                    value={uiContextWindowSize}
                    onChange={(e) => setUiContextWindowSize(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                    min="0"
                    max="10" 
                    disabled={isProcessing}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50"
                  />
                </div>
              </div>
            </section>
          )}

          {originalSubtitles.length > 0 && apiKeyAvailable && (
            <section className="mb-8" aria-labelledby="translate-section-title">
              <h2 id="translate-section-title" className="text-2xl font-semibold mb-4 text-indigo-700 dark:text-indigo-300">3. Translate to Persian</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <button
                    onClick={handleTranslate}
                    disabled={!canTranslate}
                    className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-7.5A8.959 8.959 0 0 0 3 12c0 .778.099 1.533.284 2.253m0 0A11.978 11.978 0 0 0 12 16.5c2.998 0-5.74-1.1-7.843-2.918M12 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                    </svg>
                    {getTranslateButtonText()}
                </button>
                {retryInfo.canRetry && (
                    <button
                        onClick={handleRetryFailedTranslations}
                        disabled={!retryInfo.canRetry}
                        className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.664 0l3.181-3.183m-4.991-2.696V7.721c0-.245-.25-.425-.5-.425H8.847l1.091-1.09Z" />
                        </svg>
                        Retry Failed Translations ({retryInfo.count})
                    </button>
                )}
              </div>
              {processingState === ProcessingState.TRANSLATING && (
                <ProgressBar 
                    progress={translationProgress} 
                    text={currentActionText || `Processing... (Model: ${selectedModel}, Subject: ${selectedSubject})`}
                />
              )}
            </section>
          )}

          {error && (!apiKeyAvailable || !error.includes("API Key is not configured")) && (
            <div className="my-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md shadow-md whitespace-pre-line" role="alert">
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 text-red-500 dark:text-red-300 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg>
                    </div>
                    <div>
                        <p className="font-bold">Notice</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            </div>
          )}
          
          <section aria-labelledby="review-section-title">
            <div className="flex justify-between items-center mb-4">
                 <h2 id="review-section-title" className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">4. Review & Download</h2>
                {canDownload && (
                     <button
                        onClick={handleDownload}
                        className="flex items-center px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors duration-200 disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {downloadButtonText}
                    </button>
                )}
            </div>
            <SubtitleDisplay 
                subtitles={translatedSubtitles.length > 0 ? translatedSubtitles : originalSubtitles.map(e => ({...e, translatedText: undefined}))} 
                originalFileName={originalFileName || undefined} 
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
