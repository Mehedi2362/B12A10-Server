const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch { return false; }
};

const sanitizeString = (str) => (!str || typeof str !== 'string') ? '' : str.trim().replace(/\s+/g, ' ');

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const getPaginationMetadata = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return { total, page: parseInt(page), limit: parseInt(limit), totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
};

const successResponse = (data, message = 'Success') => ({ success: true, message, data });

const errorResponse = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateModelData = (data) => {
    const errors = [];
    if (!data.name || data.name.trim().length < 2) errors.push('Model name must be at least 2 characters long');
    if (!data.framework || data.framework.trim().length < 2) errors.push('Framework must be specified');
    if (!data.useCase || data.useCase.trim().length < 2) errors.push('Use case must be specified');
    if (!data.dataset || data.dataset.trim().length < 2) errors.push('Dataset must be specified');
    if (!data.description || data.description.trim().length < 10) errors.push('Description must be at least 10 characters long');
    if (!data.image || !isValidUrl(data.image)) errors.push('Valid image URL is required');
    return { isValid: errors.length === 0, errors };
};

const generateSlug = (str) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

module.exports = { isValidEmail, isValidUrl, sanitizeString, formatDate, getPaginationMetadata, successResponse, errorResponse, validateModelData, generateSlug };
