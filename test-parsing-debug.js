// Test script to debug the parsing logic

const testData = `{"Titre": "Formation des utilisateurs",
    "Paragraphe": "Une formation approfondie pour les utilisateurs responsables de la gestion du courrier entrant et sortant est requise, ainsi que des supports pédagogiques en français.",
    "Spécifications détectées": "Oui",
    "Besoins exprimés": "Accompagner les utilisateurs dans la gestion du courrier entrant et sortant",
    "Conditions": "Utilisateurs responsables identifiés",
    "Règles": "N/A",
    "Contraintes": "N/A",
    "Modalités": "Formation approfondie avec supports pédagogiques en français",
    "Résumé": "Une formation approfondie avec supports pédagogiques en français est requise pour les utilisateurs responsables de la gestion du courrier entrant et sortant."
}

{
    "Titre": "Évaluation des coûts",
    "Paragraphe": "La solution logicielle doit être livrée clé en main, compatible avec l'équipement informatique existant, inclure éventuellement un équipement complémentaire pour le scan du courrier entrant, et fournir une évaluation des coûts associés.",
    "Spécifications détectées": "Oui",
    "Besoins exprimés": "Estimation des coûts associés à la solution logicielle",
    "Conditions": "Compatibilité avec l'équipement informatique existant",
    "Règles": "N/A",
    "Contraintes": "N/A",
    "Modalités": "Fournir une évaluation des coûts associés à la solution logicielle",
    "Résumé": "La solution logicielle doit inclure une évaluation des coûts, être compatible avec l'équipement existant et potentiellement fournir un équipement complémentaire pour le scan du courrier entrant."
}`;

console.log("=== Test Data ===");
console.log("Length:", testData.length);
console.log("Preview:", testData.substring(0, 200));

// Test the newline pattern
const newlinePattern = /}\s*\n+\s*{/g;
const matches = testData.match(newlinePattern);
console.log("Newline pattern matches:", matches ? matches.length : 0);
if (matches) {
  console.log("Matches:", matches);
}

// Test split
const parts = testData.split(newlinePattern);
console.log("Split into", parts.length, "parts");

parts.forEach((part, index) => {
  console.log(`Part ${index}:`, part.substring(0, 50), "...");

  let cleanPart = part.trim();

  // Add back the closing brace to all parts except the last one
  if (index < parts.length - 1 && !cleanPart.endsWith("}")) {
    cleanPart = cleanPart + "}";
  }

  // Add back the opening brace to all parts except the first one
  if (index > 0 && !cleanPart.startsWith("{")) {
    cleanPart = "{" + cleanPart;
  }

  console.log(`Fixed part ${index}:`, cleanPart.substring(0, 50), "...");

  try {
    const parsed = JSON.parse(cleanPart);
    console.log(`✅ Part ${index} parsed successfully`);
    console.log("Titre:", parsed.Titre);
  } catch (error) {
    console.log(`❌ Part ${index} failed to parse:`, error.message);
  }
});
