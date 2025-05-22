'use client';

import { useState, useEffect, useRef } from 'react';
import { useText } from '../Context';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { latex } from 'codemirror-lang-latex';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { history, historyKeymap, defaultKeymap, indentWithTab } from '@codemirror/commands';


export default function Home() {
    const {text, setText} = useText();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [UpdatePreview, setUpdatePreview] = useState<boolean>(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        // Cleanup function to revoke the object URL when the component unmounts or pdfUrl changes
        return () => {
            if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    useEffect(() => {
        setUpdatePreview(true);
    }, [text]);

    // Initialize CodeMirror
    useEffect(() => {
        if (editorRef.current && !viewRef.current) {
            const startState = EditorState.create({
                doc: text,
                extensions: [
                    EditorView.lineWrapping,
                    EditorView.theme({
                        '&': {
                            height: '100%'
                        },
                        '.cm-scroller': {
                            overflow: 'auto'
                        }
                    }),
                    syntaxHighlighting(defaultHighlightStyle),
                    latex(),
                    oneDark,
                    history(),
                    keymap.of([
                        ...defaultKeymap,
                        ...historyKeymap,
                        indentWithTab,
                        {
                            key: "Mod-Enter",
                            run: () => {
                                handleCompile();
                                return true;
                            }
                        },
                        {
                            key: "Shift-Enter",
                            run: ({ state, dispatch }) => {
                                dispatch(state.update(state.replaceSelection("\n"), { scrollIntoView: true }));
                                return true;
                            }
                        }
                    ]),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            setText(update.state.doc.toString());
                        }
                    })
                ]
            });

            viewRef.current = new EditorView({
                state: startState,
                parent: editorRef.current
            });
        }

        return () => {
            if (viewRef.current) {
                viewRef.current.destroy();
                viewRef.current = null;
            }
        };
    }, []);

    // Update editor content when text changes externally
    useEffect(() => {
        if (viewRef.current && text !== viewRef.current.state.doc.toString()) {
            viewRef.current.dispatch({
                changes: {
                    from: 0,
                    to: viewRef.current.state.doc.length,
                    insert: text
                }
            });
        }
    }, [text]);

    const handleCompile = async () => {
        setIsLoading(true);
        setUpdatePreview(false);
        setError(null);
        
        // Log the text that will be sent
        console.log("Text before compilation:", text);
        console.log("Text length:", text.length);
        
        // Revoke old PDF URL if it exists
        if (pdfUrl && activeTab === 'editor') {
            const oldUrl = pdfUrl;
            setPdfUrl(null);
            window.URL.revokeObjectURL(oldUrl);
        } else if (pdfUrl && activeTab === 'preview') {
            const oldUrl = pdfUrl;
            setPdfUrl(null); 
            window.URL.revokeObjectURL(oldUrl);
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        // Store the current text to ensure we use it consistently
        const textToCompile = text;
        
        const raw = JSON.stringify({
            "compiler": "pdflatex",
            "resources": [
                {
                    "main": true,
                    "content": textToCompile
                }
            ]
        });
        
        // Log the actual JSON being sent
        console.log("Request payload:", raw);

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        try {
            console.log("Sending compilation request...");
            const response = await fetch("http://localhost:2345/builds/sync", requestOptions);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = await response.text();
                }
                throw new Error(errorData?.message || response.statusText || `Request failed with status ${response.status}`);
            }

            const blob = await response.blob();
            const newUrl = window.URL.createObjectURL(blob);
            setPdfUrl(newUrl);
            setActiveTab('preview');
            
            // Log after successful compilation
            console.log("Compilation successful!");
            
            // Make sure editor content is preserved
            if (textToCompile !== text) {
                console.log("Text changed during compilation, restoring...");
                setText(textToCompile);
            }

        } catch (err: any) {
            console.error("Compilation error:", err);
            setError(err.message || 'An unexpected error occurred.');
            
            // Make sure editor content is preserved on error
            if (textToCompile !== text) {
                console.log("Text changed during compilation error, restoring...");
                setText(textToCompile);
            }
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="max-w-6xl mx-auto p-2">

            {/* Tab Switcher */}
            <div className="mb-1 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`${
                            activeTab === 'editor'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        disabled={!pdfUrl && activeTab !== 'preview' && !isLoading} // Disable if no PDF and not already on preview tab or loading
                        className={`${
                            activeTab === 'preview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } ${(!pdfUrl && activeTab !== 'preview' && !isLoading) ? 'cursor-not-allowed opacity-50' : ''}
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}
                    >
                        Preview
                    </button>
                      <button
                        onClick={handleCompile}
                        disabled={isLoading}
                        className={`compile-button px-4 py-2 rounded-lg text-white font-medium transition-colors ${UpdatePreview ? 'bg-green-500' : 'bg-blue-500'}`}
                    >
                        {isLoading ? 'Compiling...' : 'Compile'}
                    </button>
                </nav>
            </div>
            
            {/*
                Always render the editor, but hide it when not active.
            */}
            <div className="space-y-4">
                <div 
                    ref={editorRef} 
                    className={`w-full h-[600px] border rounded-lg overflow-hidden ${activeTab !== 'editor' ? 'hidden' : ''}`}
                />
                {activeTab === 'editor' && error && (
                    <div className="text-red-500 text-sm">
                        Compilation Error: {error}
                    </div>
                )}
            </div>

            {activeTab === 'preview' && (
                <div className="mt-0"> {/* No top margin needed due to tabs */}
                    {isLoading && !pdfUrl && ( // Show loading specifically for preview generation
                         <div className="text-center text-gray-500 py-10">Generating preview...</div>
                    )}
                    {!isLoading && pdfUrl && (
                        <>
                            {/* <h2 className="text-xl font-semibold mb-2">PDF Preview</h2> */}
                            <iframe
                                src={pdfUrl}
                                width="100%"
                                height="700px" // Increased height for better preview
                                title="PDF Preview"
                                className="border rounded-lg"
                            />
                        </>
                    )}
                    {!isLoading && !pdfUrl && (
                        <div className="text-center text-gray-500 py-10">
                            {error ? `Failed to generate preview: ${error}` : 'No PDF to preview. Compile your LaTeX code from the Editor tab.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}