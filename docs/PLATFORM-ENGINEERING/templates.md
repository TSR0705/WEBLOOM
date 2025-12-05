# Job Templates

This document describes the job template system in Webloom, which provides pre-configured scraping configurations for common use cases, making it easier for users to get started with web monitoring.

## 🎯 Purpose

Job templates serve to:

- **Accelerate Setup**: Reduce time to first successful scrape
- **Standardize Configurations**: Ensure best practices for common scenarios
- **Improve Usability**: Simplify complex configuration for new users
- **Enable Sharing**: Allow community contribution of useful templates
- **Maintain Consistency**: Provide uniform configurations across deployments

## 📋 Template Structure

### Basic Template Format
```json
{
  "id": "ecommerce-product-tracker",
  "name": "E-commerce Product Tracker",
  "description": "Track prices and availability of products on e-commerce sites",
  "category": "e-commerce",
  "version": "1.0.0",
  "author": "Webloom Team",
  "tags": ["price-tracking", "inventory", "e-commerce"],
  "config": {
    "schedule": "every_15_min",
    "maxDepth": 1,
    "allowExternalLinks": false,
    "selectors": {
      "item": ".product-card, .product-item, [data-product-id]",
      "title": "h1.product-title, .product-name, [itemprop='name']",
      "price": ".price, .cost, [data-price], [itemprop='price']",
      "image": "img.product-image, .product-photo img, [itemprop='image']",
      "description": ".product-description, .description, [itemprop='description']",
      "rating": ".rating, .stars, [itemprop='ratingValue']"
    }
  },
  "examples": [
    {
      "name": "Amazon Product",
      "url": "https://amazon.com/dp/B08N5WRWNW"
    },
    {
      "name": "Etsy Product",
      "url": "https://etsy.com/listing/123456789"
    }
  ],
  "parameters": {
    "priceCurrency": {
      "type": "string",
      "default": "USD",
      "description": "Expected currency for price tracking"
    },
    "trackInventory": {
      "type": "boolean",
      "default": true,
      "description": "Monitor stock availability changes"
    }
  }
}
```

## 🏷 Template Categories

### E-commerce
Templates for tracking product prices, inventory, and details on online stores.

### News & Media
Templates for monitoring news articles, blog posts, and media content.

### Job Boards
Templates for tracking job listings and employment opportunities.

### Real Estate
Templates for monitoring property listings and market changes.

### Social Media
Templates for tracking social media posts, profiles, and trends.

### Financial
Templates for monitoring stock prices, cryptocurrency, and financial data.

### Research
Templates for academic papers, research publications, and citations.

## 📦 Built-in Templates

### E-commerce Product Tracker
```json
{
  "id": "ecommerce-product-tracker",
  "name": "E-commerce Product Tracker",
  "description": "Universal template for tracking product prices and availability",
  "category": "e-commerce",
  "config": {
    "schedule": "every_15_min",
    "maxDepth": 1,
    "selectors": {
      "item": "[data-product-id], .product-card, .product-item",
      "title": "h1[itemprop='name'], .product-title, .product-name",
      "price": "[itemprop='price'], .price, .cost, .amount",
      "image": "[itemprop='image'], .product-image img, .photo img",
      "description": "[itemprop='description'], .product-description, .description",
      "rating": "[itemprop='ratingValue'], .rating, .stars"
    }
  }
}
```

### News Article Monitor
```json
{
  "id": "news-article-monitor",
  "name": "News Article Monitor",
  "description": "Track new articles and content updates on news sites",
  "category": "news-media",
  "config": {
    "schedule": "hourly",
    "maxDepth": 2,
    "selectors": {
      "item": "article, .article, .post",
      "title": "h1, .headline, .title",
      "text": ".content, .article-body, .post-content",
      "image": "img, .featured-image img",
      "author": ".author, .byline, [rel='author']",
      "date": "time, .published, .date"
    }
  }
}
```

### Job Board Scraper
```json
{
  "id": "job-board-scraper",
  "name": "Job Board Scraper",
  "description": "Monitor new job postings on employment websites",
  "category": "job-boards",
  "config": {
    "schedule": "daily",
    "maxDepth": 2,
    "selectors": {
      "item": ".job-posting, .job-listing, [data-job-id]",
      "title": ".job-title, .position, h2",
      "company": ".company, .employer, .organization",
      "location": ".location, .city, .address",
      "salary": ".salary, .compensation, .pay",
      "description": ".job-description, .description, .details",
      "date": ".posted-date, .date, time"
    }
  }
}
```

### Real Estate Listing Tracker
```json
{
  "id": "real-estate-tracker",
  "name": "Real Estate Listing Tracker",
  "description": "Monitor property listings and price changes",
  "category": "real-estate",
  "config": {
    "schedule": "daily",
    "maxDepth": 2,
    "selectors": {
      "item": ".property-listing, .listing, [data-property-id]",
      "title": ".property-title, .address, h2",
      "price": ".price, .cost, .asking-price",
      "image": ".property-image img, .photo img",
      "description": ".property-description, .details, .features",
      "features": ".features, .amenities, .specs",
      "location": ".location, .neighborhood, .area"
    }
  }
}
```

## 🛠 Template Management

### Template Registry
```javascript
// Template registry system
class TemplateRegistry {
  constructor() {
    this.templates = new Map();
    this.categories = new Set();
  }

  register(template) {
    // Validate template structure
    this.validateTemplate(template);
    
    // Register template
    this.templates.set(template.id, template);
    
    // Add to category index
    if (template.category) {
      this.categories.add(template.category);
    }
    
    // Emit registration event
    this.emit('templateRegistered', template);
  }

  getTemplate(id) {
    return this.templates.get(id);
  }

  listTemplates(category = null) {
    if (category) {
      return Array.from(this.templates.values())
        .filter(template => template.category === category);
    }
    return Array.from(this.templates.values());
  }

  searchTemplates(query) {
    const terms = query.toLowerCase().split(/\s+/);
    
    return Array.from(this.templates.values())
      .filter(template => {
        const searchableText = [
          template.name,
          template.description,
          ...(template.tags || [])
        ].join(' ').toLowerCase();
        
        return terms.every(term => searchableText.includes(term));
      });
  }
}
```

### Template Application
```javascript
// Apply template to job configuration
function applyTemplate(jobConfig, templateId, parameters = {}) {
  const template = templateRegistry.getTemplate(templateId);
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Merge template configuration with job config
  const mergedConfig = {
    ...jobConfig,
    schedule: jobConfig.schedule || template.config.schedule,
    maxDepth: jobConfig.maxDepth || template.config.maxDepth,
    allowExternalLinks: jobConfig.allowExternalLinks !== undefined 
      ? jobConfig.allowExternalLinks 
      : template.config.allowExternalLinks,
    selectors: {
      ...template.config.selectors,
      ...jobConfig.selectors
    }
  };

  // Apply parameters
  Object.keys(parameters).forEach(param => {
    if (template.parameters && template.parameters[param]) {
      // Validate parameter
      mergedConfig[param] = parameters[param];
    }
  });

  return mergedConfig;
}
```

## 🌐 Community Templates

### Template Submission
```json
{
  "template": {
    "id": "user-submitted-template",
    "name": "Custom Site Monitor",
    "description": "Template contributed by community member",
    "category": "custom",
    "version": "1.0.0",
    "author": "Community Contributor",
    "license": "MIT",
    "repository": "https://github.com/user/webloom-template",
    "config": {
      "schedule": "hourly",
      "selectors": {
        "item": ".custom-item",
        "title": ".custom-title",
        "content": ".custom-content"
      }
    }
  },
  "metadata": {
    "submittedBy": "user@example.com",
    "submittedAt": "2024-01-01T10:00:00Z",
    "approved": true,
    "approvalDate": "2024-01-02T10:00:00Z",
    "downloads": 1250,
    "rating": 4.5
  }
}
```

### Template Validation
```javascript
// Validate community templates
function validateCommunityTemplate(template) {
  const requiredFields = [
    'id', 'name', 'description', 'category', 'config'
  ];

  for (const field of requiredFields) {
    if (!template[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate selectors
  if (template.config.selectors) {
    const selectorTypes = ['item', 'title'];
    for (const type of selectorTypes) {
      if (!template.config.selectors[type]) {
        console.warn(`Missing recommended selector: ${type}`);
      }
    }
  }

  // Validate schedule
  const validSchedules = [
    'manual', 'every_5_min', 'every_15_min', 
    'hourly', 'daily', 'weekly'
  ];
  
  if (template.config.schedule && 
      !validSchedules.includes(template.config.schedule)) {
    throw new Error(`Invalid schedule: ${template.config.schedule}`);
  }

  return true;
}
```

## 🎨 Template UI

### Template Selection Interface
```jsx
// React component for template selection
const TemplateSelector = ({ onSelect }) => {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Load categories
    api.get('/templates/categories')
      .then(response => setCategories(response.data));
    
    // Load templates
    loadTemplates();
  }, []);

  const loadTemplates = (category = 'all') => {
    const url = category === 'all' 
      ? '/templates' 
      : `/templates?category=${category}`;
      
    api.get(url)
      .then(response => setTemplates(response.data));
  };

  const handleSelect = (template) => {
    onSelect(template);
  };

  return (
    <div className="template-selector">
      <div className="category-filter">
        <select 
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            loadTemplates(e.target.value);
          }}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      <div className="template-grid">
        {templates.map(template => (
          <TemplateCard 
            key={template.id}
            template={template}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
};
```

### Template Preview
```jsx
// Template preview component
const TemplatePreview = ({ template }) => {
  return (
    <div className="template-preview">
      <div className="template-header">
        <h3>{template.name}</h3>
        <span className="category">{template.category}</span>
      </div>
      
      <p className="description">{template.description}</p>
      
      <div className="template-details">
        <div className="selectors">
          <h4>Selectors:</h4>
          <ul>
            {Object.entries(template.config.selectors).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        </div>
        
        {template.examples && (
          <div className="examples">
            <h4>Examples:</h4>
            <ul>
              {template.examples.map((example, index) => (
                <li key={index}>
                  <a href={example.url} target="_blank" rel="noopener noreferrer">
                    {example.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="template-actions">
        <button className="btn-primary" onClick={() => onSelect(template)}>
          Use This Template
        </button>
      </div>
    </div>
  );
};
```

## 🔧 Template Customization

### Parameter Configuration
```jsx
// Template parameter configuration
const TemplateParameters = ({ template, onConfigured }) => {
  const [parameters, setParameters] = useState({});

  useEffect(() => {
    // Initialize with default values
    const defaults = {};
    if (template.parameters) {
      Object.keys(template.parameters).forEach(key => {
        defaults[key] = template.parameters[key].default;
      });
    }
    setParameters(defaults);
  }, [template]);

  const handleChange = (key, value) => {
    setParameters({
      ...parameters,
      [key]: value
    });
  };

  const handleSubmit = () => {
    onConfigured(parameters);
  };

  if (!template.parameters) {
    return (
      <div className="no-parameters">
        <p>This template has no configurable parameters.</p>
        <button onClick={handleSubmit}>Continue</button>
      </div>
    );
  }

  return (
    <div className="template-parameters">
      <h3>Configure Template</h3>
      
      {Object.entries(template.parameters).map(([key, param]) => (
        <div key={key} className="parameter-field">
          <label htmlFor={key}>{param.description}</label>
          
          {param.type === 'boolean' ? (
            <input
              type="checkbox"
              id={key}
              checked={parameters[key] || false}
              onChange={(e) => handleChange(key, e.target.checked)}
            />
          ) : param.type === 'string' ? (
            <input
              type="text"
              id={key}
              value={parameters[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          ) : param.type === 'number' ? (
            <input
              type="number"
              id={key}
              value={parameters[key] || 0}
              onChange={(e) => handleChange(key, Number(e.target.value))}
            />
          ) : null}
        </div>
      ))}
      
      <button onClick={handleSubmit}>Apply Template</button>
    </div>
  );
};
```

## 📈 Template Analytics

### Usage Tracking
```javascript
// Track template usage
class TemplateAnalytics {
  constructor() {
    this.db = getDatabaseConnection();
  }

  recordTemplateUsage(templateId, userId, jobId) {
    return this.db.collection('template_usage').insertOne({
      templateId,
      userId,
      jobId,
      timestamp: new Date(),
      userAgent: getUserAgent()
    });
  }

  getPopularTemplates(limit = 10) {
    return this.db.collection('template_usage')
      .aggregate([
        {
          $group: {
            _id: '$templateId',
            count: { $sum: 1 },
            lastUsed: { $max: '$timestamp' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ])
      .toArray();
  }

  getUserTemplateHistory(userId, limit = 20) {
    return this.db.collection('template_usage')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }
}
```

## 📝 Summary

The Webloom job template system provides:

- **Pre-built Configurations**: Ready-to-use templates for common scraping scenarios
- **Easy Customization**: Parameterized templates for flexible configuration
- **Community Contributions**: Platform for sharing and discovering templates
- **Quality Assurance**: Validation and approval process for community templates
- **Usage Analytics**: Insights into template popularity and effectiveness

Templates accelerate the web monitoring setup process while maintaining the flexibility and power of custom configurations. Users can start with proven templates and customize them to meet their specific needs.

END OF FILE