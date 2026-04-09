import pandas as pd
import string
import pickle
import os

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

dataset_path = os.path.join(BASE_DIR, "dataset.csv")
data = pd.read_csv(dataset_path)
data['category'] = data['category'].str.strip().str.strip('"')
data.to_csv(dataset_path, index=False)
# Nettoyage texte
data["text"] = data["text"].str.lower()
data["text"] = data["text"].str.replace(f"[{string.punctuation}]", "", regex=True)

# Vectorisation TF-IDF
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(data["text"])
y = data["category"]

# Division Train / Test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Modèle Naive Bayes
model = MultinomialNB()
model.fit(X_train, y_train)

# Prédictions
predictions = model.predict(X_test)

# Évaluation
accuracy = accuracy_score(y_test, predictions)
print("Accuracy :", accuracy)
print("\nClassification Report :")
print(classification_report(y_test, predictions))

# Sauvegarde in the same directory
model_path = os.path.join(BASE_DIR, "model.pkl")
vectorizer_path = os.path.join(BASE_DIR, "vectorizer.pkl")

pickle.dump(model, open(model_path, "wb"))
pickle.dump(vectorizer, open(vectorizer_path, "wb"))

print("Modèle sauvegardé avec succès.")
print(f"Model: {model_path}")
print(f"Vectorizer: {vectorizer_path}")