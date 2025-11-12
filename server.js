const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your domain
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'https://rebaapp.com',
        'https://www.rebaapp.com',
        'http://rebaapp.com',
        'http://www.rebaapp.com'
    ],
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'REBA API is running' });
});

// Property search endpoint
app.get('/api/property', async (req, res) => {
    const { address } = req.query;
    
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }
    
    console.log(`Searching for property: ${address}`);
    
    try {
        // First, try to get location autocomplete to find the property
        const autocompleteResponse = await axios.get(
            'https://realty-in-us.p.rapidapi.com/locations/v2/auto-complete',
            {
                params: {
                    input: address,
                    limit: '1'
                },
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
                }
            }
        );
        
        console.log('Autocomplete response:', JSON.stringify(autocompleteResponse.data, null, 2));
        
        // Extract property ID from autocomplete response
        if (autocompleteResponse.data?.autocomplete?.[0]) {
            const suggestion = autocompleteResponse.data.autocomplete[0];
            
            // Check if it's a property result
            if (suggestion.area_type === 'address' || suggestion._id) {
                const propertyId = suggestion._id || suggestion.mpr_id;
                
                if (propertyId) {
                    // Get detailed property information
                    const detailResponse = await axios.get(
                        'https://realty-in-us.p.rapidapi.com/properties/v2/detail',
                        {
                            params: {
                                property_id: propertyId
                            },
                            headers: {
                                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                                'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
                            }
                        }
                    );
                    
                    console.log('Property details response received');
                    
                    // Format the response
                    const property = detailResponse.data?.properties?.[0] || detailResponse.data;
                    
                    const formattedProperty = {
                        address: property.address || {
                            streetAddress: property.street || suggestion.line,
                            city: property.city || suggestion.city,
                            state: property.state_code || suggestion.state_code,
                            zipcode: property.postal_code || suggestion.postal_code
                        },
                        price: property.price || property.list_price || property.estimate?.estimate,
                        bedrooms: property.beds || property.beds_max || property.beds_min,
                        bathrooms: property.baths || property.baths_max || property.baths_min,
                        livingArea: property.sqft || property.sqft_max || property.sqft_min,
                        yearBuilt: property.year_built,
                        propertyType: property.prop_type || property.property_type,
                        taxAssessment: property.tax_assessed_value,
                        propertyTax: property.tax_amount || property.annual_tax,
                        status: property.prop_status || property.status,
                        mlsNumber: property.listing_id || property.mls?.id,
                        daysOnMarket: property.days_on_market,
                        description: property.description,
                        lotSize: property.lot_sqft,
                        hoaFee: property.hoa_fee
                    };
                    
                    return res.json(formattedProperty);
                }
            }
        }
        
        // If no property found, return demo data
        console.log('No property found, returning demo data');
        return res.json({
            address: address,
            price: 450000,
            bedrooms: 3,
            bathrooms: 2,
            livingArea: 1850,
            yearBuilt: 2018,
            propertyType: 'Single Family',
            taxAssessment: 425000,
            propertyTax: 5200,
            status: 'Demo Data',
            description: 'Demo property - API connection established but no matching property found.'
        });
        
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        
        // Return a more informative error response
        if (error.response?.status === 403) {
            return res.status(403).json({ 
                error: 'API key is invalid or expired. Please check your RapidAPI key.' 
            });
        }
        
        return res.status(500).json({ 
            error: 'Failed to fetch property data',
            details: error.message
        });
    }
});

// Neighborhood properties list endpoint
app.get('/api/properties/list', async (req, res) => {
    const { location, limit = 10 } = req.query;
    
    if (!location) {
        return res.status(400).json({ error: 'Location is required' });
    }
    
    console.log(`Searching for properties in: ${location}`);
    
    try {
        // Get location details first
        const autocompleteResponse = await axios.get(
            'https://realty-in-us.p.rapidapi.com/locations/v2/auto-complete',
            {
                params: {
                    input: location,
                    limit: '1'
                },
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
                }
            }
        );
        
        if (autocompleteResponse.data?.autocomplete?.[0]) {
            const locationData = autocompleteResponse.data.autocomplete[0];
            
            // Search for properties in the area
            const listResponse = await axios.get(
                'https://realty-in-us.p.rapidapi.com/properties/v2/list-for-sale',
                {
                    params: {
                        city: locationData.city,
                        state_code: locationData.state_code,
                        offset: '0',
                        limit: limit.toString(),
                        sort: 'newest'
                    },
                    headers: {
                        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
                    }
                }
            );
            
            console.log('Properties list response received');
            
            // Format the properties
            const properties = (listResponse.data?.properties || []).map(prop => ({
                address: {
                    streetAddress: prop.address?.line || prop.address,
                    city: prop.address?.city,
                    state: prop.address?.state_code,
                    zipcode: prop.address?.postal_code
                },
                price: prop.price || prop.list_price,
                bedrooms: prop.beds,
                bathrooms: prop.baths,
                livingArea: prop.sqft,
                yearBuilt: prop.year_built,
                propertyType: prop.prop_type,
                status: prop.prop_status,
                daysOnMarket: prop.days_on_market,
                thumbnail: prop.thumbnail
            }));
            
            return res.json({ properties });
        }
        
        // Return demo data if no results
        return res.json({
            properties: [
                {
                    address: `123 Main St, ${location}`,
                    price: 450000,
                    bedrooms: 3,
                    bathrooms: 2,
                    livingArea: 1850,
                    status: 'Demo Data'
                }
            ]
        });
        
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'Failed to fetch properties list',
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`REBA backend server running on port ${PORT}`);
    console.log(`API Key configured: ${process.env.RAPIDAPI_KEY ? 'Yes' : 'No'}`);
});