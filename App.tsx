import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { CameraCapture } from './components/CameraCapture';
import { generateFlashTryOn, generateSpecializedTryOn, generateVeoVideo, editImage } from './services/geminiService';
import { urlToBase64 } from './services/utils';
import { AppStep, ImageData, PRESET_MODELS, ClothingInputType } from './types';

export default function App() {
  // State
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.USER_PHOTO);
  const [userImage, setUserImage] = useState<ImageData | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageData | null>(null);
  const [clothingDescription, setClothingDescription] = useState<string>('');
  const [clothingInputType, setClothingInputType] = useState<ClothingInputType>(ClothingInputType.UPLOAD);
  const [clothingUrl, setClothingUrl] = useState<string>('');
  const [preserveFace, setPreserveFace] = useState<boolean>(true);
  
  // Generation State
  const [results, setResults] = useState<{
    flash?: string;
    specialized?: string;
    video?: string;
  }>({});
  
  const [loadingState, setLoadingState] = useState<{
    flash: boolean;
    specialized: boolean;
    video: boolean;
  }>({ flash: false, specialized: false, video: false });

  const [errors, setErrors] = useState<{
    flash?: string;
    specialized?: string;
    video?: string;
    general?: string;
  }>({});
  
  // Edit State
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Handlers
  const handleUserImageSelect = (data: ImageData) => {
    setUserImage(data);
    setCurrentStep(AppStep.CLOTHING_INPUT);
  };

  const handlePresetSelect = async (url: string) => {
    try {
      const data = await urlToBase64(url);
      handleUserImageSelect(data);
    } catch (err) {
      setErrors(prev => ({ ...prev, general: "Failed to load preset model. Please try uploading an image." }));
    }
  };

  const handleClothingImageSelect = (data: ImageData) => {
    setClothingImage(data);
  };

  const handleUrlFetch = async () => {
    if (!clothingUrl) return;
    try {
      const data = await urlToBase64(clothingUrl);
      setClothingImage(data);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: err.message || "Failed to fetch URL" }));
    }
  };

  const handleApiError = async (modelName: 'flash' | 'specialized' | 'video', error: any) => {
      console.error(`${modelName} error:`, error);
      let msg = `${modelName} generation failed.`;
      
      // Check for common auth errors
      if (error.message?.includes("403") || error.message?.includes("API key")) {
          msg = "Authentication failed. Please check your API_KEY environment variable.";
      }
      
      setErrors(prev => ({ ...prev, [modelName]: msg }));
      setLoadingState(prev => ({ ...prev, [modelName]: false }));
  };

  const handleGenerate = async () => {
    if (!userImage) return;
    
    // Validation
    if (clothingInputType === ClothingInputType.DESCRIPTION && !clothingDescription) {
      setErrors(prev => ({ ...prev, general: "Please provide a description for the outfit/event." }));
      return;
    }
    if (clothingInputType === ClothingInputType.UPLOAD && !clothingImage) {
      setErrors(prev => ({ ...prev, general: "Please upload a clothing image." }));
      return;
    }
    if (clothingInputType === ClothingInputType.URL && !clothingImage) {
      setErrors(prev => ({ ...prev, general: "Please fetch the image from URL first." }));
      return;
    }

    // Reset State
    setResults({});
    setErrors({});
    setLoadingState({ flash: true, specialized: true, video: true });
    setCurrentStep(AppStep.RESULT); 

    // Trigger Flash (Best Model)
    generateFlashTryOn(userImage, clothingImage, clothingDescription, preserveFace)
      .then(url => {
        setResults(prev => ({ ...prev, flash: url }));
        setLoadingState(prev => ({ ...prev, flash: false }));
      })
      .catch(err => handleApiError('flash', err));

    // Trigger Specialized (Preview Model)
    generateSpecializedTryOn(userImage, clothingImage, clothingDescription, preserveFace)
      .then(url => {
        setResults(prev => ({ ...prev, specialized: url }));
        setLoadingState(prev => ({ ...prev, specialized: false }));
      })
      .catch(err => handleApiError('specialized', err));

    // Trigger Veo (Video)
    generateVeoVideo(userImage, clothingImage, clothingDescription)
      .then(url => {
        setResults(prev => ({ ...prev, video: url }));
        setLoadingState(prev => ({ ...prev, video: false }));
      })
      .catch(err => handleApiError('video', err));
  };

  const handleEdit = async () => {
    if (!results.flash || !editPrompt) return;
    setIsEditing(true);
    try {
      const result = await editImage(results.flash, editPrompt);
      setResults(prev => ({ ...prev, flash: result }));
      setEditPrompt('');
    } catch (err: any) {
      handleApiError('flash', err);
    } finally {
      setIsEditing(false);
    }
  };

  const resetApp = () => {
    setCurrentStep(AppStep.USER_PHOTO);
    setUserImage(null);
    setClothingImage(null);
    setResults({});
    setClothingDescription('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 6.97a5.25 5.25 0 00-1.348-1.348.75.75 0 00-1.444.016 5.25 5.25 0 00-1.348 1.348.75.75 0 00.016 1.444 5.25 5.25 0 001.348 1.348.75.75 0 001.444-.016 5.25 5.25 0 001.348-1.348.75.75 0 00-.016-1.444z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              NanoStyle AI
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep !== AppStep.USER_PHOTO && (
              <button 
                onClick={resetApp}
                className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {/* Progress Indicators */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[AppStep.USER_PHOTO, AppStep.CLOTHING_INPUT, AppStep.RESULT].map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full transition-colors ${
                Object.values(AppStep).indexOf(currentStep) >= idx ? 'bg-indigo-500' : 'bg-slate-700'
              }`} />
            </div>
          ))}
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2 animate-bounce-in">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        {/* STEP 1: USER PHOTO */}
        {currentStep === AppStep.USER_PHOTO && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Who are we styling today?</h2>
              <p className="text-slate-400">Upload a photo of yourself or choose a model.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Upload Your Photo</h3>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="mb-4">
                        <CameraCapture onCapture={handleUserImageSelect} />
                    </div>
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">OR UPLOAD</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>
                    <FileUpload label="Drop your photo here" onFileSelect={handleUserImageSelect} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Choose a Model</h3>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_MODELS.map((model) => (
                    <button 
                      key={model.id}
                      onClick={() => handlePresetSelect(model.url)}
                      className="relative group aspect-[2/3] rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition-all"
                    >
                      <img src={model.url} alt={model.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                        <span className="text-xs font-medium text-white">{model.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CLOTHING INPUT */}
        {currentStep === AppStep.CLOTHING_INPUT && userImage && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-600 shrink-0">
                <img src={userImage.previewUrl} alt="User" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">What are you wearing?</h2>
                <p className="text-slate-400">Upload a garment or describe your event.</p>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2 flex gap-2 mb-6">
              {[
                { id: ClothingInputType.UPLOAD, label: 'Upload Image' },
                { id: ClothingInputType.URL, label: 'Image URL' },
                { id: ClothingInputType.DESCRIPTION, label: 'Describe Style' },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                      setClothingInputType(type.id);
                      setErrors({});
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    clothingInputType === type.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 min-h-[300px] flex flex-col justify-center">
              {clothingInputType === ClothingInputType.UPLOAD && (
                <div className="w-full max-w-md mx-auto space-y-4">
                  {clothingImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-600 group">
                       <img src={clothingImage.previewUrl} alt="Clothing" className="w-full max-h-64 object-contain bg-black/40" />
                       <button 
                         onClick={() => setClothingImage(null)}
                         className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                           <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                         </svg>
                       </button>
                    </div>
                  ) : (
                    <FileUpload label="Upload garment image" onFileSelect={handleClothingImageSelect} />
                  )}
                </div>
              )}

              {clothingInputType === ClothingInputType.URL && (
                <div className="w-full max-w-md mx-auto space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/dress.jpg"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                      value={clothingUrl}
                      onChange={(e) => setClothingUrl(e.target.value)}
                    />
                    <button 
                      onClick={handleUrlFetch}
                      className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium"
                    >
                      Fetch
                    </button>
                  </div>
                  {clothingImage && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-600 mt-4">
                      <img src={clothingImage.previewUrl} alt="Fetched" className="w-full max-h-64 object-contain bg-black/40" />
                    </div>
                  )}
                  <p className="text-xs text-slate-500 text-center">Note: Some websites block direct image access (CORS).</p>
                </div>
              )}

              {clothingInputType === ClothingInputType.DESCRIPTION && (
                <div className="w-full space-y-4">
                  <label className="block text-sm font-medium text-slate-300">
                    Describe the style, event, or outfit
                  </label>
                  <textarea
                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., A gala event, wearing a floor-length red velvet gown with gold accessories..."
                    value={clothingDescription}
                    onChange={(e) => setClothingDescription(e.target.value)}
                  />
                </div>
              )}
            </div>

             {/* Options */}
             <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Face Preservation</span>
                  <span className="text-xs text-slate-400">Identify and cover face to prevent changes (Images only)</span>
                </div>
                <button 
                  onClick={() => setPreserveFace(!preserveFace)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${preserveFace ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${preserveFace ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
               Generate All Variations
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                 <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.001c-3.698 2.88-8.196 5.262-13.249 5.262a.75.75 0 01-.75-.75C2.418 14.142 4.801 9.643 7.68 5.944a6.001 6.001 0 011.635 1.64zm1.634 1.634a4.5 4.5 0 00-1.496-1.496l-2.51 3.224a4.5 4.5 0 001.496 1.496l2.51-3.224zM20.55 2.87a.75.75 0 00-1.06 0l-3.72 3.72a.75.75 0 001.06 1.06l3.72-3.72a.75.75 0 000-1.06z" clipRule="evenodd" />
               </svg>
            </button>
          </div>
        )}

        {/* STEP 3 & 4: RESULTS GRID */}
        {currentStep === AppStep.RESULT && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Gemini 2.5 Flash */}
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                    <h3 className="font-bold text-indigo-400 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                      </svg>
                      Gemini 2.5 Flash
                    </h3>
                    <p className="text-xs text-slate-400">Best Image Generator</p>
                  </div>
                  <div className="relative flex-1 min-h-[400px] bg-black/50 flex items-center justify-center">
                    {loadingState.flash ? (
                       <div className="flex flex-col items-center gap-3">
                         <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-xs text-slate-400 animate-pulse">Generating...</span>
                       </div>
                    ) : errors.flash ? (
                       <div className="text-center px-4">
                           <p className="text-red-400 text-sm mb-2">{errors.flash}</p>
                       </div>
                    ) : results.flash ? (
                       <>
                         <img src={results.flash} alt="Gemini Flash Result" className="w-full h-full object-cover" />
                         {isEditing && (
                           <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                             <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           </div>
                         )}
                       </>
                    ) : null}
                  </div>
                </div>

                {/* Card 2: Virtual Try-On Preview */}
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                    <h3 className="font-bold text-purple-400 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                      Try-On Preview
                    </h3>
                    <p className="text-xs text-slate-400">virtual-try-on-preview-08-04</p>
                  </div>
                  <div className="relative flex-1 min-h-[400px] bg-black/50 flex items-center justify-center">
                    {loadingState.specialized ? (
                       <div className="flex flex-col items-center gap-3">
                         <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-xs text-slate-400 animate-pulse">Processing...</span>
                       </div>
                    ) : errors.specialized ? (
                       <div className="text-center px-4">
                           <p className="text-red-400 text-sm mb-2">{errors.specialized}</p>
                       </div>
                    ) : results.specialized ? (
                       <img src={results.specialized} alt="Specialized Result" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                </div>

                {/* Card 3: Veo 3 Motion */}
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                    <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
                      </svg>
                      Veo 3 Motion
                    </h3>
                    <p className="text-xs text-slate-400">Cinematic Video (Veo 3.1)</p>
                  </div>
                  <div className="relative flex-1 min-h-[400px] bg-black/50 flex items-center justify-center">
                    {loadingState.video ? (
                       <div className="flex flex-col items-center gap-3 text-center px-4">
                         <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-xs text-slate-400 animate-pulse">Rendering Video...<br/>This may take a moment.</span>
                       </div>
                    ) : errors.video ? (
                       <div className="text-center px-4">
                           <p className="text-red-400 text-sm mb-2">{errors.video}</p>
                       </div>
                    ) : results.video ? (
                       <video src={results.video} controls autoPlay loop className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                </div>
             </div>

            {/* Edit Bar - Linked to Flash Image */}
            {results.flash && (
              <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-xl p-2 flex gap-2 shadow-lg sticky bottom-8">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    className="w-full bg-slate-800 border-none text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Refine Flash image (e.g. 'Add a retro filter')"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                  />
                </div>
                <button 
                  onClick={handleEdit}
                  disabled={!editPrompt || isEditing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}