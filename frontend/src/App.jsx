import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Dashboard from './pages/Dashboard'
import JobDetails from './pages/JobDetails'
import JobHistory from './pages/JobHistory'
import JobVersion from './pages/JobVersion'
import JobCompare from './pages/JobCompare'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs/:jobId/details" element={<JobDetails />} />
          <Route path="/jobs/:jobId/history" element={<JobHistory />} />
          <Route path="/jobs/:jobId/version/:version" element={<JobVersion />} />
          <Route path="/jobs/:jobId/compare" element={<JobCompare />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App

