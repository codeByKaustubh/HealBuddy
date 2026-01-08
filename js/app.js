// js/app.js - Main symptom checker application logic

let selectedSymptoms = [];
let allSymptoms = [];

const CRITICAL_SYMPTOMS = {
    8: 'Chest Pain', 10: 'Shortness of Breath', 17: 'Dizziness', 18: 'Blurred Vision',
    30: 'Confusion', 37: 'Bleeding', 83: 'Seizures', 89: 'Fainting'
};

function init() {
    allSymptoms = [...symptomsData];
    renderSymptoms(allSymptoms);
}

function renderSymptoms(symptoms) {
    const grid = document.getElementById('symptomsGrid');
    grid.innerHTML = symptoms.map(s => `
        <div class="symptom-item">
            <input type="checkbox" id="symptom${s.symptom_id}" data-id="${s.symptom_id}" 
                ${selectedSymptoms.includes(s.symptom_id) ? 'checked' : ''} 
                onchange="updateSelectedSymptoms()">
            <label for="symptom${s.symptom_id}">${s.symptom_name}</label>
        </div>
    `).join('');
    updateSelectedCount();
}

function updateSelectedSymptoms() {
    selectedSymptoms = Array.from(document.querySelectorAll('#symptomsGrid input:checked'))
        .map(cb => parseInt(cb.dataset.id));
    updateSelectedCount();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = selectedSymptoms.length;
}



document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('symptomSearch');
    if (search) {
        search.addEventListener('keyup', (e) => {
            const filtered = allSymptoms.filter(s => 
                s.symptom_name.toLowerCase().includes(e.target.value.toLowerCase())
            );
            renderSymptoms(filtered);
        });
    }
});

function calculateTriageLevel(scores, selectedSymptomIds) {
    const hasCritical = selectedSymptomIds.some(id => id in CRITICAL_SYMPTOMS);
    const maxSeverity = Object.values(scores).reduce((max, r) => {
        const severity = r.disease.severity;
        return (severity === 'Severe') ? 'Severe' : (severity === 'Moderate' && max !== 'Severe') ? 'Moderate' : max;
    }, 'Mild');

    if (hasCritical || maxSeverity === 'Severe') {
        return {
            level: 'URGENT', color: 'urgent', icon: '🚨',
            message: 'URGENT: Critical symptoms detected. Please seek immediate medical attention or call emergency services.'
        };
    } else if (maxSeverity === 'Moderate') {
        return {
            level: 'HIGH', color: 'high', icon: '⚠️',
            message: 'HIGH PRIORITY: Schedule a medical appointment soon to discuss these symptoms.'
        };
    } else {
        return {
            level: 'LOW', color: 'low', icon: 'ℹ️',
            message: 'LOW PRIORITY: Your symptoms appear mild. Monitor your condition and consult a doctor if symptoms persist.'
        };
    }
}

function analyzeSymptoms() {
    if (!selectedSymptoms.length) {
        alert('Please select at least one symptom');
        return;
    }

    const scores = {};
    diseasesData.forEach(disease => {
        const mapping = diseaseSymptomMapping[disease.disease_id] || {};
        let totalScore = 0, matchCount = 0, matchingSymptoms = [];

        selectedSymptoms.forEach(symptomId => {
            if (mapping[symptomId]) {
                totalScore += mapping[symptomId];
                matchCount++;
                matchingSymptoms.push(symptomId);
            }
        });

        if (matchCount > 0) {
            scores[disease.disease_id] = {
                disease, score: (totalScore / selectedSymptoms.length) * 100, matchCount, matchingSymptoms
            };
        }
    });



    displayResults(scores);
}

function displayResults(scores) {
    const container = document.getElementById('resultsContainer');
    const sorted = Object.values(scores).sort((a, b) => b.score - a.score).slice(0, 15);

    if (!sorted.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">😕</div><h3>No Matches</h3><p>Try selecting different symptoms.</p></div>';
        return;
    }

    const triage = calculateTriageLevel(scores, selectedSymptoms);
    let html = `
        <div class="triage-alert ${triage.color}">
            <div class="triage-header">
                <span class="triage-icon">${triage.icon}</span>
                <span class="triage-level">${triage.level} PRIORITY</span>
            </div>
            <div class="triage-message">${triage.message}</div>
        </div>
    `;

    sorted.forEach((result, idx) => {
        const matchedNames = result.matchingSymptoms
            .map(id => symptomsData.find(s => s.symptom_id === id)?.symptom_name)
            .join(', ');
        html += `
            <div class="disease-card ${triage.color}">
                <div class="disease-header">
                    <div class="disease-name">${idx + 1}. ${result.disease.disease_name}</div>
                    <div class="match-score">${result.score.toFixed(1)}%</div>
                </div>
                <div>
                    <span class="badge badge-category">${result.disease.category}</span>
                    <span class="badge badge-severity">${result.disease.severity}</span>
                </div>
                <div class="matching-symptoms">
                    <strong>${result.matchCount}/${selectedSymptoms.length}</strong> symptoms matched:<br>
                    ${matchedNames}
                </div>
            </div>
        `;
    });

    html += `
        <div class="disclaimer" style="margin-top:12px;">
            <strong>Note:</strong> This is not medical advice. For serious symptoms, consult a doctor.
        </div>
    `;

    container.innerHTML = html;
}