import React from 'react';
import { Route } from 'react-router-dom';
import QuizInput from '../../features/quiz/components/editor/QuizInput';
import QuizList from '../../features/quiz/components/list/QuizList';
import DraftPage from '../../features/draft/pages/DraftPage';
import OCRPage from '../../features/admin/pages/OCRPage';
import ProtectedRoute from '../../components/ProtectedRoute';
import RapidFirePage from '../../features/rapid-fire/RapidFirePage';
import { useAppInit } from '../useAppInit';

interface FeatureRoutesProps {
  appState: ReturnType<typeof useAppInit>;
  handleDraftSelected: (ids: string[]) => Promise<void>;
}

export const useFeatureRoutes = ({ appState, handleDraftSelected }: FeatureRoutesProps) => {
  const { settings, quiz, telegram, pendingQuestions, sentQuestions } = appState;

  return (
    <>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5">
                  <QuizInput 
                    inputText={quiz.inputText}
                    setInputText={quiz.setInputText}
                    questionCount={quiz.questionCount}
                    setQuestionCount={quiz.setQuestionCount}
                    isGenerating={quiz.isGenerating}
                    error={quiz.error || telegram.sendError}
                    handleGenerate={quiz.handleGenerate}
                    handleGenerateMore={quiz.handleGenerateMore}
                    handleGenerateFromImage={quiz.handleGenerateFromImage}
                    lastInputText={quiz.lastInputText}
                    addManualQuestion={quiz.addManualQuestion}
                    preserveBoardInfo={quiz.preserveBoardInfo}
                    setPreserveBoardInfo={quiz.setPreserveBoardInfo}
                  />
                </div>
                <div className="lg:col-span-7">
                  <QuizList 
                    questions={pendingQuestions}
                    setQuestions={quiz.setQuestions}
                    handleSendAll={() => telegram.handleSendAll(pendingQuestions)}
                    handleSendSelected={telegram.handleSendSelected}
                    onDraftSelected={handleDraftSelected}
                    handleSendToTelegram={telegram.handleSendToTelegram}
                    removeQuestion={quiz.removeQuestion}
                    removeQuestions={quiz.removeQuestions}
                    editingQuestionId={quiz.editingQuestionId}
                    setEditingQuestionId={quiz.setEditingQuestionId}
                    editingQuestion={quiz.editingQuestion}
                    setEditingQuestion={quiz.setEditingQuestion}
                    stats={quiz.stats}
                    settings={settings.settings}
                    onChannelChange={(id) => settings.saveSettings({ ...settings.settings, activeChannelId: id })}
                    canEditSuffix={settings.canEditSuffix}
                    globalDefaultSuffix={settings.globalDefaultSuffix}
                    sendError={telegram.sendError}
                    onClearError={() => telegram.setSendError(null)}
                    isBulkSending={telegram.isBulkSending}
                    isStopping={telegram.isStopping}
                    handleStopSend={telegram.handleStopSend}
                    bulkSendStatus={telegram.bulkSendStatus}
                    delaySeconds={telegram.delaySeconds}
                    setDelaySeconds={telegram.setDelaySeconds}
                  />
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/drafts" 
        element={
          <ProtectedRoute permission="drafts">
            <DraftPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/polls" 
        element={
          <ProtectedRoute permission="polls">
            <div className="max-w-4xl mx-auto">
              <QuizList 
                questions={sentQuestions}
                setQuestions={quiz.setQuestions}
                handleSendAll={() => telegram.handleSendAll(sentQuestions)}
                handleSendSelected={telegram.handleSendSelected}
                handleSendToTelegram={telegram.handleSendToTelegram}
                removeQuestion={quiz.removeQuestion}
                removeQuestions={quiz.removeQuestions}
                editingQuestionId={quiz.editingQuestionId}
                setEditingQuestionId={quiz.setEditingQuestionId}
                editingQuestion={quiz.editingQuestion}
                setEditingQuestion={quiz.setEditingQuestion}
                stats={quiz.stats}
                settings={settings.settings}
                onChannelChange={(id) => settings.saveSettings({ ...settings.settings, activeChannelId: id })}
                canEditSuffix={settings.canEditSuffix}
                globalDefaultSuffix={settings.globalDefaultSuffix}
                sendError={telegram.sendError}
                onClearError={() => telegram.setSendError(null)}
                isBulkSending={telegram.isBulkSending}
                isStopping={telegram.isStopping}
                handleStopSend={telegram.handleStopSend}
                bulkSendStatus={telegram.bulkSendStatus}
                delaySeconds={telegram.delaySeconds}
                setDelaySeconds={telegram.setDelaySeconds}
                title="Total Polls"
                sentLabel="Total Poll"
                sentValue={sentQuestions.length}
                showGeneratedStat={false}
                hideDelete={true}
              />
            </div>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ocr" 
        element={
          <ProtectedRoute permission="ocr">
            <OCRPage appState={appState} handleDraftSelected={handleDraftSelected} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rapid-fire" 
        element={
          <ProtectedRoute permission="rapid-fire">
            <RapidFirePage />
          </ProtectedRoute>
        } 
      />
    </>
  );
};
