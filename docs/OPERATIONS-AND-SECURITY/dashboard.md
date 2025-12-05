# Dashboard Documentation

This document describes the Webloom dashboard, a Next.js-based web interface that provides users with a comprehensive view of their web monitoring jobs, system status, and scraped data.

## 🎯 Dashboard Overview

The Webloom dashboard serves as the primary user interface for:

- Creating and managing scraping jobs
- Monitoring job execution and system health
- Viewing scraped data and detected changes
- Configuring alerts and notifications
- Analyzing performance metrics and trends

Built with Next.js 14 (App Router), the dashboard offers a modern, responsive, and performant user experience optimized for both desktop and mobile devices.

## 🏗 Architecture

### Technology Stack
```markdown
Frontend Framework: Next.js 14 (App Router)
Styling: Tailwind CSS
State Management: React Context + React Query
Real-time Updates: Server-Sent Events (SSE)
Data Visualization: Recharts
Form Handling: React Hook Form
Internationalization: next-i18next
Testing: Jest, React Testing Library, Cypress
Deployment: Vercel
```

### Directory Structure
```bash
webloom-dashboard/
├── app/                    # App Router pages and layouts
│   ├── dashboard/         # Main dashboard pages
│   │   ├── jobs/         # Job management
│   │   ├── monitoring/    # System monitoring
│   │   ├── analytics/     # Data analytics
│   │   ├── settings/      # User settings
│   │   └── page.tsx      # Dashboard home
│   ├── api/              # API routes
│   │   └── stream/       # SSE endpoint
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # Reusable UI components
│   ├── jobs/             # Job-related components
│   ├── monitoring/        # Monitoring components
│   ├── analytics/        # Analytics components
│   ├── ui/               # Generic UI components
│   └── layout/           # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and services
│   ├── api/              # API client
│   ├── auth/             # Authentication helpers
│   └── utils/            # General utilities
├── public/                # Static assets
└── styles/                # Global styles
```

## 📋 Key Features

### 1. Job Management
```tsx
// Example job management interface
interface JobManagementProps {
  jobs: Job[];
  onCreateJob: (jobData: CreateJobData) => void;
  onUpdateJob: (jobId: string, updates: Partial<Job>) => void;
  onDeleteJob: (jobId: string) => void;
}

const JobManagement: React.FC<JobManagementProps> = ({
  jobs,
  onCreateJob,
  onUpdateJob,
  onDeleteJob
}) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Job List */}
      <div className="lg:col-span-1">
        <JobList 
          jobs={jobs}
          onSelectJob={setSelectedJob}
          onCreateNew={() => setIsCreating(true)}
        />
      </div>

      {/* Job Details */}
      <div className="lg:col-span-2">
        {isCreating ? (
          <JobCreator 
            onSubmit={onCreateJob}
            onCancel={() => setIsCreating(false)}
          />
        ) : selectedJob ? (
          <JobDetail 
            job={selectedJob}
            onUpdate={onUpdateJob}
            onDelete={onDeleteJob}
          />
        ) : (
          <EmptyState 
            title="Select a Job"
            description="Choose a job from the list to view details"
          />
        )}
      </div>
    </div>
  );
};
```

### 2. Real-time Monitoring
```tsx
// Live monitoring with Server-Sent Events
const useEventStream = (endpoint: string) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource(endpoint);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [data, ...prev.slice(0, 99)]); // Keep last 100 events
      setIsLoading(false);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setIsLoading(false);
    };

    return () => {
      eventSource.close();
    };
  }, [endpoint]);

  return { events, isLoading };
};

const LiveMonitor: React.FC = () => {
  const { events, isLoading } = useEventStream('/api/stream');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Live Events</h2>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto">
        {events.map((event, index) => (
          <EventItem key={index} event={event} />
        ))}
      </div>
    </div>
  );
};
```

### 3. Data Visualization
```tsx
// Analytics dashboard with charts
const AnalyticsDashboard: React.FC = () => {
  const { data: metrics } = useQuery(['metrics'], fetchMetrics);
  const { data: jobStats } = useQuery(['job-stats'], fetchJobStats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* KPI Cards */}
      <KPICard 
        title="Total Jobs"
        value={metrics?.totalJobs || 0}
        trend={metrics?.jobGrowth || 0}
      />
      
      <KPICard 
        title="Active Jobs"
        value={metrics?.activeJobs || 0}
        trend={metrics?.activeJobGrowth || 0}
      />
      
      <KPICard 
        title="Pages Processed"
        value={metrics?.pagesProcessed || 0}
        trend={metrics?.pageProcessingRate || 0}
      />
      
      <KPICard 
        title="Changes Detected"
        value={metrics?.changesDetected || 0}
        trend={metrics?.changeDetectionRate || 0}
      />

      {/* Charts */}
      <div className="md:col-span-2">
        <LineChart 
          data={jobStats?.processingTimeline || []}
          title="Job Processing Timeline"
        />
      </div>
      
      <div className="md:col-span-2">
        <BarChart 
          data={jobStats?.jobDistribution || []}
          title="Job Distribution by Type"
        />
      </div>
    </div>
  );
};
```

## 🎨 UI Components

### Component Library
```tsx
// Reusable Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50'
  };
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};
```

### Dark Mode Support
```tsx
// Theme provider with dark mode support
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 🔌 API Integration

### API Client
```typescript
// Centralized API client
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || response.statusText
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Network error');
    }
  }

  // Job endpoints
  async getJobs(params?: JobQueryParams) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<Job[]>('/jobs' + (queryParams ? `?${queryParams}` : ''));
  }

  async getJob(id: string) {
    return this.request<Job>(`/jobs/${id}`);
  }

  async createJob(data: CreateJobData) {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateJob(id: string, data: Partial<Job>) {
    return this.request<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteJob(id: string) {
    return this.request<void>(`/jobs/${id}`, {
      method: 'DELETE'
    });
  }
}

// Error handling
class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '');
```

### React Query Integration
```typescript
// Custom hooks for data fetching
export const useJobs = (params?: JobQueryParams) => {
  return useQuery<Job[], ApiError>({
    queryKey: ['jobs', params],
    queryFn: () => apiClient.getJobs(params),
    staleTime: 30000, // 30 seconds
    cacheTime: 300000 // 5 minutes
  });
};

export const useJob = (id: string) => {
  return useQuery<Job, ApiError>({
    queryKey: ['job', id],
    queryFn: () => apiClient.getJob(id),
    enabled: !!id,
    staleTime: 60000 // 1 minute
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Job, ApiError, CreateJobData>({
    mutationFn: (data) => apiClient.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
    }
  });
};
```

## 🚀 Performance Optimization

### Code Splitting
```tsx
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyChartComponent = dynamic(
  () => import('@/components/analytics/HeavyChart'),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-64" />
  }
);

const DashboardPage: React.FC = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChartComponent />
    </div>
  );
};
```

### Image Optimization
```tsx
// Optimized image component
import Image from 'next/image';

const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
}> = ({ src, alt, width, height }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={85}
      placeholder="blur"
      blurDataURL="/placeholders/blur.jpg"
      className="rounded-lg"
    />
  );
};
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx bundle-analyzer .next/stats.json

# Optimize large dependencies
# Use lightweight alternatives when possible
# Implement code splitting for large components
# Remove unused dependencies
```

## 🔒 Authentication & Authorization

### Auth Provider
```tsx
// Authentication context and provider
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth-token');
    if (token) {
      apiClient.setAuthToken(token);
      fetchCurrentUser()
        .then(setUser)
        .catch(() => localStorage.removeItem('auth-token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    localStorage.setItem('auth-token', response.token);
    apiClient.setAuthToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    apiClient.setAuthToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Protected Routes
```tsx
// Route protection with HOC
const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, loading, router]);

    if (loading) {
      return <LoadingSpinner fullScreen />;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuthComponent;
};

// Usage
const DashboardPage = withAuth(() => {
  return <Dashboard />;
});
```

## 🧪 Testing Strategy

### Unit Testing
```tsx
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { JobList } from '@/components/jobs/JobList';

describe('JobList', () => {
  const mockJobs = [
    { id: '1', name: 'Job 1', status: 'active' },
    { id: '2', name: 'Job 2', status: 'paused' }
  ];

  const mockHandlers = {
    onSelectJob: jest.fn(),
    onCreateNew: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders job list correctly', () => {
    render(<JobList jobs={mockJobs} {...mockHandlers} />);
    
    expect(screen.getByText('Job 1')).toBeInTheDocument();
    expect(screen.getByText('Job 2')).toBeInTheDocument();
    expect(screen.getByText('Create New Job')).toBeInTheDocument();
  });

  test('calls onSelectJob when job is clicked', () => {
    render(<JobList jobs={mockJobs} {...mockHandlers} />);
    
    fireEvent.click(screen.getByText('Job 1'));
    expect(mockHandlers.onSelectJob).toHaveBeenCalledWith(mockJobs[0]);
  });

  test('calls onCreateNew when create button is clicked', () => {
    render(<JobList jobs={mockJobs} {...mockHandlers} />);
    
    fireEvent.click(screen.getByText('Create New Job'));
    expect(mockHandlers.onCreateNew).toHaveBeenCalled();
  });
});
```

### Integration Testing
```typescript
// API integration tests
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient } from '@/lib/api/client';

const server = setupServer(
  rest.get('/api/jobs', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', name: 'Test Job', status: 'active' }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Client', () => {
  test('fetches jobs successfully', async () => {
    const jobs = await apiClient.getJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].name).toBe('Test Job');
  });
});
```

### E2E Testing
```typescript
// Cypress E2E tests
describe('Job Management Flow', () => {
  beforeEach(() => {
    cy.visit('/dashboard/jobs');
    cy.login('test@example.com', 'password123');
  });

  it('should create a new job', () => {
    cy.get('[data-testid="create-job-button"]').click();
    
    cy.get('[data-testid="job-name-input"]').type('E2E Test Job');
    cy.get('[data-testid="job-url-input"]').type('https://example.com');
    cy.get('[data-testid="job-schedule-select"]').select('hourly');
    
    cy.get('[data-testid="submit-job-button"]').click();
    
    cy.contains('Job created successfully').should('be.visible');
    cy.contains('E2E Test Job').should('be.visible');
  });

  it('should display job details', () => {
    cy.get('[data-testid="job-item"]').first().click();
    
    cy.get('[data-testid="job-detail-panel"]').should('be.visible');
    cy.contains('Job Details').should('be.visible');
  });
});
```

## 📱 Responsive Design

### Mobile-First Approach
```tsx
// Responsive layout with Tailwind
const ResponsiveLayout: React.FC = () => {
  return (
    <div className="container mx-auto px-4">
      {/* Mobile: Stacked layout */}
      <div className="md:hidden">
        <MobileNavigation />
        <MainContent />
        <MobileFooter />
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:grid md:grid-cols-12 gap-6">
        <aside className="md:col-span-3 lg:col-span-2">
          <DesktopNavigation />
        </aside>
        <main className="md:col-span-9 lg:col-span-10">
          <MainContent />
        </main>
      </div>
    </div>
  );
};
```

### Touch-Friendly Interactions
```tsx
// Touch-optimized components
const TouchButton: React.FC<ButtonProps> = (props) => {
  return (
    <button
      className="touch-manipulation tap-highlight-transparent"
      {...props}
    />
  );
};

// Larger touch targets for mobile
const MobileMenuItem: React.FC = ({ children }) => {
  return (
    <div className="py-4 px-6 text-lg">
      {children}
    </div>
  );
};
```

## 📝 Summary

The Webloom dashboard provides:

- **Modern User Interface**: Built with Next.js 14 and Tailwind CSS
- **Real-time Monitoring**: Server-Sent Events for live updates
- **Comprehensive Job Management**: Create, monitor, and control scraping jobs
- **Data Visualization**: Interactive charts and analytics
- **Performance Optimization**: Code splitting, image optimization, and efficient data fetching
- **Authentication & Authorization**: Secure access control
- **Responsive Design**: Works seamlessly across devices
- **Thorough Testing**: Unit, integration, and E2E test coverage

This dashboard enables users to effectively monitor and manage their web scraping operations while providing insights into system performance and data trends.

END OF FILE