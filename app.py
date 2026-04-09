import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pickle
import re

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = pickle.load(open(os.path.join(BASE_DIR, 'model.pkl'), 'rb'))
vectorizer = pickle.load(open(os.path.join(BASE_DIR, 'vectorizer.pkl'), 'rb'))

# Category keywords for fallback detection
CATEGORY_KEYWORDS = {
    'Projecteur': ['projecteur', 'vidéoprojecteur', 'beamer', 'projection', 'projeter', 'hdmi', 'vga', 'écran projection'],
    'Climatisation': ['climatisation', 'clim', 'chauffage', 'ventilateur', 'température', 'chaud', 'froid', 'air conditionné'],
    'Electricite': ['électricité', 'électrique', 'prise', 'courant', 'lumière', 'ampoule', 'disjoncteur', 'éclairage', 'néon'],
    'Internet': ['wifi', 'internet', 'réseau', 'connexion', 'débit', 'signal', 'borne', 'routeur'],
    'Mobilier': ['chaise', 'bureau', 'table', 'mobilier', 'pupitre', 'porte', 'fenêtre', 'tableau','caméra','camera']
}

def preprocess(text):
    text = text.lower()
    # Normalize common misspellings
    text = text.replace('probleme', 'problème')
    text = text.replace('problem', 'problème')
    text = text.replace('pb', 'problème')
    text = text.replace('souci', 'problème')
    text = text.replace('bug', 'problème')
    text = text.replace('marche pas', 'ne fonctionne pas')
    text = text.replace('march pas', 'ne fonctionne pas')
    text = text.replace('hs', 'hors service')
    text = re.sub(r'[^\w\s]', ' ', text)
    return text

def fallback_detection(text):
    import unicodedata
    def remove_accents(s):
        return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    
    text_lower = remove_accents(text.lower())
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if remove_accents(kw) in text_lower)
        if score > 0:
            scores[category] = score
    return max(scores, key=scores.get) if scores else 'Autre'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    texte = data.get('texte', '')
    
    if not texte or len(texte.strip()) < 3:

        return jsonify({'categorie': 'Autre', 'confidence': 0})
    
    # Preprocess
    texte_clean = preprocess(texte)
    
    # Get model prediction
    X = vectorizer.transform([texte_clean])
    categorie = model.predict(X)[0]
    
    # Get prediction probabilities
    proba = model.predict_proba(X)[0]
    confidence = max(proba)
    
    # If confidence is low (< 0.3) or category is 'Autre', use fallback keyword detection
    if confidence < 0.3 or categorie == 'Autre':
        fallback_cat = fallback_detection(texte)
        if fallback_cat != 'Autre':
            categorie = fallback_cat
    CATEGORY_MAP = {
    'Projecteur':    'PROJECTEUR',
    'Climatisation': 'MAINTENANCE_CLIM',
    'Electricite':   'ELECTRIQUE',
    'Internet':      'IT_RESEAU',
    'Mobilier':      'AUTRE',
    }

    categorie = CATEGORY_MAP.get(categorie, 'AUTRE')
    return jsonify({
        'categorie': categorie,
        'confidence': round(confidence, 3)
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)