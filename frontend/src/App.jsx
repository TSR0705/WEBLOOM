import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AppLayout from "./layout/AppLayout"
import Dashboard from "./pages/Dashboard"
import JobDetails from "./pages/JobDetails"
import JobHistory from "./pages/JobHistory"
import JobVersion from "./pages/JobVersion"
import JobCompare from "./pages/JobCompare"
import CreateJob from "./pages/CreateJob"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs/new" element={<CreateJob />} />
          <Route path="/jobs/:jobId/details" element={<JobDetails />} />
          <Route path="/jobs/:jobId/history" element={<JobHistory />} />
          <Route path="/jobs/:jobId/version/:version" element={<JobVersion />} />
          <Route path="/jobs/:jobId/compare" element={<JobCompare />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
