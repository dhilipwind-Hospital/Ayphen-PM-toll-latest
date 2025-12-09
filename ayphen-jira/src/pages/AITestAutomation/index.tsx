import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RequirementsPage } from './RequirementsPage';
import { StoriesPage } from './StoriesPage';
import { TestCasesPage } from './TestCasesPage';
import { TestSuitesPage } from './TestSuitesPage';
import { SyncDashboard } from './SyncDashboard';
import { TestExecutionPage } from './TestExecutionPage';
import { TestReportsPage } from './TestReportsPage';
import { AIInsightsPage } from './AIInsightsPage';

export const AITestAutomation: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RequirementsPage />} />
      <Route path="/requirements" element={<RequirementsPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/test-cases" element={<TestCasesPage />} />
      <Route path="/suites" element={<TestSuitesPage />} />
      <Route path="/sync" element={<SyncDashboard />} />
      <Route path="/execution" element={<TestExecutionPage />} />
      <Route path="/reports" element={<TestReportsPage />} />
      <Route path="/ai-insights" element={<AIInsightsPage />} />
    </Routes>
  );
};
