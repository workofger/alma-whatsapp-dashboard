import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GroupList from './pages/GroupList';
import GroupChat from './pages/GroupChat';
import Summaries from './pages/Summaries';
import Ghosts from './pages/Ghosts';
import Export from './pages/Export';
import Search from './pages/Search';
import UserProfile from './pages/UserProfile';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/groups" element={<GroupList />} />
          <Route path="/groups/:id" element={<GroupChat />} />
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/summaries" element={<Summaries />} />
          <Route path="/ghosts" element={<Ghosts />} />
          <Route path="/export" element={<Export />} />
          <Route path="/search" element={<Search />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
