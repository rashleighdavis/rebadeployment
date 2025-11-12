// Initialize speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
}

// Helper function to format address from various API response formats
function formatAddress(data) {
    // Handle different address formats from the API
    if (typeof data.address === 'string') {
        return data.address;
    } else if (typeof data.address === 'object' && data.address) {
        // Handle nested address object
        const addr = data.address;
        const parts = [
            addr.streetAddress || addr.street || '',
            addr.city || '',
            addr.state || '',
            addr.zipcode || addr.zip || ''
        ].filter(Boolean);
        return parts.join(', ') || 'Address not available';
    } else if (data.streetAddress || data.street) {
        // Handle flat structure
        const parts = [
            data.streetAddress || data.street || '',
            data.city || '',
            data.state || '',
            data.zipcode || data.zip || ''
        ].filter(Boolean);
        return parts.join(', ') || 'Address not available';
    }
    return 'Address not available';
}

// Helper function to safely get nested values
function safeGet(obj, path, defaultValue = 'N/A') {
    try {
        const result = path.split('.').reduce((current, prop) => {
            return current?.[prop];
        }, obj);
        return result !== undefined && result !== null ? result : defaultValue;
    } catch {
        return defaultValue;
    }
}

// Helper function to format currency
function formatCurrency(amount) {
    if (!amount || amount === 'N/A') return 'N/A';
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

// Helper function to format numbers
function formatNumber(num) {
    if (!num || num === 'N/A') return 'N/A';
    const number = typeof num === 'string' ? parseFloat(num.replace(/[^0-9.-]+/g, '')) : num;
    if (isNaN(number)) return 'N/A';
    return number.toLocaleString();
}

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const results = document.getElementById('results');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');

// Parse natural language queries
function parseQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Check if it's a neighborhood search
    if (lowerQuery.includes('homes for sale') || lowerQuery.includes('houses for sale') || 
        lowerQuery.includes('properties in') || lowerQuery.includes('real estate in')) {
        const locationMatch = query.match(/(?:in|near)\s+([^,]+(?:,\s*[^,]+)?)/i);
        if (locationMatch) {
            return {
                type: 'neighborhood',
                location: locationMatch[1].trim()
            };
        }
    }
    
    // Check if it's a property search
    const addressPatterns = [
        /(\d+)\s+([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?/i,
        /show\s+me\s+(.+)/i,
        /property\s+(?:information|info|details)\s+(?:for|about|on)\s+(.+)/i,
        /what\s+(?:is|are)\s+(?:the\s+)?(?:details|information)\s+(?:for|about|on)\s+(.+)/i
    ];
    
    for (const pattern of addressPatterns) {
        const match = query.match(pattern);
        if (match) {
            const address = match[1] || match[0];
            return {
                type: 'property',
                address: address.replace(/^(show me |property information for |what is the information on )/i, '').trim()
            };
        }
    }
    
    // Default to property search with the full query as address
    return {
        type: 'property',
        address: query.trim()
    };
}

// Search for properties
async function searchProperties(query) {
    showLoading();
    hideError();
    clearResults();
    
    const parsedQuery = parseQuery(query);
    console.log('Parsed query:', parsedQuery);
    
    try {
        // Use the deployed backend URL
        const backendUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001'
            : 'https://rebaapp.com';
            
        let endpoint = '';
        let params = '';
        
        if (parsedQuery.type === 'neighborhood') {
            endpoint = '/api/properties/list';
            params = `?location=${encodeURIComponent(parsedQuery.location)}&limit=10`;
        } else {
            endpoint = '/api/property';
            params = `?address=${encodeURIComponent(parsedQuery.address)}`;
        }
        
        console.log(`Fetching from: ${backendUrl}${endpoint}${params}`);
        
        const response = await fetch(`${backendUrl}${endpoint}${params}`);
        const data = await response.json();
        
        console.log('API Response:', data);
        
        hideLoading();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch property data');
        }
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Display results based on query type
        if (parsedQuery.type === 'neighborhood') {
            displayNeighborhoodResults(data.properties || data);
        } else {
            displayPropertyResults(data);
        }
        
    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        
        // Show error with fallback to demo data
        showError(`Unable to fetch live data: ${error.message}. Showing demo data instead.`);
        displayDemoData(parsedQuery);
    }
}

// Display property results with proper data handling
function displayPropertyResults(data) {
    if (!data) {
        showError('No property data available');
        return;
    }
    
    // Create property card with safe data access
    const propertyHTML = `
        <div class="property-card">
            <div class="property-header">
                <h2 class="property-address">${formatAddress(data)}</h2>
                <div class="property-price">${formatCurrency(
                    safeGet(data, 'price') || 
                    safeGet(data, 'listPrice') || 
                    safeGet(data, 'estimatedValue') ||
                    safeGet(data, 'zestimate')
                )}</div>
            </div>
            
            <div class="property-details">
                <div class="detail-item">
                    <div class="detail-label">Bedrooms</div>
                    <div class="detail-value">${
                        safeGet(data, 'bedrooms') || 
                        safeGet(data, 'beds') || 
                        safeGet(data, 'bedroomCount') || 
                        'N/A'
                    }</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Bathrooms</div>
                    <div class="detail-value">${
                        safeGet(data, 'bathrooms') || 
                        safeGet(data, 'baths') || 
                        safeGet(data, 'bathroomCount') || 
                        'N/A'
                    }</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Square Feet</div>
                    <div class="detail-value">${formatNumber(
                        safeGet(data, 'livingArea') || 
                        safeGet(data, 'sqft') || 
                        safeGet(data, 'squareFeet') ||
                        safeGet(data, 'finishedSqFt')
                    )}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Year Built</div>
                    <div class="detail-value">${
                        safeGet(data, 'yearBuilt') || 
                        safeGet(data, 'year_built') || 
                        'N/A'
                    }</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Property Type</div>
                    <div class="detail-value">${
                        safeGet(data, 'propertyType') || 
                        safeGet(data, 'homeType') || 
                        safeGet(data, 'property_type') ||
                        'N/A'
                    }</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Tax Assessment</div>
                    <div class="detail-value">${formatCurrency(
                        safeGet(data, 'taxAssessment') || 
                        safeGet(data, 'taxAssessedValue') || 
                        safeGet(data, 'tax_assessment')
                    )}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Annual Taxes</div>
                    <div class="detail-value">${formatCurrency(
                        safeGet(data, 'propertyTax') || 
                        safeGet(data, 'annualTax') || 
                        safeGet(data, 'property_tax') ||
                        safeGet(data, 'taxAnnualAmount')
                    )}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Lot Size</div>
                    <div class="detail-value">${
                        safeGet(data, 'lotSize') || 
                        safeGet(data, 'lot_size') || 
                        safeGet(data, 'lotAreaValue') ?
                        formatNumber(safeGet(data, 'lotSize') || safeGet(data, 'lot_size') || safeGet(data, 'lotAreaValue')) + ' sq ft' :
                        'N/A'
                    }</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">${
                        safeGet(data, 'status') || 
                        safeGet(data, 'listingStatus') || 
                        safeGet(data, 'homeStatus') ||
                        'N/A'
                    }</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">MLS #</div>
                    <div class="detail-value">${
                        safeGet(data, 'mlsNumber') || 
                        safeGet(data, 'mls') || 
                        safeGet(data, 'listing_id') ||
                        'N/A'
                    }</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Days on Market</div>
                    <div class="detail-value">${
                        safeGet(data, 'daysOnMarket') || 
                        safeGet(data, 'days_on_market') || 
                        safeGet(data, 'timeOnZillow') ||
                        'N/A'
                    }</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">HOA Fees</div>
                    <div class="detail-value">${
                        safeGet(data, 'hoaFee') ? 
                        formatCurrency(safeGet(data, 'hoaFee')) + '/mo' : 
                        'N/A'
                    }</div>
                </div>
            </div>
            
            ${safeGet(data, 'description') ? `
                <div class="property-description">
                    <h3 style="margin-bottom: 1rem; color: #fff;">Description</h3>
                    ${safeGet(data, 'description')}
                </div>
            ` : ''}
        </div>
    `;
    
    results.innerHTML = propertyHTML;
}

// Display neighborhood results
function displayNeighborhoodResults(properties) {
    if (!properties || !Array.isArray(properties) || properties.length === 0) {
        showError('No properties found in this area');
        return;
    }
    
    const propertiesHTML = properties.map(property => `
        <div class="property-card">
            <div class="property-header">
                <h2 class="property-address">${formatAddress(property)}</h2>
                <div class="property-price">${formatCurrency(
                    property.price || property.listPrice || property.estimatedValue
                )}</div>
            </div>
            
            <div class="property-details">
                <div class="detail-item">
                    <div class="detail-label">Bedrooms</div>
                    <div class="detail-value">${property.bedrooms || property.beds || 'N/A'}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Bathrooms</div>
                    <div class="detail-value">${property.bathrooms || property.baths || 'N/A'}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Square Feet</div>
                    <div class="detail-value">${formatNumber(property.livingArea || property.sqft)}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">${property.status || property.listingStatus || 'Active'}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    results.innerHTML = propertiesHTML;
}

// Display demo data when API fails
function displayDemoData(parsedQuery) {
    const demoProperties = [
        {
            address: '123 Main Street, Miami, FL 33101',
            price: 450000,
            bedrooms: 3,
            bathrooms: 2,
            livingArea: 1850,
            yearBuilt: 2018,
            propertyType: 'Single Family',
            taxAssessment: 425000,
            propertyTax: 5200,
            status: 'For Sale',
            description: 'Beautiful modern home with updated kitchen and spacious backyard.'
        },
        {
            address: '456 Ocean Drive, Miami Beach, FL 33139',
            price: 1250000,
            bedrooms: 4,
            bathrooms: 3,
            livingArea: 2400,
            yearBuilt: 2020,
            propertyType: 'Condo',
            taxAssessment: 1150000,
            propertyTax: 14500,
            status: 'For Sale',
            description: 'Luxury oceanfront condo with stunning views and premium amenities.'
        }
    ];
    
    if (parsedQuery.type === 'neighborhood') {
        displayNeighborhoodResults(demoProperties);
    } else {
        displayPropertyResults(demoProperties[0]);
    }
}

// UI Helper functions
function showLoading() {
    loadingIndicator.style.display = 'block';
    results.innerHTML = '';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function clearResults() {
    results.innerHTML = '';
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchProperties(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchProperties(query);
        }
    }
});

// Voice recognition handlers
if (voiceBtn && recognition) {
    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('listening')) {
            recognition.stop();
            voiceBtn.classList.remove('listening');
            voiceStatus.textContent = '';
        } else {
            recognition.start();
            voiceBtn.classList.add('listening');
            voiceStatus.textContent = 'Listening... Speak now';
        }
    });
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        voiceStatus.textContent = `You said: "${transcript}"`;
        searchProperties(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceStatus.textContent = 'Error: ' + event.error;
        voiceBtn.classList.remove('listening');
    };
    
    recognition.onend = () => {
        voiceBtn.classList.remove('listening');
        setTimeout(() => {
            voiceStatus.textContent = '';
        }, 3000);
    };
} else {
    // Hide voice button if not supported
    if (voiceBtn) {
        voiceBtn.style.display = 'none';
    }
}

// Initialize with a welcome message
window.addEventListener('DOMContentLoaded', () => {
    results.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #888;">
            <h2 style="color: #fff; margin-bottom: 1rem;">Welcome to REBA</h2>
            <p>Your AI-powered real estate assistant</p>
            <p style="margin-top: 1rem;">Try searching for:</p>
            <ul style="list-style: none; margin-top: 1rem;">
                <li>• "123 Main Street, Miami"</li>
                <li>• "Homes for sale in Beverly Hills"</li>
                <li>• "Show me properties in Manhattan"</li>
            </ul>
        </div>
    `;
});