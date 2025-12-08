// js/csvParser.js
// Global variables to store parsed data
let symptomsData = [];
let diseasesData = [];
let diseaseSymptomMapping = {};

// Simple CSV parser (handles basic CSV without quoted commas)
function parseCSV(text) {
    if (!text) return [];
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            const key = headers[j];
            const raw = currentLine[j] ? currentLine[j].trim() : '';
            obj[key] = raw;
        }
        rows.push(obj);
    }

    return rows;
}

// Load symptoms from CSV
async function loadSymptoms() {
    try {
        const response = await fetch('../data/symptoms_large.csv');
        if (!response.ok) throw new Error(`HTTP ${response.status} while loading symptoms`);
        const text = await response.text();
        const parsed = parseCSV(text);
        symptomsData = parsed.map(item => ({
            symptom_id: parseInt(item.symptom_id, 10),
            symptom_name: item.symptom_name,
            category: item.category
        })).filter(s => !Number.isNaN(s.symptom_id) && s.symptom_name);
        console.log('Symptoms loaded:', symptomsData.length);
    } catch (error) {
        console.error('Error loading symptoms:', error);
    }
}

// Load diseases from CSV
async function loadDiseases() {
    try {
        const response = await fetch('../data/diseases_large.csv');
        if (!response.ok) throw new Error(`HTTP ${response.status} while loading diseases`);
        const text = await response.text();
        const parsed = parseCSV(text);
        diseasesData = parsed.map(item => ({
            disease_id: parseInt(item.disease_id, 10),
            disease_name: item.disease_name,
            category: item.category,
            severity: item.severity
        })).filter(d => !Number.isNaN(d.disease_id) && d.disease_name);
        console.log('Diseases loaded:', diseasesData.length);
    } catch (error) {
        console.error('Error loading diseases:', error);
    }
}

// Load disease-symptom mapping from CSV
async function loadMapping() {
    try {
        const response = await fetch('../data/symptom_disease_mapping_large.csv');
        if (!response.ok) throw new Error(`HTTP ${response.status} while loading mapping`);
        const text = await response.text();
        const mappingData = parseCSV(text);

        diseaseSymptomMapping = {}; // reset

        mappingData.forEach(item => {
            const diseaseId = parseInt(item.disease_id, 10);
            const symptomId = parseInt(item.symptom_id, 10);
            const weight = parseFloat(item.weight);

            if (Number.isNaN(diseaseId) || Number.isNaN(symptomId) || Number.isNaN(weight)) {
                return; // skip malformed lines
            }

            if (!diseaseSymptomMapping[diseaseId]) {
                diseaseSymptomMapping[diseaseId] = {};
            }
            diseaseSymptomMapping[diseaseId][symptomId] = weight;
        });

        console.log('Mapping loaded for', Object.keys(diseaseSymptomMapping).length, 'diseases');
    } catch (error) {
        console.error('Error loading mapping:', error);
    }
}

// Initialize all data
async function initializeData() {
    console.log('Loading CSV files...');
    await loadSymptoms();
    await loadDiseases();
    await loadMapping();
    console.log('All data loaded successfully');

    if (typeof init === 'function') {
        init();
    } else {
        console.warn('init() is not defined yet');
    }
}

// Start loading data when page loads
window.addEventListener('load', initializeData);